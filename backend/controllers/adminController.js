// controllers/adminController.js

import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, dateOfBirth } = req.body;

    console.log('Registration data:', req.body);

    if (!name || !email || !password || !confirmPassword || !dateOfBirth) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      dateOfBirth,
    });

    await employee.save();

    res.status(201).json({
      message: 'Employee registered successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        dateOfBirth: employee.dateOfBirth,
      },
    });
  } catch (error) {
    console.error('Register employee error:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: 'employee',
    }).select('name email dateOfBirth');

    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};
