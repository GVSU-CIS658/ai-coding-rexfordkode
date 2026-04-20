<template>
  <!-- Desktop Sidebar -->
  <aside class="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50">
    <div class="p-6 border-b border-border">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <TrendingUp class="w-5 h-5 text-primary" />
        </div>
        <span class="text-lg font-semibold tracking-tight">StockWatch</span>
      </div>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150 group"
        active-class="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span class="text-sm font-medium">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-border">
      <div class="text-xs text-muted-foreground space-y-0.5">
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span>Live Market Data</span>
        </div>
        <div class="ml-3 text-[10px] opacity-60">Powered by Yahoo Finance</div>
      </div>
    </div>
  </aside>

  <!-- Mobile Bottom Nav -->
  <nav class="fixed bottom-0 inset-x-0 md:hidden z-50 bg-card border-t border-border safe-area-pb">
    <div class="flex items-center justify-around py-2">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-all"
        active-class="text-primary"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { LayoutDashboard, Search, Bookmark, BarChart3, TrendingUp } from "lucide-vue-next";

const navItems = [
  { to: "/", label: "Market", icon: LayoutDashboard },
  { to: "/search", label: "Search", icon: Search },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/portfolio", label: "Portfolio", icon: BarChart3 },
];
</script>
