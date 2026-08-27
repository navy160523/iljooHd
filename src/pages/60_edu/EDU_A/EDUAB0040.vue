<!--
  화면명 : 개인별 교육일정 및 교육현황
  화면개요 : 개인별 교육일정 및 교육현황 조회 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0040Pop01 from '@/pages/60_edu/EDU_A/EDUAB0040Pop01.vue'
import EDUAB0040Pop02 from '@/pages/60_edu/EDU_A/EDUAB0040Pop02.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

defineOptions({
  name: '60_edu-EDU_A-EDUAB0040',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)
//const searchArea = ref(null)
const MainGrd = ref(null)
const eDUAB0040Pop01 = ref(null)
const eDUAB0040Pop02 = ref(null)

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')
const printParams = ref([])
const printData = reactive({
  CMPNY_DIV : userStore.cmpnyDiv, // 회사구분
  ORGN_DIV : userStore.userDiv,    //소속구분(직영, 협력사)
  ASGN_CD : '',     //부서구분
  SCHEDULE_ID : '', //스케줄 ID
  TARGET_ID : '',   //사번
  CERT_ID : '',     //수료증 발행 ID
})

// OzReport 팝업 여부
const showOz = ref(false)

const setPrint = () => {
  reportName.value = '/manage/hse/EDUAB0040.ozr'

  if (userStore.cmpnyDiv == '200') {
    // 일렉일 경우 수료증 변경
    reportName.value = '/manage/hse/EDUAB0040_ELEC.ozr'
  }

  printParams.value = [
    "IN_CMPNY_DIV="+userStore.cmpnyDiv,        // 회사구분
    "IN_ORGN_DIV="+ printData.ORGN_DIV,        // 소속구분(직영, 협력사)
    "IN_ASGN_CD="+ printData.ASGN_CD,          // 부서구분
    "IN_SCHEDULE_ID="+printData.SCHEDULE_ID,   // 스케줄 ID
    "IN_TARGET_ID="+printData.TARGET_ID,       // 사번
    "IN_CERT_ID="+printData.CERT_ID,           // 수료증 발행 ID
  ]
  console.log("PrintParams", printParams)
}

// #1 END ------------------------------------------------------
const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  DIVISION : '',             //분류
  CURR_ID : '',              //교육명
  EDU_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), //기간 시작
  EDU_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), //기간 종료
  TARGET_ID : '',            //이수자코드
  USER_ID : userStore.userId,//유저 ID
  CHK_YN : 'N',               //소속인원전체 조회
  ORGN_DIV : userStore.userDiv,            //소속구분 (A : 직영, B : 협력사)
  DEPT_ORGN_DIV : userStore.userDiv,
  ASGN_CD : '',              //부서코드
  ASGN_NM : '',              //부서명
  TARGET_NM : '',            //이수자명
  
})


//자격종류별 보유자 현황
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'CURR_NM', dataType: 'text',  header: { text: t('교육명') }, styleName: 'left-column', editable: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') }, editable: false },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('교육시작 시간') }, editable: false },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('교육종료 시간') }, editable: false },
    { fieldName: 'LEAD_TIME_DSCR', dataType: 'text', header: { text: t('소요시간') }, editable: false },
    { fieldName: 'CHANGEABLE', dataType: 'text', header: { text: t('일정변경') }, editable: false, renderer:{ type:"button" } },
    { fieldName: 'REQ_NON', dataType: 'text', header: { text: t('제외요청') }, editable: false, renderer:{ type:"button" } },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('교육장소') }, styleName: 'left-column', editable: false },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('대상자 현재소속') },  styleName:'left-column', editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('이수자사번') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이수자') }, editable: false },
    { fieldName: 'EDU_PASS_DIV', dataType: 'text', header: { text: t('이수여부') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true} },
    { fieldName: 'PASS_YN', dataType: 'text', header: { text: t('평가여부') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true}  },
    { fieldName: 'EDU_SCORE', dataType: 'text', header: { text: t('점수') }, editable: false },
    { fieldName: 'RESULT_YN', dataType: 'text', header: { text: t('결과') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true}   },
    { fieldName: 'MORGN_NM', dataType: 'text', header: { text: t('주관부서') }, styleName:'left-column', editable: false },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('대상자') }, styleName:'left-column', editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('업데이트유저') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'REQ_SEQ', dataType: 'text', header: { text: t('REQ_SEQ') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, editable: false, visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('FILE_ID') }, editable: false, visible: false },
    { fieldName: 'LIC_KIND', dataType: 'text', header: { text: t('LIC_KIND') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'INSERT_USER_EMAIL', dataType: 'text', header: { text: t('INSERT_USER_EMAIL') }, editable: false, visible: false },
    { fieldName: 'CHK_YN', dataType: 'text', header: { text: t('CHK_YN') }, editable: false, visible: false },
    { fieldName: 'EDUPOSSIBLE_NUM', dataType: 'text', header: { text: t('가능인원') }, editable: false, visible: false },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('교육내용') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('EDUTIME_SERIAL') }, editable: false, visible: false },
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('LECTURER_ID') }, editable: false, visible: false },
    { fieldName: 'LECTURER_NM', dataType: 'text', header: { text: t('LECTURER_NM') }, editable: false, visible: false },
    { fieldName: 'CERT_ID', dataType: 'text', header: { text: t('CERT_ID') }, editable: false, visible: false },
    { fieldName: 'ORGN_DIV', dataType: 'text', header: { text: t('ORGN_DIV') }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout: [
    'DIVISION',
    'CURR_NM',
    'EDU_DATE',
    'EDU_TIME',
    'EDU_TIME_FN',
    'LEAD_TIME_DSCR',
    'CHANGEABLE',
    'REQ_NON',
    'EPLACE_NM',
    'ASGN_FULL_NM',
    'TARGET_ID',
    'TARGET_NM',
    'EDU_PASS_DIV',
    {
      name: '평가',
      direction: 'horizontal',
      items: [ 'PASS_YN', 'EDU_SCORE', 'RESULT_YN' ],
      header: { text: t('평가') },
    },
    'MORGN_NM',
    'TARGET',
    'REMARK',
    'UPDATE_USER_ID'
  ],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  division : [],//구분
  currId : [],  //교육명
  asgnCd : [],  //부서
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //구분
    getCodeList('HHID220'), //교육명
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서

  ]).then(res => {
    console.log("레스 확인",res)
    //분류 콤보박스
    codeList.division = res[0].ORESULT_CUR
    codeList.division.unshift({ TXT:"전체", COD:"" })
    searchParams.DIVISION = codeList.division[0].COD

    //교육명 콤보박스
    codeList.currId.unshift({ TXT: "전체", COD: "" })
    searchParams.CURR_ID = codeList.currId[0].COD

    //부서 데이터 세팅
    codeList.asgnCd = res[2].ORESULT_CUR
    codeList.asgnCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    
    for(let i = 0; i < codeList.asgnCd.length; i++){
      if (userStore.asgnCd === codeList.asgnCd[i].DEPT_CD){
        searchParams.ASGN_NM = codeList.asgnCd[i].DEPT_NM
        searchParams.ASGN_CD = codeList.asgnCd[i].DEPT_CD
      }else{
        searchParams.ASGN_NM = ''
        searchParams.ASGN_CD = ''
      }
    }
    
    //이수여부 콤보박스 데이터
    let eduPassDiv = [{COD:'Y', TXT:'O'}, {COD:'N', TXT:'X'}, {COD:'C', TXT:'△'}]

    //평가여부 콤보박스 데이터
    let passYn = [{COD:'Y', TXT:'Yes'}, {COD:'N', TXT:'No'}]

    //결과 콤보박스 데이터
    let resultYn = [{COD:'Y', TXT:'합격'}, {COD:'N', TXT:'불합격'}]

    //진행상태 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT")

    //이수여부, 평가여부 데이터 바인딩
    grdMain.value.setBindingColumn("EDU_PASS_DIV", eduPassDiv, "COD", "TXT")
    grdMain.value.setBindingColumn("PASS_YN", passYn, "COD", "TXT")
    grdMain.value.setBindingColumn("RESULT_YN", resultYn, "COD", "TXT")

    //이수자 세팅
    searchParams.TARGET_NM = userStore.userName
    searchParams.TARGET_ID = userStore.userId

    onButtonsClick({ id : 'btnSearch' })
  })
}

// 구분이 바뀌면 구분에 따른 교육명 데이터 가져옴
watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  console.log("뉴밸류!",newValue)
  if(newValue === ''){
    codeList.currId = []
    codeList.currId.unshift({ TXT:"전체", COD:"" })
    searchParams.CURR_ID = codeList.currId[0].COD
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList.currId = res.ORESULT_CUR
      codeList.currId.unshift({ TXT:"전체", COD:"" })
      searchParams.CURR_ID =codeList.currId[0].COD
    })
})
//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {//조회
  gridRefresh()
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
}

const btnMainGrd = btn => {//이수증 출력
  Object.keys(printData).forEach(key => {
    printData[key] = ''
  })

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 
  if(checkedRows.length < 1){
    Message.warn(t('출력할 데이터를 선택해 주세요.'))
    return
  }
  for(let i = 0; i < checkedRows.length; i++ ){
    console.log("이수증출력 데이터 확인",grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    if(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).EDU_PASS_DIV === 'N'){
      Message.warn(t('이수여부가 X인 데이터는 출력할 수 없습니다.'))
      return
    }
    printData.SCHEDULE_ID += grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).SCHEDULE_ID + ';'
    printData.TARGET_ID += grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).TARGET_ID + ';'
    printData.CERT_ID += grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).CERT_ID + ';'
    printData.ORGN_DIV = grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).ORGN_DIV + ';'
  }
  
  printData.SCHEDULE_ID = printData.SCHEDULE_ID.slice(0, -1)
  printData.TARGET_ID = printData.TARGET_ID.slice(0, -1)
  printData.CERT_ID = printData.CERT_ID.slice(0, -1)
  printData.ASGN_CD = searchParams.ASGN_CD
  printData.ORGN_DIV = searchParams.ORGN_DIV
  
  setPrint()
  showOz.value = true
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setAllCheck(false)
}

// 기간(FR)이 TO보다 높을 경우 TO와 FR값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > searchParams.EDU_DATE_TO){
    searchParams.EDU_DATE_TO = searchParams.EDU_DATE_FROM
  }
}

// 기간(TO)이 FR보다 낮을 경우 TO와 FR값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.EDU_DATE_FROM){
    searchParams.EDU_DATE_FROM = searchParams.EDU_DATE_TO
  }
}

//부서 조회 팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv, 
    ASGN_NM : searchParams.ASGN_NM,
    HSE_SYS : 'N',
  })
}

//부서 팝업에서 선택한 데이터 바인딩
const onDeptSelected = item => {
  searchParams.ASGN_NM = item.ASGN_SHRT_NM
  searchParams.ASGN_CD = item.ASGN_CD
  searchParams.DEPT_ORGN_DIV = item.ORGN_DIV
}

//팝업 오픈
const openEmpPopup = async () => {
  empPopup.value.openPopup({ EMP_NM : searchParams.TARGET_NM })
}

//이수자명을 선택했을 때 실행되는 이벤트
const onEmpSelected = row => {
  searchParams.TARGET_ID = row.EMP_NO
  searchParams.TARGET_NM = row.EMP_NM
  searchParams.ORGN_DIV = row.USER_DIV

  searchParams.ASGN_NM = row.DEPT_NM

  //직영일때 DEPT_CD , 협력사 일때 해당 협력사 ASGN_CD
  if(row.USER_DIV === 'A'){
    searchParams.ASGN_CD = row.DEPT_CD
  }else{
    searchParams.ASGN_CD = row.ASGN_CD
  }
}

// 변경, 제외버튼 눌렀을 때 실행되는 이벤트
const cellBtnClick = (grid, index, clickData) => {
  console.log("클릭 데이터",clickData)
  console.log("인덱스",index)
  let selectRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if(clickData.fieldName === 'CHANGEABLE'){
    eDUAB0040Pop01.value.openPopup({
    selectRow
    })
  }else if(clickData.fieldName === 'REQ_NON'){
    eDUAB0040Pop02.value.openPopup({
    selectRow
    })
  }
}

const isNullCheck = val => {
  return (val === '' || val === null || val === undefined) ? true : false
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
// 조회 전 유효성 검사
const beforeSearch = () => {
  console.log("조회전 파람 검사",searchParams)
  if(isNullCheck(searchParams.ASGN_CD)){
    Message.warn(t('부서는 필수입력입니다.'))
    return
  }
  if(searchParams.CHK_YN !== 'Y' && isNullCheck(searchParams.TARGET_ID)){
    Message.warn(t('소속인원전체 조회를 체크하지 않았을 경우에는 이수자가 필수입니다.'))
    return false
  }
  return true
}

// 리스트 조회
const searchData = () => {

  const searchParamsCopy = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    EDU_DATE_FROM : dayjs(searchParams.EDU_DATE_FROM).format('YYYYMMDD'),
    EDU_DATE_TO	: dayjs(searchParams.EDU_DATE_TO).format('YYYYMMDD'),
    DIVISION : searchParams.DIVISION,
    CURR_ID	 : searchParams.CURR_ID,		
    TARGET_ID	: searchParams.TARGET_ID,	
    USER_ID : searchParams.USER_ID,
    CHK_YN : searchParams.CHK_YN,
    ORGN_DIV : searchParams.CHK_YN === 'Y' ? searchParams.DEPT_ORGN_DIV : searchParams.ORGN_DIV,	
    ASGN_CD	:	searchParams.ASGN_CD
  }
  console.log("조회 파라미터 ::::::: ",searchParamsCopy)
  return commonSearchApi({ queryId : 'EDUAB0040_SEARCH_01', param: searchParamsCopy })
}


// 리스트 조회 후
const afterSearch = res => {
  console.log("조회된 데이터 확인",res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

onMounted( () => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    
    <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input labelWidth="35px" width="205px" 
              :label="$t('기간')" type="date"
              v-model="searchParams.EDU_DATE_FROM"
              @blur="dateFrChanged"
              margin="10px"
            />
            <i-input width="190px"
              :label="$t('-')" type="date"
              v-model="searchParams.EDU_DATE_TO"
              @blur="dateToChanged"
            />
            <i-select
              :label="$t('구분')"
              v-model="searchParams.DIVISION"
              :items="codeList.division"
              item-title="TXT"
              item-value="COD"
              width="200px"
            />
            <i-select
              :label="$t('교육명')"
              v-model="searchParams.CURR_ID"
              :items="codeList.currId"
              item-title="TXT"
              item-value="COD"
              width="400px"
            />
            <v-checkbox 
              v-model="searchParams.CHK_YN"
              :label="$t('소속인원전체 조회')"
              false-value="N"
              true-value="Y"
              width="200px"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input 
              :label="$t('부서')" required
              v-model="searchParams.ASGN_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup()"
              @keydown.enter="e => {openDeptPopup()}"
              @update:modelValue="e => {searchParams.ASGN_CD = null}"
              width="300px"
              margin="4px"
            />

            <i-input
              v-model="searchParams.ASGN_CD"
              readonly
              width="200px"
            />
            <i-input
              :label="$t('이수자')" required
              v-model="searchParams.TARGET_NM" 
              append-inner-icon="mdi-magnify" 
              @click:appendInner="openEmpPopup"
              @keydown.enter="e => {openEmpPopup()}"
              @update:modelValue="() => {searchParams.TARGET_ID = null}"
              width="200px"
              margin="4px"
            />
            <i-input
              v-model="searchParams.TARGET_ID"
              readonly
              width="100px"
            />
          </div>
        </v-sheet>
        <!-- 메인그리드 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
            <IGridTitle 
              ref="MainGrd"
              :button-list="['btnCertPrint']"
              @click-button="btnMainGrd"
            >
              <template #editors />
            </IGridTitle> 
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked = cellBtnClick
          />
        </v-sheet>
      </div>
    </v-card-text>
    <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    /> 
    <EmpPopup 
      ref="empPopup" 
      @selected="onEmpSelected"
    />
  
  <!-- OZReport -->
  <OZReport :showPop="showOz" :reportName="reportName" :params="printParams" @close="showOz = $event" />

  <!-- 일정변경 팝업 -->
  <EDUAB0040Pop01
    ref="eDUAB0040Pop01"
    @pop01Close="onButtonsClick({id : 'btnSearch'})"
  />

  <!-- 제외요청 팝업 -->
  <EDUAB0040Pop02
    ref="eDUAB0040Pop02"
    @pop02Close="onButtonsClick({ id : 'btnSearch' })"
  />
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
  
