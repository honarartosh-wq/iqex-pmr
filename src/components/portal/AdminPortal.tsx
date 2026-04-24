import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Activity,
  ArrowRight,
  User as UserIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { User, Order, MarketConfig, MetalType, Notification } from '../../types';
import { INITIAL_CONFIG } from '../../constants';
import { NotificationCenter } from '../shared/NotificationCenter';
import { matchingEngine, MatchResult } from '../../services/matchingEngine';
import { tradingViewService, LivePrice } from '../../services/tradingViewService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Globe, 
  ArrowLeftRight, 
  Coins, 
  Building2,
  Save,
  Info
} from 'lucide-react';

interface AdminPortalProps {
  user: User;
  users: User[];
  orders: Order[];
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  marketConfig: MarketConfig;
  onUpdateMarketConfig: (config: MarketConfig) => void;
  onVerifyUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onLogout: () => void;
  onSwitchPortal?: () => void;
}

const KYCReviewModal: React.FC<{
  user: User;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ user, onClose, onApprove, onReject }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold">KYC Document Review</h3>
            <p className="text-sm text-muted-foreground">{user.company_name || 'Individual Trader'} • {user.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">ID Front</p>
              <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
                {user.kyc_docs?.id_front ? (
                  <img src={user.kyc_docs.id_front} alt="ID Front" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center p-4">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-muted-foreground">No image provided</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">ID Back</p>
              <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
                {user.kyc_docs?.id_back ? (
                  <img src={user.kyc_docs.id_back} alt="ID Back" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center p-4">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-muted-foreground">No image provided</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Selfie Verification</p>
              <div className="aspect-square max-w-[300px] mx-auto bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
                {user.kyc_docs?.selfie ? (
                  <img src={user.kyc_docs.selfie} alt="Selfie" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center p-4">
                    <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-muted-foreground">No image provided</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Business License</p>
              <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
                {user.kyc_docs?.business_license ? (
                  <img src={user.kyc_docs.business_license} alt="License" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center p-4">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-muted-foreground">No image provided</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Reviewer Note</p>
                <p className="text-xs text-amber-800/70 dark:text-amber-400/70">
                  Ensure the name on the ID matches the registered email and company name. Check for document expiration and image clarity.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3 shrink-0">
          <Button 
            variant="outline" 
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
            onClick={() => { onReject(user.id); onClose(); }}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject Application
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            onClick={() => { onApprove(user.id); onClose(); }}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve Trader
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ 
  user, users, orders, isDarkMode, setIsDarkMode,
  marketConfig, onUpdateMarketConfig,
  onVerifyUser, onRejectUser, onCancelOrder, onUpdateUser, onLogout, onSwitchPortal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState('kyc');
  const [reviewingUser, setReviewingUser] = useState<User | null>(null);
  const [selectedConfigCity, setSelectedConfigCity] = useState<string>('Baghdad');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Baghdad']);
  const [selectedTransferCountry, setSelectedTransferCountry] = useState<string>('Türkiye');
  const [citySearch, setCitySearch] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'admin-1',
      title: 'System Online',
      message: 'Admin portal is active. Monitoring market activity.',
      type: 'success',
      created_at: new Date().toISOString(),
      is_read: false,
    }
  ]);

  const [bulkRates, setBulkRates] = useState({
    bid: 1310,
    ask: 1315,
    transfer_fees: {
      'Türkiye': { to_usd: 50, from_usd: 40 },
      'UAE': { to_usd: 45, from_usd: 35 }
    }
  });

  const pendingKYC = users.filter(u => u.kyc_status === 'Pending');
  const activeOrders = orders.filter(o => o.status === 'Open' || o.status === 'Negotiating');

  const [config, setConfig] = useState<MarketConfig>(marketConfig);

  // Sync local config if prop changes (e.g. from another admin or reset)
  useEffect(() => {
    setConfig(marketConfig);
  }, [marketConfig]);

  // Live global spot prices (TradingView-fed) for the Auto Premium panel.
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>(
    () => tradingViewService.getPrices()
  );
  useEffect(() => {
    return tradingViewService.subscribe(setLivePrices);
  }, []);

  // Unit conversions: gold-api / TradingView quote in USD per troy ounce.
  const GRAMS_PER_TROY_OZ = 31.1034768;
  const METAL_SYMBOLS: Record<MetalType, string> = {
    Gold: 'XAUUSD',
    Silver: 'XAGUSD',
    Platinum: 'XPTUSD',
    Palladium: 'XPDUSD',
  };

  // Pick a reference local ask (in IQD/gram) per metal for the premium calc.
  // Gold uses 24K (pure), Silver uses 999; Platinum/Palladium are stored flat.
  const getLocalReferenceIqdPerGram = (metal: MetalType): number | null => {
    const cityLocal = config.city_rates[selectedConfigCity]?.local_prices;
    const local = cityLocal ?? config.local_prices;
    if (!local) return null;
    if (metal === 'Gold') return local.Gold?.['24K']?.ask_iqd ?? null;
    if (metal === 'Silver') return local.Silver?.['999']?.ask_iqd ?? null;
    const flat = local[metal] as { ask_iqd: number } | undefined;
    return flat?.ask_iqd ?? null;
  };

  // Auto-premium per metal, derived from live spot vs. local syndicate ask.
  // Positive = local market charges a premium over spot; negative = discount.
  const autoPremiums: Record<MetalType, {
    spotUsdPerOz: number;
    spotUsdPerKg: number;
    localUsdPerGram: number;
    premiumUsdPerKg: number;
    premiumUsdPerOz: number;
    premiumIqdPerKg: number;
    hasData: boolean;
  }> = (['Gold', 'Silver', 'Platinum', 'Palladium'] as MetalType[]).reduce((acc, metal) => {
    const spot = livePrices[METAL_SYMBOLS[metal]];
    const cityRate = config.city_rates[selectedConfigCity]?.ask || config.usd_iqd_index;
    const localIqdPerGram = getLocalReferenceIqdPerGram(metal);
    const spotUsdPerOz = spot?.ask ?? spot?.price ?? 0;
    const spotUsdPerGram = spotUsdPerOz / GRAMS_PER_TROY_OZ;
    const spotUsdPerKg = spotUsdPerGram * 1000;
    const localUsdPerGram = localIqdPerGram != null ? localIqdPerGram / cityRate : 0;
    const premiumUsdPerGram = localUsdPerGram - spotUsdPerGram;
    acc[metal] = {
      spotUsdPerOz,
      spotUsdPerKg,
      localUsdPerGram,
      premiumUsdPerKg: premiumUsdPerGram * 1000,
      premiumUsdPerOz: premiumUsdPerGram * GRAMS_PER_TROY_OZ,
      premiumIqdPerKg: premiumUsdPerGram * 1000 * cityRate,
      hasData: spotUsdPerOz > 0 && localIqdPerGram != null,
    };
    return acc;
  }, {} as any);

  // Notify about pending KYC
  useEffect(() => {
    if (pendingKYC.length > 0) {
      const kycNotif: Notification = {
        id: 'kyc-pending',
        title: 'Pending KYC Requests',
        message: `There are ${pendingKYC.length} traders waiting for verification.`,
        type: 'warning',
        created_at: new Date().toISOString(),
        is_read: false,
      };
      setNotifications(prev => {
        // Only add if not already present or if count changed
        const existing = prev.find(n => n.id === 'kyc-pending');
        if (existing && existing.message === kycNotif.message) return prev;
        return [kycNotif, ...prev.filter(n => n.id !== 'kyc-pending')];
      });
    }
  }, [pendingKYC.length]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSaveConfig = () => {
    // Bake the currently-displayed auto-premium into config.premiums so the
    // downstream MarketPrice calculations (marketService) keep a usable value
    // even when no live-spot subscription is available.
    const nextConfig: MarketConfig = JSON.parse(JSON.stringify(config));
    (Object.keys(nextConfig.premiums) as MetalType[]).forEach(metal => {
      const ap = autoPremiums[metal];
      if (ap?.hasData) {
        nextConfig.premiums[metal] = {
          usd_per_kg: Number(ap.premiumUsdPerKg.toFixed(2)),
          iqd_per_kg: Math.round(ap.premiumIqdPerKg),
        };
      }
    });
    onUpdateMarketConfig(nextConfig);

    const successNotif: Notification = {
      id: `save-${Date.now()}`,
      title: 'Configuration Updated',
      message: `Market settings for ${selectedConfigCity} and global indices have been saved successfully.`,
      type: 'success',
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setNotifications(prev => [successNotif, ...prev]);
  };

  const applyBulkUpdate = () => {
    if (selectedCities.length === 0) return;

    setConfig(prev => {
      const newConfig: MarketConfig = JSON.parse(JSON.stringify(prev));
      selectedCities.forEach(city => {
        // Mutate only the fields the bulk panel controls so unrelated
        // data (local_prices, any future per-city fields) is preserved.
        const entry = newConfig.city_rates[city] ?? ({} as MarketConfig['city_rates'][string]);
        entry.bid = bulkRates.bid;
        entry.ask = bulkRates.ask;
        entry.transfer_fees = JSON.parse(JSON.stringify(bulkRates.transfer_fees));
        newConfig.city_rates[city] = entry;
      });
      return newConfig;
    });
  };

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    setConfig(prev => {
      // Deep clone so nested recalculation below cannot mutate prev.
      const newConfig: MarketConfig = JSON.parse(JSON.stringify(prev));

      // Seed a city's per-city syndicate prices from the global defaults the
      // first time an admin edits them - otherwise the path walk below hits
      // `undefined` at `local_prices` and throws. Fall back to INITIAL_CONFIG
      // if the top-level `local_prices` is also missing from the loaded config.
      if (keys[0] === 'city_rates' && keys.length >= 3 && keys[2] === 'local_prices') {
        const city = keys[1];
        if (newConfig.city_rates[city] && !newConfig.city_rates[city].local_prices) {
          const seed = newConfig.local_prices ?? INITIAL_CONFIG.local_prices;
          newConfig.city_rates[city].local_prices = JSON.parse(JSON.stringify(seed));
        }
      }

      let current: any = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] == null) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      // 4. If a City Rate changes
      if (path.startsWith('city_rates.') && path.endsWith('.ask')) {
        const city = keys[1];
        const oldRate = prev.city_rates[city].ask || prev.usd_iqd_index;
        const newRate = value;
        
        // 4a. Update local metal prices (only if the city has its own
        // syndicate price overrides; Gold/Silver subtrees may also be absent).
        const cityLocal = newConfig.city_rates[city]?.local_prices;
        if (cityLocal?.Gold) {
          Object.keys(cityLocal.Gold).forEach(karat => {
            const p = cityLocal.Gold[karat];
            const usd_bid = p.bid_iqd / oldRate;
            const usd_ask = p.ask_iqd / oldRate;
            cityLocal.Gold[karat] = {
              bid_iqd: Math.round(usd_bid * newRate),
              ask_iqd: Math.round(usd_ask * newRate),
            };
          });
        }
        if (cityLocal?.Silver) {
          Object.keys(cityLocal.Silver).forEach(purity => {
            const p = cityLocal.Silver[purity];
            const usd_bid = p.bid_iqd / oldRate;
            const usd_ask = p.ask_iqd / oldRate;
            cityLocal.Silver[purity] = {
              bid_iqd: Math.round(usd_bid * newRate),
              ask_iqd: Math.round(usd_ask * newRate),
            };
          });
        }

      }

      return newConfig;
    });
  };

  const toggleCitySelection = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city) 
        : [...prev, city]
    );
  };

  const navItems = [
    { id: 'kyc', icon: <ShieldCheck className="w-5 h-5" />, label: 'KYC' },
    { id: 'users', icon: <Users className="w-5 h-5" />, label: 'Users' },
    { id: 'orders', icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders' },
    { id: 'matching', icon: <ArrowLeftRight className="w-5 h-5" />, label: 'Matching' },
    { id: 'market', icon: <TrendingUp className="w-5 h-5" />, label: 'Market' },
    { id: 'config', icon: <Settings className="w-5 h-5" />, label: 'Config' },
    { id: 'profile', icon: <UserIcon className="w-5 h-5" />, label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-500">
      
      {/* Admin Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-16">
        {/* Admin Header */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-slate-900">IQ</div>
            <h2 className="font-bold text-lg tracking-tight">Admin Dashboard</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <NotificationCenter 
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClear={clearNotification}
            />
          </div>
        </header>

        {/* Admin Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[2000px] mx-auto space-y-8">
            {activeAdminTab !== 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Pending Verifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingKYC.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Traders waiting for KYC approval</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-500" />
                      Active Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeOrders.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total open market positions</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">Operational</div>
                    <p className="text-xs text-muted-foreground mt-1">All trading engines running normally</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeAdminTab === 'kyc' && (
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Verification Queue</CardTitle>
                  <CardDescription>Review and approve trader identity documents.</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingKYC.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20 text-emerald-500" />
                      <p>All verification requests have been processed.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingKYC.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {user.company_name?.[0] || 'T'}
                            </div>
                            <div>
                              <p className="font-bold">{user.company_name || 'Individual Trader'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-amber-500/30 text-amber-600 hover:bg-amber-50"
                              onClick={() => setReviewingUser(user)}
                            >
                              <Search className="w-4 h-4 mr-2" />
                              Review Docs
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {reviewingUser && (
              <KYCReviewModal 
                user={reviewingUser} 
                onClose={() => setReviewingUser(null)}
                onApprove={onVerifyUser}
                onReject={onRejectUser}
              />
            )}

            {activeAdminTab === 'users' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>Manage all registered platform participants.</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users..." 
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3 font-medium">User / Company</th>
                          <th className="text-left py-3 font-medium">Role</th>
                          <th className="text-left py-3 font-medium">Tier</th>
                          <th className="text-left py-3 font-medium">Status</th>
                          <th className="text-left py-3 font-medium">Subscription</th>
                          <th className="text-right py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users
                          .filter(u => 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(user => (
                            <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-4">
                                <div className="font-medium">{user.company_name || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </td>
                              <td className="py-4">
                                <Badge variant="outline">{user.role}</Badge>
                              </td>
                              <td className="py-4">
                                {user.tier && (
                                  <Badge className={
                                    user.tier === 'Platinum' ? 'bg-slate-900 text-white' :
                                    user.tier === 'Gold' ? 'bg-amber-500 text-white' :
                                    user.tier === 'Silver' ? 'bg-slate-400 text-white' :
                                    'bg-slate-600 text-white'
                                  }>
                                    {user.tier}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-4">
                                <Badge className={
                                  user.kyc_status === 'Verified' ? 'bg-emerald-500' : 
                                  user.kyc_status === 'Pending' ? 'bg-amber-500' : 
                                  'bg-slate-500'
                                }>
                                  {user.kyc_status}
                                </Badge>
                              </td>
                              <td className="py-4">
                                <div className="flex flex-col gap-1">
                                  <Badge className={
                                    user.is_frozen ? 'bg-rose-600' :
                                    user.subscription_status === 'Active' ? 'bg-emerald-500' :
                                    user.subscription_status === 'Expired' ? 'bg-amber-500' :
                                    'bg-slate-500'
                                  }>
                                    {user.is_frozen ? 'FROZEN' : (user.subscription_status || 'NONE')}
                                  </Badge>
                                  {user.subscription_expiry && (
                                    <span className="text-[10px] text-muted-foreground">
                                      Exp: {new Date(user.subscription_expiry).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {user.role === 'Trader' && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className={user.is_frozen ? "text-emerald-600 border-emerald-200" : "text-rose-600 border-rose-200"}
                                        onClick={() => onUpdateUser(user.id, { is_frozen: !user.is_frozen })}
                                      >
                                        {user.is_frozen ? 'Unfreeze' : 'Freeze'}
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          const nextMonth = new Date();
                                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                                          onUpdateUser(user.id, { 
                                            subscription_status: 'Active', 
                                            subscription_expiry: nextMonth.toISOString() 
                                          });
                                        }}
                                      >
                                        Renew
                                      </Button>
                                    </>
                                  )}
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeAdminTab === 'orders' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Market Orders</CardTitle>
                    <CardDescription>Monitor and manage all active buy and sell orders.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      {orders.filter(o => o.status === 'Open').length} Open
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3 font-medium">Order ID</th>
                          <th className="text-left py-3 font-medium">Trader</th>
                          <th className="text-left py-3 font-medium">Type</th>
                          <th className="text-left py-3 font-medium">Metal</th>
                          <th className="text-left py-3 font-medium">Qty</th>
                          <th className="text-left py-3 font-medium">Price</th>
                          <th className="text-left py-3 font-medium">Status</th>
                          <th className="text-right py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-4 font-mono text-[10px]">{order.id.slice(0, 8)}...</td>
                            <td className="py-4 font-medium">{order.trader_name || 'Trader'}</td>
                            <td className="py-4">
                              <Badge className={order.type === 'Buy' ? 'bg-blue-500' : 'bg-rose-500'}>
                                {order.type}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <div className="font-bold">{order.metal}</div>
                              <div className="text-[10px] text-muted-foreground">{order.purity}</div>
                            </td>
                            <td className="py-4">
                              {order.quantity} {order.unit}
                            </td>
                            <td className="py-4">
                              <div className="font-bold">{order.price_per_unit.toLocaleString()}</div>
                              <div className="text-[10px] text-muted-foreground">{order.currency}</div>
                            </td>
                            <td className="py-4">
                              <Badge variant="outline" className={
                                order.status === 'Open' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                order.status === 'Negotiating' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                'text-slate-500 border-slate-200 bg-slate-50'
                              }>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-4 text-right">
                              {order.status === 'Open' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => onCancelOrder(order.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeAdminTab === 'matching' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Match Discovery Engine</h3>
                    <p className="text-sm text-muted-foreground">Identifying crossed orders where Buy Price ≥ Sell Price.</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1">
                    {matchingEngine.findMatches(orders).length} Potential Matches Found
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {matchingEngine.findMatches(orders).length === 0 ? (
                    <Card className="border-dashed py-12">
                      <CardContent className="text-center space-y-2">
                        <ArrowLeftRight className="w-12 h-12 mx-auto opacity-10" />
                        <p className="text-muted-foreground">No crossed orders in the market right now.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    matchingEngine.findMatches(orders).map((match, idx) => (
                      <Card key={idx} className="overflow-hidden border-emerald-500/20 bg-emerald-500/5">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row items-center">
                            {/* Buyer Side */}
                            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-emerald-500/10">
                              <div className="flex items-center gap-3 mb-4">
                                <Badge className="bg-blue-500">BUYER</Badge>
                                <span className="font-bold">{match.buyOrder.trader_name}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-2xl font-black">{match.buyOrder.price_per_unit.toLocaleString()} <span className="text-xs font-normal opacity-60">{match.buyOrder.currency}</span></p>
                                <p className="text-xs text-muted-foreground">{match.buyOrder.quantity} {match.buyOrder.unit} • {match.buyOrder.location}</p>
                              </div>
                            </div>

                            {/* Match Center */}
                            <div className="px-8 py-4 bg-emerald-500 text-white flex flex-col items-center justify-center gap-1 shrink-0">
                              <ArrowLeftRight className="w-6 h-6" />
                              <p className="text-[10px] font-black uppercase tracking-tighter">Spread Overlap</p>
                              <p className="text-lg font-bold">+{match.potentialProfit?.toLocaleString()}</p>
                            </div>

                            {/* Seller Side */}
                            <div className="flex-1 p-6 text-right">
                              <div className="flex items-center justify-end gap-3 mb-4">
                                <span className="font-bold">{match.sellOrder.trader_name}</span>
                                <Badge className="bg-rose-500">SELLER</Badge>
                              </div>
                              <div className="space-y-1">
                                <p className="text-2xl font-black">{match.sellOrder.price_per_unit.toLocaleString()} <span className="text-xs font-normal opacity-60">{match.sellOrder.currency}</span></p>
                                <p className="text-xs text-muted-foreground">{match.sellOrder.quantity} {match.sellOrder.unit} • {match.sellOrder.location}</p>
                              </div>
                            </div>

                            {/* Action */}
                            <div className="p-6 bg-muted/30 border-t md:border-t-0 md:border-l border-border flex items-center justify-center shrink-0">
                              <Button className="bg-slate-900 text-white hover:bg-slate-800">
                                Nudge Parties
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeAdminTab === 'market' && (
              <div className="space-y-8">
                {/* ── GLOBAL INDEX WIDGET ────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className="lg:col-span-1 border-amber-500/20 bg-amber-500/5 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-amber-600">
                        <Globe className="w-4 h-4" />
                        Global Index
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">USD/IQD Benchmark</label>
                          <div className="relative">
                            <Input 
                              type="number"
                              className="pl-3 font-mono font-black text-lg h-12 bg-background border-amber-500/20 focus:border-amber-500" 
                              value={config.usd_iqd_index}
                              onChange={(e) => updateConfig('usd_iqd_index', Number(e.target.value))}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-1 rounded">IQD</div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Subscription Fee</label>
                          <div className="relative">
                            <Input 
                              type="number"
                              className="pl-3 font-mono font-black text-lg h-12 bg-background border-primary/20 focus:border-primary" 
                              value={config.subscription_fee_iqd}
                              onChange={(e) => updateConfig('subscription_fee_iqd', Number(e.target.value))}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">IQD</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-3 border-primary/20 bg-primary/5 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                        <MapPin className="w-4 h-4" />
                        City Selection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          placeholder="Search governorate..."
                          className="h-9 pl-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
                        {(() => {
                          const q = citySearch.trim().toLowerCase();
                          const cities = Object.keys(config.city_rates).filter(c =>
                            q === '' || c.toLowerCase().includes(q)
                          );
                          if (cities.length === 0) {
                            return (
                              <p className="text-[11px] text-muted-foreground italic py-2">
                                No governorates match "{citySearch}".
                              </p>
                            );
                          }
                          return cities.map(city => (
                            <button
                              key={city}
                              onClick={() => setSelectedConfigCity(city)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                                selectedConfigCity === city
                                  ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                              }`}
                            >
                              {city}
                            </button>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ── BULK RATE OVERRIDE ──────────────────────────────── */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <ArrowLeftRight className="w-4 h-4" />
                      Bulk Rate Override
                    </CardTitle>
                    <CardDescription className="text-[10px]">Apply a USD/IQD rate to multiple cities at once. Select cities below, set the rates, then apply.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(config.city_rates).map(city => (
                        <button
                          key={city}
                          onClick={() => toggleCitySelection(city)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
                            selectedCities.includes(city)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Bid Rate (IQD)</label>
                        <Input
                          type="number"
                          className="h-10 font-mono"
                          value={bulkRates.bid}
                          onChange={(e) => setBulkRates(prev => ({ ...prev, bid: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Ask Rate (IQD)</label>
                        <Input
                          type="number"
                          className="h-10 font-mono"
                          value={bulkRates.ask}
                          onChange={(e) => setBulkRates(prev => ({ ...prev, ask: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={applyBulkUpdate}
                      disabled={selectedCities.length === 0}
                      variant="outline"
                      className="w-full font-bold uppercase tracking-widest text-xs"
                    >
                      Apply to {selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'}
                    </Button>
                  </CardContent>
                </Card>

                {/* ── CITY CONFIGURATION PANEL ─────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 space-y-8">
                    {/* Syndicate Prices (Local Prices) */}
                    <Card className="shadow-md border-border/40 overflow-hidden">
                      <div className="bg-muted/30 p-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-black uppercase tracking-widest">Syndicate Prices: {selectedConfigCity}</h3>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">Local Market Rates</Badge>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Gold Syndicate */}
                          <div className="space-y-4">
                            <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest border-l-2 border-amber-500 pl-2">Gold Karats (Per Gram)</h4>
                            <div className="space-y-4">
                              {Object.entries(config.city_rates[selectedConfigCity]?.local_prices?.Gold ?? config.local_prices?.Gold ?? INITIAL_CONFIG.local_prices.Gold).map(([karat, p]) => {
                                const cityRate = config.city_rates[selectedConfigCity]?.ask || config.usd_iqd_index;
                                return (
                                  <div key={karat} className="p-3 rounded-xl bg-muted/10 border border-transparent hover:border-amber-500/20 transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black uppercase tracking-wider">{karat}</span>
                                      <Badge variant="outline" className="text-[8px] font-bold">Gold</Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      {/* Bid Side */}
                                      <div className="space-y-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground">IQD BID</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-background" 
                                            value={p.bid_iqd}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Gold.${karat}.bid_iqd`, Number(e.target.value))}
                                          />
                                        </div>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-600/50">USD BID</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-amber-500/5 border-amber-500/10" 
                                            value={(p.bid_iqd / cityRate).toFixed(2)}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Gold.${karat}.bid_iqd`, Math.round(Number(e.target.value) * cityRate))}
                                          />
                                        </div>
                                      </div>

                                      {/* Ask Side */}
                                      <div className="space-y-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground">IQD ASK</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-background" 
                                            value={p.ask_iqd}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Gold.${karat}.ask_iqd`, Number(e.target.value))}
                                          />
                                        </div>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-600/50">USD ASK</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-amber-500/5 border-amber-500/10" 
                                            value={(p.ask_iqd / cityRate).toFixed(2)}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Gold.${karat}.ask_iqd`, Math.round(Number(e.target.value) * cityRate))}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Silver Syndicate */}
                          <div className="space-y-4">
                            <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest border-l-2 border-slate-400 pl-2">Silver Purities</h4>
                            <div className="space-y-4">
                              {Object.entries(config.city_rates[selectedConfigCity]?.local_prices?.Silver ?? config.local_prices?.Silver ?? INITIAL_CONFIG.local_prices.Silver).map(([purity, p]) => {
                                const cityRate = config.city_rates[selectedConfigCity]?.ask || config.usd_iqd_index;
                                return (
                                  <div key={purity} className="p-3 rounded-xl bg-muted/10 border border-transparent hover:border-slate-400/20 transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black uppercase tracking-wider">{purity}</span>
                                      <Badge variant="outline" className="text-[8px] font-bold">Silver</Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      {/* Bid Side */}
                                      <div className="space-y-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground">IQD BID</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-background" 
                                            value={p.bid_iqd}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Silver.${purity}.bid_iqd`, Number(e.target.value))}
                                          />
                                        </div>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-600/50">USD BID</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-slate-500/5 border-slate-500/10" 
                                            value={(p.bid_iqd / cityRate).toFixed(2)}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Silver.${purity}.bid_iqd`, Math.round(Number(e.target.value) * cityRate))}
                                          />
                                        </div>
                                      </div>

                                      {/* Ask Side */}
                                      <div className="space-y-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground">IQD ASK</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-background" 
                                            value={p.ask_iqd}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Silver.${purity}.ask_iqd`, Number(e.target.value))}
                                          />
                                        </div>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-600/50">USD ASK</span>
                                          <Input 
                                            type="number"
                                            className="h-8 text-[10px] font-mono pl-12 bg-slate-500/5 border-slate-500/10" 
                                            value={(p.ask_iqd / cityRate).toFixed(2)}
                                            onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.local_prices.Silver.${purity}.ask_iqd`, Math.round(Number(e.target.value) * cityRate))}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* City Rates & Transfer Fees */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">USD/IQD Rates: {selectedConfigCity}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">Bid Price</label>
                              <Input 
                                type="number"
                                className="font-mono text-sm h-10" 
                                value={config.city_rates[selectedConfigCity].bid}
                                onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.bid`, Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">Ask Price</label>
                              <Input 
                                type="number"
                                className="font-mono text-sm h-10" 
                                value={config.city_rates[selectedConfigCity].ask}
                                onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.ask`, Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Transfer Fees: {selectedConfigCity}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {Object.entries(config.city_rates[selectedConfigCity].transfer_fees).map(([country, fees]) => (
                            <div key={country} className="grid grid-cols-3 gap-3 items-center">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">{country}</span>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground">TO</span>
                                <Input 
                                  type="number"
                                  className="h-8 pl-6 text-xs font-mono"
                                  value={fees.to_usd}
                                  onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.transfer_fees.${country}.to_usd`, Number(e.target.value))}
                                />
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground">FROM</span>
                                <Input 
                                  type="number"
                                  className="h-8 pl-8 text-xs font-mono"
                                  value={fees.from_usd}
                                  onChange={(e) => updateConfig(`city_rates.${selectedConfigCity}.transfer_fees.${country}.from_usd`, Number(e.target.value))}
                                />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Auto Premium vs Global Spot (read-only, TradingView-fed) */}
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          Auto Premium vs Global Spot
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                          Derived automatically from local syndicate ask and the TradingView spot feed. Positive = premium charged over spot; negative = local discount.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {(['Gold', 'Silver', 'Platinum', 'Palladium'] as MetalType[]).map(metal => {
                          const ap = autoPremiums[metal];
                          const cityRate = config.city_rates[selectedConfigCity]?.ask || config.usd_iqd_index;
                          const isDiscount = ap.premiumUsdPerKg < 0;
                          const magnitudeColor = !ap.hasData
                            ? 'text-muted-foreground'
                            : isDiscount
                              ? 'text-rose-600'
                              : 'text-emerald-600';
                          return (
                            <div key={metal} className="space-y-3 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider">{metal}</span>
                                {ap.hasData ? (
                                  <Badge
                                    variant="outline"
                                    className={`text-[8px] font-bold ${isDiscount ? 'border-rose-500/40 text-rose-600' : 'border-emerald-500/40 text-emerald-600'}`}
                                  >
                                    {isDiscount ? 'Discount' : 'Premium'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[8px] font-bold text-muted-foreground">
                                    No Spot Data
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-0.5">
                                  <div className="text-[8px] uppercase font-black text-muted-foreground flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5" /> Spot USD / oz
                                  </div>
                                  <div className="font-mono text-xs font-bold">
                                    {ap.spotUsdPerOz > 0 ? `$${ap.spotUsdPerOz.toFixed(2)}` : '—'}
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-[8px] uppercase font-black text-muted-foreground flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5" /> Spot USD / kg
                                  </div>
                                  <div className="font-mono text-xs font-bold">
                                    {ap.spotUsdPerKg > 0 ? `$${ap.spotUsdPerKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <div className={`text-[8px] uppercase font-black flex items-center gap-1 ${magnitudeColor}`}>
                                    <TrendingUp className="w-2.5 h-2.5" /> Premium USD / kg
                                  </div>
                                  <div className={`font-mono text-xs font-bold ${magnitudeColor}`}>
                                    {ap.hasData ? `${ap.premiumUsdPerKg >= 0 ? '+' : ''}$${ap.premiumUsdPerKg.toFixed(2)}` : '—'}
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  <div className={`text-[8px] uppercase font-black flex items-center gap-1 ${magnitudeColor}`}>
                                    <Coins className="w-2.5 h-2.5" /> Premium IQD / kg
                                  </div>
                                  <div className={`font-mono text-xs font-bold ${magnitudeColor}`}>
                                    {ap.hasData ? `${ap.premiumIqdPerKg >= 0 ? '+' : ''}${Math.round(ap.premiumIqdPerKg).toLocaleString()} IQD` : '—'}
                                  </div>
                                </div>

                                <div className="col-span-2 space-y-0.5">
                                  <div className="text-[8px] uppercase font-black text-muted-foreground">
                                    Premium USD / oz
                                  </div>
                                  <div className={`font-mono text-xs font-bold ${magnitudeColor}`}>
                                    {ap.hasData ? `${ap.premiumUsdPerOz >= 0 ? '+' : ''}$${ap.premiumUsdPerOz.toFixed(2)}` : '—'}
                                  </div>
                                </div>
                              </div>

                              <div className="text-[9px] text-muted-foreground/60 italic px-1">
                                * Reference: {metal === 'Gold' ? '24K' : metal === 'Silver' ? '999' : 'flat'} syndicate ask at {cityRate.toLocaleString()} IQD ({selectedConfigCity} rate).
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Action Button */}
                    <Button 
                      onClick={handleSaveConfig}
                      className="w-full h-16 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-1 group"
                    >
                      <div className="flex items-center gap-2">
                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Update Market</span>
                      </div>
                      <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Apply changes to {selectedConfigCity}</span>
                    </Button>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                      <div className="flex gap-3">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed text-amber-900/70 dark:text-amber-200/70">
                          Updating the market will immediately affect live prices for all traders in <strong>{selectedConfigCity}</strong>. Ensure syndicate prices match the latest official rates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeAdminTab === 'config' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      Subscription Settings
                    </CardTitle>
                    <CardDescription>Global subscription parameters for all traders.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Monthly Fee (IQD)</label>
                      <div className="relative">
                        <Input 
                          type="number"
                          className="h-12 text-lg font-mono pl-4"
                          value={config.subscription_fee_iqd}
                          onChange={(e) => updateConfig('subscription_fee_iqd', Number(e.target.value))}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">IQD</div>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">This fee is charged to traders every 30 days to maintain active status.</p>
                    </div>

                    <Button 
                      onClick={handleSaveConfig}
                      className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest"
                    >
                      Save Subscription Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      System Limits
                    </CardTitle>
                    <CardDescription>Manage platform-wide operational constraints.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground">Disable all trading activity</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>Enable</Button>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">Auto-Matching</p>
                        <p className="text-xs text-muted-foreground">Automatically execute crossed orders</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>Enable</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeAdminTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl bg-amber-500 flex items-center justify-center text-3xl font-bold text-slate-900">
                        IQ
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold">{user.company_name || 'Administrator'}</h3>
                          <Badge className="bg-amber-500 text-slate-900">Super Admin</Badge>
                        </div>
                        <p className="text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {onSwitchPortal && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-12 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5"
                      onClick={onSwitchPortal}
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5" />
                        <span className="font-bold">Switch to Trader View</span>
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
          </div>
        </div>
      </main>

      {/* ── Bottom Navigation ────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveAdminTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${
              activeAdminTab === item.id 
                ? 'text-amber-500' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${
              activeAdminTab === item.id ? 'bg-amber-500/10' : ''
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
