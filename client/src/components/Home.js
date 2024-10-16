import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext.js";
import { fetchWagers } from "../services/wagerService.js";

const Home = () => {
  const { mongoUserId } = useUser();
  const [wagers, setWagers] = useState([]);
  const [usersWagers, setUsersWagers] = useState([]);
  const [userWagerView, setUserWagerView] = useState(false);

  // Fetch wagers on component mount and every 3 seconds
  useEffect(() => {
    const getWagers = async () => {
      const allWagers = await fetchWagers();
      setWagers(allWagers || []);

      const userSpecificWagers = allWagers.filter(
        (wager) => wager.creator === mongoUserId
      );
      setUsersWagers(userSpecificWagers || []);
    };

    getWagers(); // Initial fetch
    const intervalId = setInterval(getWagers, 3000); // Fetch every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [mongoUserId]);

  const toggleWagerView = () => {
    setUserWagerView((prev) => !prev);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Welcome to the Wager Dashboard</h2>
      <button onClick={toggleWagerView} style={styles.toggleButton}>
        {userWagerView ? "View All Wagers" : "View Your Wagers"}
      </button>

      <div style={styles.wagerListContainer}>
        <h3 style={styles.subHeader}>
          {userWagerView ? "Your Wagers" : "All Wagers"}
        </h3>
        <ul style={styles.wagerList}>
          {(userWagerView ? usersWagers : wagers).length === 0 ? (
            <p>No wagers available.</p>
          ) : (
            (userWagerView ? usersWagers : wagers).map((wager) => (
              <li key={wager._id} style={styles.wagerItem}>
                <strong>Wager Name:</strong> {wager.name} <br />
                <strong>Creator:</strong> {wager.creator} <br />
                <strong>Agree Bets:</strong> {wager.agreeBetsCount} (
                {wager.agreePercentage}%) <br />
                <strong>Disagree Bets:</strong> {wager.disagreeBetsCount} (
                {wager.disagreePercentage}%) <br />
                <strong>Agree Credits Bet:</strong> {wager.agreeCreditsBet}{" "}
                <br />
                <strong>Disagree Credits Bet:</strong>{" "}
                {wager.disagreeCreditsBet}
                <hr style={styles.divider} />
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default Home;

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
    backgroundColor: "#635d5d",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  },
  header: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  toggleButton: {
    padding: "10px 20px",
    marginBottom: "20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  wagerListContainer: {
    textAlign: "left",
  },
  subHeader: {
    fontSize: "24px",
    marginBottom: "10px",
  },
  wagerList: {
    listStyle: "none",
    padding: 0,
  },
  wagerItem: {
    marginBottom: "15px",
    backgroundColor: "#4f4b4b",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.1)",
  },
  divider: {
    marginTop: "10px",
    border: "0",
    height: "1px",
    backgroundColor: "#ddd",
  },
};
