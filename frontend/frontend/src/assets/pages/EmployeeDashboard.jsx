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
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(
          'http://localhost:5000/api/tasks/my-tasks',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setTasks(res.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  // ✅ Local filtering (search + priority)
  const filteredTasks = tasks.filter((task) => {
    const matchesQuery =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assignedTo?.email || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

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

      {/* ✅ Task Table */}
      <table className="task-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Assigned To</th>
            <th>Assigned By</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => (
            <tr key={task._id}>
              <td>{task.title}</td>
              <td>{task.description}</td>
              <td>{task.priority}</td>
              <td>{task.status}</td>
              <td>{new Date(task.dueDate).toLocaleDateString()}</td>
              <td>{task.assignedTo?.email || 'N/A'}</td>
              <td>{task.assignedBy?.email || 'N/A'}</td>
              <td>
                {task.tags.map((tag, idx) => (
                  <span key={idx} className="tag-box">
                    {tag}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Logout Button */}
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default EmployeeDashboard;
