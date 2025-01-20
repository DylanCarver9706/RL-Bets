import { getFirebaseIdToken } from "./firebaseService";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL; // Define your backend server URL

export const fetchAllTournamentsDataTree = async () => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/data-trees/tournament/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for all tournaments`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching tournament data tree:", err.message);
    throw err;
  }
};

export const fetchCurrentTournamentDataTree = async () => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/data-trees/tournament/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for current tournament`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching current tournament data tree:", err.message);
    throw err;
  }
};

export const fetchEndedTournamentDataTree = async () => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/data-trees/tournament/ended`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for ended tournament`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching ended tournament data tree:", err.message);
    throw err;
  }
};

export const fetchPlayers = async () => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/players`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all players`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching all players:", err.message);
    throw err;
  }
};

// Generic function to update a document by ID
const updateDocumentById = async (endpoint, id, updateData) => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/${endpoint}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${endpoint} with ID: ${id}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error updating ${endpoint} with ID ${id}:`, err.message);
    throw err;
  }
};

// Update a tournament by ID
export const updateTournamentById = async (id, updateData) => {
  return updateDocumentById("tournaments", id, updateData);
};

// Update a series by ID
export const updateSeriesById = async (id, updateData) => {
  return updateDocumentById("series", id, updateData);
};

// Update a match by ID
export const updateMatchById = async (id, updateData) => {
  return updateDocumentById("matches", id, updateData);
};

export const updateMatchResults = async (matchId, updateData) => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/matches/match_concluded/${matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update match results for match ID: ${matchId}`);
    }
    const data = await response.json();
    return data;
    } catch (err) {
    console.error(`Error updating match results for match ID ${matchId}:`, err.message);
    throw err;
    }
};

export const createSeries = async (seriesData) => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/series`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(seriesData),
    });

    if (!response.ok) {
      throw new Error("Failed to create series");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating series:", err.message);
    throw err;
  }
};

export const updateFirstBlood = async (matchId, updateData) => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/matches/first_blood/${matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update first blood for match ID: ${matchId}`);
    }
    const data = await response.json();
    return data;
    } catch (err) {
    console.error(`Error updating first blood for match ID ${matchId}:`, err.message);
    throw err;
    }
};

export const getUsers = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch users.");
    }

    return data; // Return the users data
  } catch (err) {
    console.error("Error fetching users:", err.message);
    throw err;
  }
}

export const sendEmailToUsers = async (users, subject, body) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/users/send_admin_email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({
        users: users,
        subject: subject,
        body: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send admin email.");
    }

    return data;
  } catch (err) {
    console.error("Error sending admin email:", err.message);
    throw err;
  }
};