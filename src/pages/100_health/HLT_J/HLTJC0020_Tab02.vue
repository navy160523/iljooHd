<!-- 
  화면명 : 유소견 발생건수/ 발생률
  화면개요 : 유소견 발생건수/ 발생률
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
  YEAR_FROM: Number(dayjs().get('year')) - 5,
  YEAR_TO: dayjs().get('year'),
  BSNS_TYPE: '0'
})

const codeList = reactive({
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
  {color: '#A88DFF', name: '이비인후계'},
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

const getColorName = (c) => {
  return colorType.value.find(item => item.color == c)
}

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
  return commonSearchApi({ queryId: 'HLTJC0020_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  
  grdData.value = res.ORESULT_CUR
  drawChart()
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
  for(let i = searchParams.YEAR_FROM; i <= searchParams.YEAR_TO; i++) {
    chartTitle.push(i + '년')
  }

  chartData.push({ 
    data: resultData.map(item => item.ratio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#0581FD" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.wholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.wholeCnt))
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
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#A88DFF" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.earWholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.earWholeCnt))
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
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}'}, 
    itemStyle: { color: "#FFA756" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.boneWholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.boneWholeCnt))
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
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#A2E05E" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.breathWholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.breathWholeCnt))
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
    data: resultData.map(item => item.bloodRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#FF6B6B" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.bloodWholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.bloodWholeCnt))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#FF6B6B').name
      }
    }, 
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#FF6B6B" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.brainRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#C77DFF" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.brainWholeCnt), 
    type: 'bar',  
    name: '발생건수',    
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.brainWholeCnt))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#C77DFF').name
      }
    }, 
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#C77DFF" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.skinRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#6C7A89" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.skinWholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.skinWholeCnt))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#6C7A89').name
      }
    }, 
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#6C7A89" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.nervousRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#FFE156" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.nervousWholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.nervousWholeCnt))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#FFE156').name
      }
    }, 
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#FFE156" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.etcRatio), 
    type: 'line', 
    name: '발생률(%)',
    label: { show: true, position: 'top', fontFamily: 'Pretendard', formatter: '{c}' }, 
    itemStyle: { color: "#70D6FF" } 
  })
  chartData.push({ 
    data: resultData.map(item => item.etcWholeCnt), 
    type: 'bar',  
    name: '발생건수', 
    barGap: 0,
    markPoint: {
      data: getMarkPointData(resultData.map(item => item.etcWholeCnt))
    },
    label: {
      ...labelOption,
      formatter: function(params) {
        if(params.value == 0) return ''
        return getColorName('#70D6FF').name
      }
    }, 
    emphasis: {
      focus: 'series'
    },
    itemStyle: { color: "#70D6FF" } 
  })

  chartsOptions.value.xAxis.data = chartTitle
  chartsOptions.value.series = chartData
  chartsOptions.value.legend.data.push('발생률(%)')
  chartsOptions.value.legend.data.push('발생건수')
  chart.value.resize()
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

const makeChartData = (data) => {
  let result = []

  for(let i = searchParams.YEAR_FROM; i <= searchParams.YEAR_TO; i++) {
    result.push( {
      id: i, 
      wholeCnt: 0, earWholeCnt: 0, boneWholeCnt: 0, breathWholeCnt: 0, bloodWholeCnt: 0, 
      brainWholeCnt: 0, skinWholeCnt: 0, nervousWholeCnt: 0, etcWholeCnt: 0,
      ratio: 0,earRatio: 0, boneRatio: 0, breathRatio: 0, bloodRatio:0, brainRatio: 0, 
      skinRatio:0, nervousRatio: 0, etcRatio: 0
    } )
  }
  data = data.filter(item => item.BSNS_TYPE == searchParams.BSNS_TYPE && item.YEAR != '합계')
  result.forEach(item => {
    for(let dt of data) {
      if(dt.YEAR == item.id) {
        // item.ok.push([dt.WHOLE_CNT, dt.EAR_WHOLE_CNT, dt.BONE_WHOLE_CNT, BREATH_WHOLE_CNT])
        item.wholeCnt = dt.WHOLE_CNT
        item.earWholeCnt = dt.EAR_WHOLE_CNT
        item.boneWholeCnt = dt.BONE_WHOLE_CNT
        item.breathWholeCnt = dt.BREATH_WHOLE_CNT
        item.bloodWholeCnt = dt.BLOOD_WHOLE_CNT
        item.brainWholeCnt = dt.BRAIN_WHOLE_CNT
        item.skinWholeCnt = dt.SKIN_WHOLE_CNT
        item.nervousWholeCnt = dt.NERVOUS_WHOLE_CNT
        item.etcWholeCnt = dt.ETC_WHOLE_CNT
        item.ratio = dt.RATIO
        item.earRatio = dt.EAR_RATIO
        item.boneRatio = dt.BONE_RATIO
        item.breathRatio = dt.BREATH_RATIO
        item.bloodRatio = dt.BLOOD_RATIO
        item.brainRatio = dt.BRAIN_RATIO
        item.skinRatio = dt.SKIN_RATIO
        item.nervousRatio = dt.NERVOUS_RATIO
        item.etcRatio = dt.ETC_RATIO
        break
      }
    }
  })

  return result
}

watch(() => searchParams.BSNS_TYPE, (newValue, oldValue) => {
  drawChart()
})

watch(() => searchParams.YEAR_FROM, (newValue, oldValue) => {
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
        :title="t('유소견 발생건수')"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <div class="d-flex"> 
            <i-input
              v-model="searchParams.YEAR_FROM"
              :label="$t('년도')"
              label-width="50px"
              type="Number"
              width="200px"
            />
            <i-input
              v-model="searchParams.YEAR_TO"
              :label="$t('~')"
              label-width="10px"
              type="Number"
              width="160px"
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