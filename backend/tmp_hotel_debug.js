require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const tripService = require('./services/tripService');

async function testParsedHotels() {
  try {
    const hotels = await tripService.searchHotels('goa', '2026-06-01', '2026-06-05');
    console.log('Parsed hotels result:');

    // Find Amadi hotel
    const allHotels = [...hotels.cheap, ...hotels.moderate, ...hotels.luxury];
    const amadiHotel = allHotels.find(h => h.hotel_name && h.hotel_name.toLowerCase().includes('amadi'));

    if (amadiHotel) {
      console.log('Amadi hotel parsed:', JSON.stringify(amadiHotel, null, 2));
    } else {
      console.log('Amadi hotel not found in parsed results. First few hotels:');
      allHotels.slice(0, 3).forEach((hotel, i) => {
        console.log(`${i+1}. ${hotel.hotel_name}: ₹${hotel.price_per_night}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testParsedHotels();