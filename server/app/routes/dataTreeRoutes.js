const express = require("express");
const router = express.Router();
const dataTreesController = require("../controllers/dataTreeController");

router.get("/tournament/all", dataTreesController.getAllTournaments);
router.get("/tournament/current", dataTreesController.getCurrentDataTree);
router.get("/tournament/:id", dataTreesController.getTournament);
router.get("/series/:id", dataTreesController.getSeries);
router.get("/bettable", dataTreesController.getBettable);

module.exports = router;
