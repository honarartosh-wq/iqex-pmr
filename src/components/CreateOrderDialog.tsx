import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MetalType, OrderType, Unit } from '../types';
import { PlusCircle, Info } from 'lucide-react';

interface CreateOrderDialogProps {
  onCreated: (order: any) => void;
}

export const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<OrderType>('Sell');
  const [metal, setMetal] = useState<MetalType>('Gold');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<Unit>('Gram');
  const [purity, setPurity] = useState('24K');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      metal,
      quantity: parseFloat(quantity),
      unit,
      price_per_unit: parseFloat(price),
      purity,
      currency: 'IQD',
      status: 'Open',
      created_at: new Date().toISOString(),
      location: 'Baghdad',
      trader_name: 'My Trading Co.', // Mock
    };
    onCreated(newOrder);
    setOpen(false);
    // Reset form
    setQuantity('');
    setPrice('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2">
            <PlusCircle className="w-4 h-4" />
            Create Order
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
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

          <div className="space-y-2">
            <Label>Price per {unit} (IQD)</Label>
            <Input 
              type="number" 
              placeholder="e.g. 125000" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md flex gap-2 items-start">
            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
            <p className="text-[10px] text-blue-700">
              Your order will be visible to all verified traders in the market. 
              You can negotiate terms once someone expresses interest.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full bg-slate-900">Post Order to Market</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
