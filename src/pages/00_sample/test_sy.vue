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
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import test_syPopup from "./test_syPopup.vue"

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
const input2 = ref('')
const Popup = ref(null)

const HSE_DIVLookup = reactive([
  { value: '1', label: '안전' },
  { value: '2', label: '보건' },
  { value: '3', label: '환경' },
])


//조회조건
const searchParams = reactive({
  MEMID: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys : ['MEMID', 'LASTNAME', 'FIRSTNAME', 'TEAM'],
  fields : [ 
    { fieldName: 'MEMID', dataType: 'int', width: '100', header: { text: t('등번호') } },
    { fieldName: 'LASTNAME', dataType: 'text', width: '100', header: { text: t('성') } },
    { fieldName: 'FIRSTNAME', dataType: 'text', width: '120', header: { text: t('이름') } },
    { fieldName: 'TEAM', dataType: 'text', width: '120', type: 'data', header: { text: t('팀') } },
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
    grdMain.value.addRow({
      MEMID: searchParams.MEMID,
      LASTNAME: searchParams.LASTNAME,
      FIRSTNAME: searchParams.FIRSTNAME,
      TEAM: searchParams.TEAM,
    })
  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
    .setQuery(deleteMainData)
    .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
    .run()
  }
}


/* -------------- 조회 -------------- */
// 메인 그리드
const searchData01 = idx => {
  
  searchParams.MEMID = input2.value

  return commonSearchApi({ queryId : 'SY_SEARCH2', param: searchParams })
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
  let updateParams = []
  const updatedRows = grdMain.value.getDataProvider().getStateRows("updated")
  const createdRows = grdMain.value.getDataProvider().getStateRows("created")
  for (let rowIdx of createdRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  for (let rowIdx of updatedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: "SY_SAVE", list: saveParams })
}

//DB 삭제
const deleteMainData = () =>{
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return
  let deleteList = []
  for(let i = 0; i < deleteRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(deleteRows[i])
    deleteList.push(grdJsonRow)
  }

  return commonExecuteApi({ queryId : 'SY_DELETE', list: deleteList })
}

//삭제 후 그리드 삭제
const afterDelete = res => {
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return
  grdMain.value.getDataProvider().removeRows(deleteRows)
}

/* -------------- 팝업 오픈 -------------- */
// const openPopup = gbn => {
//   deptPopup.value.openPopup({
//     CMPNY_DIV: userStore.company,
//     HSE_ONLY: "Y",
//   });
// }

/* -------------- 팝업 선택 이벤트 -------------- */
// const onDeptSelected = val => {
//   searchParams.CMPNY_DIV = val.CMPNY_DIV
//   searchParams.BSNS_CD = val.BSNS_CD
//   searchParams.DEPT_CD = val.DEPT_CD
//   searchParams.ASGN_CD = val.ASGN_CD
//   searchParams.ASGN_NM = val.ASGN_SHRT_NM

//   onButtonsClick({ id: 'btnSearch' })
// }




const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  Popup.value.openPopup(data)
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnCreate', 'btnUpdate', 'btnDelete', 'btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <!-- <i-input
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
          /> -->
          <i-input
            v-model="input2" 
            width="200px"
          />
          <!-- <i-input
            v-model="input3" 
            width="200px"
            type=password
          /> -->
          

          <!-- 날짜선택 예제 추가
          <i-input labelWidth="35px" width="205px" :label="$t('기간')" type="date" margin="10px"/>
          <i-input width="190px" :label="$t('-')" type="date"/> -->
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="50%" class="mb-3">
          <IGridTitle :title="$t('선수명단')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
            
          />
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <!-- <v-sheet class="h-auto">
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
        </v-sheet> -->
      </div>
    </v-card-text>
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  </v-card>

  <test_syPopup ref="Popup" @after-search="() => onButtonsClick({ id: 'btnSearch' })"></test_syPopup>
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