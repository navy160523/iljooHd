<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import _ from 'lodash'
import IGridTitle from '@/components/IGridTitle.vue'
defineOptions({
  name: '30_safety-SAF_A-SAFAD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const grdMain = ref(null)
const echart = ref(null)
const dialog = ref(false)

const gubunFlag = ref(null) //주/월간 구분 v-model
const yearMonth = ref(null)

const workDays = reactive({
  WORK_DAY: '',
  ACC_WORK_DAY: '',
})

//구분이 주간일때 조회파라미터
const weekSearchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  WEEK: '',
})

//구분이 월간일때 조회파라미터
const monthSearchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  MONTH: '',
})

const codeList = reactive({
  gubun: [
    { TXT: '주간', COD: 'W' },
    { TXT: '월간', COD: 'M' },
  ],
  weekList: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      mergeRule: { criteria: 'value' },
      header: { text: t('사업부') },
    },
    {
      fieldName: 'PART_NM',
      dataType: 'text',
      width: '130',
      editable: false,
      mergeRule: { criteria: 'value' },
      header: { text: t('부문') },
    },
    {
      fieldName: 'DAMD_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      mergeRule: { criteria: "values['PART_NM'] + value" },
      //mergeRule: { criteria: "value" },
      header: { text: t('담당') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '130',
      editable: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'ALL_JAEHAE2',
      dataType: 'number',
      width: '100',
      numberFormat: '#,##0.000',
      editable: false,
      styleName: 'right-column',
      header: { text: t('재해율') },
    },
    {
      fieldName: 'ACC_RATE_PLN',
      dataType: 'number',
      width: '100',
      numberFormat: '#,##0.000',
      editable: false,
      styleName: 'right-column',
      header: { text: t(' '), styleName: 'multiline-editor-pre' },
    },
    {
      fieldName: 'ACVMNT_RATE',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('달성율') },
    },
    {
      fieldName: 'ACC_ALL_WORK_TIME',
      //누적근로시간
      dataType: 'number',
      width: '100',
      numberFormat: '#,##0',
      editable: false,
      styleName: 'right-column',
      header: { text: t('누적') },
    },
    {
      //누적직영근로시간
      fieldName: 'ACC_JIC_WORK_TIME',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('누적') },
    },
    {
      //금월,금주직영근로시간
      fieldName: 'JIC_WORK_TIME',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('금월') },
    },
    {
      //누적협력근로시간
      fieldName: 'ACC_HYP_WORK_TIME',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('누적') },
    },
    {
      //금월,금주협력근로시간
      fieldName: 'HYP_WORK_TIME',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('금월') },
    },
    {
      //누적합계인원
      fieldName: 'ACC_ALL_EMP_COUNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('합계') },
    },

    {
      //누적직영인원
      fieldName: 'ACC_JIC_EMP_COUNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('직영') },
    },
    {
      //누적협력인원
      fieldName: 'ACC_HYP_EMP_COUNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('협력') },
    },
    {
      //금월합계인원
      fieldName: 'ALL_EMP_COUNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('합계') },
    },
    {
      //금월직영인원
      fieldName: 'JIC_EMP_COUNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('직영') },
    },
    {
      //금월협력인원
      fieldName: 'HYP_EMP_COUNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('협력') },
    },
    {
      //누적합계손실일수
      fieldName: 'ACC_ALL_SONSIL_DAYS',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('합계') },
    },
    {
      //누적직영손실일수
      fieldName: 'ACC_JIC_SONSIL_DAYS',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('직영') },
    },
    {
      //누적협력손실일수
      fieldName: 'ACC_HYP_SONSIL_DAYS',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('협력') },
    },
    {
      //금월,금주합계손실일수
      fieldName: 'ALL_SONSIL_DAYS',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('합계') },
    },
    {
      //금월직영손실일수
      fieldName: 'JIC_SONSIL_DAYS',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('직영') },
    },

    {
      //금월협력손실일수
      fieldName: 'HYP_SONSIL_DAYS',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('협력') },
    },

    {
      //누적합계재해현황
      fieldName: 'ACC_ALL_SAGO_CNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('합계') },
    },
    {
      //누적직영재해현황
      fieldName: 'ACC_JIC_SAGO_CNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('직영') },
    },

    {
      //누적협력재해현황
      fieldName: 'ACC_HYP_SAGO_CNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('협력') },
    },
    {
      //금월합계재해현황
      fieldName: 'ALL_SAGO_CNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('합계') },
    },
    {
      //금월직영재해현황
      fieldName: 'JIC_SAGO_CNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('직영') },
    },
    {
      //금월협력재해현황
      fieldName: 'HYP_SAGO_CNT',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('협력') },
    },
    {
      //직영빈도율
      fieldName: 'JIC_BINDO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('빈도율') },
    },
    {
      //직영강도율
      fieldName: 'JIC_GANGDO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('강도율') },
    },
    {
      //직영종합지수
      fieldName: 'JIC_JISOO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('종합지수') },
    },
    {
      //직영재해율
      fieldName: 'JIC_JAEHAE',
      dataType: 'number',
      numberFormat: '#,##0.000',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('재해율') },
    },
    {
      //협력빈도율
      fieldName: 'HYP_BINDO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('빈도율') },
    },
    {
      //협력강도율
      fieldName: 'HYP_GANGDO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('강도율') },
    },
    {
      //협력종합지수
      fieldName: 'HYP_JISOO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('종합지수') },
    },
    {
      //협력재해율
      fieldName: 'HYP_JAEHAE',
      dataType: 'number',
      numberFormat: '#,##0.000',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('재해율') },
    },

    {
      //계빈도율
      fieldName: 'ALL_BINDO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('빈도율') },
    },

    {
      //계강도율
      fieldName: 'ALL_GANGDO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('강도율') },
    },
    {
      //계재해율
      fieldName: 'ALL_JAEHAE',
      dataType: 'number',
      numberFormat: '#,##0.000',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('재해율') },
    },
    {
      //계종합지수
      fieldName: 'ALL_JISOO',
      dataType: 'number',
      numberFormat: '#,##0.00',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('종합지수') },
    },

    {
      fieldName: 'BSNS_CD',
      dataType: 'number',
      numberFormat: '#,##0',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('사업부코드') },
    },

    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('부서코드') },
    },

    {
      fieldName: 'PART_CD',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('부문코드') },
    },
    {
      fieldName: 'REL_CD',
      dataType: 'text',
      width: '100',
      visible: false,
      editable: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SRT',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM',
    'PART_NM',
    'DAMD_NM',
    'DEPT_NM',
    'ALL_JAEHAE2',
    'ACC_RATE_PLN',
    'ACVMNT_RATE',
    {
      name: '총 근로시간',
      direction: 'horizontal',
      items: [
        {
          name: '직영+협력',
          items: ['ACC_ALL_WORK_TIME'],
        },
        {
          name: '직영',
          direction: 'horizontal',

          items: ['ACC_JIC_WORK_TIME', 'JIC_WORK_TIME'],
        },
        {
          name: '협력',
          direction: 'horizontal',
          items: ['ACC_HYP_WORK_TIME', 'HYP_WORK_TIME'],
        },
      ],
    },
    {
      name: '누적평균인원',
      direction: 'horizontal',
      items: ['ACC_ALL_EMP_COUNT', 'ACC_JIC_EMP_COUNT', 'ACC_HYP_EMP_COUNT'],
    },
    {
      name: '',
      direction: 'horizontal',
      items: ['ALL_EMP_COUNT', 'JIC_EMP_COUNT', 'HYP_EMP_COUNT'],
    },
    {
      name: '재해손실일수',
      direction: 'horizontal',
      items: [
        {
          name: '누적',
          direction: 'horizontal',
          items: [
            'ACC_ALL_SONSIL_DAYS',
            'ACC_JIC_SONSIL_DAYS',
            'ACC_HYP_SONSIL_DAYS',
          ],
        },
        {
          name: '금월',
          direction: 'horizontal',
          items: ['ALL_SONSIL_DAYS', 'JIC_SONSIL_DAYS', 'HYP_SONSIL_DAYS'],
        },
      ],
    },
    {
      name: '재해현황',
      direction: 'horizontal',
      items: [
        {
          name: '누적',
          direction: 'horizontal',
          items: ['ACC_ALL_SAGO_CNT', 'ACC_JIC_SAGO_CNT', 'ACC_HYP_SAGO_CNT'],
        },
        {
          name: '금월',
          direction: 'horizontal',
          items: ['ALL_SAGO_CNT', 'JIC_SAGO_CNT', 'HYP_SAGO_CNT'],
        },
      ],
    },
    {
      name: '재해지수',
      direction: 'horizontal',
      items: [
        {
          name: '합계',
          direction: 'horizontal',
          items: ['ALL_BINDO', 'ALL_GANGDO', 'ALL_JISOO', 'ALL_JAEHAE'],
        },
        {
          name: '직영',
          direction: 'horizontal',
          items: ['JIC_BINDO', 'JIC_GANGDO', 'JIC_JISOO', 'JIC_JAEHAE'],
        },
        {
          name: '협력',
          direction: 'horizontal',
          items: ['HYP_BINDO', 'HYP_GANGDO', 'HYP_JISOO', 'HYP_JAEHAE'],
        },
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = (btn) => {
  if (!gubunFlag.value) {
    Message.warn(t('구분을 선택해주세요.'))
    return
  }

  if (btn.id === 'btnSearch' && gubunFlag.value === 'M') {
    if (!monthSearchParam.YEAR || !monthSearchParam.MONTH) {
      Message.warn(t('년월을 입력해주세요.'))
      return
    }

    new queryFlowHelper(vm, t)
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  } else if (btn.id === 'btnSearch' && gubunFlag.value === 'W') {
    if (!weekSearchParam.YEAR) {
      Message.warn(t('년도를 입력해주세요.'))
      return
    } else if (!weekSearchParam.WEEK) {
      Message.warn(t('주차를 입력해주세요.'))
      return
    }

    new queryFlowHelper(vm, t)
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .run()
  } else if (btn.id === 'btnExcel') {
    //엑셀추출
    let title = gubunFlag.value === 'W' ? '(주간현황)' : '(월간현황)'
    let fullTitle =
      gubunFlag.value === 'W'
        ? title + weekSearchParam.YEAR + '년' + weekSearchParam.WEEK + '주차'
        : title + monthSearchParam.YEAR + '년' + monthSearchParam.MONTH + '월'
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: fullTitle,
      progressMessage: '엑셀 다운로드중입니다.',
      showProgress: true,
      indicator: 'visible',
      header: 'visible',
      footer: 'hidden',
      allColumns: true,
    })
  } else {
    closePopup()
  }
}
//월간 조회관련 로직 시작
const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFAD0010_SEARCH04',
    param: monthSearchParam,
  })
}

const afterSearch01 = (res) => {
  workDays.WORK_DAY = '금월 작업일수 : ' + res.ORESULT_CUR[0].WORK_DAYS
  workDays.ACC_WORK_DAY = '총 작업일수 : ' + res.ORESULT_CUR[0].ACC_WORK_DAYS
  let columnName = yearMonth.value.split('-')
  grdMainProps.columnLayout[9].name =
    columnName[0] + '년' + columnName[1] + '월'
  grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setStyleGrid()
  setCellStyleGrid()
}
//월간 조회관련 로직 끝

//주간 조회관련 로직 시작
const searchData02 = () => {
  return commonSearchApi({
    queryId: 'SAFAD0010_SEARCH05',
    param: weekSearchParam,
  })
}

const afterSearch02 = (res) => {
  workDays.WORK_DAY = '금주 작업일수 : ' + res.ORESULT_CUR[0].WORK_DAYS
  workDays.ACC_WORK_DAY = '총 작업일수 : ' + res.ORESULT_CUR[0].ACC_WORK_DAYS
  let columnName = weekSearchParam.YEAR + '년' + weekSearchParam.WEEK + '주차'
  grdMainProps.columnLayout[9].name = columnName
  grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setStyleGrid()
  setCellStyleGrid()
}

//주간 조회관련 로직 끝

const openPopup = () => {
  //열고정 옵션
  setTimeout(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 4,
    })
  }, 100)

  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
  workDays.WORK_DAY = ''
  workDays.ACC_WORK_DAY = ''
}

defineExpose({
  openPopup,
})

onMounted(() => {
  //구분 기본값 주간
  gubunFlag.value = 'W'
  //년월 오늘
  yearMonth.value =
    dayjs().$y + '-' + (dayjs().$M + 1).toString().padStart(2, '0')
  weekSearchParam.YEAR = dayjs().$y
  weekSearchParam.WEEK = getWeek()
  setWeekList()
})

const setWeekList = () => {
  const temp = []
  for (let i = 1; i <= 53; i++) {
    temp.push({ TXT: i + '', COD: i + '' })
  }

  codeList.weekList = temp
}

const getWeek = () => {
  const toDay = new Date()
  const yearStart = new Date(toDay.getFullYear(), 0, 1)
  const diff = toDay - yearStart
  const weekNumber = Math.ceil(diff / (1000 * 60 * 60 * 24) / 7) + ''
  return weekNumber //현재년도의 1월1일을 기준으로 오늘이 몇주차인지 반환
}

//컬럼 가로 병합(총계)
const setStyleGrid = () => {
  grdMain.value.getGridView().layoutByColumn('BSNS_NM').spanCallback =
    function (grid, layout, itemIndex) {
      var value = grid.getValue(itemIndex, 'BSNS_NM')
      if (value == '총계') {
        return 4 //가로 병합 수
      }
      return 1
    }

  grdMain.value.getGridView().layoutByColumn('PART_NM').spanCallback =
    function (grid, layout, itemIndex) {
      var value = grid.getValue(itemIndex, 'PART_NM')
      if (value != null) {
        if (value.includes('소계')) {
          return 3 //가로 병합 수
        } else {
          return 1
        }
      }
    }

  grdMain.value.getGridView().layoutByColumn('DAMD_NM').spanCallback =
    function (grid, layout, itemIndex) {
      var value = grid.getValue(itemIndex, 'DAMD_NM')
      if (value != null) {
        if (value.includes('소계')) {
          return 2 //가로 병합 수
        } else {
          return 1
        }
      }
    }
}
//row스타일 사용
const setCellStyleGrid = () => {
  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    let ret = {}
    let DEPT_NM = grid.getValue(item.index, 'DEPT_NM')
    let DAMD_NM = grid.getValue(item.index, 'DAMD_NM')
    let PART_NM = grid.getValue(item.index, 'PART_NM')
    let ALL_NM = grid.getValue(item.index, 'BSNS_NM')
    // if (DEPT_NM != null && DEPT_NM.includes("소계")) {

    // }

    if (
      (PART_NM != null && PART_NM.includes('소계')) ||
      (DEPT_NM != null && DEPT_NM.includes('소계')) ||
      (DAMD_NM != null && DAMD_NM.includes('소계'))
    ) {
      ret.style = { background: '#E9EC69' }
      return ret
    }
    if (ALL_NM === '총계') {
      ret.style = { background: '#E9EC69' }
      return ret
    }
  })
}

//구분 감지
watch(
  () => gubunFlag.value,
  () => {
    //구분값이 주간이면 금월 -> 금주
    if (gubunFlag.value === 'W') {
      grdMainProps.fields.forEach((e) => {
        if (e.header.text.includes('금월')) {
          e.header.text = '금주'
        }
      })

      grdMainProps.columnLayout[10].items[1].name = '금주'
      grdMainProps.columnLayout[11].items[1].name = '금주'
      grdMainProps.columnLayout[9].name = ''
      grdMainProps.fields[5].header.text = '금주기준\n목표재해율'
      grdMain.value.getDataProvider().setFields(grdMainProps.columns)
      grdMain.value.getGridView().setColumns(grdMainProps.columns)
      grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)
    }
    //구분값이 월간이면 금주 -> 금월
    else {
      grdMainProps.fields.forEach((e) => {
        if (e.header.text.includes('금주')) {
          e.header.text = '금월'
        }
      })

      grdMainProps.columnLayout[10].items[1].name = '금월'
      grdMainProps.columnLayout[11].items[1].name = '금월'
      grdMainProps.columnLayout[9].name = ''
      grdMainProps.fields[5].header.text = '금월기준\n목표재해율'
      grdMainProps.columns = grdMainProps.fields
      grdMain.value.getDataProvider().setFields(grdMainProps.columns)
      grdMain.value.getGridView().setColumns(grdMainProps.columns)
      grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)
    }
  }
)
//주차감지
// watch(
//   () => weekSearchParam.WEEK,
//   (newValue, oldValue) => {
//     if (newValue > 53) {
//       Message.warn("최대 53주차까지 입력 가능합니다.")
//       weekSearchParam.WEEK = ""
//     }
//   }
// )

watch(
  () => yearMonth.value,
  (newValue, oldValue) => {
    monthSearchParam.YEAR = newValue.split('-')[0]
    monthSearchParam.MONTH = newValue.split('-')[1]
  }
)
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    eager
    width="2000"
    height="1500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">주/월간 현황</div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnExcel', 'btnClose']"
          @click-button="onButtonsClick"
        >
        </IGridTitle>
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              :items="codeList.gubun"
              item-title="TXT"
              item-value="COD"
              width="200px"
              v-model="gubunFlag"
              :label="$t('구분')"
              required
            >
            </i-select>
            <i-input
              width="200px"
              :label="$t('년도')"
              type="number"
              :min="2000"
              :max="3000"
              v-model="weekSearchParam.YEAR"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
              v-if="gubunFlag === 'W'"
              required
            ></i-input>
            <!-- <i-input
              v-model="weekSearchParam.WEEK"
              v-if="gubunFlag === 'W'"
              width="200px"
              number
              maxlength="2"
              :label="$t('주차')"
            ></i-input> -->
            <i-select
              :items="codeList.weekList"
              v-model="weekSearchParam.WEEK"
              item-title="TXT"
              item-value="COD"
              v-if="gubunFlag === 'W'"
              width="200px"
              :label="$t('주차')"
              required
            ></i-select>
            <i-input
              v-model="yearMonth"
              type="month"
              v-if="gubunFlag === 'M'"
              width="200px"
              :label="$t('년월')"
              required
            >
            </i-input>
          </v-sheet>
          <div class="d-flex">
            <span class="ml-3" style="font-size: 20px; font-weight: bold">{{
              workDays.WORK_DAY
            }}</span>
            <span class="ml-3" style="font-size: 20px; font-weight: bold">{{
              workDays.ACC_WORK_DAY
            }}</span>
          </div>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped></style>
