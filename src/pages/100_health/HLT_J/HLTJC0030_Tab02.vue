<!-- 
  화면명 : 업무상질병 승인건수/ 발생률
  화면개요 : 업무상질병 승인건수/ 발생률
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, getCompanyList } from '@hiway/api/commonApi'
import ILabel from "@/components/ILabel.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import Echart from 'vue-echarts'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { useCommonStore } from '@hiway/stores/common'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()
const isAdmin = ref(false)
const menuTitle = ref(null)
const chart = ref(null)
const grdData = ref(null)

// 조회조건
const searchParams = reactive({
  DIV: 'Y',
  YEAR_FROM: Number(dayjs().get('year')) - 5,
  YEAR_TO: dayjs().get('year'),
  MONTH_FROM: 1,
  MONTH_TO: 12,
  BSNS_TYPE: '0'
})

const codeList = reactive({
  DIV: [
    { COD: 'Y', TXT: '년도' },
    { COD: 'M', TXT: '월' },
  ],
  BSNS_TYPE: [
    { COD: '0', TXT: '전체' },
    { COD: 'A', TXT: '조선' },
    { COD: 'B', TXT: '해양' },
    { COD: 'C', TXT: '엔진' },
    { COD: 'D', TXT: '특수선' },
    { COD: 'E', TXT: '기타' },
  ]
})

const colorType = ref([
  {color: '#0581FD', name: '전체'},
  {color: '#A88DFF', name: '소음성 난청'},
  {color: '#FFA756', name: '근골격계'},
  {color: '#A2E05E', name: '호흡기계'},
  {color: '#FF6B6B', name: '조혈기계'},
  {color: '#C77DFF', name: '뇌심혈관계'},
  {color: '#6C7A89', name: '피부계'},
  {color: '#FFE156', name: '신경계'},
  {color: '#70D6FF', name: '기타'},
])

// Chart(위험분류별 위험성평가 현황)
const chartsOptions = ref({
  tooltip: {
    trigger: 'axis',
    fontFamily: 'Pretendard',
    formatter: function(params) {
      let result = ''
      params.forEach(item => {
        result += `${item.marker} ${getColorName(item.color).name} ${item.seriesName}: ${item.value} <br/>`
      }) 
      return `${params[0].axisValue}<br/>${result}`
    }
  },
  legend: {
      data: []
  },
  grid: {
    left: '3%',
    right: '3%', 
    bottom: '13%',
  },
  toolbox: {
      show: true,
      feature: {
          saveAsImage: {
              title: '사진저장',
          }
      }
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLabel: {
      rotate: 25,
      interval: 0
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '건수',
    },
    {
      type: 'value',
      name: '%',
      // interval: 20, 
      axisLabel: {
        formatter: '{value} %'
      }
    }
  ],
  series: []
  },
)

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }
  getData()
  window.addEventListener('resize', resizeHandler)
})

const resizeHandler = () => {
  chart.value.resize()
}

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   return Message.warn(t('관리자만 사용가능합니다.'))
  // }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnWorkerCnt') {
    popup01.value.openPopup()
  }
}

// 그리드 데이터 조회
const getData = () => {
  // if(!isAdmin.value) {
  //   return Message.warn(t('관리자만 사용가능합니다.'))
  // }
  
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTJC0030_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  
  grdData.value = res.ORESULT_CUR
  drawChart()
}

const getColorName = (c) => {
  return colorType.value.find(item => item.color == c)
}

const drawChart = () => {
  const labelOption = { 
    show: true,
    position: 'insideTop',
    distance: 10,
    align: 'right',
    verticalAlign: 'middle',
    rotate: 90,
    // formatter: '{c}  {name|{a}}',
    fontFamily: 'Pretendard',
    fontSize: 16,
    rich: {
      name: {}
    } 
  }
  let chartData = []
  let chartTitle = []
  let resultData = makeChartData(grdData.value)
  chart.value.clear()
 
  if(searchParams.DIV == 'Y') {
    for(let i = searchParams.YEAR_FROM; i <= searchParams.YEAR_TO; i++) {
      chartTitle.push(i + '년')
    }
  } else {
    for(let i = searchParams.MONTH_FROM; i <= searchParams.MONTH_TO; i++) {
      chartTitle.push(i + '월')
    }
  }
  chartData.push({ data: resultData.map(item => item.ratio), 
    type: 'line', 
    name: '발생률(%)', 
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#0581FD" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.ok), 
    type: 'bar',  
    name: '승인건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.ok))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#0581FD').name
      }
    }, 
    emphasis: { 
      focus: 'series'
    },
    itemStyle: { color: "#0581FD" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.earRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}'}, 
    itemStyle: { color: "#A88DFF" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.earOk), 
    type: 'bar',  
    name: '승인건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.earOk))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#A88DFF').name
      }
    }, 
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#A88DFF" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.boneRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#FFA756" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.boneOk), 
    type: 'bar',  
    name: '승인건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.boneOk))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#FFA756').name
      }
    }, 
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#FFA756" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.breathRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}'}, 
    itemStyle: { color: "#A2E05E" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.breathOk), 
    type: 'bar',  
    name: '승인건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.breathOk))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#A2E05E').name
      }
    },
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#A2E05E" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.etcRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}'}, 
    itemStyle: { color: "#70D6FF" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.etcOk), 
    type: 'bar',  
    name: '승인건수', 
    barGap: 0,
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#70D6FF').name
      }
    },
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.etcOk))
    },
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#70D6FF" } 
  })

  chartsOptions.value.xAxis.data = chartTitle
  chartsOptions.value.series = chartData
  chartsOptions.value.legend.data.push('발생률(%)')
  chartsOptions.value.legend.data.push('승인건수')
  chart.value.resize()
}

const makeChartData = (data) => {
  let result = []
  if(searchParams.DIV == 'Y') {
    for(let i = searchParams.YEAR_FROM; i <= searchParams.YEAR_TO; i++) {
      result.push( {
        id: i, 
        ok: 0, earOk: 0, boneOk: 0, breathOk: 0, etcOk: 0,
        ratio: 0, earRatio:0, boneRatio: 0, breathRatio: 0, etcRatio: 0, } )
    }
  } else { 
    for(let i = searchParams.MONTH_FROM; i <= searchParams.MONTH_TO; i++) {
      result.push( {
        id: i, 
        ok: 0, earOk: 0, boneOk: 0, breathOk: 0, etcOk: 0,
        ratio: 0, earRatio:0, boneRatio: 0, breathRatio: 0, etcRatio: 0, } )
    }
  }
  data = data.filter(item => item.BSNS_TYPE == searchParams.BSNS_TYPE && item.YEAR != '합계')
  result.forEach(item => {
    for(let dt of data) {
      if(isNaN(dt.YEAR)) continue

      if(Number(dt.YEAR) == item.id) {
        item.ok = dt.OK_CNT
        item.earOk = dt.EAR_OK_CNT
        item.boneOk = dt.BONE_OK_CNT
        item.breathOk = dt.BREATH_OK_CNT
        item.etcOk = dt.ETC_OK_CNT
        item.ratio = dt.OCUR_RATIO
        item.earRatio = dt.EAR_OCUR_RATIO
        item.boneRatio = dt.BONE_OCUR_RATIO
        item.breathRatio = dt.BREATH_OCUR_RATIO
        item.etcRatio = dt.ETC_OCUR_RATIO
        break
      }
    }
  })

  return result
}

const getMarkPointData = (data) => {
  let result = []
  for(let i = 0; i < data.length; i++) {
    if(data[i] != 0) {
      result.push({
        value: data[i], 
        xAxis: i, 
        yAxis: data[i]
      })
    }
  }
  return result
}

watch(() => searchParams.BSNS_TYPE, (newValue, oldValue) => {
  drawChart()
})


watch(() => searchParams.YEAR_FROM, (newValue, oldValue) => {
  if(searchParams.DIV == 'M') return
  if(Math.abs(searchParams.YEAR_TO - searchParams.YEAR_FROM) > 10) {
    Message.warn(t('최대 10년치까지 조회 가능합니다.'))
    nextTick(() => {
      searchParams.YEAR_FROM = Number(searchParams.YEAR_TO) - 10
    })
  } 

  if(searchParams.YEAR_FROM > searchParams.YEAR_TO) {
    nextTick(() => {
      searchParams.YEAR_FROM = searchParams.YEAR_TO
    })
  }
})


watch(() => searchParams.YEAR_TO, (newValue, oldValue) => {
  if(searchParams.DIV == 'M') return
  if(Math.abs(searchParams.YEAR_TO - searchParams.YEAR_FROM) > 10) {
    Message.warn(t('최대 10년치까지 조회 가능합니다.'))
    nextTick(() => {
      searchParams.YEAR_TO = Number(searchParams.YEAR_FROM) + 10
    })
  }
  if(searchParams.YEAR_TO < searchParams.YEAR_FROM) {
    nextTick(() => {
      searchParams.YEAR_TO = searchParams.YEAR_FROM
    })
  }
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="t('업무상질병 승인건수/ 발생률')"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <ILabel :label="$t('검색구분')"/>
          <div style="width:170px; align-self: center;">
            <VRadioGroup
              v-model="searchParams.DIV"
              class="mt-auto pl-3 pr-3 radio"
              width="300px"
              inline
            >
              <VRadio
                v-for="(item, i) in codeList.DIV"
                :key="i"
                :value="item.COD"
                :label="item.TXT"
              />
            </VRadioGroup>
          </div>
          <div v-if="searchParams.DIV == 'Y'" class="d-flex"> 
            <i-input
              v-model="searchParams.YEAR_FROM"
              :label="$t('년도')"
              label-width="50px"
              type="Number"
              width="200px"
              :min="searchParams.YEAR_TO - 10"
              :max="searchParams.YEAR_TO"
            />
            <i-input
              v-model="searchParams.YEAR_TO"
              :label="$t('~')"
              label-width="10px"
              type="Number"
              width="160px"
              :min="searchParams.YEAR_FROM"
              :max="searchParams.YEAR_FROM + 10"
            />
          </div>
          <div v-if="searchParams.DIV == 'M'" class="d-flex"> 
            <i-input
              v-model="searchParams.YEAR_TO"
              :label="$t('년도')"
              label-width="50px"
              type="Number"
              width="200px"
            />
            <i-input
              class="ml-2"
              v-model="searchParams.MONTH_FROM"
              :label="$t('월')"
              label-width="30px"
              type="Number"
              width="180px"
              :min="1"
              :max="searchParams.MONTH_TO"
            />
            <i-input
              v-model="searchParams.MONTH_TO"
              :label="$t('~')"
              label-width="10px"
              type="Number"
              width="160px"
              :min="searchParams.MONTH_FROM"
              :max="12"
            />
          </div>
          <i-select
            class="ml-4"
            v-model="searchParams.BSNS_TYPE"
            :label="$t('사업부')"
            label-width="50px"
            :items="codeList.BSNS_TYPE"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          /> 
        </v-sheet>
        <v-sheet class="h-auto">
          <Echart
            ref="chart" 
            :option="chartsOptions" 
            class="pa-0 border rounded-sm echarts_style fill-height"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
  </v-card>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 50px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>