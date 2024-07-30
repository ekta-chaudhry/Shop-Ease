const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    }else {
        message = null;
    }
    res.render('auth/login', {pageTitle: 'Login', path: '/login', errorMessage: message});
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/signup', {pageTitle: 'Signup', path: '/signup', errorMessage: message});
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({email: email})
    .then(user => {
        if(user) {
            req.flash('error', 'Account with entered email already exists!');
            return res.redirect('/signup');
        }else{
            return bcrypt.hash(password, 12)
            .then(hashedPassword => {
                const newUser = new User({
                    email: email,
                    password: hashedPassword,
                    cart: {items: []}
                });
                return newUser.save();
            })
            .then(result => {
                res.redirect('/login');
            })
        }
    })
    .catch(err => console.log(err));
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
    .then(user => {
        if(!user) {
            req.flash('error', 'Invalid email or password!');
            return res.redirect('/login');
        }
        bcrypt.compare(password, user.password)
        .then(doMatch => {
            if(!doMatch) {
                req.flash('error', 'Invalid email or password!');
                return res.redirect('/login');
            }
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save(() => {
                res.redirect('/');
            });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/');
        });
    });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect('/');
    })
}