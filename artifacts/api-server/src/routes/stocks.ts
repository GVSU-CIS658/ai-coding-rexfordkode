import { Router, type IRouter } from "express";
import { fetchQuotes, searchSymbols, TRENDING_SYMBOLS, POPULAR_SYMBOLS } from "../lib/yahooFinance";
import {
  GetStockQuoteQueryParams,
  GetBatchStockQuotesQueryParams,
  SearchStocksQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapQuote(q: Awaited<ReturnType<typeof fetchQuotes>>[0]) {
  return {
    symbol: q.symbol,
    shortName: q.shortName ?? q.symbol,
    longName: q.longName ?? null,
    currentPrice: q.regularMarketPrice,
    previousClose: q.regularMarketPreviousClose,
    open: q.regularMarketOpen ?? null,
    dayHigh: q.regularMarketDayHigh ?? null,
    dayLow: q.regularMarketDayLow ?? null,
    volume: q.regularMarketVolume ?? null,
    marketCap: q.marketCap ?? null,
    change: q.regularMarketChange,
    changePercent: q.regularMarketChangePercent,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
    currency: q.currency ?? "USD",
    marketState: q.marketState ?? "CLOSED",
    timestamp: q.regularMarketTime
      ? new Date(q.regularMarketTime * 1000).toISOString()
      : new Date().toISOString(),
  };
}

router.get("/stocks/quote", async (req, res): Promise<void> => {
  const parsed = GetStockQuoteQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const quotes = await fetchQuotes([parsed.data.symbol]);
  if (!quotes || quotes.length === 0) {
    res.status(404).json({ error: "Symbol not found" });
    return;
  }
  res.json(mapQuote(quotes[0]));
});

router.get("/stocks/quotes", async (req, res): Promise<void> => {
  const parsed = GetBatchStockQuotesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const symbols = parsed.data.symbols.split(",").map(s => s.trim()).filter(Boolean);
  const quotes = await fetchQuotes(symbols);
  res.json(quotes.map(mapQuote));
});

router.get("/stocks/search", async (req, res): Promise<void> => {
  const parsed = SearchStocksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const results = await searchSymbols(parsed.data.q);
  res.json(results);
});

router.get("/stocks/trending", async (_req, res): Promise<void> => {
  const quotes = await fetchQuotes(TRENDING_SYMBOLS);
  res.json(quotes.map(mapQuote));
});

router.get("/stocks/movers", async (_req, res): Promise<void> => {
  const quotes = await fetchQuotes(POPULAR_SYMBOLS);
  const mapped = quotes.map(mapQuote);
  const sorted = [...mapped].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.filter(q => q.changePercent > 0).slice(0, 5);
  const losers = sorted.filter(q => q.changePercent < 0).slice(0, 5).reverse();
  res.json({ gainers, losers });
});

export default router;
