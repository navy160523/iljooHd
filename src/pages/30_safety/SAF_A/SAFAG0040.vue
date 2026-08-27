<!--
  화면명: 평균임금산정내역서
  화면개요: 승인된 산재건에 대해 평균임금산정내역서 관리
-->
<script setup>
import { ref } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import SAFAG0040Tab1 from '@/pages/30_safety/SAF_A/SAFAG0040Tab1.vue'
import SAFAG0040Tab2 from '@/pages/30_safety/SAF_A/SAFAG0040Tab2.vue'

defineOptions({
  name:'30_safety-SAF_A-SAFAG0040',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const menuTitle = ref(null)
const tab = ref('A')
const vSAFAG0040Tab2 = ref(null)

const tabParam = ref({})

const dblClick = param => {
  // console.log('param', param)

  tabParam.value = param
  tab.value = 'B'
  vSAFAG0040Tab2.value.changeTab()
}
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
            <v-tab value="A">리스트</v-tab>
            <v-tab value="B">상세정보</v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item value="A" eager>
            <SAFAG0040Tab1 @dblClick="dblClick" />
          </v-window-item>
          <v-window-item value="B" eager>
            <SAFAG0040Tab2 ref="vSAFAG0040Tab2" :params="tabParam" />
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>