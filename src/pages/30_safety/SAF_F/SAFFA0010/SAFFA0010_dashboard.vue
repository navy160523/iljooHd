 <!-- SAFFA0010 협력사 안전관리 DashBoard -->
 <script setup>
import { ref, onBeforeMount } from "vue";

const tab = ref('tab1')



// SLI Dashboard 현황
const stateSLI = ref('total')
const cards = ref([
  { id: 'total', name: '전사' },
  { id: 'marine', name: '조선해양' },
  { id: 'special', name: '특수선' },
  { id: 'engine', name: '엔진기계' },
]);
// SLI 현황 목업 데이터 (추후 api 필요)
import { total, marine, special, engine } from '@/pages/30_safety/SAF_F/SAFFA0010/dashboardMock.js'
// 안전관리 취약 항목
const notSafety = ref(['safety001', 'safety002'])
// 안전관리 목록
const safetyList = ref([
  { id: "safety001", name: "안전사고" },
  { id: "safety002", name: "안전수칙" },
  { id: "safety003", name: "안전교육" },
  { id: "safety004", name: "위험성평가" },
  { id: "safety005", name: "안전작업요구권" },
  { id: "safety006", name: "모바일\n안전작업지시" },
  { id: "safety007", name: "생산\n안전점검" },
])
// SLI 카드 [전사/조선해양/특수선/엔진기계] 클릭 이벤트 
const onSLIstateCard = (param) => {
  stateSLI.value = param
  const setData = (key) => {
    switch (key) {
      case 'total': return total
      case 'marine': return marine
      case 'special': return special
      case 'engine': return engine
      default: return []
    }
  }
  const max = stateSLI.value !== 'total' ? 10 : 30
  const data = setData(stateSLI.value)
  radarState.value.radar.indicator = safetyList.value.map(el => ({
    id: el.id,
    name: el.name,
    max: max,
    value: data[el.id]
  }))
  const valuesArray = Object.values(data)
  radarState.value.series[0].data[0].value = valuesArray
  Math.floor(50/70 * 100)
  const sum = valuesArray.reduce((acc, value) => acc + value, 0)
  const percent = Math.floor((sum / (max * 7)) * 100)
  gaugeState.value.series[0].data[0].value = percent
  const gaugeName = () => {
    if(percent >= 90) {
      return '안전'
    } else if (percent < 90 && percent >= 60) {
      return '주의'
    } else if (percent < 60 && percent >= 40) {
      return '경고'
    } else {
      return '위험'
    }
  }
  gaugeState.value.series[0].data[0].name = gaugeName()
}
const colorPalette=[
            [0.1, "#FF5252"],
            [0.2, "#FF7637"],
            [0.3, "#FF983B"],
            [0.4, "#FEBF32"],
            [0.5, "#94C81B"],
            [0.6, "#0BB69C"],
            [0.7, "#08B9C8"],
            [0.8, "#16C3F4"],
            [0.9, "#0581FD"],
            [1, "#1A40C7"],
          ]
const gaugeState = ref({
  series: [
    {
      type: "gauge",
      center: ["50%", "52%"],
      // 게이지 크기, 컬러
      axisLine: {
        lineStyle: {
          width: 30,
          color: colorPalette,
        },
      },
      // 게이지 화살표
      pointer: {
        icon: "path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z",
        width: 11,
        itemStyle: {
          color: "#4A4D56",
        },
      },
      // 게이지 바깥 원
      axisTick: {
        distance: -45,
        length: 5,
        lineStyle: {
          color: "#f3f3f3",
          width: 24,
        },
      },
      // 게이지 사이 간격
      splitLine: {
        distance: -30,
        length: 30,
        lineStyle: {
          color: "#fff",
          width: 2,
        },
      },
      // 게이지 숫자
      axisLabel: {
        color: "inherit",
        distance: 40,
        fontSize: 14,
      },
      // data:name
      title: {
        color: "inherit",
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "Pretendard",
      },
      // data:value
      detail: {
        valueAnimation: true,
        formatter: "{value}",
        color: "#4A4D56",
        fontSize: 14,
        fontWeight: "normal",
        fontFamily: "Pretendard",
      },
      // data 예시
      data: [
        {
          value: 0,
          name: "주의",
          fontFamily: "Pretendard",
        },
      ],
    },
  ],
})
const radarState = ref({
  radar: {
    indicator: [],
    axisName: {
      color: "#051537",
      fontFamily: "pretendard",
      fontSize: 14,
      formatter: (value, param) => {
        const isNotSafety = notSafety.value.some(el => el == param.id)
        return `{default|${value}\n} {${isNotSafety ? 'warn' : 'normal' }|${param.value}/${param.max}}`;
      },
      rich: {
        default: {
          align: 'center',
          lineHeight: 16.71
        },
        normal: {
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09
        },
        warn: {
          color: '#FF5252',
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09
        }
      }
    },
    center: ["50%", "50%"],
  },
  series: [
    {
      type: "radar",
      label: {
        show: true,
        position: "bottom",
      },
      data: [
        {
          value: [],
          areaStyle: {
            color: "rgba(26, 64, 199, 0.10)",
          },
          symbol: "none",
        },
      ],
    },
  ],
});


onBeforeMount(() => {
  onSLIstateCard('total')
})

const stateList = ref([
  {
    title: "안전수칙",
    color: "error",
    count: 40,
    max: 40,
    group: [
      {
        title: null,
        list: [
          { text: '중대재해', value: 0, unit: '건' },
          { text: '절대수칙', value: 0, unit: '건' },
          { text: '중대성 사고', value: 1, unit: '건' },
          { text: '산재사고', value: 0, unit: '건' },
          { text: '휴업사고', value: 1, unit: '건' },
          { text: '일반사고', value: 0, unit: '건' },
        ]
      },
    ]
  },
  {
    title: "안전수칙",
    color: "error",
    count: 40,
    max: 50,
    group: [
      {
        title: null,
        list: [
          { text: '산재은폐', value: 0, unit: '건' },
          { text: '중대성수칙', value: 1, unit: '건' },
          { text: '시정통보', value: 0, unit: '건' },
          { text: '작업중지', value: 0, unit: '건' },
          { text: '일반수칙', value: 0, unit: '건' },
        ]
      },
    ]
  },
  {
    title: "안전교육",
    color: "success",
    count: 20,
    max: 20,
    group: [
      {
        title: '정기안전보건교육',
        list: [
          { text: '교육실적 미등록', value: 0, unit: '명' },
          { text: '교육실적 미수립', value: 0, unit: '명' },
        ]
      },
      {
        title: '관리감독자 정기안전보건교육',
        list: [
          { text: '교육실적 미등록', value: 0, unit: '명' },
        ]
      },
      {
        title: '단기공사 안전교육',
        list: [
          { text: '교육실적 미등록', value: 0, unit: '명' },
        ]
      },
      {
        title: '사내강사',
        list: [
          { text: '교육실적 미등록', value: 2, unit: '명' },
        ]
      }
    ]
  },
  {
    title: "안전수칙",
    color: "success",
    count: 30,
    max: 30,
    group: [
      {
        title: null,
        list: [
          { text: '정기위험성평가 미실시', value: 0, unit: '건' },
          { text: '수시위험성평가 미실시(안전사고)', value: 0, unit: '건' },
          { text: '수시위험성평가 실시(비일상작업)', value: 0, unit: '건' },
          { text: '현장 위험성평가 실시', value: 35, unit: '건' },
        ]
      },
    ]
  },
  {
    title: "안전수칙",
    color: "info",
    count: 30,
    max: 30,
    group: [
      {
        title: null,
        list: [
          { text: '안전점검실적 (전일)', value: 32, unit: '건' },
          { text: '안점점검실적 (3일 평균)', value: 35, unit: '건' },
        ]
      },
    ]
  },
  {
    title: "안전수칙",
    color: "info",
    count: 20,
    max: 20,
    group: [
      {
        title: null,
        list: [
          { text: '안전점검실적 (전일)', value: 64, unit: '건' },
          { text: '안점점검실적 (3일 평균)', value: 95, unit: '건' },
        ]
      },
    ]
  },
  {
    title: "안전수칙",
    color: "warning",
    count: 10,
    max: 10,
    group: [
      {
        title: null,
        list: [
          { text: '안전작업요구권 (전일)', value: 32, unit: '건' },
          { text: '안전작업요구권 (3일 평균)', value: 35, unit: '건' },
        ]
      },
    ]
  },
]);

const radarDetail = ref({
  radar: {
    indicator: [
      { name: "안전사고", max: 30 },
      { name: "안전수칙", max: 30 },
      { name: "안전교육", max: 30 },
      { name: "위험성평가", max: 30 },
      { name: "안전작업요구권", max: 30 },
      { name: "모바일\n안전작업지시", max: 30 },
      { name: "생산\n안전점검", max: 30 },
    ],
    axisName: {
      color: "#051537",
      fontFamily: "Pretendard",
      fontSize: 14,
      formatter: (value, param) => {
        return `${value}\n${param.min}/${param.max}`;
      },
      // formatter: '{value}',
    },
    center: ["50%", "54%"],
    radius: "65%",
  },
  series: [
    {
      type: "radar",
      label: {
        show: true,
        position: "bottom",
      },
      data: [
        {
          value: [26, 23, 20, 25, 25, 25, 14],
          areaStyle: {
            color: "rgba(26, 64, 199, 0.10)",
          },
          symbol: "none",
        },
      ],
    },
  ],
});
const gaugeDetail = ref({
  series: [
    {
      type: "gauge",
      center: ["50%", "54%"],
      radius: "85%",
      // 게이지 크기, 컬러
      axisLine: {
        lineStyle: {
          width: 20,
          color: colorPalette,
        },
      },
      // 게이지 화살표
      pointer: {
        icon: "path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z",
        width: 11,
        itemStyle: {
          color: "#4A4D56",
        },
      },
      // 게이지 바깥 원
      axisTick: {
        distance: -35,
        length: 5,
        lineStyle: {
          color: "#f3f3f3",
          width: 24,
        },
      },
      // 게이지 사이 간격
      splitLine: {
        distance: -30,
        length: 30,
        lineStyle: {
          color: "#fff",
          width: 2,
        },
      },
      // 게이지 숫자
      axisLabel: {
        color: "inherit",
        distance: 30,
        fontSize: 14,
      },
      // data:name
      title: {
        color: "inherit",
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "Pretendard",
      },
      // data:value
      detail: {
        valueAnimation: true,
        formatter: "{value}",
        color: "#4A4D56",
        fontSize: 14,
        fontWeight: "normal",
        fontFamily: "Pretendard",
      },
      // data 예시
      data: [
        {
          value: 83,
          name: "주의",
          fontFamily: "Pretendard",
        },
      ],
    },
  ],
});
const colorPaletteLine=[
  "#FF5252",
  "#FF7637",
  "#FF983B",
  "#FEBF32",
  "#94C81B",
  "#0BB69C",
  "#16C3F4",
  "#0581FD",
  "#1A40C7"]
          
const business = ref([
  { id: "ALL", text: "전체", score:72 },
  { id: "value1", text: "조선해양사업부", score:82 },
  { id: "value2", text: "H도크 부문", score:88 },
  { id: "value3", text: "H도크 지원부", score:60 }
]);
const businessValue1=ref('value1')
const businessValue2=ref('value2')
const businessValue3=ref('value3')
const calcColorIndex = (value) => {
  let data={}
  let label=''
  business.value.forEach((item)=>{
    if(item.id == value){
      data=item
    }
  })
    if(data.score >= 90) {
      label='안전'
    } else if (data.score < 90 && data.score >=80) {
      label='주의'
    } else if (data.score < 80 && data.score >=70) {
      label='경고'
    } else {
      label='위험'
    }
  return ({index:Math.floor((data.score-55)/5),label:label})

}

</script>
 
 <template>
  <div class="pa-0 SAFFA0010_dashboard">
    <!--  현황/상세보기 탭 -->
    <div class="searchArea d-flex">
      <v-tabs v-model="tab" class="mb-3">
        <v-tab value="tab1">현황</v-tab>
            <v-tab value="tab2">상세보기</v-tab>
      </v-tabs>
    </div>
      <!-- 현황 tab -->
      <template v-if="tab == 'tab1'">
        <!-- 전사/조선해양/특수선/엔진기계 -->
        <v-sheet class="dashboard-contents">
          <div class="btn-contents d-flex">
            <v-hover v-for="(item, i) in cards" :key="i">
              <template v-slot:default="{ isHovering, props }">
                <v-spacer v-if="i !== 0" style="width: 16px" />
                <VCard
                  hover
                  v-bind="props"
                  :color="isHovering|| stateSLI == item.id ? 'primary' : 'inputDisabled'"
                  :elevation="isHovering|| stateSLI == item.id ? '3' : '0'"
                  variant="outlined"
                  height="69"
                  width="25%"
                  class="scoreCard pY-20 pX-24 f-16 w-400 d-flex align-center justify-center"
                  :class="{'cardHover' : isHovering || stateSLI == item.id}"
                  @click="onSLIstateCard(item.id)"
                >
                  <p>{{ item.name }}</p>
                </VCard>
              </template>
            </v-hover>
          </div>
        </v-sheet>
        <v-sheet no-gutters class="dashboard-contents mt-4 h-auto">
          <!-- chart -->
          <div class="chart-contents h-grow">
            <v-sheet width="50%" class="pr-2 gauge-chart">
              <VCard
                color="inputDisabled"
                variant="outlined"
                width="100%"
                height="100%"
              >
                <e-chart :option="gaugeState" />
              </VCard>
            </v-sheet>
            <v-sheet width="50%" class="pl-2 radar-chart">
              <VCard color="inputDisabled" variant="outlined" height="100%" class="d-flex flex-column">
                <v-sheet class="px-3 pt-2 text-textInfo d-flex align-center">
                  <span class="f-16">안전관리 취약항목 :</span>
                  <v-chip label color="error" class="ml-2">
                    <span class="f-12">안전사고</span>
                  </v-chip>
                  <v-chip label color="error" class="ml-2">
                    <span class="f-12">안전수칙</span>
                  </v-chip>
                </v-sheet>
                <v-sheet class="h-auto">
                  <e-chart :option="radarState" />
                </v-sheet>
              </VCard>
            </v-sheet>
          </div>
        </v-sheet>
      </template>
      <!-- 상세보기 tab -->
      <template v-if="tab == 'tab2'">
        <!-- 조회조건 -->
        <v-col cols="12" class="dashboard-contents h-auto pa-0">
          <v-row no-gutters class="searchArea">
            <i-input
              labelWidth="70px"
              width="190px"
              :label="$t('점검일자')"
              type="date"
              margin="10px"
            />
            <i-input width="150px" :label="$t('-')" type="date" />
            <i-select
              :label="$t('사업부')"
              labelWidth="50px"
              width="250px"
              v-model="business.id"
              :items="business.list"
              item-value="id"
              item-title="text"
            />
          </v-row>
          <v-row no-gutters class="chart-contents2 h-auto">
            <!-- 안전수칙카드 -->
            <v-sheet class="mt-2 d-flex">
              <v-card variant="outlined" color="inputDisabled" class="h-auto">
                <v-row no-gutters class="flex-nowrap fill-height pt-4 pb-5">
                  <template
                    v-for="(state, state_index) in stateList"
                    :key="state.title"
                  >
                    <v-divider
                      v-if="state_index !== 0"
                      vertical
                      style="color: #d8d8d8; opacity: 1 !important"
                    />
                    <v-col class="pa-0 px-6 fill-height h-auto">
                      <v-card-title
                        class="pa-0 mainCaption2 d-flex justify-space-between align-center"
                      >
                        <div class="text-textInfo">
                          {{ state.title }}
                        </div>
                        <div class="w-600" :class="`text-${state.color}`">
                          {{ state.count }}/{{ state.max }}
                        </div>
                      </v-card-title>
                      <v-card
                        color="#F7F7F7"
                        class="mt-2"
                        height="100%"
                      >
                        <v-row no-gutters class="d-flex align-start px-4 pt-1 pb-2">
                          <template v-for="(group, group_index) in state.group" :key="group_index">
                            <span :class="group_index == 0 ? 'mt-0' : 'mt-1'">{{ group.title }}</span>
                            <template v-for="(list, list_index) in group.list" :key="list_index">
                              <v-col cols="9" class="mT-2 d-flex justify-space-between f-14">
                                <span class="text-textCard">{{ list.text }}</span>
                              </v-col>
                              <v-col cols="3" class="mT-2 f-14 text-right">
                                <span class="w-400"><b class="text-textInfo w-600">{{ list.value }}</b>{{ ` ${list.unit}` }}</span>
                              </v-col>
                            </template>
                          </template>
                        </v-row>
                        <!--  -->
                      </v-card>
                    </v-col>
                  </template>
                </v-row>
              </v-card>
            </v-sheet>
            <!-- 차트카드 -->
            <v-sheet class="mt-2 h-auto">
              <div class="h-grow">
                <v-sheet max-width="400" class="h-auto">
                  <VCard color="inputDisabled" variant="outlined" height="100%" class="d-flex px-2 flex-column p-relative">
                    <v-sheet class="px-1 pt-2 text-textInfo d-flex align-center">
                      <span class="f-14">안전관리 취약항목 :</span>
                      <v-chip label color="error" density class="ml-2">
                        <span class="f-12">안전사고</span>
                      </v-chip>
                      <v-chip label color="error" density class="ml-2">
                        <span class="f-12">안전수칙</span>
                      </v-chip>
                    </v-sheet>
                    <v-col cols="12" class="h-auto">
                      <e-chart :option="radarDetail" />
                    </v-col>
                  </VCard>
                </v-sheet>
                <v-sheet class="h-auto mx-2">
                  <VCard color="inputDisabled" variant="outlined" height="100%" class="pa-4">
                      <v-sheet class="d-flex align-center mt-8">
                        <v-sheet width="200px" class="mr-5" height="30"></v-sheet>
                        <v-sheet class="d-flex flex-row p-relative lineLegend" width="100%" height="10px">
                          <span class="lineLabelStart">
                            55
                          </span>
                          <v-sheet :color=item class="h-grow p-relative mR-2" v-for="(item,index) in colorPaletteLine" :key="index">
                            <span class="lineLabel">
                              {{ (index+12)*5 }}
                            </span>
                          </v-sheet>
                        </v-sheet>
                        <v-sheet width=60></v-sheet>
                      </v-sheet>
                      <v-sheet class="d-flex align-center mt-2">
                        <i-select width="200px"
                        v-model="businessValue1"
                        :items="business"
                        item-value="id"
                        item-title="text"></i-select>
                        <v-sheet class="d-flex flex-row" width="100%" height="10px">
                          <v-sheet :color="calcColorIndex(businessValue1).index==index?item:'#E7E1E1'" class="h-grow mR-2" v-for="(item,index) in colorPaletteLine" :key="index"></v-sheet>
                        </v-sheet>
                        <v-sheet width=60 class="text-right endLabel">{{ calcColorIndex(businessValue1).label }}</v-sheet>
                      </v-sheet>
                      <v-sheet class="d-flex align-center mt-2">
                        <i-select width="200px"
                        v-model="businessValue2"
                        :items="business"
                        item-value="id"
                        item-title="text"></i-select>
                        
                        <v-sheet class="d-flex flex-row" width="100%" height="10px">
                          <v-sheet :color="calcColorIndex(businessValue2).index==index?item:'#E7E1E1'" class="h-grow mR-2" v-for="(item,index) in colorPaletteLine" :key="index"></v-sheet>
                        </v-sheet>
                        <v-sheet width=60 class="text-right endLabel">{{ calcColorIndex(businessValue2).label }}</v-sheet>
                      </v-sheet>
                      <v-sheet class="d-flex align-center mt-2">
                        <i-select width="200px"
                        v-model="businessValue3"
                        :items="business"
                        item-value="id"
                        item-title="text"></i-select>
                        <v-sheet class="d-flex flex-row" width="100%" height="10px">
                          <v-sheet :color="calcColorIndex(businessValue3).index==index?item:'#E7E1E1'" class="h-grow mR-2" v-for="(item,index) in colorPaletteLine" :key="index"></v-sheet>
                        </v-sheet>
                        <v-sheet width=60 class="text-right endLabel">{{ calcColorIndex(businessValue3).label }}</v-sheet>
                      </v-sheet>
                  </VCard>
                </v-sheet>
                <v-sheet max-width="400" class="h-auto">
                  <VCard color="inputDisabled" variant="outlined" height="100%" class="d-flex px-2 flex-column p-relative">
                    <v-sheet class="px-1 pt-2 text-textInfo d-flex align-center">
                      <span class="f-14">안전관리 취약항목 :</span>
                      <v-chip label color="error" density class="ml-2">
                        <span class="f-12">안전사고</span>
                      </v-chip>
                      <v-chip label color="error" density class="ml-2">
                        <span class="f-12">안전수칙</span>
                      </v-chip>
                    </v-sheet>
                    <v-sheet width="auto" class="h-auto">
                      <e-chart :option="gaugeDetail" />
                    </v-sheet>
                  </VCard>
                </v-sheet>
              </div>
            </v-sheet>
          </v-row>
        </v-col>
      </template>
  </div>
</template>
 
 <style lang="scss" scoped>
.SAFFA0010_dashboard {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  height: 100%;
  .searchArea {
    .v-tabs {
      margin: 0 !important;
    }
    .v-slide-group__content {
      .v-btn--size-default {
        padding: 7px 15px !important;
        &:first-child::before {
          content: "";
          width: 5px;
          height: 14px;
          right: -3px;
          position: absolute;
          border-right: 1px solid #b9b9b9;
        }
      }
    }
  }
  .dashboard-contents {
    position: relative;
    .v-chip {
      padding: 2px 8px !important;
      font-size: 14px !important;
      font-weight: bold;
    }
    .btn-contents {
      height: 69px;
    }
    .scoreCard p {
      color: #051537;
    }
    .cardHover {
      box-shadow: 0px 2px 4px 0px rgba(26, 64, 199, 0.15) !important;
      p {
        color: #1a40c7 !important;
      }
    }
  }


  .lineLegend{
    
  
    .lineLabel{
      position:absolute;
      top:-24px;
      right:-8px;
    }
    .lineLabelStart{
      position:absolute;
      top:-24px;
      left:-8px;
    }
    

  }
  .endLabel{
      font-size:16px;
      color:#0BB69C;
      font-weight: 700;
    }
}
</style>