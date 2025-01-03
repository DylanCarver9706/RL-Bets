import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Capture console logs
const capturedLogs = [];
const captureConsoleLog = (type, ...args) => {
  const logEntry = {
    type, // log, warn, error
    message: args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" "),
    timestamp: new Date().toISOString(),
  };
  capturedLogs.push(logEntry);

  // Call the original console function
  console[`_${type}`](...args);
};

// Override console methods
["log", "warn", "error"].forEach((method) => {
  console[`_${method}`] = console[method]; // Backup original method
  console[method] = (...args) => captureConsoleLog(method, ...args);
});

const AppWithErrorBoundary = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <ErrorBoundary user={user} navigate={navigate} logs={capturedLogs}>
      <App />
    </ErrorBoundary>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <BrowserRouter>
      <AppWithErrorBoundary />
    </BrowserRouter>
  </UserProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
