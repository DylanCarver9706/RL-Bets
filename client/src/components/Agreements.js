import React, { useState } from "react";
import PropTypes from "prop-types";
import { useUser } from "../contexts/UserContext";
import { updateUser } from "../services/userService"; // Assumes updateUser is defined in UserService

const Agreements = ({ requireTos, requirePp, tosVersion, ppVersion }) => {
  const [tosClicked, setTosClicked] = useState(false);
  const [ppClicked, setPpClicked] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [ppChecked, setPpChecked] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUser();

  const handleSubmit = async () => {
    try {
      if (requireTos && !tosChecked) {
        setError("You must agree to the Terms of Service.");
        return;
      }
      if (requirePp && !ppChecked) {
        setError("You must agree to the Privacy Policy.");
        return;
      }

      let updateObject = {}

      if (requireTos) {
        updateObject.tos = `Accepted v${tosVersion} at ${new Date().toISOString().split("T")[0]}`;
      }

      if (requirePp) {
        updateObject.pp = `Accepted v${ppVersion} at ${new Date().toISOString().split("T")[0]}`;
      }

      await updateUser(user.mongoUserId, updateObject);
      alert("Agreements updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error updating agreements:", err);
      setError("Failed to update agreements. Please try again.");
    }
  };

  console.log((requireTos === requirePp))

  return (
    <div style={styles.container}>
      {(requireTos === requirePp) ? (
        <>
        <h1>There has been an update to the agreement docs</h1>
        <h2>Please read each required document and confirm you agree</h2>
        </>
      ) : (
        <>
        <h1>There has been an update to the {requireTos ? "Terms of Service" : "Privacy Policy"}</h1>
        <h2>Please read the required document and confirm you agree</h2>
        </>
      )}
      {requireTos && (
          <div style={styles.agreementSection}>
          <a
            href="/Terms-Of-Service"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation
              setTosClicked(true); // Mark the link as clicked
              window.open("/Terms-Of-Service", "_blank", "noopener,noreferrer"); // Open in a new tab
            }}
          >
            View Terms of Service
          </a>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={!requireTos || tosChecked}
              onChange={(e) => setTosChecked(e.target.checked)}
              disabled={!tosClicked} // Disable until the link is clicked
            />
            I agree to the Terms of Service
          </label>
        </div>
      )}
      {requirePp && (
        <div style={styles.agreementSection}>
          <a
            href="/Privacy-Policy"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation
              setPpClicked(true); // Mark the link as clicked
              window.open("/Privacy-Policy", "_blank", "noopener,noreferrer"); // Open in a new tab
            }}
          >
            View Privacy Policy
          </a>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={!requirePp || ppChecked}
              onChange={(e) => setPpChecked(e.target.checked)}
              disabled={!ppClicked} // Disable until the link is clicked
            />
            I agree to the Privacy Policy
          </label>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <button onClick={handleSubmit} style={styles.button}>
        Submit
      </button>
    </div>
  );
};

Agreements.propTypes = {
  requireTos: PropTypes.bool,
  requirePp: PropTypes.bool,
};

const styles = {
  container: {
    padding: "20px",
    margin: "auto",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  agreementSection: {
    marginBottom: "20px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
    display: "block",
    marginBottom: "8px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
  },
  error: {
    color: "red",
    fontSize: "14px",
    marginBottom: "10px",
  },
  button: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default Agreements;
