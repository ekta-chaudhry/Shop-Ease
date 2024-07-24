const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    Product.find()
    .then(products => {
        res.render('shop/product-list', {prods: products, pageTitle: 'ALL Products', path: '/products', isAuthenticated: req.session.isLoggedIn});
    })
    .catch(err => console.log(err));
}

exports.getIndex = (req, res, next) => {
    Product.find()
    .then(products => {
        res.render('shop/index', {isAuthenticated: req.session.isLoggedIn, prods: products, pageTitle: 'My Shop', path: '/'});
    })
    .catch(err => console.log(err));
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        res.render('shop/product-detail', {isAuthenticated: req.session.isLoggedIn, pageTitle: product.title, path: '/products', product: product});
    })
    .catch(err => console.log(err));
}


exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(user => {
        products = user.cart.items;
        res.render('shop/cart', {isAuthenticated: req.session.isLoggedIn, path: '/cart', pageTitle: 'Your Cart', products: products});
    })
    .catch(err => console.log(err));
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
        return req.user.addToCart(product);
    })
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => console.log(err));
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.deleteCartItem(prodId)
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => console.log(err));
}

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(user => {
        const products = user.cart.items.map(i => {
            return {quantity: i.quantity, product: {...i.productId._doc}};
        });
        const order = new Order({
            user: {
                name: req.user.name,
                userId: req.user._id
            },
            products: products
        });
        return order.save();
    })
    .then(result => {
        return req.user.clearCart();
    })
    .then(result => {
        res.redirect('/orders');
    })
    .catch(err => console.log(err));
}

exports.getOrders = (req, res, next) => {
    Order.find({"user.userId": req.user._id})
    .then(orders => {
        res.render('shop/orders', {isAuthenticated: req.session.isLoggedIn, path: '/orders', pageTitle: 'Your Orders', orders: orders});
    })
    .catch(err => console.log(err));
}

/*exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {path: '/checkout', pageTitle: 'Checkout'});
}*/