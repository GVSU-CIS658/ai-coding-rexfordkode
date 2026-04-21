<template>
  <div class="flex items-center justify-center" :class="fullScreen ? 'min-h-64' : ''">
    <div
      class="border-2 border-border border-t-primary rounded-full animate-spin"
      :class="sizeClass"
    ></div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";

export default defineComponent({
  name: "LoadingSpinner",
  props: {
    size: {
      type: String,
      default: "md",
    },
    fullScreen: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const sizeClass = computed(() => {
      switch (props.size) {
        case "sm": return "w-4 h-4";
        case "lg": return "w-10 h-10";
        default: return "w-7 h-7";
      }
    });

    return { sizeClass };
  },
});
</script>
