import React, { useState, useEffect, useRef } from 'react';
import { MarketPrice } from '../types';
import { fetchMarketPrices, calculateIraqiIndex, getKaratPrices, getSilverPurityPrices } from '../services/marketService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const PriceDisplay = ({ value, defaultColor }: { value: number, defaultColor: string }) => {
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

export const MarketBoard: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchMarketPrices();
      setPrices(data);
      setIndex(calculateIraqiIndex(data));
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Faster updates for MT5 feel
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  if (loading) return <div className="p-8 text-center">Loading market data...</div>;

  const goldPrice = prices.find(p => p.metal === 'Gold');
  const silverPrice = prices.find(p => p.metal === 'Silver');

  return (
    <div className="w-full">
      {/* Header Info - Split Terminal Style */}
      <div className="flex items-center justify-between px-2 py-4 border-b border-border bg-muted/5 mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black uppercase tracking-tighter">Quotes</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
            Live
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-0.5">Index</p>
            <p className="text-sm font-bold tabular-nums text-primary">{index.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-0.5">Server Time</p>
            <div className="flex items-center gap-1 text-sm font-bold tabular-nums">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {currentTime.toLocaleTimeString([], { hour12: false })}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="local" className="w-full">
        {/* Navigation Buttons - Sticky and Left-Aligned */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-2 border-b border-border/50 flex items-center w-[283px] h-[50px]">
          <TabsList className="flex h-auto p-1 bg-muted/50 rounded-full gap-1">
            <TabsTrigger 
              value="local" 
              className="rounded-full px-6 py-2 font-black text-[10px] tracking-widest uppercase text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              LOCAL (IQD)
            </TabsTrigger>
            <TabsTrigger 
              value="global" 
              className="rounded-full px-6 py-2 font-black text-[10px] tracking-widest uppercase text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              GLOBAL (USD)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="local" className="mt-6 space-y-1">
          {/* Gold Karats Section */}
          <div className="px-3 py-1.5 bg-muted/30 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] rounded-t-lg flex justify-between border-x border-t border-border mt-4">
            <span>Gold (Per Gram)</span>
            <div className="flex gap-12 mr-4">
              <span>Bid</span>
              <span>Ask</span>
            </div>
          </div>
          {goldPrice && getKaratPrices(goldPrice.local_bid_iqd, goldPrice.local_ask_iqd).map((k) => (
            <div key={k.karat} className="flex items-center justify-between p-3 bg-card border border-border hover:bg-muted/30 transition-all group">
              <div className="flex-1">
                <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">GOLD.{k.karat}</div>
                <div className="text-[9px] text-muted-foreground font-bold flex gap-2 uppercase tracking-wider">
                  <span>Spread: {Math.round(k.ask - k.bid)}</span>
                </div>
              </div>
              <div className="flex gap-6">
                <PriceDisplay value={k.bid} defaultColor="text-blue-500 dark:text-blue-400" />
                <PriceDisplay value={k.ask} defaultColor="text-red-500 dark:text-red-400" />
              </div>
            </div>
          ))}

          {/* Silver Section */}
          <div className="px-3 py-1.5 mt-4 bg-muted/30 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] rounded-t-lg flex justify-between border-x border-t border-border">
            <span>Silver (Per KG)</span>
            <div className="flex gap-12 mr-4">
              <span>Bid</span>
              <span>Ask</span>
            </div>
          </div>
          {silverPrice && getSilverPurityPrices(silverPrice.local_bid_iqd, silverPrice.local_ask_iqd).map((s) => (
            <div key={s.label} className="flex items-center justify-between p-3 bg-card border border-border hover:bg-muted/30 transition-all group">
              <div className="flex-1">
                <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">SILVER.{s.label.split(' ')[0]}</div>
                <div className="text-[9px] text-muted-foreground font-bold flex gap-2 uppercase tracking-wider">
                  <span>Spread: {Math.round(s.ask - s.bid)}</span>
                </div>
              </div>
              <div className="flex gap-6">
                <PriceDisplay value={s.bid} defaultColor="text-blue-500 dark:text-blue-400" />
                <PriceDisplay value={s.ask} defaultColor="text-red-500 dark:text-red-400" />
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="global" className="mt-6 space-y-1">
          <div className="px-3 py-1.5 bg-muted/30 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] rounded-t-lg flex justify-between border-x border-t border-border mt-4">
            <span>Symbol</span>
            <div className="flex gap-12 mr-4">
              <span>Bid</span>
              <span>Ask</span>
            </div>
          </div>
          {prices.map((price) => (
            <div key={price.metal} className="flex items-center justify-between p-3 bg-card border border-border hover:bg-muted/30 transition-all group">
              <div className="flex-1">
                <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{price.metal.toUpperCase()}</div>
                <div className="text-[9px] font-bold flex gap-2 uppercase tracking-wider">
                  <span className={price.change_24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    {price.change_24h >= 0 ? '+' : ''}{price.change_24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-end">
                  <div className="text-base font-bold text-foreground tabular-nums">${price.global_bid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-[8px] text-muted-foreground font-bold uppercase">L: ${price.low_24h?.toFixed(2)}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-base font-bold text-foreground tabular-nums">${price.global_ask.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-[8px] text-muted-foreground font-bold uppercase">H: ${price.high_24h?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
      
      <div className="p-6 text-center">
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black leading-relaxed opacity-40">
          Market data provided by Iraq Metals Execution Desk <br /> 
          Prices include {goldPrice?.premium}% premium • Updated every 5s
        </p>
      </div>
    </div>
  );
};
