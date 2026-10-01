const express = require('express');
const router = express.Router();
const { getActivityLogs, getActivityStats } = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('admin'), getActivityLogs);
router.get('/stats', authorize('admin'), getActivityStats);

module.exports = router;
