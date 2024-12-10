import { getFirebaseIdToken } from "./firebaseService.js";

const BASE_URL = process.env.REACT_APP_BASE_SERVER_URL;

export const createEmailUpdateRequest = async (userName, userEmail) => {
    try {

        const idToken = await getFirebaseIdToken();

      const response = await fetch(`${BASE_URL}/api/jira/email-update-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Include the token in the headers
        },
        body: JSON.stringify({ userName, userEmail }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to create Jira email update issue.");
      }
  
      return response;
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
  