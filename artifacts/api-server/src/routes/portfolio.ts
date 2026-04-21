import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { requireDb, portfolioTable } from "@workspace/db";
import { fetchQuotes } from "../lib/yahooFinance";
import {
  AddPortfolioPositionBody,
  UpdatePortfolioPositionBody,
  DeletePortfolioPositionParams,
  UpdatePortfolioPositionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
const db = requireDb();

function mapPosition(p: typeof portfolioTable.$inferSelect) {
  return {
    id: p.id,
    symbol: p.symbol,
    shares: p.shares,
    buyPrice: p.buyPrice,
    notes: p.notes ?? null,
    addedAt: p.addedAt.toISOString(),
  };
}

router.get("/portfolio", async (_req, res): Promise<void> => {
  const positions = await db.select().from(portfolioTable).orderBy(portfolioTable.addedAt);
  res.json(positions.map(mapPosition));
});

router.post("/portfolio", async (req, res): Promise<void> => {
  const parsed = AddPortfolioPositionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [position] = await db.insert(portfolioTable)
    .values({
      symbol: parsed.data.symbol.toUpperCase(),
      shares: parsed.data.shares,
      buyPrice: parsed.data.buyPrice,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(mapPosition(position));
});

router.patch("/portfolio/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePortfolioPositionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePortfolioPositionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof portfolioTable.$inferInsert> = {};
  if (parsed.data.shares !== undefined) updateData.shares = parsed.data.shares;
  if (parsed.data.buyPrice !== undefined) updateData.buyPrice = parsed.data.buyPrice;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes ?? null;

  const [position] = await db.update(portfolioTable)
    .set(updateData)
    .where(eq(portfolioTable.id, params.data.id))
    .returning();

  if (!position) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  res.json(mapPosition(position));
});

router.delete("/portfolio/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePortfolioPositionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(portfolioTable)
    .where(eq(portfolioTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/portfolio/summary", async (_req, res): Promise<void> => {
  const positions = await db.select().from(portfolioTable).orderBy(portfolioTable.addedAt);

  if (positions.length === 0) {
    res.json({
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      positions: [],
    });
    return;
  }

  const symbols = [...new Set(positions.map(p => p.symbol))];
  const quotes = await fetchQuotes(symbols);
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

  let totalValue = 0;
  let totalCost = 0;

  const enrichedPositions = positions.map(p => {
    const quote = quoteMap.get(p.symbol);
    const costBasis = p.shares * p.buyPrice;
    const currentPrice = quote?.regularMarketPrice ?? null;
    const currentValue = currentPrice !== null ? p.shares * currentPrice : null;
    const gainLoss = currentValue !== null ? currentValue - costBasis : null;
    const gainLossPercent = gainLoss !== null ? (gainLoss / costBasis) * 100 : null;

    if (currentValue !== null) totalValue += currentValue;
    totalCost += costBasis;

    return {
      id: p.id,
      symbol: p.symbol,
      shares: p.shares,
      buyPrice: p.buyPrice,
      notes: p.notes ?? null,
      addedAt: p.addedAt.toISOString(),
      currentPrice,
      currentValue,
      costBasis,
      gainLoss,
      gainLossPercent,
      shortName: quote?.shortName ?? null,
    };
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  res.json({
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    positions: enrichedPositions,
  });
});

export default router;
