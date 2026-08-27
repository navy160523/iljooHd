<script setup>
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonHiOfficeApproval, commonApprovalList, commonLogExecuteApi, commonPostApprovalApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { isEmpty } from "@/@core/utils"
import ApprovalPopup01 from "./ApprovalPopup01.vue"

defineOptions({
  name: 'popup-ApprovalPopupInApp',
})

const emit = defineEmits(['approvalAppkey', 'result', 'approvalClrLine'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const grdEmp = ref(null)
const grdApprovalLine = ref(null)
const grdFixAppList = ref(null)
const grdCcLine = ref(null)
const grdLine = ref(null)
const tab1 = ref(null)
const tab2 = ref(null)
const approvalPopup01 = ref(null)

const userId = ref(userStore.userId)
const logsStore = useLogsStore()

//조회조건
let searchParams = reactive({
  ORIGIN: '',
  DEPT_CD: '',
  KOR_NM: ''
})

// 팝업으로 호출시 넘겨받는 파라미터
let popupParams = reactive({})

const paramApp = reactive({})

let strZZ_RES_ID = ''

// 임직원 목록
const grdEmpProps = reactive({
  gridViewOption : { 
    edit: { editable: false },     
    stateBar: { visible: false }, 
    display: { selectionStyle : 'rows' },
  },
  keys : ['EMP_NO'],
  field : [
    { fieldName: 'JOB_TIT_NM',  dataType: 'text', width: '80', header: { text: t('직급') } },
    { fieldName: 'KOR_NM',      dataType: 'text', width: '60', header: { text: t('이름') } },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') } },
    { fieldName: 'CMPNY_DIV',   dataType: 'text', visible: false },
    { fieldName: 'EMP_NO',      dataType: 'text', visible: false },
  ],
  columns : [],
})

grdEmpProps.columns = grdEmpProps.field

// 결재자
const grdApprovalLineProps = reactive({
  gridViewOption : { 
    edit: { 
      editable:false,
      //movable:true, 
    },     
    stateBar: { visible: false },
    display: { selectionStyle : 'rows' },
  },
  keys : ['EMP_NO'],
  field : [
    { fieldName: 'JOB_TIT_NM', dataType: 'text',  header: { text: t('직급') } },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') } },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') } },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
  ],
  columns : [],
})

grdApprovalLineProps.columns = grdApprovalLineProps.field

//초기 데이터셋팅
onMounted(() => {

})

// 화면이 다 뜨고 난 뒤 자동으로 조직도 조회
onUpdated(() => {

  // 테스트 용
  // new queryFlowHelper(vm, t)
  //   .setQuery(searchApprovalLine)
  //   .setAfter(afterApprovalLine)
  //   .run()
})

//메뉴버튼
const onButtonsClick = btn => { 
  if (btn.id === 'btnReqApply') {
    new saveFlowHelper(vm, t)
      .setQuery(saveApprovalData)
      .setAfter(hiOfficeApproval)
      .showMessage(false)
      .run()

  }
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 결재선 지정 버튼
const onApprButtonsClick = btn => { 
  if (btn.id === 'btnSelectRemove') {
    btnDel()
  }
  else if (btn.id === 'btnAllRemove') {
    btnDelAll('grdApprovalLine')
  }
  else if (btn.id === 'btnMoveUp') {
    btnUp('grdApprovalLine')
  }
  else if (btn.id === 'btnMoveDown') {
    btnDown('grdApprovalLine')
  }
}

const onButtonsEMPClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdEmp])
      .setQuery(searchDataDept)
      .setAfter(afterSearchDept)
      .showMessage(false)
      .run()
  }
  else if (btn.id === 'btnAddApp') {
    btnInsertApp()
  }
  else if (btn.id === 'btnAddCC') {
    btnInsertCC()
  }
}

const keyupSearch = event => {
  onButtonsEMPClick({ id: 'btnSearch' })
  /*
  if(event.key === 'Enter'){
    onButtonsEMPClick({ id :'btnSearch' })
  }*/
}

// 추가하기 (결재) 버튼
const btnInsertApp = () => { 
  let rowIdx = grdEmp.value.getGridView().getCurrent().dataRow
  let rtnData = grdEmp.value.getDataProvider().getJsonRow(rowIdx)
  let getGrdApprovalLine = null
  let approvalLineValue = 0
  let getGrdFixedlLine = null
  let approvalFixedValue = 0  
  
  // 결재라인 중복 방지  
  if(grdApprovalLine.value){
    getGrdApprovalLine = grdApprovalLine.value.getGridView().getJsonRows()

    console.log('[btnInsertApp] getGrdApprovalLine = ', getGrdApprovalLine)
    
    approvalLineValue = getGrdApprovalLine.filter(obj => {
      return obj.EMP_NO === rtnData.EMP_NO      
    }).length
  }
  
  console.log('[btnInsertApp] approvalLineValue = ', approvalLineValue)

  // 결재탭
  if(approvalLineValue === 0)
    grdApprovalLine.value.getDataProvider().addRow(rtnData)
  else
    Message.err('이미 추가된 결재자입니다.')


}

// 결재, 참조에서 제거 버튼
const btnDel = () => {
  
  let rowIdx = grdApprovalLine.value.getGridView().getCurrent().dataRow
  let rtnData = grdApprovalLine.value.getDataProvider().getJsonRow(rowIdx)
  
  grdApprovalLine.value.deleteRow(rtnData) 
}

// 결재, 참조 그리드 초기화
const btnDelAll = grdName => {  
  if(grdName === 'grdApprovalLine') // 결재 탭
    grdApprovalLine.value.getDataProvider().clearRows()

  if(grdName === 'grdCcLine') // 참조 탭
    grdCcLine.value.getDataProvider().clearRows()
}

// 결재, 참조 그리드 row 위로
const btnUp = grdName => {
  // 결재 탭
  if(grdName === 'grdApprovalLine'){
    let rowIdx = grdApprovalLine.value.getGridView().getCurrent().dataRow
    grdApprovalLine.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
    grdApprovalLine.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
  }
  
  // 참조 탭
  if(grdName === 'grdCcLine') {
    let rowIdx = grdCcLine.value.getGridView().getCurrent().dataRow
    grdCcLine.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
    grdCcLine.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
  }
}

// 결재, 참조 그리드 row 아래로
const btnDown = grdName => {
  // 결재 탭
  if(grdName === 'grdApprovalLine'){
    let rowIdx = grdApprovalLine.value.getGridView().getCurrent().dataRow
    grdApprovalLine.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
    grdApprovalLine.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
  }
  
  // 참조 탭
  if(grdName === 'grdCcLine') {
    let rowIdx = grdCcLine.value.getGridView().getCurrent().dataRow
    grdCcLine.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
    grdCcLine.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
  }
}

// 조회로직
const searchDataDept = () => {

  let param2 = {
    ORIGIN: 'B',
    DEPT_CD: userStore.asgnCd,
    KOR_NM: searchParams.KOR_NM
  }

  return commonSearchApi({ queryId : 'PKG_CSX02_COMMON_ORG_USER_S', param : param2 })

}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const afterSearchDept = async res => {
  grdEmp.value.getDataProvider().setRows(res.ORESULT_CUR)
  
}

const openPopup = param => {
  console.log('popupParam = ', param)
  
  grdApprovalLine.value.getDataProvider().setRows([])

  dialog.value = true

  popupParams = param
  
  //initCodeList()
  initData() 
}

// 임직원 불러오기
const initData = () => {
  new queryFlowHelper(vm, t)
      .setGridList([grdEmp])
      .setQuery(searchDataDept)
      .setAfter(afterSearchDept)
      .showMessage(false)
      .run()
}

const onClose = () => {
  dialog.value = false
}

let formName = ''

const saveApprovalData = async () => {

  if(grdApprovalLine.value.getDataProvider().rowCount === 0){

    Message.err(t('결재선을 지정하세요.'))

    return false
  }

  let saveApprovalParam = []
  let approver = ''
  let listApprover = []

  if (grdApprovalLine.value != null) 
    listApprover = grdApprovalLine.value.getGridView().getJsonRows()  

  console.log('listApprover 1 : ', listApprover)

  if (listApprover != null) {
    for (let i = 0; i < listApprover.length; i++) {
      if (listApprover[i].EMP_NO != null) 
        approver = approver + listApprover[i].EMP_NO + ";"
    }
    approver = approver.substring(0, approver.length - 1)
  }

  if(popupParams.WORK_TYPE === 'S'){
    for(let i = 0 ; i < popupParams.PARAM.length; i++){
      saveApprovalParam.push({
        CMPNY_DIV: popupParams.PARAM[i].CMPNY_DIV,
        WORK_TYPE: popupParams.WORK_TYPE,
        WORK_STANDARD_ID: popupParams.PARAM[i].SRSRM_ID,
        FORM_ID: popupParams.PARAM[i].FORM_ID,
        APPROVER: approver,
        DRAFTER: userStore.userId,
        USER_ID: userStore.userId,
        PATH: popupParams.PARAM[i].PATH
      })
    }
  }else{
    saveApprovalParam.push({
      CMPNY_DIV: popupParams.CMPNY_DIV,
      WORK_TYPE: popupParams.WORK_TYPE,
      WORK_STANDARD_ID: popupParams.WORK_STANDARD_ID,
      FORM_ID: popupParams.FORM_ID,
      APPROVER: approver,
      DRAFTER: userStore.userId,
      USER_ID: userStore.userId,
      PATH: popupParams.PATH
    })
  }

  console.log('save param = ', saveApprovalParam)

  let dialogResult = await vm.$swal({ 
    title: t('결재 상신하시겠습니까?'), 
    showCancelButton: true,
  })
    
  if(!dialogResult.isConfirmed)
    return false

  return commonExecuteApi({
    queryId: 'PKG_CSX02_COMMON_COMM_APPROVAL_REQ_PARTNER',
    list: saveApprovalParam
  })

  /*
  return commonRequest("/hse/common/APPROVAL_SAVE_01", {
    queryId : "APPROVAL_SAVE_01", 
    list : saveApprovalParam,
  })*/
}

const hiOfficeApproval = res => {
  if(res != false)
  {
    Message.info(t('결재를 상신 하였습니다.'))

    emit('result', res)
    // 상신완료후 결재창 닫기
    onClose()
  }
}

const ddd = (val) => {

  let type = val.APPR_TYPE

  // 위험성평가
  if(type == 'R') {

  }
  // 폐지
  else if(type == 'WD') {

  }  
  // 특별감소대책
  else if(type == 'S') {

  }  
}

// 임직원 더블클릭시 결재선 추가
const onCellDblClicked = (grid, clickData) => {
  btnInsertApp()
}

// 결재자 더블 클릭시 제거
const onCellDblClickedApp = (grid, clickData) => {
  btnDel()
}

defineExpose({
  openPopup
})

</script>

<template style="margin:0px;">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="950"
    height="800"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>협력사 결재</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnReqApply', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <!-- <v-sheet class="searchArea d-flex">
            <div class="d-flex">
              <i-input
                v-model="popupParams.TITLE"
                :label="$t('결재 제목')"
                top-label
                label-width="100px"
              />
            </div>
          </v-sheet> -->
          <div class="fill-height d-flex mt-2">
            <!-- <v-sheet width="70%" class="pe-2">  -->
            <v-sheet width="60%" class="pe-2"> 
              <div class="fill-height d-flex mt-2">
                <v-sheet class="pe-2 w-100">
                  <i-input
                    v-model="searchParams.KOR_NM"
                    :label="$t('이름 검색')"
                    top-label
                    label-width="100px"
                    width="200px"
                    @keyup.enter="keyupSearch"
                  />
                  <v-sheet class="h-auto mt-2">
                    <IGridTitle
                      :title="$t('임직원 목록')"
                      :button-list="['btnSearch', 'btnAddApp']"
                      @click-button="onButtonsEMPClick"
                    >
                      <template #editors />
                    </IGridTitle>
                    <RealGrid
                      ref="grdEmp"
                      :grid-view-option="grdEmpProps.gridViewOption" 
                      :fields="grdEmpProps.field" 
                      :columns="grdEmpProps.columns"
                      @onCellDblClicked="onCellDblClicked"
                      width="100%"
                    />
                  </v-sheet>
                </v-sheet>   
              </div>
            </v-sheet>
            <!-- 제일 오른쪽 자리 (결재선 관리 / 결재,참조 / 고정결재선) -->
            <v-sheet width="40%">
              <div style="height: 63px;"/>
              <v-sheet class="h-auto">
                <IGridTitle
                  class="mt-2"
                  :title="$t('결재자')"
                  :button-list="[ 'btnSelectRemove', 'btnAllRemove' ]"
                  @click-button="onApprButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdApprovalLine"
                  :grid-view-option="grdApprovalLineProps.gridViewOption" 
                  :fields="grdApprovalLineProps.field" 
                  :columns="grdApprovalLineProps.columns"
                  @onCellDblClicked="onCellDblClickedApp"
                />                
              </v-sheet>
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

