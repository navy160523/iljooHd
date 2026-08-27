<!--
  화면명 : RSKBA0010 / 작업표준 신규제정
  화면개요 : 
-->

<script setup>
import { ref, reactive, onMounted, onActivated, onBeforeUnmount, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRskSaveApi,
  commonExcelWrkDetailApi,
  commonWordExportApi,
  commonWordExportApiVer2,
  getCodeList,
  getCompanyList,
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
import { useCommonStore } from '@hiway/stores/common'
import RSKBA0010popup1 from './RSKBA0010popup1.vue'
import RSKBA0010popup2 from './RSKBA0010popup2.vue'
import RSKBA0010popup3 from './RSKBA0010popup3.vue'
import RSKBA0010popup4 from './RSKBA0010popup4.vue'
import RSKBA0010popup5 from './RSKBA0010popup5.vue'
import RSKBA0010popup6 from './RSKBA0010popup6.vue'
import RSKBA0010Tab4 from './TAB/RSKBA0010Tab4.vue'
import RSKCA0010 from '../RSK_C/RSKCA0010.vue'
import SAFAB0020 from '@/pages/30_safety/SAF_A/SAFAB0020.vue'
import SAFCA0010 from '@/pages/30_safety/SAF_C/SAFCA0010.vue'
import SAFEA0010 from '@/pages/30_safety/SAF_E/SAFEA0010.vue'
import SRMAA0030 from '@/pages/40_safety-risk/SRM_A/SRMAA0030.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from '@hiway/api/commonFileApi'
import draggable from 'vuedraggable'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import IUploadPopupEdu from '@/components/popup/IUploadPopup.vue'
import IUpload from '@/components/IUpload.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopupSTAN.vue' // 결재 팝업
import ApprovalPopupInApp from '@/components/popup/ApprovalPopupInApp.vue' // 결재 팝업
import OZReport from '@/components/OZReport.vue' // 리포트 팝업
import _ from 'lodash'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { isEmpty } from '@/@core/utils'

const screenWidth = ref(window.innerWidth)

const handleResize = () => {
  screenWidth.value = window.innerWidth
}

defineOptions({
  name: '20_risk-assessment-RSK_B-RSKBA0010',
})

const router = useRouter()
const commonStore = useCommonStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
// const $vuetify = vuetify.framework

const menuTitle = ref(null)
const menuTitle2 = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const grdHistory = ref(null)
const rSKBA0010popup1 = ref(null) // 구분
const rSKBA0010popup2 = ref(null) // 위험요인
const rSKBA0010popup3 = ref(null) // 감소대책
const rSKBA0010popup4 = ref(null) // 사고정보
const rSKBA0010popup5 = ref(null) // 표준복사
const rSKBA0010popup6 = ref(null) // 회의이력(전체)
const rSKCA0010popup7 = ref(null) // 비일상작업

const rSAFEA0010 = ref(null) // 안전작업 요구권 등록/조회

const empPopup = ref(null)
const fileUploadPopup = ref(null) // 파일
const fileUploadEduPopup = ref(null) // 파일
const fileUpload = ref(null) // 파일 업로드
const approvalPopup = ref(null) // 결재
const refApprovalPopupInApp = ref(null) // 결재(내부 : 협력사용)
const reportName = ref('/manage/hse/RSKBA0010.ozr') // 요약출력
const reportNameD = ref('/manage/hse/RSKBA0010_detail.ozr') // 상세출력
const showOz = ref(false) // 요약출력
const showOzDetail = ref(false) // 요약출력
const params = ref([])
let partsArray = reactive([])
const ArrayList = ref([])
const sItem = ref(null)
const sItemLevel = ref(null)
const readonlyYn = ref(true)
const tab = ref('tab1')
let d = new Date()
let workType = ref(null)
let workId = ref(null)
let apprType = ref('R')
let realImgList = ref(null)

const receiveParam = ref(null)
const mailPopup = ref(null)
const imgUrlTemp = ref([])
const logsStore = useLogsStore() //2024.2.15 차동운 화면ID

let chkRevList = reactive([])
let riskCdList = reactive([])
let rmCdList = reactive([])
let validList = reactive([])
let textReadOnly = reactive(true)
const saveParam = reactive([]) // 세부내용 저장 시 사용
let isUnitAdd = ref(false)
let isUnitRemove = ref(true)
let isActAdd = ref(true)
let isActRemove = ref(true)
let isActSelect = ref(true)
let isRiskAdd = ref(true)
let isRiskRemove = ref(true)
let isRevision = ref(false)
let isAbolition = ref(false) // 저장 시 사용(현황화면에서 받아오는 값)
let isReadOnly = ref(false) // 결재중일떄는 true
let isVisible = ref(false)
let isVisiblePartner = ref(false)
let isReadOnlyPartner = ref(false) // 협력사용
let isComplete = ref(false)
let isReviewer = ref(false)
let disabledTrans = ref(true)

let bRevision = ref(false)
let isActiveTab = ref(false)
let sagoInform = ref(false)
let srBtnDisabled = ref(true)
let isApproval = ref(false)
let isSaved = ref(false)

const dialog = ref(false)
const dialogSAFAB0020 = ref(false)
const dialogSAFCA0010 = ref(false)
const dialogSAFEA0010 = ref(false)
const dialogSRMAA0030 = ref(false)

const cmbTrans = ref([{ TRANS_CD: 'ko', TRANS_NM: '한국어' }])

let WORK_STANDARD_MASTER = reactive({
  WORK_STANDARD_ID: '',
  WORK_STANDARD_ID_VIEW: '',
  WORK_ID: '',
  SAVE_TYPE: 'C',
  SAVE_STATUS: 'C',
  COMPANY_CD: userStore.cmpnyDiv,
  CORP_ASGN_CD: userStore.corpAsgnCd,
  CORP_ASGN_NM: userStore.corpAsgnNm,
  BSNS_CD: userStore.bsnsCd,
  BSNS_CD_ORIGIN: '', // 실제 작업표준 작성한 부서의 사업부 세팅용
  USR_ID: userStore.userId,
  DEPT_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  DEPT_NM: userStore.deptNm,
  USER_INFO: userStore.deptNm + '/' + userStore.userName,
  GUBUN_NM: '',
  GUBUN_CD: '',
  WORK_STANDARD_NO: '',
  WORK_STANDARD_REVISION: '',
  WORK_STANDARD_NM: '',
  WORK_TOOLS: '',
  EQUIPMENT_TYPE: '',
  USE_CHEMICAL: '',
  REVIEWER: '',
  // PROGRESS_STATUS: 'CP_AW',
  PROGRESS_STATUS: 'CC_AC',
  WORK_STANDARD_KIND: 'C',
  RISK_TYPE: '',
  RISK_TYPE_NM: '',
  C_DATE: dayjs().format('YYYY-MM-DD'),
  U_DATE: '',
  // WORK_DATE: toDayDateTime(),
  WORK_STANDARD_DESC: '',
  APPR_DT: '',
  IS_SAVE: '',
  WORK_STANDARD_RISK_COUNT: 0,
  WORK_STANDARD_RISK_OVER_COUNT: '0건',
  WORK_STANDARD_AVG_RISK: 0,
  SRSRM_ALL: 0,
  SRSRM_COMPLETE: 0,
  RATE: 0,
  A_SAGO_COUNT: '',
  B_SAGO_COUNT: '',
  C_SAGO_COUNT: '',
  D_SAGO_COUNT: '',
  TRANS_CD: 'ko',
  CHK_REQUIRED: '',
  USER_DIV: '',
  MANAGER_CD: '', // 담당자(생산팀장)
  PRODUCTION_MANAGER: '',
  POSITION_MANAGER: '',
  PRODUCTION_MANAGER_NM: '',
  PM_CD: '', // 직책과장
  POSITION_MANAGER_NM: '',
  EDU_FILE_ID: '',
  EDU_FILE_COUNT: '',
})

let PARTNER_WORK_TYPE = ''
let WORK_STANDARD_UNIT = reactive([])
let WORK_STANDARD_ACT = reactive([])
let WORK_STANDARD_RISK = reactive([])

const treeItems = reactive([])
const tree = ref([])
const initiallyOpen = ref([])

// 현재의 위험성
const befor1 = ref(false)
const befor2 = ref(false)
const befor3 = ref(false)
const befor4 = ref(false)

//개선 후 위험성
const after1 = ref(false)
const after2 = ref(false)
const after3 = ref(false)
const after4 = ref(false)

//재해발생현황
const SAGO = reactive({
  SAN_CNT: 0,
  HUE_CNT: 0,
  IL_CNT: 0,
  COME_SERIOUS_CNT: 0,
})

const rptList = reactive({
  unitList: [],
  actList: [],
  riskList: [],
})

//조회조건
let searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  userId: userStore.userId,
})

//코드리스트 선언
const codeList = reactive({
  company: [],
  riskType: [],
  USER_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '사내협력사' },
    { COD: 'D', TXT: '단기공사' },
    { COD: 'Z', TXT: '기타' },
  ],
  proc: [],
  gubun: [],
  BEFOR_TYPE: [
    { COD: 1, TXT: '1(최하)' },
    { COD: 2, TXT: '2(하)' },
    { COD: 3, TXT: '3(중)' },
    { COD: 4, TXT: '4(상)' },
    { COD: 5, TXT: '5(최상)' },
  ],
  BEFOR_TYPE2: [
    { COD: '', TXT: '' },
    { COD: 1, TXT: '1(최하)' },
    { COD: 2, TXT: '2(하)' },
    { COD: 3, TXT: '3(중)' },
    { COD: 4, TXT: '4(상)' },
    { COD: 5, TXT: '5(최상)' },
  ],
  committee: {
    COMMITTEE_OPS: '',
    COMMITTEE_DEPT: '',
    COMMITTEE_ASSOC: '',
  },
  TRANS: [{ TRANS_CD: 'ko', TRANS_NM: '한국어' }],
  REQUIRED: {
    CHK1: '',
    CHK2: '',
    CHK3: '',
  },
})

const approvalSaveData = reactive({})
const approvalParam = reactive({})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // getCompanyList(), // 회사구분
    // PKG_RSKBA0010.COMMON_CODE_COMBO_S
    commonSearchApi({ queryId: 'RSKBA0010_SEARCH_02', param: { TYPE: 'DETAIL', COMM_CD: 'RISK_TYPE' } }), // 평가유형
  ]).then((res) => {
    //console.log('코드 가져오는데?', res[0].ORESULT_CUR)
    codeList.riskType = res[0].ORESULT_CUR
  })
}

/**
 * 신규 버튼을 눌렀을 때, 기본으로 표시되는 단위작업 2개 추가
 * 단위작업, 작업정리 명칭으로 지정
 */
const addDefaultUnit = async () => {
  // 신규버튼 클릭시 default 단위작업 2개 추가
  await addItem('unit')
  await addItem('unit')

  let cnt = 0

  ArrayList.value.forEach((itm) => {
    itm.UNIT_NM = cnt++ == 0 ? '작업준비' : '작업정리'
  })
}

const popupEmp = (gbn) => {
  // 협력사인 경우 사용 불가
  if (userStore.userDiv == 'B') return

  empPopup.value.openPopup({
    EMP_NM: '',
    BSNS_CD: '',
    DEPT_CD: '',
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
  })
}

//직원 팝업 데이터 셋팅
const selectedEmpData = (val) => {
  WORK_STANDARD_MASTER.PRODUCTION_MANAGER = val.EMP_NO
  WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM = val.BSNS_NM + '/' + val.JOB_TIT_NM + '/' + val.EMP_NM

  //console.log('PRODUCTION_MANAGER_NM = ', WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM)
  //console.log('val.asgncd = ', val.ASGN_CD)

  commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_33',
    param: { CMPNY_DIV: val.CMPNY_DIV, ASGN_CD: val.ASGN_CD },
  }).then((res) => {
    //console.log('res = ', res.ORESULT_CUR)
    WORK_STANDARD_MASTER.POSITION_MANAGER = res.ORESULT_CUR[0].EMP_NO
    WORK_STANDARD_MASTER.POSITION_MANAGER_NM = res.ORESULT_CUR[0].FULL_NAME
  })

  /*
  grdMainSetValue(popupParams.ROW_IDX, popupParams.COL_NM, val.EMP_NM)
  grdMainSetValue(popupParams.ROW_IDX, popupParams.COL_CD_NM, val.EMP_NO)
  if (popupParams.COL_NM === 'CERT_EMP_NM') {
    grdMainSetValue(popupParams.ROW_IDX, 'CERT_EMP_TEL', val.TEL_NO)
  }

  grdMain.value.getGridView().checkRow(popupParams.ROW_IDX, true)*/
}

let arrExpand = []

const grdSub_onCellClicked = (grid, clickData) => {
  //console.log('grid', grid)
  //console.log('clickData', clickData)

  if (clickData.fieldName == 'KOR_NM') {
    if (arrExpand[clickData.itemIndex] == null) {
      arrExpand[clickData.itemIndex] = 'expand'
      grdSub.value.getGridView().expand(clickData.itemIndex)
    } else {
      arrExpand[clickData.itemIndex] = null
      grdSub.value.getGridView().collapse(clickData.itemIndex)
    }
  }
}

// 메뉴버튼
const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    // 조회
    search(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
    searchUnit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  } else if (btn.id === 'btnNew') {
    // 신규

    // 신규 버튼 눌렀을 때는, 무조건 로그인 유저의 직영/협력사 여부로 판단하기 (직영부서 담당자 보여줄지 유무)
    isReviewer.value = userStore.userDiv == 'A' ? false : true

    await newWorkStandard()
    await searchUnit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
    await meetingHistory()
    await reportTabClick()
    await committeeSearch()

    rptList.unitList = []

    grdSub.value.getDataProvider().clearRows()

    await addDefaultUnit()

    // 최종결재(협력사용) 버튼 숨기기
    menuTitle.value.disableBtn('btnRskDel', true)
    menuTitle.value.disableBtn('btnNew', true)
    menuTitle.value.setBtnProperty('btnPartnerApply', 'visible', false)
    // 반려버튼 숨기기
    menuTitle.value.setBtnProperty('btnPartnerReject', 'visible', false)
    isSaved.value = false
  } else if (btn.id === 'btnUpdate') {
    // 저장

    new saveFlowHelper(vm, t)
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(afterSearch)
      //.setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === 'btnReqApply') {
    // 결재
    approvalPopUp('R')    
  } else if (btn.id === 'btnPartnerApply') {
    // 협력사 최종 결재

    let dialogResult = await vm.$swal({
      title: t('최종결재 승인하시겠습니까?'),
      showCancelButton: true,
    })

    if (!dialogResult.isConfirmed) return

    let wType = WORK_STANDARD_MASTER.WORK_STANDARD_KIND == 'D' ? 'WD' : 'R'

    let paramPartner = [
      {
        WORK_TYPE: wType,
        WORK_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
        APP_STATUS: 'Y',
        APPR_USR: userStore.userId,
        RES_COD: '',
        RES_MSG: '',
      },
    ]

    commonExecuteApi({
      queryId: 'PKG_CSX02_COMMON_COMM_APPROVAL_PARTNER',
      list: paramPartner,
    }).then((res) => {
      console.log('res = ', res)
      Message.info(t('결재를 승인 하였습니다.'))

      // 최종결재 버튼 숨기기, disabled 처리
      menuTitle.value.setBtnProperty('btnPartnerApply', 'visible', false)
      // 반려(협력사)버튼 숨기기
      menuTitle.value.setBtnProperty('btnPartnerReject', 'visible', false)
      // 폐지버튼 비활성화
      menuTitle.value.disableBtn('btnRskDel', true)
    })
  } else if (btn.id === 'btnPartnerReject') {
    // 협력사 최종 결재

    let dialogResult = await vm.$swal({
      title: t('결재 반려하시겠습니까?'),
      showCancelButton: true,
    })

    if (!dialogResult.isConfirmed) return

    let wType = WORK_STANDARD_MASTER.WORK_STANDARD_KIND == 'D' ? 'WD' : 'R'

    let paramPartner = [
      {
        WORK_TYPE: wType,
        WORK_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
        APP_STATUS: 'N',
        APPR_USR: userStore.userId,
        RES_COD: '',
        RES_MSG: '',
      },
    ]

    commonExecuteApi({
      queryId: 'PKG_CSX02_COMMON_COMM_APPROVAL_PARTNER',
      list: paramPartner,
    }).then((res) => {
      console.log('res = ', res)
      Message.info(t('결재를 반려 하였습니다.'))

      // 최종결재 버튼 숨기기, disabled 처리
      menuTitle.value.setBtnProperty('btnPartnerApply', 'visible', false)
      // 반려(협력사)버튼 숨기기
      menuTitle.value.setBtnProperty('btnPartnerReject', 'visible', false)
      // 폐지버튼 비활성화
      menuTitle.value.disableBtn('btnRskDel', true)
    })
  } else if (btn.id === 'btnRevision') {
    // 개정

    // new queryFlowHelper(vm, t)
    // .setQuery(checkRevision)
    // .setAfter(revision)
    // .run()    
    revision()
  }
  // 폐지
  else if (btn.id === 'btnRskDel') {
    approvalPopUp('WD')
  }
  // 폐지 취소
  else if (btn.id === 'btnCancelRSKDel') {
    try {
      let dialogResult = await vm.$swal({
        title: t('폐지 취소를 진행하시겠습니까?'),
        showCancelButton: true,
      })

      //console.log('dialogResult.isConfirmed=', dialogResult.isConfirmed)
      if (!dialogResult.isConfirmed) return

      let params = [
        {
          WORK_STANDARD_ID: workId.value,
          USR_ID: userStore.userId,
        },
      ]

      commonExecuteApi({ queryId: 'RSKBA0010_WORK_STANDARD_ABO_R', list: params }).then((res) => {
        Message.success(t('정상적으로 폐지취소 되었습니다.'))
      })

      let wid = WORK_STANDARD_MASTER.WORK_STANDARD_ID

      // 표준서 정보 조회 (.then을 한 이유는, 메인을 먼저 조회한 뒤 나머지 데이터 조회를 위해)
      search(wid).then((res) => {
        // 언어 목록 조회
        transInit(wid)
        // 작업표준서 개정이력
        revisionHistory()
        // 위험성평가 위원회
        committeeSearch()
        // 탭2의 단위작업, 작업행동, 위험요인 조회
        searchUnit(wid)
        // 회의이력 조회
        meetingHistory()
        // 상세리포트 조회
        reportTabClick()

        // 폐지 취소버튼 비활성화
        menuTitle.value.disableBtn('btnCancelRSKDel', true)
      })
    } catch (Exception) {
      //console.log('Exception = ', Exception)
      Message.err(t('폐지 취소에 실패했습니다.'))
    }
  } else if (btn.id === 'btnStandardCopy') {
    // 표준복사
    /*
    if(!isMaster.value) {
      let dialogResult = await vm.$swal({ 
        title: t('작업표준 복사 기능 점검중\r\n이용에 불편을 드려 죄송합니다.')
      })
    }
    else
  */
    openPopup2('표준복사')
  } else if (btn.id === 'btnSimplePrint') {
    // 요약출력
    // showOz.value = true
    // params.value = [
    //   'IN_WORK_STANDARD_ID=' + (!WORK_STANDARD_MASTER.WORK_STANDARD_ID ? '' : WORK_STANDARD_MASTER.WORK_STANDARD_ID),
    //   'IN_TRANS=' + (!WORK_STANDARD_MASTER.IN_TRANS ? '' : WORK_STANDARD_MASTER.IN_TRANS),
    // ]

    //console.log('요약출력 : ', WORK_STANDARD_MASTER)

    if (isEmpty(WORK_STANDARD_MASTER.WORK_STANDARD_ID)) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    commonExcelWrkDetailApi({
      mappingName: 'work_detail',
      IN_EXCEL_TYPE: 'SIMPLE',

      IN_TRANS: WORK_STANDARD_MASTER.TRANS_CD,
      IN_WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      IN_USER_DIV: WORK_STANDARD_MASTER.USER_DIV === 'A' ? 'A' : 'B',
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then((res) => {
      //console.log('res : ', res)

      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        })
      )

      let title =
        '위험성평가_' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '(' +
        WORK_STANDARD_MASTER.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d.getDate().toString().padStart(2, '0') +
        '_' +
        '요약본'

      var fileLink = document.createElement('a')
      //console.log('fileLink : ', fileLink)

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.xlsx')
      document.body.appendChild(fileLink)
      fileLink.click()
    })
  } else if (btn.id === 'btnDetailPrint') {
    // 상세출력
    // showOzDetail.value = true
    // WORK_STANDARD_MASTER.WORK_STANDARD_ID = 'HHIS-CW-A0000032-031-01'
    // params.value = [
    //   'IN_WORK_STANDARD_ID=' + (!WORK_STANDARD_MASTER.WORK_STANDARD_ID ? '' : WORK_STANDARD_MASTER.WORK_STANDARD_ID),
    //   'IN_TRANS=' + (!WORK_STANDARD_MASTER.IN_TRANS ? '' : WORK_STANDARD_MASTER.IN_TRANS),
    // ]
    //console.log('상세출력 : ', WORK_STANDARD_MASTER)

    if (isEmpty(WORK_STANDARD_MASTER.WORK_STANDARD_ID)) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    commonExcelWrkDetailApi({
      mappingName: 'work_detail',
      IN_EXCEL_TYPE: 'STD',

      IN_TRANS: WORK_STANDARD_MASTER.TRANS_CD,
      IN_WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      IN_USER_DIV: WORK_STANDARD_MASTER.USER_DIV === 'A' ? 'A' : 'B',
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then((res) => {
      //console.log('res : ', res)

      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        })
      )

      let title =
        '위험성평가_' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '(' +
        WORK_STANDARD_MASTER.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d.getDate().toString().padStart(2, '0') +
        '_' +
        '상세본'

      var fileLink = document.createElement('a')

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.xlsx')
      document.body.appendChild(fileLink)
      fileLink.click()
    })
  } else if (btn.id === 'btnWordPrint') {
    // 워드출력

    //console.log('워드출력 : ', WORK_STANDARD_MASTER)

    if (isEmpty(WORK_STANDARD_MASTER.WORK_STANDARD_ID)) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    if (WORK_STANDARD_MASTER.TRANS_CD !== 'ko') {
      return Message.warn(t('워드출력은 번역 지원이 되지 않습니다.'))
    }
    //console.log('in_work_standard_id = ', WORK_STANDARD_MASTER.WORK_STANDARD_ID)
    //commonWordExportApi({ IN_TRANS: 'ko', IN_WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
    commonWordExportApiVer2({
      IN_TRANS: 'ko',
      IN_WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then((res) => {
      //console.log('res : ', res)

      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        })
      )

      let title =
        '위험성평가_' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '(' +
        WORK_STANDARD_MASTER.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d.getDate().toString().padStart(2, '0')

      var fileLink = document.createElement('a')

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.docx')
      document.body.appendChild(fileLink)
      fileLink.click()
    })
  } else if (btn.id == 'btnWordPrintAdmin') {
    //관리자용 워드출력(파일서버 생성)

    if (isEmpty(WORK_STANDARD_MASTER.WORK_STANDARD_ID)) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    if (WORK_STANDARD_MASTER.TRANS_CD !== 'ko') {
      return Message.warn(t('워드출력은 번역 지원이 되지 않습니다.'))
    }

    commonWordExportApiVer2({
      IN_TRANS: 'ko',
      IN_WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      IN_ADMIN: 'Y',
    }).then((res) => {
      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        })
      )

      let title =
        '위험성평가_' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '(' +
        WORK_STANDARD_MASTER.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d.getDate().toString().padStart(2, '0')

      var fileLink = document.createElement('a')

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.docx')
      document.body.appendChild(fileLink)
      fileLink.click()

      //console.log('res : ', res)
    })
  } else if (btn.id == 'btnSendMail') {
    sendMail()
  }
}

const sendMail = () => {
  let mailForm = {
    TO_EMP_NO: [], // 받음(사번)
    TO_EMP_NM: [], // 받음(성명)
  }

  for (let i in codeList.committee) {
    if (codeList.committee[i]) {
      const index1 = codeList.committee[i].indexOf('(')
      const index2 = codeList.committee[i].indexOf(')')
      const space = codeList.committee[i].indexOf(' ')

      mailForm.TO_EMP_NO.push(codeList.committee[i].substring(index1 + 1, index2) + '@hd.com')
      mailForm.TO_EMP_NM.push(codeList.committee[i].substring(0, space))
    }
  }

  if (mailForm.TO_EMP_NO.length > 0) {
    mailPopup.value.openPopup(mailForm)
  } else {
    Message.warn('등록된 위원이 없습니다.')
  }
}

const openPopup2 = (gbn, id) => {
  if (gbn === '위험요인') {
    //console.log('위험요인 id = ', id)
    partsArray = id.split('_')
    rSKBA0010popup2.value.openPopup()
  } else if (gbn === '감소대책') {
    partsArray = id.split('_')
    rSKBA0010popup3.value.openPopup()
  } else if (gbn === '사고정보') {
    rSKBA0010popup4.value.openPopup()
  } else if (gbn === '사고') {
    dialogSAFAB0020.value = true
    isApproval.value = true
  } else if (gbn === '현장위험성평가') {
    dialogSAFCA0010.value = true
    isApproval.value = true
  } else if (gbn === '안전작업요구권') {
    dialogSAFEA0010.value = true
    isApproval.value = true
    //rSAFEA0010.value.openPopup()
  } else if (gbn === '안전리스크') {
    //console.log('WORK_STANDARD_MASTER', WORK_STANDARD_MASTER)
    dialogSRMAA0030.value = true
    isApproval.value = true
  } else if (gbn === '표준복사') {
    rSKBA0010popup5.value.openPopup()
  } else if (gbn === '회의이력') {
    rSKBA0010popup6.value.openPopup()
  } else if (gbn === '비일상작업') {
    dialog.value = true
  } else if (gbn === 'addFile') {
    console.log('AAAAAAAA')
    console.log('sItemlevel = ', sItemLevel.value)

    if (sItemLevel.value == null) {
      Message.err(t('선택된 행이 없습니다.'))

      return
    }

    if (sItemLevel.value != '2') {
      Message.err(t('파일 첨부할 [작업행동]을 선택해주세요.'))

      return
    }

    console.log('WORK_STANDARD_ACT = ', WORK_STANDARD_ACT)

    let dd = WORK_STANDARD_ACT.find((x) => x.id == sItem)

    fileSave()
  }
}

// 저장 후 조회
const afterSearch = (res) => {
  console.log('save 이후 res 정보 확인 = ', res)
  // 저장 후, SAVE_STATUS를 U로 바꿔주지 않으면 저장버튼 다시 눌렀을 때 back단에서 번호 채번 다시함
  WORK_STANDARD_MASTER.SAVE_STATUS = 'U'

  let rtnWorkId = res.returnValue

  WORK_STANDARD_MASTER.WORK_STANDARD_ID = rtnWorkId != null ? rtnWorkId : WORK_STANDARD_MASTER.WORK_STANDARD_ID
  WORK_STANDARD_MASTER.WORK_STANDARD_ID_VIEW = rtnWorkId != null ? rtnWorkId : WORK_STANDARD_MASTER.WORK_STANDARD_ID

  if(!isSaved.value){
    searchUnit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  }
  isSaved.value = true
  
  /*
  if (WORK_STANDARD_MASTER.WORK_STANDARD_ID !== '' || WORK_STANDARD_MASTER.WORK_STANDARD_ID !== undefined) {
    Promise.all([       
      commonSearchApi({ queryId : 'RSKBA0010_SEARCH_04', param: { WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID } }),
    ]).then(res => {
      let data = res[0].ORESULT_CUR
      
      WORK_STANDARD_MASTER.WORK_STANDARD_ID = res[0].ORESULT_CUR.WORK_STANDARD_ID
      WORK_STANDARD_MASTER.SAVE_TYPE = isRevision.value ? 'U' : 'C'
      WORK_STANDARD_MASTER.SAVE_STATUS = isRevision.value ? 'C' : 'U'
      WORK_STANDARD_MASTER.COMPANY_CD = res[0].ORESULT_CUR.COMPANY_CD
      WORK_STANDARD_MASTER.DEPT_CD = res[0].ORESULT_CUR.DEPT_CD
      WORK_STANDARD_MASTER.DEPT_NM = res[0].ORESULT_CUR.DEPT_NM
      WORK_STANDARD_MASTER.CORP_ASGN_CD = res[0].ORESULT_CUR.CORP_ASGN_CD
      WORK_STANDARD_MASTER.CORP_ASGN_NM = res[0].ORESULT_CUR.CORP_ASGN_NM
      WORK_STANDARD_MASTER.GUBUN_NM = res[0].ORESULT_CUR.GUBUN_NM
      WORK_STANDARD_MASTER.GUBUN_CD = res[0].ORESULT_CUR.GUBUN_CD
      WORK_STANDARD_MASTER.WORK_STANDARD_NO = res[0].ORESULT_CUR.WORK_STANDARD_NO
      WORK_STANDARD_MASTER.WORK_STANDARD_REVISION = res[0].ORESULT_CUR.WORK_STANDARD_REVISION
      WORK_STANDARD_MASTER.WORK_STANDARD_NM = res[0].ORESULT_CUR.WORK_STANDARD_NM
      WORK_STANDARD_MASTER.WORK_TOOLS = res[0].ORESULT_CUR.WORK_TOOLS
      WORK_STANDARD_MASTER.EQUIPMENT_TYPE = res[0].ORESULT_CUR.EQUIPMENT_TYPE
      WORK_STANDARD_MASTER.USE_CHEMICAL = res[0].ORESULT_CUR.USE_CHEMICAL
      WORK_STANDARD_MASTER.REVIEWER = res[0].ORESULT_CUR.REVIEWER      
      WORK_STANDARD_MASTER.PROGRESS_STATUS = isRevision.value
        ? 'UP_AW'
        : res[0].ORESULT_CUR.PROGRESS_STATUS
      WORK_STANDARD_MASTER.WORK_STANDARD_KIND = isRevision.value
        ? 'U'
        : res[0].ORESULT_CUR.WORK_STANDARD_KIND
      WORK_STANDARD_MASTER.RISK_TYPE = isRevision.value
        ? ''
        : res[0].ORESULT_CUR.RISK_TYPE      
      WORK_STANDARD_MASTER.RISK_TYPE_NM = isRevision.value
        ? ''
        : res[0].ORESULT_CUR.RISK_TYPE 
      WORK_STANDARD_MASTER.C_DATE = res[0].ORESULT_CUR.C_DATE
      WORK_STANDARD_MASTER.U_DATE = isRevision.value
        ? dayjs().format('YYYY-MM-DD')
        : res[0].ORESULT_CUR.U_DATE

      if (res[0].ORESULT_CUR.U_DATE === null && res[0].ORESULT_CUR.C_DATE === null) {
        WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
      } else {
        if (['CC_AC', 'UC_AC'].includes(res[0].ORESULT_CUR.PROGRESS_STATUS)) {
          WORK_STANDARD_MASTER.WORK_DATE =
            res[0].ORESULT_CUR.U_DATE === null ? res[0].ORESULT_CUR.C_DATE : res[0].ORESULT_CUR.U_DATE
          if (isRevision.value) {
            WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
          }
        } else {
          if (isRevision.value) {
            WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
          } else {
            WORK_STANDARD_MASTER.WORK_DATE = res[0].ORESULT_CUR.U_DATE
          }
        }
      }
    })  
  } 
  */

  //2024.11.20 주석처리
  //router.push('/20_risk-assessment/RSK_B/RSKBA0020')

  window.sessionStorage.setItem('RSKBA0020_RELOAD', 'Y')
}

const selectEvent = (type, data) => {
  if (type === 'unit') {
    WORK_STANDARD_UNIT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_ACT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_RISK.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })
    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === data.UNIT_ID).IS_SELECT = true

    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === data.UNIT_ID).IS_CHECK = 'Y'

    isUnitRemove.value = isActAdd.value = false
  } else if (type === 'act') {
    WORK_STANDARD_UNIT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === data.UNIT_ID).IS_SELECT = true

    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === data.UNIT_ID).IS_CHECK = 'Y'

    WORK_STANDARD_ACT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_RISK.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_ACT.find((t) => t.ACT_ID === data.ACT_ID).IS_SELECT = true

    WORK_STANDARD_ACT.find((t) => t.ACT_ID === data.ACT_ID).IS_CHECK = 'Y'

    isActRemove.value = isActSelect.value = isRiskAdd.value = false

    if (WORK_STANDARD_ACT.find((t) => t.ACT_ID === data.ACT_ID).IS_SAVE === 'Y') {
      isActSelect.value = false
    }

    if (WORK_STANDARD_ACT.find((t) => t.ACT_ID === data.ACT_ID).IMG_CNT === 0) {
      isActSelectColor = 'gray'
    } else {
      isActSelectColor = 'green'
    }
  } else if (type === 'risk') {
    WORK_STANDARD_UNIT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_ACT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_UNIT.find(
      (t) => t.UNIT_ID === WORK_STANDARD_ACT.find((x) => x.ACT_ID === data.ACT_ID).UNIT_ID
    ).IS_SELECT = true

    WORK_STANDARD_UNIT.find(
      (t) => t.UNIT_ID === WORK_STANDARD_ACT.find((x) => x.ACT_ID === data.ACT_ID).UNIT_ID
    ).IS_CHECK = 'Y'

    WORK_STANDARD_ACT.find((t) => t.ACT_ID === data.ACT_ID).IS_SELECT = true

    WORK_STANDARD_ACT.find((t) => t.ACT_ID === data.ACT_ID).IS_CHECK = 'Y'

    WORK_STANDARD_RISK.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'
      return t
    })

    WORK_STANDARD_RISK.find((t) => t.RISK_ID === data.RISK_ID).IS_SELECT = true

    WORK_STANDARD_RISK.find((t) => t.RISK_ID === data.RISK_ID).IS_CHECK = 'Y'

    isRiskRemove.value = false
  }
}

// 세부내용 저장
const saveData = () => {
  // PKG_RSKBA0010.WORK_STANDARD_UNIT_S
  //return commonSearchApi({ queryId: "RSKBA0010_SEARCH_05", param: { WORK_STANDARD_ID : WORK_STANDARD_MASTER.WORK_STANDARD_ID }  }).then( res => {

  let UNIT = reactive([])
  let ACT = reactive([])
  let RISK = reactive([])

  WORK_STANDARD_UNIT = []
  WORK_STANDARD_ACT = []
  WORK_STANDARD_RISK = []

  let UNIT_SORT = 1

  // 대분류 체크한 값
  // UNIT = ArrayList.value.filter(unit => unit.IS_CHECK === 'Y')
  UNIT = ArrayList.value
  // let unitCheck = ArrayList.value.filter(unit => unit.SAVE_TYPE === 'D')

  UNIT.forEach((item) => {
    WORK_STANDARD_UNIT.push({
      DATA_STATUS: item.DATA_STATUS,
      IS_CHECK: item.IS_CHECK,
      IS_SAVE: item.IS_SAVE,
      IS_SELECT: item.IS_SELECT,
      IS_SUCCESS: item.IS_SUCCESS,
      STATUS: item.STATUS,
      UNIT_NM: item.UNIT_NM,
      UNIT_ID: item.UNIT_ID,
      ORA_YN: item.ORA_YN,
      WORK_STANDARD_ID: item.WORK_STANDARD_ID,
      UNIT_SORT: UNIT_SORT,
      SAVE_TYPE: item.SAVE_TYPE,
    })

    UNIT_SORT += 1
  })

  console.log('[UNIT] 2 =', WORK_STANDARD_UNIT)

  for (let i = 0; i < ArrayList.value.length; i++) {
    let ACT_SORT = 1
    // let act = ArrayList.value[i].child.filter(act => act.IS_CHECK === 'Y')
    let act = ArrayList.value[i].child

    if (act.length > 0) {
      //중분류
      // ACT =  ArrayList.value[i].child.filter(act => act.IS_CHECK === 'Y')
      ACT = ArrayList.value[i].child
      //console.log('ACT1.value : ',ACT)
      ACT.forEach((item) => {
        WORK_STANDARD_ACT.push({
          ACT_ID: item.ACT_ID,
          DATA_STATUS: item.DATA_STATUS,
          IS_CHECK: item.IS_CHECK,
          IS_SAVE: item.IS_SAVE,
          IS_SELECT: item.IS_SELECT,
          IS_SUCCESS: item.IS_SUCCESS,
          STATUS: item.STATUS,
          ACT_NM: item.ACT_NM,
          CHK_NM: item.CHK_NM,
          UNIT_ID: item.UNIT_ID,
          WORK_STANDARD_ID: item.WORK_STANDARD_ID,
          ACT_SORT: ACT_SORT,
        })
        ACT_SORT += 1
      })
    }

    console.log('[ACT] 2 =', WORK_STANDARD_ACT)

    for (let j = 0; j < ArrayList.value[i].child.length; j++) {
      let RISK_SORT = 1
      // let risk = ArrayList.value[i].child[j].child.filter(act => act.IS_CHECK === 'Y')
      let risk = ArrayList.value[i].child[j].child

      if (risk.length > 0) {
        console.log('[ArrayList]  =', ArrayList.value)
        //소분류
        // RISK = ArrayList.value[i].child[j].child.filter(risk => risk.IS_CHECK === 'Y')
        RISK = ArrayList.value[i].child[j].child
        RISK.forEach((item) => {
          WORK_STANDARD_RISK.push({
            ACT_ID: item.ACT_ID,
            DATA_STATUS: item.DATA_STATUS,
            IS_CHECK: item.IS_CHECK,
            IS_SAVE: item.IS_SAVE,
            IS_SELECT: item.IS_SELECT,
            IS_SUCCESS: item.IS_SUCCESS,
            RISK_ID: item.RISK_ID,
            STATUS: item.STATUS,
            RISK_NM: item.RISK_NM,
            RISK_CD: item.RISK_CD,
            SAFE_NM: item.SAFE_NM,
            RM_NM: item.RM_NM,
            RM_CD: item.RM_CD,
            BEFOR_FRE: item.BEFOR_FRE,
            BEFOR_MAT: item.BEFOR_MAT,
            AFTER_FRE: item.AFTER_FRE,
            AFTER_MAT: item.AFTER_MAT,
            BEFOR_TOTAL: '',
            AFTER_TOTAL: '',
            UNIT_ID: item.UNIT_ID,
            WORK_STANDARD_ID: item.WORK_STANDARD_ID,
            RISK_SORT: RISK_SORT,
          })
          RISK_SORT += 1
        })
      }
    }

    console.log('[RISK] 2 =', WORK_STANDARD_RISK)
  }

  WORK_STANDARD_UNIT = WORK_STANDARD_UNIT.map((item) => {
    const newItem = { ...item }
    if (newItem.hasOwnProperty('child')) {
      delete newItem.child
    }
    return newItem
  })

  //console.log('check WORK_STANDARD_UNIT : ', WORK_STANDARD_UNIT)
  //console.log('check WORK_STANDARD_ACT : ' , WORK_STANDARD_ACT)
  //console.log('check WORK_STANDARD_RISK : ' , WORK_STANDARD_RISK)

  saveParam.UNIT = WORK_STANDARD_UNIT
  saveParam.ACT = WORK_STANDARD_ACT
  saveParam.RISK = WORK_STANDARD_RISK

  console.log('saveParam : ', saveParam)

  return setTrans()
  //})
}

const afterSave = (res) => {
  console.log('성공했다면 = ', res)
}

const setTrans = (res) => {
  WORK_STANDARD_MASTER.IS_SAVE = 'Y' // IS_SAVE: 'Y'인 경우에 저장 버튼 눌러 저장가능

  // PKG_RSKBA0010.WORK_STANDARD_UNIT_M
  console.log('RSKBA0010_SAVE_02 실행 = ', WORK_STANDARD_MASTER)
  return commonRskSaveApi({
    queryId: 'RSKBA0010_SAVE_02',
    WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
    DEPT_CD: WORK_STANDARD_MASTER.DEPT_CD,
    USR_ID: WORK_STANDARD_MASTER.USR_ID,
    MASTER: WORK_STANDARD_MASTER,
    unitList: WORK_STANDARD_UNIT,
    actList: WORK_STANDARD_ACT,
    riskList: WORK_STANDARD_RISK,
  })
}

const validationCheck = () => {
  //console.log('validationCheck')
  if (isAbolition.value) {
    onButtonsClick({ id: 'btnRskDel' })
  } else {
    /*******************    표준서 정보   ***************** */
    if (WORK_STANDARD_MASTER.GUBUN_CD === '') {
      Message.warn('구분을 선택하세요.')
      return false
    }

    /* if (WORK_STANDARD_MASTER.WORK_STANDARD_ID === '' && !isRevision.value) {
      Message.warn('신규 버튼을 눌러 표준번호를 등록하세요.')
      return false
    } */

    if (WORK_STANDARD_MASTER.WORK_STANDARD_NM === '') {
      Message.warn('표준서명을 입력하세요.')
      return false
    }

    if (WORK_STANDARD_MASTER.WORK_STANDARD_DESC === '') {
      Message.warn('제/개정사유를 입력하세요.')
      return false
    }
    //console.log('생산팀장 없는데? ', WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM)

    if (WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM == null || WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM == '') {
      // 직영인 경우에만 생산팀장 등록 해야함
      if (userStore.userDiv == 'A') {
        Message.warn('담당자(생산팀장)을 등록하세요.')
        return false
      }
    }

    if (
      WORK_STANDARD_MASTER.RISK_TYPE === '' ||
      WORK_STANDARD_MASTER.RISK_TYPE === null ||
      WORK_STANDARD_MASTER.RISK_TYPE === undefined
    ) {
      Message.warn('평가유형을 선택하세요.')
      return false
    }

    if (WORK_STANDARD_MASTER.WORK_TOOLS === '' || WORK_STANDARD_MASTER.WORK_TOOLS === null) {
      Message.warn('작업도구를 입력하세요.')
      return false
    }

    if (WORK_STANDARD_MASTER.EQUIPMENT_TYPE === '' || WORK_STANDARD_MASTER.EQUIPMENT_TYPE === null) {
      Message.warn('장비 및 설비를 입력하세요.')
      return false
    }

    if (WORK_STANDARD_MASTER.USE_CHEMICAL === '' || WORK_STANDARD_MASTER.USE_CHEMICAL === null) {
      Message.warn('사용 화학물질정보를 입력하세요.')
      return false
    }

    if(WORK_STANDARD_MASTER.WORK_STANDARD_ID_VIEW){

      //console.log('validationCheck222')

      // /*******************    세부내용   ***************** */
      let unitList = ArrayList.value.filter((x) => x.STATUS !== 'D')
      let actList = []
      let riskList = []
      let unitCheck = 0
      let actCheck = 0
      let riskCheck = 0
      let riskGbn

      // 개선후 입력 유무 확인
      let isAfter = true
      // 개선전/후 저장 여부
      let isRisk = true
      // 개선후 빈도 (현재의 위험성이 8점 이하인 경우)
      let isRisk2 = true
      // 개선전 위험성
      let beforeSum = 0
      // 개선후 위험성
      let afterSum = 0

      let checkUnit = true
      let checkAct1 = true
      let checkAct2 = true
      let checkCD_NM = true
      let checkRISK_NM = true
      let before1 = true
      let before_safe = true
      let after_rm_cd = true
      let after1 = true
      let after2 = true

      let arrAfter1 = []
      let arrAfter2 = []
      let arrRM_CD_P_NM = []
      let arrRM_NM = []

      // 단위작업
      unitList.forEach((unit) => {
        if (unit.UNIT_NM == '' || unit.UNIT_NM == undefined) {
          unitCheck = unitCheck + 1
          checkUnit = false
        }

        if (unit.child) {
          actList = unit.child.filter((x) => x.STATUS !== 'D')
          actList.forEach((act) => {
            if (act.ACT_NM == '' || act.ACT_NM === undefined) {
              actCheck = actCheck + 1
              checkAct1 = false
            }

            if (act.CHK_NM == '') {
              checkAct2 = false
            }

            if (act.child) {
              riskList = act.child.filter((x) => x.STATUS !== 'D')
              riskList.forEach((risk) => {
                //console.log('risk.RISK_CD_D_NM ::: ', risk.RISK_CD_D_NM)
                if (isEmpty(risk.RISK_CD_D_NM)) {
                  checkCD_NM = false
                }

                if (isEmpty(risk.RISK_NM)) {
                  checkRISK_NM = false
                }

                if (isEmpty(risk.BEFOR_FRE)) {
                  before1 = false
                }

                if (isEmpty(risk.SAFE_NM)) {
                  before_safe = false
                }

                if (isEmpty(risk.RM_CD_P_NM)) {
                  after_rm_cd = false
                }

                if (isEmpty(risk.AFTER_FRE)) {
                  after1 = false
                }

                if (isEmpty(risk.RM_NM)) {
                  after2 = false
                }

                beforeSum = risk.BEFOR_FRE * risk.BEFOR_MAT
                afterSum = risk.AFTER_FRE * risk.AFTER_MAT

                arrAfter1.push(beforeSum)
                arrAfter2.push(afterSum)
                arrRM_CD_P_NM.push(risk.RM_CD_P_NM)
                arrRM_NM.push(risk.RM_NM)

                // 현재의 위험성이 8이상인 경우
                if (beforeSum >= 8) {
                  // 개선 후 위험성의 값이 하나라도 비어있으면 예외 처리
                  if (risk.AFTER_FRE * risk.AFTER_MAT == 0) isAfter = false

                  // 개선후 위험성이 현재의 위험성보다 크거나 같으면 안됨
                  if (beforeSum <= afterSum) {
                    isRisk = false
                  }
                } else {
                  // 개선후 위험성이 현재의 위험성보다 크면 안됨
                  if (beforeSum < afterSum) {
                    isRisk2 = false
                  }
                }

                // 개선전/후 위험성이 모두 1인 경우에는 예외 처리
                if (beforeSum == 1 && afterSum == 1) isRisk = true
              })
            }
          })
        }
      })

      console.log('beforeSum = ', beforeSum)
      console.log('afterSum = ', afterSum)

      for (let i = 0; i < arrAfter1.length; i++) {
        if (arrAfter1[i] >= 8) {
          let bSum = arrAfter1[i]
          let aSum = arrAfter2[i]

          if (bSum <= aSum) {
            //highLight(i)
            Message.warn(t(i + 1 + '번째 개선후 위험성은 현재의 위험성 [미만]이어야 합니다.'))
            return false
          }

          // 개선 후 위험성의 값이 하나라도 비어있으면 예외 처리
          if (aSum == 0 || aSum == null) {
            Message.warn(t(i + 1 + '번째 개선 후 빈도/강도를 입력해주세요.'))
            return false
          }

          if (arrRM_CD_P_NM[i] == null || arrRM_CD_P_NM[i] == '') {
            Message.warn(t(i + 1 + '번째 [감소분류]를 입력해주세요.'))
            return createFromCapabilitiesMatrixSet
          }

          if (arrRM_NM[i] == null || arrRM_NM[i] == '') {
            Message.warn(t(i + 1 + '번째 [감소대책 상세내용]을 입력해주세요.'))
            return false
          }
        }

        if (arrAfter1[i] < 8) {
          let bSum = arrAfter1[i]
          let aSum = arrAfter2[i]

          if (bSum < aSum) {
            Message.warn(t(i + 1 + '번째 개선후 위험성은 현재의 위험성 [이하]이어야 합니다.'))
            return false
          }

          /* if (aSum > 0 && (arrRM_NM[i] == null || arrRM_NM[i] == '')) {
            Message.warn(t(i + 1 + '번째 [감소대책 상세내용]을 입력해주세요.'))
            return false
          } */
        }
      }

      // if(!isRisk) {
      //   Message.warn(t('현재의 위험성보다 [개선 후] 위험성이 더 낮아야합니다.'))
      //   return false
      // }

      // if(!isRisk2) {
      //   Message.warn(t('현재의 위험성보다 [개선 후] 위험성이 더 낮거나 같아야 합니다.'))
      //   return false
      // }

      console.log('after1 = ', after1)
      console.log('after2 = ', after2)
      console.log('beforeSum = ', beforeSum)

      if (!checkUnit) {
        Message.warn(t('단위작업 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        return false
      }

      if (!checkAct1) {
        Message.warn(t('[작업행동] 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        return false
      }

      if (!checkAct2) {
        //Message.warn(t('[체크정보] 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        //return false
      }

      if (!checkCD_NM) {
        Message.warn(t('위험요인 [분류] 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        return false
      }

      if (!checkRISK_NM) {
        Message.warn(t('[위험요인 상세내용] 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        return false
      }

      if (!before1) {
        Message.warn(t('현재의 빈도, 강도가 미입력 상태입니다.<br/>선택 후 저장해주세요.'))
        return false
      }

      if (!before_safe) {
        Message.warn(t('현재의 안전조치 내용 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        return false
      }

      /* if (!after1 && beforeSum >= 8) {
        Message.warn(t('개선 후 위험성 빈도, 강도가 미입력 상태입니다.<br/>선택 후 저장해주세요.'))
        return false
      }

      if (!after_rm_cd && beforeSum >= 8) {
        Message.warn(t('[감소분류] 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        return false
      }

      if (!after2 && beforeSum >= 8) {
        Message.warn(t('[감소대책 상세내용] 미입력 상태입니다.<br/>내용 입력후 저장해주세요.'))
        return false
      } */
    }
  }
  return true
}

const highLight = (z) => {
  console.log('i = ', z)

  const ele = document.getElementsByClassName('show-color')
  const ele2 = document.getElementsByClassName('box-highlight')

  for (let i = 0; i < ele.length; i++) {
    ele[i].classList.remove('show-color')
  }

  for (let i = 0; i < ele2.length; i++) {
    ele2[i].classList.add('show-color')
  }

  /*
  console.log('i번째 = ', WORK_STANDARD_RISK)

  const hClass = `${'card3_1_1_3'}`
  const doc = document.getElementById(hClass)

console.log('hClass = ', hClass)

  doc.classList.add('light')*/
}

/* ---------- 신규 제정 폐지 ---------- */
const deleteData = () => {
  let param = [
    {
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      WORK_STANDARD_DESC: WORK_STANDARD_MASTER.WORK_STANDARD_DESC,
      USR_ID: WORK_STANDARD_MASTER.USR_ID,
    },
  ]

  return commonExecuteApi({ queryId: 'RSKBA0010_DELETE_01', list: param })
}

const beforeDelete = () => {
  let rowNum = WORK_STANDARD_MASTER.WORK_STANDARD_ID
  apprType.value = 'WD'

  if (rowNum.length === 0) {
    Message.warn(t('삭제할 데이터가 없습니다.'))

    return
  }

  return true
}

const afterData = (res) => {
  //
  isRevision.value = false
  isUnitRemove.value = true
  isActAdd.value = true
  isActRemove.value = true
  isActSelect.value = true
  isRiskAdd.value = true
  isRiskRemove.value = true

  // search(res.postResult.returnValue)
  search()
}

// 작업표준ID, 작업표준번호 가져오기
const init = (gbn) => {
  // gbn - 1 : 신규

  // 직영인 경우 DEPT_CD, 협력사인 경우 ASGN_CD
  let deptCode = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd

  // GET_WORK_STANDARD_NO
  commonSearchApi({ queryId: 'RSKBA0010_SEARCH_03', param: { DEPT_CD: deptCode } }).then((res) => {
    WORK_STANDARD_MASTER.WORK_STANDARD_ID = res.OUT_DATA + '-' + '001'
    WORK_STANDARD_MASTER.WORK_STANDARD_NO = res.OUT_DATA
    WORK_STANDARD_MASTER.WORK_STANDARD_REVISION = '001'

    menuTitle.value.disableBtn('btnUpdate', false)

    // if(gbn === '1'){
    //   let d = new Date()
    //   let isUnitId = []

    //   let maxId = ((ArrayList.value.reduce((max, obj) => Math.max(max, obj['id']), 0))+1).toString()
    //   let maxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)
    //   for (let el of ArrayList.value) {
    //     isUnitId.push(el.UNIT_ID.slice(-3))
    //   }
    //   let autoUnitId = isUnitId.length === 0 ? '001' : (Math.max(...isUnitId) + 1).toString().padStart(3, '0')
    //   let NEW_UNIT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-U' + autoUnitId

    //   ArrayList.value.push({ level: 1, id: maxId, idx : (maxIdx + 1), text: '' + maxId, child: [],
    //     UNIT_ID: NEW_UNIT_ID,
    //     WORK_STANDARD_ID : WORK_STANDARD_MASTER.WORK_STANDARD_ID,
    //     DATA_STATUS: 'N',
    //     STATUS: 'C',
    //     IS_CHECK: 'N',
    //     IS_SAVE: 'N',
    //     IS_SELECT: false,
    //     IS_SUCCESS: '',
    //     SAVE_TYPE:'C',
    //   })
    // }
  })
}

// 위험성평가위원회 조회
const committeeSearch = async () => {
  // todo : 위원회
  const params = {
    CMPNY_DIV: WORK_STANDARD_MASTER.COMPANY_CD,
    BSNS_CD: WORK_STANDARD_MASTER.BSNS_CD,
    //BSNS_CD를 로그인자 BSNSCD를 가져와서 작업표준 제정 팝업 시 휘험성평가 위원회가 조회가 되지않아서 변경
    BSNS_CD: WORK_STANDARD_MASTER.BSNS_CD_ORIGIN,
    //BSNS_CD: 'AE00',
    DEPT_CD: WORK_STANDARD_MASTER.DEPT_CD,
    //WORK_STANDARD_NO: 'HHIS-CW-C710-088-01',
  }
  //console.log('위원회 조회 파라미터 = ', params)
  // PKG_RSKBA0010.GET_WORK_COMMITTEE_S
  await commonSearchApi({ queryId: 'RSKBA0010_SEARCH_23', param: params }).then((res) => {
    let data = res.ORESULT_CUR[0]

    if (data == null) return

    codeList.committee.COMMITTEE_OPS =
      data.OPS_COMMITTEE_NM + ' ' + data.OPS_COMMITTEE_PO + ' (' + data.OPS_COMMITTEE + ')'
    codeList.committee.COMMITTEE_DEPT =
      data.EXEC_COMMITTEE_DEPT_EMP_NM + ' ' + data.EXEC_COMMITTEE_DEPT_POSI + ' (' + data.EXEC_COMMITTEE_DEPT + ')'
    codeList.committee.COMMITTEE_ASSOC =
      data.EXEC_COMMITTEE_ASSOC_EMP_NM + ' ' + data.EXEC_COMMITTEE_ASSOC_POSI + ' (' + data.EXEC_COMMITTEE_ASSOC + ')'

    /*
    codeList.committee[0].no1 = '운영위원'
    codeList.committee[0].no2 = res.ORESULT_CUR[0].OPS_COMMITTEE_NM
    codeList.committee[0].no3 = res.ORESULT_CUR[0].OPS_COMMITTEE_PO
    codeList.committee[0].no4 = res.ORESULT_CUR[0].OPS_COMMITTEE

    codeList.committee[1].no1 = '실행위원(부서추천)'
    codeList.committee[1].no2 = res.ORESULT_CUR[0].EXEC_COMMITTEE_DEPT_EMP_NM
    codeList.committee[1].no3 = res.ORESULT_CUR[0].EXEC_COMMITTEE_DEPT_POSI
    codeList.committee[1].no4 = res.ORESULT_CUR[0].EXEC_COMMITTEE_DEPT

    codeList.committee[2].no1 = '실행위원(조합추천)'
    codeList.committee[2].no2 = res.ORESULT_CUR[0].EXEC_COMMITTEE_ASSOC_EMP_NM
    codeList.committee[2].no3 = res.ORESULT_CUR[0].EXEC_COMMITTEE_ASSOC_POSI
    codeList.committee[2].no4 = res.ORESULT_CUR[0].EXEC_COMMITTEE_ASSOC*/
  })
}

// 작업표준서 개정이력 조회
const revisionHistory = async () => {
  //PKG_RSKBA0010.REVISION_HISTORY_S
  await commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_24',
    param: { WORK_STANDARD_NO: WORK_STANDARD_MASTER.WORK_STANDARD_NO },
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

// 위험요인 분류 조회
const riskCdInit = () => {
  return commonSearchApi({ queryId: 'RSKBA0010_SEARCH_02', param: { TYPE: 'RISK_CD' } })
}

// 위험요인 분류 조회
const rmCdInit = () => {
  commonSearchApi({ queryId: 'RSKBA0010_SEARCH_02', param: { TYPE: 'RM_CD', COMM_CD: 'RM_CD' } }).then((res) => {
    if (res.length > 0) {
      rmCdList = res[0].ORESULT_CUR.CODE_ID
    }
  })
}
const clearAll = () => {
  console.log('CHK RE = ', WORK_STANDARD_MASTER.CHK_REQUIRED)
}
const transInit = async (id) => {
  cmbTrans.value = []

  let ko = cmbTrans.value.find((x) => x.TRANS_CD == 'ko')

  if (ko == undefined) cmbTrans.value.push({ TRANS_CD: 'ko', TRANS_NM: '한국어' })

  // 언어 목록 조회
  await commonSearchApi({ queryId: 'RSKBA0010_SEARCH_32', param: { WORK_STANDARD_ID: id } }).then((res) => {
    res.ORESULT_CUR.forEach((el) => {
      if (el.EN_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'en', TRANS_NM: '영어' })
      }

      if (el.VI_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'vi', TRANS_NM: '베트남어' })
      }

      if (el.UZ_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'uz', TRANS_NM: '우즈베크어' })
      }

      if (el.MN_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'mn', TRANS_NM: '몽골어' })
      }

      if (el.SI_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'si', TRANS_NM: '신할라어' })
      }

      if (el.TH_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'th', TRANS_NM: '태국어' })
      }

      if (el.RU_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ru', TRANS_NM: '러시아어' })
      }

      if (el.JA_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ja', TRANS_NM: '일본어' })
      }

      if (el.ZH_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'zh', TRANS_NM: '중국어간체' })
      }

      if (el.ZH_TW_TRANS === 'Y') {
        cmbTrans.value.push({
          TRANS_CD: 'zh-TW',
          TRANS_NM: '중국어번체',
        })
      }

      if (el.DE_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'de', TRANS_NM: '독일어' })
      }

      if (el.FR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'fr', TRANS_NM: '프랑스어' })
      }

      if (el.AR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ar', TRANS_NM: '아랍어' })
      }

      if (el.ID_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'id', TRANS_NM: '인도네시아어' })
      }

      if (el.NE_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ne', TRANS_NM: '네팔어' })
      }

      if (el.BN_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'bn', TRANS_NM: '벵골어' })
      }

      if (el.FIL_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'fil', TRANS_NM: '필리핀어' })
      }

      if (el.HI_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'hi', TRANS_NM: '힌디어' })
      }

      if (el.KK_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'kk', TRANS_NM: '카자흐어' })
      }

      if (el.KM_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'km', TRANS_NM: '크메르어' })
      }

      if (el.KY_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ky', TRANS_NM: '키르기스어' })
      }

      if (el.MY_TRANS === 'Y') {
        cmbTrans.value.push({
          TRANS_CD: 'my',
          TRANS_NM: '미얀마(버마)어',
        })
      }

      if (el.TR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'tr', TRANS_NM: '터키어' })
      }

      if (el.TK_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'tk', TRANS_NM: '투르크멘어' })
      }

      if (el.UK_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'uk', TRANS_NM: '우크라이나어' })
      }

      if (el.UR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ur', TRANS_NM: '우르드어' })
      }
    })
  })
}

watch(
  () => workId.value,
  (oldValue, newValue) => {
    if (oldValue !== WORK_STANDARD_MASTER.WORK_STANDARD_ID) {
      // TODO: 화면 전환시 값 변경때문에 자꾸 자동 로드하는거 일단 막음
      //reLoad()
    }
  }
)

watch(
  () => WORK_STANDARD_MASTER.WORK_STANDARD_ID,
  (oldValue, newValue) => {
    //console.log('work_standard_id = ', newValue)

    if (WORK_STANDARD_MASTER.WORK_STANDARD_ID == '') srBtnDisabled.value = true
    else srBtnDisabled.value = false
    /*
  if(newValue == '')
    srBtnDisabled.value = false
  else
    srBtnDisabled.value = true
  */
    //srBtnDisabled = true

    //console.log('srbtn = ', srBtnDisabled)
  }
)

const reLoad = (id) => {
  isActiveTab.value = false
  if (workId.value !== undefined) {
    // isRevision = $route.params.IS_REVISION
    search(workId.value)
  } else {
    isVisible.value = true
  }
}

const searchPartnerAppr = () => {
  // 최종결재(협력사용) 버튼 숨기기
  menuTitle.value.disableBtn('btnRskDel', true)
  menuTitle.value.setBtnProperty('btnPartnerApply', 'visible', false)
  // 반려버튼 숨기기
  menuTitle.value.setBtnProperty('btnPartnerReject', 'visible', false)

  if (WORK_STANDARD_MASTER.WORK_STANDARD_ID == null) return

  let obj = {
    WORK_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
    APPR_USR_ID: userStore.userId,
  }

  return commonSearchApi({
    queryId: 'PKG_CSX02_WORK_GET_APPR_TARGET',
    param: obj,
  }).then((res) => {
    console.log('TARGET = ', res)

    // 협력사 결재자인 경우, 최종결재 버튼 활성화
    if (res.OUT_DATA !== '0') {
      // 폐지버튼 비활성화 (true: 비활성화, false: 활성화)
      menuTitle.value.disableBtn('btnRskDel', true)
      // 최종결재 버튼 보이기 (true: 보이기, false: 숨기기)
      menuTitle.value.setBtnProperty('btnPartnerApply', 'visible', true)
      // 반려버튼 보이기
      menuTitle.value.setBtnProperty('btnPartnerReject', 'visible', true)
    }
  })
}

// 표준서 정보 조회
const search = async (id) => {
  if (id !== '' && id !== undefined) {
    //console.log('개정으로 넘어왔을 때, search() id = ', id)
    // PKG_RSKBA0010.WORK_STANDARD_MASTER_S
    console.log('id = ', id)

    await commonSearchApi({
      queryId: 'RSKBA0010_SEARCH_04',
      param: { WORK_STANDARD_ID: id, TRANS: WORK_STANDARD_MASTER.TRANS_CD },
    }).then(async (res) => {
      let data = res.ORESULT_CUR[0]
      console.log('data:', data)
      if (data != null) {
        // 재해 발생 현황 조회조건
        let params_31 = {
          CMPNY_DIV: data.CMPNY_DIV,
          BSNS_CD: data.BSNS_CD,
          DEPT_CD: data.DEPT_CD,
        }

        // 실제 작업표준 작성한 부서의 사업부 세팅용
        WORK_STANDARD_MASTER.BSNS_CD_ORIGIN = data.BSNS_CD

        // 재해 발생 현황
        await commonSearchApi({ queryId: 'RSKBA0010_SEARCH_31', param: params_31 }).then(async (res2) => {
          let data2 = res2.ORESULT_CUR[0]

          SAGO.SAN_CNT = data2.SAN_CNT
          SAGO.HUE_CNT = data2.HUE_CNT
          SAGO.IL_CNT = data2.IL_CNT
          SAGO.COME_SERIOUS_CNT = data2.COME_SERIOUS_CNT
        })
      }

      WORK_STANDARD_MASTER.WORK_STANDARD_ID = data.WORK_STANDARD_ID
      WORK_STANDARD_MASTER.WORK_STANDARD_ID_VIEW = isRevision.value ? '' : data.WORK_STANDARD_ID
      WORK_STANDARD_MASTER.SAVE_TYPE = isRevision.value ? 'U' : 'C'
      WORK_STANDARD_MASTER.SAVE_STATUS = isRevision.value ? 'C' : 'U'
      WORK_STANDARD_MASTER.COMPANY_CD = data.COMPANY_CD
      WORK_STANDARD_MASTER.DEPT_CD = data.DEPT_CD
      WORK_STANDARD_MASTER.DEPT_NM = data.DEPT_NM
      WORK_STANDARD_MASTER.CORP_ASGN_CD = data.CORP_ASGN_CD
      WORK_STANDARD_MASTER.CORP_ASGN_NM = data.CORP_ASGN_NM
      WORK_STANDARD_MASTER.GUBUN_NM = data.GUBUN_NM
      WORK_STANDARD_MASTER.GUBUN_CD = data.GUBUN_CD
      WORK_STANDARD_MASTER.WORK_STANDARD_NO = data.WORK_STANDARD_NO
      WORK_STANDARD_MASTER.WORK_STANDARD_REVISION = data.WORK_STANDARD_REVISION
      WORK_STANDARD_MASTER.WORK_STANDARD_NM =
        WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? data.WORK_STANDARD_NM : data.TRANS_WORK_STANDARD_NM
      WORK_STANDARD_MASTER.PRODUCTION_MANAGER = data.PRODUCTION_MANAGER
      WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM = data.PRODUCTION_MANAGER_NM
      WORK_STANDARD_MASTER.POSITION_MANAGER = data.POSITION_MANAGER
      WORK_STANDARD_MASTER.POSITION_MANAGER_NM = data.POSITION_MANAGER_NM

      WORK_STANDARD_MASTER.WORK_TOOLS = data.WORK_TOOLS
      WORK_STANDARD_MASTER.EQUIPMENT_TYPE = data.EQUIPMENT_TYPE
      WORK_STANDARD_MASTER.USE_CHEMICAL = data.USE_CHEMICAL
      WORK_STANDARD_MASTER.REVIEWER = data.REVIEWER
      WORK_STANDARD_MASTER.CHK_REQUIRED = data.CHK_REQUIRED
      WORK_STANDARD_MASTER.USER_DIV = data.USER_DIV
      WORK_STANDARD_MASTER.PROGRESS_STATUS = isRevision.value ? 'UP_AW' : data.PROGRESS_STATUS
      WORK_STANDARD_MASTER.WORK_STANDARD_KIND = isRevision.value ? 'U' : data.WORK_STANDARD_KIND
      WORK_STANDARD_MASTER.RISK_TYPE = isRevision.value ? '' : data.RISK_TYPE
      WORK_STANDARD_MASTER.RISK_TYPE_NM = isRevision.value ? '' : data.RISK_TYPE_NM
      WORK_STANDARD_MASTER.C_DATE = data.C_DATE
      WORK_STANDARD_MASTER.U_DATE = isRevision.value ? dayjs().format('YYYY-MM-DD') : data.U_DATE
      WORK_STANDARD_MASTER.APPROVAL_DATE = data.APPROVAL_DATE
      if (data.U_DATE === null && data.C_DATE === null) {
        WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
      } else {
        if (['CC_AC', 'UC_AC'].includes(data.PROGRESS_STATUS)) {
          WORK_STANDARD_MASTER.WORK_DATE = data.U_DATE === null ? data.C_DATE : data.U_DATE

          if (isRevision.value) {
            WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
          }

          // 직영인 경우 DEPT_CD, 협력사인 경우 ASGN_CD
          let deptCode = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd

          // 현황 화면에서 넘어왔고, 해당 작업 표준의 부서가 로그인 한 부서 사용자와 같은 경우, 해당 작업 표준이 결재완료 상태인 경우에만 폐지버튼 활성화
          if (
            workType.value == 'E' &&
            WORK_STANDARD_MASTER.DEPT_CD == deptCode &&
            ['CC_AC', 'UC_AC'].includes(data.PROGRESS_STATUS)
          ) {
            // 버튼 활성화
            menuTitle.value.disableBtn('btnRskDel', false)
            // 버튼 보이기 (false: 숨기기, true: 보이기)
            menuTitle.value.setBtnProperty('btnRskDel', 'visible', true) // 폐지
          }
        } else {
          if (isRevision.value) {
            WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
          } else {
            WORK_STANDARD_MASTER.WORK_DATE = data.U_DATE
          }
        }
      }

      WORK_STANDARD_MASTER.APPR_DT = isRevision.value ? '' : data.APPR_DT
      WORK_STANDARD_MASTER.WORK_STANDARD_RISK_COUNT = data.WORK_STANDARD_RISK_COUNT
      WORK_STANDARD_MASTER.WORK_STANDARD_RISK_OVER_COUNT = data.WORK_STANDARD_RISK_OVER_COUNT + '건'
      WORK_STANDARD_MASTER.WORK_STANDARD_AVG_RISK = data.WORK_STANDARD_AVG_RISK
      WORK_STANDARD_MASTER.SRSRM_ALL = data.SRSRM_ALL
      WORK_STANDARD_MASTER.SRSRM_COMPLETE = data.SRSRM_COMPLETE
      WORK_STANDARD_MASTER.RATE = data.RATE

      WORK_STANDARD_MASTER.WORK_STANDARD_DESC = isRevision.value || isAbolition.value ? '' : data.WORK_STANDARD_DESC
      WORK_STANDARD_MASTER.USER_INFO = data.USER_INFO
      WORK_STANDARD_MASTER.IS_SAVE = isRevision.value ? '' : data.IS_SAVE
      WORK_STANDARD_MASTER.EDU_FILE_ID = data.EDU_FILE_ID
      WORK_STANDARD_MASTER.EDU_FILE_COUNT = data.EDU_FILE_COUNT

      if (
        data.PROGRESS_STATUS === 'CP_AW' || // 신규작성중
        data.PROGRESS_STATUS === 'UP_AW' || // 개정작업
        data.PROGRESS_STATUS === 'CC_AB' || // 기안취소(제정)
        data.PROGRESS_STATUS === 'UC_AB' || // 기안취소(개정)
        data.PROGRESS_STATUS === 'CC_AR' || // 결재반려(제정)
        data.PROGRESS_STATUS === 'UC_AR' // 결재반려(개정)
      ) {
        isReadOnly.value = false
        isVisible.value = true

        // 직영이고 부서코드가 같은 경우 저장, 결재상신 활성화
        if (userStore.userDiv === 'A' && data.DEPT_CD == userStore.deptCd) {
          menuTitle.value.disableBtn('btnUpdate', false)
          menuTitle.value.disableBtn('btnReqApply', false)
        } else if (
          userStore.userDiv === 'B' &&
          data.CORP_ASGN_CD === userStore.deptCd &&
          data.DEPT_CD == userStore.asgnCd
        ) {
          menuTitle.value.disableBtn('btnUpdate', false)
          menuTitle.value.disableBtn('btnReqApply', false)
        }

        menuTitle.value.disableBtn('btnRevision', true)
        menuTitle.value.disableBtn('btnRskDel', true)
      } else {
        if (isRevision.value) {
          isReadOnly.value = false
          isVisible.value = true
          menuTitle.value.disableBtn('btnUpdate', false)
          menuTitle.value.disableBtn('btnReqApply', false)
        } else {
          if (data.PROGRESS_STATUS === 'DP_AW') {
            menuTitle.value.disableBtn('btnUpdate', false)
            menuTitle.value.disableBtn('btnReqApply', false)
          } else {
            isReadOnly.value = false
            isVisible.value = false

            menuTitle.value.disableBtn('btnUpdate', true)
            menuTitle.value.disableBtn('btnReqApply', true)
            // menuTitle.value.disableBtn('btnRskDel', true)
          }
        }
      }

      // 결재 상신한 협력사인 경우, 최종 결재자 유무 판단, 결재 상신 중복 방지를 위해 상신 버튼 다시한번 비활성화
      if (['CC_AD', 'UC_AD', 'DC_AD'].includes(data.PROGRESS_STATUS) && userStore.userDiv === 'B') {
        PARTNER_WORK_TYPE = data.PROGRESS_STATUS === 'DC_AC' ? 'WD' : 'R'
        searchPartnerAppr()

        // 결재상신 비활성화
        menuTitle.value.disableBtn('btnReqApply', true) // 결재상신
        // 폐지 비활성화
        menuTitle.value.disableBtn('btnRskDel', true)
      }

      if (['CC_AC', 'UC_AC'].includes(data.PROGRESS_STATUS)) {
        if (data.DEPT_CD === searchParams.DEPT_CD) {
          //console.log('isRevision = ', irRevision.value)
          if (!isRevision.value) {
            await getCheckRevision()
          }
        }
      }
      // 데이터 조회시, 신규 작성/개정 작업중인 경우
      if (['CP_AW', 'UP_AW'].includes(data.PROGRESS_STATUS)) {
        if (data.DEPT_CD !== searchParams.DEPT_CD) {
          isReadOnly.value = true
          isVisible.value = false

          // 저장, 결재상신 버튼 활성화
          //menuTitle.value.disableBtn('btnUpdate', false)
          //menuTitle.value.disableBtn('btnReqApply', false)

          console.log('userStore.userDiv = ', userStore.userDiv)
          console.log('data.DEPT_CD = ', data.DEPT_CD)
          console.log('data.CORP_ASGN_CD = ', data.CORP_ASGN_CD)

          console.log('userStore.deptCd = ', userStore.deptCd)
          console.log('userStore.asgnCd = ', userStore.asgnCd)

          // 직영이고 부서코드가 같은 경우 저장, 결재상신 활성화
          if (userStore.userDiv === 'A' && data.DEPT_CD == userStore.deptCd) {
            menuTitle.value.disableBtn('btnUpdate', false)
            menuTitle.value.disableBtn('btnReqApply', false)
          } else if (
            userStore.userDiv === 'B' &&
            data.CORP_ASGN_CD === userStore.deptCd &&
            data.DEPT_CD == userStore.asgnCd
          ) {
            menuTitle.value.disableBtn('btnUpdate', false)
            menuTitle.value.disableBtn('btnReqApply', false)
          } else {
            menuTitle.value.disableBtn('btnUpdate', true)
            menuTitle.value.disableBtn('btnReqApply', true)
          }
        }
      }

      // 직영/협력사 여부로 직영부서 담당자 검토자 보여주기
      showReviewer()
    })
  } else {
    Message.warn('데이터가 없습니다.')
  }
}

const newWorkStandard = async (res) => {
  WORK_STANDARD_MASTER.WORK_STANDARD_ID = ''
  WORK_STANDARD_MASTER.WORK_STANDARD_ID_VIEW = ''
  WORK_STANDARD_MASTER.SAVE_TYPE = 'C'
  WORK_STANDARD_MASTER.SAVE_STATUS = 'C'
  WORK_STANDARD_MASTER.COMPANY_CD = userStore.cmpnyDiv
  WORK_STANDARD_MASTER.DEPT_CD = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd
  WORK_STANDARD_MASTER.DEPT_NM = userStore.deptNm
  WORK_STANDARD_MASTER.BSNS_CD_ORIGIN = userStore.bsnsCd
  WORK_STANDARD_MASTER.CORP_ASGN_CD = userStore.userDiv === 'A' ? '' : userStore.deptCd
  WORK_STANDARD_MASTER.CORP_ASGN_NM = userStore.userDiv === 'A' ? '' : userStore.deptNm
  WORK_STANDARD_MASTER.GUBUN_CD = ''

  // WORK_STANDARD_MASTER.COMPANY_CD = 'HHI'
  // WORK_STANDARD_MASTER.DEPT_CD = 'A0000032'
  // WORK_STANDARD_MASTER.DEPT_NM = 'DEPT_NM임'
  // WORK_STANDARD_MASTER.CORP_ASGN_CD = 'C4U0'
  // WORK_STANDARD_MASTER.CORP_ASGN_NM = '의장3부'
  WORK_STANDARD_MASTER.GUBUN_NM = ''

  WORK_STANDARD_MASTER.WORK_STANDARD_NO = ''
  WORK_STANDARD_MASTER.WORK_STANDARD_REVISION = ''
  WORK_STANDARD_MASTER.WORK_STANDARD_NM = ''
  WORK_STANDARD_MASTER.PROGRESS_STATUS = 'CP_AW'
  WORK_STANDARD_MASTER.WORK_STANDARD_KIND = 'C'
  WORK_STANDARD_MASTER.RISK_TYPE = 'RISK_TYPE-01' // RISK_TYPE-01 : 정기
  WORK_STANDARD_MASTER.C_DATE = dayjs().format('YYYY-MM-DD')
  WORK_STANDARD_MASTER.WORK_STANDARD_RISK_OVER_COUNT = ''
  WORK_STANDARD_MASTER.SRSRM_COMPLETE = ''
  WORK_STANDARD_MASTER.RATE = ''
  WORK_STANDARD_MASTER.EDU_FILE_COUNT = ''
  WORK_STANDARD_MASTER.EDU_FILE_ID = ''
  WORK_STANDARD_MASTER.APPROVAL_DATE = ''
  WORK_STANDARD_MASTER.U_DATE = ''
  WORK_STANDARD_MASTER.WORK_STANDARD_DESC = ''
  WORK_STANDARD_MASTER.WORK_TOOLS = ''
  WORK_STANDARD_MASTER.EQUIPMENT_TYPE = ''
  WORK_STANDARD_MASTER.USE_CHEMICAL = ''
  WORK_STANDARD_MASTER.REVIEWER = ''
  WORK_STANDARD_MASTER.APPR_DT = ''
  WORK_STANDARD_MASTER.USER_INFO = userStore.deptNm + '/' + userStore.userName
  // TODO: 2024.05.22 화면 호출 후 신규 버튼 클릭시 isSave 세팅이 없어서 추가함
  WORK_STANDARD_MASTER.IS_SAVE = ''
  WORK_STANDARD_UNIT.param = ''
  WORK_STANDARD_ACT.param = ''
  WORK_STANDARD_RISK.param = ''
  init('1')

  isUnitAdd.value = ''
  isRevision.value = false
  isUnitRemove.value = true
  isActAdd.value = true
  isActRemove.value = true
  isActSelect.value = true
  isRiskAdd.value = true
  isRiskRemove.value = true
  isVisible.value = true
  isReadOnly.value = false
  isComplete.value = false

  // 신규면 그리드 리셋
  grdMain.value.getDataProvider().setRows('')

  menuTitle.value.disableBtn('btnRevision', true)
  menuTitle.value.disableBtn('btnRskDel', true)
  menuTitle.value.disableBtn('btnSearch', true)
  menuTitle.value.disableBtn('btnUpdate', false)
  menuTitle.value.disableBtn('btnReqApply', false)
}

// 상세리포트 조회
const searchReportList = async () => {
  // todo: 상세리포트 조회
  //임시 하드코딩
  //WORK_STANDARD_MASTER.WORK_STANDARD_ID = 'HHIS-CW-A0000032-031-01'
  await commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_08',
    param: { WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID },
  }).then(async (res) => {
    rptList.unitList.param = ''
    rptList.actList.param = ''
    rptList.riskList.param = ''

    await bindUnitList(res.ORESULT_CUR)
    await bindActList(res.ORESULT_CUR)
    await bindRiskList(res.ORESULT_CUR)
  })
}

const searchReportTree = () => {
  // todo: 레포트
  // 임시 하드코딩
  //WORK_STANDARD_MASTER.WORK_STANDARD_ID = 'HHIS-CW-A0000032-031-01'

  return commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_09',
    param: { WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID },
  })
}

// 위험성평가 회의이력 조회
const meetingSearch = () => {
  let date = new Date()

  // 연도
  let year = date.getFullYear()
  // 1 : 상반기, 2 : 하반기
  let half = date.getMonth() + 1 < 7 ? 1 : 2
  // 부서코드
  let dept = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd
  // 작업표준ID
  let wsid = WORK_STANDARD_MASTER.WORK_STANDARD_ID

  console.log('year = ', year)
  console.log('half = ', half)
  console.log('dept = ', dept)
  console.log('wsid = ', wsid)
  const params = {
    YEAR: year,
    HALF: half,
    DEPT_CD: dept,
    WORK_STANDARD_ID: wsid,
  }

  //PKG_RSKBA0010.WORK_STANDARD_HISTORY_S
  return commonSearchApi({ queryId: 'RSKBA0010_SEARCH_21', param: params })
}

const isInputState = () => {
  if (
    ['CC_AC', 'UC_AC', 'CC_AD', 'UC_AD', 'CC_AP', 'UC_AP', 'DC_AD', 'DC_AP'].includes(
      this.WORK_STANDARD_MASTER.PROGRESS_STATUS
    )
  ) {
    if (this.isAbolition) {
      return 'isInput'
    } else {
      return 'isEnabled'
    }
  } else {
    return 'isInput'
  }
}

// 조회로직
const afterSearchTree = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR, 'CHLD_ID')
}

const afterSearch2 = (res) => {
  grdHistory.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const replaceText = (type, data) => {
  if (type === 'rm') {
    return '[감소대책] ' + data.replaceAll('\n', '<br />')
  } else if (type === 'chk') {
    if (data !== '[NULL]') {
      return '[체크정보] ' + data.replaceAll('\n', '<br />')
    }
  }
}

const bindUnitList = async (data) => {
  rptList.unitList = data.filter((x) => x.GUBUN === 'UNIT')
}

// const bindActList = async  (data) =>{
//   let actlist = data.filter(x => x.GUBUN === 'ACT')

//   for (let act of actlist) {
//     let rtn = await getImgFileList2(act.CHLD_ID)
//     act.imgList = rtn

//     console.log('bindActList.imgList', act.imgList)
//   }
//   rptList.actList = actlist
// }

//
const bindActList = async (data) => {
  let actlist = data.filter((x) => x.GUBUN === 'ACT')
  rptList.actList = actlist
  imgUrlTemp.value = []

  let cmpnyDiv = userStore.cmpnyDiv
  let wsid = WORK_STANDARD_MASTER.WORK_STANDARD_ID

  // commonSearchApi({ queryId: "RSKBA0010_SEARCH_11", param: { COMPANY_CD:'HHI', WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID } }).then(async res => {
  await commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_10', // PKG_RSKBA0010.ACT_FILE_S
    param: { COMPANY_CD: cmpnyDiv, WORK_STANDARD_ID: wsid },
  }).then(async (res) => {
    let j = 0
    //console.log('res = ', res.ORESULT_CUR)

    let imgList = res.ORESULT_CUR.filter((x) => ['jpg', 'JPG', 'png', 'PNG', 'jpeg', 'JPEG'].includes(x.FILE_TYPE))

    console.log('actlist', actlist)
    console.log('imgList', imgList)

    for (let img of imgList) {
      await commonDownloadFilesApi(img).then((res) => {
        const blob = new Blob([res])
        const imageURL = URL.createObjectURL(blob)

        //console.log('imageURL = ', imageURL)
        //console.log('imgList[j].FILE_TITLE = ', imgList[j].FILE_TITLE)

        imgUrlTemp.value.push({
          src: imageURL, // 이미지 URL 설정
          TITLE: imgList[j].FILE_TITLE,
          FILE_ID: imgList[j].FILE_ID,
        })

        //console.log('imgUrlTemp = ', imgUrlTemp.value)
        j++
      })
    }

    // if (res.ORESULT_CUR.length > 0) {
    //   for( let i =0; i < actlist.length; i++ ){

    //     //let imgList = res.ORESULT_CUR.filter(x => x.FILE_TYPE === 'jpg' || x.FILE_TYPE === 'png' || x.FILE_TYPE === 'PNG')
    //     let imgList = res.ORESULT_CUR.filter(x => ['jpg', 'JPG', 'png', 'PNG', 'jpeg', 'JPEG'].includes(x.FILE_TYPE))

    //     console.log('actlist', actlist)
    //     console.log('imgList', imgList)

    //     for(let img of imgList) {

    //       await commonDownloadFilesApi(img)
    //         .then((res)=>{

    //           const blob = new Blob([res])
    //           const imageURL = URL.createObjectURL(blob)

    //           imgUrlTemp.value.push({
    //             src : imageURL,   // 이미지 URL 설정
    //             TITLE : imgList[j].FILE_TITLE,
    //             FILE_ID : imgList[j].FILE_ID,
    //           })

    //           console.log('imgUrlTemp = ', imgUrlTemp.value)
    //           j++

    //         })
    //     }
    //   }
    // }
  })

  // console.log('rptList.actList', rptList.actList)
}

const bindRiskList = async (data) => {
  rptList.riskList = data.filter((x) => x.GUBUN === 'RISK')
}

const OnSelectedGubun = (row) => {
  if (row) {
    WORK_STANDARD_MASTER.GUBUN_CD = row.COMMID
    WORK_STANDARD_MASTER.GUBUN_NM = row.NAMEPATH
  }
}

const OnSelectedCopy = (row) => {
  if (row) {
    WORK_STANDARD_MASTER.GUBUN_CD = row.COMMID
    WORK_STANDARD_MASTER.GUBUN_NM = row.NAMEPATH
  }
}

const OnSelectedSago = (row) => {
  if (row) {
    WORK_STANDARD_MASTER.GUBUN_CD = row.COMMID
    WORK_STANDARD_MASTER.GUBUN_NM = row.NAMEPATH
  }
}

// 비일상작업 적용 시
const OnSelectedSusi = (row) => {
  if (row) {
    dialog.value = false
    //console.log('susi row : ', row)
    let isUnitId = []
    let isActId = []

    row.forEach((item) => {
      // 단위작업 생성
      let unitMaxId = (ArrayList.value.reduce((max, obj) => Math.max(max, obj['id']), 0) + 1).toString()
      let unitMaxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)

      for (let el of ArrayList.value) {
        isUnitId.push(el.UNIT_ID.slice(-3))
      }
      let autoUnitId = isUnitId.length === 0 ? '001' : (Math.max(...isUnitId) + 1).toString().padStart(3, '0')
      let NEW_UNIT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-U' + autoUnitId

      ArrayList.value.push({
        level: 1,
        id: unitMaxId,
        idx: unitMaxIdx + 1,
        text: '' + unitMaxId,
        child: [],
        UNIT_ID: NEW_UNIT_ID,
        UNIT_ACT_ID: '-U' + autoUnitId,
        WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
        DATA_STATUS: 'N',
        STATUS: 'C',
        IS_CHECK: 'N',
        IS_SAVE: 'N',
        IS_SELECT: false,
        IS_SUCCESS: '',
        UNIT_NM: item.UNIT_NM,
        ORA_YN: item.ORA_YN,
        NROUTINE_WORK_ID: item.NROUTINE_WORK_ID,
      })

      // 작업행동 생성
      tempA = _.find(ArrayList.value, { UNIT_ID: NEW_UNIT_ID })
      let actMaxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[1]), 0)
      let actMaxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)
      let actNewId = tempA.id + '_' + (actMaxId + 1)
      let lastDashIndex = tempA.UNIT_ID.lastIndexOf('-')
      let unitActId = '-' + tempA.UNIT_ID.substring(lastDashIndex + 1)

      for (let el of tempA.child) {
        isActId.push(el.ACT_ID.slice(-3))
      }

      let autoActId = isActId.length === 0 ? '001' : (Math.max(...isActId) + 1).toString().padStart(3, '0')
      let NEW_ACT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + unitActId + '-A' + autoActId
      // let NEW_ACT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-A' + d.getTime()
      tempA.child.push({
        level: 2,
        id: actNewId,
        pid: tempA.id,
        idx: actMaxIdx + 1,
        text: '' + actMaxId,
        child: [],
        ACT_ID: NEW_ACT_ID,
        WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
        // WORK_STANDARD_ID : 'HHIS-CW-G2P0-001-01',
        UNIT_ID: NEW_UNIT_ID,
        DATA_STATUS: 'N',
        STATUS: 'C',
        IS_SELECT: false,
        IS_CHECK: 'N',
        IS_SAVE: 'N',
        IS_SUCCESS: '',
        ACT_NM: '',
        CHK_NM: '',
      })

      if (item.child) {
        let A = _.find(ArrayList.value, { UNIT_ID: NEW_UNIT_ID })

        console.log('A ====== ', A)

        tempB = _.find(A.child, { ACT_ID: NEW_ACT_ID })
        item.child.forEach((childItem) => {
          let riskMaxId = tempB.child.reduce(
            (max, obj) => Math.max(max, obj['id'].substr(obj['id'].indexOf('_') + 1)),
            1
          )
          let riskMaxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
          let riskNewId = tempB.id + '_' + (riskMaxId + 1)
          let NEW_RISK_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-R' + d.getTime()
          // let NEW_RISK_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-R' + d.getTime()

          tempB.child.push({
            level: 3,
            id: riskNewId,
            pid: tempB.id,
            idx: riskMaxIdx + 1,
            text: '' + riskMaxId,
            RISK_ID: NEW_RISK_ID,
            WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
            // WORK_STANDARD_ID: 'HHIS-CW-G2P0-001-01',
            UNIT_ID: NEW_UNIT_ID,
            ACT_ID: NEW_ACT_ID,
            DATA_STATUS: 'N',
            STATUS: 'C',
            IS_SELECT: false,
            IS_CHECK: 'N',
            IS_SAVE: 'N',
            IS_SUCCESS: '',
            BEFOR_FRE: '',
            BEFOR_MAT: '',
            BEFOR_TOTAL: '',
            AFTER_FRE: '',
            AFTER_MAT: '',
            AFTER_TOTAL: '',
            RISK_CD_P_NM: '',
            RISK_CD_D_NM: '',
            RISK_NM: childItem.RISK_NM,
            RM_CD_P_NM: '',
            RM_CD_D_NM: '',
            SAFE_NM: childItem.SAFE_NM,
            RM_NM: childItem.RM_NM,
          })
        })
      }
    })
    // 작업행동
    //console.log("ArrayList.value unit & act : ", ArrayList.value)
  }
}

// 개정 정보 조회(confirmOK2랑 로직 동일)
const checkRevision = (gbn) => {
  let id = WORK_STANDARD_MASTER.WORK_STANDARD_ID
  console.log('개정 버튼 클릭시 체크 리비전 실행하고 work_id = ', id)
  isRevision.value = true
  search(id)
  searchUnit(id)

  isReadOnly.value = false

  // 저장, 결재상신 활성화
  menuTitle.value.disableBtn('btnUpdate', false)
  menuTitle.value.disableBtn('btnReqApply', false)

  //disabledSave.value = false
  //disabledAppr.value = false

  isVisible.value = true
  isComplete.value = false

  // 개정, 폐지 비활성화
  menuTitle.value.disableBtn('btnRskDel', true)
  menuTitle.value.disableBtn('btnRevision', true)
  isSaved.value = false
  //disabledDel.value = true
  //disabledRevision.value = true
  //disabledDelete.value = true
}

// 개정 시 개정번호 가져오기
//getCheckRevision
const getRevision = async (id) => {
  let params = {
    WORK_STANDARD_NO: WORK_STANDARD_MASTER.WORK_STANDARD_NO,
    DEPT_CD: WORK_STANDARD_MASTER.DEPT_CD,
  }
  // GET_WORK_STANDARD_REVISION
  await commonSearchApi({ queryId: 'RSKBA0010_SEARCH_22', param: params }).then((res) => {
    if (res.OUT_DATA.length > 0) {
      WORK_STANDARD_MASTER.WORK_STANDARD_ID = WORK_STANDARD_MASTER.WORK_STANDARD_NO + '-' + res.OUT_DATA
      WORK_STANDARD_MASTER.WORK_STANDARD_REVISION = res.OUT_DATA
    }
  })
}

const getCheckRevision = () => {
  // GET_CHECK_REVISION
  commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_01',
    param: { WORK_STANDARD_NO: WORK_STANDARD_MASTER.WORK_STANDARD_NO },
  }).then((res) => {
    if (res.ORESULT_CUR[0].WORK_STANDARD_REVISION > parseInt(WORK_STANDARD_MASTER.WORK_STANDARD_REVISION)) {
      menuTitle.value.disableBtn('btnRskDel', true)
      menuTitle.value.disableBtn('btnRevision', false)
      bRevision.value = true
      //console.log('bRevision = true')
    } else {
      menuTitle.value.disableBtn('btnRskDel', false)
      menuTitle.value.disableBtn('btnRevision', false)
      bRevision.value = false
      //console.log('bRevision = false')
    }
  })
}

const revision = (res) => {
  if (WORK_STANDARD_MASTER.TRANS_CD !== 'ko') {
    Message.warn('언어를 한국어로 변경후 개정해주세요')
    return
  }

  let revstatus = WORK_STANDARD_MASTER.PROGRESS_STATUS

  console.log('revision res = ', res)
  console.log('bRevision = ', bRevision.value)

  if (bRevision.value) {
    console.log('진행상태 = ', revstatus)
    // UP_AW : 개정작업중
    if (revstatus === 'UP_AW' || revstatus === 'UC_AR' || revstatus === 'UC_AB') {
      return Message.warn(
        t("현재 개정 중인 작업표준입니다. 작업표준/위험성 평가 - 작성중' 화면에서 확인하시기 바랍니다.")
      )
    } else if (revstatus === 'UC_AD' || revstatus === 'UC_AP') {
      // UC_AD: 결재상신,  UC_AP: 결재중
      return Message.warn(
        t("현재 개정하여 결재 진행중인 작업표준입니다.작업표준/위험성 평가 - 결재진행중' 화면에서 확인하시기 바랍니다.")
      )
    }
  } else {
    //console.log('개정222222222')
    // GET_CHECK_REVISION
    commonSearchApi({
      queryId: 'RSKBA0010_SEARCH_01',
      param: { WORK_STANDARD_NO: WORK_STANDARD_MASTER.WORK_STANDARD_NO },
    }).then((res) => {
      let rev = res.ORESULT_CUR[0].WORK_STANDARD_REVISION

      console.log('rev = ', rev)
      console.log('WORK_STANDARD_MASTER.workRevision = ', WORK_STANDARD_MASTER.WORK_STANDARD_REVISION)

      if (parseInt(WORK_STANDARD_MASTER.WORK_STANDARD_REVISION) === rev) {
        // true
        checkRevision(true)
      } else if (parseInt(WORK_STANDARD_MASTER.WORK_STANDARD_REVISION) < rev) {
        vm.$swal({
          title: t(
            '현재 개정 중인 작업표준이 존재합니다. <br> 다시 개정하시겠습니까? 기존에 작성중인 내용은 삭제됩니다.'
          ),
          showCancelButton: true,
        }).then((swalRes) => {
          if (swalRes.isConfirmed === true) {
            checkRevision(true)
          }
        })
      }
    })
  }
}

// const checkRevision = res => {
//   return commonSearchApi({ queryId : 'RSKBA0010_SEARCH_01', param : { WORK_STANDARD_NO: WORK_STANDARD_MASTER.WORK_STANDARD_NO } })
// }

// async
const afterCheckRevision = async (res) => {
  // console.log('afterCheckRevision res',res)
  if (res.ORESULT_CUR.length > 0) {
    let rev = parseInt(res.ORESULT_CUR[0].WORK_STANDARD_REVISION)
    let revision = parseInt(WORK_STANDARD_MASTER.WORK_STANDARD_REVISION)
    //console.log('탐?', parseInt(WORK_STANDARD_MASTER.WORK_STANDARD_REVISION))
    //console.log('rev :',rev)
    if (revision === rev) {
      return true
    } else if (revision < rev) {
      let ck = vm
        .$swal({
          title: t('현재 개정 중인 작업표준이 존재합니다. 다시 개정 하시겠습니까? 기존에 작성중인 내용은 삭제됩니다.'),
          showCancelButton: true,
        })
        .then((res) => {
          if (isConfirmed) {
            confirmOK2()
          }
        })
      if (!ck.isConfirmed) {
        Message.err('취소되었습니다.')

        return
      } else {
        let id = WORK_STANDARD_MASTER.WORK_STANDARD_ID

        isRevision.value = true
        search(id)

        isReadOnly.value = false

        menuTitle.value.disableBtn('btnUpdate', false)
        menuTitle.value.disableBtn('btnReqApply', false)

        isVisible.value = true
        isComplete.value = false

        disabledDel.value = true
        menuTitle.value.disableBtn('btnRevision', true)
        menuTitle.value.disableBtn('btnRskDel', true)
      }
    }
  }
}

const confirmOK2 = () => {
  let id = WORK_STANDARD_MASTER.WORK_STANDARD_ID

  isRevision.value = true
  search(id)
  transInit(id)
  searchUnit(id)
  searchAct(id)
  searchRisk(id)

  isReadOnly.value = false

  disabledSave.value = false
  disabledAppr.value = false

  isVisible.value = true
  isComplete.value = false

  disabledDel.value = true
  disabledRevision.value = true
  disabledDelete.value = true
}

//그리드 속성셋팅(tab1-Main)
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
    rowIndicator: { visible: false },
    edit: { editable: false },
  },

  keys: ['WORK_STANDARD_NO'],
  fields: [
    { fieldName: 'WORK_STANDARD_REVISION', dataType: 'text', width: '30', header: { text: '개정번호' } },
    { fieldName: 'INS_DT', dataType: 'text', width: '50', header: { text: '제/개정일자' } },
    { fieldName: 'WORK_STANDARD_DESC', dataType: 'text', width: '70', header: { text: '제/개정사유' } },
    { fieldName: 'USER_NM', dataType: 'text', width: '70', header: { text: '작성자' } },
    { fieldName: 'PROGRESS_STATUS', dataType: 'text', visible: false },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 상세리포트 그리드
const grdSubProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    header: { visible: false },
    footer: { visible: false },
    rowIndicator: { visible: false },
  },
  keys: ['CHLD_ID'],
  field: [
    { fieldName: 'CHLD_ID', dataType: 'text', visible: false },
    { fieldName: 'PRNT_ID', dataType: 'text', visible: false },
    { fieldName: 'GUBUN', dataType: 'text', visible: false },
    { fieldName: 'KOR_NM', dataType: 'text', style: { fontSize: '20px' } },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.field

//그리드 속성셋팅(History)
const grdHistoryProps = reactive({
  gridViewOption: { checkBar: { visible: false }, rowIndicator: { visible: false } },

  keys: ['WORK_STANDARD_NM'],
  fields: [
    {
      fieldName: 'WORK_STANDARD_NM',
      dataType: 'text',
      header: { text: '주요 작업 표준' },
      width: '80',
      editable: false,
    },
    {
      fieldName: 'LO_RESULT',
      dataType: 'text',
      header: { text: '검토결과' },
      width: '200',
      editable: false,
      styleName: 'left-column',
    },
    { fieldName: 'MEETING_DATE', dataType: 'text', header: { text: '회의일시' }, width: '70', editable: false },
    {
      fieldName: 'MEMBERS',
      dataType: 'text',
      header: { text: '회의참석자' },
      editable: false,
      styleName: 'left-column',
    },
    // { fieldName: 'DETAIL', dataType: 'text', editable: false, header: { text: t('상세') },
    //   styleCallback: function(grid, dataCell) {
    //     let ret = {}
    //     const iconSize = 20
    //     ret.renderer = {
    //       type: 'icon',
    //       iconLocation: 'center',
    //       iconCallback: function(grid, cell) {
    //         return new URL('/src/assets/images/icons/list-box-outline.png', import.meta.url).href
    //       },
    //       iconHeight: iconSize,
    //       iconWidth: iconSize,
    //     }
    //     return ret
    //   }
    // },
    // { fieldName: 'COL05', dataType: 'text', header: { text:'상세' } },  // 상세 페이지로 화면 전환
  ],
  columns: [],
})

// 그리드 세팅
grdHistoryProps.columns = grdHistoryProps.fields

//팝업 오픈
const openPopup = () => {
  rSKBA0010popup1.value.openPopup({ GBN: '' })
}

// 위험요인
const OnSelectedFactors = (row) => {
  if (row) {
    //console.log('row = ', row)
    const A = partsArray[0]
    const B = partsArray[1]
    const C = partsArray[2]
    /*
    if (row.PARENT_ID === 'RISK_CD-01') {
      ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD_P_NM = '사고'  
    }
    else if (row.PARENT_ID === 'RISK_CD-02') {
      ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD_P_NM = '비사고'
    }
*/
    //ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD_D_NM = row.SYS_CDNM
    //ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD = row.CODE_ID

    let t1 = _.find(ArrayList.value, { id: A })
    let t2 = _.find(t1.child, { id: A + '_' + B })
    let t3 = _.find(t2.child, { id: A + '_' + B + '_' + C })

    t3.RISK_CD_P_NM = row.PARENT_ID == 'RISK_CD-01' ? '사고' : '비사고'
    t3.RISK_CD_D_NM = row.SYS_CDNM
    t3.RISK_CD = row.CODE_ID

    //console.log('risk cd : ', ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD)
  }
}

// 감소대책
const OnSelectedReduction = (row) => {
  if (row) {
    const A = partsArray[0]
    const B = partsArray[1]
    const C = partsArray[2]

    let t1 = _.find(ArrayList.value, { id: A })
    let t2 = _.find(t1.child, { id: A + '_' + B })
    let t3 = _.find(t2.child, { id: A + '_' + B + '_' + C })

    t3.RM_CD_P_NM = row.PARENT_CODE_NM
    t3.RM_CD_D_NM = row.CODE_NM
    t3.RM_CD = row.CODE_ID

    //ArrayList.value[A-1].child[B-1].child[C-2].RM_CD_P_NM = row.PARENT_CODE_NM
    //ArrayList.value[A-1].child[B-1].child[C-2].RM_CD_D_NM = row.CODE_NM
    //ArrayList.value[A-1].child[B-1].child[C-2].RM_CD = row.CODE_ID

    // ArrayList.value[A-1].child[B-1].child[C-2].RM_CD_P_NM = row.PARENT_CODE_NM
    // ArrayList.value[A-1].child[B-1].child[C-2].RM_CD_D_NM = row.CODE_NM
    // ArrayList.value[A-1].child[B-1].child[C-2].RM_CD = row.CODE_ID
  }
}

//
const Addselect = (type, pid, id) => {
  if (type === 'unit') {
    WORK_STANDARD_UNIT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_ACT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_RISK.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === id).IS_SELECT = true
    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === id).IS_CHECK = 'Y'
    isUnitRemove.value = isActAdd.value = false
  } else if (type === 'act') {
    WORK_STANDARD_UNIT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === pid).IS_SELECT = true
    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === pid).IS_CHECK = 'Y'

    WORK_STANDARD_ACT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_RISK.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_ACT.find((t) => t.ACT_ID === id).IS_SELECT = true
    WORK_STANDARD_ACT.find((t) => t.ACT_ID === id).IS_CHECK = 'Y'
    isActRemove.value = isActSelect.value = isRiskAdd.value = false

    if (WORK_STANDARD_ACT.find((t) => t.ACT_ID === id).IS_SAVE === 'Y') {
      isActSelect.value = false
    }

    if (WORK_STANDARD_ACT.find((t) => t.ACT_ID === id).IMG_CNT === 0) {
      isActSelectColor = 'gray'
    } else {
      isActSelectColor = 'green'
    }
  } else if (type === 'risk') {
    WORK_STANDARD_UNIT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_ACT.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_UNIT.find(
      (t) => t.UNIT_ID === WORK_STANDARD_ACT.find((x) => x.ACT_ID === pid).UNIT_ID
    ).IS_SELECT = true

    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === WORK_STANDARD_ACT.find((x) => x.ACT_ID === pid).UNIT_ID).IS_CHECK = 'Y'

    WORK_STANDARD_ACT.find((t) => t.ACT_ID === pid).IS_SELECT = true

    WORK_STANDARD_ACT.find((t) => t.ACT_ID === pid).IS_CHECK = 'Y'

    WORK_STANDARD_RISK.map((t) => {
      t.IS_SELECT = false
      t.IS_CHECK = 'N'

      return t
    })

    WORK_STANDARD_RISK.find((t) => t.RISK_ID === id).IS_SELECT = true

    WORK_STANDARD_RISK.find((t) => t.RISK_ID === id).IS_CHECK = 'Y'

    isRiskRemove.value = false
  }
}

const dataStatusStyle = (tp, data) => {
  if (tp === 'unit') {
    if (data.DATA_STATUS === 'C' || data.DATA_STATUS === 'I') {
      return 'text_underline'
    } else {
      return 'text_none'
    }
  } else if (tp === 'act') {
    if (data.DATA_STATUS === 'C' || data.DATA_STATUS === 'I') {
      return 'text_underline'
    } else {
      return 'text_none'
    }
  } else if (tp === 'risk') {
    if (data.RISK_DATA_STATUS === 'C' || data.RISK_DATA_STATUS === 'I') {
      return 'text_underline'
    } else {
      return 'text_none'
    }
  } else if (tp === 'rm') {
    if (data.RM_DATA_STATUS === 'C' || data.RM_DATA_STATUS === 'I') {
      return 'text_underline'
    } else {
      return 'text_none'
    }
  }
}

const treeNodeSelected = (node) => {
  $('html #reportlistScroll').scrollTop(0)

  let offset = $('#' + node[0].id + 'SCR').offset()

  // $refs['reportlistScroll'].scrollTo({
  //   top: offset.top - 500,
  //   behavior: 'smooth'
  // })

  $refs.reportTree.value.scrollTo({
    top: offset - 500,
    behavior: 'smooth',
  })
}

const getchildList = (type, PRNT_ID) => {
  if (type === 'ACT') {
    return rptList.actList.filter((x) => x.PRNT_ID === PRNT_ID)
  } else if (type === 'RISK') {
    return rptList.riskList.filter((x) => x.PRNT_ID === PRNT_ID)
  }
}

const getClass = (type) => {
  if (type === 'unit') {
    if (window.innerWidth <= 1280) {
      return 'unitItem1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'unitItem1920'
    } else {
      return 'unitItem1920'
    }
  } else if (type === 'act') {
    if (window.innerWidth <= 1280) {
      return 'actItem1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'actItem1920'
    } else {
      return 'actItem1920'
    }
  } else if (type === 'chk') {
    if (window.innerWidth <= 1280) {
      return 'chkItem1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'chkItem1920'
    } else {
      return 'chkItem1920'
    }
  } else if (type === 'hzContainer') {
    if (window.innerWidth <= 1280) {
      return 'hzContainer1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'hzContainer1920'
    } else {
      return 'hzContainer1920'
    }
  } else if (type === 'scroll') {
    if (window.innerWidth <= 1280) {
      return 'scroll1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'scroll1920'
    } else {
      return 'scroll1920'
    }
  }
}

// 상세리포트 탭 클릭 시 조회
const reportTabClick = async () => {
  await new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchReportTree)
    .setAfter(afterSearchTree)
    .showMessage(false)
    .run()

  await searchReportList()
  /*
  // 임시로 true 넣어줌  
  //if (isActiveTab.value) {
  if (
    ['CC_AC', 'UC_AC'].includes(WORK_STANDARD_MASTER.PROGRESS_STATUS) // CC_AC: 결재완료(개정), UC_AC: 결재완료(제정)
  ) {
  
    await new queryFlowHelper(vm, t)
              .setGridList([grdSub])
              .setQuery(searchReportTree)
              .setAfter(afterSearchTree)
              .showMessage(false)
              .run()

    await searchReportList()
  }
  */
  //}
}

const meetingHistory = async () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdHistory])
    .setQuery(meetingSearch)
    .setAfter(afterSearch2)
    .showMessage(false)
    .run()
}

// 작업표준 세부내용 추가
const addItem = (name) => {
  let d = new Date()
  let isUnitId = []
  let isActId = []
  let checkArray = []

  if (name == 'unit') {
    let maxId = (ArrayList.value.reduce((max, obj) => Math.max(max, obj['id']), 0) + 1).toString()
    let maxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)
    for (let el of ArrayList.value) {
      isUnitId.push(el.UNIT_ID.slice(-3))
    }
    let autoUnitId = isUnitId.length === 0 ? '001' : (Math.max(...isUnitId) + 1).toString().padStart(3, '0')
    let NEW_UNIT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-U' + autoUnitId

    ArrayList.value.push({
      level: 1,
      id: maxId,
      idx: maxIdx + 1,
      text: '' + maxId,
      child: [],
      UNIT_ID: NEW_UNIT_ID,
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      DATA_STATUS: 'N',
      STATUS: 'C',
      IS_CHECK: 'N',
      IS_SAVE: 'N',
      IS_SELECT: false,
      IS_SUCCESS: '',
      SAVE_TYPE: 'C',
    })
    //console.log('unit ArrayList :', ArrayList.value)
  } else if (name == 'act') {
    console.log('선택된 tempA', tempA)
    if (tempA == null) {
      Message.warn('단위작업을 선택해주세요.')

      return
    } else if(tempA.IS_CHECK == 'N'){
      Message.warn('단위작업을 선택해주세요.')

      return
    }

    let maxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[1]), 0)
    console.log('UNIT_MAX ID:', maxId)
    let maxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)
    let newId = tempA.id + '_' + (maxId + 1)
    checkArray = sItem.value.split('_')
    let lastDashIndex = tempA.UNIT_ID.lastIndexOf('-')
    let unitActId = '-' + tempA.UNIT_ID.substring(lastDashIndex + 1)

    for (let el of tempA.child) {
      isActId.push(el.ACT_ID.slice(-3))
    }

    let autoActId = isActId.length === 0 ? '001' : (Math.max(...isActId) + 1).toString().padStart(3, '0')
    let NEW_ACT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + unitActId + '-A' + autoActId
    let UNIT_ID = ArrayList.value.find((t) => t.id === checkArray[0]).UNIT_ID

    tempA.child.push({
      level: 2,
      id: newId,
      pid: tempA.id,
      idx: maxIdx + 1,
      text: '' + maxId,
      child: [],
      ACT_ID: NEW_ACT_ID,
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      // WORK_STANDARD_ID : 'HHIS-CW-G2P0-001-01',
      UNIT_ID: UNIT_ID,
      DATA_STATUS: 'N',
      STATUS: 'C',
      IS_SELECT: false,
      IS_CHECK: 'N',
      IS_SAVE: 'N',
      IS_SUCCESS: '',
      ACT_NM: '',
      CHK_NM: '',
      FILE_COUNT: 0,
    })
  } else if (name == 'risk') {
    if (tempB == null) {
      Message.warn('작업행동/체크정보를 선택해주세요.')

      return
    } else if(tempB.IS_CHECK == 'N'){
      Message.warn('작업행동/체크정보를 선택해주세요.')

      return
    }

    console.log('tempB.child: ', tempB.child)
    let maxId = tempB.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[2]), 1)
    console.log('ACT_MAX ID:', maxId)
    let maxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
    let newId = tempB.id + '_' + (maxId + 1)
    checkArray = sItem.value.split('_').slice(0, 2)
    sItem.value = sItem.value.split('_')[0] + '_' + sItem.value.split('_')[1]
    console.log('checkArray:', checkArray)
    console.log('sItem:', sItem)
    let UNIT_ID = ArrayList.value.find((unit) => unit.id === checkArray[0]).UNIT_ID
    let ACT_ID = ''

    ArrayList.value.forEach((item) => {
      if (item.child) {
        item.child.forEach((childItem) => {
          if (childItem.id === sItem.value) {
            ACT_ID = childItem.ACT_ID
          }
        })
      }
    })

    // let NEW_RISK_ID = 'HHIS-CW-G2P0-001-01' + '-R' + d.getTime()
    let NEW_RISK_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-R' + d.getTime()

    tempB.child.push({
      level: 3,
      id: newId,
      pid: tempB.id,
      idx: maxIdx + 1,
      text: '' + maxId,
      RISK_ID: NEW_RISK_ID,
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      //WORK_STANDARD_ID: 'HHIS-CW-G2P0-001-01',
      UNIT_ID: UNIT_ID,
      ACT_ID: ACT_ID,
      DATA_STATUS: 'N',
      STATUS: 'C',
      IS_SELECT: false,
      IS_CHECK: 'N',
      IS_SAVE: 'N',
      IS_SUCCESS: '',
      BEFOR_FRE: 1,
      BEFOR_MAT: 1,
      AFTER_FRE: '',
      AFTER_MAT: '',
      BEFOR_TOTAL: '1(매우낮음)',
      AFTER_TOTAL: '',
      RISK_CD_P_NM: '',
      RISK_CD_D_NM: '',
      RISK_NM: '',
      RM_CD_P_NM: '',
      RM_CD_D_NM: '',
      SAFE_NM: '',
      RM_NM: '',
    })
  } else if (name == 'D') rebuildArray()
}

const child = computed((id) => {
  return _.filter(todos, { id: id })
})

const selectRow = (ele) => {
  //console.log('ele', ele)

  const docOther = document.getElementsByClassName('selected-draggable')

  docOther.forEach((item) => {
    item.classList.remove('selected-draggable')
  })

  const classss = `${'row1_'}${ele.id}`
  const doc = document.getElementById(classss)

  doc.classList.add('selected-draggable')
}

var tempA = null
var tempB = null
var tempC = null

const selectedItem = (item) => {
  if (item.level == 1) {
    // 선택된 대분류 찾기
    tempA = _.find(ArrayList.value, { id: item.id })
    tempB = null
    tempC = null

    console.log('대분류 = ', tempA)
  } else if (item.level == 2) {
    // 선택된 중분류 찾기
    let idA = item.id.split('_')[0]

    tempA = _.find(ArrayList.value, { id: idA })
    let A = _.find(ArrayList.value, { id: idA })
    tempB = _.find(A.child, { id: item.id })
    tempC = null
    //tempB = item
    console.log('(tempB)중분류 = ', tempB)
  } else if (item.level == 3) {
    // 선택된 소분류 찾기

    let idA = item.id.split('_')[0]
    let idB = item.pid

    let A = _.find(ArrayList.value, { id: idA })
    let B = _.find(A.child, { id: idB })

    tempA = _.find(ArrayList.value, { id: idA })
    tempB = _.find(A.child, { id: idB })
    tempC = _.find(B.child, { id: item.id })

    //tempC = item

    // console.log('소분류 = ', tempC)
  }
}

// ele = element
const selectCard = (ele) => {
  console.log('selectCard', ele)

  sItem.value = ele.id
  sItemLevel.value = ele.level

  // 선택된 아이템의 정보를 넘겨서 내부 id찾기
  selectedItem(ele)
  console.log('selectedItem = ', ele)

  const docOther = document.getElementsByClassName('selected-card')

  docOther.forEach((item) => {
    item.classList.remove('selected-card')
  })

  let cid = ''

  if (ele.level == 1) {
    cid = `${'card1_'}${ele.id}`
  } else if (ele.level == 2) {
    cid = `${'card2_'}${ele.id}`
  } else if (ele.level == 3) {
    cid = `${'card3_'}${ele.id}`
  }

  const doc = document.getElementById(cid)

  doc.classList.add('selected-card')
}

const selectCheck = (ele) => {
  console.log('selectCheck', ele)
  ArrayList.value.forEach((list) => {
    list.IS_CHECK = 'N'
  })

  ArrayList.value.forEach((item) => {
    if (item.child) {
      item.child.forEach((childItem) => {
        childItem.IS_CHECK = 'N'
      })
    }
  })

  ArrayList.value.forEach((item) => {
    item.child.forEach((childItem) => {
      if (childItem.child) {
        childItem.child.forEach((innerChildItem) => {
          innerChildItem.IS_CHECK = 'N'
        })
      }
    })
  })

  if (ele.level == '1') {
    // 대분류
    ArrayList.value.find((unit) => unit.id === ele.id).IS_CHECK = 'Y'
    ele.IS_CHECK = 'Y'
  } else if (ele.level == '2') {
    // 중분류
    const checkArray = ele.id.split('_')
    ArrayList.value.find((act) => act.id === checkArray[0]).IS_CHECK = 'Y'
    ele.IS_CHECK = 'Y'
  } else if (ele.level == '3') {
    // 소분류
    const checkArray = ele.id.split('_')
    ArrayList.value.find((act) => act.id === checkArray[0]).IS_CHECK = 'Y'
    let riskId = checkArray[0] + '_' + checkArray[1]
    ArrayList.value.find((act) => act.id === checkArray[0]).child.find((risk) => risk.id === riskId).IS_CHECK = 'Y'
    ele.IS_CHECK = 'Y'
  }
}

const dragOptions = {
  animation: 200,
}

const onDragStart = () => {
  //console.log('Drag Start')
}

const onDragEnd = (e) => {
  // 객체 배열의 idx를 1부터 재생성
  sortArray()
}

const sortArray = () => {
  let cntX = 1
  let cntY = 1
  let cntZ = 1

  ArrayList.value.forEach((x) => {
    cntY = 1
    x.idx = cntX++

    x.child.forEach((y) => {
      cntZ = 1
      y.idx = cntY++

      y.child.forEach((z) => {
        z.idx = cntZ++
      })
    })
  })
}

// 제거
const removeTodo = (type) => {
  if (type === 'unit') {
    ArrayList.value.forEach((unit) => {
      if (unit.IS_CHECK === 'Y') {
        unit.SAVE_TYPE = 'D'
        unit.STATUS = 'D'

        // 작업행동 제거
        unit.child.forEach((act) => {
          act.STATUS = 'D'

          // 위험요인 제거
          act.child.forEach((risk) => {
            risk.STATUS = 'D'
          })
        })
      }
    })
  } else if (type === 'act') {
    ArrayList.value.forEach((unit) => {
      if (unit.child) {
        unit.child.forEach((act) => {
          if (act.IS_CHECK === 'Y') {
            act.STATUS = 'D'

            // 위험요인 제거
            act.child.forEach((risk) => {
              risk.STATUS = 'D'
            })
          }
        })
      }
    })
  } else if (type === 'risk') {
    ArrayList.value.forEach((unit) => {
      if (unit.child) {
        unit.child.forEach((act) => {
          if (act.child) {
            act.child.forEach((risk) => {
              if (risk.IS_CHECK === 'Y') {
                risk.STATUS = 'D'
              }
            })
          }
        })
      }
    })
    //console.log('remove array : ',ArrayList.value)
  }
}

const changeDataEvent = (type, data, change) => {
  if (type === 'unit') {
    data.UNIT_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'act') {
    data.ACT_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'chk') {
    data.CHK_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'risk') {
    data.RISK_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'safe') {
    data.SAFE_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'rm') {
    data.RM_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  }
}

const checkedEvent = (type, data, value) => {
  //console.log('Check : ', data)
  if (type === 'unit') {
    WORK_STANDARD_UNIT.find((t) => t.UNIT_ID === data.UNIT_ID).IS_CHECK = value
  } else if (type === 'act') {
    WORK_STANDARD_ACT.find((t) => t.ACT_ID === data.ACT_ID).IS_CHECK = value
  } else if (type === 'risk') {
    WORK_STANDARD_RISK.find((t) => t.RISK_ID === data.RISK_ID).IS_CHECK = value
  }
}

const childList = (tp, data, data2) => {
  if (tp === 'act') {
    return WORK_STANDARD_ACT.filter((x) => x.STATUS !== 'D' && x.UNIT_ID === data)
  } else if (tp === 'risk') {
    return WORK_STANDARD_RISK.filter((x) => x.STATUS !== 'D' && x.WORK_STANDARD_ID === data && x.ACT_ID === data2)
  }
}

// 단위작업 조회
const searchUnit = async (id) => {
  console.log('ArrayList1 = ', ArrayList.value)
  // PKG_RSKBA0010.WORK_STANDARD_UNIT_S
  await commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_05',
    param: { WORK_STANDARD_ID: id, TRANS: WORK_STANDARD_MASTER.TRANS_CD },
  }).then(async (res) => {
    let maxId
    let maxIdx
    let SAVE_STATUS
    WORK_STANDARD_UNIT = res.ORESULT_CUR
    console.log('searchUnit = ', WORK_STANDARD_UNIT)
    ArrayList.value = []

    if (workType.value == 'U') {
      SAVE_STATUS = 'U'
    } else {
      SAVE_STATUS = 'C'
    }

    if (isRevision.value) WORK_STANDARD_UNIT.map((row) => (row.STATUS = 'C'))

    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      maxId = (ArrayList.value.length + 1).toString()
      maxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)

      ArrayList.value.push({
        level: 1,
        id: maxId,
        text: '' + maxId,
        child: [],
        WORK_STANDARD_ID: id,
        UNIT_ID: res.ORESULT_CUR[i].UNIT_ID,
        UNIT_NM: WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].UNIT_NM : res.ORESULT_CUR[i].TRANS_UNIT_NM,
        ORA_YN: res.ORESULT_CUR[i].ORA_YN,
        STATUS: isRevision.value ? 'C' : SAVE_STATUS,
        IS_CHECK: 'N',
      })
    }
    console.log('ArrayList: ', ArrayList)
    //console.log('(UNIT)단위작업 조회 결과 = ', res)
    await searchAct(id)
  })
}

// 작업행동 조회
const searchAct = async (id) => {
  // PKG_RSKBA0010.WORK_STANDARD_ACT_S
  await commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_06',
    param: { WORK_STANDARD_ID: id, TRANS: WORK_STANDARD_MASTER.TRANS_CD },
  }).then(async (res) => {
    let maxId
    let maxIdx
    let newId
    let SAVE_STATUS
    WORK_STANDARD_ACT = res.ORESULT_CUR
    console.log('searchAct = ', WORK_STANDARD_ACT)

    if (workType.value == 'U') {
      SAVE_STATUS = 'U'
    } else {
      SAVE_STATUS = 'C'
    }

    if (isRevision.value) WORK_STANDARD_ACT.map((row) => (row.STATUS = 'C'))

    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      tempA = _.find(ArrayList.value, { UNIT_ID: res.ORESULT_CUR[i].UNIT_ID })
      if (tempA) {
        console.log('tempA: ', tempA)
        maxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[1]), 0)
        maxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)
        newId = tempA.id + '_' + (maxId + 1)
        console.log('maxId maxIdx  newId: ', maxId, maxIdx, newId)
        tempA.child.push({
          level: 2,
          id: newId,
          pid: tempA.id,
          idx: maxIdx + 1,
          text: '' + maxId,
          child: [],
          WORK_STANDARD_ID: id,
          UNIT_ID: res.ORESULT_CUR[i].UNIT_ID,
          ACT_ID: res.ORESULT_CUR[i].ACT_ID,
          ACT_NM: WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].ACT_NM : res.ORESULT_CUR[i].TRANS_ACT_NM,
          CHK_NM: WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].CHK_NM : res.ORESULT_CUR[i].TRANS_CHK_NM,
          STATUS: isRevision == true ? 'C' : SAVE_STATUS,
          FILE_COUNT: res.ORESULT_CUR[i].FILE_COUNT,
          IS_CHECK: 'N',
        })
      }
    }
    //console.log('(ACT)작업행동 조회 결과 = ', res)
    await searchRisk(id, res)
  })
}

// 위험요인 조회
const searchRisk = async (id, data) => {
  // PKG_RSKBA0010.WORK_STANDARD_RISK_S
  await commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_07',
    param: { WORK_STANDARD_ID: id, TRANS: WORK_STANDARD_MASTER.TRANS_CD },
  }).then(async (res) => {
    // 선택된 소분류 찾기
    let maxId
    let maxIdx
    let newId
    let A
    let SAVE_STATUS
    WORK_STANDARD_RISK = res.ORESULT_CUR
    console.log('searchRISK = ', WORK_STANDARD_RISK)

    if (workType.value == 'U') {
      SAVE_STATUS = 'U'
    } else {
      SAVE_STATUS = 'C'
    }

    if (isRevision.value) WORK_STANDARD_RISK.map((row) => (row.STATUS = 'C'))

    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      console.log('data.ORESULT_CUR = ', data.ORESULT_CUR)
      console.log('res ORESULT_CUR = ', res.ORESULT_CUR)

      let getUnit = _.find(data.ORESULT_CUR, { ACT_ID: res.ORESULT_CUR[i].ACT_ID })

      console.log('getUnit = ', getUnit)

      if (getUnit) {
        console.log('ArrayList = ', ArrayList.value)
        A = _.find(ArrayList.value, { UNIT_ID: getUnit.UNIT_ID })

        console.log('A = ', A)
        console.log('res.ORESULT_CUR[i].ACT_ID = ', res.ORESULT_CUR[i].ACT_ID)

        if (A) {
          tempB = _.find(A.child, { ACT_ID: res.ORESULT_CUR[i].ACT_ID })
          maxId = tempB.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[2]), 1)
          maxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
          newId = tempB.id + '_' + (maxId + 1)

          tempB.child.push({
            level: 3,
            id: newId,
            pid: tempB.id,
            idx: maxIdx + 1,
            text: '' + maxId,
            child: [],
            WORK_STANDARD_ID: id,
            ACT_ID: res.ORESULT_CUR[i].ACT_ID,
            RISK_ID: res.ORESULT_CUR[i].RISK_ID,
            RISK_CD: res.ORESULT_CUR[i].RISK_CD,
            RISK_CD_P_NM: res.ORESULT_CUR[i].RISK_CD_P_NM,
            RISK_CD_D_NM: res.ORESULT_CUR[i].RISK_CD_D_NM,
            RISK_NM:
              WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].RISK_NM : res.ORESULT_CUR[i].TRANS_RISK_NM,
            RM_CD: res.ORESULT_CUR[i].RM_CD,
            RM_CD_P_NM: res.ORESULT_CUR[i].RM_CD_P_NM,
            RM_CD_D_NM: res.ORESULT_CUR[i].RM_CD_D_NM,
            SAFE_NM: WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].SAFE_NM : res.ORESULT_CUR[i].TRANS_SAFE_NM,
            RM_NM: WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].RM_NM : res.ORESULT_CUR[i].TRANS_RM_NM,
            BEFOR_FRE: res.ORESULT_CUR[i].BEFOR_FRE, // 빈도
            BEFOR_MAT: res.ORESULT_CUR[i].BEFOR_MAT, // 강도
            AFTER_FRE: res.ORESULT_CUR[i].AFTER_FRE, // 빈도
            AFTER_MAT: res.ORESULT_CUR[i].AFTER_MAT, // 강도
            BEFOR_TOTAL: res.ORESULT_CUR[i].BEFOR_TOTAL, // 개선전 위험성
            AFTER_TOTAL: res.ORESULT_CUR[i].AFTER_TOTAL, // 개선후 위험성
            STATUS: isRevision.value ? 'C' : SAVE_STATUS,
            IS_CHECK: 'N',
          })
        }
      }
    }
    //console.log('tempB Child = ', tempB.child)
  })
}

const fileSave = () => {
  let actId
  let fileId
  ArrayList.value.forEach((item) => {
    if (item.child) {
      item.child.forEach((childItem) => {
        if (childItem.id === sItem.value) {
          actId = childItem.ACT_ID
          fileId = childItem.FILE_ID
          console.log('childItem.fileId = ', childItem.FILE_ID)
        }
      })
    }
  })

  if (fileId == null || fileId == '') {
    let params = {
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      ACT_ID: actId,
    }

    // let id = 'HHIS-CW-G2P0-001-01'
    // let act_id = 'HHIS-CW-G2P0-001-01-A1707894996976'

    commonSearchApi({ queryId: 'RSKBA0010_SEARCH_20', param: params }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        // 기존 Hi-Standard는 File_ID없고, ACT_ID로 관리하기 때문에 분기 처리
        let fid = res.ORESULT_CUR[0].FILE_ID != null ? res.ORESULT_CUR[0].FILE_ID : res.ORESULT_CUR[0].ACT_ID

        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
        fileUploadPopup.value.setGuid(fid)
        //fileUploadPopup.value.setGuid(res.ORESULT_CUR[0].FILE_ID)
      } else {
        fileUploadPopup.value.setGuid()
      }

      fileId = fileUploadPopup.value.guid
      fileUploadPopup.value.setGuid(fileId)
      fileUploadPopup.value.openPopup(fileId)
    })
  } else {
    fileUploadPopup.value.setGuid(fileId)
    fileUploadPopup.value.openPopup(fileId)
  }

  //console.log('sItem = ', sItem.value)
  //console.log('file save : ',actId)
  //console.log('file work id : ',WORK_STANDARD_MASTER.WORK_STANDARD_ID)
}

// 파일 업로드 후 저장
const uploaded = (param) => {
  let actId
  ArrayList.value.forEach((item) => {
    if (item.child) {
      item.child.forEach((childItem) => {
        if (childItem.id == sItem.value) {
          actId = childItem.ACT_ID
          childItem.FILE_ID = param.fileId
          fileUploadPopup.value.getFileCount().then((res) => {
            childItem.FILE_COUNT = res
          })
          //console.log('childItem = ', childItem)
          //console.log('fileId = ', param.fileId)
        }
      })
    }
  })
  //console.log('upload actId :',actId)

  let params = [
    {
      // WORK_STANDARD_ID: 'HHIS-CW-G2P0-001-01',
      // ACT_ID: 'HHIS-CW-G2P0-001-01-A1707894996976',
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      ACT_ID: actId,
      FILE_ID: param.fileId,
      USR_ID: userStore.userId,
    },
  ]

  //console.log('WORK_STANDARD_ID = ', WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  //console.log('ACT_ID = ', actId)
  //console.log('FILE_ID = ', param.fileId)

  //PKG_RSKBA0010.FILE_ACT_M
  return commonExecuteApi({ queryId: 'RSKBA0010_SAVE_10', list: params })
}

// 파일 삭제 후 파일 아이디 삭제
const deleted = (list) => {
  //console.log('delete list : ', list)

  let actId
  ArrayList.value.forEach((item) => {
    if (item.child) {
      item.child.forEach((childItem) => {
        if (childItem.id === 'sItem') {
          actId = childItem.ACT_ID
          fileUploadPopup.value.getFileCount().then((res) => {
            childItem.FILE_COUNT = res
          })
        }
      })
    }
  })

  let params = [
    {
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      ACT_ID: actId,
      // ACT_ID: 'HHIS-CW-G2P0-001-01-A1707894996976',
    },
  ]

  commonSearchApi({
    queryId: 'RSKBA0010_SEARCH_20',
    param: { WORK_STANDARD_ID: params.WORK_STANDARD_ID, ACT_ID: params.ACT_ID },
  }).then((res) => {
    if (res.ORESULT_CUR.length == 0) {
      // PKG_RSKBA0010.FILE_AFTER_M
      return commonExecuteApi({ queryId: 'RSKBA0010_SAVE_11', list: params })
    }
  })
}

// 교육이수파일첨부 호출
const popupFile = () => {
  fileUploadEduPopup.value.openPopup(WORK_STANDARD_MASTER.EDU_FILE_ID)
}

// 교육이수파일첨부 업로드 시
const uploadedFile = (list) => {
  //console.log('uploadedFile list : ', list)
  if (!WORK_STANDARD_MASTER.EDU_FILE_ID) {
    WORK_STANDARD_MASTER.EDU_FILE_ID = list.fileId
  }

  commonSearchApi({
    queryId: 'searchFile',
    param: { CMPNY_DIV: WORK_STANDARD_MASTER.COMPANY_CD, FILE_ID: WORK_STANDARD_MASTER.EDU_FILE_ID },
  }).then((res2) => {
    //console.log('res2 : ', res2.ORESULT_CUR.length)
    WORK_STANDARD_MASTER.EDU_FILE_COUNT = res2.ORESULT_CUR.length + '건'
  })
}

// 교육이수파일첨부 삭제 시
const deletedFile = (list) => {
  //console.log('deletedFile list : ', list)
  /* if(list.rowCnt === 0){
    WORK_STANDARD_MASTER.EDU_FILE_ID = ''
  } */
}

// 위험성 문구
const changeFreMatEvent = (gbn, type, data, change) => {
  if (type === 'FRE') {
    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'MAT') {
    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  }

  if (gbn === 'BEFOR') {
    befor1.value = false
    befor2.value = false
    befor3.value = false
    befor4.value = false

    if (data.BEFOR_FRE === '' || data.BEFOR_MAT === '') {
      return false
    }

    let total = parseInt(data.BEFOR_FRE) * parseInt(data.BEFOR_MAT)
    //console.log('BEFOR total : ', total)
    if ([1, 2, 3].includes(total)) {
      data.BEFOR_TOTAL = total + '(매우낮음)'
      befor1.value = true
    } else if ([4, 5, 6].includes(total)) {
      data.BEFOR_TOTAL = total + '(낮음)'
      befor2.value = true
    } else if ([8, 9, 10, 12].includes(total)) {
      data.BEFOR_TOTAL = total + '(위험)'
      befor3.value = true
    } else if ([15, 16, 20, 25].includes(total)) {
      data.BEFOR_TOTAL = total + '(매우위험)'
      befor4.value = true
    }
  } else if (gbn === 'AFTER') {
    after1.value = false
    after2.value = false
    after3.value = false
    after4.value = false

    if (data.AFTER_FRE === '' || data.AFTER_MAT === '') {
      return false
    }

    let total = parseInt(data.AFTER_FRE) * parseInt(data.AFTER_MAT)
    //console.log('AFTER total : ', total)
    if ([1, 2, 3].includes(total)) {
      data.AFTER_TOTAL = total + '(매우낮음)'
      after1.value = true
    } else if ([4, 5, 6].includes(total)) {
      data.AFTER_TOTAL = total + '(낮음)'
      after2.value = true
    } else if ([8, 9, 10, 12].includes(total)) {
      data.AFTER_TOTAL = total + '(위험)'
      after3.value = true
    } else if ([15, 16, 20, 25].includes(total)) {
      data.AFTER_TOTAL = total + '(매우위험)'
      after4.value = true
    } else {
      data.AFTER_TOTAL = ''
    }
  }
}

const getColor = (gbn, data) => {
  if (gbn == 'BEFOR') {
    if (data.BEFOR_FRE == '' || data.BEFOR_MAT == '') return ''

    let total = parseInt(data.BEFOR_FRE) * parseInt(data.BEFOR_MAT)

    if (total > 6) return 'risk-color-white'
    else return 'risk-color-black'
  } else if (gbn == 'AFTER') {
    if (data.AFTER_FRE == '' || data.AFTER_MAT == '') return ''

    let total = parseInt(data.AFTER_FRE) * parseInt(data.AFTER_MAT)

    if (total > 6) return 'risk-color-white'
    else return 'risk-color-black'
  }
}

// 현재의 위험성 색상 처리
const riskColor = (gbn, data) => {
  if (gbn == 'BEFOR') {
    if (data.BEFOR_FRE === '' || data.BEFOR_MAT === '') {
      return ''
    }

    let total = parseInt(data.BEFOR_FRE) * parseInt(data.BEFOR_MAT)

    if ([1, 2, 3].includes(total)) {
      return 'green'
    } else if ([4, 5, 6].includes(total)) {
      return '#FFF9C4'
    } else if ([8, 9, 10, 12].includes(total)) {
      return '#FFA726'
    } else if ([15, 16, 20, 25].includes(total)) {
      return 'red'
    }
  } else if (gbn == 'AFTER') {
    if (data.AFTER_FRE === '' || data.AFTER_MAT === '') {
      return ''
    }

    let total = parseInt(data.AFTER_FRE) * parseInt(data.AFTER_MAT)

    if ([1, 2, 3].includes(total)) {
      return 'green'
    } else if ([4, 5, 6].includes(total)) {
      return '#FFF9C4'
    } else if ([8, 9, 10, 12].includes(total)) {
      return '#FFA726'
    } else if ([15, 16, 20, 25].includes(total)) {
      return 'red'
    }
  }
  /*
  else if (gbn == 'AFTER') {
    if (data.AFTER_FRE === '' || data.AFTER_MAT === '') {
      return ''
    }

    let total = parseInt(data.AFTER_FRE) * parseInt(data.AFTER_MAT)

    if ([1, 2, 3].includes(total)) {
      return 'colorGreen'
    } else if ([4, 5, 6].includes(total)) {
      return 'colorGreenYellow'
    } else if ([8, 9, 10, 12].includes(total)) {
      return 'colorOrange'
    } else if ([15, 16, 20, 25].includes(total)) {
      return 'colorRed'
    }
  }*/
}

/**
 * 결재 상신 팝업창 띄우기
 * @param {string} taskType R: 결재상신(제정/개정), WD: 폐지
 */
// 결재 상신
const approvalPopUp = (taskType) => {
  //console.log('approvalPopUp : ', taskType)

  if (isEmpty(WORK_STANDARD_MASTER.IS_SAVE)) {
    return Message.warn(t('저장 후 결재상신이 가능합니다. 먼저 저장버튼을 클릭해주세요'))
  } else if (isApproval.value == false) {
    return Message.warn(
      t(
        '표준서 정보의 사업장 안전보건정보(사고, 현장위험성평가, 안전작업요구권, 안전리스크) 중 하나를 확인해야 결재상신이 가능합니다.'
      )
    )
  } else {
    approvalSaveData.info = infoSet(taskType)
    approvalSaveData.approver = ''
    approvalSaveData.worklist = workListSet()

    // 테스트 정성근, 강원일 사번은 현중 오피스 상신시 없는 사번이라 나옴
    // 임시로 한매니저 사번으로 테스트 중
    // 향후 오픈 시엔 변경할 것
    approvalParam.userId = userStore.userId
    approvalParam.appr_comment = ''
    approvalParam.work_desc = WORK_STANDARD_MASTER.WORK_STANDARD_DESC
    // approvalParam.userId = 'A526166'
    approvalParam.origin = '1'
  }

  // if(userStore.userId === 'A526166')
  //   userStore.userDiv = 'B'

  //console.log('approvalPopUp>>saveData : ', approvalSaveData)
  //console.log('approvalPopUp>>params : ', approvalParam)

  /*
  console.log('APPROVAL : send parameter')
  console.log('CLSS_ID = ', logsStore.vueId)
  console.log('TITLE = ', '작업표준 제정/개정 신청')
  console.log('CMPNY_DIV = ', userStore.cmpnyDiv)
  console.log('DATA_KEY = ', WORK_STANDARD_MASTER.COMPANY_CD + ';' +
                             userStore.bsnsCd + ';' +
                             userStore.deptCd + ';' +
                             userStore.asgnCd + ';' +
                             new Date().getFullYear())
  console.log('REPORT = ', '결재 내용?')
  console.log('MODE = ', '3')
  console.log('FORM_ID = ', '421')
  console.log('CLRLINE = ', 'CLR_15')
  */
  // console.log('infoSet = ', infoSet(taskType).apprContents)

  let header = WORK_STANDARD_MASTER.WORK_STANDARD_KIND == 'C' ? '(제정)' : '(개정)'
  let line = isMaster.value ? '' : 'CLR_15'
  arrMaster = []
  //console.log('line = ', line)
  // 직영: A, 협력사: B
  if (userStore.userDiv == 'A') {
    //console.log('kind = ', WORK_STANDARD_MASTER.WORK_STANDARD_KIND)
    approvalPopup.value.openPopup({
      RSK_RES_ID: taskType + WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      CLSS_ID: logsStore.vueId,
      TITLE: (taskType === 'R' ? header : '(폐지)') + WORK_STANDARD_MASTER.WORK_STANDARD_NM,
      CMPNY_DIV: WORK_STANDARD_MASTER.COMPANY_CD,
      DATA_KEY:
        WORK_STANDARD_MASTER.COMPANY_CD +
        ';' +
        userStore.bsnsCd +
        ';' +
        userStore.deptCd +
        ';' +
        userStore.asgnCd +
        ';' +
        new Date().getFullYear(),
      //REPORT: '결재 내용?',
      REPORT: infoSet(taskType).apprContents,
      MODE: '3',
      FORM_ID: '421',
      CLRLINE: line,
      //CLRLINE: 'CLR_15'
    })
  } else {
    //console.log('send param = ', WORK_STANDARD_MASTER)

    // 내부 결재용
    refApprovalPopupInApp.value.openPopup({
      CMPNY_DIV: WORK_STANDARD_MASTER.COMPANY_CD,
      WORK_TYPE: taskType, // R: 위험성평가 제정/개정,  WD: 폐지
      WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      FORM_ID: 'RSKBA0010',
      PATH: useLogsStore().path,
    })
  }

  /*
  approvalPopup.value.openPopupRSK({
    info: approvalSaveData.info,
    approver: approvalSaveData.approver,
    worklist : approvalSaveData.worklist,
    appr_comment : approvalParam.appr_comment,
    work_desc : approvalParam.work_desc,
    userId : approvalParam.userId,
    origin: approvalParam.origin,
  })*/
}

const infoSet = (taskType) => {
  let contents = ''
  let date =
    WORK_STANDARD_MASTER.APPROVAL_DATE === null ? '' : dayjs(WORK_STANDARD_MASTER.APPROVAL_DATE).format('YYYY-MM-DD')

  switch (taskType) {
    case 'WD':
      contents =
        '<div class="d-flex flex-row">' +
        '다음 작업표준에 대한 폐지 결재를 상신합니다. 확인 후 승인하여 주시기 바랍니다' +
        '</div>' +
        '<table class="table_10" style="margin-bottom:5px; border-collapse : collapse; width: 400px;">' +
        '<colgroup>' +
        '<col style="width:30%">' +
        '<col style="width:70%">' +
        '</colgroup>' +
        '<tbody>' +
        '<tr class="pa-0 ma-0">' +
        '<th style="border: 1px solid black; border-collapse : collapse;">구분</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.GUBUN_NM +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">표준번호</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NO +
        '-' +
        WORK_STANDARD_MASTER.WORK_STANDARD_REVISION +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">표준서명</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">제/개정일자</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        date +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">작성자</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.USER_INFO +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">평가유형</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.RISK_TYPE_NM +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">제/개정사유</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.WORK_STANDARD_DESC +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="2">' +
        '<a target="_blank" href="' +
        'https://' +
        'hises.hd.com/hse/excel/work_detail2' + // 테스트 향후 주소 변경해야함
        '?IN_EXCEL_TYPE=STD&IN_TRANS=ko&IN_WORK_STANDARD_ID=' +
        WORK_STANDARD_MASTER.WORK_STANDARD_ID +
        '&IN_USER_DIV=A' +
        '">위험성평가 결과 상세보기(Hi-STANDARD)</a>' +
        '</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>'

      /*
  contents = `다음 작업표준에 대한 폐지 결재를 상신합니다. 확인 후 승인하여 주시기 바랍니다
      <html>
        <head>
          <title>OZ HTML</title>
            <style type="text/css">
            <!--
            div.offset{
            position:absolute;
            background-color:transparent;
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -ms-box-sizing: border-box;
            -webkit-box-sizing: border-box;
            left:0px;
            top:0px;
            width:0px;
            height:0px;
            }
            div{
            position:relative;
            }
            table.one{
            width:100%;
            height:100%;
            border:0;
            }
            table.two{
            width:100%;
            height:100%;
            border:0;
            line-height:80%;
            }
            table.three{
            width:100%;
            height:100%;
            border:0;
            line-height:60%;
            }
            table.four{
            width:100%;
            height:100%;
            border:0;
            line-height:40%;
            }
            table.five{
            width:100%;
            height:100%;
            border:0;
            line-height:20%;
            }
            br{letter-spacing:0;}
            #center{
            text-align:center;
            }
            div.b_0{
            border-width:1px;
            border-color:#000000;
            border-style:solid;
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -ms-box-sizing: border-box;
            -webkit-box-sizing: border-box;
            }
            #f_010w013P000s000P000{
            font-size:10pt;
            line-height:13.0pt;
            letter-spacing:0.0pt;
            }
            font.맑은 고딕{
            font-family:맑은 고딕;
            }
            -->
          </style>
        </head>
        <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
          <div class=offset style="background-color:transparent;left:0px;top:0px;width:793px;height:1123px">
          <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:40px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>구분</font></td></tr></table></div></div>
          <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:40px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${ WORK_STANDARD_MASTER.GUBUN_NM }</font></td></tr></table></div></div>
          <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:82px;width:149px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>표준번호</font></td></tr></table></div></div>
          <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:82px;width:308px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.WORK_STANDARD_ID}</font></td></tr></table></div></div>
          <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:125px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>표준서명</font></td></tr></table></div></div>
          <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:125px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.WORK_STANDARD_NM }</font></td></tr></table></div></div>
          <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:167px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>제/개정일자</font></td></tr></table></div></div>
          <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:167px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.APPROVAL_DATE}</font></td></tr></table></div></div>
          <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:209px;width:149px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>작성자</font></td></tr></table></div></div>
          <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:209px;width:308px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.USER_INFO}</font></td></tr></table></div></div>
          <div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:252px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>평가유형</font></td></tr></table></div></div>
          <div class=offset style="z-index:12"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:252px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.RISK_TYPE_NM}</font></td></tr></table></div></div>
          <div class=offset style="z-index:13"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:294px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>제/개정사유</font></td></tr></table></div></div>
          <div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:294px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.WORK_STANDARD_DESC}</font></td></tr></table></div></div>
          </div>
          <a target="_blank" href="
            http://hises.hd.com/hse/excel/work_detail2?
            IN_EXCEL_TYPE=STD&IN_TRANS=ko&IN_WORK_STANDARD_ID=${WORK_STANDARD_MASTER.WORK_STANDARD_ID}">
            위험성평가 결과 상세보기(Hi-STANDARD)
          </a>
        </body>
      </html>
      `*/

      /*
    contents =
      '다음 작업표준에 대한 폐지 결재를 상신합니다. 확인 후 승인하여 주시기 바랍니다' +
      '<table class="table_10" style="margin-bottom:5px;">' +
      '<colgroup>' +
      '<col style="width:13%">' +
      '<col style="width:87%">' +
      '</colgroup>' +
      '<tbody>' +
      '<tr>' +
      '<th>구분</th>' +
      '<td>' + WORK_STANDARD_MASTER.GUBUN_NM + '</td>' +
      '</tr>' +
      '<tr>' +
      '<th>표준번호</th>' +
      '<td>' + WORK_STANDARD_MASTER.WORK_STANDARD_NO +
      '-' + WORK_STANDARD_MASTER.WORK_STANDARD_REVISION +
      '</td>' +
      '</tr>' +
      '<tr>' +
      '<th>표준서명</th>' +
      '<td>' + WORK_STANDARD_MASTER.WORK_STANDARD_NM + '</td>' +
      '</tr>' +
      '<tr>' +
      '<th>제/개정일자</th>' +
      '<td>' + WORK_STANDARD_MASTER.WORK_STANDARD_KIND == 'C' ? WORK_STANDARD_MASTER.C_DATE : WORK_STANDARD_MASTER.U_DATE + '</td>' +
      '</tr>' +
      '<tr>' +
      '<th>작성자</th>' +
      '<td>' + WORK_STANDARD_MASTER.USER_INFO + '</td>' +
      '</tr>' +
      '<tr>' +
      '<th>평가유형</th>' +
      '<td>' + WORK_STANDARD_MASTER.RISK_TYPE_NM + '</td>' +
      '</tr>' +
      '<tr>' +
      '<th>제/개정사유</th>' +
      '<td>' + WORK_STANDARD_MASTER.WORK_STANDARD_DESC + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td colspan="2">' +
      '<a target="_blank" href="' +
      'http://' +
      'hises.hd.com/hse/EXCEL/WORK_DETAIL2' +  // 테스트 향후 주소 변경해야함
      '?IN_EXCEL_TYPE=STD&IN_TRANS=ko&IN_WORK_STANDARD_ID=' +
      WORK_STANDARD_MASTER.WORK_STANDARD_ID +
      '">위험성평가 결과 상세보기(Hi-STANDARD)</a>' +
      '</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>'
    */

      return {
        apprFormName: '[Hi-STANDARD] ' + WORK_STANDARD_MASTER.WORK_STANDARD_NM,
        apprSubject: '[위험성평가] ' + WORK_STANDARD_MASTER.WORK_STANDARD_NM,
        apprContents: contents,
        //apprContents: apprBodyHtmlSet(contents),
        apprType: 'WD',
        origin: '1',
      }
      break
    case 'R':
      //console.log('WORK_STANDARD_MASTER = ', WORK_STANDARD_MASTER)
      /*
    contents = `
      <html>
        <head>
          <title>OZ HTML</title>
            <style type="text/css">
            <!--
            div.offset{
            position:absolute;
            background-color:transparent;
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -ms-box-sizing: border-box;
            -webkit-box-sizing: border-box;
            left:0px;
            top:0px;
            width:0px;
            height:0px;
            }           
            div{
            position:relative;
            }
            table.one{
            width:100%;
            height:100%;
            border:0;
            }
            table.two{
            width:100%;
            height:100%;
            border:0;
            line-height:80%;
            }
            table.three{
            width:100%;
            height:100%;
            border:0;
            line-height:60%;
            }
            table.four{
            width:100%;
            height:100%;
            border:0;
            line-height:40%;
            }
            table.five{
            width:100%;
            height:100%;
            border:0;
            line-height:20%;
            }
            br{letter-spacing:0;}
            #center{
            text-align:center;
            }
            div.b_0{
            border-width:1px;
            border-color:#000000;
            border-style:solid;
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -ms-box-sizing: border-box;
            -webkit-box-sizing: border-box;
            }
            #f_010w013P000s000P000{
            font-size:10pt;
            line-height:13.0pt;
            letter-spacing:0.0pt;
            }
            font.맑은 고딕{
            font-family:맑은 고딕;
            }
            -->
          </style>
        </head>
        <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
          <div style="text-align: left;">
            <div>아래와 같이 위험성평가 결과를 보고드리니, 확인 후 승인하여 주시기 바랍니다</div>
            <div class=offset style="background-color:transparent;left:0px;top:0px;width:793px;height:350px">
              <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:40px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>구분</font></td></tr></table></div></div>
              <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:40px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${ WORK_STANDARD_MASTER.GUBUN_NM }</font></td></tr></table></div></div>
              <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:82px;width:149px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>표준번호</font></td></tr></table></div></div>
              <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:82px;width:308px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.WORK_STANDARD_ID}</font></td></tr></table></div></div>
              <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:125px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>표준서명</font></td></tr></table></div></div>
              <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:125px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.WORK_STANDARD_NM }</font></td></tr></table></div></div>
              <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:167px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>제/개정일자</font></td></tr></table></div></div>
              <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:167px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.APPROVAL_DATE}</font></td></tr></table></div></div>
              <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:209px;width:149px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>작성자</font></td></tr></table></div></div>
              <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:209px;width:308px;height:44px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.USER_INFO}</font></td></tr></table></div></div>
              <div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:252px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>평가유형</font></td></tr></table></div></div>
              <div class=offset style="z-index:12"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:252px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.RISK_TYPE_NM}</font></td></tr></table></div></div>
              <div class=offset style="z-index:13"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:294px;width:149px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>제/개정사유</font></td></tr></table></div></div>
              <div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:175px;top:294px;width:308px;height:43px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=맑은 고딕><nobr/>${WORK_STANDARD_MASTER.WORK_STANDARD_DESC}</font></td></tr></table></div></div>
            </div>
            <a target="_blank" href="
              http://hises.hd.com/hse/EXCEL/WORK_DETAIL2?
              style="text-align: left;"
              IN_EXCEL_TYPE=STD&IN_TRANS=ko&IN_WORK_STANDARD_ID=${WORK_STANDARD_MASTER.WORK_STANDARD_ID}">
              위험성평가 결과 상세보기(Hi-STANDARD)
            </a>
          </div>
        </body>
      </html>
      `*/

      contents =
        '<div class="d-flex flex-row">' +
        '아래와 같이 위험성평가 결과를 보고드리니, 확인 후 승인하여 주시기 바랍니다' +
        '</div>' +
        '<table class="table_10" style="margin-bottom:5px; border-collapse : collapse; width: 400px;">' +
        '<colgroup>' +
        '<col style="width:30%">' +
        '<col style="width:70%">' +
        '</colgroup>' +
        '<tbody>' +
        '<tr class="pa-0 ma-0">' +
        '<th style="border: 1px solid black; border-collapse : collapse;">구분</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.GUBUN_NM +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">표준번호</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NO +
        '-' +
        WORK_STANDARD_MASTER.WORK_STANDARD_REVISION +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">표준서명</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">제/개정일자</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        date +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">작성자</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.USER_INFO +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">평가유형</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.RISK_TYPE_NM +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<th style="border: 1px solid black; border-collapse : collapse;">제/개정사유</th>' +
        '<td style="border: 1px solid black; border-collapse : collapse;">' +
        WORK_STANDARD_MASTER.WORK_STANDARD_DESC +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="2">' +
        '<a target="_blank" href="' +
        'https://' +
        'hises.hd.com/hse/excel/work_detail2' + // 테스트 향후 주소 변경해야함
        '?IN_EXCEL_TYPE=STD&IN_TRANS=ko&IN_WORK_STANDARD_ID=' +
        WORK_STANDARD_MASTER.WORK_STANDARD_ID +
        '&IN_USER_DIV=A' +
        '">위험성평가 결과 상세보기(Hi-STANDARD)</a>' +
        '</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>'

      //console.log('infoSet : ', contents)
      //console.log('infoSet2 : ', apprBodyHtmlSet(contents))

      return {
        apprFormName: '[Hi-STANDARD] ' + WORK_STANDARD_MASTER.WORK_STANDARD_NM,
        apprSubject: '[위험성평가] ' + WORK_STANDARD_MASTER.WORK_STANDARD_NM,
        apprContents: contents,
        //apprContents: apprBodyHtmlSet(contents),
        apprType: 'R',
        origin: '1',
      }
      break
  }
}

const apprBodyHtmlSet = (contents) => {
  let html = ''

  html = '<table class="table_10">'
  html += '<colgroup>'
  html += '<col style="width:100%">'
  html += '</colgroup>'
  html += '<tbody>'

  html += '<tr>'
  html += '<td colspan="2">'
  html += contents
  html += '</td>'
  html += '</tr>'
  html += '</tbody></table>'

  return html
}

// 결재 상신 후, 처리 결과 리턴
const approvalResult = (res) => {
  //console.log('approval Res =======', res)

  let apprType = res.appkey.substring(0, 1)
  let workId = res.appkey.substring(1)
  let draft = res.draft
  let approver = res.clrLine

  // 폐지인 경우, 앞의 두자리가 WD이므로 예외처리
  if (res.appkey.substring(0, 2) == 'WD') {
    apprType = res.appkey.substring(0, 2)
    workId = res.appkey.substring(2)
  }

  //console.log('apprType =', apprType)
  //console.log('workId =', workId)
  //console.log('draft =', draft)

  if (apprType == undefined || apprType == null) return

  let params = [
    {
      APPR_ID: res.appkey,
      APPR_TYPE: apprType,
      WORK_ID: workId,
      DRAFT_USR: draft,
      //APPR_USR: draft + ';' + approver, // 기안자가 앞에 들어가고 결재자 넣기
      //APPR_COMMENT: '',
      WORK_DESC: WORK_STANDARD_MASTER.WORK_STANDARD_DESC,
    },
  ]

  commonExecuteApi({ queryId: 'PKG_CSX02_COMMON_COMM_APPROVAL', list: params }).then((res) => {
    // 결재상신 처리 후, 저장, 상신, 폐지 버튼 비활성화 시키기
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnRskDel', true)

    //console.log('떴나??')
  })

  // 결재 상신 완료시, 저장/결재상신 버튼 비활성화
  /*
  if(res.toUpperCase() === 'OK')
  {
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnReqApply', true)
  }*/
}

const approvalResultInApp = (res) => {
  console.log('res = ', res)

  // 결재상신 처리 후, 저장, 상신, 폐지 버튼 비활성화 시키기
  menuTitle.value.disableBtn('btnUpdate', true)
  menuTitle.value.disableBtn('btnReqApply', true)
  menuTitle.value.disableBtn('btnRskDel', true)
}

/**
 * RETURN WORK_STANDARD_MASTER.WORK_STANDARD_ID
 */
const workListSet = () => {
  let worklist = ''

  worklist = WORK_STANDARD_MASTER.WORK_STANDARD_ID

  return worklist
}

// 언어 변경시 조회
const changeTrans = () => {
  //console.log('value = ', value)
  search(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  searchUnit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
}

// 현황에서 불러온 경우 조회 및 버튼 활성/비활성화
const initData = async (wtype, wid, pStatus, revDept) => {
  let workNo = wid.slice(0, -3)

  WORK_STANDARD_MASTER.WORK_STANDARD_ID = wid
  WORK_STANDARD_MASTER.WORK_STANDARD_NO = workNo

  menuTitle.value.disableBtn('btnSearch', false)
  menuTitle.value.disableBtn('btnUpdate', false)
  menuTitle.value.disableBtn('btnReqApply', false)

  // 타입이 U:개정인 경우, 결재상신, 개정버튼 활성화
  if (wtype == 'U') {
    menuTitle.value.disableBtn('btnReqApply', false)
    menuTitle.value.disableBtn('btnRevision', true)

    menuTitle.value.disableBtn('btnCancelRSKDel', true)
  } else {
    menuTitle.value.disableBtn('btnRevision', true)

    if (pStatus == 'DC_AC') {
      menuTitle.value.disableBtn('btnUpdate', false)
      menuTitle.value.disableBtn('btnRevision', false)
    }
  }

  menuTitle.value.disableBtn('btnRskDel', true)

  // 표준서 정보 조회 (.then을 한 이유는, 메인을 먼저 조회한 뒤 나머지 데이터 조회를 위해)
  await search(wid)

  // 언어 목록 조회
  await transInit(wid)

  // 작업표준서 개정이력
  await revisionHistory()

  // 위험성평가 위원회
  await committeeSearch()

  // 탭2의 단위작업, 작업행동, 위험요인 조회
  await searchUnit(wid)

  // 회의이력 조회
  await meetingHistory()

  // 상세리포트 조회
  await reportTabClick()

  if (wtype == 'U') {
    // 개정이면
    //개정번호 조회
    //WORK_STANDARD_MASTER.DEPT_CD = revDept
    isRevision.value = true

    // TODO: 개정시 번호를 여기서 올리는게 아니라, 하이 오피스 결재에서 처리하는가본데?
    //await getRevision()

    menuTitle.value.disableBtn('btnRevision', true)
    menuTitle.value.disableBtn('btnUpdate', false)
  }

  // 폐지 작성중인 경우 폐지 취소 버튼 활성화
  if (WORK_STANDARD_MASTER.WORK_STANDARD_KINE === 'D' && WORK_STANDARD_MASTER.PROGRESS_STATUS === 'DP_AW') {
    menuTitle.value.disableBtn('btnCancelRSKDel', false)
  } else {
    menuTitle.value.disableBtn('btnCancelRSKDel', true)
  }

  // 진행상태가 신규작성중인 경우
  if (WORK_STANDARD_MASTER.PROGRESS_STATUS == 'CP_AW') {
    // 직영이고 부서코드가 같은 경우 저장, 결재상신 활성화
    if (userStore.userDiv === 'A' && WORK_STANDARD_MASTER.DEPT_CD == userStore.deptCd) {
      menuTitle.value.disableBtn('btnUpdate', false)
      menuTitle.value.disableBtn('btnReqApply', false)
    } else if (
      userStore.userDiv === 'B' &&
      WORK_STANDARD_MASTER.CORP_ASGN_CD === userStore.deptCd &&
      WORK_STANDARD_MASTER.DEPT_CD == userStore.asgnCd
    ) {
      menuTitle.value.disableBtn('btnUpdate', false)
      menuTitle.value.disableBtn('btnReqApply', false)
    } else {
      menuTitle.value.disableBtn('btnUpdate', true)
      menuTitle.value.disableBtn('btnReqApply', true)
    }

    //menuTitle.value.disableBtn('btnUpdate', false)
    //menuTitle.value.disableBtn('btnReqApply', false)
  }

  sagoInform.value = false

  // 로딩바 닫기
  commonStore.loading = false
}

// TODO: onActivated, onMounted 테스트를 위해 주석
/*
const  initData = async () => {

  // 위험성평가 현황에서 셀 더블클릭하여 화면 전환시 WORK_TYPE값을 던져 구분
  workType.value = window.sessionStorage.getItem('WORK_TYPE')   // C: 신규, U: 개정, E: 상세내용 조회
  workId.value   = window.sessionStorage.getItem('WORK_STANDARD_ID')  

  console.log('workType =========', workType.value)

  let deptCd     = window.sessionStorage.getItem('DEPT_CD')

  if(workType.value != null)
  {
    window.sessionStorage.removeItem('WORK_TYPE')
    window.sessionStorage.removeItem('WORK_STANDARD_ID')   
  }

  if(deptCd != null)
    window.sessionStorage.removeItem('DEPT_CD') 

  menuTitle.value.disableBtn('btnSearch',   true)
  menuTitle.value.disableBtn('btnUpdate',   true)
  menuTitle.value.disableBtn('btnReqApply', true)
  menuTitle.value.disableBtn('btnRevision', true)
  menuTitle.value.disableBtn('btnRskDel',   true)
  menuTitle.value.setBtnProperty('btnCancelRSKDel', 'visible', false)
  
  // 신규 작성 시
  if(workId.value == undefined || workId.value == null){    

    if(workType.value == 'C')
    {
      init('1')
      transInit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)

      onButtonsClick({ id : 'btnNew'})
    }
      
  }
  else{
    let workNo = workId.value.slice(0, -3)

    WORK_STANDARD_MASTER.WORK_STANDARD_ID = workId.value
    WORK_STANDARD_MASTER.WORK_STANDARD_NO = workNo    
    console.log('11111111111111111111')
    menuTitle.value.disableBtn('btnSearch',   false) 
    menuTitle.value.disableBtn('btnUpdate',   false) 
    menuTitle.value.disableBtn('btnReqApply', false)
    menuTitle.value.disableBtn('btnRevision', true)
    menuTitle.value.disableBtn('btnRskDel',   true)
    console.log('2222222222222222222')
    // 표준서 정보 조회 (.then을 한 이유는, 메인을 먼저 조회한 뒤 나머지 데이터 조회를 위해)
    search(workId.value).then(res => {    
      console.log('3333333333333')
      // 언어 목록 조회
      transInit(workId.value)
      // 작업표준서 개정이력      
      revisionHistory() 
      // 위험성평가 위원회
      committeeSearch()
      // 탭2의 단위작업, 작업행동, 위험요인 조회
      searchUnit()
      console.log('4444444444')
      // 회의이력 조회
      meetingHistory()
      console.log('work Type = ', workType.value)
      // 상세리포트 조회
      reportTabClick()
      console.log('4.54.54.54.54.54.54.5')

      if(workType.value == 'U'){  // 개정이면
        console.log('5555555555555')
        //개정번호 조회      
        WORK_STANDARD_MASTER.DEPT_CD = deptCd
        isRevision.value = true
        getRevision()
        menuTitle.value.disableBtn('btnRevision', false)
        console.log('6666666666666666')
      }
    })
  }
  
  // 진행상태가 신규작성중인 경우
  if(WORK_STANDARD_MASTER.PROGRESS_STATUS == 'CP_AW')
  {
      menuTitle.value.disableBtn('btnUpdate', false)
      menuTitle.value.disableBtn('btnReqApply', false)
  }

  sagoInform.value = false

  // 로딩바 닫기
  commonStore.loading = false
}*/

const onLoad = async () => {
  // 현황 화면에서 호출했는지 확인 (파라미터가 있으면 호출된 것임)
  let wtype = window.sessionStorage.getItem('WORK_TYPE')
  let pStatus = window.sessionStorage.getItem('PROGRESS_STATUS')
  let wid = window.sessionStorage.getItem('WORK_STANDARD_ID')
  let revDept = window.sessionStorage.getItem('DEPT_CD') // 협력사인 경우 asgnCd 데이터로 넘어올 것임

  tempA = null
  tempB = null
  tempC = null

  // 버튼 숨기기 (false: 숨기기, true: 보이기)
  menuTitle.value.setBtnProperty('btnPartnerApply', 'visible', false) // 최종결재
  menuTitle.value.setBtnProperty('btnPartnerReject', 'visible', false) // 반려(협력사용)
  menuTitle.value.setBtnProperty('btnCancelRSKDel', 'visible', false) // 폐지취소
  menuTitle.value.setBtnProperty('btnSendMail', 'visible', false) // 메일발송
  menuTitle.value.setBtnProperty('btnWordPrintAdmin', 'visible', false) //워드생성(관리자용)
  // 버튼 disabled 처리 (false: 활성화, true: 비활성화)
  menuTitle.value.disableBtn('btnRskDel', true) // 폐지

  // 결재완료된 문건에 대해서는 폐지 버튼을 활성화 시킴
  if (pStatus === 'CC_AC' || pStatus === 'UC_AC') {
    // 버튼 보이기 (false: 숨기기, true: 보이기)
    menuTitle.value.setBtnProperty('btnRskDel', 'visible', true) // 폐지
  } else if (pStatus === 'DC_AC') {
    // 버튼 보이기 (false: 숨기기, true: 보이기)
    menuTitle.value.setBtnProperty('btnRevision', 'visible', true) // 개정
    // 버튼 disabled 처리 (false: 활성화, true: 비활성화)
    menuTitle.value.disableBtn('btnRevision', false) // 개정
  }

  if (userStore.authGrpCd.includes('GRP00291') || userStore.authGrpCd.includes('HIWAYGRP00001')) {
    menuTitle.value.setBtnProperty('btnWordPrintAdmin', 'visible', true)
  }

  console.log('wtype = ', wtype)
  //console.log('wid = ', wid)
  //console.log('pStatus = ', pStatus)

  // 페이지 전환만 이루어진 건지, 다른 화면 호출인지 구분
  // wtype != null 인 경우 다른 화면에서 호출된것임
  if (wtype != null) {
    workType.value = wtype
    workId.value = wid

    isRevision.value = wtype == 'U' ? true : false

    // 현황에서 개정 버튼 눌러서 왔을 때 활성화
    menuTitle.value.disableBtn('btnReqApply', wtype == 'U' ? false : true) // 결재상신
    menuTitle.value.disableBtn('btnRevision', true) // 개정
    cnt = 0

    if(wtype === 'E'){
      // 현황에서 더블클릭으로 넘어왔을 경우
      isSaved.value = true
    } else {
      isSaved.value = false
    }
  }

  // 세션에 부여한 아이템 제거
  window.sessionStorage.removeItem('WORK_TYPE')
  window.sessionStorage.removeItem('PROGRESS_STATUS')
  window.sessionStorage.removeItem('WORK_STANDARD_ID')
  window.sessionStorage.removeItem('DEPT_CD')
  window.sessionStorage.removeItem('RSKBA0020_RELOAD')

  if (cnt == 0) initCodeList()

  // 값이 null인 경우, 메뉴에서 선택하여 화면 띄운 것임
  if (wid == null && cnt == 0) {
    // 버튼 활성화/비활성화 (true: 비활성화, false: 활성화)
    menuTitle.value.disableBtn('btnSearch', true) // 조회
    menuTitle.value.disableBtn('btnUpdate',   true) // 저장 2025.08.06 주석해제
    menuTitle.value.disableBtn('btnReqApply', true) // 결재상신
    menuTitle.value.disableBtn('btnRevision', true) // 개정
    menuTitle.value.disableBtn('btnRskDel', true) // 폐지

    menuTitle.value.setBtnProperty('btnCancelRSKDel', 'visible', false) // 폐지취소

    isSaved.value = false

    // 직영/협력사 유무에 따라 직영부서 담당자 보일지 판단
    showReviewer()

    if (wtype == 'C') {
      onButtonsClick({ id: 'btnNew' })
    }
  }
  // 다른 화면에서 호출시에만 반응 (메뉴 이동시에는 반응안함)
  else if (wid != null && cnt == 0) {
    cnt = 1
    console.log('다른화면 호출')
    await initData(wtype, wid, pStatus, revDept) // 상세 내용 불러오는 함수인 듯

    // 언어 콤보박스 세팅
    await transInit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  }

  // 사고 버튼 (현재는 기능 사용하지 않음)
  //sagoInform.value = false

  /*
  if(workId != null)
    initData()
    */
}

/**
 * 데이터 조회시 직영/협력사 구분하여 협력사인 경우에만 직영부서 담당자 검토자 보여주기
 * 조회된 데이터가 없는 경우엔 로그인한 유저의 직영/협력사 여부로 결정
 */
const showReviewer = () => {
  // 협력사인 경우 직영부서 담당자 보여주기
  if (WORK_STANDARD_MASTER.USER_DIV == 'A') isReviewer.value = false
  else if (WORK_STANDARD_MASTER.USER_DIV == 'B') isReviewer.value = true
  else isReviewer.value = userStore.userDiv == 'A' ? false : true
}

// 마운트 되고 난 뒤에 화면 호출시 실행
/*
router.afterEach(async (to, from, next) => {
  
  if(from.path === '/20_risk-assessment/RSK_B/RSKBA0020') {
    console.log('STEP :: IN afterEach ')
    await getHistory()
  }
  
})*/

let cnt = 0

onActivated(() => {
  onLoad()
})
onMounted(() => {
  onLoad()
})

// TODO: onActivated, onMounted 2개 쓰는 것에서, onActivated 하나로 변경
/*
onActivated(() => {
  
  // 다른 메뉴에서 신규제정 메뉴를 활성화시
  initData()
})
// 그리드 데이터 바인딩
onMounted(() => {
  
  initCodeList()

  menuTitle.value.disableBtn('btnSearch', true)
  menuTitle.value.disableBtn('btnUpdate', true)
  menuTitle.value.disableBtn('btnReqApply', true)
  menuTitle.value.disableBtn('btnRevision', true)
  menuTitle.value.disableBtn('btnRskDel', true)
  menuTitle.value.setBtnProperty('btnCancelRSKDel', 'visible', false)
  
  init()
  transInit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)

  sagoInform.value = false

  // 현황 화면에서 호출하여 마운트 된 경우 initData 실행
  let workId = window.sessionStorage.getItem('WORK_STANDARD_ID')
  let workType = window.sessionStorage.getItem('WORK_TYPE')
  if(workId != null)
    initData()
})*/

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const tabChange = (gbn) => {
  /*
  if(gbn === 'tab2'){    
    if(workType.value !== null){
      searchUnit()
      meetingHistory()
    }    
  }else if(gbn === 'tab3'){
    isActiveTab.value = true
    reportTabClick()    
  }*/

  console.log('tabChange WORK_STANDARD_MASTER.WORK_STANDARD_ID',WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  if(WORK_STANDARD_MASTER.WORK_STANDARD_ID){
    tab.value = gbn

    if (gbn === 'tab3') {
      reportTabClick()
    }
  }
}

// 지난 반기 조회
const getHalfDate = () => {
  let half = reactive({
    from: '',
    to: '',
  })

  let date = new Date()

  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  let from
  let to

  let cFrom
  let cTo

  if (month < 7) {
    from = new Date(year - 1, 6, 1)
    to = new Date(year - 1, 12, 0)

    let cMonth = from.getMonth() + 1
    let cDay = from.getDate()

    let month2 = to.getMonth() + 1
    let day2 = to.getDate()

    cFrom = year - 1 + '-' + String(cMonth).padStart(2, '0') + '-' + String(cDay).padStart(2, '0')

    cTo = year - 1 + '-' + String(month2).padStart(2, '0') + '-' + String(day2).padStart(2, '0')
  } else {
    from = new Date(year, 0, 1)
    to = new Date(year, 6, 0)

    let cMonth = from.getMonth() + 1
    let cDay = from.getDate()

    let month2 = to.getMonth() + 1
    let day2 = to.getDate()

    cFrom = year + '-' + String(cMonth).padStart(2, '0') + '-' + String(cDay).padStart(2, '0')

    cTo = year + '-' + String(month2).padStart(2, '0') + '-' + String(day2).padStart(2, '0')
  }

  // 날짜 구하는 함수 제대로 만들기
  console.log('from =', cFrom)
  console.log('to =', cTo)

  half.from = cFrom
  half.to = cTo

  return half
}

// 로우 더블 클릭시, 해당 위험성평가의 세부내용을 작업표준 신규제정에서 열람
const onCellDblClicked = (grid, clickData) => {
  const focusedRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  // let status = focusedRow.PROGRESS_STATUS

  commonStore.loading = true

  window.sessionStorage.setItem('WORK_TYPE', 'E')
  window.sessionStorage.setItem('PROGRESS_STATUS', focusedRow.PROGRESS_STATUS)
  window.sessionStorage.setItem('WORK_STANDARD_ID', focusedRow.WORK_STANDARD_ID)
  router.push('/20_risk-assessment/RSK_B/RSKBA0010_HISTORY_VIEW')

  return true
}

let arrMaster = []
let isMaster = ref(false)

const ck = (event) => {
  if (event.shiftKey) {
    arrMaster = []
    isMaster.value = false

    return
  }

  arrMaster.push(event.ctrlKey == true ? '1' : '0')

  if (arrMaster[0] == '0' && arrMaster[1] == '1') isMaster.value = true

  if (isMaster.value) {
    //menuTitle.value.disableBtn('btnStandardCopy', false)
    menuTitle.value.disableBtn('btnNew', false)
    menuTitle.value.disableBtn('btnUpdate', false)
    menuTitle.value.disableBtn('btnReqApply', false)
    menuTitle.value.disableBtn('btnRevision', false)

    //menuTitle.value.setBtnProperty('btnStandardCopy', 'visible', true)
    menuTitle.value.setBtnProperty('btnNew', 'visible', true)
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)
    menuTitle.value.setBtnProperty('btnPartnerApply', 'visible', true)
    menuTitle.value.setBtnProperty('btnPartnerReject', 'visible', true)
    menuTitle.value.setBtnProperty('btnRevision', 'visible', true)
  }
}

const onClickORA_YN = ele => {
  if(ele.ORA_YN === 'Y'){
    Message.warn("<center>현장 위험성평가는 작업 착수 전, <br/>현장에서 실시한다는 점을 참조하여 대상 선택 시 주의 바랍니다.</center>")
    //alert("현장 위험성평가는 작업 착수 전, 현장에서 실시한다는 점을 참조하여 대상 선택 시 주의 바랍니다.")
  }
}

</script>

<template>
  <div v-if="false" style="border: 1px solid darkblue" @mousedown="ck">
    <H5>전산 점검중입니다. 이용에 불편을 드려 죄송합니다.</H5>
  </div>
  <div v-else>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="[
            'btnNew',
            'btnUpdate',
            'btnReqApply',
            'btnPartnerApply',
            'btnPartnerReject',
            'btnRevision',
            'btnRskDel',
            'btnCancelRSKDel',
            'btnSimplePrint',
            'btnDetailPrint',
            'btnWordPrint',
            'btnWordPrintAdmin',
          ]"
          @click-button="onButtonsClick"
        >
          <!-- 2025.07.04 김현재 작성 IMenuTitle 컴포넌트에 slot이 추가되어서 이렇게 수정함 -->
          <template v-slot:editors>
            <div class="d-flex flex-grow-1 justify-end" @mousedown="ck">
              <i-select
                width="130px"
                v-model="WORK_STANDARD_MASTER.TRANS_CD"
                :items="cmbTrans"
                item-value="TRANS_CD"
                item-title="TRANS_NM"
                @update:modelValue="changeTrans"
              />
            </div>
          </template>
        </IMenuTitle>
                  <!-- 2025.07.04 김현재 작성 IMenuTitle 컴포넌트에 slot이 추가되어서 이렇게 수정함 -->
          <template v-slot:editors>
            <div class="d-flex flex-grow-1 justify-end" @mousedown="ck">
              <i-select
                width="130px"
                v-model="WORK_STANDARD_MASTER.TRANS_CD"
                :items="cmbTrans"
                item-value="TRANS_CD"
                item-title="TRANS_NM"
                @update:modelValue="changeTrans"
              />
            </div>
          </template>
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="mb-2">
            <v-tabs v-model="tab" @update:modelValue="tabChange">
              <v-tab value="tab1">표준서 정보</v-tab>
              <v-tab value="tab2" :disabled="!isSaved">세부내용</v-tab>
              <v-tab value="tab3" :disabled="!isSaved">상세리포트</v-tab>
            </v-tabs>
          </v-sheet>
          <v-sheet v-show="tab == 'tab1'" class="h-auto content-area-tab">
            <div class="h-grow">
              <v-sheet width="1090px" class="mr-3">
                <IGridTitle :title="$t('작업표준 기본정보')">
                  <template #editors />
                </IGridTitle>
                <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                <div class="d-flex mb-2">
                  <i-input
                    required
                    :label="$t('구분')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.GUBUN_NM"
                    append-inner-icon="mdi-magnify"
                    @keydown.enter="
                      (e) => {
                        openPopup()
                      }
                    "
                    @click:appendInner="openPopup()"
                  />
                  <i-input                    
                    :label="$t('표준번호')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_ID_VIEW"
                    :readonly="readonlyYn"
                    :disabled="true"
                  />
                  <i-input
                    required
                    :label="$t('표준서명')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_NM"
                  />
                </div>
                <IGridTitle :title="$t('위험성평가 정보')" />
                <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                <div class="d-flex align-content-start flex-wrap mb-2">
                  <i-input
                    :label="$t('작성자')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.USER_INFO"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('제정일자')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.C_DATE"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('개정일자')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.U_DATE"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('개정차수')"
                    width="100px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_REVISION"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    class="mt-2"
                    :required="userStore.userDiv == 'A' ? true : false"
                    :label="$t('담당자(생산팀장)')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM"
                    @click="popupEmp('생산팀장')"
                    append-inner-icon="mdi-magnify"
                    :readonly="readonlyYn"
                    :disabled="userStore.userDiv == 'A' ? false : true"
                  />
                  <i-input
                    class="mt-2"
                    :label="$t('담당과장')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.POSITION_MANAGER_NM"
                    readonly
                    :disabled="userStore.userDiv == 'A' ? false : true"
                  />
                  <i-input
                    class="mt-2"
                    :label="$t('직영부서 담당자')"
                    width="350px"
                    topLabel
                    v-if="isReviewer"
                    v-model="WORK_STANDARD_MASTER.REVIEWER"
                  />
                  <i-input
                    class="mt-2 input-border"
                    variant="outlined"
                    :label="$t('중요위험')"
                    :width="isReviewer == true ? '200px' : '350px'"
                    topLabel
                    readonly
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_RISK_OVER_COUNT"
                  />
                  <i-input
                    class="mt-2 input-border"
                    variant="outlined"
                    :label="$t('특별감소대책')"
                    width="200px"
                    topLabel
                    readonly
                    v-model="WORK_STANDARD_MASTER.SRSRM_COMPLETE"
                  />
                  <i-input
                    class="mt-2 input-border"
                    variant="outlined"
                    :label="$t('이행률')"
                    :width="isReviewer == true ? '100px' : '200px'"
                    topLabel
                    readonly
                    v-model="WORK_STANDARD_MASTER.RATE"
                  />
                  <i-input
                    class="mt-2"
                    :required="false"
                    :label="$t('교육이수자료첨부')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.EDU_FILE_COUNT"
                    @click="popupFile()"
                    append-inner-icon="mdi-file-upload-outline"
                    readonly
                  />
                </div>

                <IGridTitle :title="$t('제/개정 정보')" />
                <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                <!-- length="470px" -->
                <div class="d-flex mb-2">
                  <i-select
                    required
                    :label="$t('평가유형')"
                    width="250px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.RISK_TYPE"
                    :items="codeList.riskType"
                    item-value="CODE_ID"
                    item-title="CODE_NM"
                  />
                  <i-input
                    :label="$t('결재일자')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.APPROVAL_DATE"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    required
                    :label="$t('제/개정 사유')"
                    width="600px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_DESC"
                  />
                </div>
                <!-- 
                <div class="d-flex mb-2">
                  <div class="d-flex flex-column">
                    <IGridTitle :title="$t('제/개정 정보')"/>
                    <VDivider
                      :thickness="1"
                      class="border-opacity-100 mb-2"
                      color="primary"
                      length="470px"
                      />
                    <div class="d-flex align-content-start flex-wrap mb-2" style="width: 490px;">
                      <i-select
                        required
                        :label="$t('평가유형')"
                        width="250px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.RISK_TYPE"
                        :items="codeList.riskType"
                        item-value="CODE_ID"
                        item-title="CODE_NM"
                      />
                      <i-input
                        :label="$t('결재일자')"
                        width="200px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.APPR_DT"
                        :readonly="readonlyYn"
                      />
                      <i-input
                        required
                        :label="$t('제/개정 사유')"
                        width="470px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.WORK_STANDARD_DESC"
                      />
                    </div>
                  </div>
                  <div class="d-flex flex-column flex-1-0 ml-1">
                    <IGridTitle :title="$t('중요위험현황')"/>
                    <VDivider
                      :thickness="1"
                      class="border-opacity-100 mb-2"
                      color="primary"
                      />
                    <div class="d-flex align-content-start flex-wrap mb-2" style="width: 490px;">
                      <i-input
                        :label="$t('중요위험')"
                        width="200px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.WORK_STANDARD_RISK_OVER_COUNT"
                        readonly
                      />
                      <i-input
                        :label="$t('특별감소대책')"
                        width="200px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.APPR_DT"
                        :readonly="readonlyYn"
                      />
                      <i-input
                        required
                        :label="$t('제/개정 사유')"
                        width="470px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.WORK_STANDARD_DESC"
                      />
                    </div>
                  </div>
                </div> -->

                <IGridTitle :title="$t('작업 정보')" />
                <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                <div class="d-flex mb-2">
                  <i-textarea
                    required
                    :label="$t('작업도구')"
                    width="350px"
                    :row="2"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_TOOLS"
                  />
                  <i-textarea
                    required
                    :label="$t('장비 및 설비')"
                    width="350px"
                    :row="2"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.EQUIPMENT_TYPE"
                  />
                  <i-textarea
                    required
                    :label="$t('사용 화학물질정보')"
                    width="350px"
                    :row="2"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.USE_CHEMICAL"
                  />

                  <VBtn
                    class="mt-5"
                    max-width="80%"
                    v-if="false"
                    :disabled="sagoInform"
                    @click="openPopup2('사고정보')"
                  >
                    사고정보
                  </VBtn>
                </div>
                <!-- :button-list="['btnSendMail']" -->
                <IGridTitle :title="$t('위험성평가 위원회')" @click-button="onButtonsClick" />
                <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                <div class="d-flex mb-2"></div>
                <!-- 위험성평가 위원회 -->
                <div class="d-flex mb-2">
                  <i-input
                    :label="$t('위험성평가위원회 (운영위원)')"
                    width="350px"
                    topLabel
                    v-model="codeList.committee.COMMITTEE_OPS"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('실행위원(부서)')"
                    width="350px"
                    topLabel
                    v-model="codeList.committee.COMMITTEE_DEPT"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('실행위원(조합)')"
                    width="350px"
                    topLabel
                    v-model="codeList.committee.COMMITTEE_ASSOC"
                    :readonly="readonlyYn"
                  />
                </div>
              </v-sheet>
              <v-sheet class="h-auto pr-1">
                <div class="fill-height">
                  <IGridTitle :title="$t('사업장 안전보건정보(바로가기)')" />
                  <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                  <v-sheet class="d-flex justify-space-between" style="height: 63px">
                    <v-btn size="large" variant="outlined" width="170px" @click="openPopup2('사고')">사고</v-btn>
                    <v-btn
                      size="large"
                      variant="outlined"
                      width="170px"
                      disabled="true"
                      @click="openPopup2('현장위험성평가')"
                      >현장위험성평가</v-btn
                    >
                    <v-btn size="large" variant="outlined" width="170px" @click="openPopup2('안전작업요구권')"
                      >안전작업요구권</v-btn
                    >
                    <v-btn
                      size="large"
                      variant="outlined"
                      width="170px"
                      @click="openPopup2('안전리스크')"
                      :disabled="srBtnDisabled"
                      >안전리스크</v-btn
                    >
                  </v-sheet>
                  <IGridTitle :title="$t('재해발생현황')" />
                  <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                  <v-sheet height="116px" class="mb-3">
                    <table class="mb-2">
                      <tr class="tr-data" style="height: 50px; background-color: #e4e4e4">
                        <td width="33%">{{ SAGO.SAN_CNT }}건<br />산재사고</td>
                        <td width="34%">{{ SAGO.HUE_CNT }}건<br />휴업사고</td>
                        <td width="33%">{{ SAGO.IL_CNT }}건<br />일반사고</td>
                      </tr>
                    </table>
                    <table>
                      <tr class="tr-data" style="height: 50px; background-color: #1a40c7; color: white">
                        <td>중대(성)사고 {{ SAGO.SAN_CNT }}건</td>
                      </tr>
                    </table>
                  </v-sheet>
                  <IGridTitle :title="$t('작업표준서 개정이력')" style="margin-top: 75px" />
                  <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                  <v-sheet height="180px" class="mb-3">
                    <RealGrid
                      ref="grdMain"
                      :grid-view-option="grdMainProps.gridViewOption"
                      :keys="grdMainProps.keys"
                      :fields="grdMainProps.fields"
                      :columns="grdMainProps.columns"
                      @onCellDblClicked="onCellDblClicked"
                    />
                  </v-sheet>
                  <!-- 엔진기계 사업부인 경우만 아래 컴포넌트 보여줌 -->
                  <div v-if="WORK_STANDARD_MASTER.BSNS_CD_ORIGIN === 'AK00'">
                    <IGridTitle :title="$t('점검 필요 여부')" />
                    <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
                    <v-sheet class="d-flex align-center justify-space-between" height="75px">
                      <!--TODO 2024.07.11 윤찬양 책임 요청으로 명칭 변경-->
                      <v-checkbox
                        label="3중 점검 작업"
                        v-model="WORK_STANDARD_MASTER.CHK_REQUIRED"
                        true-value="T"
                        false-value=""
                      ></v-checkbox>
                      <v-checkbox
                        label="부서자율점검 작업"
                        v-model="WORK_STANDARD_MASTER.CHK_REQUIRED"
                        true-value="D"
                        false-value=""
                      ></v-checkbox>
                      <v-checkbox
                        label="점검 제외"
                        v-model="WORK_STANDARD_MASTER.CHK_REQUIRED"
                        true-value="N"
                        false-value=""
                      ></v-checkbox>
                    </v-sheet>
                  </div>
                  <!-- <v-sheet height="100px" class="mb-3">
                  <table>
                    <tr class="tr-header">
                      <th colspan="3">중요위험현황</th>
                    </tr>
                    <tr class="tr-data">
                      <td width="33%">{{ WORK_STANDARD_MASTER.WORK_STANDARD_RISK_COUNT }}건<br/>중요위험</td>
                      <td width="33%">{{ WORK_STANDARD_MASTER.SRSRM_ALL }}건<br/>특별감소대책</td>
                      <td width="33%">{{ WORK_STANDARD_MASTER.RATE }}%<br/>개선이행률</td>
                    </tr>
                  </table>
                </v-sheet> -->
                </div>
              </v-sheet>
            </div>
          </v-sheet>
          <v-sheet v-show="tab == 'tab2'" class="content-area-tab">
            <div class="d-flex flex-column fill-height">
              <v-expansion-panels class="mb-3">
                <v-expansion-panel class="exp-panel-border">
                  <v-expansion-panel-title v-slot="{ expanded }" style="min-height: 50px; max-height: 50px">
                    <div class="d-flex flex-column">
                      <span style="font-size: 16px; font-weight: bold">안전보건정보</span>
                      <v-fade-transition leave-absolute>
                        <span v-if="expanded" key="0"> </span>
                        <span v-else key="1"> </span>
                      </v-fade-transition>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="pa-3">
                    <div class="d-flex">
                      <div class="d-flex">
                        <i-input
                          :label="$t('작업도구')"
                          width="250px"
                          topLabel
                          v-model="WORK_STANDARD_MASTER.WORK_TOOLS"
                          readonly
                        />
                        <i-input
                          :label="$t('장비 및 설비')"
                          width="250px"
                          topLabel
                          v-model="WORK_STANDARD_MASTER.EQUIPMENT_TYPE"
                          readonly
                        />
                        <i-input
                          :label="$t('사용 화학물질정보')"
                          width="250px"
                          topLabel
                          v-model="WORK_STANDARD_MASTER.USE_CHEMICAL"
                          readonly
                        />
                        <i-input
                          :label="$t('직영부서 담당자')"
                          width="250px"
                          topLabel
                          v-model="WORK_STANDARD_MASTER.REVIEWER"
                          v-if="isReviewer"
                          readonly
                        />
                        <i-input
                          :label="$t('담당자(생산팀장)')"
                          width="250px"
                          topLabel
                          v-model="WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM"
                          v-if="!isReviewer"
                          readonly
                        />
                        <VBtn width="250px" @click="openPopup2('회의이력')" class="mt-5">
                          <VIcon>mdi-clipboard-text-clock-outline</VIcon>
                          위험성평가 회의이력(전체)
                        </VBtn>
                        <VBtn width="250px" @click="openPopup2('비일상작업')" class="mt-5">
                          <VIcon>mdi-clipboard-text-clock-outline</VIcon>
                          수시위험성 평가조회(비일상작업)
                        </VBtn>
                      </div>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <div class="d-flex pt-3 pl-3 pr-3 pb-0">    
                <div class="align-self-center">
                  <IGridTitle :title="$t('작업표준 세부내용')"> </IGridTitle>                                                     
                </div>                
                <div class="align-center d-flex mb-3" style="margin-left: auto;">
                  <p style="color: #1a40c7;">※ 위험성평가 < 8점 미만: 개선대책 입력은 선택사항 (필수값 아님)</p>
                </div>
              </div>
              
              <div class="d-flex pr-1 mb-1">
                <v-sheet class="d-flex justify-space-between" width="300px">
                  <span>
                    <h4>단위작업명</h4>
                  </span>
                  <span>
                    <VIcon color="info" icon="mdi-plus" @click="addItem('unit')" />
                    <VIcon color="error" icon="mdi-minus" @click="removeTodo('unit')" />
                  </span>
                </v-sheet>
                <v-sheet class="d-flex justify-space-between ml-1" width="300px">
                  <span>
                    <h4>작업행동/체크정보</h4>
                  </span>
                  <span>
                    <!-- <VIcon color="info" icon="mdi-image" @click="openPopup2('addFile')"/> -->
                    <VIcon color="info" icon="mdi-plus" @click="addItem('act')" />
                    <VIcon color="error" icon="mdi-minus" @click="removeTodo('act')" />
                  </span>
                </v-sheet>
                <v-sheet class="d-flex justify-space-between ml-1" width="400px">
                  <span>
                    <h4>위험요인</h4>
                  </span>
                  <span>
                    <VIcon color="info" icon="mdi-plus" @click="addItem('risk')" />
                    <VIcon color="error" icon="mdi-minus" @click="removeTodo('risk')" />
                  </span>
                </v-sheet>
                <v-sheet class="d-flex flex-row ml-1" width="400px">
                  <span class="ml-2" style="width: 143px">
                    <h4>현재의 빈도</h4>
                  </span>
                  <span style="width: 145px">
                    <h4>현재의 강도</h4>
                  </span>
                  <span>
                    <h4>현재의 위험성</h4>
                  </span>
                </v-sheet>
                <v-sheet class="d-flex flex-row ml-1" width="400px">
                  <span class="ml-2" style="width: 143px">
                    <h4>개선후 빈도</h4>
                  </span>
                  <span style="width: 145px">
                    <h4>개선후 강도</h4>
                  </span>
                  <span>
                    <h4>개선후 위험성</h4>
                  </span>
                </v-sheet>
              </div>
              <div class="d-flex pr-1">
                <VDivider :thickness="1" length="300px" class="border-opacity-100" color="primary" />
                <VDivider :thickness="1" length="300px" class="border-opacity-100 ml-1" color="primary" />
                <VDivider :thickness="1" length="400px" class="border-opacity-100 ml-1" color="primary" />
                <VDivider :thickness="1" length="400px" class="border-opacity-100 ml-1" color="primary" />
                <VDivider :thickness="1" length="400px" class="border-opacity-100 ml-1" color="primary" />
              </div>
              <!-- Draggable -->
              <div class="d-flex flex-column pr-1 setOverFlow">
                <draggable
                  v-model="ArrayList"
                  :options="dragOptions"
                  @start="onDragStart"
                  @end="onDragEnd"
                  item-key="id"
                >
                  <template #item="{ element }">
                    <div
                      :id="'row1_' + element.id"
                      class="d-flex todo-item"
                      @mousedown="selectRow(element)"
                      v-if="element.STATUS == 'C' || element.STATUS == 'U'"
                    >
                      <v-sheet class="d-flex flex-column" width="300px">
                        <v-sheet
                          :id="'card1_' + element.id"
                          class="d-flex justify-space-between align-center todo-card pa-1"
                          color="white"
                          @mousedown="selectCard(element)"
                          @click="selectCheck(element)"
                          width="300px"
                          height="140px"
                        >
                          <VCheckbox true-value="Y" false-value="N" v-model="element.IS_CHECK" />
                          <v-sheet class="d-flex flex-column">                            
                            <i-textarea
                              v-model="element.UNIT_NM"
                              :row="4"
                              width="270px"
                              margin="0px"
                              :bgColor="element.UNIT_NM === '' || element.UNIT_NM === undefined ? '#F15F5F' : '#FFFFFF'"
                            />
                            <v-sheet class="d-flex justify-space-between">
                              <VCheckbox
                                label="현장위험성평가 대상"
                                true-value="Y"
                                false-value="N"
                                v-model="element.ORA_YN"
                                @update:modelValue="onClickORA_YN(element)"
                              />
                            </v-sheet>
                          </v-sheet>
                        </v-sheet>
                      </v-sheet>
                      <v-sheet class="d-flex flex-column ml-1">
                        <!-- 중분류 -->
                        <draggable
                          v-model="element.child"
                          :options="dragOptions"
                          @start="onDragStart"
                          @end="onDragEnd"
                          item-key="id"
                        >
                          <template #item="{ element }">
                            <div v-if="element.STATUS == 'C' || element.STATUS == 'U'" class="d-flex">
                              <v-sheet class="d-flex flex-column" width="300px">
                                <v-sheet
                                  :id="'card2_' + element.id"
                                  class="d-flex flex-column todo-card pa-1"
                                  @mousedown="selectCard(element)"
                                  @click="selectCheck(element)"
                                  color="white"
                                >
                                  <!-- 여기 밑에 중분류 컴포넌트-->
                                  <v-sheet class="d-flex align-center justify-space-between" height="50px">
                                    <VCheckbox
                                      label="작업행동"
                                      true-value="Y"
                                      false-value="N"
                                      v-model="element.IS_CHECK"
                                    />
                                    <div class="d-flex align-center">
                                      <div>{{ `첨부: ${element.FILE_COUNT}개` }}</div>
                                      <VIcon
                                        size="large"
                                        color="info"
                                        icon="mdi-image"
                                        style="margin-right: 22px"
                                        @click="openPopup2('addFile')"
                                      />
                                    </div>
                                  </v-sheet>
                                  <i-textarea
                                    v-model="element.ACT_NM"
                                    :row="3"
                                    width="270px"
                                    margin="0px"
                                    :bgColor="
                                      element.ACT_NM === '' || element.ACT_NM === undefined ? '#F15F5F' : '#FFFFFF'
                                    "
                                  />
                                  <i-textarea
                                    v-model="element.CHK_NM"
                                    :row="3"
                                    width="270px"
                                    margin="0px"
                                    label="체크정보"
                                  />
                                </v-sheet>
                              </v-sheet>
                              <v-sheet class="d-flex flex-column ml-1" width="1210px">
                                <!-- 소분류 -->
                                <draggable
                                  v-model="element.child"
                                  :options="dragOptions"
                                  @start="onDragStart"
                                  @end="onDragEnd"
                                  item-key="id"
                                >
                                  <template #item="{ element }">
                                    <div
                                      v-if="element.STATUS == 'C' || element.STATUS == 'U'"
                                      class="d-flex todo-card"
                                      :class="
                                        element.BEFOR_MAT * element.BEFOR_FRE > 8 &&
                                        element.BEFOR_MAT * element.BEFOR_FRE <= element.AFTER_MAT * element.AFTER_FRE
                                          ? 'box-highlight'
                                          : ''
                                      "
                                      :id="'card3_' + element.id"
                                      @mousedown="selectCard(element)"
                                      @click="selectCheck(element)"
                                    >
                                      <!-- 여기 밑에 소분류 컴포넌트-->
                                      <!-- {{ element.text }} -->

                                      <v-sheet class="d-flex flex-column pa-1" width="400px" color="white">
                                        <v-sheet class="d-flex align-center" height="50px">
                                          <VCheckbox
                                            label="위험요인"
                                            true-value="Y"
                                            false-value="N"
                                            v-model="element.IS_CHECK"
                                          />
                                        </v-sheet>
                                        <v-sheet class="d-flex justify-space-between">
                                          <VTextField
                                            label="분류"
                                            v-model="element.RISK_CD_P_NM"
                                            variant="underlined"
                                            append-inner-icon="mdi-magnify"
                                            @keydown.enter="
                                              (e) => {
                                                openPopup2('위험요인')
                                              }
                                            "
                                            :readOnly="textReadOnly"
                                            @click:appendInner="openPopup2('위험요인', element.id)"
                                            :bg-color="
                                              element.RISK_CD_P_NM === '' || element.RISK_CD_P_NM === undefined
                                                ? '#F15F5F'
                                                : '#FFFFFF'
                                            "
                                          />
                                          <VTextField
                                            class="ml-2"
                                            v-model="element.RISK_CD_D_NM"
                                            :readOnly="textReadOnly"
                                            variant="underlined"
                                          />
                                        </v-sheet>
                                        <i-textarea
                                          v-model="element.RISK_NM"
                                          :row="4"
                                          width="98%"
                                          margin="0px"
                                          label="위험요인 상세내용"
                                          :bgColor="
                                            element.RISK_NM === '' || element.RISK_NM === undefined
                                              ? '#F15F5F'
                                              : '#FFFFFF'
                                          "
                                        />
                                      </v-sheet>
                                      <v-sheet class="d-flex flex-column pa-1 ml-1" width="400px" color="white">
                                        <v-sheet class="d-flex justify-space-between align-center" height="50px">
                                          <VAutocomplete
                                            width="125px"
                                            v-model="element.BEFOR_FRE"
                                            :items="codeList.BEFOR_TYPE"
                                            item-title="TXT"
                                            item-value="COD"
                                            @update:modelValue="(v) => changeFreMatEvent('BEFOR', 'FRE', element, v)"
                                          />
                                          <VAutocomplete
                                            width="125px"
                                            class="ml-2"
                                            v-model="element.BEFOR_MAT"
                                            :items="codeList.BEFOR_TYPE"
                                            item-title="TXT"
                                            item-value="COD"
                                            @update:modelValue="(v) => changeFreMatEvent('BEFOR', 'MAT', element, v)"
                                          />
                                          <VTextField
                                            width="125px"
                                            class="ml-2"
                                            :class="getColor('BEFOR', element)"
                                            :bg-color="riskColor('BEFOR', element)"
                                            v-model="element.BEFOR_TOTAL"
                                            variant="underlined"
                                            readonly
                                          />                                          
                                        </v-sheet> 
                                        <i-textarea
                                            v-model="element.SAFE_NM"
                                            :row="6"
                                            width="98%"
                                            margin="0px"
                                            label="현재 안전조치 내용"
                                            :bgColor="
                                              element.SAFE_NM === '' || element.SAFE_NM === undefined
                                                ? '#F15F5F'
                                                : '#FFFFFF'
                                            "
                                          />
                                        <v-sheet> </v-sheet>
                                      </v-sheet>
                                      <v-sheet class="d-flex flex-column pa-1 ml-1" width="400px" color="white">
                                        <v-sheet class="d-flex justify-space-between align-center" height="50px">
                                          <VAutocomplete
                                            width="125px"
                                            v-model="element.AFTER_FRE"
                                            :items="codeList.BEFOR_TYPE2"
                                            item-title="TXT"
                                            item-value="COD"
                                            @update:modelValue="(v) => changeFreMatEvent('AFTER', 'FRE', element, v)"                                            
                                          />
                                          <VAutocomplete
                                            width="125px"
                                            class="ml-2"
                                            v-model="element.AFTER_MAT"
                                            :items="codeList.BEFOR_TYPE2"
                                            item-title="TXT"
                                            item-value="COD"
                                            @update:modelValue="(v) => changeFreMatEvent('AFTER', 'MAT', element, v)"                                            
                                          />
                                          <VTextField
                                            width="125px"
                                            class="ml-2"
                                            :class="getColor('AFTER', element)"
                                            :bg-color="riskColor('AFTER', element)"
                                            v-model="element.AFTER_TOTAL"
                                            variant="underlined"
                                            readonly
                                          />
                                        </v-sheet>
                                        <v-sheet class="d-flex justify-space-between align-center">
                                          <VTextField
                                            label="감소분류"
                                            v-model="element.RM_CD_P_NM"
                                            variant="underlined"
                                            append-inner-icon="mdi-magnify"
                                            @keydown.enter="
                                              (e) => {
                                                openPopup2('감소대책')
                                              }
                                            "
                                            :readOnly="textReadOnly"
                                            @click:appendInner="openPopup2('감소대책', element.id)"                                              
                                          />
                                          <VTextField
                                            class="ml-2"
                                            v-model="element.RM_CD_D_NM"
                                            :readOnly="textReadOnly"
                                            variant="underlined"                                            
                                          />
                                        </v-sheet>
                                        <i-textarea
                                          v-model="element.RM_NM"
                                          :row="4"
                                          width="98%"
                                          margin="0px"
                                          label="감소대책 상세내용"                                          
                                        />
                                        <v-sheet height="46px"> </v-sheet>
                                      </v-sheet>
                                    </div>
                                  </template>
                                </draggable>
                              </v-sheet>
                            </div>
                          </template>
                        </draggable>
                      </v-sheet>
                    </div>
                  </template>
                </draggable>
                <v-sheet class="d-flex flex-column">
                  <IGridTitle :title="$t('위험성평가 위원회 회의 이력')"> </IGridTitle>
                  <v-sheet height="150px">
                    <RealGrid
                      ref="grdHistory"
                      :grid-view-option="grdHistoryProps.gridViewOption"
                      :keys="grdHistoryProps.keys"
                      :fields="grdHistoryProps.fields"
                      :columns="grdHistoryProps.columns"
                    />
                  </v-sheet>
                </v-sheet>
              </div>
            </div>
          </v-sheet>
          <v-sheet v-show="tab == 'tab3'" class="h-auto">
            <div class="h-grow">
              <v-sheet width="50%" class="pa-0 content-area-tab-3 mr-3" ref="reporttreeScroll" id="reporttreeScroll">
                <RealGrid
                  ref="grdSub"
                  :is-tree="true"
                  :gridViewOption="grdSubProps.gridViewOption"
                  :fields="grdSubProps.field"
                  :columns="grdSubProps.columns"
                  @onCellClicked="grdSub_onCellClicked"
                />
              </v-sheet>
              <v-sheet width="50%" class="pa-0 pr-1 content-area-tab-3" ref="reportlistScroll" id="reportlistScroll">
                <div class="d-flex flex-column fill-height">
                  <div class="pa-2 report-card-1" v-for="unit in rptList.unitList" :key="unit.RNUM">
                    <div :id="unit.CHLD_ID + 'SCR'" class="pa-0">
                      <h1 v-if="screenWidth > 600" :class="dataStatusStyle('unit', unit)">
                        {{ unit.RNUM }}. [단위작업]
                        {{ unit.KOR_NM }}
                      </h1>
                      <h3 v-if="screenWidth < 600" :class="dataStatusStyle('unit', unit)">
                        {{ unit.RNUM }}. [단위작업]
                        {{ unit.KOR_NM }}
                      </h3>
                    </div>
                    <div v-for="act in getchildList('ACT', unit.CHLD_ID)" :key="act.RNUM">
                      <div :id="act.CHLD_ID + 'SCR'" class="pa-2 report-card-2">
                        <h2 v-if="screenWidth > 600" :class="dataStatusStyle('act', act)">
                          {{ act.RNUM }}) [작업행동]
                          {{ act.KOR_NM }}
                        </h2>
                        <h2 v-if="screenWidth > 600 && act.CHK_NM" :class="dataStatusStyle('act', act)">
                          <div
                            v-if="act.CHK_NM !== null || act.CHK_NM !== undefined"
                            v-html="replaceText('chk', act.CHK_NM)"
                          ></div>
                        </h2>
                        <h4 v-if="screenWidth < 600" :class="dataStatusStyle('act', act)">
                          {{ act.RNUM }}) [작업행동]
                          {{ act.KOR_NM }}
                        </h4>
                        <h4 v-if="screenWidth < 600 && act.CHK_NM" :class="dataStatusStyle('act', act)">
                          <div v-if="act.CHK_NM !== null" v-html="replaceText('chk', act.CHK_NM)"></div>
                        </h4>
                      </div>
                      <div style="display: inline-block" v-for="(item, idx) in imgUrlTemp" :key="item.FILE_ID">
                        <div v-if="act.FILE_ID === item.FILE_ID" class="pa-2">
                          <VImg width="150px" height="150px" :src="item.src" class="object-fit-cover" />
                          <div>{{ item.TITLE }}</div>
                        </div>
                      </div>
                      <div
                        class="pa-2 report-card-3"
                        v-for="risk in getchildList('RISK', act.CHLD_ID)"
                        :key="risk.RNUM"
                      >
                        <h2 v-if="screenWidth > 600" style="color: red" :class="dataStatusStyle('risk', risk)">
                          [위험요인]
                          {{ risk.KOR_NM }}
                        </h2>
                        <h2
                          v-if="screenWidth > 600 && risk.CHK_NM"
                          style="color: green"
                          :class="dataStatusStyle('risk', risk)"
                        >
                          <div v-if="risk.CHK_NM !== null" v-html="replaceText('rm', risk.CHK_NM)"></div>
                        </h2>
                        <h4 v-if="screenWidth < 600" :class="dataStatusStyle('risk', risk)" style="color: red">
                          [위험요인]
                          {{ risk.KOR_NM }}
                        </h4>
                        <h4
                          v-if="screenWidth < 600 && risk.CHK_NM"
                          style="color: green"
                          :class="dataStatusStyle('risk', risk)"
                        >
                          <div v-if="risk.CHK_NM !== null" v-html="replaceText('rm', risk.CHK_NM)"></div>
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <RSKBA0010popup1 ref="rSKBA0010popup1" @selected="OnSelectedGubun" />
    <RSKBA0010popup2 ref="rSKBA0010popup2" @selected="OnSelectedFactors" />
    <RSKBA0010popup3 ref="rSKBA0010popup3" @selected="OnSelectedReduction" />
    <RSKBA0010popup4 ref="rSKBA0010popup4" @selected="OnSelectedCopy" />
    <RSKBA0010popup5 ref="rSKBA0010popup5" @selected="OnSelectedSago" />
    <RSKBA0010popup6 ref="rSKBA0010popup6" />
    <VDialog
      v-model="dialog"
      eager
      persistent
      width="1700"
      height="1000"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
      <div class="title-bar" @mousedown="startDragging">수시위험성 평가조회</div>
      <RSKCA0010 ref="rSKCA0010popup7" :menuId="'RSKBA0010'" @selected="OnSelectedSusi" />
    </VDialog>
    <VDialog
      v-model="dialogSAFAB0020"
      width="1800"
      height="850"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
      <div class="title-bar" @mousedown="startDragging">안전사고</div>
      <SAFAB0020 dialog="Y" :val1="WORK_STANDARD_MASTER" :half="getHalfDate()" @close="dialogSAFAB0020 = false" />
    </VDialog>
    <VDialog
      v-model="dialogSAFCA0010"
      width="1800"
      height="1000"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
      <div class="title-bar" @mousedown="startDragging">현장위험성평가</div>
      <SAFCA0010 dialog="Y" :val1="WORK_STANDARD_MASTER" :half="getHalfDate()" @close="dialogSAFCA0010 = false" />
    </VDialog>
    <VDialog
      v-model="dialogSAFEA0010"
      width="1800"
      height="800"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
      <div class="title-bar" @mousedown="startDragging">안전작업 요구권</div>
      <SAFEA0010
        ref="rSAFEA0010"
        dialog="Y"
        :val1="WORK_STANDARD_MASTER"
        :half="getHalfDate()"
        @close="dialogSAFEA0010 = false"
      />
    </VDialog>
    <VDialog
      v-model="dialogSRMAA0030"
      width="1800"
      height="800"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
      <div class="title-bar" @mousedown="startDragging">리스크 통합관리 현황</div>
      <SRMAA0030 dialog="Y" :val1="WORK_STANDARD_MASTER" :half="getHalfDate()" @close="dialogSRMAA0030 = false" />
    </VDialog>
    <SendMailPopup ref="mailPopup" />
    <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded($event)" @deleted="deleted($event)" />
    <IUploadPopupEdu ref="fileUploadEduPopup" @uploaded="uploadedFile($event)" @deleted="deletedFile($event)" />
    <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalResult" />
    <ApprovalPopupInApp ref="refApprovalPopupInApp" @result="approvalResultInApp" />
    <!-- 팝업 -->
    <EmpPopup ref="empPopup" @selected="selectedEmpData" />
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
    <OZReport :showPop="showOzDetail" :reportName="reportName" :params="params" @close="showOzDetail = $event" />
  </div>
</template>

<style scoped lang="scss">
.input-border::v-deep(.v-input__control) {
  border: 1px solid darkblue;
}

.content-area {
  position: relative;
  height: calc(100vh - 180px);
  //overflow-y: auto;
  > div {
    min-height: 600px;
  }
}

.content-area-tab {
  position: relative;
  height: calc(100vh - 180px - 40px);
  overflow-y: auto;
  > div {
    min-height: 600px;
  }
}
.content-area-tab-3 {
  position: relative;
  height: calc(100vh - 180px - 47px);
  overflow-y: auto;
  > div {
    min-height: 600px;
  }
}

// .v-text-field {
//   font-size: 13px;
// }

.colorGreen {
  background-color: green;
}
.colorGreenYellow {
  background-color: greenyellow;
}
.colorOrange {
  background-color: orange;
}
.colorRed {
  background-color: red;
}

.scroll1280 {
  max-height: 660px;
  width: 100%;
  height: 660px;
}

.scroll1920 {
  max-height: 835px;
  width: 100%;
  height: 835px;
}

.report-card-1 {
  border-radius: 3px;
  border: 1px solid #d5d5d5;
}

.report-card-1:not(:first-child) {
  margin-top: 8px;
}

.report-card-2 {
  border-radius: 3px;
  border: 1px solid #d5d5d5;
  margin-top: 8px;
  margin-left: 8px;
}

.report-card-3 {
  border-radius: 3px;
  border: 1px solid #d5d5d5;
  margin-top: 8px;
  margin-left: 16px;
}

.object-fit-cover {
  object-fit: cover;
}

/***  세부내용  ***/
.todo-item {
  // border-top: 2px solid #ccc;
  // padding: 3px;
  // margin:2px;
  cursor: grab;
}

.todo-card {
  /* margin-right: 10px;
  margin-bottom: 10px; */
  margin-top: 2px;
  margin-bottom: 2px;
}

.todo-item button {
  cursor: pointer;
}

.selected-draggable {
  background-color: #f4f5f9;
  border: 1px solid blue;
}

.selected-card {
  background-color: #f4f5f9;
  border: 1px solid blue;
}

table {
  width: 100%;
  // height: 100%;
  border-collapse: collapse;
}

th {
  border: 1px solid #b4b1b1;
  font-size: 15px;
}

td {
  border: 1px solid #b4b1b1;
  text-align: center;
}

tr.tr-header {
  height: 10px;
}

tr.tr-data {
  height: calc(100% - 80px);
}

.exp-panel-border {
  border: 1px solid rgb(88, 88, 175);
  box-shadow: none;
}

.setOverFlow {
  min-height: 500px;
  //max-height: 500px;
  overflow: overlay;
}

.text_underline {
  text-decoration: underline;
  line-height: 1.5rem;
}

.text_none {
  text-decoration: none;
  line-height: 1.5rem;
}

h5 {
  text-align: center;
}

h1 {
  line-height: 2rem !important;
}

@keyframes blink {
  0%,
  100% {
    background-color: #f7f7f7;
  }
  50% {
    background-color: #abb0ff;
  }
}
.light {
  animation: blink 1s infinite;
  border-radius: 50px;
}

.box-highlight.show-color {
  border: 1px solid red;
}

::v-deep(.check-font) {
  .v-label {
    font-size: 20px !important;
  }
}

::v-deep(.risk-color-black) {
  .v-field__field {
    color: black;
  }
}

::v-deep(.risk-color-white) {
  .v-field__field {
    color: white;
  }
}
</style>
