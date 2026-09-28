import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Sparkles, ChevronDown, Check, SlidersHorizontal, Maximize2 } from 'lucide-react';
import { DeviceInfo, SizeThemeMode } from '../hooks/useAutoResizer';

interface DeviceSizeThemeBarProps {
  deviceInfo: DeviceInfo;
}

export function DeviceSizeThemeBar({ deviceInfo }: DeviceSizeThemeBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const themeOptions: { mode: SizeThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'auto', label: 'Auto Detect', icon: Sparkles },
    { mode: 'phone', label: 'Phone Theme', icon: Smartphone },
    { mode: 'tablet', label: 'Tablet Theme', icon: Tablet },
    { mode: 'desktop', label: 'Desktop Theme', icon: Monitor },
  ];

  const getActiveIcon = () => {
    switch (deviceInfo.effectiveTheme) {
      case 'phone':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'ultrawide':
      case 'desktop':
      default:
        return Monitor;
    }
  };

  const ActiveIcon = getActiveIcon();

  return (
    <div className="relative z-40">
      {/* Medium Trigger Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-10 flex items-center gap-2 px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md shadow-sm border border-slate-700/60 transition-all hover:scale-102 active:scale-95 cursor-pointer"
        title="Auto Resizer & Device Size Theme Control"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <ActiveIcon className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
          {deviceInfo.width}×{deviceInfo.height}
        </span>
        <span className="capitalize text-slate-200">
          {deviceInfo.themeMode === 'auto' ? `Auto: ${deviceInfo.effectiveTheme}` : deviceInfo.themeMode}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isExpanded && (
        <>
          <div
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-40 bg-transparent"
          />
          <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 border border-slate-700 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>Device Size Theme</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {deviceInfo.effectiveTheme}
              </span>
            </div>

            <div className="space-y-1">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = deviceInfo.themeMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    onClick={() => {
                      deviceInfo.setThemeMode(opt.mode);
                      setIsExpanded(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Live Metrics footer */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Viewport: {deviceInfo.width} × {deviceInfo.height}px</span>
              <span>{deviceInfo.isTouch ? 'Touch Screen' : 'Pointer Mouse'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
