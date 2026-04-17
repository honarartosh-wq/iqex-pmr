import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Globe, ArrowUpDown, Coins, Zap, Info, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { IQEXMetalIndex, IQEXIndexComponent, MarketConfig, Order } from '../../types';
import { calculateIQEXIndexes } from '../../services/marketService';
import { tradingViewService } from '../../services/tradingViewService';

/* ── flash number ───────────────────────────────────────────────────────── */
const FlashNum: React.FC<{ value: number; className?: string; decimals?: number }> = ({
  value, className = '', decimals = 1,
}) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? 'up' : 'down');
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span
      style={{ color: flash === 'up' ? '#4ade80' : flash === 'down' ? '#f87171' : undefined, transition: 'color 0.3s ease' }}
      className={`font-mono font-bold tabular-nums ${className}`}
    >
      {value.toFixed(decimals)}
    </span>
  );
};

/* ── factor row ─────────────────────────────────────────────────────────── */
const FactorRow: React.FC<{ comp: IQEXIndexComponent; color: string }> = ({ comp, color }) => {
  const pct = Math.min(100, Math.max(0, comp.factor * 50));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-muted-foreground">{comp.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/60">{(comp.weight * 100).toFixed(0)}%</span>
          <span className={comp.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
            {comp.change >= 0 ? '+' : ''}{comp.change.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

/* ── mini index card ─────────────────────────────────────────────────────── */
const IndexCard: React.FC<{
  idx: IQEXMetalIndex;
  isSelected: boolean;
  onClick: () => void;
}> = ({ idx, isSelected, onClick }) => {
  const up = idx.change24h >= 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'bg-primary/5 border-primary/40 shadow-md'
          : 'bg-card border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate pr-2">
          {idx.label}
        </span>
        <Badge
          className={`text-[8px] h-4 px-1.5 shrink-0 ${up ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}
          variant="outline"
        >
          {up ? <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5 inline" />}
          {up ? '+' : ''}{idx.change24h.toFixed(2)}%
        </Badge>
      </div>
      <FlashNum value={idx.indexValue} className={`text-xl ${isSelected ? 'text-primary' : 'text-foreground'}`} />
      <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider font-bold">IQEX Points</p>
    </button>
  );
};

/* ── factor colors ──────────────────────────────────────────────────────── */
const FACTOR_COLORS = {
  globalPrice:  '#f59e0b',
  exchangeRate: '#3b82f6',
  localPremium: '#8b5cf6',
  supplyDemand: '#22c55e',
  hawalaCosts:  '#64748b',
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
interface IraqiMarketIndexProps {
  config: MarketConfig;
  orders: Order[];
}

export const IraqiMarketIndex: React.FC<IraqiMarketIndexProps> = ({ config, orders }) => {
  const [indexes, setIndexes] = useState<IQEXMetalIndex[]>([]);
  const [selected, setSelected] = useState<string>('gold-24k');
  const [time, setTime] = useState(new Date());
  const [showFormula, setShowFormula] = useState(false);

  const activeOrderCount = orders.filter(o => o.status === 'Open').length;

  const refresh = () => {
    const result = calculateIQEXIndexes(config, activeOrderCount);
    setIndexes(result);
  };

  useEffect(() => {
    refresh();
    const unsub = tradingViewService.subscribe(() => refresh());
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => { unsub(); clearInterval(clock); };
  }, [config, activeOrderCount]);

  const selectedIndex = indexes.find(i => i.id === selected);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-border gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-0.5">Iraq Precious Metals Exchange</p>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none text-foreground">
            Market Indexes
          </h1>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {time.toLocaleTimeString([], { hour12: false })}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <button
            onClick={() => setShowFormula(v => !v)}
            className="flex items-center gap-1.5 text-primary/70 hover:text-primary transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            Formula
          </button>
        </div>
      </div>

      {/* Formula info banner */}
      <AnimatePresence>
        {showFormula && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-6 mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-primary">IQEX Index Calculation Formula</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                IQEX = 1000 × (0.50 × <span style={{ color: FACTOR_COLORS.globalPrice }}>GlobalPrice</span> + 0.20 × <span style={{ color: FACTOR_COLORS.exchangeRate }}>ExchangeRate</span> + 0.15 × <span style={{ color: FACTOR_COLORS.localPremium }}>LocalPremium</span> + 0.10 × <span style={{ color: FACTOR_COLORS.supplyDemand }}>SupplyDemand</span> + 0.05 × <span style={{ color: FACTOR_COLORS.hawalaCosts }}>HawalaCosts</span>)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[9px] font-bold uppercase tracking-wider">
                {[
                  { k: 'globalPrice', label: 'Global Price', pct: '50%' },
                  { k: 'exchangeRate', label: 'Exchange Rate', pct: '20%' },
                  { k: 'localPremium', label: 'Local Premium', pct: '15%' },
                  { k: 'supplyDemand', label: 'Supply/Demand', pct: '10%' },
                  { k: 'hawalaCosts', label: 'Hawala Costs', pct: '5%' },
                ].map(f => (
                  <div key={f.k} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: FACTOR_COLORS[f.k as keyof typeof FACTOR_COLORS] }} />
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="text-foreground font-black">{f.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-4 sm:px-6 py-6 space-y-6 pb-16">

        {/* Index grid cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {indexes.map(idx => (
            <IndexCard
              key={idx.id}
              idx={idx}
              isSelected={selected === idx.id}
              onClick={() => setSelected(idx.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selectedIndex && (
            <motion.div
              key={selectedIndex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden border-border/60">
                {/* Card header band */}
                <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">IQEX Index</p>
                      <h2 className="text-2xl font-black text-foreground">{selectedIndex.label}</h2>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Index Score</p>
                        <FlashNum value={selectedIndex.indexValue} className="text-3xl text-primary" />
                        <p className="text-[9px] text-muted-foreground">pts (base 1,000)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">24h Change</p>
                        <p className={`text-lg font-black flex items-center justify-end gap-1 ${selectedIndex.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {selectedIndex.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {selectedIndex.change24h >= 0 ? '+' : ''}{selectedIndex.change24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 space-y-6">

                  {/* Bid / Ask strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">BID (IQD)</p>
                      <FlashNum value={selectedIndex.bidIQD} className="text-base text-emerald-600" decimals={0} />
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mb-1">ASK (IQD)</p>
                      <FlashNum value={selectedIndex.askIQD} className="text-base text-rose-600" decimals={0} />
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">BID (USD)</p>
                      <FlashNum value={selectedIndex.bidUSD} className="text-base text-emerald-600/70" decimals={2} />
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-600/70 mb-1">ASK (USD)</p>
                      <FlashNum value={selectedIndex.askUSD} className="text-base text-rose-600/70" decimals={2} />
                    </div>
                  </div>

                  {/* 5-factor breakdown */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-4">Index Factor Breakdown</p>
                    <div className="space-y-4">
                      <FactorRow comp={selectedIndex.components.globalPrice}  color={FACTOR_COLORS.globalPrice} />
                      <FactorRow comp={selectedIndex.components.exchangeRate}  color={FACTOR_COLORS.exchangeRate} />
                      <FactorRow comp={selectedIndex.components.localPremium}  color={FACTOR_COLORS.localPremium} />
                      <FactorRow comp={selectedIndex.components.supplyDemand}  color={FACTOR_COLORS.supplyDemand} />
                      <FactorRow comp={selectedIndex.components.hawalaCosts}   color={FACTOR_COLORS.hawalaCosts} />
                    </div>
                  </div>

                  {/* Weighted contribution donut-like visualization */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Weighted Contributions</p>
                    <div className="h-3 rounded-full overflow-hidden flex">
                      {(
                        [
                          { comp: selectedIndex.components.globalPrice,  color: FACTOR_COLORS.globalPrice },
                          { comp: selectedIndex.components.exchangeRate,  color: FACTOR_COLORS.exchangeRate },
                          { comp: selectedIndex.components.localPremium,  color: FACTOR_COLORS.localPremium },
                          { comp: selectedIndex.components.supplyDemand,  color: FACTOR_COLORS.supplyDemand },
                          { comp: selectedIndex.components.hawalaCosts,   color: FACTOR_COLORS.hawalaCosts },
                        ] as Array<{ comp: IQEXIndexComponent; color: string }>
                      ).map(({ comp, color }, i) => (
                        <motion.div
                          key={i}
                          className="h-full"
                          style={{ backgroundColor: color }}
                          initial={{ flex: 0 }}
                          animate={{ flex: comp.weight }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                      {[
                        { comp: selectedIndex.components.globalPrice,  color: FACTOR_COLORS.globalPrice },
                        { comp: selectedIndex.components.exchangeRate,  color: FACTOR_COLORS.exchangeRate },
                        { comp: selectedIndex.components.localPremium,  color: FACTOR_COLORS.localPremium },
                        { comp: selectedIndex.components.supplyDemand,  color: FACTOR_COLORS.supplyDemand },
                        { comp: selectedIndex.components.hawalaCosts,   color: FACTOR_COLORS.hawalaCosts },
                      ].map(({ comp, color }) => (
                        <div key={comp.label} className="flex items-center gap-1.5 text-[9px]">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-muted-foreground font-bold uppercase tracking-wider">{comp.label}</span>
                          <span className="font-black">{(comp.weight * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All indexes comparison table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">All IQEX Indexes</p>
            <Badge variant="outline" className="text-[9px] font-bold">{indexes.length} Instruments</Badge>
          </div>
          <div className="divide-y divide-border/40">
            <div className="grid grid-cols-12 px-4 py-2 bg-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              <div className="col-span-3">Metal</div>
              <div className="col-span-2 text-right">Index</div>
              <div className="col-span-2 text-right">Bid (IQD)</div>
              <div className="col-span-2 text-right">Ask (IQD)</div>
              <div className="col-span-2 text-right">24h</div>
              <div className="col-span-1" />
            </div>
            {indexes.map(idx => {
              const up = idx.change24h >= 0;
              return (
                <button
                  key={idx.id}
                  onClick={() => setSelected(idx.id)}
                  className={`w-full grid grid-cols-12 px-4 py-3.5 items-center transition-colors hover:bg-muted/20 text-left ${selected === idx.id ? 'bg-primary/5' : ''}`}
                >
                  <div className="col-span-3">
                    <p className="text-xs font-bold">{idx.label}</p>
                    {idx.purity && <p className="text-[9px] text-muted-foreground uppercase">{idx.metal} {idx.purity}</p>}
                  </div>
                  <div className="col-span-2 text-right">
                    <FlashNum value={idx.indexValue} className="text-sm font-black text-primary" />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-bold font-mono text-emerald-500">
                      {idx.bidIQD.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-bold font-mono text-rose-500">
                      {idx.askIQD.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-[10px] font-black flex items-center justify-end gap-0.5 ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {up ? '+' : ''}{idx.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {selected === idx.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="py-6 border-t border-border text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-40">
        IQEX Index · Iraq Metals Intelligence · Updated Real-Time
      </div>
    </div>
  );
};
