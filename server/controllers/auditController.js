
const db = require('../config/db');

// Administrator views system audit logs
const getAllAuditLogs = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { entity_type, action, user_id } = req.query;

  let conditions = [];
  let params = [];

  if (entity_type) {
    conditions.push('al.entity_type = ?');
    params.push(entity_type);
  }

  if (action) {
    conditions.push('al.action LIKE ?');
    params.push(`%${action}%`);
  }

  if (user_id) {
    conditions.push('al.user_id = ?');
    params.push(user_id);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM audit_logs al
    ${whereClause}
  `;

  db.query(countQuery, params, (countError, countResults) => {
    if (countError) {
      console.error('Audit log count error:', countError);
      return res.status(500).json({
        success: false,
        message: 'Failed to count audit logs.'
      });
    }

    const total = countResults[0].total;

    const query = `
      SELECT
        al.*,
        u.full_name,
        u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(query, [...params, limit, offset], (error, results) => {
      if (error) {
        console.error('Get audit logs error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve audit logs.'
        });
      }

      return res.status(200).json({
        success: true,
        audit_logs: results,
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit)
        }
      });
    });
  });
};

// Administrator views one audit log
const getAuditLogById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      al.*,
      u.full_name,
      u.email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.user_id
    WHERE al.log_id = ?
  `;

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('Get audit log error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit log.'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found.'
      });
    }

    return res.status(200).json({
      success: true,
      audit_log: results[0]
    });
  });
};

module.exports = {
  getAllAuditLogs,
  getAuditLogById
};
