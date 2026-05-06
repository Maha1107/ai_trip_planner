# AI Trip Planner - New Chat Features

## Overview

This document outlines the new chat-based trip planning features implemented for the AI Trip Planner application. The system now supports natural language processing to understand full trip requests in a single message, followed by intelligent flight and hotel recommendations.

## New Features Implemented

### 1. **Smart NLP Message Parsing**
- **Location**: `backend/services/nlpService.js`
- **Functionality**:
  - Detects greeting messages ("hi", "hello", "how are you", etc.)
  - Identifies simple questions and provides contextual answers
  - Parses complex trip messages to extract:
    - Source location (origin city)
    - Destination
    - Start date (YYYY-MM-DD format)
    - End date or duration in days
    - Budget in rupees
  - Returns confidence score for parsing accuracy

**Example Input:**
```
"I want to go from Hyderabad to Goa from 2026-06-10 to 2026-06-15 with budget 25000"
```

**Parsed Output:**
```json
{
  "source": "hyderabad",
  "destination": "goa",
  "startDate": "2026-06-10",
  "endDate": "2026-06-15",
  "days": 5,
  "budget": 25000,
  "confidence": 0.95
}
```

### 2. **Trip Service with Budget Filtering**
- **Location**: `backend/services/tripService.js`
- **Features**:
  - Mock flight search API with realistic pricing
  - Mock hotel search API with budget tiers (cheap, moderate, luxury)
  - Budget filtering logic:
    - Flights: Max 40% of total budget
    - Hotels: Max 35% of total budget
    - Remaining: For meals, activities, and transport
  - Returns cheapest options if results exceed budget

### 3. **Chat Controller**
- **Location**: `backend/controllers/chatController.js`
- **Endpoints**: `POST /chat`
- **Capabilities**:
  - Handles greetings with friendly responses
  - Answers common questions about the service
  - Processes trip planning requests
  - Returns structured JSON responses with:
    - Response type (greeting, question, clarification, trip, error)
    - Human-readable message
    - Parsed trip data and flight/hotel options

**Request Format:**
```json
{
  "message": "I want to go from Hyderabad to Goa from 2026-06-10 to 2026-06-15 with budget 25000"
}
```

**Response Format:**
```json
{
  "type": "trip",
  "message": "Great! I found options for your trip to Goa...",
  "data": {
    "trips": [{
      "destination": "goa",
      "source": "hyderabad",
      "startDate": "2026-06-10",
      "endDate": "2026-06-15",
      "days": 5,
      "budget": 25000,
      "flights": [...],
      "hotels": {...}
    }]
  }
}
```

### 4. **React Frontend Components**

#### Chat Component (`src/components/Chat.jsx`)
- Clean chat interface with message history
- Real-time message loading indicator
- Auto-scrolling to latest messages
- Displays parsed trip data with flight/hotel cards
- Integration with itinerary display

#### MessageBubble Component (`src/components/MessageBubble.jsx`)
- User and bot message differentiation (left/right alignment)
- Clean styling with gradients
- Multi-line message support

#### FlightCard Component (`src/components/FlightCard.jsx`)
- Displays airline, flight number, times, and pricing
- Shows departure and arrival times
- Cost per person in rupees
- Optional select button for further processing

#### HotelCard Component (`src/components/HotelCard.jsx`)
- Hotel name and rating display
- Price per night with currency formatting
- Amenities list (WiFi, AC, Restaurant, etc.)
- Optional select button

#### Itinerary Component (`src/components/Itinerary.jsx`)
- Day-by-day itinerary display
- Scheduled activities with times
- Activity descriptions
- Easy-to-read layout

### 5. **Backend API Routes**

#### New Route
- `POST /chat` - Main chat interface with NLP parsing

#### Existing Routes (Backward Compatible)
- `GET /destinations` - List of available destinations
- `POST /search-flights-itinerary` - Legacy flight search
- `POST /search-hotels` - Legacy hotel search
- `POST /generate-itinerary` - Legacy itinerary generation
- `POST /itinerary-preview` - Destination preview

### 6. **Code Structure**

**Backend:**
```
backend/
  controllers/
    chatController.js      # Main chat request handler
  services/
    nlpService.js          # NLP parsing logic
    tripService.js         # Flight/hotel search logic
  server.js                # Express app with routes
```

**Frontend:**
```
trip-planner-frontend/src/
  components/
    Chat.jsx               # Main chat UI
    MessageBubble.jsx      # Message display
    FlightCard.jsx         # Flight display
    HotelCard.jsx          # Hotel display
    Itinerary.jsx          # Itinerary display
  styles/
    Chat.css               # Chat styling
```

## Usage Examples

### Example 1: Basic Greeting
```
User: "Hi, how can I plan a trip?"
Bot: "Hello! I'm your AI Trip Planner. I can help you plan amazing trips. Just tell me where you want to go, when, and your budget!"
```

### Example 2: Complete Trip Request
```
User: "I want to go from Delhi to Goa from 2026-07-01 to 2026-07-07 with budget 35000"
Bot: "Great! I found options for your trip to Goa:
📍 Destination: Goa
📅 Travel Duration: 6 days
💰 Your Budget: ₹35,000

✈️ Available Flights:
1. IndiGo (6E 234) - ₹5,500 per person
2. SpiceJet (SG 512) - ₹4,800 per person
3. Air India (AI 702) - ₹6,200 per person

🏨 Available Hotels:
1. Budget Inn - ₹1,500/night
2. Comfort Palace - ₹3,500/night
3. Luxury Palace - ₹8,500/night"
```

### Example 3: Incomplete Request
```
User: "I want to go to Bali with 20000 budget"
Bot: "I'd like to help plan your trip! Please provide:
- Destination (✓ Bali)
- Start date in YYYY-MM-DD format (required)
- Number of days OR end date (required)
- Budget in rupees (✓ 20000)
- Source city (optional)

Example: 'I want to go from Hyderabad to Goa from 2026-06-10 to 2026-06-15 with budget 25000'"
```

## Environment Variables

Add to `.env` files:
```bash
# Frontend (.env)
REACT_APP_API_URL=https://ai-trip-planner-ldi5.onrender.com

# Backend (already configured)
PORT=5001
```

## Routes and Navigation

- `/` - Home page with "Get Started" button
- `/plan` - Traditional step-by-step trip planner (TripPlanner.js)
- `/chat` - New single-message chat-based trip planner

## Styling & UI

- **Colors**: Purple gradient (#667eea → #764ba2) for primary actions
- **Message Bubbles**: Left-aligned for bot, right-aligned for user
- **Cards**: White background with shadow, hover effects
- **Loading State**: Animated dots indicator
- **Responsive**: Mobile-friendly with breakpoints at 768px

## Testing the Chat Feature

1. Start backend:
```bash
cd backend
npm install
npm start
```

2. Start frontend:
```bash
cd trip-planner-frontend
npm install
npm start
```

3. Navigate to `/chat` route in the app
4. Try these messages:
   - "Hello"
   - "How can you help me?"
   - "I want to go from Hyderabad to Goa from 2026-06-10 to 2026-06-15 with budget 20000"

## Future Enhancements

1. **Real API Integration**: Replace mock data with actual flight/hotel APIs
2. **Gemini AI Integration**: Use Google Generative AI for better itinerary generation
3. **SerpAPI Integration**: Real-time flight and hotel search
4. **Booking Integration**: Direct booking capabilities
5. **User Accounts**: Save favorite trips and preferences
6. **Multi-language Support**: Support for Hindi, Regional languages
7. **Payment Gateway**: In-app payment processing

## Error Handling

- Invalid date formats are caught and user is prompted with correct format
- Missing fields trigger clarification messages
- API failures gracefully fall back with helpful messages
- Network errors are displayed to user

## Notes

- Mock data is used for flights/hotels; update to real APIs when available
- NLP parsing uses regex patterns; can be enhanced with machine learning
- Chat messages are not persisted; they exist only in session
- All prices are in Indian Rupees (₹)
