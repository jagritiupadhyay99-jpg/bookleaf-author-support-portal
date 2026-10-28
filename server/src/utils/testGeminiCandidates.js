const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const https = require('https');

const candidates = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
];

function testModel(model, key) {
  return new Promise((resolve) => {
    const prompt = 'Hello, reply with only the word "OK"';
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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          resolve({ model, status: res.statusCode, reply, error: parsed.error?.message });
        } catch (e) {
          resolve({ model, status: res.statusCode, error: e.message });
        }
      });
    });
    req.on('error', err => resolve({ model, error: err.message }));
    req.write(body);
    req.end();
  });
}

async function runTests() {
  const key = process.env.LLM_API_KEY || '';
  for (const m of candidates) {
    const res = await testModel(m, key);
    console.log(`[${res.model}] status=${res.status} reply="${res.reply || ''}" ${res.error ? 'err=' + res.error.slice(0, 60) : ''}`);
  }
}

runTests();
