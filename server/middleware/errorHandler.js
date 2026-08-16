// Standardized JSON Error Handling Middleware for ScrollNom Backend

export const errorHandler = (err, req, res, next) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.message || 'An unexpected server error occurred.';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage
    }
  });
};
