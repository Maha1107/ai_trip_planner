const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simplified destinations list for API-based application
const destinations = [
  'Goa', 'Rishikesh', 'Varanasi', 'Jaipur', 'Manali', 'Hyderabad', 'Agra', 'Mumbai', 'Ooty', 'Kerala',
  'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Shimla', 'Darjeeling', 'Amritsar', 'Mysore'
];

// Get nearby airports for a city
function getNearbyAirports(city) {
  const cityLower = city.toLowerCase().trim();

  // Predefined nearby airports for major cities (expanded list)
  const nearbyAirportsMap = {
    // Major metros
    'delhi': ['DEL', 'IGI'],
    'mumbai': ['BOM', 'IXC'],
    'bangalore': ['BLR', 'IXC'],
    'chennai': ['MAA', 'IXC'],
    'kolkata': ['CCU', 'IXC'],
    'hyderabad': ['HYD', 'IXC'],
    'pune': ['PNQ', 'IXC'],
    'ahmedabad': ['AMD', 'IXC'],
    'jaipur': ['JAI', 'IXC'],
    'lucknow': ['LKO', 'IXC'],
    'kanpur': ['KNU', 'IXC'],
    'nagpur': ['NAG', 'IXC'],
    'indore': ['IDR', 'IXC'],
    'bhopal': ['BHO', 'IXC'],
    'patna': ['PAT', 'IXC'],
    'ranchi': ['IXR', 'IXC'],
    'bhubaneswar': ['BBI', 'IXC'],
    'guwahati': ['GAU', 'IXC'],
    'chandigarh': ['IXC', 'DEL'],
    'amritsar': ['ATQ', 'IXC'],
    'jammu': ['IXJ', 'IXC'],
    'srinagar': ['SXR', 'IXC'],
    'dehradun': ['DED', 'IXC'],
    'shimla': ['SLV', 'IXC'],
    'manali': ['KUU', 'IXC'],
    'rishikesh': ['DED', 'IXC'],
    'haridwar': ['DED', 'IXC'],
    'agra': ['AGR', 'IXC'],
    'varanasi': ['VNS', 'IXC'],
    'allahabad': ['IXD', 'IXC'],
    'goa': ['GOI', 'IXC'],
    'ooty': ['CJB', 'BLR', 'MAA'],
    'kerala': ['COK', 'IXC'],
    'mysore': ['MYQ', 'IXC'],

    // Additional cities
    'vijayawada': ['VGA', 'HYD', 'BLR'],
    'visakhapatnam': ['VTZ', 'HYD', 'BLR'],
    'coimbatore': ['CJB', 'MAA', 'BLR'],
    'kochi': ['COK', 'MAA', 'BLR'],
    'trivandrum': ['TRV', 'COK', 'MAA'],
    'ooty': ['CJB', 'BLR', 'MAA'],
    'madurai': ['IXM', 'MAA', 'CJB'],
    'tiruchirappalli': ['TRZ', 'MAA', 'CJB'],
    'salem': ['SXV', 'MAA', 'BLR'],
    'tirunelveli': ['TCR', 'TRV', 'MAA'],
    'tiruppur': ['TUP', 'CJB', 'MAA'],
    'vellore': ['VLR', 'MAA', 'BLR'],
    'rajahmundry': ['RJA', 'VGA', 'HYD'],
    'kakinada': ['KAK', 'VGA', 'HYD'],
    'eluru': ['ELU', 'VGA', 'HYD'],
    'ongole': ['ONG', 'VGA', 'HYD'],
    'nellore': ['NLR', 'VGA', 'HYD'],
    'chittoor': ['CTO', 'BLR', 'MAA'],
    'anantapur': ['ATP', 'BLR', 'HYD'],
    'kurnool': ['KJB', 'HYD', 'BLR'],
    'kadapa': ['CDP', 'BLR', 'HYD'],
    'guntur': ['GNT', 'VGA', 'HYD'],
    'tenali': ['TNL', 'VGA', 'HYD'],
    'bapatla': ['BPT', 'VGA', 'HYD'],
    'chirala': ['CIR', 'VGA', 'HYD'],
    'bhimavaram': ['BVW', 'VGA', 'HYD'],
    'tanuku': ['TNK', 'VGA', 'HYD'],
    'palakollu': ['PKO', 'VGA', 'HYD'],
    'narsapur': ['NSP', 'VGA', 'HYD'],
    'palvancha': ['PCH', 'HYD', 'BLR'],
    'suryapet': ['SYP', 'HYD', 'BLR'],
    'miryalaguda': ['MYG', 'HYD', 'BLR'],
    'nalgonda': ['NLG', 'HYD', 'BLR'],
    'siddipet': ['SDT', 'HYD', 'BLR'],
    'medak': ['MDA', 'HYD', 'BLR'],
    'sangareddy': ['SGR', 'HYD', 'BLR'],
    'vikarabad': ['VKB', 'HYD', 'BLR'],
    'mahbubnagar': ['MBN', 'HYD', 'BLR'],
    'wanaparthy': ['WNP', 'HYD', 'BLR'],
    'gadwal': ['GDW', 'HYD', 'BLR'],
    'alampur': ['ALP', 'HYD', 'BLR'],
    'jagtial': ['JGT', 'HYD', 'BLR'],
    'karimnagar': ['KRG', 'HYD', 'BLR'],
    'peddapalli': ['PDL', 'HYD', 'BLR'],
    'manthani': ['MTH', 'HYD', 'BLR'],
    'ramagundam': ['RGM', 'HYD', 'BLR'],
    'bellampalli': ['BLP', 'HYD', 'BLR'],
    'mandamarri': ['MDM', 'HYD', 'BLR'],
    'asifabad': ['ASB', 'HYD', 'BLR'],
    'sirpur': ['SRP', 'HYD', 'BLR'],
    'adilabad': ['ADB', 'HYD', 'BLR'],
    'nirmal': ['NRM', 'HYD', 'BLR'],
    'mudhole': ['MDH', 'HYD', 'BLR'],
    'bodhan': ['BDH', 'HYD', 'BLR'],
    'nizamabad': ['NZB', 'HYD', 'BLR'],
    'kamareddy': ['KMC', 'HYD', 'BLR'],
    'armoor': ['ARM', 'HYD', 'BLR'],
    'bhainsa': ['BNS', 'HYD', 'BLR'],
    'huzurabad': ['HZB', 'HYD', 'BLR'],
    'warangal': ['WGL', 'HYD', 'BLR'],
    'khammam': ['KMM', 'HYD', 'BLR'],
    'sathupalli': ['SPH', 'HYD', 'BLR'],
    'vyasapadu': ['VYP', 'HYD', 'BLR'],
    'yellandu': ['YLD', 'HYD', 'BLR'],
    'bhadrachalam': ['BDC', 'HYD', 'BLR'],
    'palwancha': ['PCH', 'HYD', 'BLR'],
    'kothagudem': ['KTG', 'HYD', 'BLR'],
    'suryapet': ['SYP', 'HYD', 'BLR'],
    'miryalaguda': ['MYG', 'HYD', 'BLR'],
    'nalgonda': ['NLG', 'HYD', 'BLR'],
    'siddipet': ['SDT', 'HYD', 'BLR'],
    'medak': ['MDA', 'HYD', 'BLR'],
    'sangareddy': ['SGR', 'HYD', 'BLR'],
    'vikarabad': ['VKB', 'HYD', 'BLR'],
    'mahbubnagar': ['MBN', 'HYD', 'BLR'],
    'wanaparthy': ['WNP', 'HYD', 'BLR'],
    'gadwal': ['GDW', 'HYD', 'BLR'],
    'alampur': ['ALP', 'HYD', 'BLR'],
    'jagtial': ['JGT', 'HYD', 'BLR'],
    'karimnagar': ['KRG', 'HYD', 'BLR'],
    'peddapalli': ['PDL', 'HYD', 'BLR'],
    'manthani': ['MTH', 'HYD', 'BLR'],
    'ramagundam': ['RGM', 'HYD', 'BLR'],
    'bellampalli': ['BLP', 'HYD', 'BLR'],
    'mandamarri': ['MDM', 'HYD', 'BLR'],
    'asifabad': ['ASB', 'HYD', 'BLR'],
    'sirpur': ['SRP', 'HYD', 'BLR'],
    'adilabad': ['ADB', 'HYD', 'BLR'],
    'nirmal': ['NRM', 'HYD', 'BLR'],
    'mudhole': ['MDH', 'HYD', 'BLR'],
    'bodhan': ['BDH', 'HYD', 'BLR'],
    'nizamsagar': ['NZS', 'HYD', 'BLR'],
    'armoor': ['ARM', 'HYD', 'BLR'],
    'bhainsa': ['BNS', 'HYD', 'BLR'],
    'huzurabad': ['HZB', 'HYD', 'BLR'],
    'warangal': ['WGL', 'HYD', 'BLR'],
    'khammam': ['KMM', 'HYD', 'BLR'],
    'sathupalli': ['SPH', 'HYD', 'BLR'],
    'vyasapadu': ['VYP', 'HYD', 'BLR'],
    'yellandu': ['YLD', 'HYD', 'BLR'],
    'bhadrachalam': ['BDC', 'HYD', 'BLR'],
    'palwancha': ['PCH', 'HYD', 'BLR'],
    'kothagudem': ['KTG', 'HYD', 'BLR']
  };

  // Try exact match first
  if (nearbyAirportsMap[cityLower]) {
    return nearbyAirportsMap[cityLower];
  }

  // Try partial match
  for (const [cityKey, airports] of Object.entries(nearbyAirportsMap)) {
    if (cityLower.includes(cityKey) || cityKey.includes(cityLower)) {
      return airports;
    }
  }

  // Try to find airports in the same state/region based on city name patterns
  const regionPatterns = {
    // South India
    'karnataka': ['BLR', 'IXC'],
    'tamil': ['MAA', 'CJB'],
    'kerala': ['COK', 'TRV'],
    'andhra': ['HYD', 'VGA'],
    'telangana': ['HYD', 'BLR'],

    // North India
    'uttar': ['DEL', 'LKO'],
    'rajasthan': ['JAI', 'DEL'],
    'punjab': ['ATQ', 'IXC'],
    'haryana': ['DEL', 'IXC'],
    'himachal': ['IXC', 'SLV'],

    // East India
    'west_bengal': ['CCU', 'IXC'],
    'bihar': ['PAT', 'IXC'],
    'odisha': ['BBI', 'CCU'],

    // West India
    'maharashtra': ['BOM', 'PNQ'],
    'gujarat': ['AMD', 'BOM'],

    // Northeast
    'assam': ['GAU', 'IXC']
  };

  for (const [region, airports] of Object.entries(regionPatterns)) {
    if (cityLower.includes(region)) {
      return airports;
    }
  }

  // Default to major hub airports if no match
  return ['DEL', 'BOM', 'BLR', 'MAA'];
}

// City to airport code mapping for Google Flights API
const cityToAirportMap = {
  'Goa': 'GOI',
  'Rishikesh': 'DED', // Dehradun airport, closest to Rishikesh
  'Varanasi': 'VNS',
  'Jaipur': 'JAI',
  'Manali': 'KUU', // Kullu airport, closest to Manali
  'Hyderabad': 'HYD',
  'Agra': 'AGR',
  'Mumbai': 'BOM',
  'Ooty': 'CJB', // Coimbatore airport closest to Ooty region
  'Kerala': 'COK', // Kochi airport for Kerala
  'Delhi': 'DEL',
  'Bangalore': 'BLR',
  'Chennai': 'MAA',
  'Kolkata': 'CCU',
  'Pune': 'PNQ',
  'Ahmedabad': 'AMD'
};

function getAirportCode(destination) {
  // First try exact match
  if (cityToAirportMap[destination]) {
    return cityToAirportMap[destination];
  }
  
  // Try case-insensitive match
  const lowerDest = destination.toLowerCase();
  for (const [city, code] of Object.entries(cityToAirportMap)) {
    if (city.toLowerCase() === lowerDest) {
      return code;
    }
  }
  
  // If no match found, return the destination as-is (might be an airport code already)
  return destination;
}

function parseSeasonMonths(season) {
  if (!season) return [];
  const parts = season.split('-').map(p => p.trim());
  if (parts.length !== 2) return [parts[0]];

  const startIndex = monthOrder.indexOf(parts[0]);
  const endIndex = monthOrder.indexOf(parts[1]);
  if (startIndex === -1 || endIndex === -1) return [parts[0]];

  const months = [];
  let index = startIndex;
  while (true) {
    months.push(monthOrder[index]);
    if (index === endIndex) break;
    index = (index + 1) % 12;
  }
  return months;
}

function chooseBestTravelMonth(name, bestSeason) {
  const pricing = pricingByDestination[name] || [];
  const crowd = crowdByDestination[name] || [];
  const seasonMonths = parseSeasonMonths(bestSeason);

  if (pricing.length === 0) return bestSeason || 'Anytime';
  const seasonPricing = pricing.filter(p => seasonMonths.includes(p.month));
  if (seasonPricing.length === 0) {
    const best = pricing.reduce((bestSoFar, current) => {
      const bestCost = bestSoFar.avg_flight_price + bestSoFar.avg_hotel_price;
      const currentCost = current.avg_flight_price + current.avg_hotel_price;
      return currentCost < bestCost ? current : bestSoFar;
    }, pricing[0]);
    return best.month;
  }

  return seasonPricing.reduce((bestSoFar, current) => {
    const currentCrowd = crowd.find(c => c.month === current.month)?.tourist_count || 0;
    const bestCrowd = crowd.find(c => c.month === bestSoFar.month)?.tourist_count || 0;
    const currentScore = current.avg_flight_price + current.avg_hotel_price + currentCrowd * 0.05;
    const bestScore = bestSoFar.avg_flight_price + bestSoFar.avg_hotel_price + bestCrowd * 0.05;
    return currentScore < bestScore ? current : bestSoFar;
  }, seasonPricing[0]).month;
}

function buildDestinationProfile(name) {
  const matched = destinations.find(dest => dest.name.toLowerCase() === String(name).trim().toLowerCase());
  if (!matched) return null;

  const reviewSummary = reviewSummaryByDestination[matched.name] || { total: 0, count: 0 };
  const avgRating = reviewSummary.count ? Number((reviewSummary.total / reviewSummary.count).toFixed(1)) : 4.0;
  const hotels = (hotelsByDestination[matched.name] || []).sort((a, b) => b.rating - a.rating || a.price_per_night - b.price_per_night);
  const attractions = (attractionsByDestination[matched.name] || []).sort((a, b) => b.avg_visit_time_hours - a.avg_visit_time_hours);

  return {
    ...matched,
    attractions,
    hotels,
    averageRating: avgRating,
    travelMonth: chooseBestTravelMonth(matched.name, matched.best_season)
  };
}

function buildFallbackDestinationProfile(name) {
  const destinationName = String(name).trim();
  return {
    destination_id: 'unknown',
    name: destinationName,
    state: '',
    type: 'City',
    avg_budget: 12000,
    best_season: 'Anytime',
    popularity_score: 50,
    attractions: [],
    hotels: [],
    averageRating: 4.0,
    travelMonth: 'Anytime'
  };
}

function getHotelRecommendation(destData, budget) {
  const allHotels = destData.hotels || [];
  if (!allHotels.length) return 'Quality accommodation options available';

  const sorted = allHotels.slice().sort((a, b) => {
    if (budget === 'luxury') return b.rating - a.rating || a.price_per_night - b.price_per_night;
    if (budget === 'moderate') return (b.rating - a.rating) - (a.price_per_night - b.price_per_night) / 1000;
    return a.price_per_night - b.price_per_night;
  });

  const hotel = sorted[0];
  return `${hotel.hotel_name} (${hotel.rating.toFixed(1)}★, ₹${hotel.price_per_night}/night)`;
}

const budgetLimits = {
  cheap: 35000,
  moderate: 60000,
  luxury: 150000
};

const SERP_API_KEY = process.env.SERP_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://api.openai.com/v1/responses';

function callSerpApi(params) {
  if (!SERP_API_KEY) {
    return Promise.reject(new Error('SERP API key not configured'));
  }

  const url = new URL('https://serpapi.com/search.json');
  Object.entries({ ...params, api_key: SERP_API_KEY }).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function callGeminiApi(prompt) {
  if (!GEMINI_API_KEY) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || null;
          resolve(text);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function fallbackFlightOptions(destData, budget, members) {
  const pricing = pricingByDestination[destData.name] || [];
  const sorted = pricing.slice().sort((a, b) => a.avg_flight_price - b.avg_flight_price);
  const baseFlight = sorted[0] || { avg_flight_price: 12000 };
  const passengerCount = Math.max(1, Number(members) || 1);

  // Return empty array if no real data - forces error handling
  return [];
}

function fallbackHotelOptions(destData, budget, members) {
  // Return empty array - forces error handling for real data
  return [];
}

function sanitizePrice(value) {
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getSerpFlights(destData, startDate, airport, budget, members, isReturn = false) {
  if (!SERP_API_KEY) {
    throw new Error('Flight search is temporarily unavailable. Please try again later or contact support.');
  }

  const origin = airport.toUpperCase().length === 3 ? airport.toUpperCase() : airport;
  const destination = getAirportCode(destData.name);

  // For return flights, swap origin and destination
  const actualOrigin = isReturn ? destination : origin;
  const actualDestination = isReturn ? origin : destination;

  // First try the original airport
  try {
    const dateObj = new Date(startDate);
    const formattedDate = dateObj.toISOString().split('T')[0];

    console.log(`Fetching real-time ${isReturn ? 'return' : 'outbound'} flights from ${actualOrigin} to ${actualDestination} (${isReturn ? 'back to ' + origin : destData.name}) on ${formattedDate}`);

    const response = await callSerpApi({
      engine: 'google_flights',
      hl: 'en',
      gl: 'in',
      departure_id: actualOrigin,
      arrival_id: actualDestination,
      outbound_date: formattedDate,
      type: 2, // One-way flight
      currency: 'INR'
    });

    console.log(`Serp API response for ${actualOrigin} to ${actualDestination}:`, JSON.stringify(response, null, 2));

    const flightItems = response.best_flights || response.connections || response.flights_results || [];

    if (!flightItems || flightItems.length === 0) {
      console.log(`No flight items found in response from ${actualOrigin}`);
    }

    if (flightItems && flightItems.length > 0) {
      const flights = flightItems.slice(0, 10).map((item) => {
        const price = sanitizePrice(item.price || item.lowest_price || item.price_string);
        return {
          airline: item.airline || item.name_short || 'International Flight',
          flightNumber: item.flight_number || item.flightNumber || 'N/A',
          class: item.type || item.travel_class || 'Economy',
          cost: Math.max(price, 5000),
          departure: item.departure_airport || item.origin || actualOrigin,
          arrival: item.arrival_airport || item.destination || actualDestination,
          flightTime: item.duration || item.flight_duration || item.duration_text || 'N/A',
          layovers: item.stops || (item.stop_count ? `${item.stop_count} stops` : 'Direct'),
          departureTime: item.departure_time || item.departure || 'N/A',
          arrivalTime: item.arrival_time || item.arrival || 'N/A',
          fromAirport: actualOrigin,
          isReturn: isReturn
        };
      }).filter((item) => item.cost > 0).sort((a, b) => a.cost - b.cost);

      if (flights.length > 0) {
        console.log(`Retrieved ${flights.length} real ${isReturn ? 'return' : 'outbound'} flight options from ${actualOrigin}, prices: ${flights.map(f => f.cost).join(', ')}`);
        return flights;
      }
    }
  } catch (error) {
    console.error(`${isReturn ? 'Return' : 'Outbound'} flight fetch failed from ${actualOrigin}:`, error.message);
  }

  // If no flights from original airport, use Gemini AI to find nearby airports
  console.log(`No ${isReturn ? 'return' : 'outbound'} flights found from ${actualOrigin}, using Gemini AI to find nearby airports...`);

  try {
    const geminiPrompt = `Find the 5 closest airports to ${actualOrigin} airport in India. Return only a JSON array of airport codes (3-letter IATA codes) like ["DEL", "BOM", "BLR"]. Do not include the original airport ${actualOrigin} in the list. Focus on major airports within 200-500 km distance.`;

    const geminiResponse = await callGeminiApi(geminiPrompt);

    let nearbyAirports = [];
    if (geminiResponse) {
      try {
        // Try to parse as JSON
        nearbyAirports = JSON.parse(geminiResponse);
        if (!Array.isArray(nearbyAirports)) {
          nearbyAirports = [];
        }
      } catch (parseError) {
        // Try to extract airport codes from text response
        const airportCodeRegex = /\b([A-Z]{3})\b/g;
        const matches = geminiResponse.match(airportCodeRegex) || [];
        nearbyAirports = matches.filter(code => code !== actualOrigin).slice(0, 5);
      }
    }

    // Fallback nearby airports if Gemini fails
    if (nearbyAirports.length === 0) {
      const fallbackAirports = {
        'DEL': ['BOM', 'BLR', 'MAA', 'CCU', 'AMD'],
        'BOM': ['DEL', 'BLR', 'MAA', 'AMD', 'GOI'],
        'BLR': ['BOM', 'DEL', 'MAA', 'CCU', 'HYD'],
        'MAA': ['BLR', 'BOM', 'DEL', 'CCU', 'HYD'],
        'CCU': ['DEL', 'BLR', 'MAA', 'BOM', 'PAT'],
        'HYD': ['BLR', 'MAA', 'BOM', 'DEL', 'AMD'],
        'AMD': ['BOM', 'DEL', 'BLR', 'MAA', 'JAI'],
        'GOI': ['BOM', 'BLR', 'DEL', 'MAA', 'HYD']
      };
      nearbyAirports = fallbackAirports[actualOrigin] || ['DEL', 'BOM', 'BLR', 'MAA', 'CCU'];
    }

    console.log(`Gemini AI suggested nearby airports: ${nearbyAirports.join(', ')}`);

    // Try each nearby airport
    for (const airportCode of nearbyAirports) {
      try {
        const dateObj = new Date(startDate);
        const formattedDate = dateObj.toISOString().split('T')[0];

        console.log(`Trying ${isReturn ? 'return' : 'outbound'} flights from nearby airport ${airportCode} to ${actualDestination} on ${formattedDate}`);

        const response = await callSerpApi({
          engine: 'google_flights',
          hl: 'en',
          gl: 'in',
          departure_id: airportCode,
          arrival_id: actualDestination,
          outbound_date: formattedDate,
          type: 2, // One-way flight
          currency: 'INR'
        });

        const flightItems = response.best_flights || response.connections || response.flights_results || [];

        if (!flightItems || flightItems.length === 0) {
          console.log(`No ${isReturn ? 'return' : 'outbound'} flights found from ${airportCode}, trying next airport...`);
          continue;
        }

        const flights = flightItems.slice(0, 10).map((item) => {
          const price = sanitizePrice(item.price || item.lowest_price || item.price_string);
          return {
            airline: item.airline || item.name_short || 'International Flight',
            class: item.type || item.travel_class || 'Economy',
            cost: Math.max(price, 5000),
            departure: item.departure_airport || item.origin || airportCode,
            arrival: item.arrival_airport || item.destination || actualDestination,
            flightTime: item.duration || item.flight_duration || item.duration_text || 'N/A',
            layovers: item.stops || (item.stop_count ? `${item.stop_count} stops` : 'Direct'),
            departureTime: item.departure_time || item.departure || 'N/A',
            arrivalTime: item.arrival_time || item.arrival || 'N/A',
            fromAirport: airportCode,
            isReturn: isReturn
          };
        }).filter((item) => item.cost > 0).sort((a, b) => a.cost - b.cost);

        if (flights.length === 0) {
          console.log(`No valid ${isReturn ? 'return' : 'outbound'} flights with prices found from ${airportCode}, trying next airport...`);
          continue;
        }

        console.log(`Retrieved ${flights.length} real ${isReturn ? 'return' : 'outbound'} flight options from ${airportCode}, prices: ${flights.map(f => f.cost).join(', ')}`);
        return flights;

      } catch (error) {
        console.error(`${isReturn ? 'Return' : 'Outbound'} flight fetch failed from ${airportCode}:`, error.message);
        continue;
      }
    }

  } catch (geminiError) {
    console.error('Gemini AI airport search failed:', geminiError.message);
  }

  // If all attempts fail, provide a helpful message
  throw new Error(`No ${isReturn ? 'return' : 'outbound'} flights found from ${actualOrigin} or nearby airports. Please try a different departure airport.`);
}

async function getSerpHotels(destData, startDate, budget, members, starRating) {
  if (!SERP_API_KEY) {
    throw new Error('Hotel search is temporarily unavailable. Please try again later or contact support.');
  }

  try {
    // Format date for SERP API (YYYY-MM-DD)
    const dateObj = new Date(startDate);
    const formattedDate = dateObj.toISOString().split('T')[0];
    const nextDay = new Date(dateObj.getTime() + 86400000).toISOString().split('T')[0];
    
    console.log(`Fetching ${starRating}-star hotels in ${destData.name} from ${formattedDate}`);
    
    const response = await callSerpApi({
      engine: 'google_hotels',
      hl: 'en',
      gl: 'in',
      q: `${destData.name} ${starRating} star hotels`,
      check_in_date: formattedDate,
      check_out_date: nextDay,
      adults: members,
      currency: 'INR'
    });

    const hotelItems = response.properties || response.hotels || response.hotel_results || response.results || [];
    
    if (!hotelItems || hotelItems.length === 0) {
      throw new Error(`No ${starRating}-star hotels found`);
    }

    const hotels = hotelItems.slice(0, 10).map((item) => {
      const rating = Number(item.rating || item.overall_rating || item.star_rating || item.extracted_hotel_class || starRating);
      const price = sanitizePrice(
        item.rate_per_night?.extracted_lowest ||
        item.rate_per_night?.lowest ||
        item.price ||
        item.price_range?.lower ||
        item.price_string
      );
      
      return {
        hotel_name: item.title || item.name || item.property_name || 'Hotel',
        price_per_night: Math.max(price, 1000),
        rating: Math.min(rating, 5),
        distance_from_center_km: Number(item.distance || item.distance_from_center_km || 2.0),
        address: item.address || item.location || destData.name,
        review_count: Number(item.review_count || item.reviews || item.overall_rating * 100 || 0),
        review_score: Number(item.review_score || item.overall_rating || rating)
      };
    }).filter((hotel) => hotel.price_per_night > 0 && hotel.rating >= (starRating - 0.5))
      .sort((a, b) => b.review_score - a.review_score || a.price_per_night - b.price_per_night);

    if (hotels.length === 0) {
      throw new Error(`No valid ${starRating}-star hotels with prices found`);
    }

    console.log(`Retrieved ${hotels.length} hotels with ${starRating}-star rating, prices: ${hotels.map(h => h.price_per_night).join(', ')}`);
    return hotels;
  } catch (error) {
    console.error(`Hotel fetch error for ${starRating}-star:`, error.message);
    throw new Error(`Failed to fetch ${starRating}-star hotels: ${error.message}`);
  }
}

function sanitizePrice(value) {
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function buildTripPlans(destData, days, startDate, airport, members) {
  const plans = [];

  try {
    // Calculate return date (start date + days)
    const returnDate = new Date(startDate);
    returnDate.setDate(returnDate.getDate() + days);

    // Fetch all available outbound flights - REQUIRE real-time data, no fallbacks
    console.log('Fetching real-time outbound flights...');
    const allOutboundFlights = await getSerpFlights(destData, startDate, airport, 'moderate', members, false);

    if (!allOutboundFlights || allOutboundFlights.length === 0) {
      throw new Error('Unable to fetch real-time outbound flight data. Please try again later or contact support.');
    }

    // Fetch all available return flights - REQUIRE real-time data, no fallbacks
    console.log('Fetching real-time return flights...');
    const allReturnFlights = await getSerpFlights(destData, returnDate.toISOString().split('T')[0], airport, 'moderate', members, true);

    if (!allReturnFlights || allReturnFlights.length === 0) {
      throw new Error('Unable to fetch real-time return flight data. Please try again later or contact support.');
    }

    // Get flights for each budget tier (with safety checks)
    const budgetOutbound = allOutboundFlights && allOutboundFlights.length > 0 ? allOutboundFlights[0] : null;
    const standardOutbound = allOutboundFlights && allOutboundFlights.length > 2 ? allOutboundFlights[Math.floor(allOutboundFlights.length / 2)] : (allOutboundFlights && allOutboundFlights.length > 0 ? allOutboundFlights[0] : null);
    const premiumOutbound = allOutboundFlights && allOutboundFlights.length > 1 ? allOutboundFlights[allOutboundFlights.length - 1] : (allOutboundFlights && allOutboundFlights.length > 0 ? allOutboundFlights[0] : null);

    const budgetReturn = allReturnFlights && allReturnFlights.length > 0 ? allReturnFlights[0] : null;
    const standardReturn = allReturnFlights && allReturnFlights.length > 2 ? allReturnFlights[Math.floor(allReturnFlights.length / 2)] : (allReturnFlights && allReturnFlights.length > 0 ? allReturnFlights[0] : null);
    const premiumReturn = allReturnFlights && allReturnFlights.length > 1 ? allReturnFlights[allReturnFlights.length - 1] : (allReturnFlights && allReturnFlights.length > 0 ? allReturnFlights[0] : null);

    // Fetch real-time hotels for each star rating - REQUIRE real-time data, no fallbacks
    console.log('Fetching real-time 3-star hotels for budget plan...');
    const budgetHotels = await getSerpHotels(destData, startDate, 'cheap', members, 3);

    console.log('Fetching real-time 4-star hotels for standard plan...');
    const standardHotels = await getSerpHotels(destData, startDate, 'moderate', members, 4);

    console.log('Fetching real-time 5-star hotels for premium plan...');
    const premiumHotels = await getSerpHotels(destData, startDate, 'luxury', members, 5);

    // Build three budget plans with real-time data only
    const planConfigs = [
      {
        name: 'Budget Plan',
        style: 'Budget-friendly',
        outboundFlight: budgetOutbound,
        returnFlight: budgetReturn,
        hotels: budgetHotels,
        budget: 'cheap',
        stars: 3
      },
      {
        name: 'Standard Plan',
        style: 'Balanced comfort',
        outboundFlight: standardOutbound,
        returnFlight: standardReturn,
        hotels: standardHotels,
        budget: 'moderate',
        stars: 4
      },
      {
        name: 'Premium Plan',
        style: 'Luxury experience',
        outboundFlight: premiumOutbound,
        returnFlight: premiumReturn,
        hotels: premiumHotels,
        budget: 'luxury',
        stars: 5
      }
    ];

    for (let i = 0; i < planConfigs.length; i++) {
      const config = planConfigs[i];
      console.log(`Processing plan ${i} (${config.name}): outboundFlight=${!!config.outboundFlight}, returnFlight=${!!config.returnFlight}, hotels=${config.hotels ? config.hotels.length : 'undefined'}`);

      const hotel = config.hotels && config.hotels.length > 0 ? config.hotels[0] : null;

      // Skip plan if any required data is missing
      if (!config.outboundFlight || !config.returnFlight || !hotel) {
        console.warn(`Skipping plan ${i} (${config.name}) - missing real-time flight or hotel data`);
        continue;
      }

      const itinerary = await generateDetailedItinerary(destData, days, config.budget, members, config.budget);

      // Calculate costs with real-time data
      const passengerCount = Math.max(1, Number(members) || 1);
      const roomCount = Math.max(1, Math.ceil(passengerCount / 2));

      // Real flight costs (outbound + return)
      const outboundFlightCost = config.outboundFlight.cost;
      const returnFlightCost = config.returnFlight.cost;
      const totalFlightCost = (outboundFlightCost + returnFlightCost) * passengerCount;

      // Real hotel costs
      const accommodationCost = hotel.price_per_night * days * roomCount;

      // Approximate meal costs based on budget
      const mealCosts = {
        cheap: 500,    // Budget meals
        moderate: 1000, // Standard meals
        luxury: 2000   // Premium meals
      };
      const dailyMealCost = mealCosts[config.budget] || 1000;
      const mealsCost = dailyMealCost * days * passengerCount;

      // Other expenses (activities, entrance fees, shopping, misc)
      const otherExpenses = {
        cheap: 300,    // Basic activities
        moderate: 600, // Standard activities
        luxury: 1200   // Premium activities
      };
      const dailyOtherExpenses = otherExpenses[config.budget] || 600;
      const otherCost = dailyOtherExpenses * days * passengerCount;

      // Local transport costs
      const transportCost = 500 * days * passengerCount; // More realistic transport costs

      const totalCost = Math.round(totalFlightCost + accommodationCost + mealsCost + otherCost + transportCost);

      const geminiSummary = await callGeminiApi(
        `Create a short personalized itinerary summary for ${destData.name} for ${days} days starting on ${startDate} from ${airport} for ${members} travelers with ${hotel.hotel_name} (${hotel.rating}★) hotel and ${config.outboundFlight ? config.outboundFlight.airline : 'flight'} flights under a ${config.budget} budget. Total budget: ₹${totalCost}.`
      ).catch(err => {
        console.warn('Gemini API failed:', err.message);
        return null;
      });

      plans.push({
        planName: config.name,
        planStyle: config.style,
        outboundFlight: config.outboundFlight,
        returnFlight: config.returnFlight,
        hotel: hotel,
        estimatedTotalCost: totalCost,
        budgetCategory: config.budget,
        itinerary,
        geminiSummary: geminiSummary || null,
        details: {
          flightClass: config.outboundFlight.class,
          hotelRating: hotel.rating,
          hotelDistance: hotel.distance_from_center_km,
          mealBudgetPerDay: dailyMealCost,
          dailyTransport: 500,
          dailyOtherExpenses: dailyOtherExpenses
        },
        breakdown: {
          outboundFlight: outboundFlightCost * passengerCount,
          returnFlight: returnFlightCost * passengerCount,
          totalFlights: totalFlightCost,
          accommodation: accommodationCost,
          meals: mealsCost,
          otherExpenses: otherCost,
          transport: transportCost,
          total: totalCost
        }
      });
    }

    if (plans.length === 0) {
      throw new Error('Unable to create trip plans with current real-time data. Flight and hotel information may be temporarily unavailable. Please try again later or contact support.');
    }

    return plans;
  } catch (error) {
    console.error('Error building trip plans:', error);
    throw error;
  }
}

// AI-powered itinerary generation function
async function generateDetailedItinerary(destData, days, budget, companions, planType = 'moderate') {
  try {
    const prompt = `Create a detailed day-by-day itinerary for a ${days}-day trip to ${destData.name}, ${destData.state}.

The itinerary should:
1. Start each day at 8:00 AM after breakfast
2. Include famous tourist spots and attractions in ${destData.name}
3. Have a realistic timetable with time slots for each activity
4. Include time for meals (lunch around 1-2 PM, dinner around 7-8 PM), shopping, and relaxation
5. Cover maximum famous places while being practical and not overwhelming
6. Consider the ${budget} budget level (${planType} plan)
7. Be suitable for ${companions} travelers
8. Include local markets, cultural experiences, and authentic activities

Format the response as a JSON array where each day is an object with:
- day: number
- title: "Day X: Brief description"
- schedule: array of objects with {time: "HH:MM AM/PM - HH:MM AM/PM", activity: "Activity name", description: "Brief description", type: "Sightseeing/Meal/Shopping/Rest/etc"}

Make sure the itinerary is comprehensive and covers the best attractions in ${destData.name}. Focus on famous places and create a balanced schedule.`;

    const geminiResponse = await callGeminiApi(prompt);

    if (geminiResponse) {
      try {
        // Try to parse as JSON first
        const parsedItinerary = JSON.parse(geminiResponse);
        return parsedItinerary;
      } catch (parseError) {
        // If not JSON, try to extract structured data from text response
        console.warn('Gemini response not valid JSON, attempting to parse text response');
        const textItinerary = parseTextItinerary(geminiResponse, days);
        if (textItinerary && textItinerary.length > 0) {
          return textItinerary;
        }
      }
    }
  } catch (error) {
    console.warn('Gemini itinerary generation failed:', error.message);
  }

  // Fallback to original logic if Gemini fails
  return generateFallbackItinerary(destData, days, budget, companions, planType);
}

// Helper function to parse text itinerary response from Gemini
function parseTextItinerary(textResponse, days) {
  try {
    const itinerary = [];
    const daySections = textResponse.split(/Day \d+:/i);

    for (let i = 1; i <= days && i < daySections.length; i++) {
      const dayContent = daySections[i];
      const schedule = [];

      // Extract time-based activities
      const timeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM))/gi;
      const activityRegex = /(?:\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM))\s*[:\-]?\s*(.+?)(?=\d{1,2}:\d{2}\s*(?:AM|PM)|$)/gi;

      let match;
      while ((match = activityRegex.exec(dayContent)) !== null) {
        const time = match[1].trim();
        const activityText = match[2].trim();

        // Split activity and description
        const parts = activityText.split(/[.:-]/, 2);
        const activity = parts[0].trim();
        const description = parts[1] ? parts[1].trim() : activity;

        // Determine type
        let type = 'Sightseeing';
        if (activity.toLowerCase().includes('lunch') || activity.toLowerCase().includes('dinner') || activity.toLowerCase().includes('breakfast')) {
          type = 'Meal';
        } else if (activity.toLowerCase().includes('shopping') || activity.toLowerCase().includes('market')) {
          type = 'Shopping';
        } else if (activity.toLowerCase().includes('rest') || activity.toLowerCase().includes('relax')) {
          type = 'Rest';
        }

        schedule.push({
          time,
          activity,
          description,
          type
        });
      }

      if (schedule.length === 0) {
        // Fallback: create basic schedule
        schedule.push(
          { time: '8:00 AM - 9:00 AM', activity: 'Breakfast', description: 'Enjoy breakfast at your hotel', type: 'Meal' },
          { time: '9:00 AM - 12:00 PM', activity: 'Morning Activity', description: 'Explore local attractions', type: 'Sightseeing' },
          { time: '12:00 PM - 1:00 PM', activity: 'Lunch', description: 'Local cuisine experience', type: 'Meal' },
          { time: '1:00 PM - 5:00 PM', activity: 'Afternoon Activity', description: 'Visit tourist spots', type: 'Sightseeing' },
          { time: '5:00 PM - 7:00 PM', activity: 'Shopping/Free Time', description: 'Shopping and relaxation', type: 'Shopping' },
          { time: '7:00 PM - 8:00 PM', activity: 'Dinner', description: 'Evening meal', type: 'Meal' }
        );
      }

      itinerary.push({
        day: i,
        title: `Day ${i}: Exploration and Discovery`,
        schedule
      });
    }

    return itinerary.length > 0 ? itinerary : null;
  } catch (error) {
    console.warn('Failed to parse text itinerary:', error.message);
    return null;
  }
}

// Fallback itinerary generation function
function generateFallbackItinerary(destData, days, budget, companions, planType = 'moderate') {
  const attractionsList = destData.attractions || [];
  const itinerary = [];

  // Define activity types based on destination type
  const activityTypes = {
    'City': ['Sightseeing', 'Museum Visit', 'Local Market', 'Cultural Experience', 'Food Tour', 'Nightlife'],
    'Beach': ['Beach Activities', 'Water Sports', 'Island Hopping', 'Sunset Cruise', 'Spa Day', 'Local Cuisine'],
    'Mountain': ['Hiking', 'Nature Walks', 'Cable Car Ride', 'Photography', 'Local Village Visit', 'Hot Springs'],
    'Island': ['Beach Time', 'Snorkeling', 'Boat Tour', 'Sunset Viewing', 'Local Culture', 'Relaxation'],
    'Adventure': ['Adventure Sports', 'Nature Exploration', 'Guided Tours', 'Wildlife Viewing', 'Camping', 'Extreme Activities']
  };

  const mealTypes = {
    'luxury': ['Michelin-star restaurant', 'Fine dining', 'Gourmet experience', 'Private chef'],
    'moderate': ['Local restaurants', 'Cafes', 'Street food', 'Mid-range dining'],
    'cheap': ['Street food', 'Local markets', 'Food stalls', 'Budget eateries']
  };

  const eveningOptions = {
    luxury: 'Sunset cruise followed by gourmet dining',
    moderate: 'Local market walk and popular restaurant dinner',
    cheap: 'Street food crawl and cultural street performance'
  };

  const attractionsPerDay = 2;

  // Generate day-by-day itinerary
  for (let day = 1; day <= days; day++) {
    const schedule = [];
    const startIndex = (day - 1) * attractionsPerDay;
    const todayPlaces = attractionsList.slice(startIndex, startIndex + attractionsPerDay);

    // Breakfast
    schedule.push({
      time: '8:00 AM - 9:00 AM',
      activity: 'Breakfast',
      description: 'Enjoy breakfast at your hotel',
      type: 'Meal'
    });

    // Morning activity
    if (todayPlaces[0]) {
      schedule.push({
        time: '9:00 AM - 12:00 PM',
        activity: `Visit ${todayPlaces[0].name}`,
        description: `Explore ${todayPlaces[0].name}, a popular attraction in ${destData.name}`,
        type: 'Sightseeing'
      });
    } else {
      const fallbackActivities = activityTypes[destData.type] || activityTypes['City'];
      const randomActivity = fallbackActivities[Math.floor(Math.random() * fallbackActivities.length)];
      schedule.push({
        time: '9:00 AM - 12:00 PM',
        activity: randomActivity,
        description: `Engage in ${randomActivity.toLowerCase()} activities tailored to your interests`,
        type: 'Exploration'
      });
    }

    // Lunch
    const lunchOptions = mealTypes[budget];
    const lunchChoice = lunchOptions[Math.floor(Math.random() * lunchOptions.length)];
    schedule.push({
      time: '12:00 PM - 1:00 PM',
      activity: 'Lunch',
      description: `Enjoy a delicious ${budget} lunch at ${lunchChoice}`,
      type: 'Meal'
    });

    // Afternoon activity
    if (todayPlaces[1]) {
      schedule.push({
        time: '1:00 PM - 5:00 PM',
        activity: `Visit ${todayPlaces[1].name}`,
        description: `Spend the afternoon at ${todayPlaces[1].name}, another highlight of ${destData.name}`,
        type: 'Sightseeing'
      });
    } else if (day % 2 === 0) {
      const afternoonActivities = activityTypes[destData.type] || activityTypes['City'];
      const afternoonActivity = afternoonActivities[Math.floor(Math.random() * afternoonActivities.length)];
      schedule.push({
        time: '1:00 PM - 5:00 PM',
        activity: afternoonActivity,
        description: `Take time for ${afternoonActivity.toLowerCase()} and immerse yourself in the local culture`,
        type: 'Cultural/Relaxation'
      });
    } else {
      const adventureActivities = ['Local Market Visit', 'Photography Tour', 'Guided Walking Tour', 'Cultural Workshop'];
      const adventureActivity = adventureActivities[Math.floor(Math.random() * adventureActivities.length)];
      schedule.push({
        time: '1:00 PM - 5:00 PM',
        activity: adventureActivity,
        description: `Experience ${adventureActivity.toLowerCase()} for an authentic local adventure`,
        type: 'Adventure'
      });
    }

    // Shopping/Free time
    schedule.push({
      time: '5:00 PM - 7:00 PM',
      activity: 'Shopping & Free Time',
      description: 'Explore local markets, shop for souvenirs, or relax',
      type: 'Shopping'
    });

    // Dinner
    if (day === days) {
      schedule.push({
        time: '7:00 PM - 9:00 PM',
        activity: 'Farewell Dinner',
        description: 'Enjoy a memorable farewell dinner and prepare for your journey home',
        type: 'Meal'
      });
    } else {
      const dinnerOptions = mealTypes[budget];
      const dinnerChoice = dinnerOptions[Math.floor(Math.random() * dinnerOptions.length)];
      schedule.push({
        time: '7:00 PM - 9:00 PM',
        activity: 'Dinner',
        description: `Conclude your day with a delightful ${budget} dinner at ${dinnerChoice}`,
        type: 'Meal'
      });
    }

    itinerary.push({
      day,
      title: `Day ${day}: ${schedule[1].activity}`,
      schedule
    });
  }

  return itinerary;
}

// AI prediction endpoint
app.post('/predict', async (req, res) => {
  try {
    const { destination, days, startDate, airport, members } = req.body;

    if (!destination || !days || !startDate || !airport || !members) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const parsedDays = Number(days);
    const parsedMembers = Math.max(1, Number(members));
    if (!parsedDays || parsedDays < 1) {
      return res.status(400).json({ error: 'Please enter a valid number of days' });
    }

    const destData = buildDestinationProfile(destination) || buildFallbackDestinationProfile(destination);
    const plans = await buildTripPlans(destData, parsedDays, startDate, airport, parsedMembers);
    const hotelRecommendation = getHotelRecommendation(destData, 'moderate');
    const topAttractions = destData.attractions.slice(0, 5).map(a => a.name);
    const estimatedCost = plans.length ? plans[1]?.estimatedTotalCost || plans[0].estimatedTotalCost : 0;

    // Extract flight availability message from plans (if any plan has it)
    const flightAvailabilityMessage = plans.find(plan => plan.flightAvailabilityMessage)?.flightAvailabilityMessage;

    res.json({
      destination: destData.name,
      duration: parsedDays,
      startDate,
      airport,
      members: parsedMembers,
      estimatedCost,
      currency: 'INR',
      plans,
      availableFlights: plans.flatMap(plan => [plan.outboundFlight, plan.returnFlight]),
      availableHotels: plans.map(plan => plan.hotel),
      flightAvailabilityMessage,
      recommendation: {
        confidence: 0.88,
        reason: `Current plans use ${destData.travelMonth} and real-time flight and hotel checks for your selected dates.`
      },
      destinationInfo: {
        type: destData.type,
        bestSeason: destData.best_season,
        travelMonth: destData.travelMonth,
        popularityScore: destData.popularity_score,
        averageRating: destData.averageRating,
        hotelRecommendation
      },
      topAttractions
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(503).json({ 
      error: 'Real-time data temporarily unavailable', 
      message: 'We are unable to fetch current flight and hotel prices at the moment. Please try again later.',
      details: error.message
    });
  }
});

// Get all destinations for dropdown
app.get('/destinations', (req, res) => {
  res.json(destinations);
});

// Search flights from nearby airports for itinerary
// Get approximate flight costs when real-time data is unavailable
async function getApproximateFlightCosts(from, to, dateString) {
  try {
    console.log(`Getting approximate flight costs from ${from} to ${to} on ${dateString}`);

    // Use Serp API to search for general flight pricing information
    const searchQuery = `flight prices from ${from} to ${to} ${dateString}`;

    const response = await callSerpApi({
      engine: 'google',
      q: searchQuery,
      hl: 'en',
      gl: 'in'
    });

    // Extract pricing information from search results
    const organicResults = response.organic_results || [];
    const approximatePrices = [];

    // Common airlines and their typical price ranges for Indian routes
    const airlinePriceRanges = {
      'IndiGo': { min: 2500, max: 15000 },
      'Air India': { min: 3500, max: 20000 },
      'SpiceJet': { min: 2200, max: 12000 },
      'GoAir': { min: 2000, max: 10000 },
      'Vistara': { min: 4000, max: 25000 },
      'AirAsia India': { min: 1800, max: 8000 },
      'Alliance Air': { min: 1500, max: 6000 }
    };

    // Try to extract prices from search results
    for (const result of organicResults.slice(0, 5)) {
      const title = result.title || '';
      const snippet = result.snippet || '';

      // Look for price patterns in the text
      const priceRegex = /₹\s*[\d,]+(?:\.\d{2})?/g;
      const prices = [];

      [title, snippet].forEach(text => {
        const matches = text.match(priceRegex);
        if (matches) {
          matches.forEach(match => {
            const price = parseInt(match.replace(/[₹,\s]/g, ''));
            if (price >= 1000 && price <= 50000) { // Reasonable flight price range
              prices.push(price);
            }
          });
        }
      });

      if (prices.length > 0) {
        approximatePrices.push(...prices);
      }
    }

    // If we couldn't extract prices from search results, use predefined ranges
    if (approximatePrices.length === 0) {
      console.log('No prices found in search results, using predefined airline ranges');

      // Calculate distance-based pricing (rough estimate)
      const distanceMultiplier = getDistanceMultiplier(from, to);

      Object.entries(airlinePriceRanges).forEach(([airline, range]) => {
        const basePrice = Math.round((range.min + range.max) / 2 * distanceMultiplier);
        approximatePrices.push(basePrice);
      });
    }

    // Remove duplicates and sort
    const uniquePrices = [...new Set(approximatePrices)].sort((a, b) => a - b);

    // Create approximate flight objects
    const airlines = Object.keys(airlinePriceRanges);
    const approximateFlights = uniquePrices.slice(0, 5).map((price, index) => {
      const airline = airlines[index % airlines.length];
      return {
        airline: airline,
        flightNumber: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
        class: 'Economy',
        cost: price,
        departure: getNearbyAirports(from)[0] || 'DEL',
        arrival: getAirportCode(to) || 'DEL',
        flightTime: '2h 30m - 4h 30m', // Approximate
        layovers: Math.random() > 0.7 ? '1 stop' : 'Direct',
        departureTime: 'Various times available',
        arrivalTime: 'Various times available',
        fromAirport: getNearbyAirports(from)[0] || 'DEL',
        isApproximate: true,
        note: 'Approximate cost based on historical data'
      };
    });

    console.log(`Generated ${approximateFlights.length} approximate flight options`);
    return approximateFlights;

  } catch (error) {
    console.error('Approximate flight cost calculation failed:', error);

    // Ultimate fallback: provide basic price ranges
    const basicFlights = [
      { airline: 'IndiGo', cost: 3500, flightNumber: '6E101', class: 'Economy', departure: 'DEL', arrival: 'BOM', flightTime: '2h 30m', layovers: 'Direct', departureTime: 'Various', arrivalTime: 'Various', isApproximate: true, note: 'Basic estimate' },
      { airline: 'Air India', cost: 5500, flightNumber: 'AI201', class: 'Economy', departure: 'DEL', arrival: 'BOM', flightTime: '2h 45m', layovers: 'Direct', departureTime: 'Various', arrivalTime: 'Various', isApproximate: true, note: 'Basic estimate' },
      { airline: 'SpiceJet', cost: 2800, flightNumber: 'SG301', class: 'Economy', departure: 'DEL', arrival: 'BOM', flightTime: '2h 20m', layovers: 'Direct', departureTime: 'Various', arrivalTime: 'Various', isApproximate: true, note: 'Basic estimate' }
    ];

    return basicFlights;
  }
}

// Calculate rough distance multiplier for pricing
function getDistanceMultiplier(from, to) {
  // Simple distance-based multiplier (this is approximate)
  const shortRoutes = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
  const mediumRoutes = ['Goa', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Ranchi'];
  const longRoutes = ['Manali', 'Shimla', 'Darjeeling', 'Amritsar', 'Jammu', 'Srinagar', 'Varanasi', 'Agra'];

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  const isShortFrom = shortRoutes.some(city => fromLower.includes(city.toLowerCase()));
  const isShortTo = shortRoutes.some(city => toLower.includes(city.toLowerCase()));
  const isMediumFrom = mediumRoutes.some(city => fromLower.includes(city.toLowerCase()));
  const isMediumTo = mediumRoutes.some(city => toLower.includes(city.toLowerCase()));
  const isLongFrom = longRoutes.some(city => fromLower.includes(city.toLowerCase()));
  const isLongTo = longRoutes.some(city => toLower.includes(city.toLowerCase()));

  if ((isShortFrom && isShortTo) || (isMediumFrom && isMediumTo)) {
    return 1.0; // Short/medium distance
  } else if ((isShortFrom && isMediumTo) || (isMediumFrom && isShortTo)) {
    return 1.2; // Mixed short-medium
  } else if ((isShortFrom && isLongTo) || (isLongFrom && isShortTo)) {
    return 1.5; // Short to long
  } else if ((isMediumFrom && isLongTo) || (isLongFrom && isMediumTo)) {
    return 1.3; // Medium to long
  } else {
    return 1.1; // Default
  }
}

app.post('/search-flights-itinerary', async (req, res) => {
  try {
    const { from, to, date, members = 2 } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }

    // Use provided date or default to today + 7 days
    const dateString = date || (() => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      return startDate.toISOString().split('T')[0];
    })();

    // Get nearby airports for the 'from' location
    const nearbyAirports = getNearbyAirports(from);

    let allFlights = [];
    let searchedAirports = [];

    // Search flights from each nearby airport
    for (const airport of nearbyAirports) {
      try {
        const flights = await getSerpFlights({ name: to }, dateString, airport, 'moderate', members, false);
        if (flights && flights.length > 0) {
          // Add airport info to flights
          const flightsWithAirport = flights.map(flight => ({
            ...flight,
            departureAirport: airport,
            fromCity: from
          }));
          allFlights = allFlights.concat(flightsWithAirport);
          searchedAirports.push(airport);
        }
      } catch (error) {
        console.warn(`Failed to search flights from ${airport}:`, error.message);
      }
    }

    // If no flights found from nearby airports, try major airports
    if (allFlights.length === 0) {
      const majorAirports = ['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD', 'PNQ', 'AMD'];
      for (const airport of majorAirports.slice(0, 3)) { // Try first 3 major airports
        if (!searchedAirports.includes(airport)) {
          try {
            const flights = await getSerpFlights({ name: to }, dateString, airport, 'moderate', members, false);
            if (flights && flights.length > 0) {
              const flightsWithAirport = flights.map(flight => ({
                ...flight,
                departureAirport: airport,
                fromCity: from,
                note: `Flight from ${airport} (alternative airport)`
              }));
              allFlights = allFlights.concat(flightsWithAirport);
            }
          } catch (error) {
            console.warn(`Failed to search flights from ${airport}:`, error.message);
          }
        }
      }
    }

    // If no flights were found, return approximate pricing instead of empty results
    if (allFlights.length === 0) {
      console.log('No live flights found in nearby or major airports; using approximate pricing fallback.');
      const approximateFlights = await getApproximateFlightCosts(from, to, dateString);
      return res.json({
        flights: approximateFlights,
        searchedAirports,
        totalFound: approximateFlights.length,
        date: dateString,
        isApproximate: true,
        message: 'Real-time flight data unavailable. Showing approximate costs based on historical data.'
      });
    }

    // Sort by price and return top 3
    allFlights.sort((a, b) => a.cost - b.cost);
    const topFlights = allFlights.slice(0, 3);

    res.json({
      flights: topFlights,
      searchedAirports,
      totalFound: allFlights.length,
      date: dateString
    });
  } catch (error) {
    console.error('Flight search error:', error);

    // If real-time flight search fails, provide approximate pricing
    try {
      console.log('Providing approximate flight costs as fallback...');

      const approximateFlights = await getApproximateFlightCosts(from, to, dateString);

      res.json({
        flights: approximateFlights,
        searchedAirports: [],
        totalFound: approximateFlights.length,
        date: dateString,
        isApproximate: true,
        message: 'Real-time flight data unavailable. Showing approximate costs based on historical data.'
      });
    } catch (fallbackError) {
      console.error('Fallback pricing also failed:', fallbackError);
      res.status(500).json({
        error: 'Failed to search flights',
        details: 'Both real-time and approximate flight data are currently unavailable. Please try again later.',
        isApproximate: false
      });
    }
  }
});

// Search flights from nearby airports
app.post('/search-flights', async (req, res) => {
  try {
    const { from, to, date, members = 2, isReturn = false } = req.body;

    if (!from || !to || !date) {
      return res.status(400).json({ error: 'from, to, and date are required' });
    }

    // Get nearby airports for the 'from' location
    const nearbyAirports = getNearbyAirports(from);

    let allFlights = [];

    // Search flights from each nearby airport
    for (const airport of nearbyAirports) {
      try {
        const flights = await getSerpFlights({ name: to }, date, airport, 'moderate', members, isReturn);
        if (flights && flights.length > 0) {
          // Add airport info to flights
          const flightsWithAirport = flights.map(flight => ({
            ...flight,
            fromAirport: airport
          }));
          allFlights = allFlights.concat(flightsWithAirport);
        }
      } catch (error) {
        console.log(`No flights found from ${airport}, continuing...`);
      }
    }

    if (allFlights.length === 0) {
      console.log('No flights found from nearby airports; using approximate pricing fallback.');
      const approximateFlights = await getApproximateFlightCosts(from, to, date);
      return res.json({
        flights: approximateFlights,
        searchedAirports: nearbyAirports,
        totalFound: approximateFlights.length,
        date,
        isApproximate: true,
        message: 'No live flights were found. Showing approximate flight options based on historical data.'
      });
    }

    // Sort by price and return top 3
    allFlights.sort((a, b) => a.cost - b.cost);
    res.json({ flights: allFlights.slice(0, 3) });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Failed to search flights', details: error.message });
  }
});

// Search hotels in destination
app.post('/search-hotels', async (req, res) => {
  try {
    const { destination, date, starRating = 4 } = req.body;

    if (!destination || !date) {
      return res.status(400).json({ error: 'destination and date are required' });
    }

    const destData = { name: destination, state: destination };

    // Get hotels for different budget categories
    const allHotels = await getSerpHotels(destData, date, 'moderate', 2, starRating);

    if (!allHotels || allHotels.length === 0) {
      return res.status(404).json({ error: 'No hotels found' });
    }

    // Categorize hotels by price
    const categorizedHotels = {
      cheap: [],
      moderate: [],
      luxury: []
    };

    allHotels.forEach(hotel => {
      if (hotel.price_per_night <= 3000) {
        if (categorizedHotels.cheap.length < 2) {
          categorizedHotels.cheap.push(hotel);
        }
      } else if (hotel.price_per_night <= 6000) {
        if (categorizedHotels.moderate.length < 2) {
          categorizedHotels.moderate.push(hotel);
        }
      } else {
        if (categorizedHotels.luxury.length < 2) {
          categorizedHotels.luxury.push(hotel);
        }
      }
    });

    // If we don't have enough hotels in each category, fill from other categories
    if (categorizedHotels.cheap.length < 2 && categorizedHotels.moderate.length > 0) {
      const needed = 2 - categorizedHotels.cheap.length;
      categorizedHotels.cheap.push(...categorizedHotels.moderate.slice(0, needed));
      categorizedHotels.moderate = categorizedHotels.moderate.slice(needed);
    }

    if (categorizedHotels.moderate.length < 2 && categorizedHotels.luxury.length > 0) {
      const needed = 2 - categorizedHotels.moderate.length;
      categorizedHotels.moderate.push(...categorizedHotels.luxury.slice(0, needed));
      categorizedHotels.luxury = categorizedHotels.luxury.slice(needed);
    }

    // Ensure at least 5 hotel options by filling from the full results list if needed
    const currentHotels = [
      ...(categorizedHotels.cheap || []),
      ...(categorizedHotels.moderate || []),
      ...(categorizedHotels.luxury || [])
    ];
    const existingHotelKeys = new Set(currentHotels.map(h => `${h.hotel_name}_${h.price_per_night}`));
    for (const hotel of allHotels) {
      if (currentHotels.length >= 5) break;
      const hotelKey = `${hotel.hotel_name}_${hotel.price_per_night}`;
      if (existingHotelKeys.has(hotelKey)) continue;
      if (hotel.price_per_night <= 3000) {
        categorizedHotels.cheap.push(hotel);
      } else if (hotel.price_per_night <= 6000) {
        categorizedHotels.moderate.push(hotel);
      } else {
        categorizedHotels.luxury.push(hotel);
      }
      existingHotelKeys.add(hotelKey);
      currentHotels.push(hotel);
    }

    res.json({ hotels: categorizedHotels });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({ error: 'Failed to search hotels', details: error.message });
  }
});

// Generate itinerary using Gemini
app.post('/generate-itinerary', async (req, res) => {
  try {
    const { destination, days, startDate, inboundFlight, outboundFlight, hotel } = req.body;

    if (!destination || !days || !startDate || !inboundFlight || !hotel) {
      return res.status(400).json({ error: 'destination, days, startDate, inboundFlight, and hotel are required' });
    }

    let itinerary = await generateDetailedItinerary(
      { name: destination, state: destination },
      days,
      'moderate',
      2,
      'moderate'
    );

    if (!Array.isArray(itinerary) || itinerary.some(day => !day || !Array.isArray(day.schedule))) {
      console.warn('Itinerary response invalid or malformed; using fallback itinerary');
      itinerary = generateFallbackItinerary({ name: destination, state: destination }, days, 'moderate', 2, 'moderate');
    }

    res.json({ itinerary });
  } catch (error) {
    console.error('Itinerary generation error:', error);
    res.status(500).json({ error: 'Failed to generate itinerary', details: error.message });
  }
});

// Budget filter endpoint
app.post('/filter-plans', async (req, res) => {
  try {
    const { maxBudget, plans } = req.body;

    if (!maxBudget || !plans || !Array.isArray(plans)) {
      return res.status(400).json({ error: 'maxBudget and plans array are required' });
    }

    const filteredPlans = plans.filter(plan => plan.estimatedTotalCost <= maxBudget);

    res.json({
      filteredPlans,
      totalPlans: filteredPlans.length,
      maxBudget,
      message: `Found ${filteredPlans.length} plans within ₹${maxBudget} budget`
    });
  } catch (error) {
    console.error('Filter plans error:', error);
    res.status(500).json({ error: 'Failed to filter plans', details: error.message });
  }
});

// Itinerary overview endpoint
app.post('/itinerary-overview', async (req, res) => {
  try {
    const { destination, days, startDate } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ error: 'Destination and days are required' });
    }

    const prompt = `Create a brief overview of a ${days}-day itinerary for ${destination} starting on ${startDate || 'the selected date'}.

List 3-5 key activities or experiences that will be included in the itinerary, one per line. Focus on the most exciting and unique aspects.

Format as bullet points, each describing a different day or type of activity. Keep each point under 15 words.

Example for Goa:
• Day 1: Beach hopping and water sports adventure
• Day 2: Cultural exploration of Portuguese heritage
• Day 3: Spice plantation tour and local cuisine
• Evening: Vibrant nightlife and beachside dining

Make it enticing and specific to ${destination}.`;

    const geminiResponse = await callGeminiApi(prompt);

    if (geminiResponse) {
      res.json({ overview: geminiResponse.trim() });
    } else {
      // Fallback overviews
      const fallbackOverviews = {
        'Goa': `• Day 1: Beach relaxation and water sports\n• Day 2: Historical forts and Portuguese architecture\n• Day 3: Spice plantations and local markets\n• Evening: Seafood dinners and beach nightlife`,
        'Jaipur': `• Day 1: Palace tours and royal heritage\n• Day 2: Desert safari and cultural performances\n• Day 3: Local markets and handicraft shopping\n• Evening: Traditional Rajasthani cuisine`,
        'Manali': `• Day 1: Scenic drives and valley exploration\n• Day 2: Adventure activities and trekking\n• Day 3: Temple visits and hot springs\n• Evening: Mountain views and local food`,
        'Kerala': `• Day 1: Backwater cruises and houseboat stays\n• Day 2: Spice plantation tours\n• Day 3: Wildlife sanctuaries and cultural shows\n• Evening: Ayurvedic treatments and seafood`,
        'Agra': `• Day 1: Taj Mahal and Mughal monuments\n• Day 2: Local markets and street food\n• Day 3: Day trip to nearby historical sites\n• Evening: Sunset views and Mughal cuisine`,
        'Varanasi': `• Day 1: Ganges River ceremonies and temples\n• Day 2: Boat rides and spiritual experiences\n• Day 3: Local markets and artisan workshops\n• Evening: Traditional music and dance`,
        'Rishikesh': `• Day 1: Yoga and meditation sessions\n• Day 2: River rafting and adventure sports\n• Day 3: Temple visits and nature walks\n• Evening: Campfire stories and local cuisine`,
        'Mumbai': `• Day 1: Iconic landmarks and city tours\n• Day 2: Bollywood and entertainment district\n• Day 3: Marine Drive and coastal walks\n• Evening: Street food and nightlife`,
        'Delhi': `• Day 1: Historical monuments and forts\n• Day 2: Markets and local culture\n• Day 3: Modern attractions and museums\n• Evening: Mughlai cuisine and bazaars`,
        'Bangalore': `• Day 1: Gardens and colonial architecture\n• Day 2: Tech parks and innovation centers\n• Day 3: Shopping and local cuisine\n• Evening: Pub hopping and nightlife`
      };

      const overview = fallbackOverviews[destination] || `• Day 1: Explore top attractions and landmarks\n• Day 2: Experience local culture and cuisine\n• Day 3: Adventure activities and relaxation\n• Evening: Memorable dining and entertainment`;
      res.json({ overview });
    }
  } catch (error) {
    console.error('Itinerary overview error:', error);
    res.status(500).json({ error: 'Failed to generate overview' });
  }
});

// Itinerary preview endpoint
app.post('/itinerary-preview', async (req, res) => {
  try {
    const { destination, days = 3 } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const prompt = `Create a brief preview of a ${days}-day trip itinerary for ${destination}. 

Focus on the top 3-4 highlights and activities that make this destination special. Keep it exciting and enticing, like a teaser for the full itinerary.

Format as a short paragraph (2-3 sentences) highlighting the most amazing experiences and attractions. Make it sound adventurous and appealing.

Example: "Discover the stunning beaches of Goa with thrilling water sports, explore ancient temples, and indulge in delicious seafood at beachside shacks. Experience the vibrant nightlife, visit spice plantations, and relax in luxury resorts overlooking the Arabian Sea."

Keep it under 100 words and focus on the unique selling points of ${destination}.`;

    const geminiResponse = await callGeminiApi(prompt);

    if (geminiResponse) {
      res.json({ preview: geminiResponse.trim() });
    } else {
      // Fallback preview
      const fallbackPreviews = {
        'Goa': 'Experience pristine beaches, thrilling water sports, and vibrant nightlife in this coastal paradise. Explore Portuguese architecture, spice plantations, and indulge in fresh seafood at beachside shacks.',
        'Jaipur': 'Discover the Pink City\'s majestic palaces, ancient forts, and bustling markets. Experience royal heritage, elephant rides, and traditional Rajasthani cuisine in this cultural gem.',
        'Manali': 'Adventure awaits in the Himalayan foothills with trekking, paragliding, and scenic drives. Visit ancient temples, hot springs, and enjoy apple orchards in this mountain paradise.',
        'Kerala': 'Cruise through backwaters, explore spice plantations, and experience Ayurvedic wellness. Discover wildlife sanctuaries, Chinese fishing nets, and coconut groves in God\'s Own Country.',
        'Agra': 'Marvel at the Taj Mahal\'s timeless beauty, explore Mughal architecture, and stroll through Mughal gardens. Experience the romance and history of this iconic monument.',
        'Varanasi': 'Witness the spiritual Ganges River ceremonies, explore ancient temples, and take a boat ride at sunrise. Immerse yourself in India\'s oldest living city and its sacred traditions.',
        'Rishikesh': 'Find inner peace with yoga and meditation by the Ganges, go white-water rafting, and visit ancient temples. Experience adventure sports and spiritual awakening in this Himalayan town.',
        'Mumbai': 'Experience Bollywood glamour, Gateway of India majesty, and vibrant street life. Visit Elephanta Caves, enjoy seafood, and explore the bustling metropolis that never sleeps.',
        'Delhi': 'Journey through India\'s capital with Red Fort majesty, India Gate grandeur, and bustling Chandni Chowk markets. Experience Mughal history and modern India\'s vibrant culture.',
        'Bangalore': 'Explore tech innovation, beautiful gardens, and colonial architecture. Visit Lal Bagh, enjoy pub hopping, and experience the Garden City\'s cosmopolitan vibe.'
      };

      const preview = fallbackPreviews[destination] || `Discover the unique charm and attractions of ${destination}. Experience local culture, cuisine, and unforgettable adventures in this amazing destination.`;
      res.json({ preview });
    }
  } catch (error) {
    console.error('Itinerary preview error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});