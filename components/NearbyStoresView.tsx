import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Store, 
  Sparkles, 
  Search, 
  Loader2, 
  Star, 
  Compass, 
  CheckCircle, 
  Phone 
} from 'lucide-react';
import { getNearbyStores } from '../services/aiService';
import { StorePlace } from '../types';
import ReactMarkdown from 'react-markdown';

export function NearbyStoresView() {
  const [places, setPlaces] = useState<StorePlace[]>([]);
  const [overviewText, setOverviewText] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('Bengaluru, India');
  const [storeQuery, setStoreQuery] = useState<string>('electronics store');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const popularCities = [
    'Bengaluru',
    'Mumbai',
    'Delhi NCR',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata'
  ];

  const storePresets = [
    { label: 'All Stores', query: 'popular shopping stores and outlets' },
    { label: 'Croma & Reliance', query: 'Croma and Reliance Digital stores' },
    { label: 'Zara & H&M', query: 'Zara and H&M fashion apparel outlets' },
    { label: 'Food Courts & Cafes', query: 'food courts, cafes and restaurants' },
    { label: 'Apple Authorized', query: 'Apple Authorized Store Imagine Aptronix' },
    { label: 'Nike & Puma', query: 'Nike and Puma footwear outlets' }
  ];

  const fetchStores = async (queryText: string, locName: string, coords?: { lat: number; lng: number }) => {
    setIsLoading(true);
    try {
      const data = await getNearbyStores(queryText, coords?.lat, coords?.lng, locName);
      setPlaces(data.places);
      setOverviewText(data.text);
      setSearchLocation(data.searchLocation);
    } catch (e) {
      console.error('Failed to load stores:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(storeQuery, searchLocation);
  }, []);

  const handleCitySelect = (city: string) => {
    setSearchLocation(`${city}, India`);
    setUserCoords(null);
    fetchStores(storeQuery, `${city}, India`);
  };

  const handlePresetSelect = (presetQuery: string) => {
    setStoreQuery(presetQuery);
    fetchStores(presetQuery, searchLocation, userCoords || undefined);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserCoords(coords);
        setIsDetectingLocation(false);
        const locLabel = `Current Location (${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°)`;
        setSearchLocation(locLabel);
        fetchStores(storeQuery, locLabel, coords);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsDetectingLocation(false);
        alert('Could not retrieve your location. You can select a city from the list instead.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-blue-400" /> Google Maps Grounding
              </span>
              <span className="text-[11px] font-semibold text-slate-300">gemini-3.5-flash</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Nearby Stores & Local Deals
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Find authorized electronics retailers, official brand demo lounges, and local stores with in-store stock, live price-match, and instant pickup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={handleDetectLocation}
              disabled={isDetectingLocation || isLoading}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Detecting GPS...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Detect My Location
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* City Switcher & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs space-y-4">
        {/* City Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1 hidden sm:inline flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> Cities:
          </span>
          {popularCities.map((city) => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                searchLocation.includes(city)
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Store Type Filters */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1 hidden sm:inline flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-indigo-600" /> Chains:
          </span>
          {storePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset.query)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                storeQuery === preset.query
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insight Box (if available) */}
      {overviewText && (
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 text-sm text-slate-800">
          <div className="flex items-center gap-2 mb-2 font-bold text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Store Radar & Shopper Advisory</span>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900">
            <ReactMarkdown>{overviewText}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Store Place Listings Grid */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4 px-1">
          <span>Found {places.length} Verified Stores in {searchLocation}</span>
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" /> Grounded with Google Maps
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-500 font-medium text-sm">Querying Google Maps Grounding for local retailers...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No stores found for this search</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting another city or retailer filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {places.map((place, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                        {place.title}
                      </h4>
                      {place.type && (
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                          {place.type}
                        </span>
                      )}
                    </div>
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                      <MapPin className="w-5 h-5" />
                    </span>
                  </div>

                  {place.address && (
                    <p className="text-xs text-slate-600 mb-3 flex items-center gap-1.5">
                      <span className="text-slate-400">📍</span>
                      {place.address}
                    </p>
                  )}

                  {place.reviewSnippet && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 mb-4 italic leading-relaxed">
                      &ldquo;{place.reviewSnippet}&rdquo;
                    </div>
                  )}
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Open for In-Store Pickup
                  </span>

                  {/* MANDATORY: Link to Google Maps groundingChunks.maps.uri */}
                  <a
                    href={place.uri || `https://www.google.com/maps/search/${encodeURIComponent(place.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
