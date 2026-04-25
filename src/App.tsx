import { useState, useEffect } from 'react';
import { TraderPortal } from './components/portal/TraderPortal';
import { AdminPortal } from './components/portal/AdminPortal';
import { Auth } from './components/auth/Auth';
import { User, Order, Trade, MarketConfig } from './types';
import { INITIAL_CONFIG } from './constants';
import { authService } from './services/authService';
import { marketService } from './services/marketService';
import { orderService } from './services/orderService';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseKey } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [portalMode, setPortalMode] = useState<'trader' | 'admin'>('trader');
  const [marketConfig, setMarketConfig] = useState<MarketConfig>(INITIAL_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial Auth Check and Data Fetching (Strict Production mode)
  const initializePlatform = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setInitError(null);
      
      // 1. Production Connectivity Check
      // Use the public /auth/v1/settings endpoint — it returns 200 with a
      // valid apikey, so the browser console doesn't log a misleading 401
      // like /rest/v1/ (which requires a table path).
      console.log('[IQEX] Verifying production environment...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          await fetch(`${supabaseUrl}/auth/v1/settings`, {
            headers: { 'apikey': supabaseKey },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (e) {
        throw new Error('Secure connection to IQEX Trading Floor failed. Please check your network or project status.');
      }

      // 2. Mandatory Config Retrieval (No Guest Fallback)
      // Note: We avoid manual getSession here to prevent "Lock stolen" catch with onAuthStateChange
      const configRes = await marketService.getConfig();

      if (configRes) {
        setMarketConfig(configRes);
      } else {
        throw new Error('Mandatory market configuration missing. Production environment not correctly provisioned.');
      }

      // Initial user check (silent, non-blocking to prevent lock theft)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Use getUser() as it is safer for security, but handle lock errors gracefully
        try {
          const profile = await authService.getCurrentUser();
          if (profile) {
            setUser(profile);
            setPortalMode(profile.role === 'Admin' ? 'admin' : 'trader');
            if (profile.role === 'Admin') {
              const { data: allUsers } = await supabase.from('profiles').select('*');
              if (allUsers) setUsers(allUsers as User[]);
            }
          }
        } catch (authErr: any) {
          if (authErr.message?.includes('Lock')) {
            console.warn('[IQEX] Auth lock contention detected, skipping manual refresh.');
          } else {
            console.error('[IQEX] Auth profile fetch failed:', authErr);
          }
        }
      }

      // 3. Environment initialized successfully
      setIsLoading(false);
      
      // Secondary data in background
      orderService.getOrders().then(res => res && setOrders(res)).catch(console.error);

    } catch (error: any) {
      // If the error is just a lock theft, we don't treat it as a boot failure
      if (error.message?.includes('Lock')) {
        console.warn('[IQEX] Lock theft during boot, continuing...');
        setIsLoading(false);
      } else {
        console.error('Boot Failure:', error);
        setInitError(error.message);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    initializePlatform();

    // Real-time Subscriptions (Strictly Production only)
    const configSub = marketService.subscribeToConfig((newConfig) => {
      setMarketConfig(newConfig);
    });

    const orderSub = orderService.subscribeToOrders((payload) => {
      if (payload.eventType === 'DELETE') {
        const removedId = payload.old?.id;
        if (!removedId) return;
        setOrders(prev => prev.filter(o => o.id !== removedId));
        return;
      }
      const next = payload.new;
      if (!next) return;
      setOrders(prev => {
        const exists = prev.find(o => o.id === next.id);
        if (exists) {
          return prev.map(o => o.id === next.id ? next : o);
        }
        return [next, ...prev];
      });
    });

    const authSub = authService.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      if (updatedUser) {
        setPortalMode(updatedUser.role === 'Admin' ? 'admin' : 'trader');
      }
    });

    return () => {
      configSub?.unsubscribe();
      orderSub?.unsubscribe();
      if (authSub?.data?.subscription) {
        authSub.data.subscription.unsubscribe();
      }
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

  const handleCreateOrder = async (newOrderData: any) => {
    if (!user) return;
    const newOrder = {
      ...newOrderData,
      trader_id: user.id,
      trader_name: user.company_name || user.email.split('@')[0]
    };
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

  const handleUpdateMarketConfig = async (newConfig: MarketConfig): Promise<boolean> => {
    const prevConfig = marketConfig;
    setMarketConfig(newConfig); // optimistic — Bazaar sees the change immediately
    const success = await marketService.updateConfig(newConfig);
    if (!success) {
      setMarketConfig(prevConfig); // rollback on failure
    }
    return success;
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setPortalMode('trader');
  };

  const isConfigured = isSupabaseConfigured;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing IQEX Platform...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-rose-600 dark:text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Connection Error</h1>
          <div className="text-slate-600 dark:text-slate-400 mb-6 space-y-4 text-sm bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-border text-left">
            <p className="font-medium text-rose-500">{initError}</p>
            <div className="pt-2 border-t border-border space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Diagnostic Info</p>
              <div className="flex justify-between items-center">
                <span>Supabase Reachable</span>
                <span className={supabaseUrl.includes('placeholder') ? 'text-rose-500' : 'text-emerald-500'}>
                  {supabaseUrl.includes('placeholder') ? '✗ Not Set' : '✓ Attempted'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] break-all opacity-60">
                <span>URL: {supabaseUrl.substring(0, 15)}...{supabaseUrl.substring(supabaseUrl.length - 5)}</span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed italic opacity-80">
              Note: This usually happens if your Supabase project is <strong>paused</strong> or the <strong>URL/Key</strong> in Settings is incorrect.
            </p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.512m14.44 4.44A9 9 0 118 19.46M21 12a9 9 0 01-9 9m9-9H3v9m9-9V3" /></svg>
              Try Again
            </button>
            <div className="text-[11px] text-slate-500 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-200/50 dark:border-amber-800/10 text-left">
              <p className="font-bold mb-1">Still not working?</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Check if your Supabase project is active (not paused).</li>
                <li>Ensure you ran the <strong>SUPABASE_SETUP.sql</strong> script in the Supabase SQL Editor.</li>
                <li>Verify your <strong>VITE_SUPABASE_URL</strong> matches your Project URL exactly.</li>
              </ul>
            </div>
          </div>
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
              <span className="text-slate-500">SUPABASE_URL</span>
              <span className={(import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL)) ? "text-emerald-500" : "text-rose-500"}>
                {(import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL)) ? "✓ Set" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SUPABASE_KEY</span>
              <span className={(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY))) ? "text-emerald-500" : "text-rose-500"}>
                {(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY))) ? "✓ Set" : "✗ Missing"}
              </span>
            </div>
            
            {/* Format Warning */}
            {isSupabaseConfigured && (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('pk_') || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('pk_'))) && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-[12px] text-amber-800 dark:text-amber-200 leading-normal">
                <p className="font-bold mb-1">⚠️ Incorrect Key Format</p>
                <p>The provided key starts with 'pk_', which looks like a <strong>Stripe</strong> key. Supabase keys usually start with 'eyJ' (Anon) or 'sb_publishable'. Please check your credentials in the Supabase Dashboard.</p>
              </div>
            )}
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
