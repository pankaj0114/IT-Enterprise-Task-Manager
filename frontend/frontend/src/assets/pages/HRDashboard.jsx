import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLogout, MdPersonAdd, MdCalendarMonth } from 'react-icons/md';
import { io } from 'socket.io-client';
import '../css/EmployeeDashboard.css';
import HRUserRegistration from '../components/hrmanager/HRUserRegistration';
import HRClients from '../components/hrmanager/HRClients';
import {
  HRMyTasks,
  HRAssignedTasks,
  HRAllTasks,
} from '../components/hrmanager/HRTaskTabs';
import HREmployeePerformance from '../components/hrmanager/HREmployeePerformance';
import HRAttendance from '../components/hrmanager/HRAttendance';
import HRMyAttendance from '../components/hrmanager/HRMyAttendance';
import HRNotifications from '../components/hrmanager/HRNotifications';

const tabs = [
  ['myTasks', '📋', 'My Tasks'],
  ['assignedTasks', '📤', 'Assigned Tasks'],
  ['userRegistration', '👤', 'User Registration'],
  ['clients', '👥', 'Clients'],
  ['allTasks', '📋', 'All Tasks'],
  ['attendance', '📅', 'Attendance'],
  ['myAttendance', '🕘', 'My Attendance'],
  ['employeePerformance', '📊', 'Employee Performance'],
  ['notifications', '🔔', 'Notifications'],
];
const HRDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('hrManagerActiveTab') || 'myTasks',
  );
  const [unread, setUnread] = useState(0);
  const change = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('hrManagerActiveTab', tab);
  };
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    const load = async () => {
      try {
        const r = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        if (data?.role !== 'hr_manager') {
          navigate('/', { replace: true });
          return;
        }
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (e) {
        navigate('/', { replace: true });
      }
    };
    load();
  }, [navigate]);
  useEffect(() => {
    if (!user?._id) return;
    const socket = io('http://localhost:5000', {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
    });
    socket.on('connect', () => socket.emit('join', String(user._id)));
    socket.on('newNotification', (n) => {
      if (n && !n.isRead) setUnread((p) => p + 1);
    });
    return () => socket.disconnect();
  }, [user?._id]);
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };
  const content = {
    myTasks: <HRMyTasks />,
    assignedTasks: <HRAssignedTasks />,
    userRegistration: <HRUserRegistration />,
    clients: <HRClients />,
    allTasks: <HRAllTasks />,
    attendance: <HRAttendance />,
    myAttendance: <HRMyAttendance />,
    employeePerformance: <HREmployeePerformance />,
    notifications: <HRNotifications />,
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed bottom-0 left-0 top-0 z-40 flex w-16 min-h-screen flex-col overflow-y-auto border-r border-slate-700 bg-slate-900 text-white shadow-lg sm:w-20 lg:w-64">
        <div className="border-b border-slate-700 px-2 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
          <p className="text-center text-[10px] uppercase tracking-wider text-slate-400 lg:text-left lg:text-xs">
            {' '}
            <span className="hidden lg:inline">HR Manager</span>
            <span className="lg:hidden">HR</span>
          </p>
          <h3 className="mt-1 hidden truncate text-lg font-semibold lg:block">
            {user?.name || 'Loading...'}
          </h3>
          <div className="mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold lg:hidden">
            {user?.name?.charAt(0)?.toUpperCase() || 'H'}
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 px-1.5 py-4 sm:px-2 lg:px-3">
          {tabs.map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => change(id)}
              className={`flex w-full items-center justify-center gap-3 rounded-lg px-3 py-3 text-left transition lg:justify-start lg:px-4 ${activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span className="shrink-0 text-lg">{icon}</span>
              <span className="hidden lg:inline">{label}</span>
              {id === 'notifications' && unread > 0 && (
                <span className="ml-auto min-w-6 rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-bold">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-2 lg:p-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium hover:bg-red-600"
          >
            <MdLogout size={20} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>
      <main className="ml-16 min-h-screen min-w-0 w-[calc(100%-4rem)] bg-slate-50 px-3 py-4 sm:ml-20 sm:w-[calc(100%-5rem)] sm:px-5 sm:py-6 lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-6 lg:py-8">
        {content[activeTab] || content.myTasks}
      </main>
    </div>
  );
};
export default HRDashboard;
