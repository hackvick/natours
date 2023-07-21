const mongoose = require("mongoose")
const slugify  =require('slugify')

const tourSchema = new mongoose.Schema({
    name:{
      type:String,
      unique:true,
      required:[true,"A tour must have a name"],
      trim:true                //It will remove the whitespace from the begining and the end of the string
    },
    duration:{
        type:Number,
        required:[true,"A tour must have duration"]
    },
    maxGroupSize:{
        type:Number,
        required:[true,"A tour must have a group size"]
    },
    slug:String,
    difficulty:{
        type:String,
        required:[true,"A tour must have a difficulty"]
    },
    ratingsAverage:{
      type:Number,
      default:4.5
    },
    ratingsQuantity:{
      type:Number,
      default:0
    },
    price:{
      type:Number,
      required:[true,"A tour must have a price"]
    },
    priceDiscount:Number,
     summary:{
        type:String,
        trim:true,                //It will remove the whitespace from the begining and the end of the string
        required:[true,"A tour must have a summary"]

     },
     description:{
        type:String,
        trim :true
     },
     imageCover:{
        type:String,
        required:[true,"A tour must have a cover image"]
     },
     images:[String],            //I am expecting  array of images
     createdAt:{
        type:Date,
        default:Date.now(),
        // select false karne se ye hide hojaayegi aur user ko pass ni hogi
        select:false
     },
     startDates:[Date],
     secretTour:{
        type:Boolean,
        default:false
        }
    },
    {
        toJSON:{virtuals:true},
        toObject:{virtuals:true}
    })
  
    tourSchema.virtual('durationWeeks').get(function(){       //virtual property jo yha pe calculate hogi jisko db me ni rkhte like jo easily pdi hui value se nikl jaaye
        return this.duration / 7
    })

// Document Middleware: work for save and create

// tourSchema.pre("save", function (next) {
//      this.slug= slugify(this.name,{lower:true})
//      next()
// })
// tourSchema.post("save", function (doc,next) {
//         console.log(doc); 
//     next()
// })


// Query middleware
//  mtlb ki query level pe koi middleware add karna jaise ki yha secret toor bnaya aur usko exclude krdia ke secret tour true hai uske liye ni find hoga 
    tourSchema.pre(/^find/,function(next){
        this.find({secretTour:{$ne:true}})
        
        this.start = Date.now()
        next()
        })
  tourSchema.post(/^find/,function(docs,next){
    console.log(`Query took ${Date.now()-this.start} milliseconds!`);
    next()
  })

//   Aggregation Middleware

// baat ye hai ke isse hum aggregation se pehle use krte hai jaise humne ek secret tour bnaya hai vo aggregation me aara tha 
// isliye humne use yha pe define krdia ke bhai beech me na aaio 

  tourSchema.pre('aggregate',function(next){
    this.pipeline().unshift({$match:{secretTour:{$ne:true}}})           
        
    this.start = Date.now()
    next()
  })

  exports.Tour = mongoose.model('Tour',tourSchema)