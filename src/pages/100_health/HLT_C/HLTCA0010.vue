<!--     일주지앤에스 SI2팀 장필구    -->
<!--  프로그램명 : 지표 Data 업로드   -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { getJsonFromExcel } from '@/utils/excel'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

import TAB01 from '@/pages/100_health/HLT_C/HLTCA0010Tab01.vue' // 양식1
import TAB02 from '@/pages/100_health/HLT_C/HLTCA0010Tab02.vue' // 양식2
import TAB03 from '@/pages/100_health/HLT_C/HLTCA0010Tab03.vue' // 양식3

defineOptions({
  name: '100_health-HLT_C-HLTCA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAdmin = ref(false)
const tab = ref('TAB_01')
const TAB_01 = ref(null)
const TAB_02 = ref(null)
const TAB_03 = ref(null)
const menuTitle = ref(null)

const onButtonsClick = (btn) => {
  // console.log(btn.id)
  if (tab.value === 'TAB_01' && TAB_01.value) {
    TAB_01.value.onButtonsClick({ id: btn.id })
  } else if (tab.value === 'TAB_02' && TAB_02.value) {
    TAB_02.value.onButtonsClick({ id: btn.id })
  } else if (tab.value === 'TAB_03' && TAB_03.value) {
    TAB_03.value.onButtonsClick({ id: btn.id })
  }
}

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" :title="$t(useLogsStore().menuId)" @click-button="onButtonsClick" />
    </v-card-title>

    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pb-1">
          <v-tabs v-model="tab">
            <v-tab value="TAB_01">뇌심평가</v-tab>
            <v-tab value="TAB_02">공통문진</v-tab>
            <v-tab value="TAB_03">검진결과</v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item value="TAB_01"> <TAB01 ref="TAB_01" /></v-window-item>
          <v-window-item value="TAB_02"> <TAB02 ref="TAB_02" /></v-window-item>
          <v-window-item value="TAB_03"> <TAB03 ref="TAB_03" /></v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;

  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.ext-red {
  color: red !important;
  font-weight: bold;
}

.ext-blue {
  color: blue !important;
  font-weight: bold;
}

.ext-green {
  color: green !important;
  font-weight: bold;
}

.ext-orange {
  color: orange !important;
  font-weight: bold;
}

.ext-purple {
  color: purple !important;
  font-weight: bold;
}

.ext-teal {
  color: teal !important;
  font-weight: bold;
}

.ext-brown {
  color: brown !important;
  font-weight: bold;
}

.ext-default {
  color: black;
}
</style>
