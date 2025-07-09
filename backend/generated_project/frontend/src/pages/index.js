import React, { useState, useEffect } from "react";

const IndexPage = () => {
  const [message, setMessage] = useState("Loading...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        // Access the API URL from environment variables
        const apiUrl = process.env.GATSBY_API_URL;
        if (!apiUrl) {
          throw new Error("GATSBY_API_URL is not defined. Please check your .env.development file.");
        }
        
        const response = await fetch(`${apiUrl}/hello`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error("Failed to fetch message:", error);
        setError(error.message);
        setMessage("Failed to load message.");
      }
    };

    fetchMessage();
  }, []);

  return (
    <main style={pageStyles}>
      <h1 style={headingStyles}>Welcome to your Gatsby App!</h1>
      <p style={paragraphStyles}>Fetching message from FastAPI backend...</p>
      {
        error ? (
          <p style={errorStyles}>Error: {error}</p>
        ) : (
          <p style={messageStyles}>Backend Message: {message}</p>
        )
      }
      <p style={footerStyles}>Make sure your FastAPI backend is running on {process.env.GATSBY_API_URL}</p>
    </main>
  );
};

export default IndexPage;

// Basic styles for the page (can be externalized or improved)
const pageStyles = {
  color: "#232129",
  padding: "96px",
  fontFamily: "-apple-system, Roboto, sans-serif, serif",
};
const headingStyles = {
  marginTop: 0,
  marginBottom: 64,
  maxWidth: 320,
};
const paragraphStyles = {
  marginBottom: 48,
};
const messageStyles = {
  fontSize: "1.5em",
  fontWeight: "bold",
  color: "#663399",
};
const errorStyles = {
  fontSize: "1.2em",
  fontWeight: "bold",
  color: "#FF0000",
};
const footerStyles = {
  marginTop: "48px",
  fontSize: "0.8em",
  color: "#555",
};
