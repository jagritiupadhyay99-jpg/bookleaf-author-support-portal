const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const https = require('https');

async function testGemini38() {
  const key = process.env.LLM_API_KEY || '';
  const model = 'gemini-3.8-flash';

  const prompt = 'Hello, reply with only the word "OK" to verify API connection.';
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 20, temperature: 0.1 },
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:generateContent`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.log('STATUS_CODE:', res.statusCode);
            console.log('RESULT: GEMINI_SUCCESS');
            console.log('MODEL: ' + model);
            console.log('RESPONSE_TEXT:', parsed.candidates[0].content.parts[0].text.trim());
          } else {
            console.log('STATUS_CODE:', res.statusCode);
            console.log('RESULT: GEMINI_ERROR');
            console.log('DETAILS:', parsed.error?.message || data);
          }
        } catch (e) {
          console.log('PARSE_ERROR:', e.message);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('NETWORK_ERROR:', err.message);
      resolve();
    });

    req.write(body);
    req.end();
  });
}

testGemini38();
