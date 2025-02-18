const unitedStatesLegalStates = {
  "Alabama": {
    "legal": false,
    "minAge": null
  },
  "Alaska": {
    "legal": false,
    "minAge": null
  },
  "Arizona": {
    "legal": true,
    "minAge": 21
  },
  "Arkansas": {
    "legal": true,
    "minAge": 21
  },
  "California": {
    "legal": false,
    "minAge": null
  },
  "Colorado": {
    "legal": true,
    "minAge": 21
  },
  "Connecticut": {
    "legal": true,
    "minAge": 21
  },
  "Delaware": {
    "legal": true,
    "minAge": 21
  },
  "Florida": {
    "legal": false,
    "minAge": null
  },
  "Georgia": {
    "legal": false,
    "minAge": null
  },
  "Hawaii": {
    "legal": false,
    "minAge": null
  },
  "Idaho": {
    "legal": false,
    "minAge": null
  },
  "Illinois": {
    "legal": true,
    "minAge": 21
  },
  "Indiana": {
    "legal": true,
    "minAge": 21
  },
  "Iowa": {
    "legal": true,
    "minAge": 21
  },
  "Kansas": {
    "legal": true,
    "minAge": 21
  },
  "Kentucky": {
    "legal": true,
    "minAge": 21
  },
  "Louisiana": {
    "legal": true,
    "minAge": 21
  },
  "Maine": {
    "legal": false,
    "minAge": null
  },
  "Maryland": {
    "legal": true,
    "minAge": 21
  },
  "Massachusetts": {
    "legal": true,
    "minAge": 21
  },
  "Michigan": {
    "legal": true,
    "minAge": 21
  },
  "Minnesota": {
    "legal": false,
    "minAge": null
  },
  "Mississippi": {
    "legal": false,
    "minAge": null
  },
  "Missouri": {
    "legal": true,
    "minAge": 21
  },
  "Montana": {
    "legal": false,
    "minAge": null
  },
  "Nebraska": {
    "legal": false,
    "minAge": null
  },
  "Nevada": {
    "legal": true,
    "minAge": 21
  },
  "New Hampshire": {
    "legal": true,
    "minAge": 18
  },
  "New Jersey": {
    "legal": true,
    "minAge": 21
  },
  "New Mexico": {
    "legal": false,
    "minAge": null
  },
  "New York": {
    "legal": true,
    "minAge": 21
  },
  "North Carolina": {
    "legal": false,
    "minAge": null
  },
  "North Dakota": {
    "legal": false,
    "minAge": null
  },
  "Ohio": {
    "legal": true,
    "minAge": 21
  },
  "Oklahoma": {
    "legal": false,
    "minAge": null
  },
  "Oregon": {
    "legal": true,
    "minAge": 21
  },
  "Pennsylvania": {
    "legal": true,
    "minAge": 21
  },
  "Rhode Island": {
    "legal": true,
    "minAge": 18
  },
  "South Carolina": {
    "legal": false,
    "minAge": null
  },
  "South Dakota": {
    "legal": false,
    "minAge": null
  },
  "Tennessee": {
    "legal": true,
    "minAge": 21
  },
  "Texas": {
    "legal": false,
    "minAge": null
  },
  "Utah": {
    "legal": false,
    "minAge": null
  },
  "Vermont": {
    "legal": false,
    "minAge": null
  },
  "Virginia": {
    "legal": true,
    "minAge": 21
  },
  "Washington": {
    "legal": false,
    "minAge": null
  },
  "West Virginia": {
    "legal": true,
    "minAge": 21
  },
  "Wisconsin": {
    "legal": false,
    "minAge": null
  },
  "Wyoming": {
    "legal": true,
    "minAge": 18
  }
}

const isOldEnough = (dob, minAge) => {
  if (!dob || !minAge) return false;

  const birthDate = new Date(dob);
  if (isNaN(birthDate)) return false;

  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const isBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  const actualAge = isBirthdayPassed ? age : age - 1;

  return actualAge >= minAge;
};

const checkLegalAge = (state, dob) => {
  const stateInfo = unitedStatesLegalStates?.[state];
  if (!stateInfo) {
    throw new Error("Invalid state");
  }

  const isAllowed = isOldEnough(dob, stateInfo.minAge);
  return { isAllowed, minAge: stateInfo.minAge };
};

module.exports = { checkLegalAge, unitedStatesLegalStates };
