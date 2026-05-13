<template>
  <n-modal
    :show="show"
    preset="card"
    title="图库设置"
    style="width: 480px"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <div class="flex flex-col gap-5">
      <!-- Current library path -->
      <div>
        <div class="text-xs text-gray-500 mb-1">当前图库</div>
        <div class="text-sm text-gray-300 font-mono bg-gray-800 rounded px-3 py-2 break-all leading-relaxed">
          {{ currentPath || '（未设置）' }}
        </div>
      </div>

      <!-- Folder picker -->
      <div>
        <div class="text-xs text-gray-500 mb-2">选择新图库</div>

        <div class="flex items-center gap-3">
          <n-button
            :loading="picking"
            :disabled="saving"
            @click="browse"
          >
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </template>
            浏览文件夹…
          </n-button>

          <!-- Selected path preview -->
          <span
            v-if="selectedPath"
            class="text-sm text-gray-300 font-mono truncate flex-1"
            :title="selectedPath"
          >
            {{ selectedPath }}
          </span>
          <span v-else class="text-xs text-gray-600">尚未选择</span>
        </div>

        <div v-if="errorMsg" class="mt-2 text-xs text-red-400">{{ errorMsg }}</div>

        <div class="mt-3 text-xs text-gray-600 leading-relaxed">
          在弹出的系统对话框中选择 Eagle 图库文件夹（即 <code class="text-gray-400">.library</code> 目录），
          路径保存到 <code class="text-gray-400">backend/config.json</code>，重启后依然生效。
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <n-button :disabled="saving || picking" @click="$emit('update:show', false)">取消</n-button>
        <n-button
          type="primary"
          :loading="saving"
          :disabled="!selectedPath || picking"
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
import { NModal, NButton } from 'naive-ui';
import { getConfig, pickFolder, setLibraryPath } from '../api/index.js';

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(['update:show', 'changed']);

const currentPath = ref('');
const selectedPath = ref('');
const picking = ref(false);
const saving = ref(false);
const errorMsg = ref('');

watch(
  () => props.show,
  async (visible) => {
    if (!visible) return;
    selectedPath.value = '';
    errorMsg.value = '';
    try {
      const cfg = await getConfig();
      currentPath.value = cfg.libraryPath;
    } catch {
      currentPath.value = '（获取失败）';
    }
  }
);

async function browse() {
  picking.value = true;
  errorMsg.value = '';
  try {
    const p = await pickFolder();
    if (p) selectedPath.value = p;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    picking.value = false;
  }
}

async function save() {
  if (!selectedPath.value) return;
  saving.value = true;
  errorMsg.value = '';
  try {
    await setLibraryPath(selectedPath.value);
    currentPath.value = selectedPath.value;
    emit('changed', selectedPath.value);
    emit('update:show', false);
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>
