const debug = require('debug')('cloudvdm:file/upload');
const fs = require('fs');
const path = require('path');
const UPLOAD_DIR = 'uploads';

// Check upload folder
try {
  const uploadDirPath = path.join(process.cwd(), UPLOAD_DIR);
  debug(`Checking uploads folder [${uploadDirPath}]...`);
  fs.mkdirSync(uploadDirPath);
  debug('Upload folder OK.');
} catch (error) {
  if (error.code !== 'EEXIST') {
    debug("Can't Create upload folder !", error);
    throw new Error('ERROR_UPLOAD_DIR');
  }
}

const multer = require('multer');

const upload = multer({
  dest: UPLOAD_DIR,
});

exports.upload = upload;
