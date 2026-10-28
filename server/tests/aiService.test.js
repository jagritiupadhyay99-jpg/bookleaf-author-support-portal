const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeTicket, generateResponseDraft } = require('../src/services/aiService');

describe('AI Service Classification & Drafting Tests', () => {
  test('classifies royalty query correctly in fallback/mock mode', async () => {
    const result = await analyzeTicket({
      subject: 'Royalty payout question',
      description: 'When will my quarterly royalty payment be transferred to my bank account?',
    });

    assert.strictEqual(result.category, 'Royalty & Payments');
    assert.ok(['Critical', 'High', 'Medium', 'Low'].includes(result.priority));
    assert.ok(typeof result.reason === 'string');
    assert.strictEqual(typeof result.isMock, 'boolean');
  });

  test('classifies ISBN defect query correctly in fallback/mock mode', async () => {
    const result = await analyzeTicket({
      subject: 'Wrong ISBN on my book listing',
      description: 'The ISBN shown on the cover does not match the metadata assigned.',
    });

    assert.strictEqual(result.category, 'ISBN & Metadata Issues');
    assert.ok(['Critical', 'High', 'Medium', 'Low'].includes(result.priority));
  });

  test('classifies printing defect query correctly in fallback/mock mode', async () => {
    const result = await analyzeTicket({
      subject: 'Binding defect on author copies',
      description: 'The book pages are peeling from the spine in the 5 copies I received.',
    });

    assert.strictEqual(result.category, 'Printing & Quality');
    assert.ok(['Critical', 'High', 'Medium', 'Low'].includes(result.priority));
  });

  test('classifies distribution stock query correctly in fallback/mock mode', async () => {
    const result = await analyzeTicket({
      subject: 'Amazon shows currently unavailable',
      description: 'My book is published but Amazon India says out of stock.',
    });

    assert.strictEqual(result.category, 'Distribution & Availability');
  });

  test('generates draft response with policy guidance and safe tone', async () => {
    const ticket = {
      subject: 'Royalty payout schedule',
      description: 'How often are royalties calculated and what is the payout threshold?',
      category: 'Royalty & Payments',
      priority: 'High',
    };
    const bookContext = {
      title: 'Whispers of the Monsoon',
    };

    const draftResult = await generateResponseDraft({
      ticket,
      bookContext,
      authorName: 'Arjun Mehta',
    });
    assert.ok(typeof draftResult.draft === 'string');
    assert.ok(draftResult.draft.length > 50);
    // Draft should address author politely
    assert.ok(draftResult.draft.includes('Arjun Mehta') || draftResult.draft.includes('Author'));
    assert.strictEqual(typeof draftResult.isMock, 'boolean');
  });
});
