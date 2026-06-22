// controllers/uploadController.js
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const r2 = require('../config/r2');
const ResponseFormatter = require('../utils/responseFormatter');
const Helpers = require('../utils/helpers');
const { uploadToR2, deleteFromR2, extractKeyFromUrl } = require('../utils/cloudR2Upload');
const { MAX_FILE_SIZES } = require('../config/constants');

const BUCKET = process.env.R2_BUCKET;

const URL_KEY_MAP = {
  cover: 'cover_url',
  pdf: 'pdf_url',
  avatar: 'avatar_url',
  video: 'video_url',
  audio: 'audio_url',
};

const FOLDER_MAP = {
  cover: 'books/covers',
  pdf: 'books/pdfs',
  avatar: 'users/avatars',
  video: 'media/videos',
  audio: 'media/audios',
};

function buildFileInfo(file, result) {
  return {
    key: result.public_id,   // R2 object key
    format: result.format,
    resource_type: result.resource_type,
    secure_url: result.secure_url,
    originalName: file.originalname,
    size: file.size,
    formattedSize: Helpers.formatFileSize(file.size),
  };
}

function validateSize(file, fieldName) {
  const { MAX_FILE_SIZES, FILE_TYPES } = require('../config/constants');

  let maxSize;
  if (file.mimetype === 'application/pdf') {
    maxSize = MAX_FILE_SIZES.PDF;
  } else if (FILE_TYPES.VIDEO.includes(file.mimetype)) {
    maxSize = MAX_FILE_SIZES.VIDEO;
  } else if (FILE_TYPES.AUDIO.includes(file.mimetype)) {
    maxSize = MAX_FILE_SIZES.AUDIO;
  } else {
    maxSize = MAX_FILE_SIZES.IMAGE;
  }

  if (file.size > maxSize) {
    return `${fieldName} too large. Max ${maxSize / (1024 * 1024)}MB`;
  }
  return null;
}

class UploadController {

  // POST /api/uploads/single   field: "cover" | "pdf" | "avatar" | "file" | "video" | "audio"
  static async uploadSingle(req, res, next) {
    try {
      const files = req.files || {};
      const fieldName = ['cover', 'pdf', 'avatar', 'file', 'video', 'audio'].find(f => files[f]?.[0]);
      const file = fieldName ? files[fieldName][0] : req.file;

      if (!file) return ResponseFormatter.error(res, 'No file uploaded', 400, 'FILE_REQUIRED');

      const sizeError = validateSize(file, fieldName || 'File');
      if (sizeError) return ResponseFormatter.error(res, sizeError, 400, 'FILE_TOO_LARGE');

      const folder = FOLDER_MAP[fieldName] || (file.mimetype === 'application/pdf' ? 'books/pdfs' : 'books/covers');
      const result = await uploadToR2(file, folder);

      const urlKey = URL_KEY_MAP[fieldName] || 'url';

      return ResponseFormatter.success(res, {
        [urlKey]: result.secure_url,
        ...buildFileInfo(file, result)
      }, 'File uploaded successfully', 201);
    } catch (err) { next(err); }
  }

  // POST /api/upload/multiple   fields: "cover" + "pdf"
  static async uploadMultiple(req, res, next) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return ResponseFormatter.error(res, 'No files uploaded', 400, 'FILES_REQUIRED');
      }

      const uploadedFiles = {};
      for (const field of Object.keys(req.files)) {
        const file = req.files[field][0];
        const sizeError = validateSize(file, field);
        if (sizeError) return ResponseFormatter.error(res, sizeError, 400, 'FILE_TOO_LARGE');

        const folder = FOLDER_MAP[field] || `uploads/${field}`;
        const result = await uploadToR2(file, folder);

        const urlKey = URL_KEY_MAP[field] || 'url';
        uploadedFiles[field] = {
          [urlKey]: result.secure_url,
          ...buildFileInfo(file, result)
        };
      }

      const topLevel = {};
      if (uploadedFiles.cover) topLevel.cover_url = uploadedFiles.cover.cover_url;
      if (uploadedFiles.pdf) topLevel.pdf_url = uploadedFiles.pdf.pdf_url;

      return ResponseFormatter.success(res, { ...topLevel, files: uploadedFiles }, 'Files uploaded successfully', 201);
    } catch (err) { next(err); }
  }

  // DELETE /api/upload/delete   body: { key, file_url }
  static async deleteFile(req, res, next) {
    try {
      const { key, public_id, file_url } = req.body;

      // Accept: key (R2 object key), legacy public_id (treated as key), or file_url
      const objectKey = key || public_id || extractKeyFromUrl(file_url);

      if (objectKey) {
        await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: objectKey }));
      } else if (file_url) {
        await deleteFromR2(file_url); // tries extractKeyFromUrl internally
      } else {
        return ResponseFormatter.error(res, 'key or file_url is required', 400, 'FILE_IDENTIFIER_REQUIRED');
      }

      return ResponseFormatter.noContent(res, null, 'File deleted successfully');
    } catch (err) { next(err); }
  }
}

module.exports = UploadController;
