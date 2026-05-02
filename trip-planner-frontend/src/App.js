import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/plan');
  };

  return (
    <div className="App">
      <div className="floating-elements">
        <div className="floating-1">🌍</div>
        <div className="floating-2">✈️</div>
        <div className="floating-3">🏕️</div>
      </div>
      <header className="App-header">
        <h1>Discover your next adventure with mema</h1>
        <p>Personalized itineraries at your fingertips</p>
        <p>Your personal trip planner and travel curator, creating custom itineraries tailored to your interests and budget</p>
        <button onClick={handleGetStarted}>Get Started</button>
      </header>
    </div>
  );
}

export default App;