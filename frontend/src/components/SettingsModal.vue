<template>
  <n-modal
    :show="show"
    preset="card"
    title="图库设置"
    style="width: 520px"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <div class="flex flex-col gap-4">
      <!-- Current path display -->
      <div>
        <div class="text-xs text-gray-500 mb-1">当前图库路径</div>
        <div class="text-sm text-gray-300 font-mono bg-gray-800 rounded px-3 py-2 break-all">
          {{ currentPath || '（未设置）' }}
        </div>
      </div>

      <!-- New path input -->
      <div>
        <div class="text-xs text-gray-500 mb-1">设置新路径</div>
        <n-input
          v-model:value="inputPath"
          placeholder="例：G:/我的云端硬盘/Eagle.G.Rin.library"
          :disabled="saving"
          clearable
          @keyup.enter="save"
        />
        <div v-if="errorMsg" class="mt-2 text-xs text-red-400">{{ errorMsg }}</div>
        <div class="mt-2 text-xs text-gray-600 leading-relaxed">
          路径需指向 Eagle 图库文件夹（即含有 <code class="text-gray-400">metadata.json</code>
          的那个 <code class="text-gray-400">.library</code> 目录）。设置后立即生效，并保存到
          <code class="text-gray-400">backend/config.json</code>。
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <n-button :disabled="saving" @click="$emit('update:show', false)">取消</n-button>
        <n-button
          type="primary"
          :loading="saving"
          :disabled="!inputPath.trim()"
          @click="save"
        >
          应用
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { NModal, NInput, NButton } from 'naive-ui';
import { getConfig, setLibraryPath } from '../api/index.js';

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(['update:show', 'changed']);

const currentPath = ref('');
const inputPath = ref('');
const saving = ref(false);
const errorMsg = ref('');

// Load current config when modal opens
watch(
  () => props.show,
  async (visible) => {
    if (!visible) return;
    errorMsg.value = '';
    inputPath.value = '';
    try {
      const cfg = await getConfig();
      currentPath.value = cfg.libraryPath;
    } catch {
      currentPath.value = '（获取失败）';
    }
  }
);

async function save() {
  const p = inputPath.value.trim();
  if (!p) return;
  saving.value = true;
  errorMsg.value = '';
  try {
    await setLibraryPath(p);
    currentPath.value = p;
    emit('changed', p);
    emit('update:show', false);
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>
