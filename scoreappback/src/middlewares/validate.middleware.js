const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    // Create a readable error message from the first error
    const firstError = errors.array()[0];
    const errorMessage = `${firstError.msg} (${firstError.path})`;

    return next(new ApiError(400, errorMessage, extractedErrors));
};

module.exports = validate;
