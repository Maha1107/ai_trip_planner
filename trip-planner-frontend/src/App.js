import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/chat');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="hero-copy">
          <span className="eyebrow">AI Trip Planner</span>
          <h1>Plan smarter trips in seconds</h1>
          <p className="hero-description">
            Personalized flight, hotel, and itinerary planning with a single message. Travel planning that feels effortless and stays within your budget.
          </p>
          <button onClick={handleGetStarted}>Get Started</button>
        </div>

        <div className="hero-panel">
          <div className="stat-card">
            <span>Destinations</span>
            <strong>20+</strong>
          </div>
          <div className="stat-card">
            <span>Trips planned</span>
            <strong>1,000+</strong>
          </div>
          <div className="stat-card">
            <span>Easy planning</span>
            <strong>One input</strong>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;