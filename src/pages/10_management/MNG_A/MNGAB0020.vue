<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import OZReport from '@/components/OZReport.vue'

defineOptions({
  name:'10_management-MNG_A-MNGAB0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)

//조회조건
const searchParams = reactive({    
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
})

//작성 헤더 데이터
const headerDatas = reactive({
  CMPNY_DIV : '',
  BSNS_CD : '',
  DEPT_CD : '',
  ASGN_CD : '',
  PROD_DIV : '',
  VEND_YN : '',
  YEAR : '',
  INSERT_DATE : '',
  INSERT_EMP_NM : '',
  STATUS : '',
  APPROVE_ID : '',
  CNFM_DATE : '',
  INSERT_USER_ID : '',
  PLAN_STATUS : '',
  PLAN_APPROVE_ID : '',
  PLAN_CNFM_DATE : '',
})

//코드리스트
const codeList = reactive({
  STATUS : [],
  ISSUE_DIV : [],
  RANK : [{ COD : 1 , TXT : '1' }, { COD : 2 , TXT : '2' }, { COD : 3 , TXT : '3' }, { COD : 4 , TXT : '4' }, { COD : 5 , TXT : '5' }]
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, header: { height: 60 } },
  keys : [],
  fields : [ 
    { fieldName: 'ISSUE_DIV', dataType: 'text', width: '200', header: { text: t('분류') }, 
      lookupDisplay: true, lookupData : { value: "COD", label: "TXT", list:  codeList.ISSUE_DIV } },
    { fieldName: 'ISSUE_DESC', dataType: 'text', width: '400', styleName: 'multiline-editor-left', 
      header: { text: t('경영환경(이슈) /\n 이해관계자 니즈 및 기대사항 결정'), styleName: 'orange-column multiline-editor' }, editable: false },
    { fieldName: 'MEASURE', dataType: 'text', width: '300', styleName: 'editable_multiline_column-left',
      header: { text: t('개선 대책'), styleName: 'orange-column multiline-editor' }, 
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      },  
      required: true, requiredMessage: '개선 대책 입력은 필수입니다.' },
    { fieldName: 'ACTION_FROM',dataType: 'datetime', editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }}
      , datetimeFormat: 'yyyy-MM-dd', width: '100', header: { text: t('시작') }, styleName: "editable_column", required: true, requiredMessage: '시작일 입력은 필수입니다.' },
    { fieldName: 'ACTION_TO',dataType: 'datetime', editor: {type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }}
      , datetimeFormat: 'yyyy-MM-dd', width: '100', header: { text: t('완료') }, styleName: "editable_column", required: true, requiredMessage: '완료일 입력은 필수입니다.' },
    { fieldName: 'ACTION_RESULT', dataType: 'text', width: '150', header: { text: t('조치결과') },
      editor: {
          type: "multiline",
          maxLength: 0, //입력길이제한 x
          height: 200,
        },  
       styleName: "editable_column-left" },
    { fieldName: 'FREQ', dataType: 'text', width: '50', header: { text: t('빈도') }, editable: false },
    { fieldName: 'STRENGTH', dataType: 'text', width: '50', header: { text: t('강도') }, editable: false },
    { fieldName: 'TOTAL', dataType: 'text', width: '50', header: { text: t('평점') }, editable: false },
    { fieldName: 'RANK', dataType: 'text', width: '50', header: { text: t('등급') }, editable: false},
    { fieldName: 'CHECKER', dataType: 'text', width: '80', header: { text: t('확인자') }, styleName: "editable_column" },
    { fieldName: 'R_FREQ', dataType: 'text', width: '50', header: { text: t('빈도') }, styleName: "editable_column", 
      lookupDisplay: true, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, lookupData : { value: "COD", label: "TXT", list:  codeList.RANK } },
    { fieldName: 'R_STRENGTH', dataType: 'text', width: '50', header: { text: t('강도') }, styleName: "editable_column", 
      lookupDisplay: true, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, lookupData : { value: "COD", label: "TXT", list:  codeList.RANK } },
    { fieldName: 'R_TOTAL', dataType: 'text', width: '50', header: { text: t('평점') }, editable: false },
    { fieldName: 'R_RANK', dataType: 'text', width: '50', header: { text: t('등급') }, editable: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '120', visible : false },
    { fieldName: 'YEAR', dataType: 'text', width: '120', visible : false },
    { fieldName: 'BSNS_CD', dataType: 'text', width: '120', visible : false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '120', visible : false },
    { fieldName: 'ASGN_CD', dataType: 'text', width: '120', visible : false },
    { fieldName: 'SEQ', dataType: 'text', width: '120', visible : false },
    { fieldName: 'STAKEHOLDER', dataType: 'text', width: '120', visible : false },
    { fieldName: 'INOUT_DIV', dataType: 'text', width: '120', visible : false },
    { fieldName: 'CR_DIV', dataType: 'text', width: '120', visible : false },
    { fieldName: 'C_DIV', dataType: 'text', width: '120', visible : false },
    { fieldName: 'R_DIV', dataType: 'text', width: '120', visible : false },
    { fieldName: 'ACTION_DESC', dataType: 'text', width: '120', visible : false },
    { fieldName: 'APPLY_YN', dataType: 'text', width: '120', visible : false },
    { fieldName: 'SAVE_YN', dataType: 'text', width: '120', visible : false },
  ],
  columns : [],
  columnLayout: [
    'ISSUE_DIV', 
    'ISSUE_DESC',
    'MEASURE',
    {
      name: '조치기간',
      direction: 'horizontal',
      items: [ 'ACTION_FROM', 'ACTION_TO'],
      header: { text: t('조치기간') },
    },    
    {
      name: '개선전 평가결과',
      direction: 'horizontal',
      items: ['FREQ', 'STRENGTH', 'TOTAL', 'RANK'],
      header: { text: t('개선전 평가결과') },
    },    
    {
      name: '개선 후 평가결과',
      direction: 'horizontal',
      items: [ 'R_FREQ', 'R_STRENGTH', 'R_TOTAL', 'R_RANK'],
      header: { text: t('개선 후 평가결과') },
    },
    'ACTION_RESULT',
    'CHECKER',
  ],
})

grdMainProps.columns = grdMainProps.fields

//콤보박스 셋팅
const initCombo = () => {
  //담당 가능 과목, 강의 이력 데이터 바인딩
  Promise.all([
    getCodeList('HHIAF30'),
    getCodeList('HHIAJA'),
  ]).then(res => {
    codeList.STATUS = res[0].ORESULT_CUR
    codeList.ISSUE_DIV = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('ISSUE_DIV', codeList.ISSUE_DIV, 'COD', 'TXT')
  })
}

// Report Name Name.ozr
const reportName = ref('')

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

const setPrint = () => {
  reportName.value = '/manage/hse/MNGAB0020.ozr'

  params.value = [
    "IN_CMPNY_DIV="+headerDatas.CMPNY_DIV,
    "IN_BSNS_CD="+headerDatas.BSNS_CD,
    "IN_DEPT_CD="+headerDatas.DEPT_CD,
    "IN_ASGN_CD="+headerDatas.ASGN_CD,
    "IN_YEAR="+headerDatas.YEAR,
  ]
}

//부서팝업실행
const openDeptPopup = () => {
  deptPopup.value.openPopup({ ASGN_NM: searchParams.ASGN_NM })
}

//부서팝업결과
const onDeptSelected = val => {
  let asgnGubn = val.ORGN_DIV === 'A'
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ORGN_DIV === 'A' ? val.DEPT_CD : val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
}

//조회
const searchData = async () => {  
  commonSearchApi({ queryId : 'MNGAB0020_SEARCH_01', param: searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      let dbData = res.ORESULT_CUR[0]
      headerDatas.CMPNY_DIV = dbData.CMPNY_DIV
      headerDatas.BSNS_CD = dbData.BSNS_CD
      headerDatas.DEPT_CD = dbData.DEPT_CD
      headerDatas.ASGN_CD = dbData.ASGN_CD
      headerDatas.PROD_DIV = dbData.PROD_DIV
      headerDatas.VEND_YN = dbData.VEND_YN
      headerDatas.YEAR = dbData.YEAR
      headerDatas.INSERT_DATE = dayjs(dbData.INSERT_DATE).format("YYYY-MM-DD")
      headerDatas.INSERT_EMP_NM = dbData.INSERT_EMP_NM
      headerDatas.STATUS = dbData.STATUS
      headerDatas.APPROVE_ID = dbData.APPROVE_ID
      headerDatas.CNFM_DATE = dbData.CNFM_DATE
      headerDatas.INSERT_USER_ID = dbData.INSERT_USER_ID
      headerDatas.PLAN_STATUS = dbData.PLAN_STATUS
      headerDatas.PLAN_APPROVE_ID = dbData.PLAN_APPROVE_ID
      headerDatas.PLAN_CNFM_DATE = dbData.PLAN_CNFM_DATE
    }
    else{
      headerDatas.CMPNY_DIV = ''
      headerDatas.BSNS_CD = ''
      headerDatas.DEPT_CD = ''
      headerDatas.ASGN_CD = ''
      headerDatas.PROD_DIV = ''
      headerDatas.VEND_YN = ''
      headerDatas.YEAR = ''
      headerDatas.INSERT_DATE = ''
      headerDatas.INSERT_EMP_NM = ''
      headerDatas.STATUS = ''
      headerDatas.APPROVE_ID = ''
      headerDatas.CNFM_DATE = ''
      headerDatas.INSERT_USER_ID = ''
      headerDatas.PLAN_STATUS = ''
      headerDatas.PLAN_APPROVE_ID = ''
      headerDatas.PLAN_CNFM_DATE = ''
    }
  }).finally(() => {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataGrdMain)
      .setAfter(afterSearchGrdMain)
      .run()
  })
  
}
//메인그리드 조회
const searchMainGrdData = () =>{
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchDataGrdMain)
    .setAfter(afterSearchGrdMain)
    .run()
}

//메인그리드 DB조회
const searchDataGrdMain = () => {
  return commonSearchApi({ queryId : 'MNGAB0020_SEARCH_02', param: headerDatas })
}
//메인그리드 조회 후 셋팅
const afterSearchGrdMain = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  commonSearchApi({ queryId : 'searchHseAuth', param : { CMPNY_DIV : headerDatas.CMPNY_DIV, BSNS_CD : headerDatas.BSNS_CD, ASGN_CD : headerDatas.ASGN_CD, EMP_NO : userStore.userId } }).then(res1=>{
    menuTitle.value.disableBtn('btnUpdate', headerDatas.STATUS === '40')
    menuTitle.value.disableBtn('btnReqApply', res.ORESULT_CUR.length === 0 || headerDatas.STATUS != '10')
  })

  //출력물 셋팅
  setPrint()
}

//저장 데이터 확인
const validationChk = () =>{
  let saveRows = grdMain.value.getGridView().getCheckedRows(true)  
  if(saveRows.length === 0) return false  

  for(let i = 0; i < saveRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(saveRows[i])
    if(grdJsonRow.ACTION_TO - grdJsonRow.ACTION_FROM < 0){
      Message.warn(t((saveRows[i]+1) + "행의 종료일이 시작일보다 빠릅니다."))
      return false
    }
    // 'R_FREQ', 'R_STRENGTH', 'R_TOTAL', 'R_RANK'
    if(!grdJsonRow.R_FREQ || !grdJsonRow.R_STRENGTH || !grdJsonRow.R_TOTAL){
      Message.warn(t("개선 후 평가결과는 필수 입니다."))
      return false
    }
  }

  return true
}

//DB 저장
const saveMainData = () => {
  let saveRows = grdMain.value.getGridView().getCheckedRows(true)
  if(saveRows.length === 0) return

  let offset = new Date().getTimezoneOffset() * 60000
  let saveList = []
  for(let i = 0; i < saveRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(saveRows[i])
    saveList.push({
      CMPNY_DIV : grdJsonRow.CMPNY_DIV,	
			YEAR : grdJsonRow.YEAR, 			
			BSNS_CD : grdJsonRow.BSNS_CD, 		
			DEPT_CD : grdJsonRow.DEPT_CD, 		
			ASGN_CD : grdJsonRow.ASGN_CD, 		
			SEQ : grdJsonRow.SEQ, 				
			MEASURE : grdJsonRow.MEASURE,    
			ACTION_FROM : new Date(grdJsonRow.ACTION_FROM - offset).toISOString().substring(0,10).replace(/-/g,''),
			ACTION_TO : new Date(grdJsonRow.ACTION_TO- offset).toISOString().substring(0,10).replace(/-/g,''),  
			ACTION_RESULT : grdJsonRow.ACTION_RESULT,
			R_FREQ : grdJsonRow.R_FREQ,     
			R_STRENGTH : grdJsonRow.R_STRENGTH, 
			CHECKER : grdJsonRow.CHECKER, 		
			USER_ID : userStore.userId, 
    })
  }

  return commonExecuteApi({ queryId : 'MNGAB0020_SAVE_01', list: saveList })
}

const saveAfterMainData = res =>{
  grdMain.value.getGridView().checkAll(false)
}

//메뉴버튼
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    searchData()    
  }
  else if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid : grdMain, row : 'check' }])
    .setGridList([grdMain])
    .setBefore(validationChk)
    .setQuery(saveMainData)
    .setAfter(saveAfterMainData)
    .run()
  }
  else if(btn.id === 'btnReqApply'){

  }
  else {
    //출력물 버튼
    showOz.value = true
  }
}

let korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
//연도조절
const yearChange = async e => {
  searchParams.YEAR = await searchParams.YEAR.replace(korean, '')
  if(searchParams.YEAR.length > 4){
    searchParams.YEAR = await searchParams.YEAR.slice(0, 4)
  }
}

//셀 값변경 이벤트
const editRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grdMain.value.getGridView().commit()
  let data = grdMain.value.getDataProvider().getJsonRow(dataRow)
  grdMain.value.getGridView().checkRow(dataRow, true)
  if(field === 11 || field === 12){ 
    let total = data.R_FREQ * data.R_STRENGTH
    grdMain.value.getDataProvider().setValue(dataRow, 'R_TOTAL', total)
    grdMain.value.getDataProvider().setValue(dataRow, 'R_RANK', total < 5 ? 'L' : ( total < 12 ? 'M' : 'H'))
  }
}

onMounted(() => {
  vm.$nextTick(() => {
    initCombo()  

    grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      if(dataCell.dataColumn.fieldName === 'R_RANK' || dataCell.dataColumn.fieldName === 'RANK' ){
        if (dataCell.value == "L") {
          ret.style = { background: "#008000" } 
        } else if (dataCell.value == "M") {
          ret.style = { background: "#FFFF00" }
        } else if (dataCell.value == "H") {
          ret.style = { background: "#FF0000" }
        } 
      }
      return ret
    })

    onButtonsClick({ id :'btnSearch' })
  })  
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between pt-2 pb-2" >
          <div class="d-flex">
            <i-input
              :label="$t('년도')"
              labelWidth="35px"
              v-model="searchParams.YEAR"
              @update:modelValue="yearChange"
              type="Number"
              width="150px"
            />

            <i-input 
              :label="$t('부서/ 협력사')"
              label-width="80px"
              width="350px"
              v-model="searchParams.ASGN_NM" 
              append-inner-icon="mdi-magnify" 
              @keydown.enter="e => {
                openDeptPopup()
              }"
              @update:modelValue="e => { searchParams.ASGN_CD = null }"
              @click:appendInner="openDeptPopup()"
              class="ma-0"
            />
            <i-input
              v-model="searchParams.ASGN_CD" 
              readonly 
              width="100px"
            />
          </div>
          <div class="d-flex flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('작성일')"
                labelWidth="70px"
                v-model="headerDatas.INSERT_DATE"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('작성자')"
                labelWidth="60px"
                v-model="headerDatas.INSERT_EMP_NM"
                readonly
                width="250px"
              />
            </div>
            <!-- <div class="d-flex">
              <i-input
                :label="$t('결재완료일')"
                labelWidth="70px"
                v-model="headerDatas.PLAN_CNFM_DATE"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('진행상태')"
                labelWidth="60px"
                v-model="headerDatas.STATUS"
                readonly
                width="250px"
              />
            </div> -->
          </div>
        </v-sheet>
        <IGridTitle :title="$t('중요리스크 및 기회 개선계획/결과 작성')"/>
        <v-sheet>
          <strong>※ HSE경영시스템 메뉴는 부서 내 HSE추진자만 입력 가능하며, HSE추진자는 부서에서 직접 관리합니다.</strong>
           &nbsp; - HSE추진자 등록 메뉴 : [운영관리 - 담당자 관리 - 부서별 담당자 등록/관리] 
          <br> &nbsp; - HSE추진자 등록 권한:  부서 내 HSE 추진자, 운영과장 
        </v-sheet>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 580px;"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys" 
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @onEditRowChanged="editRowChanged"
        />
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup 
      ref="deptPopup" 
      @selected="onDeptSelected"
    />
  
    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
  </v-card>   
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
  
