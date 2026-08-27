<!-- 
  화면명 : 작업환경측정 결과관리
  화면개요 : 결과관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'
import { useCommonStore } from '@hiway/stores/common'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import NoticePopup from '@/pages/100_health/HLT_F/HLTFC0010Popup01.vue'

defineOptions({
  name:'100_health-HLT_F-HLTFC0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()
const isAdmin = ref(false)
const deptPopup = ref(null)
const noticePopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI',
  YEAR: String(dayjs().get('year')),
  REG_DIV: 'A',
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  MEAS_EVAL: '',
  ORGN_DIV: '',
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  DEPT_CD: [],
  PROCESS_CD: [],
  MEAS_EVAL: [
    { COD: '', TXT: '' },
    { COD: '초과', TXT: '초과' },
    { COD: '미만', TXT: '미만' },
  ],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
  UNIT: [],
  CLASSIFI: [],
  PROCESS_CD: [],
  BSNS_CD: []
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  if(useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes('HLTF001') || 
    userStore.authGrpCd.includes('HLTF002') || 
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    userStore.authGrpCd.includes('GRP00372')) {
      isAdmin.value = true
  }

  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 10,
    })
  })  

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i) })
  }
  grdMain.value.getGridView().filterPanel.visible = true

  Promise.all([
    // 부서, 협력사
    commonSearchApi({ queryId: 'HLTFC0010_SEARCH_ASGN', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, HALF_DIV: searchParams.HALF_DIV, USE_DIV: ''} }),
    // 상하반기
    getCodeList('HHII800'),
    // 단위
    getCodeList('HHII802'),
    // 분류
    getCodeList('HHII803'),
    // 차수 
    commonSearchApi({ queryId: 'HLTFC0010_SEARCH_02', param: searchParams }),
    // 공정코드
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_09', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, HALF_DIV: searchParams.HALF_DIV } }),
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV } }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.HALF_DIV = res[1].ORESULT_CUR
    codeList.UNIT = res[2].ORESULT_CUR
    codeList.CLASSIFI = res[3].ORESULT_CUR
    codeList.PROCESS_CD = res[5].ORESULT_CUR
    codeList.BSNS_CD = res[6].ORESULT_CUR
    
    grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
    grdMain.value.setBindingColumn('UNIT', codeList.UNIT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CLASSIFI', codeList.CLASSIFI, 'COD', 'TXT')
    grdMain.value.setBindingColumn('PROCESS_CD', codeList.PROCESS_CD, 'COD', 'TXT')
    grdMain.value.setBindingColumn('ORGN_DIV', [{COD: 'A', TXT: '직영'}, {COD: 'B', TXT: '협력사'}], 'COD', 'TXT')
  })
  grdMain.value.setBindingColumn('REG_DIV', codeList.REG_DIV, 'COD', 'TXT')
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true },},
  keys : ['NO'], 
  fields : [ 
    { fieldName: 'NO', width: '50', editable: false, dataType: 'text', header: { text: t('NO') }, visible: false }, // no과 이름이 같아서 이상하다고 함
    { fieldName: 'MEAS_DATE', width: '70', dataType: 'text', header: { text: t('측정일자') } },
    { fieldName: 'BSNS_CD', width: '80', dataType: 'text', header: { text: t('사업부코드') } },
    { fieldName: 'BSNS_NM', width: '100', dataType: 'text', styleName: 'left-column', header: { text: t('사업부') } },
    { fieldName: 'DEPT_CD', width: '80', dataType: 'text', header: { text: t('부서코드') }, },
    { fieldName: 'DEPT_NM', width: '150', dataType: 'text', styleName: 'left-column', header: { text: t('부서') } },
    { fieldName: 'ASGN_CD', width: '80', dataType: 'text', header: { text: t('협력사코드') }, lookupDisplay: true },
    { fieldName: 'ASGN_NM', width: '150', dataType: 'text', header: { text: t('협력사명') }, lookupDisplay: true },
    { fieldName: 'ORGN_DIV', width: '80', dataType: 'text', styleName: 'left-column', header: { text: t('조직구분') }, lookupDisplay: true,  editor: { type: 'dropdown' } },
    { fieldName: 'PROCESS_CD', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('공정') }, lookupDisplay: true,  editor: { type: 'dropdown' } },
    { fieldName: 'WORKER_CNT', width: '70', dataType: 'text', styleName: 'right-column', header: { text: t('근로자수') } },
    { fieldName: 'WORK_KIND_CONT', width: '150', dataType: 'text', header: { text: t('근로형태 및 실 근로시간') }, },
    { fieldName: 'OCCU_TIME', width: '70', dataType: 'text', styleName: 'right-column', header: { text: t('발생시간') } },
    { fieldName: 'CYCLE', width: '80', dataType: 'text', header: { text: t('주기') } },
    { fieldName: 'HARM_CD', width: '80', dataType: 'text', header: { text: t('유해코드') } },
    { fieldName: 'HARM_NM', width: '200', dataType: 'text', styleName: 'left-column', header: { text: t('유해인자') } },
    { fieldName: 'WORKER_NM', width: '100', dataType: 'text', styleName: 'left-column', header: { text: t('근로자명') } },
    { fieldName: 'WORK_CONT', width: '200', dataType: 'text', styleName: 'left-column', header: { text: t('작업내용') } },
    { fieldName: 'MEAS_LOCATION', width: '100', dataType: 'text',  header: { text: t('측정위치') } },
    { fieldName: 'ST_TIME', width: '60', dataType: 'text', header: { text: t('시작시간') } },
    { fieldName: 'EN_TIME', width: '60', dataType: 'text', header: { text: t('종료시간') } },
    { fieldName: 'MEAS_VALUE', width: '100', dataType: 'text', styleName: 'right-column', header: { text: t('측정치') } },
    { fieldName: 'LAST_VALUE', width: '100', dataType: 'text', styleName: 'right-column', header: { text: t('전회치') } },
    { fieldName: 'NOW_VALUE', width: '100', dataType: 'text', styleName: 'right-column', header: { text: t('금회치') } },
    { fieldName: 'EXPO_CRIT', width: '100', dataType: 'text', styleName: 'right-column', header: { text: t('노출기준') } },
    { fieldName: 'UNIT', width: '60', dataType: 'text', header: { text: t('노출단위') }, lookupDisplay: true },
    { fieldName: 'MEAS_EVAL', width: '60', dataType: 'text', header: { text: t('평가') } },
    { fieldName: 'MEAS_KIND', width: '180', dataType: 'text', styleName: 'left-column', header: { text: t('측정방법') } },
    { fieldName: 'CLASSIFI', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('분류') }, lookupDisplay: true, editor: { type: 'dropdown' } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    // { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('협력사 코드') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') },visible: false, },
    { fieldName: 'PROCESS_NM', dataType: 'text', header: { text: t('공정명') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnExcelFormDownload') {
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '작업환경측정 결과관리 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {

    if(isEmpty(searchParams.YEAR)) {
      return Message.warn(t('년도는 필수 입력 사항입니다.'))
    } else if (isEmpty(searchParams.HALF_DIV)) {
      return Message.warn(t('반기는 필수 입력 사항입니다.'))
    } else if (isEmpty(searchParams.REG_DIV)) {
      return Message.warn(t('구분은 필수 입력 사항입니다.'))
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = function(event) {
      commonStore.loading = true
      const selectedFile = event.target.files[0]
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
    
  } else if (btn.id === 'btnUpdate') {
    let checkRows = grdMain.value.getGridView().getCheckedRows(true)
    let errList = []
    for (let rowIdx of checkRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      //아래의 행들은 위와같은 오류사항으로 인하여 저장할 수 없습니다. 아래의 행들을 제외하고 저장하시겠습니까?
      if(isEmpty(data.YEAR)) {
        errList.push(`${rowIdx} 행의 년도가 빈값입니다.`)
      }
      if(isEmpty(data.HALF_DIV)) {
        errList.push(`${rowIdx} 행의 반기구분이 빈값입니다.`)
      }
      if(isEmpty(data.REG_DIV)) {
        errList.push(`${rowIdx} 행의 구분이 빈값입니다.`)
      }
      if(isEmpty(data.BSNS_CD)) {
        errList.push(`${rowIdx} 행의 사업부코드가 빈값입니다.`)
      }
      if(isEmpty(data.DEPT_CD)) {
        errList.push(`${rowIdx} 행의 부서코드가 빈값입니다.`)
      }
      if(isEmpty(data.MEAS_DATE)) {
        errList.push(`${rowIdx} 행의 측정일자가 빈값입니다.`)
      }
      if(isEmpty(data.PROCESS_CD)) {
        errList.push(`${rowIdx} 행의 공정코드가 빈값입니다.`)
      }
      if(isEmpty(data.WORKER_NM)) {
        errList.push(`${rowIdx} 행의 근로자명이 빈값입니다.`)
      }
      if(isEmpty(data.ST_TIME)) {
        errList.push(`${rowIdx} 행의 시작시간이 빈값입니다.`)
      }
    }
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()

  } else if (btn.id === 'btnErrChk') {
    let err = []
    vm.$nextTick(() => {
      commonStore.loading = true
    })
    for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0, -1).length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRows(0, -1)[i]
      
      if(isEmpty(data.DEPT_CD) || (isEmpty(data.ASGN_CD) && data.ORGN_DIV == 'B')) {
        err.push({NO: i + 1, CONTENT: '올바르지 않은 부서/협력사명입니다. 부서/협력사명 : ' + data.DEPT_NM})
      }
      if(isEmpty(data.PROCESS_CD)) {
        err.push({NO: i + 1, CONTENT: '올바르지 않은 공정입니다.'})
      }
    }
    vm.$nextTick(() => {
      commonStore.loading = false
    })
    if(!isEmpty(err)) {
      noticePopup.value.openPopup(err, grdMain.value.getDataProvider().getJsonRows(0, -1).length)
    } else {
      return Message.warn(t('오류내역이 없습니다.'))
    }
  }
}

// 그리드 데이터 조회
const getData = () => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }
  
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTFC0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 행마다 색깔 바꾸기
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{ background: '#eff8fd' } }
    if(isEmpty(grid.getValue(item.index, 'DEPT_CD')) || 
      (isEmpty(grid.getValue(item.index, 'ASGN_CD')) && grid.getValue(item.index, 'ORGN_DIV') == 'B') ||
      (isEmpty(grid.getValue(item.index, 'PROCESS_CD')))) {
      ret.style = { background: '#FF8888' }
    }
    return ret
  })
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId : 'HLTFC0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => { 
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const deleteData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }

  return commonExecuteApi({ queryId : 'HLTFC0010_DELETE_02', list: saveParams })
} 

const afterDelete = () => {
  Message.success(t('성공적으로 삭제되었습니다'))
  getData()
}

//엑셀 업로드 이벤트
const excelUploadCallback = async(excelData) => {  
  let preStTime = ''
  let preEnTime = ''
  let preMeasKind = ''
  let gridData = []
  const deptList = codeList.DEPT_CD.filter(item => item.ORGN_DIV == 'A')
  const asgnList = codeList.DEPT_CD.filter(item => item.ORGN_DIV == 'B')
  grdMain.value.getDataProvider().setRows([])
  let errMsg = []
  // 엑셀 데이터 한줄씩 확인
  excelData.map(item => {
    try {
      let addRow = {
        NO: item.순서,
        MEAS_DATE: item['측정\n일자'],
        BSNS_CD: '',
        BSNS_NM: '',
        DEPT_CD: '',
        DEPT_NM: '',
        ASGN_CD: '',
        ASGN_NM: '',
        ORGN_DIV: '',
        PROCESS_CD: '',
        PROCESS_NM: item['단위작업장소'],
        WORKER_CNT: item['근로\n자수'],
        WORK_KIND_CONT: item['근로형태\n및실근로\n시간'],
        OCCU_TIME: item['발생시간'],
        CYCLE: item['주기\n(소음제외)'],
        HARM_CD: item['유해\n코드'],
        HARM_NM: item['유해인자'],
        WORKER_NM: item['근로자명1'],
        WORK_CONT: item['작업내용1'],
        MEAS_LOCATION: item['측정위치1'],
        ST_TIME: '',
        EN_TIME: '',
        MEAS_VALUE: isNaN(Number(item['측정치'])) ? 0 : item['측정치'],
        LAST_VALUE: isNaN(Number(item['전회치'])) ? 0 : item['전회치'], 
        NOW_VALUE: isNaN(Number(item['금회치'])) ? 0 : item['금회치'],
        EXPO_CRIT: item['노출기준1'],
        UNIT: '',
        MEAS_EVAL: item['평가'],
        MEAS_KIND: '',
        CLASSIFI: item['인자'],
        CMPNY_DIV: searchParams.CMPNY_DIV,
        YEAR: searchParams.YEAR,
        HALF_DIV: searchParams.HALF_DIV,
        REG_DIV: searchParams.REG_DIV,
      }
      if(isEmpty(item['부서\n공정'])) {
        return
      }
      // item['부서 및 공정'] = item['부서 및 공정'].replaceAll('㈜','').replaceAll('(주)', '')
      let asgnNm = item['부서\n공정'].match(/^(.*?)\s*\[(.*?)\]$/)
      
      // 1차로 괄호 다 빼고 비교
      let process = codeList.PROCESS_CD.find(data => item['단위작업장소'].replace(/\s*[\(\[].*?[\)\]]\s*/g, '').trim() == data.TXT)
      let unit = codeList.UNIT.find(data => item['노출\n단위'] === data.TXT)
      // 부서 및 공정에 대괄호가 없으면 직영부서, 있으면 협력사
      if(isEmpty(asgnNm)) {
        let asgn = item['부서\n공정']

        // 부서, 협력사 찾기. 없으면 return
        let asgnMap = codeList.DEPT_CD.find(data => data.DEPT_NM === asgn.trim())

        addRow.ORGN_DIV = 'A'
        if(isEmpty(asgnMap)) {
          errMsg.push({NO: item['순서'], CONTENT: '올바르지 않은 부서/협력사명입니다. 부서/협력사명 : ' + asgn.trim()})
          addRow.DEPT_NM = asgn
        } else {
          addRow.BSNS_CD = asgnMap.BSNS_CD
          addRow.BSNS_NM = asgnMap.BSNS_NM
          addRow.DEPT_CD = asgnMap.ASGN_CD
          addRow.DEPT_NM = asgnMap.DEPT_NM
          // addRow.ASGN_CD = asgnMap[0].ASGN_CD 
        }
      } else {
        let dept = asgnNm[1].replaceAll(' ', '')
        let asgn = asgnNm[2].replaceAll('㈜','').replaceAll('(주)', '').replaceAll(' ', '')

        // 엑셀에 '부서공정명으로 뽑아낸 부서명과 협력사명 매칭'
        let deptMap1 = deptList.find(data => dept.trim() == data.DEPT_NM)
        // 부서공정명으로 뽑아낸 부서명이 기존 부서랑 다를 수 있어서 예비용으로 엑셀파일 부서명 가져오기        
        // 그냥 부서명을 쓰면 될거같은데 혹시모르니 일단 따로가져와서 예비용으로 붙여주는중..
        let deptMap2 = deptList.find(data => item['부서'].trim() == data.DEPT_NM)

        let asgnMap = asgnList.find(data => asgn == data.DEPT_NM.replaceAll('㈜','').replaceAll('(주)', '').replaceAll(' ', ''))
        addRow.ORGN_DIV = 'B'
        let deptMap = deptMap1 ?? deptMap2
        if(isEmpty(deptMap)) {
          errMsg.push({NO: item['순서'], CONTENT: '올바르지 않은 부서/협력사명입니다. 부서/협력사명 : ' + asgn.trim()})
          addRow.DEPT_NM = asgnNm[1]
          addRow.ASGN_NM = asgn
        } else {
          addRow.BSNS_CD = deptMap.BSNS_CD
          addRow.BSNS_NM = deptMap.BSNS_NM
          addRow.DEPT_CD = deptMap.ASGN_CD
          addRow.DEPT_NM = deptMap.DEPT_NM
          if(isEmpty(asgnMap)) {
            errMsg.push({NO: item['순서'], CONTENT: '올바르지 않은 부서/협력사명입니다. 부서/협력사명 : ' + asgn.trim()})
            addRow.ASGN_NM = asgn
          } else {
            addRow.ASGN_CD = asgnMap.ASGN_CD
            addRow.ASGN_NM = asgnMap.DEPT_NM.replaceAll('㈜','(주)')
          } 
        }
      }
      if (isEmpty(process)) {
        // 2차로 소괄호 넣고 검사
        process = codeList.PROCESS_CD.find(data => item['단위작업장소'].replace(/\s*[\[].*?[\]]\s*/g, '').trim() == data.TXT)
        if(isEmpty(process)) {
          // 3차로 괄호 다 넣고 검사
          process = codeList.PROCESS_CD.find(data => item['단위작업장소'].trim() == data.TXT)
          if(isEmpty(process)) {
            errMsg.push({NO: item['순서'], CONTENT: '올바르지 않은 공정입니다. 공정명: ' + item['단위작업장소']})
          } else {
            addRow.PROCESS_CD = process.COD
          }
        } else { 
          addRow.PROCESS_CD = process.COD
        }
      } else {
        addRow.PROCESS_CD = process.COD
      }

      // } else if (isEmpty(item['측정\n일자'])){
      //   // 측정일자 없을 시 제외
      //   return
      // } 
      
      if (isEmpty(unit)) {
        unit = [{TXT: '-', COD: '7'}]
      } 
      // addRow.DEPT_NM = item['부서 및 공정']
      addRow.UNIT = unit.COD

      // 없으면 이전행 데이터 가져온다.
      if(isEmpty(item['시작\n시간'])) {
        addRow.ST_TIME = preStTime.toString().replaceAll(':','')
      } else {
        addRow.ST_TIME = item['시작\n시간'].toString().replaceAll(':','')
        preStTime = item['시작\n시간']
      }

      if(isEmpty(item['종료\n시간'])) {
        addRow.EN_TIME = preEnTime.toString().replaceAll(':','')
      } else {
        addRow.EN_TIME = item['종료\n시간'].toString().replaceAll(':','')
        preEnTime = item['종료\n시간']
      }

      if(isEmpty(item['측정방법'])) {
        addRow.MEAS_KIND = preMeasKind
      } else {
        addRow.MEAS_KIND = item['측정방법']
        preMeasKind = item['측정방법']
      }
      gridData.push(addRow)
    } catch(error) {
      console.error(error)
      commonStore.loading = false 
    }
  })
  gridData.sort((a, b) => {
    const isCheck = (item) => {
      const deptEmpty = !item.DEPT_CD
      const orgnBAndAsgnEmpty = item.ORGN_DIV === 'B' && !item.ASGN_CD
      const proessEmpty = !item.PROCESS_CD
      return deptEmpty || orgnBAndAsgnEmpty || proessEmpty
    }
    const aEmpty = isCheck(a)
    const bEmpty = isCheck(b)
    if (aEmpty && !bEmpty) return -1
    if (!aEmpty && bEmpty) return 1
    return 0
  })
  grdMain.value.getDataProvider().setRows(gridData)
  // for(let i = 0; i < gridData.length; i++) {
  //   grdMain.value.getGridView().checkRow(i, true, false, false)
  // }
  commonStore.loading = false 
  
  await commonRequest('/hse/health/HLTFC0010_SAVE_01', { deleteParam: searchParams, data: gridData } ).then(res => {
    noticePopup.value.openPopup(errMsg, gridData.length)
  })
}

//팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  onButtonsClick({ id: 'btnSearch'})
}

const openDeptcdPopup = () => {
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.DEPT_NM })
}

const clearDeptcd = () => {
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''
  onButtonsClick({ id: 'btnSearch'})
}

const onEditCommit = (grid, index, oldValue, newValue) => {
  if(index.fieldName == 'PROCESS_CD'){
    let prcNm = codeList.PROCESS_CD.find(item => item.COD == newValue)
    if(!isEmpty(prcNm)) {
      grid.setValue(index.itemIndex, 'PROCESS_NM', prcNm.TXT)

    }
  }
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  commonSearchApi({ queryId: 'HLTFC0010_SEARCH_02', param: searchParams }).then(res => {
    getData()
  })
})
 
watch(() => searchParams.HALF_DIV, (newValue, oldValue) => {
  commonSearchApi({ queryId: 'HLTFC0010_SEARCH_02', param: searchParams }).then(res => {
    getData()
  })
})

watch(() => searchParams.REG_DIV, (newValue, oldValue) => {
  commonSearchApi({ queryId: 'HLTFC0010_SEARCH_02', param: searchParams }).then(res => {
    getData()
  })
})

watch(() => searchParams.MEAS_EVAL, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
  getData()
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete', 'btnExcelFormDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.HALF_DIV"
            :label="$t('반기구분')"
            label-width="50px"
            :items="codeList.HALF_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.REG_DIV"
            :label="$t('구분')"
            label-width="50px"
            :items="codeList.REG_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            v-model="searchParams.DEPT_CD"
            label-width="50px"
            :label="$t('부서')"
            width="180px"
            :readonly="true"
          />
          <i-input
              v-model="searchParams.DEPT_NM"
              width="150px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptcdPopup"
              @keydown.enter="openDeptcdPopup"
            >
              <template #append-inner>
                <v-icon
                  icon="mdi-window-close"
                  @click="clearDeptcd"
                />
              </template>
          </i-input>
          <i-select
            v-model="searchParams.MEAS_EVAL"
            :label="$t('평가결과')"
            label-width="50px"
            :items="codeList.MEAS_EVAL"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            class="ml-4"
            v-model="searchParams.ORGN_DIV"
            :label="$t('조직구분')"
            label-width="50px"
            :items="codeList.ORGN_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          /> 
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onEditCommit="onEditCommit"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
    <NoticePopup ref="noticePopup" />>
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