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

// Hi-SAFE 주제 등록
import OpinionRegister from '@/pages/60_edu/EDU_C/EDUCA0020.vue'

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
const deptPopup = ref(null)
const opinionRegister =ref(null)
const dialog =ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  DEPT_CD :'',
  DEPT_NM :'',
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  PLAN_YN: '',
  SAVE_YN: '',
  SUVY_ID: '',
})

const codeList = reactive({
  PLAN_YN: [
    {COD: '' ,TXT: '전체'},
    {COD: 'Y' ,TXT: '등록'},
    {COD: 'N' ,TXT: '미등록'},
  ],
  RESULT_YN: [
    {COD: '' ,TXT: '전체'},
    {COD: 'Y' ,TXT: '등록'},
    {COD: 'N' ,TXT: '미등록'},
  ],
  SUVY_LIST: [],
})

//상관관계 리스트 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, stateBar: { visible:false } },
  fields : [   
    { fieldName: "DEPT_NM", width: "300",styleName: 'left-column' ,dataType: "text", header: { text: t("부서명") } },
    // { fieldName: "PL", dataType: "text", header: { text: t("상관관계 배정 여부") } },
    { fieldName: "DISADVANTAGE_1", width: "300",dataType: "text", header: { text: t("1순위") } },
    { fieldName: "DISADVANTAGE_2", width: "300", dataType: "text", header: { text: t("2순위") } },
    { fieldName: "DISADVANTAGE_3", width: "300", dataType: "text", header: { text: t("3순위") } },
    { fieldName: "PLAN_YN", width: "120", dataType: "text", header: { text: t("개선계획 등록 여부") } },
    { fieldName: "RESULT_YN", width: "120", dataType: "text", header: { text: t("시행결과 등록 여부") } },
    { fieldName: "OPINION", width: "100", dataType: "text", header: { text: t("의견등록") },
    renderer: {
      type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div style="display: flex; justify-content: center;
          padding-left: 10px; padding-right: 10px">
            <button id="btnOpinion" class="v-btn" 
            style="color: #fff; background: #1a40c7; padding: 4px;">
              의견 등록
            </button>
          </div>`
          return str;
        },
      },  
    },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'CORRELATION_SEQ', dataType: 'text', visible: false }, //안전의식 상관관계 SEQ
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'DEPT_NM', 
    {
      name: '개선 필요 항목',
      direction: 'CATEGORY',
      items: [
        'DISADVANTAGE_1',
        'DISADVANTAGE_2',              
        'DISADVANTAGE_3',              
      ],
      header: {
        text: t('개선 필요 항목'),
      },
    },
    'PLAN_YN',
    'RESULT_YN',
    'OPINION',
  ],
})
// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'), // 회사구분
    getCodeList('HHIL050'), // 영역(HHIL050)
    commonSearchApi({ queryId : 'EDUCA0050_SEARCH_01'
    , param: searchParams}),
    ]).then(res => {
    console.log("레스 확인",res)
    // 회사구분
    codeList.cmpnyDiv = res[0].ORESULT_CUR
    // 영역(HHIL050)
    codeList.correlationAreaCd = res[1].ORESULT_CUR
    // 영역(HHIL050)
    codeList.SUVY_LIST = res[2].ORESULT_CUR
  }).finally(() => {
    //영역 리스트 그리드 세팅
    // grdMain.value.setBindingColumn("CORRELATION_AREA_CD", codeList.correlationAreaCd, "COD", "TXT")   // 영역 lookup set
    // codeList.correlationAreaCd.unshift({TXT : '전체', COD : ''})
    // searchParams.CORRELATION_AREA_CD = codeList.correlationAreaCd[0].COD
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
  return commonSearchApi({ queryId : 'EDUCA0050_SEARCH_03', param: searchParams })
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


//********************************************삭제 영역(종료)**********************************************************//

// 그리드 클릭 이벤트
const onVendCellItemClicked = (grid, index, col) => {
// 아이콘 선택
// console.log('index',index.target)
//선택 행 데이터
const selectRow = grdMain.value.getRowData(index.dataRow)
    
  // 의견 등록 버튼
   if(col.target.classList[0] === 'v-btn' && col.column === 'OPINION'
  && col.target.id === 'btnOpinion' ){ 
    // console.log(selectRow.FILE_ATTACH_KEY)
    dialog.value=true
    opinionRegister.value.openPopup(selectRow)
  }  
   
}

// 그리드 더블 클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  let selectRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
}

// 설문 점수 계산
const calcSurvey = () => {
// 아이콘 선택
// console.log('index',index.target)
//선택 행 데이터
  const selectSurvey = searchParams.SUVY_ID
  if(!selectSurvey){
    Message.warn(t('설문지를 선택해 주세요.'))

  }else{  

    vm.$swal({ 
      title: t('계산 하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        if(selectSurvey){
          console.log('selectSurvey 값 존재',selectSurvey)
          commonExecuteApi({ queryId : 'EDUCA0050_SAVE_01', list: [{
            SUVY_ID: selectSurvey
            ,YEAR: searchParams.YEAR
            ,USER_ID: userStore.empNo
          }] }).then(res => {
            Message.success(t('계산 완료 되었습니다.'))
            disadvantageSearch()
          })
        }
      }
    })
  }

  

    
}


// 단점 조회
const disadvantageSearch = () => {
// 아이콘 선택
// console.log('index',index.target)
//선택 행 데이터
  const selectSurvey = searchParams.SUVY_ID
  commonSearchApi({ queryId: "EDUCA0050_SEARCH_02", param: searchParams }).then( res =>{
    // console.log('EDUCA0050_SEARCH_02 res',res.ORESULT_CUR)
    let tempList = res.ORESULT_CUR
    let saveList = []
    tempList.forEach(element => {
      const sortData = {
        '020': element.DIFF_020
        , '030': element.DIFF_030
        , '040': element.DIFF_040
        , '050': element.DIFF_050
        , '060': element.DIFF_060
        , '070': element.DIFF_070
        , '080': element.DIFF_080
        , '090': element.DIFF_090
        , '100': element.DIFF_100
        , '110': element.DIFF_110
        , '120': element.DIFF_120
        , '130': element.DIFF_130
        , '140': element.DIFF_140
      }
      const sortedKeys = Object.keys(sortData).sort((a, b) => sortData[a] - sortData[b]);
      console.log('sortedKeys',sortedKeys)
      const tempData = {
        SUVY_ID: element.SUVY_ID
        ,YEAR: element.YEAR
        ,DEPT_CD: element.DEPT_CD
        ,DISADVANTAGE_1: sortedKeys[0]
        ,DISADVANTAGE_2: sortedKeys[1]
        ,DISADVANTAGE_3: sortedKeys[2]
        ,USER_ID: userStore.empNo
      }

      saveList.push(tempData)
    })
    console.log('saveList',saveList)
    commonExecuteApi({ queryId : 'EDUCA0050_SAVE_02', list: saveList }).finally(() => {
      Message.success(t('상관관계 배정 완료했습니다.'))
      onButtonsClick({id: 'btnSearch'})
    })
  })
}

const deptPopupOpen = () =>{
  deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: searchParams.DEPT_NM,
    })
}

const onDeptSelected = val =>{
  console.log('select Dept',val)
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
}

const closed = () =>{
  console.log('팝업 닫기')
  dialog.value = false
  onButtonsClick({id: 'btnSearch'})
}

const resetSearch = () =>{
  searchParams.DEPT_CD= ''
  searchParams.PLAN_YN= ''
  searchParams.SAVE_YN= ''
}

// 년도 변경 감지
watch(
  () => searchParams.YEAR,
  (newValue) => {
    commonSearchApi({ queryId : 'EDUCA0050_SEARCH_01'
    , param: searchParams})
    .then(res => {
    // console.log("레스 확인",res)
    codeList.SUVY_LIST = res.ORESULT_CUR
  })
  }
)

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
        :button-list="['btnSearch']"
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
            :label="$t('년도')"
            width="130px"
            v-model="searchParams.YEAR"
            type="YEAR"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-input
            :label="$t('부서')"
            width="300px"
            v-model="searchParams.DEPT_NM"
            append-inner-icon="mdi-magnify" 
            @keydown.enter="e => { deptPopupOpen() }"
            @click:appendInner="deptPopupOpen()"
            @update:modelValue="resetSearch()"
          />
          <i-input
            width="150px"
            v-model="searchParams.DEPT_CD"
            :readonly="true"
          />
          <i-select
            :label="$t('개선계획 등록여부')"
            labelWidth="110px"
            width="230px"
            v-model="searchParams.PLAN_YN"
            :items="codeList.PLAN_YN"
            item-value="COD"
            item-title="TXT"
          />
          <i-select
            :label="$t('시행결과 등록여부')"
            labelWidth="110px"
            width="230px"
            v-model="searchParams.RESULT_YN"
            :items="codeList.RESULT_YN"
            item-value="COD"
            item-title="TXT"
          />
        </v-sheet>
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet class="h-auto mr-3">
            <div class="d-flex justify-space-between">
              <IGridTitle
                :title="$t('')"
              >
                <template #editors />
              </IGridTitle>
              <v-sheet class="mb-2" style="display: flex; flex-direction: row; align-items: center;">
                <i-select
                  :label="$t('설문지 선택')"
                  labelWidth="70px"
                  width="600px"
                  v-model="searchParams.SUVY_ID"
                  :items="codeList.SUVY_LIST"
                  item-value="COD"
                  item-title="TXT"
                />
                <v-btn  @click="calcSurvey">
                  설문 점수 계산
                </v-btn>
                <!-- <v-btn  @click="disadvantageSearch">
                  상관관계 배정
                </v-btn> -->
              </v-sheet>
            </div>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellItemClicked="onVendCellItemClicked"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <v-dialog
      v-model="dialog"
      eager
      persistent
      class="draggable-dialog"
      width="1700"
      height="900"
    >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>의견 등록</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <div>
        <OpinionRegister ref="opinionRegister" @closed="closed" :button-list="['btnSearch','btnClose']" :readonly="true"></OpinionRegister>
      </div>
    </v-card>
    </v-dialog>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
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
