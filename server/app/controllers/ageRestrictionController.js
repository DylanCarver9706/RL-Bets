const { checkLegalAge } = require("../services/ageRestrictionService");

const handleCheckLegalAge = (req, res, logError) => {
  try {
    const { state, DOB } = req.body;

    if (!state || !DOB) {
      return res.status(400).json({ error: "State and DOB are required." });
    }

    const result = checkLegalAge(state, DOB);

    if (!result.isAllowed) {
      return res.json({
        isAllowed: false,
        message: `Due to state law, you must be at least ${result.minAge} years old in ${state}.`,
      });
    }

    res.json({ isAllowed: true, message: "User is allowed to make wagers." });
  } catch (error) {
    logError(error);
  }
};

module.exports = { handleCheckLegalAge };
