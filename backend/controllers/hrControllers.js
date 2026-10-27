import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import WfhRequest from '../models/WfhRequest.js';
import Notification from '../models/Notification.js';

const actor = (req) => req.user.id || req.user._id;
const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const populateTasks = [
  { path: 'assignedBy', select: 'name email role' },
  { path: 'assignedTo', select: 'name email role' },
  { path: 'client', select: 'name companyName clientName' },
];
async function notify(
  user,
  title,
  message,
  type = 'hr_activity',
  metadata = {},
) {
  if (user)
    await Notification.create({
      user,
      title,
      message,
      type,
      metadata,
      read: false,
    });
}
async function notifyAdmins(title, message, metadata = {}) {
  const admins = await User.find({ role: 'admin' }).select('_id');
  await Promise.all(
    admins.map((a) => notify(a._id, title, message, 'hr_activity', metadata)),
  );
}

export const getHRUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['employee', 'hr_manager'] } })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
};

export const updateHRUser = async (req, res) => {
  try {
    const { userId } = req.params,
      { name, email } = req.body;
    if (!validId(userId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid user ID.' });
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    if (!['employee', 'hr_manager'].includes(user.role))
      return res
        .status(403)
        .json({ success: false, message: 'HR cannot edit this account.' });
    if (
      email &&
      email.toLowerCase() !== user.email.toLowerCase() &&
      (await User.exists({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      }))
    )
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists.' });
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    await user.save();
    await notifyAdmins(
      'HR edited user details',
      `HR updated details for ${user.name} (${user.email}).`,
      { userId: user._id, changedBy: actor(req) },
    );
    res.json({
      success: true,
      message: 'User updated; admin notified.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

export const resetHRUserPassword = async (req, res) => {
  try {
    const { userId } = req.params,
      { password } = req.body;
    if (!validId(userId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid user ID.' });
    if (typeof password !== 'string' || password.length < 8)
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    if (user.role !== 'employee')
      return res.status(403).json({
        success: false,
        message: 'HR can reset employee passwords only.',
      });
    user.password = await bcrypt.hash(password, 12);
    await user.save();
    await notifyAdmins(
      'Employee password reset by HR',
      `HR reset the password for ${user.name} (${user.email}).`,
      { userId: user._id, changedBy: actor(req) },
    );
    res.json({ success: true, message: 'Password reset; admin notified.' });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to reset password.' });
  }
};

export const getHRMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: actor(req) })
      .populate(populateTasks)
      .sort({ createdAt: -1 });
    res.json({ success: true, tasks, count: tasks.length });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to load My Tasks.' });
  }
};
export const createHRMyTask = async (req, res) => {
  try {
    const { title, dueDate, issueDate, priority, remarks, client, assignedBy } =
      req.body;
    if (!title?.trim() || !dueDate)
      return res
        .status(400)
        .json({ success: false, message: 'Title and due date are required.' });
    if (client && !validId(client))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid client ID.' });
    let by = actor(req);
    if (assignedBy) {
      if (!validId(assignedBy))
        return res
          .status(400)
          .json({ success: false, message: 'Invalid assignedBy ID.' });
      if (!(await User.exists({ _id: assignedBy })))
        return res
          .status(404)
          .json({ success: false, message: 'Assigned By user not found.' });
      by = assignedBy;
    }
    const task = await Task.create({
      title: title.trim(),
      dueDate,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      priority: priority || 'Medium',
      remarks: remarks || '',
      client: client || null,
      assignedBy: by,
      assignedTo: actor(req),
      status: 'Not Started',
    });
    res.status(201).json({
      success: true,
      task: await Task.findById(task._id).populate(populateTasks),
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create My Task.' });
  }
};
export const getHRAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedBy: actor(req) })
      .populate(populateTasks)
      .sort({ createdAt: -1 });
    res.json({ success: true, tasks, count: tasks.length });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to load assigned tasks.' });
  }
};
export const createHRAssignedTask = async (req, res) => {
  try {
    const { title, assignedTo, dueDate, issueDate, priority, remarks, client } =
      req.body;
    if (!title?.trim() || !dueDate || !validId(assignedTo))
      return res.status(400).json({
        success: false,
        message: 'Title, due date and employee are required.',
      });
    if (!(await User.exists({ _id: assignedTo, role: 'employee' })))
      return res
        .status(400)
        .json({ success: false, message: 'Choose a valid employee.' });
    if (client && !validId(client))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid client ID.' });
    const task = await Task.create({
      title: title.trim(),
      assignedTo,
      assignedBy: actor(req),
      dueDate,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      priority: priority || 'Medium',
      remarks: remarks || '',
      client: client || null,
      status: 'Not Started',
    });
    res.status(201).json({
      success: true,
      task: await Task.findById(task._id).populate(populateTasks),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to assign task.' });
  }
};

export const getHRClients = async (req, res) => {
  try {
    res.json({
      success: true,
      clients: await Client.find({}).sort({ name: 1 }),
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to load clients.' });
  }
};
export const assignExistingClient = async (req, res) => {
  try {
    const { clientId, employeeIds } = req.body;

    // Validate client ID
    if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid clientId is required.',
      });
    }

    // Validate employee selection
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one employee.',
      });
    }

    // Validate employee IDs
    const invalidIds = employeeIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidIds) {
      return res.status(400).json({
        success: false,
        message: 'One or more employee IDs are invalid.',
      });
    }

    // Confirm the client exists
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.',
      });
    }

    // Confirm all selected users exist and are employees
    const uniqueEmployeeIds = [...new Set(employeeIds.map(String))];

    const employees = await User.find({
      _id: { $in: uniqueEmployeeIds },
      role: 'employee',
    }).select('_id');

    if (employees.length !== uniqueEmployeeIds.length) {
      return res.status(400).json({
        success: false,
        message:
          'One or more selected users do not exist or are not employees.',
      });
    }

    // Assign employees using the actual Client schema field
    client.assignedTo = uniqueEmployeeIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    await client.save();

    return res.status(200).json({
      success: true,
      message: 'Client assigned successfully.',
      client: await Client.findById(client._id).populate(
        'assignedTo',
        'name email role',
      ),
    });
  } catch (error) {
    console.error('assignExistingClient error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to assign client.',
      error: error.message,
    });
  }
};

export const getHRAttendanceEmployees = async (req, res) => {
  try {
    res.json({
      success: true,
      employees: await User.find({ role: 'employee' })
        .select('name email role')
        .sort({ name: 1 }),
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to load employees.' });
  }
};
export const getHREmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params,
      month = Number(req.query.month),
      year = Number(req.query.year);
    if (!validId(employeeId) || month < 1 || month > 12 || !year)
      return res.status(400).json({
        success: false,
        message: 'Valid employee, month and year required.',
      });
    const employee = await User.findOne({
      _id: employeeId,
      role: 'employee',
    }).select('name email');
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found.' });
    const start = new Date(year, month - 1, 1),
      end = new Date(year, month, 1),
      prefix = `${year}-${String(month).padStart(2, '0')}`;
    const attendance = await Attendance.find({
      employee: employeeId,
      $or: [
        { date: { $gte: start, $lt: end } },
        { dateKey: { $gte: prefix + '-01', $lte: prefix + '-31' } },
      ],
    }).sort({ date: 1, dateKey: 1 });
    const summary = { WFO: 0, WFH: 0, LEAVE: 0 };
    attendance.forEach((a) => {
      if (summary[a.status] !== undefined) summary[a.status]++;
    });
    res.json({ success: true, employee, attendance, summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: 'Failed to load attendance; check Attendance schema.',
    });
  }
};

export const getHRLeaveRequests = async (req, res) => {
  try {
    res.json({
      success: true,
      requests: await LeaveRequest.find({})
        .populate('employee', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 }),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: 'Failed to load leave requests; check LeaveRequest schema.',
    });
  }
};
export const reviewHRLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params,
      { action, comment = '' } = req.body;
    if (!['approve', 'reject'].includes(action))
      return res
        .status(400)
        .json({ success: false, message: 'Action must be approve or reject.' });
    const request = await LeaveRequest.findById(requestId).populate(
      'employee',
      'name email',
    );
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: 'Leave request not found.' });
    if (request.status !== 'PENDING')
      return res
        .status(409)
        .json({ success: false, message: 'Request already reviewed.' });
    request.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    request.reviewedBy = actor(req);
    request.reviewedAt = new Date();
    request.adminComment = comment;
    await request.save();
    const employee = request.employee?._id || request.employee,
      word = action === 'approve' ? 'accepted' : 'rejected';
    await Promise.all([
      notify(
        employee,
        'Leave request decision',
        `Your leave request was ${word} by HR.`,
        'leave_decision',
        { requestId },
      ),
      notifyAdmins(
        'HR reviewed leave request',
        `HR ${word} a leave request for ${request.employee?.name || 'an employee'}.`,
        { requestId, action },
      ),
    ]);
    res.json({
      success: true,
      message: `Leave request ${word}; employee and admin notified.`,
      request,
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to review leave request.' });
  }
};
export const getHRWfhRequests = async (req, res) => {
  try {
    res.json({
      success: true,
      requests: await WfhRequest.find({})
        .populate('employee', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 }),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: 'Failed to load WFH requests; check WfhRequest schema.',
    });
  }
};
export const reviewHRWfhRequest = async (req, res) => {
  try {
    const { requestId } = req.params,
      { action, comment = '' } = req.body;
    if (!['approve', 'reject'].includes(action))
      return res
        .status(400)
        .json({ success: false, message: 'Action must be approve or reject.' });
    const request = await WfhRequest.findById(requestId).populate(
      'employee',
      'name email',
    );
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: 'WFH request not found.' });
    if (request.status !== 'PENDING')
      return res
        .status(409)
        .json({ success: false, message: 'Request already reviewed.' });
    request.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    request.reviewedBy = actor(req);
    request.reviewedAt = new Date();
    request.reviewComment = comment;
    await request.save();
    const employee = request.employee?._id || request.employee,
      word = action === 'approve' ? 'accepted' : 'rejected';
    await Promise.all([
      notify(
        employee,
        'WFH request decision',
        `Your WFH request was ${word} by HR.`,
        'wfh_decision',
        { requestId },
      ),
      notifyAdmins(
        'HR reviewed WFH request',
        `HR ${word} a WFH request for ${request.employee?.name || 'an employee'}.`,
        { requestId, action },
      ),
    ]);
    res.json({
      success: true,
      message: `WFH request ${word}; employee and admin notified.`,
      request,
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to review WFH request.' });
  }
};

export const getHREmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: 'employee',
    })
      .select('-password -refreshToken')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error('Error fetching HR employees:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees.',
    });
  }
};
export const getHRNotifications = async (req, res) => {
  try {
    res.json({
      success: true,
      notifications: await Notification.find({ user: actor(req) })
        .sort({ createdAt: -1 })
        .limit(100),
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to load notifications.' });
  }
};
export const getHREmployeePerformance = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select(
      'name email',
    );
    const performance = await Promise.all(
      employees.map(async (employee) => {
        const tasks = await Task.find({ assignedTo: employee._id }).select(
          'status',
        );
        return {
          employeeId: employee._id,
          name: employee.name,
          email: employee.email,
          totalTasks: tasks.length,
          completed: tasks.filter((t) => t.status === 'Completed').length,
          inProgress: tasks.filter((t) => t.status === 'In Progress').length,
          notStarted: tasks.filter((t) => t.status === 'Not Started').length,
        };
      }),
    );
    res.json({ success: true, performance });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: 'Failed to load performance.' });
  }
};
