import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/EmployeeDashboard.css';
import '../css/Popup.css';
import '../css/MyTaskform.css';
import '../css/AssignTaskPage.css';
import AssignTaskPage from './AssignTaskPage';
import DatePicker from 'react-datepicker';
import { useRef } from 'react';

import {
  MdDashboard,
  MdListAlt,
  MdEdit,
  MdOutlineNearMe,
  MdOutlineChecklist,
} from 'react-icons/md';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('myTasks');
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTaskId, setPopupTaskId] = useState(null);
  const [hours, setHours] = useState('');
  //const [totalHours, setTotalHours] = useState('');
  //const [totalMinutes, setTotalMinutes] = useState('');
  const [typingTimeouts, setTypingTimeouts] = useState({});
  //const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [minutes, setMinutes] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const remarkTimeouts = useRef({});
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    assignedTo: '',
    priority: 'Medium',
    remarks: '',
    client: '',
  });

  const openPopup = (taskId) => {
    setSelectedTaskId(taskId);
    setShowPopup(true);
  };

  // ✅ Fetch functions
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
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('http://localhost:5000/api/tasks/my-tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('http://localhost:5000/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(res.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleRemarkChange = (taskId, value) => {
    // Update UI immediately
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, remarks: value } : task,
      ),
    );

    // Cancel previous timer for this task
    if (remarkTimeouts.current[taskId]) {
      clearTimeout(remarkTimeouts.current[taskId]);
    }

    // Start a new 1-second timer
    remarkTimeouts.current[taskId] = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        await axios.put(
          `http://localhost:5000/api/tasks/${taskId}/remarks`,
          {
            remarks: value,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        //console.log(`Remark automatically saved for task ${taskId}`);
      } catch (error) {
        console.error(
          'Error automatically saving remark:',
          error.response?.data || error.message,
        );
      }

      // Remove timer reference
      delete remarkTimeouts.current[taskId];
    }, 1000);
  };

  const fetchCompletedTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/tasks/completed-tasks',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      //console.log('COMPLETED TASKS API RESPONSE:', response.data);

      setCompletedTasks(response.data);
    } catch (error) {
      console.error(
        'Error fetching completed tasks:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    if (activeTab === 'completed') {
      fetchCompletedTasks();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('http://localhost:5000/api/users/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchEmployees();
    fetchUser();
  }, [activeTab]);

  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.title || newTask.title.trim() === '') {
        alert('Please add a task title'); // show message
        return; // stop execution
      }
      const token = localStorage.getItem('accessToken');
      const payload = {
        title: newTask.title,
        dueDate: newTask.dueDate || new Date(newTask.dueDate),
        client: newTask.client, // ✅ include client directly
        priority: newTask.priority || 'Medium',
        assignedTo: user._id, // ✅ use actual ObjectId
        assignedBy: user._id, // ✅ use actual ObjectId
        remarks: newTask.remarks || '',
        issueDate: new Date().toISOString().substring(0, 10),
      };
      await axios.post('http://localhost:5000/api/tasks/assign', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewTask({
        title: '',
        dueDate: '',
        assignedTo: '',
        priority: 'Medium',
        client: '',
      });
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleTaskChange = async (e, taskId) => {
    const { name, value } = e.target;

    // Update local state immediately
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t._id === taskId ? { ...t, [name]: value } : t)),
    );
    if (name === 'status' && value.toLowerCase() === 'completed') {
      setPopupTaskId(taskId);
      setShowPopup(true);
      return; // wait for popup input before saving
    }

    try {
      const token = localStorage.getItem('accessToken');
      const taskToUpdate = tasks.find((t) => t._id === taskId);

      const payload = {
        title: taskToUpdate.title,
        dueDate: taskToUpdate.dueDate,
        assignedBy: taskToUpdate.assignedBy,
        priority: taskToUpdate.priority,
        status: name === 'status' ? value : taskToUpdate.status,
        client: newTask.client,
        remarks: name === 'remarks' ? value : taskToUpdate.remarks || '',
        assignedTo: taskToUpdate.assignedTo?._id || taskToUpdate.assignedTo,
      };

      const res = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Replace with backend response
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === taskId ? res.data : t)),
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateIssueDate = async (taskId, newDate) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { issueDate: newDate },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Error updating issue date:', err);
    }
  };

  const handleCompleteTask = async () => {
    try {
      const totalHours = Number(hours);
      const totalMinutes = Number(minutes);
      /*
      console.log('========== COMPLETE TASK ==========');
      console.log('Selected Task ID:', selectedTaskId);
      console.log('Hours:', totalHours);
      console.log('Minutes:', totalMinutes);
      */

      if (!Number.isFinite(totalHours) || !Number.isFinite(totalMinutes)) {
        alert('Please enter valid hours and minutes.');
        return;
      }

      if (totalHours < 0) {
        alert('Hours cannot be negative.');
        return;
      }

      if (totalMinutes < 0 || totalMinutes > 59) {
        alert('Minutes must be between 0 and 59.');
        return;
      }

      const payload = {
        status: 'Completed',
        totalHours,
        totalMinutes,
      };

      //console.log('Sending payload:', payload);

      const token = localStorage.getItem('accessToken');

      const res = await axios.put(
        `http://localhost:5000/api/tasks/${selectedTaskId}/complete`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      //console.log('API RESPONSE:', res.data);
      //console.log('UPDATED TASK:', res.data.task);

      // IMPORTANT
      const updatedTask = res.data.task;

      setTasks((prev) =>
        prev.map((task) => (task._id === selectedTaskId ? updatedTask : task)),
      );

      setShowPopup(false);
      setSelectedTaskId(null);
      setHours('');
      setMinutes('');
    } catch (error) {
      console.error(
        'Error completing task:',
        error.response?.data || error.message,
      );
    }
  };

  const handleUpdateTask = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const task = tasks.find((t) => t._id === taskId);

      const res = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          remarks: task.remarks || '',
          client: task.client,
          status: task.status,
          assignedTo: task.assignedTo?._id || task.assignedTo,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // ✅ Update state directly with backend response
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === taskId ? res.data : t)),
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };
  /*
  const markUncomplete = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status: 'in-progress' }, // or "to-do"
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Error marking uncomplete:', err);
    }
  };
  */

  const handleUncompleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/uncomplete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      //console.log('UNCOMPLETED TASK:', response.data);

      const updatedTask = response.data.task;

      // Remove it from completed tasks
      setCompletedTasks((prev) => prev.filter((task) => task._id !== taskId));

      // Update main tasks state if you use it elsewhere
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task)),
      );
    } catch (error) {
      console.error(
        'Error uncompleting task:',
        error.response?.data || error.message,
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  return (
    <div className="employee-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="employee-info">
          {user ? <h3>{user.name}</h3> : <h3>Loading...</h3>}
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
        <ul>
          <li
            onClick={() => setActiveTab('myTasks')}
            className={activeTab === 'myTasks' ? 'active' : ''}
          >
            <MdListAlt style={{ marginRight: '8px' }} />
            My Tasks
          </li>
          <li
            onClick={() => setActiveTab('assignedTasks')}
            className={activeTab === 'assignedTasks' ? 'active' : ''}
          >
            <MdOutlineNearMe style={{ marginRight: '8px' }} />
            Assigned Task
          </li>

          <li
            onClick={() => {
              setActiveTab('completedTasks');
              fetchCompletedTasks();
            }}
            className={activeTab === 'completedTasks' ? 'active' : ''}
          >
            <MdOutlineChecklist style={{ marginRight: '8px' }} />
            Completed Tasks
          </li>
          <li
            onClick={() => setActiveTab('clients')}
            className={activeTab === 'clients' ? 'active' : ''}
          >
            Clients
          </li>
        </ul>
      </div>

      {/* Main Panel */}
      <div className="main-panel">
        {activeTab === 'myTasks' && (
          <div className="task-list">
            {/* Task Form */}
            <div className="task-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={newTask.title}
                  onChange={handleChange}
                  placeholder="Enter task title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="client">Client</label>
                <select
                  value={newTask.client}
                  onChange={(e) =>
                    setNewTask({ ...newTask, client: e.target.value })
                  }
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleAddTask}>
                  Add Task
                </button>
              </div>
            </div>

            {/* Task Table */}
            <h3>My Tasks</h3>
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Assigned By</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {tasks
                  .filter(
                    (t) =>
                      t.assignedTo?._id === user?._id &&
                      t.status !== 'Completed',
                  )
                  .map((task) => (
                    <tr key={task._id}>
                      <td>{task.title}</td>

                      {/* Editable Issue Date */}
                      <td>
                        <input
                          id={`issueDate-${task._id}`}
                          name="issueDate"
                          type="date"
                          value={
                            task.issueDate
                              ? new Date(task.issueDate)
                                  .toISOString()
                                  .split('T')[0]
                              : new Date().toISOString().split('T')[0] // default to today
                          }
                          readOnly // 👈 prevents editing
                        />
                      </td>

                      <td>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : 'No due date'}
                      </td>

                      {/* Editable Status */}
                      <td>
                        <select
                          value={task.status}
                          onChange={(e) => {
                            if (e.target.value === 'Completed') {
                              setSelectedTaskId(task._id); // ✅ store id
                              setShowPopup(true); // ✅ open popup
                              // 👉 after user enters hours/minutes in popup,
                              // you must call handleCompleteTask()
                            } else {
                              handleTaskChange(e, task._id); // normal status change
                            }
                          }}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Editable Client */}

                      <td>{task.client?.name || 'No client'}</td>

                      {/* Assigned By */}
                      <td>
                        {String(task.assignedBy?._id) === String(user?._id)
                          ? 'Me'
                          : task.assignedBy?.name}
                      </td>

                      {/* Editable Remarks */}
                      <td>
                        <textarea
                          id={`remarks-${task._id}`}
                          name="remarks"
                          value={task.remarks || ''}
                          onChange={(e) =>
                            handleRemarkChange(task._id, e.target.value)
                          }
                          className="task-remarks-updated"
                          placeholder="Add your remarks..."
                          rows={2}
                          style={{
                            width: '100%',
                            resize: 'vertical',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'assignedTasks' && (
          <div>
            <AssignTaskPage
              user={user}
              clients={clients}
              employees={employees}
              setActiveTab={setActiveTab}
            />
            <div className="task-list">
              <h3>Assigned Tasks</h3>
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Remarks</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks
                    .filter((t) => t.assignedTo?._id !== user?._id)
                    .map((task) => (
                      <tr key={task._id}>
                        <td>{task.title}</td>
                        <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                        <td>
                          <select
                            name="priority"
                            value={task.priority}
                            onChange={(e) => handleTaskChange(e, task._id)}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            name="remarks"
                            value={task.remarks || ''}
                            onChange={(e) => handleTaskChange(e, task._id)}
                          />
                        </td>
                        <td>
                          <select
                            name="client"
                            value={task.client}
                            onChange={(e) => Change(e, task._id)}
                          >
                            <option value="">-- Select Client --</option>
                            {clients.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            name="status"
                            value={task.status}
                            onChange={(e) => handleTaskChange(e, task._id)}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                          </select>
                        </td>
                        <td>{task.assignedTo?.name}</td>
                        <td>
                          <button onClick={() => handleUpdateTask(task._id)}>
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Completed Tasks */}
        {activeTab === 'completedTasks' && (
          <div className="task-list">
            <h3>Completed Tasks</h3>

            {completedTasks.length === 0 ? (
              <p>No completed tasks found.</p>
            ) : (
              completedTasks.map((task) => {
                // console.log('COMPLETED CARD TASK:', task);
                // console.log('Task values:', task.totalHours, task.totalMinutes);

                return (
                  <div className="task-card" key={task._id}>
                    <h4>{task.title}</h4>

                    <p>
                      <strong>Remarks:</strong> {task.remarks || 'No remarks'}
                    </p>

                    <p>
                      <strong>Priority:</strong> {task.priority || 'Normal'}
                    </p>

                    <p>
                      <strong>Due Date:</strong>{' '}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'N/A'}
                    </p>

                    {/* IMPORTANT */}
                    <p>
                      <strong>Time Spent:</strong> {task.totalHours ?? 0} hours{' '}
                      {task.totalMinutes ?? 0} minutes
                    </p>

                    <p className="completed-status">
                      <strong>Status:</strong> Completed
                    </p>

                    <button onClick={() => handleUncompleteTask(task._id)}>
                      Uncomplete
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <h3> Upon Completion of your task, Please Log your Time</h3>
              <input
                id="hours"
                type="number"
                placeholder="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
              <input
                id="minutes"
                type="number"
                placeholder="minutes"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
              <div className="popup-actions">
                <button onClick={() => setShowPopup(false)}>Cancel</button>
                <button
                  onClick={() => {
                    // 👇 Debug log here
                    // console.log('Submitting:', hours, minutes);

                    // Then call your complete handler
                    handleCompleteTask();
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clients */}
        {activeTab === 'clients' && (
          <div className="client-list">
            <h3>Clients</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client._id}>
                    <td>{client.name}</td>
                    <td>{client.email}</td>
                    <td>{client.company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
