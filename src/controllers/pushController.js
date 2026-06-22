// controllers/pushController.js
const { PushSubscription } = require('../models');
const ResponseFormatter = require('../utils/responseFormatter');
const { VAPID_PUBLIC_KEY } = require('../utils/pushNotification');

class PushController {
  // ── GET /api/push/vapid-public-key 
  static async getVapidPublicKey(req, res) {
    return ResponseFormatter.success(res, { publicKey: VAPID_PUBLIC_KEY || null });
  }

  // ── POST /api/push/subscribe 
  // Body: { endpoint, keys: { p256dh, auth } }
  static async subscribe(req, res, next) {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return ResponseFormatter.error(res, 'Invalid subscription payload', 400);
      }

      const userId = req.user?.id ?? null;

      // Upsert by endpoint
      const [sub, created] = await PushSubscription.findOrCreate({
        where: { endpoint },
        defaults: { endpoint, keys, userId },
      });

      if (!created && sub.userId !== userId) {
        // update user association if the user logged in with the same browser
        await sub.update({ userId, keys });
      }

      return ResponseFormatter.success(
        res,
        { id: sub.id },
        created ? 'Subscribed successfully' : 'Subscription updated',
        created ? 201 : 200
      );
    } catch (error) {
      next(error);
    }
  }

  // ── DELETE /api/push/unsubscribe ──
  // Body: { endpoint }
  static async unsubscribe(req, res, next) {
    try {
      const { endpoint } = req.body;
      if (!endpoint) return ResponseFormatter.error(res, 'endpoint is required', 400);

      await PushSubscription.destroy({ where: { endpoint } });
      return ResponseFormatter.success(res, null, 'Unsubscribed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PushController;
