import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { getUserById } from "../services/userService.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

const Navbar = () => {
  const [userCredits, setUserCredits] = useState(0);

  const { firebaseUser } = useAuth();

  useEffect(() => {
    // Initialize the socket connection
    const socket = io(BASE_SERVER_URL); // Adjust the URL if needed

    // Fetch initial user data
    const fetchData = async () => {
      try {
        const userData = await getUserById(firebaseUser.mongoUserId);
        setUserCredits(parseInt(userData.credits));
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    // Fetch the data immediately on component mount
    fetchData();

    // Listen for the 'updateUser' event from the server
    socket.on("updateUser", (updatedUser) => {
      if (updatedUser._id === firebaseUser.mongoUserId) {
        setUserCredits(updatedUser.credits);
      }
    });

    // Cleanup the socket connection on unmount
    return () => socket.disconnect();
  }, [firebaseUser]);

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.brand}>
        <Link to="/" style={styles.link}>
          RLBets.com
        </Link>
      </h2>
      <div style={styles.navLinks}>
        <Link to="/Profile" style={styles.link}>
          Profile
        </Link>
        <Link to="/Schedule" style={styles.link}>
          Schedule
        </Link>
        <Link to="/Leaderboard" style={styles.link}>
          Leaderboard
        </Link>
        {firebaseUser.userType === "admin" && (
        <Link to="/Admin" style={styles.link}>
          Admin
        </Link>
        )}
        {firebaseUser.userType === "admin" && (
        <Link to="/Log" style={styles.link}>
          Logs
        </Link>
        )}
      </div>
      <div style={styles.navLinks}>
        <Link to="/Create_Wager" style={styles.link}>
          Create Wager
        </Link>
        {firebaseUser && (
        <Link to="/Credits" style={styles.link}>
          {parseInt(userCredits)} Credits
        </Link>
        )}
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
