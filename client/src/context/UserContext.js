import React, { createContext, useState, useContext } from "react";

// Create the UserContext
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: null,
    email: null,
    mongoUserId: null,
    credits: null,
    earnedCredits: null,
    firebaseUserId: null,
    userType: "user",
    idvStatus: "unverified",
    emailVerificationStatus: "unverified",
    accountStatus: null,
  }); // Global user state

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
