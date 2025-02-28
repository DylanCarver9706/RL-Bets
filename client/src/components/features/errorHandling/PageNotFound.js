import React from "react";
import { Link } from "react-router-dom";
import "../../../styles/components/errorHandling/PageNotFound.css";

const PageNotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon">🚫</div>
        <h1 className="not-found-title">404 - Page Not Found</h1>
        <p className="not-found-message">
          The page you are looking for does not exist
        </p>
        <p className="not-found-message">What A Save! Am I right?</p>
        <Link to="/" className="not-found-link">
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
