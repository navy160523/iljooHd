<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 평가대상 조직관리(탭)
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from "@hiway/stores/common"
import { isEmpty } from '@/@core/utils'
import { useRoute } from "vue-router"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from "dayjs";
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTAA0010Tab01Popup01 from '@/pages/100_health/HLT_A/HLTAA0010Tab01Popup01.vue'
// import HLTAA0010Tab01Popup02 from '@/pages/100_health/HLT_A/HLTAA0010Tab01Popup02.vue'
import HLTAA0010Tab01Popup03 from '@/pages/100_health/HLT_A/HLTAA0010Tab01Popup03.vue'
import HLTAA0010Popup from '@/pages/100_health/HLT_A/HLTAA0010Popup.vue'

const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
const Popup = ref(null)
const critical = ref(true)
const TargetDeptPopup = ref(null) // 대상 조직 설정
// const IndividualPopup = ref(null)  // 개별 데이터 이관
const BatchDataPopup = ref(null) //데이터 일괄 연결
const CalculationPopup = ref(null) // 위험성 산출
const menuTitleM = ref(null)
const menuTitleD = ref(null)

const searchParams = reactive({
  // 공통
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분
  USER_ID: userStore.userId,
  YEAR: String(new Date().getFullYear()),
  ConfirmYn:'N',
  HISTORY_YN:'N',
})

/*  공통코드 세팅 */
onMounted(() => {
  // onButtonsClick({ id: "btnSearch" });
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }},
  fields : [ 
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('연도') }, width: "20",  editable: false},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, width: "20", editable: false},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서명') }, width: "20", editable: false},
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사명') }, width: "20", editable: false},
    { fieldName: 'WEM_YEAR', dataType: "text", header: { text: t("연도") }, width: "20", editable: false},
    { fieldName: 'WEM_HALF_NM', dataType: "text", header: { text: t("반기") }, width: "20", editable: false},
    { fieldName: 'WEM_COUNT', dataType: "text", header: { text: t("측정건수") }, width: "20", editable: false},
    { fieldName: 'SHE_YEAR', dataType: "text", header: { text: t("연도") }, width: "20", editable: false},
    // { fieldName: 'SHE_UOBSERVATION', dataType: "text", header: { text: t("요관찰(C1)") }, width: "25", editable: false},
    { fieldName: 'SHE_SFINDINGS', dataType: "text", header: { text: t("유소견(D1)") }, width: "20", editable: false},
    { fieldName: 'MHF_YEAR', dataType: "text", header: { text: t("연도") }, width: "25", editable: false},
    { fieldName: 'MHF_RCOUNT', dataType: "text", header: { text: t("정기건수") }, width: "20", editable: false},
    { fieldName: 'MHF_LTYCOUNT', dataType: "text", header: { text: t("최근3년 수시") }, width: "20", editable: false},
    { fieldName: 'CONNECTED', dataType: "text", header: { text: t("데이터 연결") }, width: "20", editable: false},
    // { fieldName: 'TRANSFER', dataType: "text", header: { text: t("이관 여부") }, width: "20", editable: false},
    { fieldName: 'EXCLUDED', dataType: "text", header: { text: t("제외처리") }, width: "20",  editable: true, renderer: {type: "check", trueValues: "Y", falseValues: "N" },},
    { fieldName: 'REMARKS', dataType: "text", header: { text: t("비고") }, width: "50", editable: false},
    // 안보이는거
    { fieldName: 'ID', dataType: 'text', header: { text: t('순번') },visible: false, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서명코드') },visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('협력사명코드') },visible: false, },
    { fieldName: 'WEM_HALF', dataType: 'text', header: { text: t('반기코드') },visible: false, },
    { fieldName: 'MHF_YEAR_F', dataType: 'text', header: { text: t('근골_F') },visible: false, },
    { fieldName: 'MHF_YEAR_T', dataType: 'text', header: { text: t('근골_T') },visible: false, },

  ],
  columnLayout: [
    'YEAR',
    'BSNS_NM',
    'DEPT_NM',
    'ASGN_NM',
    {
      name: '작업환경측정',
      items: [ 'WEM_YEAR', 'WEM_HALF_NM', 'WEM_COUNT'],
      header: { text: t('작업환경측정') },
    },
    {
      name: '특수건강진단 데이터',
      // items: [ 'SHE_YEAR', 'SHE_UOBSERVATION', 'SHE_SFINDINGS'],
      items: [ 'SHE_YEAR', 'SHE_SFINDINGS'],
      header: { text: t('특수건강진단 데이터') },
    },
    {
      name: '근골유해인조사',
      items: [ 'MHF_YEAR', 'MHF_RCOUNT', 'MHF_LTYCOUNT'],
      header: { text: t('근골유해인조사') },
    },
    'CONNECTED',
    // 'TRANSFER',
    'EXCLUDED',
    'REMARKS',
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    searchData()
    // console.log('Tab 01 조회')
    // new queryFlowHelper(vm, t)
    // .setQuery(searchData)
    // .setAfter(afterSearch)
    // .run()
  } else if (btn.id === 'btnUpdate') {
    // console.log('Tab 01 저장')
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    // console.log('Tab 01 삭제')
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnCalculationOfRisk') {
    // console.log("위험성 산출123")
    let saveParams = []
    const dataProvider = grdMain.value.getDataProvider();
    const rowCount = dataProvider.getRowCount();
    for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
      let data = dataProvider.getJsonRow(rowIdx);
      // console.log('data.EXCLUDED : ', data.EXCLUDED)
      if (data.EXCLUDED !== 'Y') {
        data.USER_ID = searchParams.USER_ID;
        saveParams.push(data);
      }
    }
    CalculationPopup.value.openPopup(saveParams)
  }
}

const searchData = () => {
  Promise.all([
      commonSearchApi({
        queryId : "HLTAA0010_SEARCH_01",
        param : searchParams
      }),
      commonSearchApi({
        queryId : "HLTAA0010_SEARCH_09",
        param : searchParams
      })
  ]).then(async (res) => {
    // console.log('전' , res[0].ORESULT_CUR)
    const list = res[0].ORESULT_CUR
    const list2 = res[1].ORESULT_CUR

    // console.log('list2.length : ' , list2.length)
    if (list2.length > 0) {
      searchParams.HISTORY_YN = list2[0].HISTORY_YN
    } else {
      searchParams.HISTORY_YN = 'N'
    }
    onButtonsClickTab01({ id: "ConfirmYN"})
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR);
  })
};

//  조회
// const searchData = () => {
//   return commonSearchApi({
//     queryId: "HLTAA0010_SEARCH_01",
//     param: searchParams,
//   });
// }

// 조회 후
// const afterSearch = (res) => {
//   // console.log('res : ', res)
//   onButtonsClickTab01({ id: "ConfirmYN"})
//   grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
// }

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = searchParams.USER_ID;
    saveParams.push(data)
  }
  // console.log('saveParams : ', saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_01', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 저장되었습니다'))
}

// 삭제
const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'HLTAA0010_DELETE_01', list: saveParams })
}

//삭제 후
const afterDelete = () => {
  onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 삭제되었습니다'))
}

const onButtonsClickTab01 = btn => {
  if (btn.id === 'btnTargetOrganizationSettings') {
    // console.log("대상 조직 설정")
    TargetDeptPopup.value.openPopup(searchParams)
  } else if (btn.id === 'btnBatchDataConnection') {
    // console.log("데이터 일괄 연결")
    let saveParams = []
    const dataProvider = grdMain.value.getDataProvider();
    const rowCount = dataProvider.getRowCount();
    for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
      let data = dataProvider.getJsonRow(rowIdx);
      data.USER_ID = searchParams.USER_ID;
      saveParams.push(data);
    }
    BatchDataPopup.value.openPopup(saveParams)
  }  else if (btn.id === 'btnConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave2)
      .setQuery(saveData2)
      .setAfter(afterSaveData2)
      .run()
  } else if (btn.id === 'btnCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave3)
      .setQuery(saveData3)
      .setAfter(afterSaveData3)
      .run()
  } else if (btn.id === 'ConfirmYN') {
    // console.log('음~~~~~~~~~~~~!!!!!!!!!!!')
    new queryFlowHelper(vm, t)
    .setQuery(searchData2)
    .setAfter(afterSearch2)
    .showMessage(false)
    .run()
  }
  // else if (btn.id === 'btnIndividualDataMigration') {
  //   // console.log("개별 데이터 이관")
  //   IndividualPopup.value.openPopup(searchParams)
  // } 
}

const addDept = (dept) => {
  // // 이미 같은 데이터가 있을 시 return
  if(!isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1).filter(item => item.DEPT_CD === dept.ASGN_CD))) {
    return TargetDeptPopup.value.setErrorMsg(dept.ASGN_NM)
  }
  grdMain.value.getGridView().filterPanel.clearInput()
  // console.log(dept.ORGN_DIV)
  if (dept.ORGN_DIV === 'A') {
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParams.YEAR,
      BSNS_CD: dept.BSNS_CD,
      BSNS_NM: dept.BSNS_NM,
      DEPT_CD: dept.DEPT_CD,
      DEPT_NM: dept.DEPT_NM,
      ASGN_CD: '',
      ASGN_NM: '',
      // ORGN_DIV: dept.ORGN_DIV,
    }, false)
  } else {
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParams.YEAR,
      BSNS_CD: dept.BSNS_CD,
      BSNS_NM: dept.BSNS_NM,
      DEPT_CD: dept.DEPT_CD,
      DEPT_NM: dept.DEPT_NM,
      ASGN_CD: dept.ASGN_CD,
      ASGN_NM: dept.ASGN_NM,
      // ORGN_DIV: dept.ORGN_DIV,
    }, false)
  }
}


const searchData2 = () => {
  // console.log("ConfirmYN  111")
  let popupParams = {}
  popupParams.CMPNY_DIV =  searchParams.CMPNY_DIV,
  popupParams.YEAR = searchParams.YEAR,
  popupParams.GBN ='1'
  // console.log('popupParams : ' , popupParams)
  return commonSearchApi({
    queryId: "HLTAA0010_SEARCH_08",
    param: popupParams,
  });
}

// 조회 후
const afterSearch2 = (res) => {
  // console.log("ConfirmYN  222")
  // console.log('searchParams.ConfirmYn : ', searchParams.ConfirmYn)
  if(res.ORESULT_CUR.length === 0) {
    searchParams.ConfirmYn = 'N'
  } else {
    // if(res.ORESULT_CUR[0].CONFIRM_YN === 'Y') {
      searchParams.ConfirmYn = res.ORESULT_CUR[0].CONFIRM_YN
    // } else {
    //   searchParams.ConfirmYn = 'N'
    // }
  }

  // console.log('searchParams.ConfirmYn 222 : ', searchParams.ConfirmYn)
  if (searchParams.ConfirmYn === 'Y') {
    menuTitleD.value.setBtnProperty('btnConfirm', 'visible', false)
    menuTitleD.value.setBtnProperty('btnCancelConfirm', 'visible', true)
    // 'btnUpdate', 'btnDelete'
    // 'btnTargetOrganizationSettings','btnIndividualDataMigration','btnBatchDataConnection'
    menuTitleM.value.disableBtn('btnUpdate', true) //저장 비활성화
    menuTitleM.value.disableBtn('btnDelete', true) //삭제 비활성화
    menuTitleD.value.disableBtn('btnTargetOrganizationSettings', true) //대상 조직 설정 활성화
    // menuTitleD.value.disableBtn('btnIndividualDataMigration', true) //개별 데이터 이관 활성화
    menuTitleD.value.disableBtn('btnBatchDataConnection', true) //데이터 일괄 연결 활성화
  } else {
    menuTitleD.value.setBtnProperty('btnConfirm', 'visible', true)
    menuTitleD.value.setBtnProperty('btnCancelConfirm', 'visible', false)
    menuTitleM.value.disableBtn('btnUpdate', false) //저장 활성화
    menuTitleM.value.disableBtn('btnDelete', false) //삭제 활성화
    menuTitleD.value.disableBtn('btnTargetOrganizationSettings', false) //대상 조직 설정 활성화
    // menuTitleD.value.disableBtn('btnIndividualDataMigration', false) //개별 데이터 이관 활성화
    menuTitleD.value.disableBtn('btnBatchDataConnection', false) //데이터 일괄 연결 활성화
  }

  // console.log('searchParams.HISTORY_YN : ' + searchParams.HISTORY_YN)

  if (searchParams.HISTORY_YN === 'Y') {
    // 'btnCalculation','btnCancel', 
    menuTitleD.value.disableBtn('btnCancelConfirm', true) //대상 조직 설정 활성화
    nextTick(() => {
    const btn = document.getElementById('btnCalculationOfRisk')
    if (btn) {
      btn.style.setProperty('background-color', 'green', 'important')
      btn.style.setProperty('color', '#fff', 'important')
    }
  })
  } else {
    menuTitleD.value.disableBtn('btnCancelConfirm', false)
    nextTick(() => {
    const btn = document.getElementById('btnCalculationOfRisk')
    if (btn) {
      btn.style.removeProperty('background-color')
      btn.style.removeProperty('color')
    }
  })
  }
}

// 저장 전
const beforeSave2 = () => {
// const rowCount = grdMain.gridView.getItemCount();
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();
  // console.log("조회된 전체 row 수:", rowCount);
  if(rowCount === 0 ){
    Message.warn(t('확정 하고자 하는 연도의 정보를 업로드 또는 조회 하십시요.'))
    return false
  }
  return true
}

// 저장
const saveData2 = () => {
  let saveParams = [{
    CMPNY_DIV : searchParams.CMPNY_DIV,
    YEAR : searchParams.YEAR,
    USER_ID : searchParams.USER_ID,
    GBN :'1',
    CONFIRM_YN : 'Y'
  }]
  // console.log('saveParams : ' , saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_08', list: saveParams })
}

// 저장 후
const afterSaveData2 = () => {
  onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 확정 되었습니다'))
}

// 저장 전
const beforeSave3 = () => {
// const rowCount = grdMain.gridView.getItemCount();
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();
  // console.log("조회된 전체 row 수:", rowCount);
  if(rowCount === 0 ){
    Message.warn(t('확정취소 하고자 하는 연도의 정보를 조회 하십시요.'))
  }
  return true
}

const saveData3 = () => {
  let saveParams = [{
    CMPNY_DIV : searchParams.CMPNY_DIV,
    YEAR : searchParams.YEAR,
    USER_ID : searchParams.USER_ID,
    GBN :'1',
    CONFIRM_YN : 'N'
  }]
  // console.log('saveParams : ' , saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_08', list: saveParams })
}

// 저장 후
const afterSaveData3 = () => {
  onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 확정 취소되었습니다'))
}


const onPopupClosedPopUp01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  onButtonsClick({ id: "btnSearch" })
})

defineExpose({
  onButtonsClick,
})
</script>

<template>
<div class="d-flex flex-column fill-height">
    <IGridTitle
      ref="menuTitleM"
      :use-permission="false"
      :button-list="['btnCalculationOfRisk', 'btnSearch', 'btnUpdate', 'btnDelete']"
      @click-button="onButtonsClick" 
    />
    <v-sheet class="searchArea d-flex">
      <i-select
        :label="$t('기준년도')"  
        v-model="searchParams.YEAR"
        width="200px"
        type="YEAR"
        margin="10px"
      />
    </v-sheet>
      <!-- menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)                // 확정버튼 숨기기 -->
    <IGridTitle
      ref="menuTitleD"
      :title="$t('대상 조직 List')"
      :use-permission="false"
      :button-list="['btnConfirm','btnCancelConfirm','btnTargetOrganizationSettings','btnBatchDataConnection']"
      @click-button="onButtonsClickTab01" 
    />
    <!-- 'btnIndividualDataMigration', -->
    <v-sheet class="h-auto">
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        :column-layout="grdMainProps.columnLayout"
      />
    </v-sheet>
  </div>
  <!-- 팝업존 -->
  <HLTAA0010Tab01Popup01 ref="TargetDeptPopup" @add-dept="addDept"/> <!-- 대상 조직 설정 -->
  <!-- <HLTAA0010Tab01Popup02 ref="IndividualPopup"/> 개별 데이터 이관 삭제 (데이터 이관은 권장 하지 않음 DT팀)-->
  <HLTAA0010Tab01Popup03 ref="BatchDataPopup" @closed="onPopupClosedPopUp01"/> <!-- 데이터 일괄 연결 -->
  <HLTAA0010Popup ref="CalculationPopup" @closed="onPopupClosedPopUp01"/> <!-- 위험성 산출 -->
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>