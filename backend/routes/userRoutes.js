// routes/userRoutes.js
import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Routes for User Management
 * Accessible by Admins and Super Admins
 */

// Get all users (Admin, Super Admin)

router.get('/employees', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select(
      'name email',
    );
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/', verifyToken, authorizeRoles('Admin', 'SuperAdmin'), getUsers);

// Get single user by ID (Admin, Super Admin)
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Admin', 'SuperAdmin'),
  getUserById,
);

// Create new user (Admin, Super Admin)
router.post(
  '/',
  verifyToken,
  authorizeRoles('Admin', 'SuperAdmin'),
  createUser,
);

// Update user (Admin, Super Admin)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Admin', 'SuperAdmin'),
  updateUser,
);

// Delete user (Super Admin only)
router.delete('/:id', verifyToken, authorizeRoles('SuperAdmin'), deleteUser);

export default router;
