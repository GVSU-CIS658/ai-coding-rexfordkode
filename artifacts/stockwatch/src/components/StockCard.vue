<template>
  <div
    class="bg-card border border-border rounded-xl p-4 hover:border-border/80 hover:bg-card/80 transition-all duration-200 cursor-pointer group"
    :class="flashClass"
    @click="$router.push(`/stock/${quote.symbol}`)"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-sm mono tracking-wide text-foreground">{{ quote.symbol }}</span>
          <span
            v-if="quote.marketState !== 'REGULAR'"
            class="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wide"
          >
            {{ quote.marketState === 'PRE' ? 'Pre' : quote.marketState === 'POST' ? 'After' : 'Closed' }}
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-0.5 truncate">{{ quote.shortName }}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="font-semibold text-sm mono">{{ formatPrice(quote.currentPrice, quote.currency) }}</p>
        <p
          class="text-xs mono mt-0.5 font-medium"
          :class="isPositive(quote.changePercent) ? 'text-green-400' : 'text-red-400'"
        >
          {{ formatChange(quote.change) }} ({{ formatPercent(quote.changePercent) }})
        </p>
      </div>
    </div>

    <div v-if="showActions" class="flex gap-2 mt-3 pt-3 border-t border-border/50">
      <button
        v-if="!inWatchlist"
        @click.stop="$emit('add-to-watchlist', quote.symbol)"
        class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
      >
        <BookmarkPlus class="w-3.5 h-3.5" />
        <span>Watchlist</span>
      </button>
      <button
        v-else
        @click.stop="$emit('remove-from-watchlist', quote.symbol)"
        class="flex items-center gap-1.5 text-xs text-primary transition-colors px-2 py-1 rounded-md bg-primary/10"
      >
        <BookmarkCheck class="w-3.5 h-3.5" />
        <span>Watching</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { BookmarkPlus, BookmarkCheck } from "lucide-vue-next";
import { formatPrice, formatChange, formatPercent, isPositive } from "../lib/format";
import type { StockQuote } from "../stores/stocks";

const props = defineProps<{
  quote: StockQuote;
  showActions?: boolean;
  inWatchlist?: boolean;
}>();

defineEmits<{
  "add-to-watchlist": [symbol: string];
  "remove-from-watchlist": [symbol: string];
}>();

const flashClass = ref("");

watch(() => props.quote.currentPrice, (newVal, oldVal) => {
  if (oldVal === undefined) return;
  flashClass.value = newVal > oldVal ? "flash-green" : newVal < oldVal ? "flash-red" : "";
  setTimeout(() => { flashClass.value = ""; }, 700);
});
</script>
