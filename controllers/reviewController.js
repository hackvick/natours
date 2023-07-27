const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');
const ApiFeatures = require('../utils/apiFeatures');
const handleFactory = require('./handlerFactory');



// for creating review
exports.setTourUserIds = (req,res,next)=>{
    // allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    
  next()  
}
// exports.createReview = catchAsync(async (req, res, next) => {
//     // allow nested routes
//     if (!req.body.tour) req.body.tour = req.params.tourId;
//     if (!req.body.user) req.body.user = req.user.id;
//   const newReview = await Review.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       newReview
//     }
//   });
// });
exports.getAllReview = handleFactory.getAll(Review)
exports.getReview = handleFactory.getOne(Review)
exports.createReview =handleFactory.createOne(Review)
exports.updateReview = handleFactory.updateOne(Review)
exports.deleteReview = handleFactory.deleteOne(Review)