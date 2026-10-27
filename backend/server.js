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
import adminRoutes from './routes/adminRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
//import hrManagerRoutes from './routes/hrManagerRoutes.js';
import hrRoutes from './routes/hrRoutes.js';

import adminAttendanceRoutes from './routes/adminAttendanceRoutes.js';

//import adminTaskRoutes from './routes/adminTaskRoutes.js';
//import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();
dns.setServers(['1.1.1.1', '8.8.8.8']);
const app = express();

// ========================================
// CORS
// ========================================

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(express.json());
//app.use('/api/notifications', notificationRoutes);

const server = http.createServer(app);

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

// Make Socket.IO available in routes
app.set('io', io);

// ========================================
// SOCKET CONNECTION
// ========================================

io.on('connection', (socket) => {
  console.log('🟢 SOCKET CONNECTED:', socket.id);

  socket.on('join', async (userId, acknowledge) => {
    try {
      if (!userId) {
        console.error('❌ Socket join called without userId');

        if (typeof acknowledge === 'function') {
          acknowledge({ success: false, message: 'Missing userId' });
        }

        return;
      }

      const roomId = String(userId);
      await socket.join(roomId);

      console.log('✅ SOCKET ROOM JOINED');
      console.log('Socket ID:', socket.id);
      console.log('Room ID:', roomId);
      console.log('Rooms:', [...socket.rooms]);

      if (typeof acknowledge === 'function') {
        acknowledge({ success: true, roomId });
      }
    } catch (error) {
      console.error('❌ SOCKET ROOM JOIN FAILED:', error);

      if (typeof acknowledge === 'function') {
        acknowledge({ success: false, message: error.message });
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔴 SOCKET DISCONNECTED:', socket.id);
    console.log('Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ SOCKET ERROR:', error);
  });
});

// ✅ Mount routes
// app.use('/api/departments', departmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/hr', hrRoutes);

app.use('/api/admin/attendance', adminAttendanceRoutes);
// app.use('/api/hr-manager', hrManagerRoutes);

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
