import type { Ref } from "vue";

export async function withLoading<T>(state: Ref<boolean>, task: () => Promise<T>): Promise<T> {
  state.value = true;
  try {
    return await task();
  } finally {
    state.value = false;
  }
}
