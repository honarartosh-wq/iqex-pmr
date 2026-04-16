import { useState, useEffect } from 'react';
import { TraderPortal } from './components/portal/TraderPortal';
import { AdminPortal } from './components/portal/AdminPortal';
import { Auth } from './components/auth/Auth';
import { User, Order, Trade, MarketConfig } from './types';
import { INITIAL_CONFIG } from './constants';
import { authService } from './services/authService';
import { marketService } from './services/marketService';
import { orderService } from './services/orderService';
import { supabase } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [portalMode, setPortalMode] = useState<'trader' | 'admin'>('trader');
  const [marketConfig, setMarketConfig] = useState<MarketConfig>(INITIAL_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial Auth Check and Data Fetching
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        // 1. Check Auth
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setPortalMode(currentUser.role === 'Admin' ? 'admin' : 'trader');
        }

        // 2. Fetch Market Config
        const config = await marketService.getConfig();
        if (config) setMarketConfig(config);

        // 3. Fetch Orders
        const initialOrders = await orderService.getOrders();
        setOrders(initialOrders);

        // 4. Fetch Users (if Admin)
        if (currentUser?.role === 'Admin') {
          const { data: allUsers } = await supabase.from('profiles').select('*');
          if (allUsers) setUsers(allUsers as User[]);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Subscriptions
    const configSub = marketService.subscribeToConfig((newConfig) => {
      setMarketConfig(newConfig);
    });

    const orderSub = orderService.subscribeToOrders((newOrder) => {
      setOrders(prev => {
        const exists = prev.find(o => o.id === newOrder.id);
        if (exists) {
          return prev.map(o => o.id === newOrder.id ? newOrder : o);
        }
        return [newOrder, ...prev];
      });
    });

    const authSub = authService.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      if (updatedUser) {
        setPortalMode(updatedUser.role === 'Admin' ? 'admin' : 'trader');
      }
    });

    return () => {
      configSub.unsubscribe();
      orderSub.unsubscribe();
      authSub.data.subscription.unsubscribe();
    };
  }, []);

  const handleKYCComplete = async (kycData: Partial<User>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...kycData, kyc_status: 'Pending' })
      .eq('id', user.id);
    
    if (!error) {
      setUser(prev => prev ? ({ ...prev, ...kycData, kyc_status: 'Pending' }) : null);
    }
  };

  const handleCreateOrder = async (newOrder: Omit<Order, 'id' | 'created_at' | 'trader_name'>) => {
    const created = await orderService.createOrder(newOrder);
    // Real-time subscription will handle updating the list
  };

  const handleVerifyUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ kyc_status: 'Verified' })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_status: 'Verified' } : u));
      if (user?.id === userId) {
        setUser(prev => prev ? ({ ...prev, kyc_status: 'Verified' }) : null);
      }
    }
  };

  const handleRejectUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ kyc_status: 'Rejected' })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_status: 'Rejected' } : u));
      if (user?.id === userId) {
        setUser(prev => prev ? ({ ...prev, kyc_status: 'Rejected' }) : null);
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    await orderService.updateOrderStatus(orderId, 'Cancelled');
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      if (user?.id === userId) {
        setUser(prev => prev ? ({ ...prev, ...updates }) : null);
      }
    }
  };

  const handleUpdateMarketConfig = async (newConfig: MarketConfig) => {
    const success = await marketService.updateConfig(newConfig);
    if (success) {
      setMarketConfig(newConfig);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setPortalMode('trader');
  };

  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing Trading Floor...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Configuration Required</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            To start the application, you need to connect your Supabase project. Please add your credentials in the <strong>Settings</strong> menu.
          </p>
          <div className="space-y-4 text-left bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">VITE_SUPABASE_URL</span>
              <span className={import.meta.env.VITE_SUPABASE_URL ? "text-emerald-500" : "text-rose-500"}>
                {import.meta.env.VITE_SUPABASE_URL ? "✓ Set" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VITE_SUPABASE_ANON_KEY</span>
              <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? "text-emerald-500" : "text-rose-500"}>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  if (portalMode === 'admin' && user.role === 'Admin') {
    return (
      <AdminPortal 
        user={user}
        users={users}
        orders={orders}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        marketConfig={marketConfig}
        onUpdateMarketConfig={handleUpdateMarketConfig}
        onVerifyUser={handleVerifyUser}
        onRejectUser={handleRejectUser}
        onCancelOrder={handleCancelOrder}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onSwitchPortal={() => setPortalMode('trader')}
      />
    );
  }

  return (
    <TraderPortal 
      user={user}
      orders={orders}
      trades={trades}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      marketConfig={marketConfig}
      onKYCComplete={handleKYCComplete}
      onCreateOrder={handleCreateOrder}
      onLogout={handleLogout}
      onSwitchPortal={() => setPortalMode('admin')}
    />
  );
}
