const express = require("express");
const router = express.Router();
const playersController = require("../controllers/playersController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Player Routes
router.post("/", verifyFirebaseToken, playersController.create);
router.get("/", verifyFirebaseToken, playersController.getAll);
router.get("/:id", verifyFirebaseToken, playersController.getById);
router.put("/:id", verifyFirebaseToken, playersController.update);
router.delete("/:id", verifyFirebaseToken, playersController.remove);

module.exports = router;
