<!-- SI2팀김성근 -->
<!-- 프로그램명 : 위험작업 현황 (일렉용) -->
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
  commonRequest2,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import OZReport from '@/components/OZReport.vue'
import SAFBA0010PopUp1 from '@/pages/30_safety/SAF_B/SAFBA0010PopUp1.vue'
defineOptions({
  name: '30_safety-SAF_B-SAFBC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const codeList = reactive({
  DN_DIV: [],
})
const noWork = ref(true)
const noDivL = ref(true)
const reportName = ref('/manage/hse/SAFBC0010.ozr')
const reportParam = ref([])
const showOz = ref(false)
const safba00101 = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WORK_FROM: dayjs().format('YYYY-MM-DD'),
  WORK_TO: dayjs().format('YYYY-MM-DD'),
  REL_DEPT_CD: '',
  REL_ASGN_CD: '',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: '',
  COMPANY: userStore.cmpnyDiv,
  DN_DIV: '', // 기본 주간
  STATUS: '',
  DIV_M: '',
  DIV_L: '',
  WORK_NO: '전체',
  GBN: '1',
  CHECK: "N",
  ALLDAY:'N'
})
const NOBSNS = ref()
onMounted(() => {
  Promise.all([
    getCodeList('HHIE100CODE000'), //0

    commonSearchApi({
      queryId: 'SAFBC0010_ELEC_search02',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }), // 1
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N' },
    }), //2
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: userStore.bsnsCd },
    }), //3
    commonSearchApi({
      queryId: 'OPRAC0010_SEARCH_05',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: 'AN00',
        DEPT_CD: '',
        USE_DIV: 'Y',
      },
    }), // 4
  ]).then((res) => {
    codeList.STATUS = res[0].ORESULT_CUR
    codeList.WorkNo = res[1].ORESULT_CUR
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
    codeList.WorkNo.unshift({ SHIP_KIND_NM: '', WORK_NO: '전체' })
    codeList.BSNS_CD = res[2].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.DEPT_CD = res[3].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
    codeList.SAF = res[4].ORESULT_CUR
    codeList.SAF.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.DN_DIV.unshift(
      { TXT: '전체', COD: '' },
      { TXT: '주간', COD: 'D' },
      { TXT: '야간', COD: 'N' }
    )
  })
  vm.$nextTick(()=>{
    menuTitle.value.setBtnProperty("btnExcel", "visible", false)
  })
})
// 사업부 변경감지
watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NOBSNS.value = true
      searchParams.DEPT_CD = ''
      // searchParams.SAF = ''
    } else {
      commonSearchApi({
        queryId: 'searchDept3',
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        searchParams.DEPT_CD = ''
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        NOBSNS.value = false
      })

      // commonSearchApi({
      //   queryId: 'OPRAC0010_SEARCH_05',
      //   param: {
      //     CMPNY_DIV: userStore.cmpnyDiv,
      //     BSNS_CD: newValue,
      //     DEPT_CD: '',
      //     USE_DIV: 'Y',
      //   },
      // }).then((res) => {
      //   codeList.SAF = res.ORESULT_CUR
      //   codeList.SAF.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      // })
    }
  }
)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false } },

  keys: ['CMPNY_DIV'],
  fields: [
    {
      fieldName: 'WRKCHK',
      dataType: 'text',
      width: '30',
      header: { text: t('　') },
      renderer: {
        type: 'html',
        callback: (grid, model, field) => {
          return GBNCallback(grid, model, field)
        },
      },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'WORK_TIME',
      dataType: 'text',
      width: '100',
      header: { text: t('작업시간') },
    },
    {
      fieldName: 'WORK_DT',
      dataType: 'text',
      width: '100',
      header: { text: t('작업일') },

      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM',
          includedFormat: true,
        },
      },
    },

    {
      fieldName: 'BSNSNM',
      dataType: 'text',
      width: '100',
      header: { text: t('사업부') },
      mergeRule: { criteria: 'value' },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'DEPTNM',
      dataType: 'text',
      width: '100',
      header: { text: t('부서') },
      mergeRule: { criteria: 'value' },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '100',
      header: { text: t('조직') },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'WORKER_CNT',
      dataType: 'text',
      width: '100',
      header: { text: t('인원') },
      styleName: 'right-column',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'RESP_HP_NO',
      dataType: 'text',
      width: '150',
      header: { text: t('책임자 전화번호') },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'RESP_EMP_NM',
      dataType: 'text',
      width: '100',
      header: { text: t('책임자') },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'MNGR_HP_NO',
      dataType: 'text',
      width: '150',
      header: { text: t('관리감독자 전화번호') },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'MNGR_EMP_NM',
      dataType: 'text',
      width: '100',
      header: { text: t('관리감독자　　　(승인자)') },
      mergeRule: { criteria: 'value' },
    },

   // 장소
   {
      fieldName: "JOB_SPLC",
      dataType: "text",
      width: "150",
      header: { text: t("기본") },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "DIV_M",
      dataType: "text",
      width: "100",
      header: { text: t("상세") },
      styleName: "left-column",
      width:'250',
      mergeRule: { criteria: "value" },
    },

    // 작업
    {
      fieldName: "DANG_DIV",
      dataType: "text",
      width: "150",
      header: { text: t("분류") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      width: "250",
      header: { text: t("내용") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },    
    {
      fieldName: 'THREECHECKYN',
      width: '100',
      header: { text: t('3중점검여부') },
      editable: false,
    },
    {
      fieldName: 'STATUS_NM',
      width: '100',
      header: { text: t('진행상태') },
      dataType: 'text',
      mergeRule: { criteria: 'value' },
    },
    {
      // 대면/전산
      header: { text: t('허가구분') },
      fieldName: 'CF_DIV_NM',
      dataType: 'text',
      mergeRule: { criteria: 'value' },
    },
    // {
    //   fieldName: "REL_ASGN_NM",
    //   width: "100",
    //   header: { text: t("안전팀") },
    //   dataType: "text",
    // },

    {
      header: { text: t('허가번호') },
      fieldName: 'RCV_NO',
      dataType: 'text',
      mergeRule: { criteria: 'value' },
    },
    {
      header: { text: t('신청일') },
      fieldName: 'REQ_DT',
      dataType: 'text',
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM',
          includedFormat: true,
        },
      },
      mergeRule: { criteria: 'value' },
    },
    {
      header: { text: t('단기공사번호') },
      fieldName: 'SHORT_WORK_NO',
      dataType: 'text',
      mergeRule: { criteria: 'value' },
    },
    {
      header: { text: t('밀폐공간') },
      fieldName: 'CONFINED_YN',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      editable: false,
    },
    {
      header: { text: t('아르곤') },
      fieldName: 'ARGN_YN',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      editable: false,
    },
    {
      header: { text: t('수전') },
      fieldName: 'ELEC_YN',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      editable: false,
    },

    {
      header: { text: t('고소') },
      fieldName: 'HEIGHT',
      dataType: 'number',
      styleName: 'right-column',
    },

    {
      header: { text: t('테스트압력') },
      fieldName: 'PRESSURE',
      dataType: 'number',
      styleName: 'right-column',
    },
    {
      header: { text: t('압력 테스트') },
      fieldName: 'PIPE_DIA',
      dataType: 'number',
      styleName: 'right-column',
    },
    /* ********** 호선,규격-선종 요청으로 인해 추가함(2024.07.21 염인식) ********** */
    {
      header: { text: t('호선') },
      fieldName: 'WORK_NO',
      dataType: 'text',
    },
    {
      header: { text: t('규격-선종') },
      fieldName: 'SHPTYP_NAM',
      dataType: 'text',
    },
    {
      fieldName: 'GBN',
      visible: false,
    },

    {
      //작업조직
      fieldName: 'ORGN_NM',
      visible: false,
    },

    {
      //작업상세내용
      fieldName: 'WORK_DETAIL',
      visible: false,
    },
    {
      //작업장소상세
      fieldName: 'JOB_PLC',
      visible: false,
    },

    {
      fieldName: 'CMPNY_DIV',
      visible: false,
    },
    {
      fieldName: 'RCV_TYPE',
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    'WRKCHK',
    'WORK_DT',
    'WORK_TIME',
    'BSNSNM',
    'DEPTNM',
    'ASGN_NM',
    {
      name: '장소',
      direction: 'horizontal',
      items: ['JOB_SPLC', 'DIV_M'],
      header: {
        text: t('장소'),
      },
    },
    'WORK_NO',
    'SHPTYP_NAM',
 
    {
      name: '작업',
      direction: 'horizontal',
      items: ['DANG_DIV','WRK_DIST','THREECHECKYN'],
      header: {
        text: t('작업'),
      },
    },
    'WORKER_CNT',
    'RESP_HP_NO',
    'RESP_EMP_NM',
    'MNGR_HP_NO',
    'MNGR_EMP_NM',

    'STATUS_NM',
    // "REL_ASGN_NM",
    'CF_DIV_NM',
    'RCV_NO',
    'REQ_DT',
    'SHORT_WORK_NO',
    'CONFINED_YN',
    'ARGN_YN',
    'ELEC_YN',
    'HEIGHT',
    'PRESSURE',
    'PIPE_DIA',
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    let err = dayjs(searchParams.WORK_TO).diff(
      dayjs(searchParams.WORK_FROM),
      'day'
    )
    // if (err > 8) {
    //   Message.warn(t('작업일 조회기간은 7일까지 조회 할 수 있습니다.'))
    //   return
    // }
    if (!searchParams.WORK_FROM || !searchParams.WORK_TO) {
      Message.warn(t('작업일을 입력해주십시오.'))
      return
    }

    // if (!searchParams.BSNS_CD) {
    //   Message.warn(t('사업부를 입력해주십시오.'))
    //   return
    // }

    if(!searchParams.BSNS_CD && searchParams.WORK_NO === '전체') {
      Message.warn(t('사업부가 전체일 때 호선/공사는 필수로 선택하시기 바랍니다.'))
      return
    }
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run()
  } else if (btn.id === 'btnExcel') {
    exportExcel()
  } else if (btn.id === 'btnPrint') {
    // console.log("출력 ")
    let rowLength = grdMain.value.getGridView().getItemCount()
    if (rowLength === 0) {
      return Message.warn(t('조회 후 이용하시기바립니다.'))
    }
    print()
  }
}

/* ---------- 조회 ---------- */
const searchData = () => {
  let searchPam = {}

  for (let i in searchParams) {
    searchPam[i] = searchParams[i]
  }
  searchPam.WORK_NO = searchPam.WORK_NO === '전체' ? '' : searchPam.WORK_NO
  searchPam.WORK_FROM = searchPam.WORK_FROM.replace(/-/g, '')
  searchPam.WORK_TO = searchPam.WORK_TO.replace(/-/g, '')

  return commonSearchApi({
    queryId: 'SAFBC0010_ELEC_search01',
    param: searchPam,
  })
} 

const afterSearch = async (res) => {
  if (searchParams.CHECK == "Y") {
    for (let i in res.ORESULT_CUR) {
      //PARA_CHK_YN 의 값은 PARA_CHK_YN 필드의 값과 작업시작일과 Today 값을 비교한 결과를 가져온다.
      //즉, 작업 시작일이 Today 이전이면 'N' 값을 가져온다.
      //END_YN 의 값은 작업종결(STATUS='50') 일 경우 'Y' 를 가져온다.
      if (res.ORESULT_CUR[i].PARA_CHK_YN === 'N') {
        res.ORESULT_CUR[i].WRKCHK = 'CN'
        continue
      } // 구분 1추가하고
      res.ORESULT_CUR[i].GBN = 1
      // 조회하고
      await commonSearchApi({
        queryId: 'SAFBA0010_ELEC_search02',
        param: res.ORESULT_CUR[i],
      }).then((resSub) => {
        // console.log(resSub, "ddd")
        // 조회값넣고
        res.ORESULT_CUR[i].WRKCHK = resSub.ORESULT_CUR[0].WRKCHK
      })
    }
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().groupPanel.visible = false //그룹패널 안보이게하기
  grdMain.value.getGridView().groupBy(['RCV_NO']) //BSNS_NM 기준으로 그룹핑
  grdMain.value.getGridView().setRowGroup({
    expandedAdornments: 'footer',
    collapsedAdornments: 'footer',
    mergeExpanderVisibility: 'none',
    indentVisible: false,
  })

  //   for (let i in res.ORESULT_CUR) {
  // // // 40거르고
  // // if (res.ORESULT_CUR[i].STATUS != 40) {
  // //   // 구분 1추가하고
  // //   res.ORESULT_CUR[i].GBN = 1
  // //   // 조회하고
  // //   await commonSearchApi({
  // //     queryId: "SAFBC0010_search05",
  // //     param: res.ORESULT_CUR[i],
  // //   }).then((resSub) => {

  // //     // 조회값넣고
  // //     res.ORESULT_CUR[i].WRKCHK = resSub.ORESULT_CUR[0].WRKCHK
  // //   })
  // // }
  // // if (res.ORESULT_CUR[i].STATUS == 40) {
  // //   res.ORESULT_CUR[i].WRKCHK = "N"
  // // }
  // // }
}

const itemProps = (item) => {
  return {
    title: item.WORK_NO,
    subtitle: item.SHIP_KIND_NM,
  }
}

// 그리드 html
// grid radio 생성
const GBNCallback = (grid, model, field) => {
  let backgroundColor = ''

  if (model._index.value === 'Y1') {
    backgroundColor = '#be2e22'
  }
  if (model._index.value === 'Y2') {
    backgroundColor = '#8db600'
  }
  if (model._index.value === 'N') {
    backgroundColor = '#00aaff'
  }
  if (model._index.value === 'CN') {
    backgroundColor = '#d3d3d3'
  }

  return `<div style="border-radius: 20px; margin: 0 auto; background-color:${backgroundColor};width: 15px;height: 15px;"></div>`
}

watch(
  () => searchParams.WORK_NO,
  (newValue) => {
    searchParams.DIV_L = ''
    if (newValue == '' || newValue == null || newValue == '') {
      noWork.value = true
      searchParams.DIV_L = ''
    } else {
      noWork.value = false
      let filterArr = codeList.WorkNo.filter(
        (x) => x.WORK_NO == searchParams.WORK_NO
      )

      commonSearchApi({
        queryId: 'SAFBC0010_ELEC_search03',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          SHIP_KIND: filterArr[0].SHIP_KIND,
          WORK_NO: filterArr[0].WORK_NO,
        },
      }).then((res) => {
        if (res.ORESULT_CUR.length != 0) {
          codeList.DIV_L = res.ORESULT_CUR
          codeList.DIV_L.unshift({ RISK_LPLC_NM: '전체', RISK_LPLC: '' })
        }
      })
    }
  }
)

// 그리드 이벤트
const onCellDblClicked = (grd, data) => {
  if (data.cellType === 'data') {
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    safba00101.value.openPopup(innerData, '현황')
    // console.log(innerData, "innerData")
  }
}

watch(
  () => searchParams.DIV_L,
  (newValue) => {
    searchParams.DIV_M = ''
    if (newValue == '' || newValue == null || newValue == '') {
      noDivL.value = true
      searchParams.DIV_M = ''
    } else {
      noDivL.value = false
      let filterArr = codeList.WorkNo.filter(
        (x) => x.WORK_NO == searchParams.WORK_NO
      )
      commonSearchApi({
        queryId: 'SAFBC0010_ELEC_search04',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          SHIP_KIND: filterArr[0].SHIP_KIND,
          RISK_LPLC: searchParams.DIV_L,
          WORK_NO: filterArr[0].WORK_NO,
        },
      }).then((res) => {
        if (res.ORESULT_CUR.length != 0) {
          codeList.DIV_M = res.ORESULT_CUR
          codeList.DIV_M.unshift({ RISK_MPLC_NM: '전체', RISK_MPLC: '' })
        }
      })
    }
  }
)

//2024.03.13 김현재 작성
//엑셀 다운로드 로직 시작
const exportExcel = () => {
  let grdData = grdMain.value.getDataProvider().getJsonRows(0, -1) //조회된 모든 데이터 json으로 가져오기
  if (grdData.length === 0) {
    Message.warn(t('엑셀추출할 데이터를 조회 해주세요.'))
    return false
  }
  let excelData = [] //백엔드로 보내줄 데이터
  //그리드에서 필요한 데이터만 뽑기
  for (let data of grdData) {
    let extractData = {} //필요한 데이터가 들어갈 객체
    if (data.WORK_NO === null) {
      data.WORK_NO = ''
    }
    extractData.WORK_NO = data.WORK_NO // 호선
    extractData.WORK_DT = data.WORK_DT.toString().substr(0, 10) //작업날짜
    extractData.WORK_TIME = data.WORK_TIME //작업시간
    extractData.ORGN_NM = data.ORGN_NM //작업조직
    extractData.RESP_EMP_NM = data.RESP_EMP_NM //책임자
    extractData.WORKER_CNT = data.WORKER_CNT //인원
    extractData.WORK_DETAIL = data.WORK_DETAIL //작업상세내용
    extractData.JOB_PLC = data.JOB_PLC //작업장소
    extractData.STATUS_NM = data.STATUS_NM //비고
    extractData.CF_DIV_NM = data.CF_DIV_NM //대면 / 전산
    extractData.DAY = getDAY(
      dayjs(data.WORK_DT.toString().substr(0, 10)).get('d')
    ) //getDAY() // 요일
    excelData.push(extractData)
  }
  excelData.sort((a, b) => {
    // 작업 날짜(WORK_DT)로 먼저 정렬합니다.
    if (a.WORK_DT === b.WORK_DT) {
      // 작업 번호(WORK_NO)가 NULL인 경우 뒤로 보냅니다.
      if (a.WORK_NO === null && b.WORK_NO !== null) {
        return 1
      }
      if (a.WORK_NO !== null && b.WORK_NO === null) {
        return -1
      }
      // 작업 번호(WORK_NO)가 NULL이 아니면 작업 번호를 기준으로 정렬합니다.
      if (a.WORK_NO !== null && b.WORK_NO !== null) {
        if (a.WORK_NO < b.WORK_NO) {
          return -1
        }
        if (a.WORK_NO > b.WORK_NO) {
          return 1
        }
      }
      // 작업 번호(WORK_NO)가 동일한 경우, 0을 반환하여 순서를 유지합니다.
      return 0
    }
    // 작업 날짜(WORK_DT)를 기준으로 정렬합니다.
    else {
      if (a.WORK_DT < b.WORK_DT) {
        return -1
      }
      if (a.WORK_DT > b.WORK_DT) {
        return 1
      }
    }
  })
  commonRequest2('hse/EXCEL/DANGER_PERMISSION', { excelData }).then((res) => {
    const blob = new Blob([res], { type: res.type })
    const link = document.createElement('a')
    const fileName = `(${searchParams.WORK_FROM.toString()} ~ ${searchParams.WORK_TO.toString()})위험작업허가관리 대장출력`
    //const fileName = res.contentDisposition.split("=")[1]

    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

const getDAY = (day) => {
  switch (day) {
    case 0:
      return '일'
    case 1:
      return '월'
    case 2:
      return '화'
    case 3:
      return '수'
    case 4:
      return '목'
    case 5:
      return '금'
    case 6:
      return '토'
  }
}
//엑셀 다운로드 로직 끝

//출력 관련 로직 시작
const print = () => {
  reportParam.value = [
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_WORK_FROM=' + searchParams.WORK_FROM.replace(/-/g, ''),
    'IN_WORK_TO=' + searchParams.WORK_TO.replace(/-/g, ''),
    'IN_REL_DEPT_CD=' + searchParams.REL_DEPT_CD,
    'IN_REL_ASGN_CD=' + searchParams.REL_ASGN_CD,
    'IN_BSNS_CD=' + searchParams.BSNS_CD,
    'IN_DEPT_CD=' + searchParams.DEPT_CD,
    'IN_ASGN_CD=' + searchParams.ASGN_CD,
    'IN_COMPANY=' + searchParams.COMPANY,
    'IN_DN_DIV=' + searchParams.DN_DIV,
    'IN_STATUS=' + searchParams.STATUS,
    'IN_DIV_M=' + searchParams.DIV_M,
    'IN_DIV_L=' + searchParams.DIV_L,
    'IN_WORK_NO=' + searchParams.WORK_NO === '전체' ? '' : searchParams.WORK_NO,
  ]
  // console.log("레포트파람", reportParam)

  showOz.value = true
}
//출력 관련 로직 끝
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnExcel', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-3">
            <i-input
              :label="$t('작업일')"
              v-model="searchParams.WORK_FROM"
              type="Date"
              width="195px"
              margin="10px"
              required
            />
            <i-input
              :label="$t('-')"
              v-model="searchParams.WORK_TO"
              type="Date"
              width="160px"
              margin="10px"
            />

            <i-select
              :label="$t('사업부')"
              width="270px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />

            <i-select
              :label="$t('부서')"
              width="300px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
            />
            <!-- :disabled="NOBSNS" -->

           
            <!-- :disabled="NOBSNS" -->
            <i-select
              :label="$t('주/야 구분')"
              v-model="searchParams.DN_DIV"
              :items="codeList.DN_DIV"
              item-value="COD"
              item-title="TXT"
              margin="10px"
              width="280px"
            />

            <i-select
              :label="$t('안전조직')"
              v-model="searchParams.SAF"
              :items="codeList.SAF"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              margin="10px"
              width="280px"
            />
          </div>

          <div class="d-flex">
            <div
              class="d-flex align-center"
              style="width: 280px; margin-right: 10px"
            >
              <p class="mr-2">{{ $t('호선/공사') }}</p>
              <v-select
                v-model="searchParams.WORK_NO"
                :items="codeList.WorkNo"
                item-value="WORK_NO"
                :item-props="itemProps"
              />
            </div>
            <!-- <i-select
              :label="$t('구역구분')"
              v-model="searchParams.DIV_L"
              :items="codeList.DIV_L"
              item-value="RISK_LPLC"
              item-title="RISK_LPLC_NM"
              width="280px"
              margin="10px"
              :disabled="noWork"
            />
            <i-select
              :label="$t('작업구역')"
              v-model="searchParams.DIV_M"
              :items="codeList.DIV_M"
              item-value="RISK_MPLC"
              item-title="RISK_MPLC_NM"
              width="280px"
              margin="10px"
              :disabled="noDivL"
            /> -->
            <i-select
              :label="$t('진행상태')"
              v-model="searchParams.STATUS"
              :items="codeList.STATUS"
              item-value="COD"
              item-title="TXT"
              margin="10px"
              width="280px"
            />
            <div
              class="d-flex align-center"
              style="width: 97px; margin-right: 10px"
            >
              <v-checkbox
                v-model="searchParams.GBN"
                true-value="1"
                false-value="2"
                :label="t('단기공사포함')"
              />
            </div>
            <div
              class="d-flex align-center"
              style="width: 97px; margin-right: 10px"
            >
              <v-checkbox
                v-model="searchParams.CHECK"
                true-value="Y"
                false-value="N"
                :label="t('병행체크')"
              />
            </div>
            <div
              class="d-flex align-center"
              style="width: 200px; margin-right: 10px"
            >
              <v-checkbox
                v-model="searchParams.ALLDAY"
                true-value="Y"
                false-value="N"
                :label="t('해당일 포함 전체 리스트')"
              />
            </div>
          </div>
        </v-sheet>

        <div class="d-flex align-center mb-3">
          병행작업확인 범례
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #d3d3d3" />
            병행확인불필요
          </div>
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #00aaff" />
            일반작업(화기/도장)
          </div>
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #8db600" />
            승인된 병행작업
          </div>
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #be2e22" />
            병행작업
          </div>
        </div>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFBA0010PopUp1 ref="safba00101" />
  <OZReport
    :showPop="showOz"
    :reportName="reportName"
    :params="reportParam"
    @close="showOz = $event"
  ></OZReport>
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
.boxBumRel {
  padding: 6px;
  margin: 0px 2px;
  text-align: center;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.cricleBumRel {
  width: 15px;
  height: 15px;
  border-radius: 16px;
  margin-right: 4px;
}
.boxBumRel:first-child {
  margin-left: 10px;
}
</style>
