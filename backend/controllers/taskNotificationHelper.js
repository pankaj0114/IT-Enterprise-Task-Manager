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

    const actorId = String(req.user.id);

    const assignedToId = task.assignedTo
      ? String(task.assignedTo._id || task.assignedTo)
      : '';

    const assignedById = task.assignedBy
      ? String(task.assignedBy._id || task.assignedBy)
      : '';

    console.log('========== TASK CHANGE NOTIFICATION ==========');
    console.log('Actor:', actorId);
    console.log('Assigned By:', assignedById);
    console.log('Assigned To:', assignedToId);
    console.log('Field:', fieldName);

    /*
     * SELF ASSIGNED TASK
     *
     * assignedBy === assignedTo
     *
     * Example:
     * A creates task for A
     *
     * No notification.
     */
    if (!assignedById || !assignedToId || assignedById === assignedToId) {
      console.log('Self-assigned task - no notification');
      return null;
    }

    let recipientId = null;

    /*
     * Employee B changed the task.
     *
     * B = assignedTo
     * Notify A = assignedBy
     */
    if (actorId === assignedToId) {
      recipientId = assignedById;

      console.log(
        'Assigned employee changed task. Notify assigning employee:',
        recipientId,
      );
    } else if (actorId === assignedById) {
      /*
       * Employee A changed the task.
       *
       * A = assignedBy
       * Notify B = assignedTo
       */
      recipientId = assignedToId;

      console.log(
        'Assigning employee changed task. Notify assigned employee:',
        recipientId,
      );
    }

    /*
     * The person changing the task is neither
     * assignedBy nor assignedTo.
     *
     * Do not create notification.
     */
    if (!recipientId || recipientId === actorId) {
      console.log(
        'Actor is not one of the two task employees. No notification.',
      );

      return null;
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: req.user.id,
      task: task._id,
      message: `Task "${task.title}" was updated: ${fieldName}.`,
      read: false,
    });

    await notification.save();

    console.log('TASK NOTIFICATION CREATED:', notification._id);

    /*
     * Socket.IO real-time notification
     */
    const io = req.app.get('io');

    if (io) {
      io.to(String(recipientId)).emit('newNotification', notification);

      console.log('Real-time notification emitted to:', recipientId);
    }

    return notification;
  } catch (error) {
    /*
     * Notification failure should NOT make
     * the task update itself fail.
     */
    console.error('TASK CHANGE NOTIFICATION ERROR:', error);

    return null;
  }
};
