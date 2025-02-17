const express = require("express");
const router = express.Router();
const logController = require("../controllers/logsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Log Routes
router.get("/", verifyFirebaseToken(true), logController.getAllLogs);
router.get("/:id", verifyFirebaseToken(true), logController.getLogById);
router.get("/notifications/user/:id", verifyFirebaseToken(), logController.getUserNotifications);
router.post("/", verifyFirebaseToken(true), logController.createLog);
router.put("/:id", verifyFirebaseToken(true), logController.updateLogById);
router.delete("/:id", verifyFirebaseToken(true), logController.deleteLogById);
router.delete("/", verifyFirebaseToken(true), logController.deleteAllLogs);

module.exports = router;
