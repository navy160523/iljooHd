<!--
  화면명 : 실습/체험형 안전교육 대상자 관리
  화면개요 : 실습/체험형 안전교육 대상자를 조회할 수 있으며 특정 인원을 제외 처리할 수 있는 화면
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
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_A-EDUAA0060',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
//const searchArea = ref(null)
let selectAllYn = ref(false)
let likesAllFruit = ref(true)
//let userDivData = reactive({})
let deadline = ref(null)
let firstLock = reactive(0)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  DATE_FR: '',
  DATE_TO: '',
  USER_DIV: '',
  DUTY_CD: '',
  
})

const detailSearchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  TARGET_ID : '',
  DATE_FR : '',
  DATE_TO : '',
})

//메인 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [ 
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, editable:false, styleName: 'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable:false, styleName: 'left-column' },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'DUTY_NM', dataType: 'text', header: { text: t('인사직무') }, editable: false },
    { fieldName: 'EDU_DUTY_CD', dataType: 'text', header: { text: t('실제직무') },lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, styleName: 'editable_column' },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육과정') }, editable: false, styleName: 'left-column' },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('이수일자') }, editable: false },
    { fieldName: 'EXCEPTION_YN', dataType: 'text', header: { text: t('제외여부') }, editable: false,
      renderer: { type: "check", trueValues:"1", falseValues: "0, null" }, styleName: 'editable_column' },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('등록/수정자') }, editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName: 'editable_column-left',
      editor: { maxLength: 1000 } }, 
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('등록/수정일') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('회사구분') } },
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('저장여부') } },
    { fieldName: 'DATE_FR', dataType: 'text', visible:false, header: { text: t('시작일') } },
    { fieldName: 'DATE_TO', dataType: 'text', visible:false, header: { text: t('종료일') } },
  ],
  columns: [],
})

//디테일 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar : { visible:false } }, 
  fields : [ 
    { fieldName: 'CURR_NM', dataType: 'text', width:"100", header: { text: t('교육과정') }, editable:false, styleName: 'left-column' },
    { fieldName: 'EDU_DATE', dataType: 'text', width:"50", header: { text: t('이수일자') }, editable:false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('회사구분') } },
    { fieldName: 'GROUP_ID', dataType: 'text',visible:false, header: { text: t('그룹 ID') } },
    { fieldName: 'ASGN_CD', dataType: 'text', visible:false, header: { text: t('소속코드') }, editable:false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', visible:false, header: { text: t('직위코드') }, editable:false }, 
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('저장여부') } },
  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const codeList = reactive({
  bsnsCd : [],
  deptCd : [],
  userDiv : [],
  asgnCd : [],
  dutyCd : [],
})

const codeListCopy = reactive({
  dutyCd : [],
})


//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'),
    getCodeList('HHID130', 'HHI', 'N', 0, null , 'Y')
  ]).then(res => {
    console.log("레스 확인",res)

    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.asgnCd.unshift({ ASGN_NM:"전체", ASGN_NM:"" })
    codeList.userDiv = res[2].ORESULT_CUR
    codeList.userDiv.unshift({ TXT: "전체", COD: "" })
    searchParams.USER_DIV = ""
    if(firstLock === 0){
      let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
      // 2024.02.29 박용훈 -1일 경우 강제로 0번재 값으로 세팅 되도록 수정
      if(findIndex < 0){
        findIndex = 0
      }
      searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD
    } else {
      searchParams.BSNS_CD = res[0].ORESULT_CUR[0].BSNS_CD
    }

    deadline.value = "마감일 : " + dayjs(res[3].ORESULT_CUR[0].CODE_DESC1).format('YYYY-MM-DD')
  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  codeList.deptCd = []
  codeList.asgnCd = []
  searchParams.DEPT_CD = ''
  searchParams.ASGN_CD = ''
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      if(firstLock === 0){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
        // 2024.02.29 박용훈 -1일 경우 강제로 0번재 값으로 세팅 되도록 수정
        if(findIndex < 0){
          findIndex = 0
        }
        searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
      } else {
        searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      }
    })
})

// 부서가 바뀌면 협력사 및 인사직무 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  codeList.asgnCd = []
  searchParams.ASGN_CD = ''
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue } })
    .then(res => {
      console.log("협력사 데이터 확인 : ",res)
      let findIndex = res.ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd)
      // 2024.02.29 박용훈 -1일 경우 강제로 0번재 값으로 세팅 되도록 수정
      if(findIndex < 0){
        findIndex = 0
      }
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
      searchParams.ASGN_CD = res.ORESULT_CUR[findIndex].ASGN_CD
    })

  var searchParam = {
    CMPNY_DIV : userStore.cmpnyDiv,
    USER_DIV : searchParams.USER_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD,
    ASGN_CD : searchParams.ASGN_CD,
  }

  //인사 직무 데이터
  commonSearchApi({ queryId : 'EDUAA0060_SEARCH_01', param : searchParam }).then(res => {
    codeList.dutyCd = []
    searchParams.DUTY_CD = null
    codeList.dutyCd = res.ORESULT_CUR
    for(let i = 0; i < codeList.dutyCd.length; i++){
      if(codeList.dutyCd[i].TXT === null){
        codeList.dutyCd[i].TXT = codeList.dutyCd[i].COD
      }
    }
  })
  if(firstLock === 0){
    onButtonsClick({ id : 'btnSearch' })
    firstLock = 1
  }
})


const dateSetting = () => {
  let dateSet = new Date()
  searchParams.DATE_TO = dateSet.toISOString().slice(0,10)
  dateSet.setMonth(dateSet.getMonth() - 3)
  dateSet = dateSet.toISOString().slice(0,10)
  searchParams.DATE_FR = dateSet
  
}

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {      //조회
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }

}

const onMainButtonsClick = btn => {
  if(btn.id === 'btnBatchExcept'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(saveBeforeExcept)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
}

//그룹 대상자 리스트 조회
const detailSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setBefore(beforeDetailSearch)
    .setQuery(searchDetailData)
    .setAfter(afterDetailSearch)
    .showMessage(false)
    .run()
}

//메인 그리드 로우 변경 이벤트
const onCellClicked = async (grid, clickData) => {
  if(clickData.dataRow === undefined ||clickData.cellType === 'check' || clickData.field === 5 ||
     clickData.field === 9 ||  clickData.field === 11 ){
    return
  }
  let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  detailSearchParams.TARGET_ID = rowData.EMP_NO
  detailSearch()
}

//교육이수일(FR)이 TO보다 높을 경우 TO와 FR값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > searchParams.DATE_TO){
    searchParams.DATE_TO = searchParams.DATE_FR
  }
}

//교육이수일(TO)이 FR보다 낮을 경우 TO와 FR값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.DATE_FR){
    searchParams.DATE_FR = searchParams.DATE_TO
  }
}

//인사직무 데이터 변경 시 발생하는 이벤트
const dutyCdClick = checkedData => {
  gridRefresh()
  if(checkedData.length < codeList.dutyCd.length){
    selectAllYn.value = false
  }
  if(checkedData.length === codeList.dutyCd.length){
    selectAllYn.value = true
  }
}

//전체 버튼(□)을 클릭하였을 경우 발생하는 이벤트
const selectAllChecked = () => {
  gridRefresh()
  if(selectAllYn.value === true){
    var allList = []
    for(let i = 0; i < codeList.dutyCd.length; i++){
      allList.push(codeList.dutyCd[i].COD)
    }
    searchParams.DUTY_CD = allList
  } else {
    searchParams.DUTY_CD = []
  }
}

//[전체] ROW를 클릭하였을 경우 발생하는 이벤트
const toggle = () => {
  if(selectAllYn.value === true){
    searchParams.DUTY_CD = []
    selectAllYn.value = false
  } else {
    var allList = []
    for(let i = 0; i < codeList.dutyCd.length; i++){
      allList.push(codeList.dutyCd[i].COD)
    }
    searchParams.DUTY_CD = allList
    selectAllYn.value = true
  }
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setAllCheck(false)
  grdSub.value.getDataProvider().setRows([])
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//Main 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//Main 목록 조회
const searchData = () => {
  return commonSearchApi({ queryId : 'EDUAA0060_SEARCH_02', param: searchParams })
}


//Main 조회 후
const afterSearch = res => {
  console.log("조회 레스 확인 :::: >>>> ",res)
  if(res.ORESULT_CUR.length === 0){
    grdSub.value.getDataProvider().setRows([])
  }else{
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    detailSearchParams.DATE_FR = res.ORESULT_CUR[0].DATE_FR
    detailSearchParams.DATE_TO = res.ORESULT_CUR[0].DATE_TO

    codeListCopy.dutyCd = _.cloneDeep(codeList.dutyCd)
    for(let i = 0; i < codeListCopy.dutyCd.length; i++){
      if(!codeListCopy.dutyCd[i].TXT.includes(':')){
        codeListCopy.dutyCd[i].TXT = codeListCopy.dutyCd[i].TXT + ' : ' + codeListCopy.dutyCd[i].USER_DIVNM
      }
    }
    grdMain.value.setBindingColumn("EDU_DUTY_CD", codeListCopy.dutyCd, "COD", "TXT")
  }

}

//조회 전 유효성 검사
const beforeDetailSearch = () => {

  return true
}

//Detail 조회
const searchDetailData = res => {
  return commonSearchApi({ queryId : 'EDUAA0060_SEARCH_03', param: detailSearchParams })
}


//Detail 조회 후
const afterDetailSearch = res => {
  if(res.ORESULT_CUR.length === 0){
    grdSub.value.getDataProvider().setRows([])
  }
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}


//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/
//Main 저장 전 유효성 검사
const beforeSave = () => {
  let result = true
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    result = false
  }
  var saveParams = []

  return result
}

//Main 저장 전 유효성 검사(일괄제외처리 버튼 클릭 시)
const saveBeforeExcept = () => {
  let result = true
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    result = false
  }

  return result
}

//Main 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++){
    grdMain.value.getDataProvider().setValue(checkedRows[i], 9, 1)
  }

  for(let i = 0; i < checkedRows.length; i++){
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
  }


  return commonExecuteApi({ queryId : 'EDUAA0060_SAVE_01', list: saveParams })
}


//Main 저장 후
const afterSave = () => {
  grdMain.value.getGridView().setAllCheck(false)

  commonSearchApi({ queryId : 'EDUAA0060_SEARCH_02', param: searchParams }).then(res => {
    console.log("조회 레스 확인 :::: >>>> ",res)
    if(res.ORESULT_CUR.length === 0){
      grdSub.value.getDataProvider().setRows([])
    }
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    detailSearchParams.DATE_FR = res.ORESULT_CUR[0].DATE_FR
    detailSearchParams.DATE_TO = res.ORESULT_CUR[0].DATE_TO

    codeListCopy.dutyCd = _.cloneDeep(codeList.dutyCd)
    for(let i = 0; i < codeListCopy.dutyCd.length; i++){
      if(!codeListCopy.dutyCd[i].TXT.includes(':')){
        codeListCopy.dutyCd[i].TXT = codeListCopy.dutyCd[i].TXT + ' : ' + codeListCopy.dutyCd[i].USER_DIVNM
      }
    }
    grdMain.value.setBindingColumn("EDU_DUTY_CD", codeListCopy.dutyCd, "COD", "TXT")

  })
}

//*****************************************저장 영역(종료)***********************************************************/
//********************************************삭제 영역*************************************************************//
//Main 삭제전 유효성 검사
const beforeDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))

    return false
  }
  
  return true
}

//Main 삭제
const deleteData = () => {
  let checkedRowIndex = grdMain.value.getGridView().getCheckedRows()
  var deleteParams =[]
  for(let i = 0; i < checkedRowIndex.length; i++){
    deleteParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRowIndex[i]))
  }
  for(let i = 0; i < deleteParams.length; i++){
    deleteParams[i].BSNS_CD = userStore.bsnsCd
    deleteParams[i].DEPT_CD = userStore.deptCd
    deleteParams[i].ASGN_CD = userStore.asgnCd
    deleteParams[i].USER_ID = userStore.userId
  }

  return commonExecuteApi({ queryId : 'EDUAA0040_DELETE_01', list: deleteParams })
}


//********************************************삭제 영역(종료)**********************************************************//

onMounted(() => {
  initCodeList()
  dateSetting()
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <!-- 타이틀 영역 
          타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('사업부')"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh"
              labelWidth="39px"
              width="250px"
            />
            <i-select
              :label="$t('부서')"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh"
              labelWidth="26px"
              width="250px"
            />
            <i-select
              :label="$t('협력사')"
              v-model="searchParams.ASGN_CD"
              :items="codeList.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              @update:model-value="gridRefresh"
              labelWidth="39px"
              width="300px"
            />
            <i-input labelWidth="65px" width="228px" 
              :label="$t('교육이수일')" type="date"
              v-model="searchParams.DATE_FR"
              @focusout="dateFrChanged"
              @update:model-value="gridRefresh"
              margin="10px"
            />
            <i-input width="160px"
              :label="$t('-')" type="date"
              v-model="searchParams.DATE_TO"
              @focusout="dateToChanged"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('소속구분')"
              v-model="searchParams.USER_DIV"
              :items="codeList.userDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh"
              labelWidth="52px"
              width="200px"
            />
          </div>
          <div class="d-flex">
            <ILabel
              :label="$t('인사직무')"
              class="pa-0"
            >
              <template #editor="editorProps" >
                <VAutocomplete
                  style="width:600px"
                  multiple
                  v-model="searchParams.DUTY_CD"
                  :items="codeList.dutyCd"
                  item-title="TXT"
                  item-value="COD"
                  @update:model-value="dutyCdClick"
                >
                  <template v-slot:prepend-item>
                    <v-list-item title="전체" @click="toggle">
                      <template v-slot:prepend>
                        <v-checkbox-btn
                          v-model="selectAllYn"
                          @update:model-value="selectAllChecked"
                        ></v-checkbox-btn>
                      </template>
                    </v-list-item>
                  </template>
                </VAutocomplete>
              </template>      
            </ILabel>
          </div>
        </v-sheet>
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet width="70%" class="h-auto mr-3">
            <IGridTitle 
              :title="$t('인원 리스트')"
              :button-list="['btnBatchExcept']"
              @click-button="onMainButtonsClick"
            >  
              <template #editors>※등록마감일 이후 수정 필요 시 통합안전교육센터 또는 안전교육담당팀으로 문의바랍니다.※</template>
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
          <v-sheet width="30%" class="pa-0 h-auto">
            <div class="d-flex justify-space-between">
              <IGridTitle class="h-grow" :title="$t('교육이수 리스트')">              
                  <template #editors />
              </IGridTitle>
              <v-sheet class="d-flex justify-end mB-10 align-center slotText">
                {{ deadline }}
              </v-sheet>
            </div>
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
.marginTop {
  margin-top: 10px;
}
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
::v-deep(.v-field__field) {
  overflow-y: auto;
  // overflow-y: hidden;
  max-height: 35px;
}
</style>
