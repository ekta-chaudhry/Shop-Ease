const express = require('express');
const {check, body} = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');


const authController = require('../controllers/auth');
const User = require('../models/user');

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);

router.post('/login', [
    check('email')
    .isEmail()
    .withMessage('Please enter a Valid Email!')
    .trim()
    .custom((value, {req}) => {
        return User.findOne({email: value})
        .then(user => {
            if(!user) {
                return Promise.reject('Account with entered email does not exist');
            }
            return true;
        })
    }),

    check('password')
    .isLength({min: 6})
    .withMessage('Please enter a password having at least 6 characters!')
    .trim()
    .custom((value, {req}) => {
        return User.findOne({email: req.body.email})
        .then(user => {
            if(user) {
                return bcrypt.compare(value, user.password)
            }
            return true;
        })
        .then(doMatch => {
            if(!doMatch) {
                return Promise.reject('Password does not match!');
            }
            return true;
        })
    })
    
], 
    authController.postLogin);
router.post('/signup', [
    check('email')
    .isEmail()
    .withMessage('Please enter a Valid Email!')
    .trim()
    .custom((value, {req}) => {
        return User.findOne({email: value})
        .then(user => {
            if(user) {
                return Promise.reject('Account with entered email already exists!');
            }
        }) 
    }),

    body('password', 'Please enter a password having at least 6 characters!')
    .isLength({min: 6})
    .trim(),

    body('confirmPassword').trim().custom((value, {req}) => {
        if(value !== req.body.password) {
            throw new Error('Passwords do not match!');
        }
        return true;
    })
    ], 
    authController.postSignup);
router.post('/logout', authController.postLogout);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:resetToken', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);
module.exports = router;