const express = require("express");
const router = express.Router();
const tournamentsController = require("../controllers/tournamentsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Tournament Routes
router.post("/", verifyFirebaseToken, tournamentsController.create);
router.get("/", verifyFirebaseToken, tournamentsController.getAll);
router.get("/current", verifyFirebaseToken, tournamentsController.getCurrent);
router.get("/:id", verifyFirebaseToken, tournamentsController.getById);
router.put("/:id", verifyFirebaseToken, tournamentsController.update);
router.delete("/:id", verifyFirebaseToken, tournamentsController.remove);

module.exports = router;
