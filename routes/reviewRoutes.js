const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authController.protect, reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router.route('/:id').delete(
  authController.protect,
  // authController.restrictTo('user'),
  reviewController.deleteReview
).patch(authController.protect,reviewController.updateReview).get(authController.protect,reviewController.getReview)

module.exports = router;
