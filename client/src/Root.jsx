import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VisitBooking from './pages/VisitBooking';
import ForgotPassword from './pages/ForgotPassword'; 
import GalleryDetails from './pages/GalleryDetails'; 
import ExhibitionDetail from './pages/ExhibitionDetail'; 

// Solo Public Pages
import ArtworksPage from './pages/ArtworksPage';
import ExhibitionsPage from './pages/ExhibitionsPage';
import ArtistsPage from './pages/ArtistsPage';
import ContactPage from './pages/ContactPage';

// Dashboards & Admin
import Dashboard from './pages/Dashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CuratorDashboard from './pages/CuratorDashboard';
import BookingOfficerDashboard from './pages/BookingOfficerDashboard';
import TourGuideDashboard from './pages/TourGuideDashboard';
import UserManagement from './pages/UserManagement';

function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const id = hash.replace('#', '');
    const element = document.getElementById(id);
    if (element) setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100); 
  }, [hash, pathname]);
  return null;
}

function DashboardRouter() {
  let user = null;
  try {
    const stored = localStorage.getItem('art_gallery_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.user_id && parsed.role) user = parsed;
    }
  } catch { /* Invalid JSON */ }

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Artist': return <ArtistDashboard />;
    case 'Administrator': return <AdminDashboard />;
    case 'Gallery Curator': return <CuratorDashboard />;
    case 'Booking Officer': return <BookingOfficerDashboard />;
    case 'Tour Guide': return <TourGuideDashboard />;
    case 'Visitor':
    case 'Art Collector':
    default:
      return <Dashboard />;
  }
}

export default function Root() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        {/* PUBLIC PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/artworks" element={<ArtworksPage />} />
        <Route path="/exhibitions" element={<ExhibitionsPage />} />
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/gallery-details" element={<GalleryDetails />} />
        <Route path="/exhibitions/:id" element={<ExhibitionDetail />} />
        <Route path="/book-visit" element={<VisitBooking />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<DashboardRouter />} />
        
        {/* ADMIN SPECIFIC */}
        <Route path="/admin/users" element={<UserManagement />} />
      </Routes>
    </BrowserRouter>
  );
}