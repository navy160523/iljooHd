<!-- HLTLA0010 감염병 관리기준 -->
<!-- SI2팀 손상규 2025-03-27 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'

let dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const emit = defineEmits(['upData2'])

const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const codeList = reactive({
  gradeList: [
    {COD: 'A', TXT: '1급'},
    {COD: 'B', TXT: '2급'},
    {COD: 'C', TXT: '3급'},
    {COD: 'D', TXT: '4급'},
    {COD: 'E', TXT: '기타'},
  ],
})

const customGridStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function(grid,dataCell) {
    let ret = {
      // style: {
      //   'background-color': undefined,
      // },
    }

    if (grid.getValue(dataCell.index.dataRow, 'INT_INFEC') == 'Y') {
      ret.style = { 'background-color': 'pink' }
    } else ret.style = { 'background-color': '' }
    return ret
  })
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHII840A1'),
    getCodeList('HHII840A2'),
    getCodeList('HHII840A3'),
    getCodeList('HHII840A4'),
    getCodeList('HHII840B'),
  ]).then((res) => {
    console.log(res[0].ORESULT_CUR);
    codeList.INFEC1 = res[0].ORESULT_CUR  
    codeList.INFEC2 = res[1].ORESULT_CUR  
    codeList.INFEC3 = res[2].ORESULT_CUR  
    codeList.INFEC4 = res[3].ORESULT_CUR  
    codeList.CONTACT = res[4].ORESULT_CUR

    codeList.allInfec = [
      ...codeList.INFEC1,
      ...codeList.INFEC2,
      ...codeList.INFEC3,
      ...codeList.INFEC4
    ];
    grdMain.value.setBindingColumn('INFEC_NM', codeList.allInfec, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CONTACT_CLS', codeList.CONTACT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('GRADE', codeList.gradeList, 'COD', 'TXT')
  })
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }},
  keys : [],
  fields: [ 
    {
      fieldName: 'GRADE', width: '50', dataType: 'text', header: { text: t('급수'), styleName: 'center-column editable_column' }, editable: false,
      styleName: 'editable_column', lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    {
      fieldName: 'INFEC_NM', width: '100', styleName: 'editable_column center-column', dataType: 'text', header: { text: t('명칭') }, editable: false, lookupDisplay: true,
    },
    { fieldName: 'INFEC_INFO', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('정의') }, editable: false },
    { fieldName: 'SUS_SYMP', width: '250', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('의심증상') }, editable: false },
    { fieldName: 'CONTACT_CLS', width: '200', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('접촉자 분류') }, editable: false, lookupDisplay: true, },
    { fieldName: 'MNG_STD', width: '200', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('관리기준') }, editable: false },
    { fieldName: 'MNG_SEQ', width: '80', styleName: 'editable_column center-column', dataType: 'number', numberFormat: "#,###", header: { text: t('관리순번') }, editable: false },
    {
      fieldName: 'INT_INFEC', width: '100', dataType: 'text', header: { text: t('관심 감염병') }, styleName: 'change_back_check', editable: false,
      renderer: { type: "check", trueValues: 'Y', falseValues: 'N' },
    },
    // 안보이는거
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('시퀀스key') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//로우 더블클릭 했을때
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  emit('upData2', data)
  closePopup()
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  customGridStyle()
}

//  조회
const searchData = () => {
  console.log(searchParams)
  return commonSearchApi({ queryId: 'HLTLA0010_SEARCH_01', param: searchParams })
}

// 팝업
const openPopup = (popupParam) => {
  console.log("popupParam", popupParam)
  dialog.value = true
  grdMain.value.getGridView().filterPanel.visible = true

  initCodeList()
  getData()
}

const closePopup = () => {
  dialog.value = false
  emit('upData2')
}

defineExpose({
  openPopup
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1500"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">감염병 종류 상세</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <!-- 타이틀 -->    
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :usePermission="true"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
          :hiddenManuel="true"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd1Props.keys" 
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
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
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}
</style>