import { getFirebaseIdToken } from "./firebaseService.js";

const BASE_URL = process.env.REACT_APP_BASE_SERVER_URL;

export const createJiraIssue = async (userName, userEmail, mongoUserId, issueType, summary, description, status) => {
    try {

        const idToken = await getFirebaseIdToken();

      const response = await fetch(`${BASE_URL}/api/jira/create-issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Include the token in the headers
        },
        body: JSON.stringify({ userName, userEmail, mongoUserId, issueType, summary, description, status }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to create Jira email update issue.");
      }
  
      return response;
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
  