<template>
  <div class="p-5">
    <h2 class="text-base font-semibold mb-4 text-gray-200">{{ folderName }}</h2>

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
import { NSpin } from 'naive-ui';
import MasonryWall from '@yeger/vue-masonry-wall';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import { getImages, thumbnailUrl, originalUrl } from '../api/index.js';

const props = defineProps({
  folderId: { type: String, default: null },
  folderName: { type: String, default: '' },
});

const images = ref([]);
const loading = ref(false);

watch(
  () => props.folderId,
  async (id) => {
    if (!id) return;
    loading.value = true;
    images.value = [];
    images.value = await getImages(id);
    loading.value = false;
  },
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
