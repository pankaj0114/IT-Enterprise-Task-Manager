import express from 'express';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/verifyToken.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Get all tasks (for admin/debug)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'email name')
      .populate('assignedBy', 'email name');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get tasks for logged-in user (assigned to OR assigned by)
router.get('/my-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({
      $or: [{ assignedTo: userId }, { assignedBy: userId }],
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error);

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

router.get('/assigned-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('Fetching assigned tasks for:', userId);

    const tasks = await Task.find({
      assignedBy: userId,
      assignedTo: { $ne: userId },
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name')
      .sort({ createdAt: -1 });

    console.log('Assigned tasks:', tasks);

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

/*// ✅ Return logged-in user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
*/

// ✅ Assign Task
router.post('/assign', authMiddleware, async (req, res) => {
  try {
    const { title, dueDate, assignedTo, priority, client, quickAdd } = req.body;

    console.log('========== ASSIGN TASK ==========');
    console.log('User:', req.user.id);
    console.log('Request body:', req.body);

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required',
      });
    }

    if (quickAdd === true) {
      const task = new Task({
        title: title.trim(),

        // No due date
        dueDate: null,

        // No client
        client: null,

        // Current user
        assignedTo: req.user.id,

        // Current user created it
        assignedBy: req.user.id,

        priority: priority || 'Medium',

        status: 'Not Started',
      });

      await task.save();

      console.log('Quick task created:', task._id);

      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        task,
        notification: null,
      });
    }

    // ==============================
    // VALIDATION
    // ==============================

    if (!dueDate) {
      return res.status(400).json({
        message: 'Due date is required',
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        message: 'Please select an employee',
      });
    }

    if (!priority) {
      return res.status(400).json({
        message: 'Priority is required',
      });
    }

    // If client is required
    if (!client) {
      return res.status(400).json({
        message: 'Please select a client',
      });
    }

    // ==============================
    // LOGGED-IN USER
    // ==============================

    const loggedInUserId = req.user.id.toString();

    // ==============================
    // CHECK SELF ASSIGNMENT
    // ==============================

    const isSelfAssigned =
      assignedTo === 'me' || assignedTo.toString() === loggedInUserId;

    console.log('Self assigned:', isSelfAssigned);

    // If "Me" is selected
    const finalAssignedTo = isSelfAssigned ? req.user.id : assignedTo;

    console.log('Final assignedTo:', finalAssignedTo);

    // ==============================
    // CREATE TASK
    // ==============================

    const task = new Task({
      title: title.trim(),

      dueDate: new Date(dueDate),

      priority,

      client: client, // ✅ ADD CLIENT

      assignedTo: finalAssignedTo,

      assignedBy: req.user.id,

      status: 'Not Started',
    });

    await task.save();

    console.log('Task created:', task._id);

    // ==============================
    // NOTIFICATION
    // ONLY WHEN ASSIGNING TO ANOTHER
    // EMPLOYEE
    // ==============================

    let notification = null;

    if (!isSelfAssigned) {
      notification = new Notification({
        recipient: finalAssignedTo,

        sender: req.user.id,

        task: task._id,

        message: `You have been assigned a new task: ${task.title}`,
      });

      await notification.save();

      console.log('Notification created:', notification._id);

      // ==============================
      // SOCKET.IO
      // ==============================

      const io = req.app.get('io');

      if (io) {
        io.to(finalAssignedTo.toString()).emit('newNotification', notification);

        console.log('Notification sent to:', finalAssignedTo.toString());
      }
    } else {
      console.log('Self assignment → notification not created');
    }

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(201).json({
      success: true,

      message: isSelfAssigned
        ? 'Task created successfully'
        : 'Task assigned successfully',

      task,

      notification,
    });
  } catch (error) {
    console.error('========== ASSIGN TASK ERROR ==========');

    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Error assigning task',
      error: error.message,
    });
  }
});

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate('sender', 'name email')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// Update remarks for a task
router.put('/:id/remarks', authMiddleware, async (req, res) => {
  try {
    const { remarks } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          remarks: remarks,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    res.status(200).json({
      message: 'Remark saved successfully',
      task,
    });
  } catch (error) {
    console.error('Error updating remarks:', error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.get('/completed-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({
      assignedTo: userId,
      status: 'Completed',
    })
      .select(
        'title remarks dueDate priority totalHours totalMinutes client assignedTo assignedBy status',
      )
      .populate('assignedTo', 'name email')
      .populate('client', 'name')
      .sort({ updatedAt: -1 });
    //console.log('Completed tasks:', JSON.stringify(tasks, null, 2));

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching completed tasks:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

router.put('/:id/complete', verifyToken, async (req, res) => {
  try {
    //console.log('Request body:', req.body);

    const { totalHours, totalMinutes } = req.body;

    // Validate hours and minutes
    if (
      totalHours === undefined ||
      totalMinutes === undefined ||
      totalHours === null ||
      totalMinutes === null
    ) {
      return res.status(400).json({
        message: 'Total hours and total minutes are required',
      });
    }

    const hours = Number(totalHours);
    const minutes = Number(totalMinutes);

    if (isNaN(hours) || isNaN(minutes)) {
      return res.status(400).json({
        message: 'Hours and minutes must be numbers',
      });
    }

    if (hours < 0) {
      return res.status(400).json({
        message: 'Hours cannot be negative',
      });
    }

    if (minutes < 0 || minutes > 59) {
      return res.status(400).json({
        message: 'Minutes must be between 0 and 59',
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'Completed',
          totalHours: hours,
          totalMinutes: minutes,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    task.status = 'Completed';
    task.totalHours = hours;
    task.totalMinutes = minutes;

    await task.save();

    console.log('TASK COMPLETED:', task._id);
    console.log('Total time:', hours, 'hours', minutes, 'minutes');

    //console.log('Saved task:', task);

    // ==========================================
    // NOTIFY ONLY IF TASK WAS ASSIGNED
    // BY ANOTHER EMPLOYEE
    // ==========================================

    const loggedInUserId = String(req.user.id);
    const assignedById = String(task.assignedBy);

    let notification = null;

    if (assignedById !== loggedInUserId) {
      notification = new Notification({
        recipient: task.assignedBy,
        sender: req.user.id,
        task: task._id,

        message:
          `Task "${task.title}" has been completed. ` +
          `Time taken: ${hours} hours ${minutes} minutes.`,
      });

      await notification.save();

      console.log('COMPLETION NOTIFICATION CREATED:', notification._id);

      // ==========================================
      // SOCKET.IO NOTIFICATION
      // ==========================================

      const io = req.app.get('io');

      if (io) {
        io.to(assignedById).emit('newNotification', notification);

        console.log('Completion notification sent to:', assignedById);
      }
    } else {
      console.log('SELF ASSIGNED TASK → NO COMPLETION NOTIFICATION');
    }

    res.status(200).json({
      message: 'Task completed successfully',
      task,
    });
  } catch (err) {
    console.error('Complete task error:', err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// PUT /api/tasks/:id/uncomplete
router.put('/:id/uncomplete', verifyToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'In Progress',
          totalHours: 0,
          totalMinutes: 0,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }
    task.status = 'In Progress';

    // Optional:
    // Keep the recorded time or clear it.
    // I recommend keeping it unless your workflow requires resetting it.

    await task.save();

    const loggedInUserId = String(req.user.id);
    const assignedById = String(task.assignedBy);

    let notification = null;

    if (assignedById !== loggedInUserId) {
      notification = new Notification({
        recipient: task.assignedBy,
        sender: req.user.id,
        task: task._id,
        message:
          `Task "${task.title}" has been reopened ` +
          `and is no longer marked as completed.`,
      });

      await notification.save();

      const io = req.app.get('io');

      if (io) {
        io.to(assignedById).emit('newNotification', notification);
      }
    }

    //console.log('Uncompleted task:', task);

    res.status(200).json({
      message: 'Task moved back to in-progress',
      task,
    });
  } catch (err) {
    console.error('Error uncompleting task:', err);

    res.status(500).json({
      message: err.message,
    });
  }
});

router.put('/:id/completed-time', authMiddleware, async (req, res) => {
  try {
    const { totalHours, totalMinutes } = req.body;

    console.log('========== UPDATE COMPLETED TIME ==========');
    console.log('Task ID:', req.params.id);
    console.log('Hours:', totalHours);
    console.log('Minutes:', totalMinutes);

    // Validate hours
    if (totalHours === undefined || totalHours === null || totalHours === '') {
      return res.status(400).json({
        message: 'Total hours are required',
      });
    }

    // Validate minutes
    if (
      totalMinutes === undefined ||
      totalMinutes === null ||
      totalMinutes === ''
    ) {
      return res.status(400).json({
        message: 'Total minutes are required',
      });
    }

    const hours = Number(totalHours);
    const minutes = Number(totalMinutes);

    if (!Number.isInteger(hours) || hours < 0) {
      return res.status(400).json({
        message: 'Hours must be a valid non-negative number',
      });
    }

    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
      return res.status(400).json({
        message: 'Minutes must be between 0 and 59',
      });
    }

    // Find task
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Make sure task is completed
    if (task.status !== 'Completed') {
      return res.status(400).json({
        message: 'Only completed tasks can have their time edited',
      });
    }

    // Optional ownership check
    if (
      task.assignedTo &&
      task.assignedTo.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        message: 'You are not allowed to edit this task',
      });
    }

    // Update time
    task.totalHours = hours;
    task.totalMinutes = minutes;

    await task.save();
    const loggedInUserId = String(req.user.id);
    const assignedById = String(task.assignedBy);

    let notification = null;
    if (assignedById !== loggedInUserId) {
      notification = new Notification({
        recipient: task.assignedBy,
        sender: req.user.id,
        task: task._id,
        message:
          `The completion time for task "${task.title}" ` +
          `was updated to ${hours} hours ${minutes} minutes.`,
      });

      await notification.save();
      const io = req.app.get('io');

      if (io) {
        io.to(assignedById).emit('newNotification', notification);
      }
    }

    console.log('Updated task:', task);

    return res.status(200).json({
      success: true,
      message: 'Completed task time updated successfully',
      task,
    });
  } catch (error) {
    console.error('Error updating completed task time:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

router.get('/assigned-by-me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({
      assignedBy: userId,

      // Don't show self-assigned tasks here
      $expr: {
        $ne: ['$assignedTo', '$assignedBy'],
      },
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

router.get('/pending-assigned', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({
      assignedBy: userId,
      assignedTo: { $ne: userId },
      status: { $in: ['Not Started', 'Pending'] },
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching pending assigned tasks:', error);

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;

    console.log('Updating task ID:', taskId);
    console.log('Received data:', req.body);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required',
      });
    }

    const { title, remarks, priority, dueDate, status } = req.body;

    const updateData = {};

    // Only update fields that were actually sent
    if (title !== undefined) {
      updateData.title = title;
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name');

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    console.log('Task updated successfully:', updatedTask._id);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task:', error);

    return res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message,
    });
  }
});

router.get('/in-progress-assigned', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({
      assignedBy: userId,
      status: 'In Progress',
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name');

    // Remove self-assigned tasks
    const filteredTasks = tasks.filter(
      (task) => String(task.assignedTo?._id) !== String(userId),
    );

    return res.json(filteredTasks);
  } catch (error) {
    console.error('Error fetching in-progress assigned tasks:', error);

    return res.status(500).json({
      success: false,
      message: 'Error fetching in-progress assigned tasks',
      error: error.message,
    });
  }
});

router.get('/completed-assigned', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({
      assignedBy: userId,
      status: 'Completed',
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name')
      .select(
        'title remarks dueDate priority status assignedTo assignedBy totalHours totalMinutes createdAt updatedAt',
      );

    // Don't show tasks assigned to yourself
    const filteredTasks = tasks.filter(
      (task) => String(task.assignedTo?._id) !== String(userId),
    );

    res.json(filteredTasks);
  } catch (error) {
    console.error('Error fetching completed assigned tasks:', error);

    res.status(500).json({
      success: false,
      message: 'Error fetching completed assigned tasks',
      error: error.message,
    });
  }
});

export default router;
