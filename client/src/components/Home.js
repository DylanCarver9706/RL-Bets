import React from "react";
import { useUser } from "../context/UserContext.js";

const Home = () => {
  const { mongoUserId } = useUser(); // Get the MongoDB user ID from context

  console.log("Mongo User ID: ", mongoUserId);

  return (
    <div>
      <h2>Welcome to the Home Page</h2>
    </div>
  );
};

export default Home;
