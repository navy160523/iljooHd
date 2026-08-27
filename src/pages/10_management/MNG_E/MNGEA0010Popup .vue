<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const dialog = ref(false)
const deptPopup = ref(null)
const emit = defineEmits(['selected'])

//코드 리스트 세팅
const codeList = reactive({
  USER_DIV: [
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
    { COD: "D", TXT: "단기공사", DISABLE: false },
    { COD: "Z", TXT: "기타", DISABLE: false },
  ],
})

//******************************세팅 영역(종료)***************************************************/
// 회람 조회 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, checkBar: {  visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부명') }, editable: false },
    { fieldName: 'ASGN_SHRT_NM', dataType: 'text', header: { text: t('부서명') }, editable: false },
    { fieldName: 'ORGN_DIV', dataType: 'text', header: { text: t('구분') }, width: '50', editable: false, lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.USER_DIV } },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('부서코드') }, editable: false, visible: false },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_NM', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = async val => {  
  if(val.DEPT_CD){
    const ASGN_SHRT_NM = val.DEPT_NM.split(',')
    const ASGN_CD = val.DEPT_CD.split(',')
    const BSNS_NM = val.BSNS_NM.split(',')
    const ORGN_DIV = val.ORGN.split(',')

    ASGN_CD.forEach((e, idx) => {
      grdMain.value.addRow({ 
        'ASGN_SHRT_NM': ASGN_SHRT_NM[idx],
        'BSNS_NM': BSNS_NM[idx],
        'ASGN_CD': ASGN_CD[idx], 
        'ORGN_DIV': ORGN_DIV[idx],
      })
    })
  }
  
  //팝업 오픈
  dialog.value = true 
}

//****************************************오픈 팝업(종료)************************************************/

//창 닫음
const onClose = () => {
  grdMain.value.getDataProvider().clearRows()
  dialog.value = false
}

//추가 버튼 이벤트
const onSelectButtonClick = () => {
  let row = grdMain.value.getDataProvider().getJsonRows()
  emit("selected", row)
  onClose()
}

//버튼 클릭
const onButtonsClick = btn => {
  if(btn.id === 'btnCreate'){
    let rowData = grdMain.value.getDataProvider().getJsonRows()
    deptPopup.value.openPopup({ 
      CMPNY_DIV: userStore.cmpnyDiv, 
      HSE_ONLY : 'Y', 
      pageGbn : 'MNG', 
      DEPT_OBJ : rowData
    })
  }
  else if(btn.id === 'btnReset'){
    grdMain.value.getDataProvider().clearRows()
  }
  else if(btn.id === 'btnChk'){
    onSelectButtonClick()
  } else{
    onClose()
  }
}

const onDeptSelected = val => {
  grdMain.value.getDataProvider().clearRows()
  val.forEach((e,idx) => {
    grdMain.value.addRow({ 
      'BSNS_NM': val[idx].BSNS_NM, 
      'ASGN_SHRT_NM': val[idx].ASGN_SHRT_NM, 
      'ORGN_DIV': val[idx].ORGN_DIV,
      'ASGN_CD': val[idx].ASGN_CD,
      'ASGN_FULL_NM': val[idx].ASGN_FULL_NM,
      'BSNS_CD': val[idx].BSNS_CD,
      'CMPNY_DIV': val[idx].CMPNY_DIV,
      'DEPT_CD': val[idx].DEPT_CD,
      'PART_CD': val[idx].PART_CD,
      'PART_NM': val[idx].PART_NM,
    })
  })
}


defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="60"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>관련조직 추가 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
            :use-permission="false"
            :button-list="['btnCreate','btnReset','btnChk', 'btnClose']"
            @click-button="onButtonsClick"
          />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 400px;"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys" 
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          @onCellButtonClicked="popupEmpOpen"
          @onEditRowChanged="onEditRowChanged"
        />
      </v-card-text>
      <!-- 부서/ 협력사 팝업 -->
      <DeptPopup ref="deptPopup" :checkBar=true @selected="onDeptSelected"/>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
