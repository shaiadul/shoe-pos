const express = require('express');
const router = express.Router();
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, addPurchase } = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getSuppliers).post(authorize('admin'), createSupplier);
router.route('/:id').get(getSupplier).put(authorize('admin'), updateSupplier).delete(authorize('admin'), deleteSupplier);
router.post('/:id/purchase', authorize('admin'), addPurchase);

module.exports = router;
