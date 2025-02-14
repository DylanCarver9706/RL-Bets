const express = require("express");
const router = express.Router();
const geofencingController = require("../controllers/geofencingController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Route to handle reverse geocoding
router.post("/reverse-geocode", verifyFirebaseToken, geofencingController.handleReverseGeocode);

module.exports = router;
