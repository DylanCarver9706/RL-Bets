import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getMongoUserDataByFirebaseId } from "../services/userService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null); // Stores the user object
  const [loading, setLoading] = useState(true); // Loading state for initial auth check

  useEffect(() => {
    const auth = getAuth();
    
    // Create an async function inside the effect
    const handleAuthChange = async (user) => {
      if (user) {
        try {
          const mongoUser = await getMongoUserDataByFirebaseId(user.uid);
          console.log("MongoDB User ID:", mongoUser);
          const userWithMongoData = { ...user, mongoUserId: mongoUser.id, userType: mongoUser.type };
          setFirebaseUser(userWithMongoData);
        } catch (error) {
          console.error("Error fetching MongoDB User ID:", error);
        }
      } else {
        setFirebaseUser(null); // Handle case when user is logged out
      }
      setLoading(false); // Set loading to false after auth check
    };
  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Call the async function
      handleAuthChange(user);
    });
  
    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useAuth = () => useContext(AuthContext);