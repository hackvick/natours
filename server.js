const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');


const DB = process.env.Database.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

mongoose.connect(DB,{
  useNewUrlParser:true,
  useCreateIndex:true,
  useFindAndModify:false,
  useUnifiedTopology:true
}).then(con=>  console.log("DB CONNECTION RUNNING SUCCESSFULLY...")).catch(err=>{
  console.log("DB ERROR");
})


// const testTour  = new Tour({
//   name:"The Forst Hiker",
//   rating:4.7,
//   price:497,
// })
// testTour.save().then(doc=>console.log(doc)).catch(err=>console.log(err))

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
// Hi