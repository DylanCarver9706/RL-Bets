// app/routes/serverUtilsRoutes.js
const express = require("express");
const router = express.Router();
const serverUtilsController = require("../controllers/serverUtilsController");

// Route to test the error logger
router.get("/test-error-logger", serverUtilsController.testErrorLogger);

// Route to check server status
router.get("/status", serverUtilsController.checkServerStatus);

module.exports = router;
