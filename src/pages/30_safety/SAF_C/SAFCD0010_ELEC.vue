<!--
작성자 : 일주지앤에스 SI3팀 김현재 선임
화면명 : 안전점검 결과등록
화면개요 : 안전점검 결과를 등록한다.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCD0010Tab01 from './SAFCD0010Tab01_ELEC.vue'
import SAFCD0010Tab02 from './SAFCD0010Tab02_ELEC.vue'
import SAFCD0010Tab03 from './SAFCD0010Tab03_ELEC.vue'
import SAFCD0010Tab04 from './SAFCD0010Tab04_ELEC.vue'

defineOptions({
  name: '30_safety-SAF_C-SAFCD0010',
})

const { sliSAFCD0010 } = history.state
const tab = ref(
  sliSAFCD0010 === undefined ? 'DAILY' : sliSAFCD0010.tab
)
const userStore = useUserStore()
//const tabVisibleValue = ref(true)

//로그인유저가 협력사 권한을 가지고 있으면 계획점검탭 visible false
// const checkPartnerCompany = () => {
//   if (userStore.authGrpCd.includes('GRP00385')) {
//     tabVisibleValue.value = false
//   }
// }

onMounted(() => {
  //checkPartnerCompany()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" :title="`${$t(useLogsStore().menuId)}`" />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <v-tabs v-model="tab">
            <v-tab value="DAILY">일상점검</v-tab>
            <v-tab value="PLAN">계획점검</v-tab>
            <v-tab value="PTW">PTW 점검</v-tab>
            <v-tab value="DEPT">부서관리작업 점검</v-tab>
          </v-tabs>
          <v-window v-model="tab" class="h-window">
            <v-window-item value="DAILY">
              <SAFCD0010Tab01></SAFCD0010Tab01>
            </v-window-item>
            <v-window-item value="PLAN">
              <SAFCD0010Tab02></SAFCD0010Tab02>
            </v-window-item>
            <v-window-item value="PTW">
              <SAFCD0010Tab03></SAFCD0010Tab03>
            </v-window-item>
            <v-window-item value="DEPT">
              <SAFCD0010Tab04></SAFCD0010Tab04>
            </v-window-item>
          </v-window>
        </v-sheet>
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
    min-height: 700px;
  }
}
</style>
