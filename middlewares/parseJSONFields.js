// parseJSONFields.js - Enhanced Version

import ApiError from "../utils/ApiError.js";

const parseJSONFields = (fields) => (req, res, next) => {
  const errors = [];

  fields.forEach((field) => {
    if (req.body[field] && typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        errors.push({
          field,
          error: error.message,
          value: req.body[field].substring(0, 100) // Truncate for logging
        });
      }
    }
  });

  if (errors.length > 0) {
    console.error('[PARSE_ERROR] JSON parsing failed for fields:', errors);
    // Return partial success with warning, or fail the request
    // Option 1: Fail the request
    // return next(new ApiError(400, `Failed to parse JSON fields: ${errors.map(e => e.field).join(', ')}`));
    
    // Option 2: Continue with warning (for development)
    console.warn('[PARSE_WARNING] Continuing with unparsed fields:', errors.map(e => e.field));
  }

  next();
};

export default parseJSONFields;