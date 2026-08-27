<!--
  화면명 : 추가개설요청 건 팝업
  화면개요 : 추가개설요청에 대한 정보를 확인할 수 있는 팝업
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
const emit = defineEmits(['change']) 
const popupData = reactive({
  CURR_ID : '',           //교육명
})



//근로자 정기안전보건교육
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    { fieldName: 'MORGN_NM', dataType: 'text', width:'130', header: { text: t('주관부서') }, styleName: "left-column", editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', width:'150', header: { text: t('신청자소속') }, styleName: "left-column", editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('신청자') }, editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('연락처') }, editable: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', width:'150', header: { text: t('신청일시') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('교육 아이디') }, editable: false, visible: false },
    { fieldName: 'MORGN_ID', dataType: 'text', header: { text: t('소속 아이디') }, editable: false, visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('INSERT_USER_ID') }, editable: false, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

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
const openPopup =  data => {
  popupData.CURR_NM = data.CURR_NM
  //initCodeList()

  dialog.value = true
  searchData(data)
}
const onPopButtonsClick = btn => {
  if(btn.id === 'btnClose'){
    dialog.value = false
  }
}


//***************************************************조회 영역**************************************************************/
const searchData = data => {
  console.log("조회영역 서치파람 확인",data)
  commonSearchApi({ queryId : 'EDUAB0060_TAB02_POP02_SEARCH_01', param: data }).then(res => {
    grdMain.value.getDataProvider().setRows([])
    console.log("조회 후 확인",res)
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      Message.success("조회되었습니다.")
    }else{
      grdMain.value.getDataProvider().setRows([])
      Message.warn("데이터가 없습니다.")
    }
  })
}
//*************************************************조회 영역(종료)**********************************************************/
// const isNullCheck = val => {
//   return (val === undefined || val === null || val === '') ? true : false
// }
//************************************************이벤트 영역(종료)*********************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <VDialog
  v-model="dialog"
  eager
  persistent
  width="800"
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
      <span>추가개설요청 건</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IGridTitle
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-sheet class="flex-column searchArea">
          <i-input
            :label="$t('교​​ ​ 육​ ​ 명')"
            labelWidth="78px"
            width="400px"
            v-model="popupData.CURR_NM"
            readonly
          />
        </v-sheet>
        <v-sheet height="87%">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (365px - 12px));  
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>