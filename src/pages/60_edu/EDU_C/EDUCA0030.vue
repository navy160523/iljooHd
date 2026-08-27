<!--
  화면명 : 안전의식 영역별 상관관계 관리 설정
  화면개요 : 안전의식 영역별 상관관계를 추가 저장 삭제 하는 화면
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
  name: '60_edu-EDU_C-EDUCA0030',
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
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  CORRELATION_AREA_CD : '', // 영역
})

//상관관계 리스트 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [ 
    { fieldName: 'CORRELATION_AREA_CD', dataType: 'text', width: '80' , header: { text: t('영역'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'GUIDE_DETAIL', dataType: 'text', width: '200',
      header: { text: t('안내용 문구') }, 
      styleName: 'editable_column multiline-editor left-column',
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      }, 
    },
    { fieldName: 'ANALYSIS_RESULT', dataType: 'text', width: '200',
      header: { text: t('분석결과') }, 
      styleName: 'editable_column multiline-editor left-column',
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      }, 
    },
    { fieldName: 'IMPROVEMENT_ACTIVITY', dataType: 'text', width: '200',
      header: { text: t('개선활동') }, 
      styleName: 'editable_column multiline-editor left-column',
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      }, 
    },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'CORRELATION_SEQ', dataType: 'text', visible: false }, //안전의식 상관관계 SEQ
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  cmpnyDiv : [], // 회사구분
  correlationAreaCd : [], // 영역(HHIL050)
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'), // 회사구분
    getCodeList('HHIL050'), // 영역(HHIL050)
  ]).then(res => {
    console.log("레스 확인",res)
    // 회사구분
    codeList.cmpnyDiv = res[0].ORESULT_CUR
    // 영역(HHIL050)
    codeList.correlationAreaCd = res[1].ORESULT_CUR
  }).finally(() => {
    //영역 리스트 그리드 세팅
    grdMain.value.setBindingColumn("CORRELATION_AREA_CD", codeList.correlationAreaCd, "COD", "TXT")   // 영역 lookup set
    codeList.correlationAreaCd.unshift({TXT : '전체', COD : ''})
    searchParams.CORRELATION_AREA_CD = codeList.correlationAreaCd[0].COD
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
      YEAR : searchParams.YEAR,
      CORRELATION_SEQ : '0', // 안전의식 상관관계 SEQ
      CORRELATION_AREA_CD : '020',
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
  else if(btn.id === 'btnDelete'){ //삭제
    new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(validationCheck)
    .setQuery(deleteData)
    .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
    .run()
  }
  else if(btn.id === 'btnCopy'){ //복사
    new saveFlowHelper(vm, t)
    .setConfirmMessage((searchParams.YEAR -1) + '년 데이터를 복사 하시겠습니까?\r\n 기존 등록된 데이터는 삭제가 됩니다.')
    .setBefore(validationCheck2)
    .setQuery(saveData2)
    .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
    .run()
  }
}

// //그룹 목록 로우 변경 이벤트
// const onCurrentRowChanged = async (grid, oldIdx, newIdx) => {
//   if(newIdx === -1){
//     return
//   }
//   let rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)
//   searchParams2.SCORING_CRITERIA_SEQ = rowData.SCORING_CRITERIA_SEQ
//   onButtonsSubClick({ id:'btnSearch' })
// }

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

// 복사 사용자 정의 validation
const validationCheck2 = val => {
  let bCheck = true

  saveParams.value = []
  
  let data = ref([])
  data.CMPNY_DIV = searchParams.CMPNY_DIV // 회사구분
  data.YEAR = searchParams.YEAR // 년도
  saveParams.value.push(data)
  
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}


//그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdMain'){
    grdMain.value.getDataProvider().setRows([])
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//상관관계 리스트 조회
const searchData = idx => {
  gridRefresh('grdMain')
  return commonSearchApi({ queryId : 'EDUCA0030_SEARCH_01', param: searchParams })
}


//상관관계 리스트 조회 후
const afterSearch = res => {
  console.log("상관관계 리스트 조회",res )
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/

const saveData = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId : 'EDUCA0030_SAVE_01', list: saveParams.value })
}

const saveData2 = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId : 'EDUCA0030_SAVE_02', list: saveParams.value })
}

//*****************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역*************************************************************//
const deleteData = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId : 'EDUCA0030_DELETE_01', list: saveParams.value })
}

//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  initCodeList()
  onButtonsClick({ id:'btnSearch' })
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
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnCopy']"
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
            :label="$t('회사구분')"
            labelWidth="60px"
            width="300px"
            v-model="searchParams.CMPNY_DIV"
            :items="codeList.cmpnyDiv"
            item-value="COD"
            item-title="TXT"
          />
          <i-select
            :label="$t('년도')"
            width="130px"
            v-model="searchParams.YEAR"
            type="YEAR"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-select
            :label="$t('영역')"
            labelWidth="30px"
            width="250px"
            v-model="searchParams.CORRELATION_AREA_CD"
            :items="codeList.correlationAreaCd"
            item-value="COD"
            item-title="TXT"
            @update:model-value="gridRefresh('grdMain')"
          />
        </v-sheet>
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet class="h-auto mr-3">
            <div class="d-flex justify-space-between">
              <IGridTitle
                :title="$t('상관관계 리스트')"
              >
                <template #editors />
              </IGridTitle>
            </div>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
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
