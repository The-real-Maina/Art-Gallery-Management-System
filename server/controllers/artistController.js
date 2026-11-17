
const db = require('../config/db');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

// Create artist profile
const createArtistProfile = async (req, res) => {
  try {
    const { biography, specialization, profile_image, website } = req.body;
    const userId = req.user.user_id;

    const existing = await query(
      'SELECT artist_id FROM artist_profiles WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have an artist profile.'
      });
    }

    const result = await query(
      `INSERT INTO artist_profiles
       (user_id, biography, specialization, profile_image, website)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        biography || null,
        specialization || null,
        profile_image || null,
        website || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Artist profile created successfully.',
      artist_id: result.insertId
    });
  } catch (error) {
    console.error('Create artist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create artist profile.'
    });
  }
};

// Get logged-in artist profile
const getMyArtistProfile = async (req, res) => {
  try {
    const profiles = await query(
      `SELECT
         artist_profiles.*,
         users.full_name,
         users.email
       FROM artist_profiles
       INNER JOIN users ON artist_profiles.user_id = users.user_id
       WHERE artist_profiles.user_id = ?`,
      [req.user.user_id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found.'
      });
    }

    res.json({
      success: true,
      profile: profiles[0]
    });
  } catch (error) {
    console.error('Get artist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve artist profile.'
    });
  }
};

// Update logged-in artist profile
const updateArtistProfile = async (req, res) => {
  try {
    const { biography, specialization, profile_image, website } = req.body;

    const result = await query(
      `UPDATE artist_profiles
       SET biography = ?,
           specialization = ?,
           profile_image = ?,
           website = ?
       WHERE user_id = ?`,
      [
        biography || null,
        specialization || null,
        profile_image || null,
        website || null,
        req.user.user_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found.'
      });
    }

    res.json({
      success: true,
      message: 'Artist profile updated successfully.'
    });
  } catch (error) {
    console.error('Update artist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update artist profile.'
    });
  }
};

// Public artist directory
const getPublicArtists = async (req, res) => {
  try {
    const artists = await query(
      `SELECT
         artist_profiles.artist_id,
         artist_profiles.biography,
         artist_profiles.specialization,
         artist_profiles.profile_image,
         artist_profiles.website,
         users.full_name
       FROM artist_profiles
       INNER JOIN users ON artist_profiles.user_id = users.user_id
       WHERE users.account_status = 'Active'
       ORDER BY users.full_name ASC`
    );

    res.json({
      success: true,
      artists
    });
  } catch (error) {
    console.error('Get public artists error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve artists.'
    });
  }
};

module.exports = {
  createArtistProfile,
  getMyArtistProfile,
  updateArtistProfile,
  getPublicArtists
};
