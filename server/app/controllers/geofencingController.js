const { reverseGeocode } = require("../services/geofencingService");

const handleReverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude (lat) and longitude (lon) are required." });
    }

    const result = await reverseGeocode(lat, lon);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching geolocation:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { handleReverseGeocode };
