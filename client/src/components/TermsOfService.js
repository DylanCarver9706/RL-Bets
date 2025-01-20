import React, { useEffect, useState } from "react";
import { getLatestTermsOfService } from "../services/agreementsService";

const TermsOfService = () => {
  const [agreement, setAgreement] = useState(null);

  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const fetchedAgreement = await getLatestTermsOfService();
        setAgreement(fetchedAgreement);
      } catch (error) {
        console.error("Error fetching agreement:", error.message);
      }
    };

    fetchAgreement();
  }, []);

  return (
    <div>
      {agreement ? (
        <div>
          <h1>{agreement.name}</h1>
          <div dangerouslySetInnerHTML={{ __html: agreement.content }} />
        </div>
      ) : (
        <p>No Document Found</p>
      )}
    </div>
  );
};

export default TermsOfService;
