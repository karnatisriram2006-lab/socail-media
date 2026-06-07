const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { parser } = require('../config/cloudinary');
const postController = require('../controllers/postController');

// Wrap multer so any errors (e.g. file too large) are returned as JSON.
const singleUpload = (req, res, next) => {
  parser.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File is too large. Max 100MB allowed for videos, 5MB for images.',
        });
      }
      // Cloudinary "Invalid image file" / "format not allowed" errors land here
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    next();
  });
};

// Feed, Explore, Saved, Trending (Static paths first to avoid ID conflict)
router.get('/feed', protect, postController.getHomeFeed);
router.get('/explore', protect, postController.getExploreFeed);
router.get('/saved', protect, postController.getSavedPosts);
router.get('/trending', protect, postController.getTrendingHashtags);
router.get('/user/:username', protect, postController.getUserPosts);

// Post creation & modification
router.post('/', protect, singleUpload, postController.createPost);
router.get('/:id', protect, postController.getPostById);
router.delete('/:id', protect, postController.deletePost);

// Interaction endpoints
router.post('/:id/like', protect, postController.likeUnlikePost);
router.post('/:id/comment', protect, postController.commentOnPost);
router.get('/:id/comments', protect, postController.getPostComments);
router.delete('/:id/comments/:commentId', protect, postController.deleteComment);
router.post('/:id/save', protect, postController.toggleSavePost);

module.exports = router;
