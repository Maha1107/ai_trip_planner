import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import FlightCard from './FlightCard';
import HotelCard from './HotelCard';
import Itinerary from './Itinerary';
import '../styles/Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I\'m your AI Trip Planner. Tell me your trip in one message, including destination, dates, and budget.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [lastIntent, setLastIntent] = useState(null);
  const messagesEndRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text, type = 'bot') => {
    setMessages(prev => [...prev, {
      type,
      text,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, 'user');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      addMessage(data.message, 'bot');
      setLastIntent(data.type);

      if (data.type === 'trip' && data.data) {
        setTripData(data.data);
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
      setLoading(false);
    }
  };

  const flightOptions = tripData?.flights || [];
  const returnFlightOptions = tripData?.returnFlights || [];
  const hotelOptions = tripData?.hotels
    ? [...(tripData.hotels.cheap || []), ...(tripData.hotels.moderate || []), ...(tripData.hotels.luxury || [])]
    : [];

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="hero-copy">
          <span className="eyebrow">AI Trip Planner</span>
          <h1>Plan your next trip with one message</h1>
          <p>Tell me your destination, travel dates, and budget—and I’ll create a flight, hotel, and itinerary plan for you.</p>
        </div>
      </div>

      <div className="chat-messages-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.type}`}>
            <MessageBubble message={msg.text} type={msg.type} />
          </div>
        ))}

        {loading && (
          <div className="message-row bot">
            <div className="loading-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {flightOptions.length > 0 && (
          <div className="cards-grid">
            <h4 className="outbound-flights-header">Outbound Flights</h4>
            {flightOptions.map((flight, idx) => (
              <FlightCard key={idx} flight={flight} index={idx} />
            ))}
          </div>
        )}

        {returnFlightOptions.length > 0 && (
          <div className="cards-grid">
            <h4 className="inbound-flights-header">Inbound Flights</h4>
            {returnFlightOptions.map((flight, idx) => (
              <FlightCard key={`return-${idx}`} flight={flight} index={idx} />
            ))}
          </div>
        )}

        {hotelOptions.length > 0 && (
          <div className="cards-grid">
            <h4 className="available-hotels-header">Available Hotels</h4>
            {hotelOptions.slice(0, 4).map((hotel, idx) => (
              <HotelCard key={idx} hotel={hotel} index={idx} />
            ))}
          </div>
        )}

        {tripData?.itinerary && (
          <Itinerary
            itinerary={tripData.itinerary}
            destination={tripData.destination}
            days={tripData.days}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me about your trip: From Hyderabad to Goa from 2026-06-10 to 2026-06-15 with budget 25000"
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Loading...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Chat;
