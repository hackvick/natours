const { Tour } = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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

exports.getAllTours = catchAsync(async (req, res, next) => {
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

  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // const tour = await Tour.findByIdAndUpdate(req.params.id,{$set:req.body})
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID.', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID.', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

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

exports.getMonthlyPlan = async (req, res, next) => {
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
};
