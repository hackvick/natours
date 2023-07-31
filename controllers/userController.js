const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handleFactory = require('./handlerFactory');
const { User } = require('../models/userModel');

//  jab picture me koi processing ya resizing krni ho toh use memory me save krvaate hai disk me ni

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     //cb next ki tarah hi hai next isliye ni likha kuki ye express se ni aara aur iska pehla param bhi error hota hai
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload ony images.', 400), false);
  }
};

// const upload = multer({dest:'public/img/users'})
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

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

exports.resizeUserPhoto = catchAsync(async(req, res, next) => {
  //  jab picture me koi processing ya resizing krni ho toh use memory me save krvaate hai disk me ni

  if (!req.file) return next();
  // isko req.file.filename me isliye daala hai kuki hum isko controller me use kr ske
  req.file.filename = `user-${req.user.id}-${Date.now()}`;
  await sharp(req.file.buffer)               //image processing
    .resize(500, 500)               //resizes it to square
    .toFormat('jpeg')               //formatted to jpeg
    .jpeg({ quality: 90 })          //with aquality of 90 %
    .toFile(`public/img/users/${req.file.filename}`);   //write our file into our file system
  next();
})

exports.updateMe = async (req, res, next) => {
  console.log(req.body);
  console.log(req.file);
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
  if (req.body) {
    filteredBody.photo = req.file.filename;
  }
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

exports.getAllUsers = handleFactory.getAll(User);
exports.getUser = handleFactory.getOne(User);
// Do not update password with it
exports.deleteUser = handleFactory.deleteOne(User);
exports.updateUser = handleFactory.updateOne(User);
