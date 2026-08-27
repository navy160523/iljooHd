
<!-- 
  * Vue 내 용 : 안전지침서 등록/개정 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/14
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/14 
-->

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi, getCodeList } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import IUpload from "@/components/IUpload.vue"
import { toUpper } from "lodash-es"
import { isEmpty } from "@/@core/utils"
import _ from 'lodash'
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"

const props = defineProps({
  editorId :{
    type:String,
    default:'editor',
  },
})

const emit = defineEmits(["closed"])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const fileUpload = ref(null)
const fileUpload_Org = ref(null)
const fileUploadButton = reactive(["btnDownLoad", "btnDelete"])
const fileUpload_Org_Button = reactive(["btnDownLoad", "btnDelete"])
const ckEditor = ref(null)
const empPopup = ref(null)

const strFileID = ref('')
const strFileID_Org = ref('')
const menuId = ref('')

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

const statusParam = reactive(
  {
    CATEGORY4_READONLY: false,
  },
)

const popupParam = reactive(
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_DIV: "",
    NOTICE_NO: "",
    NOTICE_TITLE: "",
    NOTICE_NOTE: "",
    NOTICE_REG_EMPNO: "",
    NOTICE_REG_EMP_NM: "",
    NOTICE_REG_EMP_TEL: "",
    NOTICE_FILEID: "",
    NOTICE_FILEID_ORG: "",
    NOTICE_DOC_NO: "",
    GUBUN1: "",
    GUBUN2: "",
    CATEGORY1: "",
    CATEGORY1_ORI: "",
    CATEGORY2: "",
    CATEGORY3: dayjs().format("YYYY-MM-DD"),
    CATEGORY4: dayjs().format("YYYY-MM-DD"),
    DIV_CD: "",
    MODE: "NEW",
    USER_ID: userStore.userId,
  },
)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_DIV: "",  
  NOTICE_NO: "",
  CATEGORY1: "",
  DIV_CD: "",
})

//코드리스트
const codeList = reactive({
  GUBUN1 : [],
  GUBUN2 : [],
})

//초기 데이터셋팅
onMounted(() => {
})

const openPopup = (data, div, mode) => {
  console.log("openPopup02", div)

  menuId.value = div
  popupParam.MODE = mode


  console.log("[openPopup02] data: ", data)
  console.log("userId: ", userStore.userId)
  console.log("userName: ", userStore.userName)

  if(!isEmpty(data)) {
    popupParam.CMPNY_DIV = data.CMPNY_DIV    
    popupParam.NOTICE_DIV = data.NOTICE_DIV
    popupParam.NOTICE_NO = data.NOTICE_NO
    popupParam.NOTICE_TITLE = data.NOTICE_TITLE
    popupParam.NOTICE_REG_EMPNO = data.NOTICE_REG_EMPNO
    if(!isEmpty(data.KOR_NM)) {
      popupParam.NOTICE_REG_EMP_NM = data.KOR_NM
    }
    else if(!isEmpty(data.NOTICE_REG_EMP_NM)) {
      popupParam.NOTICE_REG_EMP_NM = data.NOTICE_REG_EMP_NM
    }

    if(!isEmpty(data.TEL_NO)) {
      popupParam.NOTICE_REG_EMP_TEL = data.TEL_NO
    }
    else if(!isEmpty(data.NOTICE_REG_EMP_TEL)) {
      popupParam.NOTICE_REG_EMP_TEL = data.NOTICE_REG_EMP_TEL
    }

    popupParam.CATEGORY1 = data.CATEGORY1
    popupParam.CATEGORY1_ORI = data.CATEGORY1_ORI
    popupParam.CATEGORY3 = dayjs(data.CATEGORY3).format('YYYY-MM-DD')
    popupParam.CATEGORY4 = dayjs(data.CATEGORY4).format('YYYY-MM-DD')
    popupParam.DIV_CD = data.DIV_CD
  }
  else {
    popupParam.NOTICE_REG_EMPNO = userStore.userId
    popupParam.NOTICE_REG_EMP_NM = userStore.userName
    popupParam.GUBUN1 = 'A'
    popupParam.GUBUN2 = 'A'
  }

  dialog.value = true

  initCombo()
  checkFileId()

  if(popupParam.MODE === 'EDT') {
    search()
  } else {
    popupParam.GUBUN1 = data.GUBUN1
    popupParam.GUBUN2 = data.GUBUN2
  }
}

const initCombo = () => {
  Promise.all([
    // cmpnyDiv가 일렉일 경우 데이터가 조회되지 않아서 HHI로 고정함 (2024.10.23 by kykim)
    getCodeList('HHI' + 'Z090BA'), //분류1 콤보
    getCodeList('HHI' + 'Z090BB'), //분류2 콤보
    // getCodeList(userStore.cmpnyDiv + 'Z090BA'), //분류1 콤보
    // getCodeList(userStore.cmpnyDiv + 'Z090BB'), //분류2 콤보
  ]).then(res => {
    codeList.GUBUN1 = res[0].ORESULT_CUR
    codeList.GUBUN2 = res[1].ORESULT_CUR
  })
}

const checkFileId = () => {
  if (isEmpty(strFileID.value)) {
    fileUpload.value.setGuid()
    strFileID.value = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(strFileID.value)
    strFileID.value = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }

  if (isEmpty(strFileID_Org.value)) {
    fileUpload_Org.value.setGuid()
    strFileID_Org.value = fileUpload_Org.value.guid
    fileUpload_Org.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload_Org.value.setGuid(strFileID_Org.value)
    strFileID_Org.value = fileUpload_Org.value.guid
    fileUpload_Org.value.onButtonsClick({ id: "btnSearch" })
  }
}

const search = () => {

  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.NOTICE_DIV = popupParam.NOTICE_DIV
  searchParams.NOTICE_NO = popupParam.NOTICE_NO
  searchParams.CATEGORY1 = popupParam.CATEGORY1
  searchParams.DIV_CD = popupParam.DIV_CD
  
  console.log('[search] searchParams : ', searchParams)

  Promise.all([
    commonRequest("/hse/data/DATBA0010_SEARCH_03", 
      { 
        queryId: "DATBA0010_SEARCH_03", 
        param: searchParams,
      }),
  ]).then(res => {
    console.log('조회 후 : ', res[0].ORESULT_CUR.length)

    // if (res[0].ORESULT_CUR.length === 0) {
    //   popupParam.CATEGORY1 = userStore.userName

    //   return false
    // }

    console.log('[afterSearch] res>>>>> : ', res[0].ORESULT_CUR)

    popupParam.CMPNY_DIV = res[0].ORESULT_CUR[0].CMPNY_DIV
    popupParam.NOTICE_DIV = res[0].ORESULT_CUR[0].NOTICE_DIV
    popupParam.NOTICE_NO = res[0].ORESULT_CUR[0].NOTICE_NO
    popupParam.NOTICE_TITLE = res[0].ORESULT_CUR[0].NOTICE_TITLE
    popupParam.NOTICE_NOTE = res[0].ORESULT_CUR[0].NOTICE_NOTE
    popupParam.NOTICE_REG_EMPNO = res[0].ORESULT_CUR[0].NOTICE_REG_EMPNO
    popupParam.NOTICE_REG_EMP_NM = res[0].ORESULT_CUR[0].KOR_NM
    popupParam.NOTICE_REG_EMP_TEL = res[0].ORESULT_CUR[0].TEL_NO
    popupParam.NOTICE_FILEID = res[0].ORESULT_CUR[0].NOTICE_FILEID
    popupParam.CATEGORY1 = res[0].ORESULT_CUR[0].CATEGORY1
    popupParam.CATEGORY2 = res[0].ORESULT_CUR[0].CATEGORY2
    popupParam.CATEGORY3 = dayjs(res[0].ORESULT_CUR[0].CATEGORY3).format('YYYY-MM-DD')
    popupParam.CATEGORY4 = dayjs(res[0].ORESULT_CUR[0].CATEGORY4).format('YYYY-MM-DD')

    popupParam.NOTICE_FILEID = res[0].ORESULT_CUR[0].NOTICE_FILEID
    popupParam.NOTICE_FILEID_ORG = res[0].ORESULT_CUR[0].NOTICE_FILEID_ORG

    strFileID.value = popupParam.NOTICE_FILEID
    strFileID_Org.value = popupParam.NOTICE_FILEID_ORG
    
    if(isEmpty(popupParam.NOTICE_NOTE)) {
      ckEditor.value.setContent("")
    }
    else {
      ckEditor.value.setContent(popupParam.NOTICE_NOTE)
    }

    let strTag = res[0].ORESULT_CUR[0].NOTICE_TAG

    if(strTag.indexOf('HHIZ090BA') === 0 && strTag.length === 11) {
      popupParam.GUBUN1 = strTag.substring(9, 10)
      popupParam.GUBUN2 = strTag.substring(10, 11)
    }

    if(isEmpty(popupParam.CATEGORY4)) {
      statusParam.CATEGORY4_READONLY = true
    }
    else {
      statusParam.CATEGORY4_READONLY = false
    }

    checkFileId()
  })
}

const onClose = () => {
  fileUpload.value.clearGrid()
  fileUpload_Org.value.clearGrid()

  popupParam.CMPNY_DIV = ''
  popupParam.NOTICE_DIV = ''
  popupParam.NOTICE_NO = ''
  popupParam.NOTICE_TITLE = ''
  popupParam.NOTICE_NOTE = ckEditor.value.setContent("")
  popupParam.NOTICE_REG_EMPNO = ''
  popupParam.NOTICE_REG_EMP_NM = ''
  popupParam.NOTICE_REG_EMP_TEL = ''
  popupParam.NOTICE_FILEID = ''
  popupParam.NOTICE_FILEID_ORG = ''
  popupParam.NOTICE_DOC_NO = ''
  popupParam.GUBUN1 = ''
  popupParam.GUBUN2 = ''
  popupParam.CATEGORY1 = ''
  popupParam.CATEGORY1_ORI = ''
  popupParam.CATEGORY2 = ''
  popupParam.CATEGORY3 = ''
  popupParam.CATEGORY4 = ''
  popupParam.DIV_CD = ''
  popupParam.MODE = ''
  popupParam.USER_ID = ''

  strFileID.value = ''
  strFileID_Org.value = ''
  menuId.value = ''

  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {

    new saveFlowHelper(vm, t)
      .setBefore(beforeCheck)
      .setQuery(saveData)
      .setAfter(result => { 
        console.log("[After save] result : ", result)

        let rcod = result.list[0].OUT_RES_COD
        let rNotice = result.list[0].OUT_NOTICE_NO

        if (rcod === '0' && popupParam.MODE === 'NEW') {
          popupParam.NOTICE_NO = rNotice
        }

        emit("closed")
        onClose()
      })
      .run()     
  }
  else if (btn.id === 'btnClose')
  {
    onClose()
  }
}

const beforeCheck = () => {
  if(isEmpty(popupParam.GUBUN1)) {
    return Message.warn(t('적용사업부 입력해 바랍니다.'))
  }
  if(isEmpty(popupParam.GUBUN2)) {
    return Message.warn(t('작업구분 입력해 바랍니다.'))
  }
  if(isEmpty(popupParam.NOTICE_TITLE)) {
    return Message.warn(t('지침서명 입력해 바랍니다.'))
  }
  if(isEmpty(popupParam.CATEGORY1)) {
    return Message.warn(t('개정No 입력해 바랍니다.'))
  }
  if(isEmpty(popupParam.CATEGORY2)) {
    return Message.warn(t('제개정사유 입력해 바랍니다.'))
  }
  if(isEmpty(popupParam.CATEGORY3)) {
    return Message.warn(t('제정일 입력해 바랍니다.'))
  }
  if(isEmpty(popupParam.CATEGORY4)) {
    return Message.warn(t('최근개정일 입력해 바랍니다.'))
  }
  if(isEmpty(popupParam.NOTICE_REG_EMP_NM)) {
    return Message.warn(t('담당자 입력해 바랍니다.'))
  }
  if(isEmpty(ckEditor.value.getContent())) {
    return Message.warn(t('내용 입력해 바랍니다.'))
  }

  return true
}

// 저장
const saveData = () => {
  let saveParams = []

  saveParams.push(
    {
      CMPNY_DIV : userStore.cmpnyDiv,
      NOTICE_DIV : menuId.value,
      NOTICE_NO : popupParam.NOTICE_NO,
      NOTICE_TITLE : popupParam.NOTICE_TITLE,
      NOTICE_NOTE : ckEditor.value.getContent(),
      NOTICE_REG_EMPNO : popupParam.NOTICE_REG_EMPNO,
      NOTICE_FILEID : strFileID.value,
      NOTICE_FILEID_ORG : strFileID_Org.value,
      NOTICE_DOC_NO : popupParam.NOTICE_DOC_NO,
      GUBUN1 : popupParam.GUBUN1,
      GUBUN2 : popupParam.GUBUN2,
      CATEGORY1 : popupParam.CATEGORY1,
      CATEGORY1_ORI : popupParam.CATEGORY1_ORI,
      CATEGORY2 : popupParam.CATEGORY2,
      CATEGORY3 : dayjs(popupParam.CATEGORY3).format('YYYYMMDD'),
      CATEGORY4 : dayjs(popupParam.CATEGORY4).format('YYYYMMDD'),
      USER_ID : userStore.userId,

      RES_COD : '',               // return 값
      RES_MSG : '',               // return 값
      RES_COL : '',               // return 값
    },
  )
  console.log('[saveData] 데이터 저장 >>>> ', saveParams)

  let sQueryID = ''

  if(popupParam.MODE === 'NEW') {
    sQueryID = 'DATBA0010_SAVE_08'
  } 
  else if(popupParam.MODE === 'REV') {
    sQueryID = 'DATBA0010_SAVE_09'
  }
  else if(popupParam.MODE === 'EDT') {
    if(popupParam.DIV_CD === 'H') {
      sQueryID = 'DATBA0010_SAVE_11'
    }
    else {
      sQueryID = 'DATBA0010_SAVE_10'
    }
  }

  console.log('[saveData] 데이터 쿼리 >>>> ', sQueryID)

  return commonExecuteApi({ queryId : sQueryID, list: saveParams })
}

const deptValidation = () => {
  popupParam.NOTICE_REG_EMP_NM = popupParam.NOTICE_REG_EMP_NM.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "")
}

// 인원 조회 팝업 오픈
const openEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: popupParam.NOTICE_REG_EMP_NM,
  })
}

// 인원 조회 팝업 선택 이벤트
const onEmpSelected = val => {
  console.log('[onEmpSelected] val : ', val)

  popupParam.NOTICE_REG_EMP_NM = val.EMP_NM
  popupParam.NOTICE_REG_EMPNO = val.EMP_NO
  popupParam.NOTICE_REG_EMP_TEL = val.TEL_NO

}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
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
      <span>안전지침서 등록/개정 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                v-model="popupParam.GUBUN1" 
                :label="$t('적용사업부')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.GUBUN1"
                item-value="COD"
                item-title="TXT"
                width="150px"
                required
              />
              <i-select
                v-model="popupParam.GUBUN2" 
                :label="$t('작업구분')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.GUBUN2"
                item-value="COD"
                item-title="TXT"
                width="150px"
                required
              />
              <!--<i-input
                v-model="popupParam.NOTICE_DOC_NO"
                :label="$t('문서번호')"
                top-label
                width="150px"
                label-width="80px"                
              /> 2025.04.04 윤찬양책임 요청으로 숨김-->
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="popupParam.NOTICE_TITLE"
                :label="$t('지침서명')"
                top-label
                label-width="80px"
                width="840px"
                required
              /> 
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="popupParam.CATEGORY1"
                :label="$t('개정No.')"
                top-label
                width="150px"
                label-width="80px"
                required
              />
              <i-input
                v-model="popupParam.CATEGORY2"
                :label="$t('제개정사유')"
                top-label
                label-width="80px"
                width="670px"
                required
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="popupParam.CATEGORY3"
                :label="$t('제정일')"
                top-label
                label-width="80px"
                type="date"
                width="150px"
                required
              />
              <i-input
                v-model="popupParam.CATEGORY4"
                :label="$t('최근개정일')"
                top-label
                label-width="80px"
                type="date"
                width="150px"
                required
                :readonly="statusParam.CATEGORY4_READONLY"
              />
              <i-input
                v-model="popupParam.NOTICE_REG_EMP_NM"
                width="150px"
                :label="$t('담당자')"
                top-label
                append-inner-icon="mdi-magnify"
                :rules="[deptValidation]"
                required
                @click:append-inner="openEmpPopup"
                @keydown.enter="() => openEmpPopup('인원조회')"
              />
              <i-input
                v-model="popupParam.NOTICE_REG_EMP_TEL"
                :label="$t('Tel.')"
                top-label
                label-width="80px"
                width="150px"
                readonly
              />
            </div>
          </v-sheet>
          <v-sheet 
            height="50%" 
            class="mb-2"
          > 
            <CKEditor
              :id="props.editorId"
              ref="ckEditor" 
              v-model="popupParam.NOTICE_NOTE"
              class="mt-2 "
            />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              grid-title="파일첨부(PDF)"
              :max-file-size="300"
              :button-list="fileUploadButton"
              auto-upload
              style="height: 370px"
            />
          </v-sheet> 
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload_Org"
              grid-title="파일첨부(원본)"
              :max-file-size="300"
              :button-list="fileUpload_Org_Button"
              auto-upload
              style="height: 370px"
            />
          </v-sheet> 
        </div>
        <!-- 인원조회팝업 -->
        <EmpPopup 
          ref="empPopup" 
          @selected="onEmpSelected" 
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
