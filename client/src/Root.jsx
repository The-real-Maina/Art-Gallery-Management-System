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
import ToursPage from './pages/ToursPage';

// Solo Public Pages
import ArtworksPage from './pages/ArtworksPage';
import ExhibitionsPage from './pages/ExhibitionsPage';
import ArtistsPage from './pages/ArtistsPage';
import ContactPage from './pages/ContactPage';
import MessagesPage from './pages/MessagesPage'; // <-- ADDED

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

function getStoredUser() {
  try {
    const stored = localStorage.getItem('art_gallery_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.user_id && parsed.role) return parsed;
    }
  } catch { /* Invalid JSON */ }
  return null;
}

// Redirects to login when signed out, or to the dashboard when the role is wrong.
function ProtectedRoute({ role, children }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function NotFound() {
  return (
    <div className="empty-state" style={{ padding: '120px 20px' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', margin: '0 0 10px' }}>Page not found</h1>
      <p style={{ marginBottom: '24px' }}>The page you are looking for does not exist.</p>
      <a href="/" className="primary-button">Back to home</a>
    </div>
  );
}

function DashboardRouter() {
  const user = getStoredUser();

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
        <Route path="/tours" element={<ToursPage />} />
        
        {/* MESSAGES */}
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } 
        />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<DashboardRouter />} />
        
        {/* ADMIN SPECIFIC */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="Administrator">
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* NOT FOUND */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}