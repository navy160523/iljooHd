<script setup>
import { ref, reactive, onMounted, getCurrentInstance, provide } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import causePopup from '@/components/popup/causePopup.vue'
import OZReport from '@/components/OZReport.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'

defineOptions({
  name: '30_safety_SAF_C-SAFCD0010Tab01',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const sAFCD0010Tab01Popup01 = ref(null)
const deptcdPopup = ref(null)
const deptPopup = ref(null) //부서팝업
const empPopup = ref(null) //인원팝업
const sAFCD0010Tab01Image = ref(null) //점검사진,조치사진 image 뷰어
const commonCodePopUpSAF = ref(null)
const userStore = useUserStore()
const checkTargetPopup = ref(null) //점검대상물 팝업
let reportName = []
const reportParam = ref([])
const isMulti = ref(true)
let saveParams = []

const searchParam = reactive({
  USER_IP: '', 
  USER_NAME: '', 
})

const grdMainProps = reactive({
  gridViewOption : {      
    stateBar: { visible: true },
    checkBar: {  visible: true } }, 
    
  keys : [],
  fields : [ 
    { fieldName: 'USER_IP', dataType: 'text', width: '100', header: { text: t('IP') } },
    { fieldName: 'USER_NAME', dataType: 'text', width: '120', header: { text: t('이름') } },
    { fieldName: 'USER_NOTE', dataType: 'text', width: '120', header: { text: t('비고') } },
    { fieldName: 'CHECK_WEB', dataType: 'text', width: '120', header: { text: t('WEB') }, 
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, width: 60 },
    { fieldName: 'CHECK_OUT', dataType: 'text', width: '120', header: { text: t('OUT') }, 
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, width: 60 },
    { fieldName: 'CHECK_MOBILE', dataType: 'text', width: '120', header: { text: t('MOBILE') }, 
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, width: 60 },
    { fieldName: "REGISTRANT_ID", header: { text: t("등록자") }, dataType: "text", editable: false, visible: false },
    { fieldName: "REGISTER_DATE", header: { text: t("등록일자") }, editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime", datetimeFormat: "yyyy-MM-dd", editable: false, visible: false,
    },
    
  ],
  columns : [],
  
})

grdMainProps.columns = grdMainProps.fields 

onMounted(() => {
  onButtonsClick({ id :'btnSearch' })
})

const onButtonsClick = idx => {
  //console.log('idx',idx)
  if (idx.id === 'btnSearch') {
    //console.log('btnsearch')
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  }else if(idx.id === 'btnCreate') {
    addRowData()
  }
  else if(idx.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if(idx.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

/* -------------- 조회 -------------- */
const searchData = () => {
//console.log('searchData')

  return commonSearchApi({
    queryId: 'TSYSAA0020_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)


}

const beforeDelete = () => {
  // 체크된 컬럼 확인 작업
  let rowNum = grdMain.value.getGridView().getCheckedRows(true)

  // 선택한 row 데이터 가져와 saveParams에 넣어줌
  let saveParamArr = []
  for (var i in rowNum) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowNum[i])

    saveParamArr.push(
      {
        USER_IP : data.USER_IP,                
        USER_NAME : data.USER_NAME,     
        USER_NOTE : data.USER_NOTE,     
        CHECK_WEB : data.CHECK_WEB,        
        CHECK_OUT : data.CHECK_OUT,   
        CHECK_MOBILE : data.CHECK_MOBILE,        
        RES_COD : '',               // return 값
        RES_MSG : '',               // return 값
        RES_COL : '',               // return 값
      },
    )
  }
  saveParams = saveParamArr

  return saveParams
}

const deleteData = () => {  
  return commonExecuteApi({ queryId : 'TSYSAA0020_DELETE_01', list: saveParams })
}

const beforeSave = () => {
  return true
}

const addRowData = () => {
  grdMain.value.addRow({})
}


//저장버튼 눌렀을때 실행되는 함수
const saveData = () => {
  let saveParams = []

  const updatedRows = grdMain.value.getDataProvider().getStateRows("updated")
  const createdRows = grdMain.value.getDataProvider().getStateRows("created")

  for (let rowIdx of createdRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  for (let rowIdx of updatedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: "TSYSAA0020_SAVE_01", list: saveParams })
}
</script>


<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="[
          'btnCreate',
          'btnSearch',
          'btnUpdate',
          'btnDelete',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              v-model="searchParam.USER_NAME"
              label-width="50px"
              :label="$t('이름')"
              width="230px"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <IGridTitle :title="$t('IP 현황')" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @on-cell-dbl-clicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>         
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
