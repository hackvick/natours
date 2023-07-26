const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};
const sendErrorProd = (err, res) => {
  console.log(err, 'err.isOperational');
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or unknown error: jo client ko ni btana
    console.error('ERROR👻👻👻', err);
    res.status(500).json({
      status: 'error',
      message: 'Something is very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  // err.stack se pta chlta hai error kha aaya hai
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log(error.name, 'error.name');
    if (error.name === 'CastError') {
      console.log('sasaasasasa');
      error = handleCastErrorDB(error);
    }
    sendErrorProd(error, res);
  }
};
