import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/extrapages.css';

const InProgressAssignedTasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarkTimers, setRemarkTimers] = useState({});

  // =====================================================
  // FETCH IN-PROGRESS ASSIGNED TASKS
  // =====================================================

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/tasks/in-progress-assigned',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('IN-PROGRESS ASSIGNED TASKS FROM API:', response.data);

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching in-progress tasks:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    fetchTasks();

    // Cleanup timers when component unmounts
    return () => {
      Object.values(remarkTimers).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  // =====================================================
  // HANDLE REMARK CHANGE
  // =====================================================

  const handleRemarkChange = (taskId, value) => {
    if (!taskId) {
      console.error('Task ID missing while editing remark');
      return;
    }

    // -----------------------------------------------------
    // UPDATE UI IMMEDIATELY
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // CLEAR PREVIOUS TIMER
    // -----------------------------------------------------

    if (remarkTimers[taskId]) {
      clearTimeout(remarkTimers[taskId]);
    }

    // -----------------------------------------------------
    // AUTO SAVE AFTER USER STOPS TYPING
    // -----------------------------------------------------

    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        console.log('Automatically saving in-progress remark:', {
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

        console.log('In-progress remark saved:', response.data);
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

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="assigned-status-page">
        <p>Loading in-progress tasks...</p>
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
              <h2>In Progress Tasks</h2>

              <span className="task-count-badge">{tasks.length}</span>
            </div>

            <p>Tasks assigned by you that are currently being worked on.</p>
          </div>
        </div>
      </div>

      {/* =================================================
          TASK CARDS
      ================================================= */}

      {tasks.length === 0 ? (
        <div className="no-tasks-message">No in-progress tasks found.</div>
      ) : (
        <div className="assigned-task-cards">
          {tasks.map((task) => (
            <div className="assigned-task-card in-progress-card" key={task._id}>
              {/* =================================================
                  STATUS
              ================================================= */}

              <div className="pending-card-top">
                <span className="status-badge in-progress">In Progress</span>
              </div>

              {/* =================================================
                  TASK INFORMATION
              ================================================= */}

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

              {/* =================================================
                  ONLY REMARKS IS EDITABLE
              ================================================= */}

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

export default InProgressAssignedTasks;
