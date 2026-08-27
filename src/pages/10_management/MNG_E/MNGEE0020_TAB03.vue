<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)

const props = defineProps({
  searchParams: {
    Type : Object,
    default: {},
  },
}) 

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable:false },footer: { visible:true } },
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style'}, 
      lookupDisplay: true, mergeRule: { criteria: 'value' }, exportStyleName: 'export_style',
      footer: { text: '합계', styleName: 'footer-font center-column', exportStyleName: 'export_style' }, styleName: 'left-column'},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style'}, 
      lookupDisplay: true, styleName: 'left-column', exportStyleName: 'export_style', footer: { text: '', styleName: 'footer-font center-column', exportStyleName: 'export_style' } },
    { fieldName: 'FAIL_CNT', dataType: 'number', header: { text: t('부적합 건수'), exportStyleName: 'export_header_style'},
      footer: {expression: 'sum', styleName: 'footer-font', exportStyleName: 'export_style' }, styleName: 'right-column',numberFormat: "#,##0", exportStyleName: 'export_style'},
    { fieldName: 'COMP_CNT', dataType: 'number', header: { text: t('시정 건수'), exportStyleName: 'export_header_style'},
      footer: {expression: 'sum', styleName: 'footer-font', exportStyleName: 'export_style' }, styleName: 'right-column',numberFormat: "#,##0", exportStyleName: 'export_style'},
    { fieldName: 'COMP_RATE', dataType: 'number', header: { text: t('시정완료율'), exportStyleName: 'export_header_style'}, suffix: ' %',
      footer: {expression: 'avg', suffix: ' %', styleName: 'footer-font',numberFormat: "#,##0.0#", exportStyleName: 'export_style'  }, 
      styleName: 'right-column',numberFormat: "#,##0.0#", exportStyleName: 'export_style' },
  ],
  columns : [],
  columnLayout: [
  {column:"BSNS_NM",footerUserSpans:[{rowspan:0, colspan:2}]}, 
    'DEPT_NM',
    'FAIL_CNT',
    'COMP_CNT',
    'COMP_RATE'
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn =>{
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnPrint'){
    printSet()
  }
}

const searchData = () => {
  let INS_DATE_FROM = dayjs(props.searchParams.INS_DATE_FROM).format('YYYYMMDD')
  let INS_DATE_TO = dayjs(props.searchParams.INS_DATE_TO).format('YYYYMMDD')
  const params = {
    INS_DATE_FROM: INS_DATE_FROM,
    INS_DATE_TO: INS_DATE_TO,
  }

  return commonSearchApi({ queryId : 'MNGEE0020_TAB03_SEARCH_01', param: params })
}

const afterSearch = async res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const printSet = () => {
  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '부서별 시정조치 현황.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: "부서별 시정조치 현황",
      visible: true,
      spaceTop: 1,
      spaceBottom: 0,
      height: 50,
      styleName: "excelTitle",
    },
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: true, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}

defineExpose({
  onButtonsClick,
})

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <RealGrid
    ref="grdMain"
    style="height: calc(100vh - 330px);"
    :grid-view-option="grdMainProps.gridViewOption"
    :keys="grdMainProps.keys"
    :fields="grdMainProps.fields"
    :columns="grdMainProps.columns"
    :column-layout="grdMainProps.columnLayout"
  />
</template>

 