<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useCommonStore } from '@hiway/stores/common'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCE0030Popup from './SAFCE0030Popup.vue'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
// import SendMailPopup from "@/components/popup/SendMailPopup.vue";
import EmpPopup from '@/components/popup/EmpPopup.vue'
import OZReport from '@/components/OZReport.vue'
import { commonDeleteAllFilesApi } from '@hiway/api/commonFileApi'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import IUploadPopup2 from '@/components/popup/IUploadPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
defineOptions({
  name: '30_safety-SAF_C-SAFCE0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const router = useRouter()
const commonStore = useCommonStore()

// OzReport 팝업 여부
const showOz = ref(false)

const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const userStore = useUserStore()
const sAFCE0030Popup = ref(null)
const isReadOnly = ref(false)
// const sendMailPopup = ref(null);
const empPopup = ref(null)
const reportParam = reactive(['IN_KEY=', 'IN_YEAR'])
const reportName = ref('/manage/hse/SAFCE0030.ozr')
const fileUpload = ref(null)
const fixFileUpload = ref(null)
const deptPopup = ref(null)
const searchParam01 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().$y + '', //년도
  WEEK_FROM: 1, //주차FROM
  WEEK_TO: '', //주차TO
  BSNS_CD: '', //userStore.bsnsCd, //점검자사업부
  DEPT_CD: '', //userStore.deptCd, //점검사부서
  ASGN_CD: '', //userStore.asgnCd,
  ASGN_NM: '전체', //userStore.asgnFullNm,
  FIX_YN: 'Y', //미조치
})

const searchParam02 = reactive({
  CMPNY_DIV: '', //사업장구분
  YEAR: '', //년도
  WEEK: '', //주차
  CHK_DT: '', //점검일자
  CHK_LOC_L: '', //장소대분류
  CHK_LOC_M: '', //장소중분류
  CHK_LOC_S: '', //장소소분류
  CHK_EMP: '', //점검자
})

const codeList = reactive({
  bsnsCd: [], //사업부
  deptCd: [], //대상부서
})

const initCodeList = async () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
    }), // 부서
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })

  if (window.history.state.data) {
    let data = await window.history.state.data

    for (let i in data) {
      searchParam01[i] = data[i]
    }

    commonStore.loading = false
    onButtonsClick({ id: 'btnSearch' })
  }
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },

  fields: [
    {
      fieldName: 'CHK_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('점검번호') },
      width: 65,
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      editable: false,
      header: { text: t('년도') },
      width: 65,
    },
    {
      fieldName: 'WEEK_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('주차') },
      width: 65,
    },
    {
      fieldName: 'WEEK_RANGE',
      dataType: 'text',
      editable: false,
      header: { text: t('기간') },
      width: 180,
    },
    {
      fieldName: 'CHK_DT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검일자') },
      width: 100,
    },
    {
      fieldName: 'CHK_LOC_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검장소') },
    },
    {
      fieldName: 'CHK_LOC_DTL',
      dataType: 'text',
      editable: false,
      header: { text: t('상세장소') },
      width: 150,
    },
    {
      fieldName: 'TARGET_BSNS_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'TARGET_DEPT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('부서') },
      width: 150,
    },
    {
      fieldName: 'CHK_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검자') },
      width: 80,
    },
    {
      fieldName: 'CHK_CNT',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('점검건수') },
      width: 60,
    },
    {
      fieldName: 'OK_CNT',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('양호건수') },
    },
    {
      fieldName: 'BAD_CNT',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('부적합건수') },
      width: 70,
    },
    {
      fieldName: 'FIX_CNT',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('조치') },
      width: 70,
    },
    {
      fieldName: 'FIX_N_CNT',
      dataType: 'number',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('미조치') },
      width: 70,
    },
    {
      fieldName: 'MAIL_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('메일\n전송여부'), styleName: 'multiline-editor' },
      width: 70,
      visible: false,
    },
    {
      fieldName: 'MAIL_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('메일수신자') },
    },
    {
      fieldName: 'CHK_DT',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_LOC_L',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_LOC_M',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_LOC_S',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_ASGN_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'MAIL_EMP',
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
      fieldName: 'CHK_EMP',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'FILE_IDS',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'FIX_FILE_IDS',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
  ],
  columns: [],
  columnLayout: [
    'CHK_NO',
    'YEAR',
    'WEEK_NM',
    'WEEK_RANGE',
    'CHK_DT_NM',
    'CHK_LOC_NM',
    'CHK_LOC_DTL',
    {
      name: '점검대상부서',
      direction: 'horizontal',
      items: ['TARGET_BSNS_NM', 'TARGET_DEPT_NM'],
    },
    'CHK_EMP_NM',
    {
      name: '점검결과',
      direction: 'horizontal',
      items: ['CHK_CNT', 'BAD_CNT'],
    },
    {
      name: '조치결과',
      direction: 'horizontal',
      items: ['FIX_CNT', 'FIX_N_CNT'],
    },
    'MAIL_YN',
  ],
})

const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CLSS_TITLE',
      dataType: 'text',
      editable: false,
      header: { text: t('점검대상') },
      width: '80',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'CHK_TITLE',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '150',
      header: { text: t('점검항목') },
    },
    {
      fieldName: 'CHK_CNT',
      dataType: 'number',
      numberFormat: '#,###',
      editable: false,
      styleName: 'right-column',
      width: '60',
      header: { text: t('점검건수') },
    },
    {
      fieldName: 'OK_CNT',
      dataType: 'number',
      numberFormat: '#,###',
      editable: false,
      styleName: 'right-column',
      width: '50',
      header: { text: t('양호건수') },
    },
    {
      fieldName: 'BAD_CNT',
      dataType: 'number',
      numberFormat: '#,###',
      editable: false,
      styleName: 'right-column',
      width: '60',
      header: { text: t('부적합건수') },
    },
    {
      fieldName: 'FIX_DT',
      dataType: 'text',
      styleName: 'editable_column',
      editButtonVisibility: 'always',
      width: '100',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('조치일자') },
    },
    {
      fieldName: 'FIX_GBN',
      dataType: 'text',
      editable: false,
      width: '60',
      header: { text: t('조치구분') },
    },
    {
      fieldName: 'FIX_CNT',
      dataType: 'number',
      numberFormat: '#,###',
      width: '60',
      styleName: 'editable_column-right',
      header: { text: t('조치건수') },
    },
    {
      fieldName: 'FIX_N_CNT',
      dataType: 'number',
      editable: false,
      styleName: 'right-column',
      numberFormat: '#,###',
      width: '60',
      header: { text: t('미조치건수') },
    },
    {
      fieldName: 'FIX_DESC',
      dataType: 'text',
      width: '150',
      styleName: 'editable_column-left',
      header: { text: t('조치내용') },
    },
    {
      fieldName: 'FIX_N_DESC',
      dataType: 'text',
      width: '150',
      styleName: 'editable_column-left',
      header: { text: t('미조치건 개선계획') },
    },
    {
      fieldName: 'FILE_ATTACH',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('사진') },
      isFile: { value: true },
    },
    {
      fieldName: 'FIX_FILE_ATTACH',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('파일첨부') },
      isFile: { value: true, isUpload: true },
    },
    {
      fieldName: 'DESCR',
      dataType: 'text',
      width: '150',
      editable: false,
      styleName: 'left-column',
      header: { text: t('부적합내용') },
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
      fieldName: 'CHK_LOC_L',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_LOC_M',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_LOC_S',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_EMP',
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
      fieldName: 'CHK_DT',
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
      fieldName: 'BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_ASGN_CD',
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
  columns: [],
  columnLayout: [
    'CLSS_TITLE',
    'CHK_TITLE',
    {
      name: '점검상세',
      direction: 'horizontal',
      items: ['CHK_CNT', 'BAD_CNT', 'FILE_ATTACH', 'DESCR'],
    },
    {
      name: '조치상세',
      direction: 'horizontal',
      items: [
        'FIX_CNT',
        'FIX_DESC',
        'FIX_FILE_ATTACH',
        'FIX_DT',
        'FIX_GBN',
        'FIX_N_CNT',
        'FIX_N_DESC',
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

onMounted(() => {
  initCodeList()
  // checkProductionDept();
  searchParam01.WEEK_TO = getWeek()
  onButtonsClick({ id: 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  } else if (btn.id === 'btnRegist') {
    openRegistPopup()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnPrint') {
    print()
  } else {
    sendMail()
  }
}

const onButtonsClick2 = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .run()
  }
}
//오늘의 주차 가져오기
const getWeek = () => {
  const toDay = new Date()
  const yearStart = new Date(toDay.getFullYear(), 0, 1)
  const diff = toDay - yearStart
  const weekNumber = Math.ceil(diff / (1000 * 60 * 60 * 24) / 7)
  return weekNumber //현재년도의 1월1일을 기준으로 오늘이 몇주차인지 반환
}

//조회 관련 로직 시작
const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0030_SEARCH01',
    param: searchParam01,
  })
}

const afterSearch01 = (res) => {
  if (res.ORESULT_CUR.length === 0) {
    grdSub.value.getDataProvider().setRows(null)
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCurrentRowChanged = (grid, oldIndex, newIndex) => {
  if (newIndex === -1) {
    //처음에 데이터가 있다가 다른 조회조건으로 조회했을때 데이터가 없으면 rowIndex에러가 나서 조건추가
    return false
  }
  let data = grdMain.value.getDataProvider().getJsonRow(newIndex)
  searchParam02.CMPNY_DIV = userStore.cmpnyDiv
  searchParam02.YEAR = data.YEAR
  searchParam02.WEEK = data.WEEK
  searchParam02.CHK_DT = data.CHK_DT
  searchParam02.CHK_LOC_L = data.CHK_LOC_L
  searchParam02.CHK_LOC_M = data.CHK_LOC_M
  searchParam02.CHK_LOC_S = data.CHK_LOC_S
  searchParam02.CHK_EMP = data.CHK_EMP
  searchParam02.BSNS_CD = data.BSNS_CD
  searchParam02.DEPT_CD = data.DEPT_CD
  searchParam02.TARGET_BSNS_CD = data.TARGET_BSNS_CD
  searchParam02.TARGET_DEPT_CD = data.TARGET_DEPT_CD
  searchParam02.TARGET_ASGN_CD = data.TARGET_ASGN_CD
  new queryFlowHelper(vm, t)
    .setQuery(searchData02)
    .setAfter(afterSearch02)
    .run()
}

const searchData02 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0030_SEARCH02',
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  setGridStyle()
}
//조회관련 로직 끝

//등록관련 로직 시작
const openRegistPopup = () => {
  sAFCE0030Popup.value.openPopup()
}
//등록관련 로직 끝

//점검현황 행 더블클릭 이벤트 관련 로직 시작
const onCellDblClicked = (grid, clickData) => {
  // console.log('onCellDblClicked clickData', clickData)

  if (clickData.cellType === 'data') {
    let clickRowData = grdMain.value
      .getDataProvider()
      .getJsonRow(clickData.dataRow)
    if (
      userStore.empNo != clickRowData.CHK_EMP ||
      userStore.empNm != clickRowData.CHK_EMP_NM
    ) {
      Message.warn(t('점검자가 아니면 수정할 수 없습니다.'))
      return false
    }
    sAFCE0030Popup.value.openPopup2(clickRowData)
  }
}

//점검현황 행 더블클릭 이벤트 관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    if (userStore.empNo != data.CHK_EMP || userStore.empNm != data.CHK_EMP_NM) {
      Message.warn(t('점검자가 아니면 삭제할 수 없습니다.'))
      return false
    }
  }

  if (chkNum.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = async () => {
  let deleteParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let deleteData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: data.YEAR,
      WEEK: data.WEEK,
      CHK_DT: data.CHK_DT,
      CHK_LOC_L: data.CHK_LOC_L,
      CHK_LOC_M: data.CHK_LOC_M,
      CHK_LOC_S: data.CHK_LOC_S,
      CHK_EMP: data.CHK_EMP,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      TARGET_BSNS_CD: data.TARGET_BSNS_CD,
      TARGET_DEPT_CD: data.TARGET_DEPT_CD,
      TARGET_ASGN_CD: data.TARGET_ASGN_CD,
      FILE_IDS: data.FILE_IDS,
      FIX_FILE_IDS: data.FIX_FILE_IDS,
    }
    deleteParam.push(deleteData)
  }

  const delFiles = []
  for (let i = 0; i < deleteParam.length; i++) {
    const files = deleteParam[i].FILE_IDS.split(',')
    const fixFiles = deleteParam[i].FIX_FILE_IDS.split(',')

    for (let j = 0; j < files.length; j++) {
      delFiles.push({
        CMPNY_DIV: userStore.cmpnyDiv,
        FILE_ID: files[j],
      })
    }

    for (let j = 0; j < fixFiles.length; j++) {
      delFiles.push({
        CMPNY_DIV: userStore.cmpnyDiv,
        FILE_ID: fixFiles[j],
      })
    }
  }

  await commonDeleteAllFilesApi(delFiles)

  return commonExecuteApi({
    queryId: 'SAFCE0030_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//출력관련 로직 시작
const print = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('출력할 데이터를 선택해주세요.'))
    return false
  }
  reportParam[0] = 'IN_KEY='
  reportParam[1] = 'IN_YEAR='
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    reportParam[0] +=
      data.CMPNY_DIV +
      data.YEAR +
      data.WEEK +
      data.CHK_DT +
      data.CHK_LOC_L +
      data.CHK_LOC_M +
      data.CHK_LOC_S +
      data.CHK_EMP +
      ','
  }
  //마지막 , 제거
  reportParam[0] = reportParam[0].substring(0, reportParam[0].length - 1) + ''
  reportParam[1] = 'IN_YEAR=' + searchParam01.YEAR
  showOz.value = true
}
//출력관련 로직 끝

//메일발송관련 로직 시작
const sendMail = async () => {
  // sendMailPopup.value.openPopup({ TO_EMP_NO: "" });

  let result = await vm.$swal({
    title: t('메일발송 하시겠습니까? '),
    showCancelButton: true,
  })
  if (!result.isConfirmed) {
    return
  }
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    Message.warn(t('점검현황에서 메일발송 대상을 체크 해주세요.'))
    return
  }

  for (let i = 0; i < checkedRows.length; i++) {
    const currRow = grdMain.value.getDataProvider().getJsonRow(checkedRows[i])
    // console.log('currRow', currRow)

    let content = ''
    content +=
      '중대성사고 재발방지대책 이행점검 시 아래의 부적합사항이 확인되었습니다.<br>'
    content +=
      '아래 경로로 접속하시어 조치 결과를 등록해 주시기 바랍니다.<br><br>'
    content += '<table style="border-collapse: collapse;">'
    content += '  <tr>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">점검일자</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">점검대상부서</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">점검장소</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">점검자 소속</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">점검자</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">점검건수</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">부적합건수</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">조치건수</th>'
    content +=
      '    <th style="border: 1px solid #000000; padding: 6px 12px; background-color: #dddddd;">미조치건수</th>'
    content += '  </tr>'
    content += '  <tr>'
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.CHK_DT_NM}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.TARGET_ASGN_NM}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.CHK_LOC_NM}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.BSNS_NM}-${currRow.DEPT_NM}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.CHK_EMP_NM}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.CHK_CNT}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.BAD_CNT}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.FIX_CNT}</td>`
    content += `    <td style="border: 1px solid #000000; text-align: center; padding: 6px 12px;">${currRow.FIX_N_CNT}</td>`
    content += '  </tr>'
    content += '</table><br>'
    content +=
      '경로: HiSEs 접속 - 안전 - 안전점검 - 중대성사고 대책 이행점검 등록/현황 - 이행점검 결과(조치 등록)'

    await commonSearchApi({
      queryId: 'SAFCE0030_SEARCH04',
      param: {
        CMPNY_DIV: currRow.CMPNY_DIV,
        DEPT_CD: currRow.TARGET_DEPT_CD,
        ASGN_CD: currRow.TARGET_ASGN_CD,
      },
    }).then(async (res) => {
      // console.log('res', res.ORESULT_CUR)

      const mailParam = {
        EMAIL: [],
        SUBJECT:
          '[HiSEs] 중대성사고 대책 이행점검 부적합사항 조치결과 등록 요청',
        CONTENT: content,
      }

      for (let z = 0; z < res.ORESULT_CUR.length; z++) {
        mailParam.EMAIL.push(res.ORESULT_CUR[z].EMAIL)
      }

      // console.log('mailParam', mailParam)

      await commonSendApi(mailParam).then((res) => {
        Message.success(t('메일이 전송되었습니다.'))
      })

      await commonExecuteApi({
        queryId: 'SAFCE0030_SAVE05',
        list: [currRow],
      })
    })
  }

  onButtonsClick({ id: 'btnSearch' })
}
//메일발송관련 로직 끝

//점검상세 저장 관련 로직시작
const beforeSave02 = () => {
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdSub.value.getDataProvider().getJsonRow(chkNum[i])
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: data.YEAR,
      WEEK: data.WEEK,
      CHK_DT: data.CHK_DT,
      CHK_LOC_L: data.CHK_LOC_L,
      CHK_LOC_M: data.CHK_LOC_M,
      CHK_LOC_S: data.CHK_LOC_S,
      CHK_EMP: data.CHK_EMP,
      CLSS_SEQ: data.CLSS_SEQ,
      CHK_SEQ: data.CHK_SEQ,
      FIX_CNT: data.FIX_CNT,
      FIX_DESC: data.FIX_DESC,
      FIX_N_DESC: data.FIX_N_DESC,
      FIX_DT: data.FIX_DT,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      TARGET_BSNS_CD: data.TARGET_BSNS_CD,
      TARGET_DEPT_CD: data.TARGET_DEPT_CD,
      TARGET_ASGN_CD: data.TARGET_ASGN_CD,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCE0030_SAVE02',
    list: saveParam,
  })
}

const afterSave02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//점검상세 저장 관련 로직 끝

//사업부 변경시 부서 조회
// watch(
//   () => searchParam01.BSNS_CD,
//   (newValue, oldValue) => {
//     commonSearchApi({
//       queryId: "searchDept3",
//       param: {
//         CMPNY_DIV: searchParam01.CMPNY_DIV,
//         ORGN_DIV: "A",
//         BSNS_CD: newValue,
//         DEPT_CD: "",
//         ASGN_NM: "",
//         HSE_ONLY: "",
//         USE_ONLY: "Y",
//       },
//     }).then((res) => {
//       searchParam01.DEPT_CD = "";
//       codeList.deptCd = res.ORESULT_CUR;
//       codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" });
//     });
//   }
// );

//셀스타일 변경
//조치구분이 미완료인 셀 붉은색
const setGridStyle = () => {
  grdSub.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    let ret = {}
    if (dataCell.value === '미완료' && dataCell.index.fieldName === 'FIX_GBN') {
      ret.style = { background: 'rgb(255,160,160)' }
      return ret
    } else if (
      dataCell.index.fieldName === 'FIX_GBN' &&
      dataCell.value !== '미완료'
    ) {
      ret.style = { background: 'rgb(255,255,255)' }
      return ret
    }
  })
}

//로그인유저가 생산부서인지 체크하는 함수
//생산부서이면 사업부,대상부서 readonly
const checkProductionDept = () => {
  // console.log('cmpnyDiv', userStore.cmpnyDiv)
  // console.log('bsnsCd', userStore.bsnsCd)
  // console.log('deptCd', userStore.deptCd)
  // console.log('asgnCd', userStore.asgnCd)

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    DEPT_CD: userStore.asgnCd,
  }
  commonSearchApi({
    queryId: 'SAFCE0030_SEARCH99',
    param: param,
  }).then((res) => {
    if (res.ORESULT_CUR[0].IS_PROD === 'Y') {
      isReadOnly.value = true
    }
  })
}

watch(
  () => searchParam01.WEEK_FROM,
  (newValue, oldValue) => {
    if (Number(newValue) > Number(searchParam01.WEEK_TO)) {
      Message.warn(t('주차의 끝보다 큰 값은 입력할 수 없습니다.'))
      searchParam01.WEEK_FROM = ''
      return false
    }
    if (Number(newValue) > 53) {
      Message.warn(t('53주차보다 큰값은 입력 할 수 없습니다.'))
      searchParam01.WEEK_FROM = ''
      return false
    }
  }
)

watch(
  () => searchParam01.WEEK_TO,
  (newValue, oldValue) => {
    if (Number(newValue) > 53) {
      Message.warn(t('53주차보다 큰값은 입력 할 수 없습니다.'))
      searchParam01.WEEK_TO = ''
      return false
    }
  }
)

const onCellEdited = (grid, itemIndex, row, field) => {
  let data = grdSub.value.getDataProvider().getJsonRow(row)
  if (data.FIX_CNT > data.BAD_CNT) {
    Message.warn(t('조치건수는 부적합건수보다 큰 값을 입력할 수 없습니다.'))
    grdSub.value.getDataProvider().setValue(row, 'FIX_CNT', 0)
    return false
  }
}

const closed = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const openEmpPopup = async () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
  })
}

const selectedEmp = (param) => {
  searchParam01.CHK_EMP = param.EMP_NO
  searchParam01.CHK_EMP_NM = param.EMP_NM
}

const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === 'data') {
    // console.log('clickData', clickData)
    // console.log('data', grdMain.value.getDataProvider().getJsonRow(clickData.dataRow))

    if (clickData.fieldName === 'FILE_ATTACH') {
      const currRow = grdSub.value
        .getDataProvider()
        .getJsonRow(clickData.dataRow)
      fileUpload.value.openPopup(currRow.FILE_ID)
    } else if (clickData.fieldName === 'FIX_FILE_ATTACH') {
      const currRow = grdSub.value
        .getDataProvider()
        .getJsonRow(clickData.dataRow)
      fixFileUpload.value.openPopup(currRow.FIX_FILE_ID)
    }
  }
}

const uploaded = (param) => {
  // console.log('uploaded param', param)

  if (param.STATUS === 'update') {
    grdSub.value
      .getGridView()
      .setValue(
        grdSub.value.getGridView().getCurrent().itemIndex,
        'FIX_FILE_ATTACH',
        'Y'
      )
  } else {
    if (param.rowCnt < 1) {
      grdSub.value
        .getGridView()
        .setValue(
          grdSub.value.getGridView().getCurrent().itemIndex,
          'FIX_FILE_ATTACH',
          ''
        )
    }
  }
}

const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
  })
}

const onDeptSelected = (val) => {
  // console.log('val', val)
  searchParam01.BSNS_CD = val.BSNS_CD
  searchParam01.DEPT_CD = val.DEPT_CD
  searchParam01.ASGN_CD = val.ASGN_CD
  searchParam01.ASGN_NM = val.ASGN_FULL_NM
}

const clearable = () => {
  searchParam01.BSNS_CD = ''
  searchParam01.DEPT_CD = ''
  searchParam01.ASGN_CD = ''
  searchParam01.ASGN_NM = '전체'
}

router.afterEach(async (to, from, next) => {
  if (from.path === '/30_safety/SAF_C/SAFCE0040') {
    let data = await window.history.state.data

    for (let i in data) {
      searchParam01[i] = data[i]
    }

    commonStore.loading = false
    onButtonsClick({ id: 'btnSearch' })
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnRegist',
          'btnDelete',
          'btnPrint',
        ]"
        @click-button="onButtonsClick"
      />
      <!-- 'btnSendMail', -->
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParam01.YEAR"
            :label="$t('년도')"
            width="200px"
            type="YEAR"
          >
          </i-select>
          <i-input
            v-model="searchParam01.WEEK_FROM"
            class="mr-1"
            :label="$t('주차')"
            width="120px"
            number
          ></i-input>
          <span class="mt-2">~</span>
          <i-input
            v-model="searchParam01.WEEK_TO"
            class="ml-1"
            width="100px"
            number
          ></i-input>
          <i-input
            readonly
            :disabled="isReadOnly"
            v-model="searchParam01.ASGN_NM"
            :label="$t('점검대상부서')"
            width="300px"
            margin="5px"
            append-inner-icon="mdi-magnify"
            clearable
            @click:clearable="clearable()"
            @keydown.enter="
              (e) => {
                openDeptPopup()
              }
            "
            @click:appendInner="openDeptPopup()"
          ></i-input>
          <i-input
            v-model="searchParam01.ASGN_CD"
            width="95px"
            readonly
          ></i-input>
          <!-- <i-select
            v-model="searchParam01.BSNS_CD"
            :label="$t('사업부')"
            width="200px"
            :readonly="isReadOnly"
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
          ></i-select>
          <i-select
            v-model="searchParam01.DEPT_CD"
            :label="$t('부서')"
            width="250px"
            :readonly="isReadOnly"
            :items="codeList.deptCd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            label-width="40px"
          ></i-select> -->
          <i-input
            v-model="searchParam01.CHK_NO"
            :label="$t('점검번호')"
            width="165px"
            number
          ></i-input>
          <i-input
            :label="$t('점검자')"
            v-model="searchParam01.CHK_EMP"
            append-inner-icon="mdi-magnify"
            @click:append-inner="openEmpPopup"
            @input="searchParam01.CHK_EMP_NM = ''"
            width="175px"
            margin="5px"
          />
          <i-input v-model="searchParam01.CHK_EMP_NM" readonly width="110px" />
          <span class="mt-2">미조치</span>
          <v-checkbox
            v-model="searchParam01.FIX_YN"
            class="ml-2 mt-1"
            true-value="Y"
            false-value="N"
          ></v-checkbox>
        </v-sheet>
        <v-sheet height="30%" class="mb-3">
          <IGridTitle :title="$t('점검현황')" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCurrentRowChanged="onCurrentRowChanged"
            @onCellDblClicked="onCellDblClicked"
          >
          </RealGrid>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle
            :title="$t('점검상세')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick2"
          />
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
            @onCellEdited="onCellEdited"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFCE0030Popup ref="sAFCE0030Popup" @closed="closed"></SAFCE0030Popup>
  <!-- <SendMailPopup ref="sendMailPopup"></SendMailPopup> -->
  <EmpPopup ref="empPopup" @selected="selectedEmp" />
  <OZReport
    :showPop="showOz"
    :reportName="reportName"
    :params="reportParam"
    @close="showOz = $event"
  />
  <IUploadPopup
    ref="fileUpload"
    :buttonList="['btnDownLoad', 'btnClose']"
    :isVisibled="false"
  />
  <IUploadPopup2
    ref="fixFileUpload"
    :buttonList="['btnDownLoad', 'btnDelete', 'btnClose']"
    @uploaded="uploaded"
  />
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
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
