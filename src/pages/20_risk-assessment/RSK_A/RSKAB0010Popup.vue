<script setup>
import { getCodeList, commonSearchApi } from "@hiway/api/commonApi"
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

const userStore    = useUserStore()
const userLogStore = useLogsStore()
const menuTitle    = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t  = useI18n().t                //다국어
const grdMain = ref(null)
const dialog = ref(false)

const searchParams = reactive({
  CMPNY_DIV: null,
  BSNS_CD: null,
  DEPT_CD: null,
  HALF: null,
  YEAR: null,
})

const grdMainProps = reactive({
  gridViewOption : {stateBar: { visible: false },edit: { editable:false }},
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style'}
      , width: '140', exportStyleName: 'export_style'},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style'}
      , width: '140', exportStyleName: 'export_style'},
    { fieldName: 'OCCUR_DT', dataType: 'text', header: { text: t('발생일'), exportStyleName: 'export_header_style'}
      , exportStyleName: 'export_style'},
    { fieldName: 'SAGO_DIV_M', dataType: 'text', header: { text: t('유형'), exportStyleName: 'export_header_style'}
      , lookupDisplay: true, exportStyleName: 'export_style'},
    { fieldName: 'SAGO_GAEYO', dataType: 'text', header: { text: t('사고요약'), exportStyleName: 'export_header_style'}
      , width: '480', styleName: 'multiline-editor left-column pa-2', exportStyleName: 'multiline-editor export_style left-column'}
  ],
  columns : []
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  if(btn.id === 'btnExcelDownload'){
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '안전사고목록_' + dayjs().format('YYYY-MM-DD') + '.xlsx', // 저장될 파일 name
      documentTitle: { 
        //제목
        message: "안전사고목록",
        visible: true,
        spaceTop: 1,
        spaceBottom: 0,
        height: 50,
        styleName: "excelTitle",
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  }else {
    for(let i in searchParams){
      searchParams[i] = null
    }
    dialog.value = false
  }
}

const search = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData) 
    .setAfter(afterSearch)
    .run()  
}

const searchData = () => {
  return commonSearchApi({ queryId : 'RSKAB0010_POP_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  res.ORESULT_CUR.forEach(e => {
    e.OCCUR_DT = dayjs(e.OCCUR_DT).format('YYYY-MM-DD')
  })
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const openPopup = rowData => {
  for(let i in rowData){
    searchParams[i] = rowData[i]
  }
  dialog.value = true
  // searchParams.CMPNY_DIV = rowData.COMP_CD
  // searchParams.BSNS_CD = rowData.BSNS_CD
  // searchParams.DEPT_CD = rowData.DEPT_CD

  search()
  
  /* 유형 리스트 조회 */
  Promise.all([getCodeList('HHIBH20')]).then(res => {
    grdMain.value.setBindingColumn('SAGO_DIV_M', res[0].ORESULT_CUR, 'COD', 'TXT')
  })
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
    width="1250"
    height="600"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>작업성 사고</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('작업성 사고 목록')"  
          :button-list="['btnExcelDownload', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 mb-2">
        <v-sheet class="fill-height">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>