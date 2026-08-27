<!-- 
  * Vue 내 용 : 협력사 안전관리자 역량평가 자체 평가
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/09
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/09 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"
import { isEmpty } from "@/@core/utils"
import dayjs from 'dayjs'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import EmpPopup from '@/components/popup/EmpPopup.vue'

defineOptions({
  name:'30_safety-SAF_I-TAB-SAFIC0030_TAB01',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)

const fileUploadPopup_Task = ref(null) //파일 업로드 팝업
const fileUploadPopup_Activity = ref(null) //파일 업로드 팝업
const fileUploadPopup_License= ref(null) //파일 업로드 팝업
const empPopup = ref(null)
const isVisibleComment = ref(false)
const isVisibleEmp = ref(false)  //인원검색확인
const fileTask = ref(false)
const fileActivity = ref(false)
const fileLicense = ref(false)


//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  HALF: '',
  EMP_NM: '',
  BSNS_CD: userStore.bsnsCd, 
  USER_ID: userStore.userId,
})

const mainParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  COMP_CD: '',
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  DEPT_CD: userStore.deptCd,
  COMP_NM: '',
  EMP_NO: '',
  EMP_NM: '',
  TASK: '',
  IMPR_ACTV: '',
  LICENSE: '',
  TASK_FILE_ID: '',
  IMPR_ACTV_FILE_ID: '',
  LICENSE_FILE_ID: '',
  SITE_COMMENT: '',
  REG_DATE: '',
  SELF_EVAL_STATUS: '',
  CONFIRM_YN: '',
  USER_ID: userStore.userId,
})

const dtHalf = reactive([
  { COD: "1", TXT: "상반기" },
  { COD: "2", TXT: "하반기" },
])

const dtScore1 = reactive([
  { COD: "0", TXT: "0점" },
  { COD: "5", TXT: "5점" },
  { COD: "10", TXT: "10점" },
  { COD: "15", TXT: "15점" },
])

const dtScore2 = reactive([
  { COD: "0", TXT: "0점" },
  { COD: "1", TXT: "1점" },
  { COD: "2", TXT: "2점" },
  { COD: "3", TXT: "3점" },
  { COD: "4", TXT: "4점" },
  { COD: "5", TXT: "5점" },
])

const dtScore3 = reactive([
  { COD: "0", TXT: "0점" },
  { COD: "5", TXT: "5점" },
])

onMounted(() => {
  vm.$nextTick(() => {
    searchParams.HALF = getHalf(dayjs().format('MM'))
    onButtonsClick({ id: "btnSearch" })

    chkStatus()
    initData()
  })  
})

const initData = () => {
  if(userStore.userDiv === 'A' || userStore.userId === 'BP23198') {
    isVisibleEmp.value = true
  } else {
    isVisibleEmp.value = false
  }
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.BSNS_CD = userStore.bsnsCd
  searchParams.USER_ID = userStore.userId
  searchParams.EMP_NM = userStore.userName
}

const chkStatus = () => {

console.log('mainParams :', mainParams)
  if(mainParams.CONFIRM_YN === 'Y') {
    menuTitle.value.disableBtn('btnUpdate', true)         // 저장
    menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정
  }
  else {
    if(mainParams.SELF_EVAL_STATUS === 'Y') {
      menuTitle.value.disableBtn('btnUpdate', false)         // 저장
      menuTitle.value.disableBtn('btnVendorConfirm', false)  // 확정
    }
    else if(mainParams.SELF_EVAL_STATUS === 'C') {
      menuTitle.value.disableBtn('btnUpdate', true)         // 저장
      menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정
    }
    else if(mainParams.SELF_EVAL_STATUS === 'N') {
      menuTitle.value.disableBtn('btnUpdate', false)        // 저장
      menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정
    }else{
      menuTitle.value.disableBtn('btnUpdate', true)         // 저장
      menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정
    }

  }
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } 
  else if (btn.id === 'btnVendorConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeConfirm)
      .setQuery(confirmData)
      .setConfirmMessage('확정을 하게 되면 수정이 불가합니다. 확정 하시겠습니까?\r\n(향후 확정을 취소하고자 할 경우, 확정취소 요청 버튼을 누르시기 바랍니다.)')
      .setResultMessage('확정되었습니다.')
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } 
  // else if (btn.id === 'btnCancelConfirm') {
  //   new saveFlowHelper(vm, t)
  //     .setBefore(beforeCancelConfirm)
  //     .setQuery(cancelConfirmData)
  //     .setConfirmMessage('확정 취소 하시겠습니까?')
  //     .setResultMessage('확정 취소되었습니다.')
  //     .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
  //     .run()
  // }
  else if (btn.id === 'btnManual') {
    let params = {
      FILE_PATH: 'SAFI',
      //FILE_NAME: '[첨부.3] 협력사 안전관리자 역량평가 Check List_최종_개선 完.xlsx',
      FILE_NAME: '첨부. 협력사 안전관리자 역량평가 Check List(자가평가용)_24.07.05.pdf',
    }
    commonSampleDownFilesApi(params)
  }
}

// 조회
const searchData = () =>{
  console.log('searchData : ', searchParams)

  return commonSearchApi({ queryId : 'SAFIC0030_SEARCH_01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log('afterSearchGrdMain : ', res)

  if(res.ORESULT_CUR.length > 0) {
    mainParams.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
    mainParams.COMP_CD = res.ORESULT_CUR[0].COMP_CD
    mainParams.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
    mainParams.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
    mainParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    mainParams.COMP_NM = res.ORESULT_CUR[0].COMP_NM
    mainParams.EMP_NO = res.ORESULT_CUR[0].EMP_NO
    mainParams.EMP_NM = res.ORESULT_CUR[0].KOR_NM
    mainParams.TASK = res.ORESULT_CUR[0].TASK
    mainParams.IMPR_ACTV = res.ORESULT_CUR[0].IMPR_ACTV
    mainParams.LICENSE = res.ORESULT_CUR[0].LICENSE
    mainParams.TASK_FILE_ID = res.ORESULT_CUR[0].TASK_FILE_ID
    mainParams.IMPR_ACTV_FILE_ID = res.ORESULT_CUR[0].IMPR_ACTV_FILE_ID
    mainParams.LICENSE_FILE_ID = res.ORESULT_CUR[0].LICENSE_FILE_ID
    mainParams.SITE_COMMENT = res.ORESULT_CUR[0].SITE_COMMENT
    mainParams.SELF_EVAL_STATUS = res.ORESULT_CUR[0].SELF_EVAL_STATUS
    mainParams.REG_DATE = res.ORESULT_CUR[0].REG_DATE
    mainParams.CONFIRM_YN = res.ORESULT_CUR[0].CONFIRM_YN
  }
  else {
    mainParams.CMPNY_DIV = ''
    mainParams.COMP_CD = ''
    mainParams.BSNS_CD = ''
    mainParams.ASGN_CD = ''
    mainParams.DEPT_CD = ''
    mainParams.COMP_NM = ''
    mainParams.EMP_NO = ''
    mainParams.EMP_NM = ''
    mainParams.TASK = ''
    mainParams.IMPR_ACTV = ''
    mainParams.LICENSE = ''
    mainParams.TASK_FILE_ID = ''
    mainParams.IMPR_ACTV_FILE_ID = ''
    mainParams.LICENSE_FILE_ID = ''
    mainParams.SITE_COMMENT = ''
    mainParams.REG_DATE = ''
    mainParams.SELF_EVAL_STATUS = ''
    mainParams.CONFIRM_YN = ''
    mainParams.USER_ID = ''

    // 조회 되는 내용이 없으면 버튼 비활성화 처리
    menuTitle.value.disableBtn('btnUpdate', true)         // 저장
    menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정

    return Message.warn(t(searchParams.EMP_NM + ' 님은 평가 선정된 안전관리자가 아닙니다. 다시 확인바랍니다.'))
  }
  
  chkStatus()

  checkFile(mainParams.TASK_FILE_ID, 'TASK')
  checkFile(mainParams.IMPR_ACTV_FILE_ID, 'ACTIVITY')
  checkFile(mainParams.LICENSE_FILE_ID, 'LICENSE')
}

const beforeSave = () => {
  
  if(isEmpty(mainParams.TASK)) {
    return Message.warn(t('안전관리자 업무일지 점수를 선택해 주세요.'))
  }

  if(isEmpty(mainParams.IMPR_ACTV)) {
    return Message.warn(t('안전개선활동 점수를 선택해 주세요.'))
  }

  if(isEmpty(mainParams.LICENSE)) {
    return Message.warn(t('안전관련 신규 자격증 취득 점수를 선택해 주세요.'))
  }

  if(mainParams.SELF_EVAL_STATUS === 'C') {
    return Message.warn(t('확정된 평가는 수정 할 수 없습니다.'))
  }

  return true
}

//저장
const saveData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: mainParams.CMPNY_DIV,
    COMP_CD: mainParams.COMP_CD,
    BSNS_CD: mainParams.BSNS_CD,
    ASGN_CD: mainParams.ASGN_CD,
    DEPT_CD: mainParams.DEPT_CD,
    EMP_NO: mainParams.EMP_NO,
    TASK: mainParams.TASK,
    IMPR_ACTV: mainParams.IMPR_ACTV,
    LICENSE: mainParams.LICENSE,
    TASK_FILE_ID: mainParams.TASK_FILE_ID,
    IMPR_ACTV_FILE_ID: mainParams.IMPR_ACTV_FILE_ID,
    LICENSE_FILE_ID: mainParams.LICENSE_FILE_ID,
    SITE_COMMENT: mainParams.SITE_COMMENT, // 코멘트
    REG_DATE: mainParams.REG_DATE,
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })
  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0030_SAVE_01', list: saveParams })
}

const beforeConfirm = () => {
  if(mainParams.SELF_EVAL_STATUS === 'N') {
    return Message.warn(t('자체 평가 저장 후 확정 바랍니다.'))
  }

  if(mainParams.SELF_EVAL_STATUS === 'C') {
    return Message.warn(t('이미 확정된 평가 입니다.'))
  }

  return true
}

//확정
const confirmData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: mainParams.CMPNY_DIV,
    COMP_CD: mainParams.COMP_CD,
    BSNS_CD: mainParams.BSNS_CD,
    ASGN_CD: mainParams.ASGN_CD,
    DEPT_CD: mainParams.DEPT_CD,
    EMP_NO: mainParams.EMP_NO,
    SELF_EVAL_STATUS: 'C',
    REG_DATE: mainParams.REG_DATE,
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  console.log('confirmData = ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0030_SAVE_02', list: saveParams })
}

const beforeCancelConfirm = () => {
  if(mainParams.SELF_EVAL_STATUS !== 'C') {
    return Message.warn(t('확정된 평가만 취소 할 수 있습니다.'))
  }

  return true
}

//확정 취소
const cancelConfirmData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: mainParams.CMPNY_DIV,
    COMP_CD: mainParams.COMP_CD,
    BSNS_CD: mainParams.BSNS_CD,
    ASGN_CD: mainParams.ASGN_CD,
    DEPT_CD: mainParams.DEPT_CD,
    EMP_NO: mainParams.EMP_NO,
    SELF_EVAL_STATUS: 'N',
    REG_DATE: mainParams.REG_DATE,
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  console.log('cancelConfirmData = ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIC0030_SAVE_02', list: saveParams })
}

// 안전관리자 업무일지 파일첨부
const addTaskFileClick = () => {
  fileUploadPopup_Task.value.openPopup(mainParams.TASK_FILE_ID)
}

//안전개선활동 파일첨부
const addActivityFileClick = () => {
  fileUploadPopup_Activity.value.openPopup(mainParams.IMPR_ACTV_FILE_ID)
}

// 안전관련 신규 자격증 취득 파일첨부
const addLicenseFileClick = () => {
  fileUploadPopup_License.value.openPopup(mainParams.LICENSE_FILE_ID)
}

// 인원검색 팝업
const empPopupOpen = () => {
  empPopup.value.openPopup({ EMP_NM: searchParams.EMP_NM })
}

// 파일 업로드 후 저장 
const uploaded_Task = param => {
  console.log('upload after : ',param)
  console.log('param.fileId : ',param.fileId)

  if (param.fileId) {
    mainParams.TASK_FILE_ID = param.fileId
    checkFile(param.fileId, 'TASK')
  } else {
    mainParams.TASK_FILE_ID = ''
  }
}

// 파일 업로드 후 저장 
const uploaded_Activity = param => {
  console.log('upload after : ',param)
  console.log('param.fileId : ',param.fileId)

  if (param.fileId) {
    mainParams.IMPR_ACTV_FILE_ID = param.fileId
    checkFile(param.fileId, 'ACTIVITY')
  } else {
    mainParams.IMPR_ACTV_FILE_ID = ''
  }
}

// 파일 업로드 후 저장 
const uploaded_License = param => {
  console.log('upload after : ',param)
  console.log('param.fileId : ',param.fileId)

  if (param.fileId) {
    mainParams.LICENSE_FILE_ID = param.fileId
    checkFile(param.fileId, 'LICENSE')
  } else {
    mainParams.LICENSE_FILE_ID = ''
  }
}


// 파일 존재 확인
const checkFile = async (fileId, id) => {
  const fileParams = {
    CMPNY_DIV: mainParams.CMPNY_DIV,
    FILE_ID: fileId,
  }

  // 파일이 있는지 확인
  await commonSearchApi({ queryId : 'SAFIB0030_SEARCH_03', param: fileParams }).then( res => {

    if(res.ORESULT_CUR[0].CNT_FILE > 0) {
      if(id === 'TASK') {
        fileTask.value = true
      }
      else if(id === 'ACTIVITY') {
        fileActivity.value = true
      }
      else if(id === 'LICENSE') {
        fileLicense.value = true
      }
    }
    else {
      if(id === 'TASK') {
        fileTask.value = false
      }
      else if(id === 'ACTIVITY') {
        fileActivity.value = false
      }
      else if(id === 'LICENSE') {
        fileLicense.value = false
      }
    }
  })
}

const getHalf  = month => {
  let half = '1'
  
  switch(month) {
  case "01":
  case "02":
  case "03":
  case "04":
  case "05":
  case "06":
    half = '1'
    break
  case "07":
  case "08":
  case "09":
  case "10":
  case "11":
  case "12":
    half = '2'
    break
  }

  return half
}

// 인원 조회 팝업 선택
const onEmpSelected = val => {
  if(!val){
    return
  }
  console.log('[onEmpSelected] val : ',val)

  mainParams.CMPNY_DIV = val.CMPNY_DIV
  mainParams.COMP_CD = val.ASGN_CD
  mainParams.BSNS_CD = val.BSNS_CD
  mainParams.ASGN_CD = val.ASGN_CD
  mainParams.EMP_NO = val.EMP_NO

  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.EMP_NM = val.EMP_NM
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.USER_ID = val.EMP_NO

  onButtonsClick({ id: "btnSearch" })
}

watch(
  () => [searchParams.YEAR, searchParams.HALF, searchParams.USER_ID],
  ([newValueYEAR, newValueHALF, newValueUSER_ID], [oldValueYEAR, oldValueHALF, oldValueUSER_ID]) => {
    
    mainParams.CMPNY_DIV = ''
    mainParams.COMP_CD = ''
    mainParams.BSNS_CD = ''
    mainParams.ASGN_CD = ''
    mainParams.DEPT_CD = ''
    mainParams.COMP_NM = ''
    mainParams.EMP_NO = ''
    mainParams.EMP_NM = ''
    mainParams.TASK = ''
    mainParams.IMPR_ACTV = ''
    mainParams.LICENSE = ''
    mainParams.TASK_FILE_ID = ''
    mainParams.IMPR_ACTV_FILE_ID = ''
    mainParams.LICENSE_FILE_ID = ''
    mainParams.SITE_COMMENT = ''
    mainParams.REG_DATE = ''
    mainParams.SELF_EVAL_STATUS = ''
    mainParams.CONFIRM_YN = ''
    mainParams.USER_ID = ''
  }
)


</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IGridTitle
        ref="menuTitle"
        :use-permission="false"
        :button-list="['btnSearch', 'btnUpdate', 'btnVendorConfirm', 'btnManual']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-sheet class="searchArea d-flex">
      <div class="d-flex justify-space-between align-center mb-3" style="width: 100%;">
        <div class="d-flex">
          <i-input
            v-model="searchParams.YEAR"
            :label="$t('년도')"
            label-width="50px"
            type="Number"
            width="150px"
          />
          <i-select
            v-model="searchParams.HALF"
            :label="$t('반기')"
            label-width="50px"
            append-inner-icon="mdi-magnify"
            :items="dtHalf"
            item-title="TXT"
            item-value="COD"
            width="200px"
          />
          <i-input
            v-if="isVisibleEmp"
            v-model="searchParams.EMP_NM"
            :label="$t('인원검색')"
            type="Text"
            label-width="80px"
            width="250px"
            append-inner-icon="mdi-magnify"
            @click:append-inner="empPopupOpen"
            @keydown.enter="empPopupOpen"
          />
        </div>

        <div style="color: red;">
          파일첨부 및 점수입력 후, 저장버튼만 누를 시 자체평가 미완료 상태로 유지되니 반드시 '협력사 확정' 버튼을 눌러 자체평가 완료해주시길 바랍니다.
        </div>
      </div>
    </v-sheet>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="d-flex mt-2 mb-3">
          <i-input
            v-model="mainParams.COMP_NM"
            :label="$t('업체명')"
            label-width="70px"
            width="350px"
            readonly
          />
          <i-input
            v-model="mainParams.EMP_NO"
            :label="$t('사번')"
            label-width="70px"
            width="200px"
            readonly
          />
          <i-input
            v-model="mainParams.EMP_NM"
            :label="$t('이름')"
            label-width="70px"
            width="200px"
            readonly
          />
        </v-sheet>
        <v-sheet class="d-flex mb-3">
          <i-select
            v-model="mainParams.TASK"
            :label="$t('➀ 안전관리자 업무일지')"
            label-width="180px"
            append-inner-icon="mdi-magnify"
            :items="dtScore1"
            item-title="TXT"
            item-value="COD"
            width="300px"
            required
          />
          <v-btn
            v-model="mainParams.TASK_FILE_ID"
            @click="addTaskFileClick" 
          >
            첨부
          </v-btn>
          <div 
            v-if="fileTask" 
            class="complete-file ml-2"
          >
            첨부된 파일이 있습니다.
          </div>
        </v-sheet>
        <v-sheet class="d-flex mb-3">
          <i-select
            v-model="mainParams.IMPR_ACTV"
            :label="$t('➁ 안전개선활동')"
            label-width="180px"
            append-inner-icon="mdi-magnify"
            :items="dtScore2"
            item-title="TXT"
            item-value="COD"
            width="300px"
            required
          />
          <v-btn
            v-model="mainParams.IMPR_ACTV_FILE_ID"
            @click="addActivityFileClick" 
          >
            첨부
          </v-btn>
          <div 
            v-if="fileActivity" 
            class="complete-file ml-2"
          >
            첨부된 파일이 있습니다.
          </div>
        </v-sheet>
        <v-sheet class="d-flex mb-3">
          <i-select
            v-model="mainParams.LICENSE"
            :label="$t('➂ 안전관련 신규 자격증 취득')"
            label-width="180px"
            append-inner-icon="mdi-magnify"
            :items="dtScore3"
            item-title="TXT"
            item-value="COD"
            width="300px"
            required
          />
          <v-btn
            v-model="mainParams.LICENSE_FILE_ID"
            @click="addLicenseFileClick" 
          >
            첨부
          </v-btn>
          <div 
            v-if="fileLicense" 
            class="complete-file ml-2"
          >
            첨부된 파일이 있습니다.
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <div
            v-if="isVisibleComment"
            class="formLabelText mt-3"
          >
            사업부 안전 comment
          </div>
          <div
            v-if="isVisibleComment"
            class="mt-2"
          >
            <v-textarea
              v-model="mainParams.SITE_COMMENT"
              dense
              outlined
            />
          </div>
        </v-sheet>
      </div>
      <!-- 안전관리자 업무일지 파일첨부 -->
      <IUploadPopup 
        ref="fileUploadPopup_Task"
        @uploaded="uploaded_Task($event)"
      />
      <!-- 안전개선활동 파일첨부 -->
      <IUploadPopup 
        ref="fileUploadPopup_Activity"
        @uploaded="uploaded_Activity($event)"
      />
      <!-- 안전관련 신규 자격증 취득 파일첨부 -->
      <IUploadPopup 
        ref="fileUploadPopup_License"
        @uploaded="uploaded_License($event)"
      />
      <!-- 인원조회팝업 -->
      <EmpPopup
        ref="empPopup"
        @selected="onEmpSelected" 
      />
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.complete-file {
  color: blue;
  display: flex;
  align-items: center;
}
</style>