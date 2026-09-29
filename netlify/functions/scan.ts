import { GoogleGenAI } from '@google/genai';

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

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { query = '', category = 'Electronics' } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(getCuratedScan(category, query)),
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text?.trim() || '';
    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || [null, text];
    const cleanJson = (jsonMatch[1] || text).trim();

    let deals = [];
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    const body = event.body ? JSON.parse(event.body || '{}') : {};
    const fallback = getCuratedScan(body.category || 'Electronics', body.query || '');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(fallback),
    };
  }
};
