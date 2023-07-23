const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs')
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required:[true,"Please tell us your name!"]
},
  email:{
    type:String,
    required:[true,'Please Provide your email'],
    unique:true,
    lowercase:true,
    validate:[validator.isEmail,'Please provide a valid email']
  },
  photo:{
    type:String
  },
  password:{
    type:String,
    required:[true,'Please provide a password'],
    minlength:8
  },
  passwordConfirm:{
    type:String,
    required:[true,'Please confirm your password'],
    validate:{
        // This will only work on CREATE AND SAVE! 
        validator:function(el){
            return el === this.password;
        }
    }
}
});


userSchema.pre('save',async function(next){
  
//   Only run the function if password was actually modified
    if(!this.isModified('password')) return next()

    // Hash the password with cost of 12
    this.password=await bcrypt.hash(this.password,12)
    // delete password confirm  field
    this.passwordConfirm = undefined
    next()
})

exports.User = mongoose.model('User',userSchema)