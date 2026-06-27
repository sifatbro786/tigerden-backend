import nodemailer from "nodemailer";

let transporter = null;

/**
 * Lazily creates (and caches) the Nodemailer transporter.
 * Creating it on first use — rather than at module-load time — avoids
 * a class of bugs where env vars aren't populated yet because ESM
 * hoists imports above dotenv.config().
 */
const getTransporter = () => {
    if (transporter) return transporter;

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error(
            "⚠️ Email service not configured: GMAIL_USER / GMAIL_APP_PASSWORD missing from .env",
        );
        return null;
    }

    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    return transporter;
};

/**
 * Generic safe-send helper. Never throws — logs and resolves instead,
 * so a flaky email never breaks registration/login/password flows.
 */
const safeSend = async (mailOptions) => {
    const t = getTransporter();
    if (!t) return false;

    try {
        await t.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("⚠️ Failed to send email:", error.message);
        return false;
    }
};

/**
 * Sends the welcome email to a newly registered user.
 */
export const sendWelcomeEmail = async (toEmail, name) => {
    return safeSend({
        from: `"Tigersden Tourism" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: "Welcome to Tigersden Tourism! 🐯",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome aboard, ${name}!</h2>
        <p>Thank you for joining <strong>Tigersden Tourism</strong>.</p>
        <p>Explore our exclusive packages, flash sales, and loyalty rewards
        designed just for you.</p>
        <p>Happy travels!<br/>The Tigersden Tourism Team</p>
      </div>
    `,
    });
};

/**
 * Sends a 6-digit OTP for password reset.
 */
export const sendOTPEmail = async (toEmail, otp) => {
    return safeSend({
        from: `"Tigersden Tourism" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: "Your Password Reset Code — Tigersden Tourism",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset Request</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code expires in 15 minutes. If you didn't request this,
        you can safely ignore this email.</p>
      </div>
    `,
    });
};

/**
 * Sends a booking confirmation email after admin manually verifies payment.
 * @param {string} toEmail
 * @param {string} name
 * @param {{ packageTitle: string, totalAmount: number, transactionId: string }} bookingDetails
 */
export const sendBookingConfirmationEmail = async (toEmail, name, bookingDetails) => {
  const { packageTitle, totalAmount, transactionId } = bookingDetails;

  return safeSend({
    from: `"Tigersden Tourism" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "🎉 Your Booking is Confirmed! — Tigersden Tourism",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0;">🐯 Booking Confirmed!</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <p>Hi ${name},</p>
          <p>Great news! We've manually verified your payment, and your booking is now
          <strong style="color: #059669;">officially confirmed</strong>.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Package</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${packageTitle}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Total Paid</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">$${totalAmount}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #6b7280;">Transaction ID</td>
              <td style="padding: 10px; font-weight: 600;">${transactionId}</td>
            </tr>
          </table>

          <p>We can't wait to have you on this journey with us. If you have any questions,
          just reply to this email.</p>
          <p>Happy travels!<br/>The Tigersden Tourism Team 🐯</p>
        </div>
      </div>
    `,
  });
};
