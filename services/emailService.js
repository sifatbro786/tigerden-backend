import nodemailer from "nodemailer";

/**
 * Creates a reusable Nodemailer transporter configured for Gmail
 * using an App Password (not the regular account password).
 */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

/**
 * Sends the welcome email to a newly registered user.
 * Failures are logged but never thrown, so registration doesn't fail
 * just because the email could not be sent.
 * @param {string} toEmail
 * @param {string} name
 */
export const sendWelcomeEmail = async (toEmail, name) => {
    try {
        await transporter.sendMail({
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
    } catch (error) {
        console.error("⚠️ Failed to send welcome email:", error.message);
    }
};
