const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import controllers and services
const chatController = require('./controllers/chatController');
const tripService = require('./services/tripService');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'AI Trip Planner Backend is running' });
});

// New chat endpoint with NLP and trip planning
app.post('/chat', chatController.handleChat);

app.post('/search-flights', async (req, res) => {
  try {
    const { source, destination, startDate, returnDate } = req.body;
    if (!source || !destination || !startDate) {
      return res.status(400).json({ error: 'source, destination, and startDate are required' });
    }

    const flights = returnDate
      ? await tripService.searchFlights(source, destination, startDate, returnDate)
      : await tripService.getFlights(source, destination, startDate);
    return res.json({ flights, message: 'Real-time flight results from SERP API' });
  } catch (error) {
    console.error('Search flights route error:', error.message || error);
    return res.status(500).json({
      error: 'Real-time data not available, showing approximate results'
    });
  }
});

app.post('/search-hotels', async (req, res) => {
  try {
    const { destination, checkInDate, checkOutDate } = req.body;
    if (!destination || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'destination, checkInDate, and checkOutDate are required' });
    }

    const hotels = await tripService.searchHotels(destination, checkInDate, checkOutDate);
    return res.json({ hotels, message: 'Real-time hotel results from SERP API' });
  } catch (error) {
    console.error('Search hotels route error:', error.message || error);
    return res.status(500).json({
      error: 'Real-time data not available, showing approximate results'
    });
  }
});

app.post('/search-places', async (req, res) => {
  try {
    const { destination } = req.body;
    if (!destination) {
      return res.status(400).json({ error: 'destination is required' });
    }

    const places = await tripService.searchPlaces(destination);
    return res.json({ places, message: 'Real-time place recommendations from SERP API' });
  } catch (error) {
    console.error('Search places route error:', error.message || error);
    return res.status(500).json({
      error: 'Real-time data not available, showing approximate results'
    });
  }
});

app.post('/generate-itinerary', async (req, res) => {
  try {
    const { source, destination, startDate, endDate, budget } = req.body;
    if (!source || !destination || !startDate || !endDate) {
      return res.status(400).json({ error: 'source, destination, startDate, and endDate are required' });
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
    const flights = await tripService.searchFlights(source, destination, startDate, endDate);
    const hotels = await tripService.searchHotels(destination, startDate, endDate);
    const places = await tripService.searchPlaces(destination);
    const itinerary = tripService.generateItinerary(destination, startDate, endDate, places);
    const budgetPlan = tripService.calculateBudgetPlan(flights, hotels, days, budget);

    const response = {
      flights: budgetPlan.flights,
      hotels: budgetPlan.hotels,
      places,
      itinerary,
      budgetSummary: budgetPlan.budgetSummary
    };

    return res.json(response);
  } catch (error) {
    console.error('Generate itinerary route error:', error.message || error);
    return res.status(500).json({
      error: 'Real-time data not available, showing approximate results'
    });
  }
});

// Serve React frontend from build when available
const buildPath = path.join(__dirname, '..', 'trip-planner-frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`AI Trip Planner Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Chat API: POST http://localhost:${PORT}/chat`);
});
