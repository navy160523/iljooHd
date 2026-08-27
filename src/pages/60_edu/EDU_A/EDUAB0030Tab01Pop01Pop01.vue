<!--
  화면명 : 불참인원조회(팝업)
  화면개요 : 불참인원을 조회하고 데이터를 선택하여 대상자 목록 그리드에 데이터를 추가한다
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
  DIVISION : '',  //구분
  NAME : '',      //이름
  ASGN_NM : '',   //소속명
  ASGN_CD : '',   //소속코드
})

const codeList = reactive({
  division : [], //구분
})


//교육장 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'BSNS_NM', dataType: 'text', width:'70', header: { text: t('사업부') }, styleName:'left-column', editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', width:'100', header: { text: t('부서') }, styleName:'left-column', editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', width:'150', header: { text: t('협력사') }, styleName:'left-column', editable: false },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'N_DATE', dataType: 'text', width:'100', header: { text: t('미참석일자') },'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} }, editable: false },
    //비활성화
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('JOB_TIT_CD') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('JOB_TIT_NM') }, editable: false, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, editable: false, visible: false },
    { fieldName: 'JOB_ROW_CD', dataType: 'text', header: { text: t('JOB_ROW_CD') }, editable: false, visible: false },
    { fieldName: 'STD_DUTY_CD', dataType: 'text', header: { text: t('STD_DUTY_CD') }, editable: false, visible: false },
    { fieldName: 'UNIT_DUTY_CD', dataType: 'text', header: { text: t('UNIT_DUTY_CD') }, editable: false, visible: false },
    { fieldName: 'JOB_NM', dataType: 'text', header: { text: t('JOB_NM') }, editable: false, visible: false },
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
  gridRefresh()
  grdMainSearch()
  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    grdMainSearch()
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

//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
//불참인원 조회
const grdMainSearch = () => {
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YYYYMMDD : '',
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP01_SEARCH_01', param : searchParams }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//*************************************************조회 영역(종료)**********************************************************/
//************************************************데이터 선택 영역**********************************************************/
const btnTargetAdd = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length < 1){
    Message.warn(t('추가할 대상자를 선택해 주세요.'))
    return
  }
  let selectDataRows = []
  checkedRows.forEach(val => {
    selectDataRows.push(grdMain.value.getDataProvider().getJsonRow(val))
  })
  emit('onSelect',selectDataRows)
  dialog.value = false
}
//**********************************************데이터 선택 영역(종료)******************************************************/
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
      <span>불참인원조회</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="['btnSearch','btnTargetAdd','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="flex-column fill-height">
          <div style="height:100%">
            <v-sheet width="100%" height="100%" class="flex-column">
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
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
  height: calc(100vh - (400px - 12px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>