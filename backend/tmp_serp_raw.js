require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const https = require('https');
const querystring = require('querystring');

const apiKey = process.env.SERP_API_KEY || process.env.SERPAPI_API_KEY;
const buildUrl = (params) => `https://serpapi.com/search.json?${querystring.stringify(params)}`;

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  }).on('error', reject);
});

(async () => {
  const flightParams = {
    engine: 'google_flights',
    q: 'flights from Delhi to Los Angeles on 2026-06-01 return on 2026-06-10',
    hl: 'en',
    gl: 'us',
    api_key: apiKey
  };
  const hotelParams = {
    engine: 'google_travel_hotels',
    q: 'hotels in Los Angeles from 2026-06-01 to 2026-06-10',
    hl: 'en',
    gl: 'us',
    api_key: apiKey
  };

  for (const [label, params] of [['flight', flightParams], ['hotel', hotelParams]]) {
    try {
      const url = buildUrl(params);
      console.log(`${label} url:`, url);
      const json = await fetchJson(url);
      console.log(`${label} top keys:`, Object.keys(json));
      if (json.error) {
        console.log(`${label} error:`, JSON.stringify(json.error, null, 2));
      }
      console.log(`${label} first 5 entries of potential arrays:`);
      for (const key of Object.keys(json)) {
        const value = json[key];
        if (Array.isArray(value)) {
          console.log(`  array key ${key} len ${value.length}`);
          console.log(JSON.stringify(value.slice(0, 2), null, 2));
        }
      }
      const arrays = Object.entries(json).filter(([_, v]) => Array.isArray(v));
      if (arrays.length === 0) {
        console.log(`${label} no top-level arrays`);
      }
      console.log('----');
    } catch (err) {
      console.error(`${label} fetch error:`, err.message || err);
    }
  }
})();
