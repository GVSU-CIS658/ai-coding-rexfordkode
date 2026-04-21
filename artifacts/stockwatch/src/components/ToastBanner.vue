<template>
  <Transition name="slide-up">
    <div
      v-if="message"
      class="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg text-sm flex items-center gap-2 z-50"
      role="status"
      aria-live="polite"
    >
      <CheckCircle class="w-4 h-4 text-green-400" />
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { CheckCircle } from "lucide-vue-next";

defineProps<{
  message: string | null;
}>();
</script>
