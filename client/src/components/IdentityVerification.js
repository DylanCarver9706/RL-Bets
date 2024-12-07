import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { updateUser } from "../services/userService";
import {
  generateLinkTokenForIDV,
  openPlaidIDV,
} from "../services/plaidService.js";

const IdentityVerification = () => {
  const [idvActive, setIdvActive] = useState(false);

  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const startIdentityVerification = async () => {
    try {
      // Generate Plaid Link token for IDV
      console.log(user);
      setIdvActive(true);
      const linkTokenData = await generateLinkTokenForIDV(user.mongoUserId);

      if (!linkTokenData || !linkTokenData.link_token) {
        throw new Error("Failed to generate Plaid Link token.");
      }

      const idvResult = await openPlaidIDV(linkTokenData.link_token);

      if (idvResult?.status === "success") {
        await updateUser(user.mongoUserId, { idvStatus: "verified" });
        setUser((prevUser) => ({
          ...prevUser,
          idvStatus: "verified",
        }));
        navigate("/");
      } else {
        navigate("/Profile");
      }
    } catch (error) {
      alert(error.message);
      navigate("/Auth");
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
