const Booking = require('../models/bookingsModel');
const { Tour } = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const slug = req.params.slug;
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});

exports.getMyTours = catchAsync(async(req,res,next)=>{
  const bookings = await Booking.find({user:req.user.id})

  const tourIDs = bookings.map(el=>el.tour)
  const tours = await Tour.find({_id:{$in:tourIDs}})

  res.status(200).render('overview',{
    title:'My tours',
    tours
  })
}) 
