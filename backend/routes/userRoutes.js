const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { parser } = require('../config/cloudinary');
const userController = require('../controllers/userController');

router.get('/profile/:username', protect, userController.getUserProfile);
router.get('/search', protect, userController.searchUsers);
router.get('/suggested', protect, userController.getSuggestedUsers);
router.get('/:id', protect, userController.getUserById);
router.put('/profile', protect, parser.single('profileImage'), userController.updateUserProfile);
router.post('/follow/:id', protect, userController.followUnfollowUser);
router.post('/:id/follow', protect, userController.followUnfollowUser);

module.exports = router;
