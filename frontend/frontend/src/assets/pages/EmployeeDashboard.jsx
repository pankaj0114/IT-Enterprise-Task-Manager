import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/EmployeeDashboard.css';
import '../css/Popup.css';
import '../css/MyTaskform.css';
import '../css/AssignTaskPage.css';
import AssignTaskPage from './AssignTaskPage';
import DatePicker from 'react-datepicker';
import { useRef } from 'react';
import socket from '../services/socket.js';

//import { io } from 'socket.io-client';

import {
  MdDashboard,
  MdListAlt,
  MdEdit,
  MdOutlineNearMe,
  MdOutlineChecklist,
  MdNotificationsNone,
} from 'react-icons/md';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'myTasks';
  });
  const [notifications, setNotifications] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTaskId, setPopupTaskId] = useState(null);
  const [hours, setHours] = useState('');
  //const [totalHours, setTotalHours] = useState('');
  //const [totalMinutes, setTotalMinutes] = useState('');

  const [editingTimeTaskId, setEditingTimeTaskId] = useState(null);

  const [editHours, setEditHours] = useState('');
  const [editMinutes, setEditMinutes] = useState('');
  const [typingTimeouts, setTypingTimeouts] = useState({});
  const [minutes, setMinutes] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const remarkTimeouts = useRef({});

  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    assignedTo: '',
    priority: 'Medium',
    remarks: '',
    client: '',
  });

  const navigate = useNavigate();
  //const socket = io('http://localhost:5000');
  // ==========================================
  // UNREAD COUNT
  // ==========================================

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/notifications',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Notifications from API:', response.data);

      // Remove duplicate notifications
      const uniqueNotifications = response.data.filter(
        (notification, index, self) =>
          index === self.findIndex((item) => item._id === notification._id),
      );

      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error(
        'Error fetching notifications:',
        error.response?.data || error.message,
      );
    }
  };

  // ==========================================
  // LOAD NOTIFICATIONS WHEN USER IS AVAILABLE
  // ==========================================
  useEffect(() => {
    if (!user?._id) return;

    fetchNotifications();
  }, [user?._id]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // ==========================================
  // MARK NOTIFICATIONS AS READ
  // ==========================================

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      await axios.put(
        'http://localhost:5000/api/notifications/read-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Immediately update UI
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    } catch (error) {
      console.error(
        'Error marking notifications as read:',
        error.response?.data || error.message,
      );
    }
  };

  // ==========================================
  // MARK READ WHEN NOTIFICATION TAB OPENS
  // ==========================================

  useEffect(() => {
    if (activeTab === 'notifications') {
      markNotificationsAsRead();
    }
  }, [activeTab]);
  // ==========================================
  // SOCKET.IO
  // ==========================================

  useEffect(() => {
    if (!user?._id) return;

    console.log('Joining notification room:', user._id);

    socket.emit('join', user._id);

    const handleNotification = (notification) => {
      console.log('New notification received:', notification);

      setNotifications((prev) => {
        // =====================================
        // PREVENT DUPLICATES
        // =====================================

        const alreadyExists = prev.some(
          (item) => item._id === notification._id,
        );

        if (alreadyExists) {
          console.log('Duplicate notification ignored:', notification._id);

          return prev;
        }

        // =====================================
        // ADD NEW NOTIFICATION
        // =====================================

        return [
          {
            ...notification,
            read: false,
          },
          ...prev,
        ];
      });
    };

    socket.on('newNotification', handleNotification);

    return () => {
      socket.off('newNotification', handleNotification);
    };
  }, [user?._id]);

  useEffect(() => {
    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const openPopup = (taskId) => {
    setSelectedTaskId(taskId);
    setShowPopup(true);
  };

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
  const fetchAssignedTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/tasks/assigned-by-me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('ASSIGNED BY ME:', response.data);

      setAssignedTasks(response.data);
    } catch (error) {
      console.error(
        'Error fetching assigned tasks:',
        error.response?.data || error.message,
      );
    }
  };
  const handleUpdateCompletedTime = async (taskId) => {
    try {
      const totalHours = Number(editHours);
      const totalMinutes = Number(editMinutes);

      // Validate hours
      if (!Number.isInteger(totalHours) || totalHours < 0) {
        alert('Please enter valid hours.');
        return;
      }

      // Validate minutes
      if (
        !Number.isInteger(totalMinutes) ||
        totalMinutes < 0 ||
        totalMinutes > 59
      ) {
        alert('Minutes must be between 0 and 59.');
        return;
      }

      const token = localStorage.getItem('accessToken');

      console.log('Updating completed task time:', {
        taskId,
        totalHours,
        totalMinutes,
      });

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/completed-time`,
        {
          totalHours,
          totalMinutes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Updated completed task:', response.data);

      const updatedTask = response.data.task || response.data;

      setTasks((prev) =>
        prev.map((task) => (task._id === selectedTaskId ? updatedTask : task)),
      );

      // Refresh completed tasks
      await fetchCompletedTasks();

      // Refresh assigned tasks
      await fetchAssignedTasks();
      // Update completed task card immediately
      setCompletedTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? {
                ...task,
                totalHours: updatedTask.totalHours,
                totalMinutes: updatedTask.totalMinutes,
              }
            : task,
        ),
      );

      // Exit edit mode
      setEditingTimeTaskId(null);
      setEditHours('');
      setEditMinutes('');
    } catch (error) {
      console.error(
        'Error updating completed task time:',
        error.response?.data || error.message,
      );
    }
  };

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/tasks/my-tasks',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('MY TASKS:', response.data);

      setMyTasks(response.data);
    } catch (error) {
      console.error(
        'Error fetching my tasks:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    if (activeTab === 'assignedTasks') {
      fetchAssignedTasks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user?._id) return;

    fetchMyTasks();
    fetchAssignedTasks();
  }, [user?._id]);

  useEffect(() => {
    if (activeTab === 'assignedTasks') {
      fetchAssignedTasks();
    }
  }, [activeTab]);

  // ✅ Fetch functions
  useEffect(() => {
    fetchTasks();
  }, []);

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

  const handlePriorityChange = async (taskId, priority) => {
    try {
      console.log('Updating priority');
      console.log('Task ID:', taskId);
      console.log('Priority:', priority);

      if (!taskId) {
        console.error('Task ID is undefined');
        return;
      }

      const token = localStorage.getItem('accessToken');

      // Update UI immediately
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? {
                ...task,
                priority,
              }
            : task,
        ),
      );

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Priority updated:', response.data);
    } catch (error) {
      console.error(
        'Error updating priority:',
        error.response?.data || error.message,
      );
    }
  };

  const handleDueDateChange = async (taskId, dueDate) => {
    try {
      const token = localStorage.getItem('accessToken');

      // Update UI immediately
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, dueDate } : task)),
      );

      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          dueDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Due date updated successfully');
    } catch (error) {
      console.error(
        'Error updating due date:',
        error.response?.data || error.message,
      );
    }
  };

  const handleRemarkChange = (taskId, value) => {
    console.log('========== REMARK CHANGE ==========');
    console.log('Task ID:', taskId);
    console.log('Remark:', value);

    if (!taskId) {
      console.error('ERROR: taskId is undefined!');
      return;
    }

    // Update UI immediately
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId
          ? {
              ...task,
              remarks: value,
            }
          : task,
      ),
    );

    // Clear previous timeout
    if (typingTimeouts[taskId]) {
      clearTimeout(typingTimeouts[taskId]);
    }

    // Save after user stops typing for 1 second
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        console.log('Saving remark for task:', taskId);

        await axios.put(
          `http://localhost:5000/api/tasks/${taskId}/remarks`,
          {
            remarks: value,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        console.log('Remark saved successfully');
      } catch (error) {
        console.error(
          'Error automatically saving remark:',
          error.response?.data || error.message,
        );
      }
    }, 1000);

    setTypingTimeouts((prev) => ({
      ...prev,
      [taskId]: timeout,
    }));
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

  // ===============================
  // ASSIGNED TASKS
  // ===============================

  // Tasks that I assigned to OTHER employees
  const filteredAssignedTasks = tasks.filter((task) => {
    const assignedByMe = String(task.assignedBy?._id) === String(user?._id);

    const assignedToOther = String(task.assignedTo?._id) !== String(user?._id);

    return assignedByMe && assignedToOther;
  });

  // Pending / Not Started
  const pendingAssignedTasks = assignedTasks.filter(
    (task) => task.status === 'Not Started' || task.status === 'Pending',
  );

  // In Progress
  const inprogressAssignedTasks = assignedTasks.filter(
    (task) => task.status === 'In Progress' || task.status === 'in-progress',
  );

  // Completed
  const completedAssignedTasks = assignedTasks.filter(
    (task) => task.status === 'Completed',
  );

  const handleQuickAddTask = async () => {
    try {
      const title = newTask.title.trim();

      if (!title) {
        alert('Please enter a task title.');
        return;
      }

      const token = localStorage.getItem('accessToken');

      const payload = {
        title,
        quickAdd: true,
        assignedTo: 'me',
        priority: 'Medium',
        dueDate: null,
        client: null,
      };

      console.log('Quick adding task:', payload);

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

      console.log('Quick task created:', response.data);

      const createdTask = response.data.task;

      // Add immediately to My Tasks
      setTasks((prev) => [createdTask, ...prev]);

      // Clear only the form
      setNewTask({
        title: '',
        dueDate: '',
        client: '',
      });
    } catch (error) {
      console.error(
        'Error quick adding task:',
        error.response?.data || error.message,
      );
    }
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.title || newTask.title.trim() === '') {
        alert('Please add a task title'); // show message
        return; // stop execution
      }

      if (!newTask.dueDate) {
        alert('Please select a due date');
        return;
      }

      if (!newTask.client) {
        alert('Please select a client');
        return;
      }
      const token = localStorage.getItem('accessToken');
      const payload = {
        title: newTask.title,
        dueDate: newTask.dueDate,
        client: newTask.client, // ✅ include client directly
        priority: newTask.priority || 'Medium',
        assignedTo: user._id, // ✅ use actual ObjectId
        assignedBy: user._id, // ✅ use actual ObjectId
        remarks: newTask.remarks || '',
        issueDate: new Date().toISOString().substring(0, 10),
        quickAdd: true,
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
    const newStatus = e.target.value;

    if (!taskId) {
      console.error('Task ID is missing');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      console.log('========== STATUS UPDATE ==========');
      console.log('Task ID:', taskId);
      console.log('New Status:', newStatus);

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Status update response:', response.data);

      const updatedTask = response.data.task || response.data;

      // Update the task immediately in frontend
      setTasks((prev) =>
        prev.map((task) =>
          String(task._id) === String(taskId) ? updatedTask : task,
        ),
      );
    } catch (error) {
      console.error(
        'Error updating task:',
        error.response?.data || error.message,
      );
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
      console.log('TASK ID:', taskId);

      if (!taskId) {
        console.error('Task ID is missing');
        return;
      }

      const token = localStorage.getItem('accessToken');

      const payload = {
        // your values here
      };

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error(
        'Error updating task:',
        error.response?.data || error.message,
      );
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
          <li
            onClick={() => {
              setActiveTab('notifications');
              markNotificationsAsRead();
            }}
            className={activeTab === 'notifications' ? 'active' : ''}
          >
            <div className="notification-icon-wrapper">
              <MdNotificationsNone size={24} />

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <span>Notifications</span>
          </li>
        </ul>
      </div>

      {/* Main Panel */}
      <div className="main-panel">
        {activeTab === 'myTasks' && (
          <div className="task-list">
            {/* ==============================
          TASK FORM
      ============================== */}
            <div className="task-form">
              <div className="form-group title-input-group">
                <label htmlFor="title">Title</label>

                <div className="title-input-wrapper">
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={newTask.title}
                    onChange={handleChange}
                    placeholder="Enter task title"
                  />

                  <button
                    type="button"
                    className="quick-add-btn"
                    onClick={handleQuickAddTask}
                    title="Quick add task"
                  >
                    +
                  </button>
                </div>
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
                  value={newTask.client}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      client: e.target.value,
                    })
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
                <button
                  type="button"
                  className="assign-btn"
                  onClick={handleAddTask}
                >
                  Add Task
                </button>
              </div>
            </div>

            {/* ==============================
          MY TASKS
      ============================== */}

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
                  .filter((task) => {
                    // Only tasks assigned TO logged-in user
                    const isMyTask =
                      String(task.assignedTo?._id) === String(user?._id);

                    // Don't show completed tasks
                    const isNotCompleted = task.status !== 'Completed';

                    return isMyTask && isNotCompleted;
                  })
                  .map((task) => (
                    <tr key={task._id}>
                      {/* ==============================
                    TITLE
                ============================== */}

                      <td>{task.title}</td>

                      {/* ==============================
                    ISSUE DATE
                ============================== */}

                      <td>
                        <input
                          type="date"
                          value={
                            task.issueDate
                              ? new Date(task.issueDate)
                                  .toISOString()
                                  .split('T')[0]
                              : new Date().toISOString().split('T')[0]
                          }
                          readOnly
                          className="fixed-date"
                        />
                      </td>

                      {/* ==============================
                    DUE DATE
                ============================== */}

                      <td>
                        <input
                          type="date"
                          value={
                            task.dueDate
                              ? new Date(task.dueDate)
                                  .toISOString()
                                  .split('T')[0]
                              : ''
                          }
                          onChange={(e) =>
                            handleDueDateChange(task._id, e.target.value)
                          }
                          className="editable-date"
                        />
                      </td>

                      {/* ==============================
                    STATUS
                ============================== */}

                      <td>
                        <select
                          value={task.status || 'Not Started'}
                          onChange={(e) => {
                            const newStatus = e.target.value;

                            if (newStatus === 'Completed') {
                              setSelectedTaskId(task._id);
                              setShowPopup(true);
                            } else {
                              handleTaskChange(e, task._id);
                            }
                          }}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* ==============================
                    CLIENT
                ============================== */}

                      <td>{task.client?.name || 'No client'}</td>

                      {/* ==============================
                    ASSIGNED BY
                ============================== */}

                      <td>
                        {String(task.assignedBy?._id) === String(user?._id)
                          ? 'Me'
                          : task.assignedBy?.name || 'Unknown'}
                      </td>

                      {/* ==============================
                    REMARKS
                ============================== */}

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
          <div className="assigned-task-section">
            {/* Assign Task Form */}
            <AssignTaskPage
              onTaskCreated={fetchTasks}
              user={user}
              clients={clients}
              employees={employees}
              setActiveTab={setActiveTab}
            />

            <h3 className="assigned-task-heading">Assigned Tasks</h3>

            {/* ============================= */}
            {/* STATUS SUMMARY CARDS */}
            {/* ============================= */}

            <div className="task-status-summary">
              {/* Pending */}
              <div className="status-card pending-card">
                <div className="status-icon">🕐</div>

                <div>
                  <h4>Pending</h4>
                  <strong>{assignedTasks.length}</strong>

                  <span>Tasks</span>
                </div>

                <button onClick={() => navigate('/assigned-tasks/pending')}>
                  View All
                </button>
              </div>

              {/* In Progress */}
              <div className="status-card progress-card">
                <div className="status-icon">↻</div>

                <div>
                  <h4>In Progress</h4>

                  <strong>{inprogressAssignedTasks.length}</strong>

                  <span>Tasks</span>
                </div>

                <button>View all →</button>
              </div>

              {/* Completed */}
              <div className="status-card completed-card">
                <div className="status-icon">✓</div>

                <div>
                  <h4>Completed</h4>

                  <strong>{completedAssignedTasks.length}</strong>

                  <span>Tasks</span>
                </div>

                <button>View all →</button>
              </div>
            </div>

            {/* ============================= */}
            {/* THREE TASK SECTIONS */}
            {/* ============================= */}

            <div className="assigned-task-columns">
              {/* ============================= */}
              {/* PENDING */}
              {/* ============================= */}

              <div className="assigned-status-section pending-section">
                <div className="section-header">
                  <h4>🕐 Pending Tasks</h4>
                </div>

                <div className="task-table-wrapper">
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Assigned To</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assignedTasks
                        .filter((task) => task.status === 'Not Started')
                        .map((task) => (
                          <tr key={task._id}>
                            <td>{task.title}</td>

                            <td>{task.assignedTo?.name || 'Unknown'}</td>

                            <td>
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'N/A'}
                            </td>

                            <td>
                              <span
                                className={`priority-badge ${task.priority?.toLowerCase()}`}
                              >
                                {task.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============================= */}
              {/* IN PROGRESS */}
              {/* ============================= */}

              <div className="assigned-status-section progress-section">
                <div className="section-header">
                  <h4>↻ In Progress Tasks</h4>

                  <button>View All</button>
                </div>

                <div className="task-table-wrapper">
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Assigned To</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assignedTasks
                        .filter((task) => task.status === 'In Progress')
                        .map((task) => (
                          <tr key={task._id}>
                            <td>{task.title}</td>

                            <td>{task.assignedTo?.name || 'Unknown'}</td>

                            <td>
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'N/A'}
                            </td>

                            <td>
                              <span
                                className={`priority-badge ${task.priority?.toLowerCase()}`}
                              >
                                {task.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============================= */}
              {/* COMPLETED */}
              {/* ============================= */}

              <div className="assigned-status-section completed-section">
                <div className="section-header">
                  <h4>✓ Completed Tasks</h4>

                  <button>View All</button>
                </div>

                <div className="task-table-wrapper">
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Assigned To</th>
                        <th>Completed On</th>
                        <th>Priority</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assignedTasks
                        .filter((task) => task.status === 'Completed')
                        .map((task) => (
                          <tr key={task._id}>
                            <td>{task.title}</td>

                            <td>{task.assignedTo?.name || 'Unknown'}</td>

                            <td>
                              {task.updatedAt
                                ? new Date(task.updatedAt).toLocaleDateString()
                                : 'N/A'}
                            </td>

                            <td>
                              <span
                                className={`priority-badge ${task.priority?.toLowerCase()}`}
                              >
                                {task.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {assignedTasks.map((task) => (
                    <tr key={task._id}>
                      {/* ==============================
                    TITLE
                ============================== */}

                      <td>{task.title}</td>

                      {/* ==============================
                    DUE DATE
                ============================== */}

                      <td>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : 'No due date'}
                      </td>

                      {/* ==============================
                    PRIORITY
                ============================== */}

                      <td>
                        <select
                          value={task.priority || 'Medium'}
                          onChange={(e) =>
                            handlePriorityChange(task._id, e.target.value)
                          }
                        >
                          <option value="Low">Low</option>

                          <option value="Medium">Medium</option>

                          <option value="High">High</option>
                        </select>
                      </td>

                      {/* ==============================
                    REMARKS
                ============================== */}

                      <td>
                        <input
                          type="text"
                          name="remarks"
                          value={task.remarks || ''}
                          onChange={(e) =>
                            handleRemarkChange(task._id, e.target.value)
                          }
                        />
                      </td>

                      {/* ==============================
                    CLIENT
                ============================== */}

                      <td>
                        <select
                          name="client"
                          value={task.client?._id || task.client || ''}
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

                      {/* ==============================
                    ASSIGNED TO
                ============================== */}

                      <td>{task.assignedTo?.name || 'Unknown'}</td>

                      {/* ==============================
                    ACTIONS
                ============================== */}

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
                const isEditing = editingTimeTaskId === task._id;

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

                    {/* TIME SECTION */}
                    {!isEditing ? (
                      <p>
                        <strong>Time Spent:</strong> {task.totalHours ?? 0}{' '}
                        hours {task.totalMinutes ?? 0} minutes
                      </p>
                    ) : (
                      <div className="edit-time-section">
                        <strong>Edit Time Spent:</strong>

                        <div className="time-inputs">
                          <div>
                            <label>Hours</label>

                            <input
                              type="number"
                              min="0"
                              value={editHours}
                              onChange={(e) => setEditHours(e.target.value)}
                              placeholder="Hours"
                            />
                          </div>

                          <div>
                            <label>Minutes</label>

                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={editMinutes}
                              onChange={(e) => setEditMinutes(e.target.value)}
                              placeholder="Minutes"
                            />
                          </div>
                        </div>

                        <div className="time-edit-buttons">
                          <button
                            className="save-time-btn"
                            onClick={() => handleUpdateCompletedTime(task._id)}
                          >
                            Save
                          </button>

                          <button
                            className="cancel-time-btn"
                            onClick={() => {
                              setEditingTimeTaskId(null);
                              setEditHours('');
                              setEditMinutes('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="completed-status">
                      <strong>Status:</strong> Completed
                    </p>

                    {/* ACTION BUTTONS */}
                    <div className="task-card-actions">
                      {!isEditing && (
                        <button
                          className="edit-time-btn"
                          onClick={() => {
                            setEditingTimeTaskId(task._id);

                            setEditHours(String(task.totalHours ?? 0));

                            setEditMinutes(String(task.totalMinutes ?? 0));
                          }}
                        >
                          Edit Time
                        </button>
                      )}

                      <button onClick={() => handleUncompleteTask(task._id)}>
                        Uncomplete
                      </button>
                    </div>
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
        {activeTab === 'notifications' && (
          <div className="notifications-page">
            <div className="notifications-header">
              <h2>Notifications</h2>

              <span>
                {notifications.length} notification
                {notifications.length !== 1 ? 's' : ''}
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="no-notifications">
                <MdNotificationsNone size={50} />

                <h3>No notifications</h3>

                <p>You don't have any notifications right now.</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div className="notification-card" key={notification._id}>
                    <div className="notification-icon">🔔</div>

                    <div className="notification-content">
                      <h4>New Notification</h4>

                      <p>{notification.message}</p>

                      <small>
                        {notification.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : ''}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
