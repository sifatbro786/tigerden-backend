import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const VALID_ROLES = ["user", "admin", "super_admin"];

/**
 * @desc    Get all users (for admin user-management table)
 * @route   GET /api/admin/users
 * @access  Private/Admin or Super Admin
 *
 * Sort order: super_admin → admin → user (role priority),
 * then newest-first within each role group.
 */
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.aggregate([
        {
            $addFields: {
                roleOrder: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$role", "super_admin"] }, then: 0 },
                            { case: { $eq: ["$role", "admin"] }, then: 1 },
                            { case: { $eq: ["$role", "user"] }, then: 2 },
                        ],
                        default: 3,
                    },
                },
            },
        },
        { $sort: { roleOrder: 1, createdAt: -1 } },
        { $project: { password: 0, resetPasswordOTP: 0, resetPasswordExpires: 0, roleOrder: 0 } },
    ]);

    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
});

/**
 * @desc    Change a user's role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin or Super Admin
 * @body    { role: "user" | "admin" | "super_admin" }
 *
 * Rule: promoting someone to "super_admin" is only allowed if the
 * REQUESTER is already a super_admin. A regular "admin" can promote
 * users to "admin" (or demote to "user"), but cannot mint new
 * super_admins.
 */
export const changeUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const { id } = req.params;

    if (!role || !VALID_ROLES.includes(role)) {
        throw new ApiError(400, `Role must be one of: ${VALID_ROLES.join(", ")}`);
    }

    if (role === "super_admin" && req.user.role !== "super_admin") {
        throw new ApiError(403, "Only a super admin can promote a user to super admin");
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
        throw new ApiError(404, "User not found");
    }

    // Prevent a non-super-admin from demoting/modifying a super_admin account
    if (targetUser.role === "super_admin" && req.user.role !== "super_admin") {
        throw new ApiError(403, "Only a super admin can modify another super admin's role");
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
        success: true,
        message: `User role updated to "${role}"`,
        data: {
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
        },
    });
});

/**
 * @desc    Allow an authenticated admin/super_admin to change their own password
 * @route   POST /api/admin/change-password
 * @access  Private/Admin or Super Admin
 * @body    { oldPassword, newPassword }
 */
export const changeAdminPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "oldPassword and newPassword are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters");
    }

    // req.user (from authMiddleware) doesn't include the password field,
    // so we re-fetch it explicitly.
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new ApiError(401, "Old password is incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed successfully",
    });
});
