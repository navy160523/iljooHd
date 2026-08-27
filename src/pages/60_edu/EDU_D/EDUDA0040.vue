<!--
  화면명 : 안전포상 배점기준 설정
  화면개요 : 안전포상 배점기준을 추가 저장 삭제 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name: '60_edu-EDU_D-EDUDA0040',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const saveParams= ref([])
let addRowData = ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  SCORING_CRITERIA_CD : '', // 배점기준 코드
  USE_YN : 'Y', // 사용여부
  DEL_YN : '',  // 삭제여부
})

const searchParams2 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  SCORING_CRITERIA_SEQ : '', // 배점기준 리스트 SEQ
})

//배점기준 리스트 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [ 
    { fieldName: 'SCORING_CRITERIA_CD', dataType: 'text', header: { text: t('배점 기준'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'DEL_YN', dataType: 'text', header: { text: t('삭제여부'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SCORING_CRITERIA_SEQ', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})

//배점 리스트 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar : { visible:false } }, 
  fields : [ 
    { fieldName: 'SCORING_LIST_CD', dataType: 'text', width:'100', header: { text: t('배점명'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 10, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'SCORING', dataType: 'number', header: { text: t('배점'), styleName: 'header_validit' }, styleName: 'right-column editable_column'
      , editable: true, numberFormat: "#,###", editor: { type: "line", inputCharacters: "0-9", maxLength: 10, },},

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SCORING_CRITERIA_SEQ', dataType: 'text', visible: false },
    { fieldName: 'SCORING_LIST_SEQ', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const codeList = reactive({
  scoringCriteriaCd : [], // 배점기준코드(HHIC10)
  scoringListCd : [], //배점코드(HHIC20)  
  delYn: [{ TXT: 'Y', COD: 'Y' }, { TXT: 'N', COD: 'N' }], //삭제여부
  useYn: [{TXT : '전체', COD : ''}, { TXT: 'Y', COD: 'Y' }, { TXT: 'N', COD: 'N' }], //사용여부
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIC10'), // 배점기준코드(HHIC10)
    getCodeList('HHIC20'), // 배점코드(HHIC20)   
  ]).then(res => {
    //console.log("레스 확인",res)
    // 배점기준코드(HHIC10)
    codeList.scoringCriteriaCd = res[0].ORESULT_CUR

    // 배점코드(HHIC20)   
    codeList.scoringListCd = res[1].ORESULT_CUR
    

  }).finally(() => {
    //배점기준 리스트 그리드 세팅
    grdMain.value.setBindingColumn("SCORING_CRITERIA_CD", codeList.scoringCriteriaCd, "COD", "TXT")   // 배점기준 lookup set
    codeList.scoringCriteriaCd.unshift({TXT : '전체', COD : ''})
    searchParams.SCORING_CRITERIA_CD = codeList.scoringCriteriaCd[0].COD

    grdMain.value.setBindingColumn("USE_YN", codeList.delYn, "COD", "TXT")   // 사용여부 lookup set
    grdMain.value.setBindingColumn("DEL_YN", codeList.delYn, "COD", "TXT")   // 삭제여부 lookup set
    codeList.delYn.unshift({TXT : '전체', COD : ''})
    searchParams.DEL_YN = codeList.delYn[0].COD
    // 배점리스트 그리드 세팅
    grdSub.value.setBindingColumn("SCORING_LIST_CD", codeList.scoringListCd, "COD", "TXT")   // 배점명 lookup set

  })
}

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  //console.log('tab.value : ',tab.value)
  if(btn.id === 'btnSearch'){ //조회
    new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
  else if(btn.id === 'btnCreate'){ //추가
    addRowData = 
    {
      CMPNY_DIV : userStore.cmpnyDiv, // 사업장구분
      SCORING_CRITERIA_SEQ : '0', // 배점기준시퀀스(자동증가)
      SCORING_CRITERIA_CD : '10',
      USE_YN : 'N', // 사용여부
      DEL_YN : 'N', // 삭제여부
      INSERT_USER_ID : userStore.empNo, // 등록자
    }
    grdMain.value.addRow(addRowData)
  }
  else if(btn.id === 'btnUpdate'){ //저장
    new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(validationCheck)
    .setQuery(saveData)
    .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
    .run()
  }
}
const onButtonsSubClick = btn => {
  //console.log('tab.value : ',tab.value)
  if(btn.id === 'btnSearch'){ //조회
    new queryFlowHelper(vm, t)
        .setGridList([grdSub])
        .setBefore(beforeSearch2)
        .setQuery(searchData2)
        .setAfter(afterSearch2)
        .run()
  }
  else if(btn.id === 'btnCreate'){ //추가
    if(searchParams2.SCORING_CRITERIA_SEQ!==null || searchParams2.SCORING_CRITERIA_SEQ!==0 || searchParams2.SCORING_CRITERIA_SEQ!==undefined){
      addRowData = 
      {
        CMPNY_DIV : userStore.cmpnyDiv, // 사업장구분
        SCORING_CRITERIA_SEQ : searchParams2.SCORING_CRITERIA_SEQ, // 배점기준 시퀀스(배점기준 테이블 SEQ)
        SCORING_LIST_SEQ : '0', // 배점리스트 시퀀스(자동증가)
        INSERT_USER_ID : userStore.empNo, // 등록자
        SCORING_LIST_CD : '10', // 배점리스트
        SCORING : '0', // 배점
      }
      grdSub.value.addRow(addRowData)
    }else{
      Message.warn(t('선택된 배점기준이 없습니다.'))
    }
  }
  else if(btn.id === 'btnUpdate'){ //저장
    new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdSub, row: 'check' }])
    .setGridList([grdSub])
    .setBefore(validationCheck2)
    .setQuery(saveData2)
    .setAfter(() => { onButtonsSubClick({ id :'btnSearch' }) })
    .run()
  }
  else if(btn.id === 'btnDelete'){ //삭제
    new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdSub, row: 'check' }])
    .setGridList([grdSub])
    .setBefore(validationCheck3)
    .setQuery(deleteData)
    .setAfter(() => { onButtonsSubClick({ id :'btnSearch' }) })
    .run()
  }
}

//그룹 목록 로우 변경 이벤트
const onCurrentRowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx === -1){
    return
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)
  searchParams2.SCORING_CRITERIA_SEQ = rowData.SCORING_CRITERIA_SEQ
  onButtonsSubClick({ id:'btnSearch' })
}

// 저장 사용자 정의 validation
const validationCheck = async value => {
  //console.log("validationCheck", value)

  let chekedRow = ref([])
  let bCheck = true
  chekedRow = await grdMain.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    data.UPDATE_USER_ID = userStore.userId // 수정자
    saveParams.value.push(data)
  })
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}

// 저장 사용자 정의 validation
const validationCheck2 = val => {
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdSub.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])
  chekedRow.forEach(val => {
    data = grdSub.value.getDataProvider().getJsonRow(val)
    //console.log("data.SCORING", data.SCORING)
    if(data.SCORING === null || data.SCORING === undefined){
      Message.warn(t('배점을 입력 하셔야 합니다.'))
      bCheck = false
    }
    data.UPDATE_USER_ID = userStore.userId // 수정자
    data.SCORING_CRITERIA_SEQ = searchParams2.SCORING_CRITERIA_SEQ // 배점기준 리스트 SEQ
    saveParams.value.push(data)
  })
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}

// 삭제 사용자 정의 validation
const validationCheck3 = val => {
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdSub.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])
  chekedRow.forEach(val => {
    data = grdSub.value.getDataProvider().getJsonRow(val)
    saveParams.value.push(data)
  })
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}







//그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdMain'){
    grdMain.value.getDataProvider().setRows([])
  }else if(val === 'grdSub'){
    grdSub.value.getDataProvider().setRows([])
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//개인 조회 전 유효성 검사
const beforeSearch2 = () => {
  return true
}

//배점기준 리스트 조회
const searchData = idx => {
  gridRefresh('grdMain')
  return commonSearchApi({ queryId : 'EDUDA0040_SEARCH_01', param: searchParams })
}


//배점기준 리스트 조회 후
const afterSearch = res => {
  console.log("배점기준 리스트 조회",res )
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//배점 리스트 조회
const searchData2 = idx => {
  return commonSearchApi({ queryId : 'EDUDA0040_SEARCH_02', param: searchParams2 })
}


//배점 리스트 조회 후
const afterSearch2 = res => {
  console.log("배점 리스트 조회 :::: >>>> ",res)
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/

const saveData = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId : 'EDUDA0040_SAVE_01', list: saveParams.value })
}

const saveData2 = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId : 'EDUDA0040_SAVE_02', list: saveParams.value })
}

//*****************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역*************************************************************//
const deleteData = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId : 'EDUDA0040_DELETE_01', list: saveParams.value })
}

//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  initCodeList()
  onButtonsClick({ id:'btnSearch' })
  // grdMainSearch()
  // onButtonsClick()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('배점기준')"
            labelWidth="52px"
            width="250px"
            v-model="searchParams.SCORING_CRITERIA_CD"
            :items="codeList.scoringCriteriaCd"
            item-value="COD"
            item-title="TXT"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-select
            :label="$t('삭제여부')"
            labelWidth="52px"
            width="200px"
            v-model="searchParams.DEL_YN"
            :items="codeList.delYn"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-select
            :label="$t('사용여부')"
            labelWidth="52px"
            width="200px"
            v-model="searchParams.USE_YN"
            :items="codeList.useYn"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdMain')"
          />
        </v-sheet>
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet width="50%" class="h-auto mr-3">
            <div class="d-flex justify-space-between">
              <IGridTitle
                :title="$t('배점기준 리스트')"
                
              >
                <template #editors />
              </IGridTitle>
            </div>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="onCurrentRowChanged"
            />
          </v-sheet>
          <v-sheet width="50%" class="pa-0 h-auto">
            <IGridTitle
                :title="$t('배점 리스트')"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                @click-button="onButtonsSubClick"
              >
                <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
