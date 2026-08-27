<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import MNGAA0020Popup from '@/pages/10_management/MNG_A/MNGAA0020Popup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'

defineOptions({
  name:'SampleGrid2_1',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const deptPopup = ref(null)
const mNGAA0020Popup = ref(null)
const userId = ref(userStore.userId)

const HSE_DIVLookup = reactive([
  { value: '1', label: '안전' },
  { value: '2', label: '보건' },
  { value: '3', label: '환경' },
])


//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.company,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: true? userStore.deptNm : userStore.deptNm,
  YEAR: dayjs().get("year"),
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['YEAR','INSERT_DATE','INSERT_EMP_NM','CNFM_DATE'],
  fields : [ 
    { fieldName: 'YEAR', dataType: 'text', width: '100', header: { text: t('년도') } },
    { fieldName: 'INSERT_DATE', dataType: 'datetime', width: '120', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('작성일'), editor: { datetimeFormat: 'yyyy-MM-dd' } } },
    { fieldName: 'INSERT_EMP_NM', dataType: 'text', width: '120', header: { text: t('작성자(사번)') } },
    { fieldName: 'CNFM_DATE', dataType: 'text', width: '120', type: 'data', header: { text: t('결제/확정일') } },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: true } },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'HSE_DIV', dataType: 'text', width: '50', lookupDisplay: true, lookupData: HSE_DIVLookup, editable: false, 
      header: { text: t('구분') }, mergeRule: { "criteria": "value" } },
    { fieldName: 'GOAL_TITLE', dataType: 'text', width: '200', editable: false, 
      header: { text: t('목표') }, mergeRule: { "criteria": "value" }, styleName: "multiline-editor" },
    { fieldName: 'AHEAD_ORD', dataType: 'text', width: '50', editable: false, 
      header: { text: t('No.') }, mergeRule: { "criteria": "value" } },
    { fieldName: 'AHEAD_ITEM', dataType: 'text', width: '220', editable: false, 
      header: { text: t('중점항목') }, mergeRule: { "criteria": "value" } },
    { fieldName: 'DETAIL_ORD', dataType: 'text', width: '50', editable: false, 
      header: { text: t('No.') }, mergeRule: { "criteria": "value" } }, 
    { fieldName: 'DETAIL_ITEM', dataType: 'text', width: '400', editable: false,
      header: { text: t('세부내용') }, mergeRule: { "criteria": "value" }, styleName: "left-column" },
    { fieldName: 'PLAN_ITEM', dataType: 'text', width: '400', editable: false,
      header: { text: t('실행방안') }, styleName: "left-column" },
    { fieldName: 'PLAN_DESC', dataType: 'text', width: '100', editable: false, header: { text: t('관리기준') } },
    { fieldName: 'RESULT_MEASUREMENT', dataType: 'text', width: '200', editable: false, header: { text: t('성과측정기준') } },
    { fieldName: 'PLAN_DOCU', dataType: 'text', width: '200', editable: false, header: { text: t('기록관리') }  },
    { fieldName: 'PERSON_NAME', dataType: 'text', width: '100', editable: false, header: { text: t('담당자') } },
    { fieldName: 'DETAIL_COMMENT', dataType: 'text', width: '200', editable: true, editor: { type: 'multiline' },
      header: { text: t('검토의견') }, styleName: "left-column multiline-editor"  },
    
    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text' , visible: false },
    { fieldName: 'AHEAD_NO', dataType: 'text' , visible: false },
    { fieldName: 'DETAIL_NO', dataType: 'text' , visible: false },
    { fieldName: 'PLAN_CYCLE', dataType: 'text' , visible: false },
    { fieldName: 'PLAN_NO', dataType: 'text' , visible: false },
    { fieldName: 'PLAN_ORD', dataType: 'text' , visible: false },
    { fieldName: 'YEAR', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'HSE_DIV', 
    'GOAL_TITLE',
    {
      name: '중점 추진 사항(중대재해 차단대책 반영)',
      direction: 'horizontal',
      items: [
        'AHEAD_ORD',
        'AHEAD_ITEM',              
        'DETAIL_ORD',              
        'DETAIL_ITEM',              
      ],
      header: {
        text: t('중점 추진 사항(중대재해 차단대책 반영)'),
      },
    },
    'PLAN_ITEM',
    'PLAN_DESC',
    'RESULT_MEASUREMENT',
    'PLAN_DOCU',
    'PERSON_NAME',
    'DETAIL_COMMENT',
  ],
})

grdSubProps.columns = grdSubProps.fields

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    // 상단 그리드
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } 
  else if (btn.id === 'btnCreate') {
    addData()
  } 
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: null }])
      .setGridList([grdSub])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    deleteData()
  }
}

/* -------------- 조회 -------------- */
// 메인 그리드
const searchData01 = idx => {
  return commonSearchApi({ queryId : 'MNGAA0020_SEARCH_01', param: searchParams })
}

const afterSearch01 = res => {
  let rowData = null
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 서브 그리드
const searchData02 = idx => {
  return commonSearchApi({ queryId : 'MNGAA0020_SEARCH_02', param: searchParams })
}

const afterSearch02 = res => {
  let rowData = null
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 메인 그리드 셀 클릭 시 서브 그리드 데이터 조회
const onDeptSelect = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData02)
    .setAfter(afterSearch02)
    .run()
}

/* -------------- 저장 -------------- */
const beforeSave = () => {
  return true
}

const saveData = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let stateCheckedRows = grdSub.value.getDataProvider().getStateRows("updated")

  for (let rowIdx of stateCheckedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId : 'MNGAA0020_UPDATE_02', list: saveParams })
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = gbn => {
  if(gbn === '부서조회'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.company, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
  } else if(gbn === '목표/추진사항'){

    let hseDiv = '1'
    let curr = grdSub.value.getGridView().getCurrent()

    if (curr.dataRow >= 0) {
      hseDiv = grdSub.value.getDataProvider().getValue(curr.dataRow, 'HSE_DIV')
    }

    mNGAA0020Popup.value.openPopup({      
      YEAR : searchParams.YEAR,
      CMPNY_DIV : searchParams.CMPNY_DIV,
      BSNS_CD : searchParams.BSNS_CD,
      DEPT_CD : searchParams.DEPT_CD,
      ASGN_CD : searchParams.ASGN_CD,
      HSE_DIV : hseDiv,
    })
  }
}

/* -------------- 팝업 선택 이벤트 -------------- */
const onDeptSelected = val => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM

  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnPrint', 'btnCopy']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area p-relative">
      <v-sheet min-height="700" class="content-body">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('년도')"
            labelWidth="35px"
            v-model="searchParams.YEAR"
            type="Number"
            width="150px"
          />
          <i-input 
            :label="$t('부서/ 협력사')"
            label-width="80px"
            width="330px"
            v-model="searchParams.ASGN_NM" 
            append-inner-icon="mdi-magnify" 
            @keydown.enter="e => {
              openPopup('부서조회')
            }"
            @update:modelValue="e => { searchParams.DEPT_CD = null }"
            @click:appendInner="openPopup('부서조회')"
            margin="4px"
          />
          <i-input
            v-model="searchParams.DEPT_CD" 
            readonly
            width="200px"
          />
          <!-- 날자선택 예제 추가 -->
          <i-input labelWidth="35px" width="205px" :label="$t('기간')" type="date" margin="10px"/>
          <i-input width="190px" :label="$t('-')" type="date"/>
        </v-sheet>
        <v-sheet class="mb-3 h-auto">
          <IGridTitle :title="$t('작성정보')">
            <template #editors />
          </IGridTitle>
          <!-- 메인그리드 -->
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onDeptSelect"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle
            :title="$t('HSE목표 및 중점 추진사항')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <!-- 서브그리드 -->
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
          />
        </v-sheet>
        <!-- 부서/ 협력사 팝업 -->
        <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>

        <!-- 목표 및 추진사항 작성/수정 팝업 -->
        <MNGAA0020Popup ref="mNGAA0020Popup" @selected="onDeptSelected"/> 
      </v-sheet>
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
}
</style>