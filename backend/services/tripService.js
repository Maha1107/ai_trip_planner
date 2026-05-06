const https = require('https');
const querystring = require('querystring');
// const fetch = require('node-fetch'); // Removed, using built-in fetch

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed && parsed.error) {
              const message = typeof parsed.error === 'string' ? parsed.error : parsed.error.message || JSON.stringify(parsed.error);
              const error = new Error(`SERP API error: ${message}`);
              error.isSerpApiError = true;
              return reject(error);
            }
            resolve(parsed);
          } catch (error) {
            reject(new Error('Failed to parse SERP API response'));
          }
        });
      })
      .on('error', (error) => reject(error));
  });
}

function buildSerpUrl(params) {
  return `https://serpapi.com/search.json?${querystring.stringify(params)}`;
}

function getSerpApiKey() {
  const key = process.env.SERP_API_KEY || process.env.SERPAPI_API_KEY;
  if (!key) {
    throw new Error('SERP API key is not configured. Set SERP_API_KEY in .env');
  }
  return key;
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `${process.env.GEMINI_API_URL}?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function normalizePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^0-9.]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
}

function convertUSDToINR(usdPrice) {
  // Current approximate exchange rate: 1 USD = 104 INR
  const exchangeRate = 104;
  return Math.round(usdPrice * exchangeRate);
}

function getStringValue(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

function extractNestedField(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      if (Array.isArray(value) && value.length > 0 && (typeof value[0] === 'string' || typeof value[0] === 'number')) {
        return value[0];
      }
    }
  }

  for (const value of Object.values(obj)) {
    if (typeof value === 'object') {
      const nested = extractNestedField(value, keys);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function findFirstArray(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) return obj;

  for (const value of Object.values(obj)) {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
    if (typeof value === 'object') {
      const nestedArray = findFirstArray(value);
      if (nestedArray) return nestedArray;
    }
  }

  return null;
}

const airportCodeMap = {
  delhi: 'DEL',
  "new delhi": 'DEL',
  mumbai: 'BOM',
  bombay: 'BOM',
  bengaluru: 'BLR',
  bangalore: 'BLR',
  hyderabad: 'HYD',
  chennai: 'MAA',
  kolkata: 'CCU',
  goa: 'GOI',
  pune: 'PNQ',
  ahmedabad: 'AMD',
  coimbatore: 'CJB',
  kochi: 'COK',
  kozhikode: 'CCJ',
  moscow: 'SVO',
  london: 'LHR',
  paris: 'CDG',
  tokyo: 'NRT',
  singapore: 'SIN',
  dubai: 'DXB',
  "los angeles": 'LAX',
  "new york": 'JFK',
  "san francisco": 'SFO',
  sydney: 'SYD',
  vancouver: 'YVR'
};

function findAirportCodeInObject(obj) {
  if (!obj) return null;
  if (typeof obj === 'string') {
    const match = obj.match(/\b([A-Z]{3})\b/);
    if (match) {
      return match[1];
    }
  }
  if (Array.isArray(obj)) {
    for (const value of obj) {
      const found = findAirportCodeInObject(value);
      if (found) return found;
    }
  }
  if (typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      const found = findAirportCodeInObject(value);
      if (found) return found;
    }
  }
  return null;
}

async function searchAirportCode(location) {
  try {
    const params = {
      engine: 'google',
      q: `airport code for ${location}`,
      hl: 'en',
      gl: 'us',
      api_key: getSerpApiKey()
    };
    const url = buildSerpUrl(params);
    const json = await fetchJson(url);
    if (json.knowledge_graph) {
      const kgCode = getStringValue(json.knowledge_graph.iata) || getStringValue(json.knowledge_graph.iata_code);
      if (kgCode) {
        return kgCode.toUpperCase();
      }
    }
    return findAirportCodeInObject(json)?.toUpperCase() || null;
  } catch (error) {
    console.error('Airport code search error:', error.message || error);
    return null;
  }
}

async function resolveAirportCode(location) {
  if (!location || typeof location !== 'string') {
    return null;
  }

  const normalized = location.trim().toLowerCase();
  if (/^[A-Z]{3}$/.test(location.trim())) {
    return location.trim().toUpperCase();
  }

  if (airportCodeMap[normalized]) {
    return airportCodeMap[normalized];
  }

  return await searchAirportCode(location);
}

function parseFlightItem(item) {
  const segments = Array.isArray(item.flights) ? item.flights : [];
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || firstSegment;
  const airline = getStringValue(item.airline) || getStringValue(firstSegment.airline) || getStringValue(firstSegment.airplane) || 'Unknown Airline';
  const flightNumber = getStringValue(item.flight_number) || getStringValue(item.flightNumber) || getStringValue(firstSegment.flight_number) || getStringValue(firstSegment.flight_number) || 'N/A';
  const departureTime = getStringValue(firstSegment.departure_airport?.time) || getStringValue(firstSegment.departure_time) || getStringValue(firstSegment.departure);
  const departureAirport = getStringValue(firstSegment.departure_airport?.name) || getStringValue(firstSegment.departure_airport?.id);
  const arrivalTime = getStringValue(lastSegment.arrival_airport?.time) || getStringValue(lastSegment.arrival_time) || getStringValue(lastSegment.arrival);
  const arrivalAirport = getStringValue(lastSegment.arrival_airport?.name) || getStringValue(lastSegment.arrival_airport?.id);
  const departure = departureAirport ? `${departureAirport} • ${departureTime || 'TBD'}` : departureTime || 'TBD';
  const arrival = arrivalAirport ? `${arrivalAirport} • ${arrivalTime || 'TBD'}` : arrivalTime || 'TBD';
  const priceUSD = normalizePrice(item.price || item.total_price || item.price_with_currency || item.displayed_price || item.amount || item.cost || item.lowest_price || item.min_price || (item.prices && item.prices[0] && (item.prices[0].price || item.prices[0].total_price || item.prices[0].amount)));
  const price = convertUSDToINR(priceUSD);
  const layoverNote = Array.isArray(item.layovers) && item.layovers.length > 0
    ? `Layovers: ${item.layovers.map((layover) => layover.name || layover.id || '').filter(Boolean).join(', ')}`
    : undefined;

  return {
    airline,
    flightNumber,
    departure,
    arrival,
    price,
    cost: price,
    isApproximate: false,
    note: layoverNote
  };
}

function normalizeFlightItems(rawFlights) {
  if (!rawFlights) {
    return [];
  }

  if (Array.isArray(rawFlights)) {
    return rawFlights;
  }

  if (rawFlights.best_flights && Array.isArray(rawFlights.best_flights)) {
    const flights = [...rawFlights.best_flights];
    if (rawFlights.other_flights && Array.isArray(rawFlights.other_flights)) {
      flights.push(...rawFlights.other_flights);
    }
    return flights;
  }

  if (rawFlights.results && Array.isArray(rawFlights.results)) {
    return rawFlights.results;
  }

  if (rawFlights.options && Array.isArray(rawFlights.options)) {
    return rawFlights.options;
  }

  if (rawFlights.data && Array.isArray(rawFlights.data)) {
    return rawFlights.data;
  }

  if (rawFlights.organic_results && Array.isArray(rawFlights.organic_results)) {
    return rawFlights.organic_results;
  }

  if (rawFlights.items && Array.isArray(rawFlights.items)) {
    return rawFlights.items;
  }

  return [];
}

function parseFlightResults(data) {
  let rawFlights = normalizeFlightItems(data.best_flights ? { best_flights: data.best_flights, other_flights: data.other_flights } : data.flights_results || data.flight_results || data.results || data.all_results || data.options || data.organic_results || data.items || data);

  if (!rawFlights.length) {
    const fallbackArray = findFirstArray(data);
    if (Array.isArray(fallbackArray)) {
      rawFlights = fallbackArray;
    }
  }

  return rawFlights
    .map(parseFlightItem)
    .filter((flight) => flight.airline || flight.flightNumber || flight.departure || flight.arrival || flight.price)
    .slice(0, 5);
}

function normalizeHotelItems(rawHotels) {
  if (!rawHotels) {
    return [];
  }

  if (Array.isArray(rawHotels)) {
    return rawHotels;
  }

  if (rawHotels.properties && Array.isArray(rawHotels.properties)) {
    return rawHotels.properties;
  }

  if (rawHotels.hotels_results && Array.isArray(rawHotels.hotels_results)) {
    return rawHotels.hotels_results;
  }

  if (rawHotels.hotel_results && Array.isArray(rawHotels.hotel_results)) {
    return rawHotels.hotel_results;
  }

  if (rawHotels.results && Array.isArray(rawHotels.results)) {
    return rawHotels.results;
  }

  if (rawHotels.items && Array.isArray(rawHotels.items)) {
    return rawHotels.items;
  }

  if (rawHotels.data && Array.isArray(rawHotels.data)) {
    return rawHotels.data;
  }

  if (rawHotels.organic_results && Array.isArray(rawHotels.organic_results)) {
    return rawHotels.organic_results;
  }

  return [];
}

function parseHotelItem(item) {
  const hotelName = getStringValue(item.name || item.title || item.hotel_name || item.name_display || item.hotel || item.title_raw || item.name_raw || item.header || item.title_detail || item.label || item.subtitle || item.display_name || item.title_text || item.title_long || item.location_name || item.hotel_title) || 'Hotel';

  const pricePerNightUSD = normalizePrice(
    item.rate_per_night?.extracted_lowest ||
    item.rate_per_night?.value ||
    item.rate_per_night?.main ||
    item.total_rate?.extracted_lowest ||
    item.total_rate?.value ||
    item.total_rate?.main ||
    item.prices?.[0]?.rate_per_night?.extracted_lowest ||
    item.prices?.[0]?.rate_per_night?.value ||
    item.prices?.[0]?.total_rate?.extracted_lowest ||
    item.price ||
    item.price_per_night ||
    item.price_with_currency ||
    item.displayed_price ||
    item.rate ||
    item.min_price ||
    item.amount
  );

  // Convert USD to INR
  const pricePerNight = convertUSDToINR(pricePerNightUSD);

  const rating = Number(
    getStringValue(
      item.overall_rating ||
      item.rating ||
      item.stars ||
      item.review_score ||
      item.review_score_with_count ||
      item.score ||
      item.rating_value
    )
  ) || 0;

  return {
    hotel_name: hotelName,
    price_per_night: pricePerNight,
    rating,
    category: 'unknown'
  };
}

function categorizeHotels(hotels) {
  const allHotels = hotels.filter((hotel) => hotel.hotel_name);
  if (!allHotels.length) {
    return { cheap: [], moderate: [], luxury: [] };
  }

  const prices = allHotels.map((hotel) => hotel.price_per_night || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = Math.max(1, maxPrice - minPrice);
  const cheapThreshold = minPrice + range / 3;
  const moderateThreshold = minPrice + (2 * range) / 3;

  return allHotels.reduce(
    (groups, hotel) => {
      if (hotel.price_per_night && hotel.price_per_night <= cheapThreshold) {
        hotel.category = 'cheap';
        groups.cheap.push(hotel);
      } else if (hotel.price_per_night && hotel.price_per_night <= moderateThreshold) {
        hotel.category = 'moderate';
        groups.moderate.push(hotel);
      } else if (hotel.price_per_night) {
        hotel.category = 'luxury';
        groups.luxury.push(hotel);
      } else {
        hotel.category = 'moderate';
        groups.moderate.push(hotel);
      }
      return groups;
    },
    { cheap: [], moderate: [], luxury: [] }
  );
}

function parsePlaceItem(result) {
  const name = result.title || result.name || result.title_no_format || result.title_raw || 'Place';
  const description = result.snippet || result.description || result.snippet_highlighted || 'A popular place to visit.';
  return { name, description };
}

function parsePlacesResults(data) {
  const rawPlaces = Array.isArray(data.top_sights?.sights)
    ? data.top_sights.sights
    : Array.isArray(data.local_results)
      ? data.local_results
      : Array.isArray(data.organic_results)
        ? data.organic_results
        : Array.isArray(data.results)
          ? data.results
          : [];

  if (!Array.isArray(rawPlaces)) {
    return [];
  }

  const extractName = (result) => {
    const rawName = result.title || result.name || result.title_no_format || result.title_raw || result.snippet || result.description || '';
    if (typeof rawName !== 'string') return '';
    return rawName
      .replace(/\s*\(.*?\)/g, '')
      .replace(/,?\s*Mumbai$/i, '')
      .trim();
  };

  const places = rawPlaces
    .map(extractName)
    .map((name) => typeof name === 'string' ? name.trim() : '')
    .filter((name) => {
      if (!name || name.length < 3 || name.length > 40) return false;
      const lower = name.toLowerCase();
      if (/best|top|things|guide|attractions|tourist|places|travel|destination/.test(lower)) return false;
      if (name.includes(':') || name.includes(' - ') || name.includes(' – ') || /^[0-9]+\./.test(name)) return false;
      if (name.split(' ').length > 6) return false;
      return true;
    })
    .filter((name, index, self) => self.indexOf(name) === index)
    .slice(0, 10);

  return places.map(name => ({ name, description: `Visit ${name}, a popular attraction in the area.` }));
}

async function validateDestination(destination) {
  try {
    const params = {
      engine: 'google',
      q: `places in ${destination}`,
      hl: 'en',
      gl: 'us',
      api_key: getSerpApiKey()
    };
    const url = buildSerpUrl(params);
    const json = await fetchJson(url);
    const places = parsePlacesResults(json);
    return places.length > 0;
  } catch (error) {
    console.error('Destination validation error:', error.message || error);
    return null;
  }
}

function buildFallbackFlight(source, destination, date, index) {
  const basePrice = 4000 + index * 1200;
  return {
    airline: `Flight Option ${index + 1}`,
    flightNumber: `N/A`,
    departure: 'Not available',
    arrival: 'Not available',
    price: basePrice,
    isApproximate: true,
    note: `Flight data not available for ${source} to ${destination} on ${date}`
  };
}

function buildFallbackHotel(destination, index) {
  const pricePerNight = 1500 + index * 1500;
  return {
    hotel_name: `Hotel Option ${index + 1}`,
    price_per_night: pricePerNight,
    rating: 3 + index * 0.8,
    category: index === 0 ? 'cheap' : index === 1 ? 'moderate' : 'luxury',
    isApproximate: true,
    note: `Approximate hotel pricing in ${destination}`
  };
}

function buildFallbackPlaces(destination) {
  return [];
}

function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function createItinerary(destination, startDate, endDate, places) {
  const days = calculateDays(startDate, endDate);
  const itinerary = [];
  const selectedPlaces = places.slice(0, Math.max(days * 2, 6));
  let placeIndex = 0;

  for (let day = 1; day <= days; day += 1) {
    const schedule = [];
    const isFirstDay = day === 1;
    const isLastDay = day === days;
    const dayTitle = isFirstDay ? `Arrival and exploration` : isLastDay ? `Departure and wrap-up` : `Day ${day} in ${destination}`;

    if (isFirstDay) {
      schedule.push({
        time: '09:00 AM',
        activity: `Arrival in ${destination}`,
        description: `Check into your hotel and settle in.`
      });
      if (selectedPlaces[placeIndex]) {
        schedule.push({
          time: '01:00 PM',
          activity: `Visit ${selectedPlaces[placeIndex].name}`,
          description: selectedPlaces[placeIndex].description
        });
        placeIndex += 1;
      }
      if (selectedPlaces[placeIndex]) {
        schedule.push({
          time: '04:00 PM',
          activity: `Explore ${selectedPlaces[placeIndex].name}`,
          description: selectedPlaces[placeIndex].description
        });
        placeIndex += 1;
      }
    } else if (isLastDay) {
      if (selectedPlaces[placeIndex]) {
        schedule.push({
          time: '10:00 AM',
          activity: `Visit ${selectedPlaces[placeIndex].name}`,
          description: selectedPlaces[placeIndex].description
        });
        placeIndex += 1;
      }
      schedule.push({
        time: '02:00 PM',
        activity: `Return to hotel and check-out`,
        description: `Pack up and prepare for departure.`
      });
      schedule.push({
        time: '04:00 PM',
        activity: `Departure from ${destination}`,
        description: `Head to the airport or station for your journey home.`
      });
    } else {
      const placesToday = selectedPlaces.slice(placeIndex, placeIndex + 2);
      if (placesToday[0]) {
        schedule.push({
          time: '09:30 AM',
          activity: `Visit ${placesToday[0].name}`,
          description: placesToday[0].description
        });
      }
      if (placesToday[1]) {
        schedule.push({
          time: '01:00 PM',
          activity: `Visit ${placesToday[1].name}`,
          description: placesToday[1].description
        });
      }
      placeIndex += placesToday.length;
      if (schedule.length < 2) {
        schedule.push({
          time: '04:00 PM',
          activity: `Relax at the hotel and prepare for the next day`,
          description: `Take a break and enjoy local dining.`
        });
      }
    }

    if (schedule.length < 2) {
      schedule.push({
        time: '05:00 PM',
        activity: `Relax and plan your next day`,
        description: `Enjoy a quiet evening in ${destination}`
      });
    }

    itinerary.push({
      day,
      title: dayTitle,
      schedule
    });
  }

  return itinerary;
}

function categorizeHotelData(rawHotels) {
  if (!Array.isArray(rawHotels)) {
    return { cheap: [], moderate: [], luxury: [] };
  }

  const hotels = rawHotels.map(parseHotelItem).filter((hotel) => hotel.hotel_name);
  return categorizeHotels(hotels);
}

async function searchFlights(source, destination, startDate, returnDate) {
  try {
    const departureId = await resolveAirportCode(source);
    const arrivalId = await resolveAirportCode(destination);

    if (!departureId || !arrivalId) {
      console.log('No airport codes found for', source, 'to', destination, ', skipping flight search');
      return [];
    }

    const params = {
      engine: 'google_flights',
      departure_id: departureId,
      arrival_id: arrivalId,
      outbound_date: startDate,
      adults: 1,
      hl: 'en',
      gl: 'us',
      api_key: getSerpApiKey()
    };

    if (returnDate) {
      params.return_date = returnDate;
    }

    const url = buildSerpUrl(params);
    console.log('Flight search params:', params);
    const json = await fetchJson(url);
    const flights = parseFlightResults(json);
    if (flights.length) return flights;

    console.warn('Flight API returned no results for:', params);
    throw new Error('No flight results returned');
  } catch (error) {
    console.error('Flight API error:', error.message || error);
    if (error.isSerpApiError) {
      throw error;
    }
    return [
      buildFallbackFlight(source, destination, startDate, 0),
      buildFallbackFlight(source, destination, startDate, 1),
      buildFallbackFlight(source, destination, startDate, 2)
    ];
  }
}

async function searchHotels(destination, checkInDate, checkOutDate) {
  try {
    const params = {
      engine: 'google_hotels',
      q: destination,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      hl: 'en',
      gl: 'us',
      api_key: getSerpApiKey()
    };

    const url = buildSerpUrl(params);
    console.log('Hotel search params:', params);
    const json = await fetchJson(url);
    const rawHotels = json.properties || json.hotels_results || json.hotel_results || json.local_results || json.organic_results || json.results || json.items || json.data || [];
    let normalizedHotels = normalizeHotelItems(rawHotels);
    if (!normalizedHotels.length) {
      const fallbackHotels = findFirstArray(rawHotels);
      if (Array.isArray(fallbackHotels)) {
        normalizedHotels = fallbackHotels;
      }
    }
    const hotelGroups = categorizeHotelData(normalizedHotels);
    const allSections = [...hotelGroups.cheap, ...hotelGroups.moderate, ...hotelGroups.luxury];
    if (allSections.length) return hotelGroups;
    console.warn('Hotel API returned no results for:', params, 'payload keys:', Object.keys(json));
    throw new Error('No hotel results returned');
  } catch (error) {
    console.error('Hotel API error:', error.message || error);
    if (error.isSerpApiError) {
      throw error;
    }
    const fallbackHotels = [0, 1, 2].map((index) => buildFallbackHotel(destination, index));
    return categorizeHotels(fallbackHotels);
  }
}

async function searchPlaces(destination, options = {}) {
  try {
    const params = {
      engine: 'google',
      q: `Top tourist places in ${destination}`,
      hl: 'en',
      gl: 'us',
      api_key: getSerpApiKey()
    };

    const url = buildSerpUrl(params);
    const json = await fetchJson(url);
    const places = parsePlacesResults(json);
    if (places.length) return places;

    if (options.validateOnly) {
      return [];
    }

    const fallback = buildFallbackPlaces(destination);
    return fallback;
  } catch (error) {
    console.error('Places API error:', error.message || error);
    if (error.isSerpApiError) {
      throw error;
    }
    if (options.validateOnly) {
      return [];
    }
    return buildFallbackPlaces(destination);
  }
}

function calculateBudgetPlan(flights, hotels, days, budget) {
  const sortedFlights = flights.slice().sort((a, b) => a.price - b.price);
  const cheapestFlight = sortedFlights[0] || null;

  const hotelOptions = [
    ...(hotels.cheap || []),
    ...(hotels.moderate || []),
    ...(hotels.luxury || [])
  ].sort((a, b) => a.price_per_night - b.price_per_night);
  const cheapestHotel = hotelOptions[0] || null;

  const flightCost = cheapestFlight ? cheapestFlight.price : 0;
  const hotelCost = cheapestHotel ? cheapestHotel.price_per_night * days : 0;
  const totalCost = flightCost + hotelCost;
  const isWithinBudget = budget == null ? true : totalCost <= budget;

  const budgetSummary = {
    isWithinBudget,
    totalCost,
    flightCost,
    hotelCost,
    cheapestFlight,
    cheapestHotel,
    note: isWithinBudget
      ? 'Your budget can cover the core trip cost.'
      : 'Trip not possible within your budget. Showing cheapest available options.'
  };

  return {
    flights: isWithinBudget ? sortedFlights.slice(0, 3) : cheapestFlight ? [cheapestFlight] : [],
    hotels: {
      cheap: (hotels.cheap || []).slice(0, 2),
      moderate: (hotels.moderate || []).slice(0, 2),
      luxury: (hotels.luxury || []).slice(0, 2)
    },
    budgetSummary
  };
}

function cleanPlaceNames(places, limit = 8) {
  return Array.from(new Set(
    places
      .map((name) => (typeof name === 'string' ? name.trim() : ''))
      .filter(Boolean)
  ))
    .filter((name) => name.length >= 3 && name.length <= 40)
    .filter((name) => !/best|top|things|guide|attractions|tourist|places|travel|destination/i.test(name.toLowerCase()))
    .filter((name) => !/[:\-–—]/.test(name))
    .filter((name) => name.split(' ').length <= 6)
    .slice(0, limit);
}

function normalizeItinerary(itinerary, days) {
  if (!Array.isArray(itinerary)) return [];
  return itinerary.slice(0, days).map((day, index) => {
    const scheduleSource = Array.isArray(day.schedule) ? day.schedule : Array.isArray(day.plan) ? day.plan : [];
    const schedule = scheduleSource
      .map((item) => ({
        time: item.time || item.when || item.slot || '',
        activity: item.activity || item.task || item.description || '',
        description: item.description || item.details || ''
      }))
      .filter((item) => item.activity && item.activity.length > 0);

    return {
      day: Number.isInteger(day.day) ? day.day : index + 1,
      title: typeof day.title === 'string' ? day.title : `Day ${index + 1}`,
      schedule
    };
  });
}

function isValidItinerary(itinerary, days) {
  if (!Array.isArray(itinerary) || itinerary.length < days) return false;
  return itinerary.slice(0, days).every((day) => {
    return Array.isArray(day.schedule) && day.schedule.length >= 2;
  });
}

async function generateItinerary(destination, startDate, endDate, places = [], budget = null) {
  const days = calculateDays(startDate, endDate);
  const placeNames = cleanPlaceNames(places.map((p) => p.name), 8);

  if (!placeNames.length) {
    return createItinerary(destination, startDate, endDate, places);
  }

  const prompt = `You are a professional travel planner.

Destination: ${destination}
Days: ${days}
Budget: ${budget || 'Not specified'}
Places: ${placeNames.join(', ')}

IMPORTANT RULES:

* ONLY use places from the given list
* DO NOT create new place names like 'City Center' or 'Landmark'
* Each day must have at least 2–4 activities
* Day 1: arrival + light exploration
* Last day: 1 place + departure
* Middle days: 2–3 places per day
* Group nearby places logically
* Do not repeat places

Return ONLY JSON:
{
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival and exploration",
      "plan": [
        { "time": "09:00 AM", "activity": "Arrival in ${destination}" },
        { "time": "11:00 AM", "activity": "Visit ${placeNames[0]}" }
      ]
    }
  ]
}`;

  try {
    const response = await callGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const normalized = normalizeItinerary(parsed.itinerary, days);
      if (isValidItinerary(normalized, days)) {
        return normalized;
      }
    }
    throw new Error('Invalid Gemini response or empty days');
  } catch (error) {
    console.error('Gemini itinerary generation failed:', error.message);
    return createItinerary(destination, startDate, endDate, places);
  }
}

function validateDestination(destination) {
  try {
    if (!destination || typeof destination !== 'string' || destination.trim().length === 0) {
      return false;
    }
    // For now, assume valid if it's a string
    return true;
  } catch (error) {
    console.error('Destination validation error:', error);
    return false;
  }
}

module.exports = {
  searchFlights,
  searchHotels,
  searchPlaces,
  validateDestination,
  generateItinerary,
  calculateBudgetPlan
};
