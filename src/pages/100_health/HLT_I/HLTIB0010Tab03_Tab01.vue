<script setup>
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { useUserStore } from '@hiway/stores/user'
import { ref, reactive, getCurrentInstance } from 'vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import _ from 'lodash'
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()

let previousValueField = '' //필드값의 원본을 가지고 있는 값
let previousValueGrid = '' //그리드의 원본을 가지고 있는 값
let isChangedField = '' //필드값이 변경되었는지 확인하는 플래그값
let isChangedGrid = '' //그리드값이 변경되었는지 확인하는 플래그값
let tempSaveArray = []
let tempObject = {}
const searchParam = reactive({
  ES_SEQ: '',
  WORK_STANDARD_ID: '',
  UNIT_SEQ: '',
  UNIT_GUBUN: '',
})

const props = defineProps({
  tab01Data: {
    type: Object,
  },
  //각 탭별 구분값을 주기 위해 선언
  tabNumber: {
    type: Number,
  },
})

const hazardInvestigationFieldTab03_Tab01 = reactive({
  ES_SEQ: '', //순번
  WORK_STANDARD_ID: '', //작업표준ID
  UNIT_ID: '', //단위작업 ID
  UNIT_SEQ: '', //단위작업순번
  UNIT_GUBUN: '', //단위작업구분
  IMP_SEQ: '', //원인분석 순번
  ES_DATE: '', //조사일자
  HRMF_FCTR: '', //유해요인코드
  OCCR_CUSE: '', //발생원인
  IMP_YN: '', //개선가부
  IMP_NO_RESN: '', //현행유지사유
  IMPLN_DSC: '', //개선계획
  WRK_LOAD: '', //작업부하
  WRK_FREQ: '', //작업빈도
  TOT_PNT: '', //총점수
  HO_NO: '', //부담작업
  ACT_NM: '', //작업설명
})

const codeList = reactive({
  WRK_LOAD: [], //작업부하(HHII623)
  WRK_FREQ: [], //작업빈도(HHII624)
  HRMF_FCTR: [], //유해요인(HHII629)
  IMP_YN: [], //개선가능여부(HHII637)
  IMPLN_DSC: [], //개선계획(HHII638)
  IMP_NO_RESN: [], //현행유지사유(HHII639)
})

const initCodeList = () => {
  Promise.all([
    getCodeList('HHII623'),
    getCodeList('HHII624'),
    getCodeList('HHII629'),
    getCodeList('HHII637'),
    getCodeList('HHII638'),
    getCodeList('HHII639'),
  ]).then((res) => {
    codeList.WRK_LOAD = res[0].ORESULT_CUR
    codeList.WRK_FREQ = res[1].ORESULT_CUR
    codeList.HRMF_FCTR = res[2].ORESULT_CUR
    codeList.IMP_YN = res[3].ORESULT_CUR
    codeList.IMPLN_DSC = res[4].ORESULT_CUR
    codeList.IMP_NO_RESN = res[5].ORESULT_CUR
    codeList.IMP_NO_RESN[3].TXT = '기타' //시스템코드상에는 기타(직접입력) 이라고 되어있는데 직접입력은 하지 않기때문에 기타라고만 넣음
    grdMain.value.setBindingColumn('HRMF_FCTR', codeList.HRMF_FCTR, 'COD', 'TXT')
    grdMain.value.setBindingColumn('IMP_YN', codeList.IMP_YN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('IMPLN_DSC', codeList.IMPLN_DSC, 'COD', 'TXT')
    grdMain.value.setBindingColumn('IMP_NO_RESN', codeList.IMP_NO_RESN, 'COD', 'TXT')
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'HRMF_FCTR',
      dataType: 'text',
      width: '100',
      header: { text: t('유해요인') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        textReadOnly: true,
      },
    },
    {
      fieldName: 'OCCR_CUSE',
      dataType: 'text',
      width: '100',
      header: { text: t('발생 원인 분석') },
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
    },
    {
      fieldName: 'IMP_YN',
      dataType: 'text',
      width: '100',
      header: { text: t('개선 가능 여부') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        textReadOnly: true,
      },
    },
    {
      fieldName: 'IMPLN_DSC',
      dataType: 'text',
      width: '100',
      header: { text: t('개선 계획') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        textReadOnly: true,
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.editable = true
        if (grid.getValue(dataCell.index.itemIndex, 'IMP_YN') == 'A') {
          return ret
        }
      },
    },
    {
      fieldName: 'IMP_NO_RESN',
      dataType: 'text',
      width: '100',
      header: { text: t('현행 유지 사유') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        textReadOnly: true,
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.editable = true
        if (grid.getValue(dataCell.index.itemIndex, 'IMP_YN') == 'B') {
          return ret
        }
      },
    },
    {
      fieldName: 'ES_SEQ',
      header: { text: t('순번') },
      visible: false,
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      header: { text: t('작업표준ID') },
      visible: false,
    },
    {
      fieldName: 'UNIT_SEQ',
      header: { text: t('단위작업SEQ') },
      visible: false,
    },
    {
      fieldName: 'IMP_SEQ',
      header: { text: t('원인분석 순번') },
      visible: false,
    },
    {
      fieldName: 'UNIT_GUBUN',
      header: { text: t('단위작업 구분') },
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnCreate') {
    if (hazardInvestigationFieldTab03_Tab01.HO_NO === '0') {
      Message.warn(t('부담작업이 0호(해당사항없음)일때는 추가할 수 없습니다.'))
      return false
    }
    grdMain.value.addRow({ IMP_YN: 'A' })
    grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
    grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = true
  } else {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  }
}

const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      ES_SEQ: data.ES_SEQ,
      WORK_STANDARD_ID: data.WORK_STANDARD_ID, //작업표준ID
      UNIT_SEQ: data.UNIT_SEQ,
      IMP_SEQ: data.IMP_SEQ,
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'HLTIB0010_DELETE_02',
    list: deleteParam,
  })
}

const afterDelete = () => {
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_12',
    param: searchParam,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    //setDefaultGridData(res.ORESULT_CUR)
    if (res.ORESULT_CUR.IMP_SEQ) {
      hazardInvestigationFieldTab03_Tab01.IMP_SEQ = res.ORESULT_CUR[0].IMP_SEQ
    }
    grdMain.value.getGridView().checkAll(false)
  })
}

const searchTabData = () => {
  if (props.tabNumber === '1') {
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_06',
      param: {
        WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
        UNIT_SEQ: props.tab01Data.UNIT_SEQ_1,
        UNIT_GUBUN: 1,
      },
    }).then((res) => {
      for (const [key, value] of Object.entries(res.ORESULT_CUR[0])) {
        if (hazardInvestigationFieldTab03_Tab01.hasOwnProperty(key)) {
          hazardInvestigationFieldTab03_Tab01[key] = value
        }
      }
      previousValueField = _.cloneDeep(hazardInvestigationFieldTab03_Tab01) //원본 데이터 저장
    })
  }
  if (props.tabNumber === '2') {
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_06',
      param: {
        WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
        UNIT_SEQ: props.tab01Data.UNIT_SEQ_2,
        UNIT_GUBUN: 2,
      },
    }).then((res) => {
      for (const [key, value] of Object.entries(res.ORESULT_CUR[0])) {
        if (hazardInvestigationFieldTab03_Tab01.hasOwnProperty(key)) {
          hazardInvestigationFieldTab03_Tab01[key] = value
        }
      }
      previousValueField = _.cloneDeep(hazardInvestigationFieldTab03_Tab01) //원본 데이터 저장
    })
  }
  if (props.tabNumber === '3') {
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_06',
      param: {
        WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
        UNIT_SEQ: props.tab01Data.UNIT_SEQ_3,
        UNIT_GUBUN: 3,
      },
    }).then((res) => {
      for (const [key, value] of Object.entries(res.ORESULT_CUR[0])) {
        if (hazardInvestigationFieldTab03_Tab01.hasOwnProperty(key)) {
          hazardInvestigationFieldTab03_Tab01[key] = value
        }
      }
      previousValueField = _.cloneDeep(hazardInvestigationFieldTab03_Tab01) //원본 데이터 저장
    })
  }
}

const searchGridData = () => {
  //그리드 데이터 조회
  if (props.tabNumber === '1') {
    searchParam.ES_SEQ = props.tab01Data.ES_SEQ
    searchParam.WORK_STANDARD_ID = props.tab01Data.WORK_STANDARD_ID
    searchParam.UNIT_SEQ = props.tab01Data.UNIT_SEQ_1
    searchParam.UNIT_GUBUN = 1
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_12',
      param: searchParam,
    }).then(async (res) => {
      //console.log('탭1번 탐?')
      await setDefaultGridData(res.ORESULT_CUR)
      //console.log('탭1번 탔음')
      previousValueGrid = grdMain.value.getGridView().getJsonRows(0, -1)
      grdMain.value.getGridView().checkAll(false)
    })
  } else if (props.tabNumber === '2') {
    searchParam.ES_SEQ = props.tab01Data.ES_SEQ
    searchParam.WORK_STANDARD_ID = props.tab01Data.WORK_STANDARD_ID
    searchParam.UNIT_SEQ = props.tab01Data.UNIT_SEQ_2
    searchParam.UNIT_GUBUN = 2
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_12',
      param: searchParam,
    }).then(async (res) => {
      //console.log('탭2번 탐?')
      await setDefaultGridData(res.ORESULT_CUR)
      //console.log('탭2번 탔음')
      previousValueGrid = grdMain.value.getGridView().getJsonRows(0, -1)
      grdMain.value.getGridView().checkAll(false)
    })
  } else {
    searchParam.ES_SEQ = props.tab01Data.ES_SEQ
    searchParam.WORK_STANDARD_ID = props.tab01Data.WORK_STANDARD_ID
    searchParam.UNIT_SEQ = props.tab01Data.UNIT_SEQ_3
    searchParam.UNIT_GUBUN = 3

    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_12',
      param: searchParam,
    }).then(async (res) => {
      await setDefaultGridData(res.ORESULT_CUR)
      previousValueGrid = grdMain.value.getGridView().getJsonRows(0, -1)
      grdMain.value.getGridView().checkAll(false)
    })
  }
}

//부담작업에 따라서 기본값 세팅
/*
부담작업 1,2호 있으면 -> 유해요인 "반복성" 자동표시
부담작업 3,4,5호 있으면 -> 유해요인 "부적절한 자세" 자동표시
부담작업 6,7,8,9,10호 있으면 -> 유해요인 "과도한 힘" 자동표시
부담작업 11호 있으면 -> 유해요인 "신체충격" 자동표시
*/
const setDefaultGridData = (data) => {
  let hoNoString = hazardInvestigationFieldTab03_Tab01.HO_NO
  console.log('hoNoString', hoNoString)
  let hoNoArray = ''
  if (hoNoString.includes(',')) {
    hoNoArray = hoNoString.split(',').map((s) => s.trim())
  } else {
    hoNoArray = [hoNoString]
  }

  //조회된 데이터가 없을때는 그냥 세팅

  if (data.length === 0) {
    if (hoNoArray.some((hoNo) => [1, 2].includes(Number(hoNo)))) {
      let rowData = {
        HRMF_FCTR: 'A',
      }
      //console.log('반복성탐?')
      grdMain.value.addRow(rowData) //반복성
      grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
      grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      //console.log('반복성탔음')
    }
    if (hoNoArray.some((hoNo) => [3, 4, 5].includes(Number(hoNo)))) {
      let rowData = {
        HRMF_FCTR: 'B',
      }
      //console.log('부적절탐?')
      grdMain.value.addRow(rowData) //부적절한자세
      grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
      grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      //console.log('부적절탐')
    }
    if (hoNoArray.some((hoNo) => [6, 7, 8, 9, 10].includes(Number(hoNo)))) {
      let rowData = {
        HRMF_FCTR: 'C',
      }
      //console.log('과도한힘 탐?')
      grdMain.value.addRow(rowData) //과도한힘
      grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
      grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      //console.log('과도한힘탐')
    }
    if (hoNoArray.some((hoNo) => [11].includes(Number(hoNo)))) {
      let rowData = {
        HRMF_FCTR: 'E',
      }
      //console.log('신체충격탐?')
      grdMain.value.addRow(rowData) //신체충격
      grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
      grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      //console.log('신체충격탐')
    }
  }
  //저장된 데이터가 있을때는 저장된 데이터 비교후에 없는거 추가함
  else {
    //console.log('data 여기?')
    grdMain.value.getDataProvider().setRows(data)
    let grdData = grdMain.value.getDataProvider().getJsonRows(0, -1) //그리드 데이터 가져옴
    //부담작업에 1,2호가 등록되어 있는데 반복성이 없는경우
    if (hoNoArray.some((hoNo) => [1, 2].includes(Number(hoNo)))) {
      if (!grdData.some((x) => x.HRMF_FCTR.includes('A'))) {
        let rowData = {
          HRMF_FCTR: 'A',
        }
        grdMain.value.addRow(rowData)
        grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
        grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      }
    }
    //부담작업에 3,4,5가 등록되어 있는데 부적절한자세가 없는경우
    if (hoNoArray.some((hoNo) => [3, 4, 5].includes(Number(hoNo)))) {
      if (!grdData.some((x) => x.HRMF_FCTR.includes('B'))) {
        let rowData = {
          HRMF_FCTR: 'B',
        }
        grdMain.value.addRow(rowData)
        grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
        grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      }
    }
    //부담작업 6,7,8,9,10가 등록되어 있는데 과도한 힘이 없는경우
    if (hoNoArray.some((hoNo) => [6, 7, 8, 9, 10].includes(Number(hoNo)))) {
      if (!grdData.some((x) => x.HRMF_FCTR.includes('C'))) {
        let rowData = {
          HRMF_FCTR: 'C',
        }
        grdMain.value.addRow(rowData)
        grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
        grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      }
    }
    //부담작업 11이 등록되어 있는데 신체충격이 없는경우
    if (hoNoArray.some((hoNo) => [11].includes(Number(hoNo)))) {
      if (!grdData.some((x) => x.HRMF_FCTR.includes('E'))) {
        let rowData = {
          HRMF_FCTR: 'E',
        }
        grdMain.value.addRow(rowData)
        grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
        grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
      }
    }
  }
}

onMounted(async () => {
  initCodeList()
  await searchTabData()
  await searchGridData()
  if (props.tab01Data.IMP_RESIST_YN === 'Y') {
    menuTitle.value.visibleBtn('btnCreate', false)
    menuTitle.value.visibleBtn('btnDelete', false)
  }
})

const saveTab03_Tab01 = () => {
  let returnData = [] //그리드데이터랑 단위작업 데이터를 넣어서 return
  let saveArray = [] //그리드데이터를 묶기위해 선언
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    saveArray.push(data)
  }

  returnData.push(saveArray) //그리드 데이터
  returnData.push(hazardInvestigationFieldTab03_Tab01) //단위작업 데이터
  tempSaveArray = _.cloneDeep(saveArray)
  return returnData
}

//작업부하 감지
watch(
  () => hazardInvestigationFieldTab03_Tab01.WRK_LOAD,
  (newValue, oldValue) => {
    if (hazardInvestigationFieldTab03_Tab01.WRK_FREQ) {
      hazardInvestigationFieldTab03_Tab01.TOT_PNT =
        hazardInvestigationFieldTab03_Tab01.WRK_LOAD * hazardInvestigationFieldTab03_Tab01.WRK_FREQ
    }
  }
)

watch(
  () => hazardInvestigationFieldTab03_Tab01.WRK_FREQ,
  (newValue, oldValue) => {
    if (hazardInvestigationFieldTab03_Tab01.WRK_LOAD) {
      hazardInvestigationFieldTab03_Tab01.TOT_PNT =
        hazardInvestigationFieldTab03_Tab01.WRK_LOAD * hazardInvestigationFieldTab03_Tab01.WRK_FREQ
    }
  }
)

//그리드,필드값 변경 플래그 반환하는 함수
const getUpdatedFlag = () => {
  let tempGridData = []
  const excludedKeys = ['ES_SEQ', 'IMP_SEQ', 'UNIT_SEQ', 'WORK_STANDARD_ID', 'UNIT_GUBUN']
  //console.log('키값 제거전 그리드', previousValueGrid)
  tempGridData = _.cloneDeep(previousValueGrid.map((x) => _.omit(x, excludedKeys))) //위 키값 제거후 새 배열 생성
  tempSaveArray = _.cloneDeep(tempSaveArray.map((x) => _.omit(x, excludedKeys))) //위 키값 제거후 새 배열 생성
  //console.log('키값 제거후 그리드', tempGridData)
  tempGridData = tempGridData.filter((prevItem) => tempSaveArray.some((tempItem) => _.isEqual(prevItem, tempItem))) //원본에서 체크된 데이터만 다시 필터링

  tempObject = _.cloneDeep(hazardInvestigationFieldTab03_Tab01) //변경된 객체
  //delete previousValueField.UNIT_GUBUN
  delete previousValueField.IMP_SEQ
  delete tempObject.IMP_SEQ

  isChangedField = _.isEqual(tempObject, previousValueField)
  isChangedGrid = _.isEqual(tempSaveArray, tempGridData)
  // console.log('그리드 체크된 데이터 걸러냄', tempGridData)
  // console.log('그리드 체크된데이터', tempSaveArray)
  // console.log('isChangedGrid', isChangedGrid)
  // console.log('객체 원본', previousValueField)
  // console.log('객체 변경된거', tempObject)
  // console.log('isChangedField', isChangedField)
  let flag = {
    fieldFlag: isChangedField, //필드값 변경 플래그
    gridFlag: isChangedGrid, //그리드값 변경 플래그
  }
  return flag
}

//저장하고나서 이전값을 덮어씌우는 함수
const setUpdatedFlag = (gridData) => {
  const excludedKeys = ['ES_SEQ', 'IMP_SEQ', 'UNIT_SEQ', 'WORK_STANDARD_ID', 'UNIT_GUBUN']
  gridData = _.cloneDeep(gridData.map((x) => _.omit(x, excludedKeys))) //위 키값 제거후 새 배열 생성
  Object.assign(previousValueField, tempObject)
  previousValueGrid = _.cloneDeep(gridData)
  //   console.log('덮어씌운값1', previousValueField)
  //   console.log('덮어씌운값2', previousValueGrid)
  //   console.log('저장후 tempObject', tempObject)
}

const onCellEdited = (grid, itemIndex, row, field) => {
  let grdData = grdMain.value.getGridView().getJsonRows()
  let grouped = _.groupBy(grdData, 'HRMF_FCTR') //HRMF_FCTR로 그룹핑
  let groupYn = Object.values(grouped).some((group) => group.length > 1)
  if (groupYn) {
    Message.warn(t('동일한 유해요인이 존재합니다. 다른 요인을 선택해주세요.'))
    grdMain.value.getDataProvider().setValue(row, 'HRMF_FCTR', '') //유해요인 비워줌
    return false
  }
  let data = grdMain.value.getDataProvider().getJsonRow(row)
  //개선가능여부가 개선가능일때 현행유지사유 수정불가
  if (data.IMP_YN === 'A') {
    grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = false
    grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = true
    grdMain.value.getDataProvider().setValue(row, 'IMP_NO_RESN', '') //현행유지사유 비워줌
  } else {
    //개선가능여부가 현행유지일때 개선계획 수정불가 현행유지사유 수정가능
    grdMain.value.getGridView().columnByName('IMP_NO_RESN').editable = true
    grdMain.value.getGridView().columnByName('IMPLN_DSC').editable = false
    grdMain.value.getDataProvider().setValue(row, 'IMPLN_DSC', '') //현행유지사유 비워줌
  }
}

defineExpose({
  saveTab03_Tab01,
  afterDelete,
  getUpdatedFlag,
  setUpdatedFlag,
  searchTabData,
})
</script>

<template>
  <v-sheet class="searchArea">
    <div class="gridTitle mt-1">작업설명</div>
    <i-textarea width="100%" class="mt-2" v-model="hazardInvestigationFieldTab03_Tab01.ACT_NM" readonly></i-textarea>
    <div class="mt-2 d-flex justify-center">
      <table>
        <tr>
          <td>부담작업(호)</td>
          <td>작업부하(A)</td>
          <td>작업빈도(B)</td>
          <td>총 점 (A*B)</td>
        </tr>
        <tr>
          <td><i-input width="200px" v-model="hazardInvestigationFieldTab03_Tab01.HO_NO" readonly></i-input></td>
          <td>
            <i-select
              width="200px"
              :items="codeList.WRK_LOAD"
              item-title="TXT"
              item-value="COD"
              v-model="hazardInvestigationFieldTab03_Tab01.WRK_LOAD"
            ></i-select>
          </td>
          <td>
            <i-select
              width="200px"
              :items="codeList.WRK_FREQ"
              item-title="TXT"
              item-value="COD"
              v-model="hazardInvestigationFieldTab03_Tab01.WRK_FREQ"
            ></i-select>
          </td>
          <td><i-input width="200px" v-model="hazardInvestigationFieldTab03_Tab01.TOT_PNT" readonly></i-input></td>
        </tr>
      </table>
    </div>
    <v-sheet class="pa-0" style="height: 500px">
      <IGridTitle
        :button-list="['btnCreate', 'btnDelete']"
        @click-button="onButtonsClick"
        class="mt-2 mr-2"
        ref="menuTitle"
      ></IGridTitle>
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        :column-layout="grdMainProps.columnLayout"
        @onCellEdited="onCellEdited"
      />
    </v-sheet>
  </v-sheet>
</template>

<style lang="scss" scoped>
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
table {
  border-collapse: collapse;
  width: 50%;
}
td {
  padding: 4px;
  text-align: center; /* 가로 가운데 정렬 */
  vertical-align: middle; /* 세로 가운데 정렬 */
}
</style>
