/**
 * Wraps async route handlers so any thrown error / rejected promise
 * is automatically forwarded to Express's error-handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
