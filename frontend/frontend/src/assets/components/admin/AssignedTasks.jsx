import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Send,
  Clock3,
  CheckCircle2,
  CircleDot,
  AlertCircle,
} from 'lucide-react';

const AssignedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignedTasks, setAssignedTasks] = useState([]);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/admin/tasks/assigned',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(
        'FETCH ASSIGNED TASKS ERROR:',
        err.response?.data || err.message,
      );

      setError(err.response?.data?.message || 'Failed to load assigned tasks');

      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  if (loading) {
    return <div className="p-4">Loading assigned tasks...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';

      case 'In Progress':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';

      case 'Low':
        return 'bg-slate-100 text-slate-600';

      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const pendingTasks = tasks.filter((task) => task.status === 'Not Started');

  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');

  const completedTasks = tasks.filter((task) => task.status === 'Completed');

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          Assigned Tasks
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View tasks that you have assigned to employees.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Assigned</p>

              <p className="mt-1 text-3xl font-bold text-slate-800">
                {assignedTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Send size={22} />
            </div>
          </div>
        </div>

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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Tasks Assigned By Me
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor tasks assigned to your employees.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-275 text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Title
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
                  Priority
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Client
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading assigned tasks...
                  </td>
                </tr>
              ) : assignedTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center">
                      <AlertCircle className="mb-2 text-slate-400" size={28} />
                      <p>You have not assigned any tasks yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assignedTasks.map((task) => (
                  <tr key={task._id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {task.title || 'No title'}
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-700">
                          {task.assignedTo?.name || 'Unknown'}
                        </p>

                        {task.assignedTo?.email && (
                          <p className="mt-1 text-xs text-slate-400">
                            {task.assignedTo.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'N/A'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          task.status,
                        )}`}
                      >
                        {task.status || 'Not Started'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(
                          task.priority,
                        )}`}
                      >
                        {task.priority || 'Medium'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {task.client?.name || task.client?.company || 'No Client'}
                    </td>

                    <td className="max-w-62.5 px-5 py-4 text-slate-500">
                      <span className="line-clamp-2">
                        {task.remarks || 'No remarks'}
                      </span>
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

export default AssignedTasks;
