// controllers/taskController.js
import Task from '../models/Task.js';
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

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Assigned task not found.',
      });
    }

    task.title = title.trim();

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task title updated successfully.',
      task,
    });
  } catch (error) {
    console.error('updateAssignedTaskTitle:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update task title.',
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

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Assigned task not found.',
      });
    }

    task.dueDate = dueDate;

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Due date updated successfully.',
      task,
    });
  } catch (error) {
    console.error('updateAssignedTaskDueDate:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update due date.',
    });
  }
};

export const updateAssignedTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Not Started', 'In Progress'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Employee can only set status to Not Started or In Progress.',
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Assigned task not found.',
      });
    }

    task.status = status;

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully.',
      task,
    });
  } catch (error) {
    console.error('updateAssignedTaskStatus:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update task status.',
    });
  }
};

export const updateAssignedTaskRemarks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { remarks } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Assigned task not found.',
      });
    }

    task.remarks = remarks || '';

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Remarks updated successfully.',
      task,
    });
  } catch (error) {
    console.error('updateAssignedTaskRemarks:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update remarks.',
    });
  }
};

export const updateAssignedTaskClient = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { client } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Assigned task not found.',
      });
    }

    task.client = client || null;

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully.',
      task,
    });
  } catch (error) {
    console.error('updateAssignedTaskClient:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update client.',
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
