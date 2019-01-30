const debug = require('debug')('cloudvdm:route:product.file');
const path = require('path');
const fs = require('fs');

module.exports = {

  storeImage(file) {
    if (file) {
      if (!file.mimetype.startsWith('image')) {
        debug(`Upload file type is invalid : ${file.mimetype}`);

        if (file.path) {
          // Delete it
          const unusedImgPath = path.join(process.cwd(), file.path);
          fs.unlink(unusedImgPath, (err) => {
            if (err) {
              debug(`Error deleting file ${unusedImgPath} :`, err);
            }
          });
        }

        throw 'invalid file';
      }

      return file.filename;
    }

    return void 0;
  }

};
