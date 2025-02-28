import React, { useEffect, useState } from "react";
import { getLatestTermsOfService } from "../../../services/agreementService";
import "../../../styles/components/legal/Legal.css";

const TermsOfService = () => {
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const fetchedAgreement = await getLatestTermsOfService();
        setAgreement(fetchedAgreement);
      } catch (error) {
        console.error("Error fetching agreement:", error.message);
        setError("Failed to load Terms of Service. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, []);

  if (loading) {
    return <div className="legal-container">Loading...</div>;
  }

  if (error) {
    return <div className="legal-container">{error}</div>;
  }

  return (
    <div className="legal-container">
      {agreement ? (
        <div>
          <h1>
            RL Bets – {agreement.name} – Version: {agreement.version}
          </h1>
          <div dangerouslySetInnerHTML={{ __html: agreement.content }} />
        </div>
      ) : (
        <p>No Document Found</p>
      )}
    </div>
  );
};

export default TermsOfService;
