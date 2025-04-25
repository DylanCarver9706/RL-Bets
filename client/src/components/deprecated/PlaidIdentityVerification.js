import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext.js";
import {
  updateUser,
  redeemReferralCode,
  wait,
  userAgeLegal,
  userLocationLegal,
} from "../../services/userService.js";
import {
  generateLinkTokenForIDV,
  openPlaidIDV,
} from "../../services/identityVerificationService.js";
import { createJiraIssue } from "../../services/jiraService.js";

const PlaidIdentityVerification = () => {
  const [idvActive, setIdvActive] = useState(false);

  const { user, setUser } = useUser();

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

          const userLocationMeta = await userLocationLegal();

          updateUserObject.locationValid = userLocationMeta?.allowed;
          updateUserObject.currentState = userLocationMeta?.state;

          updateUserObject.ageValid = await userAgeLegal(
            userLocationMeta?.state,
            idvResult.DOB
          );
        }

        if (idvResult?.phoneNumber) {
          updateUserObject.phoneNumber = idvResult.phoneNumber;
        }

        await updateUser(user.mongoUserId, updateUserObject);

        if (user.referralCode !== "") {
          await redeemReferralCode(
            "Referred User",
            user.mongoUserId,
            user.referralCode
          );
        }

        await wait(3000);
        window.location.reload();
      } else {
        if (process.env.REACT_APP_ENV === "development")
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
      }
    } catch (error) {
      throw new Error(error.message);
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
            {user?.idvStatus === "pending review"
              ? "Retry Identity Verification"
              : "Start Identity Verification"}
          </button>
        </div>
      )}
    </>
  );
};

export default PlaidIdentityVerification;
