import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { updateUser } from "../services/userService";
import {
  generateLinkTokenForIDV,
  openPlaidIDV,
} from "../services/plaidService.js";
import { createJiraIssue } from "../services/jiraService.js";
import { auth } from "../firebaseConfig";

const wait = async (timeInMs) => {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
};

const IdentityVerification = () => {
  const [idvActive, setIdvActive] = useState(false);

  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const startIdentityVerification = async () => {
    try {
      // Generate Plaid Link token for IDV
      setIdvActive(true);
      const linkTokenData = await generateLinkTokenForIDV(user.mongoUserId);

      if (!linkTokenData || !linkTokenData.link_token) {
        throw new Error("Failed to generate Plaid Link token.");
      }

      // Open Plaid widget for IDV
      const idvResult = await openPlaidIDV(linkTokenData.link_token);

      if (idvResult?.status === "success") {
        
        let updateUserObject = { idvStatus: "verified" };
        
        if (idvResult?.DOB) {
          updateUserObject.DOB = idvResult.DOB;
        }
        
        await updateUser(user.mongoUserId, updateUserObject);
        
        // Reload App instead of navigating which will do the same thing
        await wait(5000);
        window.location.reload();
      } else {
        console.log("IDV failed");
        // Create Jira issue if IDV fails and alert user
        if (user.idvStatus !== "pending review") {
          await updateUser(user.mongoUserId, { idvStatus: "pending review" });
          setUser({ ...user, idvStatus: "pending review" });
          await createJiraIssue(
            user.name,
            user.email,
            user.mongoUserId,
            "Story",
            "IDV Failed",
            "",
            "IDV Failed"
          );
        }
        alert(
          "Identity Verification failed. RL Bets will review your information and approve or deny your account manually."
        );
        await wait(5000);
        window.location.reload();
      }
    } catch (error) {
      alert(error.message);
      // Wait 5 seconds before refreshing the page
      window.location.reload();
    }
  };

  // Disallows the user to navigate to this page if they have already verified their identity
  useEffect(() => {
    if (auth.currentUser && user?.emailVerificationStatus === "verified") {
      navigate("/Wagers");
      return;
    }
  }, [user, setUser, navigate]);

  return (
    <>
      {!idvActive && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>Identity Verification Required</h1>
          <p>
            Next please verify your identity. Follow the prompts to verify your
            age and location.
          </p>
          <button
            onClick={startIdentityVerification}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {user?.idvStatus === "pending review"
              ? "Retry Identity Verification"
              : "Start Identity Verification"}
          </button>
        </div>
      )}
    </>
  );
};

export default IdentityVerification;
