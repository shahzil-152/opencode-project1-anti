const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/apiError');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');

// Make sure the storage directory exists before multer writes to it.
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, _file, cb) => {
    // Unique, guess-proof file name tied to the user + timestamp.
    const ext = path.extname(_file.originalname).toLowerCase() || '.jpg';
    cb(null, `user-${req.user._id}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    if (!ok) return cb(ApiError.badRequest('Avatar must be a JPEG, PNG, WebP or GIF image'));
    cb(null, true);
  },
});

/** Remove a stored avatar file (silently ignores missing files). */
function removeAvatarFile(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/avatars/')) return;
  const fileName = path.basename(urlPath);
  const filePath = path.join(AVATAR_DIR, fileName);
  fs.promises.unlink(filePath).catch(() => {});
}

module.exports = { avatarUpload, removeAvatarFile, AVATAR_DIR };
