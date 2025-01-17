const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");

router.get("/current", leaderboardController.getCurrentLeaderboard);
router.get("/lifetime", leaderboardController.getLifetimeLeaderboard);
router.get("/", leaderboardController.getAllLeaderboards);
router.get("/:id", leaderboardController.getLeaderboardById);
router.post("/", leaderboardController.createLeaderboard);
router.put("/:id", leaderboardController.updateLeaderboard);
router.delete("/:id", leaderboardController.deleteLeaderboard);

module.exports = router;
