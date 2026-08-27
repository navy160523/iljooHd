<!--
  화면명 : 교육이수자 근태 확인
  화면개요 : 교육이수자의 근태를 확인할 수 있으며 실적을 수정할 수 있는 화면.
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
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import _ from 'lodash'
// import { requiredNumber } from '@/utils/required.js'

defineOptions({
  name: '60_edu-EDU_A-EDUAB0070',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const logsStore = useLogsStore() //로그정보
const userStore = useUserStore()
const menuTitle = ref(null)
const eDUAB0030Tab01Pop02Pop01 = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const searchArea = ref(null)
const fileUploadPopup = ref(null) //파일 업로드 팝업
const dialog = ref(false)
const rowValue = ref('') //로우 변경시 인덱스 값 저장
const MainGrd = ref(null)
const lockdown = ref(0)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  DATE_FR : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), //기간 시작
  DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), //기간 종료
  DIVISION : '',             //분류
  CURR_ID : '',              //교육명
  USER_ID : userStore.userId,// 유저 ID
  ORGN_DIV : 'A',            //직영만 조회 가능하므로 고정값(A : 직영, B : 협력사)
  ASGN_NM : '',              //부서명
  ASGN_CD : '',          //부서코드
})

//자격종류별 보유자 현황
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'CURR_NM', dataType: 'text',  header: { text: t('교육명') }, styleName: 'left-column', editable: false },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('대상자') }, styleName: 'left-column', editable: false },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('대상자 현재소속') }, styleName: 'left-column', editable: false },
    { fieldName: 'MORGN_NM', dataType: 'text', header: { text: t('주관부서') }, editable: false },
    { fieldName: 'INSA', dataType: 'text', header: { text: t('근태정보') }, editable: false },
    { fieldName: 'EDU_DATE_FM', dataType: 'text', header: { text: t('교육일자') }, editable: false },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('교육시작 시간') }, editable: false },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('교육종료 시간') }, editable: false },
    { fieldName: 'ATTEND_TIME', dataType: 'text', header: { text: t('출석일시') }, editable: false },
    { fieldName: 'ADD_EDU_TIME', dataType: 'text', header: { text: t('추가교육이수일') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('이수자 사번') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이수자명') }, editable: false },
    { fieldName: 'LEAD_TIME_DSCR', dataType: 'text', header: { text: t('소요시간') }, editable: false },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('교육장소') }, editable: false },
    { fieldName: 'EDU_PASS_DIV', dataType: 'text', header: { text: t('이수 구분') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'REQ_SEQ', dataType: 'text', header: { text: t('REQ_SEQ') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, editable: false, visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('FILE_ID') }, editable: false, visible: false },
    { fieldName: 'LIC_KIND', dataType: 'text', header: { text: t('LIC_KIND') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'INSERT_USER_EMAIL', dataType: 'text', header: { text: t('INSERT_USER_EMAIL') }, editable: false, visible: false },
    { fieldName: 'CHK_YN', dataType: 'text', header: { text: t('CHK_YN') }, editable: false, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, editable: false, visible: false },
  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  division : [],//분류
  currId : [],  //교육명
  asgnCd : [],  //부서
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
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
    searchParams.ASGN_CD = userStore.asgnCd
    searchParams.ASGN_NM = userStore.asgnNm

    //진행상태 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT")
  })
}

// 구분이 바뀌면 구분에 따른 교육명 데이터 가져옴
watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  if(newValue === ''){
    codeList.currId = []
    codeList.currId.unshift({ TXT:"전체", COD:"" })
    
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList.currId = res.ORESULT_CUR
      codeList.currId.unshift({ TXT:"전체", COD:"" })
      searchParams.currId =codeList.currId[0].COD
    })
})

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = async btn => {//조회
  gridRefresh()
  if(isNullCheck(searchParams.ASGN_CD)){
    Message.warn(t('부서는 필수입력입니다.'))
    return
  }
  if(lockdown.value === 1){
    if(dayjs(searchParams.DATE_TO).diff(searchParams.DATE_FR, 'day') >= 30){
      let ck = ''
      ck = await vm.$swal({ 
      title: t('30일 이상 조회 시 조회속도가 많이 느리거나 조회 도중 오류가 발생할 수 있습니다. 계속 조회하시겠습니까?'), 
      showCancelButton: true,
      })

      if(ck.isConfirmed){    
        new queryFlowHelper(vm, t)
          .setGridList([grdMain])
          .setBefore(beforeSearch)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
      }
    }else{
      new queryFlowHelper(vm, t)
          .setGridList([grdMain])
          .setBefore(beforeSearch)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
    }
  }else{
    lockdown.value = 1
    new queryFlowHelper(vm, t)
          .setGridList([grdMain])
          .setBefore(beforeSearch)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
  }



}

//실적 수정 버튼 클릭 이벤트
const btnMainGrd = btn => {
  if(isNullCheck(rowValue.value)){
    Message.warn(t('실적수정할 데이터를 선택해 주세요.'))
    return 
  }
  let row =  grdMain.value.getDataProvider().getJsonRow(rowValue.value)
  if(row === null) return
  eDUAB0030Tab01Pop02Pop01.value.openPopup({
    EDU_DATE : '', 
    CON_DIV : '',   
    EDUTIME_SERIAL : '',
    CMPNY_DIV  : row.CMPNY_DIV,  
    YEAR : dayjs(row.EDU_DATE_FM).format('YYYY'),  
    SCHEDULE_ID : row.SCHEDULE_ID,
    CURR_ID : row.CURR_ID,
    SAVE_YN : 'Y',
    MENU_ID : useLogsStore().menuId,
    EXAM_YN : '',
    PATH : useLogsStore().fullPath, // 20240207 To-Do-List 화면 경로
    //APPROVE_YN : '',
  
  })
}


//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setAllCheck(false)
}

// 기간(FR)이 TO보다 높을 경우 TO와 FR값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > searchParams.DATE_TO){
    searchParams.DATE_TO = searchParams.DATE_FR
  }
}

// 기간(TO)이 FR보다 낮을 경우 TO와 FR값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.DATE_FR){
    searchParams.DATE_FR = searchParams.DATE_TO
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
}

//로우 변경시 로우 인덱스 값 저장
const rowChanged = async (grid, oldIdx, newIdx) => {
  rowValue.value = newIdx
  let rowData
  if(newIdx !== -1){
    rowData = grdMain.value.getDataProvider().getJsonRow(newIdx)
  }else{
    return
  }
  console.log("유저 asgnCd",userStore.asgnCd)
  console.log("rowData.DEPT_CD",rowData.DEPT_CD)
  console.log("메뉴어드민",logsStore.isMenuAdmin)
  if(userStore.asgnCd !== rowData.DEPT_CD){
    if(logsStore.isMenuAdmin === 'N'){
      MainGrd.value.disableBtn('btnPerfModify', true) //$$$$$$$$$$$$$$$$$$$$$$$$$실제 사용시 주석 해제해야 함
    }else{
      MainGrd.value.disableBtn('btnPerfModify', false) 
    }
  }
}

const isNullCheck = val => {
  if(val === 0){
    return false
  }
  return (val == null || val == undefined || val == '') ? true : false
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
// 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

// 리스트 조회
const searchData = () => {
  console.log("조회 파라미터 ::::::: ",searchParams)
  return commonSearchApi({ queryId : 'EDUAB0070_SEARCH_01', param: searchParams })
}


// 리스트 조회 후
const afterSearch = res => {
  console.log("조회된 데이터 확인",res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  gridColorSetting()

}

const gridColorSetting = () => {
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    //제시간에 출석한 사람(Y)은 주황색으로 표시됨
    //C.EDU_DATE(교육 시작 시간), B.ATTEND_TIME(출석 시간), B.QR_TIME(QR 출석 시간)
    //,CASE WHEN TRIM(C.EDU_DATE) = TO_CHAR(NVL(B.ATTEND_TIME, B.QR_DATE),'YYYYMMDD') THEN 'Y' ELSE 'N' END AS CHK_YN
    var ret = {}
    var CHK_YN = grid.getValue(item.index, "CHK_YN")
    if (CHK_YN == 'Y') {               
      ret.style = { background:"#FFE08C" }
    }

    return ret
  })
}


//*****************************************조회 영역(종료)***********************************************************/

onMounted( () => {
  initCodeList()
  console.log('onMounted>>>>>' + useLogsStore().fullPath)
  MainGrd.value.disableBtn('btnPerfModify', true) //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$실제 사용시 주석 해제해야함
})
</script>

<template>
  <v-card  class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text  class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('기간')"
            labelWidth="26px"
            width="190px"
            v-model="searchParams.DATE_FR"
            type="date"
            @blur="dateFrChanged"
          />
          <i-input
            :label="$t('-')"
            labelWidth="13px"
            width="180px"
            v-model="searchParams.DATE_TO"
            type="date"
            @blur="dateToChanged"
          />
          <i-select
            :label="$t('구분')"
            labelWidth="26px"
            width="200px"
            v-model="searchParams.DIVISION"
            :items="codeList.division"
            item-title="TXT"
            item-value="COD"
          />
          <i-select
            :label="$t('교육명')"
            labelWidth="39px"
            width="300px"
            v-model="searchParams.CURR_ID"
            :items="codeList.currId"
            item-title="TXT"
            item-value="COD"
          />
          <i-input
            :label="$t('부서')" 
            class="mr-1"
            labelWidth="30px"
            width="300px"
            required
            v-model="searchParams.ASGN_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openDeptPopup()"
            @keydown.enter="e => {openDeptPopup()}"
            @update:modelValue="e => {searchParams.ASGN_CD = null}"
          />
          <i-input
            v-model="searchParams.ASGN_CD"
            width="100px"
            :readonly="true"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle 
            ref="MainGrd"
            :button-list="['btnPerfModify']"
            @click-button="btnMainGrd"
          >
            <template #editors />
          </IGridTitle> 
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCurrentRowChanged="rowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    /> 
    <!-- 교육이수 팝업창 -->
    <EDUAB0030Tab01Pop02Pop01
      ref="eDUAB0030Tab01Pop02Pop01"
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
  
