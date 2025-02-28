import React from "react";
import { Link } from "react-router-dom";
import "../../styles/components/common/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-column">
        <h3 className="footer-header">About</h3>
        <Link to="/About" className="footer-link">
          About Us
        </Link>
        <Link to="/Contact" className="footer-link">
          Contact
        </Link>
        <Link to="/Credits" className="footer-link">
          Credits
        </Link>
      </div>
      <div className="footer-column">
        <h3 className="footer-header">Feedback</h3>
        <Link to="/Bug-Form" className="footer-link">
          Report an Issue
        </Link>
        <Link to="/Feature-Form" className="footer-link">
          Suggest a Feature
        </Link>
        <Link to="/Feedback-Form" className="footer-link">
          General Feedback
        </Link>
      </div>
      <div className="footer-column">
        <h3 className="footer-header">Legal</h3>
        <Link to="/Privacy-Policy" className="footer-link">
          Privacy Policy
        </Link>
        <Link to="/Terms-Of-Service" className="footer-link">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
