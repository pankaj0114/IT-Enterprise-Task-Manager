import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import WfhRequest from '../models/WfhRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
const VALID_STATUSES = ['WFO', 'WFH'];

const isValidDateKey = (dateKey) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
};

const getTodayKey = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getMonthRange = (month) => {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [year, monthNumber] = month.split('-').map(Number);

  if (monthNumber < 1 || monthNumber > 12 || year < 2000 || year > 2100) {
    return null;
  }

  const startDate = `${year}-${String(monthNumber).padStart(2, '0')}-01`;

  const lastDay = new Date(year, monthNumber, 0).getDate();

  const endDate = `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return {
    startDate,
    endDate,
  };
};

/*
|--------------------------------------------------------------------------
| GET MY ATTENDANCE
|--------------------------------------------------------------------------
*/

export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month } = req.query;

    console.log('GET MY ATTENDANCE');
    console.log('Employee ID:', employeeId);
    console.log('Month:', month);

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month is required.',
      });
    }

    const monthRegex = /^\d{4}-\d{2}$/;

    if (!monthRegex.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Use YYYY-MM.',
      });
    }

    /*
     * ------------------------------------------------
     * 1. ATTENDANCE
     * ------------------------------------------------
     */

    const attendance = await Attendance.find({
      employee: employeeId,
      dateKey: {
        $regex: `^${month}-`,
      },
    })
      .sort({ dateKey: 1 })
      .lean();

    /*
     * ------------------------------------------------
     * 2. MONTH START / END
     * ------------------------------------------------
     */

    const [year, monthNumber] = month.split('-').map(Number);

    const lastDay = new Date(year, monthNumber, 0).getDate();

    const monthStart = `${month}-01`;

    const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

    /*
     * ------------------------------------------------
     * 3. LEAVE REQUESTS
     * ------------------------------------------------
     */

    const leaveRequests = await LeaveRequest.find({
      employee: employeeId,

      startDate: {
        $lte: monthEnd,
      },

      endDate: {
        $gte: monthStart,
      },
    })
      .sort({ startDate: -1 })
      .lean();

    /*
     * ------------------------------------------------
     * 4. WFH REQUESTS
     * ------------------------------------------------
     */

    const wfhRequests = await WfhRequest.find({
      employee: employeeId,

      startDate: {
        $lte: monthEnd,
      },

      endDate: {
        $gte: monthStart,
      },
    })
      .populate('reviewedBy', 'name email')
      .sort({ startDate: -1 })
      .lean();

    console.log('Attendance:', attendance.length);

    console.log('Leave Requests:', leaveRequests.length);

    console.log('WFH Requests:', wfhRequests.length);

    /*
     * ------------------------------------------------
     * 5. RESPONSE
     * ------------------------------------------------
     */

    return res.status(200).json({
      success: true,
      attendance,
      leaveRequests,
      wfhRequests,
    });
  } catch (error) {
    console.error('Get my attendance error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load attendance.',
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| MARK WFO / WFH
|--------------------------------------------------------------------------
*/

export const markAttendance = async (req, res) => {
  try {
    const { dateKey, status } = req.body;
    const employeeId = req.user.id || req.user._id;

    if (!isValidDateKey(dateKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date. Use YYYY-MM-DD.',
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Only WFO or WFH can be selected.',
      });
    }

    const today = getTodayKey();

    // Employees cannot change past attendance.
    if (dateKey < today) {
      return res.status(400).json({
        success: false,
        message: 'Past attendance cannot be changed.',
      });
    }

    // WFO can only be marked for today, not a future date.
    if (status === 'WFO' && dateKey > today) {
      return res.status(400).json({
        success: false,
        message: 'You can mark WFO only for today.',
      });
    }

    // Do not allow manual attendance if a leave request
    // is pending or approved for this date.
    const activeLeave = await LeaveRequest.findOne({
      employee: employeeId,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: dateKey },
      endDate: { $gte: dateKey },
    });

    if (activeLeave) {
      return res.status(400).json({
        success: false,
        message:
          'You cannot mark attendance while a leave request is pending or approved for this date.',
      });
    }

    // Do not allow manual attendance if a WFH request
    // is pending or approved for this date.
    const activeWfh = await WfhRequest.findOne({
      employee: employeeId,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: dateKey },
      endDate: { $gte: dateKey },
    });

    if (activeWfh) {
      return res.status(400).json({
        success: false,
        message:
          'You cannot manually change attendance while a WFH request is pending or approved for this date.',
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        employee: employeeId,
        dateKey,
      },
      {
        employee: employeeId,
        dateKey,
        status,
        source: 'employee',
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    return res.json({
      success: true,
      message:
        status === 'WFO'
          ? 'Marked as Work From Office.'
          : 'Marked as Work From Home.',
      attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance.',
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| REQUEST LEAVE
|--------------------------------------------------------------------------
*/

export const requestLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    console.log('========== LEAVE REQUEST ==========');
    console.log('BODY:', req.body);
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    console.log('reason:', reason);
    console.log('today:', getTodayKey());
    console.log('===================================');

    // 1. Validate dates
    if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave dates.',
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Leave start date cannot be after end date.',
      });
    }

    // 2. Validate reason
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for the leave.',
      });
    }

    // 3. Validate leave dates
    const today = getTodayKey();

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message:
          'Leave must be requested at least one day before the leave date.',
      });
    }

    // 4. Find logged-in user
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // 5. Allow employees and HR managers
    const allowedRoles = ['employee', 'hr_manager'];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only employees and HR managers can request leave.',
      });
    }

    // 6. Check overlapping pending or approved leave requests
    const overlappingLeave = await LeaveRequest.findOne({
      employee: user._id,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (overlappingLeave) {
      return res.status(409).json({
        success: false,
        message:
          'You already have a pending or approved leave request for part of this period.',
      });
    }

    // 7. Remove existing WFO / WFH attendance for the requested dates
    await Attendance.deleteMany({
      employee: user._id,
      dateKey: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $in: ['WFO', 'WFH'] },
    });

    // 8. Create pending leave request
    const leaveRequest = await LeaveRequest.create({
      employee: user._id,
      startDate,
      endDate,
      reason: reason.trim(),
      status: 'PENDING',
    });

    // 9. Notify admins
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');

      const notifications = admins.map((admin) => ({
        recipient: admin._id,
        sender: user._id,
        message: `${user.name || 'A user'} (${user.role}) submitted a new leave request.`,
        type: 'LEAVE_REQUEST',
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifError) {
      console.error(
        'Failed to create admin notifications for leave:',
        notifError,
      );
    }

    // 10. Send success response
    return res.status(201).json({
      success: true,
      message: 'Leave request submitted for admin approval.',
      leaveRequest,
    });
  } catch (error) {
    console.error('Request leave error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to submit leave request.',
      error: error.message,
    });
  }
};
/*
|--------------------------------------------------------------------------
| ADMIN - GET LEAVE REQUESTS
|--------------------------------------------------------------------------
*/

export const getLeaveRequestsForAdmin = async (req, res) => {
  try {
    const status = req.query.status || 'PENDING';

    const query = {};

    if (['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      query.status = status;
    }

    const requests = await LeaveRequest.find(query)
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Get admin leave requests error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load leave requests',
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN - APPROVE / REJECT
|--------------------------------------------------------------------------
*/

export const reviewLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, adminComment = '' } = req.body;
    const adminId = req.user?.id || req.user?._id;

    console.log('Review leave request:', {
      requestId,
      action,
      adminId,
    });

    // 1. Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use approve or reject.',
      });
    }

    // 2. Find the leave request
    const leaveRequest = await LeaveRequest.findById(requestId);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    // 3. Only pending requests can be reviewed
    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leaveRequest.status.toLowerCase()}.`,
      });
    }

    // 4. Reject request
    if (action === 'reject') {
      leaveRequest.status = 'REJECTED';
      leaveRequest.reviewedBy = adminId;
      leaveRequest.reviewedAt = new Date();
      leaveRequest.adminComment = adminComment;

      await leaveRequest.save();

      return res.status(200).json({
        success: true,
        message: 'Leave request rejected successfully.',
        request: leaveRequest,
      });
    }

    // 5. Validate dates
    const { startDate, endDate } = leaveRequest;

    if (
      !isValidDateKey(startDate) ||
      !isValidDateKey(endDate) ||
      startDate > endDate
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave date range.',
      });
    }

    // 6. Check for conflicting WFO/WFH attendance
    const conflictingAttendance = await Attendance.findOne({
      employee: leaveRequest.employee,
      dateKey: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $in: ['WFO', 'WFH'] },
    });

    if (conflictingAttendance) {
      return res.status(409).json({
        success: false,
        message:
          `Cannot approve leave. Attendance is already marked as ${conflictingAttendance.status} ` +
          `on ${conflictingAttendance.dateKey}.`,
      });
    }

    // 7. Check for overlapping active WFH requests
    const conflictingWfh = await WfhRequest.findOne({
      employee: leaveRequest.employee,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (conflictingWfh) {
      return res.status(409).json({
        success: false,
        message:
          'Cannot approve leave because this employee has a pending or approved WFH request for overlapping dates.',
      });
    }

    // 8. Check for other overlapping active leave requests
    // Exclude the leave request currently being reviewed.
    const conflictingLeave = await LeaveRequest.findOne({
      _id: { $ne: leaveRequest._id },
      employee: leaveRequest.employee,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (conflictingLeave) {
      return res.status(409).json({
        success: false,
        message:
          'Cannot approve leave because another pending or approved leave request overlaps these dates.',
      });
    }

    // 9. Prepare LEAVE attendance records for each day
    const operations = [];
    const current = new Date(`${startDate}T00:00:00`);

    while (
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}` <=
      endDate
    ) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      operations.push({
        updateOne: {
          filter: {
            employee: leaveRequest.employee,
            dateKey,
          },
          update: {
            $set: {
              employee: leaveRequest.employee,
              dateKey,
              status: 'LEAVE',
              source: 'employee',
              leaveRequest: leaveRequest._id,
              reason: leaveRequest.reason,
            },
          },
          upsert: true,
        },
      });

      current.setDate(current.getDate() + 1);
    }

    console.log('Attendance operations:', operations.length);

    // 10. Save attendance records
    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    // 11. Mark the request as approved
    leaveRequest.status = 'APPROVED';
    leaveRequest.reviewedBy = adminId;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.adminComment = adminComment;

    await leaveRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request approved successfully.',
      request: leaveRequest,
    });
  } catch (error) {
    console.error('Review leave request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to process leave request.',
      error: error.message,
    });
  }
};
/*
=========================================================
HELPERS
=========================================================
*/

const getDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00`);
  const end = new Date(`${dateString}T23:59:59.999`);

  return { start, end };
};

const normalizeDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);

  date.setHours(0, 0, 0, 0);

  return date;
};

/*
=========================================================
GET ALL EMPLOYEES + ATTENDANCE SUMMARY
=========================================================
*/

export const getAttendanceEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: 'employee',
    })
      .select('_id name email')
      .sort({ name: 1 });

    return res.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error('Get attendance employees error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load employees',
    });
  }
};

/*
=========================================================
GET EMPLOYEE MONTHLY ATTENDANCE
=========================================================
*/

export const getEmployeeMonthlyAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required',
      });
    }

    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12 ||
      !Number.isInteger(yearNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month or year',
      });
    }

    const startDate = new Date(yearNumber, monthNumber - 1, 1, 0, 0, 0, 0);

    const endDate = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);

    const employee = await User.findOne({
      _id: employeeId,
      role: 'employee',
    }).select('_id name email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Attendance uses YYYY-MM-DD dateKey.
    const startDateKey = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-01`;

    const lastDay = new Date(yearNumber, monthNumber, 0).getDate();

    const endDateKey = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const attendance = await Attendance.find({
      employee: employeeId,
      $or: [
        {
          dateKey: {
            $gte: startDateKey,
            $lte: endDateKey,
          },
        },
        {
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      ],
    })
      .sort({ dateKey: 1, date: 1 })
      .lean();

    const summary = {
      WFO: 0,
      WFH: 0,
      LEAVE: 0,
      PENDING_LEAVE: 0,
      APPROVED_LEAVE: 0,
    };

    attendance.forEach((record) => {
      if (record.status === 'WFO') {
        summary.WFO += 1;
      }

      if (record.status === 'WFH') {
        summary.WFH += 1;
      }

      if (record.status === 'LEAVE') {
        summary.LEAVE += 1;
      }

      if (record.leaveRequestStatus === 'PENDING') {
        summary.PENDING_LEAVE += 1;
      }

      if (record.leaveRequestStatus === 'APPROVED') {
        summary.APPROVED_LEAVE += 1;
      }
    });

    return res.json({
      success: true,
      employee,
      attendance,
      summary,
    });
  } catch (error) {
    console.error('Get monthly attendance error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load attendance',
    });
  }
};

/*
=========================================================
ADMIN SET EMPLOYEE ATTENDANCE
=========================================================
*/

export const adminSetAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date, status, reason = '' } = req.body;

    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Date and status are required',
      });
    }

    if (!['WFO', 'WFH', 'LEAVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status',
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: 'employee',
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const dateKey = String(date).slice(0, 10);

    if (!isValidDateKey(dateKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance date. Use YYYY-MM-DD.',
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        employee: employeeId,
        dateKey,
      },
      {
        employee: employeeId,
        dateKey,
        status,
        reason: status === 'LEAVE' ? reason.trim() : '',
        source: 'admin',
        leaveRequestStatus: status === 'LEAVE' ? 'APPROVED' : 'NONE',
        approvedBy: status === 'LEAVE' ? req.user.id : null,
        approvedAt: status === 'LEAVE' ? new Date() : null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    return res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance,
    });
  } catch (error) {
    console.error('Admin set attendance error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
    });
  }
};

export const requestWfh = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const { startDate, endDate, reason } = req.body;

    console.log('WFH REQUEST BODY:', req.body);
    console.log('WFH EMPLOYEE:', employeeId);

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.',
      });
    }

    // Validate date range
    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date.',
      });
    }

    // Validate reason
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid WFH reason.',
      });
    }

    /*
     * Prevent duplicate/overlapping WFH requests.
     */
    const overlappingRequest = await WfhRequest.findOne({
      employee: employeeId,

      status: {
        $in: ['PENDING', 'APPROVED'],
      },

      startDate: {
        $lte: endDate,
      },

      endDate: {
        $gte: startDate,
      },
    });

    if (overlappingRequest) {
      return res.status(400).json({
        success: false,
        message:
          'You already have a pending or approved WFH request for one or more of these dates.',
      });
    }

    /*
     * Check leave requests too.
     * An employee should not request WFH on dates
     * where they already have a leave request.
     */
    const overlappingLeave = await LeaveRequest.findOne({
      employee: employeeId,

      status: {
        $in: ['PENDING', 'APPROVED'],
      },

      startDate: {
        $lte: endDate,
      },

      endDate: {
        $gte: startDate,
      },
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message:
          'You already have a leave request for one or more of these dates.',
      });
    }

    /*
     * IMPORTANT:
     * Remove any existing WFO/WFH attendance for these dates.
     *
     * This makes the date become Pending instead of showing
     * WFO + Pending or WFH + Pending.
     *
     * WFH count will also decrease immediately because the
     * attendance record is removed.
     */
    await Attendance.deleteMany({
      employee: employeeId,
      dateKey: {
        $gte: startDate,
        $lte: endDate,
      },
      status: {
        $in: ['WFO', 'WFH'],
      },
    });

    /*
     * Create the WFH request as PENDING.
     *
     * Do NOT create WFH attendance here.
     * Attendance should only be created when admin approves.
     */
    /*
     * Create the WFH request as PENDING.
     */
    const request = await WfhRequest.create({
      employee: employeeId,
      startDate,
      endDate,
      reason: reason.trim(),
      status: 'PENDING',
    });

    // --> ADD NOTIFICATION LOGIC HERE <--
    try {
      const employeeUser = await User.findById(employeeId);
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map((admin) => ({
        recipient: admin._id,
        sender: employeeId,
        message: `${employeeUser?.name || 'An employee'} submitted a new WFH request.`,
        type: 'WFH_REQUEST',
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifError) {
      console.error(
        'Failed to create admin notifications for WFH:',
        notifError,
      );
    }

    const populatedRequest = await WfhRequest.findById(request._id)
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'WFH request submitted successfully.',
      request: populatedRequest,
    });
  } catch (error) {
    console.error('Request WFH error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to submit WFH request.',
      error: error.message,
    });
  }
};
/*
=========================================================
ADMIN OWN ATTENDANCE
=========================================================
*/

export const adminSetOwnAttendance = async (req, res) => {
  try {
    const { date, status, reason = '' } = req.body;

    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Date and status are required',
      });
    }

    if (!['WFO', 'WFH', 'LEAVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status',
      });
    }

    const attendanceDate = normalizeDate(date);

    const attendance = await Attendance.findOneAndUpdate(
      {
        employee: req.user.id,
        date: attendanceDate,
      },
      {
        employee: req.user.id,
        date: attendanceDate,
        status,
        reason: status === 'LEAVE' ? reason.trim() : '',
        source: 'admin',
        leaveRequestStatus: status === 'LEAVE' ? 'APPROVED' : 'NONE',
        approvedBy: status === 'LEAVE' ? req.user.id : null,
        approvedAt: status === 'LEAVE' ? new Date() : null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    return res.json({
      success: true,
      message: 'Your attendance has been updated',
      attendance,
    });
  } catch (error) {
    console.error('Admin own attendance error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update your attendance',
    });
  }
};

/*
=========================================================
GET ADMIN OWN MONTHLY ATTENDANCE
=========================================================
*/

export const getAdminOwnAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required',
      });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0, 0);

    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const attendance = await Attendance.find({
      employee: req.user.id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: 1 });

    const summary = {
      WFO: 0,
      WFH: 0,
      LEAVE: 0,
    };

    attendance.forEach((record) => {
      if (record.status === 'WFO') summary.WFO += 1;
      if (record.status === 'WFH') summary.WFH += 1;
      if (record.status === 'LEAVE') summary.LEAVE += 1;
    });

    return res.json({
      success: true,
      attendance,
      summary,
    });
  } catch (error) {
    console.error('Get admin own attendance error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load your attendance',
    });
  }
};

/*
=========================================================
ADMIN GET PENDING LEAVE REQUESTS
=========================================================
*/

export const getPendingLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({
      status: 'PENDING',
    })
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Get pending leave requests error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load leave requests',
    });
  }
};

/*
=========================================================
ADMIN APPROVE / REJECT LEAVE
=========================================================
*/
export const handleLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, adminComment = '' } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use approve or reject.',
      });
    }

    const leaveRequest = await LeaveRequest.findById(requestId);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This leave request has already been processed.',
      });
    }

    // ---------------------------------------
    // REJECT
    // ---------------------------------------
    if (action === 'reject') {
      leaveRequest.status = 'REJECTED';
      leaveRequest.reviewedBy = req.user.id;
      leaveRequest.reviewedAt = new Date();
      leaveRequest.adminComment = adminComment.trim();

      await leaveRequest.save();

      return res.json({
        success: true,
        message: 'Leave request rejected.',
        leaveRequest,
      });
    }

    // ---------------------------------------
    // APPROVE
    // ---------------------------------------

    // Make sure employee has not marked
    // WFO/WFH during the requested period.
    const conflictingAttendance = await Attendance.findOne({
      employee: leaveRequest.employee,
      dateKey: {
        $gte: leaveRequest.startDate,
        $lte: leaveRequest.endDate,
      },
      status: {
        $in: ['WFO', 'WFH'],
      },
    });

    if (conflictingAttendance) {
      return res.status(409).json({
        success: false,
        message:
          'Employee already has attendance marked during this leave period.',
      });
    }

    const conflictingWfh = await WfhRequest.findOne({
      employee: leaveRequest.employee,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: leaveRequest.endDate },
      endDate: { $gte: leaveRequest.startDate },
    });

    if (conflictingWfh) {
      return res.status(409).json({
        success: false,
        message:
          'This employee already has a pending or approved WFH request for one or more of these dates.',
      });
    }

    const conflictingLeave = await LeaveRequest.findOne({
      _id: { $ne: leaveRequest._id },
      employee: leaveRequest.employee,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: leaveRequest.endDate },
      endDate: { $gte: leaveRequest.startDate },
    });

    if (conflictingLeave) {
      return res.status(409).json({
        success: false,
        message:
          'This employee already has another pending or approved leave request for one or more of these dates.',
      });
    }

    // Generate every date in the leave period
    const start = new Date(`${leaveRequest.startDate}T00:00:00`);
    const end = new Date(`${leaveRequest.endDate}T00:00:00`);

    const attendanceRecords = [];

    for (
      let current = new Date(start);
      current <= end;
      current.setDate(current.getDate() + 1)
    ) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');

      const dateKey = `${year}-${month}-${day}`;

      attendanceRecords.push({
        employee: leaveRequest.employee,
        dateKey,
        status: 'LEAVE',
        source: 'employee',
        leaveRequest: leaveRequest._id,
        reason: leaveRequest.reason,
      });
    }

    // Create LEAVE attendance records
    await Attendance.bulkWrite(
      attendanceRecords.map((record) => ({
        updateOne: {
          filter: {
            employee: record.employee,
            dateKey: record.dateKey,
          },
          update: {
            $set: record,
          },
          upsert: true,
        },
      })),
    );

    // Update leave request AFTER attendance succeeds
    leaveRequest.status = 'APPROVED';
    leaveRequest.reviewedBy = req.user.id;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.adminComment = adminComment.trim();

    await leaveRequest.save();

    return res.json({
      success: true,
      message: 'Leave request approved successfully.',
      leaveRequest,
    });
  } catch (error) {
    console.error('Handle leave request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to process leave request',
      error: error.message,
    });
  }
};

export const getWfhRequestsForAdmin = async (req, res) => {
  try {
    const status = req.query.status || 'PENDING';

    const requests = await WfhRequest.find({
      status,
    })
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Get WFH requests error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load WFH requests.',
    });
  }
};

export const reviewWfhRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, adminComment = '' } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action.',
      });
    }

    const request = await WfhRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'WFH request not found.',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This WFH request has already been processed.',
      });
    }

    // REJECT
    if (action === 'reject') {
      request.status = 'REJECTED';
      request.reviewedBy = req.user.id;
      request.reviewedAt = new Date();
      request.adminComment = adminComment.trim();

      await request.save();

      return res.json({
        success: true,
        message: 'WFH request rejected.',
        request,
      });
    }

    // APPROVE
    const start = new Date(`${request.startDate}T00:00:00`);
    const end = new Date(`${request.endDate}T00:00:00`);

    const attendanceOperations = [];

    const current = new Date(start);

    while (current <= end) {
      const dateKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1,
      ).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

      attendanceOperations.push({
        updateOne: {
          filter: {
            employee: request.employee,
            dateKey,
          },

          update: {
            $set: {
              employee: request.employee,
              dateKey,
              status: 'WFH',
              source: 'employee',
              reason: request.reason,
              wfhRequest: request._id,
            },
          },

          upsert: true,
        },
      });

      current.setDate(current.getDate() + 1);
    }

    if (attendanceOperations.length > 0) {
      await Attendance.bulkWrite(attendanceOperations);
    }

    request.status = 'APPROVED';
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminComment = adminComment.trim();

    await request.save();

    return res.json({
      success: true,
      message: 'WFH request approved.',
      request,
    });
  } catch (error) {
    console.error('Review WFH request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to process WFH request.',
      error: error.message,
    });
  }
};
