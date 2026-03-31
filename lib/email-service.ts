import sgMail from '@sendgrid/mail';
import axios from 'axios';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
}

// ============ EMAIL SERVICE ============

export const sendVerificationEmail = async (
  email: string,
  verificationLink: string,
  userName: string
): Promise<boolean> => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .content { color: #666; line-height: 1.6; }
            .button { display: inline-block; background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to PartyTime Africa!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for signing up! To complete your registration and verify your email address, please click the button below:</p>
              <a href="${verificationLink}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link in your browser:</p>
              <p><code>${verificationLink}</code></p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 PartyTime Africa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@partytime.africa',
      subject: 'Verify Your PartyTime Africa Email',
      html,
    });

    return true;
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const sendPaymentConfirmationEmail = async (
  email: string,
  customerName: string,
  eventTitle: string,
  ticketCount: number,
  amount: number,
  currency: string,
  transactionId: string
): Promise<boolean> => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 20px; border-radius: 5px; }
            .header h1 { margin: 0; }
            .content { color: #666; line-height: 1.6; }
            .ticket-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF6B35; }
            .ticket-info p { margin: 5px 0; }
            .label { font-weight: bold; color: #333; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Payment Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>Thank you for your purchase! Your payment has been successfully processed.</p>
              
              <div class="ticket-info">
                <p><span class="label">Event:</span> ${eventTitle}</p>
                <p><span class="label">Tickets:</span> ${ticketCount}</p>
                <p><span class="label">Amount Paid:</span> ${amount.toLocaleString()} ${currency}</p>
                <p><span class="label">Transaction ID:</span> ${transactionId}</p>
              </div>

              <p>Your tickets have been sent to your email. You can also access them from your dashboard at any time.</p>
              <p>Download the PartyTime Africa app or visit our website to view your QR codes and check in at the event.</p>
              
              <p><strong>Important:</strong> Keep your QR codes safe and don't share them with anyone else.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 PartyTime Africa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@partytime.africa',
      subject: `Payment Confirmed - ${eventTitle}`,
      html,
    });

    return true;
  } catch (error: any) {
    console.error('Error sending payment confirmation email:', error);
    return false;
  }
};

export const sendBookingReminderEmail = async (
  email: string,
  customerName: string,
  eventTitle: string,
  eventDateTime: Date,
  tableNumber: number
): Promise<boolean> => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 20px; border-radius: 5px; }
            .header h1 { margin: 0; }
            .content { color: #666; line-height: 1.6; }
            .event-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF6B35; }
            .event-info p { margin: 5px 0; }
            .label { font-weight: bold; color: #333; }
            .button { display: inline-block; background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Event Reminder!</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>Your event is starting in 1 hour! Here are your booking details:</p>
              
              <div class="event-info">
                <p><span class="label">Event:</span> ${eventTitle}</p>
                <p><span class="label">Date & Time:</span> ${eventDateTime.toLocaleString()}</p>
                <p><span class="label">Table:</span> Table ${tableNumber}</p>
              </div>

              <p>Please confirm your attendance or let us know if you can't make it. If you don't respond within 1 hour, your table may be released to other guests.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" class="button">Confirm Attendance</a>
            </div>
            <div class="footer">
              <p>&copy; 2026 PartyTime Africa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@partytime.africa',
      subject: `Reminder: ${eventTitle} starts in 1 hour!`,
      html,
    });

    return true;
  } catch (error: any) {
    console.error('Error sending booking reminder email:', error);
    return false;
  }
};

export const sendEventCancellationEmail = async (
  email: string,
  customerName: string,
  eventTitle: string,
  reason?: string
): Promise<boolean> => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 20px; border-radius: 5px; }
            .header h1 { margin: 0; }
            .content { color: #666; line-height: 1.6; }
            .alert { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Event Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>We regret to inform you that the following event has been cancelled:</p>
              
              <div class="alert">
                <p><strong>${eventTitle}</strong></p>
                ${reason ? `<p>Reason: ${reason}</p>` : ''}
              </div>

              <p>Your payment has been refunded to your original payment method. Please allow 3-5 business days for the refund to appear in your account.</p>
              <p>We apologize for any inconvenience this may cause. We hope to see you at future PartyTime Africa events!</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 PartyTime Africa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@partytime.africa',
      subject: `Event Cancelled: ${eventTitle}`,
      html,
    });

    return true;
  } catch (error: any) {
    console.error('Error sending cancellation email:', error);
    return false;
  }
};

// ============ SMS SERVICE ============

export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    // Using Twilio or similar SMS service
    const response = await axios.post(
      'https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '/Messages.json',
      {
        From: process.env.TWILIO_PHONE_NUMBER,
        To: phoneNumber,
        Body: message,
      },
      {
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID || '',
          password: process.env.TWILIO_AUTH_TOKEN || '',
        },
      }
    );

    return response.status === 201;
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

export const sendBookingReminderSMS = async (
  phoneNumber: string,
  eventTitle: string,
  eventDateTime: Date,
  tableNumber: number
): Promise<boolean> => {
  const message = `Hi! Your event "${eventTitle}" starts in 1 hour (${eventDateTime.toLocaleTimeString()}). Table ${tableNumber}. Confirm attendance: ${process.env.NEXT_PUBLIC_APP_URL}/bookings`;
  return sendSMS(phoneNumber, message);
};

export const sendPaymentConfirmationSMS = async (
  phoneNumber: string,
  eventTitle: string,
  ticketCount: number,
  amount: number,
  currency: string
): Promise<boolean> => {
  const message = `✓ Payment confirmed! ${ticketCount} ticket(s) for "${eventTitle}" (${amount} ${currency}). Check your email for details.`;
  return sendSMS(phoneNumber, message);
};
