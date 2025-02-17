const express = require("express");
const router = express.Router();
const playersController = require("../controllers/playersController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Player Routes
router.post("/", verifyFirebaseToken(true), playersController.create);
router.get("/", verifyFirebaseToken(), playersController.getAll);
router.get("/:id", verifyFirebaseToken(true), playersController.getById);
router.put("/:id", verifyFirebaseToken(true), playersController.update);
router.delete("/:id", verifyFirebaseToken(true), playersController.remove);

module.exports = router;
