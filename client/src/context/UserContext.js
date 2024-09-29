import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import { getMongoUserIdByFirebaseId } from "../services/userService.js";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [mongoUserId, setMongoUserId] = useState("");
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
        const mongoId = await getMongoUserIdByFirebaseId(currentUser.uid);
        setMongoUserId(mongoId);
      } else {
        setFirebaseUser(null);
        setMongoUserId("");
      }
      setLoading(false); // Set loading to false once auth state is determined
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ firebaseUser, mongoUserId, setMongoUserId, loading }}>
      {children}
    </UserContext.Provider>
  );
};
