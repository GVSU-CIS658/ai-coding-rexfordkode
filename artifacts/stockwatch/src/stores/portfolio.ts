import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../lib/api";

export interface PortfolioPosition {
  id: number;
  symbol: string;
  shares: number;
  buyPrice: number;
  notes?: string | null;
  addedAt: string;
}

export interface PortfolioPositionWithQuote extends PortfolioPosition {
  currentPrice?: number | null;
  currentValue?: number | null;
  costBasis: number;
  gainLoss?: number | null;
  gainLossPercent?: number | null;
  shortName?: string | null;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  positions: PortfolioPositionWithQuote[];
}

export const usePortfolioStore = defineStore("portfolio", () => {
  const summary = ref<PortfolioSummary | null>(null);
  const positions = ref<PortfolioPosition[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPortfolio() {
    try {
      loading.value = true;
      const data = await api.get<PortfolioPosition[]>("/portfolio");
      positions.value = data;
    } catch (e) {
      error.value = "Failed to load portfolio";
    } finally {
      loading.value = false;
    }
  }

  async function fetchSummary() {
    try {
      loading.value = true;
      const data = await api.get<PortfolioSummary>("/portfolio/summary");
      summary.value = data;
    } catch (e) {
      error.value = "Failed to load portfolio summary";
    } finally {
      loading.value = false;
    }
  }

  async function addPosition(symbol: string, shares: number, buyPrice: number, notes?: string) {
    try {
      const position = await api.post<PortfolioPosition>("/portfolio", { symbol, shares, buyPrice, notes: notes || null });
      positions.value.push(position);
      return position;
    } catch (e) {
      throw e;
    }
  }

  async function updatePosition(id: number, data: { shares?: number; buyPrice?: number; notes?: string | null }) {
    try {
      const updated = await api.patch<PortfolioPosition>(`/portfolio/${id}`, data);
      const idx = positions.value.findIndex(p => p.id === id);
      if (idx !== -1) positions.value[idx] = updated;
      return updated;
    } catch (e) {
      throw e;
    }
  }

  async function deletePosition(id: number) {
    try {
      await api.delete(`/portfolio/${id}`);
      positions.value = positions.value.filter(p => p.id !== id);
      if (summary.value) {
        summary.value.positions = summary.value.positions.filter(p => p.id !== id);
      }
    } catch (e) {
      throw e;
    }
  }

  return {
    summary,
    positions,
    loading,
    error,
    fetchPortfolio,
    fetchSummary,
    addPosition,
    updatePosition,
    deletePosition,
  };
});
