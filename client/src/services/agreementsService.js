const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

export const getLatestPrivacyPolicy = async () => {
  try {

    const response = await fetch(`${BASE_SERVER_URL}/api/agreements/privacy-policy/latest`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch Privacy Policy.");
    }

    return data; // Return the Privacy Policy data
  } catch (err) {
    console.error("Error fetching Privacy Policy:", err.message);
    throw err;
  }
}

export const getLatestTermsOfService = async () => {
    try {
  
      const response = await fetch(`${BASE_SERVER_URL}/api/agreements/terms-of-service/latest`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to Terms of Service.");
      }
  
      return data; // Return the Terms of Service data
    } catch (err) {
      console.error("Error fetching Terms of Service:", err.message);
      throw err;
    }
  }