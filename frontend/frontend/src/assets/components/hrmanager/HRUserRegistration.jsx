import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import HRSectionShell from './HRSectionShell';
import { hrGet, hrPost, hrPut } from './hrApi';

const HRUserRegistration = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfJoining: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState({
    name: '',
    email: '',
    dateOfJoining: '',
  });
  const [savingId, setSavingId] = useState(null);
  const [resetEmployee, setResetEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await hrGet('/employees');
      setEmployees(
        Array.isArray(response.data?.employees)
          ? response.data.employees
          : Array.isArray(response.data)
            ? response.data
            : [],
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees.');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const register = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.dateOfJoining
    )
      return setError('Please complete all required fields.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters long.');
    if (form.password !== form.confirmPassword)
      return setError('Passwords do not match.');
    try {
      setLoading(true);
      const response = await hrPost('/employees', {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });
      setEmployees((prev) => [response.data.employee, ...prev]);
      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfJoining: '',
      });
      setMessage(response.data?.message || 'Employee registered successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register employee.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (employee) => {
    setEditingId(employee._id);
    setEditing({
      name: employee.name || '',
      email: employee.email || '',
      dateOfJoining: employee.dateOfJoining
        ? String(employee.dateOfJoining).slice(0, 10)
        : '',
    });
    setError('');
  };

  const saveEdit = async (id) => {
    if (!editing.name.trim() || !editing.email.trim() || !editing.dateOfJoining)
      return setError('Name, email and date of joining are required.');
    try {
      setSavingId(id);
      setError('');
      const response = await hrPut(`/employees/${id}`, {
        ...editing,
        name: editing.name.trim(),
        email: editing.email.trim().toLowerCase(),
      });
      const updated = response.data?.employee || response.data;
      setEmployees((prev) =>
        prev.map((item) =>
          String(item._id) === String(id)
            ? { ...item, ...updated, ...editing }
            : item,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee.');
    } finally {
      setSavingId(null);
    }
  };

  const resetPassword = async () => {
    if (!resetEmployee) return;
    if (newPassword.length < 6)
      return setError('Password must be at least 6 characters long.');
    if (newPassword !== confirmNewPassword)
      return setError('Passwords do not match.');
    try {
      await hrPut(`/employees/${resetEmployee._id}/reset-password`, {
        newPassword,
      });
      setResetEmployee(null);
      setNewPassword('');
      setConfirmNewPassword('');
      setMessage('Password reset successfully.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <HRSectionShell
      title="User Registration"
      description="Register new employees and manage registered employees."
    >
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          Register Employee
        </h2>
        <form onSubmit={register}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {['name', 'email'].map((field) => (
              <div key={field}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field === 'name' ? 'Name' : 'Email'}
                </label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [field]: e.target.value }))
                  }
                  placeholder={
                    field === 'name'
                      ? 'Enter employee name'
                      : 'employee@example.com'
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            {[
              ['password', 'Password', showPassword, setShowPassword],
              [
                'confirmPassword',
                'Confirm Password',
                showConfirm,
                setShowConfirm,
              ],
            ].map(([field, label, shown, setShown]) => (
              <div key={field}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={shown ? 'text' : 'password'}
                    value={form[field]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                    placeholder={label}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-11 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShown((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {shown ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Date of Joining
              </label>
              <input
                type="date"
                value={form.dateOfJoining}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateOfJoining: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
              {message}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <button
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Registering...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Registered Employees
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage employee details.
            </p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'Name',
                  'Email',
                  'Date of Joining',
                  'Reset Password',
                  'Action',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-4 text-left font-semibold text-slate-600 sm:px-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No employees registered yet.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const edit = String(editingId) === String(employee._id);
                  return (
                    <tr key={employee._id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 sm:px-5">
                        {edit ? (
                          <input
                            value={editing.name}
                            onChange={(e) =>
                              setEditing((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            className="h-10 w-full min-w-40 rounded-lg border px-3"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">
                            {employee.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        {edit ? (
                          <input
                            type="email"
                            value={editing.email}
                            onChange={(e) =>
                              setEditing((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            className="h-10 w-full min-w-55 rounded-lg border px-3"
                          />
                        ) : (
                          <span className="text-slate-600">
                            {employee.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        {edit ? (
                          <input
                            type="date"
                            value={editing.dateOfJoining}
                            onChange={(e) =>
                              setEditing((p) => ({
                                ...p,
                                dateOfJoining: e.target.value,
                              }))
                            }
                            className="h-10 min-w-40 rounded-lg border px-3"
                          />
                        ) : (
                          <span className="text-slate-600">
                            {employee.dateOfJoining
                              ? new Date(
                                  employee.dateOfJoining,
                                ).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <button
                          onClick={() => {
                            setResetEmployee(employee);
                            setError('');
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Reset Password
                        </button>
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        {edit ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(employee._id)}
                              disabled={savingId === employee._id}
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                              {savingId === employee._id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg bg-slate-100 px-4 py-2 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(employee)}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {resetEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-800">
              Reset Password
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {resetEmployee.name} · {resetEmployee.email}
            </p>
            <div className="mt-5 space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border px-4 py-2.5"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg border px-4 py-2.5"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setResetEmployee(null)}
                className="rounded-lg bg-slate-100 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={resetPassword}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </HRSectionShell>
  );
};
export default HRUserRegistration;
