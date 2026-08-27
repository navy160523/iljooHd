<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import EmpPopup from '@/components/popup/EmpPopup.vue'
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
const empPopup = ref(null)
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

//조회조건
const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  CLICK_ROW_IDX : '',
  EMP_NO : '',
})

const clearData = () => {
  if(grdMain.value != null && grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
}

//******************************세팅 영역(종료)***************************************************/
// 회람 조회 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('소속구분') }, width : '60',  lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.USER_DIV }, editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width : '200' , editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직급') } , editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('회람대상자사번') }, width : '120', editable: false },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('회람대상자명') }, width : '120',styleName: 'editable_column' , button : 'action' },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = async data => {  
  clearData()
    
  if(data.EMP_NO.length > 0){
    searchParams.EMP_NO = data.EMP_NO
    setData()    
  }
  else{
    mkGridEmpty()
  }

  //팝업 오픈
  dialog.value = true 
}

//****************************************오픈 팝업(종료)************************************************/

//창 닫음
const onClose = () => {
  dialog.value = false
}

//추가 버튼 이벤트
const onSelectButtonClick = () => {
  let row = grdMain.value.getDataProvider().getJsonRows()
  if(row.length === 0) return
  let rtn = {
    EMP_ID : [],
    EMP_NM : [],
  }

  row.forEach(element => {
    if(element.EMP_NO !== null && element.EMP_NO !== '' && !rtn.EMP_ID.includes(element.EMP_NO)){
      rtn.EMP_ID.push(element.EMP_NO)
      rtn.EMP_NM.push(element.EMP_NM)
    }
  })
  emit("selected", rtn)
  onClose()
}

//데이터 세팅
const setData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchDataGrdMain)
    .setAfter(afterSearchGrdMain)
    .run()
}

//DB 데이터 조회
const searchDataGrdMain = () =>{
  return commonSearchApi({ queryId : 'SEARCH_EMPS', param: searchParams })
}

//조회 데이터 처리
const afterSearchGrdMain = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  mkGridEmpty()
}

//그리드 10줄 만들기
const mkGridEmpty = () =>{
  let newRow = {
    USER_DIV: '',
    ASGN_NM: '',
    JOB_TIT_NM: '',
    EMP_NO: '',
    EMP_NM: '',
  }
  while(grdMain.value.getDataProvider().rowCount < 10){    
    grdMain.value.addRow(newRow, false)
  }
}

//버튼 클릭
const onButtonsClick = btn => {
  if(btn.id === 'btnChk'){
    onSelectButtonClick()
  } else{
    onClose()
  }
}

//직원 정보 팝업 
const popupEmpOpen = (grid, clickInfo, column) => {  
  searchParams.CLICK_ROW_IDX = clickInfo.itemIndex
  let row = grdMain.value.getRowData(searchParams.CLICK_ROW_IDX)

  empPopup.value.openPopup({
    EMP_NM : row.EMP_NM,
    DISABLE:[],
  })

}

//직원 팝업 데이터 셋팅
const selectedEmpData = val =>{
  grdMain.value.getDataProvider().setValue(searchParams.CLICK_ROW_IDX, 'USER_DIV', val.USER_DIV)
  grdMain.value.getDataProvider().setValue(searchParams.CLICK_ROW_IDX, 'ASGN_NM', val.ASGN_NM)
  grdMain.value.getDataProvider().setValue(searchParams.CLICK_ROW_IDX, 'JOB_TIT_NM', val.JOB_TIT_NM)
  grdMain.value.getDataProvider().setValue(searchParams.CLICK_ROW_IDX, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(searchParams.CLICK_ROW_IDX, 'EMP_NM', val.EMP_NM)
}

//셀 지우기
const onEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grdMain.value.getGridView().commit()
  if(newValue === ''){
    grdMain.value.getDataProvider().setValue(dataRow, 'USER_DIV', '')
    grdMain.value.getDataProvider().setValue(dataRow, 'ASGN_NM', '')
    grdMain.value.getDataProvider().setValue(dataRow, 'JOB_TIT_NM', '')
    grdMain.value.getDataProvider().setValue(dataRow, 'EMP_NO', '')
  }
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
    width="1200"
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
      <span>회람 리스트 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
            :use-permission="false"
            :button-list="['btnChk', 'btnClose']"
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
      <!-- 팝업 -->
      <EmpPopup ref="empPopup" @selected ="selectedEmpData" />
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
