import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import ErrorBoundary from "./components/features/errorHandling/ErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";

// Capture console logs but prevent them from rendering on screen
const capturedLogs = [];
const captureConsoleLog = (type, ...args) => {
  if (type === "error") {
    return; // Prevent console.error() from displaying errors in React UI
  }

  const logEntry = {
    type, // log, warn, error
    message: args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
      .join(" "),
    timestamp: new Date().toISOString(),
  };
  capturedLogs.push(logEntry);

  // Call the original console function for logging/warning (but not errors)
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
  <BrowserRouter>
    <ScrollToTop />
    <UserProvider>
      {process.env.REACT_APP_ENV === "production" ? (
        <AppWithErrorBoundary />
      ) : (
        <App />
      )}
    </UserProvider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
