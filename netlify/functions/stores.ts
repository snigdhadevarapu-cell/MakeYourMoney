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
  const { query = 'electronics store', latitude, longitude, locationName = 'Bengaluru, India' } = body;

  const fallbackStores = {
    text: `Showing top-rated stores and authorized brand hubs near ${locationName} with in-store discounts, live demo testing, and instant store pickup:`,
    places: [
      {
        title: 'Croma Electronics Megastore',
        uri: `https://www.google.com/maps/search/Croma+${encodeURIComponent(locationName)}`,
        address: `Central Commercial Hub, ${locationName}`,
        type: 'Authorized Multi-Brand Retailer',
        reviewSnippet: 'Wide selection of gadgets with instant bank discounts and live demo counters.',
      },
      {
        title: 'Reliance Digital Flagship',
        uri: `https://www.google.com/maps/search/Reliance+Digital+${encodeURIComponent(locationName)}`,
        address: `Metro Mall, ${locationName}`,
        type: 'Consumer Electronics & Home Tech',
        reviewSnippet: 'Instant price match against major online retailers and same-day collection.',
      },
      {
        title: 'Zara Flagship Retail Store',
        uri: `https://www.google.com/maps/search/Zara+${encodeURIComponent(locationName)}`,
        address: `High Street, ${locationName}`,
        type: 'Fashion & Apparel',
        reviewSnippet: 'Latest seasonal arrivals with dedicated fitting rooms and in-store stock lookup.',
      },
      {
        title: 'Swiggy Gourmet Kitchen / Food Court Hub',
        uri: `https://www.google.com/maps/search/Food+Court+${encodeURIComponent(locationName)}`,
        address: `Metro Promenade, ${locationName}`,
        type: 'Dining & Specialty Food',
        reviewSnippet: 'Offers Dineout 50% discount vouchers and express takeaway pickup.',
      },
    ],
    searchLocation: locationName,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(fallbackStores),
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const lat = typeof latitude === 'number' ? latitude : 12.9716;
    const lng = typeof longitude === 'number' ? longitude : 77.5946;

    const prompt = `Find nearby stores, brand outlets, fashion showrooms, and food dining hubs near ${locationName} for: "${query}".
List store names, locations, specialty categories they carry, and in-store perks or pickup availability.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (latitude && longitude) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });

    const text = response.text || '';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const places: any[] = [];

    chunks.forEach((chunk: any) => {
      if (chunk.maps) {
        places.push({
          title: chunk.maps.title || 'Store Location',
          uri: chunk.maps.uri || `https://www.google.com/maps/search/${encodeURIComponent(chunk.maps.title || 'stores')}`,
          address: chunk.maps.address || '',
          reviewSnippet: chunk.maps.placeAnswerSources?.reviewSnippets?.[0] || '',
        });
      }
    });

    const result = {
      text: text || fallbackStores.text,
      places: places.length > 0 ? places : fallbackStores.places,
      searchLocation: locationName,
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
      body: JSON.stringify(fallbackStores),
    };
  }
};
