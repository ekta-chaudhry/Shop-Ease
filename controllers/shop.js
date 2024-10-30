const fs = require('fs');
const path = require('path');

const Product = require('../models/product');
const Order = require('../models/order');

const pdfDocument = require('pdfkit');

const stripe = require('stripe')(process.env.STRIPE_KEY);
const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find().countDocuments()
    .then(numProducts => {
        totalItems = numProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
        res.render('shop/product-list', {
            prods: products, 
            pageTitle: 'All Products', 
            path: '/products', 
            currentPage: page, 
            hasNextPage: ITEMS_PER_PAGE * page < totalItems, 
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find().countDocuments()
    .then(numProducts => {
        totalItems = numProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
        res.render('shop/index', {
            prods: products, 
            pageTitle: 'My Shop', 
            path: '/', 
            currentPage: page, 
            hasNextPage: ITEMS_PER_PAGE * page < totalItems, 
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        res.render('shop/product-detail', {pageTitle: product.title, path: '/products', product: product});
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}


exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(user => {
        const products = user.cart.items;
        console.log(products);
        res.render('shop/cart', {path: '/cart', pageTitle: 'Your Cart', products: products});
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
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
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.deleteCartItem(prodId)
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(user => {
        const products = user.cart.items.map(i => {
            return {quantity: i.quantity, product: {...i.productId._doc}};
        });
        const order = new Order({
            user: {
                email: req.user.email,
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
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getOrders = (req, res, next) => {
    Order.find({"user.userId": req.user._id})
    .then(orders => {
        res.render('shop/orders', {path: '/orders', pageTitle: 'Your Orders', orders: orders});
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then(order => {
        if(!order) {
            return next(new Error('No order found!'));
        }

        if(order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('unauthorized'));
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        const pdfDoc = new pdfDocument();
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('INVOICE', {underline: true});
        pdfDoc.text('------------------------');
        let totalPrice = 0;
        let count = 0;
        order.products.forEach(prod => {
            count++;
            pdfDoc.fontSize(14).text(count + ':   ' + prod.product.title + '-    ' + prod.quantity + ' * $' + prod.product.price);
            totalPrice += prod.quantity * prod.product.price;
        });
        pdfDoc.fontSize(26).text('------------------------');
        pdfDoc.fontSize(20).text('Total: $' + totalPrice);

        pdfDoc.end();
        // fs.readFile(invoicePath, (err, data) => {
        //     if(err) {
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        //     res.send(data);
        // })
        
    })
    .catch(err => next(err));
}

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user.populate('cart.items.productId')
    .then(user => {
        products = user.cart.items;
        total = 0;
        products.forEach(p => {
            total += p.quantity * p.productId.price;
        });

        const lineItems = products.map((product) => ({
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.productId.title,
                description: product.productId.description,
              },
              unit_amount: product.productId.price * 100, // Price in cents
            },
            quantity: product.quantity,
          }));
        return stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
            cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
        });
    })
    .then(session => {
        res.render('shop/checkout', 
            {path: '/checkout', 
            pageTitle: 'Checkout', 
            products: products, 
            totalPrice: total,
            sessionId: session.id});
    })
    .catch(err => {
        const error = new Error(err);
        console.log(error);
        error.httpStatusCode = 500;
        return next(error);
    });
}