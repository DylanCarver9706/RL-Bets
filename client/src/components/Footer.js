import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.column}>
        <h3 style={styles.header}>About</h3>
        <Link to="/About-Us" style={styles.link}>
          About Us
        </Link>
        <Link to="/Careers" style={styles.link}>
          Careers
        </Link>
        <Link to="/Contact" style={styles.link}>
          Contact
        </Link>
      </div>
      <div style={styles.column}>
        <h3 style={styles.header}>Support</h3>
        <Link to="/Help" style={styles.link}>
          Help Center
        </Link>
        <Link to="/FAQ" style={styles.link}>
          FAQ
        </Link>
        <Link to="/Feedback" style={styles.link}>
          Feedback
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
        <Link to="/Cookie-Policy" style={styles.link}>
          Cookie Policy
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
