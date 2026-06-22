const { Activity } = require('../models');
const { getIO, EVENTS } = require('./socket');

/**
 * Logs a user activity to the database and emits a real-time event to the
 * 'admin' Socket.IO room so the dashboard updates instantly.
 *
 * @param {number} options.userId       - ID of the user performing the action
 * @param {string} options.action       - Action type ('created', 'updated', 'deleted', 'login')
 * @param {number} [options.targetId]   - ID of the target object
 * @param {string} [options.targetName] - Name/title of the target object
 * @param {string} options.targetType   - Target type ('book', 'user', 'role', etc.)
 * @param {Object} [options.metadata]   - Additional JSON metadata
 */
async function logActivity({ userId, action, targetId, targetName, targetType, metadata }) {
    try {
        const activity = await Activity.create({
            userId, action, targetId, targetName, targetType, metadata,
        });

        // ── Real-time: push new activity to every admin client 
        try {
            const io = getIO();
            io.to('admin').emit(EVENTS.ACTIVITY_NEW, {
                activity: {
                    id: activity.id,
                    userId,
                    action,
                    targetType,
                    targetId,
                    targetName,
                    metadata,
                    createdAt: activity.createdAt,
                },
            });
        } catch {
            // Socket may not be ready during startup — silently ignore
        }
    } catch (err) {
        console.error('Activity Logger Error:', err.message);
    }
}

module.exports = { logActivity };
