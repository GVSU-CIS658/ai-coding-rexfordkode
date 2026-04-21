<template>
  <div class="min-h-screen bg-background text-foreground">
    <AppNav />
    <main class="pb-20 md:pb-0 md:pl-64 md:min-h-screen">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import AppNav from "./components/AppNav.vue";
</script>
