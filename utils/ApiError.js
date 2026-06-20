/**
 * Custom error class for predictable, operational errors.
 * Lets controllers throw errors with explicit HTTP status codes.
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;
