// TradingView Symbols (Commonly used)
// Gold: TVC:GOLD or OANDA:XAUUSD
// Silver: TVC:SILVER or OANDA:XAGUSD
// Platinum: TVC:PLATINUM or OANDA:XPTUSD
// Palladium: TVC:PALLADIUM or OANDA:XPDUSD

export interface LivePrice {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  change24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

class TradingViewService {
  private prices: Record<string, LivePrice> = {
    'XAUUSD': { symbol: 'XAUUSD', price: 2350.50, bid: 2350.20, ask: 2350.80, change24h: 0.45, high24h: 2365.00, low24h: 2340.00, lastUpdated: Date.now() },
    'XAGUSD': { symbol: 'XAGUSD', price: 28.20, bid: 28.18, ask: 28.22, change24h: -0.12, high24h: 28.50, low24h: 27.90, lastUpdated: Date.now() },
    'XPTUSD': { symbol: 'XPTUSD', price: 980.00, bid: 979.50, ask: 980.50, change24h: 0.15, high24h: 995.00, low24h: 970.00, lastUpdated: Date.now() },
    'XPDUSD': { symbol: 'XPDUSD', price: 1050.00, bid: 1049.00, ask: 1051.00, change24h: -0.55, high24h: 1070.00, low24h: 1030.00, lastUpdated: Date.now() },
  };

  private callbacks: ((prices: Record<string, LivePrice>) => void)[] = [];

  constructor() {
    this.fetchRealPrices();
    // Start simulation of live updates for smooth UI
    setInterval(() => this.simulateUpdates(), 2000);
    // Refresh real prices every 30 seconds to stay in sync with global markets
    setInterval(() => this.fetchRealPrices(), 30000);
  }

  private async fetchRealPrices() {
    const symbols = ['XAU', 'XAG', 'XPT', 'XPD'];
    for (const s of symbols) {
      try {
        // Using public, keyless endpoint to match TradingView data
        const response = await fetch(`https://api.gold-api.com/price/${s}`);
        const data = await response.json();
        if (data && data.price) {
          const symbol = `${s}USD`;
          this.prices[symbol] = {
            ...this.prices[symbol],
            price: data.price,
            bid: data.price * 0.9998,
            ask: data.price * 1.0002,
            lastUpdated: Date.now(),
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch real price for ${s}:`, error);
      }
    }
    this.notify();
  }

  private simulateUpdates() {
    Object.keys(this.prices).forEach(symbol => {
      const p = this.prices[symbol];
      const volatility = symbol === 'XAGUSD' ? 0.001 : 0.0002;
      const change = p.price * (Math.random() - 0.5) * volatility;
      
      p.price += change;
      const spread = p.price * 0.0002;
      p.bid = p.price - spread / 2;
      p.ask = p.price + spread / 2;
      p.lastUpdated = Date.now();
      
      if (p.price > p.high24h) p.high24h = p.price;
      if (p.price < p.low24h) p.low24h = p.price;
    });

    this.notify();
  }

  private notify() {
    this.callbacks.forEach(cb => cb({ ...this.prices }));
  }

  public subscribe(cb: (prices: Record<string, LivePrice>) => void) {
    this.callbacks.push(cb);
    cb({ ...this.prices });
    return () => {
      this.callbacks = this.callbacks.filter(c => c !== cb);
    };
  }

  public getPrices() {
    return { ...this.prices };
  }
}

export const tradingViewService = new TradingViewService();
