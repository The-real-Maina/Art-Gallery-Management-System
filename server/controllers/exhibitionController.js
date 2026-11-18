const db = require('../config/db');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

// Get public exhibitions
const getPublicExhibitions = async (req, res) => {
  try {
    const exhibitions = await query(
      `SELECT exhibition_id, title, description, location,
              start_date, end_date, cover_image, status
       FROM exhibitions
       WHERE status IN ('Upcoming', 'Ongoing')
       ORDER BY start_date ASC`
    );

    res.json({ success: true, exhibitions });
  } catch (error) {
    console.error('Public exhibitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve exhibitions.'
    });
  }
};

// Get all exhibitions
const getAllExhibitions = async (req, res) => {
  try {
    const exhibitions = await query(
      `SELECT * FROM exhibitions ORDER BY created_at DESC`
    );

    res.json({ success: true, exhibitions });
  } catch (error) {
    console.error('Get exhibitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve exhibitions.'
    });
  }
};

// Get single exhibition details (NEW)
const getExhibitionById = async (req, res) => {
  try {
    const { id } = req.params;
    const exhibitions = await query(
      `SELECT * FROM exhibitions WHERE exhibition_id = ?`,
      [id]
    );

    if (exhibitions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found.'
      });
    }

    res.json({ success: true, exhibition: exhibitions[0] });
  } catch (error) {
    console.error('Get exhibition error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve exhibition.'
    });
  }
};

// Create exhibition
const createExhibition = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      start_date,
      end_date,
      cover_image
    } = req.body;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date and end date are required.'
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    const result = await query(
      `INSERT INTO exhibitions
       (title, description, location, start_date, end_date, cover_image, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Upcoming')`,
      [
        title.trim(),
        description || null,
        location || null,
        start_date,
        end_date,
        cover_image || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Exhibition created successfully.',
      exhibition_id: result.insertId
    });
  } catch (error) {
    console.error('Create exhibition error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create exhibition.'
    });
  }
};

// Update exhibition
const updateExhibition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      start_date,
      end_date,
      cover_image,
      status
    } = req.body;

    const validStatuses = [
      'Upcoming',
      'Ongoing',
      'Completed',
      'Cancelled'
    ];

    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date and end date are required.'
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exhibition status.'
      });
    }

    const result = await query(
      `UPDATE exhibitions
       SET title = ?, description = ?, location = ?,
           start_date = ?, end_date = ?, cover_image = ?,
           status = COALESCE(?, status)
       WHERE exhibition_id = ?`,
      [
        title.trim(),
        description || null,
        location || null,
        start_date,
        end_date,
        cover_image || null,
        status || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found.'
      });
    }

    res.json({
      success: true,
      message: 'Exhibition updated successfully.'
    });
  } catch (error) {
    console.error('Update exhibition error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update exhibition.'
    });
  }
};

// Add approved artwork to exhibition
const addArtworkToExhibition = async (req, res) => {
  try {
    const { id } = req.params;
    const { artwork_id } = req.body;

    if (!artwork_id) {
      return res.status(400).json({
        success: false,
        message: 'Artwork ID is required.'
      });
    }

    const exhibition = await query(
      'SELECT exhibition_id FROM exhibitions WHERE exhibition_id = ?',
      [id]
    );

    if (exhibition.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found.'
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
      `INSERT INTO exhibition_artworks (exhibition_id, artwork_id)
       VALUES (?, ?)`,
      [id, artwork_id]
    );

    res.status(201).json({
      success: true,
      message: 'Artwork added to exhibition successfully.'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This artwork is already in the exhibition.'
      });
    }

    console.error('Add exhibition artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to add artwork to exhibition.'
    });
  }
};

// Remove artwork from exhibition
const removeArtworkFromExhibition = async (req, res) => {
  try {
    const { id, artworkId } = req.params;

    const result = await query(
      `DELETE FROM exhibition_artworks
       WHERE exhibition_id = ? AND artwork_id = ?`,
      [id, artworkId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artwork was not found in this exhibition.'
      });
    }

    res.json({
      success: true,
      message: 'Artwork removed from exhibition.'
    });
  } catch (error) {
    console.error('Remove exhibition artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to remove artwork.'
    });
  }
};

// Get artworks in an exhibition
const getExhibitionArtworks = async (req, res) => {
  try {
    const { id } = req.params;

    const artworks = await query(
      `SELECT
         artworks.*,
         users.full_name AS artist_name
       FROM exhibition_artworks
       INNER JOIN artworks
         ON exhibition_artworks.artwork_id = artworks.artwork_id
       INNER JOIN artist_profiles
         ON artworks.artist_id = artist_profiles.artist_id
       INNER JOIN users
         ON artist_profiles.user_id = users.user_id
       WHERE exhibition_artworks.exhibition_id = ?
         AND artworks.approval_status = 'Approved'`,
      [id]
    );

    res.json({ success: true, artworks });
  } catch (error) {
    console.error('Exhibition artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve exhibition artworks.'
    });
  }
};

module.exports = {
  getPublicExhibitions,
  getAllExhibitions,
  getExhibitionById,        // <-- ADDED
  createExhibition,
  updateExhibition,
  addArtworkToExhibition,
  removeArtworkFromExhibition,
  getExhibitionArtworks
};