import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig.js"; // Import Firebase auth
import Home from "./components/Home";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set the user when logged in
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  return (
    <>
      <h1>RLBets.com</h1>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Auth />} />
        <Route path="/Auth" element={<Auth />} />
      </Routes>
    </>
  );
}

export default App;
