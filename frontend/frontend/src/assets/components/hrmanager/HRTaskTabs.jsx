import React, { useEffect, useState } from 'react';
import HRSectionShell from './HRSectionShell';
import { hrGet, hrPut } from './hrApi';

const TaskTable = ({
  tasks,
  loading,
  title,
  description,
  allowDelete = false,
  onDelete,
}) => (
  <HRSectionShell title={title} description={description}>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-250 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                'Title',
                'Assigned By',
                'Assigned To',
                'Due Date',
                'Status',
                'Client',
                'Remarks',
                'Time Taken',
                ...(allowDelete ? ['Action'] : []),
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-4 text-left font-semibold text-slate-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={allowDelete ? 9 : 8}
                  className="px-6 py-14 text-center text-slate-500"
                >
                  Loading tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={allowDelete ? 9 : 8}
                  className="px-6 py-14 text-center text-slate-500"
                >
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-50">
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
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}
                    >
                      {task.status || 'Not Started'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {task.client?.name || 'No client'}
                  </td>
                  <td className="max-w-65 px-5 py-4 text-slate-600">
                    <div className="line-clamp-2">
                      {task.remarks || 'No remarks'}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {task.status === 'Completed'
                      ? `${task.totalHours ?? 0}h ${task.totalMinutes ?? 0}m`
                      : '—'}
                  </td>
                  {allowDelete && (
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onDelete(task._id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </HRSectionShell>
);

const HRTaskTab = ({ mode }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const r = await hrGet(`/tasks/${mode}`);
      setTasks(
        Array.isArray(r.data?.tasks)
          ? r.data.tasks
          : Array.isArray(r.data)
            ? r.data
            : [],
      );
    } catch (e) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [mode]);
  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await hrPut(`/tasks/${id}/delete`, {});
      setTasks((p) => p.filter((t) => String(t._id) !== String(id)));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete task.');
    }
  };
  const labels = {
    my: 'My Tasks',
    assigned: 'Assigned Tasks',
    all: 'All Tasks',
  };
  return (
    <TaskTable
      tasks={tasks}
      loading={loading}
      title={labels[mode]}
      description={
        mode === 'my'
          ? 'Tasks assigned to you.'
          : mode === 'assigned'
            ? 'Tasks you have assigned to employees.'
            : 'View and manage every task in the system.'
      }
      allowDelete={mode === 'all'}
      onDelete={deleteTask}
    />
  );
};
export const HRMyTasks = () => <HRTaskTab mode="my" />;
export const HRAssignedTasks = () => <HRTaskTab mode="assigned" />;
export const HRAllTasks = () => <HRTaskTab mode="all" />;
