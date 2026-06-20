import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Attempts to authenticate the request. Unlike authMiddleware, this
 * NEVER throws — if no token or an invalid token is provided, it simply
 * proceeds without req.user. Useful for routes like "apply coupon" where
 * loyalty discounts are a bonus for logged-in users but not required.
 */
export const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) req.user = user;
        }
    } catch (error) {
        // Silently ignore — treat as unauthenticated
    }
    next();
};
