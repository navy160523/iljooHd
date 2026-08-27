<!--
  화면명 : 교육이수확인스티커 발행/현황
  화면개요 : 교육이수확인스티커 발행/현황 조회 발행 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
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
import IButtonList from '@/components/IButtonList.vue'

defineOptions({
  name: '60_edu-EDU_A-EDUAA0080',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const grdSub = ref(null)
//const searchArea = ref(null)
const empPopup = ref(null) //인원 조회 POP
const seqNum = ref(null)
const mainGrdIdx = ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  DIVISION : ' ',
  CURR_ID : '',
  EDU_FROM_NM : dayjs(new Date().setMonth(new Date().getMonth() - 1)).format('YYYY-MM-DD'),
  EDU_TO_NM : dayjs(new Date()).format('YYYY-MM-DD'),
  EDU_FROM : '',
  EDU_TO : '',
  ORGN_CD : '',
  ORGN_NM : '',
  ASGN_CD : '',
  STICKER_YN : '',
  TARGET_ID : '',
  TARGET_NM : '',
  WORK_CD : '',
})

// const searchParams = reactive({
//   CMPNY_DIV : userStore.cmpnyDiv,
//   DIVISION : searchParams.DIVISION,
//   CURR_ID : searchParams.CURR_ID,
//   EDU_FROM : searchParams.EDU_FROM,
//   EDU_TO : searchParams.EDU_TO,
//   EDUTIME_SERIAL : '',
//   ORGN_CD : searchParams.ORGN_CD,
//   ASGN_CD : '',
//   STICKER_YN : '',
//   SCHEDULE_ID : '',
//   TARGET_ID : '',
// })

//메인 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  keys : ['DIVISION', 'CURR_ID', 'EDU_FROM', 'EDU_TO', 'ORGN_CD', 'ASGN_CD', 'STICKER_YN', 'TARGET_ID'],
  fields : [ 
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, mergeRule: { "criteria": "value" }, editable:false },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, mergeRule: { "criteria": "value" }, editable:false, styleName:"left-column" },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('대상자') }, mergeRule: { "criteria": "value" }, editable: false, styleName:"left-column" },
    { fieldName: 'MORGN_NM', dataType: 'text', header: { text: t('주관부서') }, editable: false, styleName:"left-column" },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') }, editable: false },
    { fieldName: 'EDU_CNT', dataType: 'text', width:"50", header: { text: t('이수자(명)') }, editable: false, styleName:"right-column"  },
    { fieldName: 'STICKER_CNT', dataType: 'text', width:"50", header: { text: t('발행자(명)') }, editable: false, styleName:"right-column"  },


    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('회사구분') } },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', visible:false, header: { text: t('SCHEDULE_ID') } },
    { fieldName: 'CURR_ID', dataType: 'text', visible:false, header: { text: t('CURR_ID') } },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', visible:false, header: { text: t('EDUTIME_SERIAL') } },
    { fieldName: 'TARGET_ID', dataType: 'text', visible:false, header: { text: t('TARGET_ID') } },
    { fieldName: 'YEAR', dataType: 'text', visible:false, header: { text: t('YEAR') } },
    { fieldName: 'ORGN_CD', dataType: 'text', visible:false, header: { text: t('ORGN_CD') } },
    { fieldName: 'ASGN_CD', dataType: 'text', visible:false, header: { text: t('ASGN_CD') } },
    { fieldName: 'STICKER_YN', dataType: 'text', visible:false, header: { text: t('STICKER_YN') } },
    { fieldName: 'EDU_FROM', dataType: 'text', visible:false, header: { text: t('EDU_FROM') } },
    { fieldName: 'EDU_TO', dataType: 'text', visible:false, header: { text: t('EDU_TO') } },
  ],
  columns: [],
})

//디테일 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar : { visible:false } }, 
  fields : [ 
    { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('소속') }, editable:false, styleName:"left-column" },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자 ID') }, editable:false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable:false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable:false, styleName:"left-column" },
    { fieldName: 'STICKER_YN', dataType: 'text', header: { text: t('발행여부') }, editable:false, lookupDisplay: true,
      values: ["Y", "N"], labels: ["O", "X"] },
    { fieldName: 'WORK_NO', dataType: 'text', header: { text: t('호선/프로젝트명') }, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, required: true, requiredMessage: '호선/프로젝트명은 필수입니다.',
      styleName: 'editable_column-left' },
    { fieldName: 'STICKER_ID', dataType: 'number', numberFormat: "#,##0", header: { text: t('발행번호') },
      editor: { ignoreCharacters: "ㄱ-힣A-Za-z~!@#$%^&*()_+|<>?:{}", maxLength: 5 }, styleName: 'editable_column' },
    { fieldName: 'STICKER_DATE', dataType: 'text', header: { text: t('발행일자') }, editable:false },
    { fieldName: 'CANCEL', dataType: 'text', header: { text: t('발행취소') }, editable:false,
      renderer:{ type:"button" } },

    //사용안함
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('회사구분') } },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', visible:false, header: { text: t('직위코드') }, editable:false },
    { fieldName: 'EMP_NO', dataType: 'text', visible:false, header: { text: t('사번/ID') }, editable:false },
    { fieldName: 'YEAR', dataType: 'text', visible:false, header: { text: t('YEAR') } },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', visible:false, header: { text: t('SCHEDULE_ID') } },
    { fieldName: 'SERIAL', dataType: 'text', visible:false, header: { text: t('SERIAL') } },
  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const codeList = reactive({
  DIVISION : [],
  CURR_ID : [],
  STICKER_YN : [],
  WORK_CD : [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'),
    getCodeList('HHID220'),
    commonSearchApi({ queryId : 'EDUAA0080_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv } } ),
  ]).then(res => {
    //구분 콤보박스
    codeList.DIVISION = res[0].ORESULT_CUR
    codeList.DIVISION.unshift({ TXT:"전체", COD:"" })
    searchParams.DIVISION = codeList.DIVISION[0].COD

    //교육명 콤보박스
    codeList.STICKER_YN = res[1].ORESULT_CUR
    codeList.STICKER_YN.unshift({ TXT: "전체", COD: "" })
    searchParams.STICKER_YN = codeList.STICKER_YN[0].COD

    //호선/프로젝트명
    codeList.WORK_CD = res[2].ORESULT_CUR
    grdSub.value.setBindingColumn("WORK_NO", codeList.WORK_CD, "WORK_NO", "WORK_NM")

    //그리드 컬럼[분류]
    grdMain.value.setBindingColumn("DIVISION", codeList.DIVISION, "COD", "TXT")
  })
}

// 구분이 바뀌면 구분에 따른 교육명 데이터 가져옴
watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList.CURR_ID = res.ORESULT_CUR
      codeList.CURR_ID.unshift({ TXT:"전체", COD:"" })
      searchParams.CURR_ID =codeList.CURR_ID[0].COD
    })
})

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = () => {//조회
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    //.setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}


//그룹 목록 로우 변경 이벤트 (디테일 그리드 조회)
const rowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx === -1){
    return
  }
  mainGrdIdx.value = newIdx
  let grdData = grdMain.value.getDataProvider().getJsonRow(newIdx)
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_03', param: grdData }).then( res => {
    for(let i = 0; i < res.ORESULT_CUR.length; i++){
      if(res.ORESULT_CUR[i].STICKER_YN !== 'Y'){
        res.ORESULT_CUR[i].CANCEL = null
      }
    }
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)

  })

}

// //기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > searchParams.EDU_TO_NM){
    searchParams.EDU_TO_NM = searchParams.EDU_FROM_NM
  }
}

// //기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.EDU_FROM_NM){
    searchParams.EDU_FROM_NM = searchParams.EDU_TO_NM
  }
}



//관리부서 조회 팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv, 
    ASGN_NM : searchParams.ORGN_NM,
    HSE_SYS : 'N',
  })
}

//관리부서 팝업에서 선택한 데이터 바인딩
const onDeptSelected = item => {
  searchParams.ORGN_CD = item.ASGN_CD
  searchParams.ORGN_NM = item.ASGN_SHRT_NM
}

//팝업 오픈
const openEmpPopup = async () => {
  empPopup.value.openPopup({ EMP_NM : searchParams.TARGET_NM })
}

//강사명을 선택했을 때 실행되는 이벤트
const onEmpSelected = row => {
  searchParams.TARGET_ID = row.EMP_NO
  searchParams.TARGET_NM = row.EMP_NM
}

//관리부서 값 입력 시 발생 이벤트
const inputORGN = () => {
  searchParams.ORGN_CD = ''
}

//이수자 값 입력 시 발생 이벤트
const inputTARGET = () => {
  searchParams.TARGET_ID = ''
}

//호선/프로젝트명 일괄입력
const btnBatchInput = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('일괄입력할 데이터를 선택해 주세요.'))
  }
  for(let i = 0; i < checkedRows.length; i++){
    //setVlaue(row, field, value)
    grdSub.value.getDataProvider().setValue(checkedRows[i], 5, searchParams.WORK_CD )
  }

}

// 취소버튼 누를 경우
const cancelBtnClick = (grid, index, clickData) => {
  let saveData = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
  commonExecuteApi({ queryId : 'EDUAA0080_SAVE_02', list: [saveData] }).then(() => {
    onButtonsClick()
  })

}

const editChange = (grid, index, value) => {
  if(index.fieldName === 'WORK_NO'){
    document.addEventListener("keydown", e => {
      if(e.key === 'Backspace'){
        grdSub.value.getDataProvider().setValue(index.dataRow, 'WORK_NO', '')
      }
    })
    
  }
}


//순차입력, 발행 버튼
const btnSub = btn => {
  //순차입력
  if(btn.id === 'btnSeqInput'){
    let seqNumCopy = seqNum.value
    if(seqNumCopy === null || seqNumCopy === ''){
      Message.warn(t('순차입력할 숫자를 입력해 주세요.'))

      return
    }
    if(seqNumCopy <= 0){
      Message.warn(t('발행 시작번호는 1부터 가능합니다'))

      return
    }
    for(let i = 0; i < grdSub.value.getDataProvider().getRows().length; i++){
      let stickerYn = grdSub.value.getDataProvider().getValue(i, 'STICKER_YN')
      if(stickerYn === null || stickerYn === 'N'){
        grdSub.value.getDataProvider().setValue(i, 6, seqNumCopy++ )
        grdSub.value.getGridView().checkRow(i, true)
      }
    }
  //발행
  } else if(btn.id === 'btnPublish'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }

}

//발행 시작번호 입력 이벤트
const inputNum = () => {
  seqNum.value = seqNum.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}]/g, '')
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  grdSub.value.getGridView().setAllCheck(false)
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//교육현황 리스트 조회
const searchData = idx => {
  searchParams.EDU_FROM = dayjs(searchParams.EDU_FROM_NM).format('YYYYMMDD')
  searchParams.EDU_TO = dayjs(searchParams.EDU_TO_NM).format('YYYYMMDD')

  return commonSearchApi({ queryId : 'EDUAA0080_SEARCH_02', param: searchParams })
}


//교육현황 리스트 조회 후
const afterSearch = res => {
  if(res.ORESULT_CUR.length === 0){
    grdSub.value.getDataProvider().setRows([])
  }
  for(let i = 0; i < res.ORESULT_CUR.length; i++){
    res.ORESULT_CUR[i].ASGN_CD = searchParams.ASGN_CD
    res.ORESULT_CUR[i].ORGN_CD = searchParams.ORGN_CD
    res.ORESULT_CUR[i].STICKER_YN = searchParams.STICKER_YN
    res.ORESULT_CUR[i].EDU_FROM = searchParams.EDU_FROM
    res.ORESULT_CUR[i].EDU_TO = searchParams.EDU_TO
    res.ORESULT_CUR[i].TARGET_ID = searchParams.TARGET_ID
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getGridView().setAllCheck(false)
}




//*****************************************조회 영역(종료)***********************************************************/
//********************************************저장 영역**************************************************************/

//저장 전 유효성 검사
const beforeSave = () => {
  let result = true
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))

    result = false
  }

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  saveParams.forEach(val => {
    if(!val.WORK_NO){
      Message.warn(t('호선/프로젝트명은 필수 입력입니다.'))

      result = false
    }
  })

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if(data.STICKER_ID <= 0){
      Message.warn(t('발행 번호는 1부터 가능합니다'))

      result = false
    }
    if(!data.STICKER_ID){
      Message.warn(t('발행번호는 필수입니다.'))

      result = false
    }

  }

  return result
}

//저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    data.UNIT_CODE = ''
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId : 'EDUAA0080_SAVE_01', list: saveParams })
}

//저장 후 재조회
const afterSave = () => {
  grdSub.value.getGridView().setAllCheck(false)
  onButtonsClick()
}

//*****************************************저장 영역(종료)***********************************************************/

onMounted(() => {
  initCodeList()
  onButtonsClick()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- 조회조건 -->
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
        다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('구분')"
            v-model="searchParams.DIVISION"
            :items="codeList.DIVISION"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh"
            width="200px"
          />
          <i-select
            :label="$t('교육명')"
            v-model="searchParams.CURR_ID"
            :items="codeList.CURR_ID"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh"
            width="250px"
          />
          <i-input labelWidth="25px" width="218px" 
            :label="$t('기간')" type="date"
            v-model="searchParams.EDU_FROM_NM"
            @focusout="dateFrChanged"
            @update:model-value="gridRefresh"
            margin="10px"
          />
          <i-input width="190px"
            :label="$t('-')" type="date"
            v-model="searchParams.EDU_TO_NM"
            @focusout="dateToChanged"
            @update:model-value="gridRefresh"
          />
          <i-input
            :label="$t('관리부서')"
            v-model="searchParams.ORGN_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openDeptPopup"
            @keydown.enter="e => {openDeptPopup()}"
            @input="inputORGN"
            @update:model-value="gridRefresh"
            width="250px"
          />
          <i-input
            :label="$t('이수자')"
            v-model="searchParams.TARGET_NM" 
            append-inner-icon="mdi-magnify" 
            @click:appendInner="openEmpPopup"
            @keydown.enter="e => {openEmpPopup()}"
            @input="inputTARGET"
            @update:model-value="gridRefresh"
            width="200px"
          />
          <!--현업 요청으로 인해 기능 비활성화 2024.06.06-->
          <!-- <i-select
            :label="$t('발행구분')"
            v-model="searchParams.STICKER_YN"
            :items="codeList.STICKER_YN"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh"
            width="200px"
          /> -->
        </v-sheet>
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet width="50%" class="h-auto mr-3">
            <IGridTitle 
              :title="$t('교육현황 리스트')"
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
          <v-sheet width="50%" class="pa-0 h-auto">
            <div class="d-flex justify-space-between mB-5">
              <!-- 그리드 타읻틀쪽에 추가 동작 작업을 추가 하기 위해서 
              <div class="d-flex"> -> <div class="d-flex justify-space-between mB-5"> 해야하고
              <IGridTitle 에는 class="mb-0 mr-2 h-grow" 를 추가 해야 한다.
              -->
              <IGridTitle class="mb-0 mr-2 h-grow"
                :title="$t('교육이수 리스트')"
                :button-list="['btnPublish']"
                @click-button="btnSub"
              >
                <template #editors />
              </IGridTitle>
              <v-sheet class="d-flex justify-end" width="650px">
                <i-select
                  :label="$t('호선/프로젝트명')"
                  label-width="100px"
                  v-model="searchParams.WORK_CD"
                  :items="codeList.WORK_CD"
                  item-title="WORK_NM"
                  item-value="WORK_NO"
                  width="300px"
                  margin="0px"
                />
                <IButtonList class="mr-2"
                  :button-list="['btnBatchInput']"
                  @click-button="btnBatchInput"
                />
                <i-input
                  :label="$t('발행 시작번호')"
                  label-width="80px"
                  v-model="seqNum"
                  maxlength="5"
                  oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}]/, '' );"
                  @input="inputNum"
                  width="180px"
                  margin="0px"
                />
                <IButtonList
                  :button-list="['btnSeqInput']"
                  @click-button="btnSub"
                />
            </v-sheet>
            </div>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onCellItemClicked = cancelBtnClick
              @onEditChange="editChange"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" /> 
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
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
