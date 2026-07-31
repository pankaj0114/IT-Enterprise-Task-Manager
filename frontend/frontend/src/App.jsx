import React from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './assets/pages/Signup';
import Login from './assets/pages/Login';
import HRDashboard from './assets/pages/HRDashboard';
import EmployeeDashboard from './assets/pages/EmployeeDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
