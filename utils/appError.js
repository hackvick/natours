class AppError extends Error{
    constructor(message,statusCode){
        // super hum parent class ke constructor ko invoke krne ke liye use krte hai
        // aur parent class (Error) sirf message accept krti hai
        super(message)
        this.statusCode = statusCode
        this.status= `${statusCode}`.startsWith(4)? 'fail' : 'error'
        this.isOperational = true
        // this.message=message

        Error.captureStackTrace(this,this.constructor)
    }
}

module.exports = AppError