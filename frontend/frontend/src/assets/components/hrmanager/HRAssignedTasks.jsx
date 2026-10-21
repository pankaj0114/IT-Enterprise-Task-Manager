// HRAssignedTasks.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Send,
  Clock3,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const HRAssignedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  const [loadingTasks, setLoadingTasks] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [client, setClient] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const [editingTasks, setEditingTasks] = useState({});

  const getToken = () => localStorage.getItem('accessToken');

  const authConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  });

  const normalizeArray = (data, keys = []) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);

    try {
      const response = await axios.get(
        `${API_BASE}/api/hr/tasks/assigned`,
        authConfig(),
      );

      setTasks(normalizeArray(response.data, ['tasks']));
    } catch (error) {
      console.error(error);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/hr/employees/task-assignment`,
        authConfig(),
      );

      setEmployees(normalizeArray(response.data, ['employees', 'users']));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/hr/clients`,
        authConfig(),
      );

      setClients(normalizeArray(response.data, ['clients']));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchClients();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE}/api/hr/tasks/assign`,
        {
          title,
          dueDate,
          priority,
          client: client || null,
          assignedTo,
        },
        authConfig(),
      );

      setTitle('');
      setDueDate('');
      setPriority('Medium');
      setClient('');
      setAssignedTo('');

      setSuccess('Task assigned successfully');

      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
    } finally {
      setSaving(false);
    }
  };

  const setLocalTaskValue = (taskId, field, value) => {
    setEditingTasks((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [field]: value,
      },
    }));
  };

  const getTaskValue = (task, field) => {
    if (editingTasks[task._id] && editingTasks[task._id][field] !== undefined) {
      return editingTasks[task._id][field];
    }

    if (field === 'client') {
      return typeof task.client === 'object'
        ? task.client?._id || ''
        : task.client || '';
    }

    return task[field] || '';
  };

  const updateTask = async (taskId, field, value) => {
    try {
      if (field === 'remarks') {
        await axios.put(
          `${API_BASE}/api/hr/tasks/${taskId}/remarks`,
          { remarks: value },
          authConfig(),
        );
      } else {
        await axios.put(
          `${API_BASE}/api/hr/tasks/${taskId}`,
          { [field]: value },
          authConfig(),
        );
      }

      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTasks = tasks.filter((task) => task.status === 'Not Started');

  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');

  const completedTasks = tasks.filter((task) => task.status === 'Completed');

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Create Task */}

      <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold">Assign New Task</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleCreateTask}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <input
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border px-4 py-3"
            />

            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Select Client</option>

              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Select Employee</option>

              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white"
            >
              {saving ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>

      {/* Summary Cards */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex justify-between">
            <div>
              <p>Total</p>
              <h2 className="text-3xl font-bold">{tasks.length}</h2>
            </div>
            <Send />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex justify-between">
            <div>
              <p>Pending</p>
              <h2 className="text-3xl font-bold">{pendingTasks.length}</h2>
            </div>
            <Clock3 />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex justify-between">
            <div>
              <p>In Progress</p>
              <h2 className="text-3xl font-bold">{inProgressTasks.length}</h2>
            </div>
            <CircleDot />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex justify-between">
            <div>
              <p>Completed</p>
              <h2 className="text-3xl font-bold">{completedTasks.length}</h2>
            </div>
            <CheckCircle2 />
          </div>
        </div>
      </div>

      {/* Assigned Tasks Table */}

      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Tasks Assigned By Me</h2>

        <button
          onClick={fetchTasks}
          className="flex items-center gap-2 rounded-lg border px-4 py-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-250">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Remarks</th>
              </tr>
            </thead>

            <tbody>
              {loadingTasks ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <AlertCircle className="mx-auto mb-2" />
                    No tasks assigned yet
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task._id} className="border-t">
                    <td className="px-4 py-3">{task.title}</td>

                    <td className="px-4 py-3">{task.assignedTo?.name}</td>

                    <td className="px-4 py-3">
                      {task.dueDate ? String(task.dueDate).slice(0, 10) : '-'}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={task.status || 'Not Started'}
                        onChange={(e) =>
                          updateTask(task._id, 'status', e.target.value)
                        }
                        className="rounded border px-3 py-2"
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">{task.client?.name || '-'}</td>

                    <td className="px-4 py-3">
                      <input
                        value={getTaskValue(task, 'remarks')}
                        onChange={(e) =>
                          setLocalTaskValue(task._id, 'remarks', e.target.value)
                        }
                        onBlur={() =>
                          updateTask(
                            task._id,
                            'remarks',
                            getTaskValue(task, 'remarks'),
                          )
                        }
                        className="w-full rounded border px-3 py-2"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRAssignedTasks;
