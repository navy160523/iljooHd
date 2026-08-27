<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import {
  commonExecuteApi,
  commonSearchApi,
  getCodeList,
} from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IUpload from '@/components/IUpload.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const dialog = ref(false)

const safetyImageUpload = ref(null)
const safetyFileUpload = ref(null)
const actionImageUpload = ref(null)
const actionFileUpload = ref(null)

const workStopLocation = ref(null)
const workStopEmpPopup = ref(null)
const workStopDeptPopup = ref(null)
const workStopProcessEmpPopup = ref(null)

const emit = defineEmits(['closed'])

const workStopField = reactive({
  CMPNY_DIV: '',
  JSTOP_NO: '',
  JSTOP_DT1: '',
  JSTOP_TIME2: '',
  BSNS_CD: '',
  DEPT_CD: '',
  DEPT_NM: '',
  ASGN_NM: '',
  VIO_EMP_ASGN: '',
  ASGN_CD: '',
  CHG_EMP_NO: '',
  CHG_EMP_NM: '',
  CHG_JOB_TIT_NM: '',
  WORKER_CNT: '',
  RESTART_DT1: '',
  RESTART_TIME2: '',
  RESTART_DIV: '',
  RESTART_DESC: '',
  JSTOP_EMP_NM: '',
  JSTOP_EMP_NO: '',
  JSTOP_JOB_TIT_NM: '',
  JSTOP_ASGN_NM: '',
  JSTOP_ASGN_CD: '',
  JSTOP_DEPT_CD: '',
  USER_ID: '',
  SAVE_YN: 'Y',
  COMPANY: '',
  FILE_ID: '',
  FILE_ID2: '',
  SAGO_DIV_L: '',
  SAGO_DIV_M: '',
  SAGO_DIV_S: '',
  SAGO_DIV_L_NM: '',
  SAGO_DIV_M_NM: '',
  SAGO_DIV_S_NM: '',
  JOB_LPLC: '',
  JOB_MPLC: '',
  JOB_SPLC: '',
  JOB_LPLC_NM: '',
  JOB_MPLC_NM: '',
  JOB_SPLC_NM: '',
  JOB_PLC_DESC: '',
  SHIP_NO: '',
})

const codeList = reactive({
  RESTART_DIV: [],
  SHIP_NO: [],
})

const initWorkStopCodeList = () => {
  Promise.all([
    getCodeList('HHIF170'),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_17',
      param: {},
    }),
  ]).then((res) => {
    codeList.RESTART_DIV = res[0].ORESULT_CUR
    codeList.SHIP_NO = res[1].ORESULT_CUR
  })
}

const initField = () => {
  Object.keys(workStopField).forEach((key) => {
    workStopField[key] = ''
  })
  
  workStopField.CMPNY_DIV = userStore.cmpnyDiv
  workStopField.JSTOP_DT1 = dayjs().format('YYYY-MM-DD')
  workStopField.JSTOP_TIME2 = dayjs().format('HH:mm')
  workStopField.SAVE_YN = 'Y'
  workStopField.USER_ID = userStore.userId
  
  // Set reporter info as current user
  workStopField.JSTOP_EMP_NM = userStore.empNm
  workStopField.JSTOP_EMP_NO = userStore.empNo
  workStopField.JSTOP_JOB_TIT_NM = userStore.jobTitNm || '사원'
  workStopField.JSTOP_ASGN_NM = userStore.asgnFullNm
  workStopField.JSTOP_ASGN_CD = userStore.asgnCd
  workStopField.JSTOP_DEPT_CD = userStore.deptCd
}

const initUploads = () => {
  vm.$nextTick(() => {
    if (safetyImageUpload.value) {
      if (!workStopField.FILE_ID) {
        safetyImageUpload.value.setGuid()
        workStopField.FILE_ID = safetyImageUpload.value.guid
      } else {
        safetyImageUpload.value.setGuid(workStopField.FILE_ID)
        safetyImageUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
    if (safetyFileUpload.value) {
      if (!workStopField.FILE_ID) {
        safetyFileUpload.value.setGuid()
        workStopField.FILE_ID = safetyFileUpload.value.guid
      } else {
        safetyFileUpload.value.setGuid(workStopField.FILE_ID)
        safetyFileUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
    if (actionImageUpload.value) {
      if (!workStopField.FILE_ID2) {
        actionImageUpload.value.setGuid()
        workStopField.FILE_ID2 = actionImageUpload.value.guid
      } else {
        actionImageUpload.value.setGuid(workStopField.FILE_ID2)
        actionImageUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
    if (actionFileUpload.value) {
      if (!workStopField.FILE_ID2) {
        actionFileUpload.value.setGuid()
        workStopField.FILE_ID2 = actionFileUpload.value.guid
      } else {
        actionFileUpload.value.setGuid(workStopField.FILE_ID2)
        actionFileUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
  })
}

const openPopup = () => {
  dialog.value = true
  initField()
  initWorkStopCodeList()
  initUploads()
}

const openPopup2 = (rowData) => {
  dialog.value = true
  initWorkStopCodeList()
  
  Object.keys(workStopField).forEach((key) => {
    if (rowData[key] !== undefined) {
      workStopField[key] = rowData[key]
    }
  })
  
  if (rowData.JSTOP_DT) workStopField.JSTOP_DT1 = rowData.JSTOP_DT
  if (rowData.JSTOP_TIME) workStopField.JSTOP_TIME2 = rowData.JSTOP_TIME
  if (rowData.RESTART_DT) workStopField.RESTART_DT1 = rowData.RESTART_DT
  if (rowData.RESTART_TIME) workStopField.RESTART_TIME2 = rowData.RESTART_TIME
  
  initUploads()
}

const closePopup = () => {
  dialog.value = false
  emit('closed')
}

const onSave = () => {
  if (!workStopField.JOB_SPLC_NM) {
    Message.warn(t('장소는 필수값입니다.'))
    return
  }
  if (!workStopField.CHG_EMP_NO) {
    Message.warn(t('작업담당자는 필수값입니다.'))
    return
  }
  if (!workStopField.WORKER_CNT) {
    Message.warn(t('작업인원은 필수값입니다.'))
    return
  }
  if (!workStopField.JSTOP_DESC) {
    Message.warn(t('중지사유는 필수값입니다.'))
    return
  }

  new saveFlowHelper(vm, t)
    .setBefore(() => true)
    .setQuery(saveData)
    .setAfter(() => {
      Message.success(t('저장되었습니다.'))
      closePopup()
    })
    .run()
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    JSTOP_NO: workStopField.JSTOP_NO,
    JSTOP_DT1: workStopField.JSTOP_DT1,
    JSTOP_TIME2: workStopField.JSTOP_TIME2 ? workStopField.JSTOP_TIME2.substring(0, 5) : '',
    BSNS_CD: workStopField.BSNS_CD,
    DEPT_CD: workStopField.DEPT_CD,
    ASGN_CD: workStopField.ASGN_CD,
    CHG_EMP_NO: workStopField.CHG_EMP_NO,
    CHG_EMP_NM: workStopField.CHG_EMP_NM,
    JSTOP_DIV: workStopField.JSTOP_DIV,
    JSTOP_DESC: workStopField.JSTOP_DESC,
    JOB_LPLC: workStopField.JOB_LPLC,
    JOB_MPLC: workStopField.JOB_MPLC,
    JOB_SPLC: workStopField.JOB_SPLC,
    JOB_PLC_DESC: workStopField.JOB_PLC_DESC,
    SHIP_NO: workStopField.SHIP_NO,
    WORKER_CNT: workStopField.WORKER_CNT,
    RESTART_DT1: workStopField.RESTART_DT1,
    RESTART_TIME2: workStopField.RESTART_TIME2 ? workStopField.RESTART_TIME2.substring(0, 5) : '',
    RESTART_DIV: workStopField.RESTART_DIV,
    RESTART_DESC: workStopField.RESTART_DESC,
    JSTOP_EMP_NO: workStopField.JSTOP_EMP_NO,
    JSTOP_ASGN_CD: workStopField.JSTOP_ASGN_CD,
    JSTOP_DEPT_CD: workStopField.JSTOP_DEPT_CD,
    USER_ID: userStore.userId,
    SAVE_YN: workStopField.SAVE_YN === 'Y' ? 'Y' : 'N',
    COMPANY: workStopField.CMPNY_DIV || userStore.cmpnyDiv,
    FILE_ID: workStopField.FILE_ID,
    FILE_ID2: workStopField.FILE_ID2,
    SAGO_DIV_L: workStopField.SAGO_DIV_L || 'L01',
    SAGO_DIV_M: workStopField.SAGO_DIV_M || 'M01',
    SAGO_DIV_S: workStopField.SAGO_DIV_S || 'S01',
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE06',
    list: saveParam,
  })
}

// 팝업 열기 매핑
const openWorkStopLocation = () => {
  workStopLocation.value.openPopup('2')
}
const selectedWorkStopLocation = (val) => {
  workStopField.JOB_LPLC = val.L_CD
  workStopField.JOB_MPLC = val.M_CD
  workStopField.JOB_SPLC = val.S_CD
  workStopField.JOB_LPLC_NM = val.L_NM
  workStopField.JOB_MPLC_NM = val.M_NM
  workStopField.JOB_SPLC_NM = val.S_NM
}

const openWorkStopEmpPopup = () => {
  workStopEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    readonly: true,
  })
}
const selectedWorkStopEmpPopup = (val) => {
  workStopField.CHG_EMP_NM = val.EMP_NM
  workStopField.CHG_EMP_NO = val.EMP_NO
  workStopField.CHG_JOB_TIT_NM = val.JOB_TIT_NM || '선임매니저'
  workStopField.VIO_EMP_ASGN = val.ASGN_NM
  workStopField.ASGN_NM = val.ASGN_NM
  workStopField.ASGN_CD = val.ASGN_CD
  workStopField.BSNS_CD = val.BSNS_CD
  workStopField.DEPT_CD = val.DEPT_CD
}

const openWorkStopDeptPopup = () => {
  workStopDeptPopup.value.openPopup()
}
const selectedWorkStopDeptPopup = (val) => {
  workStopField.ASGN_NM = val.ASGN_NM
  workStopField.ASGN_CD = val.ASGN_CD
  workStopField.BSNS_CD = val.BSNS_CD
  workStopField.DEPT_CD = val.DEPT_CD
}

const openWorkStopProcessEmpPopup = () => {
  workStopProcessEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    readonly: true,
  })
}
const selectedWorkStopProcessEmpPopup = (val) => {
  workStopField.JSTOP_EMP_NM = val.EMP_NM
  workStopField.JSTOP_EMP_NO = val.EMP_NO
  workStopField.JSTOP_JOB_TIT_NM = val.JOB_TIT_NM || '기사'
  workStopField.JSTOP_ASGN_NM = val.ASGN_NM
  workStopField.JSTOP_ASGN_CD = val.ASGN_CD
  workStopField.JSTOP_DEPT_CD = val.DEPT_CD
}

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <!-- Header with Title and Actions -->
    <v-sheet
      color="primary"
      height="50"
      class="px-4 d-flex align-center justify-space-between rounded-t-5 cursor-move text-white font-weight-bold"
      @mousedown="startDragging"
    >
      <span>작업중지등록</span>
      <div class="d-flex gap-2">
        <v-btn color="success" size="small" @click="onSave" class="font-weight-bold mr-1">저장</v-btn>
        <v-btn color="secondary" size="small" @click="closePopup" class="font-weight-bold">닫기</v-btn>
      </div>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-text class="pa-4 pt-4 content-area scroll-y">
        <div class="d-flex flex-column fill-height">
          
          <!-- Section 1: 일시 및 장소 -->
          <div class="section-container mb-4 pa-4 bg-lightgrey rounded-5">
            <div class="section-title mb-3 font-weight-bold text-subtitle-1">①일시 및 장소</div>
            <div class="d-flex align-center flex-wrap gap-4">
              <div class="d-flex align-center">
                <span class="mr-2 label-width required">중지일시</span>
                <i-input
                  width="150px"
                  type="date"
                  v-model="workStopField.JSTOP_DT1"
                  hide-details
                ></i-input>
                <i-input
                  width="130px"
                  type="time"
                  v-model="workStopField.JSTOP_TIME2"
                  class="ml-1"
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width required">장소</span>
                <i-input
                  width="200px"
                  v-model="workStopField.JOB_SPLC_NM"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openWorkStopLocation"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">장소상세</span>
                <i-input
                  width="220px"
                  v-model="workStopField.JOB_PLC_DESC"
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">호선/프로젝트No.</span>
                <i-select
                  width="200px"
                  v-model="workStopField.SHIP_NO"
                  :items="codeList.SHIP_NO"
                  item-value="WORK_NO"
                  item-title="WORK_NO"
                  hide-details
                ></i-select>
              </div>
            </div>
          </div>

          <!-- Section 2: 작업중지 정보 -->
          <div class="section-container mb-4 pa-4 bg-lightgrey rounded-5">
            <div class="section-title mb-3 font-weight-bold text-subtitle-1">②작업중지 정보</div>
            <div class="d-flex align-center flex-wrap gap-4 mb-3">
              <div class="d-flex align-center">
                <span class="mr-2 label-width required">작업담당자성명</span>
                <i-input
                  width="150px"
                  v-model="workStopField.CHG_EMP_NM"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openWorkStopEmpPopup"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">사번</span>
                <i-input
                  width="130px"
                  v-model="workStopField.CHG_EMP_NO"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">직위</span>
                <i-input
                  width="120px"
                  v-model="workStopField.CHG_JOB_TIT_NM"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width required">작업인원</span>
                <i-input
                  width="80px"
                  type="number"
                  v-model="workStopField.WORKER_CNT"
                  hide-details
                ></i-input>
              </div>
            </div>

            <div class="d-flex align-center flex-wrap gap-4">
              <div class="d-flex align-center">
                <span class="mr-2 label-width">소속조직</span>
                <i-input
                  width="250px"
                  v-model="workStopField.VIO_EMP_ASGN"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width required">작업담당조직</span>
                <i-input
                  width="250px"
                  v-model="workStopField.ASGN_NM"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openWorkStopDeptPopup"
                  readonly
                  hide-details
                ></i-input>
                <span class="ml-2 text-caption text-grey">※작업담당조직이 다를 경우 수정 바랍니다.</span>
              </div>
            </div>
          </div>

          <!-- Section 3: 작업중지내용 -->
          <div class="section-container mb-4 pa-4 bg-lightgrey rounded-5">
            <div class="section-title mb-3 font-weight-bold text-subtitle-1">③작업중지내용</div>
            <div class="mb-3">
              <span class="font-weight-bold text-body-2 mb-1 d-block required">중지사유</span>
              <v-textarea
                rows="3"
                variant="outlined"
                v-model="workStopField.JSTOP_DESC"
                hide-details
                density="compact"
              ></v-textarea>
            </div>
            
            <div class="d-flex gap-4">
              <div class="flex-grow-1 w-50">
                <div class="font-weight-bold text-body-2 mb-1">사진첨부</div>
                <IUploadImageMulit
                  ref="safetyImageUpload"
                  :file-id="workStopField.FILE_ID"
                ></IUploadImageMulit>
              </div>
              <div class="flex-grow-1 w-50">
                <div class="font-weight-bold text-body-2 mb-1">파일첨부</div>
                <IUpload
                  ref="safetyFileUpload"
                  :file-id="workStopField.FILE_ID"
                ></IUpload>
              </div>
            </div>
          </div>

          <!-- Section 4: 작업 재개 및 조치 내용 -->
          <div class="section-container mb-4 pa-4 bg-lightgrey rounded-5">
            <div class="section-title mb-3 font-weight-bold text-subtitle-1">④작업 재개 및 조치 내용</div>
            <div class="d-flex align-center flex-wrap gap-4 mb-3">
              <div class="d-flex align-center">
                <span class="mr-2 label-width">재개일시</span>
                <i-input
                  width="150px"
                  type="date"
                  v-model="workStopField.RESTART_DT1"
                  hide-details
                ></i-input>
                <i-input
                  width="130px"
                  type="time"
                  v-model="workStopField.RESTART_TIME2"
                  class="ml-1"
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">작업재개구분</span>
                <i-select
                  width="180px"
                  v-model="workStopField.RESTART_DIV"
                  :items="codeList.RESTART_DIV"
                  item-title="TXT"
                  item-value="COD"
                  hide-details
                ></i-select>
              </div>
            </div>

            <div class="mb-3 d-flex gap-4 align-start">
              <div class="flex-grow-1">
                <span class="font-weight-bold text-body-2 mb-1 d-block">조치내용</span>
                <v-textarea
                  rows="3"
                  variant="outlined"
                  v-model="workStopField.RESTART_DESC"
                  hide-details
                  density="compact"
                ></v-textarea>
              </div>
              <div class="text-caption text-error pt-6 w-30 font-weight-bold" style="line-height: 1.5;">
                ※ 문제점 조치 후 작업이 재개되었으나 정보가 입력되지 않은 경우, 단속자에게 정보 입력을 요청하시기 바랍니다.
              </div>
            </div>

            <div class="d-flex gap-4">
              <div class="flex-grow-1 w-50">
                <div class="font-weight-bold text-body-2 mb-1">사진첨부</div>
                <IUploadImageMulit
                  ref="actionImageUpload"
                  :file-id="workStopField.FILE_ID2"
                ></IUploadImageMulit>
              </div>
              <div class="flex-grow-1 w-50">
                <div class="font-weight-bold text-body-2 mb-1">파일첨부</div>
                <IUpload
                  ref="actionFileUpload"
                  :file-id="workStopField.FILE_ID2"
                ></IUpload>
              </div>
            </div>
          </div>

          <!-- Section 5: 단속자정보 -->
          <div class="section-container pa-4 bg-lightgrey rounded-5">
            <div class="section-title mb-3 font-weight-bold text-subtitle-1">⑤단속자정보</div>
            <div class="d-flex align-center flex-wrap gap-4">
              <div class="d-flex align-center">
                <span class="mr-2 label-width">단속자성명</span>
                <i-input
                  width="150px"
                  v-model="workStopField.JSTOP_EMP_NM"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openWorkStopProcessEmpPopup"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">사번</span>
                <i-input
                  width="130px"
                  v-model="workStopField.JSTOP_EMP_NO"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">직위</span>
                <i-input
                  width="120px"
                  v-model="workStopField.JSTOP_JOB_TIT_NM"
                  readonly
                  hide-details
                ></i-input>
              </div>

              <div class="d-flex align-center">
                <span class="mr-2 label-width">소속</span>
                <i-input
                  width="250px"
                  v-model="workStopField.JSTOP_ASGN_NM"
                  readonly
                  hide-details
                ></i-input>
              </div>
            </div>
          </div>

        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Child Popups -->
  <LocationPopup ref="workStopLocation" @selected="selectedWorkStopLocation" />
  <EmpPopup ref="workStopEmpPopup" @selected="selectedWorkStopEmpPopup" />
  <DeptPopup ref="workStopDeptPopup" @selected="selectedWorkStopDeptPopup" />
  <EmpPopup ref="workStopProcessEmpPopup" @selected="selectedWorkStopProcessEmpPopup" />
</template>

<style scoped lang="scss">
.scroll-y {
  max-height: 80vh;
  overflow-y: auto;
}
.section-container {
  border: 1px solid #e0e0e0;
}
.section-title {
  color: #1a237e;
  border-bottom: 2px solid #1a237e;
  padding-bottom: 4px;
}
.label-width {
  font-weight: bold;
  font-size: 13px;
  min-width: 90px;
  display: inline-block;
  &.required::after {
    content: ' *';
    color: red;
  }
}
.bg-lightgrey {
  background-color: #fcfcfc !important;
}
.w-30 {
  width: 30%;
}
.gap-2 {
  gap: 8px;
}
.gap-4 {
  gap: 16px;
}
</style>
