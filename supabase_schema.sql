-- ================================================================
-- 1. PROFILES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  address TEXT,
  kyc_status TEXT DEFAULT 'None' CHECK (kyc_status IN ('Pending', 'Verified', 'Rejected', 'None')),
  role TEXT DEFAULT 'Trader' CHECK (role IN ('Trader', 'Admin')),
  tier TEXT DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Silver', 'Gold', 'Platinum')),
  subscription_status TEXT DEFAULT 'None' CHECK (subscription_status IN ('Active', 'Expired', 'Frozen', 'Pending', 'None')),
  subscription_expiry TIMESTAMPTZ,
  is_frozen BOOLEAN DEFAULT FALSE,
  favorite_cities TEXT[],
  wallet JSONB DEFAULT '{"iqd_balance": 0, "usd_balance": 0}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- HELPER: is_admin() — SECURITY DEFINER bypasses RLS, 
-- preventing infinite recursion in all admin policies
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- BUG FIX: was recursive (queried profiles inside profiles policy)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE USING (public.is_admin());


-- ================================================================
-- 2. MARKET_CONFIG
-- ================================================================
CREATE TABLE IF NOT EXISTS public.market_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users
);

ALTER TABLE public.market_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view market config" ON public.market_config;
CREATE POLICY "Anyone can view market config"
  ON public.market_config FOR SELECT USING (TRUE);

-- BUG FIX: split FOR ALL into explicit operations; was recursive via profiles
DROP POLICY IF EXISTS "Only admins can insert market config" ON public.market_config;
CREATE POLICY "Only admins can insert market config"
  ON public.market_config FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update market config" ON public.market_config;
CREATE POLICY "Only admins can update market config"
  ON public.market_config FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete market config" ON public.market_config;
CREATE POLICY "Only admins can delete market config"
  ON public.market_config FOR DELETE USING (public.is_admin());


-- ================================================================
-- 3. ORDERS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trader_id UUID REFERENCES auth.users NOT NULL,
  trader_name TEXT NOT NULL,
  metal TEXT NOT NULL CHECK (metal IN ('Gold', 'Silver', 'Platinum', 'Palladium')),
  purity TEXT,
  type TEXT NOT NULL CHECK (type IN ('Buy', 'Sell')),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('Gram', 'Kilogram', 'Ounce')),
  price_per_unit NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'IQD')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Negotiating', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  location TEXT NOT NULL,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('Fixed', 'SpotRelated')),
  expiry_time TIMESTAMPTZ,
  premium NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open orders" ON public.orders;
CREATE POLICY "Anyone can view open orders"
  ON public.orders FOR SELECT USING (status = 'Open' OR trader_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
  ON public.orders FOR INSERT WITH CHECK (trader_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE USING (trader_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
CREATE POLICY "Users can delete their own orders"
  ON public.orders FOR DELETE USING (trader_id = auth.uid());

-- BUG FIX: was recursive via profiles
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL USING (public.is_admin());


-- ================================================================
-- 4. TRADES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders NOT NULL,
  buyer_id UUID REFERENCES auth.users NOT NULL,
  seller_id UUID REFERENCES auth.users NOT NULL,
  metal TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  contract_id TEXT
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- BUG FIX: missing INSERT — system/negotiation flow couldn't create trades
DROP POLICY IF EXISTS "Users can insert trades they are party to" ON public.trades;
CREATE POLICY "Users can insert trades they are party to"
  ON public.trades FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- BUG FIX: was recursive via profiles
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
CREATE POLICY "Admins can view all trades"
  ON public.trades FOR SELECT USING (public.is_admin());


-- ================================================================
-- 5. NOTIFICATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  link TEXT
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- BUG FIX: no policy existed for inserting notifications (system/admin push)
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL USING (public.is_admin());


-- ================================================================
-- 6. WALLET_TRANSACTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Deposit', 'Withdrawal')),
  method TEXT NOT NULL CHECK (method IN ('Card', 'Cash', 'ZainCash')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'IQD')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT USING (user_id = auth.uid());

-- BUG FIX: missing INSERT — users couldn't submit deposit/withdrawal requests
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can insert their own transactions"
  ON public.wallet_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- BUG FIX: was recursive via profiles
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can manage all transactions"
  ON public.wallet_transactions FOR ALL USING (public.is_admin());


-- ================================================================
-- 7. NEGOTIATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.negotiations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders NOT NULL,
  buyer_id UUID REFERENCES auth.users NOT NULL,
  seller_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Accepted', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own negotiations" ON public.negotiations;
CREATE POLICY "Users can view their own negotiations"
  ON public.negotiations FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- BUG FIX: missing INSERT — no one could open a negotiation
DROP POLICY IF EXISTS "Users can insert negotiations they are party to" ON public.negotiations;
CREATE POLICY "Users can insert negotiations they are party to"
  ON public.negotiations FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own negotiations" ON public.negotiations;
CREATE POLICY "Users can update their own negotiations"
  ON public.negotiations FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());


-- ================================================================
-- 8. MESSAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negotiation_id UUID REFERENCES public.negotiations NOT NULL,
  sender_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Message', 'Offer', 'Accept', 'Reject')),
  offer_price NUMERIC,
  offer_quantity NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their negotiations" ON public.messages;
CREATE POLICY "Users can view messages in their negotiations"
  ON public.messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.negotiations
      WHERE id = negotiation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their negotiations" ON public.messages;
CREATE POLICY "Users can send messages to their negotiations"
  ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.negotiations
      WHERE id = negotiation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );


-- ================================================================
-- 9. CONTRACTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID REFERENCES public.trades NOT NULL,
  buyer_id UUID REFERENCES auth.users NOT NULL,
  seller_id UUID REFERENCES auth.users NOT NULL,
  buyer_name TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  metal TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Signed' CHECK (status IN ('Signed', 'Completed', 'Cancelled')),
  buyer_signature TEXT,
  seller_signature TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own contracts" ON public.contracts;
CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- BUG FIX: missing INSERT — contracts could never be created
DROP POLICY IF EXISTS "Users can insert contracts they are party to" ON public.contracts;
CREATE POLICY "Users can insert contracts they are party to"
  ON public.contracts FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own contracts" ON public.contracts;
CREATE POLICY "Users can update their own contracts"
  ON public.contracts FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());


-- ================================================================
-- 10. PRICE_ALERTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  metal TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own price alerts" ON public.price_alerts;
CREATE POLICY "Users can manage their own price alerts"
  ON public.price_alerts FOR ALL USING (user_id = auth.uid());


-- ================================================================
-- TRIGGER: Auto-create profile on signup
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name, role, updated_at)
  VALUES (new.id, new.email, '', 'Trader', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();