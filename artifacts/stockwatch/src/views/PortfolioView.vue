<template>
  <div class="p-4 md:p-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p class="text-sm text-muted-foreground mt-1">Track your investments and performance</p>
      </div>
      <button @click="showAddModal = true"
        class="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-lg transition-all font-medium">
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">Add Position</span>
        <span class="sm:hidden">Add</span>
      </button>
    </div>

    <LoadingSpinner v-if="portfolioStore.loading" fullScreen />

    <!-- Empty state -->
    <div v-else-if="!portfolioStore.summary || portfolioStore.summary.positions.length === 0" class="text-center py-16">
      <div class="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-4">
        <BarChart3 class="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 class="font-semibold text-base mb-1.5">No positions yet</h3>
      <p class="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Add your stock positions to track performance, cost
        basis, and total portfolio value</p>
      <button @click="showAddModal = true"
        class="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-lg transition-all font-medium">
        <Plus class="w-4 h-4" />
        Add your first position
      </button>
    </div>

    <div v-else>
      <!-- Portfolio Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-card border border-border rounded-xl p-4">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Value</p>
          <p class="text-xl font-semibold mono mt-1.5">{{ formatPrice(portfolioStore.summary.totalValue) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-4">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Cost</p>
          <p class="text-xl font-semibold mono mt-1.5">{{ formatPrice(portfolioStore.summary.totalCost) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-4 col-span-2">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Gain/Loss</p>
          <p class="text-xl font-semibold mono mt-1.5"
            :class="portfolioStore.summary.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ formatChange(portfolioStore.summary.totalGainLoss) }}
            <span class="text-base ml-1.5 opacity-80">{{ formatPercent(portfolioStore.summary.totalGainLossPercent)
              }}</span>
          </p>
        </div>
      </div>

      <!-- Positions Table - Desktop -->
      <div class="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Symbol
              </th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Shares
              </th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Buy
                Price</th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Current
              </th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Cost
                Basis</th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">Mkt
                Value</th>
              <th class="text-right text-xs text-muted-foreground font-medium px-4 py-3 uppercase tracking-wide">
                Gain/Loss</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pos in portfolioStore.summary.positions" :key="pos.id"
              class="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
              <td class="px-4 py-3 cursor-pointer" @click="$router.push(`/stock/${pos.symbol}`)">
                <div>
                  <p class="font-semibold mono text-sm">{{ pos.symbol }}</p>
                  <p class="text-xs text-muted-foreground truncate max-w-30">{{ pos.shortName ?? pos.symbol }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="mono text-sm">{{ pos.shares }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="mono text-sm">{{ formatPrice(pos.buyPrice) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="mono text-sm">{{ pos.currentPrice ? formatPrice(pos.currentPrice) : "—" }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="mono text-sm">{{ formatPrice(pos.costBasis) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="mono text-sm">{{ pos.currentValue ? formatPrice(pos.currentValue) : "—" }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div v-if="pos.gainLoss != null">
                  <p class="mono text-sm" :class="pos.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ formatChange(pos.gainLoss) }}
                  </p>
                  <p class="text-xs mono" :class="(pos.gainLossPercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ formatPercent(pos.gainLossPercent) }}
                  </p>
                </div>
                <span v-else class="text-muted-foreground">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click="deletePos(pos.id, pos.symbol)"
                  class="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div class="md:hidden space-y-3">
        <div v-for="pos in portfolioStore.summary.positions" :key="pos.id"
          class="bg-card border border-border rounded-xl p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="cursor-pointer" @click="$router.push(`/stock/${pos.symbol}`)">
              <p class="font-semibold mono text-sm">{{ pos.symbol }}</p>
              <p class="text-xs text-muted-foreground">{{ pos.shortName ?? pos.symbol }}</p>
            </div>
            <div class="text-right">
              <p class="mono text-sm font-semibold">{{ pos.currentPrice ? formatPrice(pos.currentPrice) : "—" }}</p>
              <p v-if="pos.gainLossPercent != null" class="text-xs mono"
                :class="pos.gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatPercent(pos.gainLossPercent) }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p class="text-muted-foreground">Shares</p>
              <p class="mono font-medium">{{ pos.shares }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Avg Cost</p>
              <p class="mono font-medium">{{ formatPrice(pos.buyPrice) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Gain/Loss</p>
              <p class="mono font-medium" :class="(pos.gainLoss ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ pos.gainLoss != null ? formatChange(pos.gainLoss) : "—" }}
              </p>
            </div>
          </div>
          <div class="flex justify-end mt-2 pt-2 border-t border-border/50">
            <button @click="deletePos(pos.id, pos.symbol)"
              class="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 class="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <AppModal v-model="showAddModal" title="Add Position"
      description="Track a stock position with your share count and average buy price." size="md">
      <form @submit.prevent="submitAdd" class="space-y-4">
        <div>
          <label for="portfolio-symbol" class="block text-xs text-muted-foreground font-medium mb-1.5">Ticker
            Symbol</label>
          <input id="portfolio-symbol" v-model="form.symbol" type="text" placeholder="e.g. AAPL" required
            class="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm mono uppercase placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="portfolio-shares" class="block text-xs text-muted-foreground font-medium mb-1.5">Shares</label>
            <input id="portfolio-shares" v-model.number="form.shares" type="number" step="0.001" min="0.001"
              placeholder="0.00" required
              class="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label for="portfolio-buy-price" class="block text-xs text-muted-foreground font-medium mb-1.5">Buy Price
              ($)</label>
            <input id="portfolio-buy-price" v-model.number="form.buyPrice" type="number" step="0.01" min="0.01"
              placeholder="0.00" required
              class="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label for="portfolio-notes" class="block text-xs text-muted-foreground font-medium mb-1.5">Notes
            (optional)</label>
          <input id="portfolio-notes" v-model="form.notes" type="text" placeholder="e.g. Long-term hold"
            class="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div v-if="form.shares && form.buyPrice" class="bg-secondary rounded-lg px-3 py-2.5">
          <p class="text-xs text-muted-foreground">Cost Basis</p>
          <p class="text-sm font-semibold mono">{{ formatPrice(form.shares * form.buyPrice) }}</p>
        </div>

        <div v-if="addError" class="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{{ addError }}</div>

        <button type="submit" :disabled="addLoading"
          class="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {{ addLoading ? "Adding..." : "Add Position" }}
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
import { ref, onMounted } from "vue";
import { Plus, BarChart3, Trash2, CheckCircle } from "lucide-vue-next";
import { usePortfolioStore } from "../stores/portfolio";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import AppModal from "../components/AppModal.vue";
import { formatPrice, formatChange, formatPercent } from "../lib/format";
import { useToast } from "../composables/useToast";

const portfolioStore = usePortfolioStore();
const showAddModal = ref(false);
const addLoading = ref(false);
const addError = ref<string | null>(null);
const form = ref({ symbol: "", shares: 0, buyPrice: 0, notes: "" });
const { toast, showToast } = useToast();

async function submitAdd() {
  addError.value = null;
  addLoading.value = true;
  try {
    await portfolioStore.addPosition(
      form.value.symbol.toUpperCase(),
      form.value.shares,
      form.value.buyPrice,
      form.value.notes || undefined
    );
    await portfolioStore.fetchSummary();
    closeModal();
    showToast(`${form.value.symbol.toUpperCase()} added to portfolio`);
  } catch (e: unknown) {
    addError.value = e instanceof Error ? e.message : "Failed to add position";
  } finally {
    addLoading.value = false;
  }
}

function closeModal() {
  showAddModal.value = false;
  form.value = { symbol: "", shares: 0, buyPrice: 0, notes: "" };
  addError.value = null;
}

async function deletePos(id: number, symbol: string) {
  await portfolioStore.deletePosition(id);
  await portfolioStore.fetchSummary();
  showToast(`${symbol} removed`);
}

onMounted(async () => {
  await portfolioStore.fetchSummary();
});
</script>
