import React from 'react';

const Itinerary = ({ itinerary, destination, days }) => {
  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="itinerary-container">
        <p>Itinerary will be generated soon...</p>
      </div>
    );
  }

  return (
    <div className="itinerary-container">
      <h3>Your {days}-Day Itinerary for {destination}</h3>
      <div className="itinerary-days">
        {itinerary.map((day, index) => (
          <div key={index} className="itinerary-day">
            <h4>{day.title}</h4>
            <div className="day-schedule">
              {day.schedule && day.schedule.map((item, itemIdx) => (
                <div key={itemIdx} className="schedule-item">
                  <span className="time">{item.time}</span>
                  <span className="activity">{item.activity}</span>
                  <span className="description">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Itinerary;
