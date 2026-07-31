import express from 'express';
import Task from '../models/Task.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
/*
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
*/

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

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after', // ✅ replaces new: true
    })
      .populate('assignedTo', 'email name')
      .populate('assignedBy', 'email name')
      .populate('client', 'name email company'); // ✅ if you added client ref

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/assign', authMiddleware, async (req, res) => {
  try {
    let { title, remarks, dueDate, priority, assignedTo, client } = req.body;

    // ✅ If "me" selected, assign to logged-in user
    if (!assignedTo || assignedTo === 'me') {
      assignedTo = req.user.id;
    }

    const task = new Task({
      title,
      remarks,
      dueDate,
      priority,
      assignedTo,
      assignedBy: req.user.id,
      client: client || null,
    });

    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
