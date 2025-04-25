import React, { useState, useEffect } from "react";
import { useUser } from "../../../contexts/UserContext";
import { updateUser } from "../../../services/userService";
import {
  getLatestPrivacyPolicy,
  getLatestTermsOfService,
} from "../../../services/agreementService";
import "../../../styles/components/legal/Agreements.css";

const Agreements = () => {
  const [tosChecked, setTosChecked] = useState(false);
  const [ppChecked, setPpChecked] = useState(false);
  const [requireTos, setRequireTos] = useState(false);
  const [requirePp, setRequirePp] = useState(false);
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
        const newVersions = {
          tos: parseInt(tosDoc.version, 10),
          pp: parseInt(ppDoc.version, 10),
        };
        setLatestVersions(newVersions);
        
        // Set which agreements need attention after we have the versions
        setRequireTos(parseInt(user?.tos?.version, 10) !== newVersions.tos);
        setRequirePp(parseInt(user?.pp?.version, 10) !== newVersions.pp);
      } catch (err) {
        console.error("Error fetching latest versions:", err);
        setError("Failed to load agreement versions. Please try again.");
      }
    };

    fetchLatestVersions();
  }, [user?.tos?.version, user?.pp?.version]);

  const handleSubmit = async () => {
    try {
      // Validate that required agreements have been read and accepted
      if (requireTos && !tosChecked) {
        setError("Please read and accept the Terms of Service");
        return;
      }
      if (requirePp && !ppChecked) {
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

  if (process.env.REACT_APP_ENV === "development")
    console.log(requireTos, requirePp);

  return (
    <div className="agreements-container">
      <div className="agreements-card">
        <div className="agreements-header">
          <h1 className="agreements-title">
            {requireTos && requirePp
              ? "Agreement Updates"
              : `${requireTos ? "Terms of Service" : "Privacy Policy"} Update`}
          </h1>
          <h2 className="agreements-subtitle">
            {`Please read and accept the updated ${
              requireTos && requirePp ? "documents" : "document"
            } to continue`}
          </h2>
        </div>

        <div className="agreements-sections">
          <div className="signup-agreements">
            <div className="signup-agreement-checkbox">
              <input
                type="checkbox"
                checked={requireTos ? tosChecked : ppChecked}
                onChange={(e) => {
                  if (requireTos) {
                    setTosChecked(e.target.checked);
                  }

                  if (requirePp) {
                    setPpChecked(e.target.checked);
                  }
                }}
              />
              <span>I agree to the updated </span>
            </div>
            {requireTos && requirePp && (
              <>
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="signup-agreement-link"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(
                      "/terms-of-service",
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                >
                  Terms of Service
                </a>
                <span> and </span>
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="signup-agreement-link"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(
                      "/privacy-policy",
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                >
                  Privacy Policy
                </a>
              </>
            )}
            {requireTos && !requirePp && (
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="signup-agreement-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    "/terms-of-service",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Terms of Service
              </a>
            )}
            {requirePp && !requireTos && (
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="signup-agreement-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    "/privacy-policy",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Privacy Policy
              </a>
            )}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <div className="submit-button-container">
            <button
              className="auth-button"
              onClick={handleSubmit}
              disabled={
                (requireTos && !tosChecked) ||
                (requirePp && !ppChecked) ||
                (requireTos && requirePp && (!tosChecked || !ppChecked))
              }
            >
              Accept and Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agreements;
