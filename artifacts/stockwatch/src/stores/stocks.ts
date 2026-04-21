import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../lib/api";

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName?: string | null;
  currentPrice: number;
  previousClose: number;
  open?: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  volume?: number | null;
  marketCap?: number | null;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  currency: string;
  marketState: string;
  timestamp: string;
}

export interface WatchlistItem {
  id: number;
  symbol: string;
  addedAt: string;
}

export const useStockStore = defineStore("stocks", () => {
  const trending = ref<StockQuote[]>([]);
  const marketMovers = ref<{ gainers: StockQuote[]; losers: StockQuote[] }>({ gainers: [], losers: [] });
  const watchlist = ref<WatchlistItem[]>([]);
  const watchlistQuotes = ref<Map<string, StockQuote>>(new Map());
  const searchResults = ref<Array<{ symbol: string; shortname: string | null; longname: string | null; exchDisp: string; typeDisp: string }>>([]);
  const loading = ref(false);
  const searchLoading = ref(false);
  const error = ref<string | null>(null);

  const watchlistSymbols = computed(() => new Set(watchlist.value.map(i => i.symbol)));

  async function fetchTrending() {
    try {
      loading.value = true;
      const data = await api.get<StockQuote[]>("/stocks/trending");
      trending.value = data;
    } catch (e) {
      error.value = "Failed to load trending stocks";
    } finally {
      loading.value = false;
    }
  }

  async function fetchMarketMovers() {
    try {
      const data = await api.get<{ gainers: StockQuote[]; losers: StockQuote[] }>("/stocks/movers");
      marketMovers.value = data;
    } catch (e) {
      error.value = "Failed to load market movers";
    }
  }

  async function fetchQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const data = await api.get<StockQuote>(`/stocks/quote?symbol=${encodeURIComponent(symbol)}`);
      return data;
    } catch (e) {
      return null;
    }
  }

  async function fetchBatchQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (symbols.length === 0) return [];
    try {
      const data = await api.get<StockQuote[]>(`/stocks/quotes?symbols=${encodeURIComponent(symbols.join(","))}`);
      return data;
    } catch (e) {
      return [];
    }
  }

  async function searchStocks(query: string) {
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }
    try {
      searchLoading.value = true;
      const data = await api.get<typeof searchResults.value>(`/stocks/search?q=${encodeURIComponent(query)}`);
      searchResults.value = data;
    } catch (e) {
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }

  async function fetchWatchlist() {
    try {
      const data = await api.get<WatchlistItem[]>("/watchlist");
      watchlist.value = data;
      if (data.length > 0) {
        const symbols = data.map(i => i.symbol);
        const quotes = await fetchBatchQuotes(symbols);
        const map = new Map<string, StockQuote>();
        quotes.forEach(q => map.set(q.symbol, q));
        watchlistQuotes.value = map;
      }
    } catch (e) {
      error.value = "Failed to load watchlist";
    }
  }

  async function addToWatchlist(symbol: string) {
    try {
      const item = await api.post<WatchlistItem>("/watchlist", { symbol });
      watchlist.value.push(item);
      const quote = await fetchQuote(symbol);
      if (quote) {
        watchlistQuotes.value.set(symbol, quote);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async function removeFromWatchlist(id: number) {
    try {
      const item = watchlist.value.find(i => i.id === id);
      await api.delete(`/watchlist/${id}`);
      watchlist.value = watchlist.value.filter(i => i.id !== id);
      if (item) watchlistQuotes.value.delete(item.symbol);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function refreshWatchlistQuotes() {
    if (watchlist.value.length === 0) return;
    const symbols = watchlist.value.map(i => i.symbol);
    const quotes = await fetchBatchQuotes(symbols);
    const map = new Map<string, StockQuote>();
    quotes.forEach(q => map.set(q.symbol, q));
    watchlistQuotes.value = map;
  }

  return {
    trending,
    marketMovers,
    watchlist,
    watchlistQuotes,
    searchResults,
    loading,
    searchLoading,
    error,
    watchlistSymbols,
    fetchTrending,
    fetchMarketMovers,
    fetchQuote,
    fetchBatchQuotes,
    searchStocks,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    refreshWatchlistQuotes,
  };
});
