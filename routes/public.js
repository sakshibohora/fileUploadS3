import express from 'express';
import validate from 'express-validation';
import { requiresAuth } from 'express-openid-connect';

import * as commonController from '../controllers/common/commonController';
import * as userController from '../controllers/user/userController';
import * as userValidater from '../controllers/user/userValidator';

const router = express.Router();

//= ===============================
// Public routes
//= ===============================

router.get(
  '/get/roles',
 // requiresAuth(),
  commonController.getUserRoles,
);
router.get(
  '/get/customerTypes',
  commonController.getCustomerTypes,
);
router.get(
  '/get/customerStatus',
  commonController.getCustomerStatus,
);
router.get(
  '/get/workspacepermission',
  commonController.getWorkspacePermission,
);
router.get(
  '/get/workspacepermissiontype',
  commonController.getworkspacepermissiontype,
);
router.get(
  '/get/contractTermTypes',
  commonController.getcontractTermTypes,
);
router.get(
  '/get/renewalNotice',
  commonController.getrenewalNotice,
);
router.get(
  '/get/contractMethod',
  commonController.getcontractMethod,
);
router.get(
  '/get/productItems',
  commonController.getproductItems,
);
router.get(
  '/get/unitofMeasures',
  commonController.getUnitOfMeasure,
);
router.get(
  '/get/priceTerms',
  commonController.getpriceTerms,
);
router.get(
  '/get/billingIntervals',
  commonController.getBillingIntervals,
);
router.get(
  '/get/paymentMethods',
  commonController.getPaymentMethods,
);
router.get(
  '/get/accountTerms',
  commonController.getaccountTerms,
);
router.post(
  '/register',
  validate(userValidater.registerValidate),
  userController.register,
);
router.post(
  '/login',
  validate(userValidater.loginValidate),
  userController.login,
);

router.get(
  '/country',
  commonController.getCountry,
);

router.post(
  '/state',
  commonController.getStateByCountry,
);

router.post(
  '/city',
  commonController.getCity,
);

router.get(
  '/getPostalCode',
  commonController.getPostalCode,
);

router.get(
  '/get/userStatus',
  commonController.getUserStatus,
);
module.exports = router;
