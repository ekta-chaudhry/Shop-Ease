const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');

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
                return transporter.sendMail({
                    to: email,
                    from: 'ekta0.0sea@gmail.com',
                    subject: 'Signup succeeded!',
                    html: '<h1>You successfully signed up!</h1>'
                });
            })
            .catch(err => console.log(err));
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
                .catch(err => console.log(err));

            })
            .catch(err => console.log(err));

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
    .catch(err => console.log(err));
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
    .catch(err => console.log(err));
}