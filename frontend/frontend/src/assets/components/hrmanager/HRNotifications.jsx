import React, { useEffect, useState } from 'react';
import HRSectionShell from './HRSectionShell';
//import { hrGet, hrPut } from '../components/hrmanager/hrApi';
import axios from 'axios';
const HRNotifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const r = await axios.get('http://localhost:5000/api/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setItems(r.data?.notifications || r.data || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const read = async () => {
    try {
      await axios.put(
        'http://localhost:5000/api/notifications/read-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );
      setItems((p) => p.map((x) => ({ ...x, isRead: true })));
    } catch (e) {}
  };
  const del = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setItems((p) => p.filter((x) => x._id !== id));
    } catch (e) {}
  };
  return (
    <HRSectionShell
      title="Notifications"
      description="Important activity and security notifications."
      maxWidth="max-w-5xl"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          {items.filter((x) => !x.isRead).length} unread
        </span>
        <button
          onClick={read}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Mark all as read
        </button>
      </div>
      {loading ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          Loading notifications...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          No notifications.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n._id}
              className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${n.isRead ? 'border-slate-200' : 'border-blue-200 bg-blue-50/30'}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  🔔
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-semibold text-slate-800">
                      {n.type === 'password_changed'
                        ? 'Password Changed'
                        : 'Notification'}
                    </h4>
                    <button
                      onClick={() => del(n._id)}
                      className="self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {n.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </HRSectionShell>
  );
};
export default HRNotifications;
