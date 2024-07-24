const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {isAuthenticated: req.session.isLoggedIn, pageTitle: 'Login', path: '/login'});
}

exports.postLogin = (req, res, next) => {
    User.findById('669fbacc8db3696a8f380137')
    .then(user => {
        req.session.isLoggedIn = true;
        req.session.user = user;
        req.session.save(() => {
            res.redirect('/');
        });
    });
}

exports.getLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect('/');
    })
}