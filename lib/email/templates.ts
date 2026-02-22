/**
 * Email templates for various notifications
 */

export function getRenewalReminderEmail(
  phoneNumber: string,
  expiryDate: string,
  monthlyCost: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Phone Number Renewal Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Phone Number Renewal Reminder</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hello,</p>
        <p>This is a reminder that your phone number <strong>${phoneNumber}</strong> will expire in <strong>5 days</strong> on <strong>${expiryDate}</strong>.</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0;"><strong>Renewal Amount:</strong> $${monthlyCost.toFixed(2)} USD</p>
        </div>
        <p>To ensure uninterrupted service, please make sure you have sufficient balance in your wallet. The renewal will be processed automatically on the expiry date.</p>
        <p>If your wallet balance is insufficient, please add funds to your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/numbers" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View My Numbers</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          If you have any questions, please contact our support team.
        </p>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
          Best regards,<br>
          The Numzaro Team
        </p>
      </div>
    </body>
    </html>
  `;
}

export function getNumberRestrictedEmail(
  phoneNumber: string,
  expiryDate: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Phone Number Restricted</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Phone Number Restricted</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hello,</p>
        <p>We regret to inform you that your phone number <strong>${phoneNumber}</strong> has been restricted due to non-payment.</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Expiry Date:</strong> ${expiryDate}</p>
          <p style="margin: 10px 0 0 0;"><strong>Grace Period Ended:</strong> The 3-day grace period has expired without renewal.</p>
        </div>
        <p>Your number expired on <strong>${expiryDate}</strong> and the 3-day grace period has ended. Since your account balance was insufficient and the number was not renewed, it has been restricted.</p>
        <p><strong>What this means:</strong></p>
        <ul>
          <li>The number is no longer active and cannot receive messages</li>
          <li>You will need to add funds to your wallet and manually renew the number</li>
          <li>If not renewed within a reasonable time, the number may be released</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/numbers" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Number</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          If you have any questions or need assistance, please contact our support team.
        </p>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
          Best regards,<br>
          The Numzaro Team
        </p>
      </div>
    </body>
    </html>
  `;
}

export function getRenewalSuccessEmail(
  phoneNumber: string,
  newExpiryDate: string,
  amount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Phone Number Renewed Successfully</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Renewal Successful</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hello,</p>
        <p>Your phone number <strong>${phoneNumber}</strong> has been successfully renewed!</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #11998e;">
          <p style="margin: 0;"><strong>Amount Charged:</strong> $${amount.toFixed(2)} USD</p>
          <p style="margin: 10px 0 0 0;"><strong>New Expiry Date:</strong> ${newExpiryDate}</p>
        </div>
        <p>Your number will remain active until the new expiry date. Thank you for using Numzaro!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/numbers" style="background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View My Numbers</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Best regards,<br>
          The Numzaro Team
        </p>
      </div>
    </body>
    </html>
  `;
}




