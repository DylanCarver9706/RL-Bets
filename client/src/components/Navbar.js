import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import { getUserById } from "../services/userService.js";
import { useUser } from "../context/UserContext.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

const Navbar = () => {
  const { user } = useUser();
  const [userCredits, setUserCredits] = useState(null);

  useEffect(() => {
    
    // Initialize the socket connection
    const socket = io(BASE_SERVER_URL);
    if (user?.mongoUserId) {
      const fetchData = async () => {
        try {
          const userData = await getUserById(user.mongoUserId);
          setUserCredits(parseInt(userData.credits));
        } catch (error) {
          console.error("Error fetching user data:", error.message);
        }
      };

      fetchData();

      // Listen for the 'updateUser' event from the server
    socket.on("updateUser", (updatedUser) => {
      if (updatedUser._id === user.mongoUserId) {
        setUserCredits(updatedUser.credits);
      }
    });

    // Cleanup the socket connection on unmount
    return () => socket.disconnect();
    }
  }, [user]);

  if (!user) {
    return null; // Hide navbar if no user is logged in
  }

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
        {user.userType === "admin" && (
          <>
            <Link to="/Admin" style={styles.link}>
              Admin
            </Link>
            <Link to="/Log" style={styles.link}>
              Logs
            </Link>
          </>
        )}
      </div>
      <div style={styles.navLinks}>
        <Link to="/Create_Wager" style={styles.link}>
          Create Wager
        </Link>
        {userCredits !== null && (
          <Link to="/Credits" style={styles.link}>
            {userCredits} Credits
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

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