import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import VisitBooking from './pages/VisitBooking';
import UserManagement from './pages/UserManagement';
import ForgotPassword from './pages/ForgotPassword'; // <-- ADDED

// Dashboards
import Dashboard from './pages/Dashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CuratorDashboard from './pages/CuratorDashboard';
import BookingOfficerDashboard from './pages/BookingOfficerDashboard';
import TourGuideDashboard from './pages/TourGuideDashboard';

function DashboardRouter() {
  let user = null;
  
  try {
    const stored = localStorage.getItem('art_gallery_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Strict validation: Must have an ID and a Role to be considered logged in
      if (parsed && parsed.user_id && parsed.role) {
        user = parsed;
      }
    }
  } catch {
    // Invalid JSON, user remains null
  }

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Artist':
      return <ArtistDashboard />;
    case 'Administrator':
      return <AdminDashboard />;
    case 'Gallery Curator':
      return <CuratorDashboard />;
    case 'Booking Officer':
      return <BookingOfficerDashboard />;
    case 'Tour Guide':
      return <TourGuideDashboard />;
    case 'Visitor':
    case 'Art Collector':
    default:
      return <Dashboard />;
  }
}

export default function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> {/* <-- ADDED */}
        <Route path="/book-visit" element={<VisitBooking />} />
        
        <Route path="/dashboard" element={<DashboardRouter />} />
        
        <Route path="/admin/users" element={<UserManagement />} />
      </Routes>
    </BrowserRouter>
  );
}