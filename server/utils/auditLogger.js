const db = require('../config/db');

const logAudit = (req, action, entity_type, entity_id = null, details = null) => {
  const user_id = req.user ? req.user.user_id : null;
  const ip_address = req.ip || null;

  const query = `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(query, [user_id, action, entity_type, entity_id, details, ip_address], (error) => {
    if (error) console.error('Audit logging failed:', error.message);
  });
};

module.exports = logAudit;
