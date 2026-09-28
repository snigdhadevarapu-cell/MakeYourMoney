import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Bell, Plus, Trash2, CheckCircle2, Sparkles } from 'lucide-react';

interface AlertItem {
  id: string;
  keyword: string;
  targetPrice: number;
  isActive: boolean;
  createdAt?: string;
}

export function PriceAlertsView() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'priceAlerts'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: AlertItem[] = [];
          snapshot.forEach((snap) => {
            const data = snap.data();
            list.push({
              id: snap.id,
              keyword: data.keyword,
              targetPrice: Number(data.targetPrice),
              isActive: Boolean(data.isActive),
              createdAt: data.createdAt,
            });
          });
          setAlerts(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Firestore price alerts error, using demo fallback:', err);
          loadDemoAlerts();
        }
      );

      return () => unsubscribe();
    } else {
      loadDemoAlerts();
    }
  }, [user]);

  const loadDemoAlerts = () => {
    try {
      const raw = localStorage.getItem('makeyourmoney_demo_alerts');
      if (raw) {
        setAlerts(JSON.parse(raw));
      } else {
        const initial = [
          {
            id: 'demo-alert-1',
            keyword: 'Apple iPad Air M2',
            targetPrice: 49990,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo-alert-2',
            keyword: 'Sony PlayStation 5 Slim',
            targetPrice: 42000,
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('makeyourmoney_demo_alerts', JSON.stringify(initial));
        setAlerts(initial);
      }
    } catch (e) {
      setAlerts([]);
    }
    setLoading(false);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !targetPrice) return;

    const numericPrice = parseFloat(targetPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) return;

    setIsSubmitting(true);
    try {
      if (user) {
        await addDoc(collection(db, 'priceAlerts'), {
          userId: user.uid,
          keyword: keyword.trim(),
          targetPrice: numericPrice,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      } else {
        const newAlert: AlertItem = {
          id: `demo-${Date.now()}`,
          keyword: keyword.trim(),
          targetPrice: numericPrice,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        const updated = [newAlert, ...alerts];
        setAlerts(updated);
        localStorage.setItem('makeyourmoney_demo_alerts', JSON.stringify(updated));
      }
      setKeyword('');
      setTargetPrice('');
    } catch (err) {
      console.error('Error creating price alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAlertStatus = async (alert: AlertItem) => {
    if (user && !alert.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'priceAlerts', alert.id), {
          isActive: !alert.isActive,
        });
      } catch (e) {
        console.error('Failed to update alert status:', e);
      }
    } else {
      const updated = alerts.map((a) => a.id === alert.id ? { ...a, isActive: !a.isActive } : a);
      setAlerts(updated);
      localStorage.setItem('makeyourmoney_demo_alerts', JSON.stringify(updated));
    }
  };

  const deleteAlert = async (id: string) => {
    if (user && !id.startsWith('demo-')) {
      try {
        await deleteDoc(doc(db, 'priceAlerts', id));
      } catch (e) {
        console.error('Failed to delete alert:', e);
      }
    } else {
      const updated = alerts.filter((a) => a.id !== id);
      setAlerts(updated);
      localStorage.setItem('makeyourmoney_demo_alerts', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Create New Alert Card matching the reference screenshot */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm">
          <Bell className="w-4 h-4 text-blue-600" />
          <span>Create New Alert</span>
        </div>

        <form onSubmit={handleCreateAlert} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Product Name (e.g., iPhone 15)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
              className="w-full h-11 px-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="w-full sm:w-48 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
            <input
              type="number"
              placeholder="Target Price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
              min="1"
              className="w-full h-11 pl-8 pr-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !keyword.trim() || !targetPrice}
            className="w-full sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Alert</span>
          </button>
        </form>
      </div>

      {/* Existing Alerts List */}
      <div>
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading price alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            You haven&apos;t set up any alerts yet.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1 mb-2">
              <span>Active Trackers ({alerts.filter((a) => a.isActive).length}/{alerts.length})</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Retailer Bot Online
              </span>
            </div>

            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      alert.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{alert.keyword}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Target: <strong className="text-slate-900">₹{alert.targetPrice.toLocaleString('en-IN')}</strong></span>
                      <span>•</span>
                      <span className={alert.isActive ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                        {alert.isActive ? 'Scouting across 14 retailers' : 'Paused'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => toggleAlertStatus(alert)}
                    className={`h-9 px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                      alert.isActive
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {alert.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
