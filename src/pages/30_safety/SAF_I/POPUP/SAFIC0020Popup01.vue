<!-- 
  * Vue 내 용 : 업체 안전관리자 자체평가 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/12
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/09 
-->

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { isEmpty } from '@/@core/utils'
import Message from '@hiway/utils/notify'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

const emit = defineEmits(['closed'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const menuTitle = ref(null)
const isCharger = ref(false)
const fileUploadPopup_Task = ref(null) //파일 업로드 팝업
const fileUploadPopup_Activity = ref(null) //파일 업로드 팝업
const fileUploadPopup_License = ref(null) //파일 업로드 팝업
const fileTask = ref(false)
const fileActivity = ref(false)
const fileLicense = ref(false)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  x.value = event.pageX
  y.value = event.pageY
}

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  HALF: '',
  BSNS_CD: '',
  USER_ID: userStore.userId,
})

//조회조건
const popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  HALF_NM: '',
  HALF: '',
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
  EMAIL: '',
  USER_ID: userStore.userId,
})


const dtScore1 = reactive([
  { COD: '0', TXT: '0점' },
  { COD: '5', TXT: '5점' },
  { COD: '10', TXT: '10점' },
  { COD: '15', TXT: '15점' },
])

const dtScore2 = reactive([
  { COD: '0', TXT: '0점' },
  { COD: '1', TXT: '1점' },
  { COD: '2', TXT: '2점' },
  { COD: '3', TXT: '3점' },
  { COD: '4', TXT: '4점' },
  { COD: '5', TXT: '5점' },
])

const dtScore3 = reactive([
  { COD: '0', TXT: '0점' },
  { COD: '5', TXT: '5점' },
])


const openPopup = (val, charger) => {
  console.log('[openPopup] val: ', val)

  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.YEAR = val.REG_DATE.substr(0, 4)
  searchParams.HALF = val.REG_DATE.substr(4)
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.USER_ID = val.EMP_NO

  isCharger.value = charger

  popupParams.YEAR = val.REG_DATE.substr(0, 4)
  popupParams.HALF = val.REG_DATE.substr(4)
  popupParams.EMAIL = val.EMAIL

  if (popupParams.HALF === '1') {
    popupParams.HALF_NM = '상반기'
  } else if (popupParams.HALF === '2') {
    popupParams.HALF_NM = '하반기'
  }

  onButtonsClick({ id: 'btnSearch' })

  chkStatus()
  dialog.value = true
}

const chkStatus = () => {
  console.log('chkStatus : ', popupParams.SELF_EVAL_STATUS)

  if (popupParams.CONFIRM_YN === 'Y') {
    menuTitle.value.disableBtn('btnFinishReview', true) // 검토완료
    menuTitle.value.disableBtn('btnCancelFinish', true) // 검토완료취소
    menuTitle.value.disableBtn('btnVendorCancelConfirm', true) // 협력사확정취소
  } else {
    if (popupParams.SELF_EVAL_STATUS === 'C') {
      menuTitle.value.disableBtn('btnFinishReview', false) // 검토완료
      menuTitle.value.disableBtn('btnCancelFinish', true) // 검토완료취소
      menuTitle.value.disableBtn('btnVendorCancelConfirm', false)
    } else if (popupParams.SELF_EVAL_STATUS === 'F') {
      menuTitle.value.disableBtn('btnFinishReview', true) // 검토완료
      menuTitle.value.disableBtn('btnCancelFinish', false) // 검토완료취소
      menuTitle.value.disableBtn('btnVendorCancelConfirm', true) // 협력사확정취소
    } else {
      menuTitle.value.disableBtn('btnFinishReview', true) // 검토완료
      menuTitle.value.disableBtn('btnCancelFinish', true) // 검토완료취소
      menuTitle.value.disableBtn('btnVendorCancelConfirm', true) // 협력사확정취소
    }
  }
}

const onClose = () => {
  dialog.value = false
  emit('closed')
}

defineExpose({
  openPopup,
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }

  // else if (btn.id === 'btnUpdate') {
  //   new saveFlowHelper(vm, t)
  //     .setBefore(beforeSave)
  //     .setQuery(saveData)
  //     .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
  //     .run()
  // }
  else if (btn.id === 'btnFinishReview') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeFinish)
      .setQuery(finishData)
      .setConfirmMessage('담당자 검토완료 하시겠습니까?')
      .setResultMessage('검토완료 되었습니다.')
      .setAfter(afterFinish)
      .run()
  } else if (btn.id === 'btnVendorCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeCancelConfirm)
      .setQuery(cancelConfirmData)
      .setConfirmMessage('협력사 확정 취소 하시겠습니까?')
      .setResultMessage('협력사 확정 취소되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnCancelFinish') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeCancelFinish)
      .setQuery(cancelFinishData)
      .setConfirmMessage('검토완료 취소 하시겠습니까?')
      .setResultMessage('검토완료 취소되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnManual') {
    let params = {
      FILE_PATH: 'SAFI',
      FILE_NAME:
        '[첨부.3] 협력사 안전관리자 역량평가 Check List_최종_개선 完.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 조회
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFIC0030_SEARCH_01',
    param: searchParams,
  })
}

// 조회 후 데이터 처리
const afterSearch = (res) => {
  console.log('[afterSearch] res : ', res)

  popupParams.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
  popupParams.COMP_CD = res.ORESULT_CUR[0].COMP_CD
  popupParams.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
  popupParams.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
  popupParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
  popupParams.COMP_NM = res.ORESULT_CUR[0].COMP_NM
  popupParams.EMP_NO = res.ORESULT_CUR[0].EMP_NO
  popupParams.EMP_NM = res.ORESULT_CUR[0].KOR_NM
  popupParams.TASK = res.ORESULT_CUR[0].TASK
  popupParams.IMPR_ACTV = res.ORESULT_CUR[0].IMPR_ACTV
  popupParams.LICENSE = res.ORESULT_CUR[0].LICENSE
  popupParams.TASK_FILE_ID = res.ORESULT_CUR[0].TASK_FILE_ID
  popupParams.IMPR_ACTV_FILE_ID = res.ORESULT_CUR[0].IMPR_ACTV_FILE_ID
  popupParams.LICENSE_FILE_ID = res.ORESULT_CUR[0].LICENSE_FILE_ID
  popupParams.SITE_COMMENT = res.ORESULT_CUR[0].SITE_COMMENT
  popupParams.REG_DATE = res.ORESULT_CUR[0].REG_DATE
  popupParams.SELF_EVAL_STATUS = res.ORESULT_CUR[0].SELF_EVAL_STATUS
  popupParams.CONFIRM_YN = res.ORESULT_CUR[0].CONFIRM_YN

  chkStatus()

  checkFile(popupParams.TASK_FILE_ID, 'TASK')
  checkFile(popupParams.IMPR_ACTV_FILE_ID, 'ACTIVITY')
  checkFile(popupParams.LICENSE_FILE_ID, 'LICENSE')
}

// const beforeSave = () => {

//   if(isEmpty(popupParams.TASK)) {
//     return Message.warn(t('안전관리자 업무일지 점수를 선택해 주세요.'))
//   }

//   if(isEmpty(popupParams.IMPR_ACTV)) {
//     return Message.warn(t('안전개선활동 점수를 선택해 주세요.'))
//   }

//   if(isEmpty(popupParams.LICENSE)) {
//     return Message.warn(t('안전관련 신규 자격증 취득 점수를 선택해 주세요.'))
//   }

//   if(popupParams.SELF_EVAL_STATUS === 'C') {
//     return Message.warn(t('확정된 평가는 수정 할 수 없습니다.'))
//   }

//   if(isEmpty(popupParams.SITE_COMMENT)) {
//     return Message.warn(t('사업부 안전 comment를 진행하지 않았습니다. 의견 작성 바랍니다.'))
//   }

//   return true
// }

// //저장
// const saveData = () => {
//   let saveParams = []

//   saveParams.push({
//     CMPNY_DIV: popupParams.CMPNY_DIV,
//     COMP_CD: popupParams.COMP_CD,
//     BSNS_CD: popupParams.BSNS_CD,
//     ASGN_CD: popupParams.ASGN_CD,
//     DEPT_CD: popupParams.DEPT_CD,
//     EMP_NO: popupParams.EMP_NO,
//     TASK: popupParams.TASK,
//     IMPR_ACTV: popupParams.IMPR_ACTV,
//     LICENSE: popupParams.LICENSE,
//     TASK_FILE_ID: popupParams.TASK_FILE_ID,
//     IMPR_ACTV_FILE_ID: popupParams.IMPR_ACTV_FILE_ID,
//     LICENSE_FILE_ID: popupParams.LICENSE_FILE_ID,
//     SITE_COMMENT: popupParams.SITE_COMMENT, // 코멘트
//     REG_DATE: popupParams.REG_DATE,
//     USER_ID: userStore.userId, // 로그인 사용자 정보
//   })
//   console.log('saveParams = ', saveParams)

//   return commonExecuteApi({ queryId : 'SAFIC0030_SAVE_01', list: saveParams })
// }

const beforeFinish = () => {
  if (popupParams.SELF_EVAL_STATUS !== 'C') {
    return Message.warn(t('확정된 평가만 검토완료 할 수 있습니다.'))
  }

  if (isEmpty(popupParams.SITE_COMMENT)) {
    return Message.warn(
      t('사업부 안전 comment를 진행하지 않았습니다. 의견 작성 바랍니다.')
    )
  }

  return true
}

//담당자 검토완료
const finishData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV,
    COMP_CD: popupParams.COMP_CD,
    BSNS_CD: popupParams.BSNS_CD,
    ASGN_CD: popupParams.ASGN_CD,
    DEPT_CD: popupParams.DEPT_CD,
    EMP_NO: popupParams.EMP_NO,
    SELF_EVAL_STATUS: 'F',
    REG_DATE: popupParams.REG_DATE,
    SITE_COMMENT: popupParams.SITE_COMMENT, // 코멘트
    USER_ID: userStore.userId, // 로그인 사용자 정보
    TASK: popupParams.TASK,
    IMPR_ACTV : popupParams.IMPR_ACTV,
    LICENSE : popupParams.LICENSE,
  })

  console.log('confirmData = ', saveParams)

  return commonExecuteApi({ queryId: 'SAFIC0030_SAVE_02', list: saveParams })
}

// 검토완료 후 협력사 메일 자동 발송
const afterFinish = () => {
  let emailParams = []

  if (isEmpty(popupParams.EMAIL)) {
    return Message.warn(
      '메일 주소가 없습니다. 협력사 담당자에게 확인 바랍니다.'
    )
  }

  let emaillist = popupParams.EMAIL.split(',')

  for (let data of emaillist) {
    emailParams.push(data.trim())
  }

  let mailParam = {
    EMAIL: emailParams, //받는사람 이메일주소
    SUBJECT:
      '[협력사 안전관리자 역량평가] ' +
      popupParams.COMP_NM +
      ' ' +
      popupParams.EMP_NM +
      '님 검토완료 건', //메일제목
    CONTENT:
      popupParams.COMP_NM +
      ' ' +
      popupParams.EMP_NM +
      '님은 협력사 안전관리자 역량평가 자체평가 검토 완료가 되었음을 알려드립니다.', //메일내용
  }

  console.log('[afterFinish mailParam = ', mailParam)

  commonSendApi(mailParam).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  }) //메일전송

  onClose()
}

const beforeCancelConfirm = () => {
  if (popupParams.SELF_EVAL_STATUS !== 'C') {
    return Message.warn(t('확정된 평가만 취소 할 수 있습니다.'))
  }

  return true
}

//협력사 확정취소
const cancelConfirmData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV,
    COMP_CD: popupParams.COMP_CD,
    BSNS_CD: popupParams.BSNS_CD,
    ASGN_CD: popupParams.ASGN_CD,
    DEPT_CD: popupParams.DEPT_CD,
    EMP_NO: popupParams.EMP_NO,
    SELF_EVAL_STATUS: 'N',
    REG_DATE: popupParams.REG_DATE,
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  console.log('cancelConfirmData = ', saveParams)

  return commonExecuteApi({ queryId: 'SAFIC0030_SAVE_02', list: saveParams })
}

const beforeCancelFinish = () => {
  if (popupParams.SELF_EVAL_STATUS !== 'F') {
    return Message.warn(t('검토완료된 평가만 취소 할 수 있습니다.'))
  }

  return true
}

//검토완료 취소
const cancelFinishData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV,
    COMP_CD: popupParams.COMP_CD,
    BSNS_CD: popupParams.BSNS_CD,
    ASGN_CD: popupParams.ASGN_CD,
    DEPT_CD: popupParams.DEPT_CD,
    EMP_NO: popupParams.EMP_NO,
    SELF_EVAL_STATUS: 'C',
    REG_DATE: popupParams.REG_DATE,
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  return commonExecuteApi({ queryId: 'SAFIC0030_SAVE_02', list: saveParams })
}

// 안전관리자 업무일지 파일첨부
const addTaskFileClick = () => {
  fileUploadPopup_Task.value.openPopup(popupParams.TASK_FILE_ID)
}

//안전개선활동 파일첨부
const addActivityFileClick = () => {
  fileUploadPopup_Activity.value.openPopup(popupParams.IMPR_ACTV_FILE_ID)
}

// 안전관련 신규 자격증 취득 파일첨부
const addLicenseFileClick = () => {
  fileUploadPopup_License.value.openPopup(popupParams.LICENSE_FILE_ID)
}

// 파일 업로드 후 저장
const uploaded_Task = (param) => {
  console.log('upload after : ', param)
  console.log('param.fileId : ', param.fileId)

  if (param.fileId) {
    popupParams.TASK_FILE_ID = param.fileId
    checkFile(param.fileId, 'TASK')
  } else {
    popupParams.TASK_FILE_ID = ''
  }
}

// 파일 업로드 후 저장
const uploaded_Activity = (param) => {
  console.log('upload after : ', param)
  console.log('param.fileId : ', param.fileId)

  if (param.fileId) {
    popupParams.IMPR_ACTV_FILE_ID = param.fileId
    checkFile(param.fileId, 'ACTIVITY')
  } else {
    popupParams.IMPR_ACTV_FILE_ID = ''
  }
}

// 파일 업로드 후 저장
const uploaded_License = (param) => {
  console.log('upload after : ', param)
  console.log('param.fileId : ', param.fileId)

  if (param.fileId) {
    popupParams.LICENSE_FILE_ID = param.fileId
    checkFile(param.fileId, 'LICENSE')
  } else {
    popupParams.LICENSE_FILE_ID = ''
  }
}

// 파일 존재 확인
const checkFile = async (fileId, id) => {
  const fileParams = {
    CMPNY_DIV: popupParams.CMPNY_DIV,
    FILE_ID: fileId,
  }

  // 파일이 있는지 확인
  await commonSearchApi({
    queryId: 'SAFIB0030_SEARCH_03',
    param: fileParams,
  }).then((res) => {
    if (res.ORESULT_CUR[0].CNT_FILE > 0) {
      if (id === 'TASK') {
        fileTask.value = true
      } else if (id === 'ACTIVITY') {
        fileActivity.value = true
      } else if (id === 'LICENSE') {
        fileLicense.value = true
      }
    } else {
      if (id === 'TASK') {
        fileTask.value = false
      } else if (id === 'ACTIVITY') {
        fileActivity.value = false
      } else if (id === 'LICENSE') {
        fileLicense.value = false
      }
    }
  })
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="900"
    height="70%"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>업체안전관리자자체평가</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnVendorCancelConfirm',
            'btnFinishReview',
            'btnCancelFinish',
            'btnManual',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="d-flex mb-3">
            <i-input
              v-model="popupParams.YEAR"
              :label="$t('년도')"
              top-label
              label-width="70px"
              width="120px"
              readonly
            />
            <i-input
              v-model="popupParams.HALF_NM"
              :label="$t('반기')"
              top-label
              label-width="70px"
              width="120px"
              readonly
            />
          </v-sheet>
          <v-sheet class="d-flex mb-3">
            <i-input
              v-model="popupParams.COMP_NM"
              :label="$t('업체명')"
              top-label
              label-width="70px"
              width="200px"
              readonly
            />
            <i-input
              v-model="popupParams.EMP_NO"
              :label="$t('사번')"
              top-label
              label-width="70px"
              width="120px"
              readonly
            />
            <i-input
              v-model="popupParams.EMP_NM"
              :label="$t('이름')"
              top-label
              label-width="70px"
              width="120px"
              readonly
            />
          </v-sheet>
          <v-sheet class="d-flex mb-3">
            <i-select
              v-model="popupParams.TASK"
              :label="$t('➀ 안전관리자 업무일지')"
              label-width="180px"
              append-inner-icon="mdi-magnify"
              :items="dtScore1"
              item-title="TXT"
              item-value="COD"
              width="180px"
              top-label
              required
            />
            <!-- <i-input
              v-model="popupParams.TASK"
              :label="$t('➀ 안전관리자 업무일지')"
              top-label
              label-width="180px"
              width="120px"
              :items="dtScore1"
              readonly
            /> -->
            <v-btn
              v-model="popupParams.TASK_FILE_ID"
              class="mt-5"
              @click="addTaskFileClick"
            >
              첨부
            </v-btn>
            <div v-if="fileTask" class="complete-file ml-2">
              첨부된 파일이 있습니다.
            </div>
          </v-sheet>
          <v-sheet class="d-flex mb-3">
            <!-- <i-input
              v-model="popupParams.IMPR_ACTV"
              :label="$t('➁ 안전개선활동')"
              top-label
              label-width="180px"
              width="120px"
              readonly
            /> -->
            <i-select
              v-model="popupParams.IMPR_ACTV"
              :label="$t('➁ 안전개선활동')"
              label-width="180px"
              append-inner-icon="mdi-magnify"
              :items="dtScore2"
              item-title="TXT"
              item-value="COD"
              width="180px"
              top-label
              required
            />
            <v-btn
              v-model="popupParams.IMPR_ACTV_FILE_ID"
              class="mt-5"
              @click="addActivityFileClick"
            >
              첨부
            </v-btn>
            <div v-if="fileActivity" class="complete-file ml-2">
              첨부된 파일이 있습니다.
            </div>
          </v-sheet>
          <v-sheet class="d-flex mb-3">
            <!-- <i-input
              v-model="popupParams.LICENSE"
              :label="$t('➂ 안전관련 신규 자격증 취득')"
              top-label
              label-width="180px"
              width="120px"
              readonly
            /> -->
            <i-select
              v-model="popupParams.LICENSE"
              :label="$t('➂ 안전관련 신규 자격증 취득')"
              label-width="180px"
              append-inner-icon="mdi-magnify"
              :items="dtScore3"
              item-title="TXT"
              item-value="COD"
              width="180px"
              top-label
              required
            />
            <v-btn
              v-model="popupParams.LICENSE_FILE_ID"
              class="mt-5"
              @click="addLicenseFileClick"
            >
              첨부
            </v-btn>
            <div v-if="fileLicense" class="complete-file ml-2">
              첨부된 파일이 있습니다.
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <div class="formLabelText mt-3">④ 사업부 안전 comment</div>
            <div class="mt-2">
              <v-textarea v-model="popupParams.SITE_COMMENT" dense outlined />
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
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.complete-file {
  color: blue;
  display: flex;
  align-items: center;
}
</style>
