const express = require("express");
const router = express.Router();
const matchesController = require("../controllers/matchesController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Match Routes
router.post("/match_concluded/:id", verifyFirebaseToken, matchesController.concludeMatch);
router.post("/first_blood/:id", verifyFirebaseToken, matchesController.firstBlood);
router.post("/", verifyFirebaseToken, matchesController.create);
router.get("/", verifyFirebaseToken, matchesController.getAll);
router.get("/:id", verifyFirebaseToken, matchesController.getById);
router.put("/:id", verifyFirebaseToken, matchesController.update);
router.delete("/:id", verifyFirebaseToken, matchesController.remove);

module.exports = router;
