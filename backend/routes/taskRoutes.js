import express from 'express';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import mongoose from 'mongoose';
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    //console.log('req.user:', req.user);

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const tasks = await Task.find({
      $or: [{ assignedTo: userId }, { assignedBy: userId }],
    })
      .select(
        'title remarks dueDate priority status assignedTo assignedBy issueDate',
      )
      .populate('assignedTo', 'email name')
      .populate('assignedBy', 'email name')
      .populate('client', 'name');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    let { title, dueDate, assignedTo, client, priority, remarks, status } =
      req.body;

    // Default due date if not provided
    if (!dueDate) {
      dueDate = new Date();
    }

    // ✅ If "me" is selected, assign to logged-in user
    if (!assignedTo || assignedTo === 'me') {
      assignedTo = req.user.id;
    }

    const task = new Task({
      title,
      remarks,
      dueDate,
      priority: priority,
      assignedTo,
      assignedBy: req.user.id, // always the logged-in user
      client: client,
      status: 'Not Started',
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Update Task (status, remarks, client, etc.)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { remarks, status, totalHours, totalMinutes } = req.body;
    const updateData = { status };
    if (status === 'in-progress') {
      updateData.totalHours = 0;
      updateData.totalMinutes = 0;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { remarks, totalHours, totalMinutes },
      { new: true },
      {
        returnDocument: 'after',
      },
    )
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

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
      .populate('assignedBy', 'email name')
      .lean();

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

    //console.log('Saved task:', task);

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
