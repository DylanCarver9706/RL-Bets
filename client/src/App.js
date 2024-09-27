import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig.js"; // Import Firebase auth
import Home from "./components/Home";
import Auth from "./components/Auth";

function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [mongoUserId, setMongoUserId] = useState(""); // State to hold the user's ID

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser); // Set the user when logged in
      if (currentUser) {
        setMongoUserId(currentUser.uid); // Set the user ID if already authenticated
      } else {
        setMongoUserId(""); // Clear user ID on logout
      }
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  // Function to update the user ID when it is set in Auth.js
  const updateMongoUserId = (id) => {
    setMongoUserId(id);
  };

  return (
    <>
      <h1>RLBets.com</h1>
      <Routes>
        {/* Pass the user ID down as a prop to the Home component */}
        <Route path="/" element={firebaseUser ? <Home mongoUserId={ mongoUserId } /> : <Auth updateMongoUserId={updateMongoUserId} />} />
        <Route path="/Auth" element={<Auth updateMongoUserId={updateMongoUserId} />} />
      </Routes>
    </>
  );
}

export default App;
