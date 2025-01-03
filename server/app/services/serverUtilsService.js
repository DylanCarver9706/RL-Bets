// app/services/serverUtilsService.js
const testErrorLogger = () => {
  // Intentionally throw an error for testing purposes
  throw new Error("This is a test error for the errorLogger middleware.");
};

const checkServerStatus = () => {
  // Return a simple message indicating server status
  return { status: "active", message: "The server is running." };
};

module.exports = {
  testErrorLogger,
  checkServerStatus,
};
