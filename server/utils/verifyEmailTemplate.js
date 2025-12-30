const verifyEmailTemplate = ({name, url}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email Address</title>
      <style>
        /*Styles for email clients that support them */
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
        }
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #dddddd;
        }
        .content {
          padding: 20px 0;
          line-height: 1.6;
          color: #333333;
        }
        .button-container {
          text-align: center;
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          font-size: 12px;
          color: #888888;
          border-top: 1px solid #dddddd;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
        <tr>
          <td align="center">
            <table class="container" width="600" border="0" cellspacing="0" cellpadding="20" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <tr>
                <td class="header" align="center" style="padding-bottom: 20px; border-bottom: 1px solid #dddddd;">
                  <h1 style="margin: 0; color: #333333;">Welcome to TerraTrack!</h1>
                </td>
              </tr>

              <tr>
                <td class="content" style="padding: 30px 10px; line-height: 1.6; color: #333333; font-size: 16px;">
                  <p>Dear ${name},</p>
                  <p>Thank you for registering with TerraTrack. We're excited to have you on board. Please click the button below to verify your email address and complete your registration.</p>
                </td>
              </tr>

              <tr>
                <td class="button-container" align="center" style="padding: 10px 0 30px 0;">
                  <a href="${url}" target="_blank" class="button" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    Verify Email Address
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 10px 20px 10px; font-size: 14px; color: #555555;">
                  <p>If the button doesn't work, please copy and paste this link into your web browser:</p>
                  <a href="${url}" target="_blank" style="color: #007bff; word-break: break-all;">${url}</a>
                </td>
              </tr>
              
              <tr>
                <td class="content" style="padding: 10px; line-height: 1.6; color: #333333; font-size: 16px;">
                    <p>Best regards,<br>The TerraTrack Team</p>
                </td>
              </tr>

              <tr>
                <td class="footer" align="center" style="padding-top: 20px; font-size: 12px; color: #888888; border-top: 1px solid #dddddd;">
                  <p>&copy; ${new Date().getFullYear()} TerraTrack. All rights reserved.</p>
                  <p>You received this email because you signed up for an account on our website.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export default verifyEmailTemplate;