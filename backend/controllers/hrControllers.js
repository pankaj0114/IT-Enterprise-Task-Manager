import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Client from '../models/Client.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const taskPopulate = [
  { path: 'assignedBy', select: 'name email role' },
  { path: 'assignedTo', select: 'name email role' },
  { path: 'client', select: 'name companyName' },
];

/* =========================================================
   GET EMPLOYEES FOR TASK ASSIGNMENT
========================================================= */

export const getEmployeesForTaskAssignment = async (req, res) => {
  try {
    const employees = await User.find({
      role: 'employee',
    }).select('name email role');

    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
    });
  }
};

/* =========================================================
   GET CLIENTS
========================================================= */

export const getHRClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
    });
  }
};

/* =========================================================
   GET TASKS ASSIGNED BY HR
========================================================= */

export const getHRAssignedTasks = async (req, res) => {
  try {
    const hrId = req.user.id;

    const tasks = await Task.find({
      assignedBy: hrId,
    })
      .populate(taskPopulate)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned tasks',
    });
  }
};

/* =========================================================
   ASSIGN TASK
========================================================= */

export const createHRAssignedTask = async (req, res) => {
  try {
    const hrId = req.user.id;

    const { title, assignedTo, dueDate, priority, client, remarks } = req.body;

    if (!title) {
      return res.status(400).json({
        message: 'Task title is required',
      });
    }

    const employee = await User.findById(assignedTo);

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    const task = await Task.create({
      title,
      dueDate,
      priority: priority || 'Medium',
      remarks: remarks || '',
      assignedBy: hrId,
      assignedTo,
      client: client || null,
      status: 'Not Started',
      issueDate: new Date(),
    });

    const populatedTask = await Task.findById(task._id).populate(taskPopulate);

    res.status(201).json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to assign task',
    });
  }
};

/* =========================================================
   UPDATE TASK
========================================================= */

export const updateHRTask = async (req, res) => {
  try {
    const { id } = req.params;

    const updates = req.body;

    const task = await Task.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate(taskPopulate);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
};

/* =========================================================
   UPDATE REMARKS
========================================================= */

export const updateHRTaskRemarks = async (req, res) => {
  try {
    const { id } = req.params;

    const { remarks } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      { remarks },
      { new: true },
    ).populate(taskPopulate);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to update remarks',
    });
  }
};
