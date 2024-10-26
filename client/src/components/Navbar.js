import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { getUserById } from "../services/userService.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

const Navbar = () => {

  const [userCredits, setUserCredits] = useState(0)

  const { mongoUserId } = useUser();

  useEffect(() => {
    // Initialize the socket connection
    const socket = io(BASE_SERVER_URL); // Adjust the URL if needed

    // Fetch initial user data
    const fetchData = async () => {
      try {
        const userData = await getUserById(mongoUserId);
        setUserCredits(parseInt(userData.credits));
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    // Fetch the data immediately on component mount
    fetchData();

    // Listen for the 'updateUser' event from the server
    socket.on("updateUser", (updatedUser) => {
      if (updatedUser._id === mongoUserId) {
        setUserCredits(updatedUser.credits);
      }
    });

    // Cleanup the socket connection on unmount
    return () => socket.disconnect();
  }, [mongoUserId]);

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.brand}><Link to="/" style={styles.link}>RLBets.com</Link></h2>
      <div style={styles.navLinks}>
        <Link to="/User" style={styles.link}>Profile</Link>
        <Link to="/Schedule" style={styles.link}>Schedule</Link>
        <Link to="/Leaderboard" style={styles.link}>Leaderboard</Link>
      </div>
      <div style={styles.navLinks}>
        <Link to="/Bet" style={styles.link}>Create Bet</Link>
        <Link to="/Credits" style={styles.link}>{userCredits} Credits</Link>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#333",
    padding: "10px 20px",
  },
  brand: {
    color: "#fff",
    margin: 0,
  },
  navLinks: {
    display: "flex",
    gap: "15px",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "16px",
  },
};

export default Navbar;
