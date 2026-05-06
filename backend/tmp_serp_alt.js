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
  const tests = [
    {
      label: 'flights engine=google_flights q',
      params: {
        engine: 'google_flights',
        q: 'flights from Delhi to Los Angeles on 2026-06-01 return on 2026-06-10',
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      }
    },
    {
      label: 'flights engine=google_flights ids',
      params: {
        engine: 'google_flights',
        departure_id: 'Delhi',
        arrival_id: 'Los Angeles',
        departure_date: '2026-06-01',
        return_date: '2026-06-10',
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      }
    },
    {
      label: 'flights engine=google_flights codes',
      params: {
        engine: 'google_flights',
        departure_id: 'DEL',
        arrival_id: 'LAX',
        departure_date: '2026-06-01',
        return_date: '2026-06-10',
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      }
    },
    {
      label: 'flights engine=google_flights codes outbound',
      params: {
        engine: 'google_flights',
        departure_id: 'DEL',
        arrival_id: 'LAX',
        outbound_date: '2026-06-01',
        return_date: '2026-06-10',
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      }
    },
    {
      label: 'hotels engine=google_hotels q',
      params: {
        engine: 'google_hotels',
        q: 'hotels in Los Angeles from 2026-06-01 to 2026-06-10',
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      }
    },
    {
      label: 'hotels engine=google_hotels dates',
      params: {
        engine: 'google_hotels',
        q: 'hotels in Los Angeles',
        check_in_date: '2026-06-01',
        check_out_date: '2026-06-10',
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      }
    },
    {
      label: 'hotels engine=google_travel',
      params: {
        engine: 'google_travel',
        q: 'hotels in Los Angeles from 2026-06-01 to 2026-06-10',
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      }
    }
  ];

  for (const test of tests) {
    try {
      const url = buildUrl(test.params);
      console.log('---');
      console.log(test.label);
      console.log(url);
      const json = await fetchJson(url);
      console.log('top keys:', Object.keys(json));
      if (json.error) {
        console.log('error:', json.error);
      }
      for (const key of Object.keys(json)) {
        const value = json[key];
        if (Array.isArray(value)) {
          console.log(`array key ${key} len ${value.length}`);
          if (key === 'best_flights' || key === 'properties') {
            console.log(`sample ${key}:`, JSON.stringify(value.slice(0, 2), null, 2));
          }
        }
      }
    } catch (err) {
      console.error(test.label, 'fetch failed:', err.message || err);
    }
  }
})();
