import { useState, useEffect } from 'react';
import { auth, db, logout } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User as UserIcon, Mail, Shield, Bookmark, Bell, LogOut, CheckCircle, Smartphone } from 'lucide-react';

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

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-500/20 overflow-hidden shrink-0 border-2 border-slate-100 ring-2 ring-blue-500/10">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 leading-tight">
              {user.displayName || 'Deal Hunter'}
            </h3>
            <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Mail className="w-4 h-4 text-slate-400" />
              {user.email}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-100">
                <CheckCircle className="w-3 h-3" />
                Verified Google User
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1 border border-blue-100">
                <Shield className="w-3 h-3" />
                Sync Active
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{savedCount}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Saved Deals</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{alertsCount}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Active Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings & Sign Out */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Settings & Session</h4>
        <div className="flex items-center justify-between py-2 text-sm">
          <div>
            <p className="font-semibold text-slate-800">Primary Currency</p>
            <p className="text-xs text-slate-400">Default prices displayed in INR (₹)</p>
          </div>
          <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-xs">INR (₹)</span>
        </div>

        <div className="flex items-center justify-between py-2 text-sm border-t border-slate-100">
          <div>
            <p className="font-semibold text-slate-800">Multi-Device Synchronization</p>
            <p className="text-xs text-slate-400">Your saved deals and alerts sync in real-time via Cloud Firestore</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Enabled
          </span>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => logout()}
            className="w-full py-3 px-4 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Make your money
          </button>
        </div>
      </div>
    </div>
  );
}
