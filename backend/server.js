import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dns from 'node:dns';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
//import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

dotenv.config();
dns.setServers(['1.1.1.1', '1.0.0.1']); // Cloudflare DNS

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

// ✅ Mount routes
// app.use('/api/departments', departmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Internal Task Management API running 🚀' });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
