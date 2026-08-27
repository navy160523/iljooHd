<script setup>
import { ref } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import EDUCB0030Tab1 from '@/pages/60_edu/EDU_C/EDUCB0030Tab1.vue'
import EDUCB0030Tab2 from '@/pages/60_edu/EDU_C/EDUCB0030Tab2.vue'
import EDUCB0030Tab3 from '@/pages/60_edu/EDU_C/EDUCB0030Tab3.vue'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0010',
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
            <v-tab value="A">시험요약</v-tab>
            <v-tab value="B">개별응답 결과분석</v-tab>
            <v-tab value="C">문항별 결과분석</v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item value="A">
            <EDUCB0030Tab1 />
          </v-window-item>
          <v-window-item value="B">
            <EDUCB0030Tab2 />
          </v-window-item>
          <v-window-item value="C">
            <EDUCB0030Tab3 />
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