const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock, getLowStockProducts, getCategories, getBrands } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/low-stock', getLowStockProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.put('/:id/stock', updateStock);

module.exports = router;
