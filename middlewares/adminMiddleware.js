import ApiError from "../utils/ApiError.js";

/**
 * Must run AFTER authMiddleware. Allows both "admin" and "super_admin"
 * to pass. Fine-grained checks (e.g. only super_admin can promote someone
 * to super_admin) are handled inside the relevant controller, since the
 * route itself is shared between both roles.
 */
export const adminMiddleware = (req, res, next) => {
    if (!req.user || !["admin", "super_admin"].includes(req.user.role)) {
        return next(new ApiError(403, "Access denied: Admins only"));
    }
    next();
};
