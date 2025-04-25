import { makeAuthenticatedRequest } from "./authService";

export const getUserLocation = async () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

export const getUserStateByLatLon = async (lat, lon) => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/geofencing/reverse-geocode",
      {
        method: "POST",
        body: JSON.stringify({ lat, lon }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to validate state.");
    }

    return data;
  } catch (err) {
    if (process.env.REACT_APP_ENV === "development")
      console.error("Error validating state:", err.message);
    throw err;
  }
};

export const userLocationLegal = async () => {
  if (!navigator.geolocation) {
    if (process.env.REACT_APP_ENV === "development")
      console.log("Geolocation is not supported by your browser.");
    return;
  }

  try {
    const {
      coords: { latitude, longitude },
    } = await getUserLocation();
    const reverseGeocodeResponse = await getUserStateByLatLon(
      latitude,
      longitude
    );

    let response = {
      allowed: reverseGeocodeResponse?.allowed,
      state: reverseGeocodeResponse?.state,
    };

    return response;
  } catch (error) {
    if (process.env.REACT_APP_ENV === "development")
      console.error("Error checking user location:", error.message);
    if (process.env.REACT_APP_ENV === "development")
      console.log(
        "Unable to determine your location. Location access is required."
      );
  }
};

export const checkGeolocationPermission = async () => {
  if (!navigator.permissions) {
    alert("Permissions API is not supported in this browser.");
    return false;
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: "geolocation",
    });

    if (permissionStatus.state === "denied") {
      return false;
    }

    if (permissionStatus.state === "prompt") {
      try {
        await getUserLocation();
        return true;
      } catch (error) {
        return false;
      }
    }

    return permissionStatus.state === "granted";
  } catch (error) {
    if (process.env.REACT_APP_ENV === "development")
      console.error("Error checking geolocation permission:", error);
    return false;
  }
};
