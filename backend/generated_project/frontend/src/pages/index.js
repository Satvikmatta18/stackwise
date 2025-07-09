import React, { useState, useEffect } from "react";

const IndexPage = () => {
  // State to hold the current background color.
  // Initialized with a default light color that will be applied on first render.
  const [backgroundColor, setBackgroundColor] = useState("#f0f0f0"); 

  // Function to fetch a random color from the FastAPI backend.
  const fetchRandomColor = async () => {
    try {
      // The URL for the FastAPI backend endpoint.
      // Ensure this matches where your backend service is running.
      const response = await fetch("http://127.0.0.1:8000/random_color");
      
      if (!response.ok) {
        // If the response is not OK (e.g., 404, 500), throw an error.
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Update the state with the new color received from the backend.
      setBackgroundColor(data.color); 
    } catch (error) {
      console.error("Error fetching random color:", error);
      // Optionally, set a fallback color (e.g., red) to indicate an error to the user.
      setBackgroundColor("#FF0000"); 
    }
  };

  // Use useEffect to apply the 'backgroundColor' state to the document body's style.
  // This effect runs once after the initial render, and then every time 
  // 'backgroundColor' state changes.
  useEffect(() => {
    // Directly manipulate the document body's background color.
    // Global CSS (to be implemented in Step 4) will handle transitions and overall layout.
    document.body.style.backgroundColor = backgroundColor;
  }, [backgroundColor]); // Dependency array: effect re-runs if backgroundColor changes.

  return (
    <main>
      <h1>Random Color Changer</h1>
      <button onClick={fetchRandomColor}>
        Change Background Color
      </button>
      <p>Current Color: <span style={{ fontWeight: 'bold' }}>{backgroundColor}</span></p>
    </main>
  );
};

export default IndexPage;

// Gatsby's Head API allows you to set document head elements like the page title.
export const Head = () => <title>Random Color App</title>;
