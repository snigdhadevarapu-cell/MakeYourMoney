import { GoogleGenAI } from '@google/genai';

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const { message = '', history = [] } = body;

  const fallbackAnswer = {
    reply: `### 💡 Live Deal Radar for "${message}"
- **Price Target**: Watch for retailer discounts between 20% to 50% during seasonal clearance cycles across Amazon India, Flipkart, Myntra, and Swiggy.
- **In-Store Stock**: Use the **Local Stores** tab to find authorized physical stores with live demo stock and on-the-spot price matching.
- **Automated Price Drops**: Save this item to your **Price Alerts** tab for instant price drop tracking!`,
    groundingSources: [
      { title: 'Amazon Deals & Discounts', uri: 'https://www.amazon.in' },
      { title: 'Flipkart Top Offers', uri: 'https://www.flipkart.com' },
      { title: 'Myntra Fashion Hub', uri: 'https://www.myntra.com' },
    ],
    searchQueries: [message],
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(fallbackAnswer),
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const systemInstruction = `You are "Make your money" AI Deal Scout and Smart Shopping Advisor.
You help shoppers make the most informed purchases across major retailers in India (Amazon, Flipkart, Myntra, Swiggy, Zomato, Croma, Reliance Digital).
Use Google Search grounding to verify up-to-date prices, current discounts, upcoming sale events, and deal recommendations.
Structure answers cleanly with markdown, highlighting prices in INR (₹) and key value comparisons.`;

    const contents = [
      ...history.map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const reply = response.text || '';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = chunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web.title || 'Web Reference',
        uri: c.web.uri,
      }));

    const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    const result = {
      reply: reply || fallbackAnswer.reply,
      groundingSources: groundingSources.length > 0 ? groundingSources : fallbackAnswer.groundingSources,
      searchQueries,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(fallbackAnswer),
    };
  }
};
