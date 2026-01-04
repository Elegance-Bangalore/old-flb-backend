const otpGenerator = require('otp-generator');


// generate otp using package
exports.otpGenerator =async (otp_length) => {
    const otp_config = {
        lowerCaseAlphabets : false,
        upperCaseAlphabets: false, 
        specialChars: false 
    }
    const otp = otpGenerator.generate(otp_length,otp_config);
    return otp;
}