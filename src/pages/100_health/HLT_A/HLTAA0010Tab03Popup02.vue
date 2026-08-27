<!--
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 위험도 산출기준(정성)(탭) > 과거 기준 가져오기(팝업)
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
  commonExecuteApi,
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
import Message from '@hiway/utils/notify'
// import AcdtPopup from '@/components/popup/AcdtPopup.vue'
// import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
// import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
// import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
// import LocationPopup from '@/components/popup/LocationPopup.vue'
// import DeptPopup from '@/components/popup/DeptPopup.vue'

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

const openPopup = (param) => {
  dialog.value = true
}

const popupParam = reactive({
  SaveData: {},
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  YEAR: String(new Date().getFullYear()), // 기준 년도
  APPLICABLEYEAR: String(new Date().getFullYear()), // 적용 년도
})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnUpdate') {
    // console.log('데이터 일괄 연결 저장')
    new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

//  조회
const searchData = () => {
  return commonSearchApi({
    queryId: "HLTAA0010_SEARCH_03",
    param: searchParams,
  });
}

// 조회 후
const afterSearch = (res) => {
  // console.log('res : ', res.ORESULT_CUR.length)
  if (res.ORESULT_CUR.length === 0) {
    Message.warn(t('기준년도에 등록된 데이터가 없습니다.'))
  } else {
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSaveData)
    .run()    
  }
  // grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장 전
const beforeSave = () => {
  // validation 체크
  // 구분
  if(searchParams.YEAR === searchParams.APPLICABLEYEAR) {
    return Message.warn(t('적용년도와 기준년도가 같습니다.'))
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  saveParams.push(searchParams)
  // console.log('saveParams : ', saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_COPY_03', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  // onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

const closePopup = () => {
  emit("closed")
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
    width="450"
    class="draggable-dialog"
  >
    <div class="title-bar">
      <span> 과거 산출기준(정성) 가져오기 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 인적사항 -->
      <v-card-text>
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-select
                  :label="$t('적용년도')"  
                  v-model="searchParams.APPLICABLEYEAR"
                  width="170px"
                  type="YEAR"
                  margin="10px"
                />
                <i-select
                  :label="$t('기준년도')"  
                  v-model="searchParams.YEAR"
                  width="170px"
                  type="YEAR"
                  margin="10px"
                  maxlength="4"
                />
              </div>
          </v-card-text>    
        </v-card>
        <!-- <v-card-text class="my-2" height="250px"> -->
        <!-- 팝업 -->
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
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
