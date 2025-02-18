import { getFirebaseIdToken } from "./firebaseService";

// Base configuration
const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

// Helper function to make authenticated requests
export const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const idToken = await getFirebaseIdToken();
  
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${idToken}`,
  };

  return fetch(`${BASE_SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
}; 