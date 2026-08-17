import React, { useState } from 'react';
import axios from 'axios';

const InProgressAssignedTasks = ({ tasks, user, onTaskUpdated }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [editData, setEditData] = useState({
    title: '',
    remarks: '',
    priority: 'Medium',
    dueDate: '',
  });

  const inProgressTasks = tasks.filter((task) => {
    const assignedByMe =
      String(task.assignedBy?._id || task.assignedBy) === String(user?._id);

    const assignedToOther =
      String(task.assignedTo?._id || task.assignedTo) !== String(user?._id);

    return (
      assignedByMe &&
      assignedToOther &&
      (task.status === 'In Progress' || task.status === 'in-progress')
    );
  });

  const startEditing = (task) => {
    setEditingTaskId(task._id);

    setEditData({
      title: task.title || '',
      remarks: task.remarks || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '',
    });
  };

  const handleChange = (e) => {
    setEditData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const saveTask = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');

      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          title: editData.title,
          remarks: editData.remarks,
          priority: editData.priority,
          dueDate: editData.dueDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEditingTaskId(null);

      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (error) {
      console.error(
        'Error updating in-progress task:',
        error.response?.data || error.message,
      );
    }
  };

  return (
    <div className="assigned-status-page">
      <div className="page-header">
        <button onClick={() => navigate('/employee-dashboard')}>← Back</button>
        <h2>In Progress Tasks</h2>

        <p>Tasks assigned by you that are currently being worked on.</p>
      </div>

      {inProgressTasks.length === 0 ? (
        <div className="empty-state">
          <p>No in-progress tasks found.</p>
        </div>
      ) : (
        <div className="assigned-task-cards">
          {inProgressTasks.map((task) => {
            const isEditing = editingTaskId === task._id;

            return (
              <div
                className="assigned-task-card in-progress-card"
                key={task._id}
              >
                <div className="task-card-header">
                  <span className="status-badge in-progress">In Progress</span>

                  <span>
                    Assigned To:{' '}
                    <strong>{task.assignedTo?.name || 'Employee'}</strong>
                  </span>
                </div>

                <div className="task-field">
                  <label>Title</label>

                  {isEditing ? (
                    <input
                      name="title"
                      value={editData.title}
                      onChange={handleChange}
                    />
                  ) : (
                    <p>{task.title}</p>
                  )}
                </div>

                <div className="task-field">
                  <label>Remarks</label>

                  {isEditing ? (
                    <textarea
                      name="remarks"
                      value={editData.remarks}
                      onChange={handleChange}
                    />
                  ) : (
                    <p>{task.remarks || 'No remarks'}</p>
                  )}
                </div>

                <div className="task-field">
                  <label>Due Date</label>

                  {isEditing ? (
                    <input
                      type="date"
                      name="dueDate"
                      value={editData.dueDate}
                      onChange={handleChange}
                    />
                  ) : (
                    <p>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  )}
                </div>

                <div className="task-field">
                  <label>Priority</label>

                  {isEditing ? (
                    <select
                      name="priority"
                      value={editData.priority}
                      onChange={handleChange}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  ) : (
                    <p>{task.priority || 'Medium'}</p>
                  )}
                </div>

                <div className="task-field">
                  <label>Assigned To</label>

                  <p>{task.assignedTo?.name || 'N/A'}</p>
                </div>

                <div className="task-card-actions">
                  {!isEditing ? (
                    <button
                      className="edit-task-btn"
                      onClick={() => startEditing(task)}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        className="save-task-btn"
                        onClick={() => saveTask(task._id)}
                      >
                        Save
                      </button>

                      <button
                        className="cancel-task-btn"
                        onClick={() => setEditingTaskId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InProgressAssignedTasks;
