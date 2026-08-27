<!--
  화면명 : 안전페이 정산
  화면개요 : 안전페이 정산 조회 하는 화면
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
import { getJsonFromExcel } from "@/utils/excel"
import OZReport from '@/components/OZReport.vue'

defineOptions({
  name: '60_edu-EDU_D-EDUDB0030',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdMain02 = ref(null)
const grdMain03 = ref(null)
const grdSub = ref(null)
const randNum = ref(null)
const reportName = ref('/manage/hse/EDUDB0030.ozr')
const params = ref([])
// OzReport 팝업 여부
const showOz = ref(false)
const tab = ref('one')


const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date()).format('YYYY'),  //년도
  CHANGE_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), // 포인트전환 기간 시작  
  CHANGE_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 포인트전환 기간 끝
  BSNS_CD : '',            //사업부
  DEPT_CD : '',            //부서코드
  ASGN_CD : '',         //협력사
  ORGN_DIV : '',         //소속구분 (A : 직영, B : 협력사)
})

const searchParams02 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv, 
  YYYYMM: dayjs(new Date()).format('YYYY-MM'), 
})


const searchParams03 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv, 
  YYYYMM: dayjs(new Date()).format('YYYY-MM'), 
  ORGN_DIV : 'A'
})


const searchParams_print = reactive({
  YYYYMM: dayjs(new Date()).format('YYYY-MM'), 
 
})

//TAB1 메인 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [ 
    { fieldName: 'MNTH', dataType: 'text', width:'50', header: { text: t('월') },  editable: false },
    { fieldName: 'ACCUMULATED_POINT', dataType: 'number', header: { text: t('지급된 포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###" },
    { fieldName: 'CHANGE_POINT', dataType: 'number', header: { text: t('전환된 포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###" },
  ],
  columns: [],
})

//TAB2 메인 그리드 세팅
const grdMainProps02 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } , footer: { visible:true }},
  fields : [ 
    { fieldName: 'EMP_NO', dataType: 'text', width:'50', header: { text: t('사번') },  editable: false , footer: { styleName: 'right-column', text: '소계 : ' }},
    { fieldName: 'SUMMARY', dataType: 'number',width:'100',  header: { text: t('전환금액') }, styleName: 'right-column', editable: false, numberFormat: "#,###" , footer: { numberFormat: "#,###",expression: "sum" }},
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable: false },
  ],
  columns: [],
})


//TAB3 메인 그리드 세팅
const grdMainProps03 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar : { visible:false }, footer: { visible:true } }, 
  fields : [ 
    { fieldName: 'COST_CENTER_NM', dataType: 'text', width:'50', header: { text: t('사업부') },  editable: false, footer: { styleName: 'right-column', text: '소계 : ' },},
    { fieldName: 'COST_CENTER', dataType: 'text', width:'50', header: { text: t('코스트센터 내역') },  editable: false },
    { fieldName: 'SUMC', dataType: 'number',width:'100',  header: { text: t('카카오페이 전환금액') }, styleName: 'right-column', editable: false, numberFormat: "#,###" , footer: { numberFormat: "#,###",expression: "sum" }},
    //{ fieldName: 'CHANGE_POINT', dataType: 'number',width:'100',  header: { text: t('카카오페이 인보이스금액') }, styleName: 'right-column', editable: false, numberFormat: "#,###" , footer: { numberFormat: "#,###",expression: "sum" }},
  ],
  columns: [],
})

//디테일 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar : { visible:false }, footer: { visible:true } }, 
  fields : [ 
    { fieldName: 'BSNS_COMP_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false, mergeRule: {  "criteria": "prevvalues + value" } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, editable: false, mergeRule: {  "criteria": "prevvalues + value" } },
    { fieldName: 'ORGN_DIV_NM', dataType: 'text', width:'100', header: { text: t('소속구분') },  editable: false, mergeRule: { "criteria": "prevvalues + value" }, },
    { fieldName: 'DEPT_NM2', dataType: 'text', header: { text: t('부서/협력사') }, editable: false, mergeRule: {  "criteria": "prevvalues + value" }, groupFooter: {text: "소계 : "}, },
    { fieldName: 'ASGN_NAME', dataType: 'text', width:'250', header: { text: t('소속부서') }, styleName: 'left-column', editable: false },
    
    //{ fieldName: 'HLD_OFFI_GBNNM', dataType: 'text', width:'70', header: { text: t('재직여부') }, editable: false },
    // { fieldName: 'BIRTH_DAY_SEX', dataType: 'text', width:'100', header: { text: t('생년월일-성별') }, editable: false },
    //{ fieldName: 'EMP_NO', dataType: 'text', width:'70', header: { text: t('사번') }, editable: false },
    // { fieldName: 'CODE', dataType: 'text', width:'100', header: { text: t('특별포인트 코드') }, footer: { styleName: 'right-column', text: '소계 : ' }, editable: false },
    //{ fieldName: 'REMAINING_POINT', dataType: 'number', width:'100', header: { text: t('잔여 포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###", footer: { numberFormat: "#,###",expression: "sum" } },
    // { fieldName: 'CHANGE_POINT', dataType: 'number', width:'100', header: { text: t('전환 포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###", footer: { numberFormat: "#,###",expression: "sum" }, groupFooter: {numberFormat: "#,###",expression: "sum"} },
    //{ fieldName: 'CHANGE_DATE', dataType: 'text', width:'150', header: { text: t('최근 전환일') }, editable: false },

  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
grdMainProps02.columns = grdMainProps02.fields
grdMainProps03.columns = grdMainProps03.fields
grdSubProps.columns = grdSubProps.fields

const codeList = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],  //사업부
  deptCd : [{ DEPT_NM: '전체', DEPT_CD: '' }],  //부서
  orgnDiv : [], //소속구분
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
})
//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'), // 회사구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    //commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'), //소속구분 
    //commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD:'', USE_DIV:'Y' } }), // 협력사
  ]).then(res => {
    console.log("레스 확인",res)
    // 회사구분
    codeList.cmpnyDiv = res[0].ORESULT_CUR

    // 사업부 설정
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    
    // let findIndex = res[1].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    // if(findIndex < 0){
    //     findIndex = 0
    // }
    // searchParams.BSNS_CD = codeList.bsnsCd[findIndex].BSNS_CD

    // // 부서 설정
    // codeList.deptCd = res[2].ORESULT_CUR
    // codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    // findIndex = res[2].ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
    // if(findIndex < 0){
    //     findIndex = 0
    // }
    // searchParams.DEPT_CD = codeList.deptCd[findIndex].DEPT_CD

    // 소속구분
    codeList.orgnDiv = res[2].ORESULT_CUR
    // findIndex = res[3].ORESULT_CUR.findIndex(item => item.COD === userStore.userDiv)
    // if(findIndex < 0){
    //     findIndex = 0
    // }
    // searchParams.ORGN_DIV = codeList.orgnDiv[findIndex].COD

    // // 협력사
    // codeList.asgnCd = res[4].ORESULT_CUR
    // codeList.asgnCd.unshift({ASGN_NM : '전체', ASGN_CD : ''})
    // findIndex = res[4].ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd)
    // if(findIndex < 0){
    //     findIndex = 0
    // }
    // searchParams.ASGN_CD = codeList.asgnCd[findIndex].ASGN_CD

  }).finally(() => {

  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue) => {
  searchParams.DEPT_CD = ''
  searchParams.ASGN_CD = ''
  searchParams.ORGN_DIV = ''

if(isNullCheck(newValue)){
    codeList.deptCd = []
    codeList.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })

    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
      searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    }).finally(() => {
      //gridRefresh()
    })
})

// 부서가 바뀌면 소속구분
watch(() => searchParams.DEPT_CD, (newValue) => {
  searchParams.ASGN_CD = ''
  searchParams.ORGN_DIV = ''
  if(isNullCheck(newValue)){
    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
    return
  }
})

// 소속구분이 바뀌면 협력사 데이터 가져옴
// TAB01
watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
  searchParams.ASGN_CD = ''
  if(isNullCheck(newValue)){
    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
    return
  }
  if(newValue === 'B' && searchParams.DEPT_CD != ''&& searchParams.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD } })
    .then(res => {
      codeList.asgnCd = []
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      searchParams.ASGN_CD = codeList.asgnCd[0].ASGN_CD
    })
  }
})

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}

//버튼 이벤트
//인원별 포인트 현황 리스트
const onButtonsClick = (btn) => {     

  // 조회
  if (btn.id === 'btnSearch') {
    if (tab.value === 'one'){
      new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      //.setBefore(beforeSearch2)
      .setQuery(searchData2)
      .setAfter(afterSearch2)
      .run()
  } 
  else if (tab.value === 'two'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain02])
      //.setBefore(beforeSearch2)
      .setQuery(searchData3)
      .setAfter(afterSearch3)
      .run()
  }
  else {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain03])
      //.setBefore(beforeSearch2)
      .setQuery(searchData4)
      .setAfter(afterSearch4)
      .run()

  } }


  // 출력
  else if (btn.id === 'btnPrint') {

    if (tab.value === 'one'){
      onOzPrint()
  } 
    else if (tab.value === 'two'){
      onExceldown()
  }
    else{
      Message.warn('출력물 없음')
    }


  }

}

const onExceldown = () => {
  grdMain02.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: 'HD안전페이 직영세금계산_' + searchParams02.YYYYMM + '.xlsx', // 저장될 파일 name
      // documentTitle: { 
      //   //제목
      //   //message: "",
      //   visible: true,
      //   spaceTop: 1,
      //   spaceBottom: 0,
      //   height: 50,
      //   styleName: "excelTitle",
      // },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      indicator: 'hidden', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })

}





//년도별 포인트 리스트 조회
const grdMainSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
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

//년도별 포인트 리스트 조회
const searchData = idx => {
  gridRefresh('grdMain')
  return commonSearchApi({ queryId : 'EDUDB0030_SEARCH_01', param: searchParams })
}


//년도별 포인트 리스트 조회 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//인원별 포인트 현황 리스트 조회
const searchData2 = idx => {
  return commonSearchApi({ queryId : 'EDUDB0030_SEARCH_02', param: searchParams })
}


//인원별 포인트 현황 리스트 조회 후
const afterSearch2 = res => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}


//인원별 포인트 현황 리스트 조회
const searchData3 = idx => {
  let param = {}
  param.CMPNY_DIV = searchParams02.CMPNY_DIV
  param.YEAR = searchParams02.YYYYMM.split('-')[0]
  param.MNTH = searchParams02.YYYYMM.split('-')[1]
  console.log(param)
  return commonSearchApi({ queryId : 'EDUDB0030_SEARCH_03', param: param })
}

//사업부별 포인트 전환 내역 조회
const searchData4 = idx => {
  let param = {}
  param.CMPNY_DIV = searchParams03.CMPNY_DIV
  param.YEAR = searchParams03.YYYYMM.split('-')[0]
  param.MNTH = searchParams03.YYYYMM.split('-')[1]
  param.ORGN_DIV = searchParams03.ORGN_DIV
  console.log(param)
  return commonSearchApi({ queryId : 'EDUDB0030_SEARCH_04', param: param })
}

//인원별 포인트 현황 리스트 조회 후
const afterSearch3 = res => {
  grdMain02.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//사업부별 포인트 전환 내역 조회 후
const afterSearch4 = res => {
  grdMain03.value.getDataProvider().setRows(res.ORESULT_CUR)
}







// 출력 버튼 클릭시
const onOzPrint = () => {

// reportName.value = '/manage/hse/EDUDB0030.ozr'

params.value = ['IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
                  'IN_YEAR=' + searchParams_print.YYYYMM.split('-')[0],
                  'IN_MNTH=' + searchParams_print.YYYYMM.split('-')[1] ]

console.log('onOzPrint pValue = ', params.value)

showOz.value = true
}


//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/

//*****************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역*************************************************************//

//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  initCodeList()
  
  grdMainSearch() //너무 느려서 주석



  //onButtonsClick()
  // 행 병합 그룹핑(mergeMode)을 사용하면 groupPanel.visible 사용할 필요가 없으며, 대신 groupBy 세팅된 순서대로 컬럼이 이동됨
  //grdTab03Main.value.getGridView().groupPanel.visible = false //그룹패널 안보이게하기
  grdSub.value.getGridView().groupBy(["BSNS_COMP_NM","DEPT_NM","ORGN_DIV_NM"]) //BSNS_COMP_NM,ASGN_NAME 기준으로 그룹핑
  grdSub.value.getGridView().setRowGroup
  ({ 
    expandedAdornments: "footer"  //그룹을 펼쳤을때 FOOTER만 보이기
    //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
    , mergeExpanderVisibility: "none" //그룹 접기 여부 화면에 안보이게하기
    , mergeMode: true // 행 병합 그룹핑 활성화
    //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
  })
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
        :button-list="['btnSearch', 'btnPrint']"
        @click-button="onButtonsClick"
      />
      <v-tabs v-model="tab">
          <v-tab value="one">정산 현황 </v-tab>
          <v-tab value="two">직영 세금계산서 발행</v-tab>
          <v-tab value="thr">직영/협력사 전표처리</v-tab>
      </v-tabs>
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text v-show="tab == 'one'" class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('회사구분')"
            width="250px"
            v-model="searchParams.CMPNY_DIV"
            :items="codeList.cmpnyDiv"
            item-value="COD"
            item-title="TXT"
            readonly
          />
          <i-input labelWidth="50px" width="200px" 
            :label="$t('전환기간')" type="date"
            v-model="searchParams.CHANGE_DATE_FROM"
            margin="10px"
          />
          <i-input width="155px"
            :label="$t('-')" type="date"
            v-model="searchParams.CHANGE_DATE_TO"
          />
          <i-select
            :label="$t('사업부')"
            width="300px"
            labelWidth="45px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            @update:model-value="gridRefresh('grdSub')"
          />
          <i-select
            :label="$t('부서')"
            width="250px"
            labelWidth="30px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.deptCd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            @update:model-value="gridRefresh('grdSub')"
          />
          <i-select
            :label="$t('소속구분')"
            width="180px"
            v-model="searchParams.ORGN_DIV"
            :items="codeList.orgnDiv"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdSub')"
          />
          <i-select
            :label="$t('협력사')"
            labelWidth="40px"
            width="250px"
            v-model="searchParams.ASGN_CD"
            :items="codeList.asgnCd"
            item-title="ASGN_NM"
            item-value="ASGN_CD"
            @update:model-value="gridRefresh('grdSub')"
          />
          </v-sheet>
          <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams_print.YYYYMM"
            :label="$t('보고서 출력월')"
            width="250px"
            type="month"
            />
        </v-sheet>
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet width="20%" class="h-auto mr-3">
            <div class="d-flex justify-space-between mB-5">
              <IGridTitle class="mb-0 mr-2 h-grow"
                :title="$t('월별 적립 포인트 현황')"
              >
                <template #editors />
              </IGridTitle>
              <v-sheet class="d-flex justify-end" width="150px">
                <!-- 년도를 화면 끝으로 보낼때
                v-sheet를 이용하여 class="d-flex justify-end" width="240px" 넣고
                i-input에 마진을 0으로 준다 -->
                <i-select
                  :label="$t('년도')"
                  width="130px"
                  v-model="searchParams.YEAR"
                  type="YEAR"
                  margin="0"
                  @update:model-value="grdMainSearch()"
                />
              </v-sheet>
            </div>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="rowChanged"
            />
          </v-sheet>
          <v-sheet width="80%" class="pa-0 h-auto">
            <IGridTitle
                :title="$t('부서별 포인트 전환 현황')"
              >
                <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onEditRowChanged="editRowChanged"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <v-card-text v-show="tab == 'two'" class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('회사구분')"
            width="200px"
            v-model="searchParams02.CMPNY_DIV"
            :items="codeList.cmpnyDiv"
            item-value="COD"
            item-title="TXT"
            readonly
          />
          <i-input
            v-model="searchParams02.YYYYMM"
            :label="$t('년월')"
            width="250px"
            type="month"
            />

            
          </v-sheet>
         
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet width="100%" class="h-auto">
            <div class="d-flex justify-space-between mB-5">
              <IGridTitle class="mb-0 mr-2 h-grow"
                :title="$t('직영 포인트 전환 내역')"
              >
              </IGridTitle>
            </div>
            <RealGrid
              ref="grdMain02"
              :grid-view-option="grdMainProps02.gridViewOption"
              :fields="grdMainProps02.fields"
              :columns="grdMainProps02.columns"
            />
          </v-sheet>
     
        </div>
      </div>
    </v-card-text>

    <v-card-text v-show="tab == 'thr'" class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('회사구분')"
            width="200px"
            v-model="searchParams03.CMPNY_DIV"
            :items="codeList.cmpnyDiv"
            item-value="COD"
            item-title="TXT"
            readonly
          />
          <i-input
            v-model="searchParams03.YYYYMM"
            :label="$t('년월')"
            width="250px"
            type="month"
            />

          <i-select
            :label="$t('회사구분')"
            width="200px"
            v-model="searchParams03.ORGN_DIV"
            :items="codeList.orgnDiv"
            item-value="COD"
            item-title="TXT"
          />
            
          </v-sheet>
         
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet width="30%" class="h-auto">
            <div class="d-flex justify-space-between mB-5">
              <IGridTitle class="mb-0 mr-2 h-grow"
                :title="$t('직영 포인트 전환 내역')"
              >
              </IGridTitle>
            </div>
            <RealGrid
              ref="grdMain03"
              :grid-view-option="grdMainProps03.gridViewOption"
              :fields="grdMainProps03.fields"
              :columns="grdMainProps03.columns"
            />
          </v-sheet>
     
        </div>
      </div>
    </v-card-text>

  </v-card>
<!-- OZReport -->
<OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />

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
