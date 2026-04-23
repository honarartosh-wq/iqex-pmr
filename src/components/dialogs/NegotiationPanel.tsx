import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Order, Message, User, Trade, Contract } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Send, DollarSign, Package, FileCheck, ExternalLink } from 'lucide-react';
import { tradeService } from '../../services/tradeService';
import { contractService } from '../../services/contractService';
import { orderService } from '../../services/orderService';
import { negotiationService } from '../../services/negotiationService';
import { ContractModal } from './ContractModal';

interface NegotiationPanelProps {
  order: Order;
  currentUser: User;
  onClose: () => void;
  initialNegotiationId?: string;
  initialBuyerId?: string;
}

export const NegotiationPanel: React.FC<NegotiationPanelProps> = ({ order, currentUser, onClose, initialNegotiationId, initialBuyerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [offerPrice, setOfferPrice] = useState(order.price_per_unit.toString());
  const [offerQuantity, setOfferQuantity] = useState(order.quantity.toString());
  const [isCompleted, setIsCompleted] = useState(false);
  const [negStatus, setNegStatus] = useState<'Active' | 'Accepted' | 'Rejected'>('Active');
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const [createdContract, setCreatedContract] = useState<Contract | null>(null);
  const [showContract, setShowContract] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Derive a stable room identifier from the order + buyer so both parties join the same room.
  const isSellerPerspective = currentUser.id === order.trader_id;
  const roomBuyerId = initialBuyerId || (isSellerPerspective ? 'external_trader' : currentUser.id);
  const roomId = `negotiation_${order.id}_${roomBuyerId}`;

  useEffect(() => {
    const initNegotiation = async () => {
      const sellerId = order.trader_id;

      const neg = initialNegotiationId
        ? await negotiationService.getUserNegotiations(currentUser.id).then(negs => negs.find(n => n.id === initialNegotiationId))
        : await negotiationService.getOrCreateNegotiation(order.id, roomBuyerId, sellerId);

      if (neg) {
        setNegotiationId(neg.id);
        setNegStatus(neg.status);
        if (neg.status === 'Accepted') setIsCompleted(true);

        const existingMessages = await negotiationService.getMessages(neg.id);
        setMessages(existingMessages);
      }
    };

    initNegotiation();

    // Connect to socket server with polling fallback for better reliability in cloud environments
    socketRef.current = io({
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketRef.current.on('connect_error', (err) => {
      console.warn('Socket.io connection error:', err.message);
      // This prevents the unhandled rejection from bubbling up if the connection fails
    });

    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('receive-offer', (data: any) => {
      // Ignore our own echo — we already appended the message locally when sending.
      if (data.senderId === currentUser.id) return;
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        negotiation_id: roomId,
        sender_id: data.senderId,
        content: data.offer.message || (data.type === 'Offer' ? 'New offer proposed' : ''),
        type: data.type || 'Offer',
        offer_price: data.offer.price,
        offer_quantity: data.offer.quantity,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
    });

    socketRef.current.on('offer-accepted', async (data: any) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        negotiation_id: negotiationId || roomId,
        sender_id: data.senderId,
        content: 'Offer Accepted! Trade finalized.',
        type: 'Accept',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
      setIsCompleted(true);
      setNegStatus('Accepted');
      
      // If we are the one who received the acceptance, we might need to fetch the contract if the other side created it
      // But for simplicity, let's assume the one who accepts creates it.
    });

    socketRef.current.on('offer-rejected', (data: any) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        negotiation_id: negotiationId || roomId,
        sender_id: data.senderId,
        content: 'Offer Rejected.',
        type: 'Reject',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
      setNegStatus('Rejected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [order.id, currentUser.id, initialNegotiationId, initialBuyerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && !offerPrice) return;

    const isOffer = !!offerPrice;
    const parsedPrice = parseFloat(offerPrice);
    const parsedQuantity = parseFloat(offerQuantity);

    if (isOffer && (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedQuantity) || parsedPrice <= 0 || parsedQuantity <= 0)) {
      console.warn('Invalid offer: price and quantity must be positive numbers.');
      return;
    }

    // Save to database
    if (negotiationId) {
      await negotiationService.saveMessage({
        negotiation_id: negotiationId,
        sender_id: currentUser.id,
        content: input,
        type: isOffer ? 'Offer' : 'Message',
        offer_price: isOffer ? parsedPrice : undefined,
        offer_quantity: isOffer ? parsedQuantity : undefined,
      });
    }

    const offerData = {
      roomId,
      senderId: currentUser.id,
      type: isOffer ? 'Offer' : 'Message',
      offer: {
        message: input,
        price: isOffer ? parsedPrice : undefined,
        quantity: isOffer ? parsedQuantity : undefined,
      }
    };

    socketRef.current?.emit('send-offer', offerData);
    setInput('');
  };

  const handleAcceptOffer = async (msg: Message) => {
    // 0. Update negotiation status in DB
    if (negotiationId) {
      await negotiationService.updateNegotiationStatus(negotiationId, 'Accepted');
      await negotiationService.saveMessage({
        negotiation_id: negotiationId,
        sender_id: currentUser.id,
        content: 'Offer Accepted! Trade finalized.',
        type: 'Accept'
      });
    }

    // 1. Notify other party via socket
    socketRef.current?.emit('accept-offer', {
      roomId,
      senderId: currentUser.id,
      offer: { price: msg.offer_price, quantity: msg.offer_quantity }
    });

    // 2. Create Trade and Contract in Database
    const isBuyer = order.type === 'Sell'; // If order is "Sell", the one accepting is the "Buyer"
    const buyerId = isBuyer ? currentUser.id : order.trader_id;
    const sellerId = isBuyer ? order.trader_id : currentUser.id;
    const buyerName = isBuyer ? (currentUser.company_name || 'Trader') : order.trader_name;
    const sellerName = isBuyer ? order.trader_name : (currentUser.company_name || 'Trader');

    const trade = await tradeService.createTrade({
      order_id: order.id,
      buyer_id: buyerId,
      seller_id: sellerId,
      metal: order.metal,
      quantity: msg.offer_quantity ?? order.quantity,
      unit: order.unit,
      price: msg.offer_price ?? order.price_per_unit,
      currency: order.currency
    });

    if (!trade) {
      console.error('Trade creation failed; aborting contract + order completion');
      return;
    }

    const contract = await contractService.createContract({
      trade_id: trade.id,
      buyer_id: buyerId,
      seller_id: sellerId,
      buyer_name: buyerName,
      seller_name: sellerName,
      metal: order.metal,
      quantity: trade.quantity,
      unit: trade.unit,
      price: trade.price,
      currency: trade.currency,
      buyer_signature: buyerName, // Simple digital signature for now
      seller_signature: sellerName
    });

    if (!contract) {
      console.error('Contract creation failed; trade row was created but order will not be marked Completed');
      return;
    }

    setCreatedContract(contract);
    await orderService.updateOrderStatus(order.id, 'Completed');

    setIsCompleted(true);
    setNegStatus('Accepted');
  };

  const handleRejectOffer = async () => {
    if (negotiationId) {
      await negotiationService.updateNegotiationStatus(negotiationId, 'Rejected');
      await negotiationService.saveMessage({
        negotiation_id: negotiationId,
        sender_id: currentUser.id,
        content: 'Offer Rejected.',
        type: 'Reject'
      });
    }

    socketRef.current?.emit('reject-offer', {
      roomId,
      senderId: currentUser.id,
    });
    setNegStatus('Rejected');
  };

  return (
    <Card className="flex flex-col h-[85vh] sm:h-[600px] border-border shadow-2xl bg-card overflow-hidden">
      <ContractModal 
        contract={createdContract} 
        isOpen={showContract} 
        onClose={() => setShowContract(false)} 
      />
      <CardHeader className="border-b bg-muted/30 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-bold">Negotiation: {order.metal}</CardTitle>
              <Badge 
                variant="secondary" 
                className={`text-[10px] uppercase tracking-wider font-bold h-5 ${
                  negStatus === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                  negStatus === 'Rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                  'bg-blue-500/10 text-blue-600 border-blue-500/20'
                }`}
              >
                {negStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">With {order.trader_name}</p>
              {order.pricing_model === 'Fixed' && order.expiry_time && (
                <Badge variant="outline" className="h-4 text-[8px] border-amber-500/30 text-amber-600 bg-amber-500/5 px-1.5">
                  Expires: {new Date(order.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-primary h-8 px-2">Close</Button>
        </div>
      </CardHeader>
      
      <div className="p-3 sm:p-4 bg-slate-50 border-b flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="flex-1">
          <label className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-bold mb-1 block">Offer Price ({order.currency})</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
            <Input 
              type="number" 
              value={offerPrice} 
              onChange={(e) => setOfferPrice(e.target.value)}
              disabled={isCompleted || negStatus === 'Rejected'}
              className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-bold mb-1 block">Quantity ({order.unit})</label>
          <div className="relative">
            <Package className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
            <Input 
              type="number" 
              value={offerQuantity} 
              onChange={(e) => setOfferQuantity(e.target.value)}
              disabled={isCompleted || negStatus === 'Rejected'}
              className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-2 bg-muted border-b border-border flex flex-col xs:flex-row justify-between items-center gap-2">
        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Quick Actions</span>
        <div className="flex gap-2 w-full xs:w-auto">
          {isCompleted ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-white gap-1 py-1 px-3">
                <FileCheck className="w-3 h-3" />
                TRADE COMPLETED
              </Badge>
              {createdContract && (
                <Button 
                  size="xs" 
                  variant="outline" 
                  className="h-7 text-[9px] font-bold uppercase tracking-widest border-primary text-primary"
                  onClick={() => setShowContract(true)}
                >
                  View Contract
                  <ExternalLink className="w-3 h-3 ml-1.5" />
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button 
                size="xs" 
                className="flex-1 xs:flex-none bg-emerald-600 hover:bg-emerald-700 text-white h-7 sm:h-8 px-3 sm:px-5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                onClick={() => {
                  const lastOffer = [...messages].reverse().find(m => m.type === 'Offer' && m.sender_id !== currentUser.id);
                  if (lastOffer) handleAcceptOffer(lastOffer);
                }}
                disabled={!messages.some(m => m.type === 'Offer' && m.sender_id !== currentUser.id)}
              >
                Agree
              </Button>
              <Button 
                size="xs" 
                variant="outline"
                className="flex-1 xs:flex-none bg-card text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-7 sm:h-8 px-3 sm:px-5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                onClick={handleRejectOffer}
                disabled={!messages.some(m => m.type === 'Offer' && m.sender_id !== currentUser.id)}
              >
                Refuse
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 sm:p-6 bg-muted/10">
        <div className="space-y-4 sm:space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-sm ${
                msg.type === 'Accept' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
                msg.type === 'Reject' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' :
                msg.sender_id === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
              }`}>
                {msg.type === 'Offer' && (
                  <div className={`mb-2 sm:mb-3 p-2 sm:p-3 rounded-xl border ${
                    msg.sender_id === currentUser.id ? 'bg-white/10 border-white/20' : 'bg-muted border-border'
                  }`}>
                    <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Proposed Offer</div>
                    <div className="font-mono font-bold text-base sm:text-lg">{msg.offer_price?.toLocaleString()} {order.currency} / {msg.offer_quantity} {order.unit}</div>
                    
                    {msg.sender_id !== currentUser.id && (
                      <div className="flex gap-2 mt-2 sm:mt-3">
                        <Button 
                          size="xs" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 sm:h-7 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                          onClick={() => handleAcceptOffer(msg)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="bg-card text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-6 sm:h-7 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                          onClick={handleRejectOffer}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs sm:text-sm font-medium leading-relaxed">{msg.content}</p>
                <div className={`text-[8px] sm:text-[9px] mt-1.5 sm:mt-2 font-bold uppercase tracking-widest opacity-50 ${msg.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <CardFooter className="p-3 sm:p-4 border-t bg-muted/30">
        <div className="flex w-full gap-2 sm:gap-3">
          <Input 
            placeholder={isCompleted ? "Negotiation concluded" : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isCompleted || negStatus === 'Rejected'}
            className="bg-card border-border h-10 sm:h-12 focus-visible:ring-primary text-sm"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isCompleted || negStatus === 'Rejected' || (!input.trim() && !offerPrice)}
            className="bg-primary text-primary-foreground h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
