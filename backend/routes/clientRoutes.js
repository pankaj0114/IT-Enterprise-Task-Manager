import express from 'express';
import Client from '../models/Client.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Add new client (HR only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, company, phone, notes } = req.body;

    const client = new Client({
      name,
      email,
      company,
      phone,
      notes,
    });

    await client.save();
    res.status(201).json({ message: 'Client added successfully', client });
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get all clients
router.get('/my-clients', authMiddleware, async (req, res) => {
  try {
    console.log('Employee requesting clients:', req.user.id);

    const clients = await Client.find({
      assignedTo: req.user.id,
    })
      .select('name email company')
      .sort({ createdAt: -1 });

    console.log('Clients returned to employee:', clients);

    return res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching employee clients:', error);

    return res.status(500).json({
      message: 'Failed to fetch assigned clients.',
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const clients = await Client.find()
      .select('name email company')
      .sort({ createdAt: -1 });

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);

    res.status(500).json({
      message: 'Failed to fetch clients',
    });
  }
});

export default router;
