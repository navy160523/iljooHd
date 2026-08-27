<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 특수건강진단결과 업로드(탭)
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from "@hiway/stores/common"
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useRoute } from "vue-router"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi, commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from "dayjs";
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { getJsonFromExcel } from '@/utils/excel'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import HLTAA0010Tab05Popup01 from '@/pages/100_health/HLT_A/HLTAA0010Tab05Popup01.vue'
import HLTAA0010Tab05Popup02 from '@/pages/100_health/HLT_A/HLTAA0010Tab05Popup02.vue'
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

const codeList = reactive({
  // Category: [],
  // CATEGORY_MA:[
  //   { COD: '', TXT: '전체' },
  //   { COD: 'A', TXT: '화학물질' },
  //   { COD: 'B', TXT: '소음' },
  //   { COD: 'C', TXT: '근골' },
  // ],
})

/*  공통코드 세팅 */
onMounted(() => {
  // onButtonsClickTab02({ id: "ConfirmYN" });
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }},
  fields : [
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, width: "20",  editable: false},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서명') }, width: "20",  editable: false},
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속과') }, width: "20", editable: false},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, width: "10", editable: false},
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') }, width: "10", editable: false},
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이(만)') }, width: "10", editable: false},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, width: "15", editable: false},
    { fieldName: 'DUTY_NM', dataType: 'text', header: { text: t('단위직무(표준직무)') }, width: "25", editable: false},
    { fieldName: 'DIAGNOSIS_CD', dataType: 'text', header: { text: t('판정코드') }, width: "15", editable: false},
    { fieldName: 'DISEASE_CD', dataType: 'text', header: { text: t('질병코드') }, width: "15", editable: false},
    { fieldName: 'DISEASE_NM', dataType: 'text', header: { text: t('질병명') }, width: "40", editable: false},
    { fieldName: 'EXCLUDED', dataType: "text", header: { text: t("제외처리") }, width: "20",  editable: true, renderer: {type: "check", trueValues: "Y", falseValues: "N" },},
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
    // console.log('Tab 06 삭제')
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
        queryId : "HLTAA0010_SEARCH_06",
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
//     queryId: "HLTAA0010_SEARCH_06",
//     param: searchParams,
//   });
// }

// // 조회 후
// const afterSearch = (res) => {
//   onButtonsClickTab02({ id: "ConfirmYN"})
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
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_06', list: saveParams })
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
  return commonExecuteApi({ queryId : 'HLTAA0010_DELETE_06', list: saveParams })
}

//삭제 후
const afterDelete = () => {
  onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 삭제되었습니다'))
}

const onButtonsClickTab02 = btn => {
  // 'btnUploadSpecialHealthCheckupResults','btnFormDownload'
  if (btn.id === 'btnUploadSpecialHealthCheckupResults') {
    // console.log("특수건강진간결과 업로드")
    const input = document.createElement('input')
    // console.log('input : ', input)
    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
    // CopyPopup.value.openPopup('1')
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
  popupParams.GBN ='7'
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
    menuTitleM.value.disableBtn('btnUpdate', true) //저장 비활성화
    menuTitleM.value.disableBtn('btnDelete', true) //삭제 비활성화
    menuTitleD.value.disableBtn('btnUploadSpecialHealthCheckupResults', true) //대상 조직 설정 활성화
  } else {
    menuTitleD.value.setBtnProperty('btnConfirm', 'visible', true)
    menuTitleD.value.setBtnProperty('btnCancelConfirm', 'visible', false)
    menuTitleM.value.disableBtn('btnUpdate', false) //저장 활성화
    menuTitleM.value.disableBtn('btnDelete', false) //삭제 활성화
    menuTitleD.value.disableBtn('btnUploadSpecialHealthCheckupResults', false) //대상 조직 설정 활성화
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
    GBN :'7',
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
    GBN :'7',
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
    let params = {
      userStore: userStore,
      params: searchParams,
      mgs: '개인정보관련 엑셀 업로드 하였습니다.',
      crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '정보 등록', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  })
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
      :button-list="['btnSearch', 'btnUpdate', 'btnDelete']"
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
      :title="$t('특수 건강진단 결과 리스트')"
      :use-permission="false"
      :button-list="['btnConfirm','btnCancelConfirm','btnUploadSpecialHealthCheckupResults']"
      @click-button="onButtonsClickTab02" 
    />
    <div style="text-align: end">
        <span style="font-size: 15px; font-weight: bold; color: red">
          ※ 특수건강진단결과 업로드시(엑셀) <u>[사번(EMPNUM), 판정코드(f_1), 질병코드(DECFCD), 질병명(OPINION)]</u> 은 반드시 있어야 하는 항목입니다.
        </span>
      </div>
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
  <HLTAA0010Tab05Popup01 ref="CreatePopup" /> <!-- 추가 -->
  <HLTAA0010Tab05Popup02 ref="CopyPopup" /> <!-- 추가 -->
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