import React from "react";
import "../../../styles/components/permissionFailure/LocationPermissionRequired.css";

const LocationPermissionRequired = () => {
  return (
    <div className="location-permission-container">
      <div className="location-permission-card">
        <h1 className="location-permission-title">
          Location Permission Required
        </h1>
        <h2 className="location-permission-message">
          Due to state law, you are not allowed to use this app without
          disclosing your location.
        </h2>
        <h2 className="location-permission-message">
          Check your browser's permission settings to allow this site to access
          your location.
        </h2>
      </div>
    </div>
  );
};

export default LocationPermissionRequired;
