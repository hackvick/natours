const nodemailer = require('nodemailer')


const sendEmail = async options =>{
    // CREATE TRANSPORTER
    const transporter = nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD
        }
    })
    // Define email options
    const mailOptions = {
        from: 'Vicky Hasija <vickyhasija167@gmail.com>',
        to:options.email,
        subject:options.subject,
        text:options.message,
        // html: 
    }
    // Actually send the Email
    transporter.sendMail(mailOptions)
}

module.exports = sendEmail;