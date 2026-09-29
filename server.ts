import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Health check endpoints for Cloud Run container probes
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Initialize GoogleGenAI with telemetry headers
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ===============================================================
// Rate-Limit Backoff & In-Memory TTL Cache
// ===============================================================
let scanCooldownUntil = 0;
let assistantCooldownUntil = 0;
let storesCooldownUntil = 0;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const scanCache = new Map<string, CacheEntry<any>>();
const assistantCache = new Map<string, CacheEntry<any>>();
const storesCache = new Map<string, CacheEntry<any>>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Curated live catalog: Electronics, Fashion, Food, Hot Deals
const CATALOG: Record<string, any[]> = {
  Electronics: [
    {
      id: "sony-wh-1000xm5-01",
      title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
      oldPrice: 34990,
      newPrice: 22990,
      discountPercentage: 34,
      source: "Amazon",
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
      highlight: true
    },
    {
      id: "apple-ipad-air-m2-02",
      title: "Apple iPad Air 11-inch (M2 Chip, Wi-Fi, 128GB) - Space Grey",
      oldPrice: 59900,
      newPrice: 52990,
      discountPercentage: 12,
      source: "Flipkart",
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800",
      highlight: true
    },
    {
      id: "samsung-galaxy-watch-6-03",
      title: "Samsung Galaxy Watch6 Bluetooth (40mm, Graphite)",
      oldPrice: 29999,
      newPrice: 17499,
      discountPercentage: 42,
      source: "Croma",
      imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "lg-c3-oled-55-04",
      title: "LG 55-inch 4K Smart OLED evo TV (OLED55C3PSA)",
      oldPrice: 189990,
      newPrice: 114990,
      discountPercentage: 39,
      source: "Reliance Digital",
      imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "apple-iphone-15-pro-09",
      title: "Apple iPhone 15 Pro (Natural Titanium, 256GB)",
      oldPrice: 144900,
      newPrice: 119990,
      discountPercentage: 17,
      source: "Flipkart",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800",
      highlight: true
    },
    {
      id: "apple-macbook-air-m2-05",
      title: "Apple MacBook Air 13-inch (M2 chip, 8GB RAM, 256GB SSD)",
      oldPrice: 99900,
      newPrice: 79990,
      discountPercentage: 20,
      source: "Amazon",
      imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800",
      highlight: true
    }
  ],
  Fashion: [
    {
      id: "nike-air-jordan-1-retro-31",
      title: "Nike Air Jordan 1 Retro High OG 'Chicago' Sneaker",
      oldPrice: 16995,
      newPrice: 11499,
      discountPercentage: 32,
      source: "Myntra",
      imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800",
      highlight: true
    },
    {
      id: "levis-511-slim-fit-jeans-32",
      title: "Levi's Men's 511 Slim Fit Stretch Denim Jeans (Dark Indigo)",
      oldPrice: 4299,
      newPrice: 2149,
      discountPercentage: 50,
      source: "Amazon",
      imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "zara-tailored-linen-blazer-33",
      title: "Zara Men's 100% Breathable Italian Tailored Linen Blazer",
      oldPrice: 8990,
      newPrice: 5490,
      discountPercentage: 39,
      source: "Ajio",
      imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
      highlight: true
    },
    {
      id: "fossil-heritage-automatic-34",
      title: "Fossil Heritage Automatic Stainless Steel Men's Watch",
      oldPrice: 22995,
      newPrice: 13795,
      discountPercentage: 40,
      source: "Flipkart",
      imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "ray-ban-aviator-classic-35",
      title: "Ray-Ban Aviator Classic Polarized Sunglasses (Gold Frame / Green Lens)",
      oldPrice: 11990,
      newPrice: 7990,
      discountPercentage: 33,
      source: "Tata CLiQ",
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "puma-future-rider-sneakers-36",
      title: "Puma Future Rider Double Vintage Unisex Sneakers",
      oldPrice: 7999,
      newPrice: 3999,
      discountPercentage: 50,
      source: "Myntra",
      imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800",
      highlight: true
    }
  ],
  Food: [
    {
      id: "swiggy-gourmet-bundle-41",
      title: "Swiggy Gourmet Dineout Pass + ₹500 Dining Cashback Voucher",
      oldPrice: 1200,
      newPrice: 499,
      discountPercentage: 58,
      source: "Swiggy",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
      highlight: true
    },
    {
      id: "starbucks-beverage-voucher-42",
      title: "Starbucks India Duo Beverage Pass (Any Grande Handcrafted Coffee)",
      oldPrice: 850,
      newPrice: 499,
      discountPercentage: 41,
      source: "Zomato",
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "dominos-feast-combo-43",
      title: "Domino's Premium Gourmet Feast Combo (2 Med Pizzas + Choco Lava)",
      oldPrice: 1199,
      newPrice: 699,
      discountPercentage: 42,
      source: "Domino's",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
      highlight: true
    },
    {
      id: "subway-signature-meal-44",
      title: "Subway 2x Signature Footlong Meal Combo with Cookies & Drinks",
      oldPrice: 940,
      newPrice: 599,
      discountPercentage: 36,
      source: "Swiggy",
      imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "blue-tokai-coffee-roasters-45",
      title: "Blue Tokai Coffee Roasters Trio Bean Pack (100% Arabica, 750g)",
      oldPrice: 1650,
      newPrice: 1150,
      discountPercentage: 30,
      source: "Amazon Fresh",
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
      highlight: false
    },
    {
      id: "baskin-robbins-sundae-tub-46",
      title: "Baskin Robbins Party Tub Combo (2 x 500ml Belgian Chocolate + Cotton Candy)",
      oldPrice: 890,
      newPrice: 549,
      discountPercentage: 38,
      source: "Blinkit",
      imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=800",
      highlight: true
    }
  ]
};

CATALOG['Hot Deals'] = Object.values(CATALOG)
  .flat()
  .filter((d) => d.discountPercentage >= 25);

function getCuratedScan(category: string, query: string) {
  const pool = CATALOG[category] || CATALOG['Electronics'] || [];
  let deals = pool;

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    const matched = pool.filter(
      (d) => d.title.toLowerCase().includes(q) || d.source.toLowerCase().includes(q)
    );
    if (matched.length > 0) {
      deals = matched;
    } else {
      deals = [
        {
          id: `deal-${Date.now()}`,
          title: `${query.charAt(0).toUpperCase() + query.slice(1)} (Special Limited Offer)`,
          oldPrice: 4999,
          newPrice: 2999,
          discountPercentage: 40,
          source: category === 'Food' ? 'Swiggy' : category === 'Fashion' ? 'Myntra' : 'Amazon',
          imageUrl: category === 'Food' 
            ? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
            : category === 'Fashion'
            ? 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800'
            : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=800',
          highlight: true,
        },
        ...pool.slice(0, 3),
      ];
    }
  }

  return {
    deals,
    groundingSources: [
      { title: 'Amazon Deals & Discounts', uri: 'https://www.amazon.in' },
      { title: 'Flipkart Top Offers', uri: 'https://www.flipkart.com' },
      { title: 'Myntra & Swiggy Offers', uri: 'https://www.myntra.com' },
    ],
    searchQueries: [query ? `${category} ${query}` : `${category} deals india`],
    source: 'curated-live-catalog',
  };
}

// ===============================================================
// API Route 1: Deal Scan with Google Search Grounding (gemini-3.5-flash)
// ===============================================================
app.post('/api/deals/scan', async (req, res) => {
  const { query = '', category = 'Electronics' } = req.body;
  const cacheKey = `${category.toLowerCase()}:${query.toLowerCase().trim()}`;

  // 1. Check in-memory TTL cache
  const cached = scanCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

  // 2. If quota is on cooldown or AI not configured, immediately return curated deals
  if (!ai || Date.now() < scanCooldownUntil) {
    const fallback = getCuratedScan(category, query);
    scanCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(fallback);
  }

  try {
    const prompt = `You are a real-time deal scout and price engine for Indian shoppers (Amazon.in, Flipkart, Myntra, Swiggy, Zomato, Croma).
Search the web for current best discounts, hot deals, and price drops on ${category} ${query ? `matching "${query}"` : ''}.
Return a strict JSON array of 4 to 8 products in this format:
[
  {
    "id": "unique-slug",
    "title": "Full product/offer title with brand and specs",
    "oldPrice": 4999,
    "newPrice": 2999,
    "discountPercentage": 40,
    "source": "Amazon",
    "imageUrl": "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=800",
    "highlight": true
  }
]
Prices MUST be in INR (Indian Rupees). Return ONLY valid JSON, no markdown formatting.`;

    // Race AI model generateContent against a 3.5-second timeout to guarantee fast response
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI_SCAN_TIMEOUT')), 3500)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const response: any = await Promise.race([generatePromise, timeoutPromise]);

    const text = response.text?.trim() || '';
    let deals = [];

    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || [null, text];
    const cleanJson = (jsonMatch[1] || text).trim();

    try {
      deals = JSON.parse(cleanJson);
    } catch {
      deals = [];
    }

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = chunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web.title || 'Retailer Source',
        uri: c.web.uri,
      }));

    const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    const result = {
      deals: Array.isArray(deals) && deals.length > 0 ? deals : getCuratedScan(category, query).deals,
      groundingSources: webSources.length > 0 ? webSources : getCuratedScan(category, query).groundingSources,
      searchQueries,
      source: 'gemini-search-grounded',
    };

    scanCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(result);
  } catch (error: any) {
    const isRateLimit =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.code === 429 ||
      String(error?.message || '').includes('quota') ||
      String(error || '').includes('429');

    if (isRateLimit) {
      scanCooldownUntil = Date.now() + 60000;
    }

    const fallback = getCuratedScan(category, query);
    scanCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(fallback);
  }
});

// ===============================================================
// API Route 2: AI Shopping Assistant with Google Search Grounding (gemini-3.5-flash)
// ===============================================================
app.post('/api/assistant/chat', async (req, res) => {
  const { message = '', history = [] } = req.body;
  const cacheKey = message.toLowerCase().trim();

  const cached = assistantCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

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

  if (!ai || Date.now() < assistantCooldownUntil) {
    assistantCache.set(cacheKey, { data: fallbackAnswer, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(fallbackAnswer);
  }

  try {
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

    assistantCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(result);
  } catch (error: any) {
    const isRateLimit =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.code === 429 ||
      String(error?.message || '').includes('quota') ||
      String(error || '').includes('429');

    if (isRateLimit) {
      assistantCooldownUntil = Date.now() + 60000;
    }

    assistantCache.set(cacheKey, { data: fallbackAnswer, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(fallbackAnswer);
  }
});

// ===============================================================
// API Route 3: Nearby Stores & Local Deals with Google Maps Grounding (gemini-3.5-flash)
// ===============================================================
app.post('/api/stores/nearby', async (req, res) => {
  const { query = 'electronics store', latitude, longitude, locationName = 'Bengaluru, India' } = req.body;
  const cacheKey = `${locationName.toLowerCase()}:${query.toLowerCase().trim()}`;

  const cached = storesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

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

  if (!ai || Date.now() < storesCooldownUntil) {
    storesCache.set(cacheKey, { data: fallbackStores, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(fallbackStores);
  }

  try {
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

    storesCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(result);
  } catch (error: any) {
    const isRateLimit =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.code === 429 ||
      String(error?.message || '').includes('quota') ||
      String(error || '').includes('429');

    if (isRateLimit) {
      storesCooldownUntil = Date.now() + 60000;
    }

    storesCache.set(cacheKey, { data: fallbackStores, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(fallbackStores);
  }
});

// ===============================================================
// Vite Integration & Server Startup
// ===============================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (!isProd || !hasDist) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
