import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdPersonAdd, MdLogout } from 'react-icons/md';
import '../css/EmployeeDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [activeTab, setActiveTab] = useState('userRegistration');

  const [employees, setEmployees] = useState([]);
  const storedUser = localStorage.getItem('user');

  let loggedInAdmin = null;

  try {
    loggedInAdmin = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Invalid user data:', error);
  }

  const [admin, setAdmin] = useState(loggedInAdmin);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
  });

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  // ==========================================
  // GET LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Invalid user data');
      }
    }
  }, []);

  const fetchAdmin = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Logged-in admin:', response.data);

      setAdmin(response.data);
    } catch (error) {
      console.error(
        'Error fetching admin:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  // ==========================================
  // FETCH EMPLOYEES
  // ==========================================

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5000/api/admin/employees',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching employees:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // REGISTER EMPLOYEE
  // ==========================================

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      // Basic validation
      if (!name.trim()) {
        alert('Please enter employee name');
        return;
      }

      if (!email.trim()) {
        alert('Please enter employee email');
        return;
      }

      if (!password) {
        alert('Please enter password');
        return;
      }

      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      if (!dateOfBirth) {
        alert('Please select date of birth');
        return;
      }

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        alert('You are not logged in');
        return;
      }

      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        dateOfBirth,
        role: 'Employee',
      };

      console.log('Register employee payload:', payload);

      const response = await axios.post(
        'http://localhost:5000/api/admin/register-employee',
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Employee registered successfully:', response.data);

      alert('Employee registered successfully');

      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDateOfBirth('');

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error(
        'Error registering employee:',
        error.response?.data || error.message,
      );
    }
  };
  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className="
        w-64
        bg-slate-900
        text-white
        min-h-screen
        flex
        flex-col
        fixed
        left-0
        top-0
        bottom-0
      "
      >
        {/* Admin Info */}

        <div
          className="
          px-6
          py-6
          border-b
          border-slate-700
        "
        >
          <p
            className="
            text-xs
            text-slate-400
            uppercase
            tracking-wider
          "
          >
            Admin
          </p>

          <h3
            className="
            mt-1
            text-lg
            font-semibold
          "
          >
            {admin?.name || 'Loading...'}
          </h3>
        </div>

        {/* Navigation */}

        <nav className="flex-1 px-3 py-5">
          <button
            type="button"
            onClick={() => setActiveTab('userRegistration')}
            className={`
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-lg
              text-left
              transition
              ${
                activeTab === 'userRegistration'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }
            `}
          >
            <MdPersonAdd size={22} />

            <span>User Registration</span>
          </button>
        </nav>

        {/* Logout */}

        <div className="p-4 border-t border-slate-700">
          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              rounded-lg
              bg-red-500
              hover:bg-red-600
              transition
              font-medium
            "
          >
            <MdLogout size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* ======================================
          MAIN PANEL
      ====================================== */}

      <main
        className="
        ml-64
        flex-1
        min-h-screen
        p-4
        sm:p-6
        lg:p-8
      "
      >
        {activeTab === 'userRegistration' && (
          <div className="max-w-7xl mx-auto">
            {/* Header */}

            <div className="mb-6">
              <h1
                className="
                text-2xl
                sm:text-3xl
                font-bold
                text-slate-800
              "
              >
                User Registration
              </h1>

              <p
                className="
                mt-1
                text-sm
                text-slate-500
              "
              >
                Register new employees and manage registered employees.
              </p>
            </div>

            {/* ==================================
                REGISTRATION FORM
            ================================== */}

            <div
              className="
              bg-white
              rounded-xl
              border
              border-slate-200
              shadow-sm
              p-5
              sm:p-6
              mb-8
            "
            >
              <h2
                className="
                text-lg
                font-semibold
                text-slate-800
                mb-5
              "
              >
                Register Employee
              </h2>

              <form onSubmit={handleRegisterEmployee}>
                <div
                  className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-5
                "
                >
                  {/* Name */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter employee name"
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>

                  {/* Email */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@example.com"
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>

                  {/* Password */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>

                  {/* Confirm Password */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>

                  {/* Date of Birth */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      name="dateOfBirth"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>
                </div>

                {/* Messages */}

                {errorMessage && (
                  <div
                    className="
                    mt-5
                    px-4
                    py-3
                    rounded-lg
                    bg-red-50
                    border
                    border-red-200
                    text-red-600
                    text-sm
                  "
                  >
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div
                    className="
                    mt-5
                    px-4
                    py-3
                    rounded-lg
                    bg-green-50
                    border
                    border-green-200
                    text-green-600
                    text-sm
                  "
                  >
                    {successMessage}
                  </div>
                )}

                {/* Submit */}

                <div
                  className="
                  mt-6
                  flex
                  justify-end
                "
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      px-6
                      py-2.5
                      rounded-lg
                      bg-blue-600
                      text-white
                      font-medium
                      hover:bg-blue-700
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      transition
                    "
                  >
                    {loading ? 'Registering...' : 'Register Employee'}
                  </button>
                </div>
              </form>
            </div>

            {/* ==================================
                EMPLOYEE TABLE
            ================================== */}

            <div
              className="
              bg-white
              rounded-xl
              border
              border-slate-200
              shadow-sm
              overflow-hidden
            "
            >
              <div
                className="
                px-5
                sm:px-6
                py-5
                border-b
                border-slate-200
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-2
              "
              >
                <h2
                  className="
                  text-lg
                  font-semibold
                  text-slate-800
                "
                >
                  Registered Employees
                </h2>

                <span
                  className="
                  text-sm
                  text-slate-500
                "
                >
                  {employees.length} employee
                  {employees.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table
                  className="
                  w-full
                  min-w-150
                  text-sm
                "
                >
                  <thead
                    className="
                    bg-slate-50
                    border-b
                    border-slate-200
                  "
                  >
                    <tr>
                      <th
                        className="
                        px-6
                        py-4
                        text-left
                        font-semibold
                        text-slate-600
                      "
                      >
                        Name
                      </th>

                      <th
                        className="
                        px-6
                        py-4
                        text-left
                        font-semibold
                        text-slate-600
                      "
                      >
                        Email
                      </th>

                      <th
                        className="
                        px-6
                        py-4
                        text-left
                        font-semibold
                        text-slate-600
                      "
                      >
                        Date of Birth
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    className="
                    divide-y
                    divide-slate-100
                  "
                  >
                    {employees.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="
                            px-6
                            py-10
                            text-center
                            text-slate-500
                          "
                        >
                          No employees registered yet.
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr
                          key={employee._id}
                          className="
                            hover:bg-slate-50
                            transition
                          "
                        >
                          <td
                            className="
                            px-6
                            py-4
                            font-medium
                            text-slate-800
                          "
                          >
                            {employee.name}
                          </td>

                          <td
                            className="
                            px-6
                            py-4
                            text-slate-600
                          "
                          >
                            {employee.email}
                          </td>

                          <td
                            className="
                            px-6
                            py-4
                            text-slate-600
                          "
                          >
                            {employee.dateOfBirth
                              ? new Date(
                                  employee.dateOfBirth,
                                ).toLocaleDateString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
