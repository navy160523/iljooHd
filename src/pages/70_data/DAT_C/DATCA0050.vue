<!-- 
  * Vue 내 용 : 서식자료
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/05
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/05 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import TAB01 from "@/pages/70_data/DAT_C/DATCA0050_TAB01.vue"
import TAB02 from "@/pages/70_data/DAT_C/DATCA0050_TAB02.vue"
import TAB03 from "@/pages/70_data/DAT_C/DATCA0050_TAB03.vue"
import TAB04 from "@/pages/70_data/DAT_C/DATCA0050_TAB04.vue"

defineOptions({
  name:'DATCA0050',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const Popup = ref(null)
const tab = ref('TAB_01')
const TAB_01 = ref(null) 
const TAB_02 = ref(null) 
const TAB_03 = ref(null) 
const TAB_04 = ref(null) 

const onButtonsClick = btn => {
  if(tab.value === 'TAB_01'){
    TAB_01.value.onButtonsClick({id: btn.id})
  }else if(tab.value === 'TAB_02'){
    TAB_02.value.onButtonsClick({id: btn.id})
  }else if(tab.value === 'TAB_03'){
    TAB_03.value.onButtonsClick({id: btn.id})
  }else {
    TAB_04.value.onButtonsClick({id: btn.id})
  }
}

defineExpose({
  onButtonsClick,
})

onMounted(() => {
  // onButtonsClick({ id: "btnSearch" })
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pb-1">
          <v-tabs v-model="tab">
            <v-tab value="TAB_01">공통</v-tab>
            <v-tab value="TAB_02">안전</v-tab>
            <v-tab value="TAB_03">보건</v-tab>
            <v-tab value="TAB_04">환경</v-tab>
          </v-tabs>
        </v-sheet>

        <v-window v-model="tab" class="h-window">
          <v-window-item value="TAB_01"> <TAB01 ref="TAB_01" /></v-window-item>
          <v-window-item value="TAB_02"> <TAB02 ref="TAB_02" /></v-window-item>
          <v-window-item value="TAB_03"> <TAB03 ref="TAB_03" /></v-window-item>
          <v-window-item value="TAB_04"> <TAB04 ref="TAB_04" /></v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>