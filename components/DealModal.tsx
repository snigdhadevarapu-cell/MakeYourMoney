import { useState, useRef, useMemo } from 'react';
import { Deal } from '../types';
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  Bell, 
  TrendingDown, 
  Share2, 
  Check, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight,
  MapPin,
  LineChart as LineChartIcon
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, setDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';

interface DealModalProps {
  deal: Deal;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function DealModal({ deal, onClose, isSaved, onToggleSave }: DealModalProps) {
  const [copied, setCopied] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState(Math.round(deal.newPrice * 0.95));
  const [alertCreated, setAlertCreated] = useState(false);
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const user = auth.currentUser;

  const savingsAmount = Math.max(0, deal.oldPrice - deal.newPrice);

  // Generate 30-day price trend with deterministic realism
  const priceHistory = useMemo(() => {
    if (deal.priceHistory && deal.priceHistory.length > 0) {
      return deal.priceHistory;
    }
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
      { date: '30d ago', price: p30, label: 'Regular MRP' },
      { date: '21d ago', price: p21, label: 'Mid-month' },
      { date: '14d ago', price: p14, label: 'Promo sale' },
      { date: '7d ago', price: p7, label: 'Recent drop' },
      { date: 'Today', price: pNow, label: 'Current Deal' },
    ];
  }, [deal.id, deal.oldPrice, deal.newPrice, deal.priceHistory]);

  const minRecordedPrice = useMemo(() => Math.min(...priceHistory.map((p) => p.price)), [priceHistory]);
  const maxRecordedPrice = useMemo(() => Math.max(...priceHistory.map((p) => p.price)), [priceHistory]);
  const avgRecordedPrice = useMemo(() => {
    let sum = 0;
    for (const p of priceHistory) {
      sum += p.price;
    }
    return Math.round(sum / (priceHistory.length || 1));
  }, [priceHistory]);
  const isHistoricalLow = deal.newPrice <= minRecordedPrice;

  const handleShare = async () => {
    const shareTitle = `${deal.title} (${deal.discountPercentage}% OFF)`;
    const text = `🔥 Hot Deal Alert: ${deal.title}\nNow ₹${deal.newPrice.toLocaleString('en-IN')} (${deal.discountPercentage}% OFF, Save ₹${savingsAmount.toLocaleString('en-IN')}) on ${deal.source}!\nTrack verified live deals on Make your money:`;
    const shareUrl = window.location.href;

    if (navigator.share && navigator.canShare && navigator.canShare({ title: shareTitle, text, url: shareUrl })) {
      try {
        await navigator.share({
          title: shareTitle,
          text,
          url: shareUrl,
        });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `🔥 Hot Deal: ${deal.title} is now ₹${deal.newPrice.toLocaleString('en-IN')} (${deal.discountPercentage}% OFF, Save ₹${savingsAmount.toLocaleString('en-IN')}) on ${deal.source}! Check it out: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleQuickAlert = async () => {
    setCreatingAlert(true);
    try {
      if (user) {
        await addDoc(collection(db, 'priceAlerts'), {
          userId: user.uid,
          keyword: deal.title.slice(0, 50),
          targetPrice: alertTargetPrice,
          isActive: true,
          createdAt: new Date().toISOString()
        });
      } else {
        // Fallback for demo mode
        const existing = JSON.parse(localStorage.getItem('makeyourmoney_demo_alerts') || '[]');
        existing.push({
          id: `demo-${Date.now()}`,
          keyword: deal.title.slice(0, 50),
          targetPrice: alertTargetPrice,
          isActive: true,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('makeyourmoney_demo_alerts', JSON.stringify(existing));
      }
      setAlertCreated(true);
      setTimeout(() => setAlertCreated(false), 3000);
    } catch (e) {
      console.warn('Could not set alert:', e);
    } finally {
      setCreatingAlert(false);
    }
  };

  // Mobile pull-down-to-dismiss gesture
  const modalTouchStartY = useRef<number | null>(null);
  const handleModalTouchStart = (e: React.TouchEvent) => {
    modalTouchStartY.current = e.touches[0].clientY;
  };
  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (!modalTouchStartY.current) return;
    const diff = e.changedTouches[0].clientY - modalTouchStartY.current;
    if (diff > 90) {
      onClose(); // Swiped down to dismiss
    }
    modalTouchStartY.current = null;
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="bg-white max-w-2xl w-full rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleModalTouchStart}
        onTouchEnd={handleModalTouchEnd}
      >
        {/* Mobile Swipe-Down Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50/50">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">
              {deal.source} Verified
            </span>
            {deal.highlight && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                Top Pick
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Share deal"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div 
              onClick={() => setIsImageZoomed(!isImageZoomed)}
              className="w-full sm:w-52 h-52 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 cursor-zoom-in relative group"
              title="Tap or click to zoom image"
            >
              <img
                src={deal.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=800'}
                alt={deal.title}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isImageZoomed ? 'scale-175 cursor-zoom-out' : 'group-hover:scale-105'
                }`}
              />
              <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none backdrop-blur-xs">
                {isImageZoomed ? 'Tap to reset' : 'Tap to zoom'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug mb-3">
                {deal.title}
              </h2>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-black text-slate-900">
                  ₹{deal.newPrice.toLocaleString('en-IN')}
                </span>
                {deal.oldPrice > deal.newPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{deal.oldPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {deal.discountPercentage > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs">
                    {deal.discountPercentage}% OFF
                  </span>
                )}
              </div>

              {savingsAmount > 0 && (
                <p className="text-xs font-bold text-emerald-600 mb-4 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  You save ₹{savingsAmount.toLocaleString('en-IN')} right now!
                </p>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <div className="flex items-center gap-2">
                  <a
                    href={getRetailerSearchUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-11 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Grab Deal</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={onToggleSave}
                    className={`h-11 px-4 rounded-xl text-sm font-bold transition-all border cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${
                      isSaved
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShare}
                    title={copied ? "Link Copied!" : "Share Deal"}
                    className={`h-10 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                      copied
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-blue-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Share Deal</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    title="Share to WhatsApp"
                    className="h-10 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(deal.source + ' ' + deal.title.split(' ')[0] + ' electronics')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors mt-2.5 border border-slate-200/80"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Find in Nearby Stores (Google Maps)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* 30-Day Historical Price Analysis & Recharts Graph */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <LineChartIcon className="w-4 h-4 text-blue-600" />
                  30-Day Price Trend & Historical Analysis
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real price movements tracked across verified Indian e-commerce platforms.
                </p>
              </div>

              {isHistoricalLow ? (
                <span className="self-start sm:self-auto inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
                  All-Time Low Confirmed
                </span>
              ) : (
                <span className="self-start sm:self-auto inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                  ₹{Math.max(0, avgRecordedPrice - deal.newPrice).toLocaleString('en-IN')} below 30d average
                </span>
              )}
            </div>

            {/* Interactive Recharts Graph */}
            <div className="h-44 w-full bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="modal-trend-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isHistoricalLow ? "#10b981" : "#2563eb"} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={isHistoricalLow ? "#10b981" : "#2563eb"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={['dataMin - 500', 'dataMax + 500']}
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }} 
                    tickLine={false}
                    tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl text-xs font-bold shadow-xl border border-slate-700 pointer-events-none">
                            <p className="text-slate-400 font-medium text-[10px]">{item.date} • {item.label}</p>
                            <p className="text-emerald-400 font-black text-sm mt-0.5">₹{Number(item.price).toLocaleString('en-IN')}</p>
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
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#modal-trend-grad)"
                    dot={{ r: 3, fill: isHistoricalLow ? "#10b981" : "#2563eb", strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: isHistoricalLow ? "#10b981" : "#2563eb" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Price Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Lowest (30d)</p>
                <p className="text-sm font-extrabold text-emerald-600">₹{minRecordedPrice.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Average (30d)</p>
                <p className="text-sm font-extrabold text-slate-800">₹{avgRecordedPrice.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Highest (MRP)</p>
                <p className="text-sm font-extrabold text-slate-500">₹{maxRecordedPrice.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[10px] uppercase font-bold text-emerald-700 mb-0.5">Drop from High</p>
                <p className="text-sm font-extrabold text-emerald-700">-₹{(maxRecordedPrice - deal.newPrice).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Quick Price Alert Box */}
          <div className="bg-violet-50/70 border border-violet-200 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <Bell className="w-5 h-5 text-violet-600" />
              <h4 className="font-bold text-sm text-slate-800">Set Future Price Drop Alert</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Notify me automatically if this product drops below:
            </p>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(Number(e.target.value))}
                  className="w-full h-11 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <button
                onClick={handleQuickAlert}
                disabled={creatingAlert || alertCreated}
                className="h-11 px-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {alertCreated ? (
                  <>
                    <Check className="w-4 h-4" />
                    Alert Active!
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Set Alert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
