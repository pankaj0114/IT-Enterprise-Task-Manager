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
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
