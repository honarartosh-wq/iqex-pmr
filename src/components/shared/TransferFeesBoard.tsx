import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Clock, MapPin, ArrowLeftRight, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketConfig } from '../../types';
import { Badge } from '../ui/badge';

const FeeValue = ({ value }: { value: number }) => {
  const isNegative = value < 0;
  return (
    <div className={`font-mono font-bold text-lg tabular-nums ${isNegative ? 'text-rose-500' : 'text-primary'}`}>
      {isNegative ? '' : '$'}{value.toLocaleString()}
      {isNegative && <span className="ml-1 text-[10px] uppercase">Credit</span>}
    </div>
  );
};

export const TransferFeesBoard: React.FC<{ config: MarketConfig }> = ({ config }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rates = Object.entries(config.city_rates).map(([city, d]) => {
    const data = d as { 
      bid: number; 
      ask: number; 
      transfer_fees: { 
        [country: string]: { to_usd: number; from_usd: number } 
      } 
    };
    return {
      city,
      transfer_fees: data.transfer_fees
    };
  });

  return (
    <div className="w-full space-y-4 max-w-4xl mx-auto">
      <div className="px-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Transfer Fees</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">MT5 Style Market Overview</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString([], { hour12: false })}
            </div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1 tracking-widest">Live Execution</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-xl border border-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-3 bg-muted/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="col-span-4">Market / City</div>
          <div className="col-span-4 text-center">To USD (Fee)</div>
          <div className="col-span-4 text-right">From USD (Fee)</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {rates.map((rate, idx) => (
            <div key={idx} className="group">
              <div className="px-4 py-2 bg-muted/20 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{rate.city}</span>
              </div>
              
              {Object.entries(rate.transfer_fees).map(([country, fees], fIdx) => (
                <div key={country} className={`grid grid-cols-12 px-4 py-4 items-center hover:bg-muted/40 transition-colors ${fIdx !== Object.entries(rate.transfer_fees).length - 1 ? 'border-b border-border/30' : ''}`}>
                  <div className="col-span-4 flex flex-col">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-bold text-sm tracking-tight">{country}</span>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase mt-0.5">Standard $10k</span>
                  </div>
                  
                  <div className="col-span-4 flex flex-col items-center">
                    <FeeValue value={fees.to_usd} />
                    <div className="flex items-center gap-1 mt-0.5">
                      {fees.to_usd < 0 ? <TrendingDown className="w-2.5 h-2.5 text-rose-500" /> : <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />}
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Rate A</span>
                    </div>
                  </div>
                  
                  <div className="col-span-4 flex flex-col items-right text-right">
                    <FeeValue value={fees.from_usd} />
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      {fees.from_usd < 0 ? <TrendingDown className="w-2.5 h-2.5 text-rose-500" /> : <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />}
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Rate B</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="p-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">IQEX Execution Engine</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold leading-relaxed opacity-60">
          Negative fees indicate a credit to the trader account. <br />
          All rates are subject to market volatility and liquidity.
        </p>
      </div>
    </div>
  );
};
