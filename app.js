const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth')
const errorController = require('./controllers/error');
const User = require('./models/user');

const PORT = process.env.PORT || 3000;

const app = express();
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
        const date = new Date();
        const dateString = date.toDateString();
        cb(null, dateString + '-' + file.originalname);
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
app.use(cookieParser);
app.use(session(
    {
        secret: process.env.SESSION_SECRET, 
        resave: false, 
        saveUninitialized: true,
        store: store,
        cookie: { secure: false }
    }));

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

const csrfProtection = csrf({ cookie: true});
app.use(csrfProtection);
app.use(flash());

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

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);


app.use((error, req, res, next) => {
    res.status(500).render('500', {isAuthenticated: req.session.isLoggedIn, pageTitle: 'Error!', path: '/500'});
});

mongoose.connect(process.env.DATABASE_URL)
.then(result => {
    console.log('Connected!');
    app.listen(PORT);
})
.catch(err => console.log(err));