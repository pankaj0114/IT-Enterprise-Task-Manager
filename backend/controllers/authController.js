import User from '../models/User.js';
import bcrypt from 'bcryptjs'; // use bcryptjs
import jwt from 'jsonwebtoken';

// Register new user

export const registerUser = async (req, res) => {
  console.log('🔥 registerUser controller reached');
  console.log('Request body:', req.body);

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    console.log('Existing user:', existingUser);

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Password hashed successfully');

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    console.log('Saving user...');

    await newUser.save();

    console.log('User saved successfully');

    return res.status(201).json({
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('❌ REGISTER ERROR:', error);

    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};
// ✅ Login controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    // ✅ Include email + role in payload
    const accessToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '3h' },
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      accessToken,
      refreshToken,
      role: user.role,
      name: user.name,
      email: user.email, // ✅ send email explicitly too
      id: user._id,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Refresh token controller
export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token)
    return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );
    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// ✅ Logout user (must be exported)
export const logoutUser = async (req, res) => {
  // If you’re not storing refresh tokens in DB, you can just respond success
  res.json({ message: 'Logged out successfully' });
};
