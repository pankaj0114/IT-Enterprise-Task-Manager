import React, { useEffect, useState } from 'react';
import HRSectionShell from './HRSectionShell';
import { hrGet, hrPost, hrPut } from './hrApi';

const getTodayDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const unwrapList = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const TaskTable = ({
  tasks,
  loading,
  title,
  description,
  allowDelete = false,
  onDelete,
}) => (
  <HRSectionShell title={title} description={description}>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-250 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                'Title',
                'Assigned By',
                'Assigned To',
                'Due Date',
                'Status',
                'Client',
                'Remarks',
                'Time Taken',
                ...(allowDelete ? ['Action'] : []),
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-4 text-left font-semibold text-slate-600"
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
                  colSpan={allowDelete ? 9 : 8}
                  className="px-6 py-14 text-center text-slate-500"
                >
                  Loading tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={allowDelete ? 9 : 8}
                  className="px-6 py-14 text-center text-slate-500"
                >
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {task.title || 'No title'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {task.assignedBy?.name || 'Unknown'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {task.assignedTo?.name || 'Unknown'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}
                    >
                      {task.status || 'Not Started'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {task.client?.name || 'No client'}
                  </td>
                  <td className="max-w-65 px-5 py-4 text-slate-600">
                    <div className="line-clamp-2">
                      {task.remarks || 'No remarks'}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {task.status === 'Completed'
                      ? `${task.totalHours ?? 0}h ${task.totalMinutes ?? 0}m`
                      : '—'}
                  </td>
                  {allowDelete && (
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onDelete(task._id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </HRSectionShell>
);

const HRTaskTab = ({ mode }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [savingTask, setSavingTask] = useState(false);
  const [formError, setFormError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: getTodayDate(),
    client: '',
    assignedBy: '',
  });

  const load = async () => {
    try {
      setLoading(true);

      const r = await hrGet(`/tasks/${mode}`);

      console.log(`HR ${mode} tasks response:`, r.data);

      const taskList = Array.isArray(r.data?.tasks)
        ? r.data.tasks
        : Array.isArray(r.data)
          ? r.data
          : [];

      setTasks(taskList);
    } catch (error) {
      console.error(
        `Failed to load HR ${mode} tasks:`,
        error.response?.data || error.message,
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mode]);

  // The HR task creation form uses the same fields and layout as MyTasks.jsx.
  // Load the options through the HR manager API so the signed-in HR user can use it.
  useEffect(() => {
    if (mode !== 'my') return;
    let active = true;

    const loadFormOptions = async () => {
      const [clientResult, employeeResult] = await Promise.allSettled([
        hrGet('/clients'),
        hrGet('/employees'),
      ]);

      if (!active) return;

      if (clientResult.status === 'fulfilled') {
        setClients(unwrapList(clientResult.value.data, ['clients']));
      } else {
        console.error(
          'Failed to load HR clients:',
          clientResult.reason?.response?.data || clientResult.reason?.message,
        );
      }

      if (employeeResult.status === 'fulfilled') {
        setEmployees(
          unwrapList(employeeResult.value.data, ['employees', 'users']),
        );
      } else {
        console.error(
          'Failed to load HR employees:',
          employeeResult.reason?.response?.data ||
            employeeResult.reason?.message,
        );
      }
    };

    loadFormOptions();
    return () => {
      active = false;
    };
  }, [mode]);

  const handleNewTaskChange = (event) => {
    const { name, value } = event.target;
    setNewTask((current) => ({ ...current, [name]: value }));
    if (formError) setFormError('');
  };

  const addTask = async (event) => {
    event?.preventDefault();
    setFormError('');

    if (!newTask.title.trim())
      return setFormError('Please enter a task title.');
    if (!newTask.dueDate) return setFormError('Please select a due date.');
    if (!newTask.client) return setFormError('Please select a client.');
    if (!newTask.assignedBy) return setFormError('Please select Assigned By.');

    try {
      setSavingTask(true);
      await hrPost('/tasks/my', {
        title: newTask.title.trim(),
        dueDate: newTask.dueDate,
        client: newTask.client,
        assignedBy: newTask.assignedBy,
      });
      setNewTask({
        title: '',
        dueDate: getTodayDate(),
        client: '',
        assignedBy: '',
      });
      await load();
    } catch (error) {
      console.error(
        'Error creating HR task:',
        error.response?.data || error.message,
      );
      setFormError(
        error.response?.data?.message ||
          'Failed to create task. Please check the HR task creation API.',
      );
    } finally {
      setSavingTask(false);
    }
  };
  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await hrPut(`/tasks/${id}/delete`, {});
      setTasks((p) => p.filter((t) => String(t._id) !== String(id)));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete task.');
    }
  };
  const labels = {
    my: 'My Tasks',
    assigned: 'Assigned Tasks',
    all: 'All Tasks',
  };
  return (
    <>
      {mode === 'my' && (
        <HRSectionShell
          title="Add Task"
          description="Create a task for yourself."
        >
          <form
            onSubmit={addTask}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            {formError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="w-full min-w-0">
                <label
                  htmlFor="hr-new-task-title"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Title
                </label>
                <input
                  id="hr-new-task-title"
                  name="title"
                  type="text"
                  value={newTask.title}
                  onChange={handleNewTaskChange}
                  placeholder="Enter task title"
                  className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="w-full min-w-0">
                <label
                  htmlFor="hr-new-task-due-date"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Due Date
                </label>
                <input
                  id="hr-new-task-due-date"
                  name="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={handleNewTaskChange}
                  min={getTodayDate()}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="w-full min-w-0">
                <label
                  htmlFor="hr-new-task-client"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Client
                </label>
                <select
                  id="hr-new-task-client"
                  name="client"
                  value={newTask.client}
                  onChange={handleNewTaskChange}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select an assigned client</option>
                  {clients.map((client) => (
                    <option
                      key={client._id || client.id}
                      value={client._id || client.id}
                    >
                      {client.name ||
                        client.clientName ||
                        client.company ||
                        'Unnamed client'}
                      {client.company && client.name
                        ? ` - ${client.company}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full min-w-0">
                <label
                  htmlFor="hr-new-task-assigned-by"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Assigned By
                </label>
                <select
                  id="hr-new-task-assigned-by"
                  name="assignedBy"
                  value={newTask.assignedBy}
                  onChange={handleNewTaskChange}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Assigned by</option>
                  {employees.map((employee) => (
                    <option
                      key={employee._id || employee.id}
                      value={employee._id || employee.id}
                    >
                      {employee.name ||
                        [employee.firstName, employee.lastName]
                          .filter(Boolean)
                          .join(' ') ||
                        employee.email ||
                        'Unnamed user'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={savingTask}
                className="h-12 rounded-lg bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTask ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </HRSectionShell>
      )}
      <TaskTable
        tasks={tasks}
        loading={loading}
        title={labels[mode]}
        description={
          mode === 'my'
            ? 'Tasks assigned to you.'
            : mode === 'assigned'
              ? 'Tasks you have assigned to employees.'
              : 'View and manage every task in the system.'
        }
        allowDelete={mode === 'all'}
        onDelete={deleteTask}
      />
    </>
  );
};
export const HRMyTasks = () => <HRTaskTab mode="my" />;
export const HRAssignedTasks = () => <HRTaskTab mode="assigned" />;
export const HRAllTasks = () => <HRTaskTab mode="all" />;
