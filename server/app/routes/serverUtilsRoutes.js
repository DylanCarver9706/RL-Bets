const express = require("express");
const router = express.Router();
const serverUtilsController = require("../controllers/serverUtilsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Route to test the error logger
router.get("/test-error-logger", verifyFirebaseToken, serverUtilsController.testErrorLogger);

// Route to check server status
router.get("/status", verifyFirebaseToken, serverUtilsController.checkServerStatus);

module.exports = router;
