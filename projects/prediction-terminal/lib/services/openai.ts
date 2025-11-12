// OpenAI service - Used only for on-demand marketing generation in Marketing Sandbox
// No automatic trend analysis happens here

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
