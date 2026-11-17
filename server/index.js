
const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./config/db');

const auditMiddleware = require('./middleware/auditMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const artistRoutes = require('./routes/artistRoutes');
const exhibitionRoutes = require('./routes/exhibitionRoutes');
const visitBookingRoutes = require('./routes/visitBookingRoutes');
const tourRoutes = require('./routes/tourRoutes');
const collectorRoutes = require('./routes/collectorRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Main route
app.get('/', (req, res) => {
  res.json({
    message: 'Art Gallery Management System API',
    status: 'Running successfully'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Art Gallery API is healthy'
  });
});

// Authentication
app.use('/api/auth', authRoutes);

// Apply audit middleware after authentication inside protected routes
app.use(auditMiddleware);

// Users
app.use('/api/users', userRoutes);

// Artworks
app.use('/api/artworks', artworkRoutes);

// Artists
app.use('/api/artists', artistRoutes);

// Exhibitions
app.use('/api/exhibitions', exhibitionRoutes);

// Visit bookings
app.use('/api/visit-bookings', visitBookingRoutes);

// Guided tours
app.use('/api/tours', tourRoutes);

// Art Collector
app.use('/api/collectors', collectorRoutes);

// Feedback
app.use('/api/feedback', feedbackRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Audit logs
app.use('/api/audit-logs', auditRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Art Gallery server running on http://localhost:${PORT}`);
});
