import React, { useEffect, useState } from 'react';
import HRSectionShell from './HRSectionShell';
import { hrGet } from './hrApi';
const HRMyAttendance = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const r = await hrGet('/attendance/me');
      setRows(r.data?.attendance || r.data || []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <HRSectionShell
      title="My Attendance"
      description="View your personal attendance history."
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Days</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {rows.length}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Present</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {
              rows.filter(
                (x) => String(x.status || '').toLowerCase() === 'present',
              ).length
            }
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Absent</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {
              rows.filter(
                (x) => String(x.status || '').toLowerCase() === 'absent',
              ).length
            }
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Attendance History
          </h2>
          <button
            onClick={load}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-187.5 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Date', 'Check In', 'Check Out', 'Status', 'Total Hours'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-left font-semibold text-slate-600"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                rows.map((x) => (
                  <tr key={x._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      {x.date ? new Date(x.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      {x.checkIn
                        ? new Date(x.checkIn).toLocaleTimeString()
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {x.checkOut
                        ? new Date(x.checkOut).toLocaleTimeString()
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {x.status || 'Present'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {x.totalHours ?? 0}h {x.totalMinutes ?? 0}m
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HRSectionShell>
  );
};
export default HRMyAttendance;
