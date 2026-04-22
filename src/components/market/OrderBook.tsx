import React, { useState, useRef, useEffect } from 'react';
import { Order, OrderType, MetalType, MarketConfig } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Search, ArrowUpRight, ArrowDownLeft, ChevronRight, Package, User, MapPin, X, ChevronDown, Clock, TrendingUp, DollarSign, Coins, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

const getTimeRemaining = (expiryTime: string) => {
  const total = Date.parse(expiryTime) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return { total, hours, minutes, seconds };
};

const Countdown = ({ expiryTime }: { expiryTime: string }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(expiryTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(expiryTime);
      setTimeLeft(remaining);
      if (remaining.total <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryTime]);

  if (timeLeft.total <= 0) return <span className="text-rose-500 font-black">EXPIRED</span>;

  return (
    <span className="tabular-nums">
      {timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ''}
      {timeLeft.minutes}m {timeLeft.seconds}s
    </span>
  );
};

interface OrderBookProps {
  orders: Order[];
  config: MarketConfig;
  displayCurrency: 'USD' | 'IQD';
  setDisplayCurrency: (val: 'USD' | 'IQD') => void;
  onSelectOrder: (order: Order) => void;
  disabled?: boolean;
}

export const OrderBook: React.FC<OrderBookProps> = ({ 
  orders, 
  config, 
  displayCurrency,
  setDisplayCurrency,
  onSelectOrder,
  disabled
}) => {
  const [selectedMetal, setSelectedMetal] = useState<MetalType | 'All'>('All');
  const [selectedCity, setSelectedCity] = useState<string | 'All'>('All');
  const [search, setSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDrop, setShowCityDrop] = useState(false);
  const citySearchRef = useRef<HTMLDivElement>(null);

  const metals: (MetalType | 'All')[] = ['All', 'Gold', 'Silver', 'Platinum', 'Palladium'];
  
  // Extract unique cities from orders
  const availableCities = Array.from(new Set<string>(orders.map(o => o.location))).sort();
  const filteredCities = availableCities.filter(c => 
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citySearchRef.current && !citySearchRef.current.contains(event.target as Node)) {
        setShowCityDrop(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOrders = orders.filter(order => {
    // Only show tradable orders in the book
    if (order.status !== 'Open' && order.status !== 'Negotiating') return false;

    // Filter out expired orders
    if (order.pricing_model === 'Fixed' && order.expiry_time) {
      if (Date.parse(order.expiry_time) <= Date.now()) return false;
    }

    const matchesMetal = selectedMetal === 'All' || order.metal === selectedMetal;
    const matchesCity = selectedCity === 'All' || order.location === selectedCity;
    const matchesSearch = order.trader_name.toLowerCase().includes(search.toLowerCase()) ||
                         order.location.toLowerCase().includes(search.toLowerCase());
    return matchesMetal && matchesCity && matchesSearch;
  });

  const convertPrice = (price: number, from: 'USD' | 'IQD', to: 'USD' | 'IQD') => {
    if (from === to) return price;
    if (from === 'USD' && to === 'IQD') return price * config.usd_iqd_index;
    if (from === 'IQD' && to === 'USD') return price / config.usd_iqd_index;
    return price;
  };

  return (
    <div className="w-full space-y-4">
      <div className="px-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Market Orders</h2>
          <div className="flex items-center gap-4">
            {/* Currency Toggle */}
            <div className="flex items-center bg-muted/40 border border-border rounded-full p-1 gap-1 shadow-inner">
              <button
                onClick={() => setDisplayCurrency('IQD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  displayCurrency === 'IQD'
                    ? 'bg-background shadow-sm text-foreground border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Coins className="w-3 h-3" />
                IQD
              </button>
              <button
                onClick={() => setDisplayCurrency('USD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  displayCurrency === 'USD'
                    ? 'bg-background shadow-sm text-foreground border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                USD
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(selectedMetal !== 'All' || selectedCity !== 'All' || search !== '') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedMetal('All');
                    setSelectedCity('All');
                    setSearch('');
                    setCitySearch('');
                  }}
                  className="text-xs text-muted-foreground hover:text-primary h-7 px-2"
                >
                  Clear All
                </Button>
              )}
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {filteredOrders.length} Active Offers
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {/* General Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search trader or location..."
              className="pl-10 bg-card border-border rounded-xl h-12 shadow-sm focus-visible:ring-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* City Filter Search */}
          <div className="relative group" ref={citySearchRef}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter by city..."
              className="pl-10 pr-10 bg-card border-border rounded-xl h-12 shadow-sm focus-visible:ring-primary transition-all"
              value={selectedCity === 'All' ? citySearch : selectedCity}
              onFocus={() => {
                setShowCityDrop(true);
                if (selectedCity !== 'All') {
                  setCitySearch('');
                  setSelectedCity('All');
                }
              }}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCityDrop(true);
              }}
            />
            {selectedCity !== 'All' ? (
              <button 
                onClick={() => setSelectedCity('All')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            )}

            {showCityDrop && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <ScrollArea className="max-h-[240px]">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setSelectedCity('All');
                        setCitySearch('');
                        setShowCityDrop(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCity === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      All Cities
                    </button>
                    <div className="h-px bg-border my-1" />
                    {filteredCities.length > 0 ? (
                      filteredCities.map(city => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedCity(city);
                            setCitySearch('');
                            setShowCityDrop(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedCity === city ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                          }`}
                        >
                          {city}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        No cities found matching "{citySearch}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] ml-1">Metal Type</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {metals.map((metal) => (
                <Button
                  key={metal}
                  variant={selectedMetal === metal ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetal(metal)}
                  className={`rounded-full px-5 h-9 text-xs font-bold transition-all ${
                    selectedMetal === metal ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {metal}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="grid grid-cols-12 px-4 sm:px-5 py-2.5 bg-muted/40 border-b border-border text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
          <div className="col-span-5">Instrument / Trader</div>
          <div className="col-span-3 text-right">Quantity</div>
          <div className="col-span-4 text-right">Price ({displayCurrency})</div>
        </div>
        
        <div className="divide-y divide-border/40">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-muted/5">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-sm font-medium">No active orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const convertedPrice = convertPrice(order.price_per_unit, order.currency, displayCurrency);
              const convertedPremium = order.premium ? convertPrice(order.premium, order.currency, displayCurrency) : undefined;
              
              return (
                <div 
                  key={order.id} 
                  className={`grid grid-cols-12 px-4 sm:px-5 py-3.5 items-center transition-all cursor-pointer group ${
                    disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/20'
                  }`}
                  onClick={() => !disabled && onSelectOrder(order)}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      order.type === 'Buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {order.type === 'Buy' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs sm:text-sm tracking-tight group-hover:text-primary transition-colors truncate">
                        {order.metal.toUpperCase()}{order.purity ? `.${order.purity}` : ''}
                      </span>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-tighter truncate">
                        {order.trader_name} • <span className="text-primary/60">{order.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-3 text-right">
                    <div className="text-xs sm:text-sm font-bold font-mono tabular-nums">
                      {order.quantity.toLocaleString()}
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                      {order.unit}
                    </div>
                  </div>

                  <div className="col-span-4 text-right flex items-center justify-end gap-3">
                    <div className="flex flex-col items-end">
                      <div className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                        order.type === 'Buy' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {order.pricing_model === 'SpotRelated' ? (
                          <span className="flex items-center gap-1">
                            Spot + {convertedPremium?.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'USD' ? 2 : 0 })}
                          </span>
                        ) : (
                          convertedPrice.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'USD' ? 2 : 0 })
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {order.pricing_model === 'Fixed' ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-amber-500 font-bold uppercase tracking-widest">
                              <Clock className="w-2.5 h-2.5" />
                              Fixed
                            </div>
                            {order.expiry_time && (
                              <div className="text-[7px] sm:text-[8px] text-rose-500 font-black uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                                <AlertCircle className="w-2 h-2" />
                                <Countdown expiryTime={order.expiry_time} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-blue-500 font-bold uppercase tracking-widest">
                            <TrendingUp className="w-2.5 h-2.5" />
                            Spot
                          </div>
                        )}
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                          {displayCurrency} / {order.unit}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/40 transition-colors hidden sm:block" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-10 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-60">
          {filteredOrders.length} Active Orders Found
        </p>
      </div>
    </div>
  );
};
