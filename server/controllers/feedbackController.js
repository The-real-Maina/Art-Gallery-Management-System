const db = require('../config/db');

// Visitor submits feedback
const createFeedback = (req, res) => {
  const { exhibition_id, booking_id, rating, comment } = req.body;
  const user_id = req.user.user_id;

  if (!rating || !Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be a whole number between 1 and 5.'
    });
  }

  if (!exhibition_id && !booking_id) {
    return res.status(400).json({
      success: false,
      message: 'Feedback must be linked to an exhibition or visit booking.'
    });
  }

  if (comment && comment.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Comment cannot exceed 2000 characters.'
    });
  }

  let validationQuery;
  let validationValue;

  if (booking_id) {
    validationQuery = `
      SELECT booking_id
      FROM visit_bookings
      WHERE booking_id = ?
        AND user_id = ?
        AND booking_status = 'Completed'
    `;
    validationValue = [booking_id, user_id];
  } else {
    validationQuery = `
      SELECT exhibition_id
      FROM exhibitions
      WHERE exhibition_id = ?
    `;
    validationValue = [exhibition_id];
  }

  db.query(validationQuery, validationValue, (validationError, validationResults) => {
    if (validationError) {
      console.error('Feedback validation error:', validationError);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate feedback reference.'
      });
    }

    if (validationResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: booking_id
          ? 'Only completed bookings belonging to you can receive feedback.'
          : 'Exhibition not found.'
      });
    }

    const insertQuery = `
      INSERT INTO feedback
      (user_id, exhibition_id, booking_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        user_id,
        exhibition_id || null,
        booking_id || null,
        Number(rating),
        comment || null
      ],
      (error, result) => {
        if (error) {
          console.error('Create feedback error:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to submit feedback.'
          });
        }

        return res.status(201).json({
          success: true,
          message: 'Feedback submitted successfully.',
          feedback_id: result.insertId
        });
      }
    );
  });
};

// Visitor views their own feedback
const getMyFeedback = (req, res) => {
  const user_id = req.user.user_id;

  const query = `
    SELECT
      f.*,
      e.title AS exhibition_title
    FROM feedback f
    LEFT JOIN exhibitions e ON f.exhibition_id = e.exhibition_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(query, [user_id], (error, results) => {
    if (error) {
      console.error('Get my feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve your feedback.'
      });
    }

    return res.status(200).json({
      success: true,
      feedback: results
    });
  });
};

// Administrator and Gallery Curator view all feedback
const getAllFeedback = (req, res) => {
  const query = `
    SELECT
      f.*,
      u.full_name,
      u.email,
      e.title AS exhibition_title
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.user_id
    LEFT JOIN exhibitions e ON f.exhibition_id = e.exhibition_id
    ORDER BY f.created_at DESC
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error('Get all feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve feedback.'
      });
    }

    return res.status(200).json({
      success: true,
      feedback: results
    });
  });
};

// Administrator deletes feedback (moderation)
const deleteFeedback = (req, res) => {
  const { id } = req.params;

  db.query(
    'DELETE FROM feedback WHERE feedback_id = ?',
    [id],
    (error, result) => {
      if (error) {
        console.error('Delete feedback error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete feedback.'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found.'
        });
      }

      return res.json({
        success: true,
        message: 'Feedback deleted successfully.'
      });
    }
  );
};

module.exports = {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  deleteFeedback
};