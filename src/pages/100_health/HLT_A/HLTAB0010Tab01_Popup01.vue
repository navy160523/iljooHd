<!--
  화면명 : 보건위험성 평가 부서 화학물질 조회
  화면개요 : 보건위험성 평가 부서 화학물질 조회
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import PdfView from "@/pages/99_indexPopUp/PdfViewPopup.vue"

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
 
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  HALF_DIV: '',
  REG_DIV: '',
  PROCESS_CD: ''
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: 'DEPT_NM', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('부서명') }, editable: false },
    { fieldName: 'MATNO', dataType: 'text', width: '40', header: { text: t('자재번호') }, editable: false },
    { fieldName: 'MATDSC', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('제품명') }, editable: false },
    { fieldName: 'VNDNME', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('납품사') }, editable: false },
    { fieldName: 'MSDS_FILEID', width: '40', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('TYPE') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var btnColor = '#1a40c7'
          if(isEmpty(grid.getValue(cell.index.itemIndex, 'MSDS_FILEID'))) {
            btnColor = '#FF0000'
          }
          var str = 
          `<div class="d-flex">
            <button 
              class="v-btn" 
              style="color: #fff; background: ${btnColor}; padding: 4px;"
            >MSDS</button>
          </div>`;
          return str;
        },
      },
    },
    { fieldName: 'PROCESS_NM', dataType: 'text', width: '40', header: { text: t('취급공정') },},
    { fieldName: 'EXPENSE', dataType: 'text', width: '40', header: { text: t('용도') } },
    { fieldName: 'MONTH_AVG_USE', dataType: 'number', 'numberFormat': '0', width: '40', styleName: 'right-column', header: { text: t('월평균사용량') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'UNIT', dataType: 'text', width: '30', header: { text: t('단위') }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'DAILY_USE_MIN', dataType: 'number', 'numberFormat': '0', styleName: 'right-column', width: '30', header: { text: t('분/일') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'DAILY_USE_CNT', dataType: 'number', 'numberFormat': '0.#', styleName: 'right-column', width: '30', header: { text: t('일/주') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },    
    { fieldName: 'MONTH_USE_MIN', dataType: 'number', 'numberFormat': '0.#', styleName: 'right-column', width: '30', header: { text: t('시간/월') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'MONTH_USE_CNT', dataType: 'number', 'numberFormat': '0', styleName: 'right-column', width: '30', header: { text: t('개월/년') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'STATE', dataType: 'text', width: '30', header: { text: t('상태') }, editable: false },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') }, visible: false },
    { fieldName: 'OLD_PROCESS_CD', dataType: 'text', header: { text: t('원래공정코드') }, visible: false },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') }, visible: false },
  ],
  columnLayout: [
    'DEPT_NM',
    'MATNO',
    'MATDSC',
    'VNDNME',
    'MSDS_FILEID',
    'PROCESS_NM',
    'EXPENSE',
    'MONTH_AVG_USE',
    'UNIT',
    {
          name: '일간사용시간',
          direction: 'horizontal',
          items: [ 'DAILY_USE_MIN', 'DAILY_USE_CNT' ],
          header: { text: t('일간사용시간') },
    },
    {
          name: '월간사용시간',
          direction: 'horizontal',
          items: [ 'MONTH_USE_MIN', 'MONTH_USE_CNT' ],
          header: { text: t('월간사용시간') },
    },
    'STATE',
  ],
  columns: [],
})


grdMainProps.columns = grdMainProps.fields

const openPopup = (params) => {
  
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.ASGN_CD = params.ASGN_CD
  searchParams.YEAR = params.YEAR
  searchParams.HALF_DIV = params.HALF_DIV
  searchParams.REG_DIV = params.REG_DIV
  Promise.all([
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    // 협력사
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_ASGN', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '', ORGN_DIV: '', USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'A')
    onButtonsClick({ id: 'btnSearch' })
  })
  dialog.value = true
}

const closePopup = () => {
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getData()
  }
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0010_SEARCH_08', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  // PDF 뷰어 ON
  if (col.target.className === 'v-btn' && col.column === 'MSDS_FILEID') {
    if(isEmpty(data.MSDS_FILEID)) {
      return Message.err(t('해당 자재 및 TYPE에는 첨부파일이 없습니다.'))
    }
    pdfPopup.value.openMSDSPopup(data, 'HLTDA0020_SEARCH_08')
  } 
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1600"
    height="650"
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
      <span>부서 화학물질 취급정보</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-input 
              v-model="searchParams.YEAR"
              :label="$t('기준년도')" 
              label-width="50px" 
              width="200px"
              type="number"
              readonly
            />
            <i-select 
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')" 
              label-width="50px" 
              width="200px" 
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              readonly
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              label-width="50px"
              :items="codeList.DEPT_CD"
              :readonly="true"
              item-value="DEPT_CD"
              item-title="ASGN_NM" 
              width="200px"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 350px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCellItemClicked="onCellItemClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
    <PdfView ref="pdfPopup"/>
  </v-dialog>
</template>
