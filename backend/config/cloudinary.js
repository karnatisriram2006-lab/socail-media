const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------- Image storage (existing) ----------------
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_media_platform',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1080, height: 1080, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  },
});

// ---------------- Video storage (new) ----------------
// Cloudinary requires resource_type: 'video' for video uploads.
// We also pre-generate a 720x720 JPG thumbnail via eager transformation so
// we can use it as a poster frame for the <video> element on the frontend.
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_media_videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'quicktime'],
    // Generate a thumbnail when the video is uploaded.
    // Cloudinary returns the eager-generated asset in the response under `eager`.
    eager_async: false,
    eager: [
      {
        format: 'jpg',
        transformation: [
          { width: 720, height: 720, crop: 'fill', gravity: 'auto' },
        ],
      },
    ],
    // Default delivery transformation: limit width & auto-quality
    transformation: [{ width: 1080, crop: 'limit', quality: 'auto' }],
  },
});

// ---------------- Smart storage ----------------
// A custom multer StorageEngine that inspects the file's MIME type and
// delegates to either the image or video CloudinaryStorage. This lets us
// have a single multer middleware on the route that accepts BOTH images
// and videos.
class SmartMediaStorage {
  constructor(opts) {
    this.imageStorage = opts.imageStorage;
    this.videoStorage = opts.videoStorage;
  }

  _pickStorage(file) {
    if (file && file.mimetype && file.mimetype.startsWith('video/')) {
      return this.videoStorage;
    }
    return this.imageStorage;
  }

  _handleFile(req, file, cb) {
    try {
      const storage = this._pickStorage(file);
      // Pass-through to the chosen storage. The `cb` signature is the
      // multer one: (err, info) where info contains `path`, `filename`,
      // `size`, `mimetype`, etc. that multer will place on `req.file`.
      storage._handleFile(req, file, cb);
    } catch (err) {
      cb(err);
    }
  }

  _removeFile(req, file, cb) {
    try {
      const storage = this._pickStorage(file);
      if (typeof storage._removeFile === 'function') {
        storage._removeFile(req, file, cb);
      } else {
        cb(null);
      }
    } catch (err) {
      cb(err);
    }
  }
}

const smartStorage = new SmartMediaStorage({ imageStorage, videoStorage });

// Multer parsers
const parser = multer({
  storage: smartStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max (covers both)
});

// Legacy: keep `videoParser` exported in case other code references it.
const videoParser = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = {
  cloudinary,
  parser,
  videoParser,
  imageStorage,
  videoStorage,
  smartStorage,
};
