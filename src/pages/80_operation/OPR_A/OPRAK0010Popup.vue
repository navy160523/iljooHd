<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import CKViewer from '@/components/ckEditor/CKViewer.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { before } from 'lodash-es'
import IUpload from '@/components/IUpload.vue'

let dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const Day = new Date()
const toDay = Day.getMonth() + 1 + '-' + Day.getDate()
const ckEditor = ref('null')
const toolbar = ['']
const isReadOnly = ref('')
const emit = defineEmits(['after-search'])
const fileUpload = ref(null)
const fileVisible = ref(false)
const useLogStore = useLogsStore()
let isCreate = null //openPopup호출시 true가 됨 -> FAQ를 새로등록할때
let isModified = null //openPopup2호출시 true가 됨 -> 기존에 등록된 FAQ를 수정할때

const searchGubun = [
  { TXT: '전체', COD: '' },
  { TXT: 'HSE 경영시스템', COD: 'MN04362' },
  { TXT: '위험성평가', COD: 'MN04238' },
  { TXT: '안전', COD: 'MN04236' },
  { TXT: '안전리스크', COD: 'MN04677' },
  { TXT: '안전지원', COD: 'MN04237' },
  { TXT: '교육/문화/포상', COD: 'MN04239' },
  { TXT: '보건', COD: 'MN04962' },
  { TXT: '환경', COD: 'MN04963' },
  { TXT: '모니터링', COD: 'MN04964' },
  { TXT: '운영관리', COD: 'MN04930' },
  { TXT: '시스템관리', COD: 'HIWAYMN00061' },
]
//신규등록시
const openPopup = (flag) => {
  dialog.value = true
  popupField.NOTICE_PERIOD = 'A'
  popupField.NOTICE_RANGE = 'I'
  popupField.KOR_NM = userStore.userName
  saveFileId()
  isCreate = flag
  //삭제버튼 비활성화
  menuTitle.value.disableBtn('btnDelete', true)
}
//기존등록된 게시물 오픈시
const openPopup2 = (res) => {
  isModified = res.isModified
  popupField.CATEGORY1 = res.CATEGORY1
  popupField.CMPNY_DIV = res.CMPNY_DIV
  popupField.FILE_CNT = res.FILE_CNT
  popupField.HND_PHN = res.HND_PHN
  popupField.INSERT_DATE = res.INSERT_DATE
  popupField.KOR_NM = res.KOR_NM
  popupField.NOTICE_CNT = res.NOTICE_CNT
  popupField.NOTICE_DIV = res.NOTICE_DIV
  popupField.NOTICE_FILEID = res.NOTICE_FILEID
  popupField.NOTICE_NO = res.NOTICE_NO
  popupField.NOTICE_NOTE = ckEditor.value.setContent(res.NOTICE_NOTE)
  popupField.NOTICE_PERIOD = res.NOTICE_PERIOD
  popupField.NOTICE_RANGE = res.NOTICE_RANGE
  popupField.NOTICE_REG_EMPNO = res.NOTICE_REG_EMPNO
  popupField.NOTICE_TAG = res.NOTICE_TAG
  popupField.NOTICE_TITLE = res.NOTICE_TITLE

  dialog.value = true
  checkAdmin(res.NOTICE_REG_EMPNO)
  if (!popupField.NOTICE_FILEID) {
    saveFileId()
  } else {
    fileUpload.value.setGuid(popupField.NOTICE_FILEID)
    popupField.NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}
//파일아이디 업데이트 로직
const saveFileId = () => {
  fileUpload.value.setGuid()
  let fileId = fileUpload.value.guid
  popupField.NOTICE_FILEID = fileId //신규등록시 파일첨부 같이되도록하려고 넣음
  let saveFileIdParam = []

  let saveFileIdData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_DIV: popupField.NOTICE_DIV,
    NOTICE_NO: popupField.NOTICE_NO,
    NOTICE_FILEID: fileId,
  }

  saveFileIdParam.push(saveFileIdData)
  commonRequest('/hse/operation/FAQ_SAVE_01', {
    queryId: 'OPRAK0010_SAVE_04',
    list: saveFileIdParam,
  })
    .then((res) => {})
    .finally(() => {
      //fileUpload.value.onButtonsClick({ id: "btnSearch" })
    })
}

const closePopup = () => {
  //팝업창 닫을때 팝업 내부 모든 데이터 없애기
  isCreate = null //수정,삭제여부 플래그값 false로 만들기 팝업 다시 열때는 true값으로 변경
  isModified = null
  dialog.value = false
  fileUpload.value.clearGrid()
  fileVisible.value = false
  emit('after-search')
  for (let i in popupField) {
    popupField[i] = ckEditor.value.setContent('')
  }
  //버튼 활성화
  menuTitle.value.disableBtn('btnDelete', false)
  menuTitle.value.disableBtn('btnUpdate', false)
  fileUpload.value.enableFileUploadButton(['btnFileUpload', 'btnDelete'])
}

defineExpose({
  openPopup,
  openPopup2,
})

const popupField = reactive({
  CATEGORY1: '', //분류
  CMPNY_DIV: '', //사업장
  NOTICE_DIV: '', //게시물코드
  NOTICE_NO: '', //게시물번호
  NOTICE_TITLE: '', //게시물제목
  NOTICE_RANGE: '', //조회범위
  NOTICE_REG_EMPNO: '', //게시물등록한 사람 유저 아이디
  KOR_NM: '', //한국이름
  HND_PHN: '', //게시물 등록한사람 폰번호
  FILE_CNT: '', //파일첨부수
  NOTICE_TAG: '',
  NOTICE_NOTE: '', //게시물 내용
  NOTICE_CNT: '',
  NOTICE_PERIOD: '',
  NOTICE_FILEID: '', //
  CATEGORY1: '', //분류
  INSERT_DATE: '', //게시물저장시간
  ANSWER_NO: '',
  ANSWER_NOTE: '', //답변내용
  INSERT_DATE1: '', //답변일
  ANSWER_EMPNM: '', //답변자
  ANSWER_ID: '', //답변 등록한 사람 ID
  ANSWER_REG_EMPNO: '', //답변 등록한 사람 사원번호
})

const codeList = reactive({
  dateList: [
    { TXT: '영구', COD: 'A' },
    { TXT: '7일', COD: '7' },
    { TXT: '15일', COD: '15' },
    { TXT: '30일', COD: '30' },
    { TXT: '90일', COD: '90' },
  ],
  searchGubun: [],
  period: [
    { TXT: '사내/사외', COD: 'A' },
    { TXT: '사내', COD: 'I' },
    { TXT: '사외', COD: 'O' },
  ],
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(closePopup)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(closePopup)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const beforeSave = () => {
  if (isModified === true) {
    if (userStore.userId != popupField.NOTICE_REG_EMPNO) {
      Message.warn(t('다른 이용자의 게시물은 수정할 수 없습니다.'))
      return false
    }
  }
  if (popupField.NOTICE_TITLE === '' || popupField.NOTICE_TITLE === undefined) {
    Message.warn(t('제목을 입력해주세요.'))
    return false
  } else if (popupField.NOTICE_PERIOD === '') {
    Message.warn(t('게시기간을 입력해주세요.'))
    return false
  } else if (popupField.NOTICE_RANGE === '') {
    Message.warn(t('조회 범위를 입력해주세요.'))
    return false
  } else if (
    popupField.NOTICE_TITLE === '' ||
    popupField.NOTICE_TITLE === undefined
  ) {
    Message.warn(t('제목을 입력해주세요.'))
    return false
  } else if (ckEditor.value.getContent(popupField.NOTICE_NOTE) === '') {
    Message.warn(t('내용을 입력해주세요.'))
    return false
  } else {
    return true
  }
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_DIV: 'MNZE11002',
    NOTICE_NO: popupField.NOTICE_NO,
    CATEGORY1: popupField.CATEGORY1,
    NOTICE_TITLE: popupField.NOTICE_TITLE,
    NOTICE_PERIOD: popupField.NOTICE_PERIOD,
    NOTICE_RANGE: popupField.NOTICE_RANGE,
    NOTICE_NOTE: ckEditor.value.getContent(popupField.NOTICE_NOTE),
    NOTICE_FILEID: popupField.NOTICE_FILEID,
    RES_NOTICE_NO: '',
    RES_NOTICE_REG_EMPNM: '',
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonRequest('/hse/operation/FAQ_SAVE_01', {
    queryId: 'OPRAK0010_SAVE_01',
    list: saveParam,
  })
}

//삭제로직시작
const beforeDelete = () => {
  if (isCreate === true) {
    Message.warn(t('등록 화면에서는 삭제할 수 없습니다.'))
    return false
  } else if (userStore.userId !== popupField.NOTICE_REG_EMPNO) {
    if (isModified === true) {
      Message.warn(t('다른이용자의 게시물은 삭제할 수 없습니다.'))
      return false
    }
  } else {
    return true
  }
}

const deleteData = () => {
  let deleteParam = []
  let deleteData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_DIV: 'MNZE11002',
    NOTICE_NO: popupField.NOTICE_NO,
  }
  deleteParam.push(deleteData)
  return commonRequest('/hse/operation/FAQ_SAVE_01', {
    queryId: 'OPRAK0010_DELETE_01',
    list: deleteParam,
  })
}

//삭제로직끝

onMounted(() => {
  commonSearchApi({
    queryId: 'OPRAK0010_SEARCH_01',
    param: { CMPNY_DIV: userStore.cmpnyDiv },
  }).then((res) => {
    codeList.searchGubun = res.ORESULT_CUR
  })
})

//권한체크
const checkAdmin = (userId) => {
  //본인이 등록한 게시물이 아닐때
  if (userStore.userId != userId) {
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnDelete', true)
    fileUpload.value.diableFileUploadButton(['btnFileUpload', 'btnDelete'])
  } else if (userId.userId == userId || useLogStore.isMenuAdmin) {
    //본인이 등록한 게시물이거나 관리자면
    fileVisible.value = true
  }
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1100"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>FAQ 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                :label="$t('분류')"
                :items="searchGubun"
                v-model="popupField.CATEGORY1"
                item-title="TXT"
                item-value="COD"
                width="200px"
                top-label
              >
              </i-select>
              <i-input
                :label="$t('제목')"
                top-label
                v-model="popupField.NOTICE_TITLE"
              >
              </i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                top-label
                :label="$t('작성자')"
                v-model="popupField.KOR_NM"
                readonly="true"
                width="200px"
              ></i-input>
              <i-input
                top-label
                :label="$t('작성일')"
                v-model="popupField.INSERT_DATE"
                readonly="true"
                width="200px"
              >
              </i-input>
              <i-select
                top-label
                :label="$t('게시기간')"
                v-model="popupField.NOTICE_PERIOD"
                :items="codeList.dateList"
                item-title="TXT"
                item-value="COD"
                width="200px"
              >
              </i-select>
              <i-select
                top-label
                :label="$t('조회 범위')"
                v-model="popupField.NOTICE_RANGE"
                :items="codeList.period"
                item-title="TXT"
                item-value="COD"
                width="200px"
              >
              </i-select>
            </div>
          </v-sheet>
          <v-sheet>
            <CKEditor
              v-model="popupField.NOTICE_NOTE"
              ref="ckEditor"
              class="mt-2"
              height="300px"
              :toolbar="toolbar"
            ></CKEditor>
            <IUpload
              :is-visibled="fileVisible"
              class="mt-2"
              ref="fileUpload"
              style="height: 400px"
            ></IUpload>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
