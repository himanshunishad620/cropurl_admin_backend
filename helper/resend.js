const apiKey = "re_eUP3ZM7u_2iTwWEc5h6ZrdYDr5yFEc1UR";
const { Resend } = require("resend");
const getRegistrationLinkUi = (...args) => `<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Complete your registration</title>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F9; font-family:Helvetica, Arial, sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9; padding:40px 16px;">
  <tr>
    <td align="center">

      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px; max-width:100%; background-color:#FFFFFF; border-radius:16px; border:1px solid #E2E8F0; overflow:hidden;">

        <!-- Logo -->
        <tr>
          <td style="padding:36px 40px 0 40px;">
            <span style="font-size:24px; font-weight:700; letter-spacing:-0.5px; font-family:Helvetica, Arial, sans-serif;">
              <span style="color:#1560D4;">Crop</span><span style="color:#475569;">URL</span>
            </span>
          </td>
        </tr>

       
        <!-- Headline + body -->
        <tr>
          <td style="padding:20px 40px 0 40px;">
            <h1 style="margin:0 0 12px 0; font-size:22px; line-height:1.3; font-weight:700; color:#0F172A; font-family:Helvetica, Arial, sans-serif;">
              Complete your registration
            </h1>
            <p style="margin:0; font-size:15px; line-height:1.6; color:#475569; font-family:Helvetica, Arial, sans-serif;">
              Thanks for signing up for CropURL. Click the button below to verify your email and finish creating your account.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:28px 40px 0 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="background-color:#1560D4; border-radius:10px;">
                  <a href=${args.verificationLink}
                     style="display:block; padding:14px 24px; font-size:15px; font-weight:700; color:#FFFFFF; text-decoration:none; font-family:Helvetica, Arial, sans-serif;">
                    Verify and complete registration
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 15-minute expiry callout -->
        <tr>
          <td style="padding:20px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAEEDA; border-radius:8px;">
              <tr>
                <td style="padding:12px 16px; font-size:13px; line-height:1.5; color:#633806; font-family:Helvetica, Arial, sans-serif;">
                  This link expires in 15 minutes. If it expires, you'll need to sign up again.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Fallback link -->
        <tr>
          <td style="padding:24px 40px 0 40px;">
            <p style="margin:0 0 8px 0; font-size:13px; color:#475569; font-family:Helvetica, Arial, sans-serif;">
              Or copy and paste this link into your browser:
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px;">
              <tr>
                <td style="padding:10px 14px; font-size:12px; color:#1560D4; word-break:break-all; font-family:Consolas, monospace;">
                  ${args.verificationLink}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:32px 40px 0 40px;">
            <div style="border-top:1px solid #E2E8F0;"></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 36px 40px;">
            <p style="margin:0; font-size:12px; line-height:1.6; color:#94A3B8; font-family:Helvetica, Arial, sans-serif;">
              If you didn't try to sign up for CropURL, you can safely ignore this email. No account will be created.
            </p>
          </td>
        </tr>

      </table>

      <!-- Sub-footer -->
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px; max-width:100%;">
        <tr>
          <td style="padding:20px 40px; text-align:center;">
            <p style="margin:0; font-size:12px; color:#94A3B8; font-family:Helvetica, Arial, sans-serif;">
              CropURL &middot; cropurl.in
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
const resend = new Resend(apiKey);
// async function sendEmail(email) {
//   try {
//     await resend.emails.send({
//       from: "CropURL <noreply@cropurl.in>",
//       to: email,
//       subject: "Hello World",
//       html: ,
//     });
//   } catch (error) {
//     console.error(error);
//   }
// }

const sendRegistrationVerificationLink = async (...args) => {
  try {
    await resend.emails.send({
      from: "CropURL <noreply@cropurl.in>",
      to: email,
      subject: "Verify your email — link expires in 15 minutes",
      html: getRegistrationLinkUi(...args),
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = { sendEmail, sendRegistrationVerificationLink };
