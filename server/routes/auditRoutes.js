
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  getAllAuditLogs,
  getAuditLogById
} = require('../controllers/auditController');

// Only authenticated Administrators can access audit logs
router.use(protect);
router.use(authorize('Administrator'));

// View all audit logs
router.get('/', getAllAuditLogs);

// View a specific audit log
router.get('/:id', getAuditLogById);

module.exports = router;
