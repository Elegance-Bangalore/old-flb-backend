const axios = require("axios");
const qs = require("qs");
// const fast2sms = require("fast-two-sms");
// const FAST2SMS = process.env.FAST2SMS;

module.exports = async (phoneNumber, otp) => {
  if(!phoneNumber.includes("+")) {
    phoneNumber = "+91"+phoneNumber;
  }
  let data = qs.stringify({
    'to': phoneNumber,
    'type': 'OTP',
    'sender': 'EVLXAR',
    'body': `Dear  customer, this is your OTP ${otp} to login - EVOLUXAR`,
    'template_id': '1107173978042182526' 
  });
 try {
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.kaleyra.io/v1/HXIN1783167421IN/messages',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded', 
      'api-key': 'Ac6949e35ddd8e74006199c8dc58d27f9'
    },
    data : data
  };
  const response = await axios.request(config);
  console.log(response)
  if(response && response.data) {
    return response.data
  }
 } catch (error) {
  console.log("otp error", error);
 }
};

// let config = {
//   method: "get",
//   maxBodyLength: Infinity,
//   url: `https://www.fast2sms.com/dev/bulkV2?authorization=8QpA94Gt2ICj57leJNEUWfO0vdTRcnXDBSuHMgK3akmYzshyr1guWAz7681VJqSE53XHLCiwYQoKRBsd&route=otp&variables_values=${otp}&flash=0&numbers=${phoneNumber}`,
//   headers: {
//     Cookie:
//       "XSRF-TOKEN=eyJpdiI6Imozbnd5aFpkN0hYRWJHNE9YUkt4bmc9PSIsInZhbHVlIjoiMDgrUjBrb0UyWjhjVml1ZWtjMnBWVkJPT09RelFcL0VjT3J2OVNFeVNLV0l5M0JEcWhLbGhxQ01JeVQ2aktXMDlpMUlreEs3OEFBZWViXC80eVg3eERHdz09IiwibWFjIjoiNjQyYTE2OGRjYTZiNzFmZGM1MTg3MGQzZWJmODQxZTM4Mjg0ODliZmQ5ODJiYmZhMGVlOTRhNjMyN2FhODgzYyJ9; cviv9Zk3PhAmkKdb0ub32QMPeRs6WnYlaqyTXpIf=eyJpdiI6Ind4ZWxEM1EyQUYyMlBPem5ldFNab1E9PSIsInZhbHVlIjoiN2toSWluXC80eEg0ekg4Wk4zNTh6QVR1eUJXSTJLRjF2RHBwa213REFHRlNBdStBajlpblhNMGE1THhIaFwvY0l2eVVNOGJFXC90WE1LNjdtcklFMjNZZ0NKSnFrRUpvYWNIek4wdWs3UXNYQ25nK3FKeWFOR2hCK0JuaUJSeFlUUEVlS2J6Rk1XK2s5NzNsZHNiWGFjUjZqK0tEXC9PZXpTcTFTTjhYUHBlV1JEbXZ2SXpiM0w4M09rRU1qYStZMEs2Yms2TGxEa1BsUWlUMDdFc2M5SDhIWTBvM2pYSnpTdTZkNEtVY3FUOEQ5NW1jeFZEK0o2RkRTczREZm5CbVd3eXQwRCtUdFRWb2Q2SWc0Y1VTc0hCSlVSeUdTSEFkbVJcL1wvY2V1R2JGWlg4RUlrcVhOV2lFcytaUUl6K09PT3l3cmszeVZmYk5ONUN1UnlkTWxrcjliSGhDR2hlcHpSd2J4eEtpWlVXa1Rta0ljazZDKzFodzZ3UTRcLzhcLzVPYm54enNodlA1WURcL3I2MVNHaHR3ZHJXNThzaWd4SDlweDBcL0Z2Y2p4NXI0N2VoWm5cLzV4dkM1ZTdrendQam14ZTNNUDFNS2pyYzlJYWMwY1duRSt6RFNDelJlWVhiVnFaUnlONGk1VTJWbEZlK0hDMXBBc21uWG1na3p6UzBFb1UwcXZoY0xiV0NUQlJKNjgxcXZub1BxZGlFekhsXC9STFI1a25tWFwvYVFRQlVuekxJTT0iLCJtYWMiOiJjODdkZDdiZWUxYTQ1YmI4YzU2OTU4ZDRhYTBiNmE2N2EzNjE3OTUwNjk0YTUwODVkMDM4N2VkMTI0YWU0YTNhIn0%3D; laravel_session=eyJpdiI6IjhvWnB2SmxBTVVtbHVodXBqVmZZa2c9PSIsInZhbHVlIjoiNUhpRmFcL1JheHVyOE9uWGNDWFJVTjQ1MzQ1NHAxY1VQMDRcLzdKa2U5SXZ6UjVYOFlLUzZGUFZMWE11aGhlbEgwSDBaZHNiZWhNMU8zZXRLMGVpXC9SUWc9PSIsIm1hYyI6IjE3ZTJmZmIxYzU5YWE3ZjgwNWM2NGQyMDkyNjVkOTg4NzUyZWYxM2NjY2MyMTA1ODAyYWZiYjVlODhlYjBjNzcifQ%3D%3D",
//   },
// };
// try {
//   let response = await axios.request(config);
//   console.log("response", response);
//   if (response && response.data && response.data.return) {
//     return response.data.request_id;
//   }
// } catch (e) {
//   console.log("otp error",e);
// }
