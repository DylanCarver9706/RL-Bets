// PlaidService.js/identityVerificationService.js
import { getFirebaseIdToken } from "./firebaseService.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

// Generate Plaid Link token for IDV
export const generateLinkTokenForIDV = async (mongoUserId) => {
  try {
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/plaid/idv/link-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({
        mongoUserId: mongoUserId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate Link token: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating Plaid Link token:", error);
    throw error;
  }
};

// Notify server that IDV is complete
export const completeIDV = async (idvSession) => {
  try {
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/plaid/idv/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idvSession }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete IDV: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error completing IDV:", error);
    throw error;
  }
};

// Open Plaid IDV Link
export const openPlaidIDV = async (linkToken) => {
  return new Promise((resolve, reject) => {
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: async (publicToken, metadata) => {
        try {
          const result = await completeIDV(metadata.link_session_id); // Notify server that IDV is complete
          resolve(result); // Resolve only when the Plaid widget successfully completes
        } catch (error) {
          console.error("Error completing IDV:", error);
          reject(error);
        }
      },
      onExit: (err) => {
        console.error("Exited IDV early:", err);
        reject(new Error("Identity verification was not completed. Please try again."));
      },
    });

    // Open the Plaid widget
    handler.open();
  });
};

export const analyzeDocument = async (formData) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/openai/analyze`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${idToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to analyze image.");
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Error analyzing image:", error);
  }
};