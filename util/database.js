const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

exports.mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://ekta00sea:Passworderror404@cluster0.7vsduk6.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0')
    .then(client => {
        console.log('Connected!');
        _db = client.db();
        callback();
    })
    .catch(err => {
        console.log(err);
        throw err;
    });
}

exports.getDb = () => {
    if(_db) {
        return _db;
    }
    throw 'No Database Found!';
}
