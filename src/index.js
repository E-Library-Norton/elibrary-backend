const dotenv = require("dotenv");
dotenv.config({ path: ['.env.local', '.env'] });

const http = require('http');
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const { sequelize } = require("./config/database");
const { initSocket } = require('./utils/socket');
const { passport } = require('./config/passport');

const app = express();
const httpServer = http.createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://frontend.samnangchan.shop',
  'https://admin-elibrary.samnangchan.shop',
  'https://admin-elibrary.nortonu.app',
  'https://elibrary.nortonu.app',
];

// ── Socket.IO (real-time) 
initSocket(httpServer, ALLOWED_ORIGINS);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "E-Library API is running" });
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());  // gzip/brotli — 30–70% smaller responses
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(passport.initialize());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('tiny'));
}
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true,
}));

// ── Routes
app.use('/api', require('./routes'));

// ── 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.originalUrl} not found` },
  });
});

// ── Global error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "Internal server error",
      details: err.details || null,
    },
  });
});

const PORT = process.env.PORT || 5005;

// Render free-tier databases go to sleep after inactivity.
// The first connection attempt wakes them up but may drop immediately.
// This retry loop waits 3 seconds and tries again automatically.
async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log("Database connected successfully!");
      httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
      return;
    } catch (err) {
      console.warn(`DB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`Retrying in ${delayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error("Could not connect to database after several retries. Exiting.");
        process.exit(1);
      }
    }
  }
}

connectWithRetry();