
class ApiFeatures{
    constructor(query, queryString){
      this.query=query
      this.queryString = queryString 
    }
    filter(){
  // 1A) Filtering
  const queryObj = { ...this.queryString };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  
  excludedFields.forEach(el => delete queryObj[el]);
  
  // 2A) Advanced Filtering
  let queryStr = JSON.stringify(queryObj);
  
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  console.log(JSON.parse(queryStr));
  
  this.query = this.query.find(JSON.parse(queryStr));
  return this
    }
    sort(){ 
      //2) SORT
      // aise simply assending me sort karega if descending me karvana hai toh - lga do
      if (this.queryString.sort) {
        // agr hum ek field se sort karne lge aur vo do baar ho toh ye dusri field se sort krdega unme se 
       const sortBy = this.queryString.sort.split(",").join(" ")
       this.query = this.query.sort(sortBy);
      }else{
        // Default Sort
        this.query = this.query.sort('-createdAt');
      }
      return this
    }
    limitFields(){
      //3) Field Limiting
  
      if(this.queryString.fields){
        const fields = this.queryString.fields.split(",").join(" ")
        this.query = this.query.select(fields)
      }else{
        // default  limiting
        // - lga ke exclude kr  skte hai
        this.query=this.query.select("-__v");
      }
  
      return this
    }
  paginate(){
    
      // PAGINATION
  
      const page = this.queryString.page * 1 || 1
      const limit = this.queryString.limit * 1 || 20
      const skip = (page-1)*limit
  
      this.query=this.query.skip(skip).limit(limit)
  
      
      return this
  }
  
  }

  module.exports = ApiFeatures