# AI Enabled Trip Planner

This project consists of a React frontend and an Express.js backend, integrated with a Random Forest AI prediction model for personalized trip planning.

## Features
- **Landing Page**: Beautiful home page with travel-themed design and animations
- **Trip Planning Form**: Interactive form with destination selection, duration, budget, and travel companions
- **AI Predictions**: Backend uses travel agency datasets to provide personalized recommendations
- **Real-time Results**: Instant trip cost calculations and suggestions
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack
- **Frontend**: React.js with React Router for navigation
- **Backend**: Express.js with Node.js
- **AI Model**: Random Forest algorithm for trip cost predictions
- **Data**: Travel agency datasets with destinations, costs, and recommendations

## Setup

### Backend
1. Navigate to `backend` folder
2. Run `npm install`
3. Run `npm start`

### Frontend
1. Navigate to `trip-planner-frontend` folder
2. Run `npm install`
3. Run `npm start`

## API Endpoints
- `GET /destinations` - Get list of available destinations
- `POST /predict` - Get AI-powered trip recommendations
  - Body: `{ "destination": "Paris, France", "days": 5, "budget": "moderate", "companions": "couple" }`
  - Response: Detailed trip plan with costs, recommendations, and suggestions

## Running the Application
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`

## How to Use
1. Visit the home page and click "Get Started"
2. Fill out the trip planning form:
   - Select destination from dropdown (30+ famous destinations worldwide)
   - Enter number of days (1-30)
   - Choose budget level (Cheap/Moderate/Luxury) with visual cards
   - Select travel companions (Just Me/Couple/Family/Friends) with visual cards
3. Click "🚀 Get My Trip Plan" to see AI-generated recommendations including:
   - Total estimated cost
   - Best time to visit
   - Top attractions
   - Accommodation suggestions
   - Transportation recommendations

## Features Included
- ✅ Beautiful landing page with floating travel emojis and animations
- ✅ Interactive trip planning form with card-based selections
- ✅ AI-powered cost calculations using Random Forest model
- ✅ Personalized recommendations based on travel agency datasets
- ✅ Responsive design for all devices
- ✅ Real-time form validation
- ✅ Loading states and error handling

Open the frontend in your browser to see the landing page.