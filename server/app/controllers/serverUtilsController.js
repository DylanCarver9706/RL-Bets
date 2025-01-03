// app/controllers/serverUtilsController.js
const serverUtilsService = require("../services/serverUtilsService");

const testErrorLogger = async (req, res, logError) => {
  try {
    serverUtilsService.testErrorLogger();
    res.status(200).json({ message: "Test error logger executed successfully." });
  } catch (error) {
    logError(error);
  }
};

const checkServerStatus = async (req, res, logError) => {
  try {
    const status = serverUtilsService.checkServerStatus();
    res.status(200).json(status);
  } catch (error) {
    logError(error)
  }
};

module.exports = {
  testErrorLogger,
  checkServerStatus,
};
