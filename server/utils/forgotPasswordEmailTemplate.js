const forgotPasswordEmailTemplate = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Password Reset Code</title>
      <style>
        /* Basic styles for email clients that support them */
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
        .otp-code {
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 5px;
          color: #333333;
          background-color: #f0f0f0;
          border: 1px dashed #cccccc;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
        <tr>
          <td align="center">
            <table class="container" width="600" border="0" cellspacing="0" cellpadding="20" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <tr>
                <td align="center" style="padding-bottom: 20px; border-bottom: 1px solid #dddddd;">
                  <h1 style="margin: 0; color: #333333;">Password Reset Request</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 10px; line-height: 1.6; color: #333333; font-size: 16px;">
                  <p>Dear ${name},</p>
                  <p>We received a request to reset the password for your TerraTrack account. Please use the following One-Time Password (OTP) to complete the process. This code is valid for 1 hour.</p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 10px 0 20px 0;">
                  <div class="otp-code" style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333333; background-color: #f0f0f0; border: 1px dashed #cccccc; padding: 15px; margin: 0 auto; display: inline-block;">
                    ${otp}
                  </div>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 0 10px 30px 10px; font-size: 14px; color: #555555; text-align: center;">
                  <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding-top: 20px; font-size: 12px; color: #888888; border-top: 1px solid #dddddd;">
                  <p>&copy; ${new Date().getFullYear()} TerraTrack. All rights reserved.</p>
                  <p>You are receiving this email because a password reset was requested for your account.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export default forgotPasswordEmailTemplate;