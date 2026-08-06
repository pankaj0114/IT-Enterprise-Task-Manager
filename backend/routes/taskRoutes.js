import express from 'express';
import Task from '../models/Task.js';
import Client from '../models/Client.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

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
      .select('title remarks dueDate priority status assignedTo assignedBy')
      .populate('assignedTo', 'email name')
      .populate('assignedBy', 'email name');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/*// ✅ Return logged-in user info
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
*/
// ✅ Assign Task
router.post('/assign', authMiddleware, async (req, res) => {
  try {
    let { title, dueDate, assignedTo, client, priority, remarks, status } =
      req.body;

    // Default due date if not provided
    if (!dueDate) {
      dueDate = new Date();
    }

    // ✅ If "me" is selected, assign to logged-in user
    if (!assignedTo || assignedTo === 'me') {
      assignedTo = req.user.id;
    }

    const task = new Task({
      title,
      remarks,
      dueDate,
      priority: priority,
      assignedTo,
      assignedBy: req.user.id, // always the logged-in user
      client: client || null,
      status: 'Not Started',
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Update Task (status, remarks, client, etc.)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { remarks, status, totalHours, totalMinutes } = req.body;
    const updateData = { status };
    if (status === 'in-progress') {
      updateData.totalHours = 0;
      updateData.totalMinutes = 0;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { remarks, totalHours, totalMinutes },
      { new: true },
      {
        returnDocument: 'after',
      },
    )
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

// Update remarks for a task
router.put('/:id/remarks', authMiddleware, async (req, res) => {
  try {
    const { remarks } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { remarks },
      { returnDocument: 'after' },
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error('Error updating remarks:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/completed-tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({
      assignedTo: userId,
      status: 'Completed',
    })
      .select('title remarks dueDate priority totalHours totalMinutes')
      .populate('assignedBy', 'email name');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching completed tasks:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
