const apiKey = "re_eUP3ZM7u_2iTwWEc5h6ZrdYDr5yFEc1UR";
const { Resend } = require("resend");

const resend = new Resend(apiKey);
async function sendEmail(email) {
  try {
    const data = await resend.emails.send({
      from: "CropURL <noreply@cropurl.in>", // or your verified domain
      to: email,
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    });

    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { sendEmail };
