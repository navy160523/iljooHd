<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonExecuteApi,
  commonSearchApi,
  getCodeList,
} from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUpload from '@/components/IUpload.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
import { isEmpty } from 'lodash-es'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'

defineOptions({
  name: 'SAFDC0020_01Popup01',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const dialog = ref(false)

const safetyImageUpload = ref(null)
const safetyFileUpload = ref(null)
const actionImageUpload = ref(null)
const actionFileUpload = ref(null)

const locationPopup = ref(null)
const deptPopup = ref(null)
const safetyActEmpPopup = ref(null)
const safetyChkEmpPopup = ref(null)
const safetyAppEmpPopup = ref(null)

const isAppSameAsChk = ref(false)

const municipalField = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  MNG_NO: '',
  BSNS_CD: userStore.bsnsCd,
  REC_DEPT_CD: '',
  NOTI_SCAN: '',       // 위반사항 파일/사진 ID (FILE_ID1)
  ACT_RSLT_SCAN: '',   // 조치사항 파일/사진 ID (FILE_ID2)
  NOTI_TITLE: '',
  PROBLEM_DESC: '',
  REQUIRE_DESC: '',
  LOCATION_NM: '',
  NOTI_PLC_DESC: '',
  SHIP_NO: '',
  REQ_REPLY_DT: '',
  NOTI_DT: '',
  REC_ASGN_NM: '',
  REC_ASGN_CD: '',
  
  // 조치자 정보
  ACT_EMP_NM: '',
  ACT_EMP_NO: '',
  ACT_JOB_TIT_NM: '',
  ACT_ASGN_NM: '',
  ACT_TEL_NO: '',
  ACT_RSLT: '',
  ACT_DIV: '조치대기', // 초기상태
  
  // 점검자 정보
  CHK_EMP_NM: '',
  CHK_EMP_NO: '',
  CHK_JOB_TIT_NM: '',
  CHK_ASGN_NM: '',
  CHK_TEL_NO: '',
  
  // 승인자 정보
  APP_EMP_NM: '',
  APP_EMP_NO: '',
  APPROVE_ID: '',
  STATUS: '10', // 작성중
})

const codeList = reactive({
  APP_EMP_NO: [],
  SHIP_NO: [],
})

const emit = defineEmits(['closed'])

const uploaded = (val) => {
  console.log('Uploaded event:', val)
}

const initUploads = () => {
  vm.$nextTick(() => {
    if (safetyImageUpload.value) {
      if (!municipalField.NOTI_SCAN) {
        safetyImageUpload.value.setGuid()
        municipalField.NOTI_SCAN = safetyImageUpload.value.guid
      } else {
        safetyImageUpload.value.setGuid(municipalField.NOTI_SCAN)
        safetyImageUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
    if (safetyFileUpload.value) {
      if (!municipalField.NOTI_SCAN) {
        safetyFileUpload.value.setGuid()
        municipalField.NOTI_SCAN = safetyFileUpload.value.guid
      } else {
        safetyFileUpload.value.setGuid(municipalField.NOTI_SCAN)
        safetyFileUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
    if (actionImageUpload.value) {
      if (!municipalField.ACT_RSLT_SCAN) {
        actionImageUpload.value.setGuid()
        municipalField.ACT_RSLT_SCAN = actionImageUpload.value.guid
      } else {
        actionImageUpload.value.setGuid(municipalField.ACT_RSLT_SCAN)
        actionImageUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
    if (actionFileUpload.value) {
      if (!municipalField.ACT_RSLT_SCAN) {
        actionFileUpload.value.setGuid()
        municipalField.ACT_RSLT_SCAN = actionFileUpload.value.guid
      } else {
        actionFileUpload.value.setGuid(municipalField.ACT_RSLT_SCAN)
        actionFileUpload.value.onButtonsClick({ id: 'btnSearch' })
      }
    }
  })
}

const initField = () => {
  municipalField.MNG_NO = ''
  municipalField.NOTI_TITLE = ''
  municipalField.PROBLEM_DESC = ''
  municipalField.REQUIRE_DESC = ''
  municipalField.LOCATION_NM = ''
  municipalField.NOTI_PLC_DESC = ''
  municipalField.REC_ASGN_NM = ''
  municipalField.REC_ASGN_CD = ''
  municipalField.REC_DEPT_CD = ''
  municipalField.SHIP_NO = ''
  municipalField.NOTI_SCAN = ''
  municipalField.ACT_RSLT_SCAN = ''
  
  municipalField.NOTI_DT = dayjs().format('YYYY-MM-DD')
  municipalField.REQ_REPLY_DT = dayjs().add(3, 'day').format('YYYY-MM-DD')
  
  municipalField.CHK_EMP_NM = userStore.empNm
  municipalField.CHK_EMP_NO = userStore.empNo
  municipalField.CHK_JOB_TIT_NM = userStore.jobTitNm || ''
  municipalField.CHK_ASGN_NM = userStore.asgnFullNm
  municipalField.CHK_TEL_NO = userStore.hndPhn || ''
  
  municipalField.ACT_EMP_NM = ''
  municipalField.ACT_EMP_NO = ''
  municipalField.ACT_JOB_TIT_NM = ''
  municipalField.ACT_ASGN_NM = ''
  municipalField.ACT_TEL_NO = ''
  municipalField.ACT_RSLT = ''
  municipalField.ACT_DIV = '조치대기'
  
  municipalField.APP_EMP_NM = ''
  municipalField.APP_EMP_NO = ''
  municipalField.APPROVE_ID = ''
  municipalField.STATUS = '10'
  
  isAppSameAsChk.value = false
}

const initCodList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_04',
      param: {
        CMPNY_DIV: municipalField.CMPNY_DIV,
        DANSOK_EMP_NO: municipalField.CHK_EMP_NO,
      },
    }),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_17',
      param: {},
    }),
  ]).then((res) => {
    codeList.APP_EMP_NO = res[0].ORESULT_CUR
    codeList.SHIP_NO = res[1].ORESULT_CUR
  })
}

const openPopup = () => {
  dialog.value = true
  initField()
  initCodList()
  initUploads()
}

const openPopup2 = (rowData) => {
  dialog.value = true
  for (const [key, value] of Object.entries(rowData)) {
    if (municipalField.hasOwnProperty(key)) {
      municipalField[key] = value
    }
  }
  isAppSameAsChk.value = (municipalField.APP_EMP_NO === municipalField.CHK_EMP_NO && municipalField.APP_EMP_NO !== '')
  initCodList()
  initUploads()
}

const closePopup = () => {
  dialog.value = false
  emit('closed')
}

// 장소 선택
const openLocationPopup = () => {
  locationPopup.value.openPopup('장소')
}
const selectedLocation = (val) => {
  municipalField.NOTI_LPLC = val[0].COD
  municipalField.NOTI_MPLC = val[1].COD
  municipalField.NOTI_SPLC = val[2].COD
  municipalField.LOCATION_NM = val[2].TXT
}

// 수신조직 선택
const openDeptPopup = () => {
  deptPopup.value.openPopup()
}
const selectedDept = (val) => {
  municipalField.REC_ASGN_NM = val.ASGN_FULL_NM
  municipalField.REC_ASGN_CD = val.ASGN_CD
  municipalField.REC_DEPT_CD = val.DEPT_CD
}

// 조치자 팝업
const openSafetyActEmpPopup = () => {
  safetyActEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    readonly: true,
  })
}
const selectedSafetyActEmp = (val) => {
  municipalField.ACT_EMP_NM = val.EMP_NM
  municipalField.ACT_EMP_NO = val.EMP_NO
  municipalField.ACT_JOB_TIT_NM = val.JOB_TIT_NM
  municipalField.ACT_ASGN_NM = val.ASGN_NM
  municipalField.ACT_TEL_NO = val.TEL_NO || val.HND_PHN
}

// 점검자 팝업
const openSafetyChkEmpPopup = () => {
  safetyChkEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    readonly: true,
  })
}
const selectedSafetyChkEmp = (val) => {
  municipalField.CHK_EMP_NM = val.EMP_NM
  municipalField.CHK_EMP_NO = val.EMP_NO
  municipalField.CHK_JOB_TIT_NM = val.JOB_TIT_NM
  municipalField.CHK_ASGN_NM = val.ASGN_NM
  municipalField.CHK_TEL_NO = val.TEL_NO || val.HND_PHN
}

// 승인자 팝업
const openSafetyAppEmpPopup = () => {
  if (isAppSameAsChk.value) return
  safetyAppEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    readonly: true,
  })
}
const selectedAppEmp = (val) => {
  municipalField.APP_EMP_NM = val.EMP_NM
  municipalField.APP_EMP_NO = val.EMP_NO
}

// 승인자동일 체크박스
watch(isAppSameAsChk, (newValue) => {
  if (newValue) {
    municipalField.APP_EMP_NM = municipalField.CHK_EMP_NM
    municipalField.APP_EMP_NO = municipalField.CHK_EMP_NO
  } else {
    municipalField.APP_EMP_NM = ''
    municipalField.APP_EMP_NO = ''
  }
})

// 점검자 변경 시 승인자 콤보박스 및 자동동일 동기화
watch(() => municipalField.CHK_EMP_NO, (newValue) => {
  commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_04',
    param: {
      CMPNY_DIV: municipalField.CMPNY_DIV,
      DANSOK_EMP_NO: newValue,
    },
  }).then((res) => {
    codeList.APP_EMP_NO = res.ORESULT_CUR
  })
  if (isAppSameAsChk.value) {
    municipalField.APP_EMP_NM = municipalField.CHK_EMP_NM
    municipalField.APP_EMP_NO = municipalField.CHK_EMP_NO
  }
})

// 저장 로직
const beforeSave = () => {
  if (!municipalField.NOTI_DT) {
    Message.warn(t('점검일자는 필수값입니다.'))
    return false
  } else if (!municipalField.LOCATION_NM) {
    Message.warn(t('장소는 필수값입니다.'))
    return false
  } else if (!municipalField.NOTI_TITLE) {
    Message.warn(t('제목은 필수값입니다.'))
    return false
  } else if (!municipalField.REC_ASGN_CD) {
    Message.warn(t('수신조직은 필수값입니다.'))
    return false
  } else if (!municipalField.PROBLEM_DESC) {
    Message.warn(t('문제점은 필수값입니다.'))
    return false
  } else if (!municipalField.CHK_EMP_NM) {
    Message.warn(t('점검자는 필수값입니다.'))
    return false
  }
  return true
}

const onSave = () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveDataQuery)
    .setAfter(() => {
      Message.success(t('저장되었습니다.'))
    })
    .run()
}

const saveDataQuery = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    MNG_NO: municipalField.MNG_NO,
    NOTI_DT: municipalField.NOTI_DT,
    BSNS_CD: userStore.bsnsCd,
    REC_DEPT_CD: municipalField.REC_DEPT_CD,
    NOTI_TITLE: municipalField.NOTI_TITLE,
    NOTI_SCAN: municipalField.NOTI_SCAN,
    PROBLEM_DESC: municipalField.PROBLEM_DESC,
    REQUIRE_DESC: municipalField.REQUIRE_DESC,
    NOTI_LPLC: municipalField.NOTI_LPLC,
    NOTI_MPLC: municipalField.NOTI_MPLC,
    NOTI_SPLC: municipalField.NOTI_SPLC,
    NOTI_PLC_DESC: municipalField.NOTI_PLC_DESC,
    SEND_ASGN_CD: userStore.asgnCd,
    CHK_EMP_NO: municipalField.CHK_EMP_NO,
    CHK_TEL_NO: municipalField.CHK_TEL_NO,
    REQ_REPLY_DT: municipalField.REQ_REPLY_DT,
    APPROVE_ID: municipalField.APPROVE_ID,
    ACT_RSLT: municipalField.ACT_RSLT,
    ACT_RSLT_SCAN: municipalField.ACT_RSLT_SCAN,
    ACT_DEPT_CD: municipalField.ACT_ASGN_NM,
    ACT_ASGN_CD: municipalField.ACT_ASGN_NM,
    ACT_EMP_NO: municipalField.ACT_EMP_NO,
    ACT_TEL_NO: municipalField.ACT_TEL_NO,
    STATUS: municipalField.MNG_NO === '' ? '10' : municipalField.STATUS,
    CLOSE_DT: '',
    CLOSE_ASGN_CD: '',
    CLOSE_EMP_NO: '',
    SAGO_DIV_LIST: '',
    CLOSE_DEPT_CD: '',
    SEND_DEPT_CD: userStore.deptCd,
    REC_ASGN_CD: municipalField.REC_ASGN_CD,
    USER_ID: userStore.userId,
    SHIP_NO: municipalField.SHIP_NO,
    COMPANY: userStore.cmpnyDiv,
    APP_EMP_NO: municipalField.APP_EMP_NO,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE04',
    list: saveParam,
  }).then((res) => {
    if (!municipalField.MNG_NO && res.list && res.list[0]) {
      municipalField.MNG_NO = res.list[0].OUT_RES_MNG_NO || res.list[0].MNG_NO
    }
  })
}

// 조치완료 로직
const beforeActionComplete = () => {
  if (!municipalField.MNG_NO) {
    Message.warn(t('먼저 임시저장을 진행해주십시오.'))
    return false
  } else if (!municipalField.ACT_RSLT) {
    Message.warn(t('조치결과를 입력해주십시오.'))
    return false
  } else if (!municipalField.ACT_EMP_NO) {
    Message.warn(t('조치자를 지정해주십시오.'))
    return false
  }
  return true
}

const onActionComplete = () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeActionComplete)
    .setQuery(actionCompleteQuery)
    .setAfter(() => {
      Message.success(t('조치 완료 처리가 되었습니다.'))
      municipalField.STATUS = '40'
      municipalField.ACT_DIV = '조치완료'
    })
    .run()
}

const actionCompleteQuery = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    MNG_NO: municipalField.MNG_NO,
    ACT_DT: dayjs().format('YYYY-MM-DD'),
    ACT_RSLT: municipalField.ACT_RSLT,
    ACT_RSLT_SCAN: municipalField.ACT_RSLT_SCAN,
    ACT_DEPT_CD: municipalField.ACT_ASGN_NM,
    ACT_ASGN_CD: municipalField.ACT_ASGN_NM,
    ACT_EMP_NO: municipalField.ACT_EMP_NO,
    ACT_TEL_NO: municipalField.ACT_TEL_NO,
    STATUS: '40', // 조치완료
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE07',
    list: saveParam,
  })
}

// 삭제 로직
const onDelete = () => {
  if (!municipalField.MNG_NO) {
    Message.warn(t('저장되지 않은 지적서는 삭제할 수 없습니다.'))
    return
  }
  new deleteFlowHelper(vm, t)
    .setBefore(() => true)
    .setQuery(deleteQuery)
    .setAfter(() => {
      Message.success(t('삭제되었습니다.'))
      closePopup()
    })
    .run()
}

const deleteQuery = () => {
  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE01',
    list: [{
      CMPNY_DIV: userStore.cmpnyDiv,
      MNG_NO: municipalField.MNG_NO,
      REASON: '',
      USER_ID: userStore.userId,
    }]
  })
}

// 결재상신 로직
const onApproval = () => {
  if (!municipalField.MNG_NO) {
    Message.warn(t('저장되지 않은 지적서는 결재신청할 수 없습니다.'))
    return
  } else if (!municipalField.APP_EMP_NO) {
    Message.warn(t('승인자를 선택해주십시오.'))
    return
  }
  
  new saveFlowHelper(vm, t)
    .setBefore(() => true)
    .setQuery(approvalQuery)
    .setAfter(() => {
      Message.success(t('결재신청 되었습니다.'))
      municipalField.STATUS = '20' // 승인대기
    })
    .run()
}

const approvalQuery = () => {
  let day = dayjs()
  let approvalParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: day.format('YYYY'),
    APPROVE_ID: 'SAFDC0020_' + userStore.userId + '_' + day.format('YYYYMMDDHHmmss'),
    FORM_ID: 'SAFDC0020',
    APP_EMP_NO: municipalField.APP_EMP_NO,
    APPROVE_GBN: 'I',
    APP_REQ_EMP_NO: userStore.userId,
    APP_STATUS: 'N',
    PATH: '/30_safety/SAF_D/SAFDC0020',
    USER_ID: userStore.userId,
  }
  return commonExecuteApi({
    queryId: 'OPRAB0010_SAVE_01',
    list: [approvalParam],
  }).then(() => {
    municipalField.APPROVE_ID = approvalParam.APPROVE_ID
  })
}

// 결재취소 로직
const onCancelApproval = () => {
  if (municipalField.STATUS !== '20') {
    Message.warn(t('승인대기 상태에서만 취소할 수 있습니다.'))
    return
  }
  
  new saveFlowHelper(vm, t)
    .setBefore(() => true)
    .setQuery(cancelApprovalQuery)
    .setAfter(() => {
      Message.success(t('결재 신청이 취소되었습니다.'))
      municipalField.STATUS = '10' // 작성중
    })
    .run()
}

const cancelApprovalQuery = () => {
  return commonExecuteApi({
    queryId: 'SAFDC0010_CANCEL01',
    list: [{
      CMPNY_DIV: userStore.cmpnyDiv,
      VIO_NO: municipalField.MNG_NO,
      MNG_NO: municipalField.MNG_NO,
      USER_ID: userStore.userId,
    }]
  })
}

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1600"
    eager
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-card class="pa-0 fill-height rounded-5">
      <!-- Header -->
      <v-sheet
        color="primarySub"
        height="50"
        class="px-4 d-flex align-center rounded-t-5 text-white font-weight-bold cursor-move"
        @mousedown="startDragging"
      >
        시정통보등록
      </v-sheet>
      
      <!-- Top Buttons -->
      <div class="d-flex justify-end gap-2 pa-3 bg-white border-b">
        <v-btn color="primary" @click="onSave" class="mr-2">저장</v-btn>
        <v-btn color="success" @click="onActionComplete" class="mr-2">조치완료</v-btn>
        <v-btn color="error" @click="onDelete" class="mr-2">삭제</v-btn>
        <v-btn color="grey" @click="closePopup">닫기</v-btn>
      </div>

      <!-- Main Content Area -->
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea pa-4">
            
            <!-- ① 일시 및 장소 -->
            <div class="sheetTitle mb-2">① 일시 및 장소</div>
            <div class="d-flex mt-2 mb-4 flex-wrap">
              <i-input
                :label="$t('점검일자')"
                width="150px"
                top-label
                type="date"
                v-model="municipalField.NOTI_DT"
                required
              ></i-input>
              <i-input
                :label="$t('회신요구일')"
                width="150px"
                top-label
                type="date"
                v-model="municipalField.REQ_REPLY_DT"
                required
              ></i-input>
              <i-input
                :label="$t('장소')"
                top-label
                width="200px"
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="openLocationPopup"
                v-model="municipalField.LOCATION_NM"
                required
              ></i-input>
              <i-input
                :label="$t('장소상세')"
                top-label
                width="300px"
                v-model="municipalField.NOTI_PLC_DESC"
              ></i-input>
              <i-select
                :label="$t('호선/프로젝트No.')"
                top-label
                width="250px"
                v-model="municipalField.SHIP_NO"
                :items="codeList.SHIP_NO"
                item-value="WORK_NO"
                item-title="WORK_NO"
              ></i-select>
            </div>

            <!-- ② 위반정보 -->
            <div class="sheetTitle mb-2">② 위반정보</div>
            <div class="d-flex mt-2 mb-4 flex-wrap">
              <i-input
                :label="$t('제목')"
                width="600px"
                top-label
                v-model="municipalField.NOTI_TITLE"
                required
              ></i-input>
              <i-input
                :label="$t('수신조직')"
                width="300px"
                top-label
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="openDeptPopup"
                required
                v-model="municipalField.REC_ASGN_NM"
              ></i-input>
            </div>

            <!-- ③ 위반내용 -->
            <div class="sheetTitle mb-2">③ 위반내용</div>
            <div class="d-flex mt-2 mb-4">
              <i-textarea
                :label="$t('문제점')"
                width="50%"
                top-label
                v-model="municipalField.PROBLEM_DESC"
                required
                class="mr-2"
              ></i-textarea>
              <i-textarea
                :label="$t('시정요구안')"
                width="50%"
                top-label
                v-model="municipalField.REQUIRE_DESC"
              ></i-textarea>
            </div>

            <!-- 위반사항 사진/파일 첨부 -->
            <div class="mb-6">
              <IUploadImageMulit
                title="사진첨부"
                ref="safetyImageUpload"
                height="300"
              ></IUploadImageMulit>
              <IUpload
                gridTitle="파일첨부"
                ref="safetyFileUpload"
                height="250"
              ></IUpload>
            </div>

            <!-- ④ 조치내용 -->
            <div class="sheetTitle mb-2">④ 조치내용</div>
            <div class="d-flex mt-2 mb-2 flex-wrap">
              <i-input
                v-model="municipalField.ACT_EMP_NM"
                :label="$t('조치자성명')"
                width="200px"
                top-label
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSafetyActEmpPopup"
              ></i-input>
              <i-input
                v-model="municipalField.ACT_EMP_NO"
                :label="$t('사번')"
                width="200px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="municipalField.ACT_JOB_TIT_NM"
                :label="$t('직위')"
                width="150px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="municipalField.ACT_ASGN_NM"
                :label="$t('소속')"
                width="250px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="municipalField.ACT_TEL_NO"
                :label="$t('전화번호')"
                width="200px"
                top-label
              ></i-input>
            </div>
            <div class="d-flex mb-4 flex-wrap">
              <i-input
                v-model="municipalField.ACT_RSLT"
                :label="$t('조치결과')"
                width="600px"
                top-label
              ></i-input>
              <i-input
                v-model="municipalField.ACT_DIV"
                :label="$t('조치구분')"
                width="200px"
                top-label
                readonly
              ></i-input>
            </div>

            <!-- 조치사항 사진/파일 첨부 -->
            <div class="mb-6">
              <IUploadImageMulit
                title="사진첨부"
                ref="actionImageUpload"
                height="300"
              ></IUploadImageMulit>
              <IUpload
                gridTitle="파일첨부"
                ref="actionFileUpload"
                height="250"
              ></IUpload>
            </div>

            <!-- ⑤ 단속자/승인자정보 -->
            <div class="sheetTitle mb-2">⑤ 단속자/승인자정보</div>
            <div class="d-flex mt-2 mb-4 align-center flex-wrap">
              <i-input
                v-model="municipalField.CHK_EMP_NM"
                :label="$t('점검자성명')" 
                width="200px"
                top-label
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSafetyChkEmpPopup"
                required
              ></i-input>
              <i-input
                v-model="municipalField.CHK_EMP_NO"
                :label="$t('사번')"
                width="150px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="municipalField.CHK_JOB_TIT_NM"
                :label="$t('직위')"
                width="150px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="municipalField.CHK_ASGN_NM"
                :label="$t('소속')"
                width="250px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="municipalField.CHK_TEL_NO"
                :label="$t('전화번호')"
                width="200px"
                top-label
              ></i-input>

              <!-- 승인자 부분 -->
              <div class="d-flex align-center mt-5 ml-4">
                <v-checkbox
                  v-model="isAppSameAsChk"
                  label="승인자동일"
                  hide-details
                  class="mr-2"
                ></v-checkbox>
                <i-input
                  v-model="municipalField.APP_EMP_NM"
                  label="승인자"
                  width="200px"
                  append-inner-icon="mdi-magnify"
                  :readonly="isAppSameAsChk"
                  @click:appendInner="openSafetyAppEmpPopup"
                  hide-details
                ></i-input>
              </div>

              <v-btn class="mt-5 ml-4" color="primary" @click="onApproval">승인신청</v-btn>
              <v-btn class="mt-5 ml-2" color="warning" @click="onCancelApproval">승인신청취소</v-btn>
            </div>

          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <DeptPopup ref="deptPopup" @selected="selectedDept" check-bar="true"></DeptPopup>
  <CommonCodePopUpSAF ref="locationPopup" @selected="selectedLocation"></CommonCodePopUpSAF>
  <EmpPopup ref="safetyActEmpPopup" @selected="selectedSafetyActEmp"></EmpPopup>
  <EmpPopup ref="safetyChkEmpPopup" @selected="selectedSafetyChkEmp"></EmpPopup>
  <EmpPopup ref="safetyAppEmpPopup" @selected="selectedAppEmp"></EmpPopup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  max-height: calc(85vh);
  overflow-y: auto;
  > div {
    min-height: 800px;
  }
}
.sheetTitle {
  font-size: 16px;
  font-weight: bold;
  border-bottom: 2px solid #1a237e;
  padding-bottom: 4px;
}
.border-b {
  border-bottom: 1px solid #e0e0e0;
}
</style>

