const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const r2 = require('../config/r2');
const path = require('path');

const BUCKET = process.env.R2_BUCKET;
// R2_PUBLIC_URL  = base URL for publicly accessible files, e.g. https://pub-xxx.r2.dev
// Leave empty to fall back to path-style endpoint URL.
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

// ─── MIME / folder / resource-type maps (unchanged) 
const MIME_TO_EXT = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/mpeg': '.mpeg',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/aac': '.aac',
  'audio/webm': '.webm',
};

const GENERIC = new Set(['file', 'pdf', 'cover', 'avatar', 'blob', 'upload', 'image', 'video', 'audio']);

const FOLDER = {
  cover: 'books/covers',
  pdf: 'books/pdfs',
  avatar: 'avatars',
  file: 'uploads',
  video: 'media/videos',
  audio: 'media/audios',
};

const RESOURCE_TYPE = {
  cover: 'image',
  pdf: 'raw',
  avatar: 'image',
  file: 'auto',
  video: 'video',
  audio: 'raw',
};

function getResourceType(mimetype = '', fieldName = '') {
  if (RESOURCE_TYPE[fieldName]) return RESOURCE_TYPE[fieldName];
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'raw';
  return 'raw';
}

// ─── Key / URL helpers ─────

/**
 * Build a clean R2 object key (replaces buildPublicId).
 * Always includes the file extension (R2 serves files as-is, no auto-format).
 */
function buildKey(originalName, mimetype, folder) {
  const detectedExt = path.extname(originalName).toLowerCase(); // ".pdf" | ".jpg" | ""
  const ext = detectedExt || MIME_TO_EXT[mimetype];
  const nameNoExt = path.basename(originalName, detectedExt);

  const base = GENERIC.has(nameNoExt.toLowerCase())
    ? `upload_${Date.now().toString(36)}`
    : nameNoExt;

  const sanitized = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
    .substring(0, 80) || 'upload';

  return folder ? `${folder}/${sanitized}${ext}` : `${sanitized}${ext}`;
}

// Backward-compat alias used by some callers (buildPublicId → buildKey)
function buildPublicId(originalName, mimetype, resourceType, folder) {
  return buildKey(originalName, mimetype, folder);
}

/** Return the public-facing URL for an R2 object key. */
function getPublicUrl(key) {
  if (PUBLIC_URL) return `${PUBLIC_URL}/${key}`;
  // Fallback: path-style R2 URL
  const endpoint = (process.env.R2_ENDPOINT || '').replace(/\/$/, '');
  return `${endpoint}/${BUCKET}/${key}`;
}

/**
 * Extract the R2 object key from a stored URL.
 * Handles both PUBLIC_URL-based and path-style R2 endpoint URLs.
 */
function extractKeyFromUrl(url) {
  if (!url) return null;
  // Match against R2_PUBLIC_URL base
  if (PUBLIC_URL && url.startsWith(PUBLIC_URL + '/')) {
    return url.slice(PUBLIC_URL.length + 1);
  }
  // Match against path-style endpoint: https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
  const endpoint = (process.env.R2_ENDPOINT || '').replace(/\/$/, '');
  const prefix = `${endpoint}/${BUCKET}/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return null;
}

// ─── Core upload / delete / presign 

/**
 * Upload a file buffer to R2.
 * Returns a Cloudinary-compatible result object:
 *   { secure_url, public_id, format, resource_type }
 */
async function uploadToR2(file, fieldNameOrFolder, resourceTypeOverride) {
  const folder = FOLDER[fieldNameOrFolder] || fieldNameOrFolder || 'uploads';
  const resourceType = resourceTypeOverride || getResourceType(file.mimetype, fieldNameOrFolder);
  const key = buildKey(file.originalname, file.mimetype, folder);

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return {
    secure_url: getPublicUrl(key),
    public_id: key,                                          // R2 key ≈ Cloudinary public_id
    format: path.extname(key).replace('.', '').toLowerCase(),
    resource_type: resourceType,
  };
}

/**
 * Delete a file from R2 by its stored URL.
 */
async function deleteFromR2(storedUrl) {
  if (!storedUrl) return;
  try {
    const key = extractKeyFromUrl(storedUrl);
    if (!key) return;
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // ignore — old/invalid URL
  }
}

/**
 * Generate a presigned R2 URL that triggers a browser "Save As" download.
 */
async function buildDownloadUrl(storedUrl, filename) {
  if (!storedUrl) return storedUrl;
  const key = extractKeyFromUrl(storedUrl);
  if (!key) return storedUrl;

  const safeName = (filename || 'file')
    .replace(/\.pdf$/i, '')
    .replace(/[^\w-]/g, '_')
    .replace(/_+/g, '_');

  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safeName}.pdf"`,
    }),
    { expiresIn: 3600 },
  );
}

module.exports = {
  uploadToR2,
  deleteFromR2,
  buildDownloadUrl,
  buildPublicId,      // backward-compat alias → buildKey
  buildKey,
  getResourceType,
  getPublicUrl,
  extractKeyFromUrl,
  MIME_TO_EXT,
};
