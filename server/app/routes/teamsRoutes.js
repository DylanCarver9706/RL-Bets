const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/teamsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Team Routes
router.post("/", verifyFirebaseToken, teamsController.create);
router.get("/", verifyFirebaseToken, teamsController.getAll);
router.get("/:id", verifyFirebaseToken, teamsController.getById);
router.put("/:id", verifyFirebaseToken, teamsController.update);
router.delete("/:id", verifyFirebaseToken, teamsController.remove);

module.exports = router;
