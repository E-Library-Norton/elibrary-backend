// utils/pushNotification.js
// Thin wrapper around web-push.  Set VAPID keys via env vars.

const webpush = require('web-push');
const { PushSubscription } = require('../models');

// ── VAPID setup 
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  ;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ;
const VAPID_EMAIL       = process.env.VAPID_EMAIL       || 'mailto:admin@elibrary.edu.kh';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('[Push] VAPID keys not set — push notifications disabled');
}

// ── Send to a single subscription 
async function sendPushNotification(subscriptionRecord, payload) {
  if (!VAPID_PUBLIC_KEY) return; // silently no-op if not configured

  const subscription = {
    endpoint: subscriptionRecord.endpoint,
    keys: subscriptionRecord.keys,
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    // 410 Gone / 404 Not Found → subscription is no longer valid, delete it
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.destroy({ where: { id: subscriptionRecord.id } });
    } else {
      console.error('[Push] sendPushNotification error:', err.message);
    }
  }
}

// ── Broadcast to ALL active subscriptions 
async function broadcastNotification(title, body, url = '/') {
  if (!VAPID_PUBLIC_KEY) return;

  const subs = await PushSubscription.findAll();
  if (subs.length === 0) return;

  const payload = { title, body, url, icon: '/icon-192x192.png', badge: '/badge-72x72.png' };

  await Promise.allSettled(subs.map((sub) => sendPushNotification(sub, payload)));
}

module.exports = {
  webpush,
  sendPushNotification,
  broadcastNotification,
  VAPID_PUBLIC_KEY,
};
