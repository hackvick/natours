const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');
const router = express.Router();
const viewsController = require('../controllers/viewsController');

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.protect,
  viewsController.getOverview
);

router.get('/tour/:slug', viewsController.getTour);

router.get('/login', viewsController.getLoginForm);

module.exports = router;
