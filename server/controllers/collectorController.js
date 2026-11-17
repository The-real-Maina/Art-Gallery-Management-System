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

// Add artwork to favourites
const addFavourite = async (req, res) => {
  try {
    const { artwork_id } = req.body;

    if (!artwork_id) {
      return res.status(400).json({
        success: false,
        message: 'Artwork ID is required.'
      });
    }

    const artwork = await query(
      `SELECT artwork_id FROM artworks
       WHERE artwork_id = ? AND approval_status = 'Approved'`,
      [artwork_id]
    );

    if (artwork.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Approved artwork not found.'
      });
    }

    await query(
      `INSERT INTO artwork_favourites (user_id, artwork_id)
       VALUES (?, ?)`,
      [req.user.user_id, artwork_id]
    );

    res.status(201).json({
      success: true,
      message: 'Artwork added to favourites.'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Artwork is already in your favourites.'
      });
    }

    console.error('Add favourite error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to add favourite.'
    });
  }
};

// Get collector favourites
const getMyFavourites = async (req, res) => {
  try {
    const favourites = await query(
      `SELECT
         artwork_favourites.favourite_id,
         artwork_favourites.created_at AS favourited_at,
         artworks.artwork_id,
         artworks.title,
         artworks.description,
         artworks.category,
         artworks.medium,
         artworks.image_url,
         artworks.price,
         artworks.availability_status,
         users.full_name AS artist_name
       FROM artwork_favourites
       INNER JOIN artworks
         ON artwork_favourites.artwork_id = artworks.artwork_id
       INNER JOIN artist_profiles
         ON artworks.artist_id = artist_profiles.artist_id
       INNER JOIN users
         ON artist_profiles.user_id = users.user_id
       WHERE artwork_favourites.user_id = ?
       ORDER BY artwork_favourites.created_at DESC`,
      [req.user.user_id]
    );

    res.json({ success: true, favourites });
  } catch (error) {
    console.error('Get favourites error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve favourites.'
    });
  }
};

// Remove favourite
const removeFavourite = async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM artwork_favourites
       WHERE favourite_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favourite not found.'
      });
    }

    res.json({
      success: true,
      message: 'Artwork removed from favourites.'
    });
  } catch (error) {
    console.error('Remove favourite error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to remove favourite.'
    });
  }
};

// Submit purchase inquiry
const createPurchaseInquiry = async (req, res) => {
  try {
    const { artwork_id, message } = req.body;

    if (!artwork_id || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Artwork ID and inquiry message are required.'
      });
    }

    const artwork = await query(
      `SELECT artwork_id, availability_status
       FROM artworks
       WHERE artwork_id = ? AND approval_status = 'Approved'`,
      [artwork_id]
    );

    if (artwork.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Approved artwork not found.'
      });
    }

    if (artwork[0].availability_status !== 'Available') {
      return res.status(409).json({
        success: false,
        message: 'This artwork is currently unavailable.'
      });
    }

    const result = await query(
      `INSERT INTO purchase_inquiries
       (user_id, artwork_id, message, inquiry_status)
       VALUES (?, ?, ?, 'Pending')`,
      [req.user.user_id, artwork_id, message.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Purchase inquiry submitted successfully.',
      inquiry_id: result.insertId
    });
  } catch (error) {
    console.error('Create purchase inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to submit purchase inquiry.'
    });
  }
};

// Collector views own inquiries
const getMyPurchaseInquiries = async (req, res) => {
  try {
    const inquiries = await query(
      `SELECT
         purchase_inquiries.*,
         artworks.title AS artwork_title,
         artworks.image_url,
         artworks.price,
         artist_users.full_name AS artist_name
       FROM purchase_inquiries
       INNER JOIN artworks
         ON purchase_inquiries.artwork_id = artworks.artwork_id
       INNER JOIN artist_profiles
         ON artworks.artist_id = artist_profiles.artist_id
       INNER JOIN users AS artist_users
         ON artist_profiles.user_id = artist_users.user_id
       WHERE purchase_inquiries.user_id = ?
       ORDER BY purchase_inquiries.created_at DESC`,
      [req.user.user_id]
    );

    res.json({ success: true, inquiries });
  } catch (error) {
    console.error('Get purchase inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve inquiries.'
    });
  }
};

// Artist views inquiries for their artworks
const getArtistInquiries = async (req, res) => {
  try {
    const profiles = await query(
      'SELECT artist_id FROM artist_profiles WHERE user_id = ?',
      [req.user.user_id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found.'
      });
    }

    const inquiries = await query(
      `SELECT
         purchase_inquiries.*,
         artworks.title AS artwork_title,
         artworks.price,
         users.full_name AS collector_name,
         users.email AS collector_email
       FROM purchase_inquiries
       INNER JOIN artworks
         ON purchase_inquiries.artwork_id = artworks.artwork_id
       INNER JOIN users
         ON purchase_inquiries.user_id = users.user_id
       WHERE artworks.artist_id = ?
       ORDER BY purchase_inquiries.created_at DESC`,
      [profiles[0].artist_id]
    );

    res.json({ success: true, inquiries });
  } catch (error) {
    console.error('Get artist inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve artist inquiries.'
    });
  }
};

// Artist responds to inquiry (with optional text response)
const respondToInquiry = async (req, res) => {
  try {
    const { inquiry_status, response } = req.body;

    const allowedStatuses = ['Responded', 'Accepted', 'Declined', 'Closed'];

    if (!allowedStatuses.includes(inquiry_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry status. Must be one of: Responded, Accepted, Declined, Closed.'
      });
    }

    if (response !== undefined && response !== null && typeof response !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Response must be text.'
      });
    }

    const trimmedResponse = response ? String(response).trim().slice(0, 2000) : null;

    const result = await query(
      `UPDATE purchase_inquiries
       INNER JOIN artworks
         ON purchase_inquiries.artwork_id = artworks.artwork_id
       INNER JOIN artist_profiles
         ON artworks.artist_id = artist_profiles.artist_id
       SET purchase_inquiries.inquiry_status = ?,
           purchase_inquiries.response = ?
       WHERE purchase_inquiries.inquiry_id = ?
         AND artist_profiles.user_id = ?
         AND purchase_inquiries.inquiry_status = 'Pending'`,
      [inquiry_status, trimmedResponse, req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending inquiry not found for your artwork.'
      });
    }

    // Notify the collector (fire-and-forget)
    try {
      const rows = await query(
        `SELECT pi.user_id, a.title
         FROM purchase_inquiries pi
         INNER JOIN artworks a ON pi.artwork_id = a.artwork_id
         WHERE pi.inquiry_id = ?`,
        [req.params.id]
      );

      if (rows.length > 0) {
        const statusLabel =
          inquiry_status === 'Accepted' ? 'accepted' :
          inquiry_status === 'Declined' ? 'declined' :
          inquiry_status === 'Closed' ? 'closed' : 'responded to';

        notify(
          rows[0].user_id,
          'Inquiry update',
          `The artist has ${statusLabel} your inquiry about "${rows[0].title}".`,
          'inquiry'
        );
      }
    } catch (notifyErr) {
      console.error('Inquiry notification error:', notifyErr);
    }

    res.json({
      success: true,
      message: 'Purchase inquiry updated successfully.'
    });
  } catch (error) {
    console.error('Respond to inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update purchase inquiry.'
    });
  }
};

// Administrator views ALL purchase inquiries (oversight)
const getAllPurchaseInquiries = async (req, res) => {
  try {
    const inquiries = await query(
      `SELECT
         purchase_inquiries.*,
         artworks.title AS artwork_title,
         artworks.image_url,
         artworks.price,
         collector.full_name AS collector_name,
         collector.email AS collector_email,
         artist_user.full_name AS artist_name
       FROM purchase_inquiries
       INNER JOIN artworks
         ON purchase_inquiries.artwork_id = artworks.artwork_id
       INNER JOIN users AS collector
         ON purchase_inquiries.user_id = collector.user_id
       INNER JOIN artist_profiles
         ON artworks.artist_id = artist_profiles.artist_id
       INNER JOIN users AS artist_user
         ON artist_profiles.user_id = artist_user.user_id
       ORDER BY purchase_inquiries.created_at DESC`
    );

    res.json({ success: true, inquiries });
  } catch (error) {
    console.error('Get all purchase inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve purchase inquiries.'
    });
  }
};

module.exports = {
  addFavourite,
  getMyFavourites,
  removeFavourite,
  createPurchaseInquiry,
  getMyPurchaseInquiries,
  getArtistInquiries,
  respondToInquiry,
  getAllPurchaseInquiries
};