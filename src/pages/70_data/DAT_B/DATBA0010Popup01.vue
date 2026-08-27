
<!-- 
  * Vue 내 용 : 안전지침서관리 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/14
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/14 
-->

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonExecuteApi, commonRequest, getCodeList } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import { toUpper } from "lodash-es"
import { isEmpty } from "@/@core/utils"
import _ from 'lodash'
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import DATBA0010Popup02 from "./DATBA0010Popup02.vue"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import IUpload from "@/components/IUpload.vue"

const emit = defineEmits(["closed"])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const grdMain = ref(null)
const grdMain2 = ref(null)
const dATBA0010Popup02 = ref(null)
const fileVisible = ref(false)
const fileUpload = ref(null)
const fileUploadPopup = ref(null)

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
    NOTICE_RANGE: "",
    NOTICE_PERIOD: "",
    NOTICE_FILEID: "",
    GUBUN1: "",
    GUBUN2: "",
    CATEGORY1: "",
    CATEGORY1_ORI:"",
    CATEGORY2: "",
    CATEGORY3: dayjs().format("YYYY-MM-DD"),
    CATEGORY4: "",
    DIV_CD: "C",
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

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['CMPNY_DIV','NOTICE_DIV','NOTICE_NO'],
  fields : [ 
    { fieldName: 'CATEGORY1', dataType: 'text', width: '50', header: { text: t('개정No.') } },
    { fieldName: 'CATEGORY3', dataType: 'text', width: '90', header: { text: t('제개정일') } },
    { fieldName: 'CATEGORY2', dataType: 'text', width: '300', header: { text: t('제개정 사유') } },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '90', header: { text: t('등록일') } },
    { fieldName: 'FILE_OPEN', dataType: 'text', width: '60', editable: false, header: { text: t('열람') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/detailSearch.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      },
    },
    { fieldName: 'FILE_NAME', dataType: 'text', width: '200', type: 'data', header: { text: t('파일명') } },
    { fieldName: 'NOTICE_REG_EMPNM', dataType: 'text', width: '90', header: { text: t('담당자') } },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'FILE_NO', dataType: 'text' , visible: false },
    { fieldName: 'LOCAL_PATH', dataType: 'text' , visible: false },
    { fieldName: 'DIV_CD', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드2 속성셋팅
const grdMain2Props = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['CMPNY_DIV','NOTICE_DIV','NOTICE_NO'],
  fields : [ 
    { fieldName: 'CATEGORY1', dataType: 'text', width: '50', header: { text: t('개정No.') } },
    { fieldName: 'CATEGORY3', dataType: 'text', width: '90', header: { text: t('제개정일') } },
    { fieldName: 'CATEGORY2', dataType: 'text', width: '300', header: { text: t('제개정 사유') } },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '90', header: { text: t('등록일') } },
    { fieldName: 'FILE_OPEN', dataType: 'text', width: '60', editable: false, header: { text: t('열람') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/detailSearch.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      },
    },
    { fieldName: 'FILE_NAME', dataType: 'text', width: '200', type: 'data', header: { text: t('파일명') } },
    { fieldName: 'NOTICE_REG_EMPNM', dataType: 'text', width: '90', header: { text: t('담당자') } },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'FILE_NO', dataType: 'text' , visible: false },
    { fieldName: 'LOCAL_PATH', dataType: 'text' , visible: false },
    { fieldName: 'DIV_CD', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMain2Props.columns = grdMain2Props.fields

const openPopup = (data, isAdmin) => {

  console.log('>>>> ', data)

  if(!isEmpty(data)) {
    if(isAdmin === 'Y' || data.INSERT_USER_ID === userStore.userId || data.UPDATE_USER_ID === userStore.userId) {
      menuTitle.value.setBtnProperty('btnChange', 'visible', true)
      menuTitle.value.setBtnProperty('btnReviseRegist', 'visible', true)
      menuTitle.value.setBtnProperty('btnDelete', 'visible', true)
      fileVisible.value = true
      fileUpload.value.enableFileUploadButton(['btnDelete'])
    } 
    else {
      menuTitle.value.setBtnProperty('btnChange', 'visible', false)
      menuTitle.value.setBtnProperty('btnReviseRegist', 'visible', false)
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false)
      fileVisible.value = false
      fileUpload.value.diableFileUploadButton(['btnDelete'])
    }

    popupParam.CMPNY_DIV = data.CMPNY_DIV
    popupParam.NOTICE_DIV = data.NOTICE_DIV
    popupParam.NOTICE_NO = data.NOTICE_NO
    popupParam.NOTICE_TITLE = data.NOTICE_TITLE
    popupParam.NOTICE_REG_EMPNO = data.NOTICE_REG_EMPNO
    popupParam.NOTICE_REG_EMP_NM = data.KOR_NM
    popupParam.NOTICE_FILEID = data.NOTICE_FILEID
    popupParam.CATEGORY1 = data.CATEGORY1
    popupParam.CATEGORY1_ORI = data.CATEGORY1_ORI
    popupParam.CATEGORY3 = dayjs(data.CATEGORY3).format('YYYY-MM-DD')
    popupParam.DIV_CD = 'C'
  }
  
  dialog.value = true

  checkFileId()
  initCombo()
}

const initCombo = () => {
  Promise.all([
    
    // getCodeList(userStore.cmpnyDiv + 'Z090BA'), //분류1 콤보
    // getCodeList(userStore.cmpnyDiv + 'Z090BB'), //분류2 콤보
    // cmpnyDiv가 일렉일 경우 데이터가 조회되지 않아서 HHI로 고정함 (2024.10.23 by kykim)
    getCodeList('HHI' + 'Z090BA'), //분류1 콤보
    getCodeList('HHI' + 'Z090BB'), //분류2 콤보
  ]).then(res => {
    codeList.GUBUN1 = res[0].ORESULT_CUR
    codeList.GUBUN2 = res[1].ORESULT_CUR

    onButtonsClick({ id: "btnSearch" })
  })
}

const onClose = () => {

  grdMain.value.getDataProvider().setRows(null)
  grdMain2.value.getDataProvider().setRows(null)

  popupParam.CMPNY_DIV = ''
  popupParam.NOTICE_DIV = ''
  popupParam.NOTICE_NO = ''
  popupParam.NOTICE_TITLE = ''
  popupParam.NOTICE_NOTE = ckEditor.value.setContent("")
  popupParam.NOTICE_REG_EMPNO = ''
  popupParam.NOTICE_REG_EMP_NM = ''
  popupParam.NOTICE_REG_EMP_TEL = ''
  popupParam.NOTICE_RANGE = ''
  popupParam.NOTICE_PERIOD = ''
  popupParam.NOTICE_FILEID = ''
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

  fileUpload.value.clearGrid()

  menuTitle.value.setBtnProperty('btnChange', 'visible', false)
  menuTitle.value.setBtnProperty('btnReviseRegist', 'visible', false)
  menuTitle.value.setBtnProperty('btnDelete', 'visible', false)
  fileVisible.value = false
  fileUpload.value.diableFileUploadButton(['btnDelete'])

  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    search()
  }
  else if (btn.id === 'btnChange')  // 변경 버튼 클릭
  {
    dATBA0010Popup02.value.openPopup(popupParam, popupParam.NOTICE_DIV,  'EDT')
  }
  else if (btn.id === 'btnReviseRegist')  // 개정 등록 버튼 클릭
  {
    dATBA0010Popup02.value.openPopup(popupParam, popupParam.NOTICE_DIV,  'REV')
  }
  else if (btn.id === 'btnDelete')
  {
    new deleteFlowHelper(vm, t) 
      .setBefore(beforeDelete)  
      .setQuery(deleteData)
      .setAfter(() => {
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

/* ************ 삭제 *************** */
const beforeDelete = () => {
  if(isEmpty(popupParam.NOTICE_NO)) {
    return Message.warn('저장되지 않았거나, 선택된 정보가 없습니다.')
  }

  return true
}

const deleteData = () => {
  let deleteParams = []

  deleteParams.push(
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      NOTICE_DIV: popupParam.NOTICE_DIV,
      NOTICE_NO: popupParam.NOTICE_NO,
    },
  )
  return commonExecuteApi({ queryId : 'DATBA0010_DELETE_03', list: deleteParams })
}

// 데이터 조회
// NOTICE_NOTE 타입 CLOB 조회 처리
const search = () => {

  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.NOTICE_DIV = popupParam.NOTICE_DIV
  searchParams.NOTICE_NO = popupParam.NOTICE_NO

  Promise.all([
    commonRequest("/hse/data/DATBA0010_SEARCH_04", 
      { 
        queryId: "DATBA0010_SEARCH_04", 
        param: searchParams,
      }),
  ]).then(res => {
    setControlValues(res[0].ORESULT_CUR)
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR2)
    grdMain2.value.getDataProvider().setRows(res[0].ORESULT_CUR3)
  })
}

const setControlValues = res => {
  popupParam.CMPNY_DIV = res[0].CMPNY_DIV
  popupParam.NOTICE_DIV = res[0].NOTICE_DIV
  popupParam.NOTICE_NO = res[0].NOTICE_NO
  popupParam.NOTICE_TITLE = res[0].NOTICE_TITLE
  popupParam.NOTICE_NOTE = res[0].NOTICE_NOTE
  popupParam.NOTICE_RANGE = res[0].NOTICE_RANGE
  popupParam.NOTICE_REG_EMP_NM = res[0].KOR_NM
  popupParam.NOTICE_REG_EMP_TEL = res[0].TEL_NO
  popupParam.NOTICE_FILEID = res[0].NOTICE_FILEID
  popupParam.NOTICE_PERIOD = res[0].NOTICE_PERIOD
  popupParam.CATEGORY1 = res[0].CATEGORY1
  popupParam.CATEGORY1_ORI = res[0].CATEGORY1_ORI
  popupParam.CATEGORY2 = res[0].CATEGORY2
  popupParam.CATEGORY3 = dayjs(res[0].CATEGORY3).format('YYYY-MM-DD')
  popupParam.CATEGORY4 = dayjs(res[0].CATEGORY4).format('YYYY-MM-DD')

  if(isEmpty(popupParam.NOTICE_NOTE)) {
    ckEditor.value.setContent("")
  }
  else {
    ckEditor.value.setContent(popupParam.NOTICE_NOTE)
  }

  let strTag = res[0].NOTICE_TAG

  if(strTag.indexOf('HHIZ090BA') === 0 && strTag.length === 11) {
    popupParam.GUBUN1 = strTag.substring(9, 10)
    popupParam.GUBUN2 = strTag.substring(10, 11)
  }
}

const checkFileId = () => {
  if (isEmpty(popupParam.NOTICE_FILEID)) {
    fileUpload.value.setGuid()
    popupParam.NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(popupParam.NOTICE_FILEID)
    popupParam.NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
}

const onCellClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  if (clickData.cellType !== "header" && clickData.fieldName != "FILE_OPEN") {
    searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
    searchParams.NOTICE_DIV = popupParam.NOTICE_DIV
    searchParams.NOTICE_NO = popupParam.NOTICE_NO
    searchParams.CATEGORY1 = row.CATEGORY1
    searchParams.DIV_CD = row.DIV_CD

    popupParam.DIV_CD = row.DIV_CD

    Promise.all([
      commonRequest("/hse/data/DATBA0010_SEARCH_05", 
        { 
          queryId: "DATBA0010_SEARCH_05", 
          param: searchParams,
        }),
    ]).then(res => {
      setControlValues(res[0].ORESULT_CUR)
    })
  }
}

const onGrdMainCellItemClicked = (grid, index, col) => {
  if(col.cellType !== 'data'){
    return
  }

  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
  
  if (col.fieldName === 'FILE_OPEN') {
    fileUploadPopup.value.openPopup(data.NOTICE_FILEID)
  }
}

const onGrdMain2CellItemClicked = (grid, index, col) => {
  if(col.cellType !== 'data'){
    return
  }
  
  let data = grdMain2.value.getDataProvider().getJsonRow(col.dataRow)

  if (col.fieldName === 'FILE_OPEN') {
    fileUploadPopup.value.openPopup(data.NOTICE_FILEID)
  }
}
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
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>안전지침서관리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnChange', 'btnReviseRegist', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="max-height:800px; overflow-y: auto;">
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
                readonly
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
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="popupParam.NOTICE_TITLE"
                :label="$t('지침서명')"
                top-label
                label-width="80px"
                width="1140px"
                readonly
              /> 
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="popupParam.CATEGORY1"
                :label="$t('개정No.')"
                top-label
                width="150px"
                label-width="80px"
                readonly
              />
              <i-input
                v-model="popupParam.CATEGORY2"
                :label="$t('제개정사유')"
                top-label
                label-width="80px"
                width="970px"
                readonly
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
                readonly
              />
              <i-input
                v-model="popupParam.CATEGORY4"
                :label="$t('최근개정일')"
                top-label
                label-width="80px"
                type="date"
                width="150px"
                readonly
              />
              <i-input
                v-model="popupParam.NOTICE_REG_EMP_NM"
                :label="$t('담당자')"
                top-label
                label-width="80px"
                width="150px"
                readonly
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
              id="1"
              ref="ckEditor" 
              v-model="popupParam.NOTICE_NOTE"
              class="mt-2 "
            />
          </v-sheet>
          <v-sheet 
            height="200px"
            class="mb-2"
          >
            <!-- 제.개정 내역(PDF) -->
            <IGridTitle :title="$t('제개정 내역(PDF)')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @on-cell-item-clicked="onGrdMainCellItemClicked"
              @on-cell-clicked="onCellClicked"
            />
          </v-sheet>
          <v-sheet 
            height="200px"
            class="mb-2"
          >
            <!-- 제.개정 내역(PDF) -->
            <IGridTitle :title="$t('제개정 내역(원본)')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain2"
              :grid-view-option="grdMain2Props.gridViewOption"
              :keys="grdMain2Props.keys" 
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              @on-cell-item-clicked="onGrdMain2CellItemClicked"
              @on-cell-clicked="onCellClicked"
            />
          </v-sheet> 
          <v-sheet class="h-auto mt-2" style="display:none;">
            <IUpload
              ref="fileUpload"
              grid-title="파일첨부"
              :max-file-size="300"
              :is-visibled="fileVisible"
              :button-list="fileUploadButton"
              :isCmpnyDiv="false"
              auto-upload
              style="height: 370px"
            />
          </v-sheet> 
        </div>
        <!-- 안전지침서등록 팝업 -->
        <DATBA0010Popup02
          ref="dATBA0010Popup02"
          editor-id="200"
        />
        <IUploadPopup 
          ref="fileUploadPopup" 
          :cmpnyUseYn = "false"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
