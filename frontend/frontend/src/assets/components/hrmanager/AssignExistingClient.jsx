import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const getToken = () => localStorage.getItem('accessToken');

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});

const unwrapArray = (responseData, keys = []) => {
  if (Array.isArray(responseData)) return responseData;

  for (const key of keys) {
    if (Array.isArray(responseData?.[key])) return responseData[key];
  }

  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

const getId = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return String(item._id || item.id || item.userId || '');
};

const getClientName = (client) =>
  client?.name ||
  client?.clientName ||
  client?.companyName ||
  client?.company ||
  'Unnamed client';

const getPersonName = (person) => {
  if (!person) return '';
  if (typeof person === 'string') return person;
  return (
    person.name ||
    [person.firstName, person.lastName].filter(Boolean).join(' ') ||
    person.email ||
    ''
  );
};

const getAssignedIds = (client) => {
  const assigned =
    client?.assignedTo ?? client?.employees ?? client?.assignedEmployees ?? [];
  if (Array.isArray(assigned)) return assigned.map(getId).filter(Boolean);
  return assigned ? [getId(assigned)].filter(Boolean) : [];
};

/**
 * HR Manager's client assignment section.
 *
 * Adjust the endpoint constants below if your backend uses different routes.
 * Expected behavior:
 *   GET  /api/hr/clients             -> list clients
 *   GET  /api/hr/employees           -> list employees
 *   PUT  /api/hr/clients/:id/assign  -> { employeeIds: [...] }
 *
 * If your existing backend uses a different assignment endpoint/payload,
 * update handleAssignClient to match that controller.
 */
export default function AssignExistingClient() {
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [clientsResponse, employeesResponse] = await Promise.all([
        axios.get(`${API_BASE}/api/hr/clients`, authConfig()),
        axios.get(`${API_BASE}/api/hr/employees`, authConfig()),
      ]);

      const clientList = unwrapArray(clientsResponse.data, ['clients', 'data']);
      const employeeList = unwrapArray(employeesResponse.data, [
        'employees',
        'users',
        'data',
      ]);

      setClients(clientList);
      setEmployees(employeeList);
    } catch (err) {
      console.error(
        'Failed to load HR clients/employees:',
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message || 'Could not load clients and employees.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => getId(client) === String(selectedClientId)),
    [clients, selectedClientId],
  );

  const toggleEmployee = (employeeId) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
    setSuccess('');
  };

  const handleClientChange = (event) => {
    const clientId = event.target.value;
    setSelectedClientId(clientId);
    setSuccess('');

    const client = clients.find((item) => getId(item) === clientId);
    setSelectedEmployeeIds(getAssignedIds(client));
  };

  const handleAssignClient = async () => {
    try {
      if (!selectedClientId) {
        setError('Please select a client.');
        return;
      }

      if (selectedEmployeeIds.length === 0) {
        setError('Please select at least one employee.');
        return;
      }

      const payload = {
        clientId: selectedClientId,
        employeeIds: selectedEmployeeIds,
      };

      console.log('Assign client payload:', payload);

      const response = await axios.post(
        'http://localhost:5000/api/hr/clients/assign',
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Assignment response:', response.data);
      setSuccess('Client assigned successfully.');
      setError('');
      await fetchData();
    } catch (err) {
      console.error(
        'Failed to assign client:',
        err.response?.data || err.message,
      );
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to assign client.',
      );
    }
  };
  const assignedEmployeeNames = (client) => {
    const assigned =
      client?.assignedTo ??
      client?.employees ??
      client?.assignedEmployees ??
      [];
    const list = Array.isArray(assigned)
      ? assigned
      : assigned
        ? [assigned]
        : [];
    return list
      .map((entry) => {
        if (typeof entry === 'object' && entry) return getPersonName(entry);
        const matchingEmployee = employees.find(
          (employee) => getId(employee) === String(entry),
        );
        return getPersonName(matchingEmployee) || String(entry);
      })
      .filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Assign Client */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Assign Client
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign one client to one or multiple employees.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="assign-client"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select Client
            </label>
            <select
              id="assign-client"
              value={selectedClientId}
              onChange={handleClientChange}
              disabled={loading || clients.length === 0}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">-- Select Client --</option>
              {clients.map((client) => (
                <option key={getId(client)} value={getId(client)}>
                  {getClientName(client)}
                  {client.company && client.name ? ` — ${client.company}` : ''}
                </option>
              ))}
            </select>
            {selectedClient && (
              <p className="mt-2 text-xs text-slate-500">
                {selectedClient.email || selectedClient.clientEmail || ''}
                {selectedClient.company ? ` · ${selectedClient.company}` : ''}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Assign To Employee(s)
            </label>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
              {loading ? (
                <p className="p-3 text-sm text-slate-500">
                  Loading employees...
                </p>
              ) : employees.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">
                  No employees found.
                </p>
              ) : (
                employees.map((employee) => {
                  const employeeId = getId(employee);
                  const checked = selectedEmployeeIds.includes(employeeId);

                  return (
                    <label
                      key={employeeId}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-3 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEmployee(employeeId)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-700">
                          {getPersonName(employee) || 'Unnamed employee'}
                        </span>
                        {employee.email && (
                          <span className="block truncate text-xs text-slate-400">
                            {employee.email}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {selectedEmployeeIds.length} employee
              {selectedEmployeeIds.length === 1 ? '' : 's'} selected
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleAssignClient}
            disabled={assigning || loading}
            className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assigning ? 'Assigning...' : 'Assign Client'}
          </button>
        </div>
      </section>

      {/* All Clients */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              All Clients
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View clients and their employee assignments.
            </p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {clients.length} clients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="px-5 py-4 text-left font-medium">Client</th>
                <th className="px-5 py-4 text-left font-medium">Email</th>
                <th className="px-5 py-4 text-left font-medium">Company</th>
                <th className="px-5 py-4 text-left font-medium">Assigned To</th>
                <th className="px-5 py-4 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No clients found.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const assignedNames = assignedEmployeeNames(client);
                  const isAssigned = assignedNames.length > 0;

                  return (
                    <tr
                      key={getId(client)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {getClientName(client)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {client.email || client.clientEmail || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {client.company || client.companyName || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-xl flex-wrap gap-1.5">
                          {assignedNames.length ? (
                            assignedNames.map((name, index) => (
                              <span
                                key={`${getId(client)}-${name}-${index}`}
                                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${isAssigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {isAssigned ? 'Assigned' : 'Unassigned'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
