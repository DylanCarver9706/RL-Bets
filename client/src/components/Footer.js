import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.column}>
        <h3 style={styles.header}>About</h3>
        <Link to="/About" style={styles.link}>
          About Us
        </Link>
        <Link to="/Contact" style={styles.link}>
          Contact
        </Link>
        <Link to="/Credits" style={styles.link}>
          Credits
        </Link>
      </div>
      <div style={styles.column}>
        <h3 style={styles.header}>Feedback</h3>
        <Link to="/Bug-Form" style={styles.link}>
          Report an Issue
        </Link>
        <Link to="/Feature-Form" style={styles.link}>
          Suggest a Feature
        </Link>
        <Link to="/Feedback-Form" style={styles.link}>
          General Feedback
        </Link>
      </div>
      <div style={styles.column}>
        <h3 style={styles.header}>Legal</h3>
        <Link to="/Privacy-Policy" style={styles.link}>
          Privacy Policy
        </Link>
        <Link to="/Terms-Of-Service" style={styles.link}>
          Terms of Service
        </Link>
      </div>
    </footer>
  );
};

export default Footer;

const styles = {
  footer: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-start",
    background: "#333",
    color: "#fff",
    padding: "20px 0",
    position: "relative",
    bottom: 0,
    width: "100%",
    borderTop: "2px solid #444",
    marginTop: "auto",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    margin: "0 20px",
  },
  header: {
    fontSize: "18px",
    marginBottom: "10px",
    textDecoration: "underline",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "14px",
    marginBottom: "5px",
  },
  linkHover: {
    textDecoration: "underline",
  },
};
