const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);
router.get('/products', isAuth, adminController.getProducts);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post('/edit-product', adminController.postEditProduct);
router.post('/add-product', adminController.postAddProduct);
router.post('/delete-product', adminController.postDeleteProduct);

module.exports = router;
