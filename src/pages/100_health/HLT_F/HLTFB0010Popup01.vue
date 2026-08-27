<!--
  화면명 : 화학물질 현황 관리
  화면개요 : 화학물질 상세
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { isEmpty } from '@/@core/utils'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'
import CopyPopup from '@/pages/100_health/HLT_F/HLTFA0010Popup01.vue'

const emit = defineEmits(["after-search"])

const mainBtnList = ref(['btnSearch', 'btnCreate'])
const subBtnList = ref(['btnSearch', 'btnCopy', 'btnUpdate','btnDelete', 'btnAllDownload'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const copyPopup = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)

const codeList = reactive({
  DEPT_CD: [],
  PROCESS_CD: [],
  UNIT: [
    { COD: 'ml', TXT: 'ml' },
    { COD: 'L', TXT: 'L' },
    { COD: 'g', TXT: 'g' },
    { COD: 'kg', TXT: 'kg' },
    { COD: 'ton', TXT: 'ton' },
  ],
})
/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  HALF_DIV: '',
  REG_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  DEPT_NM: '',
  CHK_DIV: 'N'
})

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', width: '60', header: { text: t('부서명') }, styleName: 'left-column',  lookupDisplay: true },
    { fieldName: 'MATNO', dataType: 'text', width: '50', header: { text: t('자재번호') } },
    { fieldName: 'MATDSC', dataType: 'text', width: '80', header: { text: t('제품명') }, styleName: 'left-column' },
    { fieldName: 'MSDS_NM', dataType: 'text', width: '80', header: { text: t('MSDS명') }, styleName: 'left-column' },
    { fieldName: 'TYPE_ID', dataType: 'text', width: '30', header: { text: t('TYPE') } },
    { fieldName: 'RECDATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '40', header: { text: t('최근입고일') } },
    { fieldName: 'VNDNME', dataType: 'text', width: '60', header: { text: t('납품사') }, styleName: 'left-column' },
    { fieldName: 'INSERT_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '40', header: { text: t('등록일자') } },

    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '120', header: { text: t('회사코드') }, visible : false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '120', header: { text: t('부서코드') }, visible : false },
    { fieldName: 'VNDCOD', dataType: 'text', width: '120', header: { text: t('납품사코드') }, visible : false },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columns : [],
})

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys: [],
  fields: [
    { fieldName: 'DEPT_NM', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('부서명') }, editable: false },
    { fieldName: 'MATNO', dataType: 'text', width: '40', header: { text: t('자재번호') }, editable: false },
    { fieldName: 'MATDSC', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('제품명') }, editable: false },
    { fieldName: 'VNDNME', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('납품사') }, editable: false },
    { fieldName: 'PROCESS_CD', dataType: 'text', width: '40', styleName: 'editable_column', header: { text: t('취급공정') }, editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: false }
        var dropList = { COD: [], TXT: [] }
        let remainPrcList = grdSub.value.getDataProvider().getJsonRows(0,-1).filter(item => item.MATNO === grid.getValue(dataCell.index.itemIndex, 'MATNO')).map(item => item.PROCESS_CD)
        // 같은 자재에서는 공정이 중복되어선 안되기에 같은자재에 등록되어있는 공정은 리스트에서 뺀다.
        for(var prc of codeList.PROCESS_CD) {
          if(!remainPrcList.includes(prc.COD)) {
            dropList.COD.push(prc.COD)
            dropList.TXT.push(prc.TXT)
          }
        }
        ret.editor = {
          type: 'dropdown',
          values: dropList.COD,
          labels: dropList.TXT,
          editable : true, 
          styleName : 'editable_column', 
          enabled: false,
          domainOnly: true,
          textReadOnly: true
        }
        return ret
      }
    },
    { fieldName: 'EXPENSE', dataType: 'text', width: '40', styleName: 'editable_column', header: { text: t('용도') } },
    { fieldName: 'MONTH_AVG_USE', dataType: 'number', 'numberFormat': '0', width: '40', styleName: 'editable_column', header: { text: t('월평균사용량') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'UNIT', dataType: 'text', width: '30', styleName: 'editable_column', header: { text: t('단위') }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'DAILY_USE_MIN', dataType: 'number', 'numberFormat': '0', width: '30', styleName: 'editable_column', header: { text: t('분/일') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'DAILY_USE_CNT', dataType: 'number', 'numberFormat': '0.#', width: '30', styleName: 'editable_column', header: { text: t('일/주') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },    
    { fieldName: 'MONTH_USE_MIN', dataType: 'number', 'numberFormat': '0.#', width: '30', styleName: 'editable_column', header: { text: t('시간/월') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'MONTH_USE_CNT', dataType: 'number', 'numberFormat': '0', width: '30', styleName: 'editable_column', header: { text: t('개월/년') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
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
    'PROCESS_CD',
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
grdSubProps.columns = grdSubProps.fields

const openPopup = (param) => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])

  grdMain.value.getGridView().filterPanel.visible = true
  grdSub.value.getGridView().filterPanel.visible = true

  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.HALF_DIV = param.HALF_DIV
  searchParams.REG_DIV = param.REG_DIV
  searchParams.BSNS_CD = param.BSNS_CD
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.DEPT_NM = param.DEPT_NM

  // 제출완료시 추가/수정 불가능하도록 변경
  if(param.SUB_DIV === 'Y') {
    mainBtnList.value = ['btnSearch']
    subBtnList.value = ['btnSearch', 'btnAllDownload']
  }else {
    mainBtnList.value = ['btnSearch', 'btnCreate']
    subBtnList.value = ['btnSearch', 'btnCopy', 'btnUpdate','btnDelete', 'btnAllDownload']
  }
  
  getCode()
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch') {
    getMainData()
  } else if(btn.id === 'btnCreate') {
    addData()
  } else if (btn.id === "btnClose") {
    closePopup()
  } 
}

const onSubButtonsClick = (btn) => {
  if(btn.id === 'btnSearch') {
    getSubData()
  } else if (btn.id === 'btnCopy') {
    copyPopup.value.openPopup(searchParams, 'HLTFB0010_SEARCH_07', 'HLTFB0010_SAVE_07')
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub}])
      .setGridList([grdSub])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnAllDownload') {
    if(grdSub.value.getDataProvider().getRowCount() === 0){
      return Message.warn(t('조회된 데이터가 없습니다.'))
    }
    Promise.all([
      // 화학물질 첨부파일
      commonSearchApi({ queryId: 'HLTFB0010_SEARCH_02', param: searchParams }),
    ]).then((res) => {
      vm.$swal({
        title: t('일괄 다운로드 하시겠습니까?'),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          allDownload(res[0].ORESULT_CUR)
        } 
      })
    })
  }
}

const allDownload = async (files) => {
  
  for(var fileId of files) {
    if(isEmpty(fileId.MSDS_FILEID)) {
      Message.warn(t('자재번호 [' + fileId.MATNO + ']에 대한 첨부파일이 누락되었습니다. 확인 바랍니다. '))
      continue
    }

    var data = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      FILE_ID: fileId.MSDS_FILEID,
      ...fileId
    }
    await downloadFile(data)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  exportGrid(searchParams)
}

const getCode = () => {
  Promise.all([
    // 공정코드
    commonSearchApi({ queryId: 'HLTFB0010_SEARCH_06', param: searchParams }),
  ]).then((res) => {
    codeList.PROCESS_CD = res[0].ORESULT_CUR
    grdSub.value.setBindingColumn('PROCESS_CD', codeList.PROCESS_CD, 'COD', 'TXT')
    grdSub.value.setBindingColumn('UNIT', codeList.UNIT, 'COD', 'TXT')
    getMainData()
    getSubData()
  })
}

// 메인 데이터 조회
const getMainData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .showMessage(true)
    .run()
}

//DB 조회
const searchMainData = () => { 
  return commonSearchApi({ queryId : 'HLTFB0010_SEARCH_05', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 그리드 데이터 조회
const getSubData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchSubData)
    .setAfter(afterSubSearch)
    .showMessage(true)
    .run()
}

//DB 조회
const searchSubData = () => { 
  return commonSearchApi({ queryId : 'HLTFB0010_SEARCH_04', param: searchParams })
}

//조회 후 반영
const afterSubSearch = res =>{
  grdSub.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const addData = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  grdSub.value.getGridView().filterPanel.clearInput()
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    grdSub.value.addRow({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV,
      REG_DIV: searchParams.REG_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      DEPT_NM: data.DEPT_NM,
      MATNO: data.MATNO,
      MATDSC: data.MATDSC,
      VNDNME: data.VNDNME,
      VNDCOD: data.VNDCOD,
      PROCESS_CD: '',
      EXPENSE: '',
      MONTH_AVG_USE: 0,
      UNIT: '',
      DAILY_USE_MIN: 0,
      DAILY_USE_CNT: 0,
      MONTH_USE_MIN: 0,
      MONTH_USE_CNT: 0,
      STATE: '',
      SAVE_YN: 'N',
    }, false)
  }
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.HALF_DIV)) {
      return Message.warn(t('반기는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.REG_DIV)) {
      return Message.warn(t('구분은 필수 입력 사항입니다.'))
    } else if(isEmpty(data.BSNS_CD)) {
      return Message.warn(t('사업부는 필수 입력 사항입니다.'))      
    } else if(isEmpty(data.DEPT_CD)) {
      return Message.warn(t('부서는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.VNDCOD)) {
      return Message.warn(t('납품사는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.MATNO)) {
      return Message.warn(t('자재번호는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.PROCESS_CD)) {
      return Message.warn(t('공정코드는 필수 입력 사항입니다.'))
    }

  }
  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTFB0010_SAVE_06', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 저장되었습니다'))
  getSubData()
}

const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    // DB에 저장되있는 것만 넣는다.
    if(data.SAVE_YN != 'Y') {
      continue
    }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTFB0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getSubData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

const downloadFile = async (data) => {
  
  try {
    const res = await commonDownloadFilesApi(data)
    
    //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    const file = res.contentDisposition.split('fileName="')
    const blob = new Blob([res])
    const link = document.createElement('a')

    link.href = URL.createObjectURL(blob)

    //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
    link.download = await decodeURI(file[1].replace('";', ''))
    await link.click()
    await URL.revokeObjectURL(link.href)
  } catch(e) {
    // console.log('e', e)
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  grdSub.value.getDataProvider().setRows([])
  dialog.value = false
}

const exportGrid = (param) => {

  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.HALF_DIV = param.HALF_DIV
  searchParams.REG_DIV = param.REG_DIV
  searchParams.BSNS_CD = param.BSNS_CD
  searchParams.DEPT_CD = param.DEPT_CD

  Promise.all([
    // 공정코드
    commonSearchApi({ queryId: 'HLTFB0010_SEARCH_06', param: searchParams }),
  ]).then((res) => {
    codeList.PROCESS_CD = res[0].ORESULT_CUR
    grdSub.value.setBindingColumn('PROCESS_CD', codeList.PROCESS_CD, 'COD', 'TXT')
    grdSub.value.setBindingColumn('UNIT', codeList.UNIT, 'COD', 'TXT')

    // await getSubData()
    commonSearchApi({ queryId : 'HLTFB0010_SEARCH_04', param: searchParams }).then(res => {
      // 조회 건수가 없을 시에는 엑셀 다운로드를 하지 않는다.
      if(res.ORESULT_CUR.length === 0) return
      grdSub.value.getDataProvider().setRows([])
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      grdSub.value.getGridView().exportGrid({
        type: 'excel',
        target: 'local',
        lookupDisplay: true,
        fileName: searchParams.YEAR+ '년도 '
          + (searchParams.HALF_DIV === 'HI' ? '상반기' : '하반기') + '_'
          + (searchParams.REG_DIV === 'A' ? '정기' : '수시') + ' 화학물질 상세현황(' 
          + param.DEPT_NM + ')'
          + '.xlsx', // 저장될 파일 name
        documentTitle: { //제목
          message: searchParams.YEAR+ '년도 '
            + (searchParams.HALF_DIV === 'HI' ? '상반기' : '하반기') + '_'
            + (searchParams.REG_DIV === 'A' ? '정기' : '수시') + ' 화학물질 상세현황(' 
            + param.DEPT_NM + ')',
          visible: true,
          spaceTop: 1,
          spaceBottom: 0,
          height: 80,
          styleName: 'excelTitle',
        },
        progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
        // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
        indicator: 'visible', // indidator 영역 표시
        header: 'visible', // 헤더 표시
        footer: 'visible', // footer 표시하지 않음
        allColumns: false, // visible : false 인 행도 표시할 것인지 여부
        done: () => {
          // 내보내기 완료 후 실행되는 함수
          // Message.success(t('엑셀 다운로드가 완료되었습니다.'))
        },
      })
    })
  })

  // dialog.value = false
}

const onEditCommit = (grid, index, oldValue, newValue) => {
  if(index.fieldName == 'DAILY_USE_MIN' ) {
    let dailyUseCnt = grid.getValue(index.itemIndex, 'DAILY_USE_CNT')
    // null 이면 0으로 넣어주기
    if(isEmpty(dailyUseCnt)) dailyUseCnt = 0
    grid.setValue(index.itemIndex, 'MONTH_USE_MIN', newValue * dailyUseCnt * 4 / 60)
  } else if (index.fieldName == 'DAILY_USE_CNT') {
    let dailyUseMin = grid.getValue(index.itemIndex, 'DAILY_USE_MIN')
    // null 이면 0으로 넣어주기
    if(isEmpty(dailyUseMin)) dailyUseMin = 0
    grid.setValue(index.itemIndex, 'MONTH_USE_MIN', dailyUseMin * newValue * 4 / 60)
  }
}

defineExpose({
  openPopup,
  exportGrid
})

onMounted(() => {
  
})

watch(() => searchParams.CHK_DIV, (newValue, oldValue) => {
  getMainData()
})


</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    height="905"
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
      <span>화학물질 현황 관리</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="height:440px;">
        <div class="d-flex justify-space-between">
          <VCheckbox
              true-value="Y"
              false-value="N"
              v-model="searchParams.CHK_DIV"
              :label="$t('1년 이내 입고제품만 보기')"
            />
          <IGridTitle 
            ref="menuTitle"
            :title="$t('')"
            :button-list="mainBtnList"
            @click-button="onButtonsClick"
          />
        </div>
        <v-sheet class="searchArea flex-column">
          <RealGrid 
            ref="grdMain"
            style="height: 305px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>
      <v-card-text class="pa-4 pt-0 content-area" style="height:440px;">
        <div>
          <IGridTitle 
            ref="menuTitle"
            :title="$t('')"
            :button-list="subBtnList"
            @click-button="onSubButtonsClick"
          />
        </div>
        <v-sheet class="searchArea flex-column">
          <RealGrid 
            ref="grdSub"
            style="height: 300px;"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
            @onEditCommit="onEditCommit"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
  <CopyPopup ref="copyPopup" @after-search="getSubData"/>
</template>

<style scoped lang="scss">
</style>
