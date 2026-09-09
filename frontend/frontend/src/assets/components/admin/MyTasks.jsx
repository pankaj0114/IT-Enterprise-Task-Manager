import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Plus,
} from 'lucide-react';

const MyTasks = ({ admin }) => {
  // ==========================================
  // FORM
  // ==========================================

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [client, setClient] = useState('');
  const [assignedBy, setAssignedBy] = useState('');

  const [employees, setEmployees] = useState([]);

  const [assignedBySearch, setAssignedBySearch] = useState('');
  const [showAssignedByDropdown, setShowAssignedByDropdown] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [highlightedClientIndex, setHighlightedClientIndex] = useState(-1);

  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  const clientDropdownRef = useRef(null);

  // ==========================================
  // DATA
  // ==========================================

  const [myTasks, setMyTasks] = useState([]);
  //const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  // const [loadingClients, setLoadingClients] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  // Form values are kept in title, dueDate, client and assignedBy above.

  // ==========================================
  // FETCH MY TASKS
  // ==========================================
  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/admin/tasks/my',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('MY TASKS API RESPONSE:', response.data);

      setMyTasks(
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.tasks)
            ? response.data.tasks
            : [],
      );
    } catch (error) {
      console.error('FETCH MY TASKS ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      setMyTasks([]);
      setError(error.response?.data?.message || 'Failed to fetch your tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    // If admin selects Completed,
    // open the time popup first.
    if (newStatus === 'Completed') {
      const task = myTasks.find((item) => item._id === taskId);

      setSelectedTask(task);
      setHours('');
      setMinutes('');
      setShowPopup(true);

      return;
    }

    // For other statuses, update immediately
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      await axios.put(
        `http://localhost:5000/api/admin/tasks/${taskId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMyTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? { ...task, status: newStatus } : task,
        ),
      );
    } catch (error) {
      console.error('UPDATE STATUS ERROR:', error);

      setError(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleTitleChange = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!editingTitleValue.trim()) {
        setError('Task title cannot be empty.');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/tasks/my/${taskId}/title`,
        {
          title: editingTitleValue.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMyTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                title: response.data.task.title,
              }
            : task,
        ),
      );

      setEditingTitleId(null);
      setEditingTitleValue('');
      setError('');
    } catch (error) {
      console.error('UPDATE TITLE ERROR:', error);

      setError(error.response?.data?.message || 'Failed to update title');
    }
  };

  const handleDueDateChange = async (taskId, newDueDate) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `http://localhost:5000/api/admin/tasks/my/${taskId}/due-date`,
        {
          dueDate: newDueDate || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMyTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                dueDate: response.data.task.dueDate,
              }
            : task,
        ),
      );

      setError('');
    } catch (error) {
      console.error('UPDATE DUE DATE ERROR:', error);

      setError(error.response?.data?.message || 'Failed to update due date');
    }
  };
  const handleClientChange = async (taskId, clientId) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `http://localhost:5000/api/admin/tasks/my/${taskId}/client`,
        {
          client: clientId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('CLIENT UPDATED:', response.data);

      setMyTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? response.data.task : task,
        ),
      );

      setClientSearch('');
      setShowClientDropdown(false);
      setHighlightedClientIndex(-1);

      setError('');
    } catch (error) {
      console.error(
        'UPDATE CLIENT ERROR:',
        error.response?.data || error.message,
      );

      setError(error.response?.data?.message || 'Failed to update client');
    }
  };

  const filteredClients = clients.filter((item) => {
    const clientName = item.name || item.company || '';

    return clientName.toLowerCase().includes(clientSearch.trim().toLowerCase());
  });

  const handleRemarkChange = (taskId, value) => {
    setMyTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              remarks: value,
            }
          : task,
      ),
    );
  };

  const handleRemarkUpdate = async (taskId, remarks) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/tasks/${taskId}`,
        {
          remarks,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('REMARK UPDATED:', response.data);

      // Update the UI immediately
      const updatedTask = response.data.task;

      setMyTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                ...(updatedTask || {}),
                remarks: updatedTask?.remarks ?? remarks,
              }
            : task,
        ),
      );

      setSuccess('Remark updated successfully.');

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('UPDATE REMARK ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      setError(error.response?.data?.message || 'Failed to update remark.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false);
        setHighlightedClientIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    if (hours === '' || minutes === '') {
      setError('Please enter hours and minutes.');
      return;
    }

    const totalHours = Number(hours);
    const totalMinutes = Number(minutes);

    if (totalHours < 0) {
      setError('Hours cannot be negative.');
      return;
    }

    if (totalMinutes < 0 || totalMinutes > 59) {
      setError('Minutes must be between 0 and 59.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/tasks/${selectedTask._id}/status`,
        {
          status: 'Completed',
          totalHours,
          totalMinutes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('COMPLETED TASK:', response.data);

      setMyTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === selectedTask._id
            ? {
                ...task,
                status: 'Completed',
                totalHours,
                totalMinutes,
              }
            : task,
        ),
      );

      // Close popup
      setShowPopup(false);
      setSelectedTask(null);

      // Clear values
      setHours('');
      setMinutes('');

      //setSuccess('Task completed successfully');
    } catch (error) {
      console.error('COMPLETE TASK ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      setError(error.response?.data?.message || 'Failed to complete task');
    }
  };
  // ==========================================
  // FETCH CLIENTS
  // ==========================================

  const fetchClients = async () => {
    try {
      setLoadingClients(true);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Please login again.');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/admin/clients',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setClients(response.data || []);
    } catch (error) {
      console.error('FETCH CLIENTS ERROR:', error);

      setError(error.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/admin/employees/task-assignment',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('EMPLOYEES FOR ASSIGNED BY:', response.data);

      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error(
        'FETCH EMPLOYEES ERROR:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchClients();
    fetchMyTasks();
    fetchEmployees();
  }, []);

  // ==========================================
  // CREATE MY TASK
  // ==========================================

  const handleAddTask = async (event) => {
    event?.preventDefault();

    setError('');
    setSuccess('');

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Please enter a task title.');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    if (!assignedBy) {
      setError('Please select the employee who assigned this task.');
      return;
    }

    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('Authentication token not found. Please login again.');
      return;
    }

    try {
      setCreatingTask(true);

      const payload = {
        title: trimmedTitle,
        dueDate,
        client: client || null,
        assignedBy,
      };

      const response = await axios.post(
        'http://localhost:5000/api/admin/tasks/my',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('MY TASK CREATED:', response.data);

      setTitle('');
      setDueDate('');
      setClient('');
      setAssignedBy('');
      setAssignedBySearch('');
      setShowAssignedByDropdown(false);

      setSuccess('Task added successfully.');

      await fetchMyTasks();
    } catch (error) {
      console.error('CREATE MY TASK ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      setError(
        error.response?.data?.message ||
          'Failed to create task. Please try again.',
      );
    } finally {
      setCreatingTask(false);
    }
  };
  // ==========================================
  // COUNTS
  // ==========================================

  const pendingTasks = myTasks.filter((task) => task.status === 'Not Started');

  const inProgressTasks = myTasks.filter(
    (task) => task.status === 'In Progress',
  );

  const completedTasks = myTasks.filter((task) => task.status === 'Completed');

  // ==========================================
  // STATUS
  // ==========================================

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';

      case 'In Progress':
        return 'bg-blue-100 text-blue-700';

      case 'Not Started':
        return 'bg-orange-100 text-orange-700';

      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  // ==========================================
  // PRIORITY
  // ==========================================

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';

      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';

      case 'Low':
        return 'bg-slate-100 text-slate-600';

      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* =================================================
          MY TASK FORM
      ================================================= */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleAddTask}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* TITLE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </label>

              <div className="flex">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="h-12 w-full rounded-l-lg border border-slate-300 px-4 text-sm outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  disabled={creatingTask}
                  className="flex h-12 w-12 items-center justify-center rounded-r-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* DUE DATE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* CLIENT */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Client
              </label>

              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                disabled={loadingClients}
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">
                  {loadingClients ? 'Loading clients...' : 'Select a client'}
                </option>

                {clients.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name || item.company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ASSIGNED BY */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="task-assigned-by"
              className="text-sm font-semibold text-slate-700"
            >
              Assigned By
            </label>

            <div className="relative">
              <input
                id="task-assigned-by"
                type="text"
                autoComplete="off"
                placeholder="Search employee..."
                value={assignedBySearch}
                onFocus={() => {
                  setShowAssignedByDropdown(true);
                }}
                onChange={(e) => {
                  setAssignedBySearch(e.target.value);
                  setShowAssignedByDropdown(true);
                }}
                className="
        w-full
        rounded-lg
        border border-slate-300
        bg-white
        px-3.5 py-2.5
        text-sm text-slate-800
        outline-none
        transition-all
        focus:border-blue-400
        focus:ring-2
        focus:ring-blue-100
      "
              />

              {showAssignedByDropdown && (
                <div
                  className="
          absolute
          left-0
          right-0
          z-50
          mt-1
          max-h-60
          overflow-y-auto
          rounded-lg
          border
          border-slate-200
          bg-white
          shadow-xl
        "
                >
                  {employees
                    .filter((employee) =>
                      (employee.name || '')
                        .toLowerCase()
                        .includes(assignedBySearch.toLowerCase().trim()),
                    )
                    .map((employee) => (
                      <button
                        key={employee._id}
                        type="button"
                        onClick={() => {
                          setAssignedBy(employee._id);
                          setAssignedBySearch(employee.name);
                          setShowAssignedByDropdown(false);
                        }}
                        className="
                block
                w-full
                px-4
                py-3
                text-left
                text-sm
                text-slate-700
                hover:bg-blue-50
                hover:text-blue-700
              "
                      >
                        {employee.name}
                      </button>
                    ))}

                  {employees.filter((employee) =>
                    (employee.name || '')
                      .toLowerCase()
                      .includes(assignedBySearch.toLowerCase().trim()),
                  ).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No employees found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ADD TASK BUTTON */}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={creatingTask}
              className="rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingTask ? 'Adding...' : 'Add Task'}
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}
        </form>
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          My Tasks
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View tasks assigned to you.
        </p>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Tasks</p>

              <p className="mt-1 text-3xl font-bold text-slate-800">
                {myTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>

        {/* PENDING */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>

              <p className="mt-1 text-3xl font-bold text-slate-800">
                {pendingTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Clock3 size={22} />
            </div>
          </div>
        </div>

        {/* IN PROGRESS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">In Progress</p>

              <p className="mt-1 text-3xl font-bold text-slate-800">
                {inProgressTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CircleDot size={22} />
            </div>
          </div>
        </div>

        {/* COMPLETED */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>

              <p className="mt-1 text-3xl font-bold text-slate-800">
                {completedTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MY TASKS TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-800">My Tasks</h2>

          <p className="mt-1 text-sm text-slate-500">
            Tasks assigned to {admin?.name || 'you'}.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-225 text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Title
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Issue Date
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
                  Assigned By
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading my tasks...
                  </td>
                </tr>
              ) : myTasks.length === 0 ? (
                /* EMPTY */

                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center">
                      <AlertCircle className="mb-2 text-slate-400" size={28} />

                      <p>No tasks created yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* TASKS */

                myTasks.map((task) => (
                  <tr key={task._id} className="transition hover:bg-slate-50">
                    {/* =========================================
        TITLE
    ========================================= */}
                    <td className="px-5 py-4">
                      {editingTitleId === task._id ? (
                        <div className="flex min-w-56 items-center gap-2">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) =>
                              setEditingTitleValue(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleTitleChange(task._id);
                              }

                              if (e.key === 'Escape') {
                                setEditingTitleId(null);
                                setEditingTitleValue('');
                              }
                            }}
                            autoFocus
                            className="
              w-full
              rounded-md
              border border-blue-400
              px-3 py-2
              text-sm
              outline-none
              focus:ring-2
              focus:ring-blue-100
            "
                          />

                          <button
                            type="button"
                            onClick={() => handleTitleChange(task._id)}
                            className="
              rounded-md
              bg-blue-600
              px-3 py-2
              text-xs
              font-medium
              text-white
              hover:bg-blue-700
            "
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTitleId(task._id);
                            setEditingTitleValue(task.title || '');
                          }}
                          className="
            min-w-56
            text-left
            font-medium
            text-slate-800
            hover:text-blue-600
          "
                          title="Click to edit title"
                        >
                          {task.title || 'No title'}
                        </button>
                      )}
                    </td>

                    {/* =========================================
        ISSUE DATE
    ========================================= */}
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {task.issueDate
                        ? new Date(task.issueDate).toLocaleDateString('en-GB')
                        : task.createdAt
                          ? new Date(task.createdAt).toLocaleDateString('en-GB')
                          : 'N/A'}
                    </td>

                    <td className="px-5 py-4">
                      <input
                        type="date"
                        value={
                          task.dueDate
                            ? new Date(task.dueDate).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          handleDueDateChange(task._id, e.target.value)
                        }
                        className="
          rounded-lg
          border border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          text-slate-700
          outline-none
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-100
        "
                      />
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <select
                        value={task.status || 'Not Started'}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        className={`
          cursor-pointer
          rounded-full
          border-0
          px-3
          py-1
          text-xs
          font-semibold
          outline-none
          ${getStatusClass(task.status)}
        `}
                      >
                        <option value="Not Started">Not Started</option>

                        <option value="In Progress">In Progress</option>

                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    {/* =========================================
        CLIENT
    ========================================= */}
                    <td className="px-5 py-4">
                      <div
                        ref={clientDropdownRef}
                        className="relative min-w-52"
                      >
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Search client..."
                          value={clientSearch}
                          onFocus={() => {
                            setShowClientDropdown(true);
                            setHighlightedClientIndex(-1);
                          }}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowClientDropdown(true);
                            setHighlightedClientIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();

                              if (filteredClients.length === 0) {
                                return;
                              }

                              setHighlightedClientIndex((prev) =>
                                prev < filteredClients.length - 1
                                  ? prev + 1
                                  : 0,
                              );
                            }

                            if (e.key === 'ArrowUp') {
                              e.preventDefault();

                              if (filteredClients.length === 0) {
                                return;
                              }

                              setHighlightedClientIndex((prev) =>
                                prev > 0
                                  ? prev - 1
                                  : filteredClients.length - 1,
                              );
                            }

                            if (e.key === 'Enter') {
                              e.preventDefault();

                              if (
                                highlightedClientIndex >= 0 &&
                                filteredClients[highlightedClientIndex]
                              ) {
                                const selectedClient =
                                  filteredClients[highlightedClientIndex];

                                handleClientChange(
                                  task._id,
                                  selectedClient._id,
                                );

                                setClientSearch(
                                  selectedClient.name ||
                                    selectedClient.company ||
                                    '',
                                );
                              }
                            }

                            if (e.key === 'Escape') {
                              setShowClientDropdown(false);
                              setHighlightedClientIndex(-1);
                            }
                          }}
                          className="
            w-full
            rounded-lg
            border border-slate-300
            bg-white
            px-3
            py-2
            text-sm
            text-slate-700
            outline-none
            focus:border-blue-400
            focus:ring-2
            focus:ring-blue-100
          "
                        />

                        {showClientDropdown && (
                          <div
                            className="
              absolute
              left-0
              right-0
              top-full
              z-50
              mt-1
              max-h-60
              overflow-y-auto
              rounded-lg
              border
              border-slate-200
              bg-white
              shadow-xl
            "
                          >
                            {filteredClients.length > 0 ? (
                              filteredClients.map((item, index) => {
                                const clientName =
                                  item.name || item.company || 'Unnamed Client';

                                return (
                                  <button
                                    key={item._id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onMouseEnter={() =>
                                      setHighlightedClientIndex(index)
                                    }
                                    onClick={() => {
                                      handleClientChange(task._id, item._id);

                                      setClientSearch(clientName);
                                    }}
                                    className={`
                      block
                      w-full
                      px-4
                      py-3
                      text-left
                      text-sm
                      ${
                        highlightedClientIndex === index
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }
                    `}
                                  >
                                    {clientName}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500">
                                No clients found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Existing selected client */}
                      {task.client?.name && !clientSearch && (
                        <div className="mt-1 text-xs text-slate-500">
                          Current: {task.client.name}
                        </div>
                      )}
                    </td>

                    {/* =========================================
        ASSIGNED BY
    ========================================= */}
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {task.assignedBy?.name || 'Unknown'}
                    </td>

                    {/* =========================================
        REMARKS
    ========================================= */}
                    <td className="px-5 py-4">
                      <input
                        type="text"
                        value={task.remarks || ''}
                        onChange={(e) =>
                          handleRemarkChange(task._id, e.target.value)
                        }
                        onBlur={(e) =>
                          handleRemarkUpdate(task._id, e.target.value)
                        }
                        placeholder="Enter remarks"
                        className="w-full min-w-45 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                  min="0"
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
                  min="0"
                  max="59"
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
                  type="button"
                  onClick={() => {
                    setShowPopup(false);
                    setSelectedTask(null);
                    setHours('');
                    setMinutes('');
                  }}
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
                  type="button"
                  onClick={handleCompleteTask}
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
      </div>
    </div>
  );
};

export default MyTasks;
