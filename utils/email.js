const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');
const { options } = require('mongoose');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Vicky Hasija <${process.env.EMAIL_FROM}>`;
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  async send(template, subject) {
    // Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      email: this.to,
      url: this.url,
      subject
    });
    // define email options
    const mailOptions = {
      from: 'Vicky Hasija <vickyhasija60@gmail.com>',
      to: this.to,
      subject,
      html,
      text: convert(html, { wordwrap: 130 })
    };
    // create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  //   async sendVickWelcome() {
  //     await this.send('vikWelcome', 'Welcome to my family');
  //   }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token(Valid for only 10 minutes)'
    );
  }
};

// const sendEmail = async options =>{
//     // CREATE TRANSPORTER
//     const transporter = nodemailer.createTransport({
//         host:process.env.EMAIL_HOST,
//         port:process.env.EMAIL_PORT,
//         auth:{
//             user:process.env.EMAIL_USERNAME,
//             pass:process.env.EMAIL_PASSWORD
//         }
//     })
//     // Define email options
//     const mailOptions = {
//         from: 'Vicky Hasija <vickyhasija167@gmail.com>',
//         to:options.email,
//         subject:options.subject,
//         text:options.message,
//         // html:
//     }
//     // Actually send the Email
//     transporter.sendMail(mailOptions)
// }

// module.exports = sendEmail;
