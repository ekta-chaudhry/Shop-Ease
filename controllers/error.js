exports.get404 = (req, res, next) => {
    res.status(404).render('404Error', {pageTitle: 'Page Not Found!', path: ''});
}

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {pageTitle: 'Error!', path: ''});
}