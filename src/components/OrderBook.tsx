import React, { useState } from 'react';
import { Order, OrderType, MetalType } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, ArrowUpRight, ArrowDownLeft, ChevronRight, Package, User } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface OrderBookProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({ orders, onSelectOrder }) => {
  const [selectedMetal, setSelectedMetal] = useState<MetalType | 'All'>('All');
  const [selectedCity, setSelectedCity] = useState<string | 'All'>('All');
  const [search, setSearch] = useState('');

  const metals: (MetalType | 'All')[] = ['All', 'Gold', 'Silver', 'Platinum', 'Palladium'];
  
  // Extract unique cities from orders
  const cities = ['All', ...Array.from(new Set(orders.map(o => o.location)))];

  const filteredOrders = orders.filter(order => {
    const matchesMetal = selectedMetal === 'All' || order.metal === selectedMetal;
    const matchesCity = selectedCity === 'All' || order.location === selectedCity;
    const matchesSearch = order.trader_name.toLowerCase().includes(search.toLowerCase()) ||
                         order.location.toLowerCase().includes(search.toLowerCase());
    return matchesMetal && matchesCity && matchesSearch;
  });

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="px-2 space-y-4">
        <h2 className="text-2xl font-bold">Market Orders</h2>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search trader or location..."
            className="pl-10 bg-card border-border rounded-xl h-12 shadow-md focus-visible:ring-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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

        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] ml-1">City / Location</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCity(city)}
                  className={`rounded-full px-5 h-9 text-xs font-bold transition-all ${
                    selectedCity === city ? 'bg-secondary text-secondary-foreground border-secondary shadow-lg shadow-secondary/20' : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {city}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="space-y-1">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-slate-50 rounded-xl border-2 border-dashed">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-sm font-medium">No active orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="group bg-card border border-border p-5 hover:bg-muted/30 transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden"
              onClick={() => onSelectOrder(order)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    order.type === 'Buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {order.type === 'Buy' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-bold text-foreground flex items-center gap-2 text-lg group-hover:text-primary transition-colors">
                      {order.metal}
                      {order.purity && <span className="text-[10px] text-muted-foreground font-normal tracking-wider">({order.purity})</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
                      <User className="w-3 h-3" />
                      {order.trader_name} • <span className="text-primary">{order.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold font-mono ${
                    order.type === 'Buy' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {order.price_per_unit.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{order.currency} / {order.unit}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-foreground">
                    <span className="text-muted-foreground mr-1.5 uppercase font-bold text-[9px] tracking-widest">Qty:</span>
                    <span className="font-bold text-sm">{order.quantity} {order.unit}</span>
                  </div>
                  <Badge variant="outline" className={`text-[9px] h-5 uppercase tracking-widest font-bold border-none ${
                    order.type === 'Buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {order.type === 'Buy' ? 'Seeking' : 'Offering'}
                  </Badge>
                </div>
                <div className="flex items-center text-primary text-[10px] font-bold uppercase gap-1 tracking-[0.2em] group-hover:gap-2 transition-all">
                  Negotiate <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-10 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-60">
          {filteredOrders.length} Active Orders Found
        </p>
      </div>
    </div>
  );
};
