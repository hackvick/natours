const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Tour } = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.Database.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => console.log('DB CONNECTION RUNNING SUCCESSFULLY...'))
  .catch(err => {
    console.log('DB ERROR');
  });

// const testTour  = new Tour({
//   name:"The Forst Hiker",
//   rating:4.7,
//   price:497,
// })
// testTour.save().then(doc=>console.log(doc)).catch(err=>console.log(err))

// Read json files
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

console.log(tours, 'tours');
// Import Data in database

const importData = async function() {
  try {
    await Tour.create(tours);
    console.log('Data successfully Loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};
console.log(process.argv);

// Deleting old Data

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data Successfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
