// Wraps an async route handler so thrown errors flow into next() and the
// global error handler instead of becoming unhandled rejections.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
