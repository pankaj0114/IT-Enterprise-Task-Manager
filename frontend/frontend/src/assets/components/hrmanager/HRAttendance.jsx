import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');
const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
});
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayKey = () => dateKey(new Date());
const monthKey = (year, month) => `${year}-${pad(month)}`;
const monthDays = (year, month) =>
  Array.from(
    { length: new Date(year, month, 0).getDate() },
    (_, i) => new Date(year, month - 1, i + 1),
  );
const formatDate = (value) => {
  if (!value) return '—';
  const key = String(value).slice(0, 10);
  const [y, m, d] = key.split('-').map(Number);
  return y && m && d
    ? new Date(y, m - 1, d).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : key;
};
const inRange = (key, start, end) =>
  key >= String(start || '').slice(0, 10) &&
  key <= String(end || start || '').slice(0, 10);
const recordKey = (record) =>
  String(record?.dateKey || record?.date || '').slice(0, 10);
const statusClass = (status) =>
  ({
    WFO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    WFH: 'border-blue-200 bg-blue-50 text-blue-700',
    LEAVE: 'border-rose-200 bg-rose-50 text-rose-700',
    PENDING_LEAVE: 'border-amber-200 bg-amber-50 text-amber-700',
    PENDING_WFH: 'border-violet-200 bg-violet-50 text-violet-700',
  })[status] || 'border-slate-200 bg-slate-50 text-slate-500';
const statusLabel = (status) =>
  ({
    WFO: 'Work From Office',
    WFH: 'Work From Home',
    LEAVE: 'Leave',
    PENDING_LEAVE: 'Leave Pending',
    PENDING_WFH: 'WFH Pending',
  })[status] || 'Not Marked';

export default function HRAttendance() {
  const now = new Date();
  const [section, setSection] = useState('employees');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeAttendance, setEmployeeAttendance] = useState([]);
  const [employeeSummary, setEmployeeSummary] = useState({
    WFO: 0,
    WFH: 0,
    LEAVE: 0,
    PENDING_LEAVE: 0,
  });
  const [myAttendance, setMyAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [wfhRequests, setWfhRequests] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingEmployeeCalendar, setLoadingEmployeeCalendar] = useState(false);
  const [loadingMine, setLoadingMine] = useState(false);
  const [savingDate, setSavingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestType, setRequestType] = useState('WFH');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [reason, setReason] = useState('');
  const requestIdRef = useRef(0);
  const days = useMemo(() => monthDays(year, month), [year, month]);
  const monthParam = monthKey(year, month);

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/hr/attendance/employees`,
        authConfig(),
      );
      const list = Array.isArray(data?.employees) ? data.employees : [];
      setEmployees(list);
      setSelectedEmployee((current) =>
        current && list.some((e) => e._id === current)
          ? current
          : list[0]?._id || '',
      );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          'Could not load employees. Check the HR attendance backend route.',
      );
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  const fetchEmployeeAttendance = useCallback(async () => {
    if (!selectedEmployee) {
      setEmployeeAttendance([]);
      setEmployeeSummary({ WFO: 0, WFH: 0, LEAVE: 0, PENDING_LEAVE: 0 });
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoadingEmployeeCalendar(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/hr/attendance/employee/${selectedEmployee}`,
        { ...authConfig(), params: { month, year } },
      );
      if (requestId !== requestIdRef.current) return;
      setEmployeeAttendance(
        Array.isArray(data?.attendance) ? data.attendance : [],
      );
      setEmployeeSummary({
        WFO: 0,
        WFH: 0,
        LEAVE: 0,
        PENDING_LEAVE: 0,
        ...(data?.summary || {}),
      });
    } catch (e) {
      if (requestId === requestIdRef.current)
        setError(
          e.response?.data?.message || 'Could not load employee attendance.',
        );
    } finally {
      if (requestId === requestIdRef.current) setLoadingEmployeeCalendar(false);
    }
  }, [selectedEmployee, month, year]);

  const fetchMyAttendance = useCallback(async () => {
    setLoadingMine(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/attendance/my`, {
        ...authConfig(),
        params: { month: monthParam },
      });
      setMyAttendance(Array.isArray(data?.attendance) ? data.attendance : []);
      setLeaveRequests(
        Array.isArray(data?.leaveRequests) ? data.leaveRequests : [],
      );
      setWfhRequests(Array.isArray(data?.wfhRequests) ? data.wfhRequests : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load your attendance.');
    } finally {
      setLoadingMine(false);
    }
  }, [monthParam]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
  useEffect(() => {
    fetchEmployeeAttendance();
  }, [fetchEmployeeAttendance]);
  useEffect(() => {
    fetchMyAttendance();
  }, [fetchMyAttendance]);

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employeeAttendance.map((r) => [recordKey(r), r]).filter(([key]) => key),
      ),
    [employeeAttendance],
  );
  const myAttendanceMap = useMemo(
    () =>
      Object.fromEntries(
        myAttendance.map((r) => [recordKey(r), r]).filter(([key]) => key),
      ),
    [myAttendance],
  );
  const getRequestForDate = useCallback(
    (key) => {
      const leave = leaveRequests.find(
        (r) =>
          ['PENDING', 'APPROVED'].includes(String(r.status).toUpperCase()) &&
          inRange(key, r.startDate, r.endDate),
      );
      if (leave)
        return {
          type:
            String(leave.status).toUpperCase() === 'PENDING'
              ? 'PENDING_LEAVE'
              : 'LEAVE',
          request: leave,
        };
      const wfh = wfhRequests.find(
        (r) =>
          ['PENDING', 'APPROVED'].includes(String(r.status).toUpperCase()) &&
          inRange(key, r.startDate, r.endDate),
      );
      if (wfh)
        return {
          type:
            String(wfh.status).toUpperCase() === 'PENDING'
              ? 'PENDING_WFH'
              : 'WFH',
          request: wfh,
        };
      return null;
    },
    [leaveRequests, wfhRequests],
  );

  const refreshMine = async () => {
    await fetchMyAttendance();
  };
  const deletePendingRequestsForDate = async (key) => {
    const pendingLeaves = leaveRequests.filter(
      (r) =>
        String(r.status).toUpperCase() === 'PENDING' &&
        inRange(key, r.startDate, r.endDate),
    );
    const pendingWfhs = wfhRequests.filter(
      (r) =>
        String(r.status).toUpperCase() === 'PENDING' &&
        inRange(key, r.startDate, r.endDate),
    );
    await Promise.all([
      ...pendingLeaves
        .filter((r) => r._id)
        .map((r) =>
          axios.delete(
            `${API_BASE}/api/attendance/leave-requests/${r._id}`,
            authConfig(),
          ),
        ),
      ...pendingWfhs
        .filter((r) => r._id)
        .map((r) =>
          axios.delete(
            `${API_BASE}/api/attendance/wfh-requests/${r._id}`,
            authConfig(),
          ),
        ),
    ]);
  };

  const markWfo = async (key) => {
    if (key > todayKey()) {
      setError('You cannot mark Work From Office for a future date.');
      return;
    }
    setSavingDate(key);
    setError('');
    setSuccess('');
    try {
      // Match EmployeeAttendance.jsx: clear pending requests covering this day before marking WFO.
      await deletePendingRequestsForDate(key);
      const { data } = await axios.put(
        `${API_BASE}/api/attendance/my`,
        { dateKey: key, status: 'WFO' },
        authConfig(),
      );
      if (data?.attendance) {
        setMyAttendance((prev) =>
          prev.some((r) => recordKey(r) === key)
            ? prev.map((r) => (recordKey(r) === key ? data.attendance : r))
            : [...prev, data.attendance],
        );
      }
      setSuccess(`Attendance marked Work From Office for ${formatDate(key)}.`);
      await fetchMyAttendance();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to mark attendance.');
    } finally {
      setSavingDate('');
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!startDate) {
      setError('Please select a date.');
      return;
    }
    if (requestType !== 'WFO' && !reason.trim()) {
      setError('Please enter a reason for this request.');
      return;
    }
    if (requestType !== 'WFO' && endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }
    if (requestType === 'WFO') {
      await markWfo(startDate);
      return;
    }
    setSubmitting(true);
    try {
      const isLeave = requestType === 'LEAVE';
      const endpoint = isLeave
        ? `${API_BASE}/api/attendance/leave-requests`
        : `${API_BASE}/api/attendance/wfh-requests`;
      const { data } = await axios.post(
        endpoint,
        { startDate, endDate, reason: reason.trim() },
        authConfig(),
      );
      // Requests are pending, not direct attendance marks; refresh both calendar and request lists.
      setSuccess(
        data?.message || `${isLeave ? 'Leave' : 'WFH'} request submitted.`,
      );
      setReason('');
      await fetchMyAttendance();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          `Unable to submit ${requestType === 'LEAVE' ? 'leave' : 'WFH'} request.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRequest = async (type, id) => {
    if (
      !id ||
      !window.confirm(
        `Delete this pending ${type === 'LEAVE' ? 'leave' : 'WFH'} request?`,
      )
    )
      return;
    setError('');
    setSuccess('');
    try {
      const path = type === 'LEAVE' ? 'leave-requests' : 'wfh-requests';
      await axios.delete(
        `${API_BASE}/api/attendance/${path}/${id}`,
        authConfig(),
      );
      setSuccess(`${type === 'LEAVE' ? 'Leave' : 'WFH'} request deleted.`);
      await fetchMyAttendance();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to delete request.');
    }
  };

  const mySummary = useMemo(
    () => ({
      WFO: myAttendance.filter((r) => r.status === 'WFO').length,
      WFH: myAttendance.filter((r) => r.status === 'WFH').length,
      LEAVE: myAttendance.filter((r) => r.status === 'LEAVE').length,
    }),
    [myAttendance],
  );
  const tabClass = (key) =>
    `rounded-lg px-4 py-2.5 text-sm font-semibold transition ${section === key ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`;

  return (
    <section className="w-full min-w-0 space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">HR Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review employee attendance and manage your own daily attendance, WFH,
          and leave requests.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={tabClass('employees')}
            onClick={() => setSection('employees')}
          >
            Employee Attendance
          </button>
          <button
            type="button"
            className={tabClass('mine')}
            onClick={() => setSection('mine')}
          >
            My Attendance
          </button>
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">
          Month
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block h-10 rounded-lg border border-slate-300 bg-white px-3"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString('en-US', {
                  month: 'long',
                })}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Year
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 block h-10 rounded-lg border border-slate-300 bg-white px-3"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() =>
            Promise.all([fetchEmployeeAttendance(), fetchMyAttendance()])
          }
          className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {section === 'employees' && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Select employee
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                disabled={loadingEmployees || !employees.length}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 sm:max-w-md"
              >
                <option value="">
                  {loadingEmployees
                    ? 'Loading employees…'
                    : 'Select an employee'}
                </option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                    {employee.email ? ` (${employee.email})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [
                'Work From Office',
                employeeSummary.WFO,
                'border-emerald-100 bg-emerald-50 text-emerald-800',
              ],
              [
                'Work From Home',
                employeeSummary.WFH,
                'border-blue-100 bg-blue-50 text-blue-800',
              ],
              [
                'Leave',
                employeeSummary.LEAVE,
                'border-rose-100 bg-rose-50 text-rose-800',
              ],
              [
                'Pending Leave',
                employeeSummary.PENDING_LEAVE,
                'border-amber-100 bg-amber-50 text-amber-800',
              ],
            ].map(([label, count, classes]) => (
              <div key={label} className={`rounded-xl border p-4 ${classes}`}>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-2 text-3xl font-bold">{count || 0}</p>
                <p className="text-xs opacity-75">
                  {label === 'Pending Leave' ? 'Requests' : 'Days this month'}
                </p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900">
                Monthly Employee Calendar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Read-only calendar. Only the employee can mark or request their
                own attendance.
              </p>
            </div>
            {loadingEmployeeCalendar ? (
              <p className="p-8 text-center text-slate-500">
                Loading attendance…
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 lg:grid-cols-7">
                {days.map((day) => {
                  const key = dateKey(day);
                  const record = employeeMap[key];
                  const status = record?.status || '';
                  return (
                    <div
                      key={key}
                      className={`min-h-28 rounded-xl border p-3 ${statusClass(status)}`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          {day.toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </span>
                        <strong className="text-base">{day.getDate()}</strong>
                      </div>
                      <div className="mt-3 rounded-lg border border-current/20 bg-white/70 px-2 py-2 text-xs font-semibold">
                        {statusLabel(status)}
                      </div>
                      {record?.reason && (
                        <p className="mt-2 line-clamp-2 text-xs opacity-80">
                          {record.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {section === 'mine' && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              [
                'Work From Office',
                mySummary.WFO,
                'border-emerald-100 bg-emerald-50 text-emerald-800',
              ],
              [
                'Work From Home',
                mySummary.WFH,
                'border-blue-100 bg-blue-50 text-blue-800',
              ],
              [
                'Leave',
                mySummary.LEAVE,
                'border-rose-100 bg-rose-50 text-rose-800',
              ],
            ].map(([label, count, classes]) => (
              <div key={label} className={`rounded-xl border p-4 ${classes}`}>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-2 text-3xl font-bold">{count}</p>
                <p className="text-xs opacity-75">
                  Recorded days in selected month
                </p>
              </div>
            ))}
          </div>
          <form
            onSubmit={submitRequest}
            className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2"
          >
            <label className="text-sm font-medium text-slate-700">
              Attendance action
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              >
                <option value="WFO">Mark Work From Office</option>
                <option value="WFH">Request Work From Home</option>
                <option value="LEAVE">Request Leave</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              {requestType === 'LEAVE' ? 'Start date' : 'Date'}
              <input
                type="date"
                required
                value={startDate}
                min={requestType === 'WFO' ? undefined : todayKey()}
                max={requestType === 'WFO' ? todayKey() : undefined}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              />
            </label>
            {requestType !== 'WFO' && (
              <label className="text-sm font-medium text-slate-700">
                End date
                <input
                  type="date"
                  required
                  min={startDate || todayKey()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
            )}
            {requestType !== 'WFO' && (
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Reason
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for your request"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
            )}
            <div className="md:col-span-2">
              <button
                disabled={submitting || !!savingDate}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {submitting || savingDate
                  ? 'Saving…'
                  : requestType === 'WFO'
                    ? 'Mark Attendance'
                    : `Submit ${requestType === 'LEAVE' ? 'Leave' : 'WFH'} Request`}
              </button>
            </div>
          </form>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900">
                My Monthly Calendar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Click Mark WFO for an unmarked past or current day. WFH and
                leave are submitted as requests.
              </p>
            </div>
            {loadingMine ? (
              <p className="p-8 text-center text-slate-500">
                Loading your attendance…
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 lg:grid-cols-7">
                {days.map((day) => {
                  const key = dateKey(day);
                  const record = myAttendanceMap[key];
                  const request = getRequestForDate(key);
                  const status = record?.status || request?.type || '';
                  return (
                    <div
                      key={key}
                      className={`min-h-28 rounded-xl border p-3 ${statusClass(status)}`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          {day.toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </span>
                        <strong className="text-base">{day.getDate()}</strong>
                      </div>
                      <div className="mt-3 rounded-lg border border-current/20 bg-white/70 px-2 py-2 text-xs font-semibold">
                        {statusLabel(status)}
                      </div>
                      {request?.request?.reason && (
                        <p className="mt-2 line-clamp-2 text-xs opacity-80">
                          {request.request.reason}
                        </p>
                      )}
                      {record?.reason && (
                        <p className="mt-2 line-clamp-2 text-xs opacity-80">
                          {record.reason}
                        </p>
                      )}
                      {!record && !request && key <= todayKey() && (
                        <button
                          type="button"
                          disabled={savingDate === key}
                          onClick={() => markWfo(key)}
                          className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                        >
                          {savingDate === key ? 'Saving…' : 'Mark WFO'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RequestList
              title="My Leave Requests"
              type="LEAVE"
              requests={leaveRequests}
              onDelete={deleteRequest}
            />
            <RequestList
              title="My WFH Requests"
              type="WFH"
              requests={wfhRequests}
              onDelete={deleteRequest}
            />
          </div>
        </>
      )}
    </section>
  );
}

function RequestList({ title, type, requests, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {requests.length} requests
        </span>
      </div>
      {!requests.length ? (
        <p className="p-6 text-center text-sm text-slate-500">
          No requests found.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {requests.map((request) => (
            <div
              key={request._id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-slate-800">
                    {type === 'LEAVE' ? 'Leave' : 'Work From Home'}
                  </strong>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${String(request.status).toUpperCase() === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : String(request.status).toUpperCase() === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {request.status || 'PENDING'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDate(request.startDate)}
                  {request.endDate &&
                  String(request.endDate).slice(0, 10) !==
                    String(request.startDate).slice(0, 10)
                    ? ` – ${formatDate(request.endDate)}`
                    : ''}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">
                  {request.reason || 'No reason provided.'}
                </p>
              </div>
              {String(request.status).toUpperCase() === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => onDelete(type, request._id)}
                  className="self-start rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Delete request
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
