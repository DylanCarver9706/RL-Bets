import React from "react";
import { Navigate } from "react-router-dom";
import { createJiraIssue } from "../../../services/jiraService";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, outage: false };

    // Capture console logs if provided
    this.capturedLogs = this.props.logs ? [...this.props.logs] : [];
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }; // Ensure app does not crash UI
  }

  componentDidCatch(error, info) {
    this.handleError(error, info);
  }

  componentDidMount() {
    // Capture global errors
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(message));
    };

    // Capture unhandled promise rejections
    window.onunhandledrejection = (event) => {
      this.handleError(
        event.reason || new Error("Unhandled Promise Rejection")
      );
    };
  }

  handleError(error, info = {}) {
    if (!error) return;

    const errorMessage = error?.message || "Unknown error";

    // Detect "ERR_CONNECTION_REFUSED" or similar network errors
    const isConnectionRefused =
      errorMessage.includes("ERR_CONNECTION_REFUSED") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("Failed to fetch");

    // Set the correct state for navigation
    this.setState({
      outage: isConnectionRefused,
      hasError: !isConnectionRefused, // Ensure non-outage errors trigger Whoopsie-Daisy
    });

    // Send error details in production
    const errorDetails = {
      message: errorMessage,
      stack: error?.stack || "No stack trace",
      componentStack: info.componentStack || "No component stack",
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      user: this.props.user || null,
      logs: this.capturedLogs || [],
    };

    // Uncomment when Jira integration is available
    createJiraIssue(
      this.props.user?.name || "unknown",
      this.props.user?.email || "unknown",
      this.props.user?.mongoUserId || "unknown",
      "Problem Report",
      isConnectionRefused ? "App Outage Detected" : "Client App Error Occurred",
      JSON.stringify(errorDetails, null, 2),
      isConnectionRefused ? "App Outage" : "App Error Occurred"
    );
  }

  render() {
    if (this.state.outage && !this.state.hasError) {
      return <Navigate to="/app-outage" replace />;
    }

    if (this.state.hasError) {
      return <Navigate to="/whoopsie-daisy" replace />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
