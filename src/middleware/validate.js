const ApiError = require('../utils/ApiError');

/**
 * Higher-order middleware to run a validator function on req
 * @param {Function} validatorFn - Function receiving req that returns an array of error objects: [{ field, message }]
 */
function validate(validatorFn) {
  return (req, res, next) => {
    try {
      const errors = validatorFn(req);
      if (errors && errors.length > 0) {
        return next(ApiError.badRequest('Validation failed for one or more fields.', errors));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
