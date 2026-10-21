import express from 'express';

import {
  //getEmployeesForTaskAssignment,
  //getHRClients,
  //getHRMyTasks,
  //createHRMyTask,
  getHRAssignedTasks,
  createHRAssignedTask,
  updateHRTask,
  updateHRTaskRemarks,
} from '../controllers/hrControllers.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// HR-only authorization.
// Your JWT middleware must set req.user.id and req.user.role.
const hrOnly = (req, res, next) => {
  if (req.user?.role !== 'hr_manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. HR Manager permission required.',
    });
  }

  next();
};

// My Tasks
//router.get('/tasks/my', authMiddleware, hrOnly, getHRMyTasks);
//router.post('/tasks/my', authMiddleware, hrOnly, createHRMyTask);

router.get('/tasks/assigned', authMiddleware, hrOnly, getHRAssignedTasks);

router.post('/tasks/assign', authMiddleware, hrOnly, createHRAssignedTask);

router.put('/tasks/:id', authMiddleware, hrOnly, updateHRTask);

router.put('/tasks/:id/remarks', authMiddleware, hrOnly, updateHRTaskRemarks);

export default router;
