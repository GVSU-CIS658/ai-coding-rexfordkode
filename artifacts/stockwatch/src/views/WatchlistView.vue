<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ stockStore.watchlist.length }} stocks tracked</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="refreshQuotes"
          class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-card border border-transparent hover:border-border"
          :disabled="refreshing">
          <RefreshCw class="w-3.5 h-3.5" :class="refreshing ? 'animate-spin' : ''" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
        <button @click="showAddModal = true"
          class="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground hover:opacity-90 px-3 py-2 rounded-lg transition-all font-medium">
          <Plus class="w-3.5 h-3.5" />
          <span>Add Stock</span>
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" fullScreen />

    <!-- Empty state -->
    <div v-else-if="stockStore.watchlist.length === 0" class="text-center py-16">
      <div class="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-4">
        <Bookmark class="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 class="font-semibold text-base mb-1.5">Your watchlist is empty</h3>
      <p class="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Add stocks you want to monitor and track their
        performance over time</p>
      <button @click="showAddModal = true"
        class="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-lg transition-all font-medium">
        <Plus class="w-4 h-4" />
        Add your first stock
      </button>
    </div>

    <!-- Watchlist grid -->
    <div v-else>
      <!-- Summary row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard v-for="stat in summaryStats" :key="stat.label" :label="stat.label" :value="stat.value"
          :valueClass="stat.valueClass" />
      </div>

      <!-- Table - Desktop -->
      <div class="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Symbol
              </th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Price
              </th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Change
              </th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">%
                Change</th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Volume
              </th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Mkt Cap
              </th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in watchlistWithQuotes" :key="item.id"
              class="border-b border-border/50 last:border-0 hover:bg-accent/30 cursor-pointer transition-colors"
              @click="$router.push(`/stock/${item.symbol}`)">
              <td class="px-4 py-3">
                <div>
                  <p class="font-semibold text-sm mono">{{ item.symbol }}</p>
                  <p class="text-xs text-muted-foreground truncate max-w-35">{{ item.quote?.shortName ?? item.symbol }}
                  </p>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm mono font-medium">{{ item.quote ? formatPrice(item.quote.currentPrice) : "—"
                  }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm mono"
                  :class="item.quote && item.quote.change >= 0 ? 'text-green-400' : 'text-red-400'">
                  {{ item.quote ? formatChange(item.quote.change) : "—" }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full mono"
                  :class="item.quote && item.quote.changePercent >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'">
                  {{ item.quote ? formatPercent(item.quote.changePercent) : "—" }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs text-muted-foreground mono">{{ item.quote ? formatVolume(item.quote.volume) : "—"
                  }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs text-muted-foreground mono">{{ item.quote ? formatMarketCap(item.quote.marketCap) :
                  "—" }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click.stop="removeItem(item.id, item.symbol)"
                  class="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div class="md:hidden space-y-2">
        <div v-for="item in watchlistWithQuotes" :key="item.id" class="bg-card border border-border rounded-xl p-4">
          <div class="flex items-start justify-between">
            <div class="cursor-pointer flex-1" @click="$router.push(`/stock/${item.symbol}`)">
              <div class="flex items-center gap-2">
                <span class="font-semibold mono text-sm">{{ item.symbol }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">{{ item.quote?.shortName ?? item.symbol }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold mono text-sm">{{ item.quote ? formatPrice(item.quote.currentPrice) : "—" }}</p>
              <p class="text-xs mono mt-0.5"
                :class="item.quote && item.quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ item.quote ? formatPercent(item.quote.changePercent) : "—" }}
              </p>
            </div>
          </div>
          <div class="flex justify-end mt-2">
            <button @click="removeItem(item.id, item.symbol)"
              class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 class="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <AppModal v-model="showAddModal" title="Add to Watchlist"
      description="Search by ticker or company name and add a stock you want to track." size="md">
      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input v-model="addQuery" @input="onAddInput" type="text" placeholder="Search ticker or company..."
          class="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autofocus />
      </div>
      <div v-if="addResults.length > 0" class="space-y-1.5 max-h-60 overflow-y-auto">
        <button v-for="result in addResults" :key="result.symbol" @click="addSymbol(result.symbol)"
          class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent text-left transition-colors">
          <div>
            <span class="font-medium mono text-sm">{{ result.symbol }}</span>
            <p class="text-xs text-muted-foreground">{{ result.longname || result.shortname }}</p>
          </div>
          <Plus class="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div v-else-if="addQuery && !addLoading" class="text-sm text-muted-foreground text-center py-4">
        No results found
      </div>
      <div v-if="addLoading" class="text-center py-4">
        <LoadingSpinner size="sm" />
      </div>
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
import { RefreshCw, Plus, Bookmark, Trash2, Search, CheckCircle } from "lucide-vue-next";
import { useStockStore } from "../stores/stocks";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import StatCard from "../components/StatCard.vue";
import AppModal from "../components/AppModal.vue";
import { formatPrice, formatChange, formatPercent, formatVolume, formatMarketCap } from "../lib/format";
import { api } from "../lib/api";

const stockStore = useStockStore();
const loading = ref(false);
const refreshing = ref(false);
const showAddModal = ref(false);
const addQuery = ref("");
const addResults = ref<Array<{ symbol: string; shortname: string | null; longname: string | null; exchDisp: string; typeDisp: string }>>([]);
const addLoading = ref(false);
const toast = ref<string | null>(null);

const watchlistWithQuotes = computed(() =>
  stockStore.watchlist.map(item => ({
    ...item,
    quote: stockStore.watchlistQuotes.get(item.symbol) ?? null,
  }))
);

const summaryStats = computed(() => {
  const quotes = [...stockStore.watchlistQuotes.values()];
  if (quotes.length === 0) return [];
  const advances = quotes.filter(q => q.changePercent > 0).length;
  const declines = quotes.filter(q => q.changePercent < 0).length;
  const bestPerformer = [...quotes].sort((a, b) => b.changePercent - a.changePercent)[0];
  const worstPerformer = [...quotes].sort((a, b) => a.changePercent - b.changePercent)[0];

  return [
    { label: "Advancing", value: String(advances), valueClass: "text-green-400" },
    { label: "Declining", value: String(declines), valueClass: "text-red-400" },
    { label: "Best Today", value: bestPerformer ? `${bestPerformer.symbol} ${formatPercent(bestPerformer.changePercent)}` : "—", valueClass: "text-green-400" },
    { label: "Worst Today", value: worstPerformer ? `${worstPerformer.symbol} ${formatPercent(worstPerformer.changePercent)}` : "—", valueClass: "text-red-400" },
  ];
});

let debounceTimer: ReturnType<typeof setTimeout>;
function onAddInput() {
  clearTimeout(debounceTimer);
  if (!addQuery.value.trim()) { addResults.value = []; return; }
  debounceTimer = setTimeout(async () => {
    addLoading.value = true;
    try {
      addResults.value = await api.get(`/stocks/search?q=${encodeURIComponent(addQuery.value)}`);
    } finally {
      addLoading.value = false;
    }
  }, 300);
}

async function addSymbol(symbol: string) {
  const ok = await stockStore.addToWatchlist(symbol);
  showAddModal.value = false;
  addQuery.value = "";
  addResults.value = [];
  if (ok) showToast(`${symbol} added to watchlist`);
}

async function removeItem(id: number, symbol: string) {
  await stockStore.removeFromWatchlist(id);
  showToast(`${symbol} removed`);
}

async function refreshQuotes() {
  refreshing.value = true;
  await stockStore.refreshWatchlistQuotes();
  refreshing.value = false;
}

function showToast(msg: string) {
  toast.value = msg;
  setTimeout(() => { toast.value = null; }, 2500);
}

onMounted(async () => {
  loading.value = true;
  await stockStore.fetchWatchlist();
  loading.value = false;
});
</script>
