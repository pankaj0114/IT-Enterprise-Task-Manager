import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/extrapages.css';

const PendingAssignedTasks = () => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user');

  let loggedInUser = null;

  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Invalid user data:', error);
  }

  const [user] = useState(loggedInUser);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editedTasks, setEditedTasks] = useState({});
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/tasks/pending-assigned',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('PENDING TASKS FROM API:', response.data);

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching pending tasks:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);
  const handleFieldChange = (taskId, field, value) => {
    // Store changes separately
    setEditedTasks((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));

    // Update the card immediately in frontend
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              [field]: value,
            }
          : task,
      ),
    );
  };
  const handleUpdateTask = async (taskId, changes) => {
    try {
      if (!taskId) {
        console.error('Task ID is missing:', taskId);
        return;
      }

      console.log('Updating task:', taskId);
      console.log('Changes:', changes);

      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        changes,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Task updated:', response.data);

      // Update the card immediately
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          String(task._id) === String(taskId)
            ? {
                ...task,
                ...response.data,
              }
            : task,
        ),
      );
    } catch (error) {
      console.error(
        'Error updating pending task:',
        error.response?.data || error.message,
      );
    }
  };

  const pendingTasks = tasks;

  if (loading) {
    return (
      <div className="assigned-status-page">
        <p>Loading pending tasks...</p>
      </div>
    );
  }

  return (
    <div className="assigned-status-page">
      <div className="page-header">
        <button onClick={() => navigate('/employee-dashboard')}>← Back</button>

        <h2>Pending Tasks</h2>

        <p>Tasks assigned by you that have not been started.</p>
      </div>

      {pendingTasks.length === 0 ? (
        <p>No pending tasks found.</p>
      ) : (
        <div className="assigned-task-cards">
          {pendingTasks.map((task) => (
            <div className="assigned-task-card pending-card" key={task._id}>
              <span className="status-badge pending">Pending</span>

              <div className="pending-task-field">
                <label>Task Title</label>
                <input
                  type="text"
                  value={task.title || ''}
                  onChange={(e) =>
                    handleFieldChange(task._id, 'title', e.target.value)
                  }
                />
              </div>

              <div className="pending-task-field">
                <label>Remarks</label>
                <textarea
                  value={task.remarks || ''}
                  onChange={(e) =>
                    handleFieldChange(task._id, 'remarks', e.target.value)
                  }
                />
              </div>

              <div className="pending-task-field">
                <label>Due Date</label>
                <input
                  type="date"
                  value={
                    task.dueDate
                      ? new Date(task.dueDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    handleFieldChange(task._id, 'dueDate', e.target.value)
                  }
                />
              </div>

              <div className="pending-task-field">
                <label>Priority</label>
                <select
                  value={task.priority || 'Medium'}
                  onChange={(e) =>
                    handleFieldChange(task._id, 'priority', e.target.value)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <p>
                <strong>Assigned To:</strong> {task.assignedTo?.name || 'N/A'}
              </p>

              <button
                type="button"
                onClick={() =>
                  handleUpdateTask(task._id, {
                    title: task.title,
                    remarks: task.remarks,
                    dueDate: task.dueDate,
                    priority: task.priority,
                  })
                }
              >
                Update
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingAssignedTasks;
