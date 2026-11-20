const express = require('express');
const cors = require('cors');
const path = require('path'); 
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
const messageRoutes = require('./routes/messageRoutes'); // <-- ADDED

const app = express();

if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

const allowedOrigins = (
  process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      const error = new Error('Origin not allowed by CORS');
      error.status = 403;
      return callback(error);
    }
  })
);

app.use(express.json({ limit: '1mb' }));

// SERVE UPLOADED IMAGES STATICALLY
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Audit middleware
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

// Messages (ADDED)
app.use('/api/messages', messageRoutes);

// 404 for anything that did not match a route above
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    message:
      status >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Something went wrong'
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Art Gallery server running on http://localhost:${PORT}`);
});