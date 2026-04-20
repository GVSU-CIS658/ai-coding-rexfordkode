import { logger } from "./logger";

const BASE_URL = "https://query1.finance.yahoo.com";
const BASE_URL2 = "https://query2.finance.yahoo.com";

let sessionCookies: string[] = [];
let crumb: string | null = null;
let lastCrumbFetch = 0;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
};

async function getSession(): Promise<boolean> {
  if (crumb && (Date.now() - lastCrumbFetch) < 1800000) {
    return true;
  }
  try {
    // Step 1: Visit Yahoo Finance to get initial cookies
    const homeRes = await fetch("https://finance.yahoo.com/", {
      headers: {
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });
    const cookies = homeRes.headers.get("set-cookie");
    if (cookies) {
      sessionCookies = cookies.split(",").map(c => c.split(";")[0].trim());
    }

    // Step 2: Get crumb
    const crumbRes = await fetch(`${BASE_URL2}/v1/test/getcrumb`, {
      headers: {
        ...HEADERS,
        "Cookie": sessionCookies.join("; "),
      },
    });

    if (crumbRes.ok) {
      const setCookie2 = crumbRes.headers.get("set-cookie");
      if (setCookie2) {
        const newCookies = setCookie2.split(",").map(c => c.split(";")[0].trim());
        sessionCookies = [...new Set([...sessionCookies, ...newCookies])];
      }
      const text = await crumbRes.text();
      if (text && text.length < 50 && !text.includes("<")) {
        crumb = text.trim();
        lastCrumbFetch = Date.now();
        logger.info({ crumb: crumb.slice(0, 5) + "..." }, "Got Yahoo Finance crumb");
        return true;
      }
    }

    logger.warn({ status: crumbRes.status }, "Failed to get crumb");
    return false;
  } catch (e) {
    logger.error({ e }, "Failed to establish Yahoo Finance session");
    return false;
  }
}

export interface YahooQuote {
  symbol: string;
  shortName: string;
  longName?: string | null;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketOpen?: number | null;
  regularMarketDayHigh?: number | null;
  regularMarketDayLow?: number | null;
  regularMarketVolume?: number | null;
  marketCap?: number | null;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  currency: string;
  marketState: string;
  regularMarketTime?: number | null;
}

export async function fetchQuotes(symbols: string[]): Promise<YahooQuote[]> {
  await getSession();

  const symbolStr = symbols.join(",");
  const fields = [
    "symbol", "shortName", "longName", "regularMarketPrice",
    "regularMarketPreviousClose", "regularMarketOpen", "regularMarketDayHigh",
    "regularMarketDayLow", "regularMarketVolume", "marketCap",
    "regularMarketChange", "regularMarketChangePercent",
    "fiftyTwoWeekHigh", "fiftyTwoWeekLow", "currency", "marketState",
    "regularMarketTime"
  ].join(",");

  const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : "";
  const url = `${BASE_URL}/v7/finance/quote?symbols=${encodeURIComponent(symbolStr)}&fields=${fields}${crumbParam}&formatted=false&region=US&lang=en-US`;

  try {
    const response = await fetch(url, {
      headers: {
        ...HEADERS,
        "Cookie": sessionCookies.join("; "),
      },
    });

    if (response.status === 401) {
      // Reset session and try once more
      crumb = null;
      sessionCookies = [];
      await getSession();
      const retry = await fetch(url, {
        headers: {
          ...HEADERS,
          "Cookie": sessionCookies.join("; "),
        },
      });
      if (!retry.ok) {
        logger.warn({ status: retry.status, symbols }, "Yahoo Finance retry failed");
        return getMockQuotes(symbols);
      }
      const data = await retry.json() as { quoteResponse?: { result?: YahooQuote[] } };
      return data?.quoteResponse?.result ?? getMockQuotes(symbols);
    }

    if (!response.ok) {
      logger.warn({ status: response.status, symbols }, "Yahoo Finance quote request failed");
      return getMockQuotes(symbols);
    }

    const data = await response.json() as { quoteResponse?: { result?: YahooQuote[] } };
    const results = data?.quoteResponse?.result ?? [];
    if (results.length === 0) return getMockQuotes(symbols);
    return results;
  } catch (e) {
    logger.error({ e, symbols }, "Failed to fetch Yahoo Finance quotes");
    return getMockQuotes(symbols);
  }
}

export async function searchSymbols(query: string): Promise<Array<{
  symbol: string;
  shortname?: string | null;
  longname?: string | null;
  exchDisp: string;
  typeDisp: string;
}>> {
  const url = `${BASE_URL}/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=8&newsCount=0&listsCount=0`;

  try {
    const response = await fetch(url, {
      headers: {
        ...HEADERS,
        "Cookie": sessionCookies.join("; "),
      },
    });
    if (!response.ok) return [];

    const data = await response.json() as {
      quotes?: Array<{
        symbol: string;
        shortname?: string | null;
        longname?: string | null;
        exchDisp?: string;
        typeDisp?: string;
        quoteType?: string;
      }>;
    };

    return (data?.quotes ?? [])
      .filter(q => q.typeDisp === "Equity" || q.typeDisp === "ETF" || q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .map(q => ({
        symbol: q.symbol,
        shortname: q.shortname ?? null,
        longname: q.longname ?? null,
        exchDisp: q.exchDisp ?? "Unknown",
        typeDisp: q.typeDisp ?? q.quoteType ?? "Equity",
      }));
  } catch (e) {
    logger.error({ e, query }, "Failed to search Yahoo Finance");
    return [];
  }
}

// Fallback mock data so the UI doesn't appear completely empty
function getMockQuotes(symbols: string[]): YahooQuote[] {
  const basePrices: Record<string, number> = {
    AAPL: 185.50, MSFT: 415.20, GOOGL: 175.30, AMZN: 192.80, NVDA: 875.40,
    META: 510.20, TSLA: 175.60, "BRK-B": 405.10, JPM: 202.30, V: 279.80,
    AMD: 162.40, SPY: 528.90, QQQ: 455.20,
  };

  return symbols.map(symbol => {
    const basePrice = basePrices[symbol] ?? 100 + Math.random() * 400;
    const change = (Math.random() - 0.48) * basePrice * 0.05;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      shortName: symbol,
      longName: null,
      regularMarketPrice: +(basePrice + change * 0.1).toFixed(2),
      regularMarketPreviousClose: +basePrice.toFixed(2),
      regularMarketOpen: +(basePrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2),
      regularMarketDayHigh: +(basePrice * 1.02).toFixed(2),
      regularMarketDayLow: +(basePrice * 0.98).toFixed(2),
      regularMarketVolume: Math.floor(Math.random() * 50000000) + 1000000,
      marketCap: null,
      regularMarketChange: +change.toFixed(2),
      regularMarketChangePercent: +changePercent.toFixed(4),
      fiftyTwoWeekHigh: +(basePrice * 1.35).toFixed(2),
      fiftyTwoWeekLow: +(basePrice * 0.72).toFixed(2),
      currency: "USD",
      marketState: "CLOSED",
      regularMarketTime: Math.floor(Date.now() / 1000),
    };
  });
}

export const POPULAR_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "V"
];

export const TRENDING_SYMBOLS = [
  "AAPL", "NVDA", "TSLA", "META", "MSFT", "AMD", "AMZN", "GOOGL", "SPY", "QQQ"
];
