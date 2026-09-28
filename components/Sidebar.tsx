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
  CreditCard
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

  // Section 1: DISCOVER
  const discoverCategories = [
    { name: 'Hot Deals', icon: Flame },
    { name: 'AI Assistant', icon: Bot },
    { name: 'Electronics', icon: Tv },
    { name: 'Fashion', icon: Shirt },
    { name: 'Food', icon: UtensilsCrossed },
    { name: 'Local Stores', icon: MapPin },
  ];

  // Section 2: MY PROFILE
  const profileCategories = [
    { name: 'Saved Deals', icon: Bookmark },
    { name: 'Price Alerts', icon: Bell },
    { name: 'Account', icon: User },
  ];

  if (isAdmin) {
    profileCategories.unshift({ name: 'Admin', icon: ShieldCheck } as any);
  }

  const handleSelect = (categoryName: string) => {
    onCategoryChange(categoryName);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (Phone mode or narrow viewport) */}
      <div className={`${isForcedPhone ? 'flex' : 'md:hidden flex'} items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-30 shrink-0 sticky top-0 shadow-xs`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">
              Make
            </span>
            <span className="font-extrabold text-xs tracking-tight text-blue-600 leading-none mt-0.5">
              your money
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed ${isForcedPhone ? '' : 'md:static'} inset-y-0 left-0 z-50 w-64 bg-[#f8fafc] md:bg-transparent border-r border-slate-200/70 flex flex-col justify-between transition-transform duration-200 ease-out shadow-xl ${isForcedPhone ? '' : 'md:shadow-none'} ${
          isOpen ? 'translate-x-0' : `-translate-x-full ${isForcedPhone ? '' : 'md:translate-x-0'}`
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand header matching photo */}
          <div className="p-6 pb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                  Make <span className="text-slate-500 font-semibold">money</span>
                </span>
                <span className="font-bold text-xs tracking-tight text-blue-600 leading-none">
                  your
                </span>
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
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
            {/* DISCOVER SECTION */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                DISCOVER
              </div>
              <nav className="space-y-1">
                {discoverCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleSelect(cat.name)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50/80 text-blue-600 font-bold border border-blue-100/70 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* MY PROFILE SECTION */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                MY PROFILE
              </div>
              <nav className="space-y-1">
                {profileCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleSelect(cat.name)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50/80 text-blue-600 font-bold border border-blue-100/70 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User Profile & Sign Out Footer */}
          <div className="p-4 border-t border-slate-200/60 shrink-0 bg-white/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {userEmail || 'Active Hunter'}
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
