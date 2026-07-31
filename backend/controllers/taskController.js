// controllers/taskController.js
const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const { title, description, department, assignedTo, dueDate, priority } =
      req.body;

    const newTask = new Task({
      title,
      description,
      department,
      assignedTo,
      assignedBy: req.user.id, // from JWT middleware
      dueDate,
      priority,
    });

    await newTask.save();
    res
      .status(201)
      .json({ message: 'Task created successfully', task: newTask });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
