<!--
  화면명 : 건물 검색
  화면개요 : 건물 명, 코드 검색(수계소화설비, 자탐/경보설비, 피난설비/소화활동 설비, 가스계 소화설비)
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from '@/components/ILabel.vue'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
  name:'50_safety-support-SPP_B-SPPBB0010_Tab02Popup',
}) 

//******************************세팅 영역***************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const dialog = ref(false)
const emit = defineEmits(['selected'])

//조회조건
const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD: "",
  BUILDING_NAME: "",
  DONG_NAME: "",
})

const clearData = () => {
  if(grdMain.value != null && grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
}

//******************************세팅 영역(종료)***************************************************/
// 공장명 및 주소 그리드 설정
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'BUILDING_NAME', dataType: 'text', width: '50', header: { text: t('건물명') }, editable: false },
    { fieldName: 'DONG_NAME', dataType: 'text', width: '50', header: { text: t('동명') }, editable: false },
    { fieldName: 'PUMP_YN', dataType: 'text', width: '10', header: { text: t('수계') }, editable: false },
    { fieldName: 'RECEIVE_YN', dataType: 'text', width: '10', header: { text: t('자탐') }, editable: false },
    { fieldName: 'EMERGENCY_YN', dataType: 'text', width: '10', header: { text: t('피난') }, editable: false },
    { fieldName: 'GAS_YN', dataType: 'text', width: '10', header: { text: t('가스') }, editable: false },

    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '50', header: { text: t('회사구분') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', width: '50', header: { text: t('사업부') }, visible: false },
    { fieldName: 'BUILDING_NO', dataType: 'text', width: '50', header: { text: t('건물코드') }, visible: false },
    { fieldName: 'BUILDING_NO_MAIN', dataType: 'text', width: '50', header: { text: t('건물코드') }, visible: false },
    { fieldName: 'PUMP_LOC', dataType: 'text', width: '50', header: { text: t('펌프실 위치') }, visible: false },
    { fieldName: 'PUMP_DTL_LOC', dataType: 'text', width: '50', header: { text: t('세부위치') }, visible: false },
    { fieldName: 'EFFEC_WATER', dataType: 'text', width: '50', header: { text: t('유효수원') }, visible: false },
    { fieldName: 'WATER_TANK', dataType: 'text', width: '50', header: { text: t('전용수조') }, visible: false },
    { fieldName: 'GROUND_TANK', dataType: 'text', width: '50', header: { text: t('지상수조') }, visible: false },
    { fieldName: 'ROOFTOP_WATER', dataType: 'text', width: '50', header: { text: t('옥상수원') }, visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', width: '50', header: { text: t('사업부명') }, visible: false },
    { fieldName: 'BUILDING_NAME_MAIN', dataType: 'text', width: '50', header: { text: t('건물메인명') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = data => {  
  clearData()
  searchParams.BSNS_CD = data.BSNS_CD
  searchParams.BUILDING_NAME = data.BUILDING_NAME
  onButtonsClick({ id :'btnSearch' })
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
  var row = grdMain.value.getGridView().getSelectedRows()
  if(row.length === 0) return
  var selectedRowList= []
  for(let i = 0; i < row.length; i++){
    selectedRowList.push(grdMain.value.getDataProvider().getJsonRow(row[i]))
  }
  emit('selected', selectedRowList)
  onClose()
}

//DB 데이터 조회
const searchDataGrdMain = () =>{
  return commonSearchApi({ queryId : 'SPPBB0010_POP_SEARCH_01', param: searchParams })
}

//조회 데이터 처리
const afterSearchGrdMain = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
} 

const searchBuilding = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//버튼 클릭
const onButtonsClick = btn => {
  if(btn.id === 'btnReset') {
    // 검색어 초기화
    searchParams.BSNS_CD = ''
    searchParams.BUILDING_NAME = ''
    searchParams.DONG_NAME = ''
    onButtonsClick({ id:'btnClose' })
  } else if(btn.id === 'btnSelect'){
    onSelectButtonClick()
  } else if(btn.id === 'btnSearch'){    
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataGrdMain)
      .setAfter(afterSearchGrdMain)
      .run()
  } else{
    if(searchParams.BUILDING_NAME == '' && searchParams.DONG_NAME == '') {
      var selectedRowList= [{
        BUILDING_NAME: '',
        DONG_NAME: '',
        CMPNY_DIV: 'HHI',
        BSNS_CD: '',
        BUILDING_NO: '',
        BUILDING_NO_MAIN: '',
        PUMP_LOC: '',
        PUMP_DTL_LOC: '',
        EFFEC_WATER: '',
        WATER_TANK: '',
        GROUND_TANK: '',
        ROOFTOP_WATER: '',
        BSNS_NM: '',
        BUILDING_NAME_MAIN: '',
      }]
      emit('selected', selectedRowList)
    }
    onClose()
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
    width="800"
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
    <span>건물 검색</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnReset', 'btnSelect', 'btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input 
              :label="$t('건물명')"
              v-model="searchParams.BUILDING_NAME"
              width="250px" 
              @keypress.enter="searchBuilding"
            />
            <i-input 
              :label="$t('동명')"
              v-model="searchParams.DONG_NAME" 
              width="250px" 
              @keypress.enter="searchBuilding"
            />
          </v-sheet>
          <v-sheet class="h-auto mr-2" width="100%">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 100%;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onSelectButtonClick"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>        
  </VDialog>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 450px;
  }
}
</style>
