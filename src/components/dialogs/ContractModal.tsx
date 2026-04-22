import React from 'react';
import { Contract } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Shield, CheckCircle, Clock, FileText, User, MapPin } from 'lucide-react';

interface ContractModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ contract, isOpen, onClose }) => {
  if (!contract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Digital Trade Contract</DialogTitle>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">ID: {contract.id.slice(0, 8)}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white font-bold uppercase tracking-widest">
              {contract.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Parties Section */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Seller</span>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-lg font-black">{contract.seller_name}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Verified Trader</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Buyer</span>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-lg font-black">{contract.buyer_name}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Verified Trader</p>
              </div>
            </div>
          </div>

          {/* Trade Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Trade Specifications</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-xl">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Asset</p>
                <p className="text-xl font-black">{contract.metal}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quantity</p>
                <p className="text-xl font-black">{contract.quantity.toLocaleString()} {contract.unit}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Price</p>
                <p className="text-xl font-black text-emerald-400">
                  {contract.price.toLocaleString()} {contract.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Legal Terms */}
          <div className="p-6 rounded-2xl border border-border bg-muted/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Binding Agreement Terms
            </h4>
            <div className="text-[11px] leading-relaxed text-muted-foreground space-y-2">
              <p>1. This digital contract represents a legally binding agreement between the Seller and the Buyer for the transfer of the specified assets.</p>
              <p>2. Both parties acknowledge that the price and quantity listed above are final and agreed upon through the Iraqi Market platform negotiation process.</p>
              <p>3. The Seller guarantees the purity and authenticity of the metal as specified in the trade details.</p>
              <p>4. This contract is digitally signed and timestamped, creating an immutable record of the transaction.</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seller Signature</p>
              <div className="relative">
                <div className="h-20 flex items-center justify-center font-serif text-2xl italic text-slate-700 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  {contract.seller_signature}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                <Clock className="w-3 h-3" />
                Signed: {new Date(contract.signed_at).toLocaleString()}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Buyer Signature</p>
              <div className="relative">
                <div className="h-20 flex items-center justify-center font-serif text-2xl italic text-slate-700 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  {contract.buyer_signature}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                <Clock className="w-3 h-3" />
                Signed: {new Date(contract.signed_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} className="bg-slate-900 text-white font-bold uppercase tracking-widest h-11 px-8">
            Close Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
