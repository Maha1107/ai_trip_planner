# AI Trip Planner - Technical Issues & Fixes Required

## Critical Issues Found During Testing

### 1. Airport Code Mapping Error - COI resolves to wrong location

**Issue:** 
- The destination "Ooty" is mapped to airport code "COI"
- However, SerpAPI resolves COI to "Merritt Island" (USA), not Coimbatore/Ooty (India)
- This causes all flight searches to fail

**Location:** [backend/server.js](backend/server.js#L202-L220)
```javascript
const cityToAirportMap = {
  // ...
  'Ooty': 'COI', // ❌ WRONG - COI = Merritt Island, USA
  // ...
};
```

**Correct Mapping:**
- Ooty should use COI (Coimbatore) for flights, but SerpAPI may not recognize it correctly
- Better options:
  - Use nearest major airport: BLR (Bangalore - 80 km away)
  - Use CJB (Coimbatore - 70 km away)

**Fix Required:**
```javascript
const cityToAirportMap = {
  // ...
  'Ooty': 'CJB', // Coimbatore airport
  // ...
};
```

**Additionally:**
Add fallback logic in `getSerpFlights()` function to try multiple airport codes when initial search fails.

---

### 2. SerpAPI Flight Search Not Finding Flights

**Issue:**
- SerpAPI returns empty results for BLR → COI (wrong airport)
- Fallback to nearby airports (Gemini AI suggestion) also fails
- System eventually throws error instead of providing approximate data

**Location:** [backend/server.js](backend/server.js#L535-L645)

**Current Behavior:**
```
Trying outbound flights from nearby airport BOM to COI on 2026-06-15
No outbound flights found from BOM, trying next airport...
[Tries 5 airports - all fail]
Error: No outbound flights found from BLR or nearby airports
```

**Issue in Code:**
The function tries all nearby airports but still fails. The problem is that:
1. COI airport code is incorrect
2. No fallback to approximate data
3. Error is thrown instead of using historical data

**Fix Required:**
1. Update airport code mapping
2. Add fallback to historical pricing data
3. Generate approximate flights based on `pricingByDestination` data

---

### 3. Return Flight Search Failure

**Issue:**
- Return flight search endpoint returns 400 Bad Request
- System cannot generate itinerary without return flight data

**Symptoms:**
- Browser console shows 400 errors
- Trip summary displays but without return flight information
- Itinerary generation fails

**Possible Causes:**
1. Same airport code issue (COI)
2. Request parameter validation issue
3. Date format problem

**Location:** [backend/server.js](backend/server.js#L223-L250) - `/search-flights` endpoint

**Fix Required:**
1. Add error handling in `/search-flights` endpoint
2. Return fallback flights instead of error
3. Log detailed error messages for debugging

---

### 4. Itinerary Generation Not Returning Data

**Issue:**
- `/generate-itinerary` endpoint returns empty or error
- Bot receives error message instead of detailed itinerary

**Current Message:**
```
"I have your flight and hotel selections, but couldn't generate the 
detailed itinerary. Here's your trip summary:"
```

**Expected Message:**
Should include day-wise plan with 2-3 tourist spots per day with estimated stay times

**Location:** [backend/server.js] - `/generate-itinerary` endpoint

**Fix Required:**
1. Debug itinerary generation logic
2. Ensure Gemini API calls are working
3. Add fallback to static itinerary templates
4. Validate response before sending to client

---

## Test Results Summary

### ✅ **Working Features:**
- Landing page and UI
- Destination selection
- Date validation
- Hotel selection
- Stay duration input
- Chat flow and messaging

### ❌ **Broken Features:**
- Return flight search (400 error)
- Itinerary generation
- Final budget summary display
- Flight cost calculations for return journey

### ⚠️ **Specification Mismatches:**
- Showing 5 flights instead of 3
- Showing 4 hotels instead of 5
- Missing hotel images
- Missing itinerary satisfaction buttons

---

## Immediate Actions Required

### 1. Fix Airport Code Mapping (Priority: CRITICAL)
```javascript
// backend/server.js - Update cityToAirportMap
const cityToAirportMap = {
  'Goa': 'GOI',
  'Rishikesh': 'DED',
  'Varanasi': 'VNS',
  'Jaipur': 'JAI',
  'Manali': 'KUU',
  'Hyderabad': 'HYD',
  'Agra': 'AGR',
  'Mumbai': 'BOM',
  'Ooty': 'CJB',  // ✅ FIXED - Was 'COI'
  'Kerala': 'COK',
  'Delhi': 'DEL',
  'Bangalore': 'BLR',
  'Chennai': 'MAA',
  'Kolkata': 'CCU',
  'Pune': 'PNQ',
  'Ahmedabad': 'AMD',
  'Shimla': 'SXR',  // Need to verify
  'Darjeeling': 'BAG',  // Bagdogra airport
  'Amritsar': 'ATQ',
  'Mysore': 'BLR'  // Use Bangalore airport
};
```

### 2. Add Fallback Flight Data
```javascript
// When SerpAPI fails, use fallback function
function getFallbackFlights(destination, startDate, members) {
  // Use pricingByDestination data
  // Generate 3-5 approximate flights with historical data
  // Mark them as "Approximate" in response
}
```

### 3. Add Error Handling to Return Flight Endpoint
```javascript
app.post('/search-flights', async (req, res) => {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Flight search error:', error);
    // Instead of error, return fallback flights
    const fallbackFlights = getFallbackFlights(from, to, date);
    res.json({ 
      flights: fallbackFlights, 
      isApproximate: true,
      error: error.message 
    });
  }
});
```

### 4. Fix Itinerary Generation
Ensure the `/generate-itinerary` endpoint:
1. Validates all inputs
2. Has proper error handling
3. Returns fallback itinerary if Gemini fails
4. Formats response correctly for frontend

---

## Testing Checklist for Fixes

- [ ] Verify airport codes are correct for all destinations
- [ ] Test flight search with updated airport codes
- [ ] Verify SerpAPI returns flights for test routes
- [ ] Test return flight search
- [ ] Verify itinerary generation completes
- [ ] Check budget calculations are accurate
- [ ] Verify trip summary displays correctly
- [ ] Test with multiple destinations
- [ ] Check error messages are user-friendly
- [ ] Validate all API responses

---

## Environment Info
- API Base: http://localhost:5001
- Frontend: http://localhost:3000
- Test Date: April 30, 2026
- Node Version: (Check with `node --version`)
- npm Version: (Check with `npm --version`)

---
