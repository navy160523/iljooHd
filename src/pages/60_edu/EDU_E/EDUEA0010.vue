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
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.company,
    HSE_ONLY: "Y",
  });
}

const input1=('')
const input2=('')
const input3=('')
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnPrint', 'btnCopy']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
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
            required
            minlength="8"
          />
          <i-input
            v-model="input1" 
            width="200px"
            english
          />
          <i-input
            v-model="input2" 
            width="200px"
            korean
          />
          <i-input
            v-model="input3" 
            width="200px"
            type=password
          />
          

          <!-- 날자선택 예제 추가 -->
          <i-input labelWidth="35px" width="205px" :label="$t('기간')" type="date" margin="10px"/>
          <i-input width="190px" :label="$t('-')" type="date"/> 
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="50%" class="mb-3">
          <IGridTitle :title="$t('작성정보')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onDeptSelect"
          />
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <IGridTitle
            :title="$t('HSE목표 및 중점 추진사항')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
          />
        </v-sheet>
      </div>
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
    min-height: 700px;
  }
}
</style>