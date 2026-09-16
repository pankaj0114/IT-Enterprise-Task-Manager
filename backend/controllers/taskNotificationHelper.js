import Notification from '../models/Notification.js';

export const createTaskChangeNotification = async ({
  req,
  task,
  fieldName,
}) => {
  try {
    if (!req?.user?.id || !task) {
      return null;
    }

    const actorId = req.user.id.toString();

    const assignedToId = task.assignedTo?.toString();

    const assignedById = task.assignedBy?.toString();

    // Self-created / self-assigned task
    if (!assignedToId || !assignedById || assignedToId === assignedById) {
      console.log('Self-assigned task → no change notification');

      return null;
    }

    let recipientId = null;

    // Assignee changed the task
    if (actorId === assignedToId) {
      recipientId = assignedById;
    }

    // Assigner changed the task
    else if (actorId === assignedById) {
      recipientId = assignedToId;
    }

    if (!recipientId || recipientId === actorId) {
      return null;
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: req.user.id,
      task: task._id,
      message: `Task "${task.title}" was updated: ${fieldName}.`,
    });

    await notification.save();

    console.log('Task change notification created:', notification._id);

    const io = req.app.get('io');

    if (io) {
      io.to(recipientId).emit('newNotification', notification);
    }

    return notification;
  } catch (error) {
    console.error('TASK CHANGE NOTIFICATION ERROR:', error);

    // Do not make task update fail just because
    // notification creation failed.
    return null;
  }
};
