const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/** Runs after a validation chain; turns failures into a 422 ApiError. */
function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    next(new ApiError(422, errors[0].message, errors));
  };
}

module.exports = { validate };
