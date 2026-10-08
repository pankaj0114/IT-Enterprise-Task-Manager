import React, { useEffect, useState } from 'react';
import HRSectionShell from './HRSectionShell';
import { hrGet } from './hrApi';
const HREmployeePerformance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const r = await hrGet('/employee-performance');
      setData(r.data?.performance || r.data || []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const completed = data.reduce((n, e) => n + Number(e.completedTasks || 0), 0);
  const minutes = data.reduce(
    (n, e) =>
      n +
      Number(
        e.totalMinutesSpent ?? (e.totalHours || 0) * 60 + (e.totalMinutes || 0),
      ),
    0,
  );
  return (
    <HRSectionShell
      title="Employee Performance"
      description="Monitor completed tasks and total time spent by each employee."
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Total Employees', data.length, '👥'],
          ['Completed Tasks', completed, '✓'],
          [
            'Total Time Spent',
            `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
            '⏱',
          ],
        ].map(([l, v, i]) => (
          <div
            key={l}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{l}</p>
                <p className="mt-2 text-3xl font-bold text-slate-800">{v}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                {i}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Employee Performance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Summary of completed work and time spent.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-237.5 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'Employee',
                  'Email',
                  'Completed Tasks',
                  'Total Hours',
                  'Total Minutes',
                  'Total Time',
                  'Avg. Time / Task',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left font-semibold text-slate-600"
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
                    colSpan={7}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    Loading employee performance...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    No employee performance data available.
                  </td>
                </tr>
              ) : (
                data.map((e) => (
                  <tr key={e.employeeId || e._id} className="hover:bg-slate-50">
                    <td className="px-6 py-5 font-semibold text-slate-800">
                      {e.name}
                    </td>
                    <td className="px-6 py-5 text-slate-600">{e.email}</td>
                    <td className="px-6 py-5">{e.completedTasks || 0}</td>
                    <td className="px-6 py-5">{e.totalHours || 0}h</td>
                    <td className="px-6 py-5">{e.totalMinutes || 0}m</td>
                    <td className="px-6 py-5">
                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                        {e.totalHours || 0}h {e.totalMinutes || 0}m
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {e.averageTime || '0m'}
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
export default HREmployeePerformance;
