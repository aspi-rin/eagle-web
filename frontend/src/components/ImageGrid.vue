<template>
  <div ref="outerRef" style="position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-3 flex-shrink-0" style="border-bottom: 1px solid #2a2a35">
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

    <!-- Scroll container -->
    <div ref="scrollRef" style="flex: 1; min-height: 0; overflow-y: auto" @scroll="onScroll">
      <div v-if="loading" class="flex justify-center py-16">
        <n-spin size="large" />
      </div>

      <div v-else-if="images.length === 0" class="flex justify-center py-16 text-gray-500">
        该文件夹没有图片
      </div>

      <!-- Virtual masonry: one big positioned box, only visible nodes rendered -->
      <div v-else :style="{ position: 'relative', height: totalHeight + 'px' }">
        <div
          v-for="item in visibleItems"
          :key="item.id"
          :style="{
            position: 'absolute',
            left: item.x + 'px',
            top: item.y + 'px',
            width: item.w + 'px',
            height: item.h + 'px',
          }"
          class="cursor-pointer rounded-lg overflow-hidden bg-gray-800 hover:opacity-80 transition-opacity duration-150"
          @click="openGallery(item.originalIndex)"
        >
          <img
            :src="thumbnailUrl(item.id)"
            :alt="item.name"
            style="width: 100%; height: 100%; object-fit: cover; display: block"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { NSpin, NSwitch } from 'naive-ui';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import { getImages, deleteImage, thumbnailUrl, originalUrl } from '../api/index.js';

const COLUMN_WIDTH = 220;
const GAP = 8;
const PADDING = 20;
const BUFFER = 800;

const props = defineProps({
  folderId: { type: String, default: null },
  folderName: { type: String, default: '' },
  includeSubfolders: { type: Boolean, default: false },
});

const emit = defineEmits(['update:includeSubfolders']);

const images = ref([]);
const loading = ref(false);
const outerRef = ref(null);
const scrollRef = ref(null);
const containerWidth = ref(0);
const viewportHeight = ref(0);
const scrollTop = ref(0);
let activeGallery = null;
let touchStart = null;
let deletingId = null;

function measureScroll() {
  if (!scrollRef.value) return;
  containerWidth.value = scrollRef.value.clientWidth;
  viewportHeight.value = scrollRef.value.clientHeight;
}

const layout = computed(() => {
  if (!images.value.length || !containerWidth.value) return { items: [], totalHeight: 0 };

  const availWidth = containerWidth.value - PADDING * 2;
  const numCols = Math.max(1, Math.floor((availWidth + GAP) / (COLUMN_WIDTH + GAP)));
  const colWidth = Math.floor((availWidth - (numCols - 1) * GAP) / numCols);
  const colHeights = new Array(numCols).fill(PADDING);
  const items = [];

  for (let i = 0; i < images.value.length; i++) {
    const img = images.value[i];
    const shortestCol = colHeights.indexOf(Math.min(...colHeights));
    const x = PADDING + shortestCol * (colWidth + GAP);
    const y = colHeights[shortestCol];
    const aspect = img.width && img.height ? img.height / img.width : 1;
    const h = Math.round(colWidth * aspect);
    items.push({ ...img, x, y, w: colWidth, h, originalIndex: i });
    colHeights[shortestCol] += h + GAP;
  }

  return { items, totalHeight: Math.max(...colHeights) + PADDING };
});

const totalHeight = computed(() => layout.value.totalHeight);

const visibleItems = computed(() => {
  const top = scrollTop.value - BUFFER;
  const bottom = scrollTop.value + viewportHeight.value + BUFFER;
  return layout.value.items.filter((item) => item.y + item.h > top && item.y < bottom);
});

function onScroll(e) {
  scrollTop.value = e.target.scrollTop;
}

let ro = null;

onMounted(() => {
  nextTick(measureScroll);
  ro = new ResizeObserver(measureScroll);
  if (scrollRef.value) ro.observe(scrollRef.value);
});

onUnmounted(() => {
  ro?.disconnect();
  activeGallery?.close();
});

async function loadImages() {
  if (!props.folderId) return;
  loading.value = true;
  images.value = [];
  scrollTop.value = 0;
  if (scrollRef.value) scrollRef.value.scrollTop = 0;
  images.value = await getImages(props.folderId, props.includeSubfolders);
  loading.value = false;
}

watch([() => props.folderId, () => props.includeSubfolders], loadImages, { immediate: true });

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
    closeOnVerticalDrag: false,
  });

  pswp.on('afterInit', () => {
    activeGallery = pswp;
    window.addEventListener('keydown', onGalleryKeydown);
    window.addEventListener('touchstart', onGalleryTouchStart, { passive: true });
    window.addEventListener('touchend', onGalleryTouchEnd, { passive: true });
  });

  pswp.on('destroy', () => {
    if (activeGallery === pswp) activeGallery = null;
    window.removeEventListener('keydown', onGalleryKeydown);
    window.removeEventListener('touchstart', onGalleryTouchStart);
    window.removeEventListener('touchend', onGalleryTouchEnd);
    touchStart = null;
  });

  pswp.init();
}

function onGalleryKeydown(e) {
  if (e.key !== 'ArrowUp') return;
  e.preventDefault();
  requestDeleteCurrentImage();
}

function onGalleryTouchStart(e) {
  const touch = e.changedTouches?.[0];
  if (!touch) return;
  touchStart = { x: touch.clientX, y: touch.clientY };
}

function onGalleryTouchEnd(e) {
  if (!touchStart) return;
  const touch = e.changedTouches?.[0];
  if (!touch) return;
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;

  // Up swipe: enough vertical travel, mostly vertical, and upward direction.
  if (dy < -80 && Math.abs(dy) > Math.abs(dx) * 1.4) {
    requestDeleteCurrentImage();
  }
}

async function requestDeleteCurrentImage() {
  if (!activeGallery || deletingId) return;

  const index = activeGallery.currIndex;
  const img = images.value[index];
  if (!img) return;

  const confirmed = window.confirm(`确定要删除「${img.name || img.id}」吗？\n\n会将 metadata.json 的 folders 置空，并标记 deleted=true。`);
  if (!confirmed) return;

  deletingId = img.id;
  try {
    await deleteImage(img.id);
    const nextIndex = Math.min(index, images.value.length - 2);
    images.value = images.value.filter((item) => item.id !== img.id);

    const gallery = activeGallery;
    if (nextIndex >= 0) {
      gallery.on('destroy', () => {
        nextTick().then(() => openGallery(nextIndex));
      });
    }
    gallery.close();
  } catch (err) {
    window.alert(err?.message || '删除失败');
  } finally {
    deletingId = null;
  }
}
</script>
