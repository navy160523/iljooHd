<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import { required } from "@hiway/utils/validation"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import Echart from "vue-echarts"
import { LineChart } from "echarts/charts"
import SAFAD0010Popup from "./SAFAD0010Popup.vue"
import SAFAD0010Popup2 from "./SAFAD0010Popup2.vue"

defineOptions({
  name: "30_safety-SAF_A-SAFAD0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const grdSub = ref(null)
const grdMain = ref(null)
const echart = ref(null)
const sAFAD0010Popup = ref(null)
const sAFAD0010Popup2 = ref(null)
const searchParam01 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().$y,
})

const searchParam02 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: "",
  BSNS_CD: "",
})

const codeList = reactive({
  bsnscd: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.bsnscd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
  })
}
const grdMainProps = reactive({
  fields: [],
  columns: [],
})

//그리드 속성셋팅
const grdSubProps = reactive({
  fields: [
    { fieldName: "BSNS_CD", visible: false, dataType: "text", width: "100", header: { text: t("사업부코드") } },
    {
      fieldName: "BSNS_NM",
      visible: true,
      editable: false,
      dataType: "text",
      width: "80",
      header: { text: t("사업부") },
    },
    { fieldName: "ACC_CNT_BF", visible: true, dataType: "text", width: "60", header: { text: t("건수") } },
    {
      fieldName: "ACC_RATE_PLN_BF",
      visible: true,
      dataType: "text",
      editable: false,
      width: "60",
      header: { text: t("재해율") },
    },
    {
      fieldName: "SAGO_CNT",
      visible: true,
      editable: false,
      dataType: "text",
      width: "60",
      header: { text: t("건수") },
    },
    {
      fieldName: "SAGO_RATE",
      visible: true,
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("재해율") },
    },
    {
      fieldName: "ACC_CNT",
      visible: true,
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("건수") },
    },
    {
      fieldName: "ACC_RATE_PLN",
      visible: true,
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("재해율") },
    },
    {
      fieldName: "OVER_RATE",
      visible: true,
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("관리기준대비 초과율") },
    },
  ],
  columns: [],
  columnLayout: [
    "BSNS_NM", //사업부
    {
      name: "",
      direction: "horizontal",
      items: ["ACC_CNT_BF", "ACC_RATE_PLN_BF"],
    },
    {
      name: "",
      direction: "horizontal",
      items: ["ACC_CNT", "ACC_RATE_PLN"],
    },
    {
      name: "",
      direction: "horizontal",
      items: ["SAGO_CNT", "SAGO_RATE"],
    },
    {
      name: "관리기준대비 초과율",
      direction: "horizontal",
      hideChildHeaders: true,
      items: ["OVER_RATE"],
    },
  ],
})
grdSubProps.columns = grdSubProps.fields
//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    if(!searchParam01.YEAR) {
      Message.warn(t('년도를 입력해주세요.'))
      return
    } else if(searchParam01.YEAR * 1 < 2023) {
      Message.warn(t('2023년도부터 검색가능합니다.'))
      return
    }

    new queryFlowHelper(vm, t).setQuery(searchData01).setAfter(afterSearch01).run()
    new queryFlowHelper(vm, t).setQuery(searchData02).setAfter(afterSearch02).run()
  } else if (btn.id === "btnDisasterRateTargetMnt") {
    sAFAD0010Popup.value.openPopup()
  } else {
    sAFAD0010Popup2.value.openPopup()
  }
}

const chartsOptions = reactive({
  legend: {
    bottom: 30,
  },
  grid: {
    top: "4%",
    width: "93%",
    left: "4%",
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: [], //x축
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "재해율(실적)",
      type: "line",
      lineStyle: {
        width: "4",
      },
      data: [], //재해율(실적 데이터)
    },
    {
      name: "재해율(관리기준)",
      type: "line",
      lineStyle: {
        width: "4",
      },
      data: [], //재해율(관리기준)
    },
  ],
})

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().setRowIndicator({
    visible: false,
  }) //No열 보이지 않도록 설정
  grdSub.value.getGridView().setRowIndicator({
    visible: false,
  }) //No열 보이지 않도록 설정
  onButtonsClick({ id: "btnSearch" })
  grdMain.value.getGridView().setSortingOptions({
    enabled: false
  })
})

//전사관리기준 조회관련 로직 시작
const searchData01 = () => {
  return commonSearchApi({
    queryId: "SAFAD0010_SEARCH01",
    param: searchParam01,
  })
}

const afterSearch01 = (res) => {
  //차트 데이터 초기화
  chartsOptions.xAxis.data = []
  chartsOptions.series[0].data = []
  chartsOptions.series[1].data = []

  let data = [{ GUBUN: "재해율(실적)" }, { GUBUN: "재해율(관리기준)" }, { GUBUN: "관리 기준 대비 초과율" }]
  //그리드 데이터 초기화
  grdMain.value.getDataProvider().setRows(null)
  grdMainProps.columns = [] //컬럼초기화
  //구분[단위%]컬럼세팅
  grdMainProps.columns.push({
    fieldName: "GUBUN",
    dataType: "text",
    width: "80",
    editable: false,
    header: { text: t("구분 [단위:%]") },
  })
  //연도컬럼세팅
  res.ORESULT_CUR.forEach((e, index) => {
    grdMainProps.columns.push({
      fieldName: `${e.YEAR}`,
      dataType: "text",
      width: "80",
      editable: false,
      header: { text: t(`${e.YEAR}년`) },
    })
    chartsOptions.xAxis.data.push(e.YEAR)
  })
  //재해율(실적) 데이터 로우 생성
  res.ORESULT_CUR.forEach((e) => {
    data[0][`${e.YEAR}`] = e.ACC_RATE
    chartsOptions.series[0].data.push(e.ACC_RATE)
  })
  //재해율(관리기준) 로우 데이터 생성
  res.ORESULT_CUR.forEach((e) => {
    data[1][`${e.YEAR}`] = e.ACC_RATE_PLN
    chartsOptions.series[1].data.push(e.ACC_RATE_PLN)
  })
  //관리 기준 대비 초과율 로우 데이터 생성
  res.ORESULT_CUR.forEach((e) => {
    data[2][`${e.YEAR}`] = e.OVER_RATE
  })
  //데이터세팅
  grdMain.value.getDataProvider().setFields(grdMainProps.columns)
  grdMain.value.getGridView().setColumns(grdMainProps.columns)
  grdMain.value.getDataProvider().setRows(data)
  setGridStyle()
}
//메인 그리드 조회관련 로직 끝

//서브 그리드 조회관련 로직 시작
const searchData02 = () => {
  searchParam02.YEAR = searchParam01.YEAR
  return commonSearchApi({
    queryId: "SAFAD0010_SEARCH02",
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSubProps.columnLayout[1].name = searchParam01.YEAR - 1 + "년 관리기준" //전년도 관리기준
  grdSubProps.columnLayout[2].name = searchParam01.YEAR + "년 재해관리기준" //조회년도 관리기준
  grdSubProps.columnLayout[3].name = searchParam01.YEAR + " 현황" //조회년도 현황
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getGridView().setColumnLayout(grdSubProps.columnLayout)
}
//서브 그리드 조회관련 로직 끝

//메인그리드 관리 기준 대비 초과율 셀 색상 변경
//양수일때 붉은색 음수일때 초록색
const setGridStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    let ret = {}
    let data = grdMain.value.getDataProvider().getJsonRow(dataCell.index.dataRow)
    if (dataCell.value === null) {
      ret.style = { background: "rgb(255,255,255)" }
      return ret
    }
    if (data.GUBUN === "관리 기준 대비 초과율") {
      if (dataCell.value > 0) {
        ret.style = { background: "rgb(255,160,160)" }
        return ret
      } else if (dataCell.value < 0 && dataCell.value != null) {
        ret.style = { background: "rgb(0,255,128)" }
        return ret
      }
    }
  })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnDisasterRateTargetMnt', 'btnWeeklyMonthlyStatus']"
        @click-button="onButtonsClick"
      >
      </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            width="200px"
            :label="$t('년도')"
            type="number"
            :min="2000"
            :max="3000"
            v-model="searchParam01.YEAR"
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
            required
          ></i-input>
          <i-select
            width="250px"
            :label="$t('사업부')"
            :items="codeList.bsnscd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParam02.BSNS_CD"
          ></i-select>
        </v-sheet>
        <v-sheet height="380px"
          ><Echart :option="chartsOptions" ref="echart" class="echarts_style" autoresize></Echart
        ></v-sheet>
        <v-sheet height="148px">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdSub"
            class="subGrid"
            :grid-view-option="grdSubProps.gridViewOption"
            :column-layout="grdSubProps.columnLayout"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- 재해율목표관리 팝업 -->
  <SAFAD0010Popup ref="sAFAD0010Popup"></SAFAD0010Popup>
  <!-- 주/월간현황 팝업 -->
  <SAFAD0010Popup2 ref="sAFAD0010Popup2"></SAFAD0010Popup2>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
// .echarts_style {
//   height: 350px;
//   width: 100%;
// }

// .subGrid {
//   position: relative;
//   top: -20px;
// }
</style>
