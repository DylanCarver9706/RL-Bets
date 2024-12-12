import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { updateUser } from "../services/userService";
import {
  generateLinkTokenForIDV,
  openPlaidIDV,
} from "../services/plaidService.js";
import { createJiraIssue } from "../services/jiraService.js";

const wait = async (timeInMs) => {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
}

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
        
        await updateUser(user.mongoUserId, { idvStatus: "verified" });

        // Set the user state with the updated user object
        // NOTE: Needed so Home can access the user object
        //       when it navigates, but will not be needed if they refresh
        setUser({ ...user, idvStatus: "verified" });

        navigate("/");

      } else {
        console.log("IDV failed");
        // Create Jira issue if IDV fails and alert user
        if (user.idvStatus !== "pending review") {
          await updateUser(user.mongoUserId, { idvStatus: "pending review" });
          setUser({ ...user, idvStatus: "pending review" });
          await createJiraIssue(user.name, user.email, user.mongoUserId, "Story", "IDV Failed", "", "IDV Failed");
        }
        alert("Identity Verification failed. RL Bets will review your information and approve or deny your account manually.");
        await wait(5000)
        window.location.reload()
      }
    } catch (error) {
      alert(error.message);
      // Wait 5 seconds before refreshing the page
      window.location.reload()
    }
  };

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
            Start Identity Verification
          </button>
        </div>
      )}
    </>
  );
};

export default IdentityVerification;
