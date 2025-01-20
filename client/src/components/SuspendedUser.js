import React from "react";
import { Link } from "react-router-dom";

const SuspendedUser = () => {

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Account Suspended</h1>
      <p style={styles.message}>
        Your account is currently under review due to a potential violation of our Terms and Conditions.
        During this time, your access to the app has been removed while we investigate the issue.
      </p>
      <p>Your credits will not be removed from your account</p>
      <p style={styles.message}>
        If you believe this is a mistake or wish to inquire further, please contact our support team.
      </p>
      {/* <a href="/Feedback-Form" style={styles.supportLink}>Contact Support</a> */}
      <Link to="/Feedback-Form" style={styles.supportLink}>
      Contact Support
              </Link>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    margin: "50px auto",
    padding: "20px",
    maxWidth: "600px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "rgb(51, 51, 51)",
  },
  header: {
    fontSize: "28px",
    color: "#d9534f", // Red to indicate suspension
    marginBottom: "20px",
  },
  message: {
    fontSize: "16px",
    marginBottom: "15px",
  },
  supportLink: {
    display: "inline-block",
    marginTop: "20px",
    fontSize: "16px",
    color: "#007bff",
    textDecoration: "none",
    border: "1px solid #007bff",
    padding: "10px 20px",
    borderRadius: "5px",
    transition: "background-color 0.3s, color 0.3s",
  },
  supportLinkHover: {
    backgroundColor: "#007bff",
    color: "#fff",
  },
};

export default SuspendedUser;
