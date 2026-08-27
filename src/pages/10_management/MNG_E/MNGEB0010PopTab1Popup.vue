<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

//******************************세팅 영역***************************************************/

const props = defineProps({
  visibleCk: {
    type: Boolean,
    default: true,
  },
})


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const dialog = ref(false)
const emit = defineEmits(['selected'])

//코드 리스트 세팅
const codeList = reactive({
  LAW_CD: [],           //이전 화면에서 제외해야할 LAW_CD 목록
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  SELECT_YN : '',
  LE_TXT : '',
})

const clearData = () => {
  if(grdMain.value != null && grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
}

//******************************세팅 영역(종료)***************************************************/
// 법령 조회 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'LAW_NM', dataType: 'text', width: '200', header: { text: t('법령명') }, editable: false, lookupDisplay: true, styleName: 'left-column' },
    { fieldName: 'LAW_NM1', dataType: 'text', width: '50', header: { text: t('조') }, editable: false },
    { fieldName: 'LAW_NM2', dataType: 'text', width: '50', header: { text: t('항') }, editable: false },
    { fieldName: 'LE_TXT', dataType: 'text',  width: '80', header: { text: t('조문') }, editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('관련 조직') } , editable: false },    
    { fieldName: 'PMG_DATE', dataType: 'datetime', width: '80', datetimeFormat: 'yyyy-MM-dd', header: { text: t('공포일자') } , editable: false },    
    { fieldName: 'ACT_DATE', dataType: 'datetime',  width: '80', datetimeFormat: 'yyyy-MM-dd', header: { text: t('시행일자') } , editable: false },
    { fieldName: 'CHK_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('최근 제·개정 내역 확인일') }, editable: false },
    { fieldName: 'MNG_NM', dataType: 'text', header: { text: t('제·개정 내역 입수 담당자') }, editable: false },    
    { fieldName: 'COMP_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('최근 제·개정 내역 조치일')}, editable: false },
    { fieldName: 'DIV_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'MNG_ID', dataType: 'text', visible: false },
    { fieldName: 'LAW_CD', dataType: 'text', visible: false },
    { fieldName: 'GUBN', dataType: 'text', visible: false },
    { fieldName: 'BF_CONTENT', dataType: 'text', visible: false },
    { fieldName: 'GUBN_DETAIL', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = data => {  
  clearData()
  codeList.LAW_CD = data.LAW_CD_ARR
  //SELECT_YN = 'Y' : 신규등록으로 팝업 선택
  //SELECT_YN = 'N' : 일반 법규 리스트 
  // if(data.SELECT_YN === 'Y'){
  //   searchParams.SELECT_YN = data.SELECT_YN

  // } else {
    searchParams.SELECT_YN = 'N'
  // }
  
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
  emit("selected", selectedRowList)
  onClose()
}

//DB 데이터 조회
const searchDataGrdMain = () =>{
  return commonSearchApi({ queryId : 'MNGEB0010_POP1_POP1_SEARCH_01', param: searchParams })
}

//조회 데이터 처리
const afterSearchGrdMain = res =>{

  // 2024.02.26 정성연 - 중복 제거 로직 제거함
  // const result = res.ORESULT_CUR.filter(item => !Object.values(codeList.LAW_CD).includes(item.LAW_CD))
  // grdMain.value.getDataProvider().setRows(result)
  
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
    width="1500"
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
      <span>법령 검색 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <v-sheet class="searchArea d-flex justify-space-between">
          <div class="d-flex align-center">
            <!-- <i-input
              v-model="searchParams.LAW_NM"
              :label="$t('법령명')"
              width="350px" 
              margin="10px"
              @keydown.enter="e => {
                onButtonsClick({id : 'btnSearch'})
              }"
            /> -->
            <i-input
              v-model="searchParams.LE_TXT"
              :label="$t('조문')"
              width="350px" 
              margin="10px"
              @keydown.enter="e => {
                onButtonsClick({id : 'btnSearch'})
              }"
            />
            <!-- <v-checkbox 
              v-if="props.visibleCk"
              v-model="searchParams.SELECT_YN"                              
              :label="$t('제·개정 내용 필요')" 
              true-value="Y" 
              false-value="N"
            />             -->
          </div>
          <div class="d-flex align-center">
            <IGridTitle
              :use-permission="false"
              :button-list="['btnSelect', 'btnSearch', 'btnClose']"
              @click-button="onButtonsClick"
            />
          </div>
        </v-sheet>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 650px;"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys" 
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          @onCellDblClicked="onSelectButtonClick"
        />
      </v-card-title>
    </v-card>        
  </VDialog>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
