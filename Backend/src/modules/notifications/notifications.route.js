const express = require('express');
const controller = require('./notifications.controller');
const authenticate = require('../../middlewares/authenticate');
const { verifyAccessToken } = require('../../utils/jwt');
const { isBlacklisted, findUserById } = require('../auth/auth.model');
const { clients } = require('../../utils/sseClients');
const { error } = require('../../utils/response');

const router = express.Router();

/**
 * SSE stream endpoint.
 * EventSource (browser native) cannot send Authorization headers,
 * so we accept the access token via ?token= query param instead.
 * Mounted at GET /notifications/stream — must be defined before /:id routes.
 */
router.get('/stream', async (req, res) => {
  const token = req.query.token;
  if (!token) return error(res, 'Unauthorized', 401);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }

  if (payload.jti && await isBlacklisted(payload.jti)) {
    return error(res, 'Token has been revoked', 401);
  }

  const user = await findUserById(payload.userId).catch(() => null);
  if (!user || !user.is_active) return error(res, 'Unauthorized', 401);

  // Upgrade to SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const userId = String(payload.userId);
  clients.set(userId, res);

  // Keepalive ping every 25s to prevent proxy/firewall timeouts
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* ignore */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    clients.delete(userId);
  });
});

// All remaining routes require normal JWT auth
router.use(authenticate);

// Specific paths before wildcard /:id
router.get('/unread-count', controller.getUnreadCount);
router.put('/read-all', controller.markAllRead);

router.get('/', controller.getNotifications);
router.put('/:id/read', controller.markRead);
router.delete('/:id', controller.deleteNotification);

module.exports = router;
