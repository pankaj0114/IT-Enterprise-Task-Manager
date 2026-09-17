// controllers/taskController.js
import Task from '../models/Task.js';
import { createTaskChangeNotification } from './taskNotificationHelper.js';
//const Task = require('../models/Task');

export const updateAssignedTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    task.title = title.trim();

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      fieldName: 'Title changed',
    });

    return res.status(200).json({
      success: true,
      message: 'Task title updated successfully.',
      task,
    });
  } catch (error) {
    console.error('UPDATE TITLE ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update task title.',
      error: error.message,
    });
  }
};

export const updateAssignedTaskDueDate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required.',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    task.dueDate = new Date(dueDate);

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      fieldName: 'Due date changed',
    });

    return res.status(200).json({
      success: true,
      message: 'Due date updated successfully.',
      task,
    });
  } catch (error) {
    console.error('UPDATE DUE DATE ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update due date.',
      error: error.message,
    });
  }
};

export const updateAssignedTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Not Started', 'In Progress', 'Completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status.',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    task.status = status;

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      fieldName: `Status changed to ${status}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully.',
      task,
    });
  } catch (error) {
    console.error('UPDATE STATUS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update task status.',
      error: error.message,
    });
  }
};

export const updateAssignedTaskRemarks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { remarks } = req.body;

    console.log('========== UPDATE REMARKS ==========');
    console.log('Task ID:', taskId);
    console.log('User ID:', req.user.id);
    console.log('Remarks:', remarks);

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    task.remarks = remarks || '';

    await task.save();

    console.log('Remarks updated successfully:', task._id);

    await createTaskChangeNotification({
      req,
      task,
      fieldName: 'Remarks changed',
    });

    return res.status(200).json({
      success: true,
      message: 'Remarks updated successfully.',
      task,
    });
  } catch (error) {
    console.error('UPDATE REMARKS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update remarks.',
      error: error.message,
    });
  }
};

export const updateAssignedTaskClient = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { client } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    task.client = client || null;

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      fieldName: 'Client changed',
    });

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully.',
      task,
    });
  } catch (error) {
    console.error('UPDATE CLIENT ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update client.',
      error: error.message,
    });
  }
};

export const deleteAssignedTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log('=================================');
    console.log('DELETE ASSIGNED TASK');
    console.log('Task ID:', taskId);
    console.log('Logged-in user:', req.user);
    console.log('=================================');

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    console.log('TASK FOUND:', task);

    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({
      success: true,
      message: 'Assigned task deleted successfully.',
      deletedTaskId: taskId,
    });
  } catch (error) {
    console.error('DELETE ASSIGNED TASK ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete assigned task.',
      error: error.message,
    });
  }
};
