const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: { type: Date, default: Date.now() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  console.log('hi');
  //   2 fields ko populate krna hota hai toh 2 baar likhte hai
  // agar  kisi ko unselect or kisi ko select krna hai toh pehle unselect krna phr select
  //   this.populate({ path: 'tour', select: '-guides -_id name' }).populate({
  this
    //   .populate({ path: 'tour', select: 'name' })
    .populate({
      path: 'user',
      select: 'name photo'
    });
  //   this.populate({ path: 'tour', select: '-guides' });
  next();
});
const Review = new mongoose.model('Review', reviewSchema);

module.exports = Review;
