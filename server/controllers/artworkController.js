const db = require('../config/db');
const { notify } = require('../utils/notify');

const query = (sql, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

// Get all publicly available approved artworks
exports.getPublicArtworks = async (req, res) => {
  try {
    const artworks = await query(
      `SELECT a.*, u.full_name AS artist_name
       FROM artworks a
       JOIN artist_profiles ap ON a.artist_id = ap.artist_id
       JOIN users u ON ap.user_id = u.user_id
       WHERE a.approval_status = 'Approved'
       ORDER BY a.created_at DESC`
    );
    res.json({ success: true, artworks });
  } catch (error) {
    console.error('Get public artworks error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve artworks.' });
  }
};

// Get all artworks for administrators and gallery curators
exports.getAllArtworks = async (req, res) => {
  try {
    const artworks = await query(
      `SELECT a.*, u.full_name AS artist_name
       FROM artworks a
       JOIN artist_profiles ap ON a.artist_id = ap.artist_id
       JOIN users u ON ap.user_id = u.user_id
       ORDER BY a.created_at DESC`
    );
    res.json({ success: true, artworks });
  } catch (error) {
    console.error('Get all artworks error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve artworks.' });
  }
};

// Get artworks submitted by the logged-in artist
exports.getMyArtworks = async (req, res) => {
  try {
    const profiles = await query('SELECT artist_id FROM artist_profiles WHERE user_id = ?', [req.user.user_id]);
    if (!profiles.length) {
      return res.status(404).json({ success: false, message: 'Artist profile not found. Please create your artist profile first.' });
    }
    const artworks = await query(
      `SELECT * FROM artworks WHERE artist_id = ? ORDER BY created_at DESC`,
      [profiles[0].artist_id]
    );
    res.json({ success: true, artworks });
  } catch (error) {
    console.error('Get my artworks error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve your artworks.' });
  }
};

// Submit a new artwork
exports.createArtwork = async (req, res) => {
  try {
    const { title, description, category, medium, creation_year, price } = req.body;
    
    // Use req.file from Multer instead of req.body.image_url
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Artwork title is required.' });
    }

    if (price !== undefined && price !== null && (price === '' || !Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid non-negative price.' });
    }

    const profiles = await query('SELECT artist_id FROM artist_profiles WHERE user_id = ?', [req.user.user_id]);
    if (!profiles.length) {
      return res.status(404).json({ success: false, message: 'Create your artist profile before submitting artwork.' });
    }

    const result = await query(
      `INSERT INTO artworks
       (artist_id, title, description, category, medium,
        creation_year, image_url, price, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        profiles[0].artist_id,
        title.trim(),
        description || null,
        category || null,
        medium || null,
        creation_year || null,
        image_url,
        price === '' || price === undefined ? null : price
      ]
    );

    res.status(201).json({ success: true, message: 'Artwork submitted successfully and is awaiting approval.', artwork_id: result.insertId });
  } catch (error) {
    console.error('Create artwork error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit artwork.' });
  }
};

// Update an artist's own pending or rejected artwork
exports.updateArtwork = async (req, res) => {
  try {
    const artworkId = Number(req.params.id);
    if (!Number.isInteger(artworkId) || artworkId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid artwork ID.' });
    }

    const profiles = await query('SELECT artist_id FROM artist_profiles WHERE user_id = ?', [req.user.user_id]);
    if (!profiles.length) {
      return res.status(404).json({ success: false, message: 'Artist profile not found.' });
    }

    const existing = await query(
      `SELECT artwork_id, approval_status FROM artworks WHERE artwork_id = ? AND artist_id = ?`,
      [artworkId, profiles[0].artist_id]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Artwork not found or you do not own it.' });
    }

    if (existing[0].approval_status === 'Approved') {
      return res.status(403).json({ success: false, message: 'Approved artworks cannot be edited directly. Contact a Gallery Curator.' });
    }

    const { title, description, category, medium, creation_year, price, existing_image_url } = req.body;
    
    // Check if a new file is uploaded, otherwise keep the old one
    const image_url = req.file ? `/uploads/${req.file.filename}` : existing_image_url;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Artwork title is required.' });
    }

    if (price !== undefined && price !== null && (price === '' || !Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid non-negative price.' });
    }

    await query(
      `UPDATE artworks
       SET title = ?, description = ?, category = ?, medium = ?,
           creation_year = ?, image_url = ?, price = ?,
           approval_status = 'Pending'
       WHERE artwork_id = ? AND artist_id = ?`,
      [
        title.trim(),
        description || null,
        category || null,
        medium || null,
        creation_year || null,
        image_url,
        price === '' || price === undefined ? null : price,
        artworkId,
        profiles[0].artist_id
      ]
    );

    res.json({ success: true, message: 'Artwork updated and resubmitted for approval.' });
  } catch (error) {
    console.error('Update artwork error:', error);
    res.status(500).json({ success: false, message: 'Failed to update artwork.' });
  }
};

// Delete an artist's own pending or rejected artwork
exports.deleteArtwork = async (req, res) => {
  try {
    const artworkId = Number(req.params.id);
    if (!Number.isInteger(artworkId) || artworkId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid artwork ID.' });
    }

    const profiles = await query('SELECT artist_id FROM artist_profiles WHERE user_id = ?', [req.user.user_id]);
    if (!profiles.length) {
      return res.status(404).json({ success: false, message: 'Artist profile not found.' });
    }

    const result = await query(
      `DELETE FROM artworks WHERE artwork_id = ? AND artist_id = ? AND approval_status IN ('Pending', 'Rejected')`,
      [artworkId, profiles[0].artist_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Artwork not found, not owned by you, or already approved.' });
    }

    res.json({ success: true, message: 'Artwork deleted successfully.' });
  } catch (error) {
    console.error('Delete artwork error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete artwork.' });
  }
};

// Approve or reject an artwork
exports.reviewArtwork = async (req, res) => {
  try {
    const artworkId = Number(req.params.id);
    const { approval_status } = req.body;

    if (!Number.isInteger(artworkId) || artworkId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid artwork ID.' });
    }

    if (!['Approved', 'Rejected'].includes(approval_status)) {
      return res.status(400).json({ success: false, message: 'Approval status must be Approved or Rejected.' });
    }

    const result = await query(
      `UPDATE artworks SET approval_status = ? WHERE artwork_id = ? AND approval_status = 'Pending'`,
      [approval_status, artworkId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Pending artwork not found.' });
    }

    try {
      const artistRows = await query(
        `SELECT ap.user_id, a.title FROM artworks a INNER JOIN artist_profiles ap ON a.artist_id = ap.artist_id WHERE a.artwork_id = ?`,
        [artworkId]
      );
      if (artistRows.length > 0) {
        notify(artistRows[0].user_id, `Artwork ${approval_status.toLowerCase()}`, `Your artwork "${artistRows[0].title}" has been ${approval_status.toLowerCase()}.`, 'artwork');
      }
    } catch (notifyErr) {
      console.error('Artwork review notification error:', notifyErr);
    }

    res.json({ success: true, message: `Artwork ${approval_status.toLowerCase()} successfully.` });
  } catch (error) {
    console.error('Review artwork error:', error);
    res.status(500).json({ success: false, message: 'Failed to review artwork.' });
  }
};