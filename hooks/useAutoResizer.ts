import { useState, useEffect } from 'react';

export type DeviceType = 'phone' | 'tablet' | 'desktop' | 'ultrawide';
export type SizeThemeMode = 'auto' | 'phone' | 'tablet' | 'desktop';

export interface DeviceInfo {
  deviceType: DeviceType;
  effectiveTheme: DeviceType;
  themeMode: SizeThemeMode;
  width: number;
  height: number;
  isTouch: boolean;
  isPortrait: boolean;
  pixelRatio: number;
  label: string;
  setThemeMode: (mode: SizeThemeMode) => void;
}

export function useAutoResizer(initialMode: SizeThemeMode = 'auto') {
  const [themeMode, setThemeMode] = useState<SizeThemeMode>(() => {
    try {
      return (localStorage.getItem('makeyourmoney_size_theme') as SizeThemeMode) || initialMode;
    } catch {
      return initialMode;
    }
  });

  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    let timeoutId: any;
    const handleResize = () => {
      clearTimeout(timeoutId);
      // Debounce slightly to prevent layout thrashing / glitching
      timeoutId = setTimeout(() => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 50);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Initial check
    handleResize();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const width = windowDimensions.width;
  const height = windowDimensions.height;

  // Auto detection thresholds
  let detectedType: DeviceType = 'desktop';
  if (width < 768) {
    detectedType = 'phone';
  } else if (width < 1024) {
    detectedType = 'tablet';
  } else if (width >= 1536) {
    detectedType = 'ultrawide';
  } else {
    detectedType = 'desktop';
  }

  // If themeMode is manually forced, use that, otherwise use detected
  const effectiveTheme: DeviceType = themeMode === 'auto' ? detectedType : (themeMode as DeviceType);

  const isTouch = typeof window !== 'undefined' ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false;
  const isPortrait = height > width;
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const getLabel = () => {
    if (themeMode === 'auto') {
      switch (detectedType) {
        case 'phone':
          return `Auto (Phone ${width}px)`;
        case 'tablet':
          return `Auto (Tablet ${width}px)`;
        case 'ultrawide':
          return `Auto (UltraWide ${width}px)`;
        default:
          return `Auto (Desktop ${width}px)`;
      }
    }
    return `${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} Mode`;
  };

  const changeThemeMode = (mode: SizeThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('makeyourmoney_size_theme', mode);
    } catch {}
  };

  return {
    deviceType: detectedType,
    effectiveTheme,
    themeMode,
    width,
    height,
    isTouch,
    isPortrait,
    pixelRatio,
    label: getLabel(),
    setThemeMode: changeThemeMode,
  };
}
