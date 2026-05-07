/**
 * Chat Controller for handling user messages and orchestrating trip planning
 */

const nlpService = require('../services/nlpService');
const tripService = require('../services/tripService');

const greetingMessage = 'Hello! I\'m your AI Trip Planner. Tell me your trip in one message, including destination, dates, and budget.';
const fallbackMessage = 'Please provide destination, date, budget...';
const unknownMessage = 'I\'m not sure what you mean. Please tell me about your trip.';

async function handleChat(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        type: 'error',
        message: 'Please provide a valid message'
      });
    }

    const userMessage = message.trim();
    console.log("Incoming message:", userMessage);

    const intent = nlpService.detectIntent(userMessage);

    if (intent === 'greeting') {
      return res.json({
        type: 'greeting',
        message: greetingMessage,
        data: null
      });
    } else if (intent === 'trip_request') {
      const data = nlpService.parseTripDetails(userMessage);
      console.log("Parsed data:", data);

      if (data.isValid) {
        // Adjust dates if they are in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        if (start < today) {
          const futureStart = new Date(today);
          futureStart.setDate(today.getDate() + 7); // 7 days from today
          data.startDate = futureStart.toISOString().split('T')[0];
          const originalDuration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
          const futureEnd = new Date(futureStart);
          futureEnd.setDate(futureStart.getDate() + originalDuration);
          data.endDate = futureEnd.toISOString().split('T')[0];
        }

        console.log('About to validate destination:', data.destination);
        try {
          // Validate destination
          const isValidDestination = await tripService.validateDestination(data.destination);
          console.log('Destination validation result:', isValidDestination);
          if (!isValidDestination) {
            return res.json({
              type: 'fallback',
              message: `Sorry, I couldn't find information for "${data.destination}". Please try a different destination.`,
              data: data
            });
          }

          // Search outbound flights (one-way)
          const outboundFlights = await tripService.getFlights(data.source, data.destination, data.startDate);

          // Search inbound flights (one-way return)
          const inboundFlights = await tripService.getFlights(data.destination, data.source, data.endDate);

          // Search hotels
          const hotelResults = await tripService.searchHotels(data.destination, data.startDate, data.endDate);

          // Search places
          const placeResults = await tripService.searchPlaces(data.destination);

          // Generate itinerary
          const itineraryResult = await tripService.generateItinerary(data.destination, data.startDate, data.endDate, placeResults, data.budget);

          // Calculate budget
          const budgetPlan = tripService.calculateBudgetPlan(outboundFlights, hotelResults, data.budget);

          return res.json({
            type: 'trip',
            message: 'Here is your trip plan',
            data: {
              source: data.source,
              destination: data.destination,
              startDate: data.startDate,
              endDate: data.endDate,
              days: Math.max(1, Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24)) + 1),
              budget: data.budget,
              outboundFlights: outboundFlights,
              inboundFlights: inboundFlights,
              hotels: hotelResults,
              itinerary: itineraryResult
            }
          });
        } catch (error) {
          console.error('Trip search error:', error);
          if (error && error.isSerpApiError) {
            return res.status(502).json({
              type: 'error',
              message: 'SERP API key or configuration error. Please check your SERP API credentials.',
              data: data
            });
          }
          return res.json({
            type: 'fallback',
            message: fallbackMessage,
            data: data
          });
        }
      } else {
        return res.json({
          type: 'fallback',
          message: fallbackMessage,
          data: data
        });
      }
    } else {
      return res.json({
        type: 'fallback',
        message: unknownMessage,
        data: null
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      type: 'error',
      message: 'An unexpected error occurred. Please try again.',
      data: { error: error.message }
    });
  }
}

module.exports = {
  handleChat
};
