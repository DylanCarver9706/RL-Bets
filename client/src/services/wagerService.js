const BASE_URL = process.env.REACT_APP_BASE_SERVER_URL; // Define your backend server URL

export const fetchWagers = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/wagers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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

// Fetch the data tree for a given season ID
export const fetchSeasonDataTree = async (seasonId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/data-trees/season/${seasonId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for season ID: ${seasonId}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching season data tree:", err.message);
    throw err;
  }
};