<template>
  <div class="p-5">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-semibold text-gray-200">{{ folderName }}</h2>
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <span>包含子文件夹</span>
        <n-switch
          :value="includeSubfolders"
          size="small"
          @update:value="$emit('update:includeSubfolders', $event)"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <n-spin size="large" />
    </div>

    <div v-else-if="images.length === 0" class="flex justify-center py-16 text-gray-500">
      该文件夹没有图片
    </div>

    <MasonryWall v-else :items="images" :column-width="220" :gap="8">
      <template #default="{ item, index }">
        <div
          class="cursor-pointer rounded-lg overflow-hidden bg-gray-800 hover:opacity-80 transition-opacity duration-150"
          @click="openGallery(index)"
        >
          <img
            :src="thumbnailUrl(item.id)"
            :alt="item.name"
            class="w-full block"
            loading="lazy"
          />
        </div>
      </template>
    </MasonryWall>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { NSpin, NSwitch } from 'naive-ui';
import MasonryWall from '@yeger/vue-masonry-wall';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import { getImages, thumbnailUrl, originalUrl } from '../api/index.js';

const props = defineProps({
  folderId: { type: String, default: null },
  folderName: { type: String, default: '' },
  includeSubfolders: { type: Boolean, default: false },
});

const emit = defineEmits(['update:includeSubfolders']);

const images = ref([]);
const loading = ref(false);

async function loadImages() {
  if (!props.folderId) return;
  loading.value = true;
  images.value = [];
  images.value = await getImages(props.folderId, props.includeSubfolders);
  loading.value = false;
}

watch(
  [() => props.folderId, () => props.includeSubfolders],
  loadImages,
  { immediate: true }
);

function openGallery(startIndex) {
  const dataSource = images.value.map((img) => ({
    src: originalUrl(img.id),
    width: img.width,
    height: img.height,
    alt: img.name,
  }));

  const pswp = new PhotoSwipe({
    dataSource,
    index: startIndex,
    showHideAnimationType: 'zoom',
    bgOpacity: 0.92,
    closeOnVerticalDrag: true,
  });

  pswp.init();
}
</script>
