const express = require("express");
const router = express.Router();
const dataTreesController = require("../controllers/dataTreeController");

router.get("/season/all", dataTreesController.getAllSeasons);
router.get("/season/:id", dataTreesController.getSeason);
router.get("/tournament/:id", dataTreesController.getTournament);
router.get("/series/:id", dataTreesController.getSeries);
router.get("/betable", dataTreesController.getBetable);

module.exports = router;
