import React, { useEffect, useRef } from 'react';

interface Props {
  isDarkMode?: boolean;
}

export const TradingViewSpotWidget: React.FC<Props> = ({ isDarkMode = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return;

    // Full reset so switching dark/light re-renders cleanly
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('crossorigin', 'anonymous');

    script.onerror = () => {
      if (!isMounted || !container) return;
      container.innerHTML =
        '<div class="p-4 text-xs text-muted-foreground text-center">Market data currently unavailable</div>';
    };

    script.innerHTML = JSON.stringify({
      colorTheme: isDarkMode ? 'dark' : 'light',
      dateRange: '1D',
      showChart: false,
      locale: 'en',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: '100%',
      height: '360',
      tabs: [
        {
          title: 'Metals',
          symbols: [
            { s: 'TVC:GOLD',      d: 'Gold (XAU/USD)' },
            { s: 'TVC:SILVER',    d: 'Silver (XAG/USD)' },
            { s: 'TVC:PLATINUM',  d: 'Platinum (XPT/USD)' },
            { s: 'TVC:PALLADIUM', d: 'Palladium (XPD/USD)' },
          ],
          originalTitle: 'Metals',
        },
      ],
    });

    const timeout = setTimeout(() => {
      if (isMounted && container) {
        container.appendChild(script);
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isDarkMode]);

  return (
    <div
      className="tradingview-widget-container w-full overflow-hidden"
      ref={containerRef}
    />
  );
};
