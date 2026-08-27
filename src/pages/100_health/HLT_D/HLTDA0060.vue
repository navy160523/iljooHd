<!-- 
  화면명 : 화학물질관리시스템운영현황
  화면개요 : 화학물질관리시스템운영현황
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Echart from 'vue-echarts'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import HLTDA0060Popup01 from '@/pages/100_health/HLT_D/HLTDA0060Popup01.vue'
import HLTDA0060Popup02 from '@/pages/100_health/HLT_D/HLTDA0060Popup02.vue'
import HLTDA0060Popup03 from '@/pages/100_health/HLT_D/HLTDA0060Popup03.vue'
import HLTDA0060Popup04 from '@/pages/100_health/HLT_D/HLTDA0060Popup04.vue'

defineOptions({
  name:'100_health-HLT_D-HLTDA0060', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
 
const isAdmin = ref(false)
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)
const grd3 = ref(null)
const grd4 = ref(null)
const chart1 = ref(null)
const chart2 = ref(null)

const hltda0060Popup01 = ref(null)
const hltda0060Popup02 = ref(null)
const hltda0060Popup03 = ref(null)
const hltda0060Popup04 = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  TMP_DATE_FROM: dayjs().subtract(1,'year').format('YYYY-MM-DD'),
  TMP_DATE_TO: dayjs().format('YYYY-MM-DD'),
  DATE_FROM: '',
  DATE_TO: ''
})


// Chart(측정인자 분류별 현황)
const chartsOptions1 = ref({
  tooltip: {
      trigger: 'axis'
  },
  legend: {
      data: []
  },
  grid: {
    left: '15%',
    right: '6%', 
    bottom: '8%',
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
  yAxis: {
      type: 'value',
      name: '건수',
  },
  series: []
  },
)

// Chart(측정인자 분류별 현황)
const chartsOptions2 = ref({
  tooltip: {
      trigger: 'axis'
  },
  legend: {
      data: []
  },
  grid: {
    left: '15%',
    right: '6%', 
    bottom: '8%',
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
  yAxis: {
      type: 'value',
      name: '건수',
  },
  series: []
  },
)

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || userStore.authGrpCd.includes('GRP00372')) isAdmin.value = true
  
  onButtonsClick({ id: 'btnSearch' })
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }},
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', width: '80', dataType: 'text', editable: false, header: { text: t('청구부서') } },
    { fieldName: 'CNT', width: '50', dataType: 'number', numberFormat: '#,###', header: { text: t('전체 건수') } },
    { fieldName: 'CONFIRM', width: '50', dataType: 'text', header: { text: t('대상') } },
    { fieldName: 'NO_CONFIRM', width: '50', dataType: 'text', header: { text: t('비대상') } },
    // { fieldName: 'PROCESS_NM', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('공정명') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

//그리드 속성셋팅
const grd2Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }},
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', width: '80', dataType: 'text', editable: false, header: { text: t('구매부서') } },
    { fieldName: 'CNT', width: '50', dataType: 'number', numberFormat: '#,###', header: { text: t('전체 건수') } },
    { fieldName: 'CONFIRM', width: '50', dataType: 'text', header: { text: t('승인') } },
    { fieldName: 'NO_CONFIRM', width: '50', dataType: 'text', header: { text: t('불승인') } },
    // { fieldName: 'PROCESS_NM', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('공정명') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

//그리드 속성셋팅
const grd3Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }},
  keys : [],
  fields : [ 
    { fieldName: 'OCUR_DATE', width: '50', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('발생일자') } },
    { fieldName: 'DIVISION', width: '50', dataType: 'text', header: { text: t('분류') } },
    { fieldName: 'MATDSC', width: '80', dataType: 'text', styleName: 'left-column', header: { text: t('품명') } },
    { fieldName: 'RESTRICT', width: '50', dataType: 'text', header: { text: t('규제물질') } },
    { fieldName: 'RELEVANT_BASIS', width: '100', dataType: 'text', styleName: 'left-column', header: { text: t('관련근거') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

//그리드 속성셋팅
const grd4Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }},
  keys : [],
  fields : [ 
    { fieldName: 'MSDS_NO', width: '80', dataType: 'text', header: { text: t('MSDS 번호') } },
    { fieldName: 'MSDS_DATE', width: '50', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('MSDS 제출일자') } },
    { fieldName: 'REAL_PRODUCT_NM', width: '50', dataType: 'text', header: { text: t('실제 상품명') } },
    { fieldName: 'EXPENSE', width: '50', dataType: 'text', header: { text: t('용도') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields
grd2Props.columns = grd2Props.fields
grd3Props.columns = grd3Props.fields
grd4Props.columns = grd4Props.fields

//그리드 데이터 입력

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  }
}

const onButtonsClickIdentify = btn => {
  hltda0060Popup01.value.openPopup()
}

const onButtonsClickOperation = btn => {
  hltda0060Popup03.value.openPopup()
}

const onButtonsClickEval = btn => {
  hltda0060Popup02.value.openPopup()
}

const onButtonsClickMSDS = btn => {
  hltda0060Popup04.value.openPopup()
}

// 그리드 데이터 조회
const getData = () => {  
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  searchParams.DATE_FROM = dayjs(searchParams.TMP_DATE_FROM).format('YYYYMMDD')
  searchParams.DATE_TO = dayjs(searchParams.TMP_DATE_TO).format('YYYYMMDD')
  // return commonSearchApi({ queryId: 'HLTDA0060_SEARCH_02', param: searchParams })

  return Promise.all([
    // 화학물질 식별 조회
    commonSearchApi({ queryId: 'HLTDA0060_SEARCH_01', param: searchParams }),
    // 화학물질 유해성 평가 조회
    commonSearchApi({ queryId: 'HLTDA0060_SEARCH_02', param: searchParams }),
    // 화학물질 관리시스템 운영 이슈 조치
    commonSearchApi({ queryId: 'HLTDA0060_SEARCH_03', param: searchParams }),
    // 수입 화학물질 MSDS 제출 현황 조치
    commonSearchApi({ queryId: 'HLTDA0060_SEARCH_04', param: searchParams }),
  ])
}

// 조회 후
const afterSearch = (res) => {
  let chartData1 = {
    whole: {
      value: 0,
      itemStyle: { color: '#2EC7C9'}
    }, // 전체
    confirm: {
      value: 0,
      itemStyle: { color: '#B6A2DE'}
    }, // 대상
    noConfirm: {
      value: 0,
      itemStyle: { color: '#5AB1EF'}
    }, // 비대상
  }

  let chartData2 = {
    whole: {
      value: 0,
      itemStyle: { color: '#2EC7C9'}
    }, // 전체
    confirm: {
      value: 0,
      itemStyle: { color: '#B6A2DE'}
    }, // 승인
    noConfirm: {
      value: 0,
      itemStyle: { color: '#5AB1EF'}
    }, // 미승인
  }
  
  grd1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  grd2.value.getDataProvider().setRows(res[1].ORESULT_CUR)
  grd3.value.getDataProvider().setRows(res[2].ORESULT_CUR)
  grd4.value.getDataProvider().setRows(res[3].ORESULT_CUR)

  chartsOptions1.value.xAxis.data = ['전체', '대상', '비대상']
  chartData1.whole.value = res[0].ORESULT_CUR.reduce((sum, obj) => sum + (obj['CNT'] || 0), 0)
  chartData1.confirm.value = res[0].ORESULT_CUR.filter(item => item.CONFIRM == 'O').reduce((sum, obj) => sum + (obj['CNT'] || 0), 0)
  chartData1.noConfirm.value = res[0].ORESULT_CUR.filter(item => item.NO_CONFIRM == 'O').reduce((sum, obj) => sum + (obj['CNT'] || 0), 0)
  chartsOptions1.value.series = { data: [ chartData1.whole, chartData1.confirm, chartData1.noConfirm], type: 'bar', name: '건수', barWidth:'50%', label: { show: true, position: 'top' }, tooltip: {valueFormatter: function (value) { return value + ' 건' }}, itemStyle: { color: "#0581FD" } }

  chartsOptions2.value.xAxis.data = ['전체', '승인', '미승인']
  chartData2.whole.value = res[1].ORESULT_CUR.reduce((sum, obj) => sum + (obj['CNT'] || 0), 0)
  chartData2.confirm.value = res[1].ORESULT_CUR.filter(item => item.CONFIRM == 'O').reduce((sum, obj) => sum + (obj['CNT'] || 0), 0)
  chartData2.noConfirm.value = res[1].ORESULT_CUR.filter(item => item.NO_CONFIRM == 'O').reduce((sum, obj) => sum + (obj['CNT'] || 0), 0)
  chartsOptions2.value.series = { data: [ chartData2.whole, chartData2.confirm, chartData2.noConfirm], type: 'bar', name: '건수', barWidth:'50%', label: { show: true, position: 'top' }, tooltip: {valueFormatter: function (value) { return value + ' 건' }}, itemStyle: { color: "#0581FD" } }
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="false"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.TMP_DATE_FROM"
            label-width="50px"
            :label="$t('기간')"
            type="date"
            width="200px"
            class="mr-2"
          />
          <i-input
            v-model="searchParams.TMP_DATE_TO"
            label-width="20px"
            :label="$t('~')"
            type="date"
            width="180px"
          />
        </v-sheet>
        <v-sheet height="45%">
          <div class="d-flex fill-height">
            <v-sheet class="h-auto" width="50%">
              <IGridTitle
                :title="$t('화학물질 식별')"
                :button-list="['btnDetail']"
                @click-button="onButtonsClickIdentify"
              />
              <div class="d-flex fill-height">
                <v-sheet width="35%">
                  <Echart
                    ref="chart1" 
                    :option="chartsOptions1"
                    class="pa-0 border rounded-sm echarts_style fill-height"
                  />
                </v-sheet>
                <v-sheet class="ml-2" width="65%">
                  <RealGrid
                    ref="grd1"
                    :grid-view-option="grd1Props.gridViewOption"
                    :keys="grd1Props.keys" 
                    :fields="grd1Props.fields"
                    :columns="grd1Props.columns"
                    :column-layout="grd1Props.columnLayout"
                  />
                </v-sheet>
              </div>
            </v-sheet>
            <v-sheet class="h-auto ml-2" width="50%">
              <IGridTitle
                :title="$t('화학물질 관리시스템 운영이슈')"
                :button-list="['btnDetail']"
                @click-button="onButtonsClickOperation"
              />
              <RealGrid
                ref="grd3"
                :grid-view-option="grd3Props.gridViewOption"
                :keys="grd3Props.keys" 
                :fields="grd3Props.fields"
                :columns="grd3Props.columns"
                :column-layout="grd3Props.columnLayout"
              />
            </v-sheet>
          </div>
          
        </v-sheet>
        <v-sheet class="mt-2" height="45%">
          <div class="d-flex fill-height">
            <v-sheet class="h-auto" width="50%">
              <IGridTitle
                :title="$t('화학물질 유해성 평가')"
                :button-list="['btnDetail']"
                @click-button="onButtonsClickEval"
              />
              <div class="d-flex fill-height">
                <v-sheet width="35%">
                  <Echart
                    ref="chart2" 
                    :option="chartsOptions2" 
                    class="pa-0 border rounded-sm echarts_style fill-height"
                  />
                </v-sheet>
                <v-sheet class="ml-2" width="65%">
                  <RealGrid
                    ref="grd2"
                    :grid-view-option="grd2Props.gridViewOption"
                    :keys="grd2Props.keys" 
                    :fields="grd2Props.fields"
                    :columns="grd2Props.columns"
                    :column-layout="grd2Props.columnLayout"
                  />
                </v-sheet>
              </div>
            </v-sheet>
            <v-sheet class="h-auto ml-2" width="50%">
              <IGridTitle
                :title="$t('수입 화학물질 MSDS 제출 현황')"
                :button-list="['btnDetail']"
                @click-button="onButtonsClickMSDS"
              />
              <RealGrid
                ref="grd4"
                :grid-view-option="grd4Props.gridViewOption"
                :keys="grd4Props.keys" 
                :fields="grd4Props.fields"
                :columns="grd4Props.columns"
                :column-layout="grd4Props.columnLayout"
              />
            </v-sheet>
          </div>
        </v-sheet>
      </div>
      <!-- 팝업 -->
      <HLTDA0060Popup01 ref="hltda0060Popup01" />
      <HLTDA0060Popup02 ref="hltda0060Popup02" />
      <HLTDA0060Popup03 ref="hltda0060Popup03" />
      <HLTDA0060Popup04 ref="hltda0060Popup04" />
    </v-card-text>
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
</style>