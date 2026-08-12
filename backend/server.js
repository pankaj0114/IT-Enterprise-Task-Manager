import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import cors from 'cors';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { setServers } from 'node:dns/promises';
import notificationRoutes from './routes/notificationRoutes.js';

import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
//import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import clientRoutes from './routes/clientRoutes.js';

dotenv.config();
dns.setServers(['1.1.1.1', '8.8.8.8']);
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // join room for this user (use their userId)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
});

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
app.use('/api/clients', clientRoutes);

// Database connection
connectDB();

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
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
