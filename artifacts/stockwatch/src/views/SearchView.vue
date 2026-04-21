<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight">Search Stocks</h1>
      <p class="text-sm text-muted-foreground mt-1">Find any stock by ticker or company name</p>
    </div>

    <!-- Search Input -->
    <div class="relative mb-6">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        v-model="query"
        @input="onInput"
        type="search"
        placeholder="Search by ticker or name..."
        class="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        autofocus
      />
      <LoadingSpinner v-if="stockStore.searchLoading" size="sm" class="absolute right-3 top-1/2 -translate-y-1/2" />
    </div>

    <!-- Quick picks -->
    <div v-if="!query" class="mb-6">
      <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Popular Stocks</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="ticker in popularTickers"
          :key="ticker"
          @click="selectTicker(ticker)"
          class="px-3 py-1.5 text-xs bg-secondary hover:bg-accent rounded-lg mono font-medium transition-colors border border-border hover:border-primary/40"
        >
          {{ ticker }}
        </button>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="query && stockStore.searchResults.length > 0" class="space-y-2">
      <p class="text-xs text-muted-foreground mb-3">{{ stockStore.searchResults.length }} results</p>
      <TransitionGroup name="slide-up">
        <div
          v-for="result in stockStore.searchResults"
          :key="result.symbol"
          class="bg-card border border-border rounded-xl p-4 hover:border-primary/40 cursor-pointer transition-all group"
          @click="goToStock(result.symbol)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-bold mono text-foreground">{{ result.symbol.slice(0, 2) }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-semibold mono text-sm">{{ result.symbol }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{{ result.typeDisp }}</span>
                  <span class="text-[10px] text-muted-foreground">{{ result.exchDisp }}</span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">{{ result.longname || result.shortname || result.symbol }}</p>
              </div>
            </div>
            <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- No results -->
    <div
      v-else-if="query && !stockStore.searchLoading && stockStore.searchResults.length === 0"
      class="text-center py-12"
    >
      <Search class="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">No results found for "{{ query }}"</p>
      <p class="text-xs text-muted-foreground mt-1">Try a different ticker symbol or company name</p>
    </div>

    <!-- Quote preview -->
    <div v-if="selectedQuote" class="mt-6">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-medium">Quick Preview</p>
        <button @click="selectedQuote = null" class="text-muted-foreground hover:text-foreground">
          <X class="w-4 h-4" />
        </button>
      </div>
      <StockCard
        :quote="selectedQuote"
        :showActions="true"
        :inWatchlist="stockStore.watchlistSymbols.has(selectedQuote.symbol)"
        @add-to-watchlist="handleAddToWatchlist"
        @remove-from-watchlist="handleRemoveFromWatchlist"
      />
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Search, ChevronRight, X, CheckCircle } from "lucide-vue-next";
import { useStockStore } from "../stores/stocks";
import StockCard from "../components/StockCard.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import type { StockQuote } from "../stores/stocks";

const router = useRouter();
const stockStore = useStockStore();
const query = ref("");
const selectedQuote = ref<StockQuote | null>(null);
const toast = ref<string | null>(null);

const popularTickers = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "META", "AMZN", "SPY", "QQQ", "BRK-B"];

let debounceTimer: ReturnType<typeof setTimeout>;

function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    stockStore.searchStocks(query.value);
  }, 300);
}

async function selectTicker(ticker: string) {
  query.value = ticker;
  const quote = await stockStore.fetchQuote(ticker);
  if (quote) selectedQuote.value = quote;
}

function goToStock(symbol: string) {
  router.push(`/stock/${symbol}`);
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
</script>
