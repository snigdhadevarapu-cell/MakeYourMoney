import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Bookmark, ExternalLink, Trash2, Tag, Heart } from 'lucide-react';
import { Deal } from '../types';

interface SavedDealItem extends Deal {
  savedAt?: string;
  docId: string;
}

export function SavedDealsView() {
  const [savedDeals, setSavedDeals] = useState<SavedDealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'savedDeals'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: SavedDealItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: data.dealId || docSnap.id,
              docId: docSnap.id,
              title: data.title,
              oldPrice: data.oldPrice,
              newPrice: data.newPrice,
              discountPercentage: data.discountPercentage || 0,
              source: data.source || 'Online',
              imageUrl: data.imageUrl,
              highlight: data.highlight,
              hasPriceDropped: data.hasPriceDropped,
              savedAt: data.savedAt,
            });
          });
          setSavedDeals(items);
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore saved deals error, falling back to local demo storage:', error);
          loadFromDemoStorage();
        }
      );

      return () => unsubscribe();
    } else {
      loadFromDemoStorage();
    }
  }, [user]);

  const loadFromDemoStorage = () => {
    try {
      const raw = localStorage.getItem('makeyourmoney_demo_saved');
      if (raw) {
        setSavedDeals(JSON.parse(raw));
      } else {
        // Seed initial demo saved deal
        const initial = [
          {
            id: 'sony-wh-1000xm5-01',
            docId: 'demo-sony-01',
            title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
            oldPrice: 34990,
            newPrice: 22990,
            discountPercentage: 34,
            source: 'Amazon',
            imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800',
            highlight: true,
            savedAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('makeyourmoney_demo_saved', JSON.stringify(initial));
        setSavedDeals(initial);
      }
    } catch (e) {
      setSavedDeals([]);
    }
    setLoading(false);
  };

  const handleRemove = async (docId: string, dealId: string) => {
    if (user && !docId.startsWith('demo-')) {
      try {
        await deleteDoc(doc(db, 'savedDeals', docId));
      } catch (e) {
        console.error('Failed to remove deal from cloud:', e);
      }
    } else {
      const updated = savedDeals.filter((d) => d.docId !== docId && d.id !== dealId);
      setSavedDeals(updated);
      localStorage.setItem('makeyourmoney_demo_saved', JSON.stringify(updated));
    }
  };

  const getRetailerUrl = (item: SavedDealItem) => {
    const q = encodeURIComponent(item.title);
    if (item.source.toLowerCase().includes('flipkart')) {
      return `https://www.flipkart.com/search?q=${q}`;
    }
    if (item.source.toLowerCase().includes('croma')) {
      return `https://www.croma.com/searchB?q=${q}`;
    }
    return `https://www.amazon.in/s?k=${q}`;
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-500 font-medium text-sm">Loading your saved deals...</p>
      </div>
    );
  }

  if (savedDeals.length === 0) {
    return (
      <div className="py-24 text-center max-w-sm mx-auto">
        <div className="w-12 h-12 text-slate-300 mx-auto mb-3 flex items-center justify-center">
          <Heart className="w-8 h-8 text-slate-300 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">No saved deals yet.</h3>
        <p className="text-xs text-slate-400 font-medium">
          Click the heart icon on any deal to save it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>{savedDeals.length} {savedDeals.length === 1 ? 'deal' : 'deals'} saved</span>
        <span>{user ? 'Synced with Cloud Firestore' : 'Saved in Demo Session'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {savedDeals.map((deal) => (
          <div
            key={deal.docId}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="p-5 flex gap-4">
              {deal.imageUrl && (
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-600" />
                    {deal.source}
                  </span>
                  {deal.discountPercentage > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                      {deal.discountPercentage}% OFF
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-slate-800 line-clamp-2 mb-2 leading-tight">
                  {deal.title}
                </h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-900">
                    ₹{deal.newPrice.toLocaleString('en-IN')}
                  </span>
                  {deal.oldPrice > deal.newPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{deal.oldPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                {deal.savedAt ? `Saved ${new Date(deal.savedAt).toLocaleDateString()}` : 'Saved'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemove(deal.docId, deal.id)}
                  className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <a
                  href={getRetailerUrl(deal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Grab Deal</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
