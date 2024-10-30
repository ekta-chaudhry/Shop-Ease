const fs = require('fs');

const deleteFile = (filePath) => {
    fs.unlinkSync(filePath, (err) => {
        if(err) {
            throw (err);
        }
    })
}

module.exports = deleteFile;