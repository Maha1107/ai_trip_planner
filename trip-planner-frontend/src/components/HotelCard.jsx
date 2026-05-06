import React from 'react';

const HotelCard = ({ hotel, index, onSelect }) => {
  return (
    <div className="hotel-card">
      <div className="hotel-header">
        <h4>{hotel.hotel_name}</h4>
        <span className="rating">{hotel.rating}★</span>
      </div>
      <div className="hotel-details">
        <div className="price">
          <span className="amount">₹{(hotel.price_per_night || 0).toLocaleString()}</span>
          <span className="per-night">per night</span>
        </div>
        {hotel.amenities && (
          <div className="amenities">
            {hotel.amenities.map((amenity, idx) => (
              <span key={idx} className="amenity-tag">{amenity}</span>
            ))}
          </div>
        )}
      </div>
      {onSelect && (
        <button className="select-button" onClick={() => onSelect(hotel, index)}>
          Select Hotel
        </button>
      )}
    </div>
  );
};

export default HotelCard;
