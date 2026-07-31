import { useState } from 'react';
import axios from 'axios';
import '../css/HRDashboard.css';

export default function HRDashboard() {
  const [showPopup, setShowPopup] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(
        'http://localhost:5000/api/tasks/create',
        taskData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessage(res.data.message);
      setShowPopup(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating task');
    }
  };

  return (
    <div className="hr-dashboard">
      <h2>HR Manager Dashboard</h2>
      <button onClick={() => setShowPopup(true)}>Assign Task</button>

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Assign Task</h3>
            <form onSubmit={handleSubmit}>
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={taskData.title}
                onChange={handleChange}
                required
              />

              <label>Description</label>
              <textarea
                name="description"
                value={taskData.description}
                onChange={handleChange}
              ></textarea>

              <label>Assign To (User ID)</label>
              <input
                type="text"
                name="assignedTo"
                value={taskData.assignedTo}
                onChange={handleChange}
                required
              />

              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={taskData.dueDate}
                onChange={handleChange}
                required
              />

              <label>Priority</label>
              <select
                name="priority"
                value={taskData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <button type="submit">Create Task</button>
              <button type="button" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
}
