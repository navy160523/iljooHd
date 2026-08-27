<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import MNGCC0010Popup from '@/pages/10_management/MNG_C/MNGCC0010Popup.vue'
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const tab = ref('안전/보건')
const empPopup = ref(null)
const fileUploadPopup = ref(null)
const historyPopup = ref(null)
const addRowIndex = ref(null)
const fieldName = ref(null)
const fieldIndex = ref(null)
const dialog = ref(false)

const sysCodeList = reactive({
  HHZ03VAL: [],
  HHZ04VAL: [],
  HHZ03LAB: [],
  HHZ04LAB: [],
  HHA04: [],
  BUNYA: [],
  HHIZ110: [],
  BSNS_CDList: [],
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  SONIM_DIV: [],
  HAEIM_YN: 'N',
  FCTR_DIV: '',
})

const selectAll = ref('Y')

const gbnList = reactive([
  { label: '선임' , value: '선임' },
  { label: '보수' , value: '보수' },
])

const saveParam = ref(null)

const bunyaPop = ref(false)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, checkBar: { visible: true }, edit: { editable:false },},
  keys : ['SONIM_DIV', 'FCTR_DIV','EMP_NM'],
  fields : [ 
    { fieldName: 'SONIM_DIV', dataType: 'text', header: { text: t('선임구분'), styleName: 'header_validit', exportStyleName: 'export_header_style' }, width:'200',lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, button: 'action', exportStyleName: 'export_style', buttonVisibility: 'always' },
    { fieldName: 'FCTR_DIV', dataType: 'text', header: { text: t('사업장'), styleName: 'header_validit', exportStyleName: 'export_header_style' }, width:'150', lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, button: 'action', exportStyleName: 'export_style', buttonVisibility: 'always' },
    { fieldName: 'SONIM_LOC', dataType: 'text', header: { text: t('선임지역'), exportStyleName: 'export_header_style' }, width:'200', styleName: 'editable_column' , exportStyleName: 'export_style' },
    { fieldName: 'DIV_CD', dataType: 'text', width:'120', 
      header: { 
        // text: t('분야'), 
        // styleName: 'header_validit', 
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div style='text-align: end; align-self: center'><span>${headerText}</span></div><div><button><span class='mdi mdi-help-circle text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { 'headerText': t('분야')}
        // require('@/assets/images/QuestionMark.png')
      },
      lookupDisplay: true, editable: false,
      "styleCallback": function(grid, dataCell){ return styleCallback(grid, dataCell)},
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true, textReadOnly: true } },
    { fieldName: 'SONIM_INWON', dataType: 'text', header: { text: t('법적선임 인원(명)'), styleName: 'header_validit' }, width:'120', styleName: 'editable_column', required: true, requiredMessage: '[법적선임 인원(명)]은 필수입니다.' },
    { fieldName: 'SONIM_JAGYEC', dataType: 'text', header: { text: t('법적선임자격'), styleName: 'header_validit', exportStyleName: 'export_header_style' }, width:'150', styleName: 'left-column, editable_column',
      required: true, requiredMessage: '[법적선임자격]은 필수입니다.' , exportStyleName: 'export_style' },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명'), styleName: 'header_validit', exportStyleName: 'export_header_style' }, width:'120', button: 'action', 
      required: true, requiredMessage: '[성명]은 필수입니다.', exportStyleName: 'export_style' },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), styleName: 'header_validit', exportStyleName: 'export_header_style' }, width:'120', editable: false, exportStyleName: 'export_style' },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부'), styleName: 'header_validit', exportStyleName: 'export_header_style' }, width:'200', styleName: 'left-column', editable: false, lookupDisplay: true, exportStyleName: 'export_style' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), styleName: 'header_validit', exportStyleName: 'export_header_style' }, width:'200', styleName: 'left-column', editable: false, exportStyleName: 'export_style' },

    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위'), exportStyleName: 'export_header_style' }, styleName: 'left-column', exportStyleName: 'export_style', visible: false },

    { fieldName: 'COM_ENT_DATE', dataType: 'text', header: { text: t('입사일') }, width:'120', editable: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', header: { text: t('퇴사일') }, width:'120', editable: false,
      styleCallback: function(grid, dataCell){ return retiDate(grid, dataCell) } },
    { fieldName: 'SONIM_DATE', dataType: 'text','displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}, 
      width:'120', header: { text: t('선임일'), styleName: 'header_validit' }, width:'120', styleName: 'editable_column', required: true, requiredMessage: '[선임일]은 필수입니다.' ,
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'HAEIM_DATE', dataType: 'text','displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      width:'120', header: { text: t('해임일') }, width:'120', styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'FILE_ID_SON', dataType: 'text', header: { text: t('선임장') }, styleName: 'editable_column', isFile: { value: true, align: 'right', showAlways: true } ,
      'displayCallback': function(grid, index, value){return value ? 'Y' : null}, editable: false },
    { fieldName: 'DEC_DATE', dataType: 'text','displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}, 
      width:'120', header: { text: t('신고일자') }, width:'120', styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'FILE_ID_DEC', dataType: 'text', header: { text: t('신고서') }, styleName: 'editable_column', isFile: { value: true, align: 'right', showAlways: true },
      'displayCallback': function(grid, index, value){return value ? 'Y' : null}, editable: false },
    { fieldName: 'JAGYEC_DIV', dataType: 'text', header: { text: t('자격구분') }, width:'150', styleName: 'left-column, editable_column' },
    { fieldName: 'FILE_ID_JA', dataType: 'text', header: { text: t('자격 증명') }, styleName: 'editable_column', isFile: { value: true, align: 'right', showAlways: true },
      'displayCallback': function(grid, index, value){return value ? 'Y' : null} },
    { fieldName: 'SUDANG_YN', dataType: 'text', header: { text: t('자격수당 지급여부') }, width:'80', styleName: 'editable_column', 
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, editable: false },
    { fieldName: 'SUDANG_AMT', dataType: 'number', numberFormat: '#,###', header: { text: t('수당금액(원)'), exportStyleName: 'export_header_style' }, width:'120', styleName: 'editable_column',
      editor: { type: 'number' }, exportStyleName: 'export_style' },
    { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('구분'), styleName: 'header_validit' },lookupDisplay: true, lookupData: gbnList,
      width:'80', styleName: 'editable_column', required: true, requiredMessage: '[구분]은 필수입니다.',editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'EDU_INS', dataType: 'text', header: { text: t('교육기관') }, width:'150', styleName: 'editable_column' },
    { fieldName: 'NEW_EDU_DATE', dataType: 'text', width:'120', header: { text: t('신규') }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'RE_EDU_DATE', dataType: 'text', width:'120', header: { text: t('보수') }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'EDU_DATE', dataType: 'text', width:'120', header: { text: t('이수일') }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      required: true, requiredMessage: '[이수일]은 필수입니다.' },
    { fieldName: 'EDU_TERM', dataType: 'text', header: { text: t('교육주기(년)'), styleName: 'header_validit' }, 
      width:'120', styleName: 'editable_column', required: true, requiredMessage: '[교육주기(년)]은 필수입니다.' },
    { fieldName: 'EQP_LOC', dataType: 'text', header: { text: t('대상물 (장소)') }, width:'150', styleName: 'left-column, editable_column' },
    { fieldName: 'EQP_NM', dataType: 'text', header: { text: t('시설명') }, width:'150', styleName: 'left-column, editable_column' },
    { fieldName: 'EQP_MGT_NO', dataType: 'text', header: { text: t('사내관리 NO.') }, width:'120', styleName: 'editable_column' },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false  },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') } , visible: false },
    { fieldName: 'EXP_YN', dataType: 'text', header: { text: t('EXP_YN') } , visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') } , visible: false },
  ],
  columns : [],
  columnLayout: [
    'SONIM_DIV','FCTR_DIV','SONIM_LOC','DIV_CD','SONIM_INWON','SONIM_JAGYEC','EMP_NM','EMP_NO','BSNS_CD','DEPT_NM','JOB_TIT_NM',
    'COM_ENT_DATE','RETI_TMP_DATE','SONIM_DATE','HAEIM_DATE','FILE_ID_SON',
    {
      name: '선해임신고',
      direction: 'horizontal',
      items: [ 'DEC_DATE', 'FILE_ID_DEC' ],
      header: { text: t('선해임신고') },
    },
    ,'JAGYEC_DIV','FILE_ID_JA','SUDANG_YN','SUDANG_AMT',
    {
      name: '법정교육/이수일',
      direction: 'horizontal',
      items: [ 'EDU_DIV', 'EDU_INS','NEW_EDU_DATE','RE_EDU_DATE', 'EDU_DATE','EDU_TERM' ],
      header: { text: t('법정교육/이수일') },
    },
    ,'EQP_LOC',
    {
      name: '제조소',
      direction: 'horizontal',
      items: [ 'EQP_NM', 'EQP_MGT_NO'],
      header: { text: t('제조소') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const uploaded = val => {
  grdMain.value.getDataProvider().setValue(fieldIndex.value, fieldName.value, val.fileId)

  grdMain.value.getGridView().checkRow(fieldIndex.value, true)
}

const retiDate = (grid, dataCell) => {
  let data = grdMain.value.getDataProvider().getJsonRow(dataCell.index.dataRow)
  let ret = { style: {} }
  let lastMonth = dayjs().subtract(1, 'month').format('YYYY-MM')
  let RETI_TMP_DATE = data.RETI_TMP_DATE ? dayjs(data.RETI_TMP_DATE).format('YYYY-MM') : ''

  if(RETI_TMP_DATE === lastMonth){
    ret.style = { background: '#FFFF00' }
  }

  return ret
}

const styleCallback = (grid, dataCell) => {
  let state = grdMain.value.getDataProvider().getRowState(dataCell.index.dataRow)
  let gubun = grid.getValue(dataCell.index.itemIndex, 'SONIM_DIV')
  let ret = {}

  if(state === 'created' && (gubun === '060' || gubun === '070')){
    ret.editable = true
  }

  if(gubun === '060') {
    ret.editor = {
      type: 'dropdown',
      domainOnly: true, 
      dropDownWhenClick: true, 
      textReadOnly: true ,
      values: sysCodeList.HHZ03VAL,
      labels: sysCodeList.HHZ03LAB,
    }
  }else if(gubun === '070'){
    ret.editor = {
      type: 'dropdown',
      domainOnly: true, 
      dropDownWhenClick: true, 
      textReadOnly: true ,
      values: sysCodeList.HHZ04VAL,
      labels: sysCodeList.HHZ04LAB,
    }
  }

  return ret
}

const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  Promise.all([
    getCodeList('HHIHHZ03'), getCodeList('HHIHHZ04'), getCodeList('HHIHHA04', userStore.cmpnyDiv, 'Y'), commonSearchApi({ queryId : 'searchBSNS', param }),
  ]).then(res => {

    // 사업장(공장) 구분
    sysCodeList.HHA04 = res[2].ORESULT_CUR
    sysCodeList.HHA04.unshift({ TXT:"전체", COD: '' })


    res[0].ORESULT_CUR.forEach(element => {
      sysCodeList.BUNYA.push(element)
      sysCodeList.HHZ03VAL.push(element.COD)
      sysCodeList.HHZ03LAB.push(element.TXT)
    })

    res[1].ORESULT_CUR.forEach(element => {
      sysCodeList.BUNYA.push(element)
      sysCodeList.HHZ04VAL.push(element.COD)
      sysCodeList.HHZ04LAB.push(element.TXT)
    })

    sysCodeList.BSNS_CDList = res[3].ORESULT_CUR

    grdMain.value.setBindingColumn("FCTR_DIV", res[2].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("DIV_CD", sysCodeList.BUNYA, "COD", "TXT")
    grdMain.value.setBindingColumn("BSNS_CD", res[3].ORESULT_CUR, "BSNS_CD", "BSNS_NM")
  })
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  } else if(btn.id === 'btnClose'){
    onClose()
  } else {

    let rowCount = grdMain.value.getDataProvider().getRowCount()
    if(rowCount === 0) {
      Message.err(t('조회 데이터가 없습니다. 조회후 출력을 눌러 주세요.'))
      
      return
    }
    printSet()
  }
}

const searchData = () => {
  if(searchParams.SONIM_DIV.length === 0){
    searchParams.SONIM_DIV = ['0']
  } 
  
  return commonSearchApi({ queryId : 'MNGCC0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  if(searchParams.SONIM_DIV.length === 1 && searchParams.SONIM_DIV[0] === '0'){
    searchParams.SONIM_DIV = []
  }

  let data = res.ORESULT_CUR

  data.forEach(e => {
    e.COM_ENT_DATE = e.COM_ENT_DATE ? dayjs(e.COM_ENT_DATE).format('YYYY-MM-DD') : null
    e.RETI_TMP_DATE = e.RETI_TMP_DATE ? dayjs(e.RETI_TMP_DATE).format('YYYY-MM-DD') : null
    e.NEW_EDU_DATE = e.NEW_EDU_DATE ? dayjs(e.NEW_EDU_DATE).format('YYYY-MM-DD') : null
    e.RE_EDU_DATE = e.RE_EDU_DATE ? dayjs(e.RE_EDU_DATE).format('YYYY-MM-DD') : null
    e.EDU_DATE = e.EDU_DATE ? dayjs(e.EDU_DATE).format('YYYY-MM-DD') : null
  })
  
  grdMain.value.getDataProvider().setRows(data)
  grdMain.value.getGridView().columnByName('DIV_CD').sortable = false
}

const tabChange = e => {

  grdMain.value.getDataProvider().setRows([])
  sysCodeList.HHIZ110 = []
  searchParams.SONIM_DIV = []
  searchParams.HAEIM_YN = 'N'
  searchParams.FCTR_DIV = ''
  selectAll.value = 'Y'

  let param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    ALL_UP_CD: 'HHIZ110',
    USE_FLAG: 'N',
    CODE_NAME_TYPE: '0',
    CODE_DESC1: tab.value,
  }

  Promise.all([
    commonSearchApi({ queryId : 'MNGCC0010_SEARCH_03', param: param }),
  ]).then(res => {
    
    // res[0].ORESULT_CUR.forEach(element => {
    //   sysCodeList.HHIZ110.push(element)
    // })

    sysCodeList.HHIZ110 = res[0].ORESULT_CUR

    sysCodeList.HHIZ110.forEach(element => {
      searchParams.SONIM_DIV.push(element.COD)
    })

    grdMain.value.setBindingColumn("SONIM_DIV", sysCodeList.HHIZ110, "COD", "TXT")
  }).finally(() => {
    onButtonsClick({ id: 'btnSearch' })
  })
  
}

const onEmpSelected = val => {
  let COM_ENT_DATE = val.COM_ENT_DATE ? dayjs(val.COM_ENT_DATE).format('YYYY-MM-DD') : null
  let RETI_TMP_DATE = val.RETI_TMP_DATE ? dayjs(val.RETI_TMP_DATE).format('YYYY-MM-DD') : null

  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'EMP_NM', val.EMP_NM)
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'BSNS_CD', val.BSNS_CD)
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'DEPT_NM', val.DEPT_NM)
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'COM_ENT_DATE', COM_ENT_DATE)
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'RETI_TMP_DATE', RETI_TMP_DATE)
}

const printSet = () => {
  grdMain.value.getGridView().exportGrid({
    // type: 'csv',

    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '국가자격등록 수당 현황.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: "국가자격등록 수당 현황",
      visible: true,
      spaceTop: 1,
      spaceBottom: 0,
      height: 50,
      styleName: "excelTitle",
    },
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'hidden', // footer 표시하지 않음
    allColumns: true, // visible : false 인 행도 표시할 것인지 여부
    showColumns: 'JOB_TIT_NM',
    hideColumns: ['FILE_ID_SON','DEC_DATE','FILE_ID_DEC','JAGYEC_DIV','FILE_ID_JA','SUDANG_YN','EDU_DIV','EDU_INS', 'COM_ENT_DATE', 'DIV_CD', 'SONIM_INWON',
      ,'NEW_EDU_DATE','RE_EDU_DATE','EDU_DATE','EDU_TERM','EQP_LOC','EQP_NM','EQP_MGT_NO' , 'SONIM_DATE' , 'HAEIM_DATE', 'RETI_TMP_DATE' ],
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}

const handleSelectAll = e => {
  if(selectAll.value === 'Y'){
    searchParams.SONIM_DIV = []
    sysCodeList.HHIZ110.forEach(element => {
      searchParams.SONIM_DIV.push(element.COD)
    })
  } else {
    searchParams.SONIM_DIV = []  
  }
}

const handleSelectAll2 = e => {
  selectAll.value = 'N'
}

const allClick = e => {
  if(selectAll.value === 'Y'){
    selectAll.value = 'N'
  } else {
    selectAll.value = 'Y'
  }

  handleSelectAll()
}
const openPopup = async data => {  
  await initCodeList()
  await tabChange()

  await onButtonsClick({ id :'btnSearch' })
  //팝업 오픈
  dialog.value = true 
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
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
      <span>{{'법정선임자 및 교육이력 현황 팝업'}}</span>
    </v-sheet>

    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          :title="'법정선임자 및 교육이력 현황'"
          ref="menuTitle"
          :button-list="['btnSearch', 'btnExcel','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="mb-2">
            <VTabs v-model="tab" @update:model-value="tabChange">
              <VTab value="안전/보건">안전/보건</VTab>
              <VTab value="소방">소방</VTab>
              <VTab value="환경">환경</VTab>
              <VTab value="자산">자산</VTab>
            </VTabs>
          </v-sheet>
          <v-sheet class="searchArea d-flex">
            <div class="d-flex align-center pr-8" style="width: 550px;">
              <div class="formLabelText" style="width: 100px;">
                {{ $t('선임 구분') }}
              </div>
              <VAutocomplete 
                :items="sysCodeList.HHIZ110"
                v-model="searchParams.SONIM_DIV"
                item-title="TXT"
                item-value="COD"
                multiple
                clearable
                @update:modelValue="handleSelectAll2"
                close-on-item-click="false"
              >
                <template v-slot:prepend-item>
                  <v-list-item 
                    :class="selectAll === 'Y' ? 'select' : 'unselect'"
                    @click="allClick"
                  >
                    <v-list-item-title>
                      <VRow align="center">
                        <VCol cols="auto">
                          <v-checkbox 
                            v-model="selectAll"
                            @change="handleSelectAll"
                            color="rgb(81, 77, 88)"
                          />
                        </VCol>
                        <VCol>
                          <span>전체 선택</span>
                        </VCol>
                      </VRow>
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </VAutocomplete>
            </div>
            <i-select
              :label="$t('사업장')"
              labelWidth="50px"
              :items="sysCodeList.HHA04"
              v-model="searchParams.FCTR_DIV"
              item-title="TXT"
              item-value="COD"
              width="300px"
            />
            <div class="d-flex align-center pl-6">
              <div class="formLabelText mr-5">
                {{ $t('해임자 포함') }}
              </div>
              <VCheckbox
                v-model="searchParams.HAEIM_YN"
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
      <!-- 인원조회팝업 -->
      <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    
      <!-- 첨부파일 관리 -->
      <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" />
    
      <!-- 히스토리 팝업 -->
      <MNGCC0010Popup ref="historyPopup" :sysCodeList="sysCodeList" />
    
      <v-dialog
        v-model="bunyaPop"
        eager
        width="450"
      >
        <div class="title-bar">분야 입력 조건</div>
        <VContainer style="background-color: white" class="pt-0">
          <VRow class="pa-2">
            분야는 선임구분이 대기환경기술인, 유해화학물질관리자 일때만 입력 가능합니다.
          </VRow>
          <VRow justify="end">
            <v-btn @click="() => {bunyaPop = false}">닫기</v-btn>
          </VRow>
        </VContainer>
      </v-dialog>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>
.v-autocomplete__selection{
  flex-wrap: nowrap;
}
::v-deep(.v-field__input){
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  color: #000 !important;
  overflow: hidden !important;
}
.documentStyle {
  border: 1px solid black;
  text-align: center;
  font-size: 32pt;
}

::v-deep(.v-autocomplete__selection){
  flex: none;
}

.select {
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}

.unselect:hover{
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
