const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const { User } = require('./userModel');
const { promises } = require('nodemailer/lib/xoauth2');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true, //It will remove the whitespace from the begining and the end of the string
      maxlength: [
        40,
        'A tour name must have  less than or equal to 40 characters'
      ],
      minlength: [
        10,
        'A tour name must have  more than or equal to 10 characters'
      ]
      // validate:[validator.isAlpha,"Tour Name must only contains characters"]
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    slug: String,
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is ither easy,medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be less than 5.0'],
      set: val => val.toFixed(1)
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // Not work on update(this only refers to current doc on New document creation)
          return val < this.price;
        },

        message: 'Discount price ({VALUE}) should be lower than price'
      }
    },
    summary: {
      type: String,
      trim: true, //It will remove the whitespace from the begining and the end of the string
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String], //I am expecting  array of images
    createdAt: {
      type: Date,
      default: Date.now(),
      // select false karne se ye hide hojaayegi aur user ko pass ni hogi
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],

    // guides: Array   //for embedding

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// jo field jyada queried hoti hai uski indexing krdo
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  //virtual property jo yha pe calculate hogi jisko db me ni rkhte like jo easily pdi hui value se nikl jaaye(hamesha outpu me aayegi)
  return this.duration / 7;
});

// virtual populate (ab baat ye hai ke hume tour me reviews chaiye hum child ref. krke bhar skte hai lekin usse hmaara tours ke andr reviews ka array bharta jaayega to ye virtual populate use krenge)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // Review schema me field ka naam
  localField: '_id' // hmaare schema me uska naam
});

// Document Middleware: work for save and create

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embeding documents

// BAD PRACTICE (kuki agar user ne update kia apna role email viagra then yha pe toh vo poorane role viagra ke saath reh jaayega isliye sirf ref. store krvaate hai)
// tourSchema.pre('save', async function(next) {
//   const guidePromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// tourSchema.post("save", function (doc,next) {
//         console.log(doc);
//     next()
// })

// Query middleware
//  mtlb ki query level pe koi middleware add karna jaise ki yha secret toor bnaya aur usko exclude krdia ke secret tour true hai uske liye ni find hoga

tourSchema.pre(/^find/, function(next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

//   Aggregation Middleware

// baat ye hai ke isse hum aggregation se pehle use krte hai jaise humne ek secret tour bnaya hai vo aggregation me aara tha
// isliye humne use yha pe define krdia ke bhai beech me na aaio

// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   this.start = Date.now();
//   next();
// });

exports.Tour = mongoose.model('Tour', tourSchema);
