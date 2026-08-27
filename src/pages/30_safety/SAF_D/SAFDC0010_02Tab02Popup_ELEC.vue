<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import {
  commonExecuteApi,
  commonSearchApi,
  commonSendSMS,
  getCodeList,
} from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'



import { MenuItemType } from 'realgrid'
import OZReport from '@/components/OZReport.vue'

const imageUpload = ref(null)
const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const userLogStore = useLogsStore()
const dialog = ref(false)
const grdMain = ref(null)
const empPopup = ref(null)
const reportParam = reactive(['IN_CMPNY_DIV=', 'IN_MNG_NO='])
const reportName = ref('/manage/hse/SAFDC0010.ozr')
// OzReport 팝업 여부

const showOz = ref(false)
const emit = defineEmits(['closed'])
const images = ref([])
const images2 = ref([])
const model = ref(null)
const model2 = ref(null)
const fileUploadPopup = ref(null)
const menuTitle = ref(null)
const municipalField = reactive({
  CMPNY_DIV: '', //사업장구분
  MNG_NO: '', //관리번호
  BSNS_CD: '', //사업부코드
  REC_DEPT_CD: '', //수신부서코드
  NOTI_SCAN: '', //파일아이디
  NOTI_LPLC: '', //지적장소(대)
  NOTI_MPLC: '', //지적장소(중)
  NOTI_SPLC: '', //지적장소(소)
  SEND_ASGN_CD: '', //발신조직
  SEND_ASGN_NM: '', //발신
  SEND_DEPT_CD: '', //발신부서
  CHK_EMP_NM: '', //점검자
  CHK_EMP_NO: '', //점검자사번
  APPROVE_ID: '', //결제상신ID
  ACT_RSLT: '', //조치결과
  ACT_RSLT_SCAN: '', //조치결과 파일아이디
  ACT_DEPT_CD: '', //조치부서
  ACT_ASGN_CD: '', //조치자조직코드
  ACT_ASGN_NM: '', //조치자조지이름
  ACT_EMP_NM: '', //조치자성명
  ACT_EMP_NO: '', //조치자사번
  ACT_TEL_NO: '', //조치자연락처
  STATUS: '', //진행상태
  CLOSE_DT: '', //종결일자
  CLOSE_ASGN_CD: '', //종결자소속
  CLOSE_EMP_NO: '', //종결자사번
  SAGO_DIV_LIST: '', //사고유형
  CLOSE_DEPT_CD: '', //종결자부서
  CHK_TEL_NO: '', //전화
  NOTI_DT: '', //점검일자
  REC_ASGN_NM: '', //수신
  REC_ASGN_CD: '', //수식조직
  REQ_REPLY_DT: '', //회신요구일
  NOTI_TITLE: '', //제목
  LOCATION_NM: '', //장소
  NOTI_PLC_DESC: '', //장소상세
  SHIP_NO: '', //호선NO
  PROBLEM_DESC: '', //문제점
  REQUIRE_DESC: '', //시정요구(안)
  COMPANY: '', //위반자 사업장구분
  APP_EMP_NO: '', //결재승인자
  REJECT_DESC: '', //재요청사유
  INSERT_USER_ID: '', //작성자
  SHIP_NO:'', //호선
  SAGO_DIV_L_NM:'', //잠재사고유형
  SAGO_DIV_M_NM:'', //잠재사고유형(중)
  SAGO_DIV_S_NM:'', //잠재사고유형(소)
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnTemporaryStorage') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnActionComplete') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .setConfirmMessage(
        '안전/환경 시정통보서 정보를 조치완료 처리하시겠습니까?'
      )
      .run()
  } else if (btn.id === 'btnPrint') {
    print()
  } else {
    closePopup()
  }
}

//임시저장 관련 로직 시작
const beforeSave = () => {
  //조치결과
  if (!municipalField.ACT_RSLT) {
    Message.warn(t('조치결과는 필수입력입니다.'))
    return false
  } else if (!municipalField.ACT_EMP_NO) {
    Message.warn(t('조치자는 필수입력입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    MNG_NO: municipalField.MNG_NO, //관리번호
    ACT_DT: municipalField.REQ_REPLY_DT, //회신일
    ACT_RSLT: municipalField.ACT_RSLT, //조치결과
    ACT_RSLT_SCAN: municipalField.ACT_RSLT_SCAN, //조치결과 파일 아이디
    ACT_DEPT_CD: municipalField.ACT_DEPT_CD, //조치자 부서코드
    ACT_ASGN_CD: municipalField.ACT_ASGN_CD, //조치자 사업부코드
    ACT_EMP_NO: municipalField.ACT_EMP_NO, //조치자 사번
    ACT_TEL_NO: municipalField.ACT_TEL_NO, //조치자 연락처
    STATUS: municipalField.STATUS, //진행상태
    CLOSE_DT: '', //종결일자
    CLOSE_ASGN_CD: '', //종결자 사업부코드
    CLOSE_EMP_NO: '', //종결자 사번
    CLOSE_DEPT_CD: '', //종결자 부서코드
    REJECT_DESC: municipalField.REJECT_DESC, //재조치요청사유
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE07',
    list: saveParam,
  })
}

//조치완료 관련 로직 시작

const beforeSave02 = () => {
  if (!municipalField.ACT_RSLT) {
    Message.warn(t('조치결과는 필수입력입니다.'))
    return false
  } else if (!municipalField.ACT_EMP_NO) {
    Message.warn(t('조치자 필수입력입니다.'))
    return false
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    MNG_NO: municipalField.MNG_NO, //관리번호
    ACT_DT: municipalField.REQ_REPLY_DT, //회신일
    ACT_RSLT: municipalField.ACT_RSLT, //조치결과
    ACT_RSLT_SCAN: municipalField.ACT_RSLT_SCAN, //조치결과 파일 아이디
    ACT_DEPT_CD: municipalField.ACT_DEPT_CD, //조치자 부서코드
    ACT_ASGN_CD: municipalField.ACT_ASGN_CD, //조치자 사업부코드
    ACT_EMP_NO: municipalField.ACT_EMP_NO, //조치자 사번
    ACT_TEL_NO: municipalField.ACT_TEL_NO, //조치자 연락처
    STATUS: '40', //진행상태 -> 조치완료시 상태 40으로 변경
    CLOSE_DT: '', //종결일자
    CLOSE_ASGN_CD: '', //종결자 사업부코드
    CLOSE_EMP_NO: '', //종결자 사번
    CLOSE_DEPT_CD: '', //종결자 부서코드
    REJECT_DESC: municipalField.REJECT_DESC, //재조치요청사유
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE07',
    list: saveParam,
  })
}

const afterSave02 = () => {
  let msg = `시정통보 조치완료. 확인 후 종결처리바랍니다. [${municipalField.MNG_NO}]`
  let smsParam = {
    EMPNO_FROM: municipalField.CHK_EMP_NO, //보내는사람 사번
    EMPNO_TO: municipalField.CHK_EMP_NO, //받는사람 사번(점검자)
    SYSCODE: '156', //000고정
    FROM_P_NO: municipalField.ACT_TEL_NO, //보내는사람 폰번호(조치자)
    TO_P_NO: municipalField.CHK_TEL_NO, //받는사람 폰번호(점검자)
    TITLE: msg, //제목,내용
  }
  commonSendSMS(smsParam).then(() => {
    closePopup()
  })
}
//조치완료 관련 로직 끝

const afterSave = () => {
  closePopup()
  emit(['closed'])
  menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장 활성화
  menuTitle.value.disableBtn('btnActionComplete', false) //조치완료 활성화
}
//임시저장 관련 로직 끝

const openPopup = (rowData) => {
  console.log('받은데이터', rowData)
  dialog.value = true
  for (const [key, value] of Object.entries(rowData)) {
    if (municipalField.hasOwnProperty(key)) {
      municipalField[key] = value
    }
  }
  setButtonStatus()
  
  // municipalField.CMPNY_DIV = rowData.CMPNY_DIV
  // municipalField.MNG_NO = rowData.MNG_NO
  // municipalField.SEND_ASGN_NM = rowData.SEND_ASGN_NM
  // municipalField.SEND_ASGN_CD = rowData.SEND_ASGN_CD
  // municipalField.SEND_DEPT_CD = rowData.SEND_DEPT_CD
  // municipalField.CHK_EMP_NM = rowData.CHK_EMP_NM
  // municipalField.CHK_EMP_NO = rowData.CHK_EMP_NO
  // municipalField.CHK_TEL_NO = rowData.CHK_TEL_NO
  // municipalField.NOTI_DT = rowData.NOTI_DT
  // municipalField.REC_ASGN_NM = rowData.REC_ASGN_NM
  // municipalField.REC_ASGN_CD = rowData.REC_ASGN_CD
  // municipalField.NOTI_LPLC = rowData.NOTI_LPLC
  // municipalField.NOTI_MPLC = rowData.NOTI_MPLC
  // municipalField.NOTI_SPLC = rowData.NOTI_SPLC
  // municipalField.NOTI_TITLE = rowData.NOTI_TITLE
  // municipalField.STATUS = rowData.STATUS
  // municipalField.LOCATION_NM = rowData.LOCATION_NM
  // municipalField.NOTI_PLC_DESC = rowData.NOTI_PLC_DESC
  // municipalField.SHIP_NO = rowData.SHIP_NO
  // municipalField.PROBLEM_DESC = rowData.PROBLEM_DESC
  // municipalField.REQUIRE_DESC = rowData.REQUIRE_DESC
  // municipalField.REQ_REPLY_DT = rowData.REQ_REPLY_DT
  // municipalField.PROBLEM_DESC = rowData.PROBLEM_DESC
  // municipalField.ACT_RSLT_SCAN = rowData.ACT_RSLT_SCAN
  // municipalField.ACT_RSLT = rowData.ACT_RSLT
  // municipalField.ACT_ASGN_NM = rowData.ACT_ASGN_NM
  // municipalField.ACT_EMP_NO = rowData.ACT_EMP_NO
  // municipalField.ACT_EMP_NM = rowData.ACT_EMP_NM
  if (rowData.NOTI_SCAN) {
    getImages(rowData.NOTI_SCAN)
  }
  if (rowData.ACT_RSLT_SCAN) {
    getImages2(rowData.ACT_RSLT_SCAN)
  }
}

//상태값에 따른 버튼 활성화 여부
const setButtonStatus = () => {
  //조치대기 또는 재조치요청 상태일때
  if (municipalField.STATUS === '30' || municipalField.STATUS === '31') {
    menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장 활성화
    menuTitle.value.disableBtn('btnActionComplete', false) //조치완료 활성화
  }
  //조치완료 또는 종결 상태일때
  else if (municipalField.STATUS === '40' || municipalField.STATUS === '50') {
    menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장 비활성화
    menuTitle.value.disableBtn('btnActionComplete', true) //조치완료 비활성화
  }
}

//출력관련 로직 시작
const print = () => {
  reportParam[0] = 'IN_CMPNY_DIV='
  reportParam[1] = 'IN_MNG_NO='
  reportParam[0] += municipalField.CMPNY_DIV
  reportParam[1] += municipalField.MNG_NO
  showOz.value = true
}

const closePopup = () => {
  dialog.value = false
  for (let i in municipalField) {
    municipalField[i] = ''
  }
  images.value = []
  model.value = null
  images2.value = []
  model2.value = null
  emit('closed')
}

//문제점 파일 가져오는 함수
const getImages = async (FILE_ID) => {
  await commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: FILE_ID,
    },
  }).then((res) => {
    //첨부한 파일들을 케러셀형태로 보여준다.
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      commonDownloadFilesApi(res.ORESULT_CUR[i]).then((res) => {
        const blob = new Blob([res])
        const url = URL.createObjectURL(blob)
        images.value.push(url)
      })
    }
  })
}

//조치결과 파일아이디 존재시 실행
const getImages2 = async (FILE_ID) => {
  await commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: FILE_ID,
    },
  }).then((res) => {
    //첨부한 파일들을 케러셀형태로 보여준다.
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      commonDownloadFilesApi(res.ORESULT_CUR[i]).then((res) => {
        const blob = new Blob([res])
        const url = URL.createObjectURL(blob)
        images2.value.push(url)
      })
    }
  })
}

const uploadFile = () => {
  //NOTI_SCAN 같이 전달하여 첨부파일 팝업에 리스트 보이기 및 삭제 가능하게 변경
  // fileUploadPopup.value.openPopup(municipalField.NOTI_SCAN)
  fileUploadPopup.value.openPopup(municipalField.ACT_RSLT_SCAN)
}

const uploadedFile = async (val) => {
  //파일첨부 했을때 초기화진행 안하면 계속 늘어남
  images2.value = []
  municipalField.ACT_RSLT_SCAN = val.fileId
  await commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: municipalField.ACT_RSLT_SCAN,
    },
  }).then((res) => {
    //첨부한 파일들을 케러셀형태로 보여준다.
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      commonDownloadFilesApi(res.ORESULT_CUR[i]).then((res) => {
        const blob = new Blob([res])
        const url = URL.createObjectURL(blob)
        images2.value.push(url)
      })
    }
  })
}

//조치자 클릭 이벤트
const openEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NO: municipalField.ACT_EMP_NO,
  })
}

//조치자 선택 이벤트
const selectedEmpPopup = (val) => {
  municipalField.ACT_EMP_NM = val.EMP_NM //성명
  municipalField.ACT_EMP_NO = val.EMP_NO //사번
  municipalField.ACT_ASGN_NM = val.ASGN_NM //조직이름
  municipalField.ACT_ASGN_CD = val.ASGN_CD //조직코드
  municipalField.ACT_DEPT_CD = val.DEPT_CD //부서코드
  municipalField.ACT_TEL_NO = val.HND_PHN //연락처
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    height="1700"
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
      <span>시정통보서 조치결과 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnTemporaryStorage',
            'btnActionComplete',
            'btnPrint',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea mb-0">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('발신')"
                width="400px"
                top-label
                readonly
                v-model="municipalField.SEND_ASGN_NM"
              ></i-input>
              <i-input
                :label="$t('점검자')"
                width="200px"
                top-label
                readonly
                v-model="municipalField.CHK_EMP_NM"
              ></i-input>
              <i-input
                :label="$t('전화')"
                width="200px"
                top-label
                v-model="municipalField.CHK_TEL_NO"
              ></i-input>
              <i-input
                :label="$t('점검일자')"
                width="150px"
                top-label
                type="date"
                v-model="municipalField.NOTI_DT"
              ></i-input>
              <i-input
                :label="$t('회신요구일')"
                width="150px"
                top-label
                type="date"
                v-model="municipalField.REQ_REPLY_DT"
              ></i-input>
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('수신')"
                width="400px"
                top-label
                readonly
                v-model="municipalField.REC_ASGN_NM"
              ></i-input>

              <i-input
                :label="$t('제목')"
                width="600px"
                top-label
                v-model="municipalField.NOTI_TITLE"
              ></i-input>
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('장소')"
                top-label
                width="200px"
                readonly
                v-model="municipalField.LOCATION_NM"
              ></i-input>
              <i-input
                :label="$t('장소상세')"
                top-label
                width="300px"
                v-model="municipalField.NOTI_PLC_DESC"
              ></i-input>
              <i-input
                :label="$t('호선No.')"
                top-label
                width="200px"
                v-model="municipalField.SHIP_NO"
              ></i-input>
              <i-input
                :label="$t('잠재사고유형')"
                width="200px"
                top-label
                v-model="municipalField.SAGO_DIV_L_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSagoDivPopup"
                required
                readonly
              >
              </i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="municipalField.SAGO_DIV_M_NM"
                readonly
              ></i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="municipalField.SAGO_DIV_S_NM"
                readonly
              ></i-input>
            </div>
            <div class="d-flex">
              <i-textarea
                :label="$t('재조치 요청사유')"
                top-label
                width="100%"
                v-model="municipalField.REJECT_DESC"
                readonly
              ></i-textarea>
            </div>
          </v-sheet>
          <v-sheet height="100%" class="h-auto searchArea">
            <div class="h-grow">
              <v-sheet width="47%">
                <div class="image_border">
                  <v-slide-group
                    v-model="model"
                    class="pa-4"
                    style="height: 132px"
                    selected-class="bg-primary"
                    show-arrows
                  >
                    <v-slide-group-item
                      v-for="(image, index) in images"
                      :key="index"
                      :value="image"
                      v-slot="{ isSelected, toggle }"
                    >
                      <v-img
                        @click="toggle"
                        width="100"
                        height="100"
                        :src="image"
                      ></v-img>
                    </v-slide-group-item>
                  </v-slide-group>
                  <v-expand-transition>
                    <v-sheet height="200" width="100%">
                      <div
                        class="d-flex fill-height align-center justify-center"
                      >
                        <v-img :src="model" width="350" height="200"> </v-img>
                      </div>
                    </v-sheet>
                  </v-expand-transition>
                </div>

                <div class="h-grow mt-2">
                  <v-sheet width="50%">
                    <i-textarea
                      width="100%"
                      label="문제점"
                      top-label
                      v-model="municipalField.PROBLEM_DESC"
                    ></i-textarea>
                  </v-sheet>
                  <span class="mx-1"></span>
                  <v-sheet width="50%">
                    <i-textarea
                      width="100%"
                      label="시정요구(안)"
                      top-label
                      v-model="municipalField.REQUIRE_DESC"
                    ></i-textarea>
                  </v-sheet>
                </div>
              </v-sheet>
              <v-sheet width="47%">
                <div>
                  <v-slide-group
                    v-model="model2"
                    class="pa-4"
                    style="height: 132px"
                    selected-class="bg-primary"
                    show-arrows
                  >
                    <v-slide-group-item
                      v-for="(image, index) in images2"
                      :key="index"
                      :value="image"
                      v-slot="{ isSelected, toggle }"
                    >
                      <v-img
                        @click="toggle"
                        width="100"
                        height="100"
                        :src="image"
                      >
                      </v-img>
                    </v-slide-group-item>
                  </v-slide-group>
                  <v-expand-transition>
                    <v-sheet height="200" width="100%">
                      <div
                        class="d-flex fill-height align-center justify-center"
                      >
                        <v-img :src="model2" width="350" height="200"> </v-img>
                      </div>
                    </v-sheet>
                  </v-expand-transition>
                </div>

                <div class="h-grow">
                  <v-sheet width="45%">
                    <i-textarea
                      label="조치결과"
                      width="100%"
                      class="ml-2 mt-2"
                      v-model="municipalField.ACT_RSLT"
                      required
                    ></i-textarea>
                  </v-sheet>
                  <v-sheet width="55%" class="ml-3">
                    <span>조치자</span>
                    <div class="d-flex flex-wrap mt-3">
                      <i-input
                        width="160px"
                        :label="$t('소속')"
                        top-label
                        v-model="municipalField.ACT_ASGN_NM"
                        readonly
                      ></i-input>
                      <i-input
                        width="160px"
                        :label="$t('사번')"
                        top-label
                        v-model="municipalField.ACT_EMP_NO"
                        append-inner-icon="mdi-magnify"
                        @click:appendInner="openEmpPopup"
                        readonly
                        required
                      ></i-input>
                      <i-input
                        width="160px"
                        :label="$t('성명')"
                        top-label
                        v-model="municipalField.ACT_EMP_NM"
                        readonly
                      ></i-input>
                      <i-input
                        width="160px"
                        :label="$t('연락처')"
                        top-label
                        v-model="municipalField.ACT_TEL_NO"
                      ></i-input>
                    </div>
                  </v-sheet>
                </div>
              </v-sheet>
              <v-sheet width="6%">
                <v-btn @click="uploadFile">파일첨부</v-btn>
              </v-sheet>
            </div>
          </v-sheet>
          <OZReport
            :showPop="showOz"
            :reportName="reportName"
            :params="reportParam"
            @close="showOz = $event"
          />
        </div>
      </v-card-text>
    </v-card>
    <IUploadPopup
      ref="fileUploadPopup"
      :img-only="true"
      @uploaded="uploadedFile"
    ></IUploadPopup>
    <EmpPopup ref="empPopup" @selected="selectedEmpPopup"></EmpPopup>
  </v-dialog>
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

//테두리 class
.image_border {
  border: #f4f5f9 solid 2px;
}
</style>
