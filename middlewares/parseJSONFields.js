/**
 * Multer parses multipart/form-data fields as plain strings.
 * When the frontend sends a nested object (e.g. title: {en, bn})
 * via FormData, it arrives JSON.stringify-ed. This middleware
 * parses the specified fields back into real objects before the
 * controller/validation runs.
 */
const parseJSONFields = (fields) => (req, res, next) => {
    fields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
            try {
                req.body[field] = JSON.parse(req.body[field]);
            } catch (error) {
                // Leave as-is; downstream validation will reject it with a clear message
                console.error(`[ERROR] Failed to parse JSON field: ${field}`);
            }
        }
    });
    next();
};

export default parseJSONFields;
