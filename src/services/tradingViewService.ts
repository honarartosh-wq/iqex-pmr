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

// Map from short symbol (used by gold-api.com & metals.live) → internal key
const SHORT_TO_SYMBOL: Record<string, string> = {
  XAU: 'XAUUSD', XAG: 'XAGUSD', XPT: 'XPTUSD', XPD: 'XPDUSD',
};
const METALS_LIVE_KEY: Record<string, string> = {
  gold: 'XAUUSD', silver: 'XAGUSD', platinum: 'XPTUSD', palladium: 'XPDUSD',
};

class TradingViewService {
  // Seed prices updated to approximate April 2026 market values.
  // These are only used until the first successful live fetch arrives.
  private prices: Record<string, LivePrice> = {
    'XAUUSD': { symbol: 'XAUUSD', price: 4700.00, bid: 4699.06, ask: 4700.94, change24h: 0.45, high24h: 4720.00, low24h: 4680.00, lastUpdated: Date.now() },
    'XAGUSD': { symbol: 'XAGUSD', price:   33.00, bid:   32.99, ask:   33.01, change24h: -0.12, high24h:  33.50, low24h:  32.50, lastUpdated: Date.now() },
    'XPTUSD': { symbol: 'XPTUSD', price:  980.00, bid:  979.80, ask:  980.20, change24h: 0.15, high24h: 995.00, low24h: 970.00, lastUpdated: Date.now() },
    'XPDUSD': { symbol: 'XPDUSD', price: 1050.00, bid: 1049.79, ask: 1050.21, change24h: -0.55, high24h: 1070.00, low24h: 1030.00, lastUpdated: Date.now() },
  };

  private callbacks: ((prices: Record<string, LivePrice>) => void)[] = [];
  private simInterval: ReturnType<typeof setInterval> | null = null;
  private fetchInterval: ReturnType<typeof setInterval> | null = null;
  private proxyDisabled = false;
  // Tracks which symbols have received at least one authoritative quote.
  // Once live, we stop applying simulated jitter so the price doesn't drift.
  private liveSymbols: Set<string> = new Set();

  constructor() {
    this.fetchRealPrices();
    this.simInterval = setInterval(() => this.simulateUpdates(), 2000);
    this.fetchInterval = setInterval(() => this.fetchRealPrices(), 15000);

    if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
      (import.meta as any).hot.dispose(() => this.destroy());
    }
  }

  public destroy() {
    if (this.simInterval !== null) { clearInterval(this.simInterval); this.simInterval = null; }
    if (this.fetchInterval !== null) { clearInterval(this.fetchInterval); this.fetchInterval = null; }
    this.callbacks = [];
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  private applyPrice(symbol: string, rawPrice: number) {
    this.prices[symbol] = {
      ...this.prices[symbol],
      price: rawPrice,
      bid: rawPrice * 0.9998,
      ask: rawPrice * 1.0002,
      lastUpdated: Date.now(),
    };
    this.liveSymbols.add(symbol);
  }

  private parseGoldApiResponse(data: any): number | null {
    const raw = typeof data?.price === 'string' ? parseFloat(data.price) : data?.price;
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null;
    return raw;
  }

  // ─── primary fetch: server-side proxy ───────────────────────────────────────

  private async fetchRealPrices() {
    if (this.proxyDisabled) {
      await this.tryFallbackFetch();
      return;
    }

    let successCount = 0;
    let proxyMissing = false;

    await Promise.all(Object.entries(SHORT_TO_SYMBOL).map(async ([short, symbol]) => {
      try {
        const response = await fetch(`/api/prices/${short}`);
        if (!response.ok) {
          if (response.status === 404) proxyMissing = true;
          return;
        }
        const data = await response.json();
        const price = this.parseGoldApiResponse(data);
        if (price === null) {
          console.warn(`[tradingView] Ignoring non-numeric price for ${short}:`, data?.price);
          return;
        }
        this.applyPrice(symbol, price);
        successCount++;
      } catch {
        // Network error — let the interval retry
      }
    }));

    if (proxyMissing && successCount === 0) {
      // Proxy route doesn't exist (static hosting). Switch to direct APIs.
      this.proxyDisabled = true;
      if (this.fetchInterval !== null) {
        clearInterval(this.fetchInterval);
        this.fetchInterval = setInterval(() => this.tryFallbackFetch(), 15000);
      }
      console.info('[tradingView] Server proxy unavailable; switching to direct price APIs.');
      await this.tryFallbackFetch();
    }

    this.notify();
  }

  // ─── fallback A: direct gold-api.com (works if their CORS headers allow it) ─

  private async fetchFromGoldApiDirect(): Promise<number> {
    let count = 0;
    await Promise.all(Object.entries(SHORT_TO_SYMBOL).map(async ([short, symbol]) => {
      try {
        const response = await fetch(`https://api.gold-api.com/price/${short}`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;
        const data = await response.json();
        const price = this.parseGoldApiResponse(data);
        if (price === null) return;
        this.applyPrice(symbol, price);
        count++;
      } catch {}
    }));
    return count;
  }

  // ─── fallback B: metals.live (free, CORS-enabled) ───────────────────────────

  private async fetchFromMetalsLive(): Promise<number> {
    try {
      const response = await fetch('https://api.metals.live/v1/spot', {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return 0;
      const data = await response.json();
      // API returns either [{gold: 4700}, {silver: 33}, ...] or {gold: 4700, silver: 33, ...}
      const items: any[] = Array.isArray(data) ? data : [data];
      let count = 0;
      items.forEach(item => {
        Object.entries(METALS_LIVE_KEY).forEach(([key, symbol]) => {
          const v = item[key];
          if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
            this.applyPrice(symbol, v);
            count++;
          }
        });
      });
      return count;
    } catch {
      return 0;
    }
  }

  private async tryFallbackFetch() {
    let count = await this.fetchFromGoldApiDirect();
    if (count === 0) count = await this.fetchFromMetalsLive();
    if (count > 0) this.notify();
  }

  // ─── simulation (used only for symbols without a live quote yet) ─────────────

  private simulateUpdates() {
    let mutated = false;
    Object.keys(this.prices).forEach(symbol => {
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
    return () => { this.callbacks = this.callbacks.filter(c => c !== cb); };
  }

  public getPrices() {
    return { ...this.prices };
  }
}

export const tradingViewService = new TradingViewService();
