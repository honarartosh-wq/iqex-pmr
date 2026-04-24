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
  private simInterval: ReturnType<typeof setInterval> | null = null;
  private fetchInterval: ReturnType<typeof setInterval> | null = null;
  private proxyDisabled = false;
  // Tracks which symbols have received at least one authoritative quote from
  // the upstream feed (gold-api proxy). Once a symbol is live, we stop
  // applying simulated jitter to it so the displayed spot matches the real
  // market instead of drifting between fetches.
  private liveSymbols: Set<string> = new Set();

  constructor() {
    this.fetchRealPrices();
    // Pre-fill smooth updates for symbols that haven't yet received live
    // data, so the initial render isn't stuck on the seed values.
    this.simInterval = setInterval(() => this.simulateUpdates(), 2000);
    // Refresh real prices every 15 seconds. The server caches upstream
    // responses for 10s, so this keeps the client close to live without
    // hammering the proxy.
    this.fetchInterval = setInterval(() => this.fetchRealPrices(), 15000);

    // Ensure intervals are torn down on Vite HMR disposal to avoid leaking
    // stale timers across module reloads.
    if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
      (import.meta as any).hot.dispose(() => this.destroy());
    }
  }

  public destroy() {
    if (this.simInterval !== null) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    if (this.fetchInterval !== null) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
    this.callbacks = [];
  }

  private async fetchRealPrices() {
    if (this.proxyDisabled) return;

    const symbols = ['XAU', 'XAG', 'XPT', 'XPD'];
    let successCount = 0;
    let proxyMissing = false;

    await Promise.all(symbols.map(async (s) => {
      try {
        const response = await fetch(`/api/prices/${s}`);
        if (!response.ok) {
          // 404 means the server-side proxy isn't deployed in this environment
          // (e.g. static-only hosting). Stop polling to avoid console spam.
          if (response.status === 404) proxyMissing = true;
          return;
        }

        const data = await response.json();
        const rawPrice = typeof data?.price === 'string' ? parseFloat(data.price) : data?.price;
        if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice) || rawPrice <= 0) {
          console.warn(`[tradingView] Ignoring non-numeric price for ${s}:`, data?.price);
          return;
        }

        const symbol = `${s}USD`;
        this.prices[symbol] = {
          ...this.prices[symbol],
          price: rawPrice,
          bid: rawPrice * 0.9998,
          ask: rawPrice * 1.0002,
          lastUpdated: Date.now(),
        };
        this.liveSymbols.add(symbol);
        successCount += 1;
      } catch (error) {
        // Network error (not an HTTP status); let the interval retry.
      }
    }));

    if (proxyMissing && successCount === 0) {
      this.proxyDisabled = true;
      if (this.fetchInterval !== null) {
        clearInterval(this.fetchInterval);
        this.fetchInterval = null;
      }
      console.info('[tradingView] Price proxy unavailable; using simulated prices.');
    }

    this.notify();
  }

  private simulateUpdates() {
    let mutated = false;
    Object.keys(this.prices).forEach(symbol => {
      // Don't simulate symbols whose real spot we already have - the auto
      // premium panel compares against these values and must not drift.
      if (this.liveSymbols.has(symbol)) return;

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
      mutated = true;
    });

    if (mutated) this.notify();
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
