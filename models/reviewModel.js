const mongoose = require('mongoose');
const { Tour } = require('../models/tourModel');
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


// isse ek user multiple review ni de paayega
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  console.log('hi');
  //   2 fields ko populate krna hota hai toh 2 baar likhte hai
  // agar  kisi ko unselect or kisi ko select krna hai toh pehle unselect krna phr select
  //   this.populate({ path: 'tour', select: '-guides -_id name' }).populate({

  //   .populate({ path: 'tour', select: 'name' })
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  //   this.populate({ path: 'tour', select: '-guides' });
  next();
});
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  console.log(tourId);

  // Ye static function bnaya hai. method isliye ni bnaya kuki humne controller me call thodi krna hai yhi bna ke yhi call krna hai
  // aur static method me this model ko point krta h jisse hum uspe aggregation lga ske
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // constructor matlb model agar simple this use krte toh current doc jo bnne jaa rha hai usko point krta
  this.constructor.calcAverageRatings(this.tour);
  // post middleware next ko access ni kr skta
  //   next();
});

// findByIDAndUpdate and findByIdAndDelete backend pe findOneandUpdate and findOneAndDelete use krte hai
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // ye trick hai isse pre middleware se post middleware me data jata hai
  this.r = await this.findOne(); //yha pe this current query ko refer krta hai toh ye  findOne lga ke document ko mngva rhe hai
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // this.r = await this.findOne()  //DOES NOT POSSIBLE KUKI YE POST HAI aur query chal chuki hai
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = new mongoose.model('Review', reviewSchema);

module.exports = Review;
