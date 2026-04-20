<template>
  <div class="bg-card border border-border rounded-xl p-4">
    <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">{{ label }}</p>
    <p class="text-xl font-semibold mono mt-1.5" :class="valueClass">{{ value }}</p>
    <p v-if="sub" class="text-xs mt-0.5" :class="subClass">{{ sub }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  subClass?: string;
}>();
</script>
