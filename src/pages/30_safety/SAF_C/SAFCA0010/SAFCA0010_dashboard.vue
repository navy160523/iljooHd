<script setup>
import { ref, reactive, onBeforeMount, getCurrentInstance } from 'vue'
onBeforeMount(() => {
  setBarChart()
})
const business = ref({
  id: 'ALL',
  list : [
    { id: 'ALL', text: '전체' }  
  ]
})

const setStateCount = (count) => {
  let num = count || 0
  return num < 10 ? '0' + num : num.toString();
}

const stateList = ref([
  { title : '총 점검', count: 9, percent: 85, people: 6, not: 3, plan: 0, result: 0, color: 'black' },
  { title : '일상점검', count: 0, percent: 75, people: 0, not: 0, plan: 0, result: 0, color: 'primary' },
  { title : '특별점검', count: 9, percent: 90, people: 6, not: 3, plan: 0, result: 0, color: 'warning' },
  { title : '고위험', count: 0, percent: 90, people: 0, not: 0, plan: 0, result: 0, color: 'error' }
])
const stateCountList = ref([
  { id: 'people', text: '점검인원' },
  { id: 'not', text: '미실시' },
  { id: 'plan', text: '점검계획' },
  { id: 'result', text: '점검실적' },
])

const pieChart = ref({
  option: {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '2%',
      left: 'center',
      align: 'right',
      padding: [5, 10],
      textStyle: {
        color: '#666666',
        fontFamily: 'pretendard',
        padding: [0, 2, 0, 0]
      },
      icon: 'rect',
      itemGap: 20,
      itemWidth: 14,
      itemHeight: 10,
    },
    series: [
      {
        name: 'Manager',
        type: 'pie',
        top: '20%',
        startAngle: -40,
        radius: ['80%', '50%'],
        label: {
          show: false,
          position: 'center'
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 9, name: '안전요원', itemStyle: { color: '#FF7637' } },
          { value: 9, name: '안전지키미', itemStyle: { color: '#94C81B' } },
          { value: 9, name: '관리감독자', itemStyle: { color: '#16C3F4' } },
          { value: 3, name: '기타', itemStyle: { color: '#000000' } },
        ]
      }
    ]
  }
})
const barChart = ref({
  option: {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      top: '2%',
      right: '0',
      align: 'right',
      padding: [5, 10],
      textStyle: {
        color: '#666666',
        fontFamily: 'pretendard',
        padding: [0, 2, 0, 0],
      },
      icon: 'rect',
      itemGap: 20,
      itemWidth: 14,
      itemHeight: 10,

    },
    grid: {
      top: '12%',
      left: '1%',
      right: '1%',
      bottom: '4%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        offset: 10,
        axisLabel: {
          fontFamily: 'pretendard',
          color: '#666666',
          padding: [0, 4, 0, 0],
        },
        axisLine: {
          lineStyle: {
            color: '#E4E4E4',
          }
        },
        axisTick: {
          show: false
        },
        data: [
          '엔진개발사업부', '엔진PSM관리부', '소재생산부', '프로펠라생산부',
          '크랭크생산부', '기계가공부', '대형엔진시운전1부', '힘센엔진시운전부',
          '대형엔진시운전3부', '대형엔진시운전2부', '엔진기계자재운영부', '엔진기계안전부'
        ]
      }
    ],
    yAxis: [
      {
        type: 'value',
        max: 1600,
        min: 0,
        maxInterval: 200,
        minInterval: 200,
        offset: 5,
        axisLabel: {
          fontFamily: 'pretendard',
          color: '#A2A8B5',
        },
        axisLine: {
          lineStyle: {
            color: '#E4E4E4',
          }
        }
        // nameTextStyle: {
        // }
      }
    ],
    series: []
  }
})
import bar from '@/pages/30_safety/SAF_C/SAFCA0010/barMock.json'
const setBarChart = () => {
  const setKeyColor = {
    plan: '#4C5DFA',
    daily: '#FEBF32',
    ptw: '#FF5252',
    agent: '#FF7637',
    keeper: '#94C81B',
    manager: '#16C3F4',
    etc: '#000000'
  }
  const menuList=['계획점검','일상점검','PTW','안전요원','안전지킴이','관리감독자','기타',]
  const list = bar.sort((a, b) => a.sort - b.sort)
  // const data = {}



  const series = Object.keys(setKeyColor).map((key, index) => {
    const color = setKeyColor[key]
    return {
      name: menuList[index],
      type: 'bar',
      barWidth: 12,
      barGap: '180%',
      stack:  ['plan','daily','ptw'].includes(key) ? 'inspection' : 'manager',
      label: {
        show: true,
        formatter: (param) => param.value === 0 ? '' : `{visible|${param.value}}`,
        rich: {
          visible: {
            fontFamily: 'pretendard',
            fontWeight: 400,
            fontSize: 11,
            color: '#222222',
            lineHeight: 14.32,
            width: 22,
            height: 16,
            padding: [0, 3],
            align: 'center',
            verticalAlign: 'middle',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderRadius: 3,
            borderColor: color,
          }
        }
      },
      data: list.map(obj => obj[key]),
      itemStyle: { color: color }
    }
  })
  barChart.value.option.series = series
  console.log(series)
}
</script>

<template>
  <div class="SAFCA0010_dashboard">
    <v-sheet class="searchArea d-flex">
      <i-input labelWidth="70px" width="190px" :label="$t('점검일자')" type="date" margin="10px"/>
      <i-input width="150px" :label="$t('-')" type="date"/>
      <i-select 
        :label="$t('사업부')"
        width="250px"
        v-model="business.id"
        :items="business.list"
        item-value="id"
        item-title="text"
      />
      <i-select 
        :label="$t('부서')"
        width="250px"
        v-model="business.id"
        :items="business.list"
        item-value="id"
        item-title="text"
      />
    </v-sheet>
    <v-sheet class="pa-0 d-flex align-center">
      <span class="mR-6 dashboard-title">안전점검 현황</span>
      <span>단위 : 건</span>
    </v-sheet>
    <v-sheet height="auto" class="mt-4 d-flex">
      <div class="h-grow">
        <v-sheet width="75%" class="mr-4 h-auto">
          <v-card class="py-4 p-relative" height="100%">
            <v-row no-gutters class="flex-nowrap">
              <template v-for="(state, state_index) in stateList" :key="state.title">
                <v-divider v-if="state_index !== 0" vertical />
                <v-col cols="3" class="pa-0 px-6">
                  <v-card-title class="pa-0 mb-3 mainCaption2">
                    {{ state.title }}
                  </v-card-title>
                  <v-col class="pa-0 d-flex align-center justify-space-between">
                    <span class="mainCaption6"><b class="dashboard-state-count" :class="`text-${state.color}`">{{ setStateCount(state.count) }}</b> 건</span>
                    <span class="mainCaption6">점검 <b class="mainCaption7">{{ state.percent }}</b>%</span>
                  </v-col>
                  <v-card-item class="mt-2">
                    <v-col class="py-2 px-5 px-xl-6">
                      <template v-for="stateCount in stateCountList" :key="stateCount.id">
                        <v-card-text class="pa-0 my-1 d-flex align-center justify-space-between">
                          <span>{{ stateCount.text }}</span>
                          <span class="font-weight-bold">{{ state[stateCount.id] }}</span>
                        </v-card-text>
                      </template>
                    </v-col>
                  </v-card-item>
                </v-col>
              </template>
            </v-row>
          </v-card>
        </v-sheet>
        <v-sheet width="25%" class="h-auto">
          <v-card height="100%" class="pa-3">
            <e-chart :option="pieChart.option" />
          </v-card>
        </v-sheet>
      </div>
    </v-sheet>
    <v-sheet class="mt-4 h-auto">
      <v-card height="100%" class="pa-3">
        <e-chart :option="barChart.option" />
      </v-card>
    </v-sheet>
  </div>
</template>
  
<style scoped lang="scss">
.SAFCA0010_dashboard {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  height: 100%;
  .dashboard-title {
    font-size: 18px; 
    font-weight: 700;
    line-height: 21.48px;
  }
  .v-card {
    border: 1px solid rgb(var(--v-theme-gridBorder)) !important;
    .v-card-item {
      // padding: 8px 24px !important;
      border-radius: 3px;
      background-color: #F7F7F7;
    }
    .dashboard-state-count {
      font-size: 40px;
      font-weight: 700;
    }
  }

}
</style>