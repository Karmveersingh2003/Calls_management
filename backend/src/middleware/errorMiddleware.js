

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Central Error Handler
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

// Support both named and default imports
module.exports = {
  notFoundHandler,
  errorHandler
};
module.exports.notFoundHandler = notFoundHandler;
module.exports.errorHandler = errorHandler;

