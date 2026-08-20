import express from 'express';
import Notification from '../models/Notification.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching notifications for:', req.user.id);

    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate('sender', 'name email')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    console.log('Notifications found:', notifications.length);

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user.id,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      },
    );

    console.log('Notifications marked as read:', result.modifiedCount);

    res.status(200).json({
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      message: 'Notification deleted successfully',
      notificationId,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);

    res.status(500).json({
      message: 'Server error while deleting notification',
    });
  }
});

export default router;
