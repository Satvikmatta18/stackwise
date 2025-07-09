import React, { useState, useEffect } from 'react';
import './index.css'; // Import the global styles

function App() {
  // Define an array of colors to cycle through
  const colors = [
    '#FFC0CB', // Light Pink
    '#ADD8E6', // Light Blue
    '#90EE90', // Light Green
    '#FFFF99', // Light Yellow
    '#DDA0DD'  // Plum (Light Purple)
  ];

  // State to manage the index of the current background color in the array
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  // Derive the current background color from the array using the current index
  const currentBackgroundColor = colors[currentColorIndex];

  // useEffect hook to apply the background color to the document body.
  // This ensures the entire page background changes.
  // It runs once after the initial render and whenever currentBackgroundColor changes.
  useEffect(() => {
    document.body.style.backgroundColor = currentBackgroundColor;
  }, [currentBackgroundColor]); // Dependency array: re-run this effect when currentBackgroundColor changes

  // Function to handle the button click and change the background color
  const changeBackgroundColor = () => {
    // Increment the index and use the modulo operator to cycle back to 0
    // when the end of the colors array is reached.
    setCurrentColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
  };

  return (
    <div className='App'>
      <h1>Background Color Changer</h1>
      <p>Click the button below to cycle through different background colors.</p>
      <button onClick={changeBackgroundColor}>
        Change Background Color
      </button>
      <p>
        Current Color: <strong>{currentBackgroundColor}</strong>
      </p>
    </div>
  );
}

export default App;
