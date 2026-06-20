import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import { sendWelcomeEmail } from "../services/emailService.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
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

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
    });

    // Fire-and-forget welcome email; does not block registration response
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
 * @access  Public
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
 * @access  Private
 */
export const getMyProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});
