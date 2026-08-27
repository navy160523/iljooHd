<!--
  화면명 : 자격증검색 팝업창
  화면개요 : 자격증을 검색 및 선택 하는 화면
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const dialog = ref(false)
const emit = defineEmits(['selected'])
let CREATE_YN = ''

//코드 리스트 세팅
const codeList = reactive({
  CERT_DIV: [],           //자격증
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  LICE_TYPE: '',
})

const clearData = () => {
  if(grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
}

const initCombo = data =>{
  let mainData = []
  data.forEach(row => {
    mainData.push( row[6] )
  })

  //기본 자격증 그리드 콤보
  commonSearchApi({ queryId : 'EDUAA0020_TAB01_SEARCH01', param: searchParams }).then(res => {
    let tempRows = []
    res.ORESULT_CUR.forEach(row => {
      if(!mainData.includes(row.COD))
        tempRows.push( { CERT_DIV : row.COD, CERT_DIV_NM : row.TXT } )
    })
    grdMain.value.getDataProvider().setRows(tempRows)
  })
}

//******************************세팅 영역(종료)***************************************************/
// 선행보유 자격증 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, width: '120', visible: false, editable:false  },
    { fieldName: 'CERT_DIV_NM', dataType: 'text', header: { text: t('자격증') }, styleName: 'left-column', width: '30', editable:false },
    { fieldName: 'HOLDING_PERIOD', dataType: 'text', header: { text: t('보유기간(월)') }, width: '120', visible: false, editable:false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, width: '60', visible: false, editable:false },
    { fieldName: 'CERT_DIV', dataType: 'text', header: { text: t('CERT_DIV') }, width: '50', visible: false, editable:false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//*****************************************오픈 팝업********************************************/

const openPopup = data => {  
  clearData()
  console.log("데이터 확인",data)
  if(data.LICE_TYPE !== null){
    searchParams.LICE_TYPE = data.LICE_TYPE
  }
  if(data.ROW_DATA !== null){
    initCombo(data.ROW_DATA)
  }

  //CREATE_YN = 'Y' : 추가버튼 클릭
  //CREATE_YN = 'N' : 자격증 그리드 row 더블클릭  
  if(data.CREATE_YN === 'Y'){
    CREATE_YN = data.CREATE_YN

  } else {
    
    CREATE_YN = 'N'
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
const onAddButtonClick = () => {
  var row = grdMain.value.getGridView().getCheckedRows(true)
  if(row.length === 0) return
  var checkedRowList= []
  for(let i = 0; i < row.length; i++){
    checkedRowList.push(grdMain.value.getDataProvider().getJsonRow(row[i]))
  }
  emit("selected", checkedRowList)
  onClose()
}

const onButtonsClick = async btn => {
  if(btn.id === 'btnSelect'){
    onAddButtonClick()
  } else {
    onClose()
  }
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="500"
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
    <span>자격증 검색 팝업</span>
  </v-sheet>
  
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 조회조건 -->
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card> 
  </v-dialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  // overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
