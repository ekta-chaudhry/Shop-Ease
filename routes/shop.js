const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);
router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
router.get('/cart', isAuth, shopController.getCart);
router.post('/cart', shopController.postCart);
router.post('/delete-cart-item', shopController.postDeleteProduct);
router.post('/create-order', shopController.postOrder);
router.get('/orders', isAuth, shopController.getOrders);

module.exports = router;