import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TripPlanner.css';

const rawApiBase = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const API_BASE_URL = (() => {
  let base = rawApiBase.trim();
  if (!base) return 'http://localhost:5001';
  // Add protocol if missing
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`;
  }
  // Remove trailing slashes
  return base.replace(/\/+$|\/$/, '');
})();

function TripPlanner() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [chatStep, setChatStep] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m your AI Trip Planner. Let\'s plan your perfect trip together! 🌍' },
    { type: 'bot', text: 'First, where would you like to go?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [tripData, setTripData] = useState({
    destination: '',
    startDate: '',
    currentLocation: '',
    selectedInboundFlight: null,
    selectedOutboundFlight: null,
    selectedReturnFlight: null,
    selectedHotel: null,
    stayDays: '',
    flights: [],
    hotels: [],
    itinerary: null,
    totalBudget: 0,
    returnDate: '',
    returnFromLocation: '',
    returnToLocation: '',
    isApproximateFlights: false
  });
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Fetch destinations for autocomplete
    fetch(`${API_BASE_URL}/destinations`)
      .then(response => response.json())
      .then(data => setDestinations(data))
      .catch(err => console.error('Error fetching destinations:', err));
  }, []);

  const addMessage = (text, type = 'bot') => {
    setChatMessages(prev => [...prev, { type, text }]);
  };

  const searchFlightsAndShowOptions = async (from, to, givenDate) => {
    setLoading(true);
    try {
      const dateString = givenDate || (() => {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        return defaultDate.toISOString().split('T')[0];
      })();
      setTripData(prev => ({ ...prev, startDate: dateString }));

      // Search for flights
      const flightResponse = await fetch(`${API_BASE_URL}/search-flights-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, date: dateString, members: 2 })
      });

      if (!flightResponse.ok) {
        addMessage('Sorry, I couldn\'t find flights right now. Please try again later.');
        setLoading(false);
        return;
      }

      const flightData = await flightResponse.json();

      if (!flightData.flights || flightData.flights.length === 0) {
        addMessage('Sorry, I couldn\'t find any flights for your route. Please try a different destination or contact us for assistance.');
        setLoading(false);
        return;
      }

      setTripData(prev => ({ ...prev, flights: flightData.flights, isApproximateFlights: flightData.isApproximate }));

      let flightMessage = flightData.isApproximate
        ? 'Real-time flight data is currently unavailable. Here are approximate flight costs based on historical data:\n\n'
        : 'Here are the best flight options I found:\n\n';

      flightData.flights.forEach((flight, index) => {
        flightMessage += `${index + 1}. ${flight.airline} ${flight.flightNumber !== 'N/A' ? flight.flightNumber : ''}\n`;
        flightMessage += `   🕐 ${flight.departure} - ${flight.arrival}\n`;
        flightMessage += `   💰 ₹${flight.cost} per person\n`;
        if (flight.note) {
          flightMessage += `   📍 ${flight.note}\n`;
        }
        if (flight.isApproximate) {
          flightMessage += `   ⚠️ Approximate cost\n`;
        }
        flightMessage += '\n';
      });
      flightMessage += 'Please reply with the number to select your flight.';

      addMessage(flightMessage);
      setChatStep(3); // Flight selection step
    } catch (error) {
      console.error('Flight search error:', error);
      addMessage('Sorry, I encountered an error while searching for flights. Please try again later.');
    }
    setLoading(false);
  };

  const searchHotelsForSelection = async (destination, date) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/search-hotels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, date, starRating: 4 })
      });

      if (!response.ok) {
        addMessage('Sorry, I couldn\'t find hotels right now. Let me proceed with your flight selection to create the itinerary.');
        setLoading(false);
        await generateFinalItinerary();
        return;
      }

      const data = await response.json();

      // Create a flat array of all hotels for selection
      const allHotels = [
        ...(data.hotels.cheap || []),
        ...(data.hotels.moderate || []),
        ...(data.hotels.luxury || [])
      ];

      setTripData(prev => ({ ...prev, hotels: allHotels }));

      let hotelMessage = 'Here are great hotel options in ' + destination + ':\n\n';

      let optionNumber = 1;

      // Display cheap hotels
      if (data.hotels.cheap && data.hotels.cheap.length > 0) {
        hotelMessage += '💰 BUDGET OPTIONS:\n';
        data.hotels.cheap.forEach((hotel) => {
          hotelMessage += `${optionNumber}. ${hotel.hotel_name} - ₹${hotel.price_per_night}/night (${hotel.rating}★)\n`;
          optionNumber++;
        });
        hotelMessage += '\n';
      }

      // Display moderate hotels
      if (data.hotels.moderate && data.hotels.moderate.length > 0) {
        hotelMessage += '🏨 MODERATE OPTIONS:\n';
        data.hotels.moderate.forEach((hotel) => {
          hotelMessage += `${optionNumber}. ${hotel.hotel_name} - ₹${hotel.price_per_night}/night (${hotel.rating}★)\n`;
          optionNumber++;
        });
        hotelMessage += '\n';
      }

      // Display luxury hotels
      if (data.hotels.luxury && data.hotels.luxury.length > 0) {
        hotelMessage += '🏰 LUXURY OPTIONS:\n';
        data.hotels.luxury.forEach((hotel) => {
          hotelMessage += `${optionNumber}. ${hotel.hotel_name} - ₹${hotel.price_per_night}/night (${hotel.rating}★)\n`;
          optionNumber++;
        });
        hotelMessage += '\n';
      }

      hotelMessage += 'Please reply with the number to select your hotel.';

      addMessage(hotelMessage);
      setChatStep(4);
    } catch (error) {
      console.error('Hotel search error:', error);
      addMessage('Sorry, I couldn\'t find hotels right now. Let me proceed with creating your itinerary.');
      await generateFinalItinerary();
    }
    setLoading(false);
  };

  const generateFinalItinerary = async () => {
    setLoading(true);
    try {
      // Generate return flight using the collected return flight details
      const returnFlightResponse = await fetch(`${API_BASE_URL}/search-flights-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: tripData.returnFromLocation,
          to: tripData.returnToLocation,
          date: tripData.returnDate,
          members: 2
        })
      });

      let selectedReturnFlight = null;
      if (returnFlightResponse.ok) {
        const returnFlightData = await returnFlightResponse.json();
        if (returnFlightData.flights && returnFlightData.flights.length > 0) {
          selectedReturnFlight = returnFlightData.flights[0];
          setTripData(prev => ({
            ...prev,
            selectedOutboundFlight: selectedReturnFlight,
            selectedReturnFlight: selectedReturnFlight
          }));
        }
      }

      // Generate itinerary
      const response = await fetch(`${API_BASE_URL}/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: tripData.destination,
          days: tripData.stayDays,
          startDate: tripData.startDate,
          inboundFlight: tripData.selectedInboundFlight,
          outboundFlight: selectedReturnFlight,
          hotel: tripData.selectedHotel
        })
      });

      if (!response.ok) {
        addMessage('I have your flight and hotel selections, but couldn\'t generate the detailed itinerary. Here\'s your trip summary:');
        showTripSummary();
        return;
      }

      const data = await response.json();

      // Calculate total budget
      const inboundCost = tripData.selectedInboundFlight.cost * 2; // for 2 passengers
      const outboundCost = selectedReturnFlight ? selectedReturnFlight.cost * 2 : 0;
      const hotelCost = tripData.selectedHotel ? tripData.selectedHotel.price_per_night * tripData.stayDays * 2 : 0;
      const otherExpenses = 5000 * tripData.stayDays; // approximate other expenses
      const totalBudget = inboundCost + outboundCost + hotelCost + otherExpenses;
      const returnDateString = tripData.returnDate || 'N/A';

      setTripData(prev => ({
        ...prev,
        itinerary: data.itinerary,
        totalBudget,
        selectedReturnFlight: selectedReturnFlight || prev.selectedReturnFlight
      }));

      let summaryMessage = `🎉 Your trip is ready!\n\n`;
      summaryMessage += `📍 Destination: ${tripData.destination}\n`;
      summaryMessage += `📅 Duration: ${tripData.stayDays} days (${tripData.startDate} to ${returnDateString})\n`;
      summaryMessage += `✈️ Inbound: ${tripData.selectedInboundFlight.airline} ${tripData.selectedInboundFlight.flightNumber !== 'N/A' ? tripData.selectedInboundFlight.flightNumber : ''} - ₹${inboundCost}\n`;
      if (selectedReturnFlight) {
        summaryMessage += `✈️ Outbound: ${selectedReturnFlight.airline} ${selectedReturnFlight.flightNumber !== 'N/A' ? selectedReturnFlight.flightNumber : ''} - ₹${outboundCost}\n`;
      }
      if (tripData.selectedHotel) {
        summaryMessage += `🏨 Hotel: ${tripData.selectedHotel.hotel_name} - ₹${hotelCost}\n`;
      }
      summaryMessage += `💰 Other expenses: ₹${otherExpenses}\n`;
      summaryMessage += `💵 **Total Budget: ₹${totalBudget.toLocaleString()}**\n\n`;

      summaryMessage += `📋 Your personalized itinerary:\n`;
      data.itinerary.forEach(day => {
        summaryMessage += `\nDay ${day.day}: ${day.title}\n`;
        if (day.schedule) {
          day.schedule.forEach(item => {
            summaryMessage += `  ${item.time}: ${item.activity} - ${item.description}\n`;
          });
        }
      });

      addMessage(summaryMessage);
      setChatStep(9); // Trip completed
    } catch (error) {
      console.error('Itinerary generation error:', error);
      addMessage('I have your selections but encountered an error creating the itinerary. Here\'s your trip summary:');
      showTripSummary();
    }
    setLoading(false);
  };

  const showTripSummary = () => {
    // Calculate basic budget if possible
    const inboundCost = tripData.selectedInboundFlight ? tripData.selectedInboundFlight.cost * 2 : 0;
    const outboundCost = tripData.selectedReturnFlight ? tripData.selectedReturnFlight.cost * 2 : 0;
    const hotelCost = tripData.selectedHotel ? tripData.selectedHotel.price_per_night * tripData.stayDays * 2 : 0;
    const totalBudget = inboundCost + outboundCost + hotelCost;

    setTripData(prev => ({ ...prev, totalBudget }));
    setChatStep(5);
  };

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const input = userInput.trim();
    setUserInput('');

    // Add user message to chat
    addMessage(input, 'user');

    switch (chatStep) {
      case 0: // Destination selection
        if (!destinations || destinations.length === 0) {
          addMessage('Loading destinations... Please try again in a moment.');
          return;
        }
        const normalizedInput = input.toLowerCase().trim();
        const matchedDestination = destinations.find(dest => dest && dest.toLowerCase() === normalizedInput);
        if (matchedDestination) {
          setTripData(prev => ({ ...prev, destination: matchedDestination }));
          
          // Get itinerary preview for the destination
          fetch(`${API_BASE_URL}/itinerary-preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination: matchedDestination, days: 3 }) // Default 3 days preview
          })
          .then(response => response.json())
          .then(data => {
            if (data.preview) {
              addMessage(`Great! You've selected ${matchedDestination} as your destination. Here's a preview of what you might experience:\n\n${data.preview}\n\nWhen would you like to start your trip? Please enter the date in YYYY-MM-DD format.`);
            } else {
              addMessage(`Great! You've selected ${matchedDestination} as your destination. When would you like to start your trip? Please enter the date in YYYY-MM-DD format.`);
            }
          })
          .catch(err => {
            console.error('Itinerary preview error:', err);
            addMessage(`Great! You've selected ${matchedDestination} as your destination. When would you like to start your trip? Please enter the date in YYYY-MM-DD format.`);
          });
          
          setChatStep(1);
        } else {
          addMessage(`Sorry, ${input} is not in our list of destinations. Please choose from: ${destinations.filter(d => d).join(', ')}`);
        }
        break;

      case 1: // Start date
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(input)) {
          const selectedDate = new Date(input);
          const today = new Date();
          if (selectedDate >= today) {
            setTripData(prev => ({ ...prev, startDate: input }));
            addMessage(`Perfect! Your trip starts on ${input}. Where are you traveling from?`);
            setChatStep(2);
          } else {
            addMessage('Please enter a future date in YYYY-MM-DD format.');
          }
        } else {
          addMessage('Please enter the date in YYYY-MM-DD format (e.g., 2026-06-15).');
        }
        break;

      case 2: // Current location
        setTripData(prev => ({ ...prev, currentLocation: input }));
        addMessage(`Got it! You're traveling from ${input} to ${tripData.destination} on ${tripData.startDate}. Let me find flight options for you...`);
        await searchFlightsAndShowOptions(input, tripData.destination, tripData.startDate);
        break;

      case 3: // Flight selection
        const flightIndex = parseInt(input) - 1;
        if (flightIndex >= 0 && flightIndex < tripData.flights.length) {
          const selectedFlight = tripData.flights[flightIndex];
          setTripData(prev => ({ ...prev, selectedInboundFlight: selectedFlight }));
          addMessage(`Great choice! You've selected the ${selectedFlight.airline} flight for ₹${selectedFlight.cost}. Now let me show you hotel options in ${tripData.destination}...`);
          await searchHotelsForSelection(tripData.destination, tripData.startDate);
        } else {
          addMessage(`Please enter a valid flight number (1-${tripData.flights.length}).`);
        }
        break;

      case 4: // Hotel selection
        const hotelIndex = parseInt(input) - 1;
        if (hotelIndex >= 0 && hotelIndex < tripData.hotels.length) {
          const selectedHotel = tripData.hotels[hotelIndex];
          setTripData(prev => ({ ...prev, selectedHotel: selectedHotel }));
          addMessage(`Perfect! You've chosen ${selectedHotel.hotel_name} for ₹${selectedHotel.price_per_night} per night. How many days would you like to stay?`);
          setChatStep(5);
        } else {
          addMessage(`Please enter a valid hotel number (1-${tripData.hotels.length}).`);
        }
        break;

      case 5: // Number of days
        const days = parseInt(input);
        if (days > 0 && days <= 30) {
          setTripData(prev => ({ ...prev, stayDays: input }));
          addMessage(`Great! ${days} days in ${tripData.destination}. Now I need details for your return flight. When would you like to return? Please enter the date in YYYY-MM-DD format.`);
          setChatStep(6);
        } else {
          addMessage('Please enter a valid number of days (1-30).');
        }
        break;

      case 6: // Return flight date
        const returnDateInput = input.trim();
        const returnDatePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (returnDatePattern.test(returnDateInput)) {
          const returnDate = new Date(returnDateInput);
          const startDate = new Date(tripData.startDate);
          if (returnDate > startDate) {
            setTripData(prev => ({ ...prev, returnDate: returnDateInput }));
            addMessage(`Return flight on ${returnDateInput}. Where will you be flying back from? (usually ${tripData.destination})`);
            setChatStep(7);
          } else {
            addMessage('Return date must be after your departure date. Please enter a valid date.');
          }
        } else {
          addMessage('Please enter the date in YYYY-MM-DD format.');
        }
        break;

      case 7: // Return flight from location
        setTripData(prev => ({ ...prev, returnFromLocation: input }));
        addMessage(`Flying back from ${input}. Where will you be flying back to? (usually ${tripData.currentLocation})`);
        setChatStep(8);
        break;

      case 8: // Return flight to location and generate itinerary
        setTripData(prev => ({ ...prev, returnToLocation: input }));
        addMessage(`Perfect! Return flight to ${input}. Now let me create your personalized itinerary...`);
        await generateFinalItinerary();
        break;

      default:
        addMessage('I\'m not sure what you mean. Please follow the chat flow.');
    }
  };

  return (
    <div className="trip-planner">
      <div className="floating-elements">
        <div className="floating-1">🌍</div>
        <div className="floating-2">✈️</div>
        <div className="floating-3">🏕️</div>
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <button className="back-button" onClick={() => navigate('/')}>← Back to Home</button>
          <h1>🤖 AI Trip Planner Chat</h1>
        </div>

        <div className="chat-messages">
          {chatMessages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                {message.text.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex}>{line}</div>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {chatStep < 9 && (
          <form onSubmit={handleUserInput} className="chat-input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                chatStep === 0 ? "Enter destination..." :
                chatStep === 1 ? "YYYY-MM-DD format..." :
                chatStep === 2 ? "Enter your current city..." :
                chatStep === 3 ? "Enter flight number..." :
                chatStep === 4 ? "Enter hotel number..." :
                chatStep === 5 ? "Enter number of days..." :
                chatStep === 6 ? "YYYY-MM-DD format..." :
                chatStep === 7 ? "Enter return from city..." :
                chatStep === 8 ? "Enter return to city..." :
                "Type your response..."
              }
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !userInput.trim()}>
              {loading ? '⏳' : '📤'}
            </button>
          </form>
        )}

        {chatStep === 9 && tripData.totalBudget > 0 && (
          <div className="trip-summary">
            <h2>🎉 Your Trip is Ready!</h2>
            <div className="summary-card">
              <div className="summary-details">
                <div className="summary-item">
                  <span>📍 Destination:</span>
                  <strong>{tripData.destination}</strong>
                </div>
                <div className="summary-item">
                  <span>📅 Duration:</span>
                  <strong>{tripData.stayDays} days</strong>
                </div>
                <div className="summary-item">
                  <span>✈️ Inbound Flight:</span>
                  <strong>{tripData.selectedInboundFlight?.airline} - ₹{tripData.selectedInboundFlight?.cost * 2}</strong>
                </div>
                <div className="summary-item">
                  <span>🏨 Hotel:</span>
                  <strong>{tripData.selectedHotel?.hotel_name} - ₹{tripData.selectedHotel?.price_per_night * tripData.stayDays * 2}</strong>
                </div>
                <div className="summary-item">
                  <span>✈️ Outbound Flight:</span>
                  <strong>{tripData.selectedReturnFlight?.airline || 'N/A'} - ₹{tripData.selectedReturnFlight ? tripData.selectedReturnFlight.cost * 2 : 0}</strong>
                </div>
                <div className="summary-item total">
                  <span>💵 Total Budget:</span>
                  <strong>₹{tripData.totalBudget.toLocaleString()}</strong>
                </div>
              </div>

              {tripData.itinerary && (
                <div className="itinerary-preview">
                  <h3>📅 Your Detailed Itinerary</h3>
                  <div className="itinerary-days">
                    {tripData.itinerary.map((day, index) => (
                      <div key={index} className="day-detail">
                        <h4>{day.title}</h4>
                        <div className="day-schedule">
                          {day.schedule?.map((item, itemIndex) => (
                            <div key={itemIndex} className="schedule-item">
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
              )}

              <div className="action-buttons">
                <button className="plan-again-button" onClick={() => {
                  setChatStep(0);
                  setChatMessages([
                    { type: 'bot', text: 'Hello! I\'m your AI Trip Planner. Let\'s plan your perfect trip together! 🌍' },
                    { type: 'bot', text: 'First, where would you like to go?' }
                  ]);
                  setTripData({
                    destination: '',
                    startDate: '',
                    currentLocation: '',
                    selectedInboundFlight: null,
                    selectedOutboundFlight: null,
                    selectedReturnFlight: null,
                    selectedHotel: null,
                    stayDays: '',
                    flights: [],
                    hotels: [],
                    itinerary: null,
                    totalBudget: 0,
                    returnDate: '',
                    returnFromLocation: '',
                    returnToLocation: '',
                    isApproximateFlights: false
                  });
                }}>
                  🔄 Plan Another Trip
                </button>
                <button className="download-button" onClick={() => {
                  let content = `Trip Itinerary for ${tripData.destination}\n\n`;
                  content += `Duration: ${tripData.stayDays} days\n`;
                  content += `Total Budget: ₹${tripData.totalBudget.toLocaleString()}\n\n`;

                  if (tripData.itinerary) {
                    tripData.itinerary.forEach(day => {
                      content += `${day.title}\n`;
                      if (day.schedule) {
                        day.schedule.forEach(item => {
                          content += `  ${item.time}: ${item.activity} - ${item.description}\n`;
                        });
                      }
                      content += '\n';
                    });
                  }

                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${tripData.destination}_itinerary.txt`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                }}>
                  📥 Download Itinerary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripPlanner;