const { AppError } = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  const requestId = req.requestId;

  // Prisma unique constraint
  if (err && err.code === "P2002") {
    return res.status(409).json({
      error: {
        code: "CONFLICT",
        message: "Resource already exists",
        details: err.meta || null,
        requestId,
      },
    });
  }

  // Our explicit AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Fallback
  console.error(err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Server error",
      details: null,
      requestId,
    },
  });
}

module.exports = { errorHandler };