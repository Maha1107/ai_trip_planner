require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const tripService = require('./services/tripService');
const nlpService = require('./services/nlpService');

console.log('SERP_API_KEY loaded:', !!process.env.SERP_API_KEY, process.env.SERP_API_KEY ? process.env.SERP_API_KEY.slice(0,4) + '...' : 'NONE');
const testMsg = 'I want flights from Delhi to Goa from 2026-06-10 to 2026-06-14 with a budget of 50000';
const parsed = nlpService.parseTripDetails(testMsg);
console.log('Parsed:', JSON.stringify(parsed, null, 2));

(async () => {
  try {
    const flights = await tripService.searchFlights(parsed.source, parsed.destination, parsed.startDate, parsed.endDate);
    console.log('Flights result count:', flights.length);
    console.log('Flights sample:', JSON.stringify(flights, null, 2).slice(0, 2000));
  } catch (e) {
    console.error('Flights error:', e.message || e);
  }

  try {
    const hotels = await tripService.searchHotels(parsed.destination, parsed.startDate, parsed.endDate);
    console.log('Hotels result groups keys:', Object.keys(hotels));
    console.log('Hotels sample:', JSON.stringify(hotels, null, 2).slice(0, 2000));
  } catch (e) {
    console.error('Hotels error:', e.message || e);
  }

  try {
    const places = await tripService.searchPlaces(parsed.destination);
    console.log('Places count:', places.length);
    console.log('Places sample:', JSON.stringify(places, null, 2).slice(0, 2000));

    const itinerary = await tripService.generateItinerary(parsed.destination, parsed.startDate, parsed.endDate, places, parsed.budget);
    console.log('Generated itinerary:', JSON.stringify(itinerary, null, 2).slice(0, 4000));
  } catch (e) {
    console.error('Places/Itinerary error:', e.message || e);
  }
})();
