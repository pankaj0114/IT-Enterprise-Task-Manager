import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

import {
  registerEmployee,
  getEmployees,
} from '../controllers/adminController.js';

//import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register-employee',
  authMiddleware,
  adminMiddleware,
  registerEmployee,
);

router.get('/employees', authMiddleware, adminMiddleware, getEmployees);

export default router;
