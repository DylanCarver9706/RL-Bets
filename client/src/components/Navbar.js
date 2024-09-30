import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <h2 style={styles.brand}><Link to="/" style={styles.link}>RLBets.com</Link></h2>
      <div style={styles.navLinks}>
        <Link to="/User" style={styles.link}>Profile</Link>
      </div>
      <div style={styles.navLinks}>
        <Link to="/Bet" style={styles.link}>Create Bet</Link>
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
