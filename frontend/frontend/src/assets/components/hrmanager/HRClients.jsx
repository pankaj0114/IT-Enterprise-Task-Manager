import React, { useEffect, useState } from 'react';
import HRSectionShell from './HRSectionShell';
import { hrGet, hrPut } from './hrApi';

const HRClients = () => {
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = async () => {
    try {
      const [c, e] = await Promise.all([
        hrGet('/clients'),
        hrGet('/employees'),
      ]);
      setClients(c.data?.clients || c.data || []);
      setEmployees(e.data?.employees || e.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clients.');
    }
  };
  useEffect(() => {
    load();
  }, []);
  const assign = async () => {
    setError('');
    setMessage('');
    if (!selectedClient || !selectedEmployees.length)
      return setError('Select a client and at least one employee.');
    try {
      const r = await hrPut('/clients/assign', {
        clientId: selectedClient,
        employeeIds: selectedEmployees,
      });
      setClients((p) =>
        p.map((c) =>
          String(c._id) === String(selectedClient) ? r.data?.client || c : c,
        ),
      );
      setSelectedClient('');
      setSelectedEmployees([]);
      setMessage(r.data?.message || 'Client assigned successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign client.');
    }
  };
  return (
    <HRSectionShell
      title="Clients"
      description="Assign existing clients to employees. HR Managers cannot create new clients."
    >
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800">Assign Client</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select an existing client and assign it to one or more employees.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                const c = clients.find(
                  (x) => String(x._id) === String(e.target.value),
                );
                setSelectedEmployees(
                  Array.isArray(c?.assignedTo)
                    ? c.assignedTo.map((x) => String(x._id || x))
                    : [],
                );
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5"
            >
              <option value="">-- Select Client --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.company ? ` - ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Assign To Employee(s)
            </label>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-300 p-2">
              {employees.map((e) => (
                <label
                  key={e._id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(String(e._id))}
                    onChange={(ev) =>
                      setSelectedEmployees((p) =>
                        ev.target.checked
                          ? [...p, String(e._id)]
                          : p.filter((id) => id !== String(e._id)),
                      )
                    }
                  />{' '}
                  <span className="text-sm text-slate-700">
                    {e.name}
                    <span className="ml-2 text-xs text-slate-400">
                      {e.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
            {message}
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <button
            onClick={assign}
            disabled={!selectedClient || !selectedEmployees.length}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Assign Client
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              All Clients
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              All clients are visible to the HR Manager.
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {clients.length} clients
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Client', 'Email', 'Company', 'Assigned To', 'Status'].map(
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
              {clients.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {c.name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {c.email || 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {c.company || 'N/A'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(c.assignedTo) && c.assignedTo.length ? (
                        c.assignedTo.map((e) => (
                          <span
                            key={e._id}
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                          >
                            {e.name || 'Unknown'}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {Array.isArray(c.assignedTo) && c.assignedTo.length ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Assigned
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        Available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HRSectionShell>
  );
};
export default HRClients;
