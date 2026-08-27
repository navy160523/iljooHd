<script setup>
import { ref } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import SAFBC0020Tab1 from '@/pages/30_safety/SAF_B/SAFBC0020Tab1.vue'
import SAFBC0020Tab2 from '@/pages/30_safety/SAF_B/SAFBC0020Tab2.vue'

defineOptions({
  name:'30_safety-SAF_B-SAFBC0020',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const menuTitle = ref(null)
const tab = ref('A')
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="`${$t(useLogsStore().menuId)}`"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <v-tabs v-model="tab">
            <v-tab value="A">호선/프로젝트별</v-tab>
            <v-tab value="B">장소별</v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item value="A" eager>
            <SAFBC0020Tab2 />
          </v-window-item>
          <v-window-item value="B" eager>
            <SAFBC0020Tab1 />
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 176px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>