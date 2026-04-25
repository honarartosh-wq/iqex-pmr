import React, { useState, useEffect, useRef } from 'react';
import { MarketPrice, MarketConfig } from '../../types';
import { fetchMarketPrices, calculateIraqiIndex, getKaratPrices, getSilverPurityPrices, recomputeLocalPrices, mapLivePricesToMarketPrices } from '../../services/marketService';
import { tradingViewService } from '../../services/tradingViewService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

/* ─── flash price cell ───────────────────────────────────────────────────── */
const Num = ({
  value = 0, isUSD = false, className = '',
}: { value?: number; isUSD?: boolean; className?: string }) => {
  const [flash, setFlash] = useState<'up'|'down'|null>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    setFlash((value || 0) > (prev.current || 0) ? 'up' : 'down');
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [value]);
  const color = flash === 'up' ? '#4ade80' : flash === 'down' ? '#f87171' : undefined;
  const displayValue = value || 0;
  return (
    <span style={{ color, transition: 'color 0.35s ease' }}
      className={`font-mono font-bold tabular-nums ${className}`}>
      {isUSD ? displayValue.toFixed(displayValue < 10 ? 4 : 2) : Math.round(displayValue).toLocaleString()}
    </span>
  );
};

const LiveTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5" />
      {time.toLocaleTimeString([], { hour12: false })}
    </span>
  );
};

export const MarketBoard: React.FC<{ config: MarketConfig; displayMode?: 'USD' | 'IQD' | 'Both' }> = ({ config, displayMode = 'IQD' }) => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'local'|'global'>('local');
  const [localDisplayMode, setLocalDisplayMode] = useState<'USD' | 'IQD' | 'Both'>(displayMode);

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

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchMarketPrices(config);
      setPrices(data);
      setIndex(calculateIraqiIndex(config));
      setLoading(false);
    };

    loadData();
    
    const unsubscribe = tradingViewService.subscribe((livePrices) => {
      setPrices(mapLivePricesToMarketPrices(config, livePrices));
      setIndex(calculateIraqiIndex(config));
    });
    
    return () => {
      unsubscribe();
    };
  }, [config]);

  /* static ticker fallback */
  const TICKER = [
    { label:'XAU/USD', val:2341.50, isUSD:true,  chg:+0.42 },
    { label:'XAG/USD', val:  28.71, isUSD:true,  chg:-0.18 },
    { label:'XPT/USD', val: 968.00, isUSD:true,  chg:+0.11 },
    { label:'XPD/USD', val: 982.00, isUSD:true,  chg:-0.55 },
    { label:'USD/IQD', val:1306.00, isUSD:false, chg: 0.00 },
    { label:'EUR/USD', val:  1.0852, isUSD:true,  chg:+0.06 },
    { label:'GBP/USD', val:  1.2644, isUSD:true,  chg:-0.09 },
  ];

  if (loading) return <div className="p-8 text-center text-muted-foreground font-bold animate-pulse">Initializing Market Data...</div>;

  const goldPrice = prices.find(p => p.metal === 'Gold');
  const silverPrice = prices.find(p => p.metal === 'Silver');

  // 1 troy oz = 31.1035 g → 1 kg = 1000/31.1035 oz
  const OZ_TO_KG = 1000 / 31.1035;

  // KG spot instruments derived live from TradingView (no premium, pure spot math)
  const kgSpotRows = [
    ...(goldPrice ? [
      {
        label: 'GOLD 24K KG',
        sublabel: '24 Karat · 1 Kilogram',
        bid: goldPrice.global_bid * OZ_TO_KG,
        ask: goldPrice.global_ask * OZ_TO_KG,
        change_24h: goldPrice.change_24h,
      },
      {
        label: 'GOLD 995 BAR',
        sublabel: '99.5% Purity · 1 Kilogram',
        bid: goldPrice.global_bid * OZ_TO_KG * 0.995,
        ask: goldPrice.global_ask * OZ_TO_KG * 0.995,
        change_24h: goldPrice.change_24h,
      },
    ] : []),
    ...(silverPrice ? [
      {
        label: 'SILVER 999.9 KG',
        sublabel: '999.9 Fine · 1 Kilogram',
        bid: silverPrice.global_bid * OZ_TO_KG * 0.9999,
        ask: silverPrice.global_ask * OZ_TO_KG * 0.9999,
        change_24h: silverPrice.change_24h,
      },
    ] : []),
  ];

  const indexMetalPrices = recomputeLocalPrices(config, prices);
  const indexGold = indexMetalPrices.find(p => p.metal === 'Gold');
  const indexSilver = indexMetalPrices.find(p => p.metal === 'Silver');

  const karatPrices = indexGold ? getKaratPrices(indexGold.global_bid, indexGold.global_ask) : [];
  const silverPurityPrices = indexSilver ? getSilverPurityPrices(indexSilver.global_bid, indexSilver.global_ask) : [];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-screen">
      
      {/* 1 ── Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-border gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-0.5">IQEX - Iraqi Precious Metals Exchange</p>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none text-foreground">Quotes</h1>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <div className="text-left sm:text-right">
            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Iraqi Index</p>
            <p className="text-sm font-black text-primary">{index.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-4">
            <LiveTime />
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* 3 ── Local / Global toggle — CENTERED */}
      <div className="flex flex-col items-center gap-4 pt-8 pb-6 px-4">
        <div className="flex items-center bg-muted/40 border border-border rounded-full p-1 gap-1 shadow-inner w-full max-w-sm sm:max-w-md">
          <button
            onClick={() => setView('local')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[11px] sm:text-[13px] font-black uppercase tracking-widest transition-all duration-300 ${
              view === 'local'
                ? 'bg-background shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-foreground border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Local
          </button>
          <button
            onClick={() => setView('global')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[11px] sm:text-[13px] font-black uppercase tracking-widest transition-all duration-300 ${
              view === 'global'
                ? 'bg-background shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-foreground border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Global
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

      {/* 4 ── Price list — CENTERED */}
      <div className="flex-1 px-2 sm:px-4 pb-16 max-w-2xl xl:max-w-4xl 2xl:max-w-6xl mx-auto w-full">
        {view === 'local' ? (
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
              {/* Gold Section */}
              {karatPrices.map((p) => (
                <div key={p.karat} className="grid grid-cols-12 px-4 sm:px-5 py-3.5 items-center hover:bg-muted/20 transition-colors group">
                  <div className={localDisplayMode === 'Both' ? 'col-span-4 flex flex-col' : 'col-span-6 flex flex-col'}>
                    <span className="font-bold text-xs sm:text-sm tracking-tight group-hover:text-primary transition-colors">GOLD.{p.karat}</span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      <span>Spr: {localDisplayMode === 'Both' 
                        ? Math.round(p.ask - p.bid).toLocaleString() 
                        : convert(p.ask - p.bid, 'IQD', localDisplayMode).toLocaleString(undefined, { maximumFractionDigits: localDisplayMode === 'USD' ? 2 : 0 })}
                      </span>
                      <span className="text-primary font-black">INDEX</span>
                    </div>
                  </div>
                  {localDisplayMode !== 'Both' ? (
                    <>
                      <div className="col-span-3 text-right">
                        <Num value={convert(p.bid, 'IQD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-emerald-500" />
                      </div>
                      <div className="col-span-3 text-right">
                        <Num value={convert(p.ask, 'IQD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-rose-500" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 text-right">
                        <Num value={p.bid} isUSD={false} className="text-xs sm:text-sm text-emerald-500" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={p.ask} isUSD={false} className="text-xs sm:text-sm text-rose-500" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={convert(p.bid, 'IQD', 'USD')} isUSD={true} className="text-xs sm:text-sm text-emerald-500/80" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={convert(p.ask, 'IQD', 'USD')} isUSD={true} className="text-xs sm:text-sm text-rose-500/80" />
                      </div>
                    </>
                  )}
                </div>
              ))}
              {/* Silver Section */}
              {silverPurityPrices.map((p) => (
                <div key={p.purity} className="grid grid-cols-12 px-4 sm:px-5 py-3.5 items-center hover:bg-muted/20 transition-colors group">
                  <div className={localDisplayMode === 'Both' ? 'col-span-4 flex flex-col' : 'col-span-6 flex flex-col'}>
                    <span className="font-bold text-xs sm:text-sm tracking-tight group-hover:text-primary transition-colors">SILVER.{p.purity}</span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      <span>Spr: {localDisplayMode === 'Both' 
                        ? Math.round(p.ask - p.bid).toLocaleString() 
                        : convert(p.ask - p.bid, 'IQD', localDisplayMode).toLocaleString(undefined, { maximumFractionDigits: localDisplayMode === 'USD' ? 2 : 0 })}
                      </span>
                      <span className="text-primary font-black">INDEX</span>
                    </div>
                  </div>
                  {localDisplayMode !== 'Both' ? (
                    <>
                      <div className="col-span-3 text-right">
                        <Num value={convert(p.bid, 'IQD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-emerald-500" />
                      </div>
                      <div className="col-span-3 text-right">
                        <Num value={convert(p.ask, 'IQD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-rose-500" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 text-right">
                        <Num value={p.bid} isUSD={false} className="text-xs sm:text-sm text-emerald-500" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={p.ask} isUSD={false} className="text-xs sm:text-sm text-rose-500" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={convert(p.bid, 'IQD', 'USD')} isUSD={true} className="text-xs sm:text-sm text-emerald-500/80" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={convert(p.ask, 'IQD', 'USD')} isUSD={true} className="text-xs sm:text-sm text-rose-500/80" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <div className="grid grid-cols-12 px-4 sm:px-5 py-2.5 bg-muted/40 border-b border-border text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <div className={localDisplayMode === 'Both' ? 'col-span-3' : 'col-span-5'}>Instrument</div>
              {localDisplayMode !== 'Both' ? (
                <>
                  <div className="col-span-3 text-right">Bid ({localDisplayMode})</div>
                  <div className="col-span-3 text-right">Ask ({localDisplayMode})</div>
                </>
              ) : (
                <>
                  <div className="col-span-2 text-right">Bid (USD)</div>
                  <div className="col-span-2 text-right">Ask (USD)</div>
                  <div className="col-span-2 text-right">Bid (IQD)</div>
                  <div className="col-span-2 text-right">Ask (IQD)</div>
                </>
              )}
              <div className="col-span-1 text-right"></div>
            </div>
            <div className="divide-y divide-border/40">
              {/* ── Spot per oz ── */}
              {prices.map((price) => (
                <div key={price.metal} className="grid grid-cols-12 px-4 sm:px-5 py-3.5 items-center hover:bg-muted/20 transition-colors group">
                  <div className={localDisplayMode === 'Both' ? 'col-span-3 flex flex-col' : 'col-span-5 flex flex-col'}>
                    <span className="font-bold text-xs sm:text-sm tracking-tight group-hover:text-primary transition-colors">{price.metal.toUpperCase()} SPOT</span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      <span>L: {convert(price.low_24h || 0, 'USD', localDisplayMode === 'Both' ? 'USD' : localDisplayMode).toFixed(localDisplayMode === 'IQD' ? 0 : 1)}</span>
                      <span>H: {convert(price.high_24h || 0, 'USD', localDisplayMode === 'Both' ? 'USD' : localDisplayMode).toFixed(localDisplayMode === 'IQD' ? 0 : 1)}</span>
                    </div>
                  </div>
                  {localDisplayMode !== 'Both' ? (
                    <>
                      <div className="col-span-3 text-right">
                        <Num value={convert(price.global_bid, 'USD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-emerald-500" />
                      </div>
                      <div className="col-span-3 text-right">
                        <Num value={convert(price.global_ask, 'USD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-rose-500" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 text-right">
                        <Num value={price.global_bid} isUSD={true} className="text-xs sm:text-sm text-emerald-500" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={price.global_ask} isUSD={true} className="text-xs sm:text-sm text-rose-500" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={convert(price.global_bid, 'USD', 'IQD')} isUSD={false} className="text-xs sm:text-sm text-emerald-500/80" />
                      </div>
                      <div className="col-span-2 text-right">
                        <Num value={convert(price.global_ask, 'USD', 'IQD')} isUSD={false} className="text-xs sm:text-sm text-rose-500/80" />
                      </div>
                    </>
                  )}
                  <div className="col-span-1 text-right">
                    <span className={`text-[9px] sm:text-[11px] font-bold flex items-center justify-end ${price.change_24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {price.change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              ))}

              {/* ── Kilogram prices (live spot-derived) ── */}
              {kgSpotRows.length > 0 && (
                <>
                  <div className="px-4 sm:px-5 py-2 bg-muted/10 border-t border-border/60">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Kilogram Prices · Spot Based</span>
                  </div>
                  {kgSpotRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-12 px-4 sm:px-5 py-3.5 items-center hover:bg-muted/20 transition-colors group">
                      <div className={localDisplayMode === 'Both' ? 'col-span-3 flex flex-col' : 'col-span-5 flex flex-col'}>
                        <span className="font-bold text-xs sm:text-sm tracking-tight group-hover:text-primary transition-colors">{row.label}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{row.sublabel}</span>
                      </div>
                      {localDisplayMode !== 'Both' ? (
                        <>
                          <div className="col-span-3 text-right">
                            <Num value={convert(row.bid, 'USD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-emerald-500" />
                          </div>
                          <div className="col-span-3 text-right">
                            <Num value={convert(row.ask, 'USD', localDisplayMode)} isUSD={localDisplayMode === 'USD'} className="text-sm sm:text-base text-rose-500" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-2 text-right">
                            <Num value={row.bid} isUSD={true} className="text-xs sm:text-sm text-emerald-500" />
                          </div>
                          <div className="col-span-2 text-right">
                            <Num value={row.ask} isUSD={true} className="text-xs sm:text-sm text-rose-500" />
                          </div>
                          <div className="col-span-2 text-right">
                            <Num value={convert(row.bid, 'USD', 'IQD')} isUSD={false} className="text-xs sm:text-sm text-emerald-500/80" />
                          </div>
                          <div className="col-span-2 text-right">
                            <Num value={convert(row.ask, 'USD', 'IQD')} isUSD={false} className="text-xs sm:text-sm text-rose-500/80" />
                          </div>
                        </>
                      )}
                      <div className="col-span-1 text-right">
                        <span className={`text-[9px] sm:text-[11px] font-bold flex items-center justify-end ${row.change_24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {row.change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5 ── Footer */}
      <div className="py-8 border-t border-border text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-40">
        Official Market Data · IQEX Execution Desk · Updated Real-Time
      </div>
    </div>
  );
};
