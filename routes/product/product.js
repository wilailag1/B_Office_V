const debug = require('debug')('cloudvdm:route:product');
const express = require('express');
const router = express.Router({ mergeParams: true });
const fs = require('fs');
const path = require('path');
const generator = require('../../util/generator');
const {
  ProductRepository: productRepo,
  UserLogRepo,
} = require('../../repository');
const { upload } = require('../../file/upload');
const productFile = require('./product.file');
const networkUtil = require('../../util/network');
const deasync = require('deasync');
const findChannelSync = deasync(productRepo.findChannel);
const findChannelExceptProductIdSync = deasync(productRepo.findChannelExceptProductId);

/**
 * Upload with Multer
 *   https://scotch.io/tutorials/express-file-uploads-with-multer
 */

/**
 * File object example
 * 
file : { fieldname: 'image',
  originalname: '4.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'uploads',
  filename: '3e4e41633311028c2ba9313fa9fbfd73',
  path: 'uploads\\3e4e41633311028c2ba9313fa9fbfd73',
  size: 218025 
}
 */



router.get('/list', (req, res) => { /// /list/:machineId
  let productData = {};
  let lastError = void 0;

  productRepo.findAll((error, rows) => {//// edit finbymachineidid
    if (error) {
      res.locals.lastError = error;
    } else {
      productData.rows = rows;
    }

    res.render('app/product/productList', {
      productData,
      headTitle: 'List of Product',
    });
  });
});

// ////เก็ทโปรดักด้วยแมชชีนไอดี
// router.get('/list/:machineId', (req, res) => { /// /list/:machineId
//   const {machineId} = req.params;
//   let productData = {};
//   let lastError = void 0;

//   productRepo.findProductBymachineId(machineId,(error, rows) => {//// edit finbymachineidid
//     if (error) {
//       res.locals.lastError = error;
//     } else {
//       productData.rows = rows;
//     }

//     res.render('app/product/productList', {
//       productData,
//       headTitle: 'List of Product',
//     });
//   });
// });
////เก็ทโปรดักด้วยแมชชีนไอดี

router.get('/add', (req, res) => {
  res.locals.title = 'Add Product - Product Management';
  res.locals.headTitle = 'Add new Product';

  const [productData] = req.flash('product');
  // const [messagePopup] = req.flash('messagePopup');

  res.render('app/product/add', {
    isEdit: false,
    // messagePopup,
    productData: productData || {},
  });
});

router.post('/add', upload.single('image'), (req, res) => {

  const productId = generator.generateProductId();
  const { name, price, group, stock, chrow, chcolumn } = req.body;
  const channel = generator.generateChannel(chrow,chcolumn);
  const label = chrow+chcolumn;
  const productData = {
    productId, // PK
    name,
    price,
    group,
    stock,
    channel: channel || 0,
    label,
    chrow,
    chcolumn,
  };

  // Check channel first
  const channels = findChannelSync(channel);

  if (channels > 0) {
    // Channel existed
    delete productData.productId;
    req.flash('product', productData);
    req.flash('error', 'Channel used. Please select new channel');
    return res.redirect('back');
  }

  const file = req.file;
  try {
    const imageId = productFile.storeImage(file);
    if (imageId) {
      productData.image = imageId;
    }
  } catch (err) {
    req.flash('error', 'Invalid image file type!');
    req.flash('product', productData);
  }

  productRepo.insert(productData, (error, result) => {
    // debug('Insert result :', result);
    if (error) {
      debug('Error insert product :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('product', productData);
      return res.redirect(req.originalUrl);
    }

    req.flash('messagePopup', {
      title: 'Added new Product',
      message: 'success',
    });

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'ADD_PRODUCT',
      { productData }
    );

    res.redirect('./list');
  });
});

router.get('/edit/:productId', (req, res) => {
  const { productId } = req.params;

  productRepo.findById(productId, (error, result) => {

    if (error) {
      debug('Load Product error :', error);
    }

    const productData = result || {};
    // const [messagePopup] = req.flash('messagePopup');
    res.render('app/product/add', {
      headTitle: `EDIT Product ${productData.price}`,
      isEdit: true,
      // messagePopup,
      productData,
    });
  });
});

router.post('/edit/:productId', upload.single('image'), (req, res) => {

  const productId = req.params.productId;
  const { name, price, group, stock, chrow, chcolumn } = req.body;
  const channel = generator.generateChannel(chrow,chcolumn);
  const label = chrow+chcolumn;
  const productData = {
    productId, // PK
    name,
    price,
    group,
    stock,
    channel: channel || 0,
    label,
    chrow,
    chcolumn,
  };

  // Check channel
  const channels = findChannelExceptProductIdSync(channel, productId);

  if (channels > 0) {
    // Channel existed
    // req.flash('product', productData);
    req.flash('error', 'Channel used. Please select new channel');
    return res.redirect('back');
  }

  const file = req.file;
  try {
    const imageId = productFile.storeImage(file);
    if (imageId) {
      productData.image = imageId;
    }
  } catch (err) {
    req.flash('error', 'Invalid image file type!');
    req.flash('product', productData);
  }

  productRepo.update(productData, (error, result) => {
    // debug('Insert result :', result);
    if (error) {
      debug('Error update product :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('product', productData);
      return res.redirect(301, req.originalUrl);
    }

    req.flash('messagePopup', {
      title: 'Saved Product',
    });

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'EDIT_PRODUCT',
      { productData }
    );

    res.redirect('../list');
  });
});

router.all('/delete/:productId', (req, res) => {
  const productId = req.params.productId;

  productRepo.update({
    productId,
    isDeleted: true,
  }, (error, result) => {
    if (error) {
      debug('Error delete Product :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
    } else {
      req.flash('messagePopup', {
        title: 'Deleted Product',
      });
    }

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'DEL_PRODUCT',
      { productId }
    );

    return res.redirect('/app/product/list');
  });
});

router.get('/image/:fileId', (req, res) => {
  const { fileId } = req.params;
  res.sendFile(path.join(process.cwd(), 'uploads/', fileId));
});

module.exports = router;
