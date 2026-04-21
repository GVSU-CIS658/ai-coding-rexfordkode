<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <!-- Back button -->
    <button @click="router.back()"
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
            <span class="text-xs text-muted-foreground">{{ marketStateLabel }}</span>
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

      <!-- Dashboard Snapshot -->
      <div class="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-4 md:p-5 mb-6 shadow-lg">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_34%)]"></div>
        <div class="relative grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 backdrop-blur-sm">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-[0.25em] text-muted-foreground">Market Pulse</p>
                <h2 class="mt-2 text-3xl md:text-4xl font-bold mono tracking-tight">{{ formatPrice(quote.currentPrice, quote.currency) }}</h2>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span class="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    :class="quote.changePercent >= 0 ? 'border-green-400/40 bg-green-400/10 text-green-300' : 'border-red-400/40 bg-red-400/10 text-red-300'">
                    {{ formatChange(quote.change) }} / {{ formatPercent(quote.changePercent) }}
                  </span>
                  <span class="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {{ marketStateLabel }}
                  </span>
                  <span class="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {{ sessionMood }}
                  </span>
                </div>
                <p class="mt-3 max-w-md text-sm text-muted-foreground">
                  {{ sessionNarrative }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs uppercase tracking-[0.25em] text-muted-foreground">Ticker</p>
                <p class="mt-2 text-2xl font-semibold mono">{{ quote.symbol }}</p>
                <p class="text-sm text-muted-foreground">{{ quote.longName || quote.shortName }}</p>
              </div>
            </div>

            <div class="mt-5">
              <div class="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Session Range</span>
                <span>{{ sessionRangePercent.toFixed(0) }}% filled</span>
              </div>
              <div class="relative mt-2 h-3 overflow-hidden rounded-full bg-secondary/80">
                <div
                  class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400"
                  :style="{ width: `${sessionRangePercent}%` }"
                />
                <div
                  class="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 bg-card shadow-lg"
                  :class="quote.changePercent >= 0 ? 'border-green-400' : 'border-red-400'"
                  :style="{ left: `calc(${sessionRangePercent}% - 10px)` }"
                />
              </div>
              <div class="mt-2 flex items-center justify-between text-[11px] mono text-muted-foreground">
                <span>{{ formatPrice(quote.dayLow) }}</span>
                <span v-if="quote.open != null">Open {{ formatPrice(quote.open) }}</span>
                <span>{{ formatPrice(quote.dayHigh) }}</span>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="rounded-2xl border border-border/70 bg-background/60 p-3">
                <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Previous Close</p>
                <p class="mt-1 text-sm font-semibold mono">{{ formatPrice(quote.previousClose) }}</p>
              </div>
              <div class="rounded-2xl border border-border/70 bg-background/60 p-3">
                <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Open</p>
                <p class="mt-1 text-sm font-semibold mono">{{ formatPrice(quote.open) }}</p>
              </div>
              <div class="rounded-2xl border border-border/70 bg-background/60 p-3">
                <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Volume</p>
                <p class="mt-1 text-sm font-semibold mono">{{ formatVolume(quote.volume) }}</p>
              </div>
              <div class="rounded-2xl border border-border/70 bg-background/60 p-3">
                <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Market Cap</p>
                <p class="mt-1 text-sm font-semibold mono">{{ formatMarketCap(quote.marketCap) }}</p>
              </div>
            </div>
          </div>

          <div
            class="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
          >
            <div>
              <p class="text-xs uppercase tracking-[0.25em] text-muted-foreground">52W Compass</p>
              <div class="relative mx-auto mt-4 h-44 w-44">
                <div
                  class="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(34,197,94,0.15)]"
                  :style="weekRingStyle"
                />
                <div class="absolute inset-3 rounded-full border border-white/10 bg-card/95" />
                <div class="absolute inset-6 rounded-full border border-border bg-background/95 flex flex-col items-center justify-center">
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">Position</p>
                  <p class="mt-1 text-3xl font-bold mono">{{ weekRangePercent.toFixed(0) }}%</p>
                  <p class="text-xs text-muted-foreground">from 52W low</p>
                </div>
              </div>
            </div>

            <div class="grid w-full grid-cols-2 gap-3">
              <div class="rounded-2xl border border-border/70 bg-background/60 p-3 text-left">
                <p class="text-[11px] uppercase tracking-wide text-muted-foreground">To High</p>
                <p class="mt-1 text-sm font-semibold mono">{{ formatPrice(distanceToHigh) }}</p>
                <p class="text-[11px] text-muted-foreground">Remaining room</p>
              </div>
              <div class="rounded-2xl border border-border/70 bg-background/60 p-3 text-left">
                <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Above Low</p>
                <p class="mt-1 text-sm font-semibold mono">{{ formatPrice(distanceFromLow) }}</p>
                <p class="text-[11px] text-muted-foreground">Safety buffer</p>
              </div>
            </div>

            <div class="mt-3 w-full flex justify-between text-xs mono text-muted-foreground">
              <div>
                <p>Low</p>
                <p class="mt-0.5">{{ formatPrice(quote.fiftyTwoWeekLow) }}</p>
              </div>
              <div class="text-right">
                <p>High</p>
                <p class="mt-0.5">{{ formatPrice(quote.fiftyTwoWeekHigh) }}</p>
              </div>
            </div>
          </div>
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

    <ToastBanner :message="toast" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ChevronLeft, BookmarkPlus, BookmarkCheck, Plus,
  RefreshCw, AlertCircle
} from "lucide-vue-next";
import { useStockStore } from "../stores/stocks";
import { usePortfolioStore } from "../stores/portfolio";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import AppModal from "../components/AppModal.vue";
import ToastBanner from "../components/ToastBanner.vue";
import { formatPrice, formatChange, formatPercent, formatVolume, formatMarketCap } from "../lib/format";
import type { StockQuote } from "../stores/stocks";
import { withLoading } from "../lib/withLoading";
import { useToast } from "../composables/useToast";

const route = useRoute();
const router = useRouter();
const symbol = computed(() => (route.params.symbol as string).toUpperCase());
const stockStore = useStockStore();
const portfolioStore = usePortfolioStore();

const loading = ref(false);
const refreshing = ref(false);
const quote = ref<StockQuote | null>(null);
const showPortfolioModal = ref(false);
const portfolioForm = ref({ shares: 0, buyPrice: 0, notes: "" });
const portfolioLoading = ref(false);
const { toast, showToast } = useToast();

const inWatchlist = computed(() => stockStore.watchlistSymbols.has(symbol.value));

const marketStateLabel = computed(() => {
  if (!quote.value) return "Market Closed";
  if (quote.value.marketState === "REGULAR") return "Market Open";
  if (quote.value.marketState === "PRE") return "Pre-Market";
  if (quote.value.marketState === "POST") return "After-Hours";
  return "Market Closed";
});

const weekRangePercent = computed(() => {
  if (!quote.value?.fiftyTwoWeekLow || !quote.value?.fiftyTwoWeekHigh) return 0;
  const range = quote.value.fiftyTwoWeekHigh - quote.value.fiftyTwoWeekLow;
  if (range === 0) return 0;
  return Math.min(100, Math.max(0, ((quote.value.currentPrice - quote.value.fiftyTwoWeekLow) / range) * 100));
});

const sessionRangePercent = computed(() => {
  if (quote.value?.dayLow == null || quote.value?.dayHigh == null) return 0;
  const range = quote.value.dayHigh - quote.value.dayLow;
  if (range === 0) return 0;
  return Math.min(100, Math.max(0, ((quote.value.currentPrice - quote.value.dayLow) / range) * 100));
});

const distanceToHigh = computed(() => {
  if (quote.value?.fiftyTwoWeekHigh == null) return null;
  return Math.max(0, quote.value.fiftyTwoWeekHigh - quote.value.currentPrice);
});

const distanceFromLow = computed(() => {
  if (quote.value?.fiftyTwoWeekLow == null) return null;
  return Math.max(0, quote.value.currentPrice - quote.value.fiftyTwoWeekLow);
});

const sessionMood = computed(() => {
  const movement = Math.abs(quote.value?.changePercent ?? 0);
  if (movement >= 5) return "Volatile";
  if (movement >= 2) return "Active";
  if (movement >= 0.5) return "Steady";
  return "Calm";
});

const sessionNarrative = computed(() => {
  if (!quote.value) return "";
  if (quote.value.changePercent > 0) {
    return `The tape is leaning higher, with price ${formatPercent(quote.value.changePercent)} on the day and ${formatPrice(distanceFromLow.value)} above the 52-week low.`;
  }
  if (quote.value.changePercent < 0) {
    return `Momentum is cooling off, but price still sits ${formatPrice(distanceFromLow.value)} above the 52-week low and ${formatPrice(distanceToHigh.value)} below the 52-week high.`;
  }
  return `Price is trading flat, with the current quote sitting ${formatPrice(distanceFromLow.value)} above the 52-week low.`;
});

const weekRingStyle = computed(() => {
  const activeColor = quote.value && quote.value.changePercent >= 0 ? "rgb(74 222 128)" : "rgb(248 113 113)";
  return {
    background: `conic-gradient(${activeColor} 0% ${weekRangePercent.value}%, rgba(255,255,255,0.08) ${weekRangePercent.value}% 100%)`,
  };
});

async function loadQuote() {
  await withLoading(loading, async () => {
    await updateQuote();
  });
}

async function refreshQuote() {
  await withLoading(refreshing, async () => {
    await updateQuote();
  });
}

async function updateQuote() {
  quote.value = await stockStore.fetchQuote(symbol.value);
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
