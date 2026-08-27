
<!-- 
  * Vue 내 용 : 협력사 안전관리 Dashboard 사업부별 평과결과 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/05/15
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/05/15 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import _ from "lodash"
import dayjs from 'dayjs'
import Echart from 'vue-echarts'
import SAFIA0010Popup02 from "@/pages/30_safety/SAF_I/POPUP/SAFIA0010Popup02.vue"

const emit = defineEmits(["closed"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const sAFIA0010Popup02 = ref(null)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const chart1 = ref(null)
const chart2 = ref(null)
const chart3 = ref(null)
const chart4 = ref(null)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

const popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  QUARTER: '',
  BSNS_CD: '',
  BSNS_GBN: '',
})

let chartsOptions1 = {
  title: {
    text: '우수그룹',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  dataset: {
    source: [],
  },
  grid: { containLabel: true },
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: { name: 'score' },
  yAxis: { type: 'category' },
  visualMap: {
    orient: 'horizontal',
    left: 'center',
    min: 10,
    max: 100,
    text: ['High Score', 'Low Score'],

    // Map the score column to color
    dimension: 0,
    inRange: {
      color: ['#FD665F', '#FFCE34', '#0054FF'],
    },
  },
  series: [
    {
      type: 'bar',
      encode: {
        // Map the "score" column to X axis.
        x: 'score',

        // Map the "company" column to Y axis
        y: 'company',
      },
    },
  ],
}

let chartsOptions2 = {
  title: {
    text: '양호그룹',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  dataset: {
    source: [],
  },
  grid: { containLabel: true },
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: { name: 'score' },
  yAxis: { type: 'category' },
  visualMap: {
    orient: 'horizontal',
    left: 'center',
    min: 10,
    max: 100,
    text: ['High Score', 'Low Score'],

    // Map the score column to color
    dimension: 0,
    inRange: {
      color: ['#FD665F', '#FFCE34', '#0054FF'],
    },
  },
  series: [
    {
      type: 'bar',
      encode: {
        // Map the "score" column to X axis.
        x: 'score',

        // Map the "company" column to Y axis
        y: 'company',
      },
    },
  ],
}

let chartsOptions3 = {
  title: {
    text: '보통그룹',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  dataset: {
    source: [],
  },
  grid: { containLabel: true },
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: { name: 'score' },
  yAxis: { type: 'category' },
  visualMap: {
    orient: 'horizontal',
    left: 'center',
    min: 10,
    max: 100,
    text: ['High Score', 'Low Score'],

    // Map the score column to color
    dimension: 0,
    inRange: {
      color: ['#FD665F', '#FFCE34', '#0054FF'],
    },
  },
  series: [
    {
      type: 'bar',
      encode: {
        // Map the "score" column to X axis.
        x: 'score',

        // Map the "company" column to Y axis
        y: 'company',
      },
    },
  ],
}

let chartsOptions4 = {
  title: {
    text: '미흡그룹',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  dataset: {
    source: [],
  },
  grid: { containLabel: true },
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: { name: 'score' },
  yAxis: { type: 'category' },
  visualMap: {
    orient: 'horizontal',
    left: 'center',
    min: 10,
    max: 100,
    text: ['High Score', 'Low Score'],

    // Map the score column to color
    dimension: 0,
    inRange: {
      color: ['#FD665F', '#FFCE34', '#0054FF'],
    },
  },
  series: [
    {
      type: 'bar',
      encode: {
        // Map the "score" column to X axis.
        x: 'score',

        // Map the "company" column to Y axis
        y: 'company',
      },
    },
  ],
}

//초기 데이터셋팅
onMounted(() => {

  chart1.value.chart.on('click', function(params) {
    sAFIA0010Popup02.value.openPopup({ 
      CMPNY_DIV : params.data.div,
      BSNS_CD : params.data.bsns,
      ASGN_CD : params.data.asgn,
      COMP_CD : params.data.code,
    })
  })

  chart2.value.chart.on('click', function(params) {
    sAFIA0010Popup02.value.openPopup({ 
      CMPNY_DIV : params.data.div,
      BSNS_CD : params.data.bsns,
      ASGN_CD : params.data.asgn,
      COMP_CD : params.data.code,
    })
  })

  chart3.value.chart.on('click', function(params) {
    sAFIA0010Popup02.value.openPopup({ 
      CMPNY_DIV : params.data.div,
      BSNS_CD : params.data.bsns,
      ASGN_CD : params.data.asgn,
      COMP_CD : params.data.code,
    })
  })

  chart4.value.chart.on('click', function(params) {
    sAFIA0010Popup02.value.openPopup({ 
      CMPNY_DIV : params.data.div,
      BSNS_CD : params.data.bsns,
      ASGN_CD : params.data.asgn,
      COMP_CD : params.data.code,
    })
  })
})

const openPopup = val => {
  console.log("openPopup", val)
  dialog.value = true

  popupParams.CMPNY_DIV = val.CMPNY_DIV
  popupParams.YEAR = val.YEAR
  popupParams.QUARTER = val.QUARTER
  popupParams.BSNS_CD = val.BSNS_CD
  popupParams.BSNS_GBN = val.BSNS_GBN

  onButtonsClick({ id: "btnSearch" })
}

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if (btn.id === 'btnClose')
  {
    onClose()
  }
}

// 조회
const searchData = () =>{
  console.log('searchData : ', popupParams)

  return commonSearchApi({ queryId : 'SAFIA0010_SEARCH_02', param: popupParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log('afterSearch : ', res)

  if(res.ORESULT_CUR1.length > 0) {
    res.ORESULT_CUR1.forEach(item => {
      chartsOptions1.dataset.source.push({
        score: item.TOTAL,
        div: item.CMPNY_DIV,
        code: item.COMP_CD,
        bsns: item.BSNS_CD,
        asgn: item.ASGN_CD,
        company: item.COMP_NM,
      })
    })

    chart1.value.setOption(chartsOptions1)
  }

  if(res.ORESULT_CUR2.length > 0) {
    res.ORESULT_CUR2.forEach(item => {
      chartsOptions2.dataset.source.push({
        score: item.TOTAL,
        div: item.CMPNY_DIV,
        code: item.COMP_CD,
        bsns: item.BSNS_CD,
        asgn: item.ASGN_CD,
        company: item.COMP_NM,
      })
    })

    chart2.value.setOption(chartsOptions2)
  }

  if(res.ORESULT_CUR3.length > 0) {
    res.ORESULT_CUR3.forEach(item => {
      chartsOptions3.dataset.source.push({
        score: item.TOTAL,
        div: item.CMPNY_DIV,
        code: item.COMP_CD,
        bsns: item.BSNS_CD,
        asgn: item.ASGN_CD,
        company: item.COMP_NM,
      })
    })

    chart3.value.setOption(chartsOptions3)
  }

  if(res.ORESULT_CUR4.length > 0) {
    res.ORESULT_CUR4.forEach(item => {
      chartsOptions4.dataset.source.push({
        score: item.TOTAL,
        code: item.COMP_CD,
        div: item.CMPNY_DIV,
        bsns: item.BSNS_CD,
        asgn: item.ASGN_CD,
        company: item.COMP_NM,
      })
    })

    chart4.value.setOption(chartsOptions4)
  }
}

const onClose = () => {
  dialog.value = false

  chart1.value.clear()
  chart2.value.clear()
  chart3.value.clear()
  chart4.value.clear()

  chartsOptions1.dataset.source = []
  chartsOptions2.dataset.source = []
  chartsOptions3.dataset.source = []
  chartsOptions4.dataset.source = []
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>사업부별 평과결과</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="popupParams.YEAR"
                :label="$t('년도')"
                top-label
                label-width="60px"
                width="150px"
                readonly
              />
              <i-input
                v-model="popupParams.QUARTER"
                :label="$t('분기')"
                top-label
                label-width="60px"
                width="150px"
                readonly
              />
              <i-input
                v-model="popupParams.BSNS_GBN"
                :label="$t('사업부')"
                top-label
                label-width="60px"
                width="150px"
                readonly
              />
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
                  <Echart
                    ref="chart1"
                    class="pa-2"
                    autoresize
                  />
                </VCard>
              </v-sheet>
              <v-sheet 
                width="50%" 
                class="h-auto"
              >
                <VCard
                  color="inputDisabled"
                  variant="outlined"
                  width="100%"
                  height="100%"
                  min-height="300"
                >
                  <Echart
                    ref="chart2"
                    class="pa-2"
                    autoresize
                  />
                </VCard>
              </v-sheet>
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
                  <Echart
                    ref="chart3"
                    class="pa-2"
                    autoresize
                  />
                </VCard>
              </v-sheet>
              <v-sheet 
                width="50%" 
                class="h-auto"
              >
                <VCard
                  color="inputDisabled"
                  variant="outlined"
                  width="100%"
                  height="100%"
                  min-height="300"
                >
                  <Echart
                    ref="chart4"
                    class="pa-2"
                    autoresize
                  />
                </VCard>
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
      <SAFIA0010Popup02
        ref="sAFIA0010Popup02"
      />
    </v-card>
  </v-dialog>
</template>
