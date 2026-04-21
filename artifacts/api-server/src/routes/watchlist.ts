import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, watchlistTable } from "@workspace/db";
import {
  AddToWatchlistBody,
  RemoveFromWatchlistParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/watchlist", async (_req, res): Promise<void> => {
  const items = await db.select().from(watchlistTable).orderBy(watchlistTable.addedAt);
  res.json(items.map(i => ({
    id: i.id,
    symbol: i.symbol,
    addedAt: i.addedAt.toISOString(),
  })));
});

router.post("/watchlist", async (req, res): Promise<void> => {
  const parsed = AddToWatchlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(watchlistTable)
    .where(eq(watchlistTable.symbol, parsed.data.symbol.toUpperCase()));

  if (existing.length > 0) {
    res.status(409).json({ error: "Symbol already in watchlist" });
    return;
  }

  const [item] = await db.insert(watchlistTable)
    .values({ symbol: parsed.data.symbol.toUpperCase() })
    .returning();

  res.status(201).json({
    id: item.id,
    symbol: item.symbol,
    addedAt: item.addedAt.toISOString(),
  });
});

router.delete("/watchlist/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFromWatchlistParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(watchlistTable)
    .where(eq(watchlistTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
