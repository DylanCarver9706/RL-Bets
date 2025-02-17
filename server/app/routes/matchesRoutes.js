const express = require("express");
const router = express.Router();
const matchesController = require("../controllers/matchesController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Match Routes
router.post("/match_concluded/:id", verifyFirebaseToken(true), matchesController.concludeMatch);
router.post("/first_blood/:id", verifyFirebaseToken(true), matchesController.firstBlood);
router.post("/", verifyFirebaseToken(true), matchesController.create);
router.get("/", verifyFirebaseToken(true), matchesController.getAll);
router.get("/:id", verifyFirebaseToken(true), matchesController.getById);
router.put("/:id", verifyFirebaseToken(true), matchesController.update);
router.delete("/:id", verifyFirebaseToken(true), matchesController.remove);

module.exports = router;
