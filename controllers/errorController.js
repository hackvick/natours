module.exports=(err,req,res,next)=>{

     // err.stack se pta chlta hai error kha aaya hai
  // console.log(err.stack);

err.statusCode= err.statusCode || 500
err.status= err.status || 'error'

res.status(err.statusCode).json({
  status:err.status,
  message:err.message,
  
})
}