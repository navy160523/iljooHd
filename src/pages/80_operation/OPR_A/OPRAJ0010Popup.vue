<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import CKViewer from '@/components/ckEditor/CKViewer.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IUpload from '@/components/IUpload.vue'
import OPRAJ0010Popup02 from './OPRAJ0010Popup02.vue'
import _ from 'lodash'

let dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const Day = new Date()
const toDay =
  Day.getUTCFullYear() + '-' + (Day.getMonth() + 1) + '-' + Day.getDate()
const ckEditor = ref('null')
const fileUpload = ref(null)
const emit = defineEmits(['after-search'])
const fileUploadButton = ['btnDownLoad', 'btnDelete']
const menuPop = ref(null)
let fileVisible = ref(false)
let isCreate = null //openPopup호출시 true가 됨 -> 공지사항을 새로 등록할때
let isModified = null //openPopup2호출시 true가 됨 -> 기존에 등록된 공지사항을 수정할때

const props = defineProps({
  isReadonly: {
    Type: Boolean,
    default: false,
  },
  buttonList: {
    Type: Array,
    default: ['btnRegist', 'btnDelete', 'btnClose'],
  },
  fileUploadButton: {
    Type: Array,
    default: ['btnDownLoad', 'btnDelete'],
  },
  title: {
    Type: String,
    default: '공지사항 등록',
  },
  id: {
    Type: String,
    default: '',
  },
})

const openPopup = (flag) => {
  isCreate = flag // 공지사항을 새로 저장하는것인지 구분하는 구분자
  fileVisible.value = true //
  dialog.value = true
  for (let i in saveParam[0]) {
    saveParam[0][i] = ckEditor.value.setContent('')
  }
  saveParam[0].CMPNY_DIV = userStore.cmpnyDiv
  saveParam[0].KOR_NM = userStore.userName
  saveParam[0].NOTICE_PERIOD = 'A'
  saveParam[0].NOTICE_RANGE = 'I'
  saveParam[0].USER_ID = userStore.userId
  saveParam[0].INSERT_DATE = toDay
  checkFileId()
  setReadOnly()
}

const openPopup2 = (noticeInfo) => {
  dialog.value = true
  isModified = noticeInfo.isModified
  saveParam[0].CMPNY_DIV = noticeInfo.CMPNY_DIV
  saveParam[0].FILE_CNT = noticeInfo.FILE_CNT
  saveParam[0].INSERT_DATE = noticeInfo.INSERT_DATE
  saveParam[0].KOR_NM = noticeInfo.KOR_NM
  saveParam[0].NOTICE_CNT = noticeInfo.NOTICE_CNT
  saveParam[0].NOTICE_FILEID = noticeInfo.NOTICE_FILEID
  saveParam[0].NOTICE_NO = noticeInfo.NOTICE_NO
  saveParam[0].NOTICE_NOTE = ckEditor.value.setContent(noticeInfo.NOTICE_NOTE)

  saveParam[0].NOTICE_PERIOD = noticeInfo.NOTICE_PERIOD
  saveParam[0].NOTICE_POPUP = noticeInfo.NOTICE_POPUP
  saveParam[0].NOTICE_RANGE = noticeInfo.NOTICE_RANGE
  saveParam[0].NOTICE_REG_EMPNO = noticeInfo.NOTICE_REG_EMPNO
  saveParam[0].TAG = noticeInfo.NOTICE_TAG
  saveParam[0].NOTICE_TITLE = noticeInfo.NOTICE_TITLE
  saveParam[0].NOTICE_EXPOSURE = noticeInfo.NOTICE_EXPOSURE
  saveParam[0].NOTICE_MENUS = noticeInfo.NOTICE_MENUS
  saveParam[0].NOTICE_MENUS_NM = noticeInfo.NOTICE_MENUS_NM
  saveParam[0].USER_ID = userStore.userId
  if (noticeInfo.NOTICE_REG_EMPNO === userStore.userId) {
    fileVisible.value = true
  } else {
    fileUpload.value.diableFileUploadButton(['btnDelete'])
  }
  checkFileId()
  setReadOnly()
}

const checkFileId = () => {
  if (!saveParam[0].NOTICE_FILEID) {
    fileUpload.value.setGuid()
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    //fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(saveParam[0].NOTICE_FILEID)
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}

const dateList = reactive([
  { TXT: '영구', COD: 'A' },
  { TXT: '7일', COD: '7' },
  { TXT: '15일', COD: '15' },
  { TXT: '30일', COD: '30' },
  { TXT: '90일', COD: '90' },
])

const searchRange = reactive([
  { TXT: '사내/사외', COD: 'A' },
  { TXT: '사내', COD: 'I' },
  { TXT: '사외', COD: 'O' },
])

const saveParam = reactive([
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    FILE_CNT: '',
    INSERT_DATE: '',
    KOR_NM: '',
    NOTICE_CNT: '',
    NOTICE_FILEID: '',
    NOTICE_NO: '',
    NOTICE_NOTE: '',
    NOTICE_PERIOD: '',
    NOTICE_POPUP: '',
    NOTICE_RANGE: '',
    NOTICE_REG_EMPNO: '', //실제로 DB에 넘어가는 유저 코드
    NOTICE_TAG: '',
    NOTICE_TITLE: '',
    USER_ID: '',
    NOTICE_EXPOSURE: 'N',
    NOTICE_MENUS: '',
    NOTICE_MENUS_NM: '',
  },
])

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_PERIOD: '',
  NOTICE_RANGE: '',
  USER_ID: userStore.userId,
})

const deleteParam = reactive([
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_NO: '',
  },
])

defineExpose({
  openPopup,
  openPopup2,
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
  } else if (btn.id === 'btnRegist') {
    let content = ckEditor.value.getContent()
    // console.log(" content " , content)
    saveParam[0].NOTICE_NOTE = ckEditor.value.getContent() //ck에디터에 입력한 내용을 html태그로 변환해서 넣어줌
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(closePopup)
      .run()
  } else if (btn.id === 'btnDelete') {
    deleteParam[0].NOTICE_NO = saveParam[0].NOTICE_NO
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else {
    closePopup()
  }
}

const closePopup = () => {
  for (let i in saveParam[0]) {
    saveParam[0][i] = ''
  }
  fileUpload.value.clearGrid() //팝업 닫을때 파일첨부 그리드 초기화
  emit('after-search')
  menuTitle.value.disableBtn('btnRegist', false)
  menuTitle.value.disableBtn('btnDelete', false)
  dialog.value = false
  isCreate = null
  isModified = null
  fileVisible.value = false
}

const beforeDelete = () => {
  //등록화면에서 삭제시
  if (isCreate === true) {
    Message.warn('등록화면에서는 삭제 할 수 없습니다.')
    return false
  }

  //로그인 유저가 IT관리자,안전총괄관리자면 수정가능
  if (userStore.authGrpCd.includes('GRP00371') || userStore.authGrpCd.includes('GRP00369')) {
    return true
  }


  //기존 등록된 공지사항 삭제시
  if (isModified === true) {
    if (saveParam[0].NOTICE_REG_EMPNO != userStore.userId) {
      Message.warn('다른사람의 게시물은 삭제할 수 없습니다.')
      return false
    }
    return true
  }
}

const deleteData = () => {
  return commonRequest('/hse/operation/save01', {
    queryId: 'OPRAJ0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  closePopup()
}

const saveData = () => {
  saveParam[0].INSERT_DATE = saveParam[0].INSERT_DATE.replaceAll('-', '')
  return commonRequest('/hse/operation/save01', {
    queryId: 'OPRAJ0010_SAVE_01',
    list: saveParam,
  })
}

const beforeSave = () => {
  //신규 공지사항 등록시
  if (isCreate === true) {
    if (
      saveParam[0].NOTICE_TITLE === undefined ||
      saveParam[0].NOTICE_TITLE === ''
    ) {
      Message.warn('제목을 입력해주세요.')
      return false
    } else if (
      saveParam[0].NOTICE_NOTE === undefined ||
      saveParam[0].NOTICE_NOTE === ''
    ) {
      Message.warn('내용을 입력해주세요.')
      return false
    }
    return true
  }


  
  //로그인 유저가 IT관리자,안전총괄관리자면 수정가능
  if (userStore.authGrpCd.includes('GRP00371') || userStore.authGrpCd.includes('GRP00369')) {
    return true
  }


  
  //기존 공지사항 수정시
  if (isModified === true) {
    if (saveParam[0].NOTICE_REG_EMPNO != userStore.userId) {
      Message.warn('다른사람의 게시물은 수정할 수 없습니다.')
      return false
    }
    return true
  }
}

onMounted(() => {
  fileUpload.value.setGuid() //guid설정
})

//공지사항 권한체크
const setReadOnly = () => {
  let admin = userLogStore.isMenuAdmin
  let insertUser = saveParam[0].NOTICE_REG_EMPNO //공지사항 등록자
  let userId = userStore.userId
  if (admin === 'Y') {
    //관리자일때
    if (isCreate === true) {
      //관리자가 신규등록 하는 경우
      fileVisible.value = true //파일인풋 활성화
      menuTitle.value.disableBtn('btnDelete', true)
      return false
    }
    return false
  }
  if (isCreate === true) {
    //신규저장시
    fileVisible.value = true //파일인풋 활성화
    menuTitle.value.disableBtn('btnDelete', true)
    return false
  }
  if (isModified === true && insertUser !== userId) {
    //본인이 등록한 공지사항이 아닐때 등록,삭제버튼 비활성화
    menuTitle.value.disableBtn('btnRegist', true)
    menuTitle.value.disableBtn('btnDelete', true)
    return false
  }
}

const openPopupMenu = () => {
  menuPop.value.openPopup(saveParam[0])
}

const selectMenu = data => {
  let menus = ''
  let menusNm = ''

  for(let i = 0; i < data.length; i++) {
    if(i === 0) {
      menus = data[i].NOTICE_MENU
      menusNm = data[i].NOTICE_MENU_NM
    } else {
      menus = `${menus}, ${data[i].NOTICE_MENU}`
      menusNm = `${menusNm}, ${data[i].NOTICE_MENU_NM}`
    } 
  }

  saveParam[0].NOTICE_MENUS = menus
  saveParam[0].NOTICE_MENUS_NM = menusNm
}

const clearMenus = () => {
  saveParam[0].NOTICE_MENUS = ''
  saveParam[0].NOTICE_MENUS_NM = ''
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1000"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ props.title }}</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="props.buttonList"
          @click-button="onButtonsClick"
          class="pt-0"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                top-label
                :label="$t('제목')"
                v-model="saveParam[0].NOTICE_TITLE"
                width="420px"
                :readonly="props.isReadonly"
              />
              <v-checkbox
                class="mt-5 mr-3"
                label="팝업여부"
                v-model="saveParam[0].NOTICE_POPUP"
                :disabled="props.isReadonly"
              />
              <v-checkbox
                style="margin-right: 36px;"
                class="mt-5"
                label="메인 노출여부"
                v-model="saveParam[0].NOTICE_EXPOSURE"
                :disabled="props.isReadonly"
              />
              <i-input
                top-label
                :label="$t('노출 메뉴')"
                v-model="saveParam[0].NOTICE_MENUS_NM"
                width="260px"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopupMenu"
                @click:clearable="clearMenus"
                readonly
                clearable
                :disabled="props.isReadonly"
              />
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('작성자')"
                v-model="saveParam[0].KOR_NM"
                readonly
                top-label
                width="200px"
              />
              <i-input
                :label="$t('작성일')"
                v-model="saveParam[0].INSERT_DATE"
                readonly
                top-label
                width="200px"
              />
              <i-select
                :label="$t('게시기간')"
                v-model="saveParam[0].NOTICE_PERIOD"
                :items="dateList"
                item-title="TXT"
                item-value="COD"
                width="200px"
                top-label
                :readonly="props.isReadonly"
              />
              <i-select
                :label="$t('조회 범위')"
                v-model="saveParam[0].NOTICE_RANGE"
                :items="searchRange"
                item-title="TXT"
                item-value="COD"
                width="200px"
                top-label
                :readonly="props.isReadonly"
              />
            </div>
          </v-sheet>
          <v-sheet>
            <CKEditor
              ref="ckEditor"
              :id="props.id"
              class="mt-2"
              height="250px"
              :isReadOnly="props.isReadonly ? 'true' : 'false'"
              v-model="saveParam[0].NOTICE_NOTE"
            />
            <IUpload
              class="mt-3"
              :button-list="props.fileUploadButton"
              :is-visibled="fileVisible"
              :auto-upload="true"
              ref="fileUpload"
              style="height: 300px"
            ></IUpload>
          </v-sheet>
        </div>
      </v-card-text>

      <OPRAJ0010Popup02 ref="menuPop" @select="selectMenu" />
    </v-card>
  </v-dialog>
</template>
