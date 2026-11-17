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

// Public tour listing (with remaining seat calculation)
const getPublicTours = async (req, res) => {
  try {
    const tours = await query(
      `SELECT
         guided_tours.*,
         users.full_name AS guide_name,
         exhibitions.title AS exhibition_title,
         COALESCE(
           (SELECT SUM(number_of_participants)
            FROM tour_bookings
            WHERE tour_bookings.tour_id = guided_tours.tour_id
              AND tour_bookings.booking_status IN ('Pending', 'Confirmed')),
           0
         ) AS booked_seats
       FROM guided_tours
       INNER JOIN users ON guided_tours.guide_id = users.user_id
       LEFT JOIN exhibitions
         ON guided_tours.exhibition_id = exhibitions.exhibition_id
       WHERE guided_tours.status = 'Scheduled'
         AND users.account_status = 'Active'
       ORDER BY guided_tours.tour_date ASC`
    );

    res.json({ success: true, tours });
  } catch (error) {
    console.error('Public tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve tours.'
    });
  }
};

// Tour Guide creates a tour
const createTour = async (req, res) => {
  try {
    const {
      title,
      description,
      exhibition_id,
      tour_date,
      start_time,
      duration_minutes,
      max_participants
    } = req.body;

    if (!title || !tour_date || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Title, tour date and start time are required.'
      });
    }

    const duration = Number(duration_minutes || 60);
    const capacity = Number(max_participants || 20);

    if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
      return res.status(400).json({
        success: false,
        message: 'Tour duration must be between 15 and 480 minutes.'
      });
    }

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
      return res.status(400).json({
        success: false,
        message: 'Maximum participants must be between 1 and 200.'
      });
    }

    const result = await query(
      `INSERT INTO guided_tours
       (title, description, guide_id, exhibition_id, tour_date,
        start_time, duration_minutes, max_participants, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')`,
      [
        title.trim(),
        description || null,
        req.user.user_id,
        exhibition_id || null,
        tour_date,
        start_time,
        duration,
        capacity
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Guided tour created successfully.',
      tour_id: result.insertId
    });
  } catch (error) {
    console.error('Create tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create guided tour.'
    });
  }
};

// Get tours managed by logged-in guide
const getMyTours = async (req, res) => {
  try {
    const tours = await query(
      `SELECT guided_tours.*,
              exhibitions.title AS exhibition_title
       FROM guided_tours
       LEFT JOIN exhibitions
         ON guided_tours.exhibition_id = exhibitions.exhibition_id
       WHERE guided_tours.guide_id = ?
       ORDER BY guided_tours.tour_date DESC`,
      [req.user.user_id]
    );

    res.json({ success: true, tours });
  } catch (error) {
    console.error('Get my tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve your tours.'
    });
  }
};

// Update a tour owned by the logged-in guide
const updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      exhibition_id,
      tour_date,
      start_time,
      duration_minutes,
      max_participants
    } = req.body;

    if (!title || !tour_date || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Title, tour date and start time are required.'
      });
    }

    const duration = Number(duration_minutes || 60);
    const capacity = Number(max_participants || 20);

    if (!Number.isInteger(duration) || duration < 15 || duration > 480 ||
        !Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
      return res.status(400).json({
        success: false,
        message: 'Invalid duration or participant limit.'
      });
    }

    const result = await query(
      `UPDATE guided_tours
       SET title = ?, description = ?, exhibition_id = ?,
           tour_date = ?, start_time = ?, duration_minutes = ?,
           max_participants = ?
       WHERE tour_id = ? AND guide_id = ? AND status = 'Scheduled'`,
      [
        title.trim(),
        description || null,
        exhibition_id || null,
        tour_date,
        start_time,
        duration,
        capacity,
        id,
        req.user.user_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled tour not found or not managed by you.'
      });
    }

    res.json({
      success: true,
      message: 'Guided tour updated successfully.'
    });
  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update guided tour.'
    });
  }
};

// Cancel a tour owned by the logged-in guide
const cancelTour = async (req, res) => {
  try {
    const result = await query(
      `UPDATE guided_tours
       SET status = 'Cancelled'
       WHERE tour_id = ? AND guide_id = ? AND status = 'Scheduled'`,
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled tour not found or not managed by you.'
      });
    }

    res.json({
      success: true,
      message: 'Guided tour cancelled successfully.'
    });
  } catch (error) {
    console.error('Cancel tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to cancel guided tour.'
    });
  }
};

// Book a guided tour
const bookTour = async (req, res) => {
  try {
    const participants = Number(req.body.number_of_participants);
    const { id } = req.params;

    if (!Number.isInteger(participants) || participants < 1 || participants > 20) {
      return res.status(400).json({
        success: false,
        message: 'Participants must be between 1 and 20.'
      });
    }

    const tours = await query(
      `SELECT tour_id, max_participants, tour_date
       FROM guided_tours
       WHERE tour_id = ? AND status = 'Scheduled'`,
      [id]
    );

    if (tours.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled tour not found.'
      });
    }

    const tour = tours[0];

    if (new Date(tour.tour_date) < new Date(new Date().toDateString())) {
      return res.status(400).json({
        success: false,
        message: 'This tour has already passed.'
      });
    }

    const existing = await query(
      `SELECT tour_booking_id
       FROM tour_bookings
       WHERE tour_id = ? AND user_id = ?
         AND booking_status IN ('Pending', 'Confirmed')`,
      [id, req.user.user_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active booking for this tour.'
      });
    }

    const occupied = await query(
      `SELECT COALESCE(SUM(number_of_participants), 0) AS total
       FROM tour_bookings
       WHERE tour_id = ?
         AND booking_status IN ('Pending', 'Confirmed')`,
      [id]
    );

    if (Number(occupied[0].total) + participants > tour.max_participants) {
      return res.status(409).json({
        success: false,
        message: 'Not enough spaces available for this tour.'
      });
    }

    const result = await query(
      `INSERT INTO tour_bookings
       (tour_id, user_id, number_of_participants, booking_status)
       VALUES (?, ?, ?, 'Pending')`,
      [id, req.user.user_id, participants]
    );

    // Notify the tour guide (fire-and-forget)
    try {
      const guideRows = await query(
        `SELECT gt.guide_id, gt.title, u.full_name AS visitor_name
         FROM guided_tours gt
         INNER JOIN users u ON u.user_id = ?
         WHERE gt.tour_id = ?`,
        [req.user.user_id, id]
      );

      if (guideRows.length > 0) {
        notify(
          guideRows[0].guide_id,
          'New tour booking',
          `${guideRows[0].visitor_name} booked ${participants} spot(s) for "${guideRows[0].title}".`,
          'tour'
        );
      }
    } catch (notifyErr) {
      console.error('Tour booking notification error:', notifyErr);
    }

    res.status(201).json({
      success: true,
      message: 'Tour booking submitted successfully.',
      tour_booking_id: result.insertId
    });
  } catch (error) {
    console.error('Book tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to book this tour.'
    });
  }
};

// Get logged-in visitor tour bookings
const getMyTourBookings = async (req, res) => {
  try {
    const bookings = await query(
      `SELECT
         tour_bookings.*,
         guided_tours.title AS tour_title,
         guided_tours.tour_date,
         guided_tours.start_time,
         users.full_name AS guide_name
       FROM tour_bookings
       INNER JOIN guided_tours
         ON tour_bookings.tour_id = guided_tours.tour_id
       INNER JOIN users
         ON guided_tours.guide_id = users.user_id
       WHERE tour_bookings.user_id = ?
       ORDER BY guided_tours.tour_date DESC`,
      [req.user.user_id]
    );

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Get tour bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve tour bookings.'
    });
  }
};

// Cancel own tour booking
const cancelMyTourBooking = async (req, res) => {
  try {
    const result = await query(
      `UPDATE tour_bookings
       SET booking_status = 'Cancelled'
       WHERE tour_booking_id = ?
         AND user_id = ?
         AND booking_status IN ('Pending', 'Confirmed')`,
      [req.params.bookingId, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be cancelled.'
      });
    }

    res.json({
      success: true,
      message: 'Tour booking cancelled successfully.'
    });
  } catch (error) {
    console.error('Cancel tour booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to cancel tour booking.'
    });
  }
};

module.exports = {
  getPublicTours,
  createTour,
  getMyTours,
  updateTour,
  cancelTour,
  bookTour,
  getMyTourBookings,
  cancelMyTourBooking
};