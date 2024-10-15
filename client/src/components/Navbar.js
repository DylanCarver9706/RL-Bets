import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { getUserById } from "../services/userService.js";

const Navbar = () => {

  const [userCredits, setUserCredits] = useState(0)

  const { mongoUserId } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserById(mongoUserId);
        console.log(userData)
        setUserCredits(userData.credits);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, [mongoUserId]);

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.brand}><Link to="/" style={styles.link}>RLBets.com</Link></h2>
      <div style={styles.navLinks}>
        <Link to="/User" style={styles.link}>Profile</Link>
        <Link to="/Analytics" style={styles.link}>Analytics</Link>
      </div>
      <div style={styles.navLinks}>
        <Link to="/Bet" style={styles.link}>Create Bet</Link>
        <Link to="/Purchase" style={styles.link}>{userCredits} Credits</Link>
        {/* <Link to="/Leaderboard" style={styles.link}>Leaderboard</Link> */}
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
