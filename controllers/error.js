exports.get404 = (req, res, next) => {
    res.status(404).render('404Error', {isAuthenticated: req.session.isLoggedIn, pageTitle: 'Page Not Found!', path: ''});
}

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {isAuthenticated: req.session.isLoggedIn, pageTitle: 'Error!', path: ''});
}