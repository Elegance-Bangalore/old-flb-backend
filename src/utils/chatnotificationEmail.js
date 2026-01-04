const nodemailer = require("nodemailer")
const fs = require("fs")
const ejs = require("ejs")

const sendMessageEmail = async(email, data, emailTemplate = []) => {
    try{
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: "Info@farmlandbazaar.com",
                pass: "dpaa acwq fpyt eefk",
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const template = fs.readFileSync(__dirname + `/email/${emailTemplate}.ejs`, 'utf-8')

        //Render the template with the data and send email notification
        const renderedEmail = ejs.render(template,data)

        const emailSendFromMail =  `"Team Via" <gauravbrar506@gmail.com>`
        
        const mailOptions = {
            from: '"Farmland Bazaar" <Info@farmlandbazaar.com>',
            to : email,
            subject : "Chat Notification",
            html : renderedEmail
        }

        transporter.sendMail(mailOptions, (err, info) => 
         err 
         ? console.log(err)
         : console.log("mail has been sent : " + email + " " + info.response)
        )

    }catch(error){
        console.log("email not sent");
        console.log(error);
        return error
    }
}

  module.exports = sendMessageEmail