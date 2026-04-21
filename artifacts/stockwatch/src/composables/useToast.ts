import { onBeforeUnmount, ref } from "vue";

export function useToast(timeoutMs = 2500) {
  const toast = ref<string | null>(null);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function showToast(message: string) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    toast.value = message;
    timeoutId = setTimeout(() => {
      toast.value = null;
      timeoutId = null;
    }, timeoutMs);
  }

  onBeforeUnmount(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  return { toast, showToast };
}
