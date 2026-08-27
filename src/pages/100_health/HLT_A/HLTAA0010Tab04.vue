<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 위험성 결정 MATRIX(탭)
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
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
import HLTAA0010Tab04Popup01 from '@/pages/100_health/HLT_A/HLTAA0010Tab04Popup01.vue'
import HLTAA0010Tab04Popup02 from '@/pages/100_health/HLT_A/HLTAA0010Tab04Popup02.vue'
import HLTAA0010Popup from '@/pages/100_health/HLT_A/HLTAA0010Popup.vue'


const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
const Popup = ref(null)
const critical = ref(true)
const CreatePopup = ref(null) // 추가 팝업
const CopyPopup = ref(null) // 과거 보정기준 가져오기
// const IndividualPopup = ref(null)  // 개별 데이터 이관
// const BatchDataPopup = ref(null) //데이터 일괄 연결
const CalculationPopup = ref(null) // 위험성 산출
const menuTitleM = ref(null)
const menuTitleD = ref(null)

const searchParams = reactive({
  // 공통
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분
  USER_ID: userStore.userId,
  YEAR: String(new Date().getFullYear()),
  ConfirmYn:'N',
  HISTORY_YN:'',
})

/*  공통코드 세팅 */
onMounted(() => {
  // onButtonsClick({ id: "btnSearch" });
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }},
  fields : [ 
    { fieldName: 'STEP_NM', dataType: 'text', header: { text: t('단계') }, width: "10",  editable: false},
    { fieldName: 'CLASSIFICATION_NM', dataType: 'text', header: { text: t('위험성 분류') }, width: "20", editable: false},
    { fieldName: 'RISK_SIZE', dataType: 'text', header: { text: t('위험성 크기(범위)') }, width: "10", editable: false},
    { fieldName: 'DIVISION_NM', dataType: 'text', header: { text: t('위험성 구분(개선수준)') }, width: "20", editable: false},
    { fieldName: 'MANAGEMENT', dataType: "text", header: { text: t("위험성 관리 방안") }, width: "70", editable: false, styleName: "left-column"},
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장') },visible: false, },
    { fieldName: 'ID', dataType: 'text', header: { text: t('순번') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('연도') },visible: false, },
  ],
  columnLayout: [],
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
  } else if (btn.id === 'btnCreate') {
    // console.log('Tab 04 추가')
    let chekedRow = ref([])
    let data = ref([])
    chekedRow = grdMain.value.getGridView().getCheckedRows()
    if(chekedRow.length === 0){

    } else {
      if (chekedRow.length === 1) {
        chekedRow.forEach(val => {
        data = grdMain.value.getDataProvider().getJsonRow(val)
        })
      } else {
        Message.warn(t("수정 하고자 하는 1개의 구분만 선택 하십시요."));
        return
      }
    }
    CreatePopup.value.openPopup(data)
  } else if (btn.id === 'btnDelete') {
    // console.log('Tab 04 삭제')
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

const searchData = () => {
  Promise.all([
      commonSearchApi({
        queryId : "HLTAA0010_SEARCH_04",
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
    }
    onButtonsClickTab02({ id: "ConfirmYN"})
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR);
  })
};

// //  조회
// const searchData = () => {
//   return commonSearchApi({
//     queryId: "HLTAA0010_SEARCH_04",
//     param: searchParams,
//   });
// }

// // 조회 후
// const afterSearch = (res) => {
//   // console.log('res : ', res)
//   onButtonsClickTab02({ id: "ConfirmYN"})
//   grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
// }

// 삭제
const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'HLTAA0010_DELETE_04', list: saveParams })
}

//삭제 후
const afterDelete = () => {
  onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 삭제되었습니다'))
}

const onButtonsClickTab02 = btn => {
  if (btn.id === 'btnCreateCalculationCriteria') {
    // console.log("산출 기준 생성")
    // TargetDeptPopup.value.openPopup(searchParams)
  } else if (btn.id === 'btnGetPastCorrectionCriteria') {
    // console.log("과거 보정 기준")
    CopyPopup.value.openPopup('1')
    // TargetDeptPopup.value.openPopup(searchParams)
  } else if (btn.id === 'btnConfirm') {
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
}

const searchData2 = () => {
  // console.log("ConfirmYN  111")
  let popupParams = {}
  popupParams.CMPNY_DIV =  searchParams.CMPNY_DIV,
  popupParams.YEAR = searchParams.YEAR,
  popupParams.GBN ='4'
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
    // btnGetPastCorrectionCriteria
    menuTitleM.value.disableBtn('btnCreate', true) //저장 비활성화
    menuTitleM.value.disableBtn('btnDelete', true) //삭제 비활성화
    menuTitleD.value.disableBtn('btnGetPastCorrectionCriteria', true) //대상 조직 설정 활성화
  } else {
    menuTitleD.value.setBtnProperty('btnConfirm', 'visible', true)
    menuTitleD.value.setBtnProperty('btnCancelConfirm', 'visible', false)
    menuTitleM.value.disableBtn('btnCreate', false) //저장 활성화
    menuTitleM.value.disableBtn('btnDelete', false) //삭제 활성화
    menuTitleD.value.disableBtn('btnGetPastCorrectionCriteria', false) //대상 조직 설정 활성화
  }

  if (searchParams.HISTORY_YN === 'Y') {
    // 'btnCalculation','btnCancel', 
    menuTitleD.value.disableBtn('btnCancelConfirm', true) //대상 조직 설정 활성화
  } else {
    menuTitleD.value.disableBtn('btnCancelConfirm', false)
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
    GBN :'4',
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
    GBN :'4',
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

const excelUploadCallback = excelData => {  
  let saveList = []
  excelData.map(item => {
    // console.log(item.EMPNUM,', ', item.f_1,', ', item.DECFCD,', ', item.OPINION)
    // if(isEmpty(item.성명) || isEmpty(item.생년월일) || isEmpty(item.의뢰일자)) return
    saveList.push({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      USER_ID: searchParams.USER_ID,
      YEAR: searchParams.YEAR,
      EMP_NO: item.EMPNUM, // 사번
      DIAGNOSIS_CD: item.f_1, // 판정코드
      DISEASE_CD: item.DECFCD, // 질병코드
      DISEASE_NM: item.OPINION, // 질병명
    })
  })
  // console.log('saveList : ', saveList)
  if(saveList.length == 0) return
  commonExecuteApi({ queryId : 'HLTAA0010_SAVE_06', list: saveList }).then(res => {
  //   getData(false)
    onButtonsClick({ id: "btnSearch" })
    Message.success(t('성공적으로 저장되었습니다.'))
  })
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
      :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
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
    <IGridTitle
      ref="menuTitleD"
      :title="$t('위험성 결정 Matrix 리스트')"
      :use-permission="false"
      :button-list="['btnConfirm','btnCancelConfirm','btnGetPastCorrectionCriteria']"
      @click-button="onButtonsClickTab02" 
    />
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
  <HLTAA0010Tab04Popup01 ref="CreatePopup" @closed="onPopupClosedPopUp01"/> <!-- 추가 -->
  <HLTAA0010Tab04Popup02 ref="CopyPopup" @closed="onPopupClosedPopUp01"/> <!-- 추가 -->
  <HLTAA0010Popup ref="CalculationPopup"/> <!-- 위험성 산출 -->
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