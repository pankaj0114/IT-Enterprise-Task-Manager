import express from 'express';
import Task from '../models/Task.js';
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
    let { title, dueDate, assignedTo, client, priority } = req.body;

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
      dueDate,
      priority: priority || 'MEDIUM',
      assignedTo,
      assignedBy: req.user.id, // always the logged-in user
      client: client || null,
      status: 'Not Started',
      remarks: '',
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
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('client', 'name email company');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
