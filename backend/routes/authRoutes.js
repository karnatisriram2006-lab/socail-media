const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const { verifyFirebaseToken, protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post(
  '/register',
  verifyFirebaseToken,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_.]+$/)
      .withMessage('Username can only contain alphanumeric characters, underscores, and dots'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  authController.register
);

router.post('/login', verifyFirebaseToken, authController.login);
router.post('/google', verifyFirebaseToken, authController.googleLogin);
router.get('/me', protect, authController.getMe);

module.exports = router;
