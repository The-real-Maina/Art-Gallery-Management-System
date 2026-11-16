
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import App from './App.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserManagement from './pages/UserManagement.jsx';

import './index.css';

function RoleDashboard() {
  const token = localStorage.getItem('art_gallery_token');

  const user = JSON.parse(
    localStorage.getItem('art_gallery_user') || 'null'
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'Administrator') {
    return <AdminDashboard />;
  }

  return <Dashboard />;
}

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<RoleDashboard />} />

        <Route
          path="/admin/users"
          element={
            localStorage.getItem('art_gallery_token') &&
            JSON.parse(localStorage.getItem('art_gallery_user') || 'null')?.role === 'Administrator'
              ? <UserManagement />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
