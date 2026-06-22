// src/utils/socket.js
// Centralised Socket.IO helper — import `getIO()` anywhere you need to emit.
// The server calls `initSocket(httpServer)` once at startup.

let _io = null;

/**
 * Attach Socket.IO to the HTTP server.
 * @param {import('http').Server} httpServer
 * @param {string[]} allowedOrigins   - same CORS list used by Express
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer, allowedOrigins = []) {
  const { Server } = require('socket.io');

  _io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Reconnect-friendly settings
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  _io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;
    console.log(`[Socket] client connected  — id=${socket.id}  ip=${clientIp}`);

    // ── Admin room: authenticated clients can join 'admin' room to receive
    //    privileged events (activity feed, stats updates).
    socket.on('join:admin', () => {
      socket.join('admin');
      console.log(`[Socket] ${socket.id} joined room: admin`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] client disconnected — id=${socket.id}  reason=${reason}`);
    });
  });

  console.log('[Socket] Socket.IO initialised');
  return _io;
}

/**
 * Return the Socket.IO server instance.
 * Throws if `initSocket` was never called.
 * @returns {import('socket.io').Server}
 */
function getIO() {
  if (!_io) throw new Error('Socket.IO not initialised — call initSocket() first');
  return _io;
}

// ── Emit helpers (prevent duplicate delivery) 

/**
 * Emit to the 'admin' room only.
 */
function emitToAdmin(event, payload) {
  try { _io?.to('admin').emit(event, payload); } catch { /* ignore */ }
}

/**
 * Emit to everyone EXCEPT the 'admin' room.
 * Useful for public events that admins also get via emitToAdmin.
 */
function emitExceptAdmin(event, payload) {
  try { _io?.except('admin').emit(event, payload); } catch { /* ignore */ }
}

/**
 * Broadcast to ALL sockets without duplication:
 *  - admin room gets `adminPayload ?? payload`
 *  - non-admin sockets get `payload`
 * This replaces the old pattern of calling emitToAdmin + io.emit which
 * caused admin sockets to receive the event twice.
 */
function emitBroadcast(event, payload, adminPayload) {
  emitToAdmin(event, adminPayload ?? payload);
  emitExceptAdmin(event, payload);
}

// ── Event name constants (single source of truth) 

/** Emitted to the 'admin' room whenever any CRUD activity is logged */
const EVENTS = {
  ACTIVITY_NEW: 'activity:new',       // { activity }
  STATS_UPDATED: 'stats:updated',      // { books, members, categories }
  BOOK_CREATED: 'book:created',       // { book }
  BOOK_UPDATED: 'book:updated',       // { book }
  BOOK_DELETED: 'book:deleted',       // { bookId }
  REVIEW_CREATED: 'review:created',     // { review, bookTitle }
  REVIEW_UPDATED: 'review:updated',     // { review, bookTitle }
  REVIEW_DELETED: 'review:deleted',     // { reviewId, bookTitle }
  FEEDBACK_NEW: 'feedback:new',       // { feedback }
  NOTIFICATION_NEW: 'notification:new',   // { title, body, url }
};

module.exports = { initSocket, getIO, EVENTS, emitToAdmin, emitExceptAdmin, emitBroadcast };
