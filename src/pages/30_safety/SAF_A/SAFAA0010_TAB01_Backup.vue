<template>
  <VForm class="searchArea d-flex">
    <i-input width="190px" :label="$t('기간')" type="date" margin="10px" />
    <i-input width="190px" :label="$t('-')" type="date" />
    <i-select
      width="220px"
      :label="$t('구분')"
      margin="12px"
      placeholder="회사"
    />
    <i-select width="200px" margin="12px" placeholder="전사" />
    <i-select width="200px" margin="12px" placeholder="부서" />
    <i-select
      width="200px"
      placeholder="전체/사고/비사고"
      :items="accidentList"
      v-model="accidentValue"
    />
  </VForm>
  <v-sheet>
    <v-row no-gutters>
      <v-col cols="3" class="pa-0">
        <v-card>
          <v-card-title class="pa-0 pb-2">
            {{ accidentValue == "사고" ? "사고 등록" : "비사고 등록" }}
          </v-card-title>
          <v-card-text class="pa-0 topCard">
            <div class="d-flex align-center justify-space-between">
              <div class="pieChartContainer">
                <e-chart :option="pieChartsOptions" autoresize ref="pieChart" />
              </div>
              <div class="tooltip">
                <span> 2024.02.02 </span>
                <span class="bold"> TODAY </span>
              </div>
              <v-row no-gutters>
                <v-col
                  cols="12"
                  class="d-flex justify-space-between pa-4 pt-8 pb-0"
                >
                  <div>총 등록 건수</div>
                  <div>
                    <span class="textBold">
                      {{ totalProvide }}
                    </span>
                    <span> 건 </span>
                  </div>
                </v-col>
                <v-col cols="12" class="d-flex justify-space-between pa-4 pb-0">
                  <div>사고 건수</div>
                  <div>
                    <span class="textBold">
                      {{ accidentProvide }}
                    </span>
                    <span> 건 </span>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="9" class="pa-0 pl-5">
        <v-card>
          <v-card-title class="pa-0 pb-2">
            {{ accidentValue == "사고" ? "사고 구분" : "비사고 구분" }}
          </v-card-title>
          <v-card-text class="pa-0 topCard">
            <v-row no-gutters class="divide py-5">
              <v-col
                cols="2"
                class="pa-0 text-center"
                v-for="(item, index) in divideData"
                :key="index"
              >
                <div class="mt-1">
                  {{ item.label }}
                </div>
                <div class="mt-4">
                  <span class="bold" :style="`color:${item.color}`">
                    {{ item.value }}
                  </span>
                  건
                </div>
                <div class="mt-4 percent">
                  {{ item.percent }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-sheet>
  <v-sheet class="h-auto mt-5">
    <v-row no-gutters>
      <v-col cols="3" class="pa-0">
        <v-card class="d-flex flex-column fill-height">
          <v-card-title class="pa-0 pb-2">
            {{ accidentValue == "사고" ? "사고 유형" : "비사고 유형" }}
          </v-card-title>
          <v-card-text class="pa-0 h-auto">
            <v-row no-gutters class="types" v-if="accidentValue == '사고'">
              <v-col
                cols="3"
                class="pa-0 text-center"
                v-for="(item, index) in typeData"
                :key="index"
              >
                <div class="mt-2">
                  {{ item.label }}
                </div>
                <div class="mt-3">
                  <span class="textBold" :style="`color:${item.color}`">
                    {{ item.value }}
                  </span>
                  건
                </div>
                <div class="percent">
                  <v-progress-linear
                    :color="calcColor(item.percent)"
                    :model-value="item.percent"
                    height="8"
                    rounded
                  ></v-progress-linear>
                </div>
              </v-col>
            </v-row>
            <v-row no-gutters class="nonTypes" v-else>
              <v-col
                cols="6"
                class="pa-2 text-center"
                v-for="(item, index) in nonAccidentData"
                :key="index"
              >
                <div class="mt-7 d-flex justify-space-between">
                  <span>
                    {{ item.label }}
                  </span>
                  <span>
                    <span class="textBold" :style="`color:${item.color}`">
                      {{ item.value }}
                    </span>
                    건
                  </span>
                </div>
                <div class="percent">
                  <v-progress-linear
                    :color="calcColor(item.percent)"
                    :model-value="item.percent"
                    height="8"
                    rounded
                  ></v-progress-linear>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="9" class="pa-0 pl-5">
        <v-card class="d-flex flex-column fill-height">
          <v-card-title class="pa-0 pb-2">
            {{ accidentValue == "사고" ? "사고 현황" : "비사고 현황" }}
          </v-card-title>
          <v-card-text class="pa-0 h-auto">
            <!-- <div class="pa-4"> -->
            <v-row no-gutters class="pa-4">
              <!-- <div class="chartContainer"> -->
              <v-col class="pa-0">
                <e-chart :option="lineChartsOptions" />
              </v-col>
              <!-- </div> -->
              <v-col class="pa-0">
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                />
              </v-col>
            </v-row>
            <!-- </div> -->
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<script setup>
//그리드 속성셋팅
import { useI18n } from "vue-i18n"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)

const totalProvide = ref(600)
const accidentProvide = ref(510)

const accidentList = ref(["사고", "비사고"])
const accidentValue = ref("사고")
const pieChart = ref()

watch(
  () => accidentValue.value,
  (e) => {
    if (e == "사고") {
      pieChartsOptions.value.series[0].data = [90, 510]
      pieChartsOptions.value.series[0].label.formatter = [
        `{border|${(accidentProvide.value / totalProvide.value) * 100}}%`,
        "{sub|작업성}",
      ].join("\n")
      lineChartsOptions.value.yAxis[0].max = 50
    } else {
      pieChartsOptions.value.series[0].data = [510, 90]
      pieChartsOptions.value.series[0].label.formatter = [
        `{border|${100 - (accidentProvide.value / totalProvide.value) * 100}}%`,
        "{sub|비작업성}",
      ].join("\n")
      lineChartsOptions.value.yAxis[0].max = 70
    }
  }
)

const pieChartsOptions = ref({
  series: [
    {
      name: "pie",
      type: "pie",
      color: ["#E3E3E3", "#1A40C7"],
      radius: ["75%", "95%"],
      startAngle: 90,
      endAngle: -270,
      silent: true,
      avoidLabelOverlap: true,
      emphasis: {
        label: {
          show: false,
        },
      },
      label: {
        position: "center",
        fontSize: 14,
        fontWeight: 700,
        formatter: [
          `{border|${(accidentProvide.value / totalProvide.value) * 100}}%`,
          "{sub|사고성}",
        ].join("\n"),
        rich: {
          border: {
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 50,
            color: "#000",
          },
          sub: {
            fontSize: 10,
            fontWeight: 400,
            color: "#000",
          },
        },
      },
      labelLine: {
        show: false,
      },
      data: [90, 510],
    },
  ],
})
const lineChartsOptions = ref({
  grid: {
    left: "5%",
    right: "2%",
    bottom: "7%",
  },
  legend: {
    data: ["중대재해", "중대(상)", "산재", "휴업", "물적/아차", "일반", "합계"],
  },
  xAxis: [
    {
      type: "category",
      data: [
        "1월",
        "2월",
        "3월",
        "4월",
        "5월",
        "6월",
        "7월",
        "8월",
        "9월",
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
  series: [
    {
      name: "중대재해",
      type: "bar",
      color: "#1A40C7",
      data: [2, 4, 7, 23, 25, 26, 13, 16, 32, 20, 6, 3],
    },
    {
      name: "중대(상)",
      type: "bar",
      color: "#0581FD",
      data: [1, 0, 1, 13, 5, 16, 23, 16, 12, 3, 6, 3],
    },
    {
      name: "산재",
      type: "bar",
      color: "#4C5DFA",
      data: [1, 4, 3, 3, 5, 3, 3, 16, 18, 22, 6, 3],
    },
    {
      name: "휴업",
      type: "bar",
      color: "#16C3F4",
      data: [2, 4, 7, 13, 15, 16, 13, 22, 1, 12, 6, 3],
    },
    {
      name: "물적/아차",
      type: "bar",
      color: "#94C81B",
      data: [2, 4, 7, 23, 25, 3, 3, 6, 2, 2, 1, 8],
    },
    {
      name: "일반",
      type: "bar",
      color: "#4A4D56",
      data: [2, 4, 7, 25, 21, 13, 10, 18, 12, 28, 8, 7],
    },
    {
      name: "합계",
      type: "line",
      color: "#0BB69C",
      data: [22, 24, 37, 43, 35, 42, 33, 46, 32, 40, 36, 32],
    },
  ],
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: "COL1",
      dataType: "text",
      header: { text: t("구 분") },
      width: "100",
    },
    {
      fieldName: "COL2",
      dataType: "text",
      header: { text: t("1월") },
      width: "40",
    },
    {
      fieldName: "COL3",
      dataType: "text",
      header: { text: t("2월") },
      width: "40",
    },
    {
      fieldName: "COL4",
      dataType: "text",
      header: { text: t("3월") },
      width: "40",
    },
    {
      fieldName: "COL5",
      dataType: "text",
      header: { text: t("4월") },
      width: "40",
    },
    {
      fieldName: "COL6",
      dataType: "text",
      header: { text: t("5월") },
      width: "40",
    },
    {
      fieldName: "COL7",
      dataType: "text",
      header: { text: t("6월") },
      width: "40",
    },
    {
      fieldName: "COL8",
      dataType: "text",
      header: { text: t("7월") },
      width: "40",
    },
    {
      fieldName: "COL9",
      dataType: "text",
      header: { text: t("8월") },
      width: "40",
    },
    {
      fieldName: "COL10",
      dataType: "text",
      header: { text: t("9월") },
      width: "40",
    },
    {
      fieldName: "COL11",
      dataType: "text",
      header: { text: t("10월") },
      width: "40",
    },
    {
      fieldName: "COL12",
      dataType: "text",
      header: { text: t("11월") },
      width: "40",
    },
    {
      fieldName: "COL13",
      dataType: "text",
      header: { text: t("12월") },
      width: "40",
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 데이터 입력
const data = [
  {
    COL1: "중대재해",
    COL2: "",
    COL3: " ",
    COL4: "",
    COL5: "",
    COL6: "",
    COL7: "",
    COL8: "",
    COL9: "",
    COL10: "",
    COL11: "",
    COL12: "",
    COL13: "",
  },
  {
    COL1: "중대(상)",
    COL2: "3",
    COL3: "6 ",
    COL4: "4",
    COL5: "3",
    COL6: "9",
    COL7: "2",
    COL8: "3",
    COL9: "4",
    COL10: "9",
    COL11: "1",
    COL12: "4",
    COL13: "2",
  },
  {
    COL1: "산재",
    COL2: "",
    COL3: " ",
    COL4: "",
    COL5: "",
    COL6: "",
    COL7: "",
    COL8: "",
    COL9: "",
    COL10: "",
    COL11: "",
    COL12: "",
    COL13: "",
  },
  {
    COL1: "휴업",
    COL2: "",
    COL3: " ",
    COL4: "",
    COL5: "",
    COL6: "",
    COL7: "",
    COL8: "",
    COL9: "",
    COL10: "",
    COL11: "",
    COL12: "",
    COL13: "",
  },
  {
    COL1: "물적/아차",
    COL2: "",
    COL3: " ",
    COL4: "",
    COL5: "",
    COL6: "",
    COL7: "",
    COL8: "",
    COL9: "",
    COL10: "",
    COL11: "",
    COL12: "",
    COL13: "",
  },
  {
    COL1: "일반",
    COL2: "",
    COL3: " ",
    COL4: "",
    COL5: "",
    COL6: "",
    COL7: "",
    COL8: "",
    COL9: "",
    COL10: "",
    COL11: "",
    COL12: "",
    COL13: "",
  },
  {
    COL1: "합계",
    COL2: "3",
    COL3: "6 ",
    COL4: "4",
    COL5: "3",
    COL6: "9",
    COL7: "2",
    COL8: "3",
    COL9: "4",
    COL10: "9",
    COL11: "1",
    COL12: "4",
    COL13: "2",
  },
]

onMounted(() => {
  grdMain.value.getDataProvider().setRows(data)

  grdMain.value.getGridView().setRowIndicator({
    visible: false,
  })
  grdMain.value.getGridView().displayOptions.rowHeight = 40
})
const calcColor = (percent) => {
  if (percent <= 10) {
    return "#0581FD"
  } else if (percent <= 30) {
    return "#16C3F4"
  } else if (percent <= 50) {
    return "#FEBF32"
  } else if (percent <= 80) {
    return "#FF7637"
  } else if (percent <= 100) {
    return "#FF5252"
  }
}

const nonAccidentData = ref([
  {
    label: "근골격계",
    value: "10",
    percent: 10,
  },
  {
    label: "출퇴근재해",
    value: "14",
    percent: 14,
  },
  {
    label: "질환",
    value: "45",
    percent: 45,
  },
  {
    label: "교통(비사고)",
    value: "78",
    percent: 78,
  },
  {
    label: "운동경기",
    value: "10",
    percent: 10,
  },
  {
    label: "기타",
    value: "99",
    percent: 99,
  },
])

const typeData = ref([
  {
    label: "떨어짐",
    value: "10",
    percent: 10,
  },
  {
    label: "넘어짐",
    value: "14",
    percent: 14,
  },
  {
    label: "깔림",
    value: "45",
    percent: 45,
  },
  {
    label: "부딛힘",
    value: "78",
    percent: 78,
  },
  {
    label: "맞음",
    value: "10",
    percent: 10,
  },
  {
    label: "무너짐",
    value: "99",
    percent: 99,
  },
  {
    label: "끼임/감김",
    value: "12",
    percent: 12,
  },
  {
    label: "절단/베임/찔림",
    value: "13",
    percent: 13,
  },
  {
    label: "감전",
    value: "10",
    percent: 10,
  },
  {
    label: "폭발",
    value: "14",
    percent: 14,
  },
  {
    label: "화재",
    value: "02",
    percent: 2,
  },
  {
    label: "교통(사고성)",
    value: "02",
    percent: 2,
  },
  {
    label: "이상온도접촉",
    value: "10",
    percent: 10,
  },
  {
    label: "유해물질접촉",
    value: "16",
    percent: 16,
  },
  {
    label: "무리한동작",
    value: "01",
    percent: 1,
  },
  {
    label: "기타",
    value: "13",
    percent: 13,
  },
])
const divideData = ref([
  {
    label: "중대재해",
    value: "01",
    percent: "0.00%",
    color: "#1A40C7",
  },
  {
    label: "중대(성)",
    value: "14",
    percent: "0.00%",
    color: "#0581FD",
  },
  {
    label: "산재",
    value: "111",
    percent: "0.00%",
    color: "#4C5DFA",
  },
  {
    label: "휴업",
    value: "200",
    percent: "0.00%",
    color: "#16C3F4",
  },
  {
    label: "물적/아차",
    value: "55",
    percent: "0.00%",
    color: "#94C81B",
  },
  {
    label: "일반",
    value: "300",
    percent: "0.00%",
    color: "#4A4D56",
  },
])
</script>

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
  .topCard {
    height: 150px;
  }
  .tooltip {
    color: #1d43ca;
    position: absolute;
    right: 16px;
    top: 16px;
    .bold {
      font-weight: 700;
    }
  }
}
.textBold {
  font-size: 28px;
  font-weight: 700;
}

.divide {
  font-size: 16px;
  .bold {
    font-size: 28px;
    font-weight: 700;
  }
  .percent {
    font-size: 16px;
    color: #666666;
  }
  .v-col {
    border-right: #e4e4e4 1px solid;
    height: 100px;
  }
  .v-col:last-child {
    border: none;
  }
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
    border-right: #e4e4e4 1px solid;
    border-bottom: #e4e4e4 1px solid;
    height: 25%;
    position: relative;
  }
  .v-col:nth-child(4) {
    border-right: none;
  }
  .v-col:nth-child(8) {
    border-right: none;
  }
  .v-col:nth-child(12) {
    border-right: none;
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
  padding-left: 20px;
  padding-right: 40px;
  height: 150px;
  max-height: 150px;
  width: 210px;
}
</style>
