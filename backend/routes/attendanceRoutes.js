import express from 'express';

import {
  getMyAttendance,
  markAttendance,
  requestLeave,
  getLeaveRequestsForAdmin,
  reviewLeaveRequest,
  requestWfh,
  getWfhRequestsForAdmin,
  reviewWfhRequest,
} from '../controllers/attendanceController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| EMPLOYEE
|--------------------------------------------------------------------------
*/

router.get('/my', authMiddleware, getMyAttendance);

router.put('/my', authMiddleware, markAttendance);

router.post('/leave-requests', authMiddleware, requestLeave);

router.post('/wfh-requests', authMiddleware, requestWfh);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

router.get(
  '/admin/leave-requests',
  authMiddleware,
  adminMiddleware,
  getLeaveRequestsForAdmin,
);

router.put(
  '/admin/leave-requests/:requestId',
  authMiddleware,
  adminMiddleware,
  reviewLeaveRequest,
);

router.get(
  '/admin/wfh-requests',
  authMiddleware,
  adminMiddleware,
  getWfhRequestsForAdmin,
);

router.put(
  '/admin/wfh-requests/:requestId',
  authMiddleware,
  adminMiddleware,
  reviewWfhRequest,
);

export default router;
