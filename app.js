const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth')

const errorController = require('./controllers/error');

const User = require('./models/user');

const mongoose = require('mongoose');
const app = express();
const MONGODB_URI = 'mongodb+srv://ekta00sea:Passworderror404@cluster0.7vsduk6.mongodb.net/shop?w=majority&appName=Cluster0';
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'

});

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(
{
    secret: 'My Secret', 
    resave: false, 
    saveUninitialized: false,
    store: store
}));

app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use((req, res, next) => {
    if(!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        if(!user) {
            return next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err));
    });
})

app.get('/favicon.ico', (req, res)=> res.sendStatus(204));
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', {isAuthenticated: req.session.isLoggedIn, pageTitle: 'Error!', path: ''});
});

mongoose.connect(MONGODB_URI)
.then(result => {
    console.log('Connected!');
        app.listen(3000);
})
.catch(err => console.log(err));