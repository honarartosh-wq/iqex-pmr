import { Order, MetalType } from '../types';

export interface MatchResult {
  buyOrder: Order;
  sellOrder: Order;
  overlapPrice: number;
  potentialProfit?: number;
}

class MatchingEngine {
  /**
   * Finds orders that could potentially trade with each other.
   * A match exists if:
   * 1. Metal and Purity are the same.
   * 2. Buy Price >= Sell Price.
   * 3. Location is compatible (optional but preferred).
   */
  public findMatches(orders: Order[]): MatchResult[] {
    const matches: MatchResult[] = [];
    const buyOrders = orders.filter(o => o.type === 'Buy' && o.status === 'Open');
    const sellOrders = orders.filter(o => o.type === 'Sell' && o.status === 'Open');

    for (const buy of buyOrders) {
      for (const sell of sellOrders) {
        // Basic matching criteria
        if (
          buy.trader_id !== sell.trader_id &&
          buy.metal === sell.metal &&
          buy.purity === sell.purity &&
          buy.currency === sell.currency &&
          buy.price_per_unit >= sell.price_per_unit
        ) {
          matches.push({
            buyOrder: buy,
            sellOrder: sell,
            overlapPrice: (buy.price_per_unit + sell.price_per_unit) / 2,
            potentialProfit: buy.price_per_unit - sell.price_per_unit
          });
        }
      }
    }

    return matches.sort((a, b) => (b.potentialProfit || 0) - (a.potentialProfit || 0));
  }

  /**
   * Finds suggested matches for a specific order.
   */
  public findMatchesForOrder(order: Order, allOrders: Order[]): Order[] {
    if (order.status !== 'Open') return [];

    return allOrders.filter(o => {
      if (o.id === order.id || o.status !== 'Open' || o.type === order.type) return false;
      if (o.trader_id === order.trader_id) return false;
      if (o.metal !== order.metal || o.purity !== order.purity || o.currency !== order.currency) return false;

      if (order.type === 'Buy') {
        return order.price_per_unit >= o.price_per_unit;
      } else {
        return o.price_per_unit >= order.price_per_unit;
      }
    });
  }
}

export const matchingEngine = new MatchingEngine();
