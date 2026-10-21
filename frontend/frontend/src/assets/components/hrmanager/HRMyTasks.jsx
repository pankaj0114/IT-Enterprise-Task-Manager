import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(
  /\/$/,
  '',
);
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
});
export default function HRMyTasks() {
  const [tasks, setTasks] = useState([]),
    [title, setTitle] = useState(''),
    [dueDate, setDueDate] = useState(''),
    [remarks, setRemarks] = useState(''),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API}/api/hr/tasks/my`, auth());
      setTasks(
        Array.isArray(data.tasks)
          ? data.tasks
          : Array.isArray(data)
            ? data
            : [],
      );
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load your tasks.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const create = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!title.trim() || !dueDate) {
      setError('Task title and due date are required.');
      return;
    }
    try {
      setSaving(true);
      await axios.post(
        `${API}/api/hr/tasks/my`,
        { title: title.trim(), dueDate, remarks },
        auth(),
      );
      setTitle('');
      setDueDate('');
      setRemarks('');
      setMessage('Task created successfully.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not create task.');
    } finally {
      setSaving(false);
    }
  };
  const status = async (t, value) => {
    try {
      const { data } = await axios.patch(
        `${API}/api/hr/tasks/${t._id}/status`,
        { status: value },
        auth(),
      );
      setTasks((prev) =>
        prev.map((x) =>
          x._id === t._id ? { ...x, ...(data.task || data), status: value } : x,
        ),
      );
    } catch (e) {
      setError(e.response?.data?.message || 'Could not update task status.');
    }
  };
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">My Tasks</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tasks created by you and tracked in your own workload.
        </p>
      </div>
      <form
        onSubmit={create}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4"
      >
        <label className="text-sm font-medium">
          Task title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
            placeholder="Enter task title"
          />
        </label>
        <label className="text-sm font-medium">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Remarks
          <input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
            placeholder="Optional"
          />
        </label>
        <div className="flex items-end">
          <button
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Add task'}
          </button>
        </div>
      </form>
      {message && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-slate-500">Loading tasks…</p>
        ) : !tasks.length ? (
          <p className="p-8 text-center text-slate-500">No tasks yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Task', 'Due date', 'Remarks', 'Status'].map((x) => (
                    <th key={x} className="px-4 py-3 font-semibold">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3">
                      {t.dueDate ? String(t.dueDate).slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3">{t.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Status for ${t.title}`}
                        value={t.status || 'Not Started'}
                        onChange={(e) => status(t, e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5"
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
