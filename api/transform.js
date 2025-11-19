// api/transform.js - Vercel Serverless Function
const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received request:', JSON.stringify(req.body));

    const { prompt, text, model = 'Ink 2.0', temperature = 0.7 } = req.body;

    // Validate input
    if (!prompt || !text) {
      console.error('Missing prompt or text');
      return res.status(400).json({ error: 'Missing prompt or text' });
    }

    let result;

    // Use Gemini for Ink 3.5, Mistral for others
    if (model === 'Ink 3.5') {
      // Get Gemini API key from environment variable
      const geminiApiKey = process.env.GEMINI_API_KEY;

      if (!geminiApiKey) {
        console.error('GEMINI_API_KEY not configured');
        return res.status(500).json({
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.'
        });
      }

      console.log('Calling Gemini API...');

      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant that transforms text based on user instructions. Provide only the transformed text without any explanations or preamble.\n\n${prompt}:\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 1000
          }
        })
      });

      console.log('Gemini API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        return res.status(response.status).json({
          error: `Gemini API error: ${errorData.error?.message || 'Unknown error'}`
        });
      }

      const data = await response.json();
      result = data.candidates[0].content.parts[0].text;

    } else {
      // Use Mistral for Ink 2.0 and Ink 2.5
      const apiKey = process.env.MISTRAL_API_KEY;

      if (!apiKey) {
        console.error('MISTRAL_API_KEY not configured');
        return res.status(500).json({
          error: 'API key not configured. Please set MISTRAL_API_KEY in Vercel environment variables.'
        });
      }

      console.log('Calling Mistral API...');

      // Select Mistral model based on Ink version
      const mistralModel = model === 'Ink 2.5' ? 'mistral-large-latest' : 'mistral-small-latest';

      // Call Mistral AI API
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: mistralModel,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that transforms text based on user instructions. Provide only the transformed text without any explanations or preamble.'
            },
            {
              role: 'user',
              content: `${prompt}:\n\n${text}`
            }
          ],
          temperature: temperature,
          max_tokens: 1000
        })
      });

      console.log('Mistral API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Mistral API error:', errorData);
        return res.status(response.status).json({
          error: `Mistral API error: ${errorData.message || 'Unknown error'}`
        });
      }

      const data = await response.json();
      result = data.choices[0].message.content;
    }

    console.log('Successfully generated response, length:', result.length);

    return res.status(200).json({ result });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

};
