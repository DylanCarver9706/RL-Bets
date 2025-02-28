import React from "react";
import { Link } from "react-router-dom";
import "../../../styles/components/permissionFailure/SuspendedUser.css";

const SuspendedUser = () => {
  return (
    <div className="suspended-user-container">
      <div className="suspended-user-card">
        <h1 className="suspended-user-title">Account Suspended</h1>
        <p className="suspended-user-message">
          Your account is currently under review due to a potential violation of
          our Terms of Service. During this time, your access to the app has
          been removed while we investigate the issue.
        </p>
        <p>Your credits will not be removed from your account.</p>
        <p className="suspended-user-message">
          If you believe this is a mistake or wish to inquire further, please
          contact our support team.
        </p>
        <Link to="/Feedback-Form" className="suspended-user-link">
          Contact Support
        </Link>
      </div>
    </div>
  );
};

export default SuspendedUser;
