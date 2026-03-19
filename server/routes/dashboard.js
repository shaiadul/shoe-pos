const express = require('express');
const router = express.Router();
const { getDashboard, getSalesReport } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getDashboard);
router.get('/sales-report', getSalesReport);

module.exports = router;
