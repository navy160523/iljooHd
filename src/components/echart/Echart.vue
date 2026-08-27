<template>
  <v-chart
    :option="props.options"
    :theme="props.theme"
    :autoresize="props.autoResize"
    :style="props.style"
    :ref="ref"
  />
</template>

<script setup>
import VChart, { THEME_KEY } from 'vue-echarts';
import { provide } from "vue"

provide({[THEME_KEY]: "dark"})

const props = defineProps({
  options: Object,
  theme: [String, Object],
  initOptions: Object,
  group: String,
  autoResize: { type: Boolean, default: true },
  watchShallow: Boolean,
  manualUpdate: Boolean,
  style: { type: String, default: 'width: 100%; height: 100%;' },
  ref: { type: String, default: '' }
})
</script>
