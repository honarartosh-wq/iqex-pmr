import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../types';

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(company_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data.map(order => ({
      ...order,
      trader_name: order.profiles?.company_name || 'Unknown Trader'
    })) as Order[];
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'trader_name'>): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return null;
    }

    return data as Order;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return false;
    }

    return true;
  },

  subscribeToOrders(callback: (order: Order) => void) {
    return supabase
      .channel('order_changes')
      .on(
        'postgres_changes',
        { event: '*', table: 'orders', schema: 'public' },
        async (payload) => {
          // Fetch trader name if it's a new order
          if (payload.eventType === 'INSERT') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('company_name')
              .eq('id', payload.new.trader_id)
              .single();
            
            callback({
              ...payload.new,
              trader_name: profile?.company_name || 'Unknown Trader'
            } as Order);
          } else {
            callback(payload.new as Order);
          }
        }
      )
      .subscribe();
  }
};
