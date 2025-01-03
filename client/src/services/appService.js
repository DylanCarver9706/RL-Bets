const BASE_URL = process.env.REACT_APP_BASE_SERVER_URL;

export const checkServerStatus = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/server-utils/status`);
    if (!response.ok) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};