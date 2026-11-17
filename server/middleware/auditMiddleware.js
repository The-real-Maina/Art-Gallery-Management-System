
const logAudit = require('../utils/auditLogger');

const auditMiddleware = (req, res, next) => {
  const methodsToLog = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!methodsToLog.includes(req.method)) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const pathParts = req.baseUrl
        ? req.baseUrl.split('/').filter(Boolean)
        : req.path.split('/').filter(Boolean);

      const entityType = pathParts[1] || 'system';

      logAudit(
        req,
        `${req.method} ${req.originalUrl}`,
        entityType,
        req.params.id || null,
        JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode
        })
      );
    }

    return originalJson(body);
  };

  next();
};

module.exports = auditMiddleware;
