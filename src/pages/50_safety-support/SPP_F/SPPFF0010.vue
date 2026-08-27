<!-- SPPFF0010 장비점검 및 유지관리 -->
<!-- SI1팀 마환구 2025.07.03 -->

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
  commonSendSMS,
  commonSendApi,
} from '@hiway/api/commonApi'
import {
  commonDeletFilesApi,
  commonDeleteAllFilesApi
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
// import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import Message from '@hiway/utils/notify'
// import { isEmpty, isEmptyArray } from "@/@core/utils"

import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { useRoute } from 'vue-router'
import SPPFF0010Tab01 from './SPPFF0010Tab01.vue'
import SPPFF0010Tab02 from './SPPFF0010Tab02.vue'
import dayjs from "dayjs"



defineOptions({
  name: '50_safety-support-SPP_F-SPPFF0010',
})

const today = ref(null)
const SPPFF0010_Popup01 = ref(null)
const SPPFF0010_Popup02 = ref(null)
const FIUploadPopup = ref(null)
const MIUploadPopup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)
const tab = ref(null)


onMounted(() => {
  
  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  // if(
  //   useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes("SPPF001")
  // ) {
  //   isAdmin.value = 2
  // }else if(userStore.authGrpCd.includes("SPPF002")) {
  //   isAdmin.value = 1
  // }
  // // if(isAdmin.value === 0) {
  // //   return
  // // }
  // if(isAdmin.value==0)
  // {
  //   menuTitle.value.visibleBtn('btnCreate',false);
  // }
  // else
  // {
  //   menuTitle.value.visibleBtn('btnCreate',true);
  // }
  
  // // initCodeList()
  // // getData()

  // grdMain1.value.getGridView().filterPanel.visible = true
})


</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <VTabs v-model="tab">
            <VTab value="tab01">설비</VTab>
            <VTab value="tab02">예비부품</VTab>
          </VTabs>
          <VWindow v-model="tab">
            <VWindowItem value="tab01">
              <SPPFF0010Tab01 />
            </VWindowItem>
            <VWindowItem value="tab02">
              <SPPFF0010Tab02 />
            </VWindowItem>
          </VWindow>
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
  // overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
