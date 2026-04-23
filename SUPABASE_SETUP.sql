-- IQEX SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor

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
-- HELPER: is_admin() — SECURITY DEFINER bypasses RLS
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================================
-- 2. MARKET_CONFIG
-- ================================================================
CREATE TABLE IF NOT EXISTS public.market_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users
);

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

-- RLS RULES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- Market Config Policies
DROP POLICY IF EXISTS "Anyone can view market config" ON public.market_config;
CREATE POLICY "Anyone can view market config" ON public.market_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage market config" ON public.market_config;
CREATE POLICY "Admins can manage market config" ON public.market_config FOR ALL USING (public.is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Anyone can view open orders" ON public.orders;
CREATE POLICY "Anyone can view open orders" ON public.orders FOR SELECT USING (status = 'Open' OR trader_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;
CREATE POLICY "Users can manage own orders" ON public.orders FOR ALL USING (trader_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.is_admin());

-- Insert initial config
-- NOTE: The UI expects the full shape described in src/types/index.ts
-- (MarketConfig). Missing keys (e.g. local_prices.Gold) cause
-- "Cannot convert undefined or null to object" in the admin portal.
INSERT INTO public.market_config (id, data)
VALUES ('current', '{
  "usd_iqd_index": 1480,
  "subscription_fee_iqd": 150000,
  "city_rates": {
    "Baghdad": {"bid": 1475, "ask": 1485, "transfer_fees": {"UAE": {"to_usd": 150, "from_usd": -120}, "Turkey": {"to_usd": 180, "from_usd": -140}}},
    "Erbil": {"bid": 1478, "ask": 1482, "transfer_fees": {"UAE": {"to_usd": 140, "from_usd": -110}}},
    "Basra": {"bid": 1470, "ask": 1490, "transfer_fees": {"UAE": {"to_usd": 160, "from_usd": -130}}}
  },
  "premiums": {
    "Gold": {"usd_per_kg": 450, "iqd_per_kg": 666000},
    "Silver": {"usd_per_kg": 15, "iqd_per_kg": 22200},
    "Platinum": {"usd_per_kg": 200, "iqd_per_kg": 296000},
    "Palladium": {"usd_per_kg": 300, "iqd_per_kg": 444000}
  },
  "transfer_fees": {
    "Türkiye": {"to_usd_per_10k": 50, "from_usd_per_10k": 40},
    "UAE": {"to_usd_per_10k": 45, "from_usd_per_10k": 35}
  },
  "local_prices": {
    "Gold": {
      "24K": {"bid_iqd": 98500, "ask_iqd": 99200},
      "22K": {"bid_iqd": 90200, "ask_iqd": 90900},
      "21K": {"bid_iqd": 86100, "ask_iqd": 86800},
      "18K": {"bid_iqd": 73800, "ask_iqd": 74500}
    },
    "Silver": {
      "999": {"bid_iqd": 1250, "ask_iqd": 1350},
      "925": {"bid_iqd": 1150, "ask_iqd": 1250}
    },
    "Platinum": {"bid_iqd": 45000, "ask_iqd": 46500},
    "Palladium": {"bid_iqd": 48000, "ask_iqd": 49500}
  }
}')
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
