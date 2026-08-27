<!-- 
  화면명   : 안전지침서 선택 팝업
  화면개요 : 안전지침서 선택 팝업
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue";
import { useUserStore } from "@hiway/stores/user"
import { useLogsStore } from "@hiway/stores/logs"
import { commonDownloadFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, getCodeList } from "@hiway/api/commonApi"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import {startDragging,handleDragging,stopDragging,} from "@/utils/useDrag.js"
import dayjs from 'dayjs'

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const t = useI18n().t //다국어
const dialog = ref(null)
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_DIV: '',
  SEARCH_CATEGORY: '',
  TEXT: '',
  GUBUN1: '',
  GUBUN2: '',
  DATE_FROM: dayjs().subtract(6, "month").format("YYYY-MM-DD"),
  DATE_TO: dayjs().format("YYYY-MM-DD"),
  DATE_YN: 'N',
  FAVORITE_YN: 'N',
  EMP_NO: userStore.userId,
})

//코드리스트
const codeList = reactive({
  SEARCH_GBN1 : [],
  SEARCH_GBN2 : [],
})

const searchCombo = ref({
  COD: 'TITLE',
  LIST : [
    { COD: 'TITLE', TXT: '제목' }, 
    { COD: 'CONTENT', TXT: '내용' },
    { COD: 'TITLE_CONTENT', TXT: '제목+내용' },
  ],
})

// 팝업 오픈 함수
const openPopup = val => {
  dialog.value = true
  
  initCodeList()
}

//콤보박스 셋팅
const initCodeList = async () => {
  await Promise.all([
    getCodeList(userStore.cmpnyDiv + 'Z090BA'), //분류1 콤보
    getCodeList(userStore.cmpnyDiv + 'Z090BB'), //분류2 콤보
  ]).then(res => {
    codeList.SEARCH_GBN1 = res[0].ORESULT_CUR
    codeList.SEARCH_GBN2 = res[1].ORESULT_CUR

    codeList.SEARCH_GBN1.unshift({ TXT: "전체", COD: "" })
    codeList.SEARCH_GBN2.unshift({ TXT: "전체", COD: "" })

    searchParams.GUBUN1 = ''
    searchParams.GUBUN2 = ''
    searchParams.SEARCH_CATEGORY = 'TITLE'

    // let path = useLogsStore().path.split('/')
    // let menuId = path[path.length -1]

    searchParams.NOTICE_DIV = 'DATBA0010'

    if (userStore.userDiv === 'A' || userStore.userId === 'BP23198') {
      menuTitle.value.setBtnProperty('btnRequest', 'visible', true)
    }
    else {
      menuTitle.value.setBtnProperty('btnRequest', 'visible', false)
    }

    onButtonsClick({ id :'btnSearch' })
  })
}

const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['CMPNY_DIV','NOTICE_DIV'],
  fields : [ 
    { fieldName: 'GUBUN1', dataType: 'text', width: '100', header: { text: t('적용사업부') }, editable:false },
    { fieldName: 'GUBUN2', dataType: 'text', width: '80', header: { text: t('작업구분') }, editable:false },
    { fieldName: 'NOTICE_TITLE', dataType: 'text', width: '300', header: { text: t('제목') }, editable:false, styleName: "left-column" },
    { fieldName: 'CATEGORY1', dataType: 'text', width: '60', header: { text: t('개정No.') }, editable:false },
    { fieldName: 'FILE_CNT', dataType: 'text', width: '55', header: { text: t('첨부자료 [건]') }, editable:false, styleName: "right-column" },
    { fieldName: 'KOR_NM', dataType: 'text', width: '95', header: { text: t('담당자') }, editable:false },
    { fieldName: 'TEL_NO', dataType: 'text', width: '75', header: { text: t('연락처') }, editable:false },
    { fieldName: 'CATEGORY3', dataType: 'datetime', width: '100', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('제정일자'), editor: { datetimeFormat: 'yyyy-MM-dd' } }, editable:false },
    { fieldName: 'CATEGORY4', dataType: 'datetime', width: '100', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('개정일자'), editor: { datetimeFormat: 'yyyy-MM-dd' } }, editable:false },
    { fieldName: 'REQ_STATUS', dataType: 'text', width: '75', header: { text: t('개정진행') }, editable:false },
    { fieldName: 'REQUEST', dataType: 'text', width: '60', editable: false, header: { text: t('개정신청') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/images/icons/add_file_icon.png', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      }, visible: (userStore.userDiv === 'A' || userStore.userId === 'BP23198') ? true:false,
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DOC_NO', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'datetime' , visible: false },
    { fieldName: 'NOTICE_PERIOD', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_CNT', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_REG_EMPNO', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_RANGE', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_TAG', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text' , visible: false },
    { fieldName: 'REPLY_DATE', dataType: 'text' , visible: false },
    { fieldName: 'SEQ', dataType: 'text' , visible: false },
    { fieldName: 'STATUS', dataType: 'text' , visible: false },
    { fieldName: 'REJECT_DESC', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_TITLE', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_NOTE', dataType: 'text' , visible: false },
    { fieldName: 'REQ_REJECT_DESC', dataType: 'text' , visible: false },
    { fieldName: 'REQ_NOTICE_FILEID', dataType: 'text' , visible: false },
    { fieldName: 'REQ_EMP_NO', dataType: 'text' , visible: false },
    { fieldName: 'REQ_EMP_NM', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()    
  }
  else if (btn.id === "btnSelect") {
    onSelect()
  } 
  else if (btn.id === "btnClose") {
    onClose()
  }
}

// 조회
const searchData = () => {
  let sendParams = {}

  sendParams = Object.assign({}, searchParams)

  sendParams.DATE_FROM = searchParams.DATE_FROM.replaceAll('-', '')
  sendParams.DATE_TO = searchParams.DATE_TO.replaceAll('-', '')

  return commonSearchApi({ queryId : 'DATBA0010_SEARCH_01', param: sendParams })
}

const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
} 

// 선택
const onSelect = async () => {
  if (grdMain.value.getGridView().getCurrent().dataRow === -1) {
    return Message.warn(t('선택한 데이터가 없습니다.'))
  }

  const rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  data.sendParams = searchParams

  emit('selected', data)
  onClose()
}

const onCellDblClicked = (grid, clickData) => {
  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  data.sendParams = searchParams
  
  emit('selected', data)
  onClose()
}

// 닫기
const onClose = () => {
  dialog.value = false  
}

onMounted(() => {})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1250"
    height="850"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move" @mousedown="startDragging">
      <span>안전지침서</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle 
          :use-permission="false" 
          :button-list="['btnSearch', 'btnSelect', 'btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                v-model="searchParams.SEARCH_CATEGORY" 
                :label="$t('검색')"
                label-width="30px"
                append-inner-icon="mdi-magnify"
                :items="searchCombo.LIST"
                item-value="COD"
                item-title="TXT"
                width="200px"
              />
              <i-input 
                v-model="searchParams.TEXT"
                width="250px"
                />
                <!-- @keyup="controlKeyUp" -->
              <i-select
                v-model="searchParams.GUBUN1" 
                :label="$t('적용사업부')"
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.SEARCH_GBN1"
                item-value="COD"
                item-title="TXT"
                width="235px"
              />
              <i-select
                v-model="searchParams.GUBUN2" 
                :label="$t('작업구분')"
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.SEARCH_GBN2"
                item-value="COD"
                item-title="TXT"
                width="235px"
              />
            </div>
            <div class="mt-2 d-flex">
              <i-input
                v-model="searchParams.DATE_FROM"
                :label="$t('제/개정 일자')"
                label-width="80px"
                type="date"
                width="235px"
              />
              <i-input
                v-model="searchParams.DATE_TO"
                :label="$t('~')"
                width="165px"
                type="date"
              />
              <VCheckbox
                v-model="searchParams.DATE_YN"
                :label="$t('기간조건 포함')"
                class="pe-2"
              />
              <VCheckbox
                v-model="searchParams.FAVORITE_YN"
                :label="$t('즐겨찾기')"
                class="pe-2"
              />
            </div>
          </v-sheet>
          <v-sheet height="100%">
            <RealGrid
              ref="grdMain"
              class="my-2 h-auto"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>