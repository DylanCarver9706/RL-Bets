import React from "react";
import { Link } from "react-router-dom";
import "../../styles/components/common/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-column">
        <h3 className="footer-header">About</h3>
        <Link to="/about" className="footer-link">
          About Us
        </Link>
        <Link to="/contact" className="footer-link">
          Contact
        </Link>
        <Link to="/credits" className="footer-link">
          Credits
        </Link>
      </div>
      <div className="footer-column">
        <h3 className="footer-header">Feedback</h3>
        <Link to="/bug-form" className="footer-link">
          Report an Issue
        </Link>
        <Link to="/feature-form" className="footer-link">
          Suggest a Feature
        </Link>
        <Link to="/feedback-form" className="footer-link">
          General Feedback
        </Link>
      </div>
      <div className="footer-column">
        <h3 className="footer-header">Legal</h3>
        <Link to="/privacy-policy" className="footer-link">
          Privacy Policy
        </Link>
        <Link to="/terms-of-service" className="footer-link">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
