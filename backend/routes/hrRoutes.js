import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getHRUsers,
  updateHRUser,
  resetHRUserPassword,
  getHRMyTasks,
  createHRMyTask,
  getHRAssignedTasks,
  createHRAssignedTask,
  getHRClients,
  assignExistingClient,
  getHRAttendanceEmployees,
  getHREmployeeAttendance,
  getHRLeaveRequests,
  reviewHRLeaveRequest,
  getHRWfhRequests,
  reviewHRWfhRequest,
  getHRNotifications,
  getHREmployeePerformance,
  getHREmployees,
} from '../controllers/hrControllers.js';
const router = express.Router();
const hrOnly = (req, res, next) => {
  if ((req.user?.role || '').toLowerCase() !== 'hr_manager')
    return res
      .status(403)
      .json({ success: false, message: 'HR Manager access required.' });
  next();
};
router.use(authMiddleware, hrOnly);
router.get('/users', getHRUsers);
router.put('/users/:userId', updateHRUser);
router.put('/users/:userId/reset-password', resetHRUserPassword);
router.get('/tasks/my', getHRMyTasks);
router.post('/tasks/my', createHRMyTask);
router.get('/tasks/assigned', getHRAssignedTasks);
router.post('/tasks/assigned', createHRAssignedTask);
router.get('/clients', getHRClients);
router.get('/employees', getHREmployees);
router.post('/clients/assign', assignExistingClient);
router.get('/attendance/employees', getHRAttendanceEmployees);
router.get('/attendance/employee/:employeeId', getHREmployeeAttendance);
router.get('/leave-requests', getHRLeaveRequests);
router.put('/leave-requests/:requestId/review', reviewHRLeaveRequest);
router.get('/wfh-requests', getHRWfhRequests);
router.put('/wfh-requests/:requestId/review', reviewHRWfhRequest);
router.get('/notifications', getHRNotifications);
router.get('/performance', getHREmployeePerformance);
export default router;
