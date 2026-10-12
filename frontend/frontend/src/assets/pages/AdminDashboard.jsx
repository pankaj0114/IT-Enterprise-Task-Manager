import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MdPersonAdd, MdLogout } from 'react-icons/md';
import '../css/EmployeeDashboard.css';
import { Eye, EyeOff } from 'lucide-react';
import MyTasks from '../components/admin/MyTasks';
import AssignedTasks from '../components/admin/AssignedTasks';
import AdminAttendance from '../components/admin/AdminAttendance';

import { io } from 'socket.io-client';

import { MdCalendarMonth } from 'react-icons/md';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const [editingEmployeeData, setEditingEmployeeData] = useState({
    name: '',
    email: '',
    dateOfJoining: '',
  });

  const [employeeUpdateLoading, setEmployeeUpdateLoading] = useState(false);
  const [employeeUpdateError, setEmployeeUpdateError] = useState('');

  // Keep the selected Admin Dashboard section after a page refresh.
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('adminActiveTab');

    const validTabs = [
      'myTasks',
      'assignedTasks',
      'completedTasks',
      'userRegistration',
      'clients',
      'allTasks',
      'attendance',
      'employeePerformance',
      'notifications',
    ];

    return validTabs.includes(savedTab) ? savedTab : 'myTasks';
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  const [employees, setEmployees] = useState([]);

  // HR Manager registration and management
  const [hrManagers, setHrManagers] = useState([]);
  const [hrManagerName, setHrManagerName] = useState('');
  const [hrManagerEmail, setHrManagerEmail] = useState('');
  const [hrManagerPassword, setHrManagerPassword] = useState('');
  const [hrManagerConfirmPassword, setHrManagerConfirmPassword] = useState('');
  const [hrManagerDateOfJoining, setHrManagerDateOfJoining] = useState('');
  const [showHrManagerPassword, setShowHrManagerPassword] = useState(false);
  const [showHrManagerConfirmPassword, setShowHrManagerConfirmPassword] =
    useState(false);
  const [hrManagerLoading, setHrManagerLoading] = useState(false);
  const [hrManagerError, setHrManagerError] = useState('');
  const [hrManagerSuccess, setHrManagerSuccess] = useState('');
  const [editingHrManagerId, setEditingHrManagerId] = useState(null);
  const [editingHrManagerData, setEditingHrManagerData] = useState({
    name: '',
    email: '',
    dateOfJoining: '',
  });
  const [hrManagerUpdateLoading, setHrManagerUpdateLoading] = useState(false);
  const [hrManagerUpdateError, setHrManagerUpdateError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [clients, setClients] = useState([]);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    company: '',
  });

  const [creatingClient, setCreatingClient] = useState(false);

  const [clientMessage, setClientMessage] = useState('');

  const [clientError, setClientError] = useState('');

  const [selectedClient, setSelectedClient] = useState('');

  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [adminTasks, setAdminTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const [employeePerformance, setEmployeePerformance] = useState([]);

  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Used to force AdminAttendance to refresh when attendance changes.
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);

  const [showResetPassword, setShowResetPassword] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  const storedUser = localStorage.getItem('user');

  let loggedInAdmin = null;

  try {
    loggedInAdmin = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Invalid user data:', error);
  }

  const [admin, setAdmin] = useState(loggedInAdmin);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfJoining: '',
  });

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  // ==========================================
  // GET LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Invalid user data');
      }
    }
  }, []);

  // ==========================================
  // EDIT EMPLOYEE
  // ==========================================

  const handleStartEditEmployee = (employee) => {
    setEditingEmployeeId(employee._id);

    setEditingEmployeeData({
      name: employee.name || '',
      email: employee.email || '',
      dateOfJoining: employee.dateOfJoining
        ? String(employee.dateOfJoining).slice(0, 10)
        : '',
    });

    setEmployeeUpdateError('');
  };

  const handleCancelEditEmployee = () => {
    setEditingEmployeeId(null);

    setEditingEmployeeData({
      name: '',
      email: '',
      dateOfJoining: '',
    });

    setEmployeeUpdateError('');
  };

  const handleEmployeeEditChange = (field, value) => {
    setEditingEmployeeData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveEmployee = async (employeeId) => {
    if (!employeeId) {
      return;
    }

    const name = editingEmployeeData.name.trim();
    const email = editingEmployeeData.email.trim();
    const dateOfJoining = editingEmployeeData.dateOfJoining;

    if (!name) {
      setEmployeeUpdateError('Employee name is required.');
      return;
    }

    if (!email) {
      setEmployeeUpdateError('Employee email is required.');
      return;
    }

    if (!dateOfJoining) {
      setEmployeeUpdateError('Date of joining is required.');
      return;
    }

    try {
      setEmployeeUpdateLoading(true);
      setEmployeeUpdateError('');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setEmployeeUpdateError(
          'Authentication token not found. Please login again.',
        );
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/employees/${employeeId}`,
        {
          name,
          email,
          dateOfJoining,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const updatedEmployee = response.data.employee || response.data;

      setEmployees((previousEmployees) =>
        previousEmployees.map((employee) =>
          String(employee._id) === String(employeeId)
            ? {
                ...employee,
                ...updatedEmployee,
                name,
                email,
                dateOfJoining,
              }
            : employee,
        ),
      );

      setEditingEmployeeId(null);

      setEditingEmployeeData({
        name: '',
        email: '',
        dateOfJoining: '',
      });

      setEmployeeUpdateError('');
    } catch (error) {
      console.error(
        'UPDATE EMPLOYEE ERROR:',
        error.response?.data || error.message,
      );

      setEmployeeUpdateError(
        error.response?.data?.message || 'Failed to update employee details.',
      );
    } finally {
      setEmployeeUpdateLoading(false);
    }
  };

  // ==========================================
  // HR MANAGER MANAGEMENT
  // ==========================================

  const fetchHrManagers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.get(
        'http://localhost:5000/api/admin/hr-managers',
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setHrManagers(
        Array.isArray(response.data?.hrManagers)
          ? response.data.hrManagers
          : Array.isArray(response.data)
            ? response.data
            : [],
      );
    } catch (error) {
      console.error(
        'Error fetching HR managers:',
        error.response?.data || error.message,
      );
      setHrManagers([]);
    }
  };

  const handleRegisterHrManager = async (e) => {
    e.preventDefault();
    setHrManagerError('');
    setHrManagerSuccess('');

    const name = hrManagerName.trim();
    const email = hrManagerEmail.trim();

    if (!name) return setHrManagerError('Please enter HR Manager name.');
    if (!email) return setHrManagerError('Please enter HR Manager email.');
    if (!hrManagerPassword) return setHrManagerError('Please enter password.');
    if (hrManagerPassword.length < 6)
      return setHrManagerError('Password must be at least 6 characters long.');
    if (hrManagerPassword !== hrManagerConfirmPassword)
      return setHrManagerError('Passwords do not match.');
    if (!hrManagerDateOfJoining)
      return setHrManagerError('Please select date of joining.');

    try {
      setHrManagerLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setHrManagerError(
          'Authentication token not found. Please login again.',
        );
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/admin/register-hr-manager',
        {
          name,
          email,
          password: hrManagerPassword,
          confirmPassword: hrManagerConfirmPassword,
          dateOfJoining: hrManagerDateOfJoining,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data?.hrManager) {
        setHrManagers((previous) => [response.data.hrManager, ...previous]);
      } else {
        await fetchHrManagers();
      }

      setHrManagerName('');
      setHrManagerEmail('');
      setHrManagerPassword('');
      setHrManagerConfirmPassword('');
      setHrManagerDateOfJoining('');
      setHrManagerSuccess(
        response.data?.message || 'HR Manager registered successfully.',
      );
    } catch (error) {
      console.error(
        'Error registering HR Manager:',
        error.response?.data || error.message,
      );
      setHrManagerError(
        error.response?.data?.message || 'Unable to register HR Manager.',
      );
    } finally {
      setHrManagerLoading(false);
    }
  };

  const handleStartEditHrManager = (hrManager) => {
    setEditingHrManagerId(hrManager._id);
    setEditingHrManagerData({
      name: hrManager.name || '',
      email: hrManager.email || '',
      dateOfJoining: hrManager.dateOfJoining
        ? String(hrManager.dateOfJoining).slice(0, 10)
        : '',
    });
    setHrManagerUpdateError('');
  };

  const handleCancelEditHrManager = () => {
    setEditingHrManagerId(null);
    setEditingHrManagerData({ name: '', email: '', dateOfJoining: '' });
    setHrManagerUpdateError('');
  };

  const handleHrManagerEditChange = (field, value) => {
    setEditingHrManagerData((previous) => ({ ...previous, [field]: value }));
  };

  const handleSaveHrManager = async (hrManagerId) => {
    const name = editingHrManagerData.name.trim();
    const email = editingHrManagerData.email.trim();
    const dateOfJoining = editingHrManagerData.dateOfJoining;

    if (!name) return setHrManagerUpdateError('HR Manager name is required.');
    if (!email) return setHrManagerUpdateError('HR Manager email is required.');
    if (!dateOfJoining)
      return setHrManagerUpdateError('Date of joining is required.');

    try {
      setHrManagerUpdateLoading(true);
      setHrManagerUpdateError('');
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setHrManagerUpdateError(
          'Authentication token not found. Please login again.',
        );
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/hr-managers/${hrManagerId}`,
        { name, email, dateOfJoining },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const updatedHrManager =
        response.data?.hrManager || response.data?.user || response.data;

      setHrManagers((previous) =>
        previous.map((hrManager) =>
          String(hrManager._id) === String(hrManagerId)
            ? { ...hrManager, ...updatedHrManager, name, email, dateOfJoining }
            : hrManager,
        ),
      );

      setEditingHrManagerId(null);
      setEditingHrManagerData({ name: '', email: '', dateOfJoining: '' });
    } catch (error) {
      console.error(
        'UPDATE HR MANAGER ERROR:',
        error.response?.data || error.message,
      );
      setHrManagerUpdateError(
        error.response?.data?.message || 'Failed to update HR Manager details.',
      );
    } finally {
      setHrManagerUpdateLoading(false);
    }
  };

  const handleDeleteHrManager = async (hrManagerId) => {
    if (!window.confirm('Are you sure you want to delete this HR Manager?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      await axios.delete(
        `http://localhost:5000/api/admin/hr-managers/${hrManagerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setHrManagers((previous) =>
        previous.filter(
          (hrManager) => String(hrManager._id) !== String(hrManagerId),
        ),
      );

      if (String(editingHrManagerId) === String(hrManagerId)) {
        handleCancelEditHrManager();
      }
    } catch (error) {
      console.error(
        'DELETE HR MANAGER ERROR:',
        error.response?.data || error.message,
      );
      setHrManagerUpdateError(
        error.response?.data?.message || 'Failed to delete HR Manager.',
      );
    }
  };

  const fetchAdmin = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        navigate('/', { replace: true });
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.role !== 'admin') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
        return;
      }

      setAdmin(response.data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error(
        'Admin authentication failed:',
        error.response?.data || error.message,
      );
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, [navigate]);

  // ==========================================
  // FETCH EMPLOYEES
  // ==========================================

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/admin/employees',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching employees:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchHrManagers();
  }, []);

  // ==========================================
  // FETCH ALL CLIENTS
  // ==========================================

  const fetchAdminClients = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        console.error('Access token not found');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/admin/clients',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching admin clients:',
        error.response?.data || error.message,
      );

      setClients([]);
    }
  };

  useEffect(() => {
    fetchAdminClients();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // REGISTER EMPLOYEE
  // ==========================================

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();

    try {
      setErrorMessage('');
      setSuccessMessage('');

      if (!name.trim()) {
        setErrorMessage('Please enter employee name.');
        return;
      }

      if (!email.trim()) {
        setErrorMessage('Please enter employee email.');
        return;
      }

      if (!password) {
        setErrorMessage('Please enter password.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      if (!dateOfJoining) {
        setErrorMessage('Please select date of joining.');
        return;
      }

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setErrorMessage('Authentication token not found.');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/admin/register-employee',
        {
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          dateOfJoining,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const newEmployee = response.data.employee;

      setEmployees((prevEmployees) => [newEmployee, ...prevEmployees]);

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDateOfJoining('');
    } catch (error) {
      console.error(
        'Error registering employee:',
        error.response?.data || error.message,
      );

      setErrorMessage(
        error.response?.data?.message || 'Unable to register employee.',
      );
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this employee?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await axios.delete(
        `http://localhost:5000/api/users/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Employee deleted:', response.data);

      setEmployees((prev) =>
        prev.filter((employee) => String(employee._id) !== String(employeeId)),
      );
    } catch (error) {
      console.error(
        'Delete employee error:',
        error.response?.data || error.message,
      );
    }
  };

  const handleOpenResetPassword = (employee) => {
    setSelectedEmployee(employee);

    setNewPassword('');
    setConfirmNewPassword('');

    setResetPasswordError('');
    setResetPasswordSuccess('');

    setShowResetPassword(true);
  };

  const handleCloseResetPassword = () => {
    setShowResetPassword(false);

    setSelectedEmployee(null);

    setNewPassword('');
    setConfirmNewPassword('');

    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  const handleResetPassword = async () => {
    if (!selectedEmployee) {
      return;
    }

    if (!newPassword) {
      setResetPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setResetPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetPasswordError('Passwords do not match.');
      return;
    }

    try {
      setResetPasswordLoading(true);
      setResetPasswordError('');
      setResetPasswordSuccess('');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setResetPasswordError(
          'Authentication token not found. Please login again.',
        );
        return;
      }

      await axios.put(
        selectedEmployee.role === 'hr_manager'
          ? `http://localhost:5000/api/admin/hr-managers/${selectedEmployee._id}/reset-password`
          : `http://localhost:5000/api/admin/employees/${selectedEmployee._id}/reset-password`,
        {
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResetPasswordSuccess('Password reset successfully.');

      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        handleCloseResetPassword();
      }, 1200);
    } catch (error) {
      console.error('RESET PASSWORD ERROR:', error);

      setResetPasswordError(
        error.response?.data?.message || 'Failed to reset password.',
      );
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // ==========================================
  // CLIENT FORM CHANGE
  // ==========================================

  const handleClientFormChange = (e) => {
    const { name, value } = e.target;

    setClientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE CLIENT
  // ==========================================

  const handleCreateClient = async (e) => {
    e.preventDefault();

    setClientMessage('');
    setClientError('');

    const clientName = clientForm.name.trim();
    const clientEmail = clientForm.email.trim();
    const clientCompany = clientForm.company.trim();

    if (!clientName) {
      setClientError('Please enter client name.');
      return;
    }

    if (!clientEmail) {
      setClientError('Please enter client email.');
      return;
    }

    if (!clientCompany) {
      setClientError('Please enter company name.');
      return;
    }

    try {
      setCreatingClient(true);

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setClientError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/admin/clients',
        {
          name: clientName,
          email: clientEmail,
          company: clientCompany,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data?.client) {
        setClients((prevClients) => [response.data.client, ...prevClients]);
      }

      setClientForm({
        name: '',
        email: '',
        company: '',
      });

      setClientMessage(
        response.data?.message || 'Client created successfully.',
      );
    } catch (error) {
      console.error(
        'CREATE CLIENT ERROR:',
        error.response?.data || error.message,
      );

      setClientError(
        error.response?.data?.message || 'Failed to create client.',
      );
    } finally {
      setCreatingClient(false);
    }
  };

  const handleAssignClient = async () => {
    setClientMessage('');
    setClientError('');

    if (!selectedClient) {
      setClientError('Please select a client.');
      return;
    }

    if (selectedEmployees.length === 0) {
      setClientError('Please select at least one employee.');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setClientError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.put(
        'http://localhost:5000/api/admin/clients/assign',
        {
          clientId: selectedClient,
          employeeIds: selectedEmployees,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data?.client) {
        setClients((prevClients) =>
          prevClients.map((client) =>
            String(client._id) === String(selectedClient)
              ? response.data.client
              : client,
          ),
        );
      }

      setSelectedClient('');
      setSelectedEmployees([]);
    } catch (error) {
      console.error(
        'ASSIGN CLIENT ERROR:',
        error.response?.data || error.message,
      );

      setClientError(
        error.response?.data?.message || 'Failed to assign client.',
      );
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.error('Admin authentication token not found');
        return;
      }

      const dNotification = notifications.find(
        (notification) => notification._id === notificationId,
      );

      await axios.delete(
        `http://localhost:5000/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId),
      );

      if (dNotification && !dNotification.isRead) {
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error(
        'DELETE NOTIFICATION ERROR:',
        error.response?.data || error.message,
      );
    }
  };

  const fetchAdminTasks = async () => {
    try {
      setLoadingTasks(true);

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        console.error('Access token not found');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/admin/tasks',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setAdminTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching admin tasks:',
        error.response?.data || error.message,
      );

      setAdminTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) {
      console.error('Task ID is missing');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this task?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);

      const accessToken = localStorage.getItem('accessToken');

      await axios.delete(`http://localhost:5000/api/admin/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setAdminTasks((prevTasks) =>
        prevTasks.filter((task) => String(task._id) !== String(taskId)),
      );
    } catch (error) {
      console.error(
        'Error deleting task:',
        error.response?.data || error.message,
      );

      alert(error.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  // ==========================================
  // FETCH EMPLOYEE PERFORMANCE
  // ==========================================

  const fetchEmployeePerformance = async () => {
    try {
      setLoadingPerformance(true);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.error('Access token not found.');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/admin/employee-performance',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEmployeePerformance(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching employee performance:',
        error.response?.data || error.message,
      );

      setEmployeePerformance([]);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/notifications',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = Array.isArray(response.data?.notifications)
        ? response.data.notifications
        : [];
      console.log('NOTIFICATIONS API DATA:', data);
      console.log('NOTIFICATIONS LENGTH:', data.length);
      setNotifications(data);

      setUnreadNotificationCount(
        data.filter((notification) => !notification.isRead).length,
      );
    } catch (error) {
      console.error(
        'Fetch admin notifications error:',
        error.response?.data || error.message,
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

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

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadNotificationCount(0);
    } catch (error) {
      console.error('MARK READ ERROR:', error.response?.data || error.message);
    }
  };

  // ==========================================
  // REAL-TIME ADMIN DASHBOARD SYNC
  // ==========================================
  //
  // The dashboard must not depend on the currently selected tab to get
  // fresh data. Socket.IO gives us instant updates when the backend emits
  // an event, while the polling fallback keeps the dashboard synchronized
  // even if a backend route has not emitted a Socket.IO event yet.
  //
  useEffect(() => {
    if (!admin?._id) {
      return undefined;
    }

    let isMounted = true;

    const refreshSection = (section) => {
      if (!isMounted) {
        return;
      }

      console.log('🔄 ADMIN DASHBOARD UPDATE:', section);

      switch (section) {
        case 'employees':
        case 'users':
          fetchEmployees();
          break;

        case 'hrManagers':
        case 'hrManager':
          fetchHrManagers();
          break;

        case 'clients':
          fetchAdminClients();
          break;

        case 'tasks':
          fetchAdminTasks();
          break;

        case 'attendance':
          setAttendanceRefreshKey((previous) => previous + 1);
          break;

        case 'performance':
        case 'employeePerformance':
          fetchEmployeePerformance();
          break;

        case 'notifications':
          fetchNotifications();
          break;

        case 'all':
        default:
          fetchEmployees();
          fetchAdminClients();
          fetchAdminTasks();
          fetchEmployeePerformance();
          fetchNotifications();
          setAttendanceRefreshKey((previous) => previous + 1);
          break;
      }
    };

    const socket = io('http://localhost:5000', {
      // Polling first prevents the dashboard from depending on a successful
      // WebSocket upgrade. Socket.IO will upgrade to WebSocket automatically.
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('🟢 ADMIN SOCKET CONNECTED:', socket.id);

      socket.emit('join', String(admin._id));

      console.log('👤 ADMIN SOCKET ROOM:', String(admin._id));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ ADMIN SOCKET CONNECTION ERROR:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 ADMIN SOCKET DISCONNECTED:', reason);
    });

    // Notification event: update the badge immediately.
    socket.on('newNotification', (notification) => {
      if (!notification?._id) {
        return;
      }

      console.log('🔔 NEW NOTIFICATION RECEIVED:', notification);

      setNotifications((previous) => {
        const withoutDuplicate = previous.filter(
          (item) => String(item._id) !== String(notification._id),
        );

        return [notification, ...withoutDuplicate];
      });

      if (!notification.isRead) {
        setUnreadNotificationCount((previous) => previous + 1);
      }
    });

    // Section-specific Socket.IO events.
    socket.on('employeesUpdated', () => refreshSection('employees'));
    socket.on('usersUpdated', () => refreshSection('employees'));
    socket.on('hrManagersUpdated', () => refreshSection('hrManagers'));
    socket.on('clientsUpdated', () => refreshSection('clients'));
    socket.on('tasksUpdated', () => refreshSection('tasks'));
    socket.on('attendanceUpdated', () => refreshSection('attendance'));
    socket.on('employeePerformanceUpdated', () =>
      refreshSection('employeePerformance'),
    );
    socket.on('notificationsUpdated', () => refreshSection('notifications'));

    // Generic event supported by the backend:
    // io.emit('dashboardUpdated', { section: 'tasks' })
    socket.on('dashboardUpdated', (payload) => {
      const section = payload?.section || 'all';
      refreshSection(section);
    });

    // Background fallback:
    // This means the admin does NOT need to refresh the browser even when
    // another backend route changes data without emitting a socket event.
    const syncDashboard = () => {
      if (!isMounted) {
        return;
      }

      console.log('🔄 Background dashboard synchronization');

      fetchEmployees();
      fetchHrManagers();
      fetchAdminClients();
      fetchAdminTasks();
      fetchEmployeePerformance();
      fetchNotifications();
      setAttendanceRefreshKey((previous) => previous + 1);
    };

    // Initial synchronization after the admin is loaded.
    syncDashboard();

    // Re-check all dashboard data every 10 seconds.
    const syncInterval = window.setInterval(syncDashboard, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(syncInterval);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [admin?._id]);

  // Keep the currently selected section fresh as well. This remains useful
  // for components whose own internal state changes while they are visible.
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }

    if (activeTab === 'employeePerformance') {
      fetchEmployeePerformance();
    }

    if (
      activeTab === 'allTasks' ||
      activeTab === 'myTasks' ||
      activeTab === 'assignedTasks'
    ) {
      fetchAdminTasks();
    }
  }, [activeTab]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const [registrationRole, setRegistrationRole] = useState('employee');
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfJoining: '',
  });
  const [unifiedUserLoading, setUnifiedUserLoading] = useState(false);
  const [unifiedUserError, setUnifiedUserError] = useState('');
  const [unifiedUserSuccess, setUnifiedUserSuccess] = useState('');

  const handleUnifiedRegister = async (e) => {
    e.preventDefault();
    setUnifiedUserError('');
    setUnifiedUserSuccess('');
    if (registrationForm.password !== registrationForm.confirmPassword)
      return setUnifiedUserError('Passwords do not match.');
    if (registrationForm.password.length < 6)
      return setUnifiedUserError(
        'Password must be at least 6 characters long.',
      );
    const token = localStorage.getItem('accessToken');
    if (!token)
      return setUnifiedUserError(
        'Authentication token not found. Please login again.',
      );
    const isHr = registrationRole === 'hr_manager';
    try {
      setUnifiedUserLoading(true);
      const url = isHr
        ? 'http://localhost:5000/api/admin/register-hr-manager'
        : 'http://localhost:5000/api/admin/register-employee';
      const response = await axios.post(url, registrationForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (isHr) await fetchHrManagers();
      else await fetchEmployees();
      setRegistrationForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfJoining: '',
      });
      setUnifiedUserSuccess(
        response.data?.message ||
          `${isHr ? 'HR Manager' : 'Employee'} registered successfully.`,
      );
    } catch (error) {
      setUnifiedUserError(
        error.response?.data?.message || 'Unable to register user.',
      );
    } finally {
      setUnifiedUserLoading(false);
    }
  };

  const [unifiedEditingId, setUnifiedEditingId] = useState(null);
  const [unifiedEditingRole, setUnifiedEditingRole] = useState(null);
  const [unifiedEditingData, setUnifiedEditingData] = useState({
    name: '',
    email: '',
    dateOfJoining: '',
  });
  const [unifiedEditLoading, setUnifiedEditLoading] = useState(false);

  const handleUnifiedEdit = (record) => {
    setUnifiedEditingId(record._id);
    setUnifiedEditingRole(record.role);
    setUnifiedEditingData({
      name: record.name || '',
      email: record.email || '',
      dateOfJoining: record.dateOfJoining
        ? String(record.dateOfJoining).slice(0, 10)
        : '',
    });
    setUnifiedUserError('');
    setUnifiedUserSuccess('');
  };

  const handleCancelUnifiedEdit = () => {
    setUnifiedEditingId(null);
    setUnifiedEditingRole(null);
    setUnifiedEditingData({ name: '', email: '', dateOfJoining: '' });
    setUnifiedUserError('');
  };

  const handleSaveUnifiedEdit = async (record) => {
    const name = unifiedEditingData.name.trim();
    const email = unifiedEditingData.email.trim();
    const dateOfJoining = unifiedEditingData.dateOfJoining;

    if (!name || !email || !dateOfJoining) {
      setUnifiedUserError('Name, email, and date of joining are required.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUnifiedUserError(
        'Authentication token not found. Please login again.',
      );
      return;
    }

    try {
      setUnifiedEditLoading(true);
      setUnifiedUserError('');
      const url =
        record.role === 'hr_manager'
          ? `http://localhost:5000/api/admin/hr-managers/${record._id}`
          : `http://localhost:5000/api/admin/employees/${record._id}`;

      await axios.put(
        url,
        { name, email, dateOfJoining },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (record.role === 'hr_manager') await fetchHrManagers();
      else await fetchEmployees();

      setUnifiedEditingId(null);
      setUnifiedEditingRole(null);
      setUnifiedEditingData({ name: '', email: '', dateOfJoining: '' });
      setUnifiedUserSuccess('User details updated successfully.');
    } catch (error) {
      setUnifiedUserError(
        error.response?.data?.message || 'Unable to update user details.',
      );
      setUnifiedUserSuccess('');
    } finally {
      setUnifiedEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className="
    fixed
    left-0
    top-0
    bottom-0
    z-40

    w-16
    sm:w-20
    lg:w-64

    min-h-screen

    flex
    flex-col

    overflow-y-auto

    bg-slate-900
    text-white

    border-r
    border-slate-700
    shadow-lg

    transition-all
    duration-300
  "
      >
        {/* Admin Info */}

        <div
          className="
          px-2
          py-4
          border-b
          border-slate-700
          sm:px-4
          sm:py-5
          lg:px-6
          lg:py-6
        "
        >
          <p
            className="
            text-center
            text-[10px]
            text-slate-400
            uppercase
            tracking-wider
            lg:text-left
            lg:text-xs
          "
          >
            <span className="hidden lg:inline">Admin</span>
            <span className="lg:hidden">A</span>
          </p>

          <h3
            className="
            mt-1
            hidden
            truncate
            text-center
            text-lg
            font-semibold
            lg:block
            lg:text-left
          "
          >
            {admin?.name || 'Loading...'}
          </h3>

          <div
            className="
              mx-auto
              mt-1
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-blue-600
              text-sm
              font-bold
              lg:hidden
            "
          >
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1.5 px-1.5 py-4 sm:space-y-2 sm:px-2 sm:py-5 lg:px-3">
          {/* My Tasks */}
          <button
            type="button"
            onClick={() => handleTabChange('myTasks')}
            className={`
    flex
    w-full
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'myTasks'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <span className="text-lg">📋</span>

            <span className="hidden lg:inline">My Tasks</span>
          </button>

          {/* Assigned Tasks */}
          <button
            type="button"
            onClick={() => handleTabChange('assignedTasks')}
            className={`
    flex
    w-full
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'assignedTasks'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <span className="text-lg">📤</span>

            <span className="hidden lg:inline">Assigned Tasks</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('userRegistration')}
            className={`
              flex
              w-full
              items-center
              justify-center
              gap-3
              rounded-lg
              px-3
              py-3
              text-left
              transition
              lg:justify-start
              lg:px-4
              ${
                activeTab === 'userRegistration'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }
            `}
          >
            <MdPersonAdd size={22} />

            <span className="hidden lg:inline">User Registration</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('clients')}
            className={`
              flex
              w-full
              items-center
              justify-center
              gap-3
              rounded-lg
              px-3
              py-3
              text-left
              transition
              lg:justify-start
              lg:px-4
              ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }
            `}
          >
            <span className="shrink-0 text-lg">👥</span>

            <span className="hidden lg:inline">Clients</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('allTasks')}
            className={`
    w-full
    flex
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'allTasks'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <span className="text-lg">📋</span>
            <span className="hidden lg:inline">All Tasks</span>
          </button>

          {/* Attendance */}
          <button
            type="button"
            onClick={() => handleTabChange('attendance')}
            className={`
    flex
    w-full
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'attendance'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <MdCalendarMonth size={22} />

            <span className="hidden lg:inline">Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('employeePerformance')}
            className={`
    mt-2
    flex
    w-full
    items-center
    justify-center
    gap-2
    rounded-lg
    px-2
    py-3
    text-left
    transition
    lg:justify-start
    lg:gap-3
    lg:px-4

    ${
      activeTab === 'employeePerformance'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }
  `}
          >
            <span className="text-lg">📊</span>

            <span className="hidden lg:inline">Employee Performance</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              handleTabChange('notifications');
            }}
            className={`
    mt-2
    flex
    w-full
    items-center
    justify-between
    gap-2
    rounded-lg
    px-2
    py-3
    text-left
    transition
    lg:px-4

    ${
      activeTab === 'notifications'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }
  `}
          >
            {' '}
            <div className="flex min-w-0 items-center justify-center gap-2 lg:justify-start lg:gap-3">
              <span className="shrink-0 text-lg">🔔</span>

              <span className="hidden lg:inline">Notifications</span>
            </div>
            {unreadNotificationCount > 0 && (
              <span
                className="
        min-w-6
        rounded-full
        bg-red-500
        px-2
        py-0.5
        text-center
        text-xs
        font-bold
        text-white
      "
              >
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </button>
        </nav>

        {/* Logout */}

        <div className="border-t border-slate-700 p-2 lg:p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              rounded-lg
              bg-red-500
              hover:bg-red-600
              transition
              font-medium
            "
          >
            <MdLogout size={20} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* ======================================
          MAIN PANEL
      ====================================== */}

      <main
        className="
    min-h-screen
    min-w-0

    ml-8
    w-[calc(100%-4.5rem)]

    px-3
    py-4

    sm:ml-22
    sm:w-[calc(100%-5.5rem)]
    sm:px-5
    sm:py-6

    lg:ml-68
    lg:w-[calc(100%-17rem)]
    lg:px-6
    lg:py-8

    pb-8

    bg-slate-50

    transition-all
    duration-300
  "
      >
        {activeTab === 'myTasks' && (
          <MyTasks tasks={adminTasks} loading={loadingTasks} admin={admin} />
        )}

        {activeTab === 'attendance' && (
          <AdminAttendance key={attendanceRefreshKey} />
        )}

        {activeTab === 'assignedTasks' && (
          <AssignedTasks
            tasks={adminTasks}
            loading={loadingTasks}
            admin={admin}
          />
        )}
        {activeTab === 'userRegistration' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                User Registration
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Register and manage employees and HR managers from one place.
              </p>
            </div>
            <form
              onSubmit={handleUnifiedRegister}
              className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="mb-5 text-lg font-semibold text-slate-800">
                Register User
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Role
                  </label>
                  <select
                    value={registrationRole}
                    onChange={(e) => setRegistrationRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr_manager">HR Manager</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    required
                    value={registrationForm.name}
                    onChange={(e) =>
                      setRegistrationForm((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={registrationForm.email}
                    onChange={(e) =>
                      setRegistrationForm((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date of Joining
                  </label>
                  <input
                    required
                    type="date"
                    value={registrationForm.dateOfJoining}
                    onChange={(e) =>
                      setRegistrationForm((p) => ({
                        ...p,
                        dateOfJoining: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={registrationForm.password}
                    onChange={(e) =>
                      setRegistrationForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={registrationForm.confirmPassword}
                    onChange={(e) =>
                      setRegistrationForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
              {unifiedUserError && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {unifiedUserError}
                </p>
              )}
              {unifiedUserSuccess && (
                <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {unifiedUserSuccess}
                </p>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  disabled={unifiedUserLoading}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {unifiedUserLoading ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  Registered Users
                </h2>
                <span className="text-sm text-slate-500">
                  {employees.length + hrManagers.length} users
                </span>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-212.5text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      {[
                        'Name',
                        'Email',
                        'Role',
                        'Date of Joining',
                        'Reset Password',
                        'Action',
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ...employees.map((u) => ({ ...u, role: 'employee' })),
                      ...hrManagers.map((u) => ({ ...u, role: 'hr_manager' })),
                    ].map((u) => {
                      const isEditing =
                        String(unifiedEditingId) === String(u._id) &&
                        unifiedEditingRole === u.role;
                      const editInputClass =
                        'w-full min-w-[140px] rounded-md border border-blue-300 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200';
                      return (
                        <tr key={u._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {isEditing ? (
                              <input
                                aria-label="Edit name"
                                value={unifiedEditingData.name}
                                onChange={(e) =>
                                  setUnifiedEditingData((p) => ({
                                    ...p,
                                    name: e.target.value,
                                  }))
                                }
                                className={editInputClass}
                              />
                            ) : (
                              u.name
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {isEditing ? (
                              <input
                                aria-label="Edit email"
                                type="email"
                                value={unifiedEditingData.email}
                                onChange={(e) =>
                                  setUnifiedEditingData((p) => ({
                                    ...p,
                                    email: e.target.value,
                                  }))
                                }
                                className={editInputClass}
                              />
                            ) : (
                              u.email
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.role === 'hr_manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                            >
                              {u.role === 'hr_manager'
                                ? 'HR Manager'
                                : 'Employee'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {isEditing ? (
                              <input
                                aria-label="Edit date of joining"
                                type="date"
                                value={unifiedEditingData.dateOfJoining}
                                onChange={(e) =>
                                  setUnifiedEditingData((p) => ({
                                    ...p,
                                    dateOfJoining: e.target.value,
                                  }))
                                }
                                className={editInputClass}
                              />
                            ) : u.dateOfJoining ? (
                              new Date(u.dateOfJoining).toLocaleDateString()
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenResetPassword(u)}
                              className="rounded-lg border border-amber-300 px-3 py-1.5 font-medium text-amber-700 hover:bg-amber-50"
                            >
                              Reset Password
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  disabled={unifiedEditLoading}
                                  onClick={() => handleSaveUnifiedEdit(u)}
                                  className="mr-2 rounded-lg border border-green-300 px-3 py-1.5 font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                                >
                                  {unifiedEditLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  disabled={unifiedEditLoading}
                                  onClick={handleCancelUnifiedEdit}
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUnifiedEdit(u)}
                                  className="mr-2 rounded-lg border border-blue-300 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    u.role === 'hr_manager'
                                      ? handleDeleteHrManager(u._id)
                                      : handleDeleteEmployee(u._id)
                                  }
                                  className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {employees.length + hrManagers.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                Clients
              </h1>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                Create clients and assign them to one or multiple employees.
              </p>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-800">
                  Add New Client
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a new client to your CRM.
                </p>
              </div>

              <form onSubmit={handleCreateClient}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Client Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={clientForm.name}
                      onChange={handleClientFormChange}
                      placeholder="Enter client name"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={clientForm.email}
                      onChange={handleClientFormChange}
                      placeholder="client@example.com"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Company
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={clientForm.company}
                      onChange={handleClientFormChange}
                      placeholder="Enter company name"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {clientError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {clientError}
                  </div>
                )}

                {clientMessage && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                    {clientMessage}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="w-full rounded-lg bg-blue-600 px-6 py-2.5 sm:w-auto text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingClient ? 'Adding Client...' : 'Add Client'}
                  </button>
                </div>
              </form>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-800">
                  Assign Client
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assign one client to one or multiple employees.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Select Client
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => {
                      const clientId = e.target.value;
                      setSelectedClient(clientId);
                      const selectedClientData = clients.find(
                        (client) => String(client._id) === String(clientId),
                      );
                      if (
                        selectedClientData &&
                        Array.isArray(selectedClientData.assignedTo)
                      ) {
                        setSelectedEmployees(
                          selectedClientData.assignedTo.map((employee) =>
                            String(employee._id || employee),
                          ),
                        );
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                        {client.company ? ` - ${client.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assign To Employee(s)
                  </label>
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
                    {employees.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">
                        No employees available.
                      </p>
                    ) : (
                      employees.map((employee) => {
                        const employeeId = String(employee._id);
                        const isChecked =
                          selectedEmployees.includes(employeeId);

                        return (
                          <label
                            key={employee._id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition ${isChecked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                          >
                            <input
                              type="checkbox"
                              value={employeeId}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmployees((prev) => [
                                    ...prev,
                                    employeeId,
                                  ]);
                                } else {
                                  setSelectedEmployees((prev) =>
                                    prev.filter((id) => id !== employeeId),
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700">
                                {employee.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {employee.email}
                              </p>
                            </div>
                            {isChecked && (
                              <span className="ml-auto text-xs font-semibold text-blue-600">
                                Selected
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {selectedEmployees.length} employee
                    {selectedEmployees.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleAssignClient}
                  disabled={!selectedClient || selectedEmployees.length === 0}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Assign Client
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    All Clients
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    View clients and their employee assignments.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  {clients.length} client{clients.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-212.5 text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Client
                      </th>
                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Email
                      </th>
                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Company
                      </th>
                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Assigned To
                      </th>
                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No clients available.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr
                          key={client._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-3 py-3 sm:px-5 sm:py-4 font-medium text-slate-800">
                            {client.name || 'N/A'}
                          </td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4 text-slate-600">
                            {client.email || 'N/A'}
                          </td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4 text-slate-600">
                            {client.company || 'N/A'}
                          </td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {Array.isArray(client.assignedTo) &&
                            client.assignedTo.length > 0 ? (
                              <div className="flex max-w-md flex-wrap gap-1.5">
                                {client.assignedTo.map((employee) => (
                                  <span
                                    key={employee._id}
                                    className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {employee.name || 'Unknown'}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {Array.isArray(client.assignedTo) &&
                            client.assignedTo.length > 0 ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Assigned
                              </span>
                            ) : (
                              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                Available
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'allTasks' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <div className="mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                    All Tasks
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    View and manage every task in the system.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  {adminTasks.length} task{adminTasks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-350 text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Title
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Assigned By
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Assigned To
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Due Date
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Client
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Remarks
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Time Taken
                      </th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingTasks ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-10 sm:px-6 sm:py-12 text-center text-slate-500"
                        >
                          Loading tasks...
                        </td>
                      </tr>
                    ) : adminTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-10 sm:px-6 sm:py-12 text-center text-slate-500"
                        >
                          No tasks found.
                        </td>
                      </tr>
                    ) : (
                      adminTasks.map((task) => (
                        <tr
                          key={task._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 font-medium text-slate-800">
                            {task.title || 'No title'}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {task.assignedBy?.name || 'Unknown'}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {task.assignedTo?.name || 'Unknown'}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                task.status === 'Not Started'
                                  ? 'bg-orange-100 text-orange-700'
                                  : task.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : task.status === 'Completed'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.status || 'Not Started'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {task.client?.name || 'No client'}
                          </td>
                          <td className="max-w-65 px-3 py-4 sm:px-5 text-slate-600">
                            <div className="line-clamp-2">
                              {task.remarks || 'No remarks'}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {task.status === 'Completed'
                              ? `${task.totalHours ?? 0}h ${task.totalMinutes ?? 0}m`
                              : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={deletingTaskId === task._id}
                              onClick={() => handleDeleteTask(task._id)}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingTaskId === task._id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employeePerformance' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <div className="mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                    Employee Performance
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 sm:text-base">
                    Monitor completed tasks and total time spent by each
                    employee.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchEmployeePerformance}
                  disabled={loadingPerformance}
                  className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {loadingPerformance ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Employees
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-800">
                      {employeePerformance.length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    👥
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Completed Tasks
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-800">
                      {employeePerformance.reduce(
                        (total, employee) =>
                          total + Number(employee.completedTasks || 0),
                        0,
                      )}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-xl text-green-600">
                    ✓
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Time Spent
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-800">
                      {(() => {
                        const totalMinutes = employeePerformance.reduce(
                          (total, employee) =>
                            total + Number(employee.totalMinutesSpent || 0),
                          0,
                        );
                        return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
                      })()}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-xl">
                    ⏱
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Employee Performance
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Summary of completed work and time spent.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  {employeePerformance.length} employees
                </span>
              </div>

              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-237.5 text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Email
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-600">
                        Completed Tasks
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-600">
                        Total Hours
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-600">
                        Total Minutes
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-600">
                        Total Time
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-600">
                        Avg. Time / Task
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingPerformance ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-14 text-center text-slate-500"
                        >
                          Loading employee performance...
                        </td>
                      </tr>
                    ) : employeePerformance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-14 text-center text-slate-500"
                        >
                          No employee performance data available.
                        </td>
                      </tr>
                    ) : (
                      employeePerformance.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-600">
                                {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {employee.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Employee
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-slate-600">
                            {employee.email}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex min-w-12 items-center justify-center rounded-full bg-green-50 px-3 py-1.5 font-semibold text-green-700">
                              {employee.completedTasks}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center font-semibold text-slate-700">
                            {employee.totalHours}h
                          </td>
                          <td className="px-6 py-5 text-center font-semibold text-slate-700">
                            {employee.totalMinutes}m
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                              {employee.totalHours}h {employee.totalMinutes}m
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center text-slate-600">
                            {employee.averageTime}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="mx-auto w-full min-w-0 max-w-5xl">
            <div className="mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                    Notifications
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Important activity and security notifications.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  {unreadNotificationCount} unread
                </span>
                <button
                  type="button"
                  onClick={markNotificationsAsRead}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Mark all as read
                </button>
              </div>
            </div>

            {loadingNotifications ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                  🔔
                </div>
                <h3 className="text-lg font-semibold text-slate-700">
                  No notifications
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  You don't have any notifications right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 ${
                      notification.isRead
                        ? 'border-slate-200'
                        : 'border-blue-200 bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">
                        {notification.type === 'password_changed' ? '🔐' : '🔔'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800">
                              {notification.type === 'password_changed'
                                ? 'Password Changed'
                                : 'Notification'}
                            </h4>
                            {!notification.isRead && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                New
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteNotification(notification._id)
                            }
                            className="self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 sm:self-auto"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="mt-1 wrap-break-word text-sm leading-6 text-slate-600">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:gap-3">
                          {notification.sender?.name && (
                            <span>Employee: {notification.sender.name}</span>
                          )}
                          <span>
                            {notification.createdAt
                              ? new Date(
                                  notification.createdAt,
                                ).toLocaleString()
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
