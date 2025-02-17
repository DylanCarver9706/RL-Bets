import { getFirebaseIdToken } from "./firebaseService.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL; // Define your backend server URL

// Add cache constants at the top of the file
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const fetchWagers = async () => {
  try {
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/wagers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch wagers");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching wagers:", err.message);
  }
};

// Create wager
export const createWager = async (body) => {
  try {
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/wagers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to create wager");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating wager:", err.message);
  }
};

// Create bet
export const createBet = async (body) => {
  try {
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to create bet");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating bet:", err.message);
  }
};

// Updated fetchTeams function
export const fetchTeams = async () => {
  try {
    // Check cache first
    const cache = localStorage.getItem("teamsCache");
    if (cache) {
      const { data, timestamp } = JSON.parse(cache);
      const isValid = Date.now() - timestamp < CACHE_DURATION;

      if (isValid) {
        return data;
      }
    }

    // If no cache or cache expired, fetch new data
    const idToken = await getFirebaseIdToken();
    const response = await fetch(`${BASE_SERVER_URL}/api/teams/with_players`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch teams`);
    }

    const data = await response.json();

    // Update cache
    localStorage.setItem(
      "teamsCache",
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );

    return data;
  } catch (err) {
    console.error("Error fetching teams:", err.message);
    throw err;
  }
};

export const fetchBettableObjects = async () => {
  try {
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/data-trees/bettable`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching data tree:", err.message);
    throw err;
  }
};

export const capitalize = (str) => {
  if (!str) return ""; // Handle empty or null strings
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
