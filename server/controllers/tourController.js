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

// ---------- helpers ----------

// Notifications must never break the request that triggered them.
const sendNotification = (userId, title, message) => {
  try {
    Promise.resolve(notify(userId, title, message, 'tour')).catch((err) =>
      console.error('Tour notification error:', err)
    );
  } catch (err) {
    console.error('Tour notification error:', err);
  }
};

// DATE and TIME columns are formatted in SQL so the frontend always gets
// plain "YYYY-MM-DD" / "HH:MM:SS" strings (no timezone shifting by the driver).
const TOUR_COLUMNS = `
  gt.tour_id, gt.title, gt.description, gt.guide_id, gt.exhibition_id,
  DATE_FORMAT(gt.tour_date, '%Y-%m-%d') AS tour_date,
  TIME_FORMAT(gt.start_time, '%H:%i:%s') AS start_time,
  gt.duration_minutes, gt.max_participants, gt.status`;

const SEATS_TAKEN = `
  COALESCE((
    SELECT SUM(tb.number_of_participants)
    FROM tour_bookings tb
    WHERE tb.tour_id = gt.tour_id
      AND tb.booking_status IN ('Pending', 'Confirmed')
  ), 0)`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

const todayString = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

// Validates the body used by createTour and updateTour.
const validateTourInput = (body) => {
  const {
    title,
    description,
    exhibition_id,
    tour_date,
    start_time,
    duration_minutes,
    max_participants
  } = body;

  if (!title || !String(title).trim() || !tour_date || !start_time) {
    return { error: 'Title, tour date and start time are required.' };
  }

  const date = String(tour_date).slice(0, 10);
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    return { error: 'Invalid tour date.' };
  }
  if (date < todayString()) {
    return { error: 'Tour date cannot be in the past.' };
  }

  let time = String(start_time);
  if (!TIME_RE.test(time)) {
    return { error: 'Invalid start time.' };
  }
  if (time.length === 5) time = `${time}:00`;

  const duration = Number(duration_minutes || 60);
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
    return { error: 'Tour duration must be between 15 and 480 minutes.' };
  }

  const capacity = Number(max_participants || 20);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
    return { error: 'Maximum participants must be between 1 and 200.' };
  }

  let exhibitionId = null;
  if (exhibition_id) {
    exhibitionId = Number(exhibition_id);
    if (!Number.isInteger(exhibitionId) || exhibitionId < 1) {
      return { error: 'Invalid exhibition.' };
    }
  }

  return {
    values: {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      exhibition_id: exhibitionId,
      tour_date: date,
      start_time: time,
      duration,
      capacity
    }
  };
};

// True when the guide already has a Scheduled tour overlapping this slot.
const guideHasOverlap = async (guideId, date, startTime, duration, excludeTourId = 0) => {
  const rows = await query(
    `SELECT tour_id
     FROM guided_tours
     WHERE guide_id = ?
       AND status = 'Scheduled'
       AND tour_date = ?
       AND tour_id <> ?
       AND start_time < ADDTIME(?, SEC_TO_TIME(? * 60))
       AND ADDTIME(start_time, SEC_TO_TIME(duration_minutes * 60)) > ?`,
    [guideId, date, excludeTourId, startTime, duration, startTime]
  );
  return rows.length > 0;
};

const activeBookerIds = async (tourId) => {
  const rows = await query(
    `SELECT DISTINCT user_id
     FROM tour_bookings
     WHERE tour_id = ? AND booking_status IN ('Pending', 'Confirmed')`,
    [tourId]
  );
  return rows.map((row) => row.user_id);
};

// ---------- public ----------

// Public tour listing (upcoming, with seats already booked)
const getPublicTours = async (req, res) => {
  try {
    const tours = await query(
      `SELECT ${TOUR_COLUMNS},
              u.full_name AS guide_name,
              e.title AS exhibition_title,
              ${SEATS_TAKEN} AS booked_seats
       FROM guided_tours gt
       INNER JOIN users u ON gt.guide_id = u.user_id
       LEFT JOIN exhibitions e ON gt.exhibition_id = e.exhibition_id
       WHERE gt.status = 'Scheduled'
         AND u.account_status = 'Active'
         AND gt.tour_date >= CURDATE()
       ORDER BY gt.tour_date ASC, gt.start_time ASC`
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

// ---------- tour guide ----------

// Tour Guide creates a tour
const createTour = async (req, res) => {
  try {
    const { error, values } = validateTourInput(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const overlap = await guideHasOverlap(
      req.user.user_id,
      values.tour_date,
      values.start_time,
      values.duration
    );
    if (overlap) {
      return res.status(409).json({
        success: false,
        message: 'You already have a tour scheduled during this time.'
      });
    }

    const result = await query(
      `INSERT INTO guided_tours
       (title, description, guide_id, exhibition_id, tour_date,
        start_time, duration_minutes, max_participants, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')`,
      [
        values.title,
        values.description,
        req.user.user_id,
        values.exhibition_id,
        values.tour_date,
        values.start_time,
        values.duration,
        values.capacity
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

// Tours managed by the logged-in guide (with seat and pending counts)
const getMyTours = async (req, res) => {
  try {
    const tours = await query(
      `SELECT ${TOUR_COLUMNS},
              e.title AS exhibition_title,
              ${SEATS_TAKEN} AS booked_seats,
              (SELECT COUNT(*)
               FROM tour_bookings tb
               WHERE tb.tour_id = gt.tour_id
                 AND tb.booking_status = 'Pending') AS pending_bookings
       FROM guided_tours gt
       LEFT JOIN exhibitions e ON gt.exhibition_id = e.exhibition_id
       WHERE gt.guide_id = ?
       ORDER BY gt.tour_date DESC, gt.start_time DESC`,
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

    const { error, values } = validateTourInput(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const existing = await query(
      `SELECT DATE_FORMAT(tour_date, '%Y-%m-%d') AS tour_date,
              TIME_FORMAT(start_time, '%H:%i:%s') AS start_time,
              title
       FROM guided_tours
       WHERE tour_id = ? AND guide_id = ? AND status = 'Scheduled'`,
      [id, req.user.user_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled tour not found or not managed by you.'
      });
    }

    const occupied = await query(
      `SELECT COALESCE(SUM(number_of_participants), 0) AS total
       FROM tour_bookings
       WHERE tour_id = ? AND booking_status IN ('Pending', 'Confirmed')`,
      [id]
    );

    if (values.capacity < Number(occupied[0].total)) {
      return res.status(409).json({
        success: false,
        message: `${occupied[0].total} spaces are already booked. Capacity cannot be lower than that.`
      });
    }

    const overlap = await guideHasOverlap(
      req.user.user_id,
      values.tour_date,
      values.start_time,
      values.duration,
      Number(id)
    );
    if (overlap) {
      return res.status(409).json({
        success: false,
        message: 'You already have a tour scheduled during this time.'
      });
    }

    await query(
      `UPDATE guided_tours
       SET title = ?, description = ?, exhibition_id = ?,
           tour_date = ?, start_time = ?, duration_minutes = ?,
           max_participants = ?
       WHERE tour_id = ? AND guide_id = ? AND status = 'Scheduled'`,
      [
        values.title,
        values.description,
        values.exhibition_id,
        values.tour_date,
        values.start_time,
        values.duration,
        values.capacity,
        id,
        req.user.user_id
      ]
    );

    // Tell people who booked if the date or time changed
    const old = existing[0];
    if (old.tour_date !== values.tour_date || old.start_time !== values.start_time) {
      const bookers = await activeBookerIds(id);
      bookers.forEach((userId) =>
        sendNotification(
          userId,
          'Tour rescheduled',
          `"${values.title}" has moved to ${values.tour_date} at ${values.start_time.slice(0, 5)}.`
        )
      );
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

// Cancel a tour owned by the logged-in guide (also cancels its bookings)
const cancelTour = async (req, res) => {
  try {
    const { id } = req.params;

    const tours = await query(
      `SELECT title
       FROM guided_tours
       WHERE tour_id = ? AND guide_id = ? AND status = 'Scheduled'`,
      [id, req.user.user_id]
    );

    if (tours.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled tour not found or not managed by you.'
      });
    }

    const bookers = await activeBookerIds(id);

    await query(
      `UPDATE guided_tours SET status = 'Cancelled'
       WHERE tour_id = ? AND guide_id = ?`,
      [id, req.user.user_id]
    );

    await query(
      `UPDATE tour_bookings SET booking_status = 'Cancelled'
       WHERE tour_id = ? AND booking_status IN ('Pending', 'Confirmed')`,
      [id]
    );

    bookers.forEach((userId) =>
      sendNotification(
        userId,
        'Tour cancelled',
        `Unfortunately "${tours[0].title}" has been cancelled by the guide.`
      )
    );

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

// Mark a tour as completed (tour day or later). Confirmed bookings become
// Completed; bookings still Pending are closed as Cancelled.
const completeTour = async (req, res) => {
  try {
    const { id } = req.params;

    const tours = await query(
      `SELECT tour_id
       FROM guided_tours
       WHERE tour_id = ? AND guide_id = ? AND status = 'Scheduled'
         AND tour_date <= CURDATE()`,
      [id, req.user.user_id]
    );

    if (tours.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found, not yours, or its date has not arrived yet.'
      });
    }

    await query(
      `UPDATE guided_tours SET status = 'Completed'
       WHERE tour_id = ? AND guide_id = ?`,
      [id, req.user.user_id]
    );

    await query(
      `UPDATE tour_bookings SET booking_status = 'Completed'
       WHERE tour_id = ? AND booking_status = 'Confirmed'`,
      [id]
    );

    await query(
      `UPDATE tour_bookings SET booking_status = 'Cancelled'
       WHERE tour_id = ? AND booking_status = 'Pending'`,
      [id]
    );

    res.json({
      success: true,
      message: 'Tour marked as completed.'
    });
  } catch (error) {
    console.error('Complete tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to complete tour.'
    });
  }
};

// Guide: see who booked one of their tours
const getTourBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const owned = await query(
      `SELECT tour_id FROM guided_tours WHERE tour_id = ? AND guide_id = ?`,
      [id, req.user.user_id]
    );

    if (owned.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found or not managed by you.'
      });
    }

    const bookings = await query(
      `SELECT tb.tour_booking_id, tb.user_id, tb.number_of_participants,
              tb.booking_status, tb.created_at,
              u.full_name, u.email
       FROM tour_bookings tb
       INNER JOIN users u ON tb.user_id = u.user_id
       WHERE tb.tour_id = ?
       ORDER BY FIELD(tb.booking_status, 'Pending', 'Confirmed', 'Completed', 'Cancelled'),
                tb.created_at ASC`,
      [id]
    );

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Get tour bookings (guide) error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve bookings for this tour.'
    });
  }
};

// Guide: confirm or decline a booking on one of their tours
const updateTourBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Confirmed or Cancelled.'
      });
    }

    const rows = await query(
      `SELECT tb.tour_booking_id, tb.user_id, tb.booking_status, gt.title
       FROM tour_bookings tb
       INNER JOIN guided_tours gt ON gt.tour_id = tb.tour_id
       WHERE tb.tour_booking_id = ? AND gt.guide_id = ?`,
      [bookingId, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found for one of your tours.'
      });
    }

    const booking = rows[0];
    const allowed =
      (booking.booking_status === 'Pending' && ['Confirmed', 'Cancelled'].includes(status)) ||
      (booking.booking_status === 'Confirmed' && status === 'Cancelled');

    if (!allowed) {
      return res.status(409).json({
        success: false,
        message: `A ${booking.booking_status.toLowerCase()} booking cannot be changed to ${status.toLowerCase()}.`
      });
    }

    await query(
      `UPDATE tour_bookings SET booking_status = ? WHERE tour_booking_id = ?`,
      [status, bookingId]
    );

    sendNotification(
      booking.user_id,
      status === 'Confirmed' ? 'Tour booking confirmed' : 'Tour booking declined',
      status === 'Confirmed'
        ? `Your booking for "${booking.title}" has been confirmed.`
        : `Your booking for "${booking.title}" was declined by the guide.`
    );

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()}.`
    });
  } catch (error) {
    console.error('Update tour booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update booking.'
    });
  }
};

// ---------- visitor ----------

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
      `SELECT tour_id, title, guide_id, max_participants,
              DATE_FORMAT(tour_date, '%Y-%m-%d') AS tour_date
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

    if (tour.tour_date < todayString()) {
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

    // Notify the tour guide
    try {
      const visitor = await query(
        `SELECT full_name FROM users WHERE user_id = ?`,
        [req.user.user_id]
      );
      const visitorName = visitor.length > 0 ? visitor[0].full_name : 'A visitor';
      sendNotification(
        tour.guide_id,
        'New tour booking',
        `${visitorName} booked ${participants} spot(s) for "${tour.title}".`
      );
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

// Logged-in visitor's tour bookings
const getMyTourBookings = async (req, res) => {
  try {
    const bookings = await query(
      `SELECT
         tb.tour_booking_id, tb.tour_id, tb.number_of_participants,
         tb.booking_status, tb.created_at,
         gt.title AS tour_title,
         gt.status AS tour_status,
         DATE_FORMAT(gt.tour_date, '%Y-%m-%d') AS tour_date,
         TIME_FORMAT(gt.start_time, '%H:%i:%s') AS start_time,
         u.full_name AS guide_name
       FROM tour_bookings tb
       INNER JOIN guided_tours gt ON tb.tour_id = gt.tour_id
       INNER JOIN users u ON gt.guide_id = u.user_id
       WHERE tb.user_id = ?
       ORDER BY gt.tour_date DESC, gt.start_time DESC`,
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
    const rows = await query(
      `SELECT gt.guide_id, gt.title
       FROM tour_bookings tb
       INNER JOIN guided_tours gt ON gt.tour_id = tb.tour_id
       WHERE tb.tour_booking_id = ? AND tb.user_id = ?
         AND tb.booking_status IN ('Pending', 'Confirmed')`,
      [req.params.bookingId, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be cancelled.'
      });
    }

    await query(
      `UPDATE tour_bookings
       SET booking_status = 'Cancelled'
       WHERE tour_booking_id = ? AND user_id = ?`,
      [req.params.bookingId, req.user.user_id]
    );

    sendNotification(
      rows[0].guide_id,
      'Tour booking cancelled',
      `A visitor cancelled their booking for "${rows[0].title}".`
    );

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
  completeTour,
  getTourBookings,
  updateTourBookingStatus,
  bookTour,
  getMyTourBookings,
  cancelMyTourBooking
};