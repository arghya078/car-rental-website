
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error Handler
const errorHandler = (err, req, res, next) => {
  
  if (err.message && err.message.includes("Only")) {
    return res.status(400).json({
      message: err.message, 
    });
  }

  // Default handler
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
