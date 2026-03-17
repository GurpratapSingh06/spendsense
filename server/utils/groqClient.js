require('dotenv').config();
const Groq = require("groq-sdk");
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function askGroq(systemPrompt, userPrompt) {
  if (!groq) {
    throw new Error('AI service is not configured. Please set your Groq API key.');
  }
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt  }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('api key')) {
      throw new Error('AI service is not configured. Please set your Groq API key.');
    }
    throw new Error('AI service is temporarily unavailable. Please try again later.');
  }
}

module.exports = { askGroq };
