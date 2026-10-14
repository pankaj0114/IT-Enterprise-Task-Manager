import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';

const emit = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

export const getHrEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees.',
      error: error.message,
    });
  }
};

export const registerHrEmployee = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, dateOfJoining } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !dateOfJoining)
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and date of joining are required.',
      });
    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: 'Passwords do not match.' });
    if (password.length < 6)
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail }))
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    const employee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: 'employee',
      dateOfJoining,
    });
    const safe = employee.toObject();
    delete safe.password;
    emit(req, 'employeesUpdated');
    emit(req, 'dashboardUpdated', { section: 'employees' });
    res.status(201).json({
      success: true,
      message: 'Employee registered successfully.',
      employee: safe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register employee.',
      error: error.message,
    });
  }
};

export const updateHrEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, dateOfJoining } = req.body;
    if (!name?.trim() || !email?.trim() || !dateOfJoining)
      return res.status(400).json({
        success: false,
        message: 'Name, email and date of joining are required.',
      });
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });
    if (duplicate)
      return res.status(409).json({
        success: false,
        message: 'Another user already uses this email.',
      });
    const employee = await User.findOneAndUpdate(
      { _id: id, role: 'employee' },
      { $set: { name: name.trim(), email: normalizedEmail, dateOfJoining } },
      { new: true, runValidators: true },
    ).select('-password');
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found.' });
    emit(req, 'employeesUpdated');
    emit(req, 'dashboardUpdated', { section: 'employees' });
    res.json({
      success: true,
      message: 'Employee updated successfully.',
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update employee.',
      error: error.message,
    });
  }
};

export const resetHrEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    const employee = await User.findOne({ _id: id, role: 'employee' });
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found.' });
    employee.password = await bcrypt.hash(newPassword, 10);
    await employee.save();
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: error.message,
    });
  }
};

export const getHrClients = async (req, res) => {
  try {
    const clients = await Client.find({})
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients.',
      error: error.message,
    });
  }
};

export const assignHrClient = async (req, res) => {
  try {
    const { clientId, employeeIds } = req.body;
    if (!clientId || !Array.isArray(employeeIds) || !employeeIds.length)
      return res.status(400).json({
        success: false,
        message: 'Client and at least one employee are required.',
      });
    const valid = await User.find({
      _id: { $in: employeeIds },
      role: 'employee',
    }).select('_id');
    const ids = valid.map((x) => x._id);
    const client = await Client.findByIdAndUpdate(
      clientId,
      { $set: { assignedTo: ids } },
      { new: true, runValidators: true },
    ).populate('assignedTo', 'name email');
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: 'Client not found.' });
    emit(req, 'clientsUpdated');
    emit(req, 'dashboardUpdated', { section: 'clients' });
    res.json({
      success: true,
      message: 'Client assigned successfully.',
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign client.',
      error: error.message,
    });
  }
};

export const getHrTasks = async (req, res) => {
  try {
    const mode = req.params.mode;
    let filter = {};
    if (mode === 'my') filter.assignedTo = req.user._id;
    else if (mode === 'assigned') filter.assignedBy = req.user._id;
    else if (mode !== 'all')
      return res
        .status(400)
        .json({ success: false, message: 'Invalid task view.' });
    const tasks = await Task.find(filter)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('client', 'name company')
      .sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks.',
      error: error.message,
    });
  }
};

export const deleteHrTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: 'Task not found.' });
    await Task.findByIdAndDelete(req.params.id);
    emit(req, 'tasksUpdated');
    emit(req, 'dashboardUpdated', { section: 'tasks' });
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task.',
      error: error.message,
    });
  }
};

export const getHrPerformance = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select(
      '_id name email',
    );
    const rows = await Promise.all(
      employees.map(async (employee) => {
        const tasks = await Task.find({
          assignedTo: employee._id,
          status: 'Completed',
        }).select('totalHours totalMinutes');
        const totalMinutes = tasks.reduce(
          (sum, t) =>
            sum + Number(t.totalHours || 0) * 60 + Number(t.totalMinutes || 0),
          0,
        );
        const completedTasks = tasks.length;
        return {
          employeeId: employee._id,
          name: employee.name,
          email: employee.email,
          completedTasks,
          totalHours: Math.floor(totalMinutes / 60),
          totalMinutes: totalMinutes % 60,
          totalMinutesSpent: totalMinutes,
          averageTime: completedTasks
            ? `${Math.floor(totalMinutes / completedTasks)}m`
            : '0m',
        };
      }),
    );
    res.json({ success: true, performance: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance.',
      error: error.message,
    });
  }
};

export const getHrAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({})
      .populate('employee', 'name email')
      .populate('user', 'name email')
      .sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance.',
      error: error.message,
    });
  }
};

export const getHrMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      $or: [{ employee: req.user._id }, { user: req.user._id }],
    }).sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your attendance.',
      error: error.message,
    });
  }
};

//import Task from '../models/Task.js';

// HR Manager: Create a task in My Tasks
export const createMyTask = async (req, res) => {
  try {
    const { title, dueDate, client, assignedBy } = req.body;

    if (!title?.trim()) {
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
        message: 'Please select a client',
      });
    }

    const hrManagerId = req.user?.id || req.user?._id;

    if (!hrManagerId) {
      return res.status(401).json({
        message: 'HR Manager authentication required',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      dueDate,
      client,
      assignedBy: assignedBy || hrManagerId,
      createdBy: hrManagerId,
      assignedTo: hrManagerId,
      status: 'Not Started',
    });

    return res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('HR Manager createMyTask error:', error);

    return res.status(500).json({
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const hrManagerId = req.user?.id || req.user?._id;

    if (!hrManagerId) {
      return res.status(401).json({
        message: 'HR Manager ID not found in authentication data',
      });
    }

    console.log('HR Manager ID:', String(hrManagerId));

    // Fetch tasks assigned to the logged-in HR Manager.
    const tasks = await Task.find({
      assignedTo: hrManagerId,
    })
      .populate('client')
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    console.log('My Tasks found:', tasks.length);

    return res.status(200).json({
      message: 'My tasks fetched successfully',
      tasks,
    });
  } catch (error) {
    console.error('getMyTasks error:', error);

    return res.status(500).json({
      message: 'Failed to fetch my tasks',
      error: error.message,
    });
  }
};
