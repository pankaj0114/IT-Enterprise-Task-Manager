import React, { useState } from 'react';
import axios from 'axios';
import '../css/AssignTaskPage.css';

const AssignTaskPage = ({
  user,
  clients,
  employees,
  onTaskCreated,
  setActiveTab,
}) => {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [task, setTask] = useState({
    title: '',
    remarks: '',
    dueDate: '',
    client: '',
    priority: 'Medium',
    assignedTo: '',
    client: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // validations
      if (!task.title.trim()) {
        setErrorMessage('Please enter task title');
        return;
      }

      if (!task.dueDate) {
        setErrorMessage('Please select due date');
        return;
      }

      if (!task.priority) {
        setErrorMessage('Please select priority');
        return;
      }

      if (!task.assignedTo) {
        setErrorMessage('Please select an employee');
        return;
      }

      if (!task.client) {
        setErrorMessage('Please select a client');
        return;
      }
      // token
      const token = localStorage.getItem('accessToken');

      const payload = {
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        assignedTo: task.assignedTo,
        client: task.client,
      };

      console.log('Sending task:', payload);

      const response = await axios.post(
        'http://localhost:5000/api/tasks/assign',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Task created:', response.data);

      if (onTaskCreated) {
        await onTaskCreated();
      }

      // Reset form
      setTask({
        title: '',
        dueDate: '',
        priority: 'Medium',
        assignedTo: '',
        client: '',
      });
    } catch (error) {
      console.error(
        'Error assigning task:',
        error.response?.data || error.message,
      );

      setErrorMessage(error.response?.data?.message || 'Error assigning task');
    }
  };

  return (
    <div className="assign-task-page">
      <h2>Create New Task</h2>

      <div className="task-form-grid">
        {/* Task Title */}
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

        {/* Due Date */}
        <div className="form-group">
          <label>Due Date</label>

          <input
            type="date"
            name="dueDate"
            value={task.dueDate}
            onChange={handleChange}
          />
        </div>

        {/* Priority */}
        <div className="form-group">
          <label>Priority</label>

          <select name="priority" value={task.priority} onChange={handleChange}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Client */}
        <div className="form-group">
          <label>Client</label>

          <select name="client" value={task.client} onChange={handleChange}>
            <option value="">-- Select Client --</option>

            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assign To */}
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
      </div>

      {/* Buttons */}
      <div className="form-actions">
        <button
          type="button"
          className="cancel-btn"
          onClick={() =>
            setTask({
              title: '',
              dueDate: '',
              priority: 'Medium',
              assignedTo: '',
            })
          }
        >
          Cancel
        </button>

        <button type="button" className="assign-btn" onClick={handleSubmit}>
          Add Task
        </button>
      </div>

      {/* Error Popup */}
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
