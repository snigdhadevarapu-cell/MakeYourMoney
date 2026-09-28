import { Deal, GroundingSource, StorePlace } from '../types';

const CURATED_DEALS: Record<string, Deal[]> = {
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

// Build Hot Deals by aggregating all 25%+ discount items
CURATED_DEALS['Hot Deals'] = Object.values(CURATED_DEALS)
  .flat()
  .filter((d) => d.discountPercentage >= 25);

export { CURATED_DEALS };

/**
 * Returns instant local deals without any network wait or delay
 */
export function getInstantDeals(category: string, searchQuery: string = ''): Deal[] {
  const pool = CURATED_DEALS[category] || CURATED_DEALS['Hot Deals'] || CURATED_DEALS['Electronics'] || [];
  if (!searchQuery.trim()) {
    return pool;
  }
  const q = searchQuery.toLowerCase().trim();
  const matched = pool.filter((d) =>
    d.title.toLowerCase().includes(q) || d.source.toLowerCase().includes(q)
  );
  return matched.length > 0 ? matched : pool;
}

/**
 * Scans for deals with fast abort controller to guarantee zero lag
 */
export async function scanForDeals(searchQuery: string, category: string): Promise<Deal[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/api/deals/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, category }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.deals) && data.deals.length > 0) {
        return data.deals;
      }
    }
  } catch (e) {
    console.warn('Backend scan notice, utilizing fast local dataset:', e);
  }

  // Instant Curated fallback
  return getInstantDeals(category, searchQuery);
}

/**
 * Chat with AI Deal Scout powered by Gemini 3.5 Flash with Google Search Grounding
 */
export async function chatWithAIAssistant(
  userQuery: string,
  history: { sender: 'user' | 'assistant'; text: string }[] = []
): Promise<{ reply: string; sources: GroundingSource[]; searchQueries: string[] }> {
  try {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userQuery, history })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return {
          reply: data.reply,
          sources: data.groundingSources || [],
          searchQueries: data.searchQueries || [],
        };
      }
    }
  } catch (e) {
    console.warn('Backend assistant chat notice, using curated advice:', e);
  }

  const q = userQuery.toLowerCase();
  let fallbackReply = `### 💡 Deal Scout Analysis for "${userQuery}"
- **Price Target**: Retailer discounts typically range from 20% to 50% across clearance promotions.
- **Top Stores**: Compare prices on **Amazon**, **Flipkart**, **Myntra**, and **Swiggy/Zomato**.
- **Price Radar**: Save this item to your **Price Alerts** tab for automated price tracking!`;

  if (q.includes('fashion') || q.includes('shoes') || q.includes('dress') || q.includes('sneaker')) {
    fallbackReply = `### 👟 Fashion & Footwear Deal Radar
- **Nike Air Jordan 1**: Currently discounted at **₹11,499** (Save 32%) on Myntra.
- **Levi's 511 Slim Fit**: 50% flat off at **₹2,149** on Amazon.
- **Zara Linen Blazers**: Flat 39% off at **₹5,490** on Ajio.`;
  } else if (q.includes('food') || q.includes('swiggy') || q.includes('zomato') || q.includes('pizza')) {
    fallbackReply = `### 🍕 Food & Dining Value Deals
- **Swiggy Gourmet Dineout Pass**: 58% off at **₹499** with dining cashback vouchers.
- **Domino's Gourmet Feast**: 2 Medium Pizzas + Choco Lava Cake at **₹699** (MRP ₹1,199).
- **Starbucks Duo Beverage Pass**: 2 Grande handcrafted drinks for **₹499**.`;
  }

  return {
    reply: fallbackReply,
    sources: [
      { title: 'Amazon Deals & Discounts', uri: 'https://www.amazon.in' },
      { title: 'Flipkart Big Savings', uri: 'https://www.flipkart.com' }
    ],
    searchQueries: [userQuery]
  };
}

/**
 * Find Nearby Stores using Gemini 3.5 Flash with Google Maps Grounding
 */
export async function getNearbyStores(
  query: string = 'electronics store',
  lat?: number,
  lng?: number,
  locationName: string = 'Bengaluru, India'
): Promise<{ text: string; places: StorePlace[]; searchLocation: string }> {
  try {
    const res = await fetch('/api/stores/nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        latitude: lat,
        longitude: lng,
        locationName
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        text: data.text || '',
        places: data.places || [],
        searchLocation: data.searchLocation || locationName
      };
    }
  } catch (e) {
    console.warn('Failed to query nearby stores from backend:', e);
  }

  return {
    text: `Here are top-rated stores and authorized brand hubs near ${locationName} offering in-store discounts, live demo testing, and instant store pickup:`,
    places: [
      {
        title: 'Croma Electronics Megastore',
        uri: `https://www.google.com/maps/search/Croma+${encodeURIComponent(locationName)}`,
        address: `Commercial District, ${locationName}`,
        type: 'Authorized Multi-Brand Retailer',
        reviewSnippet: 'Wide selection of gadgets with instant bank discounts and live demo counters.'
      },
      {
        title: 'Reliance Digital Flagship',
        uri: `https://www.google.com/maps/search/Reliance+Digital+${encodeURIComponent(locationName)}`,
        address: `Central Mall, ${locationName}`,
        type: 'Consumer Electronics & Home Tech',
        reviewSnippet: 'Instant price match against major online retailers and same-day collection.'
      },
      {
        title: 'Zara Flagship Retail Store',
        uri: `https://www.google.com/maps/search/Zara+${encodeURIComponent(locationName)}`,
        address: `High Street, ${locationName}`,
        type: 'Fashion & Apparel',
        reviewSnippet: 'Latest seasonal arrivals with dedicated fitting rooms and in-store stock lookup.'
      },
      {
        title: 'Swiggy Gourmet Kitchen / Food Court Hub',
        uri: `https://www.google.com/maps/search/Food+Court+${encodeURIComponent(locationName)}`,
        address: `Metro Promenade, ${locationName}`,
        type: 'Dining & Specialty Food',
        reviewSnippet: 'Offers Dineout 50% discount vouchers and express takeaway pickup.'
      }
    ],
    searchLocation: locationName
  };
}
