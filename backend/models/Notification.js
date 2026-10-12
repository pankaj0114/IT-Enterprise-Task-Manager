import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: 'system',
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

// Automatically delete the 10 oldest notifications
// when a recipient has more than 100 notifications.
NotificationSchema.post('save', async function (notification) {
  try {
    const Notification = mongoose.model('Notification');
    const recipientId = notification.recipient;

    const count = await Notification.countDocuments({
      recipient: recipientId,
    });

    // Keep all notifications when the count is 100 or fewer.
    if (count <= 100) {
      return;
    }

    const oldestNotifications = await Notification.find({
      recipient: recipientId,
    })
      .sort({ createdAt: 1, _id: 1 })
      .limit(10)
      .select('_id')
      .lean();

    if (oldestNotifications.length > 0) {
      await Notification.deleteMany({
        recipient: recipientId,
        _id: {
          $in: oldestNotifications.map((item) => item._id),
        },
      });

      console.log(
        `Deleted ${oldestNotifications.length} oldest notifications for recipient ${recipientId}`,
      );
    }
  } catch (error) {
    console.error('Notification cleanup error:', error);
  }
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
