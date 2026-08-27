<script setup>
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { ref, reactive, onMounted, onDeactivated, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import { useRoute , useRouter } from "vue-router"
import SRMAA0010Popup01 from '@/pages/40_safety-risk/SRM_A/Popup/SRMAA0010Popup01.vue'

// Echart
import Echart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { use } from 'echarts/core'
import { LineChart , BarChart } from 'echarts/charts'  
import { TooltipComponent , LegendComponent, GridComponent, ToolboxComponent } from 'echarts/components'
import { commonSearchApi, commonRequest2, commonRequest3 } from "@/@hiway/api/commonApi"

defineOptions({
  name: "40_safety-risk-SRM_A-SRMAA0010",
})

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()  //유저정보
const t = useI18n().t //다국어
const imgSlideData = ref([])
const imgSlide = ref(null)
const imageSrc = ref(null)
const fileInterval = ref(null)
const refImgSlide = ref(null)
// 차트
const chart1 = ref(null)
const chartRefresh01 = ref(0)

// 그리드
const grdMain = ref(null)

const refGridTitleSlide = ref(null)

const grdProps1 = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: false },
    rowIndicator: { visible: false },
  }, 
  fields: [
    { fieldName: "DEPT_NM", dataType: "text", width: '60',  header: { text: t("부서") } },
    { fieldName: "RISK_NM", dataType: "text", styleName: 'left-column',  header: { text: t("내용") } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'TASK_SEQ', dataType: 'text', visible: false },
  ],
  columns: [],
})
grdProps1.columns = grdProps1.fields

// 조회조건
const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  STR_DT: dayjs().format("YYYY-01-01"),
  END_DT: dayjs().format("YYYY-MM-DD")
})

// 출력 데이터
const resultData = reactive({
  // 개선 현황(건)
  TOTAL_CNT: '',
  NOT_RECEIVED_CNT: '',
  IMP_REVIEW_CNT: '',
  BEING_IMP_CNT: '',
  IMP_COMPLETE_CNT: '',
  // 개선 현황(율)
  NOT_RECEIVED_PERCENT: '',
  IMP_REVIEW_PERCENT: '',
  BEING_IMP_PERCENT: '',
  IMP_COMPLETE_PERCENT: '',
  
  IMP_COMPLETE: {}, // 전사 개선완료 사례
  GRADE: [], // 위험등급
  TOP5: []
})

// Chart(위험분류별 위험성평가 현황)
const chartsOptions1 = ref({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {},
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        rotate: 25,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
    },
    series: []
  },
)

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    searchData()
    Message.success(t('조회 되었습니다.'))
  }
}

// 전사 횡전개 가능 개선 그리드 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  const rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  router.push({
    path: '/40_safety-risk/SRM_A/SRMAA0030', 
    state: { data: rowData}
  })
}

// 리스크 접수 및 개선 현황
const searchRiskCnt = () => {
  const data = { 
    queryId: "SRMAA0010_SEARCH_01", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    resultData.TOTAL_CNT = res.ORESULT_CUR[0].TOTAL_CNT
    resultData.NOT_RECEIVED_CNT = res.ORESULT_CUR[0].NOT_RECEIVED_CNT
    resultData.IMP_REVIEW_CNT = res.ORESULT_CUR[0].IMP_REVIEW_CNT
    resultData.BEING_IMP_CNT = res.ORESULT_CUR[0].BEING_IMP_CNT
    resultData.IMP_COMPLETE_CNT = res.ORESULT_CUR[0].IMP_COMPLETE_CNT
    resultData.NOT_RECEIVED_PERCENT = res.ORESULT_CUR[0].NOT_RECEIVED_PERCENT
    resultData.IMP_REVIEW_PERCENT = res.ORESULT_CUR[0].IMP_REVIEW_PERCENT
    resultData.BEING_IMP_PERCENT = res.ORESULT_CUR[0].BEING_IMP_PERCENT
    resultData.IMP_COMPLETE_PERCENT = res.ORESULT_CUR[0].IMP_COMPLETE_PERCENT
  })
}

// 위험등급 카운트
const searchGrade = async () => {
  resultData.GRADE = []

  const data = { 
    queryId: "SRMAA0010_SEARCH_02", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    resultData.GRADE = res.ORESULT_CUR
  })
}

// 차트 데이터
const searchChart = async val => {
  searchParams.BSNS_CD = val

  const data = { 
    queryId: "SRMAA0010_SEARCH_03", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    let chartTitle = []
    let chartData = []

    let result_1 = { data: [], type: 'bar', stack: 'a', name: '개선완료', itemStyle: { color: '#0D47A1' } }
    let result_2 = { data: [], type: 'bar', stack: 'a', name: '개선중', itemStyle: { color: '#1976D2' } }
    let result_3 = { data: [], type: 'bar', stack: 'a', name: '개선검토', itemStyle: { color: '#311B92' } }

    if (res.ORESULT_CUR.length > 18) {
      chartsOptions1.value.dataZoom = [{
        type: 'slider',
        xAxisIndex: 0,
        start: 0,
        end: 50
      }]
    } else {
      chartsOptions1.value.dataZoom = [{
        type: 'slider',
        xAxisIndex: 0,
        start: 0,
        end: 100
      }]
    } 

    res.ORESULT_CUR.forEach((item, index) => {
      if (['AC00', 'AQ00', 'AE00', 'AK00'].includes(item.BSNS_CD)) {
        if (item.PRNT_CD === null) {
          item.PRNT_NM = '기타(' + item.BSNS_NM + ')' 
        }

        result_1.data.push(item.RESULT_1)
        result_2.data.push(item.RESULT_2)
        result_3.data.push(item.RESULT_3)

        // 차트 항목명
        chartTitle.push(item.PRNT_NM)
      }
    })

    chartData.push(result_1)
    chartData.push(result_2)
    chartData.push(result_3)

    chartsOptions1.value.xAxis.data = chartTitle
    chartsOptions1.value.series = chartData
  })
}

// 우수 개선 조직 5위
const searchTop5 = async val => {
  resultData.TOP5 = []

  searchParams.TYPE = val ? val : 'COUNT'

  const data = { 
    queryId: "SRMAA0010_SEARCH_04", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    resultData.TOP5 = [
      { DEPT_NM: '', COUNT: '' },
      { DEPT_NM: '', COUNT: '' },
      { DEPT_NM: '', COUNT: '' },
      { DEPT_NM: '', COUNT: '' },
      { DEPT_NM: '', COUNT: '' },
    ]

    if (res.ORESULT_CUR.length !== 0) {
      for (let i in res.ORESULT_CUR) {
        resultData.TOP5[i] = res.ORESULT_CUR[i]  
      }
    }
  })
}

const updateData = (data, idx) => {
  if (idx >= data.length) {
    return
  }

  let fileInfo = {
    CMPNY_DIV: data[idx].CMPNY_DIV,
    FILE_ID: data[idx].THUMBNAIL_FILE_ID
  }

  fileSearch(fileInfo)
  
  // console.log('idx', idx)
  // console.log('data', data)

  resultData.IMP_COMPLETE.DEPT_NM = data[idx].DEPT_NM
  resultData.IMP_COMPLETE.RISK_NM = data[idx].RISK_NM
}

// 전사 개선완료 사례
const searchImpComplete = async () => {
  clearInterval(fileInterval.value)
  resultData.IMP_COMPLETE = {}

  const data = { 
    queryId: "SRMAA0010_SEARCH_05", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    let currentIndex = 0  // 최초
    const data = res.ORESULT_CUR

    if (!data || data.length === 0) {
      return
    }

    updateData(data, currentIndex)

    // 10초마다 인덱스를 1씩 증가시키면서 데이터를 업데이트
    fileInterval.value = setInterval(() => {
      console.log('aaa')
      currentIndex++
      if (currentIndex >= data.length) {
        currentIndex = 0
      }
      updateData(data, currentIndex)
    }, 10000)
  })
}

// 파일 조회 및 다운로드
const fileSearch = async val => {
  const data = {
    queryId: "searchFile",
    param: val
  }

  const meta = {
    useProgress: false
  }

  return commonRequest3("/hse/common/selectList", data, meta).then(async res => {
    if(res.ORESULT_CUR.length > 0) {
      let type = res.ORESULT_CUR[0].FILE_TYPE.toUpperCase()

      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        await fileDownLoad(res.ORESULT_CUR[0])
      }
    }
  })
}

const fileDownLoad = val => {
  let contentDisposition = null
  let fileName = null
  let blob = null
  let imageURL = null
  let img = new Image() // 이미지 요소 생성

  commonRequest2('/hse/file/downloadFiles', val).then(res => {
    contentDisposition = res.contentDisposition
    fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

    blob = new Blob([res])
    imageURL = URL.createObjectURL(blob)

    img = new Image() // 이미지 요소 생성

    img.src = imageURL // 이미지 URL 설정
    img.alt = fileName

    imageSrc.value = URL.createObjectURL(blob)
  })
}

// 전사 횡전개 가능 개선
const searchImpPossible = async () => {
  const data = { 
    queryId: "SRMAA0010_SEARCH_06", 
    param: searchParams 
  }

  const meta = { useProgress: false }

  return commonRequest3("/hse/common/selectList", data, meta).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const searchImgSlide = async () => {
  await commonSearchApi({ queryId: 'SRMAA0010_SEARCH_07', param: {} }).then(res => {
    imgSlideData.value = res.ORESULT_CUR
    imgSlide.value = imgSlideData.value.length > 0 ? 0 : null
  })
}

// 대쉬보드 조회
const searchData = async () => {
  await searchRiskCnt()
  await searchGrade()
  await searchChart('')
  await searchTop5('COUNT')
  await searchImpComplete()
  await searchImpPossible()
  await searchImgSlide()
}

const onSlideButtonsClick = btn => {
  if(btn.id === 'btnUpdate') {
    refImgSlide.value.openPopup()
  }
}

const closeSlideMng = e => {
  // console.log('closeSlideMng e', e)

  if(e) {
    searchImgSlide()
  }
}

onMounted(() => {
  nextTick(() => {
    refGridTitleSlide.value.setBtnProperty('btnUpdate', 'text', '관리')
  })

  searchData()
})

onDeactivated(() => {
  // console.log('exit')
  clearInterval(fileInterval.value)
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"  
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <v-sheet class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-input
            v-model="searchParams.STR_DT"
            :label="$t('조회기간')" 
            width="200px"
            type="date" 
            margin="10px"
          /> 
          <i-input 
            v-model="searchParams.END_DT"
            :label="$t('~')" 
            label-width="10px"
            width="165px"
            type="date"
          />
          </div>
        </v-sheet>
        <v-sheet class="d-flex h-grow">
          <!-- Left -->
          <v-sheet width="60%" class="pa-3 pt-0 h-100">
            <IGridTitle
              :title="$t('전사 리스크 개선 현황')"
            >
              <template #editors />
            </IGridTitle>
            <!-- 리스크 개선수/비율 -->
            <v-sheet class="d-flex">
              <v-sheet width="20%" border="grey-lighten-2 sm">
                <v-sheet class="align-center pa-2">
                  <span>총 건수</span>
                </v-sheet>
                <v-sheet class="align-center pa-3">
                  <p>
                    <span class="text-h4 text-center">{{ resultData.TOTAL_CNT }}</span> 건
                  </p>
                </v-sheet>
              </v-sheet>
              <v-sheet width="20%" border="grey-lighten-2 sm">
                <v-sheet class="align-center pa-2">
                  <span>미접수</span>
                </v-sheet>
                <v-sheet class="align-center pa-3">
                  <p>
                    <span class="text-h4 text-center">
                      {{ resultData.NOT_RECEIVED_CNT }}
                    </span> 건
                    <br/><span class="font-weight-bold text-center">({{ resultData.NOT_RECEIVED_PERCENT }}%)</span>
                  </p>
                </v-sheet>
              </v-sheet>
              <v-sheet width="20%" border="grey-lighten-2 sm">
                <v-sheet class="align-center pa-2">
                  <span>개선검토</span>
                </v-sheet>
                <v-sheet class="align-center pa-3">
                  <p>
                    <span class="text-h4 text-center">
                      {{ resultData.IMP_REVIEW_CNT }}
                    </span> 건
                    <br/><span class="font-weight-bold text-center">({{ resultData.IMP_REVIEW_PERCENT }}%)</span>
                  </p>
                </v-sheet>
              </v-sheet>
              <v-sheet width="20%" border="grey-lighten-2 sm">
                <v-sheet class="align-center pa-2">
                  <span>개선중</span>
                </v-sheet>
                <v-sheet class="align-center pa-3">
                  <p>
                    <span class="text-h4 text-center">
                      {{ resultData.BEING_IMP_CNT }}
                    </span> 건
                    <br/><span class="font-weight-bold text-center">({{ resultData.BEING_IMP_PERCENT }}%)</span>
                  </p>
                </v-sheet>
              </v-sheet>
              <v-sheet width="20%" border="grey-lighten-2 sm">
                <v-sheet class="align-center pa-2">
                  <span>개선완료</span>
                </v-sheet>
                <v-sheet class="align-center pa-3">
                  <p>
                    <span class="text-h4 text-center">
                      {{ resultData.IMP_COMPLETE_CNT }}
                    </span> 건
                    <br/><span class="font-weight-bold text-center">({{ resultData.IMP_COMPLETE_PERCENT }}%)</span>
                  </p>
                </v-sheet>
              </v-sheet>
            </v-sheet>
            <!-- 위험등급 -->
            <v-sheet class="mt-3 d-flex searchArea">
              <v-sheet width="33%" class="d-flex justify-center">
                <v-sheet class="justify-center pa-2">
                  <span>고위험</span>
                </v-sheet>
                <v-sheet class="align-center pa-2">
                  <p><span class="text-h5">{{ resultData.GRADE[0] ? resultData.GRADE[0].COUNT : '' }}</span> 건</p>
                </v-sheet>
              </v-sheet>
              <v-sheet width="34%" class="d-flex justify-center">
                <v-sheet class="justify-center pa-2">
                  <span>중위험</span>
                </v-sheet>
                <v-sheet class="align-center pa-2">
                  <p><span class="text-h5">{{ resultData.GRADE[1] ? resultData.GRADE[1].COUNT : '' }}</span> 건</p>
                </v-sheet>
              </v-sheet>
              <v-sheet width="33%" class="d-flex justify-center">
                <v-sheet class="justify-center pa-2">
                  <span>약위험</span>
                </v-sheet>
                <v-sheet class="align-center pa-2">
                  <p><span class="text-h5">{{ resultData.GRADE[2] ? resultData.GRADE[2].COUNT : '' }}</span> 건</p>
                </v-sheet>
              </v-sheet>
            </v-sheet>
            <!-- 사업부별 개선 현황 -->
            <v-sheet class="mt-2 d-flex" style="height: 385px;">
              <!-- 차트 --> 
              <v-sheet width="60%" class="h-grow"> 
                <v-sheet class="d-flex searchArea pa-0" width="100%" height="20%">
                  <v-sheet class="pa-1 justify-center cursor-pointer onButton" width="20%" height="100%" @click="searchChart('')"> 
                    <span class="text-subtitle-1 text-center">전사(사업부)</span>
                  </v-sheet>
                  <v-sheet class="pa-1 justify-center cursor-pointer onButton" width="20%" @click="searchChart('AC00')">
                    <span class="text-subtitle-1 text-center">조선</span>
                  </v-sheet>
                  <v-sheet class="pa-1 justify-center cursor-pointer onButton" width="20%" @click="searchChart('AQ00')">
                    <span class="text-subtitle-1 text-center">해양에너지</span>
                  </v-sheet>
                  <v-sheet class="pa-1 justify-center cursor-pointer onButton" width="20%" @click="searchChart('AE00')">
                    <span class="text-subtitle-1 text-center">특수선</span>
                  </v-sheet>
                  <v-sheet class="pa-1 justify-center cursor-pointer onButton" width="20%" @click="searchChart('AK00')">
                    <span class="text-subtitle-1 text-center">엔진기계</span>
                  </v-sheet>
                </v-sheet>
                <v-sheet :key="chartRefresh01" width="100%" height="80%">
                  <div>
                    <Echart
                      ref="chart1" 
                      :option="chartsOptions1" 
                      class="pa-0 border rounded-sm echarts_style"
                    />
                  </div>
                </v-sheet>
              </v-sheet>
              <v-sheet width="40%" height="392px" class="pl-3">
                <v-sheet class="pa-1 border-sm">
                  <span class="text-center">우수 개선 조직 5위</span> 
                </v-sheet>
                <v-sheet 
                  class="d-flex pa-0 justify-space-around mb-4" 
                  width="100%"
                >
                  <v-sheet class="pa-1 border-sm cursor-pointer onButton" width="50%" height="32px" @click="searchTop5('COUNT')">
                    <span class="text-center" style="align-content: center;">건수</span>
                  </v-sheet>
                  <v-sheet class="pa-1 border-sm cursor-pointer onButton" width="50%" height="32px" @click="searchTop5('PERCENT')">
                    <span class="text-center">개선율</span> 
                  </v-sheet>
                </v-sheet> 
                <v-sheet class="d-flex" height="100%" v-for="(item, index) in resultData.TOP5" :key="index">
                  <v-sheet width="10%" class="border-sm justify-center">
                    <span class="text-h6 text-center">{{ index + 1 }}</span> 
                  </v-sheet>
                  <v-sheet width="70%" class="border-sm justify-center">
                    <span class="text-h6 text-center">{{ item.DEPT_NM }}</span> 
                  </v-sheet>
                  <v-sheet width="20%" class="border-sm justify-center">
                    <span class="text-h6 text-center">
                      {{ item.RESULT ? item.RESULT : '' }}{{ item.RESULT > 0 ? searchParams.TYPE === 'COUNT' ? '건' : '%' : '' }}
                    </span> 
                  </v-sheet>
                </v-sheet>
              </v-sheet>
            </v-sheet>
          </v-sheet>
          <!-- Right -->
          <v-sheet width="40%" class="pa-3 pt-0 h-100">
            <IGridTitle
              ref="refGridTitleSlide"
              :title="$t('전사 개선완료 사례')"
              :button-list="['btnUpdate']"
              @click-button="onSlideButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <div class="border-sm" style="height: 334px;">
              <v-carousel
                v-model="imgSlide"
                height="100%"
                show-arrows="hover"
                cycle
                hide-delimiters
                interval="7000"
              >
                <v-carousel-item
                  v-for="(slide, i) in imgSlideData"
                  :key="i"
                >
                  <div style="height: calc(100% - 32px); padding: 6px;">
                    <img
                      width="100%"
                      height="100%"
                      :src="slide.FILE_URL"
                      style="object-fit: contain;"
                    />
                  </div>
                  <div
                    class="d-flex align-center"
                    style="color: rgb(96, 128, 255); font-size: 18px; height: 32px; padding: 0 8px;"
                  >
                    {{ `[${slide.DEPT_NM}]${slide.RISK_NM}` }}
                  </div>
                </v-carousel-item>
              </v-carousel>
              <!-- <v-sheet>
                <v-img 
                  :src="imageSrc"
                  width="400"
                  height="280"
                  class="align-self-center"
                  aspect-ratio
                />
              </v-sheet>
              <v-sheet class="d-flex">
                <v-sheet width="100%" class="pa-4">
                  <span class="text-subtitle-1 text-blue-darken-4">[{{ resultData.IMP_COMPLETE.DEPT_NM }}] {{ resultData.IMP_COMPLETE.RISK_NM }}</span> 
                </v-sheet>
              </v-sheet>  -->
            </div>
            <IGridTitle
              :title="$t('전사 횡전개 가능 개선')"
              class="mt-2"
            >
              <template #editors />
            </IGridTitle>
            <v-sheet height="240px">
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys" 
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                :column-layout="grdProps1.columnLayout"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
          </v-sheet>
        </v-sheet>
      </v-sheet>
    </v-card-text>

    <SRMAA0010Popup01 ref="refImgSlide" @close="closeSlideMng" />
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
    min-height: 700px;
  }
}

div.v-card-title {
  text-align: center;
}
.echarts_style {
  height: 325px;
  width: 100%;
}
.onButton:hover {
  background-color: #0D47A1;
  transition: background-color 0.5s;
  border-radius: 2px;
}

.onButton:hover span {
  color: #FFFFFF; /* hover 상태에서 span의 글자색 변경 */
}

</style>

