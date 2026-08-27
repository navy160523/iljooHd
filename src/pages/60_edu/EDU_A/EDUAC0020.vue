<!--
  화면명 : 아카데미 동반입소 대상 지정
  화면개요 : 아카데미 동반입소 대상 지정 등록 및 조회 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  commonExecuteApi2,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { tryOnUnmounted } from '@vueuse/core'

defineOptions({
  name: '60_edu-EDU_A-EDUAC0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdTitle1 = ref(null)
const grdTitle2 = ref(null)
const grdTitle3 = ref(null)
const grdTitle4 = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const grdSub3 = ref(null)
const grdSub4 = ref(null)
const tab = ref(null)
const empPopup = ref(null)

//계산준비 테이블
let dsASGN = ref({})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  YEARMNTH: dayjs().format('YYYY-MM'), //기준년월
  CUTOFF_DT: '', //기준일
  CHK_NEW: 'N', //신규입력
  CPN_RTRN_DT: '', //위반율 산출일
  HEAD_CNFM_DT: '', //확정일
  ACDM_YN2: 'N', //TAB2 동반대상자만 체크
  ACDM_YN3: 'N', //TAB3 동반대상자만 체크
})

//탭 텍스트 값
const textValue = reactive({
  TAB1_TEXT: '',
  TAB2_TEXT: '',
  TAB3_TEXT: '',
})

//콤보리스트
const codeList = reactive({
  CUTOFF_DT: [],
  BSNS: [],
})

//버튼 Disable
const btnDisable = reactive({
  CancelWIBAN_RATE: false,
  Confirm: false,
  CancelConfirm: false,
  Calc1: false,
  Calc2: false,
  Calc3: false,
  Calc4: false,
  Calc5: false,
  Calc6: false,
  Calc7: false,
  Calc8: false,
})

//위반율 전역변수
const wiban = reactive({
  dF21070: 0,
  dF21070B: 0,
  dF21060: 0,
  dF21050: 0,
  dF210ZZ: 0,
  dF22060A: 0,
  dF22060B: 0,
  dF22050A: 0,
  dF22050B: 0,
})

//직원 팝업 관련 변수
const empData = reactive({
  GRID_NO: 0,
  DATA_ROW: 0,
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    {
      fieldName: 'VIO_CNT',
      dataType: 'text',
      header: { text: t('1회 위반자 수') },
      visible: false,
    },
    { fieldName: 'CNT_A', dataType: 'text', header: { text: t('팀장/소장') } },
    { fieldName: 'CNT_B', dataType: 'text', header: { text: t('직책과장') } },
    {
      fieldName: 'CNT_C',
      dataType: 'text',
      header: { text: t('부서장/협력사대표') },
    },
    { fieldName: 'CNT_SUM', dataType: 'text', header: { text: t('소계') } },
    { fieldName: 'CNT_TOT', dataType: 'text', header: { text: t('합계') } },
  ],
  columns: [],
  columnLayout: [
    {
      name: '동반입소',
      direction: 'horizontal',
      header: {
        text: t('동반입소'),
      },
      items: ['CNT_A', 'CNT_B', 'CNT_C', 'CNT_SUM'],
    },
    'CNT_TOT',
  ],
})

const grdSubProps1 = reactive({
  gridViewOption: { checkBar: { visible: true }, footer: { visible: true } },
  fields: [
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'CUTOFF_DT', dataType: 'text', visible: false },
    { fieldName: 'ORGN_SEQ', dataType: 'text', visible: false },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('사업부') },
      lookupDisplay: true,
      editable: false,
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('부서') },
      editable: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('부서 코드') },
      editable: false,
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('팀,협력사') },
      editable: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t('팀코드') },
      editable: false,
    },
    {
      fieldName: 'EMP_CNT',
      dataType: 'text',
      header: { text: t('인원수(a)') },
      editable: false,
      footer: {
        expression: 'sum',
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WINBAN_CNT',
      dataType: 'text',
      header: { text: t('위반건수(b)') },
      editable: false,
      footer: {
        expression: 'sum',
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WIBAN_RATE',
      dataType: 'text',
      header: { text: t('위반율:% (b/a*100)') },
      editable: false,
      footer: {
        valueCallback: function (
          grid,
          column,
          footerIndex,
          columnFooter,
          value
        ) {
          //위반율 계산
          var sumA = 0
          var sumB = 0
          var prod = grid.getDataSource()

          for (var i = 0; i < cnt; i++) {
            sumA += prod.getValue(i, 'EMP_CNT')
            sumB += prod.getValue(i, 'WINBAN_CNT')
          }

          return (sumB / sumA) * 100
        },
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WIBAN_RATE_RANK',
      dataType: 'text',
      header: { text: t('위반율 등위') },
      editable: false,
    },
    {
      fieldName: 'CUTOFF_DT_NEAR',
      dataType: 'datetime',
      header: { text: t('최근지정 컷오프날짜') },
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
    },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false },
    {
      fieldName: 'EMP_NAME',
      dataType: 'text',
      header: { text: t('팀장,소장') },
      button: 'action',
      editable: false,
    },
    {
      fieldName: 'EMP_JICWI',
      dataType: 'text',
      header: { text: t('직위') },
      editable: false,
    },
    {
      fieldName: 'ACDM_YN',
      dataType: 'text',
      header: { text: t('동반입소 지정') },
      editable: false,
      readonly: true,
      renderer: {
        type: 'check',
        startEditOnClick: true,
        trueValues: 'Y',
        falseValues: 'N',
        editable: false,
        readonly: true,
      },
    },
    {
      fieldName: 'EDU_DATE',
      dataType: 'text',
      header: { text: t('최근입소일') },
      editable: false,
    },
    { fieldName: 'ACDM_MAYBE', dataType: 'text', visible: false },
    { fieldName: 'ACDM_ASGN_YN', dataType: 'text', visible: false },
  ],
  columns: [],
})

const grdSubProps2 = reactive({
  gridViewOption: { checkBar: { visible: true }, footer: { visible: true } },
  fields: [
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'CUTOFF_DT', dataType: 'text', visible: false },
    { fieldName: 'ORGN_SEQ', dataType: 'text', visible: false },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('사업부') },
      editable: false,
      lookupDisplay: true,
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('부서') },
      editable: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('부서 코드') },
      editable: false,
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('과') },
      editable: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t('과코드') },
      editable: false,
    },
    {
      fieldName: 'EMP_CNT',
      dataType: 'text',
      header: { text: t('인원수(a)') },
      editable: false,
      footer: {
        expression: 'sum',
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WINBAN_CNT',
      dataType: 'text',
      header: { text: t('위반건수(b)') },
      editable: false,
      footer: {
        expression: 'sum',
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WIBAN_RATE',
      dataType: 'text',
      header: { text: t('위반율:% (b/a*100)') },
      editable: false,
      footer: {
        valueCallback: function (
          grid,
          column,
          footerIndex,
          columnFooter,
          value
        ) {
          //위반율 계산
          var sumA = 0
          var sumB = 0
          var prod = grid.getDataSource()

          for (var i = 0; i < cnt; i++) {
            sumA += prod.getValue(i, 'EMP_CNT')
            sumB += prod.getValue(i, 'WINBAN_CNT')
          }

          return (sumB / sumA) * 100
        },
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WIBAN_RATE_RANK',
      dataType: 'text',
      header: { text: t('위반율 등위') },
      editable: false,
    },
    {
      fieldName: 'CUTOFF_DT_NEAR',
      dataType: 'datetime',
      header: { text: t('최근지정 컷오프날짜') },
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
    },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false },
    {
      fieldName: 'EMP_NAME',
      dataType: 'text',
      header: { text: t('직책과장') },
      button: 'action',
      editable: false,
    },
    {
      fieldName: 'EMP_JICWI',
      dataType: 'text',
      header: { text: t('직위') },
      editable: false,
    },
    {
      fieldName: 'ACDM_YN',
      dataType: 'text',
      header: { text: t('동반입소 지정') },
      editable: false,
      readonly: true,
      renderer: {
        type: 'check',
        startEditOnClick: true,
        trueValues: 'Y',
        falseValues: 'N',
        editable: false,
        readonly: true,
      },
    },
    {
      fieldName: 'EDU_DATE',
      dataType: 'text',
      header: { text: t('최근입소일') },
      editable: false,
    },
    { fieldName: 'ACDM_MAYBE', dataType: 'text', visible: false },
    { fieldName: 'ACDM_ASGN_YN', dataType: 'text', visible: false },
  ],
  columns: [],
})

const grdSubProps3 = reactive({
  gridViewOption: { checkBar: { visible: true }, footer: { visible: true } },
  fields: [
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'CUTOFF_DT', dataType: 'text', visible: false },
    { fieldName: 'ORGN_SEQ', dataType: 'text', visible: false },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('사업부') },
      lookupDisplay: true,
      editable: false,
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('부서,협력사') },
      editable: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('코드') },
      editable: false,
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('팀,협력사') },
      visible: false,
      editable: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t('팀코드') },
      visible: false,
      editable: false,
    },
    {
      fieldName: 'EMP_CNT',
      dataType: 'text',
      header: { text: t('인원수(a)') },
      editable: false,
      footer: {
        expression: 'sum',
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WINBAN_CNT',
      dataType: 'text',
      header: { text: t('위반건수(b)') },
      editable: false,
      footer: {
        expression: 'sum',
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WIBAN_RATE',
      dataType: 'text',
      header: { text: t('위반율:% (b/a*100)') },
      editable: false,
      footer: {
        valueCallback: function (
          grid,
          column,
          footerIndex,
          columnFooter,
          value
        ) {
          //위반율 계산
          var sumA = 0
          var sumB = 0
          var prod = grid.getDataSource()

          for (var i = 0; i < cnt; i++) {
            sumA += prod.getValue(i, 'EMP_CNT')
            sumB += prod.getValue(i, 'WINBAN_CNT')
          }

          return (sumB / sumA) * 100
        },
        styleName: 'footer-font',
        exportStyleName: 'export_style',
      },
      exportStyleName: 'export_style',
      styleName: 'right-column',
    },
    {
      fieldName: 'WIBAN_RATE_RANK',
      dataType: 'text',
      header: { text: t('위반율 등위') },
      editable: false,
    },
    {
      fieldName: 'CUTOFF_DT_NEAR',
      dataType: 'datetime',
      header: { text: t('최근지정 컷오프날짜') },
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
    },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false },
    {
      fieldName: 'EMP_NAME',
      dataType: 'text',
      header: { text: t('부서장, 협력사대표') },
      editable: false,
      button: 'action',
    },
    {
      fieldName: 'EMP_JICWI',
      dataType: 'text',
      header: { text: t('직위') },
      editable: false,
    },
    {
      fieldName: 'ACDM_YN',
      dataType: 'text',
      header: { text: t('동반입소 지정') },
      editable: false,
      readonly: true,
      renderer: {
        type: 'check',
        startEditOnClick: true,
        trueValues: 'Y',
        falseValues: 'N',
        editable: false,
        readonly: true,
      },
    },
    {
      fieldName: 'EDU_DATE',
      dataType: 'text',
      header: { text: t('최근입소일') },
      editable: false,
    },
    { fieldName: 'ACDM_MAYBE', dataType: 'text', visible: false },
    { fieldName: 'ACDM_ASGN_YN', dataType: 'text', visible: false },
  ],
  columns: [],
})

const grdSubProps4 = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'CUTOFF_DT', dataType: 'text', visible: false },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      header: { text: t('사업부') },
      lookupDisplay: true,
      editable: false,
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('수신부서') },
      editable: false,
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('수신조직') },
      editable: false,
    },
    {
      fieldName: 'EMP_NAME',
      dataType: 'text',
      header: { text: t('수신자') },
      editable: false,
    },
    {
      fieldName: 'RECV_MAIL',
      dataType: 'text',
      header: { text: t('수신자Email') },
      editable: false,
    },
    {
      fieldName: 'RECV_DEMPNM',
      dataType: 'text',
      header: { text: t('부서장') },
      editable: false,
    },
    {
      fieldName: 'RECV_DMAIL',
      dataType: 'text',
      header: { text: t('부서장Email') },
      editable: false,
    },
    {
      fieldName: 'WNOTE_NO',
      dataType: 'text',
      header: { text: t('경고장No') },
      editable: false,
    },
  ],
  columns: [],
})

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields
grdSubProps1.columns = grdSubProps1.fields
grdSubProps2.columns = grdSubProps2.fields
grdSubProps3.columns = grdSubProps3.fields
grdSubProps4.columns = grdSubProps4.fields

//메뉴/그리드 타이틀 버튼 이벤트
//메뉴 타이틀 버튼
const onMenuButtonsClick1 = async (btn) => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setBefore(beforeMainSearch)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}
//메뉴 타이틀 조회
const beforeMainSearch = async () => {
  await clearGrid(grdMain)
  await subClear()

  return true
}
const searchMainData = () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_DT: searchParams.CHK_NEW === 'Y' ? '' : searchParams.CUTOFF_DT,
    GBN: searchParams.CHK_NEW === 'Y' ? 'N' : 'R',
  }

  return commonSearchApi({ queryId: 'EDUAC0020_SEARCH_01', param: searchParam })
}
const afterMainSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onTabButtonsClick1 = (btn) => {
  if (btn.id == 'btnSearch') {
    getSub1()
  } else {
    saveTab1Data()
  }
}

//Tab1 저장
const saveTab1Data = async () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdSub1, row: null }])
    .setGridList([grdSub1])
    .setBefore(validationCheckSub1)
    .setQuery(saveTab1)
    .setAfter(() => {
      onMenuButtonsClick1({ id: 'btnSearch' })
    })
    .run()
}
const validationCheckSub1 = () => {
  let checkedRows = grdSub1.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub1.value.getDataProvider().getJsonRow(rowIdx)
    if (isNull(data['EMP_NAME'])) {
      Message.warn(t('팀장,소장명이 입력되지 않았습니다.'))

      return false
    }
  }
  return true
}
const saveTab1 = () => {
  let saveParams = []
  let checkedRows = grdSub1.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub1.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: 'EDUAC0020_SAVE_02', list: saveParams })
}

//Tab1 그리드 조회
const getSub1 = async () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub1])
    .setQuery(searchSubData1)
    .setAfter(afterSubSearch1)
    .run()
}
const searchSubData1 = () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_DT:
      searchParams.CHK_NEW === 'Y'
        ? ''
        : searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
  }

  return commonSearchApi({ queryId: 'EDUAC0020_SEARCH_02', param: searchParam })
}
const afterSubSearch1 = (res) => {
  grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)

  setSubGridColor('sub1')
}

const onTabButtonsClick2 = (btn) => {
  if (btn.id == 'btnSearch') {
    getSub2()
  } else {
    saveTab2Data()
  }
}

//Tab2 저장
const saveTab2Data = async () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdSub2, row: null }])
    .setGridList([grdSub2])
    .setBefore(validationCheckSub2)
    .setQuery(saveTab2)
    .setAfter(() => {
      onMenuButtonsClick1({ id: 'btnSearch' })
    })
    .run()
}
const validationCheckSub2 = () => {
  let checkedRows = grdSub2.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
    if (isNull(data['EMP_NAME'])) {
      Message.warn(t('직책과장명이 입력되지 않았습니다.'))

      return false
    }
  }
  return true
}
const saveTab2 = () => {
  let saveParams = []
  let checkedRows = grdSub2.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: 'EDUAC0020_SAVE_03', list: saveParams })
}
//Tab2 그리드 조회
const getSub2 = async () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub2])
    .setQuery(searchSubData2)
    .setAfter(afterSubSearch2)
    .run()
}
const searchSubData2 = () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_DT: searchParams.CHK_NEW === 'Y' ? '' : searchParams.CUTOFF_DT,
    ACDM_YN: searchParams.ACDM_YN2,
  }

  return commonSearchApi({ queryId: 'EDUAC0020_SEARCH_03', param: searchParam })
}
const afterSubSearch2 = (res) => {
  grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)

  setSubGridColor('sub2')
}

const onTabButtonsClick3 = (btn) => {
  if (btn.id == 'btnSearch') {
    getSub3()
  } else {
    saveTab3Data()
  }
}

//Tab3 저장
const saveTab3Data = async () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdSub3, row: null }])
    .setGridList([grdSub3])
    .setBefore(validationCheckSub3)
    .setQuery(saveTab3)
    .setAfter(() => {
      onMenuButtonsClick1({ id: 'btnSearch' })
    })
    .run()
}
const validationCheckSub3 = () => {
  let checkedRows = grdSub3.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub3.value.getDataProvider().getJsonRow(rowIdx)
    if (isNull(data['EMP_NAME'])) {
      Message.warn(t('직책과장명이 입력되지 않았습니다.'))

      return false
    }
  }
  return true
}
const saveTab3 = () => {
  let saveParams = []
  let checkedRows = grdSub3.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub3.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: 'EDUAC0020_SAVE_04', list: saveParams })
}
//Tab3 그리드 조회
const getSub3 = async () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub3])
    .setQuery(searchSubData3)
    .setAfter(afterSubSearch3)
    .run()
}
const searchSubData3 = () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_DT:
      searchParams.CHK_NEW === 'Y'
        ? ''
        : searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
    ACDM_YN: searchParams.ACDM_YN3,
  }

  return commonSearchApi({ queryId: 'EDUAC0020_SEARCH_04', param: searchParam })
}
const afterSubSearch3 = (res) => {
  grdSub3.value.getDataProvider().setRows(res.ORESULT_CUR)

  setSubGridColor('sub3')
}

const onTabButtonsClick4 = (btn) => {
  if (btn.id == 'btnSearch') {
    getSub4()
  } else {
    sendTab4Data()
  }
}
//Tab4 그리드 조회
const getSub4 = async () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub4])
    .setQuery(searchSubData4)
    .setAfter(afterSubSearch4)
    .run()
}
const searchSubData4 = () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
    USER_ID: userStore.USER_ID,
  }

  return commonSearchApi({ queryId: 'EDUAC0020_SEARCH_05', param: searchParam })
}
const afterSubSearch4 = (res) => {
  grdSub4.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//Tab4 경고장 발송 이벤트
const sendTab4Data = async () => {
  let ck = await vm.$swal({
    title: t('소속조직 대상자와 부서장에게 경고장을 발송하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    return
  }

  let checkedRows = grdSub4.value.getGridView().getCheckedRows(true)
  if (checkedRows.length < 1) {
    message.warn('경고장 발송 대상을 선택하세요.')

    return
  }

  let strTitle = '경고장'

  for (let chkIdx of checkedRows) {
    let item = grdSub4.value.getDataProvider().getJsonRow(chkIdx)

    if (item['WNOTE_NO'].toString().length > 0) continue

    let recv_mail = item['RECV_MAIL'].toString().trim()

    let mailSendList = [
      {
        CMPNY_DIV: item['CMPNY_DIV'],
        WNOTE_TYPE: item['WNOTE_TYPE'],
        VIO_NO: item['VIO_NO'],
        SEND_DT: item['SEND_DT'],
        RECV_DEPT: item['RECV_DEPT'],
        RECV_EMPNO: item['RECV_EMPNO'],
        RECV_MAIL: item['RECV_MAIL'],
        RECV_DEMPNO: item['RECV_DEMPNO'],
        RECV_DMAIL: item['RECV_DMAIL'],
        SEND_EMPNO: item['SEND_EMPNO'],
        CUTOFF_DT: item['CUTOFF_DT'],
        ORGN_SEQ: item['ORGN_SEQ'],
        WNOTE_NO: '',
      },
    ]
    await commonExecuteApi2({
      queryId: 'EDUAC0020_SAVE_06',
      list: mailSendList,
    }).then((res) => {
      if (res.ORESULT_CUR[0]['WNOTE_NO'].toString().length > 0) {
        mailSendList[0].WNOTE_NO = res.ORESULT_CUR[0]['WNOTE_NO'].toString()
      } else {
        return
      }
    })

    let senddt =
      item['SEND_DT'].toString().substr(0, 4) +
      '.  ' +
      item['SEND_DT'].toString().substr(4, 2) +
      '.  ' +
      item['SEND_DT'].toString().substr(6, 2) +
      '.'

    let strMSG = ''
    strMSG += `<!doctype html>`
    strMSG += `<html>`
    strMSG += `<head>`
    strMSG += `<meta charset='utf-8'>`
    strMSG += `<title>직영/협력사</title>`
    strMSG += `<style>`
    strMSG += `    table{border:1px solid #bbb width: 600px}`
    strMSG += `    tr{border:1px solid #bbb }`
    strMSG += `    span.text{text-decoration: underline line-height: 35px color: #3c3c3c font-family: 'HY헤드라인M'  font-size: 15px }`
    strMSG += `    p.text2{ line-height: 30px text-align:center color: #3c3c3c margin-top: 20px font-family: 'HY헤드라인M' font-size: 16px  }`
    strMSG += `    p.text3{line-height: 30px text-align:center font-size: 25px font-weight:900 color: #3c3c3c  font-family: 'HY헤드라인M'  margin-bottom:40px}`
    strMSG += `    ul {padding: 0px 0 0 0}`
    strMSG += `    ul li{line-height: 30px padding-bottom: 20px font-size: 15px font-family: 'HY중고딕'}`
    strMSG += `    ul li span.text4{float:left height: 150px width: 17px}`
    strMSG += `    ul li span.text5{display: block}`
    strMSG += `    ul,ol { list-style: none !important }`
    //경고장 제목 red
    strMSG += `    h3{ color:#ff0000  font-weight: bolder font-size: 48px text-align: center !important background-color: #d3d3d3  width: 200px margin: 20px auto font-family: 'HY헤드라인M' line-height: 55px }`
    //경고장 제목 black
    strMSG += `    /*h4{ color:#3c3c3c  font-weight: bolder font-size: 22px text-align: center !important margin: 10px auto font-family: 'HY헤드라인M' line-height: 5px padding-top: 20px}*/`
    strMSG += `    ul li strong{font-weight: 900}`
    strMSG += `    p.info1 {font-family: '맑은 고딕' font-size: 11px color:#c8c8c8 margin: 10px 20px}`
    strMSG += `    p.info2 {font-family: '맑은 고딕' font-size: 11px color:#c8c8c8 margin: 10px 20px float: right text-align: right}`
    strMSG += `    .h40{display: block height: 30px line-height: 30pxfont-size: 15px font-family: 'HY중고딕'}`
    strMSG += `</style>`
    strMSG += `</head>`
    strMSG += ``
    strMSG += `<body>`
    strMSG += `<table>`
    strMSG += `    <tr>`
    strMSG += `        <td width='25%'><p class='info1'>국문</p></td>`
    strMSG +=
      `        <td colspan='2' width='*'><p class='info2'>No. ` +
      item['WNOTE_NO'].ToString() +
      `</p></td>`
    strMSG += `    </tr>`
    strMSG += `    <tr>`
    strMSG += `        <td width='30%'></td>`
    strMSG += `        <td width='40%'><h3>경 고 장</h3></td>`
    strMSG += `        <td width='30%'></td>`
    strMSG += `    </tr>`
    strMSG += `    <tr>`
    strMSG += `        <td colspan='3' style='padding: 0 40px'>`
    strMSG += `            <p style='line-height: 30px'>　<span class='text'>최근 귀하의 부서(팀/협력사)에 절대수칙 위반이 다수 발생하여`
    strMSG +=
      `            금번 안전아카데미 관리감독자 동반입소 대상에 <span style='color:#3f48cc'>` +
      item['EMP_NAME'].toString() +
      `</span>님이 포함 되었습니다.</span></p>`
    strMSG += `            <p class='h40'>　우리회사의 안전이 위협받고 있는 이유 중 하나는 우리가 지키고자 만든 규정과 준수하도록 되어 있는 표준이 지켜지지 않는 경우가 많기 때문입니다.</p>`
    strMSG += `            <p class='h40'>　절대수칙은 각종 사고예방을 위해 제정된 최소한의 안전수칙이며 더 이상 물러설 수 없어 무관용 원칙을 적용하고 있습니다.`
    strMSG += `            이에, 기필코 정착이 절실하며 완벽한 정착을 위해서는 현업 부서의'지키겠다, 할 수 있다' 는 의지가 반드시 있어야 합니다. </p>`
    strMSG += `            <p class='h40'>　안전관리의 주체는 작업지휘권을 가진 생산부서의 관리감독자이며, 이들을 관리 감독하는 총괄 책임은 부서장에게 있습니다.<br/>`
    strMSG += `            　향후 휘하 관리감독자들의 적극적인 '<strong>안전개입</strong>'으로 '기본'과 '원칙'이 바로서는 안전문화가 정착되도록 노력해 주시기 바랍니다.</p>`
    strMSG += `            <p class='text2'>` + senddt + `</p>`
    strMSG += `            <center><img src='https://hises.hhi.co.kr/Common/Images/안전경영실장 도장.png' width='367' height='143' alt='official seal'/></center>`
    strMSG += `        </td>`
    strMSG += `    </tr>`
    strMSG += `</table>`
    strMSG += `</body>`

    // 메일전송 - 해당자
    commonSendApi({
      EMAIL: recv_mail,
      SUBJECT: strTitle,
      CONTENT: strMSG,
    }).then((res) => {
      Message.success(t('메일이 전송되었습니다.'))
    })

    let recv_dmail = item['RECV_DMAIL'].toString().Trim()

    if (recv_mail.Equals(recv_dmail)) continue

    strMSG = ``
    strMSG += `<!doctype html>`
    strMSG += `<html>`
    strMSG += `<head>`
    strMSG += `<meta charset='utf-8'>`
    strMSG += `<title>직영/협력사</title>`
    strMSG += `<style>`
    strMSG += `    table{border:1px solid #bbb width: 600px}`
    strMSG += `    tr{border:1px solid #bbb }`
    strMSG += `    span.text{text-decoration: underline line-height: 35px color: #3c3c3c font-family: 'HY헤드라인M'  font-size: 15px }`
    strMSG += `    p.text2{ line-height: 30px text-align:center color: #3c3c3c margin-top: 20px font-family: 'HY헤드라인M' font-size: 16px  }`
    strMSG += `    p.text3{line-height: 30px text-align:center font-size: 25px font-weight:900 color: #3c3c3c  font-family: 'HY헤드라인M'  margin-bottom:40px}`
    strMSG += `    ul {padding: 0px 0 0 0}`
    strMSG += `    ul li{line-height: 30px padding-bottom: 20px font-size: 15px font-family: 'HY중고딕'}`
    strMSG += `    ul li span.text4{float:left height: 150px width: 17px}`
    strMSG += `    ul li span.text5{display: block}`
    strMSG += `    ul,ol { list-style: none !important }`
    //경고장 제목 red
    strMSG += `    h3{ color:#ff0000  font-weight: bolder font-size: 48px text-align: center !important background-color: #d3d3d3  width: 200px margin: 20px auto font-family: 'HY헤드라인M' line-height: 55px }`
    //경고장 제목 black
    strMSG += `    /*h4{ color:#3c3c3c  font-weight: bolder font-size: 22px text-align: center !important margin: 10px auto font-family: 'HY헤드라인M' line-height: 5px padding-top: 20px}*/`
    strMSG += `    ul li strong{font-weight: 900}`
    strMSG += `    p.info1 {font-family: '맑은 고딕' font-size: 11px color:#c8c8c8 margin: 10px 20px}`
    strMSG += `    p.info2 {font-family: '맑은 고딕' font-size: 11px color:#c8c8c8 margin: 10px 20px float: right text-align: right}`
    strMSG += `    .h40{display: block height: 30px line-height: 30pxfont-size: 15px font-family: 'HY중고딕'}`
    strMSG += `</style>`
    strMSG += `</head>`
    strMSG += ``
    strMSG += `<body>`
    strMSG += `<table>`
    strMSG += `    <tr>`
    strMSG += `        <td width='25%'><p class='info1'>국문</p></td>`
    strMSG +=
      `        <td colspan='2' width='*'><p class='info2'>No. ` +
      item['WNOTE_NO'].ToString() +
      `</p></td>`
    strMSG += `    </tr>`
    strMSG += `    <tr>`
    strMSG += `        <td width='30%'></td>`
    strMSG += `        <td width='40%'><h3>경 고 장</h3></td>`
    strMSG += `        <td width='30%'></td>`
    strMSG += `    </tr>`
    strMSG += `    <tr>`
    strMSG += `        <td colspan='3' style='padding: 0 40px'>`
    strMSG += `            <p style='line-height: 30px'>　<span class='text'>최근 귀하의 부서(팀/협력사)에 절대수칙 위반이 다수 발생하여`
    strMSG +=
      `            금번 안전아카데미 관리감독자 동반입소 대상에 <span style='color:#3f48cc'>` +
      item['EMP_NAME'].ToString() +
      `</span>님이 포함 되었습니다.</span></p>`
    strMSG += `            <p class='h40'>　우리회사의 안전이 위협받고 있는 이유 중 하나는 우리가 지키고자 만든 규정과 준수하도록 되어 있는 표준이 지켜지지 않는 경우가 많기 때문입니다.</p>`
    strMSG += `            <p class='h40'>　절대수칙은 각종 사고예방을 위해 제정된 최소한의 안전수칙이며 더 이상 물러설 수 없어 무관용 원칙을 적용하고 있습니다.`
    strMSG += `            이에, 기필코 정착이 절실하며 완벽한 정착을 위해서는 현업 부서의'지키겠다, 할 수 있다' 는 의지가 반드시 있어야 합니다. </p>`
    strMSG += `            <p class='h40'>　안전관리의 주체는 작업지휘권을 가진 생산부서의 관리감독자이며, 이들을 관리 감독하는 총괄 책임은 부서장에게 있습니다.<br/>`
    strMSG += `            　향후 휘하 관리감독자들의 적극적인 '<strong>안전개입</strong>'으로 '기본'과 '원칙'이 바로서는 안전문화가 정착되도록 노력해 주시기 바랍니다.</p>`
    strMSG += `            <p class='text2'>` + senddt + `</p>`
    strMSG += `            <center><img src='https://hises.hhi.co.kr/Common/Images/안전경영실장 도장.png' width='367' height='143' alt='official seal'/></center>`
    strMSG += `        </td>`
    strMSG += `    </tr>`
    strMSG += `</table>`
    strMSG += `</body>`

    // 메일전송 - 부서장
    commonSendApi({
      EMAIL: recv_dmail,
      SUBJECT: strTitle,
      CONTENT: strMSG,
    }).then((res) => {
      Message.success(t('메일이 전송되었습니다.'))
    })
  }
}
//별도 저장 버튼 이벤트
const onBtnSave1 = async () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }

  let res = await vm.$swal({
    title: t('조직별 위반율을 산출취소 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!res.isConfirmed) {
    return
  }

  await saveBtnSave1Data()

  searchParams.CUTOFF_DT = ''

  await setButton()

  await onMenuButtonsClick1(null)
}
const saveBtnSave1Data = async () => {
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CUTOFF_DT: searchParams.CUTOFF_DT,
    CALC_YN: 'N',
    CALC_LVL: '',
    USER_ID: userStore.userId,
    OUT_RES_COD: '',
    OUT_RES_MSG: '',
    OUT_RES_COL: '',
  }

  return await commonExecuteApi2({
    queryId: 'EDUAC0020_SAVE_01',
    list: [saveData],
  })
}
const onBtnSave5 = async (rs) => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }

  let message =
    rs === 'Y'
      ? '동반입소자 확정을 진행 하시겠습니까?'
      : '동반입소자 확정취소를 진행 하시겠습니까?'

  let res = await vm.$swal({
    title: t(message),
    showCancelButton: true,
  })

  if (!res.isConfirmed) {
    return
  }

  await saveBtnSave5Data(rs)
  await setButton()
}
const saveBtnSave5Data = async (rs) => {
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CUTOFF_DT: searchParams.CUTOFF_DT,
    CNFM_YN: rs,
    USER_ID: userStore.userId,
    USER_ID: userStore.userName,
    OUT_RES_COD: '',
    OUT_RES_MSG: '',
    OUT_RES_COL: '',
  }

  return await commonExecuteApi2({
    queryId: 'EDUAC0020_SAVE_05',
    list: [saveData],
  })
}
//계산 버튼 이벤트
const onBtnCalc1 = () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }

  new saveFlowHelper(vm, t)
    .setConfirmMessage('조직별 위반율 산출 초기화를 하시겠습니까?')
    .setQuery(saveCalc1Data)
    .run()
}
const saveCalc1Data = async () => {
  for (let i = 0; i <= 1; i++) {
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      CUTOFF_DT: searchParams.CUTOFF_DT,
      CALC_YN: 'Y',
      CALC_LVL: i.toString(),
      USER_ID: userStore.userId,
      OUT_RES_COD: '',
      OUT_RES_MSG: '',
      OUT_RES_COL: '',
    }

    let result = await commonExecuteApi2({
      queryId: 'EDUAC0020_SAVE_01',
      list: [saveData],
    }).then((res) => {
      if (
        res.ORESULT_CUR[0]['OUT_RES_COD'].toString().length > 0 &&
        res.ORESULT_CUR[0]['OUT_RES_COD'].toString().substr(0, 1) === '-'
      ) {
        saveData = {
          CMPNY_DIV: userStore.cmpnyDiv,
          CUTOFF_DT: searchParams.CUTOFF_DT,
          CALC_YN: 'N',
          CALC_LVL: '',
          USER_ID: userStore.userId,
          OUT_RES_COD: '',
          OUT_RES_MSG: '',
          OUT_RES_COL: '',
        }

        return commonExecuteApi2({
          queryId: 'EDUAC0020_SAVE_01',
          list: [saveData],
        })
      }
    })
  }

  return result
}
const onBtnCalc2 = async () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }

  let ck = await vm.$swal({
    title: t('조직별 위반율을 산출대상 조회를 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    return
  }

  new queryFlowHelper(vm, t).setQuery(saveCalc2Data).run()
}
const saveCalc2Data = async () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
  }

  commonSearchApi({ queryId: 'EDUAC0020_SEARCH_09', param: searchParam }).then(
    (res) => {
      dsASGN.value = res
      console.log(dsASGN.value, '테스트')
    }
  )
}
const onBtnCalc3 = () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }
  if (dsASGN.value !== null && dsASGN.value.ORESULT_CUR0.length > 0) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('조직별 위반율 직영팀별 산출을 하시겠습니까?')
      .setBefore(beforeCalc3Data)
      .setQuery(saveCalc3Data)
      .run()
  }
}
const beforeCalc3Data = async () => {
  let param = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
      GBN: '1',
      OUT_RES_COD: '',
      OUT_RES_MSG: '',
      OUT_RES_COL: '',
    },
  ]
  commonExecuteApi({ queryId: 'EDUAC0020_DELETE_02', list: param })

  return true
}
const saveCalc3Data = async () => {
  let saveList = []
  let lastIdx = dsASGN.value.ORESULT_CUR0.length - 1
  for (let i = 0; i < dsASGN.value.ORESULT_CUR0.length; i++) {
    let dataRow = dsASGN.value.ORESULT_CUR0[i]

    if (i < lastIdx) {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '1',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      await commonExecuteApi2({
        queryId: 'EDUAC0020_SAVE_09',
        list: [saveData],
      })
    } else {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '1',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      saveList.push(saveData)
    }
  }

  return await commonExecuteApi2({
    queryId: 'EDUAC0020_SAVE_09',
    list: saveList,
  })
}
const onBtnCalc4 = () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }
  if (dsASGN.value !== null && dsASGN.value.ORESULT_CUR1.length > 0) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('조직별 위반율 직영과별 산출을 하시겠습니까?')
      .setBefore(beforeCalc4Data)
      .setQuery(saveCalc4Data)
      .run()
  }
}
const beforeCalc4Data = async () => {
  let param = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
      GBN: '2',
      OUT_RES_COD: '',
      OUT_RES_MSG: '',
      OUT_RES_COL: '',
    },
  ]
  commonExecuteApi({ queryId: 'EDUAC0020_DELETE_02', list: param })

  return true
}
const saveCalc4Data = async () => {
  let saveList = []
  let lastIdx = dsASGN.value.ORESULT_CUR1.length - 1
  for (let i = 0; i < dsASGN.value.ORESULT_CUR1.length; i++) {
    let dataRow = dsASGN.value.ORESULT_CUR1[i]

    if (i < lastIdx) {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_60'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '2',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      await commonExecuteApi2({
        queryId: 'EDUAC0020_SAVE_09',
        list: [saveData],
      })
    } else {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_60'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '2',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      saveList.push(saveData)
    }
  }

  return await commonExecuteApi2({
    queryId: 'EDUAC0020_SAVE_09',
    list: saveList,
  })
}
const onBtnCalc5 = () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }
  if (dsASGN.value !== null && dsASGN.value.ORESULT_CUR2.length > 0) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('조직별 위반율 직영부서별 산출을 하시겠습니까?')
      .setBefore(beforeCalc5Data)
      .setQuery(saveCalc5Data)
      .run()
  }
}
const beforeCalc5Data = async () => {
  let param = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
      GBN: '3',
      OUT_RES_COD: '',
      OUT_RES_MSG: '',
      OUT_RES_COL: '',
    },
  ]
  commonExecuteApi({ queryId: 'EDUAC0020_DELETE_02', list: param })

  return true
}
const saveCalc5Data = async () => {
  let saveList = []
  let lastIdx = dsASGN.value.ORESULT_CUR2.length - 1
  for (let i = 0; i < dsASGN.value.ORESULT_CUR2.length; i++) {
    let dataRow = dsASGN.value.ORESULT_CUR2[i]
    if (i < lastIdx) {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '3',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      await commonExecuteApi2({
        queryId: 'EDUAC0020_SAVE_09',
        list: [saveData],
      })
    } else {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '3',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      saveList.push(saveData)
    }
  }

  return await commonExecuteApi2({
    queryId: 'EDUAC0020_SAVE_09',
    list: saveList,
  })
}
const onBtnCalc6 = () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }
  if (dsASGN.value !== null && dsASGN.value.ORESULT_CUR4.length > 0) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('조직별 위반율 협력사소장별 산출을 하시겠습니까?')
      .setBefore(beforeCalc6Data)
      .setQuery(saveCalc6Data)
      .run()
  }
}
const beforeCalc6Data = async () => {
  let param = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
      GBN: '7',
      OUT_RES_COD: '',
      OUT_RES_MSG: '',
      OUT_RES_COL: '',
    },
  ]
  commonExecuteApi({ queryId: 'EDUAC0020_DELETE_02', list: param })

  return true
}
const saveCalc6Data = async () => {
  let saveList = []
  let lastIdx = dsASGN.value.ORESULT_CUR4.length - 1
  for (let i = 0; i < dsASGN.value.ORESULT_CUR4.length; i++) {
    let dataRow = dsASGN.value.ORESULT_CUR4[i]
    if (i < lastIdx) {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '7',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      await commonExecuteApi2({
        queryId: 'EDUAC0020_SAVE_09',
        list: [saveData],
      })
    } else {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '7',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      saveList.push(saveData)
    }
  }

  return await commonExecuteApi2({
    queryId: 'EDUAC0020_SAVE_09',
    list: saveList,
  })
}
const onBtnCalc7 = () => {
  if (!searchParams.CUTOFF_DT) {
    Message.warn(t('컷오프일자를 입력해 주세요.'))

    return
  }
  if (dsASGN.value !== null && dsASGN.value.ORESULT_CUR3.length > 0) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('조직별 위반율 협력사대표별 산출을 하시겠습니까?')
      .setBefore(beforeCalc7Data)
      .setQuery(saveCalc7Data)
      .run()
  }
}
const beforeCalc7Data = async () => {
  let param = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
      GBN: '6',
      OUT_RES_COD: '',
      OUT_RES_MSG: '',
      OUT_RES_COL: '',
    },
  ]
  commonExecuteApi({ queryId: 'EDUAC0020_DELETE_02', list: param })

  return true
}
const saveCalc7Data = async () => {
  let saveList = []
  let lastIdx = dsASGN.value.ORESULT_CUR3.length - 1
  for (let i = 0; i < dsASGN.value.ORESULT_CUR3.length; i++) {
    let dataRow = dsASGN.value.ORESULT_CUR3[i]
    if (i < lastIdx) {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '6',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      await commonExecuteApi2({
        queryId: 'EDUAC0020_SAVE_09',
        list: [saveData],
      })
    } else {
      let saveData = {
        CMPNY_DIV: dataRow['CMPNY_DIV'],
        CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
        BSNS_CD: dataRow['BSNS_CD'],
        DEPT_CD: dataRow['DEPT_CD'],
        ASGN_60: dataRow['ASGN_CD'],
        CUTOFF_DT_FR: dataRow['CUTOFF_DT_FR'],
        CUTOFF_DT_TO: dataRow['CUTOFF_DT_TO'],
        GBN: '6',
        CHK: 'Y',
        USER_ID: userStore.userId,
      }
      saveList.push(saveData)
    }
  }

  return await commonExecuteApi2({
    queryId: 'EDUAC0020_SAVE_09',
    list: saveList,
  })
}
const onBtnCalc8 = async () => {
  let saveData1 = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
    CALC_YN: 'Y',
    CALC_LVL: '4',
    USER_ID: userStore.userId,
    OUT_RES_COD: '',
    OUT_RES_MSG: '',
    OUT_RES_COL: '',
  }

  await commonExecuteApi2({ queryId: 'EDUAC0020_SAVE_01', list: [saveData1] })

  let saveData2 = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CUTOFF_DT: searchParams.CUTOFF_DT.toString().replaceAll('-', ''),
    CALC_YN: 'Y',
    CALC_LVL: '7',
    USER_ID: userStore.userId,
    OUT_RES_COD: '',
    OUT_RES_MSG: '',
    OUT_RES_COL: '',
  }

  await commonExecuteApi2({ queryId: 'EDUAC0020_SAVE_01', list: [saveData2] })

  searchParams.CHK_NEW = 'N'
  searchParams.CUTOFF_DT = searchParams.CUTOFF_DT.toString().replaceAll('-', '')

  await setButton()
}
//메인그리드 row idx변경 이벤트
const onCurrentRowChanged = async (grid, oldIdx, newIdx) => {
  if (newIdx > -1) {
    await subClear()
    await getSub1()
    await getSub2()
    await getSub3()
    await getSub4()
  }
}

//신규입력 체크 이벤트
const chkNewChanged = async () => {
  await setButton()
  await onMenuButtonsClick1(null)
}

//기준년월 값 변경 이벤트
const yearMnthChanged = async () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_YYYYMM: searchParams.YEARMNTH.toString().replaceAll('-', ''),
  }

  await commonSearchApi({ queryId: 'EDUAC0020_COMBO_01', param: searchParam })
    .then(async (res) => {
      codeList.CUTOFF_DT = res.ORESULT_CUR
      if (!isNull(codeList.CUTOFF_DT[0])) {
        searchParams.CUTOFF_DT = codeList.CUTOFF_DT[0]['CUTOFF_DT']
        setButton()
      } else {
        searchParams.CUTOFF_DT = ''
        setButton()
      }
    })
    .finally(async () => {
      console.log('여기 오냐???')
      await onMenuButtonsClick1(null)
    })
}

//기준일 변경 이벤트
const CUTOFF_DT_EditValueChanged = () => {
  setButton()
}

//직원 선택 이벤트
const onEmpButtonClicked1 = (grid, row, col) => {
  let rowData = grdSub1.value.getDataProvider().getJsonRow(row.dataRow)

  empData.GRID_NO = 1
  empData.DATA_ROW = row.dataRow

  empPopup.value.openPopup({
    BSNS_CD: rowData.BSNS_CD,
    DEPT_CD: rowData.DEPT_CD,
  })
}
const onEmpButtonClicked2 = (grid, row, col) => {
  let rowData = grdSub2.value.getDataProvider().getJsonRow(row.dataRow)

  empData.GRID_NO = 2
  empData.DATA_ROW = row.dataRow

  empPopup.value.openPopup({
    BSNS_CD: rowData.BSNS_CD,
    DEPT_CD: rowData.DEPT_CD,
  })
}
const onEmpButtonClicked3 = (grid, row, col) => {
  let rowData = grdSub3.value.getDataProvider().getJsonRow(row.dataRow)

  empData.GRID_NO = 3
  empData.DATA_ROW = row.dataRow

  empPopup.value.openPopup({
    BSNS_CD: rowData.BSNS_CD,
    DEPT_CD: rowData.DEPT_CD,
  })
}

//동반입소 지정 클릭 이벤트
const onSubGrdCellClicked1 = async (grid, clickData) => {
  if (isNull(clickData.dataRow)) return
  if (clickData.fieldName !== 'ACDM_YN') return

  let rowData = grdSub1.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (
    rowData['WIBAN_RATE'] >= wiban.dF21070 &&
    rowData['WINBAN_CNT'] >= wiban.dF21070B
  ) {
    if (rowData['ACDM_YN'] === 'Y')
      grdSub1.value
        .getDataProvider()
        .setValue(clickData.dataRow, 'ACDM_YN', 'N')
    else
      grdSub1.value
        .getDataProvider()
        .setValue(clickData.dataRow, 'ACDM_YN', 'Y')

    grdSub1.value.getGridView().checkRow(clickData.dataRow, true)
  }
}
const onSubGrdCellClicked2 = async (grid, clickData) => {
  if (isNull(clickData.dataRow)) return
  if (clickData.fieldName !== 'ACDM_YN') return

  let rowData = grdSub2.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (
    (rowData['EMP_CNT'] >= wiban.dF22060A &&
      rowData['WIBAN_RATE'] > wiban.dF21060) ||
    (rowData['EMP_CNT'] < wiban.dF22060A &&
      rowData['WINBAN_CNT'] >= wiban.dF22060B)
  ) {
    if (rowData['ACDM_YN'] === 'Y')
      grdSub2.value
        .getDataProvider()
        .setValue(clickData.dataRow, 'ACDM_YN', 'N')
    else
      grdSub2.value
        .getDataProvider()
        .setValue(clickData.dataRow, 'ACDM_YN', 'Y')

    grdSub2.value.getGridView().checkRow(clickData.dataRow, true)
  }
}
const onSubGrdCellClicked3 = async (grid, clickData) => {
  if (isNull(clickData.dataRow)) return
  if (clickData.fieldName !== 'ACDM_YN') return

  let rowData = grdSub3.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (
    (rowData['OUT_YN'] !== 'Y' &&
      rowData['EMP_CNT'] >= wiban.dF22050A &&
      rowData['WIBAN_RATE'] > wiban.dF21050) ||
    (rowData['EMP_CNT'] < wiban.dF22050A &&
      rowData['WINBAN_CNT'] >= wiban.dF22050B) ||
    (rowData['OUT_YN'] === 'Y' && rowData['WIBAN_RATE'] > wiban.dF210ZZ)
  ) {
    if (rowData['ACDM_YN'] === 'Y')
      grdSub3.value
        .getDataProvider()
        .setValue(clickData.dataRow, 'ACDM_YN', 'N')
    else
      grdSub3.value
        .getDataProvider()
        .setValue(clickData.dataRow, 'ACDM_YN', 'Y')

    grdSub3.value.getGridView().checkRow(clickData.dataRow, true)
  }
}

const selectedEmp = (row) => {
  if (row) {
    if (empData.GRID_NO === 1) {
      grdSub1.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_NO', row.EMP_NO)
      grdSub1.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_NAME', row.EMP_NM)
      grdSub1.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_JICWI', row.JOB_TIT_NM)
      grdSub1.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'BSNS_CD', row.BSNS_CD)
      grdSub1.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'DEPT_CD', row.DEPT_CD)
      grdSub1.value.getGridView().checkRow(empData.DATA_ROW, true)
    } else if (empData.GRID_NO === 2) {
      grdSub2.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_NO', row.EMP_NO)
      grdSub2.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_NAME', row.EMP_NM)
      grdSub2.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_JICWI', row.JOB_TIT_NM)
      grdSub2.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'BSNS_CD', row.BSNS_CD)
      grdSub2.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'DEPT_CD', row.DEPT_CD)
      grdSub2.value.getGridView().checkRow(empData.DATA_ROW, true)
    } else if (empData.GRID_NO === 3) {
      grdSub3.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_NO', row.EMP_NO)
      grdSub3.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_NAME', row.EMP_NM)
      grdSub3.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'EMP_JICWI', row.JOB_TIT_NM)
      grdSub3.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'BSNS_CD', row.BSNS_CD)
      grdSub3.value
        .getDataProvider()
        .setValue(empData.DATA_ROW, 'DEPT_CD', row.DEPT_CD)
      grdSub3.value.getGridView().checkRow(empData.DATA_ROW, true)
    }
  }
}

//공통
//null 체크
const isNull = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}
//SubGrid 전체 초기화
const subClear = async () => {
  clearGrid(grdSub1)
  clearGrid(grdSub2)
  clearGrid(grdSub3)
  clearGrid(grdSub4)
}
// 그리드 초기화
const clearGrid = async (grd) => {
  grd.value.getDataProvider().setRows(null)
}
//콤보박스 초기화
const initCombo = () => {
  //사업부 설정
  commonSearchApi({ queryId: 'searchBSNS', param: searchParams })
    .then((res) => {
      codeList.BSNS.push({ TXT: '전체', COD: '' })
      res.ORESULT_CUR.forEach((element) => {
        codeList.BSNS.push({ TXT: element.BSNS_NM, COD: element.BSNS_CD })
      })
    })
    .finally(() => {
      grdSub1.value.setBindingColumn('BSNS_CD', codeList.BSNS, 'COD', 'TXT')
      grdSub2.value.setBindingColumn('BSNS_CD', codeList.BSNS, 'COD', 'TXT')
      grdSub3.value.setBindingColumn('BSNS_CD', codeList.BSNS, 'COD', 'TXT')
    })

  //title내용 불러오기
  commonSearchApi({ queryId: 'EDUAC0020_COMBO_03', param: searchParams }).then(
    (res) => {
      if (res.ORESULT_CUR.length > 0) {
        let row = res.ORESULT_CUR[0]

        wiban.dF21070 = row['F21070']
        wiban.dF21070B = row['F21070B']
        wiban.dF21060 = row['F21060']
        wiban.dF21050 = row['F21050']
        wiban.dF210ZZ = row['F210ZZ']
        wiban.dF22060A = row['F22060A']
        wiban.dF22060B = row['F22060B']
        wiban.dF22050A = row['F22050A']
        wiban.dF22050B = row['F22050B']

        textValue.TAB1_TEXT =
          '조직별 위반율 현황(감독자 동반입소 대상 : 위반율 ' +
          wiban.dF21070 +
          '% 이상, 최소 ' +
          wiban.dF21070B +
          '명이상 발생시)'
        textValue.TAB2_TEXT =
          '과별 위반율 현황(직책과장 동반입소 대상 : 위반율 ' +
          wiban.dF21060 +
          '% 초과 발생시, ' +
          wiban.dF22060A +
          '명 미만 ' +
          wiban.dF22060B +
          '건이상 발생시)'
        textValue.TAB3_TEXT =
          '부서,협력사별 위반율 현황(부서장 동반입소 대상 : 위반율 ' +
          wiban.dF21050 +
          '% 초과 발생시, ' +
          wiban.dF22050A +
          '명 미만 ' +
          wiban.dF22050B +
          '건 이상 발생시)'
      }
    }
  )
}
//버튼 세팅
const setButton = async () => {
  grdTitle1.value.disableBtn('btnUpdate', true)
  grdTitle2.value.disableBtn('btnUpdate', true)
  grdTitle3.value.disableBtn('btnUpdate', true)
  btnDisable.CancelWIBAN_RATE = true
  btnDisable.Confirm = true
  btnDisable.CancelConfirm = true
  btnDisable.Calc1 = true
  btnDisable.Calc2 = true
  btnDisable.Calc3 = true
  btnDisable.Calc4 = true
  btnDisable.Calc5 = true
  btnDisable.Calc6 = true
  btnDisable.Calc7 = true
  btnDisable.Calc8 = true

  searchParams.CPN_RTRN_DT = ''
  searchParams.HEAD_CNFM_DT = ''

  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    CUTOFF_DT: searchParams.CHK_NEW === 'Y' ? '' : searchParams.CUTOFF_DT,
  }

  await commonSearchApi({ queryId: 'EDUAC0020_COMBO_02', param: searchParam })
    .then(async (res) => {
      if (res.ORESULT_CUR[0] !== null && res.ORESULT_CUR.length > 0) {
        searchParams.CPN_RTRN_DT = res.ORESULT_CUR[0]['CUTOFF_DT']
        searchParams.HEAD_CNFM_DT = res.ORESULT_CUR[0]['HEAD_CNFM_DT']
      }
    })
    .finally(async () => {
      if (!isNull(searchParams.HEAD_CNFM_DT)) {
        btnDisable.CancelConfirm = false
      } else if (!isNull(searchParams.CPN_RTRN_DT)) {
        grdTitle1.value.disableBtn('btnUpdate', false)
        grdTitle2.value.disableBtn('btnUpdate', false)
        grdTitle3.value.disableBtn('btnUpdate', false)
        btnDisable.CancelWIBAN_RATE = false
        btnDisable.Confirm = false
      } else if (searchParams.CHK_NEW === 'Y') {
        btnDisable.Calc1 = false
        btnDisable.Calc2 = false
        btnDisable.Calc3 = false
        btnDisable.Calc4 = false
        btnDisable.Calc5 = false
        btnDisable.Calc6 = false
        btnDisable.Calc7 = false
        btnDisable.Calc8 = false
      }
    })
}
//서브그리드 글자색 세팅
const setSubGridColor = async (gubn) => {
  if (gubn === 'sub1') {
    grdSub1.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      if (dataCell.index.fieldName === 'ACDM_YN') {
        if (dataCell.value === 'Y') {
          ret.style = { background: '#FF0000' } //Red
          return ret
        } else {
          ret.style = { background: '#FFFFFF' } //White
          return ret
        }
      }
    })
  } else if (gubn === 'sub2') {
    grdSub2.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      var colorValue = dataCell.value
      if (dataCell.index.fieldName === 'ACDM_YN') {
        if (dataCell.value === 'Y') {
          ret.style = { background: '#FF0000' } //Red
          return ret
        } else {
          ret.style = { background: '#FFFFFF' } //White
          return ret
        }
      }
    })
  } else if (gubn === 'sub3') {
    grdSub3.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      var colorValue = dataCell.value
      if (dataCell.index.fieldName === 'ACDM_YN') {
        if (dataCell.value === 'Y') {
          ret.style = { background: '#FF0000' } //Red
          return ret
        } else {
          ret.style = { background: '#FFFFFF' } //White
          return ret
        }
      }
    })
  }
}
//시작 이벤트
onMounted(() => {
  vm.$nextTick(() => {
    initCombo()
    setButton()
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onMenuButtonsClick1"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2 align-center">
            <i-input
              :label="$t('기준년월')"
              labelWidth="100px"
              width="250px"
              v-model="searchParams.YEARMNTH"
              type="Month"
              @update:model-value="yearMnthChanged"
            />
            <i-input
              v-if="searchParams.CHK_NEW === 'Y'"
              :label="$t('기준일')"
              labelWidth="60px"
              width="205px"
              v-model="searchParams.CUTOFF_DT"
              type="date"
              margin="10px"
              @update:model-value="CUTOFF_DT_EditValueChanged"
            />
            <i-select
              v-if="searchParams.CHK_NEW !== 'Y'"
              :label="$t('기준일')"
              labelWidth="60px"
              width="205px"
              margin="10px"
              v-model="searchParams.CUTOFF_DT"
              :items="codeList.CUTOFF_DT"
              item-value="CUTOFF_DT"
              item-title="CUTOFF_DT"
              @update:model-value="CUTOFF_DT_EditValueChanged"
            />
          </div>
          <div class="d-flex mb-2 align-center">
            <i-input
              :label="$t('위반율 산출일')"
              labelWidth="100px"
              width="250px"
              v-model="searchParams.CPN_RTRN_DT"
              type="date"
              margin="10px"
            />
            <VBtn
              class="mr-3"
              :disabled="btnDisable.CancelWIBAN_RATE"
              @click="onBtnSave1()"
              >위반율 산출 취소</VBtn
            >
            <i-input
              :label="$t('확정일')"
              labelWidth="50px"
              width="205px"
              v-model="searchParams.HEAD_CNFM_DT"
              type="date"
              margin="10px"
            />
            <VBtn :disabled="btnDisable.Confirm" @click="onBtnSave5('Y')"
              >동반입소자 확정</VBtn
            >
            <VBtn :disabled="btnDisable.CancelConfirm" @click="onBtnSave5('N')"
              >확정취소</VBtn
            >
          </div>
          <div class="d-flex mb-2 align-center">
            <p class="mr-2">조직별 위반율 산출(수동실행)</p>
            <VCheckbox
              class="mr-4"
              :label="$t('신규입력')"
              v-model="searchParams.CHK_NEW"
              true-value="Y"
              false-value="N"
              @update:model-value="chkNewChanged"
            />
            <VBtn :disabled="btnDisable.Calc1" @click="onBtnCalc1()"
              >1. 초기화</VBtn
            >
            <VBtn :disabled="btnDisable.Calc2" @click="onBtnCalc2()"
              >2. 대상조회</VBtn
            >
            <VBtn :disabled="btnDisable.Calc3" @click="onBtnCalc3()"
              >3. 직영팀별</VBtn
            >
            <VBtn :disabled="btnDisable.Calc4" @click="onBtnCalc4()"
              >4. 직영과별</VBtn
            >
            <VBtn :disabled="btnDisable.Calc5" @click="onBtnCalc5()"
              >5. 직영부서별</VBtn
            >
            <VBtn :disabled="btnDisable.Calc6" @click="onBtnCalc6()"
              >6. 협력사소장별</VBtn
            >
            <VBtn :disabled="btnDisable.Calc7" @click="onBtnCalc7()"
              >7. 협력사대표별</VBtn
            >
            <VBtn :disabled="btnDisable.Calc8" @click="onBtnCalc8()"
              >8. 최종</VBtn
            >
          </div>
        </v-sheet>
        <v-sheet height="130px">
          <IGridTitle :title="$t('수동실행은 순서별로 실행하시기 바랍니다.')" />
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :gridViewOption="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @on-current-row-changed="onCurrentRowChanged"
          />
        </v-sheet>
        <v-sheet class="mb-2">
          <v-tabs v-model="tab">
            <v-tab value="tab1">팀별 위반율(팀장, 소장)</v-tab>
            <v-tab value="tab2">직책과장</v-tab>
            <v-tab value="tab3">부서장, 협력사대표</v-tab>
            <v-tab value="tab4">경고장 발송대상</v-tab>
          </v-tabs>
        </v-sheet>
        <v-sheet v-show="tab == 'tab1'" class="h-auto">
          <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
              바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
          -->
          <div class="h-auto">
            <IGridTitle
              ref="grdTitle1"
              :title="$t(textValue.TAB1_TEXT)"
              :button-list="['btnSearch', 'btnUpdate']"
              @click-button="onTabButtonsClick1"
            />
            <RealGrid
              ref="grdSub1"
              class="mt-2"
              :gridViewOption="grdSubProps1.gridViewOption"
              :fields="grdSubProps1.fields"
              :columns="grdSubProps1.columns"
              :column-layout="grdSubProps1.columnLayout"
              @onCellButtonClicked="onEmpButtonClicked1"
              @onCellClicked="onSubGrdCellClicked1"
            />
          </div>
        </v-sheet>
        <v-sheet v-show="tab == 'tab2'" class="h-auto">
          <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
              바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
          -->
          <div class="h-grow justify-space-between align-center">
            <div>
              <p class="gridTitle mR-10">{{ textValue.TAB2_TEXT }}</p>
            </div>
            <div style="display: flex">
              <VCheckbox
                :label="$t('동반대상자만')"
                v-model="searchParams.ACDM_YN2"
                true-value="Y"
                false-value="N"
              />
              <IGridTitle
                ref="grdTitle2"
                :button-list="['btnSearch', 'btnUpdate']"
                @click-button="onTabButtonsClick2"
              />
            </div>
          </div>
          <RealGrid
            ref="grdSub2"
            class="mt-2"
            :gridViewOption="grdSubProps2.gridViewOption"
            :fields="grdSubProps2.fields"
            :columns="grdSubProps2.columns"
            :column-layout="grdSubProps2.columnLayout"
            @onCellButtonClicked="onEmpButtonClicked2"
            @onCellClicked="onSubGrdCellClicked2"
          />
        </v-sheet>
        <v-sheet v-show="tab == 'tab3'" class="h-auto">
          <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
              바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
          -->
          <div class="h-grow justify-space-between align-center">
            <div>
              <p class="gridTitle mR-10">{{ textValue.TAB3_TEXT }}</p>
            </div>
            <div style="display: flex">
              <VCheckbox
                :label="$t('동반대상자만')"
                v-model="searchParams.ACDM_YN3"
                true-value="Y"
                false-value="N"
              />
              <IGridTitle
                ref="grdTitle3"
                :button-list="['btnSearch', 'btnUpdate']"
                @click-button="onTabButtonsClick3"
              />
            </div>
          </div>
          <RealGrid
            ref="grdSub3"
            class="mt-2"
            height="550"
            :gridViewOption="grdSubProps3.gridViewOption"
            :fields="grdSubProps3.fields"
            :columns="grdSubProps3.columns"
            :column-layout="grdSubProps3.columnLayout"
            @onCellClicked="onSubGrdCellClicked3"
            @onCellButtonClicked="onEmpButtonClicked3"
          />
        </v-sheet>
        <v-sheet v-show="tab == 'tab4'" class="h-auto">
          <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
              바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
          -->
          <IGridTitle
            ref="grdTitle4"
            :title="$t('경고장 발송 대상 리스트')"
            :button-list="['btnSearch', 'btnMail']"
            @click-button="onTabButtonsClick4"
          />
          <RealGrid
            ref="grdSub4"
            class="mt-2"
            height="550"
            :fields="grdSubProps4.fields"
            :columns="grdSubProps4.columns"
            :column-layout="grdSubProps4.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <EmpPopup ref="empPopup" @selected="selectedEmp" />
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
    min-height: 700px;
  }
}
</style>
