import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext.js";
import { fetchWagers } from "../services/wagerService.js";

const Home = () => {
  const { mongoUserId } = useUser(); // Get the MongoDB user ID from context
  const [wagers, setWagers] = useState([]); // State to hold the list of wagers
  const [loading, setLoading] = useState(true); // Loading state

  console.log("Mongo User ID: ", mongoUserId);

  // Fetch all wagers when the component mounts
  useEffect(() => {
    // Define an async function inside useEffect
    const getWagers = async () => {
      const wagers = await fetchWagers();
      setWagers(wagers || []); // Set fetched wagers in state or an empty array if undefined
      setLoading(false); // Set loading to false after data is fetched
    };

    // Call the async function
    getWagers();
  }, []); // Empty dependency array to run once on mount

  return (
    <div>
      <h2>Welcome to the Home Page (Protected)</h2>
      <hr />

      {loading ? (
        <p>Loading wagers...</p>
      ) : (
        <div>
          <h3>All Wagers</h3>
          <ul>
            {wagers.length === 0 ? (
              <p>No wagers available.</p>
            ) : (
              wagers.map((wager) => (
                <li key={wager._id}>
                  <strong>Wager ID:</strong> {wager._id} <br />
                  <strong>Wager Name:</strong> {wager.name} <br />
                  <hr />
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Home;
