const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const https = require('https');

async function listModels() {
  const key = process.env.LLM_API_KEY || '';
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${key}`,
    method: 'GET',
    headers: {
      'x-goog-api-key': key,
    },
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.models) {
          const names = parsed.models
            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
          console.log('SUPPORTED MODELS FOR THIS KEY:');
          console.log(names.slice(0, 15));
        } else {
          console.log('ERROR:', parsed.error?.message);
        }
      } catch (e) {
        console.log('PARSE ERROR:', e.message);
      }
    });
  }).on('error', console.error);
}

listModels();
