import React from "react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div style={styles.container}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist. What A Save! Am I right?</p>
      <Link to="/" style={styles.link}>Go Back Home</Link>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
    fontSize: "18px",
  },
};

export default PageNotFound;
