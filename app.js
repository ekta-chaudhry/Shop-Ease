const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const errorController = require('./controllers/error');

const User = require('./models/user');

const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('669fbacc8db3696a8f380137')
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => console.log(err));
});

app.get('/favicon.ico', (req, res)=> res.sendStatus(204));
app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose.connect('mongodb+srv://ekta00sea:Passworderror404@cluster0.7vsduk6.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0')
.then(result => {
    console.log('Connected!');
    User.findOne()
    .then(user => {
        if(!user) {
            const user = new user({name: "Ekta", email: "dummy@gmail.com", cart: {items: []}});
            return user.save();
        }
        return;
    })
    .then(result => {
        app.listen(3000);
    });
})
.catch(err => console.log(err));