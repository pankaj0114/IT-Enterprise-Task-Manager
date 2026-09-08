import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

import {
  registerEmployee,
  getEmployees,
  getAdminClients,
  assignClientToEmployees,
  createClient,
  getAllAdminTasks,
  deleteAdminTask,
  getEmployeePerformance,
  resetEmployeePassword,
} from '../controllers/adminController.js';

import {
  getMyTasks,
  getAssignedTasks,
  createMyTask,
  getAllClients,
  updateTaskStatus,
} from '../controllers/adminTaskController.js';

//import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register-employee',
  authMiddleware,
  adminMiddleware,
  registerEmployee,
);

router.get('/clients', authMiddleware, adminMiddleware, getAdminClients);

router.post('/clients', authMiddleware, adminMiddleware, createClient);

router.put(
  '/clients/assign',
  authMiddleware,
  adminMiddleware,
  assignClientToEmployees,
);
router.get('/tasks', authMiddleware, adminMiddleware, getAllAdminTasks);

router.delete('/tasks/:id', authMiddleware, adminMiddleware, deleteAdminTask);
router.get('/employees', authMiddleware, adminMiddleware, getEmployees);

router.get(
  '/employee-performance',
  authMiddleware,
  adminMiddleware,
  getEmployeePerformance,
);

router.get('/tasks', authMiddleware, adminMiddleware, getAllAdminTasks);

// =====================================================
// GET MY TASKS
// Tasks assigned TO the logged-in admin
// GET /api/admin/tasks/my
// =====================================================

router.get('/tasks/my', authMiddleware, adminMiddleware, getMyTasks);

// =====================================================
// GET ASSIGNED TASKS
// Tasks assigned BY the logged-in admin
// GET /api/admin/tasks/assigned
// =====================================================

router.get(
  '/tasks/assigned',
  authMiddleware,
  adminMiddleware,
  getAssignedTasks,
);

router.post('/tasks/my', authMiddleware, adminMiddleware, createMyTask);

//router.get('/clients', authMiddleware, adminMiddleware, getAdminClients);
router.get('/clients', authMiddleware, adminMiddleware, getAllClients);

router.put(
  '/tasks/:taskId/status',
  authMiddleware,
  adminMiddleware,
  updateTaskStatus,
);

router.put(
  '/employees/:employeeId/reset-password',
  authMiddleware,
  adminMiddleware,
  resetEmployeePassword,
);

export default router;
