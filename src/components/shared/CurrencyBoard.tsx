import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, MapPin, DollarSign } from 'lucide-react';
import { MarketConfig } from '../../types';

const PriceDisplay = ({ value, defaultColor }: { value: number; defaultColor: string }) => {
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value > prevValue.current) {
      setFlashColor('text-emerald-500');
      const timer = setTimeout(() => setFlashColor(null), 1000);
      return () => clearTimeout(timer);
    } else if (value < prevValue.current) {
      setFlashColor('text-rose-500');
      const timer = setTimeout(() => setFlashColor(null), 1000);
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value]);

  return (
    <div className={`font-mono font-bold text-xl transition-colors duration-300 ${flashColor || defaultColor}`}>
      {Math.round(value).toLocaleString()}
    </div>
  );
};

export const CurrencyBoard: React.FC<{ config: MarketConfig }> = ({ config }) => {
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
      bid: data.bid,
      ask: data.ask,
      transfer_fees: data.transfer_fees
    };
  });

  return (
    <div className="w-full space-y-4">
      <div className="px-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">USD / IQD</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Exchange Rates</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString([], { hour12: false })}
            </div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1 tracking-widest">Market Open</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
        <div className="grid grid-cols-3 px-4 md:px-6 py-4 bg-muted/50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          <span>City</span>
          <span className="text-center">Bid</span>
          <span className="text-right">Ask</span>
        </div>

        <div className="divide-y divide-border">
          {rates.map((rate, idx) => (
            <div key={idx} className="grid grid-cols-3 px-4 md:px-6 py-5 items-center hover:bg-muted/30 transition-all group">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-muted items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors text-xs md:text-sm truncate">{rate.city}</span>
                </div>
              </div>
              
              <div className="flex justify-center">
                <PriceDisplay value={rate.bid} defaultColor="text-blue-500 dark:text-blue-400" />
              </div>
              
              <div className="flex justify-end">
                <PriceDisplay value={rate.ask} defaultColor="text-red-500 dark:text-red-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
          <DollarSign className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Official Index Rate: {config.usd_iqd_index.toLocaleString()} IQD</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold leading-relaxed opacity-60">
          Parallel market rates are updated in real-time <br /> based on admin configuration.
        </p>
      </div>
    </div>
  );
};
