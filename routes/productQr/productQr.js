const debug = require('debug')('cloudvdm:route:product');
const express = require('express');
const router = express.Router({ mergeParams: true });
const qrImage = require('qr-image');
const generator = require('../../util/generator');
const {
  ProductRepository: productRepo,
  ProductQrcodeRepository: qrCodeRepo,
  UserLogRepo,
} = require('../../repository');
const networkUtil = require('../../util/network');

router.get('/list', (req, res) => {
  let qrCodeData = {};
  let lastError = void 0;

  qrCodeRepo.findAll((error, rows) => {
    if (error) {
      res.locals.lastError = error;
    } else {
      qrCodeData.rows = rows;
    }

    res.render('app/productQr/qrcodeList', {
      qrCodeData,
      headTitle: 'List of QR Code',
    });
  });
});

router.get('/add', (req, res) => {
  res.locals.title = 'Add QR Code - Product Management';
  res.locals.headTitle = 'Add new QR Code';

  const [qrCodeData] = req.flash('qrcode');

  productRepo.findAll((err, products) => {
    const productOptions = products;

    res.render('app/productQr/add', {
      isEdit: false,
      // messagePopup,
      qrCodeData: qrCodeData || {},
      productOptions,
    });
  });
});

router.post('/add', (req, res) => {

  // const qrId = generator.generateId();
  const { productId, qrCode, status } = req.body;

  const qrCodeData = {
    // qrId, // PK
    productId,
    qrCode,
    status: status || 'ACTIVE',
  };

  qrCodeRepo.insert(qrCodeData, (error, result) => {
    // debug('Insert result :', result);
    if (error) {
      debug('Error insert product :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('qrcode', qrCodeData);
      return res.redirect(req.originalUrl);
    }

    req.flash('messagePopup', {
      title: 'Added new QR Code',
      message: 'success',
    });

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'ADD_QRCODE',
      { qrCodeData }
    );

    res.redirect('./list');
  });
});

router.get('/edit/:qrId', (req, res) => {
  const { qrId } = req.params;

  qrCodeRepo.findById(qrId, (error, result) => {

    if (error) {
      debug('Load QR Code error :', error);
    }

    const qrCodeData = result || {};

    productRepo.findAll((err, products) => {
      const productOptions = products;

      res.render('app/productQr/add', {
        headTitle: `Edit QR Code ${qrCodeData.qrId}`,
        isEdit: true,
        // messagePopup,
        qrCodeData,
        productOptions,
      });
    });
  });
});

router.post('/edit/:qrId', (req, res) => {

  const qrId = req.params.qrId;
  const { productId, qrCode, status } = req.body;

  const qrCodeData = {
    qrId, // PK
    productId,
    qrCode,
    status: status || 'ACTIVE',
  };

  qrCodeRepo.update(qrCodeData, (error, result) => {
    // debug('Insert result :', result);
    if (error) {
      debug('Error update QR Code :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
      req.flash('qrcode', qrCodeData);
      return res.redirect(req.originalUrl);
    }

    req.flash('messagePopup', {
      title: 'Saved QR Code',
    });

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'EDIT_QRCODE',
      { qrCodeData }
    );

    res.redirect('./list');
  });
});

router.all('/delete/:qrId', (req, res) => {
  const qrId = req.params.qrId;

  qrCodeRepo.delete(qrId, (error, result) => {
    if (error) {
      debug('Error delete QR Code :', error);
      req.flash('error', 'Something went wrong. Please try again or contact Adminstrator.');
    } else {
      req.flash('messagePopup', {
        title: 'Deleted QR Code',
      });
    }

    UserLogRepo.insertLog(
      req.user.userId,
      networkUtil.getClientRemote(req),
      'DEL_QRCODE',
      { qrId }
    );

    return res.redirect('/app/product-qr/list');
  });
});

router.get('/generate/:qrId', (req, res) => {
  const { qrId } = req.params;
  qrCodeRepo.findById(qrId, (err, result) => {
    if (!result) {
      return res.sendStatus(404);
    }
    const qrCode = qrImage.image(result.qrCode, { type: 'png' });
    res.setHeader('Content-type', 'image/png');  //sent qr image to client side
    qrCode.pipe(res);
  });
});

module.exports = router;
