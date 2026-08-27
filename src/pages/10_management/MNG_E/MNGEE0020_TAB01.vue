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
  gridViewOption : {stateBar: { visible: false }, edit: { editable:false }, header: { height: 104 },footer: { visible:true } },
  keys : [],
  fields : [
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn =>{
  if(btn.id === 'btnSearch'){
    search()
  }else if(btn.id === 'btnPrint'){
    printSet()
  }
}

const search = () => {
  let INS_DATE_FROM = dayjs(props.searchParams.INS_DATE_FROM).format('YYYYMMDD')
  let INS_DATE_TO = dayjs(props.searchParams.INS_DATE_TO).format('YYYYMMDD')
  const params = {
    INS_DATE_FROM: INS_DATE_FROM,
    INS_DATE_TO: INS_DATE_TO,
  }

  let columns = [
    {fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style'}, width: '100', 
      footer: { text: '전사 합계', styleName: 'footer-font center-column', exportStyleName: 'export_style'} , mergeRule: { criteria: 'value' }, exportStyleName: 'export_style'},
    {fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style'}, width: '100', 
      exportStyleName: 'export_style', footer: { text: '', styleName: 'footer-font center-column', exportStyleName: 'export_style'}},
    {fieldName: 'FAIL_CNT', dataType: 'number', header: { text: t('지적건수'), exportStyleName: 'export_header_style'},numberFormat: "#,##0", width: '100', 
      footer: {expression: 'sum', styleName: 'footer-font', exportStyleName: 'export_style'},  exportStyleName: 'export_style', styleName: 'right-column'}
  ]

  let layout = [
  {column:"BSNS_NM",footerUserSpans:[{rowspan:0, colspan:2}]},
    // 'BSNS_NM',
    'DEPT_NM',
    'FAIL_CNT',
  ]

  commonSearchApi({ queryId : 'MNGEE0020_TAB01_SEARCH_01', param: params }).then(res => {
    let header = res.ORESULT_CUR.filter((item , idx) => {
      return (res.ORESULT_CUR.findIndex((gbn) => {
        return item.HEADER === gbn.HEADER
      }) === idx )
    })

    /* ********* layout 셋팅 ********** */
    header.forEach(x => {
      layout.push(
        { name: x.HEADER, direction: 'horiziontal', items: [], header: { text: x.HEADER , exportStyleName: 'export_header_style'} } 
      )

      res.ORESULT_CUR.forEach(y => {
        if(x.HEADER === y.HEADER){
          layout[layout.length - 1].items.push(
            { name: y.JOHANG, 
              direction: 'vertical', 
              items: [ "'" + y.LAW_CD + "'"], 
              header: {
                text: y.JOHANG, 
                // template: '<div style="background: red"><span>${headerText}</span></div>',
                // values: {headerText: y.JOHANG}
                exportStyleName: 'export_header_style'
              }
            }
          )
        }
      })
    })

    /* ********** columns 설정 ********** */
    res.ORESULT_CUR.forEach(e => {
      columns.push({fieldName: "'" +  e.LAW_CD + "'" , dataType: 'number', header: { text: e.JOMUN ? e.JOMUN : ' ', exportStyleName: 'export_header_style'}, 
        width: '100',displayCallback:function(grid, index, value){return value == '0' ? null : value} , exportStyleName: 'export_style',numberFormat: "#,###"
        , styleName: 'right-column', footer: {expression: 'sum', styleName: 'footer-font', exportStyleName: 'export_style'}})
    })
    
  }).finally(() => {
    grdMain.value.getDataProvider().setFields(columns)
    grdMain.value.getGridView().setColumns(columns)
    grdMain.value.getGridView().setColumnLayout(layout)

    /* ********************************* 그리드 조회 ******************************** */
    commonSearchApi({ queryId : 'MNGEE0020_TAB01_SEARCH_02', param: params }).then(res => {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

    })
  })
}

const printSet = () => {
  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '법조항별 지적 현황.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: "법조항별 지적 현황",
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
  />
</template>

 