import express from 'express';
import Task from '../models/Task.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Create & assign task (requires auth so we know who is assigning)
router.post('/assign', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      assignDate,
      dueDate,
      estimatedHours,
      priority,
      tags,
    } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo, // employee ID
      assignedBy: req.user.id, // ✅ logged-in user ID from token
      assignDate,
      dueDate,
      estimatedHours,
      priority,
      tags,
    });

    await task.save();
    res.status(201).json({ message: 'Task assigned successfully', task });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get all tasks (for admin/debug)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'email name')
      .populate('assignedBy', 'email name');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get tasks for logged-in user (assigned to OR assigned by)
router.get('/my-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({
      $or: [{ assignedTo: userId }, { assignedBy: userId }],
    })
      .populate('assignedTo', 'email name')
      .populate('assignedBy', 'email name');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
