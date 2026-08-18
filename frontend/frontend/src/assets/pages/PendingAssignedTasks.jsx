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

  const [remarkTimers, setRemarkTimers] = useState({});

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

  const handleRemarkChange = (taskId, value) => {
    if (!taskId) {
      console.error('Task ID missing while editing remark');
      return;
    }

    // Immediately update UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        String(task._id) === String(taskId)
          ? {
              ...task,
              remarks: value,
            }
          : task,
      ),
    );

    // Clear previous timer for this task
    if (remarkTimers[taskId]) {
      clearTimeout(remarkTimers[taskId]);
    }

    // Save after user stops typing
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        console.log('Automatically saving remark:', {
          taskId,
          remarks: value,
        });

        const response = await axios.put(
          `http://localhost:5000/api/tasks/${taskId}`,
          {
            remarks: value,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        console.log('Remark saved:', response.data);
      } catch (error) {
        console.error(
          'Error automatically saving remark:',
          error.response?.data || error.message,
        );
      }
    }, 700);

    setRemarkTimers((prev) => ({
      ...prev,
      [taskId]: timer,
    }));
  };

  const saveRemark = async (taskId, remarks) => {
    try {
      if (!taskId) {
        console.error('Task ID is missing:', taskId);
        return;
      }

      const token = localStorage.getItem('accessToken');

      console.log('Saving remark:', {
        taskId,
        remarks,
      });

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          remarks,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Remark saved successfully:', response.data);

      // Keep frontend synchronized with database
      if (response.data.task) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            String(task._id) === String(taskId) ? response.data.task : task,
          ),
        );
      }
    } catch (error) {
      console.error(
        'Error automatically saving remark:',
        error.response?.data || error.message,
      );
    }
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
      {/* ================= HEADER ================= */}
      <div className="status-page-header">
        <button
          type="button"
          className="status-back-button"
          onClick={() => navigate('/employee-dashboard')}
        >
          <span className="back-arrow">←</span>
          Back to Dashboard
        </button>

        <div className="status-header-content">
          <div>
            <div className="status-title-row">
              <h2>Pending Tasks</h2>

              <span className="task-count-badge">{pendingTasks.length}</span>
            </div>

            <p>Tasks assigned by you that are waiting to be started.</p>
          </div>
        </div>
      </div>

      {/* ================= TASK CARDS ================= */}
      {pendingTasks.length === 0 ? (
        <div className="no-tasks-message">No pending tasks found.</div>
      ) : (
        <div className="assigned-task-cards">
          {pendingTasks.map((task) => (
            <div className="assigned-task-card pending-card" key={task._id}>
              {/* Status */}
              <div className="pending-card-top">
                <span className="status-badge pending">Pending</span>
              </div>

              {/* Task Information */}
              <div className="pending-task-info">
                <p>
                  <strong>Title:</strong> {task.title || 'No title'}
                </p>

                <p>
                  <strong>Due Date:</strong>{' '}
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'No due date'}
                </p>

                <p>
                  <strong>Priority:</strong> {task.priority || 'Medium'}
                </p>

                <p>
                  <strong>Assigned To:</strong> {task.assignedTo?.name || 'N/A'}
                </p>

                <p>
                  <strong>Assigned By:</strong> {task.assignedBy?.name || 'Me'}
                </p>
              </div>

              {/* Editable Remarks */}
              <div className="pending-remarks">
                <label>
                  <strong>Remarks:</strong>
                </label>

                <textarea
                  value={task.remarks || ''}
                  onChange={(e) => handleRemarkChange(task._id, e.target.value)}
                  placeholder="Add remarks..."
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingAssignedTasks;
