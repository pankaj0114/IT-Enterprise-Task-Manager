// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js'; // ✅ Import your User model
import authMiddleware from '../middleware/authMiddleware.js';

import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
// Login existing user
router.post('/login', loginUser);

// Refresh access token
router.post('/refresh', refreshToken);
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout user
router.post('/logout', logoutUser);

export default router;
