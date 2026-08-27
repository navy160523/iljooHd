<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { commonSearchApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import SAFIA0010Popup01 from "@/pages/30_safety/SAF_I/POPUP/SAFIA0010Popup01.vue"

defineOptions({
  name:'30_safety-SAF_I-SAFIA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const sAFIA0010Popup01 = ref(null)

// 메인 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  ASGN_CD: '',
  QUARTER: '',
})

/* 조회 구분 */
const dtQuater = reactive([
  { COD: "1", TXT: "1분기" },
  { COD: "2", TXT: "2분기" },
  { COD: "3", TXT: "3분기" },
  { COD: "4", TXT: "4분기" },
])


const cards = ref([
  { 
    id: "A", 
    name: "전사", 
    score: "0", 
    eval: "미흡",
    color: "#BDBDBD",
    eval_l: "0",
    eval_s: "0",
    eval_c: "0",
    eval_m: "0",
    eval_h: "0",
  },
  { 
    id: "B", 
    name: "조선", 
    score: "0", 
    eval: "미흡",
    color: "#BDBDBD",
    eval_l: "0",
    eval_s: "0",
    eval_c: "0",
    eval_m: "0",
    eval_h: "0",
  },
  { 
    id: "C", 
    name: "해양", 
    score: "0", 
    eval: "미흡",
    color: "#BDBDBD",
    eval_l: "0",
    eval_s: "0",
    eval_c: "0",
    eval_m: "0",
    eval_h: "0",
  },
  { 
    id: "D", 
    name: "특수선", 
    score: "0", 
    eval: "미흡",
    color: "#BDBDBD",
    eval_l: "0",
    eval_s: "0",
    eval_c: "0",
    eval_m: "0",
    eval_h: "0",
  },
  { 
    id: "E", 
    name: "엔진기계", 
    score: "0", 
    eval: "미흡",
    color: "#BDBDBD",
    eval_l: "0",
    eval_s: "0",
    eval_c: "0",
    eval_m: "0",
    eval_h: "0",
  },
])

const chartsOptions = ref({
  series: [
    {
      type: "gauge",
      center: ["50%", "52%"],

      // 게이지 크기, 컬러
      axisLine: {
        lineStyle: {
          width: 30,
          color: [
            [0.1, "#FF0000"],
            [0.2, "#FF5252"],
            [0.3, "#FF5E00"],
            [0.4, "#FFBB00"],
            [0.5, "#FFE400"],
            [0.6, "#C4B73B"],
            [0.7, "#6799FF"],
            [0.8, "#4374D9"],
            [0.9, "#0054FF"],
            [1, "#0100FF"],
          ],
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
          name: "미흡",
          fontFamily: "Pretendard",
        },
      ],
    },
  ],
})

const chartsOptions1 = ref({
  radar: {
    indicator: [
      { name: "안전리더십", max: 40, value: 0 },
      { name: "안전시스템", max: 20, value: 0 },
      { name: "현장안전관리", max: 10, value: 0 },
      { name: "보건", max: 10, value: 0 },
      { name: "안전문화", max: 20, value: 0 },
    ],
    axisName: {
      color: "#051537",
      fontFamily: "Pretendard",
      fontSize: 14,
      formatter: (value, param) => {
        return `{default|${value}\n} {${param.value == param.max ? 'max' : 'normal' }|${param.value}/${param.max}}`
      },
      rich: {
        default: {
          align: 'center',
          lineHeight: 16.71,
        },
        normal: {
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09,
        },
        max: {
          color: '#2F9D27',
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09,
        },
      },
    },
    center: ["50%", "52%"],
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
          value: [0, 0, 0, 0, 0],
          areaStyle: {
            color: "rgba(26, 64, 199, 0.10)",
          },
          symbol: "none",
        },
      ],
    },
  ],
})

onMounted(() => {
  vm.$nextTick(() => {
    searchParams.QUARTER = getQuarter(new Date())
    onButtonsClick({ id: "btnSearch" })
  })  
})


//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchDataMain)
      .setAfter(afterSearchMain)
      .run()
  }
}

// 사업부별 평과결과 버튼
const onResultEvalClick = (item, index) => {
  chartsOptions.value.series[0].data[0].value = item.score
  chartsOptions.value.series[0].data[0].name = item.eval

  chartsOptions1.value.radar.indicator[0].value = item.eval_l
  chartsOptions1.value.radar.indicator[1].value = item.eval_s
  chartsOptions1.value.radar.indicator[2].value = item.eval_m
  chartsOptions1.value.radar.indicator[3].value = item.eval_h
  chartsOptions1.value.radar.indicator[4].value = item.eval_c

  chartsOptions1.value.series[0].data[0].value[0] = item.eval_l
  chartsOptions1.value.series[0].data[0].value[1] = item.eval_s
  chartsOptions1.value.series[0].data[0].value[2] = item.eval_m
  chartsOptions1.value.series[0].data[0].value[3] = item.eval_h
  chartsOptions1.value.series[0].data[0].value[4] = item.eval_c

  console.log("[onResultEvalClick] index: ", index)
  console.log("[onResultEvalClick] item: ", item)

  switch(item.id) {
  case 'A':
    cards.value[0].color = '#1DDB16'
    cards.value[1].color = '#BDBDBD'
    cards.value[2].color = '#BDBDBD'
    cards.value[3].color = '#BDBDBD'
    cards.value[4].color = '#BDBDBD'
    break
  case 'B':
    cards.value[0].color = '#BDBDBD'
    cards.value[1].color = '#1DDB16'
    cards.value[2].color = '#BDBDBD'
    cards.value[3].color = '#BDBDBD'
    cards.value[4].color = '#BDBDBD'
    break
  case 'C':
    cards.value[0].color = '#BDBDBD'
    cards.value[1].color = '#BDBDBD'
    cards.value[2].color = '#1DDB16'
    cards.value[3].color = '#BDBDBD'
    cards.value[4].color = '#BDBDBD'
    break
  case 'D':
    cards.value[0].color = '#BDBDBD'
    cards.value[1].color = '#BDBDBD'
    cards.value[2].color = '#BDBDBD'
    cards.value[3].color = '#1DDB16'
    cards.value[4].color = '#BDBDBD'
    break
  case 'E':
    cards.value[0].color = '#BDBDBD'
    cards.value[1].color = '#BDBDBD'
    cards.value[2].color = '#BDBDBD'
    cards.value[3].color = '#BDBDBD'
    cards.value[4].color = '#1DDB16'
    break
  }
}


const onOpenPopupClick = id => {
  console.log("[onOpenPopupClick] id: ", id)

  switch(id) {
  case 'A':
    sAFIA0010Popup01.value.openPopup({ 
      CMPNY_DIV : searchParams.CMPNY_DIV,
      YEAR : searchParams.YEAR,
      QUARTER : searchParams.QUARTER,
      BSNS_CD : '',
      BSNS_GBN : '전사',
    })
    break
  case 'B':
    sAFIA0010Popup01.value.openPopup({ 
      CMPNY_DIV : searchParams.CMPNY_DIV,
      YEAR : searchParams.YEAR,
      QUARTER : searchParams.QUARTER,
      BSNS_CD : 'AC00',
      BSNS_GBN : '조선',
    })
    break
  case 'C':
    sAFIA0010Popup01.value.openPopup({ 
      CMPNY_DIV : searchParams.CMPNY_DIV,
      YEAR : searchParams.YEAR,
      QUARTER : searchParams.QUARTER,
      BSNS_CD : 'AQ00',
      BSNS_GBN : '해양',
    })
    break
  case 'D':
    sAFIA0010Popup01.value.openPopup({ 
      CMPNY_DIV : searchParams.CMPNY_DIV,
      YEAR : searchParams.YEAR,
      QUARTER : searchParams.QUARTER,
      BSNS_CD : 'AE00',
      BSNS_GBN : '특수선',
    })
    break
  case 'E':
    sAFIA0010Popup01.value.openPopup({ 
      CMPNY_DIV : searchParams.CMPNY_DIV,
      YEAR : searchParams.YEAR,
      QUARTER : searchParams.QUARTER,
      BSNS_CD : 'AK00',
      BSNS_GBN : '엔진기계',
    })
    break
  }
}

// 조회
const searchDataMain = () =>{
  return commonSearchApi({ queryId : 'SAFIA0010_SEARCH_01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearchMain = res =>{
  console.log('[afterSearchMain] res : ', res)

  if (res.ORESULT_CUR.length > 0) {
    for (let i=0; i <cards.value.length;i++) {
      if(cards.value[i].id === res.ORESULT_CUR[i].ID){
        cards.value[i].score = res.ORESULT_CUR[i].SCORE
        cards.value[i].eval = res.ORESULT_CUR[i].EVAL
      }
    }
  }

  if (res.ORESULT_CUR2.length > 0) {
    for (let i=0; i <cards.value.length;i++) {
      if(cards.value[i].id === res.ORESULT_CUR2[i].ID){
        cards.value[i].eval_l = res.ORESULT_CUR2[i].EVAL_L
        cards.value[i].eval_s = res.ORESULT_CUR2[i].EVAL_S
        cards.value[i].eval_c = res.ORESULT_CUR2[i].EVAL_C
        cards.value[i].eval_m = res.ORESULT_CUR2[i].EVAL_M
        cards.value[i].eval_h = res.ORESULT_CUR2[i].EVAL_H
      }
    }
  }

  console.log('[afterSearchMain] cards.value : ', cards.value[0])

  onResultEvalClick(cards.value[0], 0)
} 

const getQuarter  = date => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :use-permission="false" 
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="pa-0 SAFIA0010_dashboard d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.YEAR"
            :label="$t('년도')"
            label-width="50px"
            type="Number"
            width="150px"
          />
          <i-select
            v-model="searchParams.QUARTER"
            :label="$t('분기')"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            :items="dtQuater"
            item-title="TXT"
            item-value="COD"
            width="230px"
          />
        </v-sheet>
        <v-sheet class="dashboard-contents">
          <div class="d-flex">
            <v-hover 
              v-for="(item, i) in cards" 
              :key="i"
            >
              <template v-slot:default="{ isHovering, props }">
                <v-spacer 
                  v-if="i !== 0" 
                  style="width: 16px;"
                />
                <VCard
                  hover
                  v-bind="props"
                  :color="isHovering ? 'primary' : 'inputDisabled'"
                  :elevation="isHovering ? '3' : '0'"
                  variant="outlined"
                  height="116"
                  width="25%"
                  class="scoreCard pY-20 pX-24 f-16 w-400 d-flex flex-column justify-space-between"
                  @click="onResultEvalClick(item, i)"
                >
                  <v-sheet class="d-flex">
                    <v-icon 
                      :color="item.color"
                      icon="mdi-check"
                    />
                    <p class="text-left mx-3">
                      {{ item.name }}
                    </p>
                  </v-sheet>
                  <v-spacer />
                  <p class="f-40 w-700 text-right">
                    {{ item.score }} <span class="f-16 w-400">점</span>
                  </p>
                  <v-btn 
                    append-icon="mdi-chevron-right"
                    color="blue-lighten-2"
                    variant="outlined"
                    class="mt-1"
                    block
                    @click="onOpenPopupClick(item.id)"
                  >
                    {{ item.name + " 협력사 평가결과" }}
                  </v-btn>
                </VCard>
              </template>
            </v-hover>
          </div>
        </v-sheet>
        <v-sheet class="h-auto mt-3">
          <div class="h-grow">
            <v-sheet 
              width="50%" 
              class="h-auto pe-2"
            >
              <VCard
                color="inputDisabled"
                variant="outlined"
                width="100%"
                height="100%"
                min-height="300"
              >
                <e-chart :option="chartsOptions" />
              </VCard>
            </v-sheet>
            <v-sheet 
              width="50%" 
              class="h-auto ps-2"
            >
              <VCard
                color="inputDisabled"
                variant="outlined"
                width="100%"
                height="100%"
                min-height="300"
              >
                <e-chart :option="chartsOptions1" />
              </VCard>
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
    <SAFIA0010Popup01
      ref="sAFIA0010Popup01"
    />
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
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

.SAFIA0010_dashboard {
  .dashboard-contents {
    position: relative;
  }
}
</style>