// In-memory registry of active SSE connections.
// Maps userId (string) → Express response object.
// Works for single-instance deployment; replace with Redis pub/sub for multi-instance.
const clients = new Map()

// Per-user batch queues for card_activity events.
// Maps userId (string) → { events: [], timer: NodeJS.Timeout | null }
const batchQueues = new Map()

const BATCH_WINDOW_MS = 50

/**
 * Push an SSE event to a connected client.
 * - Regular notifications (topic !== 'card_activity') → sent immediately.
 * - card_activity events → batched within a 50ms window; flushed as a single
 *   message. Single-event batches are sent unwrapped; multi-event batches are
 *   sent as { topic: 'card_activity_batch', events: [...] }.
 */
const pushSSE = (userId, data) => {
  const uid = String(userId)
  const res = clients.get(uid)
  if (!res) return

  if (data.topic !== 'card_activity') {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`) }
    catch { removeClient(uid) }
    return
  }

  if (!batchQueues.has(uid)) batchQueues.set(uid, { events: [], timer: null })
  const batch = batchQueues.get(uid)
  batch.events.push(data)
  if (batch.timer) return

  batch.timer = setTimeout(() => {
    const b = batchQueues.get(uid)
    batchQueues.delete(uid)
    const r = clients.get(uid)
    if (!r || !b) return
    const payload = b.events.length === 1
      ? b.events[0]
      : { topic: 'card_activity_batch', events: b.events }
    try { r.write(`data: ${JSON.stringify(payload)}\n\n`) }
    catch { removeClient(uid) }
  }, BATCH_WINDOW_MS)
}

/**
 * Remove a client and cancel any pending batch timer.
 * Must be called on disconnect instead of clients.delete() directly.
 */
const removeClient = (userId) => {
  const uid = String(userId)
  clients.delete(uid)
  const b = batchQueues.get(uid)
  if (b?.timer) clearTimeout(b.timer)
  batchQueues.delete(uid)
}

module.exports = { clients, pushSSE, removeClient }
