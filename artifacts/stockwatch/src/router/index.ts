import { createRouter, createWebHistory } from "vue-router";

const basePath = import.meta.env.BASE_URL;

const router = createRouter({
  history: createWebHistory(basePath),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/search",
      name: "search",
      component: () => import("../views/SearchView.vue"),
    },
    {
      path: "/watchlist",
      name: "watchlist",
      component: () => import("../views/WatchlistView.vue"),
    },
    {
      path: "/portfolio",
      name: "portfolio",
      component: () => import("../views/PortfolioView.vue"),
    },
    {
      path: "/stock/:symbol",
      name: "stock",
      component: () => import("../views/StockDetailView.vue"),
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
