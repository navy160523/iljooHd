<!--
  화면명 : 교육강좌 검색 팝업창
  화면개요 : 교육강좌 검색 및 선택 하는 화면
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'

//****************************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const parentData = ref(null)
const emit = defineEmits(['selected'])

//코드리스트 셋팅
const codeList = ref({
  DIVISION : [],
  MORGN_NM: [],
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION : '',
  MORGN_NM : '',
  CURR_NM : '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } }, 
  fields : [
    { fieldName: "DIVISION", dataType: 'text', width: '100', editable: false, lookupDisplay: true, header: { text: t('교육분류') },
      mergeRule: { "criteria": "value" }, },
    { fieldName: 'CURR_NM', dataType: 'text', width: '150', editable: false, header: { text: t('교육명') }, styleName: 'left-column'  },
    { fieldName: 'MNG_ORGN', dataType: 'text', width: '150', editable: false, lookupDisplay: true, header: { text: t('주관부서') } },
    { fieldName: 'EDU_CONTENT', dataType: 'text', width: '200', editable: false, header: { text: t('교육내용') }, styleName: 'left-column'  },
    { fieldName: 'EDU_CYCLE', dataType: 'text', width: '100', editable: false, header: { text: t('주기') } },
    { fieldName: 'EDU_TIME', dataType: 'text', width: '100', editable: false, header: { text: t('시간') } },
    
    //출력 안함
    { fieldName: 'CURR_ID', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//****************************************세팅 영역(종료)***************************************************/

//****************************************오픈 팝업***************************************************/
const openPopup = data => {

  //팝업 데이터 초기화
  codeList.value.DIVISION = []
  codeList.value.MORGN_NM = []
  searchParams.DIVISION = ''
  searchParams.MORGN_NM = ''
  searchParams.CURR_NM =''
  parentData.value = []
  if(data != null){
    data.ROW_DATA.forEach(element => {
      parentData.value.push(element[10])
    })
  }
 
  //콤보 박스와 그리드 데이터 바인딩
  Promise.all([
    getCodeList('HHID010'),
  ]).then(res => {
    codeList.value.DIVISION = res[0].ORESULT_CUR
    codeList.value.DIVISION.unshift({ TXT: "전체", COD: "" })
    grdMain.value.setBindingColumn("DIVISION", codeList.value.DIVISION, "COD", "TXT") 
  })
  commonSearchApi({ queryId : 'EDUAA0010_POP01_POP01_SEARCH_03', param: searchParams }).then(res => {
    codeList.value.MORGN_NM = res.ORESULT_CUR
    codeList.value.MORGN_NM.unshift({ MORGN_NM: "전체", MORGN_ID: "" })
    grdMain.value.setBindingColumn("MNG_ORGN", codeList.value.MORGN_NM, "MORGN_ID", "MORGN_NM") 
  })

  //팝업 오픈
  dialog.value = true
}

//****************************************오픈 팝업(종료)***************************************************/

//****************************************이벤트 영역***************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//추가 버튼 이벤트
const onAddButtonClick = () => {
  var row = grdMain.value.getGridView().getCheckedRows(true)
  if(row.length === 0) {
    Message.warn(t('추가할 데이터를 선택해 주세요.'))
    return
  }
  var checkedRowList= []
  for(let i = 0; i < row.length; i++){
    checkedRowList.push(grdMain.value.getDataProvider().getJsonRow(row[i]))
  }
  emit("selected", checkedRowList)
  onClose()
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

//****************************************이벤트 영역(종료)***************************************************/

//****************************************조회 영역***********************************************************/
//조회 전 유효성 검사
const beforeSearch = async () => {
  return true
}

//조회
const searchData = idx => {
  return commonSearchApi({ queryId : 'EDUAA0010_POP01_POP01_SEARCH_01', param: searchParams })
}

//조회 후
const afterSearch = res => {
  console.log('1', res.ORESULT_CUR)
  console.log('2', parentData.value)
  if(parentData.value === null || parentData.value.length === 0){
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  } else{
    let tempRows = []

    res.ORESULT_CUR.forEach(row => {
      if(!parentData.value.includes(row.CURR_ID))
        tempRows.push( row )
    })

    grdMain.value.getDataProvider().setRows(tempRows)
  }
}

//****************************************조회 영역(종료)***************************************************/


defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog 
    v-model="dialog" 
    persistent 
    width="1150"
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
      <span>교육강좌 검색</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <!-- 조회조건 -->
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('교육분류')"
              v-model="searchParams.DIVISION"
              :items="codeList.DIVISION"
              item-title="TXT"
              item-value="COD"
              width="300px"
              @update:model-value = gridRefresh()
            />
            <i-select
              :label="$t('주관부서')"
              v-model="searchParams.MORGN_NM"
              :items="codeList.MORGN_NM"
              item-title="MORGN_NM"
              item-value="MORGN_ID"
              width="300px"
              @update:model-value = gridRefresh()
            />
            <i-input
              :label="$t('교육명')"
              v-model="searchParams.CURR_NM"
              @keydown.enter=" e => {onButtonsClick({id:'btnSearch'})}"
              width="300px"
              @update:model-value = gridRefresh()
            />
          </v-sheet>
          <!-- /조회조건 -->
          <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
          <!-- 메인그리드 -->
          <v-sheet class="h-auto">
            <IGridTitle
              :button-list="['btnSelect']"
              @click-button="onAddButtonClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields" 
              :columns="grdMainProps.columns"
            />
          </v-sheet>
          <!-- /메인그리드 -->
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
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>