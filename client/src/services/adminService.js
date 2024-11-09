const BASE_URL = process.env.REACT_APP_BASE_SERVER_URL; // Define your backend server URL

// Fetch the data tree for a given season ID
export const fetchAllSeasonsDataTree = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/data-trees/season/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch data tree for all seasons`);
      }
  
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching season data tree:", err.message);
      throw err;
    }
  };