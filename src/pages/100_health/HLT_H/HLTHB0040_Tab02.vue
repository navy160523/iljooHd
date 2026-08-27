<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, onBeforeMount, nextTick, watch } from "vue";
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi";
import RealGrid from "@/components/RealGrid.vue";
import IGridTitle from '@/components/IGridTitle.vue'
import Message from "@hiway/utils/notify";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import { isEmpty, isEmptyArray } from "@/@core/utils";
import saveFlowHelper from "@/utils/saveFlowHelper";

const props = defineProps({ searchParams: Object })

const grdMain = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어

const codeList = reactive({
  factory: [
    {COD: '',       TXT: '전체'},
    {COD: 'MAIN',   TXT: '본공장'},
    {COD: 'MARINE', TXT: '해양공장'},
    {COD: 'GUNSAN', TXT: '군산공장'},
  ],
  MONTH: Array.from({ length: 12 }, (_, i) => ({
    COD: (i + 1).toString().padStart(2, '0'),
    TXT: `${(i + 1).toString().padStart(2, '0')}월`
  })),
  IO_GUBN: [
    { COD: 'I', TXT: '입고' },
    { COD: 'O', TXT: '지급' },
    { COD: 'F', TXT: '전년도 이월' }
  ], 
})

const frontCol = [
  { fieldName: "MONTH", dataType: "text", width: "40", editable: false, header: { text: t("월") }, mergeRule: { criteria: "value", }, footer: { text: '현재 재고', styleName: 'center-column' },
    summary: { text: '전년도 이월', styleName: 'center-column' }, 
    lookupDisplay: true, direction: "horizontal",
    lookupData: { value: "COD", label: "TXT", list: codeList.MONTH },
  },
  { fieldName: "IO_GUBN", dataType: "text", width: "40", editable: false, header: { text: t("수불 구분") }, mergeRule: { criteria: "value", }, 
    lookupDisplay: true, direction: "horizontal",
    lookupData: { value: "COD", label: "TXT", list: codeList.IO_GUBN },
  },
]

const endCol = [   
  {
    fieldName: "TOTAL",
    dataType: "number",
    width: "60",
    header: { text: t('합계') },
    numberFormat: "#,###",
    editable: false,
    styleName: 'right-column',
    valueCallback: (grid, dataRow, fieldName, fieldNames, values) => {
      let sum = 0;
      
      // 안전화 필드명만 필터링
      const itemFields = fieldNames.filter(name => !(name.includes("MONTH") || name.includes("IO_GUBN") || name.includes("TOTAL")));

      // 필드값 합산
      itemFields.forEach(field => {
        const value = values[fieldNames.indexOf(field)] || 0;
        sum += value;
      });

      return sum;
    },
    headerSummary: {
      numberFormat: "#,###",
      valueCallback: (grid, column, childIndex, summary, value) => {
        return Object.values(carryOver.value).reduce((acc, val) => {
          return typeof val === 'number' ? acc + val : acc
        }, 0)
      },
    },
    footer: {
      numberFormat: "#,###",
      valueCallback: (grid, column, footerIndex, columnFooter, value) => {
        var sum = 0;
        var prod = grid.getDataSource()
        var cnt = prod.getRowCount()

        for (var i=0 ; i<cnt ; i++) {
          if(grid.getValue(i, 'IO_GUBN') === 'I') {
            sum += isNaN(grid.getValue(i, 'TOTAL')) ? 0 : grid.getValue(i, 'TOTAL')
          }else if(grid.getValue(i, 'IO_GUBN') === 'O') {
            sum -= isNaN(grid.getValue(i, 'TOTAL')) ? 0 : grid.getValue(i, 'TOTAL')
          }
        }

        const carryOverTot = Object.values(carryOver.value).reduce((acc, val) => {
          return typeof val === 'number' ? acc + val : acc
        }, 0)
        sum += carryOverTot

        return sum
      }
    }
  }
]

const grdMainProps = reactive({
  gridViewOption: { 
    checkBar: { visible: false }, 
    rowIndicator: { visible: false }, 
    footer: { visible: true },
    headerSummaries: { visible: true, },
    
  },
  fields: [],
  columns: []
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    getData()
  }else if(btn.id === 'btnExcelDownload') {
    // 엑셀 다운로드
    const factoryName = codeList.factory.find(item => item.COD === props.searchParams.FACTORY).TXT
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '안전장화 재고현황'
        + '_' + factoryName + `(${props.searchParams.YEAR})`
        + '.xlsx', // 저장될 파일 name
      documentTitle: { //제목 
        message: '안전장화 재고현황'
          + '_' + factoryName + `(${props.searchParams.YEAR})`,
        visible: true, 
        spaceTop: 1,
        spaceBottom: 0,
        height: 80,
        styleName: 'excelTitle', 
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: false, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    }) 
  }
}

const carryOver = ref(null)
const initCodeList = () => {
  getCodeList('HHII710C').then(res => {
    const fields = []
    res.ORESULT_CUR.forEach(item => {
      fields.push({
        fieldName: item.COD,
        dataType: "number",
        width: "100",
        header: { text: item.TXT },
        numberFormat: "#,###",
        lookupDisplay: true,
        styleName: "right-column",
        editable: false,
        headerSummary: {
          numberFormat: "#,###",
          valueCallback: (grid, column, childIndex, summary, value) => {
            return carryOver.value[column.fieldName]
          }
        },
        footer: {
          numberFormat: "#,###",
          valueCallback: (grid, column, footerIndex, columnFooter, value) => {
            var sum = 0;
            var prod = grid.getDataSource()
            var cnt = prod.getRowCount()

            for (var i=0 ; i<cnt ; i++) {
              if(grid.getValue(i, 'IO_GUBN') === 'I') {
                sum += isNaN(grid.getValue(i, item.COD)) ? 0 : grid.getValue(i, item.COD)
              }else if(grid.getValue(i, 'IO_GUBN') === 'O') {
                sum -= isNaN(grid.getValue(i, item.COD)) ? 0 : grid.getValue(i, item.COD)
              }
            }

            sum += carryOver.value[column._name]

            return sum
          }
        },
      })      
    })
    const cols = [...frontCol, ...fields, ...endCol]
    grdMainProps.columns = grdMainProps.fields = cols
    grdMain.value.getDataProvider().setFields(grdMainProps.fields)
    grdMain.value.getGridView().setColumns(grdMainProps.columns)

    gridStyleSetting()
  })
}

const gridStyleSetting = () => {
  grdMain.value.getGridView().layoutByColumn("MONTH").spanCallback = function (grid, layout, itemIndex) {
    var value = grid.getValue(itemIndex, "MONTH")
    if(value == "F"){
      return 2; //가로 병합 수
    }
    return 1;
  };

  // summary, footer 가로병합
  grdMain.value.getGridView().layoutByColumn("MONTH").footerSpanCallback = function () {
    return 2
  }
  grdMain.value.getGridView().layoutByColumn("MONTH").summarySpanCallback = function () {
    return 2
  }
  grdMain.value.getGridView().setHeaderSummary({height: 32});
}

// 검색
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const searchData = () => {
  grdMain.value.getDataProvider().setRows(null)
  return Promise.all([
    commonSearchApi({ queryId: 'HLTHB0040_SEARCH_04', param: props.searchParams}),  // 전년도 이월
    commonSearchApi({ queryId: 'HLTHB0040_SEARCH_05', param: props.searchParams}),  // 재고 현황
  ])
}

const afterSearch = (res) => {
  carryOver.value = res[0].ORESULT_CUR[0]
  grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR)
}

const updateYear = () => {
  props.searchParams.FACTORY = ''
  onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 본공장, 해양, 군산공장 버튼 추가 -->
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnExcelDownload']"
        :use-permission="true"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('기준년도')"
              label-width="50px" 
              width="160px"
              v-model="props.searchParams.YEAR"
              type="YEAR"
              @update:modelValue="updateYear"
            />
            <i-select
              :label="$t('공장구분')"
              label-width="50px" 
              width="170px"
              v-model="props.searchParams.FACTORY"
              :items="codeList.factory"
              item-title="TXT"
              item-value="COD"
              type="TEXT"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 300px);
  overflow-y: auto;
  /* > div {
    min-height: 700px;
  } */
}
.tooltip-wrapper {
  position: absolute;
}
.tooltip {
  position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
  background-color: #424242;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
  pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
  white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
  border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
  border-top: 5px solid #424242; /* 화살표의 색상 */
  position: absolute;
  left: 50%; /* 가운데 정렬 */
  transform: translateX(-50%); /* 수평 중심으로 이동 */
  top: 100%; /* 툴팁 아래에 위치 */
}
</style>