const multer = require('multer');

// Held in memory, streamed straight to Cloudinary — nothing touches disk
// (important on Render's free tier, which has no persistent local storage anyway).
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WEBP or PDF files are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  // Kept modest deliberately — Cloudinary's free plan shares one credit pool
  // across storage and bandwidth, so smaller uploads stretch the free tier further.
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
