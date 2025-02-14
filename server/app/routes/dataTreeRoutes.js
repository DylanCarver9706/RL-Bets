const express = require("express");
const router = express.Router();
const dataTreesController = require("../controllers/dataTreeController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.get("/tournament/all", verifyFirebaseToken, dataTreesController.getAllTournaments);
router.get("/tournament/current", verifyFirebaseToken, dataTreesController.getCurrentDataTree);
router.get("/tournament/ended", verifyFirebaseToken, dataTreesController.getEndedTournaments);
router.get("/tournament/:id", verifyFirebaseToken, dataTreesController.getTournament);
router.get("/series/:id", verifyFirebaseToken, dataTreesController.getSeries);
router.get("/bettable", verifyFirebaseToken, dataTreesController.getBettable);

module.exports = router;
