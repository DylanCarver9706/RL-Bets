const fetch = require("node-fetch");
const unitedStatesLegalStates = require(process.env.UNITED_STATES_LEGAL_STATES_PATH);

const reverseGeocode = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Nominatim API failed with status: ${response.status}`);
  }

  const data = await response.json();

  // Only process US states
  if (data?.address?.country_code !== "us") {
    throw new Error("Only available in the United States.");
  }

  const state = data?.address?.state;
  const isAllowed = unitedStatesLegalStates?.[state]?.legal;

  return { state, allowed: isAllowed, fullAddress: data.display_name };
};

module.exports = { reverseGeocode };
