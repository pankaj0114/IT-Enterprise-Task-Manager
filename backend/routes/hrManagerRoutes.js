import express from 'express';
import {
  getHrEmployees,
  registerHrEmployee,
  updateHrEmployee,
  resetHrEmployeePassword,
  getHrClients,
  assignHrClient,
  getHrTasks,
  deleteHrTask,
  getHrPerformance,
  getHrAttendance,
  getHrMyAttendance,
  getMyTasks,
} from '../controllers/hrManagerController.js';
import { createMyTask } from '../controllers/hrManagerController.js';
import authMiddleware from '../middleware/authMiddleware.js';
//import authorizeRoles from '../middleware/authorizeRoles.js';

const router = express.Router();
const hrOnly = [authMiddleware];

router.get('/employees', ...hrOnly, getHrEmployees);
router.post('/employees', ...hrOnly, registerHrEmployee);
router.put('/employees/:id', ...hrOnly, updateHrEmployee);
router.put('/employees/:id/reset-password', ...hrOnly, resetHrEmployeePassword);

router.get('/clients', ...hrOnly, getHrClients);
router.put('/clients/assign', ...hrOnly, assignHrClient);

router.get('/tasks/:mode', ...hrOnly, getHrTasks);
router.put('/tasks/:id/delete', ...hrOnly, deleteHrTask);

router.get('/employee-performance', ...hrOnly, getHrPerformance);
router.get('/attendance', ...hrOnly, getHrAttendance);
router.get('/attendance/me', ...hrOnly, getHrMyAttendance);
router.post('/tasks/my', ...hrOnly, createMyTask);

router.get('/tasks/my', ...hrOnly, getMyTasks);

export default router;
