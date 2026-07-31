// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js'; // ✅ Import your User model

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

// Logout user
router.post('/logout', logoutUser);

export default router;
