import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { DealCard } from "./components/DealCard";
import { scanForDeals } from "./services/aiService";
import { Deal } from "./types";
import { DealCardSkeleton } from "./components/Skeleton";
import { Search, Sparkles, Loader2, AlertCircle, Tag, LogIn } from "lucide-react";
import { SavedDealsView } from "./components/SavedDealsView";
import { PriceAlertsView } from "./components/PriceAlertsView";
import { ProfileView } from "./components/ProfileView";
import { AdminDashboard } from "./components/AdminDashboard";
import { AIAssistantView } from "./components/AIAssistantView";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, loginWithGoogle } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";

function MainApp({ user }: { user: User }) {
  const isAdmin = user.email === "sanjithdevarapu@gmail.com";
  const [activeCategory, setActiveCategory] = useState(isAdmin ? "Admin" : "Electronics");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fallback initial deals in case AI scan fails or is loading initially
  const initialDeals: Deal[] = [
      {
        id: "sony-wh-1000xm5-wireless-noise-cancelling-headphones-0",
        title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        oldPrice: 34990,
        newPrice: 22990,
        discountPercentage: 34,
        source: "Amazon",
        imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
        highlight: true
      },
      {
        id: "apple-iphone-15-pro-256gb--1",
        title: "Apple iPhone 15 Pro (256GB)",
        oldPrice: 144900,
        newPrice: 119990,
        discountPercentage: 17,
        source: "Flipkart",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800",
        highlight: false
      },
      {
        id: "samsung-49-inch-curved-gaming-monitor-2",
        title: "Samsung 49-inch Curved Gaming Monitor",
        oldPrice: 110000,
        newPrice: 65000,
        discountPercentage: 40,
        source: "Croma",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800",
        highlight: false
      }
  ];

  // Perform a scan when category or search changes (triggered by the button)
  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const results = await scanForDeals(searchQuery, activeCategory);
      setDeals(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan deals.");
      if (deals.length === 0) {
         setDeals(initialDeals);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const isPersonalTab = activeCategory === "Saved Deals" || activeCategory === "Price Alerts" || activeCategory === "Account" || activeCategory === "Admin" || activeCategory === "AI Assistant";

  useEffect(() => {
    if (!isPersonalTab) {
      handleScan();
    }
  }, []);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
  };

  useEffect(() => {
    if (activeCategory && !isPersonalTab) {
      handleScan();
    }
  }, [activeCategory]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <Sidebar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} userEmail={auth.currentUser?.email} />

      <main className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-10">
        
        {/* Header Section - Hide if not on a discover page */}
        {!isPersonalTab && (
          <header className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8 shrink-0">
            <div className="flex-1 relative w-full md:max-w-2xl">
              <Search className="w-5 h-5 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full h-full min-h-[44px] md:min-h-[50px] pl-[44px] sm:pl-[52px] pr-4 sm:pr-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-[15px] text-slate-800 placeholder:text-slate-400 font-medium shadow-sm"
                placeholder="Search electronics by brand or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
            </div>
            
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="py-3 px-6 md:px-8 bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs md:text-[14px] uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed border-none cursor-pointer shadow-md hover:shadow-lg transition-all"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Scan
                </>
              )}
            </button>
          </header>
        )}

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto relative pb-4 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <div className="text-xl md:text-[22px] font-bold mb-4 md:mb-6 text-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-1 sm:gap-0">
                <span>
                {activeCategory === "Hot Deals" ? "🔥 Trending Now" : 
                 activeCategory === "Saved Deals" ? "My Saved Deals" : 
                 activeCategory === "Price Alerts" ? "My Price Alerts" : 
                 activeCategory === "Account" ? "Account Details" : 
                 activeCategory === "Admin" ? "" : 
                 `Top ${activeCategory} Deals`}
                </span>
                {!isPersonalTab && (
                  <span className="text-xs md:text-[13px] text-slate-500 font-normal">
                    Scanning 14 major retailers • Updated just now
                  </span>
                )}
              </div>

              {error && !isPersonalTab && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium text-sm">{error} Displaying cached results instead.</p>
                </div>
              )}

              {activeCategory === "Saved Deals" ? (
                <SavedDealsView />
              ) : activeCategory === "AI Assistant" ? (
                <AIAssistantView />
              ) : activeCategory === "Price Alerts" ? (
                <PriceAlertsView />
              ) : activeCategory === "Account" ? (
                <ProfileView />
              ) : activeCategory === "Admin" && auth.currentUser ? (
                <AdminDashboard user={auth.currentUser} />
              ) : isScanning ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                >
                  {[...Array(8)].map((_, i) => (
                    <DealCardSkeleton key={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.04, delayChildren: 0.1 }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                >
                  {deals.map((deal) => (
                    <motion.div 
                      key={deal.id} 
                      variants={{ 
                        hidden: { opacity: 0, y: 15, scale: 0.98 }, 
                        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } } 
                      }}
                    >
                      <DealCard deal={deal} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {!isPersonalTab && !isScanning && deals.length === 0 && !error && (
                <div className="text-center py-20">
                  <p className="text-slate-500 font-medium">No deals found for this search. Try a different query!</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Global Application Auth Gate
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setIsAuthReady(true);
      
      // Upsert user tracking document into database to build the active ecosystem list
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
          console.error("Failed to sync user ecosystem object", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src="/icon.svg" alt="App Icon" className="w-16 h-16 rounded-2xl mb-6 shadow-xl" />
        </motion.div>
        <p className="text-slate-500 font-bold tracking-tight animate-pulse text-lg">Scouting Best Deals...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-[100px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white max-w-md w-full rounded-[2rem] shadow-2xl shadow-blue-900/5 border border-slate-100 relative z-10"
        >
          <div className="p-10 text-center">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              {/* Optional glow effect */}
              <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 rounded-full" />
              <img src="/icon.svg" alt="App Icon" className="w-full h-full object-cover rounded-2xl drop-shadow-md relative z-10" />
            </div>
            
            <h1 className="text-[32px] font-extrabold text-slate-800 tracking-tight mb-4">Make your <span className="text-blue-600">money</span></h1>
            
            <p className="text-[15px] text-slate-500 mb-10 font-medium leading-relaxed px-2">
              Your personal, AI-powered deal scout. Discover the best prices, set automatic price drop alerts, and save money every day.
            </p>
            
            <button 
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-xl font-bold text-[15px] transition-all shadow-md border border-blue-500 hover:shadow-lg active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              Continue with Google Account
            </button>
            
            <p className="mt-8 text-[12px] text-slate-400 font-medium px-4">
              By continuing, your preferences, saved deals, and price alerts are securely synchronized. 
              <span className="block mt-1 font-bold text-blue-400">Ensure popups are allowed for authentication.</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <MainApp user={user} />;
}
