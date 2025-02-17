import { getFirebaseIdToken } from "./firebaseService.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

export const fetchCurrentLeaderboard = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/leaderboards/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data for current leaderboard`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching current leaderboard data:", err.message);
    throw err;
  }
};

export const fetchCurrentTournament = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/tournaments/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data for current tournaments`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching current tournaments data:", err.message);
    throw err;
  }
};

export const fetchLifetimeLeaderboard = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/leaderboards/lifetime`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data for lifetime leaderboard`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching lifetime leaderboard data:", err.message);
    throw err;
  }
};