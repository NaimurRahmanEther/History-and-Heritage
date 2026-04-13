function sendSuccess(res, payload = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...payload,
  });
}

function sendError(res, message = "Something went wrong.", statusCode = 500, details) {
  return res.status(statusCode).json({
    success: false,
    message,
    details,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};

