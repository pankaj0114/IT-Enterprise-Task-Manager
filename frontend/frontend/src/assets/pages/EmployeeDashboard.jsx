import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignTaskModal from './AssignTaskModal';
import '../css/TaskCard.css';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/tasks'); // ✅ fetch all tasks
        setTasks(res.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  // ✅ Filter tasks locally (always show all, filter when search/priority applied)
  const filteredTasks = tasks.filter((task) => {
    const matchesQuery =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      priorityFilter === '' || task.priority === priorityFilter;

    return matchesQuery && matchesPriority;
  });

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Employee Dashboard</h2>

      {/* ✅ Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by person or task name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="search-select"
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* ✅ Assign Task Button */}
      <button onClick={() => setShowModal(true)} className="assign-button">
        Assign Task
      </button>
      {showModal && <AssignTaskModal onClose={() => setShowModal(false)} />}

      {/* ✅ Task List */}
      <div className="task-list">
        {filteredTasks.map((task) => (
          <div
            key={task._id}
            className={`task-card priority-${task.priority.toLowerCase()}`}
          >
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>
              <strong>Assigned To:</strong> {task.assignedTo}
            </p>
            <p>
              <strong>Priority:</strong> {task.priority}
            </p>
            <p>
              <strong>Status:</strong> {task.status}
            </p>
            <p>
              <strong>Due:</strong>{' '}
              {new Date(task.dueDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* ✅ Logout Button */}
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default EmployeeDashboard;
