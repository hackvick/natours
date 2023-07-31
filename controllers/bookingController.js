const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Tour } = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingsModel');
const AppError = require('../utils/appError');
const handleFactory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    // ye session ke liye info
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }$&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // ye product ke liye info
    // line_items: [
    //   {
    //     name: `${tour.name} Tour`,
    //     amount: tour.price * 100,
    //     description: tour.summary,
    //     images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    //     currency: 'usd',
    //     quantity: 1
    //   }
    // ]

    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment' // Specify 'payment' for one-time payment or 'subscription' for recurring subscription.
    // Other session data
  });
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //  This is temporary because everyone can make booking without paying
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = handleFactory.createOne(Booking);
exports.getBooking = handleFactory.getOne(Booking);
exports.getAllBookings = handleFactory.getAll(Booking);
exports.updateBooking = handleFactory.updateOne(Booking);
exports.deleteBooking = handleFactory.deleteOne(Booking);
