import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MetalType, OrderType, Unit, PricingModel, MarketConfig } from '../../types';
import { PlusCircle, Info, Clock, TrendingUp } from 'lucide-react';
import { tradingViewService } from '../../services/tradingViewService';

interface CreateOrderDialogProps {
  onCreated: (order: any) => void;
  config: MarketConfig;
  traderId: string;
  disabled?: boolean;
}

export const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({ onCreated, config, traderId, disabled }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<OrderType>('Sell');
  const [metal, setMetal] = useState<MetalType>('Gold');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<Unit>('Gram');
  const [purity, setPurity] = useState('24K');
  const [pricingModel, setPricingModel] = useState<PricingModel>('Fixed');
  const [expiryMinutes, setExpiryMinutes] = useState('15');
  const [premium, setPremium] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'IQD'>('IQD');
  const [liveSpot, setLiveSpot] = useState<number>(0);

  const convert = (val: number, from: 'USD' | 'IQD', to: 'USD' | 'IQD') => {
    if (from === to) return val;
    if (from === 'USD' && to === 'IQD') return val * config.usd_iqd_index;
    if (from === 'IQD' && to === 'USD') return val / config.usd_iqd_index;
    return val;
  };

  const displaySpot = convert(liveSpot, 'USD', currency);

  useEffect(() => {
    const unsubscribe = tradingViewService.subscribe((prices) => {
      const symbol = metal === 'Gold' ? 'XAUUSD' : metal === 'Silver' ? 'XAGUSD' : metal === 'Platinum' ? 'XPTUSD' : 'XPDUSD';
      if (prices[symbol]) {
        setLiveSpot(prices[symbol].price);
      }
    });
    return () => unsubscribe();
  }, [metal]);

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedQuantity = parseFloat(quantity);
    const parsedPrice = pricingModel === 'Fixed' ? parseFloat(price) : 0;
    const parsedPremium = pricingModel === 'SpotRelated' ? parseFloat(premium) : 0;
    const parsedExpiry = parseInt(expiryMinutes, 10);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }
    if (pricingModel === 'Fixed') {
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setFormError('Price must be a positive number.');
        return;
      }
      if (!Number.isFinite(parsedExpiry) || parsedExpiry <= 0) {
        setFormError('Expiry must be a positive number of minutes.');
        return;
      }
    }
    if (pricingModel === 'SpotRelated' && !Number.isFinite(parsedPremium)) {
      setFormError('Premium must be a valid number.');
      return;
    }

    setFormError(null);

    const newOrder = {
      trader_id: traderId,
      type,
      metal,
      quantity: parsedQuantity,
      unit,
      price_per_unit: pricingModel === 'Fixed' ? parsedPrice : 0,
      purity,
      currency,
      status: 'Open',
      location: 'Baghdad',
      pricing_model: pricingModel,
      expiry_time: pricingModel === 'Fixed' ? new Date(Date.now() + parsedExpiry * 60000).toISOString() : undefined,
      premium: pricingModel === 'SpotRelated' ? parsedPremium : undefined,
    };
    onCreated(newOrder);
    setOpen(false);
    // Reset form
    setQuantity('');
    setPrice('');
    setPremium('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2" disabled={disabled}>
            <PlusCircle className="w-4 h-4" />
            Create Order
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create New Market Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy Order</SelectItem>
                  <SelectItem value="Sell">Sell Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Metal</Label>
              <Select value={metal} onValueChange={(v) => setMetal(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Palladium">Palladium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {metal === 'Gold' && (
              <div className="space-y-2">
                <Label>Purity (Karat)</Label>
                <Select value={purity} onValueChange={setPurity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24K">24K (Pure)</SelectItem>
                    <SelectItem value="22K">22K</SelectItem>
                    <SelectItem value="21K">21K</SelectItem>
                    <SelectItem value="18K">18K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed Price</SelectItem>
                  <SelectItem value="SpotRelated">Spot + Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gram">Grams</SelectItem>
                  <SelectItem value="Kilogram">Kilograms</SelectItem>
                  <SelectItem value="Ounce">Ounces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {pricingModel === 'Fixed' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fixed Price ({currency})</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Price" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">IQD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valid For (Minutes)</Label>
                <Select value={expiryMinutes} onValueChange={setExpiryMinutes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Minutes</SelectItem>
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                    <SelectItem value="120">2 Hours</SelectItem>
                    <SelectItem value="240">4 Hours</SelectItem>
                    <SelectItem value="1440">24 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Premium ({currency}/{unit})</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Premium" 
                    value={premium}
                    onChange={(e) => setPremium(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">IQD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Linked to Live Spot
                </div>
                <div className="h-10 px-3 flex items-center bg-muted/30 rounded-md text-xs font-medium border border-border/50 italic">
                  {currency === 'USD' ? '$' : ''}{displaySpot.toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 })} {currency} + {premium || '0'}
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-md flex gap-2 items-start">
            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] text-blue-700">
                {pricingModel === 'Fixed' 
                  ? `This order will expire in ${expiryMinutes} minutes if not accepted.`
                  : `Price will automatically adjust based on global spot market fluctuations.`}
              </p>
              {pricingModel === 'Fixed' && (
                <p className="text-[9px] text-blue-600 font-bold">
                  Estimated Expiry: {new Date(Date.now() + parseInt(expiryMinutes) * 60000).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {formError && (
            <div className="text-[11px] font-medium text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full bg-slate-900">Post Order to Market</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
