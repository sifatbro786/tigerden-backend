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
