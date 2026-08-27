<!--
  화면명 : 업무상질병 사업주조사서
  화면개요 : 업무상질병 사업주 조사서
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const emit = defineEmits(['btnPrev', 'btnNext', 'btnCloseClick','btnUpdate'])
const grdMain = ref(null)

const codeList = reactive({
  WORK_OFTEN: [],
  WORK_FREE: []
})
const props = defineProps({ searchParams: Object }) // props 객체를 직접 사용

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys : [],
  fields : [ 
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', width: '200', editable: false, header: { text: t('작업표준명') }, styleName: 'left-column', mergeRule: { criteria: "values['WORK_STANDARD_ID']" } },
    { fieldName: 'IDX2', dataType: 'number', numberFormat: '#,##0', width: '40', editable: false, header: { text: t('순번') }, styleName: 'right-column', mergeRule: { criteria: "values['WORK_STANDARD_ID'] + value" } },
    { fieldName: 'UNIT_NM', dataType: 'text', width: '150', editable: false, header: { text: t('단위 작업') }, styleName: 'left-column', mergeRule: { criteria: "values['WORK_STANDARD_ID'] + value" } },    
    { fieldName: 'ACT_NM', dataType: 'text', width: '230', editable: false, header: { text: t('작업 행동') }, styleName: 'left-column',},    
    { fieldName: 'WORK_OFTEN', dataType: 'text', width: '60', header: { text: t('작업 빈도') }, styleName: 'left-column editable_column', editor: { type: 'dropdown' }, lookupDisplay: true, mergeRule: { criteria: "values['WORK_STANDARD_ID'] + values['UNIT_ID'] + value" } },
    { fieldName: 'WORK_DAY_TIME', dataType: 'number', width: '80', numberFormat: '#,###', header: { text: t('1일 작업시간(분)') }, styleName: 'right-column editable_column', mergeRule: { criteria: "values['WORK_STANDARD_ID'] + values['UNIT_ID'] + value" } },
    { fieldName: 'WORK_DAY_PER', dataType: 'number', width: '80', numberFormat: '0.00', editable: false, header: { text: t('1일 작업 비율(%)') }, styleName: 'right-column', mergeRule: { criteria: "values['WORK_STANDARD_ID'] + values['UNIT_ID'] + value" } },
    { fieldName: 'HANDLE_TOOL', dataType: 'text', width: '100', header: { text: t('취급 치공구') }, styleName: 'left-column editable_column', mergeRule: { criteria: "values['WORK_STANDARD_ID'] + values['UNIT_ID'] + value" }},
    { fieldName: 'WORK_FREE', dataType: 'text', width: '200', header: { text: t('업무 자율성') }, styleName: 'left-column editable_column', editor: { type: 'dropdown' }, lookupDisplay: true, mergeRule: { criteria: "values['WORK_STANDARD_ID'] + values['UNIT_ID'] + value" } },

    { fieldName: 'IDX1', dataType: 'text', editable: false, header: { text: t('순번') }, visible: false },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('작업ID') }, visible : false },
    { fieldName: 'UNIT_ID', dataType: 'text', header: { text: t('단위ID') }, visible : false },
    { fieldName: 'ACT_ID', dataType: 'text', header: { text: t('단위ID') }, visible : false },
    { fieldName: 'UNIT_SORT', dataType: 'text', header: { text: t('정렬') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사코드') }, visible : false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, visible : false },
    { fieldName: 'DIAGNOSIS_DATE', dataType: 'text', header: { text: t('진단일') }, visible : false },
    { fieldName: 'HOSPITAL_CODE', dataType: 'text', header: { text: t('진단기관 코드') }, visible : false },
    { fieldName: 'HOSPITAL_NM', dataType: 'text', header: { text: t('진단기관') }, visible : false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('UP_CD') }, visible : false  },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    emit('btnCloseClick')
  } else if (btn.id === 'btnPrev') {
    emit('btnPrev')
  } else if (btn.id === 'btnNext') {
    emit('btnNext')
  } else if (btn.id === 'btnUpdate') {
    emit('btnUpdate')
  }
}

const getData = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let saveParams = []

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.UNIT_ID)) { // 작업단위가 없는 경우 unit_id가 null이라서 저장 시 에러
      Message.warn(t('등록되지 않은 작업단위는 저장할 수 없습니다.'))
      continue
    }
    if(isEmpty(saveParams.filter(item => item.UNIT_ID == data.UNIT_ID))) {
      saveParams.push(data) 
    }
  }

  return { WORK_STANDARD_LIST: saveParams }
}

const getGridData = () => {
  Promise.all([
    // 작업빈도
    getCodeList('HHII820G'),
    // 업무자율성
    getCodeList('HHII820H'),
  ]).then((res) => {
    codeList.WORK_OFTEN = res[0].ORESULT_CUR
    codeList.WORK_FREE = res[1].ORESULT_CUR 
  })
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  props.searchParams.DIAGNOSIS_DATE = props.searchParams.DIAGNOSIS_DATE.replaceAll('-','')
  return commonSearchApi({ queryId: 'HLTJB0010_SEARCH_06', param: props.searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.setBindingColumn('WORK_OFTEN', codeList.WORK_OFTEN, 'COD', 'TXT')
  grdMain.value.setBindingColumn('WORK_FREE', codeList.WORK_FREE, 'COD', 'TXT')
  grdMain.value.getGridView().setRowIndicator({ visible: false })

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 그리드 데이터 변경 시
const onEditCommit = async (grid, index, oldValue, newValue) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.itemIndex)
  
  await grid.commit()
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let rowData = grdMain.value.getDataProvider().getJsonRow(i)
    if(data.WORK_STANDARD_ID == rowData.WORK_STANDARD_ID && data.UNIT_ID == rowData.UNIT_ID) {
      grid.setValue(i, index.fieldName, newValue)
      grdMain.value.getGridView().checkRow(i, true, false, false)

      if(index.fieldName == 'WORK_DAY_TIME') {
        grid.setValue(i, 'WORK_DAY_PER', newValue / 460 * 100)
      }
    } 
  }
}

const initGrid = () => {
  grdMain.value.getDataProvider().setRows([])
}

onMounted(() => {
})

defineExpose({
  getData,
  getGridData,
  initGrid, 
})
</script> 

<template>
  <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move">
    <span>사업주 조사서2</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <IGridTitle 
      :use-permission="false"
      :button-list="['btnPrev', 'btnUpdate', 'btnClose']" 
      @click-button="onButtonsClick" 
      class="mt-2 mr-2"
    ></IGridTitle>
    <v-card-text class="pa-2 pt-0 content-area">
      <v-sheet class="flex-column">
        <RealGrid 
          ref="grdMain"
          style="height: 750px;"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          @onEditCommit="onEditCommit"
        />
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

</style>

