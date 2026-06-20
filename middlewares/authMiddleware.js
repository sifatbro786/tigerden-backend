import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";

/**
 * Verifies the JWT from the Authorization header and attaches
 * the authenticated user (minus password) to req.user.
 */
export const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        throw new ApiError(401, "Not authorized, no token provided");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new ApiError(401, "User no longer exists");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Not authorized, invalid or expired token");
    }
});
