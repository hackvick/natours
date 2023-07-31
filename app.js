const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const path = require('path');
const reviewRouter = require('./routes/reviewRoutes');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const app = express();
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
// 1) GLOBAL MIDDLEWARES
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// DEVLOPMENT LOGGING

// Serving Static files
app.use(express.static(`${__dirname}/public`));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security HTTP Headers
app.use(helmet());

// LIMIT REQUEST FROM SAME IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour'
});

app.use('/api', limiter);

// Body Parser Reading data from the body into req.body
app.use(express.json());

// Data sanitization against NOSQL injection    //login krte time email me {"$gt":""} and password real daal login hojaayega

app.use(mongoSanitize());

//Data sanitization against xss           // agar koi html ke sath javascript attatch krke html hmaare usme inject kre usko rokne ke liye
app.use(xss());

// Prevent parameter pollution           // agar hum sort query 2 baar daal de to vo fail hoke gnda sa error deta hai ab ni dega vo
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficuilty',
      'price'
    ] //isse in sab pe ye kaam ni krega
  })
);

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// jab bhi express middleware me 4 params aaye mtlb ye error handling middleware hai aur next ke beech me kabhi bhi arguement jaaye mtlb vo err hai
app.use(globalErrorHandler);
module.exports = app;
