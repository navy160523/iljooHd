<!--
  화면명 : 교육이수 상세내역(팝업)
  화면개요 : 이수한 교육의 상세내역을 확인할 수 있는 팝업
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
const grdMain = ref(false) 
const popupData = reactive({
  KOR_NM : '',       //이름
  JOB_TIT_NM : '',   //직위
  ASGN_FULL_NM : '', //소속

})
const eDUAB0030Tab01Pop02Pop01 = ref(null)

const codeList = reactive({
  division : [],      //구분
  currId : [],        //교육명
  asgnCd : [],        //부서
  eduTimeSerial : [], //교육차수
})

//근로자 정기안전보건교육
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false },  footer: { visible: true } },
  fields : [
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') }, styleName:'rg_blue rg_underLine', editable: false },
    { fieldName: 'EDU_TIME_ST', dataType: 'text', header: { text: t('시작') }, editable: false },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('종료') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'number', numberFormat:"#,###", header: { text: t('시간(분)') }, editable: false,
    footer: { numberFormat: "#,###",expression: "sum" } },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('과정명') }, editable: false },
    { fieldName: 'LECTURER_NM', dataType: 'text', header: { text: t('강사명') }, editable: false },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('교육장소') }, editable: false },
    { fieldName: 'DIV_DESC', dataType: 'text', header: { text: t('이수여부') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout: [
    'EDU_DATE',
    {
      name: '교육시각',
      direction: 'horizontal',
      items: [ 'EDU_TIME_ST', 'EDU_TIME_FN', 'LEAD_TIME' ],
      header: { text: t('교육시각') },
    },
    'CURR_NM',
    'LECTURER_NM',
    'EPLACE_NM',
    'DIV_DESC'
  ],
})



grdMainProps.columns = grdMainProps.fields
//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup =  (data) => {
  grdMain.value.getDataProvider().setRows([])
  console.log("팝업 데이터",data)
  popupData.KOR_NM = data.KOR_NM
  popupData.JOB_TIT_NM = data.JOB_TIT_NM
  popupData.ASGN_FULL_NM = data.ASGN_FULL_NM

  if(data.GUBUN === 'grdTab01Main'){
    commonSearchApi({ queryId : 'EDUAB0050_POP01_SEARCH_01', param : data }).then(res => {
      console.log("레스 확인",res)
      if(res.ORESULT_CUR.length === 0){
        Message.warn(t('데이터가 없습니다'))
      }else{
        Message.success(t('조회되었습니다.'))
      }
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }else if(data.GUBUN === 'grdTab02Main'){
    commonSearchApi({ queryId : 'EDUAB0050_POP01_SEARCH_02', param : data }).then(res => {
      console.log("레스 확인",res)
      if(res.ORESULT_CUR.length === 0){
        Message.warn(t('데이터가 없습니다'))
      }else{
        Message.success(t('조회되었습니다.'))
      }
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }

  dialog.value = true
}
const onPopButtonsClick = btn => {
  if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

const onCellDblClicked = (grid, data) => {
  if(data.column === 'EDU_DATE'){
    let cd = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    console.log("cd확인",cd)
    if(cd.SCHEDULE_ID === null){
      Message.warn(t('현황순번이 없는 데이터입니다.'))
      return
    }
    eDUAB0030Tab01Pop02Pop01.value.openPopup({
    CREATE_YN : 'N',
    EDU_DATE : '', 
    CON_DIV : '',   
    EDUTIME_SERIAL : '',
    CMPNY_DIV  : cd.CMPNY_DIV,  
    YEAR : cd.YEAR,  
    SCHEDULE_ID : cd.SCHEDULE_ID,
    CURR_ID : cd.CURR_ID,
    SAVE_YN : 'N',
    MENU_ID : '',
    EXAM_YN : '',
    ONLY_SEARCH : 'Y'
  })
  }
  console.log("더블클릭",data)
}
//************************************************이벤트 영역(종료)*********************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
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
      <span>교육이수 상세내역</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('이름')"
              topLabel
              v-model="popupData.KOR_NM"
              width="250px"
              readonly
            />
            <i-input
              :label="$t('직위')"
              topLabel
              v-model="popupData.JOB_TIT_NM"
              width="250px"
              readonly
            />
            <i-input
              :label="$t('소속')"
              topLabel
              v-model="popupData.ASGN_FULL_NM"
              width="400px"
              readonly
            />
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <!-- 교육이수 팝업창 --> 
    <EDUAB0030Tab01Pop02Pop01 ref="eDUAB0030Tab01Pop02Pop01" />
  </v-dialog>
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
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>