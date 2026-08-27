<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

import Echart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { color, use } from 'echarts/core'
import { LineChart , BarChart , PieChart } from 'echarts/charts'  
import { TooltipComponent , LegendComponent, GridComponent, ToolboxComponent } from 'echarts/components'

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

const params = reactive({
  INS_DATE_FROM: null,
  INS_DATE_TO: null
})

const chart1 = ref(null)
const chart2 = ref(null)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable:false, movable:true },footer: { visible:true } },
  keys : [],
  fields : [ 
    { fieldName: 'SYS_CDNM', dataType: 'text', header: { text: t('구분'), exportStyleName: 'export_header_style'}, 
      footer: { text: '합계', styleName: 'footer-font center-column', exportStyleName: 'export_style'} , exportStyleName: 'export_style'},
    { fieldName: 'FAIL_CNT', dataType: 'number', header: { text: t('지적건수'), exportStyleName: 'export_header_style'},numberFormat: "#,##0",
      footer: {expression: 'sum', styleName: 'footer-font', exportStyleName: 'export_style'}, styleName: 'right-column' , exportStyleName: 'export_style'},
    { fieldName: 'OCC_RATE', dataType: 'number', header: { text: t('점유율(%)'), exportStyleName: 'export_header_style'},numberFormat: "#,##0.0#",
      footer: {expression: 'sum', styleName: 'footer-font', suffix: ' %',numberFormat: "#,##0.0#", exportStyleName: 'export_style'}, styleName: 'right-column' , suffix: ' %', exportStyleName: 'export_style'},
    { fieldName: 'COMP_CNT', dataType: 'number', header: { text: t('조치건수'), exportStyleName: 'export_header_style'},numberFormat: "#,##0",
      footer: {expression: 'sum', styleName: 'footer-font', exportStyleName: 'export_style'}, styleName: 'right-column', exportStyleName: 'export_style' },
    { fieldName: 'COMP_RATE', dataType: 'number', header: { text: t('조치율'), exportStyleName: 'export_header_style'},numberFormat: "#,##0.0#",
      footer: {expression: 'avg', suffix: ' %', styleName: 'footer-font',numberFormat: "#,##0.0#", exportStyleName: 'export_style'}, styleName: 'right-column' , suffix: ' %', exportStyleName: 'export_style'},
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  BarChart,
  PieChart
])

const onButtonsClick = btn =>{
  if(btn.id === 'btnSearch'){
    params.INS_DATE_FROM = dayjs(props.searchParams.INS_DATE_FROM).format('YYYYMMDD')
    params.INS_DATE_TO = dayjs(props.searchParams.INS_DATE_TO).format('YYYYMMDD')

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()

    chartSearch(params)
  }else if(btn.id === 'btnPrint'){
    printSet()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'MNGEE0020_TAB02_SEARCH_01', param: params })
}

const afterSearch = async res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const chartSearch = () => {
  let chartsOptions = {
    title: {
      text: '법령구분별 지적 건 수',
      // subtext: 'Fake Data',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b} : {c} ( {d}% )',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      // orient: 'horizontal',
      // show: false
      orient: 'vertical',
      left: 'left'
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {},
      },
    },
    series: [
      {
        name: '',
        type: 'pie',
        radius: ['80%','30%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          formatter: '{b} \n {c} ({d}%)',
          fontSize: 16,
          show: false,
        },
        data: [],
      },
    ],
  }

  let chartsOptions2 = {
    title: {
      text: '안전 · 보건 조치 파트의 상세',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b} : {c} ( {d}% )',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      orient: 'horizontal',
      show: false
    },
    toolbox: {
      show: false,
      feature: {
        saveAsImage: {},
      },
    },
    series: [
      {
        name: '',
        type: 'pie',
        radius: ['80%','30%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          // formatter: '{b} \n {c} ({d}%)',
          // fontSize: 16,
          show: false,
        },
        data: [],
      },
    ],
  }
  commonSearchApi({ queryId : 'MNGEE0020_TAB02_SEARCH_02', param: params }).then(res => {
    res.ORESULT_CUR.forEach(item => {
      console.log(" res : " , res)
      chartsOptions.series[0].data.push({
        value: item.CNT,
        name: item.SYS_CDNM,
        itemStyle: {
          color: item.COLOR 
        }
      })
    })
    chart1.value.setOption(chartsOptions)
  })

  commonSearchApi({ queryId : 'MNGEE0020_TAB02_SEARCH_03', param: params }).then(res => {
    res.ORESULT_CUR.forEach(item => {
      chartsOptions2.series[0].data.push({
        value: item.CNT,
        name: item.SYS_CDNM,
        itemStyle: {
          color: item.COLOR 
        }
      })
    })
    chart2.value.setOption(chartsOptions2)

  })
}

const printSet = () => {
  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '관계법령별 지적 건수.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: "관계법령별 지적 건수",
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
  <IGridTitle :title="$t('관계법령별 지적 건수')" />
  <RealGrid
    ref="grdMain"
    class="mb-2"
    style="height: calc(100vh - 800px);"
    :grid-view-option="grdMainProps.gridViewOption"
    :keys="grdMainProps.keys"
    :fields="grdMainProps.fields"
    :columns="grdMainProps.columns"
  />
  <div class="d-flex">
    <div class="flex-fill pa-2">
      <!-- <IGridTitle :title="$t('법령구분별 지적 건 수')" /> -->
        <Echart ref="chart1" class="echarts_style" autoresize/>
    </div>
    <div class="flex-fill pa-2">
      <!-- <IGridTitle :title="$t('안전 · 보건 조치 파트의 상세')" /> -->
      <Echart ref="chart2" class="echarts_style" autoresize />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.echarts_style {
  height: 400px;
  width: calc(50vw - 60px);
}

::v-deep(.echarts_style > div) {
  width: 100%;
  height: 100%;
  text-align: -webkit-center;
}
</style>
 