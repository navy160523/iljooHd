<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 평가대상 조직관리(탭) > 개별 데이터 이관(팝업)
-->

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
// import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
// import ILabel from '@/components/ILabel.vue'
// import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
// import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  // commonExecuteApi,
  // getCodeList,
  // getCompanyList,
  // commonUploadFilesApi,
  // commonSendApi,
  // commonSendSMS,
} from '@hiway/api/commonApi'
// import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
// import dayjs from 'dayjs'
// import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
// import { value } from 'lodash-es'
// import Message from '@hiway/utils/notify'
// import AcdtPopup from '@/components/popup/AcdtPopup.vue'
// import SendMailPopup from '@/components/popup/SendMailPopup.vue'
// import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
// import deleteFlowHelper from '@/utils/deleteFlowHelper'
// import queryFlowHelper from '@/utils/searchFlowHelper'
// import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
// import LocationPopup from '@/components/popup/LocationPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'

// import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
// import EmpPopup from '@/pages/30_safety/SAF_A/SAFAB0010EMP.vue'
// import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'

// import OZReport from '@/components/OZReport.vue'
// import HLTDA0010PopUp01_Sub01 from "@/pages/100_health/HLT_D/HLTDA0010PopUp01_Sub01.vue"


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null);
const dialog = ref(false);
const deptPopup = ref(null)
const popupParam = reactive({
  SaveData: {},
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(),
  DEPT_NM_F:'',
  DEPT_CD_F:'',
  DEPT_NM_T:'',
  DEPT_CD_T:''
})

const openPopup = (param) => {
  dialog.value = true
}

const onButtonsClick = (btn) => {
  if(btn.id === 'btnUpdate') {
    // console.log('개별 데이터 이관 저장')
  } else if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnDeleteTransferHistory') {
    // console.log('이관 내역 삭제')
  }
}

const openDeptPopup = () => {
  deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv, 
      ASGN_NM : searchParams.DEPT_NM_F,
      HSE_SYS : 'N',
    })
}

const onDeptSelected = (val) => {
  // console.log('val : ', val)
  // searchParams.DEPT_NM_F = val.ASGN_SHRT_NM
  // searchParams.DEPT_CD_F = val.DEPT_CD
}

const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="400"
    class="draggable-dialog"
  >
    <div class="title-bar">
      <span> 개별 데이터 이관 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnDeleteTransferHistory','btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 인적사항 -->
      <v-card-text class="overflowY">
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-select
                  :label="$t('적용 연도')"  
                  v-model="searchParams.YEAR"
                  width="180px"
                  type="YEAR"
                  margin="10px"
                />
              </div>
          </v-card-text>    
        </v-card>
        <!-- <v-card-text class="my-2" height="250px"> -->
        <v-card-text class="my-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('Data 이관 대상 부서')"
          />
        </v-card-text>
        <v-card class="mb-0 mr-0 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-input
                  :label="$t('부서명')"  
                  v-model="searchParams.DEPT_NM_F"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openDeptPopup"
                  @keydown.enter="e => {openDeptPopup('search')}"
                  width="200px"
                />
                <i-input
                  v-model="searchParams.DEPT_CD_F"
                  width="100px"
                  readonly
                />
              </div>
          </v-card-text>
        </v-card>
        <v-card-text class="my-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('이관 후 적용 부서')"
          />
        </v-card-text>
        <v-card class="mb-0 mr-0 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-input
                  :label="$t('부서명')"  
                  v-model="searchParams.DEPT_NM_T"
                  width="200px"
                  readonly
                />
                <i-input
                  v-model="searchParams.DEPT_CD_T"
                  width="100px"
                  readonly
                />
              </div>
          </v-card-text>
        </v-card>
        <!-- 팝업 -->
        <DeptPopup ref="deptPopup" @selected="onDeptSelected"/> 
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.fileDiv {
  width: 100%;
  padding: 12px;
  background: #fff;
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  width: 250px;
}
.box {
  background: #fff;
  padding: 8px;
  border-radius: 12px;
}
</style>
