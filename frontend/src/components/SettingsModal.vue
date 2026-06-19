<template>
  <n-modal
    :show="show"
    preset="card"
    title="图库设置"
    style="width: 520px"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <div class="flex flex-col gap-5">
      <!-- Current library -->
      <div>
        <div class="text-xs text-gray-500 mb-1">当前图库</div>
        <div class="text-sm text-gray-300 font-mono bg-gray-800 rounded px-3 py-2 break-all leading-relaxed">
          {{ activeLibraryName || '（未设置）' }}
        </div>
        <div
          v-if="activeLibraryPath"
          class="text-xs text-gray-600 mt-1 font-mono truncate"
          :title="activeLibraryPath"
        >
          {{ activeLibraryPath }}
        </div>
      </div>

      <!-- Library selector -->
      <div>
        <div class="text-xs text-gray-500 mb-2">切换图库</div>

        <n-select
          v-model:value="selectedPath"
          :options="libraryOptions"
          placeholder="选择一个图库…"
          :loading="loadingLibraries"
          style="width: 100%"
        />

        <div v-if="errorMsg" class="mt-2 text-xs text-red-400">{{ errorMsg }}</div>

        <div class="mt-3 text-xs text-gray-600 leading-relaxed">
          从已挂载的 Eagle 图库中选择一个。
          如需添加新图库，请在 <code class="text-gray-400">docker-compose.yml</code> 中挂载新路径并重启服务。
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <n-button :disabled="saving || loadingLibraries" @click="$emit('update:show', false)">取消</n-button>
        <n-button
          type="primary"
          :loading="saving"
          :disabled="!selectedPath || selectedPath === activeLibraryPath"
          @click="save"
        >
          切换
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { NModal, NButton, NSelect } from 'naive-ui';
import { getConfig, getLibraries, selectLibrary } from '../api/index.js';

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(['update:show', 'changed']);

const libraries = ref([]);
const activeLibraryPath = ref('');
const activeLibraryName = ref('');
const selectedPath = ref(null);
const saving = ref(false);
const loadingLibraries = ref(false);
const errorMsg = ref('');

const libraryOptions = computed(() =>
  libraries.value.map((lib) => ({
    label: `${lib.name}`,
    value: lib.path,
  }))
);

watch(
  () => props.show,
  async (visible) => {
    if (!visible) return;
    selectedPath.value = null;
    errorMsg.value = '';

    try {
      loadingLibraries.value = true;
      const [cfg, libs] = await Promise.all([getConfig(), getLibraries()]);
      libraries.value = libs;

      activeLibraryPath.value = cfg.activeLibrary?.path || '';
      activeLibraryName.value = cfg.activeLibrary?.name || '';
    } catch {
      errorMsg.value = '无法加载图库列表';
    } finally {
      loadingLibraries.value = false;
    }
  }
);

async function save() {
  if (!selectedPath.value) return;
  saving.value = true;
  errorMsg.value = '';
  try {
    const result = await selectLibrary(selectedPath.value);
    activeLibraryPath.value = result.libraryPath;
    activeLibraryName.value = result.name;
    emit('changed', result.libraryPath);
    emit('update:show', false);
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>
