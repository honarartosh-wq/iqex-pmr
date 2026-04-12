import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Order, Message, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Send, DollarSign, Package } from 'lucide-react';

interface NegotiationPanelProps {
  order: Order;
  currentUser: User;
  onClose: () => void;
}

export const NegotiationPanel: React.FC<NegotiationPanelProps> = ({ order, currentUser, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [offerPrice, setOfferPrice] = useState(order.price_per_unit.toString());
  const [offerQuantity, setOfferQuantity] = useState(order.quantity.toString());
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to socket server
    socketRef.current = io();

    const roomId = `negotiation_${order.id}_${currentUser.id}`;
    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('receive-offer', (data: any) => {
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

    socketRef.current.on('offer-accepted', (data: any) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        negotiation_id: roomId,
        sender_id: data.senderId,
        content: 'Offer Accepted! Trade finalized.',
        type: 'Accept',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
    });

    socketRef.current.on('offer-rejected', (data: any) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        negotiation_id: roomId,
        sender_id: data.senderId,
        content: 'Offer Rejected.',
        type: 'Reject',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [order.id, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() && !offerPrice) return;

    const roomId = `negotiation_${order.id}_${currentUser.id}`;
    const isOffer = !!offerPrice;
    
    const offerData = {
      roomId,
      senderId: currentUser.id,
      type: isOffer ? 'Offer' : 'Message',
      offer: {
        message: input,
        price: parseFloat(offerPrice),
        quantity: parseFloat(offerQuantity),
      }
    };

    socketRef.current?.emit('send-offer', offerData);
    setInput('');
  };

  const handleAcceptOffer = (msg: Message) => {
    const roomId = `negotiation_${order.id}_${currentUser.id}`;
    socketRef.current?.emit('accept-offer', {
      roomId,
      senderId: currentUser.id,
      offer: { price: msg.offer_price, quantity: msg.offer_quantity }
    });
  };

  const handleRejectOffer = () => {
    const roomId = `negotiation_${order.id}_${currentUser.id}`;
    socketRef.current?.emit('reject-offer', {
      roomId,
      senderId: currentUser.id,
    });
  };

  return (
    <Card className="flex flex-col h-[600px] border-border shadow-2xl bg-card overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-bold">Negotiation: {order.metal}</CardTitle>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">With {order.trader_name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-primary">Close</Button>
        </div>
      </CardHeader>
      
      <div className="p-4 bg-slate-50 border-b flex gap-4 items-center">
        <div className="flex-1">
          <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Offer Price ({order.currency})</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type="number" 
              value={offerPrice} 
              onChange={(e) => setOfferPrice(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Quantity ({order.unit})</label>
          <div className="relative">
            <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type="number" 
              value={offerQuantity} 
              onChange={(e) => setOfferQuantity(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-muted border-b border-border flex justify-between items-center">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Quick Actions</span>
        <div className="flex gap-2">
          <Button 
            size="xs" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-5 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20"
            onClick={() => {
              const lastOffer = [...messages].reverse().find(m => m.type === 'Offer' && m.sender_id !== currentUser.id);
              if (lastOffer) handleAcceptOffer(lastOffer);
            }}
            disabled={!messages.some(m => m.type === 'Offer' && m.sender_id !== currentUser.id)}
          >
            Agree (Accept)
          </Button>
          <Button 
            size="xs" 
            variant="outline"
            className="bg-card text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-8 px-5 text-[10px] font-bold uppercase tracking-widest"
            onClick={handleRejectOffer}
            disabled={!messages.some(m => m.type === 'Offer' && m.sender_id !== currentUser.id)}
          >
            Refuse (Reject)
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 bg-muted/10">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.type === 'Accept' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
                msg.type === 'Reject' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' :
                msg.sender_id === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
              }`}>
                {msg.type === 'Offer' && (
                  <div className={`mb-3 p-3 rounded-xl border ${
                    msg.sender_id === currentUser.id ? 'bg-white/10 border-white/20' : 'bg-muted border-border'
                  }`}>
                    <div className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Proposed Offer</div>
                    <div className="font-mono font-bold text-lg">{msg.offer_price?.toLocaleString()} {order.currency} / {msg.offer_quantity} {order.unit}</div>
                    
                    {msg.sender_id !== currentUser.id && (
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="xs" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] font-bold uppercase tracking-widest"
                          onClick={() => handleAcceptOffer(msg)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="bg-card text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-7 text-[10px] font-bold uppercase tracking-widest"
                          onClick={handleRejectOffer}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                <div className={`text-[9px] mt-2 font-bold uppercase tracking-widest opacity-50 ${msg.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <CardFooter className="p-4 border-t bg-muted/30">
        <div className="flex w-full gap-3">
          <Input 
            placeholder="Type your message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="bg-card border-border h-12 focus-visible:ring-primary"
          />
          <Button onClick={handleSendMessage} className="bg-primary text-primary-foreground h-12 w-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
