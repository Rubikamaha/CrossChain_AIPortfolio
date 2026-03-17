/**
 * Service to fetch real-time token prices from CoinGecko
 */

interface PriceCache {
  data: Record<string, number>;
  timestamp: number;
}

let cache: PriceCache | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export const priceService = {
  /**
   * Fetch ETH and USDC prices
   */
  async getPrices(): Promise<Record<string, number>> {
    const now = Date.now();
    
    if (cache && (now - cache.timestamp < CACHE_DURATION)) {
      return cache.data;
    }

    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd"
      );
      
      if (!response.ok) throw new Error("CoinGecko API failure");
      
      const data = await response.json();
      
      const result = {
        ETH: data.ethereum?.usd || 0,
        USDC: data["usd-coin"]?.usd || 1
      };
      
      cache = {
        data: result,
        timestamp: now
      };
      
      return result;
    } catch (error) {
      console.error("Price fetch error:", error);
      // Fallback to cache if available even if expired, or return empty
      return cache?.data || { ETH: 0, USDC: 1 };
    }
  }
};
