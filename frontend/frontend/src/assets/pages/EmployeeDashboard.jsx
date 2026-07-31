import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('myTasks');
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    assignedTo: '', // optional
    priority: 'MEDIUM',
  });

  // ✅ Fetch functions
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
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
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

  useEffect(() => {
    fetchTasks();
    fetchClients();
    fetchEmployees();
  }, [activeTab]);

  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleAddTask = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        ...newTask,
        assignedTo: newTask.assignedTo || 'me', // ✅ default to "me"
      };
      await axios.post('http://localhost:5000/api/tasks/assign', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewTask({
        title: '',
        dueDate: '',
        assignedTo: '',
        priority: 'MEDIUM',
      });
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/'; // redirect to login page
  };

  const handleTaskChange = (e, taskId) => {
    const { name, value } = e.target;
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, [name]: value } : task,
      ),
    );
  };

  const handleUpdateTask = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const task = tasks.find((t) => t._id === taskId);
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          remarks: task.remarks,
          client: task.client || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="employee-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Dashboard</h3>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
        <ul>
          <li
            onClick={() => setActiveTab('myTasks')}
            className={activeTab === 'myTasks' ? 'active' : ''}
          >
            My Tasks
          </li>
          <li
            onClick={() => setActiveTab('assignedTasks')}
            className={activeTab === 'assignedTasks' ? 'active' : ''}
          >
            Assigned Tasks
          </li>
          <li
            onClick={() => setActiveTab('clients')}
            className={activeTab === 'clients' ? 'active' : ''}
          >
            Clients
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-panel">
        {activeTab !== 'clients' && (
          <div className="add-task-bar">
            <input
              type="text"
              name="title"
              placeholder="Task title..."
              value={newTask.title}
              onChange={handleChange}
            />
            <input
              type="date"
              name="dueDate"
              value={newTask.dueDate}
              onChange={handleChange}
            />
            {/* ✅ Assign To Dropdown */}
            <select
              name="assignedTo"
              value={newTask.assignedTo}
              onChange={handleChange}
            >
              <option value="me">Me</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
            <button onClick={handleAddTask}>Add Task</button>
          </div>
        )}

        {/* My Tasks */}
        {activeTab === 'myTasks' && (
          <div className="task-list">
            <h3>My Tasks</h3>
            {tasks
              .filter(
                (t) =>
                  t.assignedTo?._id === t.assignedBy?._id ||
                  t.assignedTo === 'me',
              )
              .map((task) => (
                <div key={task._id} className="task-item">
                  <input type="checkbox" />
                  <span>{task.title}</span>
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
          </div>
        )}

        {/* Assigned Tasks (Editable) */}
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks
                  .filter((t) => t.assignedTo && t.assignedTo !== 'me')
                  .map((task) => (
                    <tr key={task._id}>
                      <td>
                        <input
                          type="text"
                          name="title"
                          value={task.title}
                          onChange={(e) => handleTaskChange(e, task._id)}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          name="dueDate"
                          value={task.dueDate?.substring(0, 10)}
                          onChange={(e) => handleTaskChange(e, task._id)}
                        />
                      </td>
                      <td>
                        <select
                          name="priority"
                          value={task.priority}
                          onChange={(e) => handleTaskChange(e, task._id)}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="URGENT">URGENT</option>
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
                          value={task.client || ''}
                          onChange={(e) => handleTaskChange(e, task._id)}
                        >
                          <option value="">-- Select Client --</option>
                          {clients.map((client) => (
                            <option key={client._id} value={client._id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </td>
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
