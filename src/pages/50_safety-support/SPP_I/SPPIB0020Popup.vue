<!-- SPPIB0010Popup  폭발위험관리 산출 팝업 -->
<!-- SI2팀 손상규 2025-03-18 -->

<script setup>
import { ref, reactive, getCurrentInstance, onMounted, nextTick, computed, watchEffect } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import Echart from 'vue-echarts'
import { DatasetComponent, GridComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { use } from "echarts/core";
import { handleDragging } from '@/utils/useDrag'
import DeptPopup from "@/components/popup/DeptPopup.vue"

use([
  DatasetComponent,
  GridComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const emit = defineEmits(['upData'])

const menuTitle = ref(null)
const grdMain = ref(null)
const radioDisabled = ref(false)
const manageDisabled = ref(false)
const targetFacDisabled = ref(false)

//차트
const chart1 = ref(null)
const chart2 = ref(null)

//부서호출
const deptPopup = ref(null)

// 선 1 (파란색선)의 시작점과 끝점
const blueLineStart = [0.001, 0.014];  // [X, Y]
const blueLineEnd = [0.8, 10];         // [X, Y]

// 선 2 (빨간색선)의 시작점과 끝점
const redLineStart = [0.02, 0.001];    // [X, Y]
const redLineEnd = [100, 5];           // [X, Y]

const dynamicData = reactive({
  xValue: '', // 초기 X 값
  yValue: ''  // 초기 Y 값
});

const dilution_1 =ref('-')
const dilution_2 =ref('-')

const explosionData = [
  {
    level: '연속',
    values: [
      { category: '고희석', usage: '우수', text: '비위험 (0종 NE)ᵃ' },
      { category: '고희석', usage: '양호', text: '2종 장소(0종 NE)ᵃ' },
      { category: '고희석', usage: '미흡', text: '1종 장소 (0종 NE)ᵃ' },
      { category: '중희석', usage: '우수', text: '0종 장소' },
      { category: '중희석', usage: '양호', text: '0종 장소 + 1종 장소' },
      { category: '중희석', usage: '미흡', text: '0종 장소 + 1종 장소' },
      { category: '저희석', usage: '우수/양호/미흡', text: '0종 장소' }
    ]
  },
  {
    level: '1차',
    values: [
      { category: '고희석', usage: '우수', text: '비위험 (1종 NE)ᵃ' },
      { category: '고희석', usage: '양호', text: '2종 장소(1종 NE)ᵃ' },
      { category: '고희석', usage: '미흡', text: '2종 장소 (1종 NE)ᵃ' },
      { category: '중희석', usage: '우수', text: '1종 장소' },
      { category: '중희석', usage: '양호', text: '1종 장소 + 2종 장소' },
      { category: '중희석', usage: '미흡', text: '1종 장소 + 2종 장소' },
      { category: '저희석', usage: '우수/양호/미흡', text: '1종 또는 0종 장소ᶜ' }
    ]
  },
  {
    level: '2차',
    values: [
      { category: '고희석', usage: '우수', text: '비위험 (2종 NE)ᵃ' },
      { category: '고희석', usage: '양호', text: '비위험 (2종 NE)ᵃ' },
      { category: '고희석', usage: '미흡', text: '2종 장소' },
      { category: '중희석', usage: '우수', text: '2종 장소' },
      { category: '중희석', usage: '양호', text: '2종 장소' },
      { category: '중희석', usage: '미흡', text: '2종 장소' },
      { category: '저희석', usage: '우수/양호/미흡', text: '1종 및 0종 장소ᶜ' }
    ]
  }
];

const leakTypeData = [
  { COD:'저속 확산 누출(속도 손실 제트 누출)', TXT:'저속 확산 누출(속도 손실 제트 누출)' },
  { COD: '확산되는 Heavy 가스/증기', TXT: '확산되는 Heavy 가스/증기' },
  { COD: '고속의 제트', TXT: '고속의 제트' }
]

const leakSouData = [
  { COD: '연속', TXT: '연속' },
  {
    COD: '1차 - 정상작동 중에 인화성 물질의 누출이 예상되는 펌프, 압축기, 또는 밸브의 씰(Seals)',
    TXT: '1차 - 정상작동 중에 인화성 물질의 누출이 예상되는 펌프, 압축기, 또는 밸브의 씰(Seals)'
  },
  {
    COD: '1차 - 정상작동 중의 배수과정에서 대기로 인화성 물질이 누출될 수 있는 용기의 배수점(Water Drainage Point)',
    TXT: '1차 - 정상작동 중의 배수과정에서 대기로 인화성 물질이 누출될 수 있는 용기의 배수점(Water Drainage Point)'
  },
  {
    COD: '1차 - 정상작동 중 인화성 물질의 대기 누출이 예상되는 시료 채취점(Sample Point)',
    TXT: '1차 - 정상작동 중 인화성 물질의 대기 누출이 예상되는 시료 채취점(Sample Point)'
  },
  {
    COD: '1차 - 정상작동 중 인화성 물질의 대기 누출이 예상되는 릴리프밸브, 통기구, 및 기타 개구부(Openings)',
    TXT: '1차 - 정상작동 중 인화성 물질의 대기 누출이 예상되는 릴리프밸브, 통기구, 및 기타 개구부(Openings)'
  },
  {
    COD: '2차 - 설비의 정상작동 중에는 인화성 물질의 누출이 예상되지 않는 펌프, 압축기 및 밸브의 씰(Seals)',
    TXT: '2차 - 설비의 정상작동 중에는 인화성 물질의 누출이 예상되지 않는 펌프, 압축기 및 밸브의 씰(Seals)'
  },
  {
    COD: '2차 - 정상작동 중에는 인화성 물질의 누출이 예상되지 않는 플랜지, 연결부(Connection), 배관 피팅부(Pipe Fittings)',
    TXT: '2차 - 정상작동 중에는 인화성 물질의 누출이 예상되지 않는 플랜지, 연결부(Connection), 배관 피팅부(Pipe Fittings)'
  },
  {
    COD: '2차 - 정상작동 중에는 인화성 물질의 대기 누출이 예상되지 않는 시료 채취점',
    TXT: '2차 - 정상작동 중에는 인화성 물질의 대기 누출이 예상되지 않는 시료 채취점'
  },
  {
    COD: '2차 - 정상작동 중 인화성 물질의 대기 누출이 예상되지 않는 릴리프밸브, 통기구 및 기타 개구부 등',
    TXT: '2차 - 정상작동 중 인화성 물질의 대기 누출이 예상되지 않는 릴리프밸브, 통기구 및 기타 개구부 등'
  },
]


// 차트 1
const chartsOptions1 = reactive({
  responsive: false,
  renderer: 'svg',
  xAxis: {
    type: 'log', // 로그 스케일 적용
    logBase: 10, // 로그 기준 (10진법)
    min: 0.001,  // 최소값
    max: 100,    // 최대값,
    name: '누출특성 Wg/(Pg*k=LFL) (㎥/s)', // X축 설명 추가
    nameLocation: 'center', // 중앙 정렬
    nameTextStyle: {
      fontSize: 14,
      fontWeight: 'bold',
      padding: 10 // 축과 간격 조정
    },
    minorTick: {
      show: true, // 보조 눈금 활성화
      splitNumber: 10
    },
    minorSplitLine: {
      show: true, // 보조 눈금에 대한 그리드 표시
      lineStyle: {
        color: '#ddd', // 회색 계열로 설정
        width: 1,
        type: 'dashed' // 점선 스타일
      }
    }
  },
  yAxis: {
    type: 'log', // 로그 스케일 적용
    logBase: 10, // 로그 기준 (10진법)
    min: 0.001,  // 최소값
    max: 10,     // 최대값
    name: '환기 속도 Uw m/s', // Y축 설명 추가
    nameLocation: 'center', // 중앙 정렬
    nameRotate: 90, // 세로 정렬
    nameTextStyle: {
      fontSize: 14,
      fontWeight: 'bold',
      padding: 20 // 축과 간격 조정
    },
    splitNumber: 6, // 눈금 개수 조정 (100, 10, 1, 0.1, 0.01, 0.001),
    minorTick: {
        show: true,
        splitNumber: 10
      },
    minorSplitLine: {
      show: true,
      lineStyle: {
        color: '#ddd',
        width: 1,
        type: 'dashed'
      }
    }
  },
  series: [
    {
      type: 'line',
      encode: { x: 0, y: 1 },
      name: '선 1',
      data: [
        [0.001, 0.014],  // 시작점
        [0.8, 10]     // 끝점 (대각선 방향)
      ]
    },
    {
      type: 'line',
      color: 'red',
      encode: { x: 0, y: 1 },
      name: '선 2',
      data: [
        [0.02, 0.001],  // 시작점
        [100, 5]     // 끝점 (대각선 방향)
      ]
    },
    {
      type: 'line',
      color: 'orange',
      encode: { x: 0, y: 1 },
      name: '입력 X축 값',
      data: [
        [dynamicData.xValue, 0.001],
        [dynamicData.xValue, 10]
      ]
    },
    // 사용자가 입력한 Y축 값에 대한 가로 라인
    {
      type: 'line',
      color: 'orange',
      encode: { x: 0, y: 1 },
      name: '입력 Y축 값',
      data: [
        [0.001, dynamicData.yValue], [100, dynamicData.yValue]
      ]
    },
    // 교차점
    {
      type: 'scatter',
      color: 'orange',
      symbolSize: 10,
      name: '교차점',
      data: [
        [dynamicData.xValue, dynamicData.yValue]
      ]
    }
  ],
  graphic: [
    {
      type: 'rect',
      left: '40%', // X 좌표 (중희석)
      top: '40%', // Y 좌표
      shape: { width: 100, height: 50 },
      style: { fill: 'rgba(255, 255, 255, 0.8)', stroke: 'black' },
      z: 100
    },
    {
      type: 'text',
      left: '44%',
      top: '44%',
      style: {
        text: '중희석',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 'black',
        align: 'center',
        textAlign: 'center',
      },
      z: 101
    },
    {
      type: 'rect',
      left: '15%', // X 좌표 (고희석)
      top: '20%', // Y 좌표
      shape: { width: 100, height: 50 },
      style: { fill: 'rgba(255, 255, 255, 0.8)', stroke: 'black' },
      z: 100
    },
    {
      type: 'text',
      left: '19%',
      top: '24%',
      style: {
        text: '고희석',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 'black',
        align: 'center',
        textAlign: 'center',
      },
      z: 101
    },
    {
      type: 'rect',
      left: '70%', // X 좌표 (저희석)
      top: '60%', // Y 좌표
      shape: { width: 100, height: 50 },
      style: { fill: 'rgba(255, 255, 255, 0.8)', stroke: 'black' },
      z: 100
    },
    {
      type: 'text',
      left: '74%',
      top: '64%',
      style: {
        text: '저희석',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 'black',
        align: 'center',
        textAlign: 'center',
      },
      z: 101
    }
  ]
})

// 차트 2
const chartsOptions2 = reactive({
  responsive: false,
  renderer: 'svg',
  xAxis: {
    type: 'log', // 로그 스케일 적용
    logBase: 10, // 로그 기준 (10진법)
    min: 0.01,  // 최소값
    max: 100,    // 최대값,
    name: '누출특성 Wg/(Pg*k=LFL) (㎥/s)', // X축 설명 추가
    nameLocation: 'center', // 중앙 정렬
    nameTextStyle: {
      fontSize: 14,
      fontWeight: 'bold',
      padding: 10 // 축과 간격 조정
    },
    minorTick: {
      show: true, // 보조 눈금 활성화
      splitNumber: 10
    },
    minorSplitLine: {
      show: true, // 보조 눈금에 대한 그리드 표시
      lineStyle: {
        color: '#ddd', // 회색 계열로 설정
        width: 1,
        type: 'dashed' // 점선 스타일
      }
    }
  },
  yAxis: {
    type: 'log', // 로그 스케일 적용
    logBase: 10, // 로그 기준 (10진법)
    min: 1,  // 최소값
    max: 100,     // 최대값
    name: '폭발위험장소의 범위(m)', // Y축 설명 추가
    nameLocation: 'center', // 중앙 정렬
    nameRotate: 90, // 세로 정렬
    nameTextStyle: {
      fontSize: 14,
      fontWeight: 'bold',
      padding: 20 // 축과 간격 조정
    },
    splitNumber: 3, // 눈금 개수 조정 (100, 10, 1),
    minorTick: {
        show: true,
        splitNumber: 10
      },
    minorSplitLine: {
      show: true,
      lineStyle: {
        color: '#ddd',
        width: 1,
        type: 'dashed'
      }
    }
  },
  // dataset: {
  //   source: [
  //   ]
  // },
  series: [
    {
      type: 'line',
      color: 'red',
      encode: { x: 0, y: 1 },
      data: [
        [0.028, 1.5],  // 시작점
        [28, 50]       // 끝점 (대각선 방향)
      ],
      label: {
        show: false
      },
      markPoint: {
        symbol: 'circle',  // 심볼을 작은 점으로 유지
        symbolSize: 1,     // 심볼 크기를 최소화하여 보이지 않도록 설정
        data: [
          {
            coord: [28, 50], // 끝 지점의 좌표
            label: {
              show: true,
              formatter: '무거운 가스', // 표시할 텍스트
              fontSize: 10,
              fontWeight: 'bold',
              color: 'black',
              position: 'insideEnd', // 선 끝 부분에 정렬
              align: 'left' // 왼쪽 정렬로 텍스트 위치 보정
            }
          }
        ]
      }
    },
    {
      type: 'line',
      color: 'blue',
      encode: { x: 0, y: 1 },
      data: [
        [0.058, 1],  // 시작점
        [31, 24]     // 끝점 (대각선 방향)
      ],
      label: {
        show: false
      },
      markPoint: {
        symbol: 'circle',  // 심볼을 작은 점으로 유지
        symbolSize: 1,     // 심볼 크기를 최소화하여 보이지 않도록 설정
        data: [
          {
            coord: [31, 24], // 끝 지점의 좌표
            label: {
              show: true,
              formatter: '저속의 확산', // 표시할 텍스트
              fontSize: 10,
              fontWeight: 'bold',
              color: 'black',
              position: 'insideEnd', // 선 끝 부분에 정렬
              align: 'left' // 왼쪽 정렬로 텍스트 위치 보정
            }
          }
        ]
      }
    },
    {
      type: 'line',
      color: 'green',
      encode: { x: 0, y: 1 },
      data: [
        [0.22, 1],  // 시작점
        [31, 14]     // 끝점 (대각선 방향)
      ],
      label: {
        show: false
      },
      markPoint: {
        symbol: 'circle',  // 심볼을 작은 점으로 유지
        symbolSize: 1,     // 심볼 크기를 최소화하여 보이지 않도록 설정
        data: [
          {
            coord: [31, 14], // 끝 지점의 좌표
            label: {
              show: true,
              formatter: '고속의 제트', // 표시할 텍스트
              fontSize: 10,
              fontWeight: 'bold',
              color: 'black',
              position: 'insideEnd', // 선 끝 부분에 정렬
              align: 'left' // 왼쪽 정렬로 텍스트 위치 보정
            }
          }
        ]
      }
    }
  ]
})

// 차트기울기를 이용한 환기유효성 판단
function getRegion(xValue, yValue) {
  // 파란색선과 빨간색선의 기울기 계산
  const blueSlope = (blueLineEnd[1] - blueLineStart[1]) / (blueLineEnd[0] - blueLineStart[0]);
  const redSlope = (redLineEnd[1] - redLineStart[1]) / (redLineEnd[0] - redLineStart[0]);

  // 교차점 판단 (교차점의 Y값을 기준으로)
  const yBlue = blueSlope * (xValue - blueLineStart[0]) + blueLineStart[1]; // 파란색선의 Y값
  const yRed = redSlope * (xValue - redLineStart[0]) + redLineStart[1];   // 빨간색선의 Y값

  // 교차점이 어느 구역에 속하는지 판단
  if (yValue > yBlue) {
    return '고희석';  // 파란색선 위
  } else if (yValue < yRed) {
    return '저희석';  // 빨간색선 아래
  } 
  else {
    return '중희석';  // 두 선 사이
  }
}

// 사용자가 입력한 교차점에 대해 구역을 판단
function checkRegion() {
  if (dynamicData.xValue && dynamicData.yValue) {
    const region = getRegion(parseFloat(dynamicData.xValue), parseFloat(dynamicData.yValue));
    dilution_1.value = searchParams.DILUTION?'-':region
    searchParams.DILUTION = searchParams.DILUTION?searchParams.DILUTION:region;
  } else {
    console.log('X 값 또는 Y 값이 입력되지 않았습니다.');
  }
}

// 차트2 
const calculateExplosionRange = () => {
  const leakChar = searchParams.LEAK_CHAR; // 누출특성 (X좌표)
  const leakType = searchParams.LEAK_TYPE; // 누출유형 (선의 색)

  // 각 선에 해당하는 데이터를 저장합니다.
  const lines = {
    '저속의 확산': { // 파란색 선
      data: [
        [0.058, 1],
        [31, 24]
      ]
    },
    '무거운 가스': { // 빨간색 선
      data: [
        [0.028, 1.5],
        [28, 50]
      ]
    },
    '고속의 제트': { // 초록색 선
      data: [
        [0.22, 1],
        [31, 14]
      ]
    }
  };

  // 누출유형에 해당하는 선을 선택하는 함수
  const getLeakTypeLine = (leakType) => {
    if (leakType.includes('저속')) {
      return lines['저속의 확산'];
    } else if (leakType.includes('Heavy')) {
      return lines['무거운 가스'];
    } else if (leakType.includes('고속')) {
      return lines['고속의 제트'];
    }
    return null; // 해당되는 선이 없으면 null 반환
  };

  const selectedLine = getLeakTypeLine(searchParams.LEAK_TYPE);

  if (selectedLine) {
    // 선의 데이터에서 X좌표가 누출특성에 해당하는 부분을 찾습니다.
    const [x1, y1] = selectedLine.data[0];
    const [x2, y2] = selectedLine.data[1];

    // X좌표가 누출특성보다 작으면 그 전에 교차점이 없으므로, 해당 선의 Y값을 계산합니다.
    if (leakChar >= x1 && leakChar <= x2) {
      const slope = (y2 - y1) / (x2 - x1); // 기울기 계산
      const yIntersection = y1 + slope * (leakChar - x1); // X값에 해당하는 Y값 계산

      // 계산된 Y값을 EXPL_RANGE에 할당
      searchParams.EXPL_RANGE = yIntersection.toFixed(2);
    } else {
      searchParams.EXPL_RANGE = '-'
    } 
  } 
};

const initParams = reactive({
  //제목, 부제
  AREA_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  DEPT_NM: '',
  MANAGE_NUM: '',   // 관리번호
  TARGET_FAC: '',   // 대상설비 (설비 및 공정)
  PROJNO: '',       // 프로젝트번호
  NEW_FLAG: '',     // 신규/변경

  //누출원의평가 입력폼
  SUBS_NM: '',      // 물질명
  FORMULA: '',      // 분자식
  MOLECULAR: 0,    // 분자량
  POLYTRO: 0,      // 비열비
  INT_PRE: 0,      // 내부압력
  REGF_PRE: 0,     // r=Cp/Cv
  IN_TEM: 0,       // 내부온도
  IN_TEM2: 0,      // 내부온도 K
  LOWER_EXPL: 0,   // 폭발하한 kg/m3
  LOWER_EXPL2: 0,
  GAS_DENS: 0,     // 가스밀도 Pg
  ATMO_PREPA: 101325,   // 대기압 Pa
  ATMO_PREKG: 0.0,   // 대기압 kg
  AIR_TEMC: 0,     // 대기온도 C
  AIR_TEMK: 0,     // 대기온도 K
  LEAK_SOU: '',     // 누출원
  LEAK_TYPE: '',    // 누출유형
  LEL_SNUM: 1.0,    // LEL의 안전계수
  LEAK_LEVEL: '',  // 누출등급
  LEL: 0,          // LEL 안전계수
  LEAK_COE: 0,     // 누출계수
  LEAK_COE2: 0,     // 누출계수(환기용)
  CRIT_PRE: 0,     // 임계압력 
  COMP_COE: 0,     // 압축계수 
  GAS_SPEED_INE: '',// 가스속도비교 부등호
  GAS_SPEED: '',    // 가스속도
  HOLE_SIZE: 0,    // HOLE_SIZE
  SUBS_LEAK: 0,    // 아음속가스 누출률 kg/s
  SUBS_LEAK2: 0,   // 아음속가스 누출률 ㎥/s
  SONIC_LEAK: 0,   // 음속가스 누출률 kg/s
  SONIC_LEAK2: 0,  // 음속가스 누출률 ㎥/s
  LEAK_CHAR: 0,    // 누출특성

  //환기지침 입력폼
  DOOR_DIV: '',     // 환기조건
  DOOR_NAME: '',    // 자연환기
  BPCC: '',         // 건물 압력계수 특성(ΔCp)
  WIND_SPEED: 0,   // 풍속
  TEMP_CHA: '',     // 온도변화
  T_IN: '',         // 옥내온도
  T_OUT: '',        // 옥외온도
  AIR_DENS: '',     // 공기밀도
  OPEN_VERT: '',    // 개구부 평균 중심 수직거리
  TEM_WIND_PRE: '', // 바람/온도 영향 압력 차
  EQUI_AREA: '',    // 등가 유효 단면적
  AIRSUP_AREA: 0,  // 급기면적
  EXHAUST_AREA: 0, // 배기면적
  VOLUME: '',       // 밀폐공간 크기
  LENGTH: '',       // 세로
  WIDTH: '',        // 가로
  HEIGHT: '',       // 높이
  Q_FORC_VENT: '',  // 강제환기 - 공기체적유량
  Q_WIND_VENT: '',  // 바람환기 - 공기체적유량
  Q_TEMP_VENT: '',  // 온도차환기 - 공기체적유량
  Q_MIX_VENT: '',   // 혼합환기 - 공기체적유량
  Q_FORC_VENT_H: '',  // 강제환기 - 공기체적유량 (/h)
  Q_WIND_VENT_H: '',  // 바람환기 - 공기체적유량 (/h)
  Q_TEMP_VENT_H: '',  // 온도차환기 - 공기체적유량 (/h)
  Q_MIX_VENT_H: '',   // 혼합환기 - 공기체적유량 (/h)
  U_FORC_VENT: '',  // 강제환기 - 환기속도
  U_WIND_VENT: '',  // 바람환기 - 환기속도 
  U_TEMP_VENT: '',  // 온도차환기 - 환기속도
  U_MIX_VENT: '',   // 혼합환기 - 환기속도 
  C_FORC_VENT: '',  // 강제환기 - 룸 내 공기 교환주기
  C_WIND_VENT: '',  // 바람환기 - 룸 내 공기 교환주기 
  C_TEMP_VENT: '',  // 온도차환기 - 룸 내 공기 교환주기
  C_MIX_VENT: '',   // 혼합환기 - 룸 내 공기 교환주기 
  VENT_COE: 3,     // 환기효율계수
  AGVFIR: 0,       // 룸 내 공기/가스 체적 유량
  BACK_DENS: 0,    // 배경농도
  CRIT_CONCENT: 0, // 임계농도
  DENS_INE: '',// 농도비교 부등호
  DILUTION: '',     // 희석정도,
  NEW_FLAG_DT: '',  // 신규/변경일자
  VENT_USAGE: '',   // 환기 이용도,
  EXPL_TYPE: '',    // 폭발위험 장소 (종)
  EXP_RESULT: '',   // 방폭결과,
  EXPL_RANGE: '',   // 폭발범위
  CONFIRM_YN: 'N',  // 확정여부
  SAVE_YN: 'N',
  INSERT_DATE: '',
  UPDATE_DATE: '',
  CONFIRM_FLAG: '', // 산출팝업 확정 플래그
})
const searchParams = reactive({...initParams})

const codeList = reactive({
  //환기이용도
  VENT_USAGE_LIST: [
    { COD: 'A', TXT: '우수' },
    { COD: 'B', TXT: '양호' },
    { COD: 'C', TXT: '미흡' },
  ],
  newflagList: [
    {COD: 'N', TXT: '신규'},
    {COD: 'C', TXT: '변경'}
  ],
  manageList: [],
  substanceData: [],
  areaDiv: [],
  targetFac :[
    {TXT: 'TANK', COD: 'TANK' },
    {TXT: 'FGSS', COD: 'FGSS' },
    {TXT: '가스계량기실', COD: '가스계량기실' },
    {TXT: '정압기', COD: '정압기' },
    {TXT: '가스메터함', COD: '가스메터함' },
    {TXT: '가스트레인', COD: '가스트레인' },
    {TXT: '분배기함', COD: '분배기함' },
    {TXT: '매니폴드', COD: '매니폴드' },
    {TXT: '옥외배관', COD: '옥외배관' },
    {TXT: '옥내배관', COD: '옥내배관' },
    {TXT: '쉘터', COD: '쉘터' },
    {TXT: '가스히터', COD: '가스히터' },
    {TXT: '컴프레셔', COD: '컴프레셔' },
    {TXT: '기화기', COD: '기화기' },
    {TXT: 'RTO', COD: 'RTO' },
  ]
})

const ventUsageText = computed(() => {
  const selectedVentUsage = codeList.VENT_USAGE_LIST.find(
    (item) => item.COD === searchParams.VENT_USAGE
  );
  return selectedVentUsage ? selectedVentUsage.TXT : '';
});

const initCodeList = async () => {
  commonSearchApi({
    queryId: "SPPIA0010_SEARCH_01",
    param: searchParams
  })
    .then(res => {   
      const data = res.ORESULT_CUR
      codeList.manageList = data
    })
  getCodeList('HHIU020')
    .then(res => { 
      codeList.substanceData = res.ORESULT_CUR
      // console.log(codeList.substanceData)
    })

  getCodeList('HHIU010')
    .then(res => { 
      codeList.areaDiv = res.ORESULT_CUR
      // console.log(codeList.areaDiv)
    })
}

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnCalculatetest') {
    await clickCalculate();
    // new saveFlowHelper(vm, t)
    //   .setConfirmMessage(searchParams.CONFIRM_FLAG >= 1 ? '확정이 취소됩니다. 저장 하시겠습니까?':'저장 하시겠습니까?')
    //   .setBefore(beforeSave)
    //   .setQuery(saveData)
    //   .setAfter(afterSaveData)
    //   .run()
    

    chartsOptions1.series[2] = {
      type: 'line',
      color: 'orange',
      encode: { x: 0, y: 1 },
      name: '입력 X축 값',
      data: [
        [dynamicData.xValue, 0.001],
        [dynamicData.xValue, 10]
      ]
    },
    chartsOptions1.series[3] = {
      type: 'line',
      color: 'orange',
      encode: { x: 0, y: 1 },
      name: '입력 Y축 값',
      data: [
        [0.001, dynamicData.yValue], [100, dynamicData.yValue]
      ]
    },
    chartsOptions1.series[4] = {
      type: 'scatter',
      color: 'orange',
      symbolSize: 10,
      name: '교차점',
      data: [
        [dynamicData.xValue, dynamicData.yValue]
      ]
    },
    chart1.value.clear();
    chart1.value.setOption(chartsOptions1);

  }
  else if (btn.id === 'btnClose') {
    closePopup()
  }
}

// 조회
const getData = async () => {
  return await commonSearchApi(
    {
      queryId: 'SPPIB0010_SEARCH_02',
      param: { PROJNO: searchParams.PROJNO }
    }).then(res => { 
      if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
        const data = res.ORESULT_CUR[0];
        // console.log("data:", data)
        Object.assign(searchParams, data);
      }
    })
}

// 저장 전
const beforeSave = () => {
  // 필수 입력 값 확인할 항목 리스트
  const requiredFields = [
    { key: 'NEW_FLAG', message: '신규/변경은 필수 입력입니다.' },
    { key: 'MANAGE_NUM', message: '관리번호는 필수 입력입니다.' },
    { key: 'TARGET_FAC', message: '설비 및 공정은 필수 입력입니다.' }
  ];

  // 필수 항목 체크
  for (const field of requiredFields) {
    if (isEmpty(searchParams[field.key])) {
      Message.warn(t(field.message));
      return false;
    }
  }
  return true;
};

// 저장
const saveData = () => {
  let data = []
  
  let saveParams = { ...searchParams }
  saveParams.DILUTION=dilution_2.value
  data.push(saveParams)
  

  // console.log("saveParams", saveParams)
  return commonExecuteApi({ queryId: 'SPPIB0010_SAVE_02', list: data})
}

const afterSaveData = async () => {
  Message.success(t('성공적으로 저장되었습니다'))
  getData().then(() => {
    // 2. getData() 완료 후, initCodeList() 실행
    initCodeList().then(() => {
      // 3. nextTick()을 사용하여 searchParams가 반영되었는지 대기
      nextTick(() => {
        // 4. 데이터가 완전히 반영된 후 clickCalculate() 실행
        clickCalculate();
        chartsOptions1.series[2] = {
          type: 'line',
          color: 'orange',
          encode: { x: 0, y: 1 },
          name: '입력 X축 값',
          data: [
            [dynamicData.xValue, 0.001],
            [dynamicData.xValue, 10]
          ]
        },
        chartsOptions1.series[3] = {
          type: 'line',
          color: 'orange',
          encode: { x: 0, y: 1 },
          name: '입력 Y축 값',
          data: [
            [0.001, dynamicData.yValue], [100, dynamicData.yValue]
          ]
        },
        chartsOptions1.series[4] = {
          type: 'scatter',
          color: 'orange',
          symbolSize: 10,
          name: '교차점',
          data: [
            [dynamicData.xValue, dynamicData.yValue]
          ]
        },
        
        chart1.value.setOption(chartsOptions1);
        checkRegion()
        calculateExplosionRange()
        // 창 크기 조정 트리거 (데이터 로드 후 실행)
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 500);
        
        // 키 이벤트 리스너 추가
        window.addEventListener("keydown", handleKeyDown);
      })
    })
    if (searchParams.CONFIRM_YN == 'Y') 
    {
      radioDisabled.value = true;
      manageDisabled.value = true;
      targetFacDisabled.value = true;
      searchParams.MANAGE_NUM = popupParam.MANAGE_NUM
      searchParams.TARGET_FAC = popupParam.TARGET_FAC
    } 
    else {
      radioDisabled.value = false;
      manageDisabled.value = false;
      targetFacDisabled.value = false;
      searchParams.NEW_FLAG = 'N';
    }
    dilution_2.value=searchParams.DILUTION?searchParams.DILUTION:'-'
  })
  // NEW_FLAG_DT에 따라 UI 비활성화 처리
  // if (searchParams.NEW_FLAG_DT != null) 
  // if (searchParams.CONFIRM_YN == 'Y') 
  // {
  //   radioDisabled.value = true;
  //   manageDisabled.value = true;
  //   targetFacDisabled.value = true;
  //   searchParams.MANAGE_NUM = popupParam.MANAGE_NUM
  //   searchParams.TARGET_FAC = popupParam.TARGET_FAC
  // } 
  // else {
  //   radioDisabled.value = false;
  //   manageDisabled.value = false;
  //   targetFacDisabled.value = false;
  //   searchParams.NEW_FLAG = 'N';
  // }
  
}

// Confirm 저장 전
const beforeConfirmSave = () => {
  // 필수 입력 값 확인할 항목 리스트
  if (!searchParams.INSERT_DATE && !searchParams.UPDATE_DATE) {
    Message.warn('산출되지 않은 데이터입니다.');
    return false;
  }

  return true;
};

// Confirm 저장
const saveConfirmData = () => {
  let confirmData = []
  let saveConfirmParams = { ...searchParams }
  confirmData.push(saveConfirmParams)
  

  // console.log("saveConfirmParams", saveConfirmParams)
  return commonExecuteApi({ queryId: 'SPPIB0010_SAVE_03', list: confirmData})
}

const afterConfirmSaveData = async () => {
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

// 조건 (옥내 / 옥외)
const doorDivData = [
  { COD: '옥내', TXT: '옥내'},
  { COD: '옥외', TXT: '옥외'}
]

// 조건 (환기)
const doorNameData = [
  { COD: '자연환기(바람)', TXT: '자연환기(바람)'},
  { COD: '강제환기', TXT: '강제환기'},
  { COD: '', TXT: ''}
]

const leakSouChange = () => { 
  const leakSou = searchParams.LEAK_SOU

  if (leakSou.includes('연속')) {
    searchParams.LEAK_LEVEL = '연속'
  } else if (leakSou.includes('1차')) { 
    searchParams.LEAK_LEVEL = '1차'
  } else if (leakSou.includes('2차')) { 
    searchParams.LEAK_LEVEL = '2차'
  }
  
}

const updateSubstance = (selectedNm) => {
  const subData = codeList.substanceData.find(item => item.TXT === selectedNm);
  if (subData) {
    searchParams.FORMULA = subData.CODE_DESC1;
    searchParams.MOLECULAR = subData.CODE_DESC2;
    searchParams.POLYTRO = subData.CODE_DESC3;
  } else {
    searchParams.FORMULA = '';
    searchParams.MOLECULAR = '';
    searchParams.POLYTRO = '';
  }
}

const filteredDoorNameData = computed(() => {
  if (searchParams.DOOR_DIV === '옥내') {
    return doorNameData.slice(0, 2); // 자연환기, 강제환기
  } else {
    return [doorNameData[2]]; // 빈 값만 유지
  }
});

const clickCalculate = async () => { 
  // -------------------- 누출원의 평가 --------------------
  // 내부 압력을 kg/cm²(gauge)로 변환
  if (searchParams.INT_PRE) { 
    // 내부 압력 계산: 절대압에서 대기압을 빼고 kg/cm²(gauge)로 변환
    const absolutePressure = searchParams.INT_PRE;  // 절대압 (Pa)
    const atmosphericPressure = 101325;  // 대기압 (Pa)

    // 절대압에서 대기압을 빼고, 이를 kg/cm²(gauge)로 변환
    const gaugePressure = (absolutePressure - atmosphericPressure) / 98066.5;
    searchParams.REGF_PRE = gaugePressure.toFixed(3);
  }

  // 내보온도 캘빈 => 섭씨
  if (searchParams.IN_TEM) {
    searchParams.IN_TEM2 = Math.round(parseFloat(searchParams.IN_TEM) + 273.15);
  }
  
  const R = 8314.0;  // 기체 상수 (J/(kmol·K))
  // 가스 밀도 계산 (kg/m³)
  if (searchParams.ATMO_PREPA && searchParams.MOLECULAR && searchParams.AIR_TEMK) {
    const molecularMass = searchParams.MOLECULAR; // kg/kmol 단위 유지

    if (parseFloat(searchParams.AIR_TEMK) > 0) {
      searchParams.GAS_DENS = ((parseFloat(searchParams.ATMO_PREPA) * molecularMass) / (R * parseFloat(searchParams.AIR_TEMK))).toFixed(2);
    }
  }

  // 폭발 하한 (LEL) 변환 (kg/m³ -> % vol)
  if (searchParams.LOWER_EXPL && searchParams.GAS_DENS) {
    if (searchParams.GAS_DENS > 0) {
      searchParams.LOWER_EXPL2 = ((parseFloat(searchParams.LOWER_EXPL) / searchParams.GAS_DENS) * 100).toFixed(1);
    }
  }

  // 대기온도 캘빈 => 섭씨
  if (searchParams.AIR_TEMC) {
    searchParams.AIR_TEMK = Math.round(parseFloat(searchParams.AIR_TEMC) + 273.15);
  }

  // 누출계수(Cd) 설정 --추후수정
  if (searchParams.LEAK_TYPE) {
    if (searchParams.LEAK_TYPE === "통기구, 원형") {
      searchParams.LEAK_COE = 0.99;
    } else if (searchParams.LEAK_TYPE === "비원형") {
      searchParams.LEAK_COE = 0.75;
    } else {
      searchParams.LEAK_COE = 1.0; // 기본값 설정
    }
  }
  // 임계압력(Pc) 계산
  if (searchParams.ATMO_PREPA && searchParams.POLYTRO) {
    const gamma = parseFloat(searchParams.POLYTRO); // 비열비
    const Pa = parseFloat(searchParams.ATMO_PREPA); // 대기압 (Pa)

    // 엑셀 수식 적용
    const criticalPressure = Pa * (Math.pow(((gamma + 1) / 2), (gamma / (gamma - 1))));

    searchParams.CRIT_PRE = criticalPressure.toFixed(0);
  }

  // 압축계수 Z 설정 (기본값 1.0)
  if (!searchParams.COMP_COE) {
    searchParams.COMP_COE = 1.0;
  }

  // P와 Pc를 비교하여 GAS_SPEED 계산
  if (searchParams.INT_PRE && searchParams.CRIT_PRE) {
    const pressureP = parseFloat(searchParams.INT_PRE);  // 내부 압력 P (Pa)
    const pressurePc = parseFloat(searchParams.CRIT_PRE);  // 임계압력 Pc (Pa)

    // P가 크면 음속흐름, Pc가 크면 아음속흐름
    if (pressureP > pressurePc) {
      searchParams.GAS_SPEED = '음속흐름';
    } else {
      searchParams.GAS_SPEED = '아음속흐름';
    }
  }

  // GAS_SPEED_INE 설정: P와 Pc 값에 따른 부등호 설정
  if (searchParams.GAS_SPEED) {
    if (searchParams.GAS_SPEED === '음속흐름') {
      searchParams.GAS_SPEED_INE = '>';
    } else {
      searchParams.GAS_SPEED_INE = '<';
    }
  }

  // Hole size 계산 (㎟ => ㎡ 변환)
  if (searchParams.HOLE_SIZE) {
    let holeSize = parseFloat(searchParams.HOLE_SIZE); // 현재 값 가져오기
    
    // 값이 이미 ㎡ 단위인지 확인 (1㎟ = 0.000001㎡)
    if (holeSize >= 1) { 
      const holeSizeInM2 = holeSize / 1000000; // ㎟에서 ㎡로 변환
      searchParams.HOLE_SIZE = parseFloat(holeSizeInM2.toFixed(10)); // 숫자로 변환하여 저장
    }
  }

  if (searchParams.GAS_SPEED === '아음속흐름') {
    if (
      searchParams.LEAK_COE && searchParams.HOLE_SIZE && searchParams.INT_PRE &&
      searchParams.MOLECULAR && searchParams.POLYTRO && searchParams.COMP_COE &&
      searchParams.IN_TEM2 && searchParams.GAS_DENS && searchParams.ATMO_PREPA
    ) {
      const leakCoefficient = parseFloat(searchParams.LEAK_COE);  // 누출계수 (Cd)
      const holeSize = parseFloat(searchParams.HOLE_SIZE);        // 구멍 크기 (㎡)
      const internalPressure = parseFloat(searchParams.INT_PRE);  // 내부압력 (Pa)
      const molecularWeight = parseFloat(searchParams.MOLECULAR); // 분자량
      const heatRatio = parseFloat(searchParams.POLYTRO);         // 비열비 (γ)
      const compressibility = parseFloat(searchParams.COMP_COE);  // 압축계수 (Z)
      const gasConstant = 8314.0;  // 기체상수 (J/(kmol·K))
      const internalTemp = parseFloat(searchParams.IN_TEM2);       // 내부온도 (K)
      const gasDensity = parseFloat(searchParams.GAS_DENS);       // 가스 밀도 (kg/m³)
      const atmosphericPressure = parseFloat(searchParams.ATMO_PREPA); // 대기압 (Pa)

      // 아음속가스 누출률 (kg/s)
      searchParams.SUBS_LEAK = (
        leakCoefficient * holeSize * internalPressure *
        Math.sqrt(
          ((molecularWeight * 2 * heatRatio) / (compressibility * gasConstant * internalTemp * (heatRatio - 1))) *
          (1 - Math.pow(atmosphericPressure / internalPressure, (heatRatio - 1) / heatRatio))
        ) * Math.pow(atmosphericPressure / internalPressure, (1 / heatRatio))
      ).toFixed(9);

      // 아음속가스 누출률 (m³/s)
      searchParams.SUBS_LEAK2 = (searchParams.SUBS_LEAK / gasDensity).toFixed(9);
    } else {
      searchParams.SUBS_LEAK = '해당없음';
      searchParams.SUBS_LEAK2 = 'N/A';
    }
  } else { 
    searchParams.SUBS_LEAK = '해당없음';
    searchParams.SUBS_LEAK2 = 'N/A';
  }

  if (searchParams.GAS_SPEED === '음속흐름') {
    if (
      searchParams.LEAK_COE && searchParams.HOLE_SIZE && searchParams.INT_PRE &&
      searchParams.MOLECULAR && searchParams.POLYTRO && searchParams.COMP_COE &&
      searchParams.IN_TEM2 && searchParams.GAS_DENS
    ) {
      const leakCoefficient = parseFloat(searchParams.LEAK_COE);
      const holeSize = parseFloat(searchParams.HOLE_SIZE);
      const internalPressure = parseFloat(searchParams.INT_PRE);
      const molecularWeight = parseFloat(searchParams.MOLECULAR);
      const heatRatio = parseFloat(searchParams.POLYTRO);
      const compressibility = parseFloat(searchParams.COMP_COE);
      const gasConstant = 8314.0;
      const internalTemp = parseFloat(searchParams.IN_TEM2);
      const gasDensity = parseFloat(searchParams.GAS_DENS);

      // 음속가스 누출률 (kg/s)
      searchParams.SONIC_LEAK = (
        leakCoefficient * holeSize * internalPressure *
        Math.sqrt(
          ((heatRatio * molecularWeight) / (compressibility * gasConstant * internalTemp)) *
          Math.pow(2 / (heatRatio + 1), (heatRatio + 1) / (heatRatio - 1))
        )
      ).toFixed(9);

      // 음속가스 누출률 (m³/s)
      searchParams.SONIC_LEAK2 = (searchParams.SONIC_LEAK / gasDensity).toFixed(9);
    } else {
      searchParams.SONIC_LEAK = '해당없음';
      searchParams.SONIC_LEAK2 = 'N/A';
    }
  } else { 
    searchParams.SONIC_LEAK = '해당없음';
    searchParams.SONIC_LEAK2 = 'N/A';
  }

  if ( 
    searchParams.SONIC_LEAK && searchParams.GAS_DENS &&
    searchParams.LEL_SNUM && searchParams.LOWER_EXPL2 && searchParams.GAS_SPEED == '음속흐름'
  ) {
    const sonicLeak = parseFloat(searchParams.SONIC_LEAK);   // 음속가스 누출률 (kg/s) → I19
    const gasDensity = parseFloat(searchParams.GAS_DENS);   // 가스 밀도 (kg/m³) → I22
    const lelSnum = parseFloat(searchParams.LEL_SNUM); // 비열 (k) → D38
    const lowerExpl2 = parseFloat(searchParams.LOWER_EXPL2);               // 폭발하한 (LFL) → D19

    if (gasDensity && lelSnum && lowerExpl2) {
      searchParams.LEAK_CHAR = (sonicLeak / (gasDensity * lelSnum * lowerExpl2 * 0.01)).toFixed(4);
    } else {
      searchParams.LEAK_CHAR = 'N/A';
    }
  }

  if ( 
    searchParams.SUBS_LEAK && searchParams.GAS_DENS &&
    searchParams.LEL_SNUM && searchParams.LOWER_EXPL2 && searchParams.GAS_SPEED == '아음속흐름'
  ) {
    const subsLeak = parseFloat(searchParams.SUBS_LEAK);   // 음속가스 누출률 (kg/s) → I19
    const gasDensity = parseFloat(searchParams.GAS_DENS);   // 가스 밀도 (kg/m³) → I22
    const lelSnum = parseFloat(searchParams.LEL_SNUM); // 비열 (k) → D38
    const lowerExpl2 = parseFloat(searchParams.LOWER_EXPL2);               // 폭발하한 (LFL) → D19

    if (gasDensity && lelSnum && lowerExpl2) {
      searchParams.LEAK_CHAR = (subsLeak / (gasDensity * lelSnum * lowerExpl2 * 0.01)).toFixed(9);
    } else {
      searchParams.LEAK_CHAR = 'N/A';
    }
  }

  // -------------------- 환기지침 --------------------

  // 온도변화 => 옥외온도 - 옥내온도
  if (searchParams.T_IN && searchParams.T_OUT) {
    searchParams.TEMP_CHA = searchParams.T_OUT - searchParams.T_IN;
  }

  // 등가 유효 단면적 (㎡) 계산
  if (searchParams.AIRSUP_AREA && searchParams.EXHAUST_AREA) {
    const A1 = parseFloat(searchParams.AIRSUP_AREA); // 급기면적 (㎡)
    const A2 = parseFloat(searchParams.EXHAUST_AREA); // 배기면적 (㎡)

    if (A1 > 0 && A2 > 0) {
      searchParams.EQUI_AREA = Math.sqrt((2 * Math.pow(A1, 2) * Math.pow(A2, 2)) / (Math.pow(A1, 2) + Math.pow(A2, 2))).toFixed(3);
    }
  }

  //밀폐공간 크기(V0) => 가로*세로*높이
  if (searchParams.LENGTH && searchParams.WIDTH && searchParams.HEIGHT) { 
    const l = parseFloat(searchParams.LENGTH);
    const b = parseFloat(searchParams.WIDTH);
    const h = parseFloat(searchParams.HEIGHT);
    searchParams.VOLUME = (l * b * h).toFixed(2);
  }

  // 공기체적유량 ---------------------------
  // 강제환기 계산
  if (searchParams.DOOR_NAME.includes('강제')) {
    const leakCoefficient = parseFloat(searchParams.LEAK_COE2);
    const area = parseFloat(searchParams.EQUI_AREA);
    const windSpeed = parseFloat(searchParams.WIND_SPEED);
    const buildingPressure = parseFloat(searchParams.BPCC);

    if (leakCoefficient && area && windSpeed && buildingPressure) {
      // 강제환기 (㎥/s)
      searchParams.Q_FORC_VENT = (leakCoefficient * area * windSpeed * Math.sqrt(buildingPressure / 2)).toFixed(4);
      
      // ㎥/s를 ㎥/h로 환산 (1시간 = 3600초)
      searchParams.Q_FORC_VENT_H = (parseFloat(searchParams.Q_FORC_VENT) * 3600).toFixed(4);
    } 
  } else {
    searchParams.Q_FORC_VENT = '해당없음';
    searchParams.Q_FORC_VENT_H = '해당없음';
  }

  // 2. 바람에 의한 환기
  if (searchParams.DOOR_NAME.includes('바람')) {
    const leakCoefficient = parseFloat(searchParams.LEAK_COE2);
    const area = parseFloat(searchParams.EQUI_AREA);
    const windSpeed = parseFloat(searchParams.WIND_SPEED);
    const buildingPressure = parseFloat(searchParams.BPCC);

    if (leakCoefficient && area && windSpeed && buildingPressure) {
      // 바람에 의한 환기 (㎥/s)
      searchParams.Q_WIND_VENT = (leakCoefficient * area * windSpeed * Math.sqrt(buildingPressure / 2)).toFixed(4);

      // ㎥/s를 ㎥/h로 환산 (1시간 = 3600초)
      searchParams.Q_WIND_VENT_H = (parseFloat(searchParams.Q_WIND_VENT) * 3600).toFixed(4);
    } 
  } else {
    searchParams.Q_WIND_VENT = '해당없음';
    searchParams.Q_WIND_VENT_H = '해당없음';
  }

  // 3. 온도차에 의한 부력
  if (searchParams.DOOR_NAME.includes('온도')) {
    const leakCoefficient = parseFloat(searchParams.LEAK_COE2);
    const area = parseFloat(searchParams.EQUI_AREA);
    const tempDifference = parseFloat(searchParams.TEMP_CHA);
    const buildingPressure = parseFloat(searchParams.BPCC);

    if (leakCoefficient && area && tempDifference && buildingPressure) {
      // 온도차에 의한 부력 (㎥/s)
      searchParams.Q_TEMP_VENT = (leakCoefficient * area * Math.sqrt(tempDifference / (buildingPressure + 2) * 9.8 * tempDifference)).toFixed(4);

      // ㎥/s를 ㎥/h로 환산 (1시간 = 3600초)
      searchParams.Q_TEMP_VENT_H = (parseFloat(searchParams.Q_TEMP_VENT) * 3600).toFixed(4);
    } 
  } else {
    searchParams.Q_TEMP_VENT = '해당없음';
    searchParams.Q_TEMP_VENT_H = '해당없음';
  }

  // 4. 바람, 온도 혼합
  if (searchParams.DOOR_NAME.includes('혼합')) {
    const leakCoefficient = parseFloat(searchParams.LEAK_COE2);
    const area = parseFloat(searchParams.EQUI_AREA);
    const windSpeed = parseFloat(searchParams.WIND_SPEED);
    const temperatureEffect = parseFloat(searchParams.TEMP_CHA);

    if (leakCoefficient && area && windSpeed && temperatureEffect) {
      // 바람, 온도 혼합 (㎥/s)
      searchParams.Q_MIX_VENT = (leakCoefficient * area * Math.sqrt(2 * windSpeed / temperatureEffect)).toFixed(4);

      // ㎥/s를 ㎥/h로 환산 (1시간 = 3600초)
      searchParams.Q_MIX_VENT_H = (parseFloat(searchParams.Q_MIX_VENT) * 3600).toFixed(4);
    } 
  } else {
    searchParams.Q_MIX_VENT = '해당없음';
    searchParams.Q_MIX_VENT_H = '해당없음';
  }

  // 환기속도 ---------------------------
  // 강제환기 계산
  if (searchParams.DOOR_NAME.includes('강제')) {
    const forceVent = parseFloat(searchParams.Q_FORC_VENT);
    const l = parseFloat(searchParams.LENGTH);
    const h = parseFloat(searchParams.HEIGHT);

    if (forceVent && l && h) {
      // 강제환기 (㎥/s)
      searchParams.U_FORC_VENT = (forceVent / (l * h)).toFixed(4);
      
    } 
  } else {
    searchParams.U_FORC_VENT = '해당없음';
  }
  
  // 2. 바람에 의한 환기
  if (searchParams.DOOR_NAME.includes('바람')) {
    const windVent = parseFloat(searchParams.Q_WIND_VENT);
    const l = parseFloat(searchParams.LENGTH);
    const h = parseFloat(searchParams.HEIGHT);

    if (windVent && l && h) {
      // 바람에 의한 환기 (㎥/s)
      searchParams.U_WIND_VENT = (windVent / (l * h)).toFixed(4);
    } 
  } else {
    searchParams.U_WIND_VENT = '해당없음';
  }

  // 3. 온도차에 의한 부력
  if (searchParams.DOOR_NAME.includes('온도')) {
    const tempVent = parseFloat(searchParams.Q_TEMP_VENT);
    const l = parseFloat(searchParams.LENGTH);
    const h = parseFloat(searchParams.HEIGHT);

    if (tempVent && l && h) {
      // 온도차에 의한 부력 (㎥/s)
      searchParams.U_TEMP_VENT = (tempVent / (l * h)).toFixed(4);
    } 
  } else {
    searchParams.U_TEMP_VENT = '해당없음';
  }

  // 4. 바람, 온도 혼합
  if (searchParams.DOOR_NAME.includes('혼합')) {
    const mixVent = parseFloat(searchParams.Q_MIX_VENT);
    const l = parseFloat(searchParams.LENGTH);
    const h = parseFloat(searchParams.HEIGHT);

    if (mixVent && l && h) {
      // 바람, 온도 혼합 (㎥/s)
      searchParams.U_MIX_VENT = (mixVent / (l * h)).toFixed(4);
    } 
  } else {
    searchParams.U_MIX_VENT = '해당없음';
  }

  // 룸 내 공기교환주기, 룸 내 공기/가스 체적유량 포함 ---------------------------
  // 강제환기 계산
  if (searchParams.DOOR_NAME.includes('강제')) {
    const forceVent = parseFloat(searchParams.Q_FORC_VENT_H);
    const volume = parseFloat(searchParams.VOLUME);

    if (forceVent && volume) {
      // 강제환기 (㎥/s)
      searchParams.C_FORC_VENT = (forceVent / volume).toFixed(4);
      searchParams.AGVFIR = ((parseFloat(searchParams.C_FORC_VENT) / 3600) * volume).toFixed(4);
    } 
  } else {
    searchParams.C_FORC_VENT = '해당없음';
  }
  
  // 2. 바람에 의한 환기
  if (searchParams.DOOR_NAME.includes('바람')) {
    const windVent = parseFloat(searchParams.Q_WIND_VENT_H);
    const volume = parseFloat(searchParams.VOLUME);

    if (windVent && volume) {
      // 바람에 의한 환기 (㎥/s)
      searchParams.C_WIND_VENT = (windVent / volume).toFixed(4);
      searchParams.AGVFIR = ((parseFloat(searchParams.C_WIND_VENT) / 3600) * volume).toFixed(4);
    } 
  } else {
    searchParams.C_WIND_VENT = '해당없음';
  }

  // 3. 온도차에 의한 부력
  if (searchParams.DOOR_NAME.includes('온도')) {
    const tempVent = parseFloat(searchParams.Q_TEMP_VENT_H);
    const volume = parseFloat(searchParams.VOLUME);

    if (tempVent && volume) {
      // 온도차에 의한 부력 (㎥/s)
      searchParams.C_TEMP_VENT = (tempVent / volume).toFixed(4);
      searchParams.AGVFIR = ((parseFloat(searchParams.C_TEMP_VENT) / 3600) * volume).toFixed(4);
    } 
  } else {
    searchParams.C_TEMP_VENT = '해당없음';
  }

  // 4. 바람, 온도 혼합
  if (searchParams.DOOR_NAME.includes('혼합')) {
    const mixVent = parseFloat(searchParams.Q_MIX_VENT_H);
    const volume = parseFloat(searchParams.VOLUME);

    if (mixVent && volume) {
      // 바람, 온도 혼합 (㎥/s)
      searchParams.C_MIX_VENT = (mixVent / volume).toFixed(4);
      searchParams.AGVFIR = ((parseFloat(searchParams.C_MIX_VENT) / 3600) * volume).toFixed(4);
    } 
  } else {
    searchParams.C_MIX_VENT = '해당없음';
  }
  

  // 배경농도
  if (searchParams.MOLECULAR &&
    searchParams.ATMO_PREPA &&
    searchParams.AIR_TEMK) {
  
    const mole = parseFloat(searchParams.MOLECULAR);
    const atmo = parseFloat(searchParams.ATMO_PREPA);
    const air = parseFloat(searchParams.AIR_TEMK);
    const gasConstant = 8314.0;  // 기체상수 (J/(kmol·K))
    const gasPer = (mole * atmo) / (air * gasConstant);

    const soleak = parseFloat(searchParams.SONIC_LEAK); // 음속가스 누출률
    const suleak = parseFloat(searchParams.SUBS_LEAK); // 아음속가스 누출률

    const ventCoe = parseFloat(searchParams.VENT_COE);
    const agvfir = parseFloat(searchParams.AGVFIR);

    let backDens = NaN; // 결과 저장용 변수

    if (!isNaN(gasPer) && !isNaN(ventCoe) && !isNaN(agvfir) && agvfir !== 0) {
      if (!isNaN(soleak)) { 
        const ratephSo = soleak / gasPer;
        backDens = (ventCoe * ratephSo) / agvfir;
      }
      if (!isNaN(suleak)) { 
        const ratephSu = suleak / gasPer;
        backDens = (ventCoe * ratephSu) / agvfir;
      }
    }

    // NaN이 아닐 때만 BACK_DENS 할당
    if (!isNaN(backDens)) {
      searchParams.BACK_DENS = backDens.toFixed(4);
    }
  }

  // 임계농도
  if (searchParams.LOWER_EXPL2) { 
    searchParams.CRIT_CONCENT = (0.25 * parseFloat(searchParams.LOWER_EXPL2) * 0.01).toFixed(3);
  }

  // 부등호
  if (searchParams.BACK_DENS && searchParams.CRIT_CONCENT) { 
    const backDens = parseFloat(searchParams.BACK_DENS);
    const critConcent = parseFloat(searchParams.CRIT_CONCENT);
    
    // 고희석
    if (backDens < critConcent) { 
      searchParams.DENS_INE = '<';
    }
    // 저희석
    else if (backDens > critConcent) { 
      searchParams.DENS_INE = '>';
    }
  }
  checkRegion()
  calculateExplosionRange()
  if (searchParams.NEW_FLAG_DT != null) {
    searchParams.SAVE_YN = 'Y'
  }
}
const fieldsToFormat = ['LOWER_EXPL','GAS_DENS', 'HOLE_SIZE', 'COMP_COE', 'WIND_SPEED', 'AIRSUP_AREA', 'EXHAUST_AREA', 'LEAK_COE2', 'AGVFIR'];

const isHighlighted = (level, category, usage) => {

  const isMatch = (
    searchParams.LEAK_LEVEL == level &&
    searchParams.DILUTION == category &&
    ventUsageText.value == usage 
  );

  // 하이라이트가 맞다면 EXPL_TYPE에 해당 텍스트값 설정
  if (isMatch) {
    // explosionData에서 해당하는 텍스트 찾기
    const matchingCell = explosionData.find(row => row.level === level)
      ?.values.find(cell => cell.category === category && cell.usage === usage);

    if (matchingCell) {
      searchParams.EXPL_TYPE = matchingCell.text;  // 텍스트값을 EXPL_TYPE에 담기
    }
  }

  return isMatch;
};

// searchParams 값 변경 감지
watch(searchParams, (newVal) => {
  fieldsToFormat.forEach(field => {
    if (newVal[field] !== null && newVal[field] !== undefined) {
      const num = parseFloat(newVal[field]); 
      searchParams[field] = isNaN(num) ? null : num; // 소수점이 있는 만큼만 유지
    }
  });
}, { deep: true });

// 환기유효성 - 환기속도
const selectedVentSpeed = ref('')
watchEffect(() => {
  selectedVentSpeed.value =
    searchParams.U_FORC_VENT !== '해당없음' ? searchParams.U_FORC_VENT :
    searchParams.U_WIND_VENT !== '해당없음' ? searchParams.U_WIND_VENT :
    searchParams.U_TEMP_VENT !== '해당없음' ? searchParams.U_TEMP_VENT :
    searchParams.U_MIX_VENT !== '해당없음' ? searchParams.U_MIX_VENT : '';

  dynamicData.yValue = selectedVentSpeed.value
  // console.log("y축 :",dynamicData.yValue)
});
// 차트 변수용
const chartLeakChar = ref('')
watchEffect(() => {
  chartLeakChar.value =
    searchParams.LEAK_CHAR !== 'N/A' ? searchParams.LEAK_CHAR : ''

  dynamicData.xValue = chartLeakChar.value
  // console.log("x축 :",dynamicData.xValue)
});

const updateFacDiv = (newManageNum) => {
  const selectedItem = codeList.manageList.find(item => item.MANAGE_NUM === newManageNum);
  searchParams.TARGET_FAC = selectedItem ? selectedItem.TARGET_FAC : ''; // 해당 값이 없으면 빈값
};

const resetFields = () => { 
  searchParams.MANAGE_NUM = ''
  searchParams.TARGET_FAC = ''
}
// 라디오버튼에 따른 조건 초기화
watch(() => searchParams.NEW_FLAG, () => {
  if (searchParams.NEW_FLAG_DT == null) { 
    resetFields();
  } 
});

// 팝업
const openPopup = async (popupParam) => {
  // console.log("popupParam: ", popupParam);
  dialog.value = true;

  // 창 크기 조정 이벤트 추가
  await nextTick(() => {
    window.addEventListener("resize", resizeHandler);
  });

  // 데이터 로드
  if(popupParam)
  {
    searchParams.PROJNO = popupParam.PROJNO;
    searchParams.NEW_FLAG_DT = popupParam.NEW_FLAG_DT;
  }
  else
  {
    searchParams.NEW_FLAG_DT = 'N';
    searchParams.SAVE_YN = 'N';
  }

  getData().then(() => {
    // 2. getData() 완료 후, initCodeList() 실행
    initCodeList().then(() => {
      // 3. nextTick()을 사용하여 searchParams가 반영되었는지 대기
      nextTick(() => {
        // 4. 데이터가 완전히 반영된 후 clickCalculate() 실행
        clickCalculate();
        chartsOptions1.series[2] = {
          type: 'line',
          color: 'orange',
          encode: { x: 0, y: 1 },
          name: '입력 X축 값',
          data: [
            [dynamicData.xValue, 0.001],
            [dynamicData.xValue, 10]
          ]
        },
        chartsOptions1.series[3] = {
          type: 'line',
          color: 'orange',
          encode: { x: 0, y: 1 },
          name: '입력 Y축 값',
          data: [
            [0.001, dynamicData.yValue], [100, dynamicData.yValue]
          ]
        },
        chartsOptions1.series[4] = {
          type: 'scatter',
          color: 'orange',
          symbolSize: 10,
          name: '교차점',
          data: [
            [dynamicData.xValue, dynamicData.yValue]
          ]
        },
        
        chart1.value.setOption(chartsOptions1);
        checkRegion()
        calculateExplosionRange()
        // 창 크기 조정 트리거 (데이터 로드 후 실행)
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 500);
        
        // 키 이벤트 리스너 추가
        window.addEventListener("keydown", handleKeyDown);
      })
    })

      // console.log(searchParams.CONFIRM_YN)
      if (searchParams.CONFIRM_YN == 'Y') {
        radioDisabled.value = true;
        manageDisabled.value = true;
        targetFacDisabled.value = true;
        searchParams.MANAGE_NUM = popupParam.MANAGE_NUM
        searchParams.TARGET_FAC = popupParam.TARGET_FAC
      } else {
        radioDisabled.value = false;
        manageDisabled.value = false;
        targetFacDisabled.value = false;
        searchParams.NEW_FLAG = 'N';
      }
      dilution_2.value=searchParams.DILUTION?searchParams.DILUTION:'-'
    }  
  )
  // NEW_FLAG_DT에 따라 UI 비활성화 처리
  // if (searchParams.NEW_FLAG_DT != null) {
  // console.log(searchParams.CONFIRM_YN)
  // if (searchParams.CONFIRM_YN == 'Y') {
  //   radioDisabled.value = true;
  //   manageDisabled.value = true;
  //   targetFacDisabled.value = true;
  //   searchParams.MANAGE_NUM = popupParam.MANAGE_NUM
  //   searchParams.TARGET_FAC = popupParam.TARGET_FAC
  // } else {
  //   radioDisabled.value = false;
  //   manageDisabled.value = false;
  //   targetFacDisabled.value = false;
  //   searchParams.NEW_FLAG = 'N';
  // }
}

const resizeHandler = () => {
  chart1.value.resize()
  chart2.value.resize()
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    clickCalculate();

    // new saveFlowHelper(vm, t)
    //   .setBefore(beforeSave)
    //   .setQuery(saveData)
    //   .setAfter(afterSaveData)
    //   .run()
    // 차트 값 반영
    chartsOptions1.series[2] = {
      type: 'line',
      color: 'orange',
      encode: { x: 0, y: 1 },
      name: '입력 X축 값',
      data: [
        [dynamicData.xValue, 0.001],
        [dynamicData.xValue, 10]
      ]
    },
    chartsOptions1.series[3] = {
      type: 'line',
      color: 'orange',
      encode: { x: 0, y: 1 },
      name: '입력 Y축 값',
      data: [
        [0.001, dynamicData.yValue], [100, dynamicData.yValue]
      ]
    },
    chartsOptions1.series[4] = {
      type: 'scatter',
      color: 'orange',
      symbolSize: 10,
      name: '교차점',
      data: [
        [dynamicData.xValue, dynamicData.yValue]
      ]
    },
    chart1.value.clear();
    chart1.value.setOption(chartsOptions1);
  }
};

const closePopup = () => {
  emit('upData')
  Object.assign(searchParams, initParams);
  dialog.value = false
}

const deptopen=()=>{
  
  deptPopup.value.openPopup({ORGN_DIV:'A',HSE_ONLY : 'Y'});
}

const onDeptSelected =(val)=>{

  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  searchParams.DEPT_CD = val.DEPT_CD

}

const dilution_input =()=>{
  dilution_1.value='-'
  searchParams.DILUTION=dilution_2.value
}

defineExpose({
  openPopup
})

const vNumfmt = {
  mounted(el, binding) {
    init(el, binding);
    // 초기 표시
    el.__numfmt__.applyFromModel(binding.value);
    queueMicrotask(() => el.__numfmt__.applyFromModel(binding.value));
  },
  updated(el, binding) {
    // 프로그램으로 값이 바뀐 경우 항상 동기화
    el.__numfmt__?.applyFromModel(binding.value);
    queueMicrotask(() => el.__numfmt__?.applyFromModel(binding.value));
  },
  unmounted(el) {
    const s = el.__numfmt__;
    if (!s) return;
    s.inputEl?.removeEventListener("focus", s.onFocus);
    s.inputEl?.removeEventListener("blur", s.onBlur);
    s.inputEl?.removeEventListener("input", s.onInput);
    delete el.__numfmt__;
  },
};

function init(el, binding) {
  const state = {
    live: !!binding.modifiers.live,
    neg: !!binding.modifiers.neg,
    int: !!binding.modifiers.int,
    focused: false,
    // 핵심: 실제 입력 엘리먼트 찾기 (네이티브/컴포넌트 모두 커버)
    inputEl: el.tagName === "INPUT" || el.tagName === "TEXTAREA"
      ? el
      : (el.querySelector?.("input,textarea,[contenteditable='true']") || el),
  };

  // 유틸
  const norm = (s) => {
    let v = String(s ?? "").replace(/,/g, "");
    v = v.replace(state.neg ? /[^\d.\-]/g : /[^\d.]/g, "");
    if (state.neg) v = v.replace(/(?!^)-/g, "");
    const p = v.split(".");
    if (p.length > 2) v = p[0] + "." + p[1];
    return v;
  };
  const toNum = (s) => {
    const n = Number(String(s ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const toFixed14 = (n) => {
  if (state.int) {
    return { fixedStr: Math.trunc(n).toString(), digits: 0 }; // 👈 정수 전용
  }
  const d = (String(n).split(".")[1] || "").length || 1;
  const digits = Math.min(4, Math.max(1, d));
  return { fixedStr: Number(n).toFixed(digits), digits };
};
  const withComma = (fixedStr, digits) =>
    Number(fixedStr).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: 4,
    });
  const addCommaLive = (raw) => {
    if (!raw) return "";
    const neg = raw.startsWith("-") ? "-" : "";
    raw = neg ? raw.slice(1) : raw;
    const [i, f = ""] = raw.split(".");
    const i2 = (i || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return neg + i2 + (f ? "." + f : "");
  };
  const emitNum = (num) =>
    // 루트 el에서 쏘면 Vue 템플릿 @numvalue로 잘 잡힙니다 (버블링)
    el.dispatchEvent(new CustomEvent("numvalue", { detail: num, bubbles: true }));

  // 이벤트핸들러 (실제 input 엘리먼트에 바인딩!)
  const onFocus = () => (state.focused = true);

  const onBlur = () => {
    state.focused = false;

    // ✅ 텍스트 모드면 손대지 않고 그대로 둠
    if (state.nonNumeric) {
      // 숫자 이벤트는 null로만 통지(필요시 생략 가능)
      el.dispatchEvent(new CustomEvent("numvalue", { detail: null, bubbles: true }));
      return;
    }

    // 숫자 처리 (기존 로직)
    const n = toNum(state.inputEl.value);
    if (n == null) {
      // 숫자로 해석 불가하지만 사용자가 직접 입력한 케이스: 그대로 두고 null 통지
      el.dispatchEvent(new CustomEvent("numvalue", { detail: null, bubbles: true }));
      return;
    }
    const { fixedStr, digits } = toFixed14(n);
    state.inputEl.value = withComma(fixedStr, digits);
    el.dispatchEvent(new CustomEvent("numvalue", { detail: Number(fixedStr), bubbles: true }));
  };

  // const onInput = () => {
  //   if (!state.live) {
  //     // 입력 중 콤마 없이 정규화 + 숫자 동기
  //     state.inputEl.value = norm(state.inputEl.value);
  //     // 네이티브 input이면 이걸로 v-model 연동됨
  //     state.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  //     emitNum(toNum(state.inputEl.value));
  //     return;
  //   }
  //   // live: 즉시 콤마 표시
  //   const raw = norm(state.inputEl.value);
  //   const [i, f = ""] = raw.split(".");
  //   state.inputEl.value = addCommaLive(i + (f ? "." + f.slice(0, 4) : ""));
  //   state.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  //   emitNum(toNum(state.inputEl.value));
  // };

  const onInput = (e) => {
  // 사용자가 실제로 친 입력만 처리
  if (!e.isTrusted) return;

  const el = state.inputEl;

  if (!state.live) {
    el.value = norm(el.value);
    // 아래가 다시 onInput을 부르지만, 다음 호출은 isTrusted=false라 위에서 리턴됨
    el.dispatchEvent(new Event("input", { bubbles: true }));
    emitNum(toNum(el.value));
    return;
  }

  const raw = norm(el.value);
  const [i, f = ""] = raw.split(".");
  el.value = addCommaLive(i + (f ? "." + f.slice(0, 4) : ""));
  el.dispatchEvent(new Event("input", { bubbles: true })); // isTrusted=false
  emitNum(toNum(el.value));
};

  // 모델→표시 동기화 (포커스 중엔 스킵)
  const applyFromModel = (val) => {
    // 포커스 중엔 건드리지 않음
    if (state.focused) return;

    // ✅ 숫자가 아니면 문자열 그대로 표시 (지우지 않음)
    if (val === null || val === undefined || val === "") { 
      state.inputEl.value = ""; 
      state.nonNumeric = false; 
      return; 
    }
    const n = Number(val);
    if (!Number.isFinite(n)) {
      state.inputEl.value = String(val); // ← 여기!
      state.nonNumeric = true;           // ← 현재는 "텍스트 모드"
      return;
    }

    // 숫자면 기존 포맷
    state.nonNumeric = false;
    const { fixedStr, digits } = toFixed14(n);
    state.inputEl.value = withComma(fixedStr, digits);
    nextTick(() => {
      const { fixedStr: fs2, digits: dg2 } = toFixed14(n);
      state.inputEl.value = withComma(fs2, dg2);
    });
  };

  // 바인딩
  state.inputEl.addEventListener("focus", onFocus);
  state.inputEl.addEventListener("blur", onBlur);
  state.inputEl.addEventListener("input", onInput);

  el.__numfmt__ = { ...state, onFocus, onBlur, onInput, applyFromModel };
}


</script>
<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1000"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">폭발위험장소 산출</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnCalculatetest', 'btnClose']"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <!-- <v-radio-group inline
              v-model="searchParams.NEW_FLAG"
            >
              <v-radio
                v-for="item in codeList.newflagList"
                :key="item"
                :value="item.COD"
                :label="item.TXT"
                :disabled="radioDisabled"
              />
            </v-radio-group> -->
          </v-sheet>
          <!-- <div v-if="searchParams.NEW_FLAG == 'N'">
            <v-sheet class="searchArea">
              <div v-if="searchParams.CONFIRM_YN !='Y'" class="d-flex pb-1" style="color: red;">
                {{ $t("관리번호 채번규칙 : 지역구분-공정(공장)-설비-물질-장치-순번") }}
              </div>
              <div class="d-flex pb-1">
              <i-input
                :label="$t('관리번호')"
                v-model="searchParams.MANAGE_NUM"
                type="text"
                label-width="50px"
                width="300px"
                :disabled="manageDisabled"
              />

              <i-select
                :label="$t('설비 및 공정')"
                width="300px"
                labelWidth="80px" 
                placeholder="설비 및 공정"
                v-model="searchParams.TARGET_FAC"
                :items="codeList.targetFac"
                item-value="COD"
                item-title="TXT"                
                :disabled="targetFacDisabled"
              />
              </div>
              <div class="d-flex pb-1">
              <i-select
                :label="$t('지역구분')"
                width="300px"
                labelWidth="50px" 
                placeholder="지역구분"
                v-model="searchParams.AREA_DIV"
                :items="codeList.areaDiv"
                item-value="COD"
                item-title="TXT"
                :disabled="manageDisabled"
              />
              <i-input
                :label="$t('관리부서')"
                v-model="searchParams.DEPT_CD"
                type="text"
                label-width="80px"
                width="200px"
                appendInnerIcon="mdi-magnify"
                @click:appendInner="deptopen()"
                :disabled="manageDisabled"
              />
              <i-input
                v-model="searchParams.DEPT_NM"
                type="text"
                label-width="50px"
                width="200px"
                :disabled="manageDisabled"
              />
              </div>
            </v-sheet>
          </div>
          <div v-if="searchParams.NEW_FLAG == 'C'">
            <v-sheet class="searchArea d-flex">         
              <i-select
                :label="$t('관리번호')"
                width="350px"
                labelWidth="50px" 
                placeholder="관리번호"
                v-model="searchParams.MANAGE_NUM"
                :items="codeList.manageList"
                item-value="MANAGE_NUM"
                item-title="MANAGE_NUM"
                :disabled="manageDisabled"
                @update:modelValue="updateFacDiv"
              />
              <i-input
                :label="$t('설비 및 공정')"
                v-model="searchParams.TARGET_FAC"
                type="text"
                label-width="80px"
                readonly
                width="250px"
              />
            </v-sheet>
          </div> -->
          <!-- <div> -->
            <!-- MANAGE_NUM -->
            <!-- <h4>{{ $t("▣관리번호 ") + searchParams.MANAGE_NUM }}</h4> -->
          <!-- </div> -->
          <v-sheet class="d-flex flex-column align-center text-center mt-4">
            <div>
              <h1>{{ $t("폭발위험장소의 범위 계산(가스 누출)") }}</h1>
            </div>
            <!-- <div class="custom-input-box">
              <label class="custom-label">{{ $t("설비 및 공정 :") }}</label>
              <input 
                type="text" 
                v-model="searchParams.TARGET_FAC" 
                class="custom-input"
                disabled
                style="color: red;"
              />
            </div> -->
          </v-sheet>
          <div class="flex">
            <h4>{{ $t("1. 계산 적용 Code") }}</h4>
            <span style="margin-left: 30px;">
              {{ $t("KS C IEC 60079-10-1: 2015") }}
            </span>
          </div>
          
          <div class="mt-2">
            <h4>{{ $t("2. 누출원의 평가") }}</h4>
          </div>
          <v-sheet class="d-flex flex-column align-center text-center mt-1">
            <table class="excel-table">
              <thead>
                <tr>
                  <th rowspan="17">{{ $t("누출원의 평가") }}</th>
                  <td>{{ $t("인화성물질") }}</td>
                  <td>
                    <div class="flex-row">
                      <select v-model="searchParams.SUBS_NM" class="input-with-unit" @change="updateSubstance(searchParams.SUBS_NM)" style="color: red; -webkit-appearance: menulist; appearance: menulist;">
                        <option v-for="item in codeList.substanceData" :key="item.COD" :value="item.TXT">
                          {{ item.TXT }}
                        </option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" v-model="searchParams.FORMULA" readonly class="input-with-unit" style="color: blue;"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("분자량, M") }}</td>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" v-model="searchParams.MOLECULAR" class="input-with-unit" style="color: red;"/>
                      </span>
                      <span style="height:100%">
                        <input type="text" value="kg/kmol" readonly class="unit-box" />
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" value="(비열비)r=Cp/Cv" readonly class="unit-box" />
                      </span>
                      <span style="height:100%">
                        <input type="text" v-model="searchParams.POLYTRO" class="input-with-unit" style="color: red;"/>
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("내부 압력, P") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model.number="searchParams.INT_PRE"  -->
                      <input type="text" 
                      v-numfmt="searchParams.INT_PRE"
                      @numvalue="searchParams.INT_PRE = $event.detail"
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="Pa" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.REGF_PRE" -->
                      <input type="text" 
                      v-numfmt="searchParams.REGF_PRE"
                      @numvalue="searchParams.REGF_PRE = $event.detail"
                       readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="kg/cm2(gauge)" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("내부 온도, T") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.IN_TEM" -->
                      <input type="text"  
                      v-numfmt="searchParams.IN_TEM"
                      @numvalue="searchParams.IN_TEM = $event.detail"
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="℃" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.IN_TEM2" -->
                      <input type="text" 
                      v-numfmt="searchParams.IN_TEM2"
                      @numvalue="searchParams.IN_TEM2 = $event.detail"
                       readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="K" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("폭발하한(LFL)") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.LOWER_EXPL" -->
                      <input type="text" 
                      v-numfmt="searchParams.LOWER_EXPL"
                      @numvalue="searchParams.LOWER_EXPL = $event.detail"
                       class="input-with-unit" style="color: red;"/>
                      <input type="text" value="kg/m3" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.LOWER_EXPL2" -->
                      <input type="text" 
                      v-numfmt="searchParams.LOWER_EXPL2"
                      @numvalue="searchParams.LOWER_EXPL2 = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="% vol." readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("가스밀도, ρg") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.GAS_DENS" -->
                      <input type="text"  
                      v-numfmt="searchParams.GAS_DENS"
                      @numvalue="searchParams.GAS_DENS = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="kg/m3" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="-" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("대기압, Pa") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.ATMO_PREPA" -->
                      <input type="text" 
                      v-numfmt="searchParams.ATMO_PREPA"
                      @numvalue="searchParams.ATMO_PREPA = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="Pa(abs.)" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.ATMO_PREKG" -->
                      <input type="text" 
                      v-numfmt="searchParams.ATMO_PREKG"
                      @numvalue="searchParams.ATMO_PREKG = $event.detail" 
                       readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="kg/cm2(gauge)" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("대기 온도, Ta") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.AIR_TEMC" -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.AIR_TEMC"
                      @numvalue="searchParams.AIR_TEMC = $event.detail" 
                       class="input-with-unit" style="color: red;"/>
                      <input type="text" value="℃" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.AIR_TEMK" -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.AIR_TEMK"
                      @numvalue="searchParams.AIR_TEMK = $event.detail" 
                       readonly class="input-with-unit" style="color: red;"/>
                      <input type="text" value="K" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("누출원") }}</td>
                  <td>
                    <div class="flex-row">
                      <select v-model="searchParams.LEAK_SOU" @change="leakSouChange" class="input-with-unit4" style="color: red; -webkit-appearance: menulist; appearance: menulist;">
                        <option v-for="item in leakSouData" :key="item.COD" :value="item.TXT">
                          {{ item.TXT }}
                        </option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="누출유형" readonly class="unit-box" style="width: 40%"/>
                      <select v-model="searchParams.LEAK_TYPE" class="input-with-unit4" style="color: red; -webkit-appearance: menulist; appearance: menulist; ">
                        <option v-for="item in leakTypeData" :key="item.COD" :value="item.TXT">
                          {{ item.TXT }}
                        </option>
                      </select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("누출등급") }}</td>
                  <td>
                    <div class="flex-row">
                      <input v-model="searchParams.LEAK_LEVEL" readonly class="input-with-unit" style="color: blue; ">
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="-" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("LEL의 안전계수, k") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.LEL_SNUM"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.LEL_SNUM"
                      @numvalue="searchParams.LEL_SNUM = $event.detail" 
                      readonly class="unit-box" style="color: blue;" step="0.1"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="≤ 1.0" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("누출계수, Cd") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.LEAK_COE"  -->
                      <input type="text"                       
                      v-numfmt.neg="searchParams.LEAK_COE"
                      @numvalue="searchParams.LEAK_COE = $event.detail" 
                      readonly class="unit-box" style="color: blue;" step="0.1"/>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span>{{ $t("≤ 1.0") }}</span>
                      <input type="text" value="(통기구, 원형 0.99 / 비원형 0.75)" readonly class="unit-box"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td rowspan="2">{{ $t('임계압력, Pc') }}<br>{{ $t('가스속도') }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.CRIT_PRE"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.CRIT_PRE"
                      @numvalue="searchParams.CRIT_PRE = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="Pa" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="압축계수, Z" readonly class="unit-box" />
                      <input type="text" v-model="searchParams.COMP_COE" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="P" readonly class="unit-box" style="width: 80%;"/>
                      <input v-model="searchParams.GAS_SPEED_INE" readonly class="input-with-unit" style="color: blue; width: 90%;"/>
                      <input type="text" value="Pc" readonly class="unit-box" style="width: 80%;"/>
                      <!-- v-model="searchParams.GAS_SPEED"  -->
                      <input 
                      v-numfmt.neg="searchParams.GAS_SPEED"
                      @numvalue="searchParams.GAS_SPEED = $event.detail" 
                      readonly class="input-with-unit" style="color: blue; width: 150%;"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- ㎟ => ㎡ 자동계산 해줘야함 -->
                      <input type="text" value="Hole size, S" readonly class="unit-box" style="width: 150%;"/>
                      <!-- v-model="searchParams.HOLE_SIZE"  -->
                      <input type="text" 
                      v-numfmt="searchParams.HOLE_SIZE"
                      @numvalue="searchParams.HOLE_SIZE = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="㎡" readonly class="unit-box" style="width: 70%;"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("아음속가스 누출률, Wg") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.SUBS_LEAK"  -->
                      <input type="text" 
                      v-numfmt="searchParams.SUBS_LEAK"
                      @numvalue="searchParams.SUBS_LEAK = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="kg/s" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.SUBS_LEAK2"  -->
                      <input type="text" 
                      v-numfmt="searchParams.SUBS_LEAK2"
                      @numvalue="searchParams.SUBS_LEAK2 = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("음속가스 누출률, Wg") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.SONIC_LEAK"  -->
                      <input type="text" 
                      v-numfmt="searchParams.SONIC_LEAK"
                      @numvalue="searchParams.SONIC_LEAK = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="kg/s" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.SONIC_LEAK2"  -->
                      <input type="text" 
                      v-numfmt="searchParams.SONIC_LEAK2"
                      @numvalue="searchParams.SONIC_LEAK2 = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{{ $t("누출특성") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.LEAK_CHAR"  -->
                      <input type="text" 
                      v-numfmt="searchParams.LEAK_CHAR"
                      @numvalue="searchParams.LEAK_CHAR = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="Wg/(Pg*k*LFL)" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
              </thead>
            </table>
          </v-sheet>
          <div class="mt-2">
            <h4>{{ $t("3. 환기 지침") }}</h4>
          </div>
          <span style="margin-left: 30px;">
            <h4>{{ $t("1) 환기") }}</h4>
          </span>
          <v-sheet class="d-flex flex-column align-center text-center mt-1">
            <table class="excel-table">
              <thead>
                <tr>
                  <th rowspan="19">{{ $t("환기 특성") }}</th>
                  <td colspan="2">{{ $t("조건") }}</td>
                  <td>
                    <div class="flex-row">
                      <select v-model="searchParams.DOOR_DIV" class="input-with-unit" style="color: red; -webkit-appearance: menulist; appearance: menulist;">
                        <option v-for="item in doorDivData" :key="item.COD" :value="item.TXT">
                          {{ item.TXT }}
                        </option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <select v-model="searchParams.DOOR_NAME" class="input-with-unit" style="color: red; -webkit-appearance: menulist; appearance: menulist;">
                        <option v-for="item in filteredDoorNameData" :key="item.COD" :value="item.TXT">
                          {{ item.TXT }}
                        </option>  
                      </select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("대기압, Pa") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.ATMO_PREPA"  -->
                      <input type="text" 
                      v-numfmt="searchParams.ATMO_PREPA"
                      @numvalue="searchParams.ATMO_PREPA = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="Pa abs." readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <div class="unit-box" style="width: 70%">
                        {{ $t("건물의 압력계수") }}<br>{{ $t("특성, ΔCp") }}
                      </div>
                      <!-- v-model="searchParams.BPCC"  -->
                      <input type="text" 
                      v-numfmt="searchParams.BPCC"
                      @numvalue="searchParams.BPCC = $event.detail" 
                      class="input-with-unit" style="width: 30%; color:red"/>   
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("풍속, uw") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.WIND_SPEED"  -->
                      <input type="text" 
                      v-numfmt="searchParams.WIND_SPEED"
                      @numvalue="searchParams.WIND_SPEED = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="m/s" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <div class="unit-box" style="width: 100%">
                        {{ $t("- 옥외: 장애물 O/X, 지표면고도,") }}<br>{{ $t("가벼운/무거운 가스, 액체풀추정") }}<br>{{ $t("- 옥내: 0.05 m/s, 측정치 등") }}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("대기 온도, Ta") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.AIR_TEMK"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.AIR_TEMK"
                      @numvalue="searchParams.AIR_TEMK = $event.detail" 
                      readonly class="input-with-unit" style="color: blue; width:30%;"/>
                      <input type="text" value="K" readonly class="unit-box" style="width:40%"/>
                      <input type="text" value="ΔT" readonly class="unit-box3" style="width:30%"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.TEMP_CHA"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.TEMP_CHA"
                      @numvalue="searchParams.TEMP_CHA = $event.detail" 
                      readonly class="input-with-unit" style="color: blue; width:20%;"/> 
                      <input type="text" value="Tin" readonly class="unit-box" style="width:15%"/>
                      <!-- v-model="searchParams.T_IN"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.T_IN"
                      @numvalue="searchParams.T_IN = $event.detail" 
                      class="input-with-unit" style="color: red; width:25%;"/> 
                      <input type="text" value="Tout" readonly class="unit-box" style="width:15%"/>
                      <!-- v-model="searchParams.T_OUT"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.T_OUT"
                      @numvalue="searchParams.T_OUT = $event.detail" 
                      class="input-with-unit" style="color: red; width:25%;"/> 
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("공기밀도, Pa") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.AIR_DENS"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.AIR_DENS"
                      @numvalue="searchParams.AIR_DENS = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="kg/㎥" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <div class="unit-box" style="width: 50%">
                        {{ $t("개구부 평균 중심") }}<br>{{ $t("수직거리, Ha") }}
                      </div>
                      <!-- v-model="searchParams.OPEN_VERT" -->
                      <input type="text" 
                      v-numfmt="searchParams.OPEN_VERT"
                      @numvalue="searchParams.OPEN_VERT = $event.detail" 
                      class="input-with-unit" style="width: 30%; color:red"/>
                      <input type="text" value="m" readonly class="unit-box" style="width: 20%"/>   
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("바람/온도 영향 압력 차, Δp") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.TEM_WIND_PRE"  -->
                      <input type="text" 
                      v-numfmt.neg="searchParams.TEM_WIND_PRE"
                      @numvalue="searchParams.TEM_WIND_PRE = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                      <input type="text" value="Pa" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="-" readonly class="unit-box" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("등가 유효 단면적 Ae") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.EQUI_AREA" -->
                      <input type="text"  
                      v-numfmt="searchParams.TEM_WIND_PRE"
                      @numvalue="searchParams.TEM_WIND_PRE = $event.detail" 
                      readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="㎡" readonly class="unit-box" />
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <div class="input-group2">
                        <div class="unit-box" style="width: 100%">
                          <!-- {{ $t("급기면적,") }}<br>{{ $t("A1") }} -->
                          {{ $t("급기면적, A1") }}
                        </div>
                        <!-- v-model="searchParams.AIRSUP_AREA" -->
                        <input type="text" 
                        v-numfmt="searchParams.AIRSUP_AREA"
                        @numvalue="searchParams.AIRSUP_AREA = $event.detail"
                         class="input-with-unit" style="color: red; width: 80%"/>
                        <input type="text" value="㎡" readonly class="unit-box" style="width: 20%; height:100%"/>   
                      </div>
                      <div class="input-group2">
                        <div class="unit-box3" style="width: 100%">
                          {{ $t("배기면적, A2") }}
                        </div>
                        <!-- v-model="searchParams.EXHAUST_AREA" -->
                          <input type="text" 
                          v-numfmt="searchParams.EXHAUST_AREA"
                          @numvalue="searchParams.EXHAUST_AREA = $event.detail" 
                          class="input-with-unit" style="color: red; width: 80%"/>
                          <input type="text" value="㎡" readonly class="unit-box" style="width: 20%; height:100%"/>   
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t('밀폐공간 크기, Vo') }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.VOLUME" -->
                      <input type="text" 
                        v-numfmt="searchParams.VOLUME"
                        @numvalue="searchParams.VOLUME = $event.detail" 
                       readonly class="input-with-unit" style="color: blue;"/>
                      <input type="text" value="㎥" readonly class="unit-box" />
                    </div>
                  </td>
                  <td class="flex-row2">
                    <div class="input-group">
                      <input type="text" value="L [m]" readonly class="unit-box4" />
                      <!-- v-model="searchParams.LENGTH"  -->
                      <input type="text" 
                        v-numfmt="searchParams.LENGTH"
                        @numvalue="searchParams.LENGTH = $event.detail" 
                      class="input-with-unit" style="color: red;">
                    </div>
                    <div class="input-group">
                      <input type="text" value="B [m]" readonly class="unit-box4" />
                      <!-- v-model="searchParams.WIDTH" -->
                      <input type="text" 
                        v-numfmt="searchParams.WIDTH"
                        @numvalue="searchParams.WIDTH = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                    </div>
                    <div class="input-group">
                      <input type="text" value="H [m]" readonly class="unit-box4" />
                      <!-- v-model="searchParams.HEIGHT"  -->
                      <input type="text" 
                        v-numfmt="searchParams.HEIGHT"
                        @numvalue="searchParams.HEIGHT = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("누출계수, Cd") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.LEAK_COE2" -->
                      <input type="text" 
                        v-numfmt="searchParams.LEAK_COE2"
                        @numvalue="searchParams.LEAK_COE2 = $event.detail" 
                       class="input-with-unit" style="color: red;"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <div class="unit-box" style="width: 100%">
                        {{ $t("0.5 ~ 0.75") }}<br>{{ $t("대형환기구, 입/출구, 난류와 점성") }}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="4">
                    <table class="excel-table" style="width:100%; border=1px solid #000">
                      <tr>
                        <td rowspan="4">{{ $t("공기 체적 유량, Qa") }}</td>
                        <td>
                          <div class="flex-row">
                              <input type="text" value="강제환기" readonly class="unit-box5" style="width: 100%; color: red;"/>
                          </div>
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_FORC_VENT"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_FORC_VENT"
                            @numvalue="searchParams.Q_FORC_VENT = $event.detail" 
                            readonly class="input-with-unit" style="width: 100%; color: blue;"/>
                            <input type="text" value="㎥/s" readonly class="unit-box" />
                          </div>    
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_FORC_VENT_H"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_FORC_VENT_H"
                            @numvalue="searchParams.Q_FORC_VENT_H = $event.detail" 
                            readonly class="input-with-unit" style="color: blue;"/>
                            <input type="text" value="㎥/h" readonly class="unit-box" />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div class="flex-row">
                            <span style="height:100%">
                              <input type="text" value="바람에 의한 환기" readonly class="unit-box5" style="width: 100%;"/>
                            </span>  
                          </div>
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_WIND_VENT"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_WIND_VENT"
                            @numvalue="searchParams.Q_WIND_VENT = $event.detail" 
                            readonly class="input-with-unit" style="width: 100%; color: blue;"/>
                            <input type="text" value="㎥/s" readonly class="unit-box" />
                          </div>    
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_WIND_VENT_H"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_WIND_VENT_H"
                            @numvalue="searchParams.Q_WIND_VENT_H = $event.detail" 
                            readonly class="input-with-unit" style="color: blue;"/>
                            <input type="text" value="㎥/h" readonly class="unit-box" />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div class="flex-row">
                            <span style="height:100%">
                              <input type="text" value="온도차에 의한 부력" readonly class="unit-box5" style="width: 100%;"/>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_TEMP_VENT"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_TEMP_VENT"
                            @numvalue="searchParams.Q_TEMP_VENT = $event.detail" 
                            readonly class="input-with-unit" style="width: 100%; color: blue;"/>
                            <input type="text" value="㎥/s" readonly class="unit-box" />
                          </div>    
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_TEMP_VENT_H"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_TEMP_VENT_H"
                            @numvalue="searchParams.Q_TEMP_VENT_H = $event.detail" 
                            readonly class="input-with-unit" style="color: blue;"/>
                            <input type="text" value="㎥/h" readonly class="unit-box" />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div class="flex-row">
                            <span style="height:100%">
                              <input type="text" value="바람,온도 혼합" readonly class="unit-box" style="width: 100%;"/>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_MIX_VENT"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_MIX_VENT"
                            @numvalue="searchParams.Q_MIX_VENT = $event.detail" 
                            readonly class="input-with-unit" style="width: 100%; color: blue;"/>
                            <input type="text" value="㎥/s" readonly class="unit-box" />
                          </div>    
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.Q_MIX_VENT_H"  -->
                            <input type="text" 
                            v-numfmt="searchParams.Q_MIX_VENT_H"
                            @numvalue="searchParams.Q_MIX_VENT_H = $event.detail" 
                            readonly class="input-with-unit" style="color: blue;"/>
                            <input type="text" value="㎥/h" readonly class="unit-box" />
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td colspan="4">
                  <table border=1 class="excel-table" style="width:100%;">
                    <tr >
                  <td rowspan="4" style="width:15%">{{ $t("환기속도, Uw") }}</td>
                  <td style="width:15%">
                    <div class="flex-row">
                      <input type="text" value="강제환기" readonly class="unit-box5" style="width: 100%; color: red;"/>
                    </div>
                  </td>
                  <td style="width:20%">
                    <div class="flex-row">
                      <!-- v-model="searchParams.U_FORC_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.U_FORC_VENT"
                      @numvalue="searchParams.U_FORC_VENT = $event.detail" 
                      readonly class="input-with-unit" style="color: blue; width: 50%;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" style="width: 50%;"/>
                    </div>
                  </td>
                  <td rowspan="4" style="width:15%;white-space: pre-line">{{ $t("룸 내 공기교환 \n주기, C") }}</td>
                  <td style="width:15%">
                    <div class="flex-row">
                      <input type="text" value="강제환기" readonly class="unit-box5" style="width: 100%; color: red;"/>
                    </div>
                  </td>
                  <td style="width:20%">
                    <div class="flex-row">
                      <!-- v-model="searchParams.C_FORC_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.C_FORC_VENT"
                      @numvalue="searchParams.C_FORC_VENT = $event.detail" 
                      readonly class="input-with-unit2" style="color: blue; width: 50%;"/>
                      <input type="text" value="s" readonly class="unit-box" style="width: 50%;"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" value="바람에 의한 환기" readonly class="unit-box5" style="width: 100%;"/>
                      </span>  
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.U_WIND_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.U_WIND_VENT"
                      @numvalue="searchParams.U_WIND_VENT = $event.detail" 
                      readonly class="input-with-unit" style="color: blue; width: 50%;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" style="width: 50%;"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" value="바람에 의한 환기" readonly class="unit-box5" style="width: 100%;"/>
                      </span>  
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.C_WIND_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.C_WIND_VENT"
                      @numvalue="searchParams.C_WIND_VENT = $event.detail" 
                      readonly class="input-with-unit2" style="color: blue; width: 50%;"/>
                      <input type="text" value="s" readonly class="unit-box" style="width: 50%;"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" value="온도차에 의한 부력" readonly class="unit-box5" style="width: 100%;"/>
                      </span>  
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.U_TEMP_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.U_TEMP_VENT"
                      @numvalue="searchParams.U_TEMP_VENT = $event.detail" 
                      readonly class="input-with-unit" style="color: blue; width: 50%;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" style="width: 50%;"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" value="온도차에 의한 부력" readonly class="unit-box5" style="width: 100%;"/>
                      </span>  
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.C_TEMP_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.C_TEMP_VENT"
                      @numvalue="searchParams.C_TEMP_VENT = $event.detail" 
                      readonly class="input-with-unit2" style="color: blue; width: 50%;"/>
                      <input type="text" value="s" readonly class="unit-box" style="width: 50%;"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" value="바람, 온도 혼합" readonly class="unit-box5" style="width: 100%;"/>
                      </span>  
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.U_MIX_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.U_MIX_VENT"
                      @numvalue="searchParams.U_MIX_VENT = $event.detail" 
                      readonly class="input-with-unit" style="color: blue; width: 50%;"/>
                      <input type="text" value="m/s" readonly class="unit-box" style="width: 50%;"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <span style="height:100%">
                        <input type="text" value="바람, 온도 혼합" readonly class="unit-box5" style="width: 100%;"/>
                      </span>  
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.C_MIX_VENT"  -->
                      <input type="text" 
                      v-numfmt="searchParams.C_MIX_VENT"
                      @numvalue="searchParams.C_MIX_VENT = $event.detail" 
                      readonly class="input-with-unit2" style="color: blue; width: 50%;"/>
                      <input type="text" value="/s" readonly class="unit-box" style="width: 50%;"/>
                    </div>  
                    </td>
                  </tr>
                  </table>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">{{ $t("환기효율계수, f") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.VENT_COE"  -->
                      <input type="text" 
                      v-numfmt="searchParams.VENT_COE"
                      @numvalue="searchParams.VENT_COE = $event.detail" 
                      class="input-with-unit" style="color: red;"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <div class="input-with-unit" readonly style="width: 55%">
                        {{ $t("룸 내 공기/가스 체적 유량,") }}<br>{{ $t("Q2=C*V0") }}
                      </div>
                      <!-- v-model="searchParams.AGVFIR" -->
                      <input type="text" 
                      v-numfmt="searchParams.AGVFIR"
                      @numvalue="searchParams.AGVFIR = $event.detail" 
                      readonly class="input-with-unit2" style="color: blue; width: 30%;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" style="width: 15%;"/>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="4">
                    <table border=1 class="excel-table" style="width:100%;">
                      <tr>
                        <td>{{ $t("배경농도, Xb") }}</td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.BACK_DENS"  -->
                            <input type="text" 
                            v-numfmt="searchParams.BACK_DENS"
                            @numvalue="searchParams.BACK_DENS = $event.detail" 
                            readonly class="input-with-unit" style="color: blue; width: 60%;"/>
                            <input type="text" v-model="searchParams.DENS_INE" readonly class="input-with-unit2" style="width: 40%;"/>
                          </div>
                        </td>
                        <td>
                          <div class="flex-row">
                            <!-- v-model="searchParams.CRIT_CONCENT"   -->
                            <input type="text" 
                            v-numfmt="searchParams.CRIT_CONCENT"
                            @numvalue="searchParams.CRIT_CONCENT = $event.detail" 
                            readonly class="input-with-unit" style="color: blue; width: 50%;"/>
                            <div class="input-with-unit2" style="width: 50%">
                              {{ $t("임계농도, Xcrit") }}
                            </div>
                          </div>
                        </td>
                        <td>
                          <input type="text" v-model="dilution_1" readonly class="unit-box3" style="color: green; width: 50%;"/>
                          <input type="text" v-model="dilution_2" @input="dilution_input" class="unit-box6" style="color: green; width: 50%;"/>
                        </td>
                      </tr>
                    </table>
                  </td>                  
                </tr>
              </thead>
            </table>
          </v-sheet> 
          <span style="margin-left: 30px;" class="mt-2">
            <h4>{{ $t("2) 환기 유효성") }}</h4>
          </span> 
          <v-sheet class="d-flex flex-column align-center text-center mt-1">
            <table class="excel-table">
              <thead>
                <tr>
                  <td>{{ $t("누출특성") }}</td>
                  <td>
                    <div class="flex-row">
                      <!-- v-model="searchParams.LEAK_CHAR"  -->
                      <input type="text" 
                      v-numfmt="searchParams.LEAK_CHAR"
                      @numvalue="searchParams.LEAK_CHAR = $event.detail" 
                      readonly class="input-with-unit" style="color: green;"/>
                      <input type="text" value="㎥/s" readonly class="unit-box" style="width: 20%"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex-row">
                      <input type="text" value="환기속도, Uw" readonly class="unit-box" style="width: 35%"/>
                      <!-- v-model="selectedVentSpeed"  -->
                      <input type="text" 
                      v-numfmt="selectedVentSpeed"
                      @numvalue="selectedVentSpeed = $event.detail" 
                      readonly class="input-with-unit" style="color: green; width: 45%"/>
                      <input type="text" value="m/s" readonly class="unit-box" style="width: 20%"/>  
                    </div>
                  </td>
                </tr>
              </thead>
            </table>
          </v-sheet>
          <!-- 차트1 -->
          <v-sheet class="d-flex flex-column align-center text-center mt-3">
            <div class="d-flex flex-column align-center" style="width: 100%; height: 100%; min-width: 300px; min-height: 500px;">
              <Echart
                ref="chart1" 
                :option="chartsOptions1" 
                class="my-2 pa-0 echarts_style border rounded-sm"
              />
            </div>
          </v-sheet>
          <span style="margin-left: 30px;" class="mt-2">
            <h4>{{ $t("3) 환기 이용도") }}</h4>
          </span> 
          <v-sheet class="d-flex flex-column align-center text-center mt-3">
            <table style="width: 80%; border-collapse: collapse; border: 1px solid black;">
              <thead>
                <tr style="border: 1px solid black;">
                  <div class="flex-row">
                    <select class="input-with-unit" v-model="searchParams.VENT_USAGE" style="color: red; width: 30%; -webkit-appearance: menulist; appearance: menulist;">
                      <option v-for="item in codeList.VENT_USAGE_LIST" :key="item.COD" :value="item.COD">
                        {{ item.TXT }}
                      </option>
                    </select>
                  </div>
                </tr>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="우수(good)" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" value="환기가 실제적으로 지속되는 상태" readonly class="input-with-unit3" style="width: 70%"/>
                    </div>
                  </td>
                </tr>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="양호(fair)" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" value="환기의 정상작동이 지속됨이 예측되는 상태. 빈번하지 않은 단기간 중단 허용" readonly class="input-with-unit3" style="width: 70%"/>
                    </div>
                  </td>
                </tr>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="미흡(poor)" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" value="우수/양호는 아니지만, 장기간 중단이 발생하는 것으로 예상되지 않는 상태" readonly class="input-with-unit3" style="width: 70%"/>
                    </div>
                  </td>
                </tr>
              </thead>
            </table>
          </v-sheet>
          <div class="mt-2">
            <h4>{{ $t("5. 폭발위험장소의 추정") }}</h4>
          </div>
          <span style="margin-left: 30px;">
            <h4>{{ $t("1) 폭발위험장소 종별의 추정") }}</h4>
          </span>
          <v-sheet class="d-flex flex-column align-center text-center mt-3">
            <table style="width: 80%; border-collapse: collapse; border: 1px solid black;">
              <thead>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="누출 등급" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" v-model="searchParams.LEAK_LEVEL" readonly class="input-with-unit3" style="width: 50%; color: green;"/>
                    </div>
                  </td>
                </tr>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="누출 유형" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" v-model="searchParams.LEAK_TYPE" readonly class="input-with-unit3" style="width: 50%; color: green;"/>
                    </div>
                  </td>
                </tr>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="환기의 유효성" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" v-model="searchParams.DILUTION" readonly class="input-with-unit3" style="width: 50%; color: green;"/>
                    </div>
                  </td>
                </tr>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="환기 이용도" readonly class="input-with-unit" style="width: 30%"/>
                      <select  v-model="searchParams.VENT_USAGE" class="input-with-unit3" style="width: 50%; color: red;  -webkit-appearance: menulist; appearance: menulist;">
                        <option v-for="item in codeList.VENT_USAGE_LIST" :key="item.COD" :value="item.COD" readonly>
                          {{ item.TXT }}
                        </option>
                      </select>
                    </div>
                  </td>
                </tr>
              </thead>
            </table>
          </v-sheet>
          <v-sheet class="d-flex flex-column align-center text-center mt-4">
            <h6>{{ $t("표 D.1 - 누출등급과 환기유효성에 의한 폭발위험 장소의 종별") }}</h6>
          </v-sheet>
          <v-sheet class="d-flex flex-column align-center text-center mt-1">
            <table class="image-table">
              <tr>
                <th rowspan="4" style="width:10%;">{{ $t("누출등급") }}</th>
                <th colspan="7">{{ $t("환기유효성") }}</th>
              </tr>
              <tr>
                <th colspan="3" style="width:39%;">{{ $t("고희석") }}</th>
                <th colspan="3" style="width:39%;">{{ $t("중희석") }}</th>
                <th style="width:39%;">{{ $t("저희석") }}</th>
              </tr>
              <tr>
                <th colspan="7">{{ $t("환기이용도") }}</th>
              </tr>
              <tr>
                <th style="width:100px">{{ $t("우수") }}</th>
                <th style="width:100px">{{ $t("양호") }}</th>
                <th style="width:100px">{{ $t("미흡") }}</th>
                <th style="width:100px">{{ $t("우수") }}</th>
                <th style="width:100px">{{ $t("양호") }}</th>
                <th style="width:100px">{{ $t("미흡") }}</th>
                <th style="width:100px">{{ $t("우수/양호/미흡") }}</th>
              </tr>
              <tr v-for="(row, index) in explosionData" :key="index">
                <td >{{ row.level }}</td>
                <td v-for="(cell, cellIndex) in row.values" 
                    :key="cellIndex" 
                    :class="{ 'highlight': isHighlighted(row.level, cell.category, cell.usage) }">
                  {{ cell.text }}
                </td>
              </tr>
              <tr>
                <td colspan="8" style="font-size: 12px; text-align: left;">
                  {{ $t("ａ  0종 NE, 1종 NE 2종 NE는 정상조건에서는 무시할 수 있는 범위의 이론적 폴발위험장소를 말한다.") }} <br>
                  {{ $t("ｂ  2차 누출등급으로 형성된 2종 장소가 1차 또는 연속 누출등급에 의한 범위보다 클 수 있다. 이 경우, 더 큰 거리를 선정하는 것이 바람직하다.") }} <br>
                  {{ $t("ｃ  환기가 아주 약하고 실제로 폭발성 가스 분위기가 지속되는 누출의 경우(즉, 환기 없는 것에 가까운 상태)에는 0종 장소에 할 수 있다.") }}
                </td>
              </tr>
              <tr>
                <td colspan="8" style="font-size: 12px; text-align: left;">
                  {{ $t("'+'는 '~에 둘러싸여 있음'을 뜻한다.") }} <br>
                  {{ $t("자연환기가 일어나는 밀폐공간에서의 환기이용도는 '우수'로 고려해서는 안 된다.") }}
                </td>
              </tr>
            </table>
          </v-sheet>
          <span class="mt-3" style="margin-left: 30px;">
            <h4>{{ $t("2) 폭발위험장소 범위의 추정") }}</h4>
          </span>
          <!-- 차트2 -->
          <v-sheet class="d-flex flex-column align-center text-center mt-3">
            <div class="d-flex flex-column align-center" style="width: 100%; height: 100%; min-width: 300px; min-height: 500px;">
              <Echart
                ref="chart2" 
                :option="chartsOptions2" 
                class="my-2 pa-0 echarts_style border rounded-sm"
              />
            </div>
          </v-sheet>
          <v-sheet class="d-flex flex-column align-center text-center mt-4">
            <h6>{{ $t("그림 D.1 - 폭발위험장소의 범위 추정 차트") }}</h6>
          </v-sheet>
          <v-sheet class="d-flex flex-column align-center text-center mt-3">
            <table style="width: 80%; border-collapse: collapse; border: 1px solid black;">
              <thead>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="폭발위험장소" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" v-model="searchParams.EXPL_TYPE" readonly class="input-with-unit3" style="width: 50%; color: green;"/>
                    </div>
                  </td>
                </tr>
                <tr style="border: 1px solid black;">
                  <td style="border: 1px solid black;">
                    <div class="flex-row">
                      <input type="text" value="범위 [m]" readonly class="input-with-unit" style="width: 30%"/>
                      <input type="text" v-model="searchParams.EXPL_RANGE" readonly class="input-with-unit3" style="width: 50%; color: blue;"/>
                    </div>
                  </td>
                </tr>
              </thead>
            </table>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  </VDialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(150vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}
.custom-input-box {
  display: flex;
  align-items: center;
  width: 350px;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.custom-label {
  width: 100px;
  color: black; /* 검은색 글자 */
  font-weight: bold;
}

.custom-input {
  flex: 1;
  border: none;
  background: transparent;
  color: red; /* 빨간색 글자 */
  font-size: 14px;
  outline: none;
}

.custom-input:disabled {
  color: red; /* disabled 상태에서도 빨간색 유지 */
  opacity: 1; /* 기본적으로 흐려지는 효과 제거 */
}

.excel-table {
  width: 90%;
  border-collapse: collapse;
  table-layout: fixed; /* 셀 크기 고정 */
}

.excel-table td {
  width: 200px;
  height: 50px;
  border: 1px solid black; /* 엑셀 스타일 테두리 */
  text-align: center;
  vertical-align: middle;
}

.excel-table th {
  writing-mode: vertical-rl; /* 글자를 세로로 표시 */
  text-orientation: mixed;
  font-weight: bold;
  border: 1px solid black; /* 엑셀 스타일 테두리 */
  width: 40px;
}

.excel-table td input {
  width: 100%;
  height: 100%;
  border: none;
  text-align: center;
  font-size: 16px;
  outline: none;
}
.flex-row {
  display: flex;
  align-items: center; /* 세로 중앙 정렬 */
  width: 100%;
  height: 100%;
}
.flex-row2 {
  display: flex;
  align-items: center; /* 세로 중앙 정렬 */
  width: 100% !important;
  height: 100%;
  border: none !important;
}
.input-with-unit {
  border: 0px solid #ccc;
  padding: 5px;
  text-align: center;
  font-size: 14px;
  outline: none;
  width: 100%;
  height: 100%;
}
.input-with-unit2 {
  border-left: 1px solid #000000 !important;
  padding: 5px;
  text-align: center;
  font-size: 14px;
  outline: none;
  width: 100%;
  height: 100%;
}
.input-with-unit3 {
  border-left: 1px solid #000000 !important;
  padding: 5px;
  text-align: left;
  font-size: 14px;
  outline: none;
  width: 100%;
  height: 100%;
}

.input-with-unit4 {
  border: 0px solid #ccc;
  padding: 5px;
  text-align: left;
  font-size: 14px;
  outline: none;
  width: 100%;
  height: 100%;
}

.input-with-unit:not([readonly]) {
  // background-color: yellow; /* 원하는 배경색으로 변경 */
  border: 1px solid orange;
}

.input-with-unit3:not([readonly]) {
  // background-color: yellow; /* 원하는 배경색으로 변경 */
  border: 1px solid orange;
}

.unit-box {
  width: 40%;
  border: 0px solid #ccc;
  background-color: #f2f2f2;
  text-align: center;
  font-weight: bold;
  pointer-events: none;
}
.unit-box2 {
  display: inline-block;
  padding: 5px;
  border: none;
  border-radius: 0; 
  background-color: #f2f2f2;
  width: 100%;
  height: 100%;
  font-weight: 700;
}
.unit-box3 {
  width: 40%;
  border-left: 1px solid #000000 !important;
  background-color: #f2f2f2;
  text-align: center;
  font-weight: bold;
  pointer-events: none;
}
.unit-box4 {
  width: 100%;
  text-align: center;
  background-color: #f2f2f2;
}
.unit-box5 {
  width: 100%;
  border: 0px solid #ccc;
  background-color: #f2f2f2;
  text-align: center;
  font-weight: bold;
  pointer-events: none;
}
.unit-box6 {
  width: 100%;
  border: 1px solid #000000;
  background-color: #f2f2f2;
  text-align: center;
  font-weight: bold;
  // pointer-events: none;
}

.input-group {
  display: flex;
  flex-direction: column; /* 위아래 정렬 */
  align-items: center; /* 가운데 정렬 */
  width: 34%;
  height: 100%;
  border-right: 1px solid #000000 !important;
}

.input-group {
  display: flex;
  flex-direction: column; /* 위아래 정렬 */
  align-items: center; /* 가운데 정렬 */
  width: 50%;
  height: 100%;
  border-right: 1px solid #000000 !important;
}
.echarts_style {
  width: 80%;
  height: 100%;
}
.image-table {
    width: 80%;
    border-collapse: collapse;
  }
.image-table th, .image-table td {
  border: 1px solid black;
  text-align: center;
  padding: 5px;
}
.th_fontsize th {
  font-size: 12px;
  font-weight: 500;
}
.highlight {
  border: 2px solid green !important;
}
</style>