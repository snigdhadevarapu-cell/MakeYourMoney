import { useState } from 'react';
import { 
  Flame, 
  Tv, 
  MapPin, 
  Shirt, 
  UtensilsCrossed, 
  Bookmark, 
  Bell, 
  Bot, 
  User, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  TrendingDown
} from 'lucide-react';
import { logout } from '../firebase';

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  userEmail?: string | null;
  deviceTheme?: 'phone' | 'tablet' | 'desktop' | 'ultrawide';
}

export function Sidebar({ activeCategory, onCategoryChange, userEmail, deviceTheme }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = userEmail === 'sanjithdevarapu6@gmail.com';
  const isForcedPhone = deviceTheme === 'phone';

  // Discover Deals: Hot Deals, Local Stores, Electronics, Fashion, Food
  const discoverCategories = [
    { name: 'Hot Deals', icon: Flame, badge: '🔥' },
    { name: 'Local Stores', icon: MapPin, badge: '📍' },
    { name: 'Electronics', icon: Tv },
    { name: 'Fashion', icon: Shirt, badge: '👗' },
    { name: 'Food', icon: UtensilsCrossed, badge: '🍔' },
  ];

  // Personal: Saved Deals, Price Alerts, AI Assistant, Account
  const personalCategories = [
    { name: 'Saved Deals', icon: Bookmark },
    { name: 'Price Alerts', icon: Bell },
    { name: 'AI Assistant', icon: Bot },
    { name: 'Account', icon: User },
  ];

  if (isAdmin) {
    personalCategories.unshift({ name: 'Admin', icon: ShieldCheck, badge: '👑' } as any);
  }

  const handleSelect = (categoryName: string) => {
    onCategoryChange(categoryName);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (Always on Phone theme, or on screens < md) */}
      <div className={`${isForcedPhone ? 'flex' : 'md:hidden flex'} items-center justify-between p-3.5 bg-white border-b border-slate-200 z-30 shrink-0 sticky top-0 shadow-2xs`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm overflow-hidden p-1">
            <img src="/icon.svg" alt="App" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-800">
              Make your <span className="text-blue-600">money</span>
            </span>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Deal Scout
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed ${isForcedPhone ? '' : 'md:static'} inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-out shadow-xl ${isForcedPhone ? '' : 'md:shadow-none'} ${
          isOpen ? 'translate-x-0' : `-translate-x-full ${isForcedPhone ? '' : 'md:translate-x-0'}`
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand header */}
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-2 text-white shadow-md shadow-blue-500/20">
                <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-tight text-slate-900 tracking-tight">
                  Make your <span className="text-blue-600">money</span>
                </h1>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-emerald-500" /> Deal Scout
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
                <span>Discover Deals</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-extrabold">5 Hubs</span>
              </div>
              <nav className="space-y-1">
                {discoverCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleSelect(cat.name)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{cat.name}</span>
                      </div>
                      {cat.badge && <span className="text-xs">{cat.badge}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Personal
              </div>
              <nav className="space-y-1">
                {personalCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleSelect(cat.name)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User profile & Sign Out Footer */}
          <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {userEmail || 'Active User'}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {isAdmin ? 'Admin Console' : 'Online'}
                </p>
              </div>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
