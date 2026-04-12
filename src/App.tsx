import { useState, useEffect } from 'react';
import { MarketBoard } from './components/MarketBoard';
import { Bazaar } from './components/Bazaar';
import { CurrencyBoard } from './components/CurrencyBoard';
import { OrderBook } from './components/OrderBook';
import { NegotiationPanel } from './components/NegotiationPanel';
import { TradeHistory } from './components/TradeHistory';
import { KYCForm } from './components/KYCForm';
import { CreateOrderDialog } from './components/CreateOrderDialog';
import { User, Order, Trade } from './types';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { 
  LayoutDashboard, 
  History, 
  User as UserIcon, 
  Bell, 
  LogOut, 
  Menu,
  X,
  ShieldAlert,
  Activity,
  DollarSign,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock initial data
const MOCK_USER: User = {
  id: 'user_123',
  email: 'trader@iraqgold.com',
  kyc_status: 'None',
  role: 'Trader',
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_1',
    trader_id: 'user_456',
    trader_name: 'Baghdad Bullion',
    metal: 'Gold',
    purity: '24K',
    type: 'Sell',
    quantity: 500,
    unit: 'Gram',
    price_per_unit: 128500,
    currency: 'IQD',
    status: 'Open',
    created_at: new Date().toISOString(),
    location: 'Baghdad',
  },
  {
    id: 'ord_2',
    trader_id: 'user_789',
    trader_name: 'Erbil Metals',
    metal: 'Silver',
    type: 'Buy',
    quantity: 10,
    unit: 'Kilogram',
    price_per_unit: 1450000,
    currency: 'IQD',
    status: 'Open',
    created_at: new Date().toISOString(),
    location: 'Erbil',
  },
  {
    id: 'ord_3',
    trader_id: 'user_101',
    trader_name: 'Basra Gold House',
    metal: 'Gold',
    purity: '21K',
    type: 'Sell',
    quantity: 250,
    unit: 'Gram',
    price_per_unit: 112000,
    currency: 'IQD',
    status: 'Open',
    created_at: new Date().toISOString(),
    location: 'Basra',
  },
  {
    id: 'ord_4',
    trader_id: 'user_202',
    trader_name: 'Najaf Precious',
    metal: 'Gold',
    purity: '24K',
    type: 'Buy',
    quantity: 1000,
    unit: 'Gram',
    price_per_unit: 129000,
    currency: 'IQD',
    status: 'Open',
    created_at: new Date().toISOString(),
    location: 'Najaf',
  },
  {
    id: 'ord_5',
    trader_id: 'user_303',
    trader_name: 'Sulaymaniyah Silver',
    metal: 'Silver',
    type: 'Sell',
    quantity: 5,
    unit: 'Kilogram',
    price_per_unit: 1465000,
    currency: 'IQD',
    status: 'Open',
    created_at: new Date().toISOString(),
    location: 'Sulaymaniyah',
  },
];

export default function App() {
  const [user, setUser] = useState<User>(MOCK_USER);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeNegotiation, setActiveNegotiation] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'prices' | 'bazaar' | 'currency' | 'markets' | 'history' | 'profile'>('prices');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleKYCComplete = (kycData: Partial<User>) => {
    setUser(prev => ({ ...prev, ...kycData, kyc_status: 'Pending' }));
  };

  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-500">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground shadow-2xl lg:relative lg:translate-x-0 border-r border-sidebar-border"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center font-bold text-white">IM</div>
                <h1 className="font-bold text-xl tracking-tight">Iraq Metals</h1>
              </div>

              <nav className="flex-1 space-y-2">
                <Button 
                  variant={activeTab === 'prices' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('prices')}
                >
                  <Activity className="w-4 h-4" />
                  Live Prices
                </Button>
                <Button 
                  variant={activeTab === 'bazaar' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('bazaar')}
                >
                  <Menu className="w-4 h-4" />
                  Bazaar (Cities)
                </Button>
                <Button 
                  variant={activeTab === 'currency' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('currency')}
                >
                  <DollarSign className="w-4 h-4" />
                  USD / IQD
                </Button>
                <Button 
                  variant={activeTab === 'markets' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('markets')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Market Orders
                </Button>
                <Button 
                  variant={activeTab === 'history' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('history')}
                >
                  <History className="w-4 h-4" />
                  Trade History
                </Button>
                <Button 
                  variant={activeTab === 'profile' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('profile')}
                >
                  <UserIcon className="w-4 h-4" />
                  Profile & KYC
                </Button>
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {user.company_name?.[0] || 'T'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{user.company_name || 'Trader'}</p>
                    <Badge variant="outline" className="text-[8px] h-4 bg-slate-800 border-slate-700 text-slate-400">
                      {user.kyc_status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start gap-3 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 -right-12 lg:hidden text-slate-900"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h2 className="font-bold text-xl capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
            </Button>
            <CreateOrderDialog onCreated={handleCreateOrder} />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-2">
          <AnimatePresence mode="wait">
            {user.kyc_status === 'None' ? (
              <motion.div
                key="kyc"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-xl mx-auto py-4"
              >
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Verification Required</h3>
                  <p className="text-xs text-slate-500">To maintain a secure trading environment, all traders must be verified.</p>
                </div>
                <KYCForm onComplete={handleKYCComplete} />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto space-y-4"
              >
                {activeTab === 'prices' && (
                  <MarketBoard />
                )}

                {activeTab === 'bazaar' && (
                  <Bazaar />
                )}

                {activeTab === 'currency' && (
                  <CurrencyBoard />
                )}

                {activeTab === 'markets' && (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2">
                      <OrderBook orders={orders} onSelectOrder={setActiveNegotiation} />
                    </div>
                    <div className="space-y-6">
                      {activeNegotiation ? (
                        <NegotiationPanel 
                          order={activeNegotiation} 
                          currentUser={user} 
                          onClose={() => setActiveNegotiation(null)} 
                        />
                      ) : (
                        <Card className="h-[400px] flex items-center justify-center border-dashed text-slate-400">
                          <div className="text-center p-8">
                            <LayoutDashboard className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Select an order from the market to start negotiating.</p>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <TradeHistory trades={trades} />
                )}

                {activeTab === 'profile' && (
                  <div className="max-w-2xl mx-auto">
                    <Card>
                      <CardHeader>
                        <CardTitle>Trader Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                            {user.company_name?.[0] || 'T'}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-2xl font-bold">{user.company_name || 'Unverified Trader'}</h3>
                            <p className="text-slate-500">{user.email}</p>
                            <Badge className={user.kyc_status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'}>
                              KYC: {user.kyc_status}
                            </Badge>
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
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
