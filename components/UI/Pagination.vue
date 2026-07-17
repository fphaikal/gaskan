<script setup>
const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalItems: { type: Number, default: 0 },
  itemsPerPage: { type: Number, default: 15 },
  itemLabel: { type: String, default: 'data' },
  showPerPage: { type: Boolean, default: true },
  perPageOptions: { type: Array, default: () => [10, 15, 25, 50] },
});

const emit = defineEmits(['update:currentPage', 'update:itemsPerPage']);

const startItem = computed(() => Math.min((props.currentPage - 1) * props.itemsPerPage + 1, props.totalItems));
const endItem = computed(() => Math.min(props.currentPage * props.itemsPerPage, props.totalItems));

// Build smart page number list with ellipsis
const pageList = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  pages.push(1);
  if (current > 4) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
});
</script>

<template>
  <div v-if="totalPages > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-base-200/60 bg-base-100/50">
    <!-- Left: info + per-page -->
    <div class="flex items-center gap-3 text-xs text-base-content/50 font-medium">
      <span>
        Menampilkan <span class="font-black text-base-content">{{ startItem }}–{{ endItem }}</span>
        dari <span class="font-black text-base-content">{{ totalItems }}</span> {{ itemLabel }}
      </span>
      <div v-if="showPerPage" class="flex items-center gap-2">
        <span class="hidden sm:block">|</span>
        <select
          :value="itemsPerPage"
          @change="emit('update:itemsPerPage', Number($event.target.value)); emit('update:currentPage', 1)"
          class="select select-bordered select-xs rounded-lg bg-base-100 text-xs font-bold h-7 min-h-7 border-base-200"
        >
          <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }} / halaman</option>
        </select>
      </div>
    </div>

    <!-- Right: page buttons -->
    <div v-if="totalPages > 1" class="flex items-center gap-1">
      <!-- Prev -->
      <button
        @click="emit('update:currentPage', currentPage - 1)"
        :disabled="currentPage === 1"
        class="btn btn-xs btn-ghost btn-circle disabled:opacity-25 rounded-lg"
      >
        <Icon name="mingcute:left-line" size="16" />
      </button>

      <!-- Page numbers -->
      <template v-for="p in pageList" :key="p">
        <span v-if="p === '...'" class="px-1 text-base-content/30 font-bold text-xs">…</span>
        <button
          v-else
          @click="emit('update:currentPage', p)"
          :class="[
            'btn btn-xs rounded-lg w-8 h-8 font-black border-0 text-xs transition-all',
            currentPage === p
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow shadow-orange-500/30 scale-105'
              : 'btn-ghost hover:bg-base-200'
          ]"
        >{{ p }}</button>
      </template>

      <!-- Next -->
      <button
        @click="emit('update:currentPage', currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="btn btn-xs btn-ghost btn-circle disabled:opacity-25 rounded-lg"
      >
        <Icon name="mingcute:right-line" size="16" />
      </button>
    </div>
  </div>
</template>
