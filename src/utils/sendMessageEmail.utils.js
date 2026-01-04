const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  maxConnections: Infinity,
  maxMessages: Infinity,
  pool: true,
  auth: {
    user: "Info@farmlandbazaar.com",
    pass: "dpaa acwq fpyt eefk",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// const sendMessageEmail = async (email, message) => {
//   try {
//     console.log("Sending Email !");

//     const mailOptions = {
//       from: "ayush9794124609@gmail.com",
//       to: email,
//       subject: "New Message",
//       html: `<h3>Hi, </h3><p>You have a new message.</p></br><p>${message}</p>`,
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

module.exports = sendMessageEmail;
