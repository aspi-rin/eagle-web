<template>
  <n-config-provider :theme="darkTheme" :preflight-style-disabled="true">
    <n-message-provider>
      <n-layout has-sider style="height: 100vh">
        <!-- Sidebar -->
        <n-layout-sider
          width="240"
          bordered
          :native-scrollbar="false"
          style="background: #1a1a20"
        >
          <div class="py-4 px-2">
            <div class="px-3 mb-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">
              图库
            </div>
            <FolderTree :folders="folders" @select="selectFolder" />
          </div>
        </n-layout-sider>

        <!-- Main content -->
        <n-layout-content :native-scrollbar="false" style="background: #18181c">
          <ImageGrid
            v-if="selectedFolder"
            :folder-id="selectedFolder.id"
            :folder-name="selectedFolder.name"
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
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { darkTheme, NConfigProvider, NMessageProvider, NLayout, NLayoutSider, NLayoutContent } from 'naive-ui';
import { getFolders } from './api/index.js';
import FolderTree from './components/FolderTree.vue';
import ImageGrid from './components/ImageGrid.vue';

const folders = ref([]);
const selectedFolder = ref(null);

onMounted(async () => {
  folders.value = await getFolders();
});

function selectFolder(folder) {
  selectedFolder.value = folder;
}
</script>
