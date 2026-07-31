import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ toggle state
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        formData,
      );

      // Save tokens
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);

      const userRole = res.data.role; // ✅ backend sends role

      setMessage('Login successful!');

      // ✅ Redirect based on role
      if (userRole === 'employee') {
        navigate('/employee-dashboard');
      } else if (userRole === 'hr_manager') {
        navigate('/hr-dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else if (userRole === 'team_leader') {
        navigate('/team-dashboard');
      } else if (userRole === 'super_admin') {
        navigate('/super-dashboard');
      } else {
        navigate('/dashboard'); // fallback
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error logging in');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span
            className="toggle-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👁️' : '🙈'}
          </span>
        </div>

        <button type="submit">Login</button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}
