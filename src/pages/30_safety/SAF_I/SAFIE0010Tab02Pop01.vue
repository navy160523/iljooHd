<!--
  화면명 : 협력사 안전관리자 인원검색(팝업)
  화면개요 : 협력사 안전관리자 인원 조회하고 데이터를 선택하여 대상자 목록 그리드에 데이터를 추가한다
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const deptPopup = ref(null)
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)
const emit = defineEmits([])
const _YEAR = ref(null)
const popupData = reactive({
  CMPNY_DIV : '',  //구분
  YYYY : '',      //년도
  MM : '',   //월
  BSNS_CD : '',   //사업부
  NAME : '', // 성명
  EMP_NO : '', //사번
})

//협력사 안전관리자 인원 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName:'left-column', editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('소속') }, styleName:'left-column', editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사명') }, styleName:'left-column', editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false },
    { fieldName: 'START_DATE', dataType: 'text', header: { text: t('접수일') }, editable: false },
    { fieldName: 'CAREER', dataType: 'text', header: { text: t('경력(근무일수)') }, editable: false },
    { fieldName: 'ENT_DATE', dataType: 'text', header: { text: t('입사일') }, editable: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', header: { text: t('퇴사일') }, editable: false },
    { fieldName: 'GRADE_NM', dataType: 'text', header: { text: t('자격순위') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_NM', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'REG_NO', dataType: 'text', visible: false },
    { fieldName: 'AGE_INT', dataType: 'text', visible: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', visible: false },
    { fieldName: 'CAREER_SUM', dataType: 'text', visible: false },
    { fieldName: 'MONEY', dataType: 'text', visible: false },
    { fieldName: 'REMARK', dataType: 'text', visible: false },
    { fieldName: 'CAREER_GBN', dataType: 'text', visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', visible: false },
    { fieldName: 'END_VAL', dataType: 'text', visible: false },
    { fieldName: 'LICE_NAME', dataType: 'text', visible: false },
    { fieldName: 'LICE_CNT', dataType: 'text', visible: false },
    { fieldName: 'PAYMENT_CODE', dataType: 'text', visible: false },
    { fieldName: 'CNT', dataType: 'text', visible: false },
    { fieldName: 'AGE_OLD', dataType: 'text', visible: false },
    { fieldName: 'LICE_INFO', dataType: 'text', visible: false },
    { fieldName: 'YYYY', dataType: 'text', visible: false },
    { fieldName: 'MM', dataType: 'text', visible: false },
    { fieldName: 'WORKER_CNT', dataType: 'text', visible: false },
    { fieldName: 'PAY_STANDARD', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
    { fieldName: 'WORK_FROM_DT', dataType: 'text', visible: false },
    { fieldName: 'WORK_TO_DT', dataType: 'text', visible: false },
    { fieldName: 'REAL_WORK_DAYS', dataType: 'text', visible: false },
    { fieldName: 'CHK', dataType: 'text', visible: false },
    { fieldName: 'GRADE', dataType: 'text', visible: false }, //자격순위
    
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
  ]).then(res => {
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = data => {
  console.log("받아온 데이터",data)
  popupData.NAME = ''
  popupData.EMP_NO = ''
  // 받아온 데이터 세팅
  popupData.CMPNY_DIV = data.CMPNY_DIV
  popupData.YYYY = data.YYYY
  popupData.MM = data.MM
  popupData.BSNS_CD = data.BSNS_CD
  gridRefresh()
  onButtonsClick({ id:'btnSearch' })
  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
  else if(btn.id === 'btnTargetAdd'){
    btnTargetAdd()
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
}

//경력에 따른 행스타일 적용
const gridCellColorSetting = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    let ret = {
      style: {
        "background-color": undefined,
      },
    }
    let AGE_OLD = grid.getValue(dataCell.index.itemIndex, "AGE_OLD")
    let CAREER_GBN = grid.getValue(dataCell.index.itemIndex, "CAREER_GBN")
    if(dataCell.dataColumn.fieldName === "CAREER"){
      if(CAREER_GBN==="A"){
        ret.style["background-color"] = "#90EE90"
      }else if(CAREER_GBN==="B"){
        ret.style["background-color"] = "#FFA500"
      }else if(CAREER_GBN==="C"){
        ret.style["background-color"] = "#FF0000"
      }
      if(AGE_OLD==="Y"){
        ret.style["background-color"] = "#FFA500"
      }
    }
    return ret
  })
}

//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//협력사 안전관리자 인원 조회
const searchData = idx => {
  console.log('popupData : ',popupData)
  return commonSearchApi({ queryId : 'SAFIE0010_TAB02_POP01_SEARCH_01', param: popupData })
  // commonSearchApi({ queryId : 'SAFIE0010_TAB02_POP01_SEARCH_01', param : popupData }).then(res => {
  //   grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  // })
}

//협력사 안전관리자 인원 조회
const afterSearch = res => {
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  if(res.ORESULT_CUR.length!=0){
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    gridCellColorSetting()
  }
}

//*************************************************조회 영역(종료)**********************************************************/
//************************************************데이터 선택 영역**********************************************************/
const btnTargetAdd = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let selectDataRows = []
  checkedRows.forEach(val => {
    selectDataRows.push(grdMain.value.getDataProvider().getJsonRow(val))
  })
  emit('onSelect',selectDataRows)
  dialog.value = false
}

//**********************************************데이터 선택 영역(종료)******************************************************/
defineExpose({
  openPopup,
})

// 2024-06-13 ILJOO_DUCHA 더블 클릭 시 선택된 사원 추가
const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  let selectDataRows = []
  selectDataRows.push(row)

  emit('onSelect',selectDataRows)
  dialog.value = false
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>협력사 안전관리자 인원검색</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch','btnTargetAdd','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('사번')"
                width="240px"
                v-model="popupData.EMP_NO"
                @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
                oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/, '');"
                maxlength="20"
                @input="inputEMP_NO"
              />
              <!-- oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' );" -->
              <i-input
                :label="$t('성명')"
                width="240px"
                v-model="popupData.NAME"
                @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
                korean
                maxlength="500"
                @input="inputEMP_NAME"
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @on-cell-dbl-clicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}

</style>