const User = require('../models/user');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const {query, validationResult} = require('express-validator');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    }else {
        message = null;
    }
    res.render('auth/login', {pageTitle: 'Login', path: '/login', errorMessage: message, oldInput: {email: "", password: ""}, validationErrors: []});
}

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', 
        {pageTitle: 'Signup', 
        path: '/signup', 
        errorMessage: null,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    });
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const error = validationResult(req);
    if(!error.isEmpty()) {
        console.log(error.array());
        return res.status(422).render('auth/signup', 
            {pageTitle: 'Signup', 
            path: '/signup', 
            errorMessage: error.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: error.array()
        });
    }
    bcrypt.hash(password, 12)
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
        return transporter.sendMail({
            to: email,
            from: 'ekta0.0sea@gmail.com',
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed up!</h1>'
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postLogin = (req, res, next) => {
    const error = validationResult(req);
    if(!error.isEmpty()) {
        console.log(error.array());
        return res.status(422).render('auth/login', 
            {pageTitle: 'Login', 
            path: '/login', 
            errorMessage: error.array()[0].msg,
            oldInput: {
                email: req.body.email,
                password: req.body.password
            },
            validationErrors: error.array()
        })
    }

    User.findOne({email: req.body.email})
    .then(user => {
        req.session.isLoggedIn = true;
        req.session.user = user;
        req.session.save(() => {
            res.redirect('/');
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect('/');
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/reset', {pageTitle: 'Reset Password', path: '/signup', errorMessage: message});
}

exports.postReset = (req, res, next) => {
    const email = req.body.email;
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/reset');
        }else{
            const token = buffer.toString('hex');
            User.findOne({email: email})
            .then(user => {
                if(!user) {
                    req.flash('error', 'No account with entered email found!');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save()
                .then(() => {
                    res.redirect('/');
                    return transporter.sendMail({
                        to: email,
                        from: 'ekta0.0sea@gmail.com',
                        subject: 'Password reset!',
                        html: `
                        <p>You requested a password reset</P>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                        `
                    });
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });

            })
            .catch(err => {
                const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
            });

        }
    })
}

exports.getNewPassword = (req, res, next )=> {
    const token = req.params.resetToken;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        let message = req.flash('error');
        if(message.length > 0) {
            message = message[0];
        }else{
            message = null;
        }
        res.render('auth/new-password', {passwordToken: token, userId: user._id.toString(), pageTitle: 'New Password', path: '/new-password', errorMessage: message});
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const password = req.body.password;
    const token = req.body.passwordToken;
    User.findOne({_id: userId, resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        return bcrypt.hash(password, 12)
        .then(hashedPassword => {
            user.password = hashedPassword;
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            return user.save()
        })
        .then(result => {
            res.redirect('/login');
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}