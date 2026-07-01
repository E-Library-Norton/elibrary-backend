// scripts/keep-alive.js
// ══════════════════════════════════════════════════════════════════════════════
// Norton E-Library — Render Keep-Alive Script
//
// Periodically pings the Render backend endpoint with a lightweight query.
// Touches the database (fetches a single book) to keep both the Web Service
// and the PostgreSQL instance awake and prevent sleeping.
//
// Usage:
//   node scripts/keep-alive.js [interval_in_minutes]
// ══════════════════════════════════════════════════════════════════════════════

const https = require('https');
const http = require('http');

// Config
const targetUrl = process.env.BACKEND_URL || 'https://elibrary-api.nortonu.app';
const pingEndpoint = `${targetUrl}/api/books?limit=1`;
const intervalMinutes = Number(process.argv[2] || 10); // default to every 10 minutes
const intervalMs = intervalMinutes * 60 * 1000;

console.log(`==================================================`);
console.log(`🚀 Starting Render Keep-Alive Ping Service`);
console.log(`🎯 Target URL: ${pingEndpoint}`);
console.log(`⏰ Interval:   Every ${intervalMinutes} minutes`);
console.log(`==================================================\n`);

function ping() {
  const client = pingEndpoint.startsWith('https') ? https : http;
  
  console.log(`[${new Date().toISOString()}] Sending keep-alive request...`);
  
  client.get(pingEndpoint, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] Response: Status ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        if (parsed.success) {
          console.log(`   ✓ Backend and DB are active!`);
        } else {
          console.log(`   ⚠ Backend responded, but returned success=false`);
        }
      } catch (err) {
        console.log(`   ✓ Backend is awake (non-JSON response)`);
      }
    });
  }).on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ❌ Ping failed: ${err.message}`);
  });
}

// Run immediately on start, then set interval
ping();
setInterval(ping, intervalMs);
