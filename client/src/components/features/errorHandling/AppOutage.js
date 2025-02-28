import React from "react";
import "../../../styles/components/errorHandling/AppOutage.css";

const AppOutage = () => {
  return (
    <div className="outage-container">
      <div className="outage-card">
        <div className="outage-icon">🔧</div>
        <h1 className="outage-title">Service Temporarily Unavailable</h1>
        <p className="outage-message">
          RL Bets is currently undergoing maintenance or experiencing technical
          difficulties. Our team is working to restore service as quickly as
          possible.
        </p>
        <span className="outage-status">Please check back later</span>
      </div>
    </div>
  );
};

export default AppOutage;
