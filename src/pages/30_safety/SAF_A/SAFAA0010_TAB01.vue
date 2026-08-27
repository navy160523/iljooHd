<!-- SI2팀 김성근 사고 대시보드 -->

<script setup>
//그리드 속성셋팅
import { useI18n } from "vue-i18n"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import dayjs from "dayjs"
import { onMounted, reactive } from "vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"

defineOptions({
  name: "30_safety-SAF_A-SAFAA0010_TAB01",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const props = defineProps({
  plzSagoSearch: { type: Boolean, default: false },
  SagoData: { type: Object, default: () => [] },
})
const emit = defineEmits(["SearchParam"])
const menuTitle = ref(null)
const grdMain = ref(null)

const totalProvide = ref(600)
const accidentProvide = ref(510)
const today = ref(dayjs().format("YYYY.MM.DD"))
const sAFAD0010Popup2 = ref(null)
const pieChart = ref()
const SearchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM: dayjs().startOf("year").format("YYYY-MM-DD"),
  TO: dayjs().format("YYYY-MM-DD"),
  SAGO_GBN: "A",
  BSNS_CD: "",
  DEPT_CD: "",
})
const codeList = reactive({})
const NOCMPNY = ref(false)
const NOBSNS = ref(true)

const ISSagoU = ref(false)
// 사고 데이터
//  사고등록
const SagoD = reactive([
  {
    ALL_CNT: 0,
    COME_SERIOUS_CNT: 0,
    JUNGDAE_CNT: 0,
    SAGO_CNT: 0,
  },
])

//사고구분
const SagoG = reactive([
  { label: "총갯수", value: "0" },
  {
    label: "산재",
    value: "0",
    percent: "0.00%",
    color: "#4C5DFA",
  },
  {
    label: "휴업",
    value: "0",
    percent: "0.00%",
    color: "#16C3F4",
  },
  {
    label: "경미공상",
    value: "0",
    percent: "0.00%",
    color: "#94C81B",
  },
  {
    label: "일반",
    value: "0",
    percent: "0.00%",
    color: "#4A4D56",
  },
])

// 사고유형

const SagoU = reactive([])

// 사고현황
const SagoH = reactive([])

// 비사고 데이터
// 비사고 갯수
const BSagoC = ref(0)
// 사고 현황
const TopAllCnt = ref(0)
const MONTH = reactive([])
const SAN_CNT = reactive([])
const HUE_CNT = reactive([])
const MUL_CNT = reactive([])
const IL_CNT = reactive([])
const ALL_CNT = reactive([])
const chartDraw = ref(0)
onMounted(() => {
  Promise.all([
    getCodeList("HHIZ000"), //회사구분 조회
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: SearchParam.CMPNY_DIV, USE_DIV: "N" },
    }),

    getCodeList("HHIB010"),
  ]).then((res) => {
    console.log(res[2], "ddm")
    codeList.company = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR

    codeList.SAGO_GBN = res[2].ORESULT_CUR.filter(
      (x) => x.COD === "A" || x.COD === "B" || x.COD === "D" || x.COD === "E"
    )

    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
  })

  // console.log(!SagoU.value, "SagoU");
})

const searchdashBoard = () => {
  // 초기화
    MONTH.length = 0
    SAN_CNT.length = 0
    HUE_CNT.length = 0
    MUL_CNT.length = 0
    IL_CNT.length = 0
    ALL_CNT.length = 0

  // 사고등록

  SagoD.map((x) => {
    x.ALL_CNT = props.SagoData.ORESULT_CUR[0].ALL_CNT
    x.COME_SERIOUS_CNT = props.SagoData.ORESULT_CUR[0].COME_SERIOUS_CNT
    x.JUNGDAE_CNT = props.SagoData.ORESULT_CUR[0].JUNGDAE_CNT
    x.SAGO_CNT = props.SagoData.ORESULT_CUR[0].SAGO_CNT
  })

  SagoG.map((x) => {
    switch (x.label) {
      case "총갯수":
        x.value = props.SagoData.ORESULT_CUR2[0].ALL_CNT
        break
      case "산재":
        x.value = props.SagoData.ORESULT_CUR2[0].SAN_CNT
        x.percent =
          (props.SagoData.ORESULT_CUR2[0].SAN_CNT /
            props.SagoData.ORESULT_CUR2[0].ALL_CNT) *
          100
        break

      case "휴업":
        x.value = props.SagoData.ORESULT_CUR2[0].HUE_CNT
        x.percent =
          (props.SagoData.ORESULT_CUR2[0].HUE_CNT /
            props.SagoData.ORESULT_CUR2[0].ALL_CNT) *
          100
        break

      case "경미공상":
        x.value = props.SagoData.ORESULT_CUR2[0].MUL_CNT
        x.percent =
          (props.SagoData.ORESULT_CUR2[0].MUL_CNT /
            props.SagoData.ORESULT_CUR2[0].ALL_CNT) *
          100
        break

      case "일반":
        x.value = props.SagoData.ORESULT_CUR2[0].IL_CNT
        x.percent =
          (props.SagoData.ORESULT_CUR2[0].IL_CNT /
            props.SagoData.ORESULT_CUR2[0].ALL_CNT) *
          100
        break
    }

    if (isNaN(x.percent)) {
      x.percent = `0.00%`
    } else {
      x.percent = `${x.percent.toFixed(2)}%`
    }
  })
  SagoU.length = 0
  for (let i in props.SagoData.ORESULT_CUR3) {
    SagoU[i] = props.SagoData.ORESULT_CUR3[i]
  }
  for (let i in props.SagoData.ORESULT_CUR4) {
    SagoH[i] = props.SagoData.ORESULT_CUR4[i]
  }

  BSagoC.value = SagoD[0].ALL_CNT - SagoD[0].SAGO_CNT

  SagoH.sort((a, b) => {
    if (a.MONTH < b.MONTH) return -1
    if (a.MONTH > b.MONTH) return 1
    return 0
  })

  for (let i in SagoH) {
    MONTH.push(SagoH[i].MONTH)
    SAN_CNT.push(SagoH[i].SAN_CNT)
    HUE_CNT.push(SagoH[i].HUE_CNT)
    MUL_CNT.push(SagoH[i].MUL_CNT)
    IL_CNT.push(SagoH[i].IL_CNT)
    ALL_CNT.push(SagoH[i].ALL_CNT)
    console.log(SagoH[i],'iiiiii')
  }

  // console.log(MONTH,SAN_CNT,HUE_CNT,MUL_CNT,IL_CNT,ALL_CNT)
  // console.log(MONTH,SAN_CNT,HUE_CNT,MUL_CNT,IL_CNT,ALL_CNT)
  // console.log(MONTH,SAN_CNT,HUE_CNT,MUL_CNT,IL_CNT,ALL_CNT)
  // console.log(MONTH,SAN_CNT,HUE_CNT,MUL_CNT,IL_CNT,ALL_CNT)
  // console.log(MONTH,SAN_CNT,HUE_CNT,MUL_CNT,IL_CNT,ALL_CNT)

  let topCnt = SagoH.reduce((max, obj) =>
    max.ALL_CNT > obj.ALL_CNT ? max : obj
  ).ALL_CNT
  TopAllCnt.value = 0
  TopAllCnt.value = topCnt + 10
  let MONTHChang = MONTH.map((x) => {
    return `${x}월`
  })

  console.log(TopAllCnt.value,'TopAㅁㄴㅇㄴㅁㅇllCnt.value')


  lineChartsOptions.value.series.map((x) => {
    switch (x.name) {
      case "산재":
        x.data = [...SAN_CNT]
        break
      case "휴업":
        x.data = [...HUE_CNT]
        break

      case "경미공상":
        x.data = [...MUL_CNT]
        break

      case "일반":
        x.data = [...IL_CNT]
        break

      case "합계":
        x.data = [...ALL_CNT]
        break
    }
  })

  lineChartsOptions.value.yAxis.map((x) => {
    x.max = TopAllCnt.value
  })



    if(SearchParam.SAGO_GBN ==='A'){
      SagoType.value ='작업성'
    }
    if(SearchParam.SAGO_GBN ==='B'){
      SagoType.value ='비작업성'
    }
    if(SearchParam.SAGO_GBN ==='D'){
      SagoType.value ='물적'
    }
    if(SearchParam.SAGO_GBN ==='E'){
      SagoType.value ='아차'
    }


  console.log(lineChartsOptions.value.series, "result")
}

// props 감지
watch(
  () => props.plzSagoSearch,
  (newValue) => {
    if (newValue) {
      emit("SearchParam", SearchParam)
    } else {
      searchdashBoard()
      chartDraw.value += 1
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
        SearchParam.DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NOBSNS.value = false
      })
    }
  }
)

watch(
  () => SagoU[0],
  (e) => {
    ISSagoU.value = true
  }
)

// watch(
//   () => SearchParam.SAGO_GBN,
//   (e) => {
//     console.log(SagoG, "SagoG.valuas4121dase");

//     if (e == "A" || e == "ALL") {
//       emit("SearchParam", SearchParam);
//       pieChartsOptions.value.series[0].data = [
//         BSagoC.value,
//         SagoD.value.SAGO_CNT,
//       ];
//       pieChartsOptions.value.series[0].label.formatter = [
//         `{border|${(SagoD.value.SAGO_CNT / SagoD.value.ALL_CNT) * 100}}%`,
//         "{sub|사고성}",
//       ].join("\n");
//       lineChartsOptions.value.yAxis[0].max = SagoG.ALL_CNT;
//     } else {
//       emit("SearchParam", SearchParam);
//       pieChartsOptions.value.series[0].data = [
//         SagoD.value.SAGO_CNT,
//         BSagoC.value,
//       ];
//       pieChartsOptions.value.series[0].label.formatter = [
//         `{border|${100 - (SagoD.value.SAGO_CNT / SagoD.value.ALL_CNT) * 100}}%`,
//         "{sub|비사고성}",
//       ].join("\n");
//       lineChartsOptions.value.yAxis[0].max = SagoG.ALL_CNT;
//     }
//   }
// );

const lineChartsOptions = ref({
  grid: {
    left: "5%",
    right: "2%",
    bottom: "7%",
  },
  legend: {
    data: ["산재", "휴업", "경미공상", "일반", "합계"],
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
      max: TopAllCnt.value,
      interval: 10,
    },
  ],
  series: [
    {
      name: "산재",
      type: "bar",
      color: "#4C5DFA",
    },
    {
      name: "휴업",
      type: "bar",
      color: "#16C3F4",
    },
    {
      name: "경미공상",
      type: "bar",
      color: "#94C81B",
    },
    {
      name: "일반",
      type: "bar",
      color: "#4A4D56",
    },
    {
      name: "합계",
      type: "line",
      color: "#0BB69C",
    },
  ],
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
})

const calcColor = (percent) => {
  if (percent <= 5) {
    return "#1E88E5"
  } else if (percent > 5 && percent <= 10) {
    return "#1976D2"
  } else if (percent > 10 && percent <= 15) {
    return "#1565C0"
  } else if (percent < 15) {
    return "#0D47A1"
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
    value: 0,
    percent: 0,
  },
  {
    label: "넘어짐",
    value: 0,
    percent: 0,
  },
  {
    label: "깔림",
    value: 0,
    percent: 0,
  },
  {
    label: "부딛힘",
    value: 0,
    percent: 0,
  },
  {
    label: "맞음",
    value: 0,
    percent: 0,
  },
  {
    label: "무너짐",
    value: 0,
    percent: 0,
  },
  {
    label: "끼임/감김",
    value: 0,
    percent: 0,
  },
  {
    label: "절단/베임/찔림",
    value: 0,
    percent: 0,
  },
  {
    label: "감전",
    value: 0,
    percent: 0,
  },
  {
    label: "폭발",
    value: 0,
    percent: 0,
  },
  {
    label: "화재",
    value: 0,
    percent: 0,
  },
  {
    label: "교통(사고성)",
    value: 0,
    percent: 0,
  },
  {
    label: "이상온도접촉",
    value: 0,
    percent: 0,
  },
  {
    label: "유해물질접촉",
    value: 0,
    percent: 0,
  },
  {
    label: "무리한동작",
    value: 0,
    percent: 0,
  },
  {
    label: "기타",
    value: 0,
    percent: 0,
  },
  {
    label: "Test1",
    value: 0,
    percent: 0,
  },
  {
    label: "Test2",
    value: 0,
    percent: 0,
  },
  {
    label: "Test3",
    value: 0,
    percent: 0,
  },
  {
    label: "Test4",
    value: 0,
    percent: 0,
  },
])

const dateKeyFROM = ref(0)
const dateKeyTO = ref(0)

watch(
  () => SearchParam.FROM,
  (newFrom) => {
    if (newFrom) {
      const fromDate = dayjs(newFrom)
      const toDate = dayjs(SearchParam.TO)

      if (fromDate.isAfter(toDate)) {
        Message.warn(t("올바른 검색기간을 설정해주세요."))
        SearchParam.FROM = dayjs().startOf("year").format("YYYY-MM-DD")
      }
    }
  },
  { deep: true }
)

watch(
  () => SearchParam.TO,
  (newTo) => {
    if (newTo) {
      const fromDate = dayjs(SearchParam.FROM)
      const toDate = dayjs(newTo)
      if (toDate.isBefore(fromDate)) {
        Message.warn(t("올바른 검색기간을 설정해주세요."))
        SearchParam.TO = dayjs().format("YYYY-MM-DD")
      }
    }
  },
  { deep: true }
)

const SagoType = ref('작업성')

</script>

<template>
  <VForm class="searchArea d-flex">
    <i-input
      width="180px"
      :label="$t('기간')"
      v-model="SearchParam.FROM"
      label-width="30px"
      type="date"
      margin="10px"
      required
      :max="SearchParam.TO"
      :key="dateKeyFROM"
    />
    <i-input
      width="160px"
      :label="$t('-')"
      v-model="SearchParam.TO"
      type="date"
      :min="SearchParam.FROM"
      :key="dateKeyTO"
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
    <i-select
      :label="$t('사고구분')"
      width="200px"
      placeholder="사고/비사고"
      :items="codeList.SAGO_GBN"
      v-model="SearchParam.SAGO_GBN"
      item-value="COD"
      item-title="TXT"
      required
    />
  </VForm>

  <v-sheet class="d-flex fill-height pb-3">
    <div class="h-grow h-auto">
      <!-- 사고 등록 -->
      <v-sheet width="370px" class="pa-0 mr-3 d-flex flex-column">
        <div class="d-flex flex-column fill-height justify-space-between">
          <v-sheet class="mb-0 h-auto">
            <v-card class="pa-0 h-auto">
              <v-card-title class="pa-0 pb-2">
                {{
                  SearchParam.SAGO_GBN == "A" || SearchParam.SAGO_GBN == "ALL"
                    ? "사고유형"
                    : "사고유형"
                }}
              </v-card-title>
              <v-card-text class="pa-0 topCard">
                <v-sheet>
                  <div class="pieChartContainer">
                    <v-progress-circular
                      :model-value="
                        ((SagoD[0].SAGO_CNT / SagoD[0].ALL_CNT) * 100).toFixed(
                          2
                        )
                      "
                      :size="210"
                      :width="19"
                      color="primary"
                    >
                      <div class="d-flex flex-column mt-5 justify-center">
                        <span style="font-weight: 800; font-size: 36px">
                          {{
                            isNaN(
                              (
                                (SagoD[0].SAGO_CNT / SagoD[0].ALL_CNT) *
                                100
                              ).toFixed(2)
                            ) == true
                              ? 0
                              : (
                                  (SagoD[0].SAGO_CNT / SagoD[0].ALL_CNT) *
                                  100
                                ).toFixed(2)
                          }}%</span
                        >
                        <p class="mt-3">
                          {{
                           `${SagoType} 구분`
                          }}
                        </p>
                      </div>
                    </v-progress-circular>
                  </div>

                  <!-- 아래부분 -->
                  <div class="mt-4 h-auto">
                    <div class="d-flex justify-center mb-2">
                      <div class="H2TextBox">
                        <span class="normal">등록건수</span>
                        <span class="top-emphasis">{{ SagoD[0].ALL_CNT }}</span
                        >건
                      </div>
                      <v-divider vertical />
                      <div class="H2TextBox">
                        <span class="normal">{{ SagoType }} 사고</span>
                        <span class="top-emphasis">{{ SagoD[0].SAGO_CNT }}</span
                        >건
                      </div>
                    </div>
                    <v-divider length="90%" style="margin: 0 20px" />
                    <div class="d-flex justify-center mb-2 mt-2">
                      <div class="H2TextBox">
                        <span class="normal">중대재해</span>
                        <span class="top-emphasis" style="color: #1e88e5">{{
                          SagoD[0].JUNGDAE_CNT
                        }}</span
                        >건
                      </div>
                      <v-divider vertical />
                      <div class="H2TextBox">
                        <span class="normal">중대(성) 사고</span>
                        <span class="top-emphasis" style="color: #0d47a1">{{
                          SagoD[0].COME_SERIOUS_CNT
                        }}</span
                        >건
                      </div>
                    </div>
                  </div>
                </v-sheet>
              </v-card-text>
            </v-card>
          </v-sheet>

          <v-sheet class="mb-0" height="256px">
            <v-card class="pa-0 fill-height">
              <v-card-title class="pa-0 py-2">
                {{
                  SearchParam.SAGO_GBN == "A" || SearchParam.SAGO_GBN == "ALL"
                    ? "사고 처리"
                    : "사고 처리"
                }}
              </v-card-title>
              <v-card-text class="pa-0 topCard h-auto pl-2 pr-2">
                <div class="mt-4 mb-4 d-flex flex-wrap">
                  <div
                    v-for="(item, index) in SagoG.filter(
                      (x) => x.label !== '총갯수'
                    )"
                    :key="index"
                    class="d-flex justify-center flex-column text-center divTest"
                    :class="index === 0 || index === 1 ? 'mb-3' : 'mb-0'"
                    :style="{
                      borderBottom:
                        index === 0 || index === 1 ? '1px solid #e4e4e4' : '',
                      width: '50%',
                    }"
                  >
                    <div
                      :style="{
                        borderRight:
                          index === 0 || index === 2 ? '1px solid #e4e4e4' : '',
                      }"
                    >
                      {{ item.label }}
                    </div>

                    <div
                      class="py-2 bottom-emphasis"
                      :style="{
                        borderRight:
                          index === 0 || index === 2 ? '1px solid #e4e4e4' : '',
                        color: item.color,
                      }"
                    >
                      {{ item.value }}
                    </div>

                    <div
                      :style="{
                        borderRight:
                          index === 0 || index === 2 ? '1px solid #e4e4e4' : '',
                      }"
                      :class="index == 0 || index == 1 ? 'mb-3' : 'mb-0'"
                    >
                      {{ item.percent }}
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-sheet>
        </div>
      </v-sheet>

      <!-- 사고 유형 -->
      <v-sheet width="580px" class="pa-0 mr-3">
        <v-card class="d-flex flex-column fill-height">
          <v-card-title class="pa-0 pb-2">
            {{
              `${SagoType} 구분`            
            }}
          </v-card-title>
          <v-card-text class="pa-0 fill-height">
            <div class="d-flex flex-wrap justify-center fill-height">
              <div
                class="SagoUDiv"
                v-for="(item, index) in SagoU.filter((x) => x.GBN !== '전체')"
                :key="index"
                :style="{
                  borderBottom: index < 15 ? '1px solid #e4e4e4' : '',
                }"
              >
                <div
                  :style="{
                    borderRight:
                      (index + 1) % 5 !== 0 ? '1px solid #e4e4e4' : '',
                    height: '90%',
                  }"
                >
                  <!-- 분류 -->
                  <div style="font-size: 14px" class="mb-3 mt-3 TextOverFlow">
                    {{ item.GBN }}
                  </div>

                  <!-- 건수 -->
                  <div class="mb-3">
                    <span class="textBold" :style="`color:${item.color}`">
                      {{ item.CNT }}
                    </span>
                    건
                  </div>
                  <!-- 원 차트  -->
                  <div>
                    <v-progress-circular
                      :model-value="
                        isNaN(((item.CNT / SagoU[0].CNT) * 100).toFixed(2)) ===
                        true
                          ? `0.00`
                          : ((item.CNT / SagoU[0].CNT) * 100).toFixed(2)
                      "
                      :size="70"
                      :width="7"
                      :color="
                        calcColor(((item.CNT / SagoU[0].CNT) * 100).toFixed(2))
                      "
                    >
                      {{
                        isNaN(((item.CNT / SagoU[0].CNT) * 100).toFixed(2)) ===
                        true
                          ? `0.00`
                          : ((item.CNT / SagoU[0].CNT) * 100).toFixed(2)
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
          <v-card-title class="pa-0 pb-2">
            {{
              SearchParam.SAGO_GBN == "A" || SearchParam.SAGO_GBN == "ALL"
                ? `${dayjs().format("YYYY")}년도 사고 현황`
                : `${dayjs().format("YYYY")}년도 사고 현황`
            }}
          </v-card-title>
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
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  .v-col:nth-child(2) {
    .divide_col {
      border: none;
    }
  }

  .v-col:nth-child(3) {
    border: none;
  }
  .v-col:nth-child(4) {
    .divide_col {
      border: none;
    }
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
  font-size: 13px;
  font-weight: 400;
  margin: 16px 10px;
}

.normal {
  width: 100px;
  display: inline-block;
}

.top-emphasis {
  font-size: 28px;
  width: 140px;
  text-align: right;
  font-weight: 800;
  display: inline-block;
}
.bottom-emphasis {
  font-size: 26px;
  font-weight: 800;
}
.SagoUDiv {
  box-sizing: border-box;
  width: 112px;
  height: 25%;
  text-align: center;
}

.TextOverFlow {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
