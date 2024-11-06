import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getMongoUserIdByFirebaseId } from "../services/userService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null); // Stores the user object

  useEffect(() => {
    const auth = getAuth();
    
    // Create an async function inside the effect
    const handleAuthChange = async (user) => {
      if (user) {
        try {
          const mongoUserId = await getMongoUserIdByFirebaseId(user.uid);
          console.log("MongoDB User ID:", mongoUserId);
          const userWithMongoId = { ...user, mongoUserId: mongoUserId };
          console.log("User with Mongo ID:", userWithMongoId);
          setFirebaseUser(userWithMongoId);
        } catch (error) {
          console.error("Error fetching MongoDB User ID:", error);
        }
      } else {
        setFirebaseUser(null); // Handle case when user is logged out
      }
    };
  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Call the async function
      handleAuthChange(user);
    });
  
    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useAuth = () => useContext(AuthContext);