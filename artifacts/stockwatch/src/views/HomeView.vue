<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight">Market Overview</h1>
      <p class="text-sm text-muted-foreground mt-1">Live stock data, updated in real-time</p>
    </div>

    <!-- Market Summary Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" v-if="!loading">
      <StatCard
        v-for="stat in marketStats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :valueClass="stat.valueClass"
        :sub="stat.sub"
        :subClass="stat.subClass"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Gainers -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-green-400" />
            <h2 class="font-semibold text-sm">Top Gainers</h2>
          </div>
          <span class="text-xs text-muted-foreground">Today</span>
        </div>
        <LoadingSpinner v-if="loading" fullScreen />
        <div v-else class="space-y-2">
          <StockCard
            v-for="stock in gainers"
            :key="stock.symbol"
            :quote="stock"
            :showActions="true"
            :inWatchlist="watchlistSymbols.has(stock.symbol)"
            @add-to-watchlist="handleAddToWatchlist"
            @remove-from-watchlist="handleRemoveFromWatchlist"
          />
          <div v-if="gainers.length === 0" class="text-sm text-muted-foreground text-center py-8 bg-card rounded-xl border border-border">
            No gainers data available
          </div>
        </div>
      </div>

      <!-- Losers -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <TrendingDown class="w-4 h-4 text-red-400" />
            <h2 class="font-semibold text-sm">Top Losers</h2>
          </div>
          <span class="text-xs text-muted-foreground">Today</span>
        </div>
        <LoadingSpinner v-if="loading" fullScreen />
        <div v-else class="space-y-2">
          <StockCard
            v-for="stock in losers"
            :key="stock.symbol"
            :quote="stock"
            :showActions="true"
            :inWatchlist="watchlistSymbols.has(stock.symbol)"
            @add-to-watchlist="handleAddToWatchlist"
            @remove-from-watchlist="handleRemoveFromWatchlist"
          />
          <div v-if="losers.length === 0" class="text-sm text-muted-foreground text-center py-8 bg-card rounded-xl border border-border">
            No losers data available
          </div>
        </div>
      </div>
    </div>

    <!-- Trending Stocks -->
    <div class="mt-8">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Flame class="w-4 h-4 text-orange-400" />
          <h2 class="font-semibold text-sm">Trending Stocks</h2>
        </div>
        <button
          @click="refreshData"
          class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          :disabled="loading"
        >
          <RefreshCw class="w-3 h-3" :class="loading ? 'animate-spin' : ''" />
          <span>Refresh</span>
        </button>
      </div>
      <LoadingSpinner v-if="loading" fullScreen />
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <StockCard
          v-for="stock in stockStore.trending"
          :key="stock.symbol"
          :quote="stock"
          :showActions="true"
          :inWatchlist="watchlistSymbols.has(stock.symbol)"
          @add-to-watchlist="handleAddToWatchlist"
          @remove-from-watchlist="handleRemoveFromWatchlist"
        />
      </div>
    </div>

    <!-- Toast -->
    <Transition name="slide-up">
      <div
        v-if="toast"
        class="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg text-sm flex items-center gap-2 z-50"
      >
        <CheckCircle class="w-4 h-4 text-green-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { TrendingUp, TrendingDown, Flame, RefreshCw, CheckCircle } from "lucide-vue-next";
import { useStockStore } from "../stores/stocks";
import StockCard from "../components/StockCard.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import StatCard from "../components/StatCard.vue";
import { formatPercent } from "../lib/format";

const stockStore = useStockStore();
const loading = ref(false);
const toast = ref<string | null>(null);

const watchlistSymbols = computed(() => stockStore.watchlistSymbols);
const gainers = computed(() => stockStore.marketMovers.gainers);
const losers = computed(() => stockStore.marketMovers.losers);

const marketStats = computed(() => {
  const all = stockStore.trending;
  if (all.length === 0) return [];
  const advances = all.filter(s => s.changePercent > 0).length;
  const declines = all.filter(s => s.changePercent < 0).length;
  const avgChange = all.reduce((a, b) => a + b.changePercent, 0) / all.length;
  const topGainer = [...all].sort((a, b) => b.changePercent - a.changePercent)[0];

  return [
    { label: "Advancing", value: String(advances), valueClass: "text-green-400", sub: "stocks today", subClass: "text-muted-foreground" },
    { label: "Declining", value: String(declines), valueClass: "text-red-400", sub: "stocks today", subClass: "text-muted-foreground" },
    { label: "Avg Change", value: formatPercent(avgChange), valueClass: avgChange >= 0 ? "text-green-400" : "text-red-400", sub: "across trending", subClass: "text-muted-foreground" },
    { label: "Top Gainer", value: topGainer?.symbol ?? "—", valueClass: "text-foreground", sub: formatPercent(topGainer?.changePercent), subClass: "text-green-400" },
  ];
});

async function refreshData() {
  loading.value = true;
  await Promise.all([
    stockStore.fetchTrending(),
    stockStore.fetchMarketMovers(),
    stockStore.fetchWatchlist(),
  ]);
  loading.value = false;
}

function showToast(msg: string) {
  toast.value = msg;
  setTimeout(() => { toast.value = null; }, 2500);
}

async function handleAddToWatchlist(symbol: string) {
  const ok = await stockStore.addToWatchlist(symbol);
  if (ok) showToast(`${symbol} added to watchlist`);
}

async function handleRemoveFromWatchlist(symbol: string) {
  const item = stockStore.watchlist.find(i => i.symbol === symbol);
  if (item) {
    await stockStore.removeFromWatchlist(item.id);
    showToast(`${symbol} removed from watchlist`);
  }
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    stockStore.fetchTrending(),
    stockStore.fetchMarketMovers(),
    stockStore.fetchWatchlist(),
  ]);
  loading.value = false;
});
</script>
