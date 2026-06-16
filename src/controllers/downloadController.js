// controllers/downloadController.js
const https = require('https');
const http = require('http');
const { Op } = require('sequelize');
const { Download, Book, User } = require('../models');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const r2 = require('../config/r2');
const { extractKeyFromUrl } = require('../utils/cloudR2Upload');
const ResponseFormatter = require('../utils/responseFormatter');
const { NotFoundError } = require('../utils/errors');

const BUCKET = process.env.R2_BUCKET;

async function signedUrl(storedUrl) {
  const key = extractKeyFromUrl(storedUrl);
  if (!key) return storedUrl; // fallback: return URL as-is
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 },
  );
}

function fetchWithRedirect(url, maxRedirects = 5, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;

    const req = lib.get(url, (res) => {
      if (
        [301, 302, 307, 308].includes(res.statusCode) &&
        res.headers.location &&
        maxRedirects > 0
      ) {
        res.resume(); // drain before following redirect
        return fetchWithRedirect(res.headers.location, maxRedirects - 1, timeoutMs)
          .then(resolve)
          .catch(reject);
      }
      resolve(res);
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`PDF fetch timed out after ${timeoutMs}ms`));
    });
  });
}

/**
 * Stream a PDF from R2 (or any URL) to the Express response.
 */
async function proxyPdf(pdfUrl, res, disposition) {
  const fetchUrl = await signedUrl(pdfUrl);

  const upstream = await fetchWithRedirect(fetchUrl);

  if (upstream.statusCode !== 200) {
    upstream.resume(); // drain to free the socket
    if (!res.headersSent) {
      res.status(upstream.statusCode || 502).json({
        success: false,
        error: { message: `Could not fetch PDF (upstream status ${upstream.statusCode})` },
      });
    }
    return;
  }

  const filename = disposition === 'inline' ? 'preview.pdf' : 'document.pdf';
  const encodedName = encodeURIComponent(filename);

  res.setHeader('Content-Type', upstream.headers['content-type'] || 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"; filename*=UTF-8''${encodedName}`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (upstream.headers['content-length']) {
    res.setHeader('Content-Length', upstream.headers['content-length']);
  }

  // FIX: register listeners FIRST, then call pipe() — avoids the race condition
  // where the stream ends before Promise constructor sets up listeners.
  await new Promise((resolve, reject) => {
    upstream.on('error', (err) => {
      if (!res.headersSent) {
        reject(err);
      } else {
        upstream.destroy();
        res.destroy();
        resolve(); // client already received data, silently close
      }
    });
    res.on('error', (err) => {
      upstream.destroy();
      reject(err);
    });
    res.on('finish', resolve); // fires when all data is flushed to the client

    upstream.pipe(res); // start streaming — AFTER listeners are attached
  });
}


// Controller

class DownloadController {

  /**
   * GET /api/books/:id/cover
   * Public. Generates a presigned R2 URL for the cover image and redirects to it.
   * The browser <img> tag follows the 302 — no CORS issue because <img> is not a fetch().
   * For Next.js proxy routes, fetch() follows the redirect automatically.
   */
  static async getCover(req, res, next) {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false, isActive: true },
        attributes: ['id', 'coverUrl'],
      });

      if (!book || !book.coverUrl) {
        return res.status(404).json({ success: false, message: 'No cover available' });
      }

      const key = extractKeyFromUrl(book.coverUrl);
      if (!key) {
        // If it's already a public URL (e.g. Cloudinary), redirect directly
        return res.redirect(302, book.coverUrl);
      }

      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 3600 },
      );

      // Cache-friendly redirect — browser/CDN can cache cover for 1 hour
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      return res.redirect(302, url);
    } catch (err) { next(err); }
  }

  /**
   * GET /api/books/:id/pdf-url
   * Returns a short-lived presigned R2 URL.
   * Frontend can open it in a new tab, <iframe>, or PDF.js — no proxy overhead.
   */
  static async getPdfUrl(req, res, next) {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false, isActive: true },
        attributes: ['id', 'title', 'pdfUrl'],
      });

      if (!book) throw new NotFoundError('Book not found');
      if (!book.pdfUrl) return ResponseFormatter.error(res, 'No PDF available for this book', 404, 'NO_PDF');

      const key = extractKeyFromUrl(book.pdfUrl);
      if (!key) return ResponseFormatter.error(res, 'Invalid PDF URL stored', 500, 'INVALID_URL');

      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ResponseContentType: 'application/pdf',
          ResponseContentDisposition: 'inline',
        }),
        { expiresIn: 3600 },
      );

      return ResponseFormatter.success(res, { url, expiresIn: 3600 });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/books/:id/stream?token=<jwt>
   * Inline PDF preview. Token via ?token= OR Authorization header.
   * Does NOT create a Download record.
   */
  static async streamPdf(req, res, next) {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false, isActive: true },
        attributes: ['id', 'title', 'pdfUrl'],
      });

      if (!book) throw new NotFoundError('Book not found');
      if (!book.pdfUrl) return ResponseFormatter.error(res, 'No PDF available for this book', 404, 'NO_PDF');

      await proxyPdf(book.pdfUrl, res, 'inline');
    } catch (err) {
      if (res.headersSent) {
        res.destroy?.();
      } else {
        next(err);
      }
    }
  }

  /**
   * GET /api/books/:id/download?token=<jwt>
   * Records download, increments counter, streams PDF as attachment.
   */
  static async recordDownload(req, res, next) {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false, isActive: true },
        attributes: ['id', 'title', 'pdfUrl', 'downloads'],
      });

      if (!book) throw new NotFoundError('Book not found');
      if (!book.pdfUrl) return ResponseFormatter.error(res, 'No PDF available for this book', 404, 'NO_PDF');

      // FIX: Stream the PDF FIRST — DB operations must not block or break the download.
      // If Download.create() fails, the user still receives the file.
      await proxyPdf(book.pdfUrl, res, 'attachment');

      // Fire-and-forget: record the download after streaming succeeds
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      Download.create({ userId: req.user.id, bookId: book.id, ipAddress })
        .then(() => book.increment('downloads').catch(console.error))
        .catch((err) => console.error('Failed to record download:', err));

    } catch (err) {
      if (res.headersSent) {
        res.destroy?.();
      } else {
        next(err);
      }
    }
  }

  /**
   * GET /api/books/:id/video-url
   * Returns a short-lived presigned R2 URL for the book's video.
   * Requires authentication.
   */
  static async getVideoUrl(req, res, next) {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false, isActive: true },
        attributes: ['id', 'title', 'videoUrl'],
      });

      if (!book) throw new NotFoundError('Book not found');
      if (!book.videoUrl) return ResponseFormatter.error(res, 'No video available for this book', 404, 'NO_VIDEO');

      const key = extractKeyFromUrl(book.videoUrl);
      if (!key) {
        // Already a public URL — return as-is
        return ResponseFormatter.success(res, { url: book.videoUrl, expiresIn: 3600 });
      }

      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ResponseContentDisposition: 'inline',
        }),
        { expiresIn: 3600 },
      );

      return ResponseFormatter.success(res, { url, expiresIn: 3600 });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/books/:id/audio-url
   * Returns a short-lived presigned R2 URL for the book's audio.
   * Requires authentication.
   */
  static async getAudioUrl(req, res, next) {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id, isDeleted: false, isActive: true },
        attributes: ['id', 'title', 'audioUrl'],
      });

      if (!book) throw new NotFoundError('Book not found');
      if (!book.audioUrl) return ResponseFormatter.error(res, 'No audio available for this book', 404, 'NO_AUDIO');

      const key = extractKeyFromUrl(book.audioUrl);
      if (!key) {
        // Already a public URL — return as-is
        return ResponseFormatter.success(res, { url: book.audioUrl, expiresIn: 3600 });
      }

      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ResponseContentDisposition: 'inline',
        }),
        { expiresIn: 3600 },
      );

      return ResponseFormatter.success(res, { url, expiresIn: 3600 });
    } catch (err) { next(err); }
  }

  // GET /api/downloads — admin: all downloads
  static async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, userId, bookId, from, to } = req.query;
      const where = {};
      if (userId) where.userId = userId;
      if (bookId) where.bookId = bookId;
      if (from || to) {
        where.downloadedAt = {};
        if (from) where.downloadedAt[Op.gte] = new Date(from);
        if (to) where.downloadedAt[Op.lte] = new Date(to);
      }

      const offset = (Number(page) - 1) * Number(limit);
      const { count, rows } = await Download.findAndCountAll({
        where,
        include: [
          { model: User, as: 'User', attributes: ['id', 'username', 'email', 'studentId'] },
          { model: Book, as: 'Book', attributes: ['id', 'title', 'isbn', 'downloads'] },
        ],
        order: [['downloadedAt', 'DESC']],
        limit: Number(limit),
        offset,
      });

      return ResponseFormatter.success(res, {
        downloads: rows, total: count,
        page: Number(page), limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (err) { next(err); }
  }

  // GET /api/downloads/my — current user's history
  static async getMyDownloads(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Download.findAndCountAll({
        where: { userId: req.user.id },
        include: [{ model: Book, as: 'Book', attributes: ['id', 'title', 'isbn', 'coverUrl', 'downloads'] }],
        order: [['downloadedAt', 'DESC']],
        limit: Number(limit),
        offset,
      });

      return ResponseFormatter.success(res, {
        downloads: rows, total: count,
        page: Number(page), totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (err) { next(err); }
  }

  // GET /api/downloads/stats — top books + total
  static async getStats(req, res, next) {
    try {
      const { fn, col } = require('sequelize');
      const countExpr = fn('COUNT', col('Download.id'));

      const [topBooks, totalDownloads] = await Promise.all([
        Download.findAll({
          attributes: [
            [col('Download.book_id'), 'bookId'],
            [countExpr, 'downloadCount'],
          ],
          include: [{ model: Book, as: 'Book', attributes: ['id', 'title', 'coverUrl', 'downloads'] }],
          group: [col('Download.book_id'), col('Book.id')],
          order: [[countExpr, 'DESC']],
          limit: 10,
        }),
        Download.count(),
      ]);

      return ResponseFormatter.success(res, { totalDownloads, topBooks });
    } catch (err) { next(err); }
  }
}

module.exports = DownloadController;
