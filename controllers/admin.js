const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', 
        {pageTitle: 'Add Product', 
        path: '/admin/add-product',
        editing: false});
}

exports.getProducts = (req, res, next) => {
    //Product.findAll()
    req.user.getProducts()
    .then(products=> {
        res.render('admin/products', {prods: products, pageTitle: 'Admin Products', path: '/admin/products'});
    })
    .catch(err => console.log(err));
}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    req.user.getProducts({where: {id: prodId}})
    .then(products => {
        if(!products) return res.redirect('/');

        res.render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path: '/admin/edit-product',
            editing: editMode,
            product: products[0]
        });
    })
    .catch(err => console.log(err));
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const desc = req.body.description;
    
    Product.findByPk(prodId)
    .then(product => {
        product.title = title;
        product.imageUrl = imageUrl;
        product.price = price;
        product.description = desc;
        return product.save();
    })
    .then(result => {
        console.log('Updated product!');
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
}
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const description = req.body.description;
    const price = req.body.price;
    req.user.createProduct({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
    })
    .then(result => {
        //console.log(result);
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findByPk(prodId)
    .then(product => {
        return product.destroy();
    })
    .then(result => {
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
}