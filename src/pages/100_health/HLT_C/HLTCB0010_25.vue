<script setup>
//산업보건 - 질환계통별 직업병 유소견율
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import Echart from 'vue-echarts'
import dayjs from 'dayjs'
import RealGrid from '@/components/RealGrid.vue'
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const activeSheet = ref(null)
const perHealthData = ref(null) //시트 클릭 했을때 조회되는 값들
const model = ref(null)
const emit = defineEmits(['emit', 'changePage'])
const grdMain = ref(null)
const ifValue = ref('E08')

const props = defineProps({
  codeArray1: {
    type: Array,
  },
  codeArray2: {
    type: Array,
  },
})

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  IND_CLS: 'E', //지표분류(건강행태)
  IND_NM: 'E08', //지표명(질환계통별 직업병 유소견율)
  BSNS_CD: '', //사업부
  DEPT_CD: '', //전체
  YEAR_FROM: dayjs().subtract(4, 'year').format('YYYY'), //년도FROM
  YEAR_TO: dayjs().format('YYYY') - 1, //년도TO
})

const codeList = reactive({
  IND_CLS: [],
  IND_NM: [],
  BSNS_CD: [],
  DEPT_CD: [],
})

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.IND_NM = props.codeArray2.filter((x) => x.COD.includes('E'))
  })
}

//지표정의 값들
const defineIns = reactive({
  DEF: '', //지표정의
  DENOM: '', //분모
  DESCR: '', //지표설명
  NUMER: '', //분자
  TERM: '', //관련용어
})

const chartsOptions = reactive({
  legend: {
    bottom: 50,
  },
  grid: {
    top: '4%',
    width: '93%',
    left: '4%',
    bottom: '108',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  xAxis: {
    type: 'category',
    //boundaryGap: true,
    data: [], //x축
  },
  yAxis: {
    type: 'value',
    min: function(value) {
      return Math.floor(value.min)
    },
    max: function(value) {
      return Math.ceil(value.max)
    },
    // min: 0, // 최소값 고정
    // max: 100, // 최대값 고정
    axisLabel: {
      formatter: '{value} %', // <- 여기서 % 붙이기
    },
  },
  series: [
    //0
    {
      name: '이비인후계',
      data: [],
      type: 'line',
    },
    //1
    {
      name: '신경계',
      data: [],
      type: 'line',
    },
    //2
    {
      name: '진동',
      data: [],
      type: 'line',
    },
    //3
    {
      name: '피부계',
      data: [],
      type: 'line',
    },
  ],
})

const grdMainProps = reactive({
  fields: [],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  //마운트할때 바로 조회하면 렌더링 이슈가 있어서 0.5초딜레이 줌
  setTimeout(() => {
    btnSearch()
  }, 500)
})

const back = () => {
  emit('back')
}

//사업부 변경시 부서 조회
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    if (newValue) {
      commonSearchApi({
        queryId: 'searchDept3',
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
      }).then((res) => {
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.push({ DEPT_NM: '전체', DEPT_CD: '' })
      })
    } else {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = []
      codeList.DEPT_CD.push({ DEPT_NM: '전체', DEPT_CD: '' })
    }
  }
)

const initChartAndGrid = () => {
  chartsOptions.xAxis.data = [] //차트 X축 초기화
  for (let i = 0; i < chartsOptions.series.length; i++) {
    chartsOptions.series[i].data = [] //차트 Y측 초기화
  }
  grdMainProps.columns = [] //컬럼초기화
}

//컬럼 이름 정렬
const columnSort = (columnArray) => {
  return columnArray.sort((a, b) => {
    const isNumA = /^\d+$/.test(a)
    const isNumB = /^\d+$/.test(b)

    if (isNumA && !isNumB) {
      return 1
    }
    if (!isNumA && isNumB) {
      return -1
    }

    // 2️⃣ 같은 타입(둘 다 숫자 or 둘 다 한글)이면 문자열 비교
    if (!isNumA && !isNumB) {
      return a.localeCompare(b, 'ko') // 한글 정렬
    } else {
      return Number(a) - Number(b) // 숫자 정렬
    }
  })
}

const btnSearch = () => {
  if (searchParam.IND_NM !== 'E08') {
    emit('changePage', searchParam.IND_NM)
    return false
  }
  initChartAndGrid() //조회할때마다 차트랑 그리드 초기화
  commonSearchApi({
    queryId: 'HLTCB0010_SEARCH_25',
    param: searchParam,
  }).then(async (res) => {
    let columnName = columnSort(Object.keys(res.ORESULT_CUR[0]))
    let columnLayout = [
      {
        name: 'PCOLUMN',
        direction: 'horizontal',
        hideChildHeaders: true,
        items: [],
        header: {
          text: '구분',
        },
      },
    ]
    for (let i = 0; i < columnName.length; i++) {
      if (columnName[i] === 'CATEGORY') {
        grdMainProps.columns.push({
          fieldName: columnName[i],
          dataType: 'text',
          width: '50',
          editable: false,
          header: { text: t('구분') },
          mergeRule: { criteria: 'value' },
        })
        columnLayout[0].items.push(columnName[i])
      } else if (columnName[i] === 'GUBUN') {
        grdMainProps.columns.push({
          fieldName: columnName[i],
          dataType: 'text',
          width: '50',
          editable: false,
          header: { text: t('구분') },
        })
        columnLayout[0].items.push(columnName[i])
      } else {
        grdMainProps.columns.push({
          fieldName: columnName[i],
          dataType: 'text',
          width: '50',
          editable: false,
          header: { text: t(columnName[i]) },
        })
        columnLayout.push(columnName[i])
        chartsOptions.xAxis.data.push(columnName[i]) //차트 x축
      }
    }
    for (let i = 0; i < columnName.length; i++) {
      if (columnName[i] == 'GUBUN' || columnName[i] === 'CATEGORY') {
        continue
      } else {
        chartsOptions.series[0].data.push(res.ORESULT_CUR[0][columnName[i]]) //신경계
      }
    }
    for (let i = 0; i < columnName.length; i++) {
      if (columnName[i] === 'GUBUN' || columnName[i] === 'CATEGORY') {
        continue
      } else {
        chartsOptions.series[1].data.push(res.ORESULT_CUR[1][columnName[i]]) //이비인후계
      }
    }
    for (let i = 0; i < columnName.length; i++) {
      if (columnName[i] === 'GUBUN' || columnName[i] === 'CATEGORY') {
        continue
      } else {
        chartsOptions.series[2].data.push(res.ORESULT_CUR[2][columnName[i]]) //진동
      }
    }
    for (let i = 0; i < columnName.length; i++) {
      if (columnName[i] === 'GUBUN' || columnName[i] === 'CATEGORY') {
        continue
      } else {
        chartsOptions.series[3].data.push(res.ORESULT_CUR[3][columnName[i]]) //호흡계
      }
    }

    grdMain.value.getDataProvider().setFields(grdMainProps.columns)
    grdMain.value.getGridView().setColumns(grdMainProps.columns)
    grdMain.value.getGridView().setColumnLayout(columnLayout)
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
  commonSearchApi({
    queryId: 'HLTCA0021_SEARCH_01',
    param: {
      TAG1: searchParam.IND_CLS,
      TAG2: searchParam.IND_NM,
    },
  }).then((res) => {
    defineIns.NUMBER = res.ORESULT_CUR[0].NUMBER
    defineIns.DENOM = res.ORESULT_CUR[0].DENOM
    defineIns.DESCR = res.ORESULT_CUR[0].DESCR
    defineIns.DEF = res.ORESULT_CUR[0].DEF
    defineIns.TERM = res.ORESULT_CUR[0].TERM
  })
}

//지표분류 변경시 지표명 조회
watch(
  () => searchParam.IND_CLS,
  (newValue, oldValue) => {
    codeList.IND_NM = props.codeArray2.filter((x) => x.COD.includes(newValue))
    searchParam.IND_NM = newValue + '01'
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height" v-if="ifValue == 'E08'">
    <v-card-title class="pa-3 pb-0">
      <div>
        <span>보건지표조회</span>
      </div>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              width="250px"
              :label="$t('지표 분류')"
              label-width="70px"
              v-model="searchParam.IND_CLS"
              :items="props.codeArray1"
              item-title="TXT"
              item-value="COD"
            ></i-select>
            <i-select
              width="250px"
              :label="$t('지표명')"
              label-width="70px"
              v-model="searchParam.IND_NM"
              :items="codeList.IND_NM"
              item-title="TXT"
              item-value="COD"
            ></i-select>
            <i-select
              width="200px"
              :label="$t('사업부')"
              label-width="50px"
              v-model="searchParam.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
            ></i-select>
            <i-select
              width="200px"
              :label="$t('부서')"
              label-width="50px"
              v-model="searchParam.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            ></i-select>
            <i-select width="150px" type="YEAR" :label="$t('연도')" v-model="searchParam.YEAR_FROM"></i-select>
            <span class="mt-2">~</span>
            <i-select width="130px" type="YEAR" v-model="searchParam.YEAR_TO" class="ml-2"></i-select>
            <v-btn @click="btnSearch">조회</v-btn>
            <v-btn @click="back">돌아가기</v-btn>
          </div>
        </v-sheet>
        <v-card-text class="content-area">
          <v-sheet class="pa-0 h-auto">
            <div>
              <v-sheet width="100%" class="pa-0 h-auto">
                <div>
                  <Echart :option="chartsOptions" ref="echart" class="main_echarts_style" autoresize></Echart>
                </div>
              </v-sheet>
            </div>
            <div style="text-align: end">[단위:%]</div>
            <div>
              <v-sheet class="pa-0 h-auto">
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  style="height: 400px"
                >
                </RealGrid>
              </v-sheet>
            </div>
            <div>산출식</div>
            <div>
              <i-input v-model="defineIns.NUMER" :label="$t('분자')" width="200px" readonly></i-input>
              <i-input v-model="defineIns.DENOM" :label="$t('분모')" width="200px" readonly></i-input>
            </div>
            <div>
              <i-textarea v-model="defineIns.DEF" :label="$t('지표정의')" readonly></i-textarea>
            </div>
            <div>
              <i-textarea v-model="defineIns.DESCR" :label="$t('지표설명')" readonly></i-textarea>
            </div>
            <div>
              <i-textarea v-model="defineIns.TERM" :label="$t('관련용어')" readonly></i-textarea>
            </div>
          </v-sheet>
        </v-card-text>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  overflow-y: auto;
  height: calc(100vh - 140px);
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

//안전수칙 위반건수 class
.main_echarts_style {
  height: 35vh;
  width: 100%;
}
</style>
