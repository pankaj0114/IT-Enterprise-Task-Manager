import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Send, CalendarDays, LogOut } from 'lucide-react';
import HRMyTasks from '../components/hrmanager/HRMyTasks.jsx';
import HRAssignedTasks from '../components/hrmanager/HRAssignedTasks.jsx';
import HRAttendance from '../components/hrmanager/HRAttendance.jsx';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');
export default function HRDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState('myTasks');
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    let cancelled = false;
    axios
      .get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        if (data?.role !== 'hr_manager') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          navigate('/', { replace: true });
          return;
        }
        if (!cancelled) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      })
      .catch(() => navigate('/', { replace: true }));
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  const logout = () => {
    ['accessToken', 'refreshToken', 'user'].forEach((k) =>
      localStorage.removeItem(k),
    );
    navigate('/', { replace: true });
  };
  const tabs = [
    { id: 'myTasks', label: 'My Tasks', Icon: ClipboardList },
    { id: 'assignedTasks', label: 'Assigned Tasks', Icon: Send },
    { id: 'attendance', label: 'Attendance', Icon: CalendarDays },
  ];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-16 flex-col bg-slate-900 text-white sm:w-20 lg:w-64">
        <div className="border-b border-slate-700 px-2 py-5 lg:px-5">
          <p className="text-center text-xs uppercase tracking-wider text-slate-400 lg:text-left">
            HR Manager
          </p>
          <h2 className="mt-2 hidden truncate text-lg font-semibold lg:block">
            {user?.name || 'HR Manager'}
          </h2>
          <div className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold lg:hidden">
            {(user?.name || 'H').charAt(0).toUpperCase()}
          </div>
        </div>
        <nav className="flex-1 space-y-2 px-2 py-4">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex w-full items-center justify-center gap-3 rounded-lg px-3 py-3 text-left transition lg:justify-start ${tab === id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Icon size={20} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-2 lg:p-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 font-medium hover:bg-red-700 lg:justify-start lg:px-4"
          >
            <LogOut size={20} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>
      <main className="ml-16 min-h-screen w-[calc(100%-4rem)] p-4 sm:ml-20 sm:w-[calc(100%-5rem)] sm:p-6 lg:ml-64 lg:w-[calc(100%-16rem)] lg:p-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-indigo-600">
            People & Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            HR Manager Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your own work, assigned tasks, attendance, leave and
            work-from-home requests.
          </p>
        </header>
        {tab === 'myTasks' && <HRMyTasks />}
        {tab === 'assignedTasks' && <HRAssignedTasks />}
        {tab === 'attendance' && <HRAttendance />}
      </main>
    </div>
  );
}
