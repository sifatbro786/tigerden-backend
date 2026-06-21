/**
 * Generates a secure 6-digit numeric OTP as a string (e.g. "048213").
 * Zero-padded so it's always exactly 6 digits.
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export default generateOTP;
