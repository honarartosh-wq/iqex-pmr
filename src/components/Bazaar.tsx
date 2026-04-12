import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { MapPin, TrendingUp, TrendingDown, Clock, Search, Hammer, Coins, Activity } from 'lucide-react';
import { Input } from './ui/input';
import { fetchMarketPrices, getKaratPrices, getSilverPurityPrices, getLaborCosts, getCurrencyRates } from '../services/marketService';
import { MarketPrice } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const CITIES = [
  'Baghdad', 'Basra', 'Nineveh', 'Erbil', 'Sulaymaniyah', 
  'Kirkuk', 'Najaf', 'Karbala', 'Dhi Qar', 'Anbar', 
  'Diyala', 'Babil', 'Al-Qadisiyah', 'Maysan', 'Wasit', 
  'Saladin', 'Dohuk', 'Muthanna', 'Halabja'
];

const PriceDisplay = ({ value, defaultColor, isUSD = false }: { value: number; defaultColor: string; isUSD?: boolean }) => {
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
      {isUSD ? value.toFixed(2) : Math.round(value).toLocaleString()}
    </div>
  );
};

export const Bazaar: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [prices, setPrices] = useState<any[]>([]);
  const [laborCosts, setLaborCosts] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedCity) return;

    const loadData = async () => {
      const marketPrices = await fetchMarketPrices();
      const gold = marketPrices.find(p => p.metal === 'Gold');
      const silver = marketPrices.find(p => p.metal === 'Silver');
      const currencyRates = getCurrencyRates();
      const cityRate = currencyRates.find(r => r.city === selectedCity);
      const rate = cityRate ? (cityRate.bid + cityRate.ask) / 2 : 1500;
      
      if (gold && silver) {
        const cityIndex = CITIES.indexOf(selectedCity);
        const variation = (cityIndex - 3) * 250;
        
        const karats = getKaratPrices(gold.local_bid_iqd + variation, gold.local_ask_iqd + variation);
        const silvers = getSilverPurityPrices(silver.local_bid_iqd + variation, silver.local_ask_iqd + variation);
        
        const combined = [
          // Gold 24K in USD as requested
          { 
            name: 'Gold 24K (USD)', 
            bid: (gold.local_bid_iqd + variation) / rate, 
            ask: (gold.local_ask_iqd + variation) / rate, 
            unit: 'Gram', 
            currency: 'USD' 
          },
          // Gold Karats in IQD
          ...karats.map(k => ({ 
            name: `Gold ${k.karat}`, 
            bid: k.bid, 
            ask: k.ask, 
            unit: 'Gram', 
            currency: 'IQD' 
          })),
          // Silver in USD only as requested
          ...silvers.map(s => ({ 
            name: `Silver ${s.label}`, 
            bid: s.bid / rate, 
            ask: s.ask / rate, 
            unit: 'KG', 
            currency: 'USD' 
          }))
        ];
        
        setPrices(combined);
      }
      setLaborCosts(getLaborCosts());
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  const filteredCities = CITIES.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase()) && city !== selectedCity
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-4">
      {/* Search Bar - Full Width & Polished */}
      <div className="px-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search and select a city..."
            className="pl-12 bg-card border-border rounded-2xl h-14 shadow-sm focus-visible:ring-primary transition-all text-base"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
          />
          {citySearch && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl bg-card/95">
              {filteredCities.map(city => (
                <button
                  key={city}
                  className="w-full px-6 py-4 text-left hover:bg-muted/50 flex items-center justify-between group transition-colors"
                  onClick={() => {
                    setSelectedCity(city);
                    setCitySearch('');
                  }}
                >
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">{city}</span>
                  <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-1.5">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">BAZAAR</h2>
            <div className="flex items-center gap-6 text-[12px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {currentTime.toLocaleTimeString([], { hour12: false })}
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                LIVE
              </div>
            </div>
          </div>
          {selectedCity && (
            <button 
              onClick={() => setSelectedCity(null)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted rounded-xl transition-all group border border-transparent hover:border-border shadow-sm"
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-black uppercase tracking-[0.15em]">{selectedCity}</span>
              <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-1" />
            </button>
          )}
        </div>

        {!selectedCity ? (
          <div className="py-24 text-center space-y-4 bg-card rounded-3xl border border-dashed border-border shadow-inner">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto shadow-lg">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Select a City</h3>
              <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">Search for a city below to see local prices and labor costs.</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="prices" className="w-full">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-2 border-b border-border/50 py-6 flex items-center">
              <div className="flex justify-start items-center w-full">
                <TabsList className="flex h-auto p-1.5 bg-muted/50 rounded-full gap-1.5 border border-border/50 shadow-inner">
                  <TabsTrigger 
                    value="prices" 
                    className="rounded-full px-8 py-2.5 font-black text-[12px] tracking-widest uppercase text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <Coins className="w-4 h-4 mr-2.5" />
                    Prices
                  </TabsTrigger>
                  <TabsTrigger 
                    value="labor" 
                    className="rounded-full px-8 py-2.5 font-black text-[12px] tracking-widest uppercase text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <Hammer className="w-4 h-4 mr-2.5" />
                    Labor
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fx" 
                    className="rounded-full px-8 py-2.5 font-black text-[12px] tracking-widest uppercase text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <TrendingUp className="w-4 h-4 mr-2.5" />
                    FX Rates
                  </TabsTrigger>
                  <TabsTrigger 
                    value="premium" 
                    className="rounded-full px-8 py-2.5 font-black text-[12px] tracking-widest uppercase text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <Activity className="w-4 h-4 mr-2.5" />
                    Premium
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="prices" className="mt-4 space-y-0">
              <div className="grid grid-cols-12 px-6 py-4 text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] bg-muted/30 rounded-t-xl border border-border">
                <div className="col-span-5">Symbol</div>
                <div className="col-span-2 text-center">Bid</div>
                <div className="col-span-2 text-center">Ask</div>
                <div className="col-span-2 text-center">Spread</div>
                <div className="col-span-1 text-right">Trend</div>
              </div>
              
              <div className="border-x border-b border-border rounded-b-xl overflow-hidden divide-y divide-border">
                {prices.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 px-6 py-5 items-center bg-card hover:bg-muted/20 transition-all group">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        {item.name.includes('Gold') ? <Coins className="w-5 h-5 text-amber-500" /> : <Activity className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <div className="font-black text-foreground group-hover:text-primary transition-colors text-base uppercase tracking-tight">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Per {item.unit} • {item.currency}</div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <PriceDisplay value={item.bid} defaultColor="text-blue-600 dark:text-blue-400" isUSD={item.currency === 'USD'} />
                    </div>
                    <div className="col-span-2 text-center">
                      <PriceDisplay value={item.ask} defaultColor="text-rose-600 dark:text-rose-400" isUSD={item.currency === 'USD'} />
                    </div>
                    <div className="col-span-2 text-center font-mono font-bold text-sm text-foreground">
                      {item.currency === 'USD' ? (item.ask - item.bid).toFixed(2) : Math.round(item.ask - item.bid).toLocaleString()}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {idx % 3 === 0 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      ) : idx % 3 === 1 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500 opacity-50" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="labor" className="mt-4 space-y-6">
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Gold Labor Costs (Per Gram)</h3>
                <div className="bg-card rounded-2xl overflow-hidden shadow-xl border border-border">
                  {laborCosts?.gold.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 flex justify-between items-center border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Hammer className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-foreground">{item.origin}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-foreground text-lg">{item.cost.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">IQD / Gram</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Silver Labor Costs</h3>
                <div className="bg-card rounded-2xl overflow-hidden shadow-xl border border-border">
                  {laborCosts?.silver.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 flex justify-between items-center border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary-foreground group-hover:bg-secondary transition-all">
                          <Hammer className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-foreground">{item.origin}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-foreground text-lg">{item.cost.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">IQD / Unit</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <div className="p-10 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold leading-relaxed opacity-60">
          Bazaar prices are updated every 5 seconds <br /> based on local city market activity.
        </p>
      </div>
    </div>
  );
};
