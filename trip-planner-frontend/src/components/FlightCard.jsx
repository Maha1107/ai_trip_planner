import React from 'react';

const FlightCard = ({ flight, index, onSelect }) => {
  return (
    <div className="flight-card">
      <div className="flight-header">
        <h4>{flight.airline}</h4>
        <span className="flight-number">{flight.flightNumber}</span>
      </div>
      <div className="flight-details">
        <div className="flight-time">
          <span className="departure">{flight.departure}</span>
          <span className="duration">→</span>
          <span className="arrival">{flight.arrival}</span>
        </div>
        <div className="flight-cost">
          <span className="price">₹{(flight.price || flight.cost || 0).toLocaleString()} per person</span>
        </div>
      </div>
      {onSelect && (
        <button className="select-button" onClick={() => onSelect(flight, index)}>
          Select Flight
        </button>
      )}
    </div>
  );
};

export default FlightCard;
