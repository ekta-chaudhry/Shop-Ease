const Product = require('../models/product');
const deleteFile = require('../util/file');

const {check, validationResult} = require('express-validator');

exports.getAddProduct = (req, res, next) => {
    if(!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    res.render('admin/edit-product', 
        {pageTitle: 'Add Product', 
        path: '/admin/add-product',
        editing: false,
        hasErrors: false,
        errorMessage: null,
        validationErrors: []});
}

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
    .then(products=> {
        res.render('admin/products', {prods: products, pageTitle: 'Admin Products', path: '/admin/products'});
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if(!product) return res.redirect('/');

        res.render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path: '/admin/edit-product',
            editing: editMode,
            hasErrors: false,
            product: product,
            errorMessage: null,
            validationErrors: []
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const desc = req.body.description;
    const error = validationResult(req);

    if(!error.isEmpty()) {
        console.log(error.array());
        return res.status(422).render('admin/edit-product', 
            {pageTitle: 'Edit Product', 
            path: '/admin/edit-product',
            editing: true,
            hasErrors: true,
            product: {
                _id: prodId,
                title: title,
                price: price,
                description: desc
            },
            errorMessage: error.array()[0].msg,
            validationErrors: error.array()});
    }

    
    Product.findById(prodId)
    .then(product => {
        if(product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title = title;
        product.price = price;
        if(image) {
            deleteFile(product.imageUrl);
            product.imageUrl = image.path;
        }
        product.description = desc;
        return product.save()
        .then(result => {
            console.log('Updated product with id: ', prodId);
            res.redirect('/admin/products');
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if(!product) {
            return next(new Error('Product not found!'));
        }
        deleteFile(product.imageUrl);
        return Product.deleteOne({_id: prodId, userId: req.user._id})
        .then(result => {
            console.log('Deleted product with id: ', prodId);
            res.status(200).json({message: 'Success!'});
        })
        .catch(err => {
            res.status(500).json({message: 'Deleting product failed!'});
        });
    })
    .catch(err => {return next(err)});

}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const description = req.body.description;
    const price = req.body.price;

    if(!image) {
        return res.status(422).render('admin/edit-product', 
            {pageTitle: 'Add Product', 
            path: '/admin/add-product',
            editing: false,
            hasErrors: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'Attached file is not an image',
            validationErrors: []
        });
    }
    const error = validationResult(req);
    if(!error.isEmpty()) {
        console.log(error.array());
        return res.status(422).render('admin/edit-product', 
            {pageTitle: 'Add Product', 
            path: '/admin/add-product',
            editing: false,
            hasErrors: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: error.array()[0].msg,
            validationErrors: error.array()});
    }

    const imageUrl = image.path;
    const product = new Product({
        title: title, 
        price: price, 
        imageUrl: imageUrl,
        description: description, 
        userId: req.user._id
    });

    product.save()
    .then(result => {
        console.log('Created new product having id: ', result._id);
        res.redirect('/admin/products');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}
