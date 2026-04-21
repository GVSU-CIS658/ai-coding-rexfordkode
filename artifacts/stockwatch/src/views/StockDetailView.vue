<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <!-- Back button -->
    <button @click="$router.back()"
      class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
      <ChevronLeft class="w-4 h-4" />
      Back
    </button>

    <LoadingSpinner v-if="loading" fullScreen />

    <div v-else-if="!quote" class="text-center py-16">
      <AlertCircle class="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <h3 class="font-semibold mb-1">Symbol not found</h3>
      <p class="text-sm text-muted-foreground">Could not load data for "{{ symbol }}"</p>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border">
              <span class="text-sm font-bold mono">{{ symbol.slice(0, 2) }}</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold mono tracking-tight">{{ quote.symbol }}</h1>
              <p class="text-sm text-muted-foreground">{{ quote.longName || quote.shortName }}</p>
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="text-3xl font-bold mono">{{ formatPrice(quote.currentPrice, quote.currency) }}</p>
          <p class="text-sm mono font-medium mt-0.5"
            :class="quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ formatChange(quote.change) }} ({{ formatPercent(quote.changePercent) }})
          </p>
          <div class="flex items-center gap-1 justify-end mt-1">
            <div class="w-1.5 h-1.5 rounded-full"
              :class="quote.marketState === 'REGULAR' ? 'bg-green-400' : 'bg-yellow-400'"></div>
            <span class="text-xs text-muted-foreground">{{ quote.marketState === 'REGULAR' ? 'Market Open' : quote.marketState === 'PRE' ? 'Pre-Market' : quote.marketState === 'POST' ? 'After-Hours' : 'Market Closed' }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 mb-6">
        <button v-if="!inWatchlist" @click="addToWatchlist"
          class="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-accent transition-all">
          <BookmarkPlus class="w-4 h-4" />
          Add to Watchlist
        </button>
        <button v-else @click="removeFromWatchlist"
          class="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 transition-all">
          <BookmarkCheck class="w-4 h-4" />
          In Watchlist
        </button>
        <button @click="showPortfolioModal = true"
          class="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all">
          <Plus class="w-4 h-4" />
          Add to Portfolio
        </button>
        <button @click="refreshQuote"
          class="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-card transition-all">
          <RefreshCw class="w-3.5 h-3.5" :class="refreshing ? 'animate-spin' : ''" />
        </button>
      </div>

      <!-- Key Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-xs text-muted-foreground mb-1">Previous Close</p>
          <p class="font-semibold mono text-sm">{{ formatPrice(quote.previousClose) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-xs text-muted-foreground mb-1">Open</p>
          <p class="font-semibold mono text-sm">{{ formatPrice(quote.open) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-xs text-muted-foreground mb-1">Day's Range</p>
          <p class="font-semibold mono text-sm">
            <span v-if="quote.dayLow && quote.dayHigh">{{ formatPrice(quote.dayLow) }} – {{ formatPrice(quote.dayHigh)
              }}</span>
            <span v-else>—</span>
          </p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-xs text-muted-foreground mb-1">Volume</p>
          <p class="font-semibold mono text-sm">{{ formatVolume(quote.volume) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-xs text-muted-foreground mb-1">Market Cap</p>
          <p class="font-semibold mono text-sm">{{ formatMarketCap(quote.marketCap) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-xs text-muted-foreground mb-1">52W Range</p>
          <p class="font-semibold mono text-sm">
            <span v-if="quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh">
              {{ formatPrice(quote.fiftyTwoWeekLow) }} – {{ formatPrice(quote.fiftyTwoWeekHigh) }}
            </span>
            <span v-else>—</span>
          </p>
        </div>
      </div>

      <!-- 52 Week Range Indicator -->
      <div v-if="quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh"
        class="bg-card border border-border rounded-xl p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">52-Week Range</p>
          <p class="text-xs text-muted-foreground mono">{{ weekRangePercent.toFixed(1) }}% from low</p>
        </div>
        <div class="relative h-2 bg-secondary rounded-full overflow-hidden">
          <div class="absolute left-0 top-0 h-full rounded-full"
            :class="quote.changePercent >= 0 ? 'bg-green-400' : 'bg-red-400'"
            :style="{ width: `${weekRangePercent}%` }"></div>
          <div class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border-2"
            :class="quote.changePercent >= 0 ? 'border-green-400' : 'border-red-400'"
            :style="{ left: `calc(${weekRangePercent}% - 6px)` }"></div>
        </div>
        <div class="flex justify-between mt-1.5">
          <span class="text-xs mono text-muted-foreground">{{ formatPrice(quote.fiftyTwoWeekLow) }}</span>
          <span class="text-xs mono text-muted-foreground">{{ formatPrice(quote.fiftyTwoWeekHigh) }}</span>
        </div>
      </div>

      <!-- Last Updated -->
      <p class="text-xs text-muted-foreground text-center">
        Last updated: {{ new Date(quote.timestamp).toLocaleString() }}
      </p>
    </div>

    <AppModal v-model="showPortfolioModal" title="Add to Portfolio"
      description="Record your position with shares and buy price." size="md">
      <div class="mb-4 flex items-center justify-between rounded-xl bg-secondary p-3">
        <span class="mono text-sm font-semibold">{{ symbol }}</span>
        <span class="mono text-sm text-muted-foreground">{{ quote ? formatPrice(quote.currentPrice) : "—" }}</span>
      </div>
      <form @submit.prevent="submitPortfolio" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="stock-shares" class="block text-xs text-muted-foreground font-medium mb-1.5">Shares</label>
            <input id="stock-shares" v-model.number="portfolioForm.shares" type="number" step="0.001" min="0.001"
              placeholder="0.00" required
              class="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label for="stock-buy-price" class="block text-xs text-muted-foreground font-medium mb-1.5">Buy Price
              ($)</label>
            <input id="stock-buy-price" v-model.number="portfolioForm.buyPrice" type="number" step="0.01" min="0.01"
              :placeholder="quote ? quote.currentPrice.toFixed(2) : '0.00'" required
              class="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label for="stock-notes" class="block text-xs text-muted-foreground font-medium mb-1.5">Notes
            (optional)</label>
          <input id="stock-notes" v-model="portfolioForm.notes" type="text" placeholder="e.g. Long-term hold"
            class="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button type="submit" :disabled="portfolioLoading"
          class="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {{ portfolioLoading ? "Adding..." : "Add Position" }}
        </button>
      </form>
    </AppModal>

    <!-- Toast -->
    <Transition name="slide-up">
      <div v-if="toast"
        class="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg text-sm flex items-center gap-2 z-50">
        <CheckCircle class="w-4 h-4 text-green-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  ChevronLeft, BookmarkPlus, BookmarkCheck, Plus,
  RefreshCw, AlertCircle, CheckCircle
} from "lucide-vue-next";
import { useStockStore } from "../stores/stocks";
import { usePortfolioStore } from "../stores/portfolio";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import AppModal from "../components/AppModal.vue";
import { formatPrice, formatChange, formatPercent, formatVolume, formatMarketCap } from "../lib/format";
import type { StockQuote } from "../stores/stocks";

const route = useRoute();
const symbol = computed(() => (route.params.symbol as string).toUpperCase());
const stockStore = useStockStore();
const portfolioStore = usePortfolioStore();

const loading = ref(false);
const refreshing = ref(false);
const quote = ref<StockQuote | null>(null);
const showPortfolioModal = ref(false);
const portfolioForm = ref({ shares: 0, buyPrice: 0, notes: "" });
const portfolioLoading = ref(false);
const toast = ref<string | null>(null);

const inWatchlist = computed(() => stockStore.watchlistSymbols.has(symbol.value));

const weekRangePercent = computed(() => {
  if (!quote.value?.fiftyTwoWeekLow || !quote.value?.fiftyTwoWeekHigh) return 0;
  const range = quote.value.fiftyTwoWeekHigh - quote.value.fiftyTwoWeekLow;
  if (range === 0) return 0;
  return Math.min(100, Math.max(0, ((quote.value.currentPrice - quote.value.fiftyTwoWeekLow) / range) * 100));
});

async function loadQuote() {
  loading.value = true;
  quote.value = await stockStore.fetchQuote(symbol.value);
  loading.value = false;
}

async function refreshQuote() {
  refreshing.value = true;
  quote.value = await stockStore.fetchQuote(symbol.value);
  refreshing.value = false;
}

async function addToWatchlist() {
  const ok = await stockStore.addToWatchlist(symbol.value);
  if (ok) showToast(`${symbol.value} added to watchlist`);
}

async function removeFromWatchlist() {
  const item = stockStore.watchlist.find(i => i.symbol === symbol.value);
  if (item) {
    await stockStore.removeFromWatchlist(item.id);
    showToast(`${symbol.value} removed from watchlist`);
  }
}

async function submitPortfolio() {
  portfolioLoading.value = true;
  try {
    await portfolioStore.addPosition(
      symbol.value,
      portfolioForm.value.shares,
      portfolioForm.value.buyPrice,
      portfolioForm.value.notes || undefined
    );
    showPortfolioModal.value = false;
    portfolioForm.value = { shares: 0, buyPrice: 0, notes: "" };
    showToast(`${symbol.value} added to portfolio`);
  } finally {
    portfolioLoading.value = false;
  }
}

function showToast(msg: string) {
  toast.value = msg;
  setTimeout(() => { toast.value = null; }, 2500);
}

onMounted(async () => {
  await Promise.all([
    loadQuote(),
    stockStore.fetchWatchlist(),
  ]);
  if (quote.value) {
    portfolioForm.value.buyPrice = quote.value.currentPrice;
  }
});
</script>
