-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT,
  address TEXT,
  kyc_status TEXT DEFAULT 'None' CHECK (kyc_status IN ('Pending', 'Verified', 'Rejected', 'None')),
  role TEXT DEFAULT 'Trader' CHECK (role IN ('Trader', 'Admin')),
  tier TEXT DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Silver', 'Gold', 'Platinum')),
  kyc_docs JSONB DEFAULT '{}'::jsonb,
  subscription_status TEXT DEFAULT 'None' CHECK (subscription_status IN ('None', 'Active', 'Expired')),
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  is_frozen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Configuration table
CREATE TABLE IF NOT EXISTS market_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usd_iqd_index NUMERIC NOT NULL DEFAULT 1310,
  subscription_fee_iqd NUMERIC NOT NULL DEFAULT 10000,
  city_rates JSONB NOT NULL DEFAULT '{}'::jsonb,
  premiums JSONB NOT NULL DEFAULT '{}'::jsonb,
  transfer_fees JSONB NOT NULL DEFAULT '{}'::jsonb,
  local_prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metal TEXT NOT NULL,
  purity TEXT,
  type TEXT NOT NULL CHECK (type IN ('Buy', 'Sell')),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'IQD')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Negotiating', 'Completed', 'Cancelled')),
  location TEXT NOT NULL,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('Fixed', 'SpotRelated')),
  expiry_time TIMESTAMP WITH TIME ZONE,
  premium NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Negotiations table
CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Accepted', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'Message' CHECK (type IN ('Message', 'Offer', 'Accept', 'Reject')),
  offer_price NUMERIC,
  offer_quantity NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metal TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contract_id UUID
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  metal TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'Signed' CHECK (status IN ('Signed', 'Completed', 'Cancelled')),
  buyer_signature TEXT NOT NULL,
  seller_signature TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Market Configs: Everyone can read, only admins can update
CREATE POLICY "Market config is viewable by everyone" ON market_configs FOR SELECT USING (true);
CREATE POLICY "Admins can update market config" ON market_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- Orders: Everyone can read open orders, users can manage their own
CREATE POLICY "Orders are viewable by everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = trader_id);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = trader_id);

-- Negotiations: Only participants can read/write
CREATE POLICY "Negotiations viewable by participants" ON negotiations FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- Messages: Only participants can read/write
CREATE POLICY "Messages viewable by participants" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM negotiations 
    WHERE id = messages.negotiation_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- Trades: Participants can view
CREATE POLICY "Trades viewable by participants" ON trades FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- Contracts: Participants can view
CREATE POLICY "Contracts viewable by participants" ON contracts FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- Notifications: Users can manage their own
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, kyc_status)
  VALUES (new.id, new.email, 'Trader', 'None');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
