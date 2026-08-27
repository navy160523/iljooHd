<!--
  화면명 : 공장명 및 주소
  화면개요 : 건축물 기본정보에서 공장주소 찾을 때 쓰는 팝업
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
  name:'50_safety-support-SPP_B-SPPBB0010_Tab01Popup',
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
    { fieldName: 'COMPANY_NAME', dataType: 'text', width: '50', header: { text: t('회사명') }, editable: false },
    { fieldName: 'ADDRESS', dataType: 'text', width: '50', header: { text: t('주소') }, editable: false },

    { fieldName: 'COMPANY_NO', dataType: 'text', width: '50', header: { text: t('주소') }, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '50', header: { text: t('주소') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = data => {  
  clearData()
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
  return commonSearchApi({ queryId : 'SPPBB0010_TAB01_POP_SEARCH_01', param: searchParams })
}

//조회 데이터 처리
const afterSearchGrdMain = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
} 

//버튼 클릭
const onButtonsClick = btn => {
  if(btn.id === 'btnSelect'){
    onSelectButtonClick()
  } else if(btn.id === 'btnSearch'){    
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataGrdMain)
      .setAfter(afterSearchGrdMain)
      .run()
  } else{
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
    <span>공장명 및 주소</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSelect', 'btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto mr-2" width="100%">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 400px;"
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
