const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock, getLowStockProducts, getCategories, getBrands, getProductByBarcode } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProductSchema, updateStockSchema } = require('../validations/productValidation');

router.use(protect);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/low-stock', getLowStockProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.route('/').get(getProducts).post(validate(createProductSchema), createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.put('/:id/stock', validate(updateStockSchema), updateStock);

module.exports = router;
