import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapPin, Search, X, Clock, TrendingUp, TrendingDown,
  Hammer, ArrowUpDown, Activity, Coins, DollarSign,
  Percent, Shield, Zap, ChevronRight, Sparkles,
  Gem, CircleDot, Gauge, RefreshCw
} from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MarketConfig } from '../../types';

/* ─── constants ──────────────────────────────────────────────────────────── */
const CITIES = [
  'Baghdad','Basra','Nineveh','Erbil','Sulaymaniyah','Kirkuk',
  'Najaf','Karbala','Dhi Qar','Anbar','Diyala','Babil',
  'Al-Qadisiyah','Maysan','Wasit','Saladin','Dohuk','Muthanna','Halabja',
];

const TICKER = [
  { label:'XAU/USD', val:2341.50, isUSD:true,  chg:+0.42 },
  { label:'XAG/USD', val:  28.71, isUSD:true,  chg:-0.18 },
  { label:'XPT/USD', val: 968.00, isUSD:true,  chg:+0.11 },
  { label:'XPD/USD', val: 982.00, isUSD:true,  chg:-0.55 },
  { label:'USD/IQD', val:1306.00, isUSD:false,  chg: 0.00 },
  { label:'EUR/USD', val:  1.0852, isUSD:true,  chg:+0.06 },
  { label:'GBP/USD', val:  1.2644, isUSD:true,  chg:-0.09 },
];

const LABOR_ORIGINS = [
  { key:'italian', label:'Italian', flag:'🇮🇹', color:'#22c55e' },
  { key:'turkish', label:'Turkish', flag:'🇹🇷', color:'#ef4444' },
  { key:'iraqi',   label:'Iraqi',   flag:'🇮🇶', color:'#f59e0b' },
  { key:'khaliji', label:'Khaliji', flag:'🇦🇪', color:'#0ea5e9' },
] as const;

const GOLD_LABOR:   Record<string,number> = { italian:4500, turkish:3200, iraqi:2000, khaliji:3800 };
const SILVER_LABOR: Record<string,number> = { italian:1200, turkish: 900, iraqi: 600, khaliji:1000 };

/* ─── animated number component ────────────────────────────────────────── */
const AnimatedNumber = ({ value = 0, className='', prefix='', suffix='', isUSD=false }: { 
  value?: number; 
  className?: string;
  prefix?: string;
  suffix?: string;
  isUSD?: boolean;
}) => {
  const [flash, setFlash] = useState<'up'|'down'|null>(null);
  const prev = useRef(value);
  
  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? 'up' : 'down');
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [value]);
  
  const colorClass = flash === 'up' ? 'text-emerald-500' : flash === 'down' ? 'text-rose-500' : '';
  
  return (
    <span className={`font-mono font-bold tabular-nums transition-all duration-300 ${colorClass} ${className}`}>
      {prefix}{isUSD ? (value || 0).toFixed(2) : Math.round(value || 0).toLocaleString()}{suffix}
    </span>
  );
};

/* ─── stat card component ───────────────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-4 transition-all hover:shadow-lg hover:scale-[1.02]">
    <div className="absolute top-0 right-0 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-full h-full" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{title}</span>
        <Icon className="w-4 h-4 text-primary/60" />
      </div>
      <div className="text-2xl font-black">{value}</div>
      {trend && (
        <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

/* ─── price row component ───────────────────────────────────────────────── */
const PriceRow = ({ name, unit, bid, ask, spread }: any) => (
  <div className="flex items-center px-3 sm:px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-all group">
    <div className="flex-1 min-w-0 pr-2 sm:pr-3">
      <div className="text-xs sm:text-sm font-bold truncate group-hover:text-primary transition-colors">{name}</div>
      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
        <span>Spread: {spread.toLocaleString()}</span>
        <span className="text-primary/40">•</span>
        <span>{unit}</span>
      </div>
    </div>
    <div className="w-20 sm:w-[90px] text-right">
      <AnimatedNumber value={bid} className="text-xs sm:text-sm text-emerald-500" />
    </div>
    <div className="w-20 sm:w-[90px] text-right">
      <AnimatedNumber value={ask} className="text-xs sm:text-sm text-rose-500" />
    </div>
    <div className="w-12 text-right hidden lg:block">
      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors ml-auto" />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   PROPS
   embedded = true  →  hide internal header & ticker (portal provides them)
   embedded = false →  show full standalone page (header + ticker included)
══════════════════════════════════════════════════════════════════════════ */
interface BazaarProps { 
  embedded?: boolean;
  config: MarketConfig;
  displayMode?: 'USD' | 'IQD' | 'Both';
}

export const Bazaar: React.FC<BazaarProps> = ({ embedded = false, config, displayMode = 'IQD' }) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [prices, setPrices] = useState<any[]>([]);
  const [fxRates, setFxRates] = useState<any[]>([]);
  const [time, setTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [view, setView] = useState<'prices' | 'labor'>('prices');
  const [localDisplayMode, setLocalDisplayMode] = useState<'USD' | 'IQD' | 'Both'>(displayMode);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync with prop if it changes
  useEffect(() => {
    setLocalDisplayMode(displayMode);
  }, [displayMode]);

  const convert = (val: number, from: 'USD' | 'IQD', to: string) => {
    const toCurrency = to as 'USD' | 'IQD';
    if (from === toCurrency) return val;
    if (from === 'USD' && toCurrency === 'IQD') return val * config.usd_iqd_index;
    if (from === 'IQD' && toCurrency === 'USD') return val / config.usd_iqd_index;
    return val;
  };

  // Time updates
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Click outside handler
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDrop(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Derived rows and FX rates. The bazaar view is entirely config-driven —
  // local_prices and city_rates come from admin configuration, not from the
  // live TradingView spot feed — so we recompute only when those inputs
  // change instead of subscribing to the 2s price tick.
  const { derivedPrices, derivedFxRates } = useMemo(() => {
    if (!selectedCity) {
      return { derivedPrices: [] as any[], derivedFxRates: [] as any[] };
    }

    const cityRate = config.city_rates[selectedCity];
    const rates = cityRate ? [{
      city: selectedCity,
      pair: 'USD/IQD',
      bid: cityRate.bid,
      ask: cityRate.ask,
      type: 'Spot',
      transfer_fees: cityRate.transfer_fees,
    }] : [];

    const goldRows = Object.entries(config.local_prices.Gold).map(([karat, p]) => {
      const pricesData = p as { bid_iqd: number; ask_iqd: number };
      return {
        name: `Gold ${karat}`,
        bid: pricesData.bid_iqd,
        ask: pricesData.ask_iqd,
        spread: pricesData.ask_iqd - pricesData.bid_iqd,
        unit: 'Gram',
        group: 'gold',
      };
    });

    const silverRows = Object.entries(config.local_prices.Silver).map(([purity, p]) => {
      const pricesData = p as { bid_iqd: number; ask_iqd: number };
      return {
        name: `Silver ${purity}`,
        bid: pricesData.bid_iqd,
        ask: pricesData.ask_iqd,
        spread: pricesData.ask_iqd - pricesData.bid_iqd,
        unit: 'Gram',
        group: 'silver',
      };
    });

    return { derivedPrices: [...goldRows, ...silverRows], derivedFxRates: rates };
  }, [selectedCity, config]);

  useEffect(() => {
    setPrices(derivedPrices);
    setFxRates(derivedFxRates);

    if (!selectedCity) return;
    setIsRefreshing(true);
    const t = setTimeout(() => setIsRefreshing(false), 500);
    return () => clearTimeout(t);
  }, [derivedPrices, derivedFxRates, selectedCity]);

  const clearCity = useCallback(() => {
    setSelectedCity(null);
    setCitySearch('');
    setPrices([]);
    setFxRates([]);
  }, []);

  const citiesFromConfig = Object.keys(config.city_rates);
  const filtered = useMemo(() => 
    citiesFromConfig.filter(c => 
      c.toLowerCase().includes(citySearch.toLowerCase()) && c !== selectedCity
    ), [citiesFromConfig, citySearch, selectedCity]
  );

  const handleCitySelect = useCallback((city: string) => {
    setSelectedCity(city);
    setCitySearch('');
    setShowDrop(false);
  }, []);

  // Stats for selected city
  const stats = useMemo(() => {
    if (!selectedCity || fxRates.length === 0) return null;
    const rate = fxRates[0];
    const avgPrice = prices.length > 0 
      ? prices.reduce((sum, p) => sum + (p.bid + p.ask) / 2, 0) / prices.length 
      : 0;
    return {
      usdRate: rate.bid,
      avgMetalPrice: avgPrice,
      totalOffers: prices.length,
      spread: prices.reduce((sum, p) => sum + p.spread, 0) / (prices.length || 1)
    };
  }, [selectedCity, fxRates, prices]);

  /* ─── city search bar ───────────────────────────────────────────────── */
  const CitySearch = () => (
    <div ref={searchRef} className="relative w-full mb-6">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
        <Input
          placeholder="Search for a city..."
          value={citySearch}
          onFocus={() => setShowDrop(true)}
          onChange={e => { setCitySearch(e.target.value); setShowDrop(true); }}
          className="w-full h-12 pl-9 pr-9 rounded-xl bg-card border-border text-sm
                     focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary
                     transition-all shadow-sm"
        />
        {selectedCity && (
          <button onClick={clearCity}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground
                       transition-colors p-1 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {selectedCity && !showDrop && (
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-primary
                        bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 animate-in fade-in slide-in-from-top-2">
          <MapPin className="w-3.5 h-3.5" />
          {selectedCity}
          <button onClick={clearCity} className="ml-1 hover:text-primary/70">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      {showDrop && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border
                        rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
            {filtered.map(city => (
              <button key={city}
                onClick={() => handleCitySelect(city)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold
                           hover:bg-muted/40 transition-all group text-left">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10">
                  <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="group-hover:text-primary transition-colors flex-1">{city}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ─── empty state ───────────────────────────────────────────────────── */
  const NoCityState = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl
                    border-2 border-dashed border-border bg-gradient-to-b from-muted/5 to-muted/10 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 
                        border border-primary/20 flex items-center justify-center shadow-lg">
          <MapPin className="w-8 h-8 text-primary/40" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-lg font-black">Select a City</p>
        <p className="text-xs text-muted-foreground">Search above to load local market prices and rates</p>
      </div>
    </div>
  );

  /* ─── stats bar ──────────────────────────────────────────────────────── */
  const StatsBar = () => {
    if (!selectedCity || !stats) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard title="Avg Metal Price" value={`${convert(stats.avgMetalPrice, 'IQD', localDisplayMode === 'Both' ? 'IQD' : localDisplayMode).toLocaleString(undefined, { maximumFractionDigits: localDisplayMode === 'USD' ? 2 : 0 })} ${localDisplayMode === 'Both' ? 'IQD' : localDisplayMode}`} icon={Gem} />
        <StatCard title="Active Metals" value={stats.totalOffers} icon={CircleDot} />
        <StatCard title="Avg Spread" value={convert(stats.spread, 'IQD', localDisplayMode === 'Both' ? 'IQD' : localDisplayMode).toLocaleString(undefined, { maximumFractionDigits: localDisplayMode === 'USD' ? 2 : 0 })} icon={Gauge} />
      </div>
    );
  };

  /* ─── the core centered panel ───────────────────────────────────────── */
  const Panel = () => (
    <div className="w-full max-w-[540px] sm:max-w-2xl xl:max-w-4xl 2xl:max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-card border border-border rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Updating...</span>
          </div>
        </div>
      )}

      <div className="w-full">
        {/* 1 ── Search Bar */}
        <CitySearch />

        {/* 2 ── Syndicate / Labor toggle */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center bg-muted/40 border border-border rounded-full p-1 gap-1 shadow-inner w-full max-sm:max-w-md">
            <button
              onClick={() => setView('prices')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[11px] sm:text-[13px] font-black uppercase tracking-widest transition-all duration-300 ${
                view === 'prices'
                  ? 'bg-background shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-foreground border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Syndicate Prices
            </button>
            <button
              onClick={() => setView('labor')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[11px] sm:text-[13px] font-black uppercase tracking-widest transition-all duration-300 ${
                view === 'labor'
                  ? 'bg-background shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-foreground border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Labor Cost
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center bg-muted/40 border border-border rounded-lg p-1 gap-1 shadow-inner">
            {(['IQD', 'USD', 'Both'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setLocalDisplayMode(m)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                  localDisplayMode === m
                    ? 'bg-background shadow-sm text-foreground border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-full">
          {/* Hidden TabsList to manage state via custom buttons */}
          <TabsList className="hidden">
            <TabsTrigger value="prices">Prices</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
          </TabsList>

          {/* ── PRICES ──────────────────────────────────────────────────── */}
          <TabsContent value="prices" className="mt-0">
            {!selectedCity ? <NoCityState /> : (
              <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
                <div className="grid grid-cols-12 px-4 sm:px-5 py-2.5 bg-muted/40 border-b border-border text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <div className={localDisplayMode === 'Both' ? 'col-span-4' : 'col-span-6'}>Instrument</div>
                  {localDisplayMode !== 'Both' ? (
                    <>
                      <div className="col-span-3 text-right">Bid ({localDisplayMode})</div>
                      <div className="col-span-3 text-right">Ask ({localDisplayMode})</div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 text-right">Bid (IQD)</div>
                      <div className="col-span-2 text-right">Ask (IQD)</div>
                      <div className="col-span-2 text-right">Bid (USD)</div>
                      <div className="col-span-2 text-right">Ask (USD)</div>
                    </>
                  )}
                </div>
                <div className="divide-y divide-border/40">
                  {['gold', 'silver'].map(grp => {
                    const rows = prices.filter(p => p.group === grp);
                    if (!rows.length) return null;
                    return (
                      <React.Fragment key={grp}>
                        <div className="px-4 py-2 bg-muted/10 border-b border-border/40">
                          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 flex items-center gap-2">
                            <Gem className="w-3 h-3" />
                            {grp.charAt(0).toUpperCase() + grp.slice(1)} Market
                          </div>
                        </div>
                        {rows.map((item, i) => (
                          <div key={i} className="grid grid-cols-12 px-4 sm:px-5 py-3.5 items-center hover:bg-muted/20 transition-colors group">
                            <div className={localDisplayMode === 'Both' ? 'col-span-4 flex flex-col' : 'col-span-6 flex flex-col'}>
                              <span className="font-bold text-xs sm:text-sm tracking-tight group-hover:text-primary transition-colors">{item.name.toUpperCase()}</span>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                <span>Spr: {localDisplayMode === 'Both' 
                                  ? Math.round(item.ask - item.bid).toLocaleString() 
                                  : convert(item.ask - item.bid, 'IQD', localDisplayMode).toLocaleString(undefined, { maximumFractionDigits: localDisplayMode === 'USD' ? 2 : 0 })}
                                </span>
                                <span className="text-primary/40">•</span>
                                <span>{item.unit}</span>
                              </div>
                            </div>
                            {localDisplayMode !== 'Both' ? (
                              <>
                                <div className="col-span-3 text-right">
                                  <AnimatedNumber value={convert(item.bid, 'IQD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-emerald-500" />
                                </div>
                                <div className="col-span-3 text-right">
                                  <AnimatedNumber value={convert(item.ask, 'IQD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-rose-500" />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="col-span-2 text-right">
                                  <AnimatedNumber value={item.bid} isUSD={false} className="text-xs sm:text-sm text-emerald-500" />
                                </div>
                                <div className="col-span-2 text-right">
                                  <AnimatedNumber value={item.ask} isUSD={false} className="text-xs sm:text-sm text-rose-500" />
                                </div>
                                <div className="col-span-2 text-right">
                                  <AnimatedNumber value={convert(item.bid, 'IQD', 'USD')} isUSD={true} className="text-xs sm:text-sm text-emerald-500/80" />
                                </div>
                                <div className="col-span-2 text-right">
                                  <AnimatedNumber value={convert(item.ask, 'IQD', 'USD')} isUSD={true} className="text-xs sm:text-sm text-rose-500/80" />
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── LABOR ───────────────────────────────────────────────────── */}
          <TabsContent value="labor" className="mt-0">
            {!selectedCity ? <NoCityState /> : (
              <div className="w-full rounded-xl border border-border overflow-hidden bg-card shadow-sm overflow-x-auto">
                <div className={localDisplayMode === 'Both' ? 'min-w-[800px]' : 'min-w-[500px]'}>
                  <div className="grid grid-cols-12 px-4 py-3 bg-muted/40 border-b border-border text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    <div className={localDisplayMode === 'Both' ? 'col-span-4' : 'col-span-4'}>Metal Type</div>
                    {LABOR_ORIGINS.map(o => (
                      <div key={o.key} className={localDisplayMode === 'Both' ? 'col-span-2 text-right' : 'col-span-2 text-right'}>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm">{o.flag}</span>
                          <span className="text-[10px]">{o.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Gold Row */}
                  <div className="grid grid-cols-12 px-4 py-4 border-b border-border/40 hover:bg-muted/10 transition-colors group items-center">
                    <div className={localDisplayMode === 'Both' ? 'col-span-4' : 'col-span-4'}>
                      <div className="text-sm font-black text-amber-500 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Gold
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">All karats · per gram</div>
                    </div>
                    {LABOR_ORIGINS.map(o => (
                      <div key={o.key} className={localDisplayMode === 'Both' ? 'col-span-2 text-right' : 'col-span-2 text-right'}>
                        <div className="text-sm font-black font-mono" style={{ color: o.color }}>
                          {localDisplayMode !== 'Both' ? (
                            convert(GOLD_LABOR[o.key], 'IQD', localDisplayMode).toLocaleString(undefined, { maximumFractionDigits: localDisplayMode === 'USD' ? 2 : 0 })
                          ) : (
                            <div className="flex flex-col">
                              <span>{GOLD_LABOR[o.key].toLocaleString()} IQD</span>
                              <span className="text-[10px] opacity-70">{(GOLD_LABOR[o.key] / config.usd_iqd_index).toFixed(2)} USD</span>
                            </div>
                          )}
                        </div>
                        {localDisplayMode !== 'Both' && <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{localDisplayMode}/g</div>}
                      </div>
                    ))}
                  </div>
                  
                  {/* Silver Row */}
                  <div className="grid grid-cols-12 px-4 py-4 hover:bg-muted/10 transition-colors group items-center">
                    <div className={localDisplayMode === 'Both' ? 'col-span-4' : 'col-span-4'}>
                      <div className="text-sm font-black text-slate-400 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        Silver 925
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">Sterling · per gram</div>
                    </div>
                    {LABOR_ORIGINS.map(o => (
                      <div key={o.key} className={localDisplayMode === 'Both' ? 'col-span-2 text-right' : 'col-span-2 text-right'}>
                        <div className="text-sm font-black font-mono" style={{ color: o.color }}>
                          {localDisplayMode !== 'Both' ? (
                            convert(SILVER_LABOR[o.key], 'IQD', localDisplayMode).toLocaleString(undefined, { maximumFractionDigits: localDisplayMode === 'USD' ? 2 : 0 })
                          ) : (
                            <div className="flex flex-col">
                              <span>{SILVER_LABOR[o.key].toLocaleString()} IQD</span>
                              <span className="text-[10px] opacity-70">{(SILVER_LABOR[o.key] / config.usd_iqd_index).toFixed(2)} USD</span>
                            </div>
                          )}
                        </div>
                        {localDisplayMode !== 'Both' && <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{localDisplayMode}/g</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     embedded = true  → just the centered panel, no header/ticker
     embedded = false → full standalone page with header + ticker
  ════════════════════════════════════════════════════════════════════════ */
  if (embedded) {
    return <Panel />;
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/5">
      <style>{`
        @keyframes bazaar-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Standalone header */}
      <div className="w-full flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0
                      bg-gradient-to-r from-background to-muted/5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-0.5 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            IQEX - Iraqi Precious Metals Exchange
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight leading-none bg-gradient-to-r from-foreground to-primary/60 bg-clip-text text-transparent">
            Bazaar
          </h1>
        </div>
        <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Market
          </span>
        </div>
      </div>

      <div className="flex-1">
        <Panel />
      </div>

      <div className="w-full py-5 border-t border-border text-center flex-shrink-0
                      text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-40
                      bg-gradient-to-r from-transparent via-muted/5 to-transparent">
        Official Market Data · IQEX Execution Desk · Updated Real-Time
      </div>
    </div>
  );
};