import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('myTasks');
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    assignedTo: '',
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
        priority: 'MEDIUM',
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

    try {
      const token = localStorage.getItem('accessToken');
      const taskToUpdate = tasks.find((t) => t._id === taskId);

      const payload = {
        title: taskToUpdate.title,
        dueDate: taskToUpdate.dueDate,
        assignedBy: taskToUpdate.assignedBy,
        priority: taskToUpdate.priority,
        status: name === 'status' ? value : taskToUpdate.status,
        remarks: name === 'remarks' ? value : taskToUpdate.remarks || '',
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
            My Tasks
          </li>
          <li
            onClick={() => setActiveTab('assignedTasks')}
            className={activeTab === 'assignedTasks' ? 'active' : ''}
          >
            Assigned Tasks
          </li>
          <li
            onClick={() => setActiveTab('completedTasks')}
            className={activeTab === 'completedTasks' ? 'active' : ''}
          >
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
        {activeTab !== 'clients' && (
          <div className="add-task-bar">
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                name="title"
                value={newTask.title}
                onChange={handleChange}
                placeholder="Enter task title"
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={newTask.dueDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Assigned By</label>
              <select
                name="assignedTo"
                value={newTask.assignedTo}
                onChange={handleChange}
              >
                <option value="me">Me</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleAddTask}>Add Task</button>
          </div>
        )}

        {activeTab === 'myTasks' && (
          <div className="task-list">
            <h3>My Tasks</h3>
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Status</th>
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
                      <td>
                        <textarea
                          name="remarks"
                          value={task.remarks || ''}
                          onChange={(e) => handleTaskChange(e, task._id)}
                          onBlur={() => handleUpdateTask(task._id)} // save when leaving field
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
                  <th>Assigned By</th>
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
                      <td>{task.priority}</td>
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
                  t.assignedTo?._id === user?._id && t.status === 'Completed',
              )
              .map((task) => (
                <div key={task._id} className="task-card completed">
                  <h4>{task.title}</h4>
                  <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  <p>Remarks: {task.remarks}</p>
                </div>
              ))}
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
