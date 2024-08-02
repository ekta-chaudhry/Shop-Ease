const express = require('express');
const {body} = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);
router.get('/products', isAuth, adminController.getProducts);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', 
    [
        body('title').isLength({min: 3}).withMessage('Title should have at least 3 characters!').trim(),
        body('price').isFloat().withMessage('Invalid price entered!'),
        body('description').isLength({min: 5}).withMessage('Description should have at least 5 characters!').trim()
    ],
    isAuth, adminController.postEditProduct);
router.post('/add-product', 
    [
        body('title').isLength({min: 3}).withMessage('Title should have at least 3 characters!').trim(),
        body('price').isFloat().withMessage('Invalid price entered!'),
        body('description').isLength({min: 5}).withMessage('Description should have at least 5 characters!').trim()
    ],
    isAuth, adminController.postAddProduct);
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
