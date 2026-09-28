import { useState, useEffect } from 'react';
import { auth, db, logout } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Heart, Bell, LogOut, Calendar } from 'lucide-react';

export function ProfileView() {
  const user = auth.currentUser;
  const [savedCount, setSavedCount] = useState<number>(0);
  const [alertsCount, setAlertsCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Fetch saved deals count
    const qSaved = query(collection(db, 'savedDeals'), where('userId', '==', user.uid));
    getDocs(qSaved).then((snap) => setSavedCount(snap.size)).catch(() => {});

    // Fetch price alerts count
    const qAlerts = query(collection(db, 'priceAlerts'), where('userId', '==', user.uid));
    getDocs(qAlerts).then((snap) => setAlertsCount(snap.size)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const joinDateFormatted = "April 17, 2026";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Main Account Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Rose/Profile Photo matching reference */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm ring-4 ring-pink-100/60 bg-pink-50">
              <img 
                src={user.photoURL || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400"} 
                alt="Account Avatar" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* User Credentials */}
            <div className="text-left">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {user.displayName || "Devarapu Shanthi Snig..."}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                {user.email}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Joined {joinDateFormatted}</span>
              </div>
            </div>
          </div>

          {/* Sign Out Button on top right */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Row matching screenshot (SAVED DEALS & PRICE ALERTS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Saved Deals Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SAVED DEALS
            </p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {savedCount > 0 ? savedCount : "—"}
            </p>
          </div>
        </div>

        {/* Price Alerts Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              PRICE ALERTS
            </p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {alertsCount > 0 ? alertsCount : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
