// PlaidService.js/identityVerificationService.js
import { makeAuthenticatedRequest } from "./authService";

// Generate Plaid Link token for IDV
export const generateLinkTokenForIDV = async (mongoUserId) => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/plaid/idv/link-token",
      {
        method: "POST",
        body: JSON.stringify({ mongoUserId }),
      }
    );

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
    const response = await makeAuthenticatedRequest("/api/plaid/idv/complete", {
      method: "POST",
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
          const result = await completeIDV(metadata.link_session_id);
          resolve(result);
        } catch (error) {
          console.error("Error completing IDV:", error);
          reject(error);
        }
      },
      onExit: (err) => {
        console.error("Exited IDV early:", err);
        reject(
          new Error(
            "Identity verification was not completed. Please try again."
          )
        );
      },
    });

    handler.open();
  });
};

export const analyzeDocument = async (formData) => {
  try {
    const response = await makeAuthenticatedRequest("/api/openai/analyze", {
      method: "POST",
      headers: {
        // Remove Content-Type header to let browser set it with boundary for FormData
        "Content-Type": undefined,
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
    throw error;
  }
};
