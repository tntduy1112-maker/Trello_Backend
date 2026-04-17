// In-memory registry of active SSE connections.
// Maps userId (string) → Express response object.
// Works for single-instance deployment; replace with Redis pub/sub for multi-instance.
const clients = new Map();

/**
 * Push a notification event to a connected SSE client.
 * Silently no-ops if the user is not currently connected.
 */
const pushSSE = (userId, data) => {
  const res = clients.get(String(userId));
  if (!res) return;
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.error('[SSE] Failed to push to client, removing:', err.message);
    clients.delete(String(userId));
  }
};

module.exports = { clients, pushSSE };
