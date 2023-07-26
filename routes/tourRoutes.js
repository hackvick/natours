const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('../controllers/reviewController')
const reviewRoutes = require('./reviewRoutes');
const router = express.Router();

// NESTED ROUTE & MERGING PARAMS ab review route me jaake vha express router me mergeParams =true likha hai jisse vo yha ki tour id vha get kar paayega
// router.use ka use kia hai
router.use('/:tourId/review', reviewRoutes);

// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
// .post(tourController.checkBody, tourController.createTour);

// router.route('/temp').get(tourController.getTempTour)
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
