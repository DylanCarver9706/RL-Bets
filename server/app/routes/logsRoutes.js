const express = require("express");
const router = express.Router();
const logController = require("../controllers/logsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Log Routes
router.get("/", verifyFirebaseToken, logController.getAllLogs);
router.get("/:id", verifyFirebaseToken, logController.getLogById);
router.get("/notifications/user/:id", verifyFirebaseToken, logController.getUserNotifications);
router.post("/", verifyFirebaseToken, logController.createLog);
router.put("/:id", verifyFirebaseToken, logController.updateLogById);
router.delete("/:id", verifyFirebaseToken, logController.deleteLogById);
router.delete("/", verifyFirebaseToken, logController.deleteAllLogs);

module.exports = router;
