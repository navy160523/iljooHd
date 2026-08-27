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
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { create_UUID } from '@/utils/common.js'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { tryOnBeforeUnmount } from '@vueuse/core'

defineOptions({
  name: '30_safety-SAF_C-SAFCE0030Popup',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const dialog = ref(false)
const isReadOnly = ref(false) //등록,수정일때 readonly 여부 플래그값 등록일때는 점검일자,점검장소 활성화 수정일때는 비활성화
const userStore = useUserStore()
const workLocationPopup = ref(null)
const popupTitle = ref('점검결과 등록')
const emit = defineEmits(['closed'])
const deptPopup = ref(null)
const fileUploadPopup = ref(null)

//조회조건 년도,주차
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '', //년도
  WEEK: '', //주차
})

//조회조건이랑 같이 있지만 실제로는 조회조건이 아닌것들
//주차기간,점검일자,사업부,부서,점검자,점검장소
const searchField = reactive({
  WEEK_RANGE_FROM: '', //주차기간 FROM
  WEEK_RANGE_TO: '', //주차기간 TO
  CHK_DT: '', //점검일자
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  CHK_EMP_NM: '', //점검자
  CHK_EMP_NO: '', //점검자 사번
  HND_PHN: '', // 점검자 휴대폰
  CHK_LOCATION: '', //점검장소
  CHK_LOC_L: '', //장소 대분류
  CHK_LOC_M: '', //장소 중분류
  CHK_LOC_S: '', //장소 소분류
  CHK_LOC_DTL: '', //상세 장소
  TARGET_BSNS_CD: '', //대상 사업부
  TARGET_DEPT_CD: '', //대상 부서
  TARGET_ASGN_CD: '', //대상 조직
  TARGET_ASGN_NM: '', //대상 조직명
})

const codeList = reactive({
  bsnsCd: [], //사업부
  deptCd: [], //부서
})

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
    }), // 부서
    //부서조회
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.deptCd = res[1].ORESULT_CUR
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: 'CLSS_TITLE',
      dataType: 'text',
      editable: false,
      header: { text: t('점검대상') },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'CHK_TITLE',
      dataType: 'text',
      width: '150',
      editable: false,
      styleName: 'left-column',
      header: { text: t('점검항목') },
    },
    {
      fieldName: 'DESCR',
      dataType: 'text',
      styleName: 'left-column editable_column',
      header: { text: t('부적합내용') },
    },
    {
      fieldName: 'FILE_ATTACH',
      dataType: 'text',
      width: 60,
      editable: false,
      header: { text: t('사진첨부') },
      isFile: { value: true, isUpload: true },
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('비고') },
    },
    {
      fieldName: 'CHK_CNT',
      dataType: 'number',
      numberFormat: '#,###',
      styleName: 'editable_column-right',
      width: 60,
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      header: { text: t('점검건수') },
    },
    {
      fieldName: 'OK_CNT',
      dataType: 'text',
      styleName: 'right-column',
      editable: false,
      visible: false, //2024.04.04 김현재작성 추후 true로 변경 가능할수도 있음
      width: '50',
      header: { text: t('양호건수') },
    },
    {
      fieldName: 'BAD_CNT',
      dataType: 'number',
      numberFormat: '#,###',
      width: 60,
      styleName: 'editable_column-right',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      header: { text: t('부적합건수') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'WEEK',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CLSS_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'FIX_FILE_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
  ],
  columnLayout: [
    'CLSS_TITLE',
    'CHK_TITLE',
    {
      name: '점검결과',
      direction: 'horizontal',
      items: ['CHK_CNT', 'OK_CNT', 'BAD_CNT', 'FILE_ATTACH', 'DESCR'],
    },
    'REMARKS',
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
})
//등록버튼을 눌렀을때 실행
const openPopup = () => {
  let date = dayjs()
  searchParam.CMPNY_DIV = userStore.cmpnyDiv
  searchField.BSNS_CD = userStore.bsnsCd //사업부
  searchField.DEPT_CD = userStore.deptCd //부서
  searchField.CHK_EMP_NM = userStore.empNm //이름
  searchField.CHK_EMP_NO = userStore.empNo //사번
  searchField.HND_PHN = userStore.hndPhn // 휴대폰
  searchField.CHK_DT =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
  grdMainProps.gridViewOption.checkBar.visible = false
  dialog.value = true
}

//점검현황의 행을 더블클릭 했을때 실행
const openPopup2 = (clickRowData) => {
  dialog.value = true
  setTimeout(() => {
    //불러오기 버튼 비활성화
    menuTitle.value.disableBtn('btnSearch', true)
  }, 100)
  searchField.CHK_DT = clickRowData.CHK_DT_NM
  searchField.BSNS_CD = clickRowData.BSNS_CD
  searchField.DEPT_CD = clickRowData.DEPT_CD
  searchField.TARGET_BSNS_CD = clickRowData.TARGET_BSNS_CD
  searchField.TARGET_DEPT_CD = clickRowData.TARGET_DEPT_CD
  searchField.TARGET_ASGN_CD = clickRowData.TARGET_ASGN_CD
  searchField.TARGET_ASGN_NM = clickRowData.TARGET_ASGN_NM
  searchField.CHK_EMP_NM = clickRowData.CHK_EMP_NM
  searchField.CHK_EMP_NO = clickRowData.CHK_EMP
  searchField.CHK_LOC_L = clickRowData.CHK_LOC_L
  searchField.CHK_LOC_M = clickRowData.CHK_LOC_M
  searchField.CHK_LOC_S = clickRowData.CHK_LOC_S
  searchField.CHK_LOC_DTL = clickRowData.CHK_LOC_DTL
  searchField.CHK_LOCATION = clickRowData.CHK_LOC_NM
  searchField.HND_PHN = userStore.hndPhn
  popupTitle.value = '점검결과 수정'
  isReadOnly.value = true
  grdMainProps.gridViewOption.checkBar.visible = false
  searchChkDetail(clickRowData)
}

const searchChkDetail = (clickRowData) => {
  //점검상세 조회 파라미터
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: clickRowData.YEAR,
    WEEK: clickRowData.WEEK,
    CHK_DT: clickRowData.CHK_DT,
    CHK_LOC_L: clickRowData.CHK_LOC_L,
    CHK_LOC_M: clickRowData.CHK_LOC_M,
    CHK_LOC_S: clickRowData.CHK_LOC_S,
    BSNS_CD: clickRowData.BSNS_CD,
    DEPT_CD: clickRowData.DEPT_CD,
    CHK_EMP: clickRowData.CHK_EMP,
    TARGET_BSNS_CD: clickRowData.TARGET_BSNS_CD,
    TARGET_DEPT_CD: clickRowData.TARGET_DEPT_CD,
    TARGET_ASGN_CD: clickRowData.TARGET_ASGN_CD,
  }

  // console.log('param', param)

  commonSearchApi({
    queryId: 'SAFCE0030_SEARCH02',
    param: param,
  }).then((res) => {
    // console.log('res.ORESULT_CUR', res.ORESULT_CUR)
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const closePopup = () => {
  dialog.value = false
  isReadOnly.value = false
  menuTitle.value.disableBtn('btnSearch', false) //조회 버튼 활성화
  popupTitle.value = '점검결과 등록' //팝업제목 수정
  //상단 컴포넌트 초기화
  for (let i in searchParam) {
    searchParam[i] = ''
  }

  for (let i in searchField) {
    searchField[i] = ''
  }

  //그리드 초기화
  grdMainProps.gridViewOption.checkBar.visible = false
  grdMain.value.getDataProvider().setRows(null)
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnUpdate') {
    if (isReadOnly.value === false) {
      //등록일때
      new saveFlowHelper(vm, t)
        .setGridList([grdMain])
        .setBefore(beforeSave)
        .setQuery(saveData)
        .setAfter(afterSave)
        .run()
    } else {
      //수정일때
      new saveFlowHelper(vm, t)
        .setGridList([grdMain])
        .setBefore(beforeSave02)
        .setQuery(saveData02)
        .setConfirmMessage('수정 하시겠습니까?')
        .setAfter(afterSave02)
        .run()
    }
  } else {
    closePopup()
  }
}

defineExpose({
  openPopup,
  openPopup2,
})

//불러오기 관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFCE0030_SEARCH03',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  const data = res.ORESULT_CUR

  for (let i = 0; i < data.length; i++) {
    data[i].FILE_ID = create_UUID()
    data[i].FIX_FILE_ID = create_UUID()
  }

  // console.log('data', data)

  grdMain.value.getDataProvider().setRows(data)
}
//불러오기 관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  let saveData = grdMain.value.getDataProvider().getJsonRows(0, -1) //조회된 모든 데이터 json으로 가져오기
  // console.log('saveData', saveData)

  if (saveData.length === 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  if (!searchField.CHK_LOCATION) {
    Message.warn(t('점검장소를 선택해주세요.'))
    return false
  }
  if (!searchField.TARGET_ASGN_NM) {
    Message.warn(t('점검대상부서를 선택해주세요.'))
    return false
  }

  // for (let i = 0; i < saveData.length; i++) {
  //   if (
  //     saveData[i].CHK_CNT === null ||
  //     saveData[i].CHK_CNT === undefined ||
  //     saveData[i].CHK_CNT <= 0
  //   ) {
  //     Message.warn(t('점검건수를 입력해주세요.'))
  //     return false
  //   }
  // }

  return true
}

const saveData = () => {
  let saveParam = []
  let grdData = grdMain.value.getDataProvider().getJsonRows(0, -1) //조회된 모든 데이터 json으로 가져오기

  for (let i = 0; i < grdData.length; i++) {
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv, //회사구분
      YEAR: grdData[i].YEAR, //연도
      WEEK: grdData[i].WEEK, //주차
      CHK_DT: searchField.CHK_DT, //점검일자
      CHK_LOC_L: searchField.CHK_LOC_L, //장소 대분류
      CHK_LOC_M: searchField.CHK_LOC_M, //장소 중분류
      CHK_LOC_S: searchField.CHK_LOC_S, //장소 소분류
      CHK_LOC_DTL: searchField.CHK_LOC_DTL, //상세장소
      BSNS_CD: searchField.BSNS_CD, //사업부
      DEPT_CD: searchField.DEPT_CD, //부서
      CHK_EMP: searchField.CHK_EMP_NO, //점검자사번
      TARGET_BSNS_CD: searchField.TARGET_BSNS_CD, //대상사업부
      TARGET_DEPT_CD: searchField.TARGET_DEPT_CD, //대상부서
      TARGET_ASGN_CD: searchField.TARGET_ASGN_CD, //대상조직
      TARGET_ASGN_NM: searchField.TARGET_ASGN_NM, //대상조직명
      DESCR: grdData[i].DESCR, //내용
      CLSS_SEQ: grdData[i].CLSS_SEQ, //점검대상 시퀀스
      CHK_SEQ: grdData[i].CHK_SEQ, //점검항목 시퀀스
      CHK_CNT: grdData[i].CHK_CNT, //점검건수
      BAD_CNT: grdData[i].BAD_CNT, //부적합건수
      USER_ID: userStore.userId, //유저아이디
      FILE_ID: grdData[i].FILE_ID, //파일첨부키
      FIX_FILE_ID: grdData[i].FIX_FILE_ID, //조치파일첨부키
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'SAFCE0030_SAVE01',
    list: saveParam,
  })
}

const afterSave = () => {
  closePopup()
  emit('closed')
}
//저장관련 로직 끝

//수정관련 로직 시작
const beforeSave02 = () => {
  let saveData = grdMain.value.getGridView().getCheckedRows(true)
  if (saveData.length === 0) {
    Message.warn(t('수정할 데이터를 선택해주세요/'))
    return false
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  let grdData = grdMain.value.getDataProvider().getJsonRows(0, -1)
  // let grdData = grdMain.value.getGridView().getCheckedRows(true) //조회된 모든 데이터 json으로 가져오기
  for (let i = 0; i < grdData.length; i++) {
    // let data = grdMain.value.getDataProvider().getJsonRow(grdData[i])
    let data = grdData[i]
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv, //회사구분
      YEAR: data.YEAR, //연도
      WEEK: data.WEEK, //주차
      CHK_DT: searchField.CHK_DT, //점검일자
      CHK_LOC_L: searchField.CHK_LOC_L, //장소 대분류
      CHK_LOC_M: searchField.CHK_LOC_M, //장소 중분류
      CHK_LOC_S: searchField.CHK_LOC_S, //장소 소분류
      CHK_LOC_DTL: searchField.CHK_LOC_DTL, //상세장소
      BSNS_CD: searchField.BSNS_CD, //사업부
      DEPT_CD: searchField.DEPT_CD, //부서
      CHK_EMP: searchField.CHK_EMP_NO, //점검자사번
      TARGET_BSNS_CD: searchField.TARGET_BSNS_CD, //대상사업부
      TARGET_DEPT_CD: searchField.TARGET_DEPT_CD, //대상부서
      TARGET_ASGN_CD: searchField.TARGET_ASGN_CD, //대상조직
      CLSS_SEQ: data.CLSS_SEQ, //점검대상 시퀀스
      CHK_SEQ: data.CHK_SEQ, //점검항목 시퀀스
      CHK_CNT: data.CHK_CNT, //점검건수
      BAD_CNT: data.BAD_CNT, //부적합건수
      DESCR: data.DESCR, //내용
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam.push(saveData)
  }

  // console.log('saveParam', saveParam)

  return commonExecuteApi({
    queryId: 'SAFCE0030_SAVE04',
    list: saveParam,
  })
}

const afterSave02 = () => {
  closePopup()
  emit('closed')
}
//수정관련 로직 끝

onMounted(() => {
  defaultDate()
})

//디폴트 날짜 설정 점검일자 : 오늘날짜 년도 : 올해
const defaultDate = () => {
  //디폴트 날짜 설정
  let date = dayjs()
  //searchParam.YEAR = date.get("year")
  searchField.CHK_DT =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

watch(
  () => searchField.CHK_DT,
  (newValue, oldValue) => {
    if (!newValue) {
      return false
    }
    let baseYear = newValue.substr(0, 4) //기준년도 구하기
    let inputDate = dayjs(newValue) //입력한 날짜 기준으로 dayjs객체 생성
    let endFlag = 6 - inputDate.get('d') //입력한 날짜 주차의 토요일을 구하기 위한 변수
    let weekStart = inputDate.subtract(inputDate.get('d'), 'day') //주차의 시작 일 구하기
    let weekEnd = inputDate.add(endFlag, 'day') //주차의 시작일부터 토요일까지 구하기
    if (weekStart.$y !== weekEnd.$y) {
      //주차의 시작년도와 끝년도가 다를때
      if (baseYear > weekStart.$y) {
        //연초를 입력했을때
        weekStart = dayjs(`${weekEnd.$y}-01-01`)
      } else {
        //연말을 입력했을때
        weekEnd = dayjs(`${weekStart.$y}-12-31`)
      }
    }
    searchParam.YEAR = inputDate.$y //년도
    searchParam.WEEK = getWeek(newValue)
    searchField.WEEK_RANGE_FROM =
      weekStart.$y +
      '-' +
      (weekStart.$M + 1).toString().padStart(2, '0') +
      '-' +
      weekStart.$D.toString().padStart(2, '0') //주차기간 From
    searchField.WEEK_RANGE_TO =
      weekEnd.$y +
      '-' +
      (weekEnd.$M + 1).toString().padStart(2, '0') +
      '-' +
      weekEnd.$D.toString().padStart(2, '0') //주차기간 TO
  }
)

//입력한 날짜의 주차가져오는 함수
const getWeek = (inputDate) => {
  const toDay = new Date(inputDate)
  const yearStart = new Date(toDay.getFullYear(), 0, 1)
  const diff = toDay - yearStart
  const weekNumber = Math.ceil(diff / (1000 * 60 * 60 * 24) / 7)
  return weekNumber //현재년도의 1월1일을 기준으로 오늘이 몇주차인지 반환
}

//점검장소 팝업 오픈 이벤트
const openLocationPopup = () => {
  workLocationPopup.value.openPopup()
}

//점검장소 팝업 선택 이벤트
const selectedLcation = (val) => {
  searchField.CHK_LOCATION = val[2].TXT
  searchField.CHK_LOC_L = val[0].COD //장소 대분류
  searchField.CHK_LOC_M = val[1].COD //장소 중분류
  searchField.CHK_LOC_S = val[2].COD //장소 소분류
}

const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
  })
}

const onDeptSelected = (val) => {
  console.log('val', val)
  searchField.TARGET_BSNS_CD = val.BSNS_CD
  searchField.TARGET_DEPT_CD = val.DEPT_CD
  searchField.TARGET_ASGN_CD = val.ASGN_CD
  searchField.TARGET_ASGN_NM = val.ASGN_FULL_NM
}

//셀변경 이벤트
const onCellEdited = (grid, itemIndex, row, field) => {
  let data = grdMain.value.getDataProvider().getJsonRow(row)
  if (data.BAD_CNT > data.CHK_CNT) {
    //부적합건수가 점검건수보다 크면 부적합건수값 0으로 넣음
    Message.warn(t('부적합건수는 점검건수보다 큰 값을 입력할 수 없습니다.'))
    grdMain.value.getDataProvider().setValue(row, 'BAD_CNT', 0)
    return false
  }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === 'data') {
    // console.log('clickData', clickData)
    // console.log('data', grdMain.value.getDataProvider().getJsonRow(clickData.dataRow))

    if (clickData.fieldName === 'FILE_ATTACH') {
      const currRow = grdMain.value
        .getDataProvider()
        .getJsonRow(clickData.dataRow)
      fileUploadPopup.value.openPopup(currRow.FILE_ID)
    }
  }
}

const uploaded = (param) => {
  // console.log('uploaded param', param)

  if (param.STATUS === 'update') {
    grdMain.value
      .getGridView()
      .setValue(
        grdMain.value.getGridView().getCurrent().itemIndex,
        'FILE_ATTACH',
        'Y'
      )
  } else {
    if (param.rowCnt < 1) {
      grdMain.value
        .getGridView()
        .setValue(
          grdMain.value.getGridView().getCurrent().itemIndex,
          'FILE_ATTACH',
          ''
        )
    }
  }
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ popupTitle }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex flex-column">
            <div class="d-flex">
              <i-input
                v-model="searchParam.YEAR"
                :label="$t('년도')"
                width="160px"
                number
                readonly
                top-label
              >
              </i-input>
              <i-input
                v-model="searchParam.WEEK"
                :label="$t('주차')"
                width="160px"
                number
                readonly
                top-label
              >
              </i-input>
              <i-input
                v-model="searchField.WEEK_RANGE_FROM"
                :label="$t('기간')"
                width="160px"
                type="date"
                margin="0"
                readonly
                top-label
              >
              </i-input>
              <div
                class="mt-5 d-flex justify-center align-center"
                style="width: 20px"
              >
                ~
              </div>
              <i-input
                class="mt-5"
                v-model="searchField.WEEK_RANGE_TO"
                width="160px"
                type="date"
                readonly
              >
              </i-input>
              <i-input
                required
                v-model="searchField.CHK_DT"
                :readonly="isReadOnly"
                :label="$t('점검일자')"
                width="160px"
                type="date"
                top-label
              >
              </i-input>
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="searchField.BSNS_CD"
                :items="codeList.bsnsCd"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                :label="$t('사업부')"
                width="160px"
                readonly
                top-label
              >
              </i-select>
              <i-select
                v-model="searchField.DEPT_CD"
                :items="codeList.deptCd"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                :label="$t('부서')"
                width="160px"
                readonly
                top-label
              >
              </i-select>
              <i-input
                v-model="searchField.CHK_EMP_NM"
                :label="$t('점검자')"
                width="160px"
                readonly
                top-label
              ></i-input>
              <i-input
                class="mt-5"
                v-model="searchField.CHK_EMP_NO"
                width="160px"
                readonly
              ></i-input>
              <i-input
                v-model="searchField.HND_PHN"
                :label="$t('연락처')"
                width="160px"
                readonly
                top-label
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                required
                readonly
                :disabled="isReadOnly"
                v-model="searchField.CHK_LOCATION"
                :label="$t('점검장소')"
                width="160px"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openLocationPopup()"
                @keydown.enter="
                  (e) => {
                    openLocationPopup()
                  }
                "
                top-label
              ></i-input>
              <i-input
                v-model="searchField.CHK_LOC_DTL"
                :label="$t('상세장소')"
                width="160px"
                top-label
              ></i-input>
              <i-input
                required
                readonly
                :disabled="isReadOnly"
                v-model="searchField.TARGET_ASGN_NM"
                :label="$t('점검대상부서')"
                width="240px"
                margin="5px"
                append-inner-icon="mdi-magnify"
                @keydown.enter="
                  (e) => {
                    openDeptPopup()
                  }
                "
                @click:appendInner="openDeptPopup()"
                top-label
              ></i-input>
              <i-input
                class="mt-5"
                v-model="searchField.TARGET_ASGN_CD"
                width="95px"
                readonly
              ></i-input>
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellEdited="onCellEdited"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
        <!-- <div class="d-flex flex-column fill-height">
          <v-sheet class="d-flex mb-0">
            <i-input v-model="searchParam.YEAR" :label="$t('년도')" width="160px" number readonly top-label> </i-input>
            <i-input v-model="searchParam.WEEK" :label="$t('주차')" width="160px" number readonly top-label> </i-input>
            <i-input
              v-model="searchField.WEEK_RANGE_FROM"
              :label="$t('기간')"
              width="160px"
              type="date"
              readonly
              top-label
            >
            </i-input>
            <i-input class="mt-5" v-model="searchField.WEEK_RANGE_TO" width="160px" type="date" readonly> </i-input>
            <i-input
              required
              v-model="searchField.CHK_DT"
              :readonly="isReadOnly"
              :label="$t('점검일자')"
              width="160px"
              type="date"
              top-label
            >
            </i-input>
          </v-sheet>
          <v-sheet class="d-flex">
            <i-select
              v-model="searchField.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :label="$t('사업부')"
              width="160px"
              readonly
              top-label
            >
            </i-select>
            <i-select
              v-model="searchField.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :label="$t('부서')"
              width="160px"
              readonly
              top-label
            >
            </i-select>
            <i-input v-model="searchField.CHK_EMP_NM" :label="$t('점검자')" width="160px" readonly top-label></i-input>
            <i-input class="mt-5" v-model="searchField.CHK_EMP_NO" width="160px" readonly></i-input>
            <i-input
              required
              :disabled="isReadOnly"
              v-model="searchField.CHK_LOCATION"
              :label="$t('점검장소')"
              width="160px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openLocationPopup()"
              @keydown.enter="
                (e) => {
                  openLocationPopup()
                }
              "
              top-label
            ></i-input>
          </v-sheet>
          <v-sheet height="80%">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellEdited="onCellEdited"
            />
          </v-sheet>
        </div> -->
      </v-card-text>
    </v-card>
  </v-dialog>
  <LocationPopup
    ref="workLocationPopup"
    @selectedArr="selectedLcation"
  ></LocationPopup>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  <IUploadPopup
    ref="fileUploadPopup"
    @uploaded="uploaded"
    :buttonList="['btnDownLoad', 'btnDelete', 'btnClose']"
    img-only
  />
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
