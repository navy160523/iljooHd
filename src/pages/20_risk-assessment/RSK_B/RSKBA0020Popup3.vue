
<!-- 
  화면명   : 작업표준/위험성평가 현황 - 위험성평가 수준평가 팝업
  화면개요 : 해당 작업표준의 위험성평가 수준평가를 조회
  생성자 : 2024-11-04 이규호
-->

<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance }                   from 'vue'
import { startDragging, handleDragging, stopDragging }                    from '@/utils/useDrag.js'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n }      from 'vue-i18n'
import { useRouter }    from 'vue-router'
import queryFlowHelper  from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel     from '@/components/ILabel.vue'
import RealGrid   from '@/components/RealGrid.vue'
import Message    from '@hiway/utils/notify'
import dayjs      from 'dayjs'
import _          from 'lodash'

defineOptions({
  name:'20_risk-assessment-RSK_B-RSKBA0020Popup3',
})

// ------------------------- Variable ------------------------- //

const dialog = ref(false)
const router = useRouter()

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t                 //다국어
const menuTitle = ref(null)
const searchArea = ref(null)

const grdMain = ref(null)
const grdSub = ref(null)
const emit = defineEmits(['closePopup'])

let flag       = ref(1)
let mainData   = ref(null)
let subChangeCk = ref(false)

//조회조건
let searchParams = reactive({    
  WORK_STANDARD_ID : '',  
})

let searchParamsSub = reactive({    
  CMPNY_DIV : '',  
  WORK_STANDARD_ID : '',  
  CHECK_ACT_ID : '', 
})

let WORK_STANDARD_MASTER = reactive({ 
  WORK_STANDARD_ID: '',
  WORK_STANDARD_NM: '',
  CU_DATE:'',
})

// 코드리스트
const codeList = reactive({
 
})

//그리드 MAIN 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, display: { selectionStyle: 'rows', useFocusClass: true} },
  keys: ['CHECK_ACT_ID'],
  fields: [ 
    { fieldName: 'ASGN_FULL_NM',  dataType: 'text', width: '250', styleName: 'left-column',   header: { text: t('소속') },  editable : false },    
    { fieldName: 'CHECK_EMP_NM',   dataType: 'text', width: '120', styleName: 'center-column', header: { text: t('평가자') },    editable : false },
    { fieldName: 'CHECK_DATE',    dataType: 'text', width: '100', styleName: 'center-column', header: { text: t('평가일시') },    editable : false },
    { fieldName: 'CONFIRM_YN', dataType: 'text', width: '100', styleName: 'center-column', header: { text: t('확정여부') },    editable : false },    
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '100', header: { text: t('CMPNY_DIV') }, visible : false },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', width: '100', header: { text: t('WORK_STANDARD_ID') }, visible : false },
    { fieldName: 'CHECK_ACT_ID', dataType: 'text', width: '100', header: { text: t('평가ID') }, visible : false },
    { fieldName: 'CHECK_EMP_NO', dataType: 'text', width: '100', header: { text: t('사번') }, visible : false },
    { fieldName: 'INS_USR', dataType: 'text', width: '100', header: { text: t('INS_USR') }, visible : false },
    { fieldName: 'SAVE_YN', dataType: 'text', width: '100', header: { text: t('INS_USR') }, visible : false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 SUB 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: false }, display: { selectionStyle: 'rows', useFocusClass: true} },
  keys: ['CHECK_LIST_ID'],
  fields: [ 
    { fieldName: 'CHECK_LIST_ITEM',  dataType: 'text', width: '450', styleName: 'left-column',   header: { text: t('수준평가 Check List') },  editable : false },    
    {
      fieldName: 'CHECK_Y',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      header: { text: t('O') },
    },
    {
      fieldName: 'CHECK_N',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      header: { text: t('X') },
    },    
    { fieldName: 'CHECK_CMPNY_DIV', dataType: 'text', width: '100', header: { text: t('CHECK_ID') }, visible : false },
    { fieldName: 'CHECK_ID', dataType: 'text', width: '100', header: { text: t('CHECK_ID') }, visible : false },
    { fieldName: 'CHECK_LIST_ID', dataType: 'text', width: '100', header: { text: t('CHECK_LIST_ID') }, visible : false },
    { fieldName: 'CHECK_LIST_SEQ', dataType: 'text', width: '100', header: { text: t('CHECK_LIST_SEQ') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '100', header: { text: t('CMPNY_DIV') }, visible : false },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', width: '100', header: { text: t('CMPNY_DIV') }, visible : false },
    { fieldName: 'CHECK_ACT_ID', dataType: 'text', width: '100', header: { text: t('CHECK_ACT_ID') }, visible : false },
    { fieldName: 'CHECK_YN', dataType: 'text', width: '100', header: { text: t('CHECK_YN') }, visible : false },
    { fieldName: 'REMARK', dataType: 'text', width: '100', header: { text: t('REMARK') }, visible : false },
    { fieldName: 'INS_USR', dataType: 'text', width: '100', header: { text: t('INS_USR') }, visible : false },
  ],
  columns : [],
})

grdSubProps.columns = grdSubProps.fields

// ------------------------- Method ------------------------- //

//코드리스트 셋팅
const initCodeList = () => {
  
}

// 조회
const onSearchMain = () => {
  clearData()

  commonSearchApi({
    queryId: 'RSKBA0020_SEARCH04',
    param: searchParams,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setFocus(0)
  })  
}

const onSearchSub = () => {  
  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  let grdMainData = grdMain.value.getDataProvider().getJsonRow(focusData)

  searchParamsSub.CMPNY_DIV = grdMainData.CMPNY_DIV    
  searchParamsSub.CHECK_ACT_ID = grdMainData.CHECK_ACT_ID

  commonSearchApi({
    queryId: 'RSKBA0020_SEARCH05',
    param: searchParamsSub,
  }).then((res) => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)    
  })
}


//저장관련 로직 시작
const beforeSave = () => {
  let chkCnt = 0
  let grdSubData = grdSub.value.getDataProvider().getJsonRows()

  for (let i = 0; i < grdSubData.length; i++) {
    if(grdSubData[i].CHECK_Y === 'Y' || grdSubData[i].CHECK_N === 'Y') {
      chkCnt++
    }    
  }

  if(chkCnt === 0) {
    Message.warn(t('Check List중 최소 1개이상 체크해야 합니다.'))
    return false
  }

  return true
}

//임시저장
const saveData = () => {
  let saveParam = []  
  //let grdMainData = grdMain.value.getFocusedRowData()
  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  let grdMainData = grdMain.value.getDataProvider().getJsonRow(focusData)
  let saveData = {
      CMPNY_DIV: grdMainData.CMPNY_DIV,
      WORK_STANDARD_ID: grdMainData.WORK_STANDARD_ID,
      CHECK_ACT_ID: grdMainData.CHECK_ACT_ID, 
      CHECK_EMP_NO: grdMainData.CHECK_EMP_NO,
      SAVE_GBN: 'S',      
      INS_USR: userStore.userId,
    }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'RSKBA0020_SAVE02',
    list: saveParam,
  }).then((res) => {
    var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let grdMainData = grdMain.value.getDataProvider().getJsonRow(focusData)

    if(!grdMainData.CHECK_ACT_ID) {
      let sCHECK_ACT_ID = res.list[0].OUT_ACT_ID
      grdMain.value.getDataProvider().setValue(rowIdx, 'CHECK_ACT_ID', sCHECK_ACT_ID)    
    }
    
    saveDataSub()
  })
}

// 평가확정
const confirmData = () => {
  let saveParam = []  
  //let grdMainData = grdMain.value.getFocusedRowData()
  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  let grdMainData = grdMain.value.getDataProvider().getJsonRow(focusData)
  let saveData = {
      CMPNY_DIV: grdMainData.CMPNY_DIV,
      WORK_STANDARD_ID: grdMainData.WORK_STANDARD_ID,
      CHECK_ACT_ID: grdMainData.CHECK_ACT_ID, 
      CHECK_EMP_NO: grdMainData.CHECK_EMP_NO,
      SAVE_GBN: 'C',      
      INS_USR: userStore.userId,
    }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'RSKBA0020_SAVE02',
    list: saveParam,
  }).then((res) => {
    var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let grdMainData = grdMain.value.getDataProvider().getJsonRow(focusData)

    if(!grdMainData.CHECK_ACT_ID) {
      let sCHECK_ACT_ID = res.list[0].OUT_ACT_ID
      grdMain.value.getDataProvider().setValue(rowIdx, 'CHECK_ACT_ID', sCHECK_ACT_ID)    
    }
    
    saveDataSub()
  })
}

const afterSave = () => {
  console.log('afterSave', '')  
  onSearchMain()
}

const saveDataSub = () => {
  let saveParam = []
  
  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  let grdMainData = grdMain.value.getDataProvider().getJsonRow(focusData)
  let grdSubData = grdSub.value.getDataProvider().getJsonRows()

  for (let i = 0; i < grdSubData.length; i++) {
    let saveData = {
      CMPNY_DIV: grdMainData.CMPNY_DIV,
      WORK_STANDARD_ID: grdMainData.WORK_STANDARD_ID,
      CHECK_ACT_ID: grdMainData.CHECK_ACT_ID,       
      CHECK_CMPNY_DIV: grdSubData[i].CHECK_CMPNY_DIV,
      CHECK_ID: grdSubData[i].CHECK_ID,
      CHECK_LIST_ID: grdSubData[i].CHECK_LIST_ID,
      CHECK_YN: grdSubData[i].CHECK_YN,
      REMARK: grdSubData[i].REMARK,      
      INS_USR: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'RSKBA0020_SAVE03',
    list: saveParam,
  })
}
//저장관련 로직 끝

//삭제관련 로직
const deleteData = () => {
  let saveParam = []  
  //let grdMainData = grdMain.value.getFocusedRowData()
  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  let grdMainData = grdMain.value.getDataProvider().getJsonRow(focusData)

  let saveData = {
      CMPNY_DIV: grdMainData.CMPNY_DIV,
      WORK_STANDARD_ID: grdMainData.WORK_STANDARD_ID,
      CHECK_ACT_ID: grdMainData.CHECK_ACT_ID,        
      INS_USR: userStore.userId,
    }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'RSKBA0020_DELETE01',
    list: saveParam,
  })
}
//삭제관련 로직 끝

const modifyCk = async(ck) => {
  if(ck<1 || subChangeCk === false){
    return false
  }
  const result = await vm.$swal({
    title: t("수정중인 데이터가 있습니다. 저장 하시겠습니까?"),
    showCancelButton: true,
  })
  return result.isConfirmed
}

const onGrdMainCurrRowChanged = async (grid, oldIdx, newIdx) => {

  if(newIdx === -1){
    grdMain.value.getDataProvider().setRows()
    //grdSub1.value.getDataProvider().setRows()
    grdSub.value.getDataProvider().setRows()
    return
  }

  //console.log('oldIdx', oldIdx)
  //console.log('newIdx', newIdx)

  if(oldIdx !== newIdx) {

    /* focus 이동 시 저장여부 확인후 저장로직을 실행하고자 하였으나,
       이동 된 focus로 인하여 저장로직이 정상적으로 실행이 안됨
       추후 로직 확인 필요
    let ck = grdSub.value.getGridView().getCheckedRows().length
    
    if (await modifyCk(ck)) {
      console.log('ck', ck)
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .showMessage(false)
      .setAfter(afterSave)
      .run() 
    }*/ 
      
    let row = grdMain.value.getDataProvider().getJsonRow(newIdx)
    //점검자 리스트에서 본인 사번과 일치하지 않으면 저장버튼 비활성화
    if (row.CHECK_EMP_NO !== userStore.empNo) {
      menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장버튼 비활성화
      menuTitle.value.disableBtn('btnStandardEval', true) //평가확정 비활성화
      menuTitle.value.disableBtn('btnDelete', true) //삭제 비활성화
    } else {
      if(row.SAVE_YN === 'N') {
        // 저장 안된 건일 때
        menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장버튼 활성화
        menuTitle.value.disableBtn('btnStandardEval', false) //평가확정 활성화
        menuTitle.value.disableBtn('btnDelete', true) //삭제 비활성화      
      } else {
        if(row.CONFIRM_YN === 'Y') {
          // 확정 건일 때
          menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장버튼 비활성화
          menuTitle.value.disableBtn('btnStandardEval', true) //평가확정 비활성화
          menuTitle.value.disableBtn('btnDelete', true) //삭제 비활성화
        } else {
          // 미 확정 건일 때
          menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장버튼 활성화
          menuTitle.value.disableBtn('btnStandardEval', false) //평가확정 활성화
          menuTitle.value.disableBtn('btnDelete', false) //삭제 활성화
        }
      }    
    }  

    onSearchSub()  
  }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.fieldName === 'CHECK_Y') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_N', 'N')    
  }
  if (clickData.fieldName === 'CHECK_N') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_Y', 'N')
  }

  if(grdSub.value.getDataProvider().getValue(clickData.dataRow, 'CHECK_Y') === 'Y') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_YN', 'Y')    
  } else if(grdSub.value.getDataProvider().getValue(clickData.dataRow, 'CHECK_N') === 'Y') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_YN', 'N')    
  } else {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_YN', '')    
  }

  subChangeCk = true
}

const clearData = () => {
  subChangeCk = false
  if(grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
  if(grdSub.value.getDataProvider().rowCount > 0){ grdSub.value.getDataProvider().clearRows() }
}

// 팝업 호출시
const openPopup = popupParam => {
  dialog.value = true
  clearData()
  searchParams.WORK_STANDARD_ID = popupParam.data.WORK_STANDARD_ID
  searchParamsSub.WORK_STANDARD_ID = popupParam.data.WORK_STANDARD_ID
  
  //console.log(popupParam.data.WORK_STANDARD_ID)
  //console.log(popupParam.data.WORK_STANDARD_NM)
  //console.log(popupParam.data.MIN_DT)
  //console.log(popupParam.data.MAX_DT)

  WORK_STANDARD_MASTER.WORK_STANDARD_NM = popupParam.data.WORK_STANDARD_NM
  WORK_STANDARD_MASTER.WORK_STANDARD_ID = popupParam.data.WORK_STANDARD_ID
  if(popupParam.data.MAX_DT === null) {
    WORK_STANDARD_MASTER.CU_DATE = popupParam.data.MIN_DT
  } else {
    WORK_STANDARD_MASTER.CU_DATE = popupParam.data.MAX_DT
  }

  // 데이터 조회
  onSearchMain()
  /*
  vm.$nextTick(() => {
    grdMain.value.getDataProvider().setRows(tempData)
  })
  */
}

defineExpose({
  openPopup,
})

// ------------------------- Event ------------------------- //

// 버튼 클릭 이벤트
const onButtonsClick = btn => {    

  // 신규평가
  if (btn.id === 'btnNewEval') { 
    grdMain.value.addRow({      
      ASGN_FULL_NM: userStore.asgnFullNm,
      CHECK_EMP_NM: userStore.userName,      
      CMPNY_DIV: userStore.cmpnyDiv,      
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      CHECK_ACT_ID: '',
      CHECK_EMP_NO: userStore.userId,
      INS_USR: userStore.userId,
      SAVE_YN: 'N',
    })

    searchParamsSub.CMPNY_DIV = userStore.cmpnyDiv    
    searchParamsSub.CHECK_ACT_ID = ''    

    onSearchSub()
  }

  //임시저장
  else if (btn.id === 'btnTemporaryStorage') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }

  //평가확정
  else if (btn.id === 'btnStandardEval') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(confirmData)
      .setAfter(() => { 
        emit('closePopup')
        dialog.value = false })
      .run()
  }

  //삭제
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { 
        emit('closePopup')
        dialog.value = false })
      .run()
  }

  // 닫기
  else if (btn.id === 'btnClose') {    
    onClose()
  }
}

const onClose = () => {
  dialog.value = false
}

onMounted(() => {
  initCodeList()  
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="900px"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet 
      height="50"
      color="primarySub"
      class="px-4 d-flex align-center rounded-t-5 cursor-move topBetween"
      @mousedown="startDragging"
    >
      <div>위험성평가 수준평가</div>      
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnTemporaryStorage', 'btnStandardEval', 'btnNewEval', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <div class="d-flex">
              <i-input
                :label="$t('작업표준명')"
                width="350px"
                topLabel
                v-model="WORK_STANDARD_MASTER.WORK_STANDARD_NM"
                :readonly="true"
              />
              <i-input
                :label="$t('표준번호')"
                width="250px"
                topLabel
                v-model="WORK_STANDARD_MASTER.WORK_STANDARD_ID"
                :readonly="true"
              />
              <i-input
                :label="$t('제/개정 일자')"
                width="100px"
                topLabel
                v-model="WORK_STANDARD_MASTER.CU_DATE"
                :readonly="true"
              />
            </div>
          </v-sheet>
          <v-sheet class="mb-5">
            <RealGrid
            ref="grdMain"
            style="height: 130px"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"            
            @onCurrentRowChanged="onGrdMainCurrRowChanged"
          />
          </v-sheet>
          <v-sheet>
            <RealGrid
            ref="grdSub"
            style="height: 370px"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            @onCellClicked="onCellClicked"
          />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
/* div.v-col-md-12.v-col-12 {
  text-align: center;
  background-color: #cdd2d9;
  border-radius: 6px;
  font-size: large;
} */

.v-input--reverse .v-input__slot {
  flex-direction: row-reverse;
  justify-content: flex-end;
  .v-application--is-ltr & {
    .v-input--selection-controls__input {
      margin-right: 0;
      margin-left: 8px;
    }
  }
  .v-application--is-rtl & {
    .v-input--selection-controls__input {
      margin-left: 0;
      margin-right: 8px;
    }
  }
}

.topBetween {
  justify-content: space-between;
}

input#input-33.v-field_input {
  background-color: black;
}
</style>
