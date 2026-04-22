import React, { useEffect, useRef } from 'react';

interface TradingViewTickerProps {
  isDarkMode: boolean;
}

export const TradingViewTicker: React.FC<TradingViewTickerProps> = ({ isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return;

    // Clear previous script if any (but keep the widget div)
    const existingScript = container.querySelector('script');
    if (existingScript) existingScript.remove();
    
    // Ensure the widget div exists
    let widgetDiv = container.querySelector('.tradingview-widget-container__widget');
    if (!widgetDiv) {
      widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      container.appendChild(widgetDiv);
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('crossorigin', 'anonymous');
    
    script.onerror = () => {
      if (!isMounted) return;
      console.error('TradingView script failed to load');
      if (container) {
        container.innerHTML = '<div class="p-2 text-xs text-muted-foreground text-center">Market data currently unavailable</div>';
      }
    };

    script.innerHTML = JSON.stringify({
      "symbols": [
        {
          "proName": "TVC:GOLD",
          "title": "Gold"
        },
        {
          "proName": "TVC:SILVER",
          "title": "Silver"
        },
        {
          "proName": "TVC:PLATINUM",
          "title": "Platinum"
        },
        {
          "proName": "TVC:PALLADIUM",
          "title": "Palladium"
        },
        {
          "proName": "FX_IDC:USDIQD",
          "title": "USD/IQD"
        }
      ],
      "showSymbolLogo": true,
      "colorTheme": isDarkMode ? "dark" : "light",
      "isTransparent": true,
      "displayMode": "adaptive",
      "locale": "en"
    });

    // Small delay to ensure the widget div is fully processed by the browser
    const timeout = setTimeout(() => {
      if (isMounted && container) {
        container.appendChild(script);
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      // We don't clear innerHTML here to avoid the script's async callbacks 
      // hitting a null container immediately. The next useEffect or unmount will handle it.
    };
  }, [isDarkMode]);

  return (
    <div 
      className="tradingview-widget-container w-full border-b border-border bg-muted/10 h-[46px] overflow-hidden" 
      ref={containerRef} 
    />
  );
};
