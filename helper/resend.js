const apiKey = "re_eUP3ZM7u_2iTwWEc5h6ZrdYDr5yFEc1UR";
const { Resend } = require("resend");

const resend = new Resend(apiKey);
async function sendEmail() {
  try {
    const data = await resend.emails.send({
      from: "QRPilot <onboarding@resend.dev>", // or your verified domain
      to: "himanshunishad@gmail.com",
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    });

    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { sendEmail };
