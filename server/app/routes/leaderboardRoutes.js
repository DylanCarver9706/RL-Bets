const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.get("/current", verifyFirebaseToken, leaderboardController.getCurrentLeaderboard);
router.get("/lifetime", verifyFirebaseToken, leaderboardController.getLifetimeLeaderboard);
router.get("/", verifyFirebaseToken, leaderboardController.getAllLeaderboards);
router.get("/:id", verifyFirebaseToken, leaderboardController.getLeaderboardById);
router.post("/", verifyFirebaseToken, leaderboardController.createLeaderboard);
router.put("/:id", verifyFirebaseToken, leaderboardController.updateLeaderboard);
router.delete("/:id", verifyFirebaseToken, leaderboardController.deleteLeaderboard);

module.exports = router;
