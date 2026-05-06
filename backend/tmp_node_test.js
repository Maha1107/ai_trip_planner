const nlp = require('./services/nlpService');
const msg = 'I want to go from Hyderabad to Goa from 2026-06-10 to 2026-06-15 with budget 25000';
console.log('intent:', nlp.detectIntent(msg));
console.log('parsed:', JSON.stringify(nlp.parseTripMessage(msg), null, 2));
