import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/AssignTaskPage.css';

const AssignTaskPage = ({ user, clients, employees, setActiveTab }) => {
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
    try {
      const token = localStorage.getItem('accessToken');

      // Default due date = today if not selected
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

      const res = await axios.post(
        'http://localhost:5000/api/tasks/assign',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Redirect logic
      if (task.assignedTo === 'me') {
        setActiveTab('myTasks'); // show logged-in user's tasks
      } else {
        setActiveTab('myTasks'); // show tasks of selected employee
        // You can filter tasks by that employee’s ID in your MyTasks component
      }

      // Reset form
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
    </div>
  );
};

export default AssignTaskPage;
