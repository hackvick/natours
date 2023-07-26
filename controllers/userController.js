const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handleFactory = require('./handlerFactory');

const { User } = require('../models/userModel');

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    result: users.length,
    data: {
      users
    }
  });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.updateMe = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMyPassword',
        400
      )
    );
  }

  // Filter kia hai unwanted fields name agar koi role daalde body me toh kya krenge
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    user: updateUser
  });
};


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use signup instead'
  });
};

// Do not update password with it
exports.getUser = handleFactory.getOne(User)
exports.deleteUser = handleFactory.deleteOne(User)
exports.updateUser = handleFactory.updateOne(User)
