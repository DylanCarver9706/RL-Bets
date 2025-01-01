const unitedStatesLegalStates = require(process.env.UNITED_STATES_LEGAL_STATES_PATH);

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

module.exports = { checkLegalAge };
