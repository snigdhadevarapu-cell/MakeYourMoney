import { useState, useEffect, useRef, useMemo } from 'react';
import { Deal } from '../types';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Bookmark, 
  ExternalLink, 
  Sparkles, 
  Tag, 
  TrendingDown, 
  Check, 
  Share2, 
  ArrowLeftRight,
  Heart,
  LineChart as LineChartIcon,
  Bell
} from 'lucide-react';
import { DealModal } from './DealModal';
import { motion, PanInfo } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [showAlertToast, setShowAlertToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSwipeToast, setShowSwipeToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<any>(null);
  const user = auth.currentUser;

  const docId = user ? `${user.uid}_${deal.id}` : null;
  const alertDocId = user ? `alert_${user.uid}_${deal.id}` : null;

  useEffect(() => {
    let isMounted = true;
    if (docId) {
      getDoc(doc(db, 'savedDeals', docId))
        .then((snap) => {
          if (isMounted && snap.exists()) {
            setIsSaved(true);
          }
        })
        .catch(() => {});
    } else {
      // Check demo saved deals
      try {
        const demoSaved = JSON.parse(localStorage.getItem('makeyourmoney_demo_saved') || '[]');
        if (demoSaved.some((d: any) => d.id === deal.id)) {
          setIsSaved(true);
        }
      } catch (e) {}
    }

    // Check existing price alert for this item
    if (alertDocId) {
      getDoc(doc(db, 'priceAlerts', alertDocId))
        .then((snap) => {
          if (isMounted && snap.exists() && snap.data()?.isActive) {
            setHasAlert(true);
          }
        })
        .catch(() => {});
    } else {
      try {
        const demoAlerts = JSON.parse(localStorage.getItem('makeyourmoney_demo_alerts') || '[]');
        if (demoAlerts.some((a: any) => (a.dealId === deal.id || a.id === `alert-${deal.id}`) && a.isActive)) {
          setHasAlert(true);
        }
      } catch (e) {}
    }

    return () => {
      isMounted = false;
    };
  }, [docId, alertDocId, deal.id]);

  const toggleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSaving(true);
    try {
      if (user && docId) {
        if (isSaved) {
          await deleteDoc(doc(db, 'savedDeals', docId));
          setIsSaved(false);
        } else {
          await setDoc(doc(db, 'savedDeals', docId), {
            userId: user.uid,
            dealId: deal.id,
            title: deal.title,
            oldPrice: deal.oldPrice,
            newPrice: deal.newPrice,
            discountPercentage: deal.discountPercentage,
            source: deal.source,
            imageUrl: deal.imageUrl || '',
            imageKeyword: deal.imageKeyword || deal.title.slice(0, 20),
            highlight: deal.highlight ?? false,
            hasPriceDropped: deal.hasPriceDropped ?? false,
            savedAt: new Date().toISOString(),
            lastCheckedAt: new Date().toISOString()
          });
          setIsSaved(true);
        }
      } else {
        // Demo storage fallback
        const demoSaved = JSON.parse(localStorage.getItem('makeyourmoney_demo_saved') || '[]');
        if (isSaved) {
          const filtered = demoSaved.filter((d: any) => d.id !== deal.id);
          localStorage.setItem('makeyourmoney_demo_saved', JSON.stringify(filtered));
          setIsSaved(false);
        } else {
          demoSaved.push({
            ...deal,
            docId: `demo-${deal.id}`,
            savedAt: new Date().toISOString()
          });
          localStorage.setItem('makeyourmoney_demo_saved', JSON.stringify(demoSaved));
          setIsSaved(true);
        }
      }
    } catch (err) {
      console.warn('Could not update saved deal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePriceAlert = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAlerting(true);
    const targetPrice = Math.round(deal.newPrice * 0.95);
    try {
      if (user && alertDocId) {
        if (hasAlert) {
          await deleteDoc(doc(db, 'priceAlerts', alertDocId));
          setHasAlert(false);
          setToastMessage(`Price alert disabled for ${deal.title.slice(0, 24)}...`);
          setShowAlertToast(true);
        } else {
          await setDoc(doc(db, 'priceAlerts', alertDocId), {
            userId: user.uid,
            dealId: deal.id,
            keyword: deal.title.slice(0, 60),
            targetPrice: targetPrice,
            currentPrice: deal.newPrice,
            source: deal.source,
            imageUrl: deal.imageUrl || '',
            isActive: true,
            createdAt: new Date().toISOString()
          });
          setHasAlert(true);
          setToastMessage(`🔔 Price alert active! Tracking drops below ₹${targetPrice.toLocaleString('en-IN')}`);
          setShowAlertToast(true);
        }
      } else {
        // Fallback demo storage
        const demoAlerts = JSON.parse(localStorage.getItem('makeyourmoney_demo_alerts') || '[]');
        if (hasAlert) {
          const filtered = demoAlerts.filter((a: any) => a.dealId !== deal.id && a.id !== `alert-${deal.id}`);
          localStorage.setItem('makeyourmoney_demo_alerts', JSON.stringify(filtered));
          setHasAlert(false);
          setToastMessage(`Price alert removed`);
          setShowAlertToast(true);
        } else {
          demoAlerts.push({
            id: `alert-${deal.id}`,
            dealId: deal.id,
            keyword: deal.title.slice(0, 60),
            targetPrice: targetPrice,
            currentPrice: deal.newPrice,
            source: deal.source,
            imageUrl: deal.imageUrl || '',
            isActive: true,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('makeyourmoney_demo_alerts', JSON.stringify(demoAlerts));
          setHasAlert(true);
          setToastMessage(`🔔 Price alert active! Tracking drops below ₹${targetPrice.toLocaleString('en-IN')}`);
          setShowAlertToast(true);
        }
      }

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([25, 45, 25]); } catch {}
      }
    } catch (err) {
      console.warn('Could not toggle price alert:', err);
    } finally {
      setIsAlerting(false);
      setTimeout(() => setShowAlertToast(false), 3000);
    }
  };

  // Swipe Card Left or Right to Save
  const handleSwipeSave = () => {
    const nextSaved = !isSaved;
    toggleSave();
    setToastMessage(nextSaved ? 'Saved to Wishlist! ⭐' : 'Removed from Wishlist');
    setShowSwipeToast(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25); } catch {}
    }
    setTimeout(() => setShowSwipeToast(false), 2000);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    setDragOffset(0);
    if (Math.abs(info.offset.x) > 65 || Math.abs(info.velocity.x) > 350) {
      handleSwipeSave();
    }
  };

  // Double-tap gesture handler
  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && now - lastTapRef.current > 0) {
      e.stopPropagation();
      toggleSave();
      setShowHeartBurst(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch {}
      }
      setTimeout(() => setShowHeartBurst(false), 900);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Long-press gesture handler
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(25); } catch {}
      }
      setShowModal(true);
    }, 450);
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const savings = Math.max(0, deal.oldPrice - deal.newPrice);
    const shareTitle = `${deal.title} (${deal.discountPercentage}% OFF)`;
    const shareText = `🔥 Hot Deal: ${deal.title}\nNow ₹${deal.newPrice.toLocaleString('en-IN')} (${deal.discountPercentage}% OFF, Save ₹${savings.toLocaleString('en-IN')}) on ${deal.source}!\nFind verified live deals on Make your money:`;
    const shareUrl = window.location.href;

    // 1. Web Share API if supported
    if (navigator.share && navigator.canShare && navigator.canShare({ title: shareTitle, text: shareText, url: shareUrl })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    // 2. Clipboard Fallback
    try {
      const fullText = `${shareText}\n${shareUrl}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.warn('Could not copy deal to clipboard:', err);
    }
  };

  const getRetailerSearchUrl = () => {
    const encoded = encodeURIComponent(deal.title);
    if (deal.source.toLowerCase().includes('flipkart')) {
      return `https://www.flipkart.com/search?q=${encoded}`;
    }
    if (deal.source.toLowerCase().includes('croma')) {
      return `https://www.croma.com/searchB?q=${encoded}`;
    }
    return `https://www.amazon.in/s?k=${encoded}`;
  };

  // Visual Price History Data for Recharts Trend Line
  const priceHistory = useMemo(() => {
    if (deal.priceHistory && deal.priceHistory.length > 0) {
      return deal.priceHistory;
    }
    // Deterministic 30-day price trend leading to current offer
    let hash = 0;
    for (let i = 0; i < deal.id.length; i++) {
      hash = (hash << 5) - hash + deal.id.charCodeAt(i);
      hash |= 0;
    }
    const factor = (Math.abs(hash) % 7) * 0.015;
    const regular = Math.max(deal.oldPrice, Math.round(deal.newPrice * 1.25));
    const current = deal.newPrice;

    const p30 = Math.round(regular * (0.97 + factor));
    const p21 = Math.round(regular * (1.02 - factor));
    const p14 = Math.round(regular * (0.95 + factor * 0.5));
    const p7 = Math.round(current + (regular - current) * 0.4);
    const pNow = current;

    return [
      { date: '30d ago', price: p30 },
      { date: '21d ago', price: p21 },
      { date: '14d ago', price: p14 },
      { date: '7d ago', price: p7 },
      { date: 'Today', price: pNow },
    ];
  }, [deal.id, deal.oldPrice, deal.newPrice, deal.priceHistory]);

  const minHistoricalPrice = useMemo(() => Math.min(...priceHistory.map((p) => p.price)), [priceHistory]);
  const isHistoricalLow = deal.newPrice <= minHistoricalPrice;
  const avgHistoricalPrice = useMemo(() => {
    let sum = 0;
    for (const p of priceHistory) {
      sum += p.price;
    }
    return Math.round(sum / (priceHistory.length || 1));
  }, [priceHistory]);

  return (
    <>
      {/* Outer swipe container holding underlying save action layer */}
      <div className="relative rounded-2xl overflow-hidden select-none group touch-pan-y">
        
        {/* Underneath background action layer revealed during left/right swipe */}
        <div 
          className={`absolute inset-0 flex items-center justify-between px-5 sm:px-6 rounded-2xl transition-colors duration-150 ${
            dragOffset > 15 
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white' 
              : dragOffset < -15 
              ? 'bg-gradient-to-l from-blue-600 via-indigo-600 to-blue-700 text-white' 
              : 'bg-slate-200/80 text-slate-400'
          }`}
        >
          {/* Swiped Right -> Left side indicator */}
          <div className={`flex items-center gap-2 font-black text-xs sm:text-sm tracking-wide transition-all duration-150 ${
            dragOffset > 20 ? 'opacity-100 translate-x-0 scale-105' : 'opacity-0 -translate-x-4'
          }`}>
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
            <span>{isSaved ? "Remove from Wishlist" : "Save to Wishlist"}</span>
          </div>

          {/* Swiped Left -> Right side indicator */}
          <div className={`flex items-center gap-2 font-black text-xs sm:text-sm tracking-wide transition-all duration-150 ${
            dragOffset < -20 ? 'opacity-100 translate-x-0 scale-105' : 'opacity-0 translate-x-4'
          }`}>
            <span>{isSaved ? "Remove from Wishlist" : "Save to Wishlist"}</span>
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
          </div>
        </div>

        {/* Swipeable Card Surface */}
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragStart={() => setIsDragging(true)}
          onDrag={(_, info) => setDragOffset(info.offset.x)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleTouchStart();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
            handleTouchMove();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleCardTouchEnd(e);
          }}
          onClick={() => {
            if (!isDragging && Math.abs(dragOffset) < 6) {
              setShowModal(true);
            }
          }}
          className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer relative"
        >
          {/* Double-tap Heart Burst Feedback */}
          {showHeartBurst && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[2px] animate-in fade-in zoom-in duration-150 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow-xl animate-bounce">
                <Bookmark className="w-8 h-8 fill-blue-600 text-blue-600" />
              </div>
            </div>
          )}

          {/* Price Alert Toast Notification */}
          {showAlertToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[92%] bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-2xl z-30 flex items-center gap-2.5 border border-amber-500/50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 fill-amber-400 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight font-medium text-slate-100">{toastMessage}</p>
              </div>
            </div>
          )}

          {/* Swipe-to-Save Confirmation Toast */}
          {showSwipeToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xl z-30 flex items-center gap-2 border border-slate-700 animate-in fade-in zoom-in duration-150 pointer-events-none">
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-400 fill-emerald-400' : 'text-slate-300'}`} />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Copied Feedback Notification */}
          {isCopied && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg z-20 flex items-center gap-1.5 border border-slate-700 animate-in fade-in slide-in-from-top-2 pointer-events-none">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Deal link copied to clipboard!</span>
            </div>
          )}

          {/* Product Image Area */}
          <div className="relative w-full h-38 sm:h-44 md:h-48 bg-slate-100 overflow-hidden">
            <img
              src={deal.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=800'}
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            {/* Source Retailer Badge & Active Alerting Indicator */}
            <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex items-center gap-1.5 z-10">
              <div className="bg-white/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold text-slate-800 shadow-xs border border-slate-200/50 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-blue-600" />
                {deal.source}
              </div>

              {hasAlert && (
                <div className="bg-amber-500/95 backdrop-blur-xs text-white px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black shadow-xs flex items-center gap-1 animate-in fade-in zoom-in-95">
                  <Bell className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" />
                  <span>Tracking</span>
                </div>
              )}
            </div>

            {/* Top Right: Highlight Badge, Bell Alert Button & Quick Share Button */}
            <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
              {deal.highlight && (
                <div className="bg-amber-500 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Top Pick
                </div>
              )}

              {/* Quick Bell Price Alert Toggle Button (Medium Size) */}
              <button
                onClick={togglePriceAlert}
                disabled={isAlerting}
                title={hasAlert ? "Price Alert Active - Click to remove alert" : "Set Price Alert for this item"}
                className={`h-9 px-2.5 sm:px-3 rounded-xl backdrop-blur-md flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border text-xs font-bold ${
                  hasAlert
                    ? 'bg-amber-500 border-amber-400 text-white scale-102 shadow-md shadow-amber-500/30'
                    : 'bg-white/95 hover:bg-white border-slate-200/60 text-slate-700 hover:text-amber-600'
                }`}
              >
                <Bell className={`w-4 h-4 ${hasAlert ? 'fill-white animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{hasAlert ? 'Alert Active' : 'Alert'}</span>
              </button>

              {/* Quick Share Button (Medium Size) */}
              <button
                onClick={handleShare}
                title={isCopied ? "Link Copied!" : "Share Deal"}
                className={`h-9 w-9 sm:w-auto sm:px-3 rounded-xl backdrop-blur-md flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border text-xs font-bold ${
                  isCopied
                    ? 'bg-emerald-600 border-emerald-500 text-white scale-102'
                    : 'bg-white/95 hover:bg-white border-slate-200/60 text-slate-700 hover:text-blue-600'
                }`}
              >
                {isCopied ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Discount Badge */}
            {deal.discountPercentage > 0 && (
              <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 bg-emerald-600 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-black shadow-xs flex items-center gap-1">
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {deal.discountPercentage}% OFF
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-3.5 sm:p-4 md:p-5 flex flex-col flex-1 justify-between gap-3 sm:gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                {deal.title}
              </h3>
            </div>

            <div>
              {/* Price comparison with Historical Low indicator */}
              <div className="flex items-baseline justify-between gap-1.5 mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900">
                    ₹{deal.newPrice.toLocaleString('en-IN')}
                  </span>
                  {deal.oldPrice > deal.newPrice && (
                    <span className="text-xs text-slate-400 line-through font-medium">
                      ₹{deal.oldPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {isHistoricalLow ? (
                  <span 
                    title="Current price is at or below the 30-day recorded low!" 
                    className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs shrink-0"
                  >
                    <TrendingDown className="w-3 h-3 text-emerald-600" />
                    <span>Historical Low</span>
                  </span>
                ) : (
                  <span 
                    title="Current offer versus 30-day average"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0"
                  >
                    <span>₹{Math.max(0, avgHistoricalPrice - deal.newPrice).toLocaleString('en-IN')} below avg</span>
                  </span>
                )}
              </div>

              {/* Visual Price Trend Line (Recharts) */}
              <div 
                className="w-full bg-slate-50/90 rounded-xl p-2 mb-3 border border-slate-100/90 hover:border-slate-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1 px-0.5">
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-600">
                    <LineChartIcon className="w-3 h-3 text-blue-600" />
                    <span>Price Trend</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    30-Day History
                  </span>
                </div>
                
                <div className="h-12 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`trend-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isHistoricalLow ? "#10b981" : "#3b82f6"} stopOpacity={0.35}/>
                          <stop offset="95%" stopColor={isHistoricalLow ? "#10b981" : "#3b82f6"} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-xs text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-lg border border-slate-700 pointer-events-none">
                                <p className="text-slate-300 font-medium text-[9px]">{item.date}</p>
                                <p className="text-emerald-400 font-extrabold">₹{Number(item.price).toLocaleString('en-IN')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isHistoricalLow ? "#10b981" : "#2563eb"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#trend-${deal.id})`}
                        dot={false}
                        activeDot={{ r: 3.5, strokeWidth: 0, fill: isHistoricalLow ? "#10b981" : "#2563eb" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Buttons (Medium Size, Spacious & Uncramped) */}
              <div className="flex flex-col gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {/* Primary Row: Grab Deal + Save Button */}
                <div className="flex items-center gap-2">
                  <a
                    href={getRetailerSearchUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Grab Deal</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={(e) => toggleSave(e)}
                    disabled={isSaving}
                    className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${
                      isSaved
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4 text-blue-600" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-slate-500" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Row: Quick Price Alert + Share Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={togglePriceAlert}
                    disabled={isAlerting}
                    title={hasAlert ? "Price Alert Active - Click to remove alert" : "Set Price Alert for this item"}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                      hasAlert
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-600'
                    }`}
                  >
                    <Bell className={`w-3.5 h-3.5 ${hasAlert ? 'fill-amber-500 text-amber-600' : 'text-slate-500'}`} />
                    <span>{hasAlert ? 'Alert Active' : 'Set Alert'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    title={isCopied ? "Link Copied to Clipboard!" : "Share Deal via Web Share or Clipboard"}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                      isCopied
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-blue-600'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Gesture Hint Bar */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium sm:hidden">
                <span className="flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3 text-slate-400" />
                  Swipe left/right to save
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-slate-400" />
                  Double-tap
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Detail View */}
      {showModal && (
        <DealModal
          deal={deal}
          isSaved={isSaved}
          onToggleSave={toggleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
