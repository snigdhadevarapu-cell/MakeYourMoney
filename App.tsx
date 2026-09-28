import { useState, useEffect, useMemo, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { DealCard } from "./components/DealCard";
import { scanForDeals, getInstantDeals } from "./services/aiService";
import { Deal, AppUser } from "./types";
import { DealCardSkeleton } from "./components/Skeleton";
import { 
  Search, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  LogIn, 
  Copy, 
  Check, 
  ShieldAlert, 
  Flame, 
  ArrowUpDown, 
  RefreshCw, 
  TrendingDown, 
  MapPin, 
  Shirt, 
  UtensilsCrossed, 
  Bookmark, 
  Bell, 
  Bot, 
  User as UserIcon, 
  Tv,
  ArrowDown,
  ArrowLeftRight
} from "lucide-react";
import { SavedDealsView } from "./components/SavedDealsView";
import { PriceAlertsView } from "./components/PriceAlertsView";
import { ProfileView } from "./components/ProfileView";
import { AdminDashboard } from "./components/AdminDashboard";
import { AIAssistantView } from "./components/AIAssistantView";
import { NearbyStoresView } from "./components/NearbyStoresView";
import { DeviceSizeThemeBar } from "./components/DeviceSizeThemeBar";
import { useAutoResizer } from "./hooks/useAutoResizer";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, loginWithGoogle } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";

// Ordered sequence of categories for mobile swipe gestures
const CATEGORY_ORDER = [
  "Hot Deals",
  "Local Stores",
  "Electronics",
  "Fashion",
  "Food",
  "Saved Deals",
  "Price Alerts",
  "AI Assistant",
  "Account"
];

function MainApp({ user }: { user: User | AppUser }) {
  // Admin email: sanjithdevarapu6@gmail.com
  const isAdmin = user.email === "sanjithdevarapu6@gmail.com";
  const [activeCategory, setActiveCategory] = useState(isAdmin ? "Admin" : "Hot Deals");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  
  // Instant deal loading - 0ms wait time
  const [deals, setDeals] = useState<Deal[]>(() => getInstantDeals("Hot Deals"));
  const [error, setError] = useState<string | null>(null);

  // Auto Resizer & Device Size Theme
  const deviceInfo = useAutoResizer("auto");
  const isPhone = deviceInfo.effectiveTheme === "phone";
  const isTablet = deviceInfo.effectiveTheme === "tablet";

  // Filter & Sort State
  const [filterRetailer, setFilterRetailer] = useState<string>("All");
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("featured");

  // Mobile Touch Gestures (Swipe Navigation + Pull to Refresh)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [showSwipeHint, setShowSwipeHint] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const minSwipeDistance = 55; // minimum px for gesture swipe

  const handleScan = async (showLoader = false) => {
    if (showLoader) setIsScanning(true);
    setError(null);
    try {
      const results = await scanForDeals(searchQuery, activeCategory);
      if (Array.isArray(results) && results.length > 0) {
        setDeals(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan deals.");
      if (deals.length === 0) {
        setDeals(getInstantDeals(activeCategory));
      }
    } finally {
      setIsScanning(false);
    }
  };

  const isPersonalTab = 
    activeCategory === "Saved Deals" || 
    activeCategory === "Price Alerts" || 
    activeCategory === "Account" || 
    activeCategory === "Admin" || 
    activeCategory === "AI Assistant" || 
    activeCategory === "Local Stores";

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    setFilterRetailer("All");
    setMinDiscount(0);
    setMaxPrice(null);

    // Instant local dataset population for zero loading lag
    if (!["Saved Deals", "Price Alerts", "Account", "Admin", "AI Assistant", "Local Stores"].includes(category)) {
      setDeals(getInstantDeals(category));
    }
  };

  // Touch Start Handler (detects pull down at top & swipe start)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    
    // Check if user is scrolled to top to enable pull-to-refresh
    if (!scrollContainerRef.current || scrollContainerRef.current.scrollTop <= 0) {
      setIsPulling(true);
    }
  };

  // Touch Move Handler (smooth pull-down resistance)
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;

    if (isPulling && touchStartY.current) {
      const deltaY = touchEndY.current - touchStartY.current;
      const isAtTop = !scrollContainerRef.current || scrollContainerRef.current.scrollTop <= 0;
      if (deltaY > 0 && isAtTop) {
        // Logarithmic touch resistance damping
        const dampened = Math.min(80, deltaY * 0.4);
        setPullDistance(dampened);
      } else {
        setPullDistance(0);
      }
    }
  };

  // Touch End Handler (triggers refresh or switches category)
  const handleTouchEnd = () => {
    // 1. Pull to Refresh check
    if (pullDistance >= 50) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch {}
      }
      handleScan(true);
    }
    setPullDistance(0);
    setIsPulling(false);

    // 2. Horizontal swipe navigation logic
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;

    // Ensure horizontal swipe is dominant (not accidental vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && Math.abs(deltaX) > minSwipeDistance) {
      const currentIndex = CATEGORY_ORDER.indexOf(activeCategory);
      if (currentIndex !== -1) {
        if (deltaX > 0 && currentIndex < CATEGORY_ORDER.length - 1) {
          // Swiped Left -> Next Category
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(10); } catch {}
          }
          handleCategoryChange(CATEGORY_ORDER[currentIndex + 1]);
        } else if (deltaX < 0 && currentIndex > 0) {
          // Swiped Right -> Previous Category
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(10); } catch {}
          }
          handleCategoryChange(CATEGORY_ORDER[currentIndex - 1]);
        }
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Keyboard shortcut: Alt+D toggles next size theme mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const modes: Array<"auto" | "phone" | "tablet" | "desktop"> = ["auto", "phone", "tablet", "desktop"];
        const nextIdx = (modes.indexOf(deviceInfo.themeMode) + 1) % modes.length;
        deviceInfo.setThemeMode(modes[nextIdx]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deviceInfo.themeMode]);

  // Derived filtered & sorted deals
  const processedDeals = useMemo(() => {
    return deals
      .filter((d) => {
        if (filterRetailer !== "All" && !d.source.toLowerCase().includes(filterRetailer.toLowerCase())) {
          return false;
        }
        if (minDiscount > 0 && d.discountPercentage < minDiscount) {
          return false;
        }
        if (maxPrice !== null && d.newPrice > maxPrice) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "discount") return b.discountPercentage - a.discountPercentage;
        if (sortBy === "price_asc") return a.newPrice - b.newPrice;
        if (sortBy === "price_desc") return b.newPrice - a.newPrice;
        if (sortBy === "highlight") return (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0);
        return 0;
      });
  }, [deals, filterRetailer, minDiscount, maxPrice, sortBy]);

  const totalSavings = useMemo(() => {
    return processedDeals.reduce((sum, d) => sum + Math.max(0, d.oldPrice - d.newPrice), 0);
  }, [processedDeals]);

  // Mobile quick category pills
  const mobilePills = [
    { name: "Hot Deals", icon: Flame },
    { name: "Local Stores", icon: MapPin },
    { name: "Electronics", icon: Tv },
    { name: "Fashion", icon: Shirt },
    { name: "Food", icon: UtensilsCrossed },
  ];

  // Dynamic grid column sizing based on detected / active size theme
  const gridLayoutClasses = useMemo(() => {
    switch (deviceInfo.effectiveTheme) {
      case "phone":
        return "grid grid-cols-1 gap-3 sm:gap-3.5";
      case "tablet":
        return "grid grid-cols-1 sm:grid-cols-2 gap-4";
      case "ultrawide":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5";
      case "desktop":
      default:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5";
    }
  }, [deviceInfo.effectiveTheme]);

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`auto-resizer-root size-theme-${deviceInfo.effectiveTheme} flex ${isPhone ? "flex-col" : "flex-col md:flex-row"} w-full bg-[#f8fafc] font-sans text-slate-800 overflow-hidden select-none md:select-auto touch-pan-y`}
    >
      <Sidebar 
        activeCategory={activeCategory} 
        onCategoryChange={handleCategoryChange} 
        userEmail={user.email}
        deviceTheme={deviceInfo.effectiveTheme}
      />

      <main className={`flex-1 flex flex-col h-full overflow-hidden ${isPhone ? "p-2.5 sm:p-4" : isTablet ? "p-4 sm:p-6" : "p-4 sm:p-6 md:p-8"}`}>
        
        {/* Mobile Pull-to-Refresh Indicator Banner */}
        {pullDistance > 0 && (
          <div 
            style={{ height: `${pullDistance}px` }} 
            className="flex items-center justify-center overflow-hidden transition-all text-blue-600 font-bold text-xs gap-2 shrink-0 bg-blue-50/60 rounded-xl mb-1.5 border border-blue-200/50"
          >
            <ArrowDown className={`w-4 h-4 transition-transform ${pullDistance >= 50 ? 'rotate-180 text-emerald-600' : ''}`} />
            <span>{pullDistance >= 50 ? "Release to refresh deals" : "Pull down to refresh"}</span>
          </div>
        )}

        {/* Mobile Horizontal Category Bar + Auto Resizer Badge */}
        <div className={`${isPhone ? "flex" : "md:hidden flex"} items-center justify-between gap-1.5 pb-2 shrink-0 no-scrollbar`}>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {mobilePills.map((pill) => {
              const Icon = pill.icon;
              const isSelected = activeCategory === pill.name;
              return (
                <button
                  key={pill.name}
                  onClick={() => handleCategoryChange(pill.name)}
                  className={`flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-blue-600"}`} />
                  <span>{pill.name}</span>
                </button>
              );
            })}
          </div>
          <div className="shrink-0 pl-1">
            <DeviceSizeThemeBar deviceInfo={deviceInfo} />
          </div>
        </div>

        {/* Mobile Gesture Slide Indicator Hint */}
        {showSwipeHint && (
          <div className={`${isPhone ? "flex" : "md:hidden flex"} items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-100 text-[11px] text-blue-700 shadow-2xs`}>
            <div className="flex items-center gap-1.5 font-medium">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Swipe left or right to switch categories</span>
            </div>
            <button 
              onClick={() => setShowSwipeHint(false)} 
              className="text-[10px] font-bold text-blue-500 hover:text-blue-800 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Section - Hide if not on a discover page */}
        {!isPersonalTab && (
          <header className="flex flex-col gap-2.5 sm:gap-3 mb-3 sm:mb-4 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 items-stretch sm:items-center">
              <div className="flex-1 relative w-full md:max-w-2xl">
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium shadow-2xs"
                  placeholder="Search electronics by brand or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan(true)}
                />
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleScan(true)}
                  disabled={isScanning}
                  className="flex-1 sm:flex-initial h-11 px-5 sm:px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed border-none cursor-pointer shadow-xs transition-all"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>AI SCAN</span>
                    </>
                  )}
                </button>

                {/* Desktop/Tablet Auto Resizer Control */}
                <div className={`${isPhone ? "hidden" : "hidden md:block"}`}>
                  <DeviceSizeThemeBar deviceInfo={deviceInfo} />
                </div>
              </div>
            </div>

            {/* Smart Filters & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full text-xs no-scrollbar">
                <button
                  onClick={() => { setFilterRetailer("All"); setMinDiscount(0); setMaxPrice(null); }}
                  className={`h-9 px-3.5 rounded-xl font-bold transition-all text-xs shrink-0 cursor-pointer ${
                    filterRetailer === "All" && minDiscount === 0 && maxPrice === null
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All Deals
                </button>

                <button
                  onClick={() => setMinDiscount(minDiscount === 25 ? 0 : 25)}
                  className={`h-9 px-3.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shrink-0 cursor-pointer ${
                    minDiscount === 25
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> 25%+ Off
                </button>

                <button
                  onClick={() => setFilterRetailer(filterRetailer === "Amazon" ? "All" : "Amazon")}
                  className={`h-9 px-3.5 rounded-xl font-bold transition-all text-xs shrink-0 cursor-pointer ${
                    filterRetailer === "Amazon"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Amazon
                </button>

                <button
                  onClick={() => setFilterRetailer(filterRetailer === "Flipkart" ? "All" : "Flipkart")}
                  className={`h-9 px-3.5 rounded-xl font-bold transition-all text-xs shrink-0 cursor-pointer ${
                    filterRetailer === "Flipkart"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Flipkart
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs ml-auto">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 py-1 px-2 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-[11px] sm:text-xs"
                >
                  <option value="featured">Featured Deals</option>
                  <option value="discount">Highest Discount %</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="highlight">Top Picks First</option>
                </select>
              </div>
            </div>
          </header>
        )}

        {/* Content Section with gesture support and zero-glitch sizing */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto relative ${isPhone ? "pb-24" : "pb-16 md:pb-4"}`}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeCategory}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="w-full h-full"
            >
              <div className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 text-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                <span className="leading-tight flex items-center gap-2">
                {activeCategory === "Hot Deals" ? (
                  <>
                    <span className="text-amber-500">🔥</span>
                    <span>Trending Now</span>
                  </>
                ) : 
                 activeCategory === "Saved Deals" ? "My Saved Deals" : 
                 activeCategory === "Price Alerts" ? "My Price Alerts" : 
                 activeCategory === "Account" ? "Account Details" : 
                 activeCategory === "Local Stores" ? "Nearby Stores & In-Store Deals" :
                 activeCategory === "Fashion" ? "👗 Fashion & Style Deals" :
                 activeCategory === "Food" ? "🍔 Food & Dining Offers" :
                 activeCategory === "Admin" ? "" : 
                 `Top ${activeCategory} Deals`}
                </span>
                {!isPersonalTab && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-normal">
                    <span>Scanning 14 major retailers • Updated just now</span>
                  </div>
                )}
              </div>

              {error && !isPersonalTab && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium text-xs sm:text-sm">{error} Displaying cached results instead.</p>
                </div>
              )}

              {activeCategory === "Saved Deals" ? (
                <SavedDealsView />
              ) : activeCategory === "AI Assistant" ? (
                <AIAssistantView />
              ) : activeCategory === "Price Alerts" ? (
                <PriceAlertsView />
              ) : activeCategory === "Local Stores" ? (
                <NearbyStoresView />
              ) : activeCategory === "Account" ? (
                <ProfileView />
              ) : activeCategory === "Admin" ? (
                <AdminDashboard user={user as any} />
              ) : isScanning && deals.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={gridLayoutClasses}
                >
                  {[...Array(6)].map((_, i) => (
                    <DealCardSkeleton key={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.03, delayChildren: 0.02 }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                  className={gridLayoutClasses}
                >
                  {processedDeals.map((deal) => (
                    <motion.div 
                      key={deal.id} 
                      variants={{ 
                        hidden: { opacity: 0, y: 12, scale: 0.98 }, 
                        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 420, damping: 28 } } 
                      }}
                    >
                      <DealCard deal={deal} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {!isPersonalTab && !isScanning && processedDeals.length === 0 && !error && (
                <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-slate-200 mt-4 p-6 sm:p-8">
                  <p className="text-slate-600 font-bold mb-1">No deals match your current filters</p>
                  <p className="text-xs text-slate-400 mb-4">Try clearing retailer filters or adjusting minimum discount percentage.</p>
                  <button
                    onClick={() => { setFilterRetailer("All"); setMinDiscount(0); setMaxPrice(null); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold active:scale-95 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Phone Bottom Navigation Bar (Active on Phone Theme or small screens) */}
        <nav className={`${isPhone ? "flex" : "md:hidden flex"} fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 items-center justify-around z-30 shadow-lg`}>
          <button
            onClick={() => handleCategoryChange("Hot Deals")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer ${
              activeCategory === "Hot Deals" ? "text-blue-600 font-extrabold" : "text-slate-500"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="text-[10px]">Deals</span>
          </button>

          <button
            onClick={() => handleCategoryChange("Saved Deals")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer ${
              activeCategory === "Saved Deals" ? "text-blue-600 font-extrabold" : "text-slate-500"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="text-[10px]">Saved</span>
          </button>

          <button
            onClick={() => handleCategoryChange("AI Assistant")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer ${
              activeCategory === "AI Assistant" ? "text-blue-600 font-extrabold" : "text-slate-500"
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center -mt-2 shadow-sm shadow-blue-500/40">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px]">Scout</span>
          </button>

          <button
            onClick={() => handleCategoryChange("Price Alerts")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer ${
              activeCategory === "Price Alerts" ? "text-blue-600 font-extrabold" : "text-slate-500"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="text-[10px]">Alerts</span>
          </button>

          <button
            onClick={() => handleCategoryChange("Account")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer ${
              activeCategory === "Account" ? "text-blue-600 font-extrabold" : "text-slate-500"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span className="text-[10px]">Account</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

// Global Application Auth Gate
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setIsAuthReady(true);

      // Upsert user tracking document into database
      if (u) {
        try {
          await setDoc(doc(db, "users", u.uid), {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("User ecosystem sync warning:", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setDomainError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn("Google sign-in exception:", err);
      if (
        err?.code === "auth/unauthorized-domain" || 
        String(err).includes("unauthorized-domain") ||
        err?.message?.includes("unauthorized-domain")
      ) {
        setDomainError(window.location.hostname);
      } else if (err?.code === "auth/popup-closed-by-user") {
        // User closed popup
      } else {
        setDomainError(window.location.hostname);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCopyDomain = () => {
    if (domainError) {
      navigator.clipboard.writeText(domainError);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 animate-pulse">
            <TrendingDown className="w-6 h-6" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mt-2" />
          <span className="text-xs font-bold text-slate-500">Loading Make your money...</span>
        </div>
      </div>
    );
  }

  // Not signed in -> Authenticate directly with Google
  if (!user) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-800">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 flex flex-col items-center text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-3 text-white shadow-lg shadow-blue-500/20 mb-5">
            <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Make your <span className="text-blue-600">money</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs">
            Sign in to track live price drops, set alerts, and get AI-powered shopping deal intelligence.
          </p>

          {domainError && (
            <div className="w-full mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Domain Authorization Notice</span>
              </div>
              <p className="text-slate-600 mb-2 leading-relaxed">
                Add this domain to your Firebase Console under <span className="font-semibold text-slate-800">Authentication &gt; Settings &gt; Authorized Domains</span>:
              </p>
              <div className="flex items-center justify-between bg-white border border-amber-200/80 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-700">
                <span className="truncate mr-2">{domainError}</span>
                <button
                  onClick={handleCopyDomain}
                  className="flex items-center gap-1 font-sans font-bold text-blue-600 hover:text-blue-700 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          )}

          <div className="w-full space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Continue with Google Account</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
            By signing in, you agree to our Terms of Service & Privacy Policy. Powered by Firebase Authentication.
          </p>
        </div>
      </div>
    );
  }

  return <MainApp user={user} />;
}
