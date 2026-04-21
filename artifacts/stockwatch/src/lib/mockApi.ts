// Mock API for GitHub Pages deployment (no backend required)
// This allows the app to work on static hosting without a server

import type {
  StockQuote,
  StockSearchResult,
  WatchlistItem,
  PortfolioPosition,
  PortfolioSummary,
  MarketMovers,
} from "@workspace/api-zod";

// Mock stock data
const mockStocks: Record<string, StockQuote> = {
  AAPL: {
    symbol: "AAPL",
    shortName: "Apple Inc.",
    longName: "Apple Inc.",
    currentPrice: 175.5,
    previousClose: 173.2,
    open: 174.0,
    dayHigh: 176.2,
    dayLow: 174.5,
    volume: 45000000,
    marketCap: 2800000000000,
    change: 2.3,
    changePercent: 1.33,
    fiftyTwoWeekHigh: 199.62,
    fiftyTwoWeekLow: 164.08,
    currency: "USD",
    marketState: "REGULAR",
    timestamp: new Date().toISOString(),
  },
  GOOGL: {
    symbol: "GOOGL",
    shortName: "Alphabet Inc.",
    longName: "Alphabet Inc. Class A",
    currentPrice: 142.8,
    previousClose: 140.5,
    open: 141.2,
    dayHigh: 143.5,
    dayLow: 141.0,
    volume: 28000000,
    marketCap: 1800000000000,
    change: 2.3,
    changePercent: 1.64,
    fiftyTwoWeekHigh: 191.75,
    fiftyTwoWeekLow: 129.4,
    currency: "USD",
    marketState: "REGULAR",
    timestamp: new Date().toISOString(),
  },
  MSFT: {
    symbol: "MSFT",
    shortName: "Microsoft Corp.",
    longName: "Microsoft Corporation",
    currentPrice: 380.25,
    previousClose: 375.8,
    open: 377.0,
    dayHigh: 382.5,
    dayLow: 376.5,
    volume: 22000000,
    marketCap: 2800000000000,
    change: 4.45,
    changePercent: 1.18,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 362.9,
    currency: "USD",
    marketState: "REGULAR",
    timestamp: new Date().toISOString(),
  },
  TSLA: {
    symbol: "TSLA",
    shortName: "Tesla Inc.",
    longName: "Tesla, Inc.",
    currentPrice: 245.8,
    previousClose: 238.5,
    open: 240.0,
    dayHigh: 248.5,
    dayLow: 239.5,
    volume: 98000000,
    marketCap: 780000000000,
    change: 7.3,
    changePercent: 3.06,
    fiftyTwoWeekHigh: 299.29,
    fiftyTwoWeekLow: 138.8,
    currency: "USD",
    marketState: "REGULAR",
    timestamp: new Date().toISOString(),
  },
  AMZN: {
    symbol: "AMZN",
    shortName: "Amazon.com Inc.",
    longName: "Amazon.com, Inc.",
    currentPrice: 185.4,
    previousClose: 182.2,
    open: 183.0,
    dayHigh: 186.5,
    dayLow: 182.5,
    volume: 42000000,
    marketCap: 1900000000000,
    change: 3.2,
    changePercent: 1.76,
    fiftyTwoWeekHigh: 201.2,
    fiftyTwoWeekLow: 144.05,
    currency: "USD",
    marketState: "REGULAR",
    timestamp: new Date().toISOString(),
  },
};

// Mock watchlist stored in localStorage
const WATCHLIST_KEY = "stockwatch_watchlist";
const PORTFOLIO_KEY = "stockwatch_portfolio";

function getWatchlist(): WatchlistItem[] {
  const stored = localStorage.getItem(WATCHLIST_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

function saveWatchlist(watchlist: WatchlistItem[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}

function getPortfolio(): PortfolioPosition[] {
  const stored = localStorage.getItem(PORTFOLIO_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

function savePortfolio(portfolio: PortfolioPosition[]) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
}

// Mock API implementation
export const mockApi = {
  get: async <T>(path: string): Promise<T> => {
    await delay(300); // Simulate network delay

    if (path === "/healthz") {
      return { status: "ok" } as T;
    }

    if (path.startsWith("/stocks/quote?")) {
      const symbol = path.split("symbol=")[1];
      const stock = mockStocks[symbol];
      if (stock) {
        return stock as T;
      }
      throw new Error("Stock not found");
    }

    if (path.startsWith("/stocks/quotes?")) {
      const symbols = path.split("symbols=")[1]?.split(",") || [];
      const quotes = symbols
        .map((s) => mockStocks[s])
        .filter(Boolean) as StockQuote[];
      return quotes as T;
    }

    if (path.startsWith("/stocks/search?q=")) {
      const query = path.split("q=")[1]?.toLowerCase() || "";
      const results: StockSearchResult[] = Object.values(mockStocks)
        .filter(
          (s) =>
            s.symbol.toLowerCase().includes(query) ||
            s.shortName?.toLowerCase().includes(query)
        )
        .map((s) => ({
          symbol: s.symbol,
          shortname: s.shortName,
          longname: s.longName,
          exchDisp: "NASDAQ",
          typeDisp: "Equity",
        }));
      return results as T;
    }

    if (path === "/stocks/trending") {
      return Object.values(mockStocks).slice(0, 5) as T;
    }

    if (path === "/stocks/movers") {
      return {
        gainers: Object.values(mockStocks).slice(0, 3),
        losers: Object.values(mockStocks).slice(3, 5),
      } as T;
    }

    if (path === "/watchlist") {
      return getWatchlist() as T;
    }

    if (path === "/portfolio") {
      return getPortfolio() as T;
    }

    if (path === "/portfolio/summary") {
      const portfolio = getPortfolio();
      const positions = portfolio.map((p) => {
        const stock = mockStocks[p.symbol];
        const currentPrice = stock?.currentPrice || p.buyPrice;
        const currentValue = currentPrice * p.shares;
        const costBasis = p.buyPrice * p.shares;
        return {
          ...p,
          currentPrice,
          currentValue,
          costBasis,
          gainLoss: currentValue - costBasis,
          gainLossPercent: ((currentValue - costBasis) / costBasis) * 100,
          shortName: stock?.shortName || p.symbol,
        };
      });

      const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
      const totalCost = positions.reduce((sum, p) => sum + p.costBasis, 0);

      return {
        totalValue,
        totalCost,
        totalGainLoss: totalValue - totalCost,
        totalGainLossPercent: ((totalValue - totalCost) / totalCost) * 100,
        positions,
      } as T;
    }

    throw new Error(`Unknown endpoint: ${path}`);
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    await delay(300);

    if (path === "/watchlist") {
      const { symbol } = body as { symbol: string };
      const watchlist = getWatchlist();

      if (watchlist.some((item) => item.symbol === symbol)) {
        throw new Error("Stock already in watchlist");
      }

      const newItem: WatchlistItem = {
        id: Date.now(),
        symbol,
        addedAt: new Date().toISOString(),
      };

      watchlist.push(newItem);
      saveWatchlist(watchlist);
      return newItem as T;
    }

    if (path === "/portfolio") {
      const { symbol, shares, buyPrice, notes } = body as {
        symbol: string;
        shares: number;
        buyPrice: number;
        notes?: string;
      };

      const portfolio = getPortfolio();

      const newPosition: PortfolioPosition = {
        id: Date.now(),
        symbol,
        shares,
        buyPrice,
        addedAt: new Date().toISOString(),
        notes,
      };

      portfolio.push(newPosition);
      savePortfolio(portfolio);
      return newPosition as T;
    }

    throw new Error(`Unknown POST endpoint: ${path}`);
  },

  patch: async <T>(path: string, body: unknown): Promise<T> => {
    await delay(300);

    const portfolioMatch = path.match(/\/portfolio\/(\d+)/);
    if (portfolioMatch) {
      const id = parseInt(portfolioMatch[1]);
      const portfolio = getPortfolio();
      const index = portfolio.findIndex((p) => p.id === id);

      if (index === -1) {
        throw new Error("Position not found");
      }

      portfolio[index] = { ...portfolio[index], ...(body as Partial<PortfolioPosition>) };
      savePortfolio(portfolio);
      return portfolio[index] as T;
    }

    throw new Error(`Unknown PATCH endpoint: ${path}`);
  },

  delete: async (path: string): Promise<void> => {
    await delay(300);

    const watchlistMatch = path.match(/\/watchlist\/(\d+)/);
    if (watchlistMatch) {
      const id = parseInt(watchlistMatch[1]);
      const watchlist = getWatchlist();
      const filtered = watchlist.filter((item) => item.id !== id);
      saveWatchlist(filtered);
      return;
    }

    const portfolioMatch = path.match(/\/portfolio\/(\d+)/);
    if (portfolioMatch) {
      const id = parseInt(portfolioMatch[1]);
      const portfolio = getPortfolio();
      const filtered = portfolio.filter((p) => p.id !== id);
      savePortfolio(filtered);
      return;
    }

    throw new Error(`Unknown DELETE endpoint: ${path}`);
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
