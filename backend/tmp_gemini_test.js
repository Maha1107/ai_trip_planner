require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `${process.env.GEMINI_API_URL}?key=${apiKey}`;

  console.log('Testing Gemini API URL:', url.replace(apiKey, 'API_KEY'));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, test message' }] }]
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success! Response keys:', Object.keys(data));
      if (data.candidates && data.candidates[0]) {
        console.log('Generated text:', data.candidates[0].content.parts[0].text);
      }
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testGeminiAPI();