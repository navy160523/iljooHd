<!-- 
  화면명 : 업무상질병 대시보드
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper' 
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import { forEach } from 'lodash-es'
import dayjs from "dayjs"
import _ from 'lodash'
defineOptions({
  name: '100_health-HLT_J-HLTJA0010',
})
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from "@/utils/excel"
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'
import Echart from 'vue-echarts'
import * as echarts from 'echarts';
import HLTJA0010Svg from './HLTJA0010Svg.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const menuTitle2 = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const fileUploadPopup = ref(null)
const Popup = ref(null)
const Popup2 = ref(null)
const saveParams = reactive([]);
let selectedRow = ref([]);
let selectedRow2 = ref([]);
let fileCheck = null;
const commonStore = useCommonStore()
const chart = ref(null)
let resData = ref([])
const selectedYM = ref('')
const selectedYMLabel = ref('')
const cal1 = ref(null)
const cal2 = ref(null)
const cal3 = ref(null)
const cal4 = ref(null)
// 주요 질환 비중
const seriesData1 = ref([])
// 사업부별 질병현황
const seriesData2 = ref([])
// 선택된 월
const selectedMonth = ref([])
// 전년월 대비 승인율
const rate = ref([])
// 재작자 수
const pCnt1 = ref([])
const pCnt2 = ref([])
// 재직자의 %
// let percent = ''
const percent = ref(0)

const searchParams = reactive({
  YM: ''
})

const searchParams2 = reactive({
  YEAR: new Date().getFullYear().toString(),
  MONTH: (new Date().getMonth() + 1).toString().padStart(2, '0')
  // MONTH: '03'
})

const codeList = reactive({
  OK: [],
  BSNS_TYPE: [
    { COD: 'A', TXT: '조선' },
    { COD: 'B', TXT: '해양' },
    { COD: 'C', TXT: '엔진' },
    { COD: 'D', TXT: '특수선' },
    // { COD: 'E', TXT: '기타' },
  ],
})

const initCodeList = () => {
  // console.log("manSvg", manSvg)
  Promise.all([
    commonSearchApi({
      queryId: 'HLTJA0010_SEARCH_01',
      param: {},
    }),
    commonSearchApi({
      queryId: 'HLTJA0010_SEARCH_03',
      param: searchParams2,
    }),
    commonSearchApi({
      queryId: 'HLTJA0010_SEARCH_04',
      param: searchParams2,
    }),
    // commonSearchApi({
    //   queryId: 'HLTJA0010_SEARCH_05',
    //   param: {},
    // }),
  ]).then((res) => {
    // console.log("resss", res[4]?.ORESULT_CUR)
    // console.log("res", res)
    // console.log("res1111111", res[1]?.ORESULT_CUR)
    // ECHART
    updateChartOptions1(res[0]?.ORESULT_CUR)
    codeList.OK = res[1].ORESULT_CUR
    // 주요질환비중에 사용
    resData.value = res[0]?.ORESULT_CUR

    // 전년월 대비 승인율
    // 현재 월 승인율 - 작년 월 승인율
    // rate.value = resData.value[0].APPROVAL_RATE - resData.value[12].APPROVAL_RATE
    rate.value = resData.value[12].APPROVAL_RATE - resData.value[0].APPROVAL_RATE
    // console.log("rate", rate.value)

    // 재직자 수
    pCnt1.value = res[3]?.ORESULT_CUR?.[0]?.CNT


    // 사업부별 업무상 질병 현황
    codeList.BSNS_TYPE = res[2].ORESULT_CUR
    const chartRawData = res[2].ORESULT_CUR
    seriesData2.value = chartRawData
      .map(item => {
      const label = codeList.BSNS_TYPE.find(code => code.COD === item.BSNS_TYPE_TXT)?.TXT || item.BSNS_TYPE_TXT;
      return {
        name: label,
        value: item.OK_DISEASE_PERSON_CNT
      };
    });

  // 3. 차트 갱신
  chartOption2.value.series[0].data = seriesData2.value;



  // 승인건수 중 가장 마지막 월의 주요질환비중 
  const last = resData.value[resData.value.length - 1]

  // 이번 월의 승인된 질병자 수만 저장
  // pCnt2.value = last.DIS_APPR

  // 마지막 월을 변수에 저장
  // 색을 따로 주기 위함
  selectedMonth.value = last
  // console.log("selectedMonth", selectedMonth.value) 
  // console.log("last", last)
  searchParams.YM = last.YM
  if (last) {
    handleYMSelect(last.YM)
    Promise.all([
    commonSearchApi({
        queryId: 'HLTJA0010_SEARCH_02', 
        param: searchParams,
    }),
    commonSearchApi({
        queryId: 'HLTJA0010_SEARCH_06', 
        param: searchParams,
    })
  ]).then(([res1, res2]) => {
    // console.log('도넛 차트용 데이터1', res1)
    // console.log('도넛 % 데이터', res2)
    
    chartOption1.value.series[0].data = res1.ORESULT_CUR
    .map(item => {
      if (item.CNT === 0) {
        return {
          name: item.DISEASE_NAME,
          value: 0,
          label: { show: false },
          labelLine: { show: false }
        };
      } else {
        return {
          name: item.DISEASE_NAME,
          value: item.CNT
        };
      }
    })
    
    // % 데이터
    // 승인, 일부승인 중 재직인 사람 수
    const worker = new Set(res2.ORESULT_CUR.map(item => item.EMP_NO)).size;
    // 승인, 일부승인 중 재직인 사람의 전체 질병 수
    const totalCnt = res2.ORESULT_CUR.reduce((sum, item) => sum + item.CNT, 0);
    // console.log('총 CNT 합계:', totalCnt);
    // console.log('총 :', worker);
    percent.value = ((worker / totalCnt) * 100).toFixed(1)
    })
  }

  const ok1 = Number(codeList.OK[0]?.BONE_OK_CNT)
  const result1 = Number(codeList.OK[0]?.BONE_RESULT_CNT)
  cal1.value = ok1 / result1

  const ok2 = Number(codeList.OK[0]?.BREATH_OK_CNT)
  const result2 = Number(codeList.OK[0]?.BREATH_RESULT_CNT)
  cal2.value = ok2 / result2

  const ok3 = Number(codeList.OK[0]?.EAR_OK_CNT)
  const result3 = Number(codeList.OK[0]?.EAR_RESULT_CNT)
  cal3.value = ok3 / result3

  const ok4 = Number(codeList.OK[0]?.ETC_OK_CNT)
  const result4 = Number(codeList.OK[0]?.ETC_RESULT_CNT)
  cal4.value = ok4 / result4
  })
}
// 화면 렌더링시에 보이게
const handleYMSelect = (ym, value = 0) => {
  selectedYM.value = ym
  selectedYMLabel.value = `${ym.slice(0, 4)}년 ${ym.slice(5)}월`
  // approvalRate.value = value
}

const chartOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: []
  },
  grid: {
    left: '10%',
    right: '10%',
    bottom: '10%', 
  },
  xAxis: {
    type: 'category',
    // name: '월',
    data: [],
    axisLabel: {
      rotate: 0,
      interval: 0,
      // fontSize: 12,
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '질병자 수',
      position: 'left',
      offset: 0
    },
    {
      type: 'value',
      name: '승인율(%)',
      min: 0,
      max: 100,
      position: 'left',
      offset: 65,
      splitLine: {
      show: false 
      }
    },
  ],
  series: []
});
function updateChartOptions1(data) {
  // console.log("Edata", data)

  // X축 라벨용
  const labels = data.map(d => d.LABEL || '-');
  
  // Series 데이터
  // const disApprData = data.map(d => d.DIS_APPR ?? 0);
  const disApprData = data.map(d => ({
    value: d.DIS_APPR ?? 0,
    ym: d.YM, // 년월 - 그래프 클릭 시 오른쪽에 질환 비중 원그래프 띄우기 위해서 넣음
  }))
  // console.log("disApprData", disApprData)
  // const approvalRateData = data.map(d => d.APPROVAL_RATE ?? 0);
  const approvalRateData = data.map(d => ({
    value: d.APPROVAL_RATE ?? 0,
    ym: d.YM,
  }))
  // console.log("approvalRateData", approvalRateData)

  chartOption.value.legend.data = ['업무상 질병자(명)', '승인율(%)'];
  chartOption.value.xAxis.data = labels;

  chartOption.value.series = [
    {
      name: '업무상 질병자(명)',
      type: 'bar',
      data: disApprData,
      label: {
        show: false,
        formatter: '{c}명',
        position: 'top'
      },
      itemStyle: {
        // color: '#9e9e9e'
        color: function (params) { 
          const dataYM = params.data.ym
          const dataMM = dataYM?.split('-')[1] // mm
          const selectedMM = selectedMonth.value.YM?.split('-')[1] // mm
          // console.log("dataMM", dataMM)
          // console.log("selectedMM", selectedMM)
          // console.log('조건 결과:', dataMM === selectedMM)
          return dataMM === selectedMM ? '#5c6bc0' : '#cccccc' // 파란색 vs 회색
        }
      }
    },
    {
      name: '승인율(%)',
      type: 'line',
      yAxisIndex: 1,
      data: approvalRateData,
      label: {
        show: true,
        position: 'top',
        // formatter: '{c}%',
        formatter: (params) => {
        const totalLength = approvalRateData.length;
        if (params.dataIndex === 0 || params.dataIndex === totalLength - 1) {
          return `${params.value}%`;
        }
        return '';
      }
      },
      symbol: 'circle',
      itemStyle: { 
        color: '#2196f3'
      },
    }
  ];
}

// 막대 그래프 클릭
// const barClick = (params) => {
//   console.log("바클릭", params)
//   selectedMonth.value = params.name

//   const ym = params.data?.ym
//   // console.log("ym", ym)
//   searchParams.YM = ym

//   // 상세 원그래프
//   selectedYM.value = ym
//   selectedYMLabel.value = `${ym.slice(0, 4)}년 ${ym.slice(5)}월`

//   Promise.all([
//     commonSearchApi({
//       queryId: 'HLTJA0010_SEARCH_02', 
//       param: searchParams,
//     }),
//   ]).then((res) => {
//     // console.log("승인질환비중2", res)
//     const result = res[0]?.ORESULT_CUR
//     chartOption1.value.series[0].data = result
//     .map(item => {
//         if (item.CNT === 0) {
//         return {
//           name: item.DISEASE_NAME,
//           value: 0,
//           label: { show: false },
//           labelLine: { show: false }
//         };
//       } else {
//         return {
//           name: item.DISEASE_NAME,
//           value: item.CNT
//         };
//       }
//       })
//       // .filter(item => item.CNT > 0)
//     //   .map(item => ({
//     //   name: item.DISEASE_NAME,
//     //   value: item.CNT
//     // }))
//   })
// }

// 주요질환비중 도넛그래프
const chartOption1 = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}건 ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: '10%',
    top: 'middle',
  },
  series: [
    {
      name: '질환 비중',
      type: 'pie',
      radius: ['75%', '45%'], // 도넛 크기 
      center: ['35%', '50%'], // x축, y축
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'outside',
        formatter: (params) => {
    return params.value === 0 ? '' : `${params.value}`;
  }
        // formatter: '{c}'
        // formatter: '{b}\n{d}' // 질환명
      },
      labelLine: {
        show: true,
        length: 45, // 원에서 선까지 길이
        length2: 10,
        showAbove: false,
        // lineStyle: {
        //   opacity: (params) => (params.data.value === 0 ? 0 : 1)
        // }
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      data: [], // 데이터 삽입
    }
  ],
  graphic: [
  {
    type: 'text',
    left: 130,
    top: 'middle',
    style: {
      text: '재직자', // 넣고 싶은 중앙 텍스트 
      textAlign: 'center',
      fill: '#333',
      fontSize: 18,
      fontWeight: 'bold',
    },
  }
  ]
});
// watch(percent, (newVal) => {
//   chartOption1.value.graphic[0].style.text = `재직자\n${newVal}%`;
//   // chartOption1.value.graphic[0].style.text = `재직자\n${10}%`;
//   //chartInstance.setOption(chartOption1.value, true); // 갱신 반영
// });


// 사업부별 업무상 질병 현황 원그래프
const chartOption2 = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}명 ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: '10%',
    top: '20%',
    formatter: (name) => {
      const item = seriesData2.value.find(d => d.name === name);
      return `${name} ${item?.value ?? 0}명`;
    }
  },
  series: [
    {
      // name: '승인 질병건수',
      type: 'pie',
      // radius: ['40%', '70%'],
      center: ['30%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: false
      },
      labelLine: {
        show: false
      },
      data: seriesData2.value,
    }
  ]
});

onMounted(() => {
  initCodeList()

  // echart 리사이즈
  // 가끔 부모영역의 크기를 못받아올때가 있어서 resize
  nextTick(() => {
    const chartR = chart.value; // ref="chart"
    chartR && chartR.resize();
  });
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    
    <v-window class="h-window">
      <v-window-item>
        <v-sheet class="pa-0 h-auto mr-3">
          <v-card-text class="pa-3 pt-0 content-area">
            <div class="d-flex flex-column fill-height posi-box">
              <div class="posi">
                <div class="posii">
                  <!-- <p class="titledo2">전년월 대비 <br> 승인율 <span class="ratel">{{ rate }}%</span></p> -->
                  <p class="titledo2">전년월 대비 <br> 승인율 <span :class="['ratel', rate < 0 ? 'red' : 'blue']">{{ rate }}%</span></p>
                </div>
              </div>
              <div class="border rounded hltja mb-6">
                <h3 class="pa-2">업무상질병 승인 건수 · 승인율 추이</h3>
                <div class="d-flex">
                  <v-sheet width="70%" height="330px">
                    <Echart
                        ref="chart" 
                        :option="chartOption"
                        autoresize
                        class="echarts_style"
                        />
                        <!-- @click="barClick" -->
                  </v-sheet>
  
                  <!-- 펼쳐지는 박스 -->
                  <transition name="slide-expand">
                    <div v-if="selectedYM" class="expand-box">
                      <!-- 삼각형 -->
                      <div class="triangle" />
  
                      <!-- 네모 박스 -->
                      <div class="box-content">
                        <div>
                          <p class="titledo">{{ selectedYMLabel }} 승인된 주요 질환 비중</p>
                          <!-- <p class="titledo">전년월 대비 승인율 <span class="ratel">{{ rate }}%</span></p> -->
                        </div>
                        <div class="inner-placeholder">
                          <div class="inner">
                            <p>{{ isNaN(percent) || percent == null ? 0 : percent }}%</p>
                          </div>
                          <v-sheet width="100%" height="100%">
                            <Echart
                                ref="chart1" 
                                :option="chartOption1" 
                                autoresize
                                class="echarts_style"
                              />
                          </v-sheet>
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>
              </div>

              <div class="hltja d-flex justify-space-between">
                <div class="border rounded hltja1">
                  <h3 class="pa-3 mb-5">업무상질병 판정/승인 현황</h3>
                  <div class="d-flex justify-space-around align-center">
                    <!-- 사람모양 svg -->
                    <div class="d-flex flex-column">
                      <HLTJA0010Svg v-if="cal1 !== null" :fill-ratio="cal1" />
                      <p class="text-center svgFont1" style="margin-top: -20px; font-weight: bold;">근골격계질환</p> 
                      <p class="text-center svgFont2" style="font-weight: bold;">{{ codeList.OK[0]?.BONE_RESULT_CNT ?? 0 }} / {{ codeList.OK[0]?.BONE_OK_CNT ?? 0 }}</p>
                    </div>
                    <div class="d-flex flex-column">
                      <HLTJA0010Svg v-if="cal2 !== null" :fill-ratio="cal2" />
                      <p class="text-center svgFont1" style="margin-top: -20px; font-weight: bold;">호흡기계</p>
                      <p class="text-center svgFont2" style="font-weight: bold;">{{ codeList.OK[0]?.BREATH_RESULT_CNT ?? 0 }} / {{ codeList.OK[0]?.BREATH_OK_CNT ?? 0 }}</p>
                    </div>
                    <div class="d-flex flex-column">
                      <HLTJA0010Svg v-if="cal3 !== null" :fill-ratio="cal3" />
                      <p class="text-center svgFont1" style="margin-top: -20px; font-weight: bold;">소음성난청</p>
                      <p class="text-center svgFont2" style="font-weight: bold;">{{ codeList.OK[0]?.EAR_RESULT_CNT ?? 0 }} / {{ codeList.OK[0]?.EAR_OK_CNT ?? 0 }}</p>
                    </div>
                    <div class="d-flex flex-column">
                      <HLTJA0010Svg v-if="cal4 !== null" :fill-ratio="cal4" />
                      <p class="text-center svgFont1" style="margin-top: -20px; font-weight: bold;">기타</p>
                      <p class="text-center svgFont2" style="font-weight: bold;">{{ codeList.OK[0]?.ETC_RESULT_CNT ?? 0 }} / {{ codeList.OK[0]?.ETC_OK_CNT ?? 0 }}</p>
                    </div>
                  </div>
                </div>
                <!-- style="background-color: #f0f4ff" -->
                <div class="border rounded hltja2"> 
                  <h3 class="pa-3 mb-5">사업부별 업무상 질병 현황</h3>
                    <div class="d-flex justify-center align-center flex-column" style="height: 290px;"> 
                        <v-sheet width="80%" height="100%">
                          <Echart
                            ref="chart2" 
                            :option="chartOption2" 
                            autoresize
                            class="echarts_style"
                            />
                        </v-sheet>
                    </div>
                </div>
              </div>
            </div>
         </v-card-text>
        </v-sheet>
      </v-window-item>
    </v-window>
    
  </v-card>
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
    min-height: 400px;
  }
}

.posi-box {
  position: relative;
}

.posi {
  position: absolute; 
  top: 7px; 
  right: 680px;
  background-color: #f0f4ff;
  width: 150px;
  height: 70px;
  border-radius: 8px;
}

.posii {
  width: 150px;
  height: 85px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hltja {
  // height: 364px;
  height: 50%;
}
.hltja1 {
  width: 64%;
}
.hltja2 {
  width: 34%;
}
.jacan {
  width: 500px;
  // height: ;
}

/* 삼각형 + 사각형 전체 */
.expand-box {
  display: flex;
  align-items: center;
  position: relative;
}

/* 삼각형 화살표 */
.triangle {
  position: absolute;
  z-index: 999;
  left: -50px;
  width: 0;
  height: 0;
  border-top: 16px solid transparent;
  border-bottom: 16px solid transparent; 
  border-left: 20px solid #f0f4ff;
}
 
/* 내용 박스 */
.box-content {
  background-color: #f0f4ff;
  padding: 20px 24px;
  border-radius: 8px;
  min-width: 500px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: absolute;
  z-index: 999;
  margin-left: -20px;
}

/* 제목 */
.titledo {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 16px;
}

.titledo2 {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 16px;
}

/* 내부 그래프 자리 */
.inner-placeholder {
  height: 200px;
  position: relative;
}
.inner {
  position: absolute;
  top: 110px;
  left: 130px; 
  font-weight: bold;
}

.inner>p {
  width: 60px;
  text-align: center;
}

/* 슬라이드 효과 */
.slide-expand-enter-active,
.slide-expand-leave-active {
  transition: all 0.4s ease;
}
.slide-expand-enter-from,
.slide-expand-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.svgFont1 {
  font-size: 15px;
}
.svgFont2 {
  font-size: 18px;
  margin-top: 3px;
}

.ratel {
  color: red
}
</style>
