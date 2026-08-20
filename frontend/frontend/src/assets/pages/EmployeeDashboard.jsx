import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/EmployeeDashboard.css';
//import '../css/Popup.css';
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
  MdDelete,
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

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      handleQuickAddTask();
    }
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

    // Immediately update the task in the UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        String(task._id) === String(taskId)
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

    // Save after user stops typing
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        console.log('Saving remark for task:', taskId);
        console.log('Remark being saved:', value);

        const response = await axios.put(
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

        console.log('Remark saved successfully:', response.data);
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

  const handleDeleteNotification = async (notificationId) => {
    try {
      if (!notificationId) {
        console.error('Notification ID is missing');
        return;
      }

      const token = localStorage.getItem('accessToken');

      await axios.delete(
        `http://localhost:5000/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Remove notification immediately from UI
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => String(notification._id) !== String(notificationId),
        ),
      );

      console.log('Notification deleted successfully');
    } catch (error) {
      console.error(
        'Error deleting notification:',
        error.response?.data || error.message,
      );
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

      // Clear form
      setNewTask({
        title: '',
        dueDate: '',
        client: '',
      });

      // Fetch fresh tasks from database
      await fetchTasks();
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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col lg:flex-row">
      {/* =========================================================
      SIDEBAR
  ========================================================= */}
      <div
        className="
      w-full lg:w-64
      lg:min-h-screen
      bg-linear-to-b from-blue-500 to-blue-600
      text-white
      shrink-0
      p-4
      lg:sticky lg:top-0
      lg:h-screen
      overflow-y-auto
    "
      >
        {/* Employee Info */}
        <div className="px-3 py-4 mb-4">
          {user ? (
            <h3 className="text-lg font-semibold truncate">{user.name}</h3>
          ) : (
            <h3 className="text-lg font-semibold">Loading...</h3>
          )}
        </div>

        {/* Logout */}
        <button
          className="
        w-full
        px-4 py-2
        mb-5
        rounded-md
        bg-red-500
        hover:bg-red-600
        active:bg-red-700
        text-white
        font-medium
        text-sm
        transition-all
        duration-200
        shadow-sm
      "
          onClick={handleLogout}
        >
          Logout
        </button>

        {/* Navigation */}
        <ul className="space-y-1">
          {/* My Tasks */}
          <li
            onClick={() => setActiveTab('myTasks')}
            className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'myTasks'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
          >
            <MdListAlt size={20} />
            <span>My Tasks</span>
          </li>

          {/* Assigned Tasks */}
          <li
            onClick={() => setActiveTab('assignedTasks')}
            className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'assignedTasks'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
          >
            <MdOutlineNearMe size={20} />
            <span>Assigned Task</span>
          </li>

          {/* Completed Tasks */}
          <li
            onClick={() => {
              setActiveTab('completedTasks');
              fetchCompletedTasks();
            }}
            className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'completedTasks'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
          >
            <MdOutlineChecklist size={20} />
            <span>Completed Tasks</span>
          </li>

          {/* Clients */}
          <li
            onClick={() => setActiveTab('clients')}
            className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'clients'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
          >
            <span className="w-5 text-center">◉</span>
            <span>Clients</span>
          </li>

          {/* Notifications */}
          <li
            onClick={() => {
              setActiveTab('notifications');
              markNotificationsAsRead();
            }}
            className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'notifications'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
          >
            <div className="relative flex items-center justify-center">
              <MdNotificationsNone size={24} />

              {unreadCount > 0 && (
                <span
                  className="
                absolute
                -top-2
                -right-2
                min-w-4.5
                h-4.5
                px-1
                rounded-full
                bg-red-500
                text-white
                text-[10px]
                font-bold
                flex
                items-center
                justify-center
                border-2
                border-blue-500
              "
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <span>Notifications</span>
          </li>
        </ul>
      </div>

      {/* =========================================================
      MAIN PANEL
  ========================================================= */}
      <div
        className="
      flex-1
      min-w-0
      p-3
      sm:p-5
      lg:p-6
      overflow-x-hidden
    "
      >
        {/* =======================================================
        MY TASKS
    ======================================================= */}
        {activeTab === 'myTasks' && (
          <div className="w-full">
            {/* ================= TASK FORM ================= */}
            <div
              className="
            w-full
            bg-white
            rounded-xl
            shadow-sm
            border
            border-slate-200
            p-4
            sm:p-5
            mb-6
          "
            >
              <div
                className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-4
              gap-4
              items-end
            "
              >
                {/* Title */}
                <div className="w-full">
                  <label
                    htmlFor="title"
                    className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-1.5
                "
                  >
                    Title
                  </label>

                  <div className="flex w-full">
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={newTask.title}
                      onChange={handleChange}
                      onKeyDown={handleTitleKeyDown}
                      placeholder="Enter task title"
                      className="
                    flex-1
                    min-w-0
                    h-10
                    px-3
                    border
                    border-slate-300
                    rounded-l-md
                    outline-none
                    text-sm
                    text-slate-700
                    focus:ring-2
                    focus:ring-blue-400
                    focus:border-blue-400
                  "
                    />

                    <button
                      type="button"
                      onClick={handleQuickAddTask}
                      title="Quick add task"
                      className="
                    w-10
                    h-10
                    rounded-r-md
                    bg-blue-500
                    hover:bg-blue-600
                    text-white
                    text-xl
                    font-semibold
                    transition
                  "
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Due Date */}
                <div className="w-full">
                  <label
                    htmlFor="dueDate"
                    className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-1.5
                "
                  >
                    Due Date
                  </label>

                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={handleChange}
                    className="
                  w-full
                  h-10
                  px-3
                  border
                  border-slate-300
                  rounded-md
                  outline-none
                  text-sm
                  focus:ring-2
                  focus:ring-blue-400
                  focus:border-blue-400
                "
                  />
                </div>

                {/* Client */}
                <div className="w-full">
                  <label
                    htmlFor="client"
                    className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-1.5
                "
                  >
                    Client
                  </label>

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
                    className="
                  w-full
                  h-10
                  px-3
                  border
                  border-slate-300
                  rounded-md
                  bg-white
                  text-sm
                  text-slate-700
                  outline-none
                  focus:ring-2
                  focus:ring-blue-400
                  focus:border-blue-400
                "
                  >
                    <option value="">Select a client</option>

                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Task */}
                <div className="w-full flex md:justify-end">
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="
                  w-full
                  md:w-auto
                  h-10
                  px-5
                  rounded-md
                  bg-blue-500
                  hover:bg-blue-600
                  text-white
                  text-sm
                  font-medium
                  transition
                  shadow-sm
                "
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>

            {/* ================= MY TASKS ================= */}
            <h3
              className="
            text-lg
            sm:text-xl
            font-semibold
            text-slate-800
            mb-4
          "
            >
              My Tasks
            </h3>

            {/* Responsive table wrapper */}
            <div
              className="
            w-full
            overflow-x-auto
            bg-white
            rounded-xl
            border
            border-slate-200
            shadow-sm
          "
            >
              <table
                className="
              w-full
              min-w-225
              text-sm
              border-collapse
            "
              >
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Title
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Issue Date
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Due Date
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Client
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Assigned By
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tasks
                    .filter((task) => {
                      const isMyTask =
                        String(task.assignedTo?._id) === String(user?._id);

                      const isNotCompleted = task.status !== 'Completed';

                      return isMyTask && isNotCompleted;
                    })
                    .map((task) => (
                      <tr
                        key={task._id}
                        className="
                      border-b
                      border-slate-100
                      hover:bg-slate-50
                      transition
                    "
                      >
                        {/* Title */}
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {task.title}
                        </td>

                        {/* Issue Date */}
                        <td className="px-4 py-3">
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
                            className="
                          w-full
                          min-w-32.5
                          px-2
                          py-2
                          rounded-md
                          border
                          border-slate-200
                          bg-slate-50
                          text-xs
                          text-slate-600
                        "
                          />
                        </td>

                        {/* Due Date */}
                        <td className="px-4 py-3">
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
                            className="
                          w-full
                          min-w-32.5
                          px-2
                          py-2
                          rounded-md
                          border
                          border-slate-300
                          bg-white
                          text-xs
                          outline-none
                          focus:ring-2
                          focus:ring-blue-400
                        "
                          />
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <select
                            className={`
                          w-full
                          min-w-31.25
                          px-2
                          py-2
                          rounded-md
                          border
                          text-xs
                          font-medium
                          outline-none
                          ${
                            task.status === 'Not Started'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : task.status === 'In Progress'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : task.status === 'Completed'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-white border-slate-300'
                          }
                        `}
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

                        {/* Client */}
                        <td className="px-4 py-3 text-slate-600">
                          {task.client?.name || 'No client'}
                        </td>

                        {/* Assigned By */}
                        <td className="px-4 py-3 text-slate-600">
                          {String(task.assignedBy?._id) === String(user?._id)
                            ? 'Me'
                            : task.assignedBy?.name || 'Unknown'}
                        </td>

                        {/* Remarks */}
                        <td className="px-4 py-3">
                          <textarea
                            id={`remarks-${task._id}`}
                            name="remarks"
                            value={task.remarks || ''}
                            onChange={(e) =>
                              handleRemarkChange(task._id, e.target.value)
                            }
                            placeholder="Add your remarks..."
                            rows={2}
                            className="
                          w-full
                          min-w-45
                          resize-y
                          px-2
                          py-2
                          rounded-md
                          border
                          border-slate-300
                          bg-green-50
                          text-sm
                          text-slate-700
                          outline-none
                          placeholder:text-slate-400
                          focus:ring-2
                          focus:ring-green-300
                          focus:border-green-300
                        "
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================
        ASSIGNED TASKS
    ======================================================= */}
        {activeTab === 'assignedTasks' && (
          <div className="w-full">
            {/* Assign Task Form */}
            <AssignTaskPage
              onTaskCreated={fetchTasks}
              user={user}
              clients={clients}
              employees={employees}
              setActiveTab={setActiveTab}
            />

            <h3
              className="
            mt-6
            mb-5
            text-xl
            font-semibold
            text-slate-800
          "
            >
              Assigned Tasks
            </h3>

            {/* ================= STATUS SUMMARY ================= */}
            <div
              className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-3
            gap-4
            mb-6
          "
            >
              {/* Pending */}
              <div
                className="
              rounded-xl
              border
              border-orange-100
              bg-orange-50
              p-5
              shadow-sm
              flex
              items-center
              gap-4
            "
              >
                <div
                  className="
                w-11 h-11
                rounded-full
                bg-orange-100
                flex items-center justify-center
                text-xl
              "
                >
                  🕐
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-700">
                    Pending
                  </h4>

                  <strong className="block text-2xl font-bold text-slate-800">
                    {pendingAssignedTasks.length}
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </div>

                <button
                  onClick={() => navigate('/assigned-tasks/pending')}
                  className="
                px-3 py-2
                rounded-md
                bg-orange-500
                hover:bg-orange-600
                text-white
                text-xs
                font-medium
              "
                >
                  View All
                </button>
              </div>

              {/* In Progress */}
              <div
                className="
              rounded-xl
              border
              border-blue-100
              bg-blue-50
              p-5
              shadow-sm
              flex
              items-center
              gap-4
            "
              >
                <div
                  className="
                w-11 h-11
                rounded-full
                bg-blue-100
                flex items-center justify-center
                text-xl
              "
                >
                  ↻
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-700">
                    In Progress
                  </h4>

                  <strong className="block text-2xl font-bold text-slate-800">
                    {inprogressAssignedTasks.length}
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </div>

                <button
                  onClick={() => navigate('/assigned-tasks/in-progress')}
                  className="
                px-3 py-2
                rounded-md
                bg-blue-500
                hover:bg-blue-600
                text-white
                text-xs
                font-medium
              "
                >
                  View All
                </button>
              </div>

              {/* Completed */}
              <div
                className="
              rounded-xl
              border
              border-green-100
              bg-green-50
              p-5
              shadow-sm
              flex
              items-center
              gap-4
            "
              >
                <div
                  className="
                w-11 h-11
                rounded-full
                bg-green-100
                flex items-center justify-center
                text-xl
              "
                >
                  ✓
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-700">
                    Completed
                  </h4>

                  <strong className="block text-2xl font-bold text-slate-800">
                    {completedAssignedTasks.length}
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </div>

                <button
                  onClick={() => navigate('/assigned-tasks/completed')}
                  className="
                px-3 py-2
                rounded-md
                bg-green-500
                hover:bg-green-600
                text-white
                text-xs
                font-medium
              "
                >
                  View All
                </button>
              </div>
            </div>

            {/* ================= THREE TASK SECTIONS ================= */}
            <div
              className="
            grid
            grid-cols-1
            xl:grid-cols-3
            gap-5
            mb-6
          "
            >
              {/* PENDING */}
              <div
                className="
              bg-white
              rounded-xl
              border
              border-orange-100
              shadow-sm
              overflow-hidden
            "
              >
                <div className="px-4 py-4 bg-orange-50 border-b border-orange-100">
                  <h4 className="font-semibold text-orange-700">
                    🕐 Pending Tasks
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="px-3 py-3 text-left">Title</th>
                        <th className="px-3 py-3 text-left">Assigned To</th>
                        <th className="px-3 py-3 text-left">Due Date</th>
                        <th className="px-3 py-3 text-left">Priority</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assignedTasks
                        .filter((task) => task.status === 'Not Started')
                        .slice(0, 2)
                        .map((task) => (
                          <tr
                            key={task._id}
                            className="border-b hover:bg-slate-50"
                          >
                            <td className="px-3 py-3">{task.title}</td>

                            <td className="px-3 py-3">
                              {task.assignedTo?.name || 'Unknown'}
                            </td>

                            <td className="px-3 py-3 whitespace-nowrap">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'N/A'}
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`
                              inline-flex
                              px-2.5 py-1
                              rounded-full
                              text-xs
                              font-medium
                              ${
                                task.priority?.toLowerCase() === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority?.toLowerCase() === 'low'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }
                            `}
                              >
                                {task.priority || 'Medium'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {assignedTasks.filter((task) => task.status === 'Not Started')
                  .length > 2 && (
                  <div className="px-4 py-3 text-right text-sm text-slate-500 italic">
                    and much more...
                  </div>
                )}
              </div>

              {/* IN PROGRESS */}
              <div
                className="
              bg-white
              rounded-xl
              border
              border-blue-100
              shadow-sm
              overflow-hidden
            "
              >
                <div className="px-4 py-4 bg-blue-50 border-b border-blue-100">
                  <h4 className="font-semibold text-blue-700">
                    ↻ In Progress Tasks
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="px-3 py-3 text-left">Title</th>
                        <th className="px-3 py-3 text-left">Assigned To</th>
                        <th className="px-3 py-3 text-left">Due Date</th>
                        <th className="px-3 py-3 text-left">Priority</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assignedTasks
                        .filter((task) => task.status === 'In Progress')
                        .slice(0, 2)
                        .map((task) => (
                          <tr
                            key={task._id}
                            className="border-b hover:bg-slate-50"
                          >
                            <td className="px-3 py-3">{task.title}</td>

                            <td className="px-3 py-3">
                              {task.assignedTo?.name || 'Unknown'}
                            </td>

                            <td className="px-3 py-3 whitespace-nowrap">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'N/A'}
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`
                              inline-flex
                              px-2.5 py-1
                              rounded-full
                              text-xs
                              font-medium
                              ${
                                task.priority?.toLowerCase() === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority?.toLowerCase() === 'low'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }
                            `}
                              >
                                {task.priority || 'Medium'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {assignedTasks.filter((task) => task.status === 'In Progress')
                  .length > 2 && (
                  <div className="px-4 py-3 text-right text-sm text-slate-500 italic">
                    and much more...
                  </div>
                )}
              </div>

              {/* COMPLETED */}
              <div
                className="
              bg-white
              rounded-xl
              border
              border-green-100
              shadow-sm
              overflow-hidden
            "
              >
                <div className="px-4 py-4 bg-green-50 border-b border-green-100">
                  <h4 className="font-semibold text-green-700">
                    ✓ Completed Tasks
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="px-3 py-3 text-left">Title</th>
                        <th className="px-3 py-3 text-left">Assigned To</th>
                        <th className="px-3 py-3 text-left">Completed On</th>
                        <th className="px-3 py-3 text-left">Priority</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assignedTasks
                        .filter((task) => task.status === 'Completed')
                        .slice(0, 2)
                        .map((task) => (
                          <tr
                            key={task._id}
                            className="border-b hover:bg-slate-50"
                          >
                            <td className="px-3 py-3">{task.title}</td>

                            <td className="px-3 py-3">
                              {task.assignedTo?.name || 'Unknown'}
                            </td>

                            <td className="px-3 py-3 whitespace-nowrap">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'N/A'}
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`
                              inline-flex
                              px-2.5 py-1
                              rounded-full
                              text-xs
                              font-medium
                              ${
                                task.priority?.toLowerCase() === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority?.toLowerCase() === 'low'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }
                            `}
                              >
                                {task.priority || 'Medium'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {assignedTasks.filter((task) => task.status === 'Completed')
                  .length > 2 && (
                  <div className="px-4 py-3 text-right text-sm text-slate-500 italic">
                    and much more...
                  </div>
                )}
              </div>
            </div>

            {/* ================= FULL ASSIGNED TASK TABLE ================= */}
            <div
              className="
            bg-white
            rounded-xl
            border
            border-slate-200
            shadow-sm
            overflow-hidden
          "
            >
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  Assigned Tasks
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-250 text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Due Date</th>
                      <th className="px-4 py-3 text-left">Priority</th>
                      <th className="px-4 py-3 text-left">Remarks</th>
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-left">Assigned To</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {assignedTasks.map((task) => (
                      <tr
                        key={task._id}
                        className="
                      border-b
                      border-slate-100
                      hover:bg-slate-50
                    "
                      >
                        {/* Title */}
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {task.title}
                        </td>

                        {/* Due Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : 'No due date'}
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3">
                          <select
                            value={task.priority || 'Medium'}
                            onChange={(e) =>
                              handlePriorityChange(task._id, e.target.value)
                            }
                            className="
                          px-2
                          py-2
                          rounded-md
                          border
                          border-slate-300
                          bg-white
                          text-xs
                          outline-none
                          focus:ring-2
                          focus:ring-blue-400
                        "
                          >
                            <option value="Low">Low</option>

                            <option value="Medium">Medium</option>

                            <option value="High">High</option>
                          </select>
                        </td>

                        {/* Remarks */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            name="remarks"
                            value={task.remarks || ''}
                            onChange={(e) =>
                              handleRemarkChange(task._id, e.target.value)
                            }
                            placeholder="Add remarks..."
                            className="
                          w-full
                          min-w-45
                          px-3
                          py-2
                          rounded-md
                          border
                          border-slate-300
                          outline-none
                          text-sm
                          focus:ring-2
                          focus:ring-green-300
                          focus:border-green-300
                        "
                          />
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3">
                          <select
                            name="client"
                            value={task.client?._id || task.client || ''}
                            onChange={(e) => Change(e, task._id)}
                            className="
                          px-2
                          py-2
                          rounded-md
                          border
                          border-slate-300
                          bg-white
                          text-xs
                          outline-none
                          focus:ring-2
                          focus:ring-blue-400
                        "
                          >
                            <option value="">-- Select Client --</option>

                            {clients.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Assigned To */}
                        <td className="px-4 py-3 text-slate-600">
                          {task.assignedTo?.name || 'Unknown'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleUpdateTask(task._id)}
                            className="
                          px-4
                          py-2
                          rounded-md
                          bg-blue-500
                          hover:bg-blue-600
                          text-white
                          text-xs
                          font-medium
                          transition
                        "
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
        COMPLETED TASKS
    ======================================================= */}
        {activeTab === 'completedTasks' && (
          <div className="w-full">
            <h3 className="text-xl font-semibold text-slate-800 mb-5">
              Completed Tasks
            </h3>

            {completedTasks.length === 0 ? (
              <div
                className="
              bg-white
              rounded-xl
              border
              border-slate-200
              p-8
              text-center
              text-slate-500
            "
              >
                No completed tasks found.
              </div>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => {
                  const isEditing = editingTimeTaskId === task._id;

                  return (
                    <div
                      className="
                    bg-white
                    rounded-xl
                    border
                    border-green-100
                    shadow-sm
                    p-5
                  "
                      key={task._id}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h4 className="text-lg font-semibold text-slate-800">
                          {task.title}
                        </h4>

                        <span
                          className="
                        inline-flex
                        w-fit
                        px-3
                        py-1
                        rounded-full
                        bg-green-100
                        text-green-700
                        text-xs
                        font-semibold
                      "
                        >
                          Completed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <p className="text-sm text-slate-600">
                          <strong className="text-slate-800">Remarks:</strong>{' '}
                          {task.remarks || 'No remarks'}
                        </p>

                        <p className="text-sm text-slate-600">
                          <strong className="text-slate-800">Priority:</strong>{' '}
                          {task.priority || 'Normal'}
                        </p>

                        <p className="text-sm text-slate-600">
                          <strong className="text-slate-800">Due Date:</strong>{' '}
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : 'N/A'}
                        </p>

                        <p className="text-sm text-slate-600">
                          <strong className="text-slate-800">
                            Time Spent:
                          </strong>{' '}
                          {task.totalHours ?? 0} hours {task.totalMinutes ?? 0}{' '}
                          minutes
                        </p>
                      </div>

                      {/* Time Editing */}
                      {isEditing && (
                        <div
                          className="
                        mt-5
                        p-4
                        rounded-lg
                        bg-green-50
                        border
                        border-green-100
                      "
                        >
                          <strong className="block mb-3 text-green-800">
                            Edit Time Spent
                          </strong>

                          <div
                            className="
                          grid
                          grid-cols-1
                          sm:grid-cols-2
                          gap-3
                        "
                          >
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Hours
                              </label>

                              <input
                                type="number"
                                min="0"
                                value={editHours}
                                onChange={(e) => setEditHours(e.target.value)}
                                placeholder="Hours"
                                className="
                              w-full
                              px-3
                              py-2
                              rounded-md
                              border
                              border-slate-300
                              bg-white
                              outline-none
                              focus:ring-2
                              focus:ring-green-300
                            "
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Minutes
                              </label>

                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={editMinutes}
                                onChange={(e) => setEditMinutes(e.target.value)}
                                placeholder="Minutes"
                                className="
                              w-full
                              px-3
                              py-2
                              rounded-md
                              border
                              border-slate-300
                              bg-white
                              outline-none
                              focus:ring-2
                              focus:ring-green-300
                            "
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <button
                              className="
                            px-4
                            py-2
                            rounded-md
                            bg-green-500
                            hover:bg-green-600
                            text-white
                            text-sm
                            font-medium
                          "
                              onClick={() =>
                                handleUpdateCompletedTime(task._id)
                              }
                            >
                              Save
                            </button>

                            <button
                              className="
                            px-4
                            py-2
                            rounded-md
                            bg-slate-200
                            hover:bg-slate-300
                            text-slate-700
                            text-sm
                            font-medium
                          "
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

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-5">
                        {!isEditing && (
                          <button
                            className="
                          px-4
                          py-2
                          rounded-md
                          bg-green-500
                          hover:bg-green-600
                          text-white
                          text-sm
                          font-medium
                        "
                            onClick={() => {
                              setEditingTimeTaskId(task._id);

                              setEditHours(String(task.totalHours ?? 0));

                              setEditMinutes(String(task.totalMinutes ?? 0));
                            }}
                          >
                            Edit Time
                          </button>
                        )}

                        <button
                          onClick={() => handleUncompleteTask(task._id)}
                          className="
                        px-4
                        py-2
                        rounded-md
                        bg-orange-500
                        hover:bg-orange-600
                        text-white
                        text-sm
                        font-medium
                      "
                        >
                          Uncomplete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =======================================================
        COMPLETION TIME POPUP
    ======================================================= */}
        {showPopup && (
          <div
            className="
          fixed
          inset-0
          z-50
          bg-black/50
          flex
          items-center
          justify-center
          p-4
        "
          >
            <div
              className="
            w-full
            max-w-md
            bg-white
            rounded-xl
            shadow-2xl
            p-5
          "
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Upon Completion of your task, Please Log your Time
              </h3>

              <div className="space-y-3">
                <input
                  id="hours"
                  type="number"
                  placeholder="Hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="
                w-full
                px-3
                py-2
                rounded-md
                border
                border-slate-300
                outline-none
                focus:ring-2
                focus:ring-blue-400
              "
                />

                <input
                  id="minutes"
                  type="number"
                  placeholder="Minutes"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="
                w-full
                px-3
                py-2
                rounded-md
                border
                border-slate-300
                outline-none
                focus:ring-2
                focus:ring-blue-400
              "
                />
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowPopup(false)}
                  className="
                px-4
                py-2
                rounded-md
                bg-slate-200
                hover:bg-slate-300
                text-slate-700
                text-sm
              "
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    handleCompleteTask();
                  }}
                  className="
                px-4
                py-2
                rounded-md
                bg-green-500
                hover:bg-green-600
                text-white
                text-sm
                font-medium
              "
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
        CLIENTS
    ======================================================= */}
        {activeTab === 'clients' && (
          <div className="w-full">
            <h3 className="text-xl font-semibold text-slate-800 mb-5">
              Clients
            </h3>

            <div
              className="
            bg-white
            rounded-xl
            border
            border-slate-200
            shadow-sm
            overflow-x-auto
          "
            >
              <table className="w-full min-w-150 text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="px-4 py-3 text-left font-semibold">Name</th>

                    <th className="px-4 py-3 text-left font-semibold">Email</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Company
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {clients.map((client) => (
                    <tr key={client._id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{client.name}</td>

                      <td className="px-4 py-3">{client.email}</td>

                      <td className="px-4 py-3">{client.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================
        NOTIFICATIONS
    ======================================================= */}
        {activeTab === 'notifications' && (
          <div className="w-full">
            {/* ================= NOTIFICATION HEADER ================= */}
            <div
              className="
      mb-5
      flex
      flex-col
      gap-2
      sm:flex-row
      sm:items-center
      sm:justify-between
    "
            >
              <h2 className="text-xl font-semibold text-slate-800">
                Notifications
              </h2>

              <span className="text-sm text-slate-500">
                {notifications.length} notification
                {notifications.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ================= EMPTY STATE ================= */}
            {notifications.length === 0 ? (
              <div
                className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-10
        text-center
        shadow-sm
      "
              >
                <MdNotificationsNone
                  size={50}
                  className="mx-auto mb-3 text-slate-400"
                />

                <h3 className="text-lg font-semibold text-slate-700">
                  No notifications
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  You don't have any notifications right now.
                </p>
              </div>
            ) : (
              /* ================= NOTIFICATION LIST ================= */
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            transition
            hover:shadow-md
            sm:gap-4
          "
                  >
                    {/* ================= ICON ================= */}
                    <div
                      className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-blue-50
              text-lg
            "
                    >
                      🔔
                    </div>

                    {/* ================= CONTENT ================= */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-800">
                        New Notification
                      </h4>

                      <p
                        className="
                mt-1
                wrap-break-word
                text-sm
                leading-6
                text-slate-600
              "
                      >
                        {notification.message}
                      </p>

                      <small className="mt-2 block text-xs text-slate-400">
                        {notification.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : ''}
                      </small>
                    </div>

                    {/* ================= DELETE BUTTON ================= */}
                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(notification._id)}
                      title="Delete notification"
                      aria-label="Delete notification"
                      className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-red-50
              hover:text-red-600
              active:scale-95
            "
                    >
                      <MdDelete size={20} />
                    </button>
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
