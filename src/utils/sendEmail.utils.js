const nodemailer = require("nodemailer");
const fs = require("fs")
const ejs = require("ejs")

// const mailTransporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   requireTLS: true,
//   maxConnections: Infinity,
//   maxMessages: Infinity,
//   pool: true,
//   auth: {
//     user: "ayush9794124609@gmail.com",
//     pass: "cpdr iclo pmed htql",
//   },
//   tls: {
//     rejectUnauthorized: false
// }
// });

const sesRegion = 'ap-south-1'
// Create a transporter using AWS SES SMTP
const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  maxConnections: Infinity,
  maxMessages: Infinity,
  pool: true,
  auth: {
    user: "Info@farmlandbazaar.com",  // Your Gmail
    pass: "dpaa acwq fpyt eefk",     // Your App Password
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (email, data,emailTemplate) => {
  try {
    console.log("Sending Email !");

    const template = fs.readFileSync(__dirname + `/email/${emailTemplate}.ejs`, 'utf-8')

        //Render the template with the data and send email notification
        const renderedEmail = ejs.render(template,data)

    const mailOptions = {
      from: '"Farmland Bazaar" <Info@farmlandbazaar.com>',
      to: email,
      subject: "Forgot password",
      html : renderedEmail,
      //html: `<h3>Hi, </h3><p>We received a request to reset the password for your account associated with this email address. If you made this request, please click the link below to reset your password <b><a href=${link}>link</a></b> to reset password.</p>`,
    };

    let response = await new Promise((resolve, reject) => {
      mailTransporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          console.error("Error Occurs", err);
          return { status: 0, err: err };
        } else {
          console.log("Email sent successfully to - ", email);
          resolve(true);
          return { status: true };
        }
      });
    });

    return response;
  } catch (e) {
    // error(e);
    console.log(e);
    return e;
  }
};
// const sendEmailRegistration = async (email, link) => {
//   try {
//     console.log("Sending Email !");

//     const mailOptions = {
//       from: "ayush9794124609@gmail.com",
//       to: email,
//       subject: "Email Verification",
//       html: `<h3>Hi, </h3><p>Click on the link ${link} to verify your email.</p>`,
//     };

//     let response = await new Promise((resolve, reject) => {
//       mailTransporter.sendMail(mailOptions, function (err, data) {
//         if (err) {
//           console.error("Error Occurs", err);
//           return { status: 0, err: err };
//         } else {
//           console.log("Email sent successfully to - ", email);
//           resolve(true);
//           return { status: true };
//         }
//       });
//     });

//     return response;
//   } catch (e) {
//     // error(e);
//     console.log(e);
//     return e;
//   }
// };

module.exports = sendEmail;

// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       type: 'OAuth2',
//       user: process.env.MAIL_USERNAME,
//       pass: process.env.MAIL_PASSWORD,
//       clientId: process.env.OAUTH_CLIENTID,
//       clientSecret: process.env.OAUTH_CLIENT_SECRET,
//       refreshToken: process.env.OAUTH_REFRESH_TOKEN
//     }
//   });
