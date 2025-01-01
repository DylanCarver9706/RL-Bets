const express = require("express");
const router = express.Router();
const { handleReverseGeocode } = require("../controllers/geofencingController");

router.post("/reverse-geocode", handleReverseGeocode);

module.exports = router;
