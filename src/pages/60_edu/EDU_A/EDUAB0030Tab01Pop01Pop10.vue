<!--
  화면명 : 그룹 검색(팝업)
  화면개요 : 그룹목록을 검색하고 데이터를 선택하여 대상자 목록 그리드에 추가한다
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
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
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)
const emit = defineEmits([])
const _chkVR = ref(null)
const popupData = reactive({
})


//그룹 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'GROUP_NM', dataType: 'text', header: { text: t('그룹명') }, editable: false },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자명') }, editable: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정시각') }, editable: false },
    //비활성화
    { fieldName: 'GROUP_ID', dataType: 'text', header: { text: t('그룹 ID') }, editable: false, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
  ],
  columns: [],
})

//대상자 목록
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사용자ID(사번)') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('차수') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'GROUP_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : '' } }),//교육명
  ]).then(res => {
    console.log("레스 확인",res)
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = () => {
  gridRefresh()
  grdMainSearch()

  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSelect'){
    btnSelect()
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//교육장 목록 ROW 클릭 이벤트
const grdMainRowChanged = (grid, index, clickData) => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let rowData = grdMain.value.getGridView().getValues(clickData)
  let rowData = grdMain.value.getRowData(clickData)
  grdSubSearch(rowData)
}

//교육장 목록 ROW 더블 클릭 이벤트
// const grdMainRowDblClick = (grid, clickData) => {
//   console.log("더블클릭 데이터",clickData)
//   let rowData = grdMain.value.getGridView().getValues(clickData.dataRow)
//   console.log("로우데이터 확인",rowData)
//   emit('onSelect', rowData)
//   dialog.value = false
// }

const btnSelect = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length < 1){
    Message.warn(t('추가할 데이터를 선택해 주세요'))
    return
  }
  let selectDataRows = []
  checkedRows.forEach(val => {
    selectDataRows.push(grdMain.value.getDataProvider().getJsonRow(val))
  })
  emit('onSelect',selectDataRows)
  dialog.value = false
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
}

const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
//교육장 목록 조회
const grdMainSearch = () => {
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD :userStore.bsnsCd,
    DEPT_CD :userStore.deptCd,
    ASGN_CD :userStore.asgnCd,
    USER_DIV : userStore.userDiv
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP10_SEARCH_01', param : searchParams }).then(res => {
    console.log("메인그리드 조회 후",res)
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      grdMain.value.getGridView().setFocus(0)
      Message.success(t('조회되었습니다.'))
    }else{
      Message.warn(t('데이터가 없습니다.'))
    }
    console.log("레스 확인",res)
  })
}

//예약현황 조회
const grdSubSearch = data => {
  if(data === null){
    return
  }
  console.log("디테일 그리드 조회",data)
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD :userStore.bsnsCd,
    DEPT_CD :userStore.deptCd,
    ASGN_CD :userStore.asgnCd,
    GROUP_ID : data.GROUP_ID === null ? '' : data.GROUP_ID
  }
  console.log("서브 그리드 조회 파람",searchParams)
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP10_SEARCH_02', param : searchParams }).then(res => {
    console.log("서브 그리드 조회 :::: >>>> ", res)
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//*************************************************조회 영역(종료)**********************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
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
      <span>그룹 검색</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="['btnSelect','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex" style="height:100%">
          <v-sheet width="55%" class="flex-column mr-10">
            <div class="flex-column" style="height:92%">
              <IGridTitle
                :title="$t('그룹 목록')"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCurrentRowChanged="grdMainRowChanged"
              />
            </div>
          </v-sheet>
          <v-sheet width="40%" class="flex-column">
            <div class="d-flex" style="align-items: baseline">
              <IGridTitle
                :title="$t('대상자 목록')"
              >
                <template #editors />
              </IGridTitle>
            </div>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
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
  height: calc(100vh - (430px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>