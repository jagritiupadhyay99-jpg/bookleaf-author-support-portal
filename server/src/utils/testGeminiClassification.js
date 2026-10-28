const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { analyzeTicket, generateResponseDraft } = require('../services/aiService');

async function testRealGeminiIntegration() {
  console.log('Testing real Gemini AI classification via aiService...');

  const ticketData = {
    subject: 'Pending royalty payout inquiry for Whispers of the Ganges',
    description: 'Hello BookLeaf team, I see a pending balance of ₹3,570 for Q3 sales. When is the quarterly disbursement cycle?',
    bookContext: { title: 'Whispers of the Ganges', status: 'Published & Live' },
  };

  const analysis = await analyzeTicket(ticketData);
  console.log('\n--- ANALYSIS RESULT ---');
  console.log('Category:', analysis?.category);
  console.log('Priority:', analysis?.priority);
  console.log('IsMock:', analysis?.isMock);
  console.log('Reasoning:', analysis?.reason);

  console.log('\nTesting real Gemini AI draft generation via aiService...');
  const draftResult = await generateResponseDraft({
    ticket: {
      subject: ticketData.subject,
      description: ticketData.description,
      category: analysis?.category,
      priority: analysis?.priority,
    },
    bookContext: {
      title: 'Whispers of the Ganges',
      status: 'Published & Live',
      mrp: 399,
      totalCopiesSold: 342,
    },
    authorName: 'Priya Sharma',
  });

  console.log('\n--- DRAFT RESULT ---');
  console.log('IsMock:', draftResult?.isMock);
  console.log('Draft excerpt (first 250 chars):');
  console.log(draftResult?.draft ? draftResult.draft.slice(0, 250) + '...' : 'NO DRAFT');
}

testRealGeminiIntegration().catch(console.error);
