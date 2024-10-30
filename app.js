const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const { csrfSync } = require("csrf-sync");
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const multer = require('multer');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth')
const errorController = require('./controllers/error');
const User = require('./models/user');

const PORT = parseInt(process.env.PORT, 10) || 3000;

const app = express();
app.use(bodyParser.urlencoded({extended: false}));

app.get('/favicon.ico', (req, res)=> res.sendStatus(204));

const store = new MongoDBStore({
    uri: process.env.DATABASE_URL,
    collection: 'sessions'

});

app.set('view engine', 'ejs');
app.set('views', 'views');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        const date = Date.now();
        cb(null, date + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg') 
        {
        cb(null, true);
    }else{
        cb(null, false);
    }
}
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session(
    {
        secret: process.env.SESSION_SECRET, 
        resave: false, 
        saveUninitialized: true,
        store: store,
        cookie: { secure: process.env.NODE_ENV === 'production' }
}));

const { csrfSynchronisedProtection } = csrfSync({
    getTokenFromRequest: (req) => {
      if(req.is("multipart/form-data")) {
        return req.body["CSRFToken"]
      }
      if (req.is("application/x-www-form-urlencoded")) {
        return req.body["CSRFToken"];
      }
      return req.headers["x-csrf-token"];
    },
});
app.use(csrfSynchronisedProtection);

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    if(!req.session.csrfToken) {
        req.session.csrfToken = req.csrfToken();
    }
    res.locals.csrfToken = req.session.csrfToken; 
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

app.use(flash());

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);


app.use((error, req, res, next) => {
    console.log(error);
    res.status(500).render('500', {isAuthenticated: req.session.isLoggedIn, pageTitle: 'Error!', path: '/500'});
});

mongoose.connect(process.env.DATABASE_URL)
.then(result => {
    console.log('Connected!');
    app.listen(PORT);
})
.catch(err => console.log(err));