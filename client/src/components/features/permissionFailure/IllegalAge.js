import React from "react";
import "../../../styles/components/permissionFailure/IllegalAge.css";

const IllegalAge = () => {
  return (
    <div className="illegal-age-container">
      <div className="illegal-age-card">
        <h1 className="illegal-age-title">Illegal Age</h1>
        <h2 className="illegal-age-message">
          Due to state law, you are not allowed to use this app while under age.
        </h2>
        <h2 className="illegal-age-message">
          Check your state laws to determine the legal age you can perform
          online sports gambling in this state.
        </h2>
      </div>
    </div>
  );
};

export default IllegalAge;
