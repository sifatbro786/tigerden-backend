import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import generateOTP from "../utils/generateOTP.js";
import { sendWelcomeEmail, sendOTPEmail } from "../services/emailService.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email and password are required");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new ApiError(409, "An account with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword, phone });

    sendWelcomeEmail(user.email, user.name);

    const token = generateToken(user._id, user.role);

    res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyaltyTier: user.loyaltyTier,
            },
            token,
        },
    });
});

/**
 * @desc    Login an existing user
 * @route   POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyaltyTier: user.loyaltyTier,
            },
            token,
        },
    });
});

/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/auth/me
 */
export const getMyProfile = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: req.user });
});

/**
 * @desc    Request a password reset OTP via email
 * @route   POST /api/auth/forgot-password
 * @body    { email }
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Respond the same way whether or not the user exists, to avoid
    // leaking which emails are registered.
    if (!user) {
        return res.status(200).json({
            success: true,
            message: "If that email is registered, a reset code has been sent.",
        });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.status(200).json({
        success: true,
        message: "If that email is registered, a reset code has been sent.",
    });
});

/**
 * @desc    Reset password using the emailed OTP
 * @route   POST /api/auth/reset-password
 * @body    { email, otp, newPassword }
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new ApiError(400, "Email, otp and newPassword are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+resetPasswordOTP +resetPasswordExpires",
    );

    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
        throw new ApiError(400, "Invalid or expired reset code");
    }

    if (user.resetPasswordExpires < new Date()) {
        throw new ApiError(400, "Reset code has expired, please request a new one");
    }

    const isOTPValid = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isOTPValid) {
        throw new ApiError(400, "Invalid reset code");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password reset successful. You can now log in with your new password.",
    });
});

/**
 * @desc    Login or register a user via Google OAuth
 * @route   POST /api/auth/google-login
 * @body    { credential }  -- the Google ID token from the frontend
 */
export const googleLogin = asyncHandler(async (req, res) => {
    const { credential, idToken } = req.body;
    const token = credential || idToken;

    if (!token) {
        throw new ApiError(400, "Google credential/idToken is required");
    }

    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (error) {
        throw new ApiError(401, "Invalid Google token");
    }

    const { email, name, sub: googleId } = payload;

    if (!email) {
        throw new ApiError(400, "Google account did not return an email address");
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Random placeholder password — never used since this account
        // logs in only via Google, but the schema requires a password.
        const randomPassword = crypto.randomBytes(20).toString("hex");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = await User.create({
            name: name || email.split("@")[0],
            email,
            password: hashedPassword,
            authProvider: "google",
            googleId,
        });

        sendWelcomeEmail(user.email, user.name);
    } else if (!user.googleId) {
        // Existing local account logging in with Google for the first time —
        // link the accounts.
        user.googleId = googleId;
        if (user.authProvider === "local") user.authProvider = "google";
        await user.save();
    }

    const jwtToken = generateToken(user._id, user.role);

    res.status(200).json({
        success: true,
        message: "Google login successful",
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyaltyTier: user.loyaltyTier,
            },
            token: jwtToken,
        },
    });
});
