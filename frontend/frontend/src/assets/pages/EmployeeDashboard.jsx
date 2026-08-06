import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/EmployeeDashboard.css';
import '../css/Popup.css';
import '../css/MyTaskform.css';
import AssignTaskPage from './AssignTaskPage';
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
  const [typingTimeouts, setTypingTimeouts] = useState({});

  const [minutes, setMinutes] = useState('');

  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    assignedTo: '',
    priority: 'Medium',
    remarks: '',
    client: '',
  });

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
    // update local state immediately
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, remarks: value } : t)),
    );

    // clear previous timeout
    if (typingTimeouts[taskId]) {
      clearTimeout(typingTimeouts[taskId]);
    }

    // set new timeout to save after 1s of no typing
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.put(
          `http://localhost:5000/api/tasks/${taskId}/remarks`,
          { remarks: value },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err) {
        console.error('Error updating remarks:', err);
      }
    }, 1000);

    setTypingTimeouts((prev) => ({ ...prev, [taskId]: timeout }));
  };

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
    fetchTasks();
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
        ...newTask,
        assignedTo: newTask.assignedTo || 'me',
        dueDate: newTask.dueDate || new Date().toISOString().substring(0, 10),
      };
      await axios.post('http://localhost:5000/api/tasks/assign', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewTask({
        title: '',
        dueDate: '',
        assignedTo: '',
        priority: 'Medium',
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
        client: name === 'client' ? value : taskToUpdate.client,
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
      const token = localStorage.getItem('accessToken');
      const taskToUpdate = tasks.find((t) => t._id === popupTaskId);

      const payload = {
        ...taskToUpdate,
        status: 'Completed',
        totalHours: Number(hours),
        totalMinutes: Number(minutes),
      };

      const res = await axios.put(
        `http://localhost:5000/api/tasks/${popupTaskId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === popupTaskId ? res.data : t)),
      );

      setShowPopup(false);
      setHours('');
      setMinutes('');
    } catch (err) {
      console.error('Error completing task:', err);
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
          client: task.client || null,
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
          <li onClick={() => setActiveTab('assignTask')}>
            <MdEdit style={{ marginRight: '8px' }} />
            Assign Task
          </li>
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
            Assigned by Me
          </li>
          <li
            onClick={() => setActiveTab('completedTasks')}
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
        {activeTab === 'assignTask' && (
          <AssignTaskPage
            user={user}
            clients={clients}
            employees={employees}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'myTasks' && (
          <div className="task-list">
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
                  id="client"
                  name="client"
                  value={newTask.client || ''}
                  onChange={(e) =>
                    setNewTask({ ...newTask, client: e.target.value })
                  }
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c.name}>
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
                      <td>
                        <input
                          type="date"
                          value={
                            task.issueDate
                              ? new Date(task.issueDate)
                                  .toISOString()
                                  .split('T')[0]
                              : ''
                          }
                          onChange={(e) =>
                            updateIssueDate(task._id, e.target.value)
                          }
                        />
                      </td>
                      <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                      <td>
                        <select
                          name="status"
                          value={task.status}
                          onChange={(e) => handleTaskChange(e, task._id)}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td>{task.client}</td>
                      <td>{task.assignedBy?.name}</td>
                      <td>
                        <textarea
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
                          value={task.client?._id || ''}
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
        )}
        {/* Completed Tasks */}
        {activeTab === 'completedTasks' && (
          <div className="task-list">
            <h3>Completed Tasks</h3>
            {tasks
              .filter(
                (t) =>
                  t.assignedTo?._id === user?._id &&
                  t.status.toLowerCase() === 'completed',
              )
              .map((task) => (
                <div className="task-card completed" key={task._id}>
                  <h4>{task.title}</h4>
                  <p>
                    <strong>Client:</strong> {task.client?.name}
                  </p>
                  <p>
                    <strong>Assigned By:</strong> {task.assignedBy?.name}
                  </p>
                  <p>
                    <strong>Due:</strong>{' '}
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Priority:</strong> {task.priority}
                  </p>
                  <p>
                    <strong>Status:</strong> {task.status}
                  </p>
                  <p>
                    <strong>Remarks:</strong> {task.remarks}
                  </p>

                  {/* ✅ Show total time */}
                  <p>
                    <strong>Time Spent:</strong> {task.totalHours}h{' '}
                    {task.totalMinutes}m
                  </p>

                  {/* Uncomplete button */}
                  <button onClick={() => markUncomplete(task._id)}>
                    Uncomplete
                  </button>
                </div>
              ))}
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
                <button onClick={handleCompleteTask}>Save</button>
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
