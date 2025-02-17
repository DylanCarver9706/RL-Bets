const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/teamsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Team Routes
router.post("/", verifyFirebaseToken(true), teamsController.create);
router.get("/with_players", verifyFirebaseToken(), teamsController.getAllAndPlayers);
router.get("/", verifyFirebaseToken(), teamsController.getAll);
router.get("/:id", verifyFirebaseToken(true), teamsController.getById);
router.put("/:id", verifyFirebaseToken(true), teamsController.update);
router.delete("/:id", verifyFirebaseToken(true), teamsController.remove);

module.exports = router;
