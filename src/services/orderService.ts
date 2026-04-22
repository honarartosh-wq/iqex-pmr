import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../types';

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data as Order[];
  },

  async createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
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
          callback(payload.new as Order);
        }
      )
      .subscribe();
  }
};
