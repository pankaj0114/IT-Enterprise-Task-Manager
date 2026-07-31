import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// Create & assign task
router.post('/assign', async (req, res) => {
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
      assignedTo,
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

// Get tasks assigned to a specific employee
// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find(); // no filter
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
