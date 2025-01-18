const express = require("express");
const router = express.Router();
const logController = require("../controllers/logsController");

router.get("/", logController.getAllLogs);
router.get("/:id", logController.getLogById);
router.get("/notifications/user/:id", logController.getUserNotifications);
router.post("/", logController.createLog);
router.put("/:id", logController.updateLogById);
router.delete("/:id", logController.deleteLogById);
router.delete("/", logController.deleteAllLogs);

module.exports = router;
