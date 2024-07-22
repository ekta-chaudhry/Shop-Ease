const getDb = require('../util/database').getDb;
const mongodb = require('mongodb');

class Product {
    constructor(title, price, description, imageUrl, userId) {
        this.title = title;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.userId = userId;
    }

    save() {
        const db = getDb();
        return db.collection('products')
        .insertOne(this)
        .then(result => {
        })
        .catch(err => console.log(err));
    }

    static fetchAll() {
        const db = getDb();
        return db.collection('products')
        .find()
        .toArray()
        .then(products => {
            return products;
        })
        .catch(err => console.log(err));
    }

    static findById(prodId) {
        const db = getDb();
        return db.collection('products')
        .find({_id: new mongodb.ObjectId(prodId)})
        .next()
        .then(product => {
            return product;
        })
        .catch(err => console.log(err));
    }

    static updateProduct(prodId, newTitle, newImageUrl, newPrice, newDescription) {
        const db = getDb();
        return db.collection('products')
        .updateOne({ _id : new mongodb.ObjectId(prodId)},
            { $set: 
                {   title : newTitle, 
                    imageUrl: newImageUrl, 
                    price: newPrice, 
                    description: newDescription
                }
            })
        .then(result => {
            console.log('Updated Product with id: ', prodId);
        })
        .catch(err => console.log(err));
    }

    static deleteProduct(prodId) {
        const db = getDb();
        return db.collection('products')
        .deleteOne({ _id: new mongodb.ObjectId(prodId)})
        .then(result => {
            console.log('Deleted product with id: ', prodId);
        })
        .catch(err => console.log(err));
    }
}


module.exports = Product;