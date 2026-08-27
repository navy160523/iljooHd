<template>
  <v-dialog v-model="dialog" persistent class="iPopup">
    <v-card class="mx-auto card" :width="props.width" :style="padding">
      <template #title>
        <slot name="title"></slot>
      </template>
      <template #append>
        <v-btn width="25" height="25" variant="text" @click="btnClick" class="pa-0 ma-0">
          <svg-icon name="popupClose" />
        </v-btn>
      </template>
      <template #default>
        <v-card elevation="0" color="#fffffff00" class="popupContentArea">
          <slot name="default"></slot>
        </v-card>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
const dialog = ref(false)

const props = defineProps({
  dialog: { Type: Boolean, default: false },
  width: { type: String, default: '100%' },
  padding: { type: String, default: '' }
})
watch(props, () => {
  dialog.value = props.dialog
})

const padding = computed(() => {
  return 'padding: ' + props.padding + ';'
})

const emit = defineEmits(['close'])
const btnClick = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
.card {
  border-radius: 3px !important;
}
</style>
