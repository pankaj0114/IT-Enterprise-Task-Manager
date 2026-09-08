import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Client from '../models/Client.js';

// =====================================================
// GET ALL TASKS FOR ADMIN
// GET /api/admin/tasks
// =====================================================

export const getAllAdminTasks = async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET ALL ADMIN TASKS ERROR:', error);

    res.status(500).json({
      message: 'Failed to fetch admin tasks',
      error: error.message,
    });
  }
};

// =====================================================
// GET MY TASKS
// Tasks assigned TO the logged-in admin
//
// GET /api/admin/my-tasks
// =====================================================

export const getMyTasks = async (req, res) => {
  try {
    const adminId = req.user.id;

    const tasks = await Task.find({
      assignedBy: adminId,
      assignedTo: adminId,
    })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company')
      .sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('GET MY TASKS ERROR:', error);

    return res.status(500).json({
      message: 'Failed to fetch my tasks',
      error: error.message,
    });
  }
};
// =====================================================
// GET TASKS ASSIGNED BY ME
// Tasks where logged-in admin is assignedBy
//
// GET /api/admin/assigned-tasks
// =====================================================

export const getAssignedTasks = async (req, res) => {
  try {
    const adminId = req.user._id;

    const tasks = await Task.find({
      assignedBy: adminId,
    })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company')
      .sort({
        dueDate: 1,
        createdAt: -1,
      });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET ASSIGNED TASKS ERROR:', error);

    res.status(500).json({
      message: 'Failed to fetch assigned tasks',
      error: error.message,
    });
  }
};

// ==========================================
// CREATE MY TASK
// ==========================================
export const createMyTask = async (req, res) => {
  try {
    const adminId = req.user.id;

    const { title, dueDate, client } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        message: 'Due date is required',
      });
    }

    if (!client) {
      return res.status(400).json({
        message: 'Client is required',
      });
    }

    // Check client
    const clientExists = await Client.findById(client);

    if (!clientExists) {
      return res.status(404).json({
        message: 'Client not found',
      });
    }

    // Create task
    const task = await Task.create({
      title: title.trim(),
      dueDate: new Date(dueDate),
      client: client,

      // Important
      // The logged-in admin creates the task
      // and assigns it to himself/herself.
      assignedBy: adminId,
      assignedTo: adminId,

      status: 'Not Started',
      priority: 'Medium',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company');

    return res.status(201).json({
      message: 'My task created successfully',
      task: populatedTask,
    });
  } catch (error) {
    console.error('CREATE MY TASK ERROR:', error);

    return res.status(500).json({
      message: 'Failed to create my task',
      error: error.message,
    });
  }
};

export const getAdminClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ name: 1 });

    return res.status(200).json(clients);
  } catch (error) {
    console.error('GET ADMIN CLIENTS ERROR:', error);

    return res.status(500).json({
      message: 'Failed to fetch clients',
      error: error.message,
    });
  }
};

export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ name: 1 });

    return res.status(200).json(clients);
  } catch (error) {
    console.error('GET CLIENTS ERROR:', error);

    return res.status(500).json({
      message: 'Failed to fetch clients',
      error: error.message,
    });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, totalHours, totalMinutes } = req.body;

    const allowedStatuses = ['Not Started', 'In Progress', 'Completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid task status',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    task.status = status;

    // Only save time when task is completed
    if (status === 'Completed') {
      if (totalHours === undefined || totalMinutes === undefined) {
        return res.status(400).json({
          message: 'Total hours and minutes are required',
        });
      }

      task.totalHours = Number(totalHours);
      task.totalMinutes = Number(totalMinutes);
    }

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company');

    return res.status(200).json({
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('UPDATE TASK STATUS ERROR:', error);

    return res.status(500).json({
      message: 'Failed to update task status',
      error: error.message,
    });
  }
};
