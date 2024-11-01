const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name= productId]').value;
    const csrfToken = btn.parentNode.querySelector('[name= CSRFToken]').value;
    const productElement = btn.closest('article');

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'x-csrf-token': csrfToken
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        productElement.remove();
    })
    .catch(err => console.log(err));
}