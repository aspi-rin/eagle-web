<template>
  <n-tree
    :data="treeData"
    block-line
    :selected-keys="selectedKeys"
    :expanded-keys="expandedKeys"
    @update:selected-keys="handleSelect"
    @update:expanded-keys="(keys) => (expandedKeys = keys)"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { NTree } from 'naive-ui';

const props = defineProps({
  folders: { type: Array, default: () => [] },
});

const emit = defineEmits(['select']);

const selectedKeys = ref([]);
const expandedKeys = ref([]);

const treeData = computed(() => toTreeNodes(props.folders));

function toTreeNodes(folders) {
  return folders.map((f) => ({
    key: f.id,
    label: f.name,
    children: f.children?.length ? toTreeNodes(f.children) : undefined,
  }));
}

function flattenFolders(folders, map = {}) {
  for (const f of folders) {
    map[f.id] = f;
    if (f.children?.length) flattenFolders(f.children, map);
  }
  return map;
}

function handleSelect(keys) {
  if (!keys.length) return;
  selectedKeys.value = keys;
  const folder = flattenFolders(props.folders)[keys[0]];
  if (folder) emit('select', folder);
}
</script>
