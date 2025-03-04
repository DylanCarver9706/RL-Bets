import React from "react";
import "../../../styles/components/permissionFailure/IllegalState.css";

const IllegalState = () => {
  return (
    <div className="illegal-state-container">
      <div className="illegal-state-card">
        <h1 className="illegal-state-title">Illegal State</h1>
        <h2 className="illegal-state-message">
          Due to state law, you are not allowed to use this app from your
          location.
        </h2>
      </div>
    </div>
  );
};

export default IllegalState;
