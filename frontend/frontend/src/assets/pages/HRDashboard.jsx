import React, { useState } from 'react';
import {
  ListTodo,
  ClipboardList,
  Users,
  UserRound,
  CalendarDays,
  ChartNoAxesCombined,
} from 'lucide-react';
import HRMyTasks from '../components/hrmanager/HRMyTasks';
import HRAssignedTasks from '../components/hrmanager/HRAssignedTasks';
import HRAttendance from '../components/hrmanager/HRAttendance';
import AssignExistingClient from '../components/hrmanager/AssignExistingClient';

const sections = [
  ['my-tasks', 'My Tasks', ListTodo],
  ['assigned-tasks', 'Assigned Tasks', ClipboardList],
  ['users', 'User Registration', Users],
  ['clients', 'Assign Client', UserRound],
  ['attendance', 'Attendance', CalendarDays],
  ['performance', 'Employee Performance', ChartNoAxesCombined],
];

export default function HRManagerDashboard() {
  const [active, setActive] = useState('my-tasks');
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="w-full border-r bg-white p-4 md:min-h-screen md:w-64">
        <h1 className="mb-5 text-xl font-bold">HR Manager Dashboard</h1>
        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {sections.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold ${active === id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-7">
        <h2 className="mb-5 text-2xl font-bold">
          {sections.find((s) => s[0] === active)?.[1]}
        </h2>
        {active === 'my-tasks' && <HRMyTasks />}
        {active === 'assigned-tasks' && <HRAssignedTasks />}
        {active === 'attendance' && <HRAttendance />}
        {active === 'users' && <RegisteredUsers />}
        {active === 'clients' && <AssignExistingClient />}
        {active === 'performance' && <EmployeePerformance />}
      </main>
    </div>
  );
}

function RegisteredUsers() {
  const [users, setUsers] = useState([]),
    [error, setError] = useState(''),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState({ name: '', email: '' }),
    [password, setPassword] = useState({ id: '', value: '' });
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
  };
  const load = async () => {
    try {
      const r = await (
        await import('axios')
      ).default.get(api + '/api/hr/users', config);
      setUsers(r.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load users');
    }
  };
  React.useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    try {
      const axios = (await import('axios')).default;
      await axios.put(`${api}/api/hr/users/${editing}`, form, config);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not update user');
    }
  };
  const reset = async (e) => {
    e.preventDefault();
    try {
      const axios = (await import('axios')).default;
      await axios.put(
        `${api}/api/hr/users/${password.id}/reset-password`,
        { password: password.value },
        config,
      );
      setPassword({ id: '', value: '' });
      alert('Password reset. Admin has been notified.');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not reset password');
    }
  };
  return (
    <section className="rounded-2xl border bg-white p-4">
      <p className="mb-3 text-sm text-slate-500">
        HR can edit existing registered users and reset employee passwords.
        Registration is disabled.
      </p>
      {error && <p className="mb-3 text-rose-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="space-x-2 p-3">
                  <button
                    className="rounded border px-2 py-1"
                    onClick={() => {
                      setEditing(u._id);
                      setForm({ name: u.name || '', email: u.email || '' });
                    }}
                  >
                    Edit
                  </button>
                  {u.role === 'employee' && (
                    <button
                      className="rounded bg-indigo-600 px-2 py-1 text-white"
                      onClick={() => setPassword({ id: u._id, value: '' })}
                    >
                      Reset password
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <form onSubmit={save} className="mt-4 flex flex-wrap gap-2">
          <input
            className="rounded border p-2"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
          />
          <input
            className="rounded border p-2"
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
          />
          <button className="rounded bg-indigo-600 px-3 text-white">
            Save
          </button>
          <button
            type="button"
            className="rounded border px-3"
            onClick={() => setEditing(null)}
          >
            Cancel
          </button>
        </form>
      )}
      {password.id && (
        <form onSubmit={reset} className="mt-4 flex flex-wrap gap-2">
          <input
            className="rounded border p-2"
            type="password"
            minLength="8"
            required
            value={password.value}
            onChange={(e) =>
              setPassword({ ...password, value: e.target.value })
            }
            placeholder="New password (8+ chars)"
          />
          <button className="rounded bg-amber-600 px-3 text-white">
            Reset
          </button>
          <button
            type="button"
            className="rounded border px-3"
            onClick={() => setPassword({ id: '', value: '' })}
          >
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}

function EmployeePerformance() {
  const [rows, setRows] = useState([]),
    [error, setError] = useState('');
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  React.useEffect(() => {
    import('axios').then(({ default: axios }) =>
      axios
        .get(api + '/api/hr/performance', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
        .then((r) => setRows(r.data.performance || []))
        .catch((e) =>
          setError(e.response?.data?.message || 'Could not load performance'),
        ),
    );
  }, []);
  return (
    <section className="rounded-2xl border bg-white p-4">
      <h3 className="mb-4 font-bold">Employee performance</h3>
      {error && <p className="text-rose-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-137.5 text-left text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-3">Employee</th>
              <th className="p-3">Tasks</th>
              <th className="p-3">Completed</th>
              <th className="p-3">In progress</th>
              <th className="p-3">Not started</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employeeId} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.totalTasks}</td>
                <td className="p-3">{r.completed}</td>
                <td className="p-3">{r.inProgress}</td>
                <td className="p-3">{r.notStarted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
