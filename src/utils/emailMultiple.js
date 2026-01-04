const nodemailer = require("nodemailer")
const fs = require("fs")
const ejs = require("ejs")

const sendEmailUsers = async (emails, data, emailTemplate, subject, emailSendFrom = null) => {
    try {
        console.log("Starting email sending process...");
        console.log("Template:", emailTemplate);
        console.log("Subject:", subject);
        
    if (!emails || emails.length === 0) {
            console.error("No recipients defined");
    throw new Error("No recipients defined");
    }
    
        console.log("Setting up email transporter...");
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
    
        console.log("Reading email template...");
    const template = fs.readFileSync(__dirname + `/email/${emailTemplate}.ejs`, 'utf-8');
    
    // Send email to each recipient
    for (const email of emails) {
            console.log(`Processing email for recipient: ${email}`);
    // Render the template with the data for each recipient
    const renderedEmail = ejs.render(template, data);
    
    const emailSendFromMail = emailSendFrom ? `"Team Via" <${emailSendFrom}>` : `"Team Via" <gauravbrar506@gmail.com>`;
    
    const mailOptions = {
                from: '"Farmland Bazaar" <Info@farmlandbazaar.com>',
    to: email,
    subject: subject,
    html: renderedEmail
    };
    
            console.log(`Attempting to send email to: ${email}`);
    await transporter.sendMail(mailOptions);
            console.log(`Email successfully sent to: ${email}`);
    }
        console.log("All emails sent successfully");
    
    } catch (error) {
        console.error("Error occurred while sending email:", error);
        throw error;
    }
    };
    
module.exports = sendEmailUsers;