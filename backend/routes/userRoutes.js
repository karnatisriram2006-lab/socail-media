const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { parser } = require('../config/cloudinary');
const userController = require('../controllers/userController');

// IMPORTANT: static paths MUST come before `/:id` so they don't get
// swallowed by the dynamic route.

// Profile & follow lists (static prefixes first)
router.get('/profile/:username', protect, userController.getUserProfile);
router.get('/search', protect, userController.searchUsers);
router.get('/suggested', protect, userController.getSuggestedUsers);

// Paginated followers / following (must be before `/:id`)
router.get('/:id/followers', protect, userController.getFollowers);
router.get('/:id/following', protect, userController.getFollowing);

// Profile by id or username (catches everything else)
router.get('/:id', protect, userController.getUserById);

// Mutations
router.put('/profile', protect, parser.single('profileImage'), userController.updateUserProfile);
router.post('/follow/:id', protect, userController.followUnfollowUser);
router.post('/:id/follow', protect, userController.followUnfollowUser);

module.exports = router;
