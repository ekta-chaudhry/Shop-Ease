exports.get404 = (req, res, next) => {
    res.status(404).render('404Error', {pageTitle: 'Page Not Found!', path: ''});
}