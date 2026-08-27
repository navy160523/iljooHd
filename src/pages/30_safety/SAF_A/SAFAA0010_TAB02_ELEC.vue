<!-- SI2팀 김성근 재해 dashBoard -->

<!-- SI2팀 김성근 사고/통계 대시보드 -->

<script setup>
//그리드 속성셋팅
import { useI18n } from "vue-i18n"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import dayjs from "dayjs"
import { onMounted, reactive, ref } from "vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"

import Echart from "vue-echarts"
import { CanvasRenderer } from "echarts/renderers"
import { color, use } from "echarts/core"
import { LineChart, BarChart, PieChart } from "echarts/charts"
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
} from "echarts/components"


defineOptions({
  name: "30_safety-SAF_A-SAFAA0010_TAB02",
})

use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  BarChart,
  PieChart,
])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다ass국어
const userStore = useUserStore() //유저정보
const props = defineProps({
  plzTongSearch: { type: Boolean, default: false },
  TongData: { type: Object, default: () => [] },
})
const emit = defineEmits(["TongParam"])
const menuTitle = ref(null)
const grdMain = ref(null)
const BsnsDeptNM = ref(null)
const totalProvide = ref(600)
const accidentProvide = ref(510)
const today = ref(dayjs().format("YYYY.MM.DD"))
const chart1 = ref(null)
const pieChart = ref()
const yearBind = ref(dayjs().format("YYYY"))
const SearchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "",
  DEPT_CD: "",
  YEAR: dayjs().format("YYYY"),
  WEEK_MONTH: "",
  GBN: "",
})
const codeList = reactive({
  GBN: [
    { COD: "W", TXT: "주간" },
    { COD: "M", TXT: "월간" },
  ],
})
const NOCMPNY = ref(false)
const NOBSNS = ref(true)
const chartDraw = ref(0)
const ISmortalityU = ref(false)
// 전사 재해율
const mortalityR = reactive([
  {
    name: `${dayjs().format("YYYY")}년도 기준 재해율`,
    value: 0,
  },
  {
    name: "금일 기준 재해율",
    value: 0,
  },
  {
    name: `${dayjs().format("YYYY")}년도 실적 재해율`,
    value: 0,
  },
])
// 사업부 재해율
const mortalityB = reactive([
  { BSNS_NM: "엔진기계사업부", SAGO_RATE: 0, ACC_RATE_PLN: 0 },
  { BSNS_NM: "경영지원본부", SAGO_RATE: 0, ACC_RATE_PLN: 0 },
  { BSNS_NM: "조선해양사업부", SAGO_RATE: 0, ACC_RATE_PLN: 0 },
  { BSNS_NM: "특수선사업부", SAGO_RATE: 0, ACC_RATE_PLN: 0 },
])

// 재해유형
const mortalityU = reactive([])

// 차트

onMounted(() => {
  Promise.all([
    getCodeList("HHIZ000"), //회사구분 조회
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: SearchParam.CMPNY_DIV, USE_DIV: "N" },
    }),

    getCodeList("HHIB010"),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR

    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    SearchParam.GBN = "M"
  })

  // console.log(!mortalityU.value, "mortalityU");
})

const searchdashBoard = () => {
  mortalityB.length = 0
  mortalityU.length = 0

  if (props.TongData.ORESULT_CUR.length != 0) {
    mortalityR.map((x) => {
      if (x.name.includes(`년도 기준 재해율`)) {
        x.value = props.TongData.ORESULT_CUR[0].ACC_RATE_PLN
      }
      if (x.name.includes("금일 기준 재해율")) {
        x.value = props.TongData.ORESULT_CUR[0].TODAY_RATE_PLN
      }
      if (x.name.includes(`실적 재해율`)) {
        x.value = props.TongData.ORESULT_CUR[0].SAGO_RATE
      }
    })
  } else {
    mortalityR.map((x) => {
      if (x.name.includes(`년도 기준 재해율`)) {
        x.value = 0
      }
      if (x.name.includes("금일 기준 재해율")) {
        x.value = 0
      }
      if (x.name.includes(`실적 재해율`)) {
        x.value = 0
      }
    })
  }

  for (let i in props.TongData.ORESULT_CUR2) {
    mortalityB[i] = props.TongData.ORESULT_CUR2[i]
  }

  for (let i in props.TongData.ORESULT_CUR3) {
    mortalityU[i] = props.TongData.ORESULT_CUR3[i]
  }
  console.log(mortalityU,'mortalityU')

  let NameArr = []
  let MonthArr = []
  let result = []
  let DEPT_NM = ''

  
  
  props.TongData.ORESULT_CUR4.forEach((item, index) => {
    if (!result[item.BSNS_NM]) {
  // SearchParam.DEPT_CD ?
      // console.log(item,'ddd')
      result[item.BSNS_NM] = {}
      result[item.BSNS_NM].data = []
      if(SearchParam.DEPT_CD){
      DEPT_NM = codeList.DEPT_CD.filter((x=>x.DEPT_CD === SearchParam.DEPT_CD))
      console.log(DEPT_NM,'DEPT_NM')
      result[item.BSNS_NM].name = DEPT_NM[0].DEPT_NM 
      }
      else{
        result[item.BSNS_NM].name = item.BSNS_NM
      }
      result[item.BSNS_NM].type = item.BSNS_NM === "합계" ? "line" : "bar"

      NameArr.push(SearchParam.DEPT_CD ? DEPT_NM[0].DEPT_NM : item.BSNS_NM)
      console.log(NameArr,'NameArr')
    }
    result[item.BSNS_NM].data.push(item.SAGO_CNT)

    SearchParam.GBN == "W"
      ? MonthArr.push(item.WEEK)
      : MonthArr.push(item.MONTH)
  })

  lineChartsOptions.value.series = []
  let setMonthArr = new Set([...MonthArr])
  console.log(NameArr, "NameArr")
  console.log(result, "result")

  // 차트legend
  lineChartsOptions.value.legend.data = NameArr

  let MonthFormat = [...setMonthArr].map((x) =>
    SearchParam.GBN == "W" ? x + "주" : x + "월"
  )

  // xAxis

  lineChartsOptions.value.xAxis[0].data = MonthFormat

  for (let i in result) {
    lineChartsOptions.value.series.push(result[i])
  }

  lineChartsOptions.value.yAxis[0].max = !!result["합계"]
    ? Math.max.apply(null, result["합계"].data)
    : 30

  lineChartsOptions.value.yAxis[0].max = lineChartsOptions.value.yAxis[0].max + 10

  console.log(lineChartsOptions.value.series, "result")
  if(SearchParam.DEPT_CD){
    BsnsDeptNM.value = '부서 재해율'
  }
  else{
    BsnsDeptNM.value = '사업부 재해율'
  }
  //  chart1.value.setOption(lineChartsOptions.value)
}

// props 감지
watch(
  () => props.plzTongSearch,
  (newValue) => {
    if (newValue) {
      emit("TongParam", SearchParam)
      console.log(newValue)
    } else {
      chartDraw.value += 1
      console.log("hihihi")
      searchdashBoard()
    }
  }
)

//  회사변경 감지
watch(
  () => SearchParam.CMPNY_DIV,
  (newValue) => {
    if (!newValue) {
      NOCMPNY.value = true
      SearchParam.BSNS_CD = ""
      SearchParam.DEPT_CD = ""
    }

    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: newValue, USE_DIV: "N" },
    }).then((res) => {
      SearchParam.BSNS_CD = ""
      codeList.BSNS_CD = res.ORESULT_CUR
      codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
      NOCMPNY.value = false
    })
  }
)

// 사업부 변경감지
watch(
  () => SearchParam.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NOBSNS.value = true
      SearchParam.DEPT_CD = ""
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: SearchParam.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        console.log(res, "res")
        SearchParam.DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NOBSNS.value = false
      })
    }
  }
)

watch(
  () => mortalityU[0],
  (e) => {
    ISmortalityU.value = true
  }
)

watch(
  () => SearchParam.GBN,
  (e) => {
    codeList.WEEK_MONTH = []
    SearchParam.WEEK_MONTH = ""
    if (e === "W") {
      for (let i = 1; i <= 52; i++) {
        codeList.WEEK_MONTH.push(i)
      }
    } else {
      for (let i = 1; i <= 12; i++) {
        codeList.WEEK_MONTH.push(i)
      }
      SearchParam.WEEK_MONTH = dayjs().format("M")
    }
  }
)

const updateYear = (e) => {
  yearBind.value = e
  console.log(yearBind.value, "yearBind")
  // console.log(e, "e");
}

const lineChartsOptions = ref({
  grid: {
    left: "5%",
    right: "2%",
    bottom: "7%",
  },
  legend: {
    data: [""],
  },
  xAxis: [
    {
      type: "category",
      data: [
        "01월",
        "02월",
        "03월",
        "04월",
        "05월",
        "06월",
        "07월",
        "08월",
        "09월",
        "10월",
        "11월",
        "12월",
      ],
    },
  ],
  yAxis: [
    {
      type: "value",
      min: 0,
      max: 50,
      interval: 10,
    },
  ],
  series: [],

  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
})
const calcColor = (percent) => {
  console.log(percent, "percent")
  if (percent <= 5) {
    return "#1E88E5"
  } else if (percent > 5 && percent <= 10) {
    return "#1976D2"
  } else if (percent > 10 && percent <= 15) {
    return "#1565C0"
  } else if (percent > 15) {
    return "#0D47A1"
  }
}

const typeData = ref([
  {
    label: "떨어짐",
    value: "0",
    percent: 0,
  },
  {
    label: "넘어짐",
    value: "0",
    percent: 0,
  },
  {
    label: "깔림",
    value: "0",
    percent: 0,
  },
  {
    label: "부딛힘",
    value: "0",
    percent: 0,
  },
  {
    label: "맞음",
    value: "0",
    percent: 0,
  },
  {
    label: "무너짐",
    value: "0",
    percent: 0,
  },
  {
    label: "끼임/감김",
    value: "0",
    percent: 0,
  },
  {
    label: "절단/베임/찔림",
    value: "0",
    percent: 0,
  },
  {
    label: "감전",
    value: "0",
    percent: 0,
  },
  {
    label: "폭발",
    value: "0",
    percent: 0,
  },
  {
    label: "화재",
    value: "0",
    percent: 0,
  },
  {
    label: "교통(사고성)",
    value: "0",
    percent: 0,
  },
  {
    label: "이상온도접촉",
    value: "0",
    percent: 0,
  },
  {
    label: "유해물질접촉",
    value: "0",
    percent: 0,
  },
  {
    label: "무리한동작",
    value: "0",
    percent: 0,
  },
  {
    label: "기타",
    value: "0",
    percent: 0,
  },
])
</script>

<template>
  <VForm class="searchArea d-flex">
    <i-select
      width="180px"
      :label="$t('년도')"
      v-model="SearchParam.YEAR"
      label-width="30px"
      type="YEAR"
      margin="10px"
      required
      :minYear="2024"
      @update:model-value="updateYear(SearchParam.YEAR)"
      />
      <!-- readonly -->
    <i-select
      width="200px"
      labelWidth="48px"
      :label="$t('주간/월')"
      v-model="SearchParam.GBN"
      :items="codeList.GBN"
      item-value="COD"
      item-title="TXT"
      required
    />
    <i-select
      width="180px"
      :label="SearchParam.GBN === 'W' ? t('주간') : t('월')"
      v-model="SearchParam.WEEK_MONTH"
      :items="codeList.WEEK_MONTH"
    />

    <i-select
      width="220px"
      :label="$t('회사')"
      margin="12px"
      placeholder="회사"
      v-model="SearchParam.CMPNY_DIV"
      :items="codeList.company"
      item-value="COD"
      item-title="TXT"
      required
    />
    <i-select
      :label="$t('사업부')"
      width="200px"
      margin="12px"
      placeholder="사업부"
      v-model="SearchParam.BSNS_CD"
      :items="codeList.BSNS_CD"
      item-value="BSNS_CD"
      item-title="BSNS_NM"
      :disabled="NOCMPNY"
    />
    <i-select
      :label="$t('부서')"
      width="240px"
      margin="12px"
      placeholder="부서"
      v-model="SearchParam.DEPT_CD"
      :items="codeList.DEPT_CD"
      item-value="DEPT_CD"
      item-title="DEPT_NM"
      :disabled="NOBSNS"
    />
  </VForm>

  <v-sheet class="fill-height pb-3">
    <div class="h-grow fill-height">
      <!-- 왼쪽  -->
      <v-sheet width="370px" class="pa-0 mr-3 d-flex flex-column">
        <div class="d-flex flex-column fill-height justify-space-between">
          <!-- 전사 재해율 -->
          <v-sheet height="210px" class="mb-0">
            <v-card class="pa-0">
              <v-card-title class="pa-0 pb-2"> 전사 재해율 </v-card-title>
              <v-card-text class="pa-0">
                <v-sheet>
                  <div
                    style="padding: 0 9px"
                    v-for="(item, index) in mortalityR"
                    :key="index"
                  >
                    <div
                      class="content d-flex align-center justify-space-between"
                      :style="{
                        borderBottom: index === 1 ? '1px solid #e4e4e4' : '',
                        borderTop: index === 1 ? '1px solid #e4e4e4' : '',
                        padding: '16px 0',
                      }"
                    >
                      <span :class="index === 2 ? 'w-700 pointColor' : ''">
                        {{ item.name }}
                      </span>
                      <span>
                        <span
                          :class="
                            index === 2 ? 'textBold pointColor' : 'textBold'
                          "
                          >{{ item.value }}
                        </span>
                        %
                      </span>
                    </div>
                  </div>
                </v-sheet>
              </v-card-text>
            </v-card>
          </v-sheet>
          <!-- 사업부 재해율 -->
          <v-sheet class="mb-0" style="height: 467px">
            <v-card class="pa-0 h-auto">
              <v-card-title class="pa-0 py-2"> 사업부 재해율 </v-card-title>
              <v-card-text class="pa-0 h-auto pl-2 pr-2" style="overflow: auto">
                <div class="d-flex flex-column h-auto justify-space-between">
                  <div
                    class="depart mt-2"
                    v-for="(item, index) in mortalityB"
                    :key="index"
                  >
                    {{ item.DEPT_NM ? item.DEPT_NM : item.BSNS_NM  }}
                    <div class="d-flex justify-space-around my-3">
                      <div class="innerBox">
                        <div class="label">목표</div>
                        <div class="value">
                          <span class="textBold">
                            {{ item.ACC_RATE_PLN }}
                          </span>
                          %
                        </div>
                      </div>

                      <div class="innerBox">
                        <div class="label">실적</div>
                        <div class="value">
                          <span class="textBold">
                            {{ item.SAGO_RATE }}
                          </span>
                          %
                        </div>
                      </div>
                    </div>
                    <v-divider v-if="index !== 3" />
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-sheet>
        </div>
      </v-sheet>
      <!-- 가운대  재해유형 -->
      <v-sheet width="580px" class="pa-0 mr-3">
        <v-card class="d-flex flex-column fill-height">
          <v-card-title class="pa-0 pb-2"> 재해유형 </v-card-title>
          <v-card-text class="pa-0 fill-height">
            <div
              class="d-flex flex-wrap justify-center fill-height"
              v-if="ISmortalityU"
            >
              <div
                class="mortalityUDiv"
                v-for="(item, index) in mortalityU.filter(
                  (x) => x.GBN !== '전체'
                )"
                :key="index"
                :style="{
                  borderBottom: index < 12 ? '1px solid #e4e4e4' : '',
                }"
              >
                <div
                  :style="{
                    borderRight:
                      (index + 1) % 4 !== 0 ? '1px solid #e4e4e4' : '',
                    padding: '0 8px',
                    height: '80%',
                  }"
                >
                  <!-- 분류 -->
                  <div style="font-size: 14px" class="my-1 TextOverFlow">
                    {{ item.GBN }}
                  </div>

                  <!-- 건수 -->
                  <div class="mb-1">
                    <span class="textBold">
                      {{ item.CNT }}
                    </span>
                    건
                  </div>
                  <!-- 바차트 -->
                  <div>
                    <v-progress-circular
                      :model-value="
                        !isFinite(((item.CNT / mortalityU[0].CNT) * 100).toFixed(2))
                          ? `0.00`
                          : ((item.CNT / mortalityU[0].CNT) * 100).toFixed(2)
                      "
                      :size="70"
                      :width="7"
                      :color="
                        calcColor(
                          ((item.CNT / mortalityU[0].CNT) * 100).toFixed(2)
                        )
                      "
                    >
                      {{
                          !isFinite(((item.CNT / mortalityU[0].CNT) * 100).toFixed(2))
                          ? `0.00`
                          : ((item.CNT / mortalityU[0].CNT) * 100).toFixed(2)
                      }}
                      %
                    </v-progress-circular>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-sheet>

      <!-- 사고 현황 -->
      <v-sheet class="pa-0 h-auto">
        <v-card class="pa-0 h-auto">
          <v-card-title class="pa-0 pb-2"> 재해통계 현황 </v-card-title>
          <v-card-text class="pa-0">
            <e-chart :option="lineChartsOptions" :key="chartDraw" />
          </v-card-text>
        </v-card>
      </v-sheet>
    </div>
  </v-sheet>
</template>

<style scoped lang="scss">
.v-card-title {
  color: #222;
  font-size: 18px;
  font-weight: 700;
}
.v-card-text {
  border: #e4e4e4 1px solid;
  border-radius: 3px;
  color: #222;
  position: relative;
}
.textBold {
  font-size: 26px;
  font-weight: 700;
}

.divide {
  font-size: 18px;
  .bold {
    font-size: 30px;
    font-weight: 700;
  }
  .percent {
    font-size: 18px;
    color: #666666;
  }
  .v-col {
    border-right: #e4e4e4 1px solid;
    // height:150px;
  }
  .v-col:last-child {
    border: none;
  }
  border-bottom: #e4e4e4 1px solid;
}
.divide:last-child {
  border: none;
}
.divide_col {
  border-right: #e4e4e4 1px solid;
}
.topCard {
}
.nonTypes {
  .v-col {
    border-right: #e4e4e4 1px solid;
    border-bottom: #e4e4e4 1px solid;
    height: 33.3%;
    position: relative;
  }
  .v-col:nth-child(2) {
    border-right: none;
  }
  .v-col:nth-child(4) {
    border-right: none;
  }
  .v-col:nth-child(5) {
    border-bottom: none;
  }
  .v-col:last-child {
    border-right: none;
    border-bottom: none;
  }
  .percent {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
  }
}
.types {
  .v-col {
    // border-right: #E4E4E4 1px solid;
    // border-bottom: #E4E4E4 1px solid;
    height: 23%;
    position: relative;
  }

  .v-col:nth-child(4) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:nth-child(8) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:nth-child(12) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:nth-child(13) {
    border-bottom: none;
  }
  .v-col:nth-child(14) {
    border-bottom: none;
  }
  .v-col:nth-child(15) {
    border-bottom: none;
  }
  .v-col:nth-child(16) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:last-child {
    border-right: none;
    border-bottom: none;
  }
  .percent {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
  }
}
.pieChartContainer {
  margin: 8px auto;
  height: 200px;
  max-height: 241px;
  width: 250px;
  text-align: center;
}
.pieChartContainer2 {
  // padding-left: 10px;
  // padding-right: 40px;
  height: 100px;
  max-height: 100px;
  width: 80px;
  margin: 0 0 0 15px;
}
.title {
  font-size: 14pt;
}
.tooltip {
  color: #1d43ca;
  .bold {
    font-weight: 700;
  }
}

.H2TextBox {
  width: 160px;
  font-size: 14px;
  font-weight: 400;
  margin: 16px 10px;
}

.normal {
  width: 90px;
  display: inline-block;
}

.top-emphasis {
  font-size: 28px;
  width: 57px;
  text-align: right;
  font-weight: 800;
  display: inline-block;
}
.bottom-emphasis {
  font-size: 26px;
  font-weight: 800;
}
.mortalityUDiv {
  box-sizing: border-box;
  width: 144px;
  height: 25%;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.TextOverFlow {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pointColor {
  color: #1a40c7;
}

.depart {
  height: 25%;
  .value {
    text-align: right;
  }
  .innerBox {
    background-color: #f7f7f7;
    width: 48%;
    justify-content: space-between;
    display: flex;
    padding: 8px;
  }
  .innerBox:nth-child(2) {
    background-color: #f3f5fc;
    color: #1a40c7;
  }
}
</style>
