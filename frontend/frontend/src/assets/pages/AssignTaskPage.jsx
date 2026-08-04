import React, { useState } from 'react';
import axios from 'axios';
import '../css/AssignTaskPage.css';

const AssignTaskPage = ({ user, clients, employees, setActiveTab }) => {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [task, setTask] = useState({
    title: '',
    remarks: '',
    dueDate: '',
    client: '',
    priority: 'Medium',
    assignedTo: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!task.title.trim()) {
      setErrorMessage('Please enter the task title');
      setShowSuccessPopup(false); // don’t show success
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const dueDate = task.dueDate || new Date().toISOString().substring(0, 10);

      const payload = {
        title: task.title,
        remarks: task.remarks,
        dueDate,
        client: task.client || null,
        priority: task.priority,
        assignedTo: task.assignedTo === 'me' ? user._id : task.assignedTo,
        assignedBy: user._id,
      };

      await axios.post('http://localhost:5000/api/tasks/assign', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setErrorMessage('');
      setActiveTab('myTasks');

      setTask({
        title: '',
        remarks: '',
        dueDate: '',
        client: '',
        priority: 'Medium',
        assignedTo: '',
      });
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  return (
    <div className="assign-task-page">
      <h2>Create New Task</h2>

      {/* Form fields */}
      <div className="form-group">
        <label>Task Title</label>
        <input
          type="text"
          name="title"
          value={task.title}
          onChange={handleChange}
          placeholder="Enter task title"
        />
      </div>

      <div className="form-group">
        <label>Remarks</label>
        <textarea
          name="remarks"
          value={task.remarks}
          onChange={handleChange}
          placeholder="Add remarks..."
        />
      </div>

      <div className="form-group">
        <label>Due Date</label>
        <input
          type="date"
          name="dueDate"
          value={task.dueDate}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Client</label>
        <select name="client" value={task.client} onChange={handleChange}>
          <option value="">-- Select Client --</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Priority</label>
        <select name="priority" value={task.priority} onChange={handleChange}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="form-group">
        <label>Assign To</label>
        <select
          name="assignedTo"
          value={task.assignedTo}
          onChange={handleChange}
        >
          <option value="">-- Select Employee --</option>
          <option value="me">Me</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button
          onClick={() =>
            setTask({
              title: '',
              remarks: '',
              dueDate: '',
              client: '',
              priority: 'Medium',
              assignedTo: '',
            })
          }
        >
          Cancel
        </button>
        <button onClick={handleSubmit}>Assign Task</button>
      </div>

      {errorMessage && (
        <div className="popup error">
          <h3>Error</h3>
          <p>{errorMessage}</p>
          <button
            className="popup-error-close"
            onClick={() => setErrorMessage('')}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignTaskPage;
