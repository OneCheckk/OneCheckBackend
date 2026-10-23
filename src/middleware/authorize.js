const ApiError = require('../utils/ApiError');

/**
 * Enforces role-based access control
 * @param {...string} allowedRoles - Roles permitted to access the route
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden: Role '${req.user.role}' is not authorized to perform this operation.`
        )
      );
    }

    next();
  };
}

module.exports = {
  authorize
};
