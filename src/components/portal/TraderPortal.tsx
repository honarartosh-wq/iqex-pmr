import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  History,
  User as UserIcon,
  Bell,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  AlertCircle,
  Clock,
  Activity,
  DollarSign,
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarketBoard } from '../market/MarketBoard';
import { Bazaar } from '../market/Bazaar';
import { CurrencyBoard } from '../shared/CurrencyBoard';
import { TransferFeesBoard } from '../shared/TransferFeesBoard';
import { OrderBook } from '../market/OrderBook';
import { TradingViewTicker } from '../market/TradingViewTicker';
import { NegotiationPanel } from '../dialogs/NegotiationPanel';
import { TradeHistory } from '../market/TradeHistory';
import { KYCForm } from '../dialogs/KYCForm';
import { CreateOrderDialog } from '../dialogs/CreateOrderDialog';
import { tradingViewService } from '../../services/tradingViewService';
import { NotificationCenter } from '../shared/NotificationCenter';
import { negotiationService } from '../../services/negotiationService';
import { matchingEngine } from '../../services/matchingEngine';
import { User, Order, Trade, MarketConfig, Notification, Negotiation } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/* ── ticker data (shown on bazaar + prices tabs) ─────────────────────────── */
const TICKER = [
  { label:'XAU/USD', val:2341.50, isUSD:true,  chg:+0.42 },
  { label:'XAG/USD', val:  28.71, isUSD:true,  chg:-0.18 },
  { label:'XPT/USD', val: 968.00, isUSD:true,  chg:+0.11 },
  { label:'XPD/USD', val: 982.00, isUSD:true,  chg:-0.55 },
  { label:'USD/IQD', val:1306.00, isUSD:false,  chg: 0.00 },
  { label:'EUR/USD', val:  1.0852, isUSD:true,  chg:+0.06 },
  { label:'GBP/USD', val:  1.2644, isUSD:true,  chg:-0.09 },
];

interface TraderPortalProps {
  user: User;
  orders: Order[];
  trades: Trade[];
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  marketConfig: MarketConfig;
  onKYCComplete: (data: Partial<User>) => void;
  onCreateOrder: (order: any) => void;
  onLogout: () => void;
  onSwitchPortal?: () => void;
}

export const TraderPortal: React.FC<TraderPortalProps> = ({
  user, orders, trades, isDarkMode, setIsDarkMode, marketConfig,
  onKYCComplete, onCreateOrder, onLogout, onSwitchPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'prices'|'bazaar'|'currency'|'transfer'|'markets'|'history'|'profile'>('prices');
  const [activeNegotiation, setActiveNegotiation] = useState<Order|null>(null);
  const [activeNegotiationId, setActiveNegotiationId] = useState<string | null>(null);
  const [activeNegotiationBuyerId, setActiveNegotiationBuyerId] = useState<string | null>(null);
  const [userNegotiations, setUserNegotiations] = useState<Negotiation[]>([]); // To hold active negotiations
  const [displayMode, setDisplayMode] = useState<'USD' | 'IQD' | 'Both'>('IQD');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to IQEX',
      message: 'Your account is active. Start exploring the bazaar and live prices.',
      type: 'info',
      created_at: new Date().toISOString(),
      is_read: false,
    }
  ]);

  const handleCreateOrder = (order: any) => {
    setDisplayMode(order.currency);
    onCreateOrder(order);
    
    // Add notification
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Order Created',
      message: `Your ${order.type} order for ${order.quantity} ${order.unit} of ${order.metal} has been posted.`,
      type: 'success',
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const isSubscriptionActive = user.subscription_status === 'Active' && !user.is_frozen;

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  /* tabs that get the scrolling ticker under the portal header */
  const showTicker = activeTab === 'prices';

  const navItems = [
    { id: 'prices', icon: <Activity className="w-5 h-5" />, label: 'Prices' },
    { id: 'bazaar', icon: <Menu className="w-5 h-5" />, label: 'Bazaar' },
    { id: 'currency', icon: <DollarSign className="w-5 h-5" />, label: 'FX' },
    { id: 'transfer', icon: <ArrowRight className="w-5 h-5" />, label: 'Transfer' },
    { id: 'markets', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Orders' },
    { id: 'history', icon: <History className="w-5 h-5" />, label: 'History' },
    { id: 'profile', icon: <UserIcon className="w-5 h-5" />, label: 'Profile' },
  ];

  const [liveTicker, setLiveTicker] = useState(TICKER);

  useEffect(() => {
    if (!user.id) return;

    // Initial fetch
    const fetchNegotiations = async () => {
      const negs = await negotiationService.getUserNegotiations(user.id);
      setUserNegotiations(negs);
    };
    fetchNegotiations();

    // Subscribe to changes
    const subscription = negotiationService.subscribeToUserNegotiations(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        if (!payload.new) return;
        setUserNegotiations(prev => [payload.new as Negotiation, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        const next = payload.new as Negotiation | null;
        if (!next?.id) return;
        setUserNegotiations(prev => prev.map(n => n.id === next.id ? next : n));
      } else if (payload.eventType === 'DELETE') {
        const removedId = (payload.old as Negotiation | null)?.id;
        if (!removedId) return;
        setUserNegotiations(prev => prev.filter(n => n.id !== removedId));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);

  useEffect(() => {
    const labelToSymbol: Record<string, string> = {
      'XAU/USD': 'XAUUSD',
      'XAG/USD': 'XAGUSD',
      'XPT/USD': 'XPTUSD',
      'XPD/USD': 'XPDUSD',
    };
    const unsubscribe = tradingViewService.subscribe((livePrices) => {
      const updatedTicker = TICKER.map(t => {
        const symbol = labelToSymbol[t.label];
        const live = symbol ? livePrices[symbol] : undefined;
        if (!live) return t;
        return { ...t, val: live.price, chg: live.change24h };
      });
      setLiveTicker(updatedTicker);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-500">

      <style>{`
        @keyframes portal-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
      `}</style>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-16">

        {/* Portal header */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center font-bold text-white dark:bg-white dark:text-slate-900">IQ</div>
            <h2 className="font-bold text-lg tracking-tight capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <NotificationCenter 
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClear={clearNotification}
            />
            <CreateOrderDialog 
              onCreated={handleCreateOrder} 
              config={marketConfig} 
              traderId={user.id} 
              disabled={!isSubscriptionActive}
            />
          </div>
        </header>

        {/* Ticker — only on prices / bazaar tabs */}
        {showTicker && <TradingViewTicker isDarkMode={isDarkMode} />}

        {/* Content area — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {!isSubscriptionActive && (
            <div className="bg-rose-600 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg z-20 sticky top-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest">
                  {user.is_frozen ? 'Account Frozen' : 'Subscription Expired'}
                </p>
                <p className="text-[10px] opacity-90 font-medium">
                  {user.is_frozen 
                    ? 'Your account has been frozen by an administrator.' 
                    : 'Your monthly subscription (10,000 IQD) has expired.'}
                  {" "}Trading features are disabled.
                </p>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">

            {user.kyc_status === 'None' ? (
              <motion.div key="kyc"
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
                className="max-w-xl mx-auto py-10 px-6">
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Verification Required</h3>
                  <p className="text-xs text-slate-500">
                    To maintain a secure trading environment, all traders must be verified.
                  </p>
                </div>
                <KYCForm onComplete={onKYCComplete} />
              </motion.div>
            ) : (
              <motion.div key={activeTab}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.18 }}
                /* prices + bazaar: full width, no padding — they manage their own centering */
                className={
                  activeTab === 'prices' || activeTab === 'bazaar'
                    ? 'w-full'
                    : 'max-w-[2000px] mx-auto p-6 space-y-6'
                }
              >

                {activeTab === 'prices' && <MarketBoard config={marketConfig} displayMode={displayMode} />}

                {/* ↓ embedded=true hides Bazaar's own header + ticker */}
                {activeTab === 'bazaar' && <Bazaar embedded config={marketConfig} displayMode={displayMode} />}

                {activeTab === 'currency' && <CurrencyBoard config={marketConfig} />}

                {activeTab === 'transfer' && <TransferFeesBoard config={marketConfig} />}

                {activeTab === 'markets' && (
                  <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                    <div className="xl:col-span-2 2xl:col-span-3 space-y-6">
                      {/* Active Negotiations List */}
                      {userNegotiations.filter(n => n.status !== 'Rejected').length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-black uppercase tracking-widest">Active Negotiations</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                            {userNegotiations
                              .filter(n => n.status !== 'Rejected')
                              .map(neg => {
                                const relatedOrder = orders.find(o => o.id === neg.order_id);
                                if (!relatedOrder) return null;
                                
                                return (
                                  <Card key={neg.id} className="bg-card border-border overflow-hidden hover:shadow-md transition-all">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] h-4 font-bold border-primary/20 text-primary uppercase">
                                              {relatedOrder.metal}
                                            </Badge>
                                            <Badge className={`text-[9px] h-4 ${
                                              neg.status === 'Accepted' ? 'bg-emerald-500' : 'bg-blue-500'
                                            }`}>
                                              {neg.status}
                                            </Badge>
                                          </div>
                                          <p className="text-xs font-bold truncate">Partner: {user.id === neg.seller_id ? 'Buyer' : relatedOrder.trader_name}</p>
                                        </div>
                                        <Badge variant="secondary" className="text-[9px]">
                                          {relatedOrder.type}
                                        </Badge>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="w-full h-8 text-[10px] font-bold uppercase border-primary/20 text-primary hover:bg-primary/5"
                                        onClick={() => {
                                          setActiveNegotiation(relatedOrder);
                                          setActiveNegotiationId(neg.id);
                                          setActiveNegotiationBuyerId(neg.buyer_id);
                                        }}
                                      >
                                        Resume Chat
                                      </Button>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      <OrderBook 
                        orders={orders} 
                        config={marketConfig} 
                        displayCurrency={displayMode === 'Both' ? 'IQD' : displayMode}
                        setDisplayCurrency={(c) => setDisplayMode(c as any)}
                        onSelectOrder={(order) => isSubscriptionActive && setActiveNegotiation(order)} 
                        disabled={!isSubscriptionActive}
                      />

                      {/* Suggested Matches for User's Orders */}
                      {orders.filter(o => o.trader_id === user.id && o.status === 'Open').length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-sm font-black uppercase tracking-widest">Smart Match Suggestions</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders
                              .filter(o => o.trader_id === user.id && o.status === 'Open')
                              .map(myOrder => {
                                const suggestions = matchingEngine.findMatchesForOrder(myOrder, orders);
                                if (suggestions.length === 0) return null;
                                
                                return suggestions.map(suggestion => (
                                  <Card key={suggestion.id} className="bg-emerald-500/5 border-emerald-500/20 overflow-hidden group hover:shadow-lg transition-all">
                                    <CardContent className="p-4 flex items-center justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Badge className="bg-emerald-500 text-[9px] h-4">MATCH</Badge>
                                          <span className="text-xs font-bold">{suggestion.trader_name}</span>
                                        </div>
                                        <p className="text-sm font-black">
                                          {suggestion.price_per_unit.toLocaleString()} {suggestion.currency}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                          For your {myOrder.metal} {myOrder.type}
                                        </p>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-[10px] font-bold uppercase"
                                        onClick={() => isSubscriptionActive && setActiveNegotiation(suggestion)}
                                        disabled={!isSubscriptionActive}
                                      >
                                        Negotiate
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ));
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-6 p-6 bg-muted/5 rounded-2xl border border-border/50">
                      {activeNegotiation ? (
                        <NegotiationPanel
                          order={activeNegotiation}
                          currentUser={user}
                          initialNegotiationId={activeNegotiationId || undefined}
                          initialBuyerId={activeNegotiationBuyerId || undefined}
                          onClose={() => {
                            setActiveNegotiation(null);
                            setActiveNegotiationId(null);
                            setActiveNegotiationBuyerId(null);
                          }}
                        />
                      ) : (
                        <Card className="h-[400px] flex items-center justify-center border-dashed text-slate-400">
                          <div className="text-center p-8">
                            <LayoutDashboard className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Select an order to start negotiating.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'history' && <TradeHistory trades={trades} />}

                {activeTab === 'profile' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <Card>
                      <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 dark:bg-slate-800">
                            {user.company_name?.[0] || 'T'}
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-bold">{user.company_name || 'Unverified Trader'}</h3>
                              <Badge className={user.kyc_status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'}>
                                {user.kyc_status}
                              </Badge>
                            </div>
                            <p className="text-slate-500">{user.email}</p>
                            <div className="flex items-center gap-2 pt-1">
                              {user.tier && (
                                <Badge className={
                                  user.tier === 'Platinum' ? 'bg-slate-900 text-white' :
                                  user.tier === 'Gold'     ? 'bg-amber-500 text-white'  :
                                  user.tier === 'Silver'   ? 'bg-slate-400 text-white'  :
                                                             'bg-slate-600 text-white'
                                }>Tier: {user.tier}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold">Location</p>
                            <p className="text-sm font-medium">{user.address || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold">Member Since</p>
                            <p className="text-sm font-medium">April 2026</p>
                          </div>
                          <div className="col-span-2 pt-4 border-t">
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Subscription Status</p>
                            <div className="flex items-center gap-3">
                              <Badge className={
                                user.is_frozen ? 'bg-rose-600' :
                                user.subscription_status === 'Active' ? 'bg-emerald-500' :
                                'bg-amber-500'
                              }>
                                {user.is_frozen ? 'FROZEN' : (user.subscription_status || 'NONE')}
                              </Badge>
                              {user.subscription_expiry && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  Expires: {new Date(user.subscription_expiry).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            {!isSubscriptionActive && (
                              <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-wider">
                                {user.is_frozen ? 'Trading disabled by administrator' : 'Renew subscription to enable trading'}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {user.role === 'Admin' && onSwitchPortal && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-between h-12 border-amber-500/20 text-amber-600 hover:bg-amber-500/5"
                          onClick={onSwitchPortal}
                        >
                          <div className="flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="font-bold">Switch to Admin Portal</span>
                          </div>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-12 border-rose-500/20 text-rose-600 hover:bg-rose-500/5"
                        onClick={onLogout}
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="w-5 h-5" />
                          <span className="font-bold">Sign Out</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Bottom Navigation ────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${
              activeTab === item.id 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${
              activeTab === item.id ? 'bg-primary/10' : ''
            }`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
