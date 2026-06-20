import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT containing the user's id and role.
 */
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

export default generateToken;
