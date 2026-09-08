import React, { useEffect, useState } from 'react';
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
  //const [client, setClient] = useState('');

  // ==========================================
  // FETCH MY TASKS
  // ==========================================

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');

      console.log('TOKEN:', token);
      console.log('TOKEN EXISTS:', !!token);

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

      console.log('MY TASKS RESPONSE:', response.data);

      setMyTasks(response.data || []);
    } catch (err) {
      console.error('FETCH MY TASKS ERROR:', err);

      console.log('STATUS:', err.response?.status);
      console.log('RESPONSE:', err.response?.data);

      setError(err.response?.data?.message || 'Failed to load my tasks');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchClients();
    fetchMyTasks();
  }, []);

  // ==========================================
  // CREATE MY TASK
  // ==========================================

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    if (!client) {
      setError('Please select a client');
      return;
    }

    try {
      setCreatingTask(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/admin/tasks/my',
        {
          title: title.trim(),
          dueDate,
          client,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('CREATED TASK:', response.data);

      // Add the newly saved task to the table
      setMyTasks((prev) => [response.data.task, ...prev]);

      // Clear form
      setTitle('');
      setDueDate('');
      setClient('');

      //setSuccess('Task added successfully');
    } catch (error) {
      console.error('CREATE TASK ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      setError(error.response?.data?.message || 'Failed to create task');
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
          View tasks created by you.
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
            Tasks created by {admin?.name || 'you'}.
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
                  Due Date
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Status
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Priority
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Client
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading my tasks...
                  </td>
                </tr>
              ) : myTasks.length === 0 ? (
                /* EMPTY */

                <tr>
                  <td
                    colSpan={5}
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
                    {/* TITLE */}

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {task.title || 'No title'}
                    </td>

                    {/* DUE DATE */}

                    <td className="px-5 py-4 text-slate-600">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-GB')
                        : 'N/A'}
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <select
                        value={task.status || 'Not Started'}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none cursor-pointer ${getStatusClass(
                          task.status,
                        )}`}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    {/* PRIORITY */}

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(
                          task.priority,
                        )}`}
                      >
                        {task.priority || 'Medium'}
                      </span>
                    </td>

                    {/* CLIENT */}

                    <td className="px-5 py-4 text-slate-600">
                      {task.client?.name || task.client?.company || 'No Client'}
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
