const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// User routes
router.post('/', protect, reportController.createReport);

// Admin routes (protected by middleware in controller)
router.get('/', protect, reportController.getReports);
router.get('/stats', protect, reportController.getReportStats);
router.patch('/:id', protect, reportController.reviewReport);

module.exports = router;