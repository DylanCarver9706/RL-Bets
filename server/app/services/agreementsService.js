const fs = require("fs");
const path = require("path");

// Helper to find the latest version file in a directory
const getLatestVersionFile = (directory) => {
  const files = fs.readdirSync(directory);
  const versionedFiles = files
    .filter((file) => file.match(/v\d+\.json$/)) // Match files with version numbers
    .sort((a, b) => {
      const versionA = parseInt(a.match(/v(\d+)/)[1], 10);
      const versionB = parseInt(b.match(/v(\d+)/)[1], 10);
      return versionB - versionA; // Sort descending
    });

  if (versionedFiles.length === 0) {
    throw new Error("No versioned files found in directory: " + directory);
  }

  return path.join(directory, versionedFiles[0]);
};

// Fetch the latest Privacy Policy
const fetchLatestPrivacyPolicy = async () => {
  const privacyPolicyPath = getLatestVersionFile(
    path.join(__dirname, "../../../agreements/Privacy_Policy")
  );
  const data = fs.readFileSync(privacyPolicyPath, "utf8");
  return JSON.parse(data);
};

// Fetch the latest Terms of Service
const fetchLatestTermsOfService = async () => {
  const termsOfServicePath = getLatestVersionFile(
    path.join(__dirname, "../../../agreements/Terms_of_Service")
  );
  const data = fs.readFileSync(termsOfServicePath, "utf8");
  return JSON.parse(data);
};

module.exports = {
  fetchLatestPrivacyPolicy,
  fetchLatestTermsOfService,
};
