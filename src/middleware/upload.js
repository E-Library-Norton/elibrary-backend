const multer = require('multer');
const { MAX_FILE_SIZES, FILE_TYPES } = require('../config/constants');

const fileFilter = (_req, file, cb) => {
  const allowedTypes = {
    cover: FILE_TYPES.IMAGE,
    pdf: [FILE_TYPES.PDF],
    avatar: FILE_TYPES.IMAGE,
    file: [...FILE_TYPES.IMAGE, FILE_TYPES.PDF],
    image: FILE_TYPES.IMAGE,
    video: FILE_TYPES.VIDEO,
    audio: FILE_TYPES.AUDIO,
  };
  const allowed = allowedTypes[file.fieldname];
  if (allowed && (Array.isArray(allowed) ? allowed.includes(file.mimetype) : allowed === file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for field "${file.fieldname}"`), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZES.VIDEO }, // Use largest size to allow all types
});

module.exports = {
  uploadSingle: upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  uploadMulti: upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  uploadScan: upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 },]),
};