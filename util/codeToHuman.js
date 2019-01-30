// ภาษาคนง่ะ บึ๋ย !
exports.humanLanguage = (raw) => {

  const { machineId, name, event, dataJson } = raw;
  let data;
  try {
    data = JSON.parse(dataJson)
  } catch (error) {
    data = dataJson;
  }
  let humanEvent = event;
  let humanInfo = dataJson;

  switch (event) {

    // MACHINE
    case 'SETUP_NEW':
      humanEvent = 'Setup new Machine';
      break;

    case 'CONNECT':
      humanEvent = 'Connect';
      humanInfo = `Use Token ${data.token}`;
      break;

    case 'DISCONNECT':
      humanEvent = 'Disconnect';

      break;

    case 'INIT':
      humanEvent = 'Initialize';

      break;

    case 'E_INIT':
      humanEvent = 'Initialize error';

      break;

    case 'INIT_OK':
      humanEvent = 'Initialized';

      break;

    case 'REQ_PRODUCTS':
      humanEvent = 'VM: Request product';

      break;

    case 'QRCODE_CHECK':
      humanEvent = 'QR Code check';
      humanInfo = `Check with code : ${data}`;
      break;

    case 'E_QRCODE':
      humanEvent = 'Error QR Code';
      humanInfo = `Error with data : ${dataJson}`;
      break;

    case 'QRCODE_USE':
      humanEvent = 'QR Code used';
      humanInfo = `QR Code : ${data.qrCode} for ${data.product.name}`;
      break;

    case 'INIT_RESET': // Unused
    case 'E_INIT_RESET':
    case 'INIT_RESET_OK':
      break;

    case 'ORDER_TRX':
      if (data.status.toLowerCase() == 'cancel') {
        humanEvent = 'Cancel Order transaction';
        humanInfo = `Cancel product ${data.productName}`;
      } else {
        humanEvent = 'Start Order transaction';
        humanInfo = `Customer pay ${data.productName} for ${data.totalPrice} Baht.`;

        const { coinTypeRefund } = data;
        if (coinTypeRefund && Object.keys(coinTypeRefund).length > 0) {
          humanInfo += '\nRefund :';
          for (const coinType in coinTypeRefund) {
            humanInfo += `\n Coin ${coinType} for ${coinTypeRefund[coinType]} Baht`;
          }
        }
      }
      break;

    case 'E_ORDER_TRX_DATA':
      humanEvent = 'Order transaction error';
      humanInfo = `Error with data : ${dataJson}`;
      break;

    case 'E_ORDER_TRX_SN':
      humanEvent = 'Error Order with Invalid S/N';
      humanInfo = `Error with data : ${dataJson}`;
      break;

    case 'ORDER_TRX_OK':
      humanEvent = 'Order transaction successful';
      break;

    case 'E_ORDER_TRX':
      humanEvent = 'Error Order transaction';
      humanInfo = `Error with data : ${dataJson}`;
      break;

    case 'SW_FINISH_CLICK':
      humanEvent = 'VM Restock button';
      break;

    case 'JOB_FINISH':
    case 'JOB_FINISH_HW':
      humanEvent = 'Restock job completed';
      humanInfo = `Job ID : ${data.jobId}\n Restork :`;

      if (data.productRestock) {
        for (const productId in data.productRestock) {
          const product = data.productRestock[productId];
          humanInfo += `\n - ${product.productName} for ${product.restockQty}`;
        }
      }
      break;

    case 'E_JOB_FINISH_HW':
      humanEvent = 'Error Restock job';
      humanInfo = `Error with data : ${dataJson}`;
      break;

    case 'E_VM_ERR_MSG':
      humanEvent = 'VM Error Message';
      break;

    // USER
    case 'NAVIGATE':
      humanEvent = 'Navigate';
      humanInfo = `Page URL : ${data.url}`;
      break;

    case 'ADD_ROLE':
      humanEvent = 'Add new role';
      humanInfo = `${data.roleName} as new role`;
      break;

    case 'EDIT_ROLE':
      humanEvent = 'Edit role';
      humanInfo = `Edited ${data.roleName}`;
      break;

    case 'ADD_USER':
      humanEvent = 'Add new user';
      humanInfo = `Add new user : ${data.userId}`;
      break;

    case 'EDIT_USER':
      humanEvent = 'Edit user';
      humanInfo = `Edit ${data.userId}`;
      break;

    case 'DEL_USER':
      humanEvent = 'Delete user';
      humanInfo = `Delete ${data.userId}`;
      break;

    case 'LOGGED_IN':
      humanEvent = 'Logged In';

      break;

    case 'LOGGED_OUT':
      humanEvent = 'Logged Out';

      break;

    case 'ADD_PRODUCT':
      humanEvent = 'Add new product';
      humanInfo = `New product : ${data.productData.name} / ${data.productData.price} ฿`;
      break;

    case 'EDIT_PRODUCT':
      humanEvent = 'Edit product';
      humanInfo = `Edit product : ${data.productData.name} / ${data.productData.price} ฿`;
      break;

    case 'DEL_PRODUCT':
      humanEvent = 'Delete product';
      humanInfo = `Delete product by ID ${data.productId}`;
      break;

    case 'ADD_QRCODE':
      humanEvent = 'Add new QR Code';
      humanInfo = `Add QR code '${data.qrCodeData.qrCode}' for product ${data.qrCodeData.productId}`;
      break;

    case 'EDIT_QRCODE':
      humanEvent = 'Edit QR Code';
      humanInfo = `Edit QR code '${data.qrCodeData.qrCode}' for product ${data.qrCodeData.productId}`;
      break;

    case 'DEL_QRCODE':
      humanEvent = 'Delete QR Code';
      humanInfo = `Delete QR Code ID : ${data.qrId}`;
      break;

    case 'JOB_CREATE':
      humanEvent = 'Create new job';

      break;

    case 'E_JOB_CREATE_FAIL':
      humanEvent = 'Create job failed';

      break;

    // Moved to HW (Use same info)
    /* case 'JOB_FINISH':
      humanEvent = 'Finish job';

      break; */

    case 'E_JOB_FINISH':
      humanEvent = 'Error finish job';

      break;

    case 'JOB_CANCEL':
      humanEvent = 'Job cancelled';

      break;

    case 'E_JOB_CANCEL':
      humanEvent = 'Error cancel job';

      break;

    case 'ADD_MACHINE':
      humanEvent = 'Add new Machine';

      break;

    case 'EDIT_MACHINE':
      humanEvent = 'Edit Machine';

      break;

    case 'DEL_MACHINE':
      humanEvent = 'Delete Machine';

      break;
  }

  return {
    raw,
    event: humanEvent,
    moreInfo: humanInfo,
  };
};
