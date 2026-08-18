import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/extrapages.css';

const CompletedAssignedTasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH COMPLETED ASSIGNED TASKS
  // =====================================================

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/tasks/completed-assigned',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('COMPLETED ASSIGNED TASKS FROM API:', response.data);

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching completed assigned tasks:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH WHEN PAGE LOADS
  // =====================================================

  useEffect(() => {
    fetchTasks();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="assigned-status-page">
        <p>Loading completed tasks...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="assigned-status-page">
      {/* =================================================
          HEADER
      ================================================= */}

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
              <h2>Completed Tasks</h2>

              <span className="task-count-badge">{tasks.length}</span>
            </div>

            <p>Tasks assigned by you that have been completed by employees.</p>
          </div>
        </div>
      </div>

      {/* =================================================
          TASK CARDS
      ================================================= */}

      {tasks.length === 0 ? (
        <div className="no-tasks-message">No completed tasks found.</div>
      ) : (
        <div className="assigned-task-cards">
          {tasks.map((task) => (
            <div className="assigned-task-card completed-card" key={task._id}>
              {/* =================================================
                  STATUS
              ================================================= */}

              <div className="pending-card-top">
                <span className="status-badge completed">Completed</span>
              </div>

              {/* =================================================
                  TASK INFORMATION
              ================================================= */}

              <div className="pending-task-info">
                <p>
                  <strong>Title:</strong> {task.title || 'No title'}
                </p>

                <p>
                  <strong>Remarks:</strong> {task.remarks || 'No remarks'}
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

              {/* =================================================
                  COMPLETION TIME
              ================================================= */}

              <div className="completed-time-section">
                <div className="completed-time-header">
                  <strong>Time Taken</strong>
                </div>

                <div className="completed-time-details">
                  <div className="time-box">
                    <span className="time-value">{task.totalHours ?? 0}</span>

                    <span className="time-label">Hours</span>
                  </div>

                  <div className="time-separator">:</div>

                  <div className="time-box">
                    <span className="time-value">{task.totalMinutes ?? 0}</span>

                    <span className="time-label">Minutes</span>
                  </div>
                </div>

                <div className="total-time-text">
                  Total time:{' '}
                  <strong>
                    {task.totalHours ?? 0} hours {task.totalMinutes ?? 0}{' '}
                    minutes
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedAssignedTasks;
