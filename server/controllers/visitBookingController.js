const db = require('../config/db');
const { notify } = require('../utils/notify');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

// Create a visit booking
const createVisitBooking = async (req, res) => {
  try {
    const {
      visit_date,
      visit_time,
      number_of_visitors,
      special_requests
    } = req.body;

    if (!visit_date || !visit_time || !number_of_visitors) {
      return res.status(400).json({
        success: false,
        message: 'Visit date, time and number of visitors are required.'
      });
    }

    const visitors = Number(number_of_visitors);

    if (!Number.isInteger(visitors) || visitors < 1 || visitors > 100) {
      return res.status(400).json({
        success: false,
        message: 'Number of visitors must be between 1 and 100.'
      });
    }

    const dateString = String(visit_date).split('T')[0];
    const date = new Date(`${dateString}T00:00:00Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid visit date.'
      });
    }

    if (date < new Date(new Date().toDateString())) {
      return res.status(400).json({
        success: false,
        message: 'Visit date cannot be in the past.'
      });
    }

    const timeString = String(visit_time).length === 5 ? `${visit_time}:00` : visit_time;

    const result = await query(
      `INSERT INTO visit_bookings
       (user_id, visit_date, visit_time, number_of_visitors,
        booking_status, special_requests)
       VALUES (?, ?, ?, ?, 'Pending', ?)`,
      [
        req.user.user_id,
        dateString,
        timeString,
        visitors,
        special_requests || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Visit booking submitted successfully.',
      booking_id: result.insertId
    });
  } catch (error) {
    console.error('Create visit booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create visit booking.'
    });
  }
};

// Get logged-in visitor bookings
const getMyVisitBookings = async (req, res) => {
  try {
    const bookings = await query(
      `SELECT *
       FROM visit_bookings
       WHERE user_id = ?
       ORDER BY visit_date DESC, visit_time DESC`,
      [req.user.user_id]
    );

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve your bookings.'
    });
  }
};

// Get all visit bookings
const getAllVisitBookings = async (req, res) => {
  try {
    const bookings = await query(
      `SELECT
         visit_bookings.*,
         users.full_name,
         users.email
       FROM visit_bookings
       INNER JOIN users ON visit_bookings.user_id = users.user_id
       ORDER BY visit_bookings.visit_date DESC,
                visit_bookings.visit_time DESC`
    );

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve bookings.'
    });
  }
};

// Update booking status
const updateVisitBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const allowedStatuses = ['Confirmed', 'Cancelled', 'Completed'];

    if (!allowedStatuses.includes(booking_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status.'
      });
    }

    const result = await query(
      `UPDATE visit_bookings
       SET booking_status = ?
       WHERE booking_id = ?`,
      [booking_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Notify the visitor (fire-and-forget)
    try {
      const bookingRows = await query(
        'SELECT user_id, visit_date FROM visit_bookings WHERE booking_id = ?',
        [id]
      );

      if (bookingRows.length > 0) {
        const dateStr = new Date(bookingRows[0].visit_date).toLocaleDateString('en-KE', {
          day: 'numeric', month: 'long', year: 'numeric'
        });

        notify(
          bookingRows[0].user_id,
          `Visit ${booking_status.toLowerCase()}`,
          `Your visit on ${dateStr} has been ${booking_status.toLowerCase()}.`,
          'booking'
        );
      }
    } catch (notifyErr) {
      console.error('Visit booking notification error:', notifyErr);
    }

    res.json({
      success: true,
      message: `Booking ${booking_status.toLowerCase()} successfully.`
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update booking status.'
    });
  }
};

// Visitor cancels their own booking
const cancelMyVisitBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE visit_bookings
       SET booking_status = 'Cancelled'
       WHERE booking_id = ?
         AND user_id = ?
         AND booking_status IN ('Pending', 'Confirmed')`,
      [id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be cancelled.'
      });
    }

    res.json({
      success: true,
      message: 'Your visit booking has been cancelled.'
    });
  } catch (error) {
    console.error('Cancel visit booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to cancel booking.'
    });
  }
};

module.exports = {
  createVisitBooking,
  getMyVisitBookings,
  getAllVisitBookings,
  updateVisitBookingStatus,
  cancelMyVisitBooking
};