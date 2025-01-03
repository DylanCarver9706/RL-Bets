import React from "react";
import { createJiraIssue } from "../services/jiraService";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };

    // Capture console logs if provided
    this.capturedLogs = [];
    if (this.props.logs) {
      this.capturedLogs = [...this.props.logs];
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    this.sendCrashReport(error, info);
  }

  componentDidMount() {
    // Capture global errors
    window.onerror = (message, source, lineno, colno, error) => {
      const errorDetails = {
        message,
        source,
        lineno,
        colno,
        stack: error?.stack || "No stack trace",
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        user: this.props.user || null,
        logs: this.capturedLogs,
      };
      this.sendCrashReport(errorDetails);
    };

    // Capture unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const errorDetails = {
        message: event.reason?.message || "Unhandled promise rejection",
        stack: event.reason?.stack || "No stack trace",
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        user: this.props.user || null,
        logs: this.capturedLogs,
      };
      this.sendCrashReport(errorDetails);
    };
  }

  sendCrashReport(error, info = {}) {
    const errorDetails = {
      message: error.message || "Unknown error",
      stack: error.stack || "No stack trace",
      componentStack: info.componentStack || "No component stack",
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      user: this.props.user || null, // Pass user info if available
      logs: this.capturedLogs || [], // Include captured logs
    };

    // Send crash report
    createJiraIssue(
      this.props.user?.name || "unknown",
      this.props.user?.email || "unknown",
      this.props.user?.mongoUserId || "unknown",
      "Problem Report",
      "Client App Error Occurred",
      JSON.stringify(errorDetails, null, 2),
      "App Error Occurred"
    );
  }

  render() {
    if (this.state.hasError) {
      this.props.navigate("/Whoopsie-Daisy");
      return null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
