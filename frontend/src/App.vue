<template>
  <n-config-provider :theme="darkTheme" :preflight-style-disabled="true">
    <n-message-provider>
      <n-layout has-sider style="height: 100vh">
        <!-- Sidebar -->
        <n-layout-sider
          width="240"
          bordered
          :native-scrollbar="false"
          style="background: #1a1a20; display: flex; flex-direction: column"
        >
          <!-- Sidebar header -->
          <div
            class="flex items-center justify-between px-3 py-3 flex-shrink-0"
            style="border-bottom: 1px solid #2a2a35"
          >
            <span class="text-xs font-semibold tracking-widest text-gray-500 uppercase">图库</span>
            <n-tooltip trigger="hover" placement="right">
              <template #trigger>
                <n-button
                  quaternary
                  circle
                  size="small"
                  style="color: #6b7280"
                  @click="showSettings = true"
                >
                  <template #icon>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path
                        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                      />
                    </svg>
                  </template>
                </n-button>
              </template>
              更改图库路径
            </n-tooltip>
          </div>

          <!-- Folder tree -->
          <div class="py-2 px-2 flex-1 overflow-auto">
            <FolderTree :folders="folders" @select="selectFolder" />
          </div>
        </n-layout-sider>

        <!-- Main content -->
        <n-layout-content style="background: #18181c; overflow: hidden; position: relative">
          <ImageGrid
            v-if="selectedFolder"
            :folder-id="selectedFolder.id"
            :folder-name="selectedFolder.name"
            :include-subfolders="includeSubfolders"
            @update:include-subfolders="includeSubfolders = $event"
          />
          <div
            v-else
            class="flex flex-col items-center justify-center h-full gap-3 text-gray-600"
          >
            <span class="text-4xl">🦅</span>
            <span class="text-sm">选择左侧文件夹以浏览图片</span>
          </div>
        </n-layout-content>
      </n-layout>

      <!-- Settings modal -->
      <SettingsModal
        v-model:show="showSettings"
        @changed="onLibraryChanged"
      />
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  darkTheme,
  NConfigProvider,
  NMessageProvider,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NButton,
  NTooltip,
} from 'naive-ui';
import { getFolders } from './api/index.js';
import FolderTree from './components/FolderTree.vue';
import ImageGrid from './components/ImageGrid.vue';
import SettingsModal from './components/SettingsModal.vue';

const folders = ref([]);
const selectedFolder = ref(null);
const includeSubfolders = ref(false);
const showSettings = ref(false);

async function loadFolders() {
  folders.value = await getFolders();
}

onMounted(loadFolders);

function selectFolder(folder) {
  selectedFolder.value = folder;
}

// Called when user successfully changes the library path
function onLibraryChanged() {
  selectedFolder.value = null;
  includeSubfolders.value = false;
  loadFolders();
}
</script>
