const {
    fetchLatestPrivacyPolicy,
    fetchLatestTermsOfService,
  } = require("../services/agreementsService");
  
  // Controller to get the latest Privacy Policy
  const getLatestPrivacyPolicy = async (req, res) => {
    try {
      const privacyPolicy = await fetchLatestPrivacyPolicy();
      res.status(200).json(privacyPolicy);
    } catch (error) {
      console.error("Error retrieving Privacy Policy:", error.message);
      res.status(500).json({ error: "Failed to retrieve Privacy Policy" });
    }
  };
  
  // Controller to get the latest Terms of Service
  const getLatestTermsOfService = async (req, res) => {
    try {
      const termsOfService = await fetchLatestTermsOfService();
      res.status(200).json(termsOfService);
    } catch (error) {
      console.error("Error retrieving Terms of Service:", error.message);
      res.status(500).json({ error: "Failed to retrieve Terms of Service" });
    }
  };
  
  module.exports = {
    getLatestPrivacyPolicy,
    getLatestTermsOfService,
  };
  