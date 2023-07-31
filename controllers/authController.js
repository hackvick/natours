const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  // agr hum ooper likhi line ka use krenge to koi bhi apna role admin krlega body me pass krke

  //   best practice
  //   const newUser = await User.create({
  //     name: req.body.name,
  //     email: req.body.email,
  //     password: req.body.password,
  //     passwordConfirm: req.body.passwordConfirm,
  //   });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure:true, //sirf https connection pe jaayegi
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    token,
    status: 'success',
    user
  });
};

exports.login = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // humne schema me password ko select false kia hua hai taaki usko koi doc direct access na kr paaye isliye +password lagaya hai
  const user = await User.findOne({ email }).select('+password');

  // correct password humne schema me banaya hai to vo sabhi document ka method hai

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  console.log(user, 'user');
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  console.log(token, 'As');
  if (!token) {
    return next(
      new AppError(
        'You are not logged in.Please log in first to get access',
        401
      )
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //   maybe if the user has been deleted(matlab bande ne login kia uske baad usko admin vaigra ne delete krdia)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token is not exist.', 401)
    );
  }
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again!.', 401)
    );
  }

  req.user = currentUser;
  //   GRANT ACCESS TO PROTECTED ROUTE
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  console.log(user, 'user');
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  const resetToken = user.createPasswordResetToken();
  // await user.save()

  await user.save({ validateBeforeSave: false }); //validateBeforeSave se jo validator lge hue hai model me vo hatt jaayenge aur hum aise hi doc ko save krva skte hai

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your Password reset token(valid for 10 min)',
    //   message
    // });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your Password? Submit a patch request with your new password and passwordconfirm to: ${resetURL}.\nIf you didn't
    // forgot your password,Please ignore this email! `;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email '
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email.Try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  console.log(req.body.passwordConfirm, 'user');
  // If the token has not expired ,there is user,set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password'); //kuki humne password ko select false kia hua hai
  console.log(user, 'user');
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Ypur current password is wrong', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // findbyidand update isliye ni kia kuki jo custom validations hai vo work in kregi
  //(For more ref. read node.notes file)

  createSendToken(user, 200, res);
});
