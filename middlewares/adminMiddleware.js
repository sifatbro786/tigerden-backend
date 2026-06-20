import ApiError from "../utils/ApiError.js";

/**
 * Must run AFTER authMiddleware. Ensures the authenticated user
 * has the "admin" role before allowing access to a route.
 */
export const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return next(new ApiError(403, "Access denied: Admins only"));
    }
    next();
};
