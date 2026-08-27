<!--
  화면명 : 보건위험성 평가 작업환경측정 결과 조회
  화면개요 : 보건위험성 평가 작업환경측정 결과 조회
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  OVER: 'N',
  PRC_CNT: '',
  CNT: '',
  OVER_CNT: '',
  OVER_RATE: '',
})
 
const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  ASGN_CD: [],
  UNIT: [],
  CLASSIFI: [],
  PROCESS_CD: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'BSNS_NM', width: '50', dataType: 'text', header: { text: t('사업부') }, },
    { fieldName: 'DEPT_NM', width: '50', dataType: 'text', header: { text: t('부서') }, },
    { fieldName: 'ASGN_NM', width: '50', dataType: 'text', header: { text: t('협력사명') }, },
    { fieldName: 'PROCESS_CD', width: '50', dataType: 'text', header: { text: t('공정') }, lookupDisplay: true},
    { fieldName: 'HARM_NM', width: '60', dataType: 'text', header: { text: t('유해인자') }, },
    { fieldName: 'WORKER_NM', width: '40', dataType: 'text', header: { text: t('근로자명') }, },
    { fieldName: 'WORK_CONT', width: '80', dataType: 'text', header: { text: t('작업내용') }, },
    { fieldName: 'MEAS_LOCATION', width: '80', dataType: 'text', header: { text: t('측정장소') }, },
    { fieldName: 'MEAS_VALUE', width: '40', dataType: 'text', header: { text: t('측정치') }, },
    { fieldName: 'EXPO_CRIT', width: '40', dataType: 'text', header: { text: t('노출기준') }, },
    { fieldName: 'UNIT', width: '40', dataType: 'text', header: { text: t('노출단위') },lookupDisplay: true },
    { fieldName: 'MEAS_EVAL', width: '40', dataType: 'text', header: { text: t('평가') }, },
    { fieldName: 'CLASSIFI', width: '40', dataType: 'text', header: { text: t('분류') }, lookupDisplay: true, },
    
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (params) => {
  
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.ASGN_CD = params.ASGN_CD
  searchParams.YEAR = params.YEAR
  Promise.all([
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    // 협력사
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_ASGN', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '', ORGN_DIV: '', USE_DIV: 'Y'} }),
    // 단위
    getCodeList('HHII802'),
    // 분류
    getCodeList('HHII803'),
    // 공정코드
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_09', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR } }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'A')
    codeList.ASGN_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'B')
    codeList.UNIT = res[2].ORESULT_CUR
    codeList.CLASSIFI = res[3].ORESULT_CUR
    codeList.PROCESS_CD = res[4].ORESULT_CUR

    grdMain.value.setBindingColumn('UNIT', codeList.UNIT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CLASSIFI', codeList.CLASSIFI, 'COD', 'TXT')
    grdMain.value.setBindingColumn('PROCESS_CD', codeList.PROCESS_CD, 'COD', 'TXT')
    onButtonsClick({ id: 'btnSearch' })
  })
  dialog.value = true
}

const closePopup = () => {
  grdMain.value.getDataProvider().setRows([])

  searchParams.OVER = 'N'
  searchParams.CNT = ''
  searchParams.OVER_CNT = ''
  searchParams.OVER_RATE = ''
  searchParams.PRC_CNT = ''

  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getData()
  }
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0010_SEARCH_09', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR2.length >= 1) {
    searchParams.CNT = res.ORESULT_CUR2[0].CNT
    searchParams.OVER_CNT = res.ORESULT_CUR2[0].OVER_CNT
    searchParams.PRC_CNT = res.ORESULT_CUR2[0].PRC_CNT
    searchParams.OVER_RATE = res.ORESULT_CUR2[0].OVER_RATE
  }
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
    width="1600"
    height="650"
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
      <span>부서별 작업환경측정 결과</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-input 
              v-model="searchParams.YEAR"
              :label="$t('기준년도')" 
              label-width="100px" 
              width="250px"
              type="number"
              readonly
            />
            <i-select 
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')" 
              label-width="100px" 
              width="250px" 
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              readonly
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              label-width="100px" 
              width="250px"
              :items="codeList.DEPT_CD"
              :readonly="true"
              item-value="DEPT_CD"
              item-title="ASGN_NM"
            />
            <i-select
              v-model="searchParams.ASGN_CD"
              :label="$t('협력사')"
              label-width="100px" 
              width="250px"
              :items="codeList.ASGN_CD"
              :readonly="true"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
            />
            <v-checkbox
              v-model="searchParams.OVER"
              :label="$t('초과 건만 보기')"
              true-value="Y" 
              false-value="N"
              class="mt-1"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input 
              v-model="searchParams.PRC_CNT"
              :label="$t('측정공정 수')" 
              label-width="100px" 
              width="250px"
              type="number"
              readonly
            />
            <i-input 
              v-model="searchParams.CNT"
              :label="$t('측정 건수')" 
              label-width="100px" 
              width="250px"
              readonly
            />
            <i-input 
              v-model="searchParams.OVER_CNT"
              :label="$t('노출기준 초과')" 
              label-width="100px" 
              width="250px"
              readonly
            />
            <i-input 
              v-model="searchParams.OVER_RATE"
              :label="$t('노출기준 초과율')" 
              label-width="100px" 
              width="250px"
              readonly
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 350px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>
