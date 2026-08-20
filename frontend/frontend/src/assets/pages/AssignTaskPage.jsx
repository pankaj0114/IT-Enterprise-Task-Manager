import React, { useState } from 'react';
import axios from 'axios';
import '../css/AssignTaskPage.css';

const AssignTaskPage = ({
  user,
  clients,
  employees,
  onTaskCreated,
  setActiveTab,
}) => {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [task, setTask] = useState({
    title: '',
    remarks: '',
    dueDate: '',
    client: '',
    priority: 'Medium',
    assignedTo: '',
    client: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // validations
      if (!task.title.trim()) {
        setErrorMessage('Please enter task title');
        return;
      }

      if (!task.dueDate) {
        setErrorMessage('Please select due date');
        return;
      }

      if (!task.priority) {
        setErrorMessage('Please select priority');
        return;
      }

      if (!task.assignedTo) {
        setErrorMessage('Please select an employee');
        return;
      }

      if (!task.client) {
        setErrorMessage('Please select a client');
        return;
      }
      // token
      const token = localStorage.getItem('accessToken');

      const payload = {
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        assignedTo: task.assignedTo,
        client: task.client,
      };

      console.log('Sending task:', payload);

      const response = await axios.post(
        'http://localhost:5000/api/tasks/assign',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Task created:', response.data);

      if (onTaskCreated) {
        await onTaskCreated();
      }

      // Reset form
      setTask({
        title: '',
        dueDate: '',
        priority: 'Medium',
        assignedTo: '',
        client: '',
      });
    } catch (error) {
      console.error(
        'Error assigning task:',
        error.response?.data || error.message,
      );

      setErrorMessage(error.response?.data?.message || 'Error assigning task');
    }
  };

  return (
    <div
      className="
       w-full
      bg-slate-50
      px-4 py-6
      sm:px-6
      lg:px-8
    "
    >
      <div
        className="
        mx-auto
        w-full max-w-4xl
        rounded-2xl
        border border-slate-200
        bg-white
        p-5
        shadow-sm
        sm:p-7
        lg:p-8
      "
      >
        {/* =========================
          HEADER
      ========================= */}

        <div className="mb-7">
          <h2
            className="
            text-2xl font-bold
            tracking-tight
            text-slate-800
            sm:text-3xl
          "
          >
            Create New Task
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create and assign a task to yourself or another employee.
          </p>
        </div>

        {/* =========================
          FORM
      ========================= */}

        <div
          className="
          grid
          grid-cols-1
          gap-5
          sm:grid-cols-2
        "
        >
          {/* Task Title */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="task-title"
              className="
              text-sm font-semibold
              text-slate-700
            "
            >
              Task Title
            </label>

            <input
              id="task-title"
              type="text"
              name="title"
              value={task.title}
              onChange={handleChange}
              placeholder="Enter task title"
              className="
              w-full
              rounded-lg
              border border-slate-300
              bg-white
              px-3.5 py-2.5
              text-sm text-slate-800
              placeholder:text-slate-400
              outline-none
              transition-all duration-200
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
            />
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="task-due-date"
              className="
              text-sm font-semibold
              text-slate-700
            "
            >
              Due Date
            </label>

            <input
              id="task-due-date"
              type="date"
              name="dueDate"
              value={task.dueDate}
              onChange={handleChange}
              className="
              w-full
              rounded-lg
              border border-slate-300
              bg-white
              px-3.5 py-2.5
              text-sm text-slate-800
              outline-none
              transition-all duration-200
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="task-priority"
              className="
              text-sm font-semibold
              text-slate-700
            "
            >
              Priority
            </label>

            <select
              id="task-priority"
              name="priority"
              value={task.priority}
              onChange={handleChange}
              className="
              w-full
              cursor-pointer
              rounded-lg
              border border-slate-300
              bg-white
              px-3.5 py-2.5
              text-sm text-slate-800
              outline-none
              transition-all duration-200
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Client */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="task-client"
              className="
              text-sm font-semibold
              text-slate-700
            "
            >
              Client
            </label>

            <select
              id="task-client"
              name="client"
              value={task.client}
              onChange={handleChange}
              className="
              w-full
              cursor-pointer
              rounded-lg
              border border-slate-300
              bg-white
              px-3.5 py-2.5
              text-sm text-slate-800
              outline-none
              transition-all duration-200
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
            >
              <option value="">-- Select Client --</option>

              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assign To */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label
              htmlFor="task-assigned-to"
              className="
              text-sm font-semibold
              text-slate-700
            "
            >
              Assign To
            </label>

            <select
              id="task-assigned-to"
              name="assignedTo"
              value={task.assignedTo}
              onChange={handleChange}
              className="
              w-full
              cursor-pointer
              rounded-lg
              border border-slate-300
              bg-white
              px-3.5 py-2.5
              text-sm text-slate-800
              outline-none
              transition-all duration-200
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
            >
              <option value="">-- Select Employee --</option>

              <option value="me">Me</option>

              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =========================
          BUTTONS
      ========================= */}

        <div
          className="
          mt-8
          flex flex-col-reverse
          gap-3
          border-t border-slate-100
          pt-6
          sm:flex-row
          sm:justify-end
        "
        >
          {/* Cancel */}
          <button
            type="button"
            onClick={() =>
              setTask({
                title: '',
                dueDate: '',
                priority: 'Medium',
                assignedTo: '',
              })
            }
            className="
            w-full
            rounded-lg
            border border-slate-300
            bg-white
            px-5 py-2.5
            text-sm font-semibold
            text-slate-600
            transition-all duration-200
            hover:border-slate-400
            hover:bg-slate-50
            hover:text-slate-800
            focus:outline-none
            focus:ring-2
            focus:ring-slate-200
            sm:w-auto
          "
          >
            Cancel
          </button>

          {/* Add Task */}
          <button
            type="button"
            onClick={handleSubmit}
            className="
            w-full
            rounded-lg
            bg-blue-600
            px-6 py-2.5
            text-sm font-semibold
            text-white
            shadow-sm
            transition-all duration-200
            hover:bg-blue-700
            hover:shadow
            active:scale-[0.98]
            focus:outline-none
            focus:ring-2
            focus:ring-blue-200
            sm:w-auto
          "
          >
            Add Task
          </button>
        </div>
      </div>

      {/* =========================
        ERROR POPUP
    ========================= */}

      {errorMessage && (
        <div
          className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-black/40
          px-4
          backdrop-blur-sm
        "
        >
          <div
            className="
            w-full max-w-md
            rounded-2xl
            border border-red-100
            bg-white
            p-6
            shadow-2xl
          "
          >
            <div
              className="
              mb-4
              flex h-11 w-11
              items-center justify-center
              rounded-full
              bg-red-50
              text-lg
              text-red-600
            "
            >
              !
            </div>

            <h3
              className="
              text-lg font-bold
              text-slate-800
            "
            >
              Error
            </h3>

            <p
              className="
              mt-2
              text-sm leading-6
              text-slate-500
            "
            >
              {errorMessage}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="
                rounded-lg
                bg-red-600
                px-5 py-2.5
                text-sm font-semibold
                text-white
                transition-colors
                hover:bg-red-700
                focus:outline-none
                focus:ring-2
                focus:ring-red-200
              "
                onClick={() => setErrorMessage('')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTaskPage;
