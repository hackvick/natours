const { Tour } = require('../models/tourModel');
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const handleFactory = require('./handlerFactory');
// =============================
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );
// console.log(tours);

// middleware for checking id
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };

// =======================================

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
// BUILD QUERY

// // 1A) Filtering
// const queryObj = { ...req.query };
// const excludedFields = ['page', 'sort', 'limit', 'fields'];

// excludedFields.forEach(el => delete queryObj[el]);

// // 2A) Advanced Filtering
// let queryStr = JSON.stringify(queryObj);

// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
// console.log(JSON.parse(queryStr));

// let query = Tour.find(JSON.parse(queryStr));

// //2) SORT
// // aise simply assending me sort karega if descending me karvana hai toh - lga do
// if (req.query.sort) {
//   // agr hum ek field se sort karne lge aur vo do baar ho toh ye dusri field se sort krdega unme se
//  const sortBy = req.query.sort.split(",").join(" ")
//  query = query.sort(sortBy);
// }else{
//   // Default Sort
//   query = query.sort('-createdAt');

// }
// //3) Field Limiting

// if(req.query.fields){
//   const fields = req.query.fields.split(",").join(" ")
//   query = query.select(fields)
// }else{
//   // default  limiting
//   // - lga ke exclude kr  skte hai
//   query=query.select("-__v");
// }

// // PAGINATION

// const page = req.query.page * 1 || 1
// const limit = req.query.limit * 1 || 1
// const skip = (page-1)*limit

// query=query.skip(skip).limit(limit)

// if(req.query.page){
//   const numTours = await Tour.countDocuments()
//   if(skip>=numTours) throw new Error("This page doesn't exist")
// }

// Another way of setting the query
// const tours = await Tour.find().where("duration").equals(5).where("difficulty").equals("easy")

// EXEXUTE QUERY

//   const features = new ApiFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // populate isliye use krte hai humne ref. store krra rkha hai lekin jab hum populate use krenge toh vo result me proper data show krega
//   // const tour = await Tour.findById(req.params.id).populate('guides');

//   // const tour = await Tour.findById(req.params.id).populate({path:'guides',select:'-__v -passwordChangedAt'}); //aise krke hum unselect kr skte hai fields

//   if (!tour) {
//     return next(new AppError('No tour found with that ID.', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });
exports.getAllTours = handleFactory.getAll(Tour);
exports.getTour = handleFactory.getOne(Tour, { path: 'reviews' });
exports.createTour = handleFactory.createOne(Tour);
exports.updateTour = handleFactory.updateOne(Tour);
exports.deleteTour = handleFactory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, //isse  uppercase me result ki id show hogi
        // _id: '$difficulty',                       //mtlb gorup bna ke dedega jaise medium difficulty ka alag aayega data easy ka alag
        //  _id: null                                                // and agar null krdia id ko toh saara direct dikha dega

        //neeche vo data hai jo hme chahiye group me
        numTours: { $sum: 1 }, // sum 1 each jo data hoga sabko count krega
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 } //sorting ke liye 1 matlab asc and -1 mtlb desc
    }
    // {
    //   $match:{_id:{$ne:'EASY'}}
    // }
  ]);
  // console.log(stats,"stats");
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //startdates naam ka array hai to ab har array ke element ke liye alag data show hoga
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' } //ab  month ke hisaab se tou aagye lekin multiple tours hai show kaise honge isliyepush lga dia array me store karvaane ke liye
      }
    },
    {
      $addFields: { month: '$_id' } //field add krni thi
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numToursStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: error
  //   });
  // }
});

// router.route('/tours-within/:distance/center/:latlng/unit/:unit',tourController.getToursWithin)

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // (3963.2) <= Radius of the earth in miles
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and logitude in the format lat,long',
        400
      )
    );
  }

  // geo query aise hi dete hai
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } //hmesha lng jaayega pehle isme
  });
  console.log('vicky');
  console.log(tours, 'tours');

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and logitude in the format lat,long',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      // geonear hmesah pipeline me pehle number pe hona chahiye
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier //geoNear property to multiply distance
      }
    },
    {
      $project: {
        _id: 0,
        name: 1,
        distance: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image !Please upload only images', 400), false);
  }
};
const mulerStorage = multer.memoryStorage();

const upload = multer({
  storage: mulerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
// agar image cover naa hota only multiple images hoti tab hum neeche
// exports.uploadTourImages = upload.array('images',3)

// jab single ho upload.single() ,,,, jabmultiple ho upload.array(),,,, jab mix ho tab upload.fields()

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  console.log(
    'hiiiiiiiiiiiiiiiiii????????????????????????????????<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>'
  );
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer) //image processing
    .resize(2000, 1333) //resizes it to square
    .toFormat('jpeg') //formatted to jpeg
    .jpeg({ quality: 90 }) //with aquality of 90 %
    .toFile(`public/img/tours/${req.body.imageCover}`); //write our file into our file system
  console.log(req.body.imageCover, 'req.body.imageCover');
  // 2) Images
  req.body.images = [];
  // neeche hum map ki jagah foreach lgaare the jisse loop me await(sharp) vaala kaam hora tha jo new line pe jaane se na rokta
  // isliye hum map use krenge jo array of promises return krega aur usse variable me store krvaane ke bjaaye direct promise.all use krenge
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});
