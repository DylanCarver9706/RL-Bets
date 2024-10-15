import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext.js";
import { fetchWagers } from "../services/wagerService.js";

const Home = () => {
  const { mongoUserId } = useUser(); // Get the MongoDB user ID from context
  const [wagers, setWagers] = useState([]); // State to hold the list of wagers
  const [usersWagers, setUsersWagers] = useState([]);
  const [userWagerView, setUserWagerView] = useState(false)

  console.log("Mongo User ID: ", mongoUserId);

  // Fetch all wagers when the component mounts
  useEffect(() => {
    // Define an async function inside useEffect
    const getWagers = async () => {
      const allWagers = await fetchWagers();
      setWagers(allWagers || []); // Set fetched wagers in state or an empty array if undefined

      // console.log("Wagers: ", wagers);

      const allUsersWagers = allWagers.filter((wager) => wager.creator === mongoUserId)

      setUsersWagers(allUsersWagers || []);

  
      // console.log("Users Wagers: ", usersWagers);

    };

    // Call the async function
    getWagers();
  }, [mongoUserId]);

  const toggleWagerView = () => {
    setUserWagerView(!userWagerView);
  }

  return (
    <div>
      <h2>Welcome to the Home Page (Protected)</h2>
      <hr />

      {userWagerView ? (
        <div>
          <div>
            <button onClick={() => toggleWagerView()}>View All Wagers</button>
          </div>
        <h3>User Wagers</h3>
        <ul>
          {usersWagers.length === 0 ? (
            <p>No wagers created by user.</p>
          ) : (
            usersWagers.map((wager) => (
              <li key={wager._id}>
                <strong>Wager ID:</strong> {wager._id} <br />
                <strong>Creator:</strong> {wager.creator} <br />
                <strong>Wager Name:</strong> {wager.name} <br />
                <hr />
              </li>
            ))
          )}
        </ul>
      </div>
      ) : (
        <div>
          <div>
            <button onClick={() => toggleWagerView()}>View Your Wagers</button>
          </div>
          <h3>All Wagers</h3>
          <ul>
            {wagers.length === 0 ? (
              <p>No wagers available.</p>
            ) : (
              wagers.map((wager) => (
                <li key={wager._id}>
                  <strong>Wager ID:</strong> {wager._id} <br />
                  <strong>Creator:</strong> {wager.creator} <br />
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
