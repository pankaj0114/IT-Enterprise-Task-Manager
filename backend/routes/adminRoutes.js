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
} from '../controllers/adminController.js';

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

export default router;
