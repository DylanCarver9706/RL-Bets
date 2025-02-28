import React, { useState, useEffect } from "react";
import { useUser } from "../../../contexts/UserContext";
import { updateUser } from "../../../services/userService";
import {
  getLatestPrivacyPolicy,
  getLatestTermsOfService,
} from "../../../services/agreementService";
import "../../../styles/components/legal/Agreements.css";

const Agreements = () => {
  const [tosClicked, setTosClicked] = useState(false);
  const [ppClicked, setPpClicked] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [ppChecked, setPpChecked] = useState(false);
  const [error, setError] = useState(null);
  const [latestVersions, setLatestVersions] = useState({ tos: null, pp: null });
  const { user } = useUser();

  // Fetch latest versions on mount
  useEffect(() => {
    const fetchLatestVersions = async () => {
      try {
        const [tosDoc, ppDoc] = await Promise.all([
          getLatestTermsOfService(),
          getLatestPrivacyPolicy(),
        ]);
        setLatestVersions({
          tos: parseInt(tosDoc.version),
          pp: parseInt(ppDoc.version),
        });
      } catch (err) {
        console.error("Error fetching latest versions:", err);
        setError("Failed to load agreement versions. Please try again.");
      }
    };

    fetchLatestVersions();
  }, []);

  // Check which agreements need to be updated
  const requireTos = user?.tos?.version !== latestVersions.tos;
  const requirePp = user?.pp?.version !== latestVersions.pp;

  const handleSubmit = async () => {
    try {
      // Validate that required agreements have been read and accepted
      if (requireTos && (!tosClicked || !tosChecked)) {
        setError("Please read and accept the Terms of Service");
        return;
      }
      if (requirePp && (!ppClicked || !ppChecked)) {
        setError("Please read and accept the Privacy Policy");
        return;
      }

      let updateObject = {};

      if (requireTos) {
        updateObject.tos = {
          version: parseInt(latestVersions.tos),
          acceptedAt: new Date().toISOString(),
        };
      }

      if (requirePp) {
        updateObject.pp = {
          version: parseInt(latestVersions.pp),
          acceptedAt: new Date().toISOString(),
        };
      }

      await updateUser(user.mongoUserId, updateObject);
      window.location.reload();
    } catch (err) {
      console.error("Error updating agreements:", err);
      setError("Failed to update agreements. Please try again.");
    }
  };

  // Don't render until we have the latest versions
  if (!latestVersions.tos || !latestVersions.pp) {
    return null;
  }

  return (
    <div className="agreements-container">
      <div className="agreements-card">
        <div className="agreements-header">
          <h1 className="agreements-title">
            {requireTos && requirePp
              ? "Agreement Updates Required"
              : `${
                  requireTos ? "Terms of Service" : "Privacy Policy"
                } Update Required`}
          </h1>
          <h2 className="agreements-subtitle">
            {requireTos && requirePp
              ? "Please read and accept the updated documents to continue"
              : "Please read and accept the updated document to continue"}
          </h2>
        </div>

        <div className="agreements-sections">
          {requireTos && (
            <div className="agreement-section">
              <a
                href="/Terms-Of-Service"
                target="_blank"
                rel="noopener noreferrer"
                className="agreement-link"
                onClick={(e) => {
                  e.preventDefault();
                  setTosClicked(true);
                  window.open(
                    "/Terms-Of-Service",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                View Terms of Service
              </a>
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={tosChecked}
                  onChange={(e) => setTosChecked(e.target.checked)}
                  disabled={!tosClicked}
                />
                I agree to the Terms of Service
              </label>
              {requireTos && !tosClicked && (
                <span className="agreement-status">
                  Please read the document
                </span>
              )}
            </div>
          )}

          {requirePp && (
            <div className="agreement-section">
              <a
                href="/Privacy-Policy"
                target="_blank"
                rel="noopener noreferrer"
                className="agreement-link"
                onClick={(e) => {
                  e.preventDefault();
                  setPpClicked(true);
                  window.open(
                    "/Privacy-Policy",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                View Privacy Policy
              </a>
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={ppChecked}
                  onChange={(e) => setPpChecked(e.target.checked)}
                  disabled={!ppClicked}
                />
                I agree to the Privacy Policy
              </label>
              {requirePp && !ppClicked && (
                <span className="agreement-status">
                  Please read the document
                </span>
              )}
            </div>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={
            (requireTos && (!tosClicked || !tosChecked)) ||
            (requirePp && (!ppClicked || !ppChecked))
          }
        >
          Accept and Continue
        </button>
      </div>
    </div>
  );
};

export default Agreements;
