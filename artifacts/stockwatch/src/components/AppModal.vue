<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
                <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="close" />
                <div class="relative w-full rounded-2xl border border-border bg-card shadow-xl"
                    :class="containerSizeClass" @click.stop>
                    <div class="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                        <div>
                            <h3 class="font-semibold text-base">{{ title }}</h3>
                            <p v-if="description" class="mt-1 text-sm text-muted-foreground">
                                {{ description }}
                            </p>
                        </div>
                        <button type="button" class="text-muted-foreground transition-colors hover:text-foreground"
                            @click="close">
                            <X class="h-5 w-5" />
                        </button>
                    </div>
                    <div class="px-6 py-5">
                        <slot />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { X } from "lucide-vue-next";

type ModalSize = "sm" | "md" | "lg";

const props = withDefaults(
    defineProps<{
        modelValue: boolean;
        title: string;
        description?: string;
        size?: ModalSize;
    }>(),
    {
        size: "md",
    },
);

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const sizeClasses: Record<ModalSize, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
};

const containerSizeClass = computed(() => sizeClasses[props.size]);

function close() {
    emit("update:modelValue", false);
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && props.modelValue) {
        close();
    }
}

onMounted(() => {
    globalThis.window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
    globalThis.window.removeEventListener("keydown", onKeydown);
});
</script>