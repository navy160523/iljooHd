<!-- 
  * Vue 내 용 : 업체자체평가 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/09
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/09 
-->

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSendApi,
  getCodeList,
} from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import Message from '@hiway/utils/notify'
import { isEmpty } from '@/@core/utils'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'

const emit = defineEmits(['closed'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const menuTitle = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const fileUploadPopup_Site = ref(null) //파일 업로드 팝업
const fileUploadPopup_Safety = ref(null) //파일 업로드 팝업
const fileUploadPopup_Risk = ref(null) //파일 업로드 팝업
const fileUploadPopup_ISO = ref(null) //파일 업로드 팝업
const MailPopup = ref(null)
const fileSfty = ref(false)
const fileOnst = ref(false)
const sub2Score1 = ref(0)
const sub2Score2 = ref(0)
const updateable = ref(true)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  x.value = event.pageX
  y.value = event.pageY
}

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  COMP_CD: '',
  ASGN_CD: '',
  BSNS_CD: '',
  REG_DATE: '',
})

//팝업 입력조건
const popupParams = reactive({
  CMPNY_DIV: '',
  COMP_CD: '',
  COMP_NM: '',
  BSNS_CD: '',
  ASGN_CD: '',
  YEAR: '',
  QUARTER: '',
  REG_DATE: '',
  CERTIFIED_EVAL: 0,
  ONST_ACTV: '',
  SLF_EVAL_STUS: '',
  LGL_DOCS_CERTIFIED: '',
  LGL_DOCS: 0,
  SFTY_ACTVT: '',
  COMP_NM: '',
  RISK_ASSM_RCGN_YN: '',
  SFT_MNG_SYS_CRT_YN: '',
  SFTY_ACTVT_FILE_ID: '',
  ONST_ACTV_FILE_ID: '',
  RISK_ASSM_RCGN_FILE_ID: '',
  SFT_MNG_SYS_CRT_FILE_ID: '',
  SITE_COMMENT: '',
  CONFIRM_YN: '',
  E_MAIL: '',
  INSUF_ACTN: '',
  USER_ID: userStore.userId,
})

/* 조회 구분 */
const dtQuater = reactive([
  { COD: '1', TXT: '1분기' },
  { COD: '2', TXT: '2분기' },
  { COD: '3', TXT: '3분기' },
  { COD: '4', TXT: '4분기' },
])

const dtNumber2 = reactive([
  { COD: '0', TXT: '0점' },
  { COD: '1', TXT: '1점' },
  { COD: '2', TXT: '2점' },
  { COD: '3', TXT: '3점' },
  { COD: '4', TXT: '4점' },
  { COD: '5', TXT: '5점' },
])

const dtNumber = ref([
  { COD: '0', TXT: '0점' },
  { COD: '1', TXT: '0.5점' },
  { COD: '2', TXT: '1점' },
  { COD: '3', TXT: '1.5점' },
  { COD: '4', TXT: '2점' },
  { COD: '5', TXT: '2.5점' },
  { COD: '6', TXT: '3점' },
  { COD: '7', TXT: '3.5점' },
  { COD: '8', TXT: '4점' },
  { COD: '9', TXT: '4.5점' },
  { COD: '10', TXT: '5점' },
])

// const dtNumber = reactive([])

//그리드 속성셋팅
const grdSub1Props = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
  },
  keys: ['CMPNY_DIV', 'DOC_SEQ'],
  fields: [
    {
      fieldName: 'DOC_DIV',
      dataType: 'text',
      width: '120',
      header: { text: t('구분') },
      styleName: 'left-column',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'DOC_DESC',
      dataType: 'text',
      styleName: 'left-column',
      width: '300',
    },
    {
      fieldName: 'DOC_PER',
      dataType: 'text',
      width: '100',
      styleName: 'left-column',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'EVAL_YN',
      dataType: 'text',
      width: '150',
      header: { text: t('평가여부') },
      editable: false,
      renderer: {
        type: 'html',
        callback: (grid, model, field) => {
          return EVAL_GBNCallback(grid, model, field)
        },
      },
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'DOC_SEQ', dataType: 'text', visible: false },
    { fieldName: 'LGL_DOCS', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'DOC_DIV',
    {
      name: '세부내용',
      direction: 'horizontal',
      hideChildHeaders: true,
      items: ['DOC_DESC', 'DOC_PER'],
      header: {
        text: t('세부내용'),
      },
    },
    'EVAL_YN',
  ],
})

grdSub1Props.columns = grdSub1Props.fields

//그리드 속성셋팅
const grdSub2Props = reactive({
  gridViewOption: {
    stateBar: { visible: false },
  },
  keys: ['COL1'],
  fields: [
    {
      fieldName: 'DOC_DESC',
      dataType: 'text',
      width: '300',
      editable: false,
      styleName: 'left-column',
      header: { text: t('항목') },
    },
    {
      fieldName: 'EVAL_YN',
      dataType: 'text',
      width: '50',
      header: { text: t('해당유무') },
      renderer: {
        type: 'check',
        startEditOnClick: true,
        trueValues: 'Y',
        falseValues: 'N',
        editable: true,
        readonly: false,
      },
    },
    {
      fieldName: 'ADD_FILE',
      dataType: 'text',
      width: '50',
      editable: true,
      header: { text: t('첨부') },
      renderer: {
        type: 'button',
      },
    },
    {
      fieldName: 'FILE_YN',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('파일유무') },
    },

    // 출력 안함
    { fieldName: 'NO', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: ['DOC_DESC', 'EVAL_YN', 'ADD_FILE', 'FILE_YN'],
})

grdSub2Props.columns = grdSub2Props.fields

//그리드2 인증평가 데이터 입력
const data1 = [
  {
    NO: '1',
    DOC_DESC: '위험성 평가 인정사업장',
    EVAL_YN: 'N',
    ADD_FILE: '첨부',
    FILE_YN: '',
    FILE_ID: '',
  },
  {
    NO: '2',
    DOC_DESC: 'ISO 45001, KOSHA 등 안전경영시스템 인증',
    EVAL_YN: 'N',
    ADD_FILE: '첨부',
    FILE_YN: '',
    FILE_ID: '',
  },
]

const openPopup = (val) => {
  console.log('openPopup', val)

  popupParams.QUARTER = val.REG_DATE.substr(4, 1)
  popupParams.COMP_CD = val.COMP_CD
  popupParams.COMP_NM = val.COMP_NM
  popupParams.SLF_EVAL_STUS = val.SLF_EVAL_STUS

  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.REG_DATE = val.REG_DATE
  searchParams.COMP_CD = val.COMP_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.BSNS_CD = val.BSNS_CD

  sub2Score1.value = 0
  sub2Score2.value = 0

  onButtonsClick({ id: 'btnSearch' })

  dialog.value = true
  initCodeList()
  chkStatus()
}

const initCodeList = () => {
  Promise.all([getCodeList('HHIR010')]).then((res) => {
    dtNumber.value = res[0].ORESULT_CUR
  })
}

const chkStatus = () => {
  console.log('chkStatus : ', popupParams.SLF_EVAL_STUS)

  updateable.value = true
  if (popupParams.CONFIRM_YN === 'Y') {
    menuTitle.value.disableBtn('btnUpdate', true) // 저장
    menuTitle.value.disableBtn('btnFinishReview', true) // 검토완료
    menuTitle.value.disableBtn('btnCancelFinish', true) // 검토완료취소
    menuTitle.value.disableBtn('btnVendorCancelConfirm', true) // 협력사확정취소
    menuTitle.value.disableBtn('btnReqModify', true) // 수정요청 발송
  } else {
    if (popupParams.SLF_EVAL_STUS === 'C') {
      // 업체자체 평가 확인완료
      menuTitle.value.disableBtn('btnUpdate', false) // 저장
      menuTitle.value.disableBtn('btnFinishReview', false) // 검토완료
      menuTitle.value.disableBtn('btnCancelFinish', true) // 검토완료취소
      menuTitle.value.disableBtn('btnVendorCancelConfirm', false)
      menuTitle.value.disableBtn('btnReqModify', true) // 수정요청 발송
      updateable.value = false // 업체자체 평가 확인 완료 시 > 첨부파일 있는 부분 수정 가능
    } else if (popupParams.SLF_EVAL_STUS === 'N') {
      menuTitle.value.disableBtn('btnUpdate', true) // 저장
      menuTitle.value.disableBtn('btnFinishReview', true) // 검토완료
      menuTitle.value.disableBtn('btnCancelFinish', true) // 검토완료취소
      menuTitle.value.disableBtn('btnVendorCancelConfirm', true) // 협력사확정취소
      menuTitle.value.disableBtn('btnReqModify', false) // 수정요청 발송
    } else if (popupParams.SLF_EVAL_STUS === 'F') {
      menuTitle.value.disableBtn('btnUpdate', true) // 저장
      menuTitle.value.disableBtn('btnFinishReview', true) // 검토완료
      menuTitle.value.disableBtn('btnCancelFinish', false) // 검토완료취소
      menuTitle.value.disableBtn('btnVendorCancelConfirm', true) // 협력사확정취소
      menuTitle.value.disableBtn('btnReqModify', true) // 수정요청 발송
    } else {
      // 업체 자체 평가 완료, 진행중
      menuTitle.value.disableBtn('btnUpdate', true) // 저장
      menuTitle.value.disableBtn('btnFinishReview', true) // 검토완료
      menuTitle.value.disableBtn('btnCancelFinish', true) // 검토완료취소
      menuTitle.value.disableBtn('btnVendorCancelConfirm', true) // 협력사확정취소
      menuTitle.value.disableBtn('btnReqModify', true) // 수정요청 발송
    }
  }
}

const onClose = () => {
  dialog.value = false
  emit('closed')
}

defineExpose({
  openPopup,
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnFinishReview') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeFinish)
      .setQuery(finishData)
      .setConfirmMessage('담당자 검토완료 하시겠습니까?')
      .setResultMessage('검토완료 되었습니다.')
      .setAfter(afterFinish)
      .run()
  } else if (btn.id === 'btnVendorCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeCancelConfirm)
      .setQuery(cancelConfirmData)
      .setConfirmMessage('협력사 확정 취소 하시겠습니까?')
      .setResultMessage('협력사 확정 취소되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnCancelFinish') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeCancelFinish)
      .setQuery(cancelFinishData)
      .setConfirmMessage('검토완료 취소 하시겠습니까?')
      .setResultMessage('검토완료 취소되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnReqModify') {
    transMail()
  } else if (btn.id === 'btnManual') {
    let params = {
      FILE_PATH: 'SAFI',
      FILE_NAME: '★ 협력사 안전관리 수준평가 변경 기준_최종_개선 完_최종.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 조회
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFIB0020_SEARCH_03',
    param: searchParams,
  })
}

// 조회 후 데이터 처리
const afterSearch = (res) => {
  console.log('[afterSearch] res : ', res)
  popupParams.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
  popupParams.COMP_CD = res.ORESULT_CUR[0].COMP_CD
  popupParams.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
  popupParams.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
  popupParams.REG_DATE = res.ORESULT_CUR[0].REG_DATE
  popupParams.YEAR = res.ORESULT_CUR[0].YEAR
  popupParams.SLF_EVAL_STUS = res.ORESULT_CUR[0].SLF_EVAL_STUS
  popupParams.SFTY_ACTVT = res.ORESULT_CUR[0].SFTY_ACTVT
  popupParams.ONST_ACTV = res.ORESULT_CUR[0].ONST_ACTV
  popupParams.LGL_DOCS_CERTIFIED = res.ORESULT_CUR[0].LGL_DOCS_CERTIFIED
  popupParams.RISK_ASSM_RCGN_YN = res.ORESULT_CUR[0].RISK_ASSM_RCGN_YN
  popupParams.SFT_MNG_SYS_CRT_YN = res.ORESULT_CUR[0].SFT_MNG_SYS_CRT_YN
  popupParams.SITE_COMMENT = res.ORESULT_CUR[0].SITE_COMMENT
  popupParams.SFTY_ACTVT_FILE_ID = res.ORESULT_CUR[0].SFTY_ACTVT_FILE_ID
  popupParams.ONST_ACTV_FILE_ID = res.ORESULT_CUR[0].ONST_ACTV_FILE_ID
  popupParams.RISK_ASSM_RCGN_FILE_ID = res.ORESULT_CUR[0].RISK_ASSM_RCGN_FILE_ID
  popupParams.SFT_MNG_SYS_CRT_FILE_ID =
    res.ORESULT_CUR[0].SFT_MNG_SYS_CRT_FILE_ID
  popupParams.CONFIRM_YN = res.ORESULT_CUR[0].CONFIRM_YN
  popupParams.E_MAIL = res.ORESULT_CUR[0].E_MAIL
  popupParams.INSUF_ACTN = res.ORESULT_CUR[0].INSUF_ACTN

  grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR2)

  data1[0].EVAL_YN = popupParams.RISK_ASSM_RCGN_YN
  data1[0].FILE_ID = popupParams.RISK_ASSM_RCGN_FILE_ID

  if (!isEmpty(popupParams.RISK_ASSM_RCGN_FILE_ID)) {
    data1[0].FILE_YN = '유'
  } else {
    data1[0].FILE_YN = '무'
  }

  data1[1].EVAL_YN = popupParams.SFT_MNG_SYS_CRT_YN
  data1[1].FILE_ID = popupParams.SFT_MNG_SYS_CRT_FILE_ID

  if (!isEmpty(popupParams.SFT_MNG_SYS_CRT_FILE_ID)) {
    data1[1].FILE_YN = '유'
  } else {
    data1[1].FILE_YN = '무'
  }

  console.log('afterSearch data1 : ', data1)

  grdSub2.value.getDataProvider().setRows(data1) // 인증평가

  calcEvalLegalDoc()
  calcEvalCertified()
  chkStatus()

  checkFile(popupParams.SFTY_ACTVT_FILE_ID, 'SFTY_ACTVT')
  checkFile(popupParams.ONST_ACTV_FILE_ID, 'ONST_ACTV')
}

const beforeSave = () => {
  if (popupParams.SLF_EVAL_STUS === 'F') {
    return Message.warn(t('검토완료된 평가는 수정 할 수 없습니다.'))
  }

  if (popupParams.CONFIRM_YN === 'Y') {
    return Message.warn(t('최종 확정된 데이터는 수정할 수 없습니다.'))
  }

  grdSub2.value
    .getGridView()
    .getJsonRows()
    .forEach((row) => {
      if (row.NO === '1') {
        popupParams.RISK_ASSM_RCGN_YN = row.EVAL_YN
      } else if (row.NO === '2') {
        popupParams.SFT_MNG_SYS_CRT_YN = row.EVAL_YN
      }
    })

  return true
}

//저장
const saveData = () => {
  let saveParams = []

  console.log('[saveData] SLF_EVAL_STUS : ', popupParams.SLF_EVAL_STUS)

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV, // 회사 코드
    COMP_CD: popupParams.COMP_CD, // 협력사코드
    BSNS_CD: popupParams.BSNS_CD, // 사업부코드
    ASGN_CD: popupParams.ASGN_CD, // 조직코드
    REG_DATE: popupParams.REG_DATE, // 등록일자
    SLF_EVAL_STUS: popupParams.SLF_EVAL_STUS, // 자체 평가 코드
    LGL_DOCS_CERTIFIED: popupParams.LGL_DOCS_CERTIFIED, // 법적 서류 및 인증
    ONST_ACTV: popupParams.ONST_ACTV, // 현장개선활동
    ONST_ACTV_FILE_ID: popupParams.ONST_ACTV_FILE_ID, // 현장개선활동 파일첨부
    SFTY_ACTV: popupParams.SFTY_ACTVT,
    RISK_ASSM_RCGN_YN: popupParams.RISK_ASSM_RCGN_YN,
    SFT_MNG_SYS_CRT_YN: popupParams.SFT_MNG_SYS_CRT_YN,
    RISK_ASSM_RCGN_FILE_ID: popupParams.RISK_ASSM_RCGN_FILE_ID, // 위험성평가 인정사업장
    SFT_MNG_SYS_CRT_FILE_ID: popupParams.SFT_MNG_SYS_CRT_FILE_ID, // 안전경영시스템 인증
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId: 'SAFIB0020_SAVE_02', list: saveParams })
}

const beforeFinish = () => {
  if (popupParams.SLF_EVAL_STUS !== 'C') {
    return Message.warn(t('확정된 평가만 검토완료 할 수 있습니다.'))
  }

  if (isEmpty(popupParams.SITE_COMMENT)) {
    return Message.warn(
      t('사업부 안전 comment를 진행하지 않았습니다. 의견 작성 바랍니다.')
    )
  }

  // 검토완료 전 저장
  beforeSave()
  saveData()

  return true
}

//담당자 검토완료
const finishData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV, // 회사 코드
    COMP_CD: popupParams.COMP_CD, // 협력사코드
    BSNS_CD: popupParams.BSNS_CD, // 사업부코드
    ASGN_CD: popupParams.ASGN_CD, // 조직코드
    REG_DATE: popupParams.REG_DATE, // 등록일자
    SITE_COMMENT: popupParams.SITE_COMMENT, // 코멘트
    SLF_EVAL_STUS: 'F', // 완료
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId: 'SAFIB0030_SAVE_02', list: saveParams })
}

// 검토완료 후 협력사 메일 자동 발송
const afterFinish = () => {
  let emailParams = []

  if (isEmpty(popupParams.E_MAIL)) {
    return Message.warn('메일 주소가 없습니다. 협력사 확인 바랍니다.')
  }

  let emaillist = popupParams.E_MAIL.split(',')

  for (let data of emaillist) {
    emailParams.push(data.trim())
  }

  let mailParam = {
    EMAIL: emailParams, //받는사람 이메일주소
    SUBJECT:
      '[협력사 안전관리 수준평가] ' + popupParams.COMP_NM + ' 검토완료 건', //메일제목
    CONTENT:
      popupParams.COMP_NM +
      '은(는) 협력사 안전관리 수준평가 자체평가 검토 완료가 되었음을 알려드립니다.', //메일내용
  }

  console.log('[afterFinish mailParam = ', mailParam)

  commonSendApi(mailParam).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  }) //메일전송

  onClose()
}

const beforeCancelConfirm = () => {
  if (popupParams.SLF_EVAL_STUS !== 'C') {
    return Message.warn(t('확정된 평가만 취소 할 수 있습니다.'))
  }

  return true
}

//협력사 확정취소
const cancelConfirmData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV, // 회사 코드
    COMP_CD: popupParams.COMP_CD, // 협력사코드
    BSNS_CD: popupParams.BSNS_CD, // 사업부코드
    ASGN_CD: popupParams.ASGN_CD, // 조직코드
    REG_DATE: popupParams.REG_DATE, // 등록일자
    SLF_EVAL_STUS: 'N', // 확정취소
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  return commonExecuteApi({ queryId: 'SAFIB0030_SAVE_02', list: saveParams })
}

const beforeCancelFinish = () => {
  if (popupParams.SLF_EVAL_STUS !== 'F') {
    return Message.warn(t('검토완료된 평가만 취소 할 수 있습니다.'))
  }

  return true
}

//검토완료 취소
const cancelFinishData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV, // 회사 코드
    COMP_CD: popupParams.COMP_CD, // 협력사코드
    BSNS_CD: popupParams.BSNS_CD, // 사업부코드
    ASGN_CD: popupParams.ASGN_CD, // 조직코드
    REG_DATE: popupParams.REG_DATE, // 등록일자
    SLF_EVAL_STUS: 'C', // 검토취소
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  return commonExecuteApi({ queryId: 'SAFIB0030_SAVE_02', list: saveParams })
}

/* 법적서류 평가반영 */
const calcEvalLegalDoc = () => {
  let score = 0
  grdSub1.value
    .getGridView()
    .getJsonRows()
    .forEach((row) => {
      if (row.EVAL_YN === 'Y') {
        score = score + 0
      } else if (row.EVAL_YN === 'N') {
        score = score - 2
      }
    })
  if (score < -10) score = -10
  popupParams.LGL_DOCS = score
}

/* 인증평가 평가반영 */
const calcEvalCertified = () => {
  grdSub2.value
    .getGridView()
    .getJsonRows()
    .forEach((row) => {
      if (row.NO === '1' && row.EVAL_YN === 'Y') {
        sub2Score1.value = 1.5
      } else if (row.NO === '1' && row.EVAL_YN === 'N') {
        sub2Score1.value = 0
      } else if (row.NO === '2' && row.EVAL_YN === 'Y') {
        sub2Score2.value = 0.5
      } else if (row.NO === '2' && row.EVAL_YN === 'N') {
        sub2Score2.value = 0
      }
    })

  popupParams.CERTIFIED_EVAL = sub2Score1.value + sub2Score2.value
  popupParams.LGL_DOCS_CERTIFIED =
    popupParams.LGL_DOCS + popupParams.CERTIFIED_EVAL
}

const addFileSafetyClick = () => {
  fileUploadPopup_Safety.value.openPopup(popupParams.SFTY_ACTVT_FILE_ID)
}

const addFileSiteClick = () => {
  fileUploadPopup_Site.value.openPopup(popupParams.ONST_ACTV_FILE_ID)
}

const getQuarter = (date) => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdSub2.value.getDataProvider().getJsonRow(col.dataRow)

  console.log('[onCellItemClicked] data : ', data)

  if (col.field === 2) {
    if (data.NO === '1') {
      fileUploadPopup_Risk.value.openPopup(data.FILE_ID)
    } else if (data.NO === '2') {
      fileUploadPopup_ISO.value.openPopup(data.FILE_ID)
    }
  }
}

// 파일 업로드 후 저장
const uploaded_Safety = (param) => {
  console.log('upload after : ', param)
  console.log('param.fileId : ', param.fileId)

  if (param.fileId) {
    popupParams.SFTY_ACTVT_FILE_ID = param.fileId
    checkFile(param.fileId, 'SFTY_ACTVT')
  } else {
    popupParams.SFTY_ACTVT_FILE_ID = ''
  }
}

// 파일 업로드 후 저장
const uploaded_site = (param) => {
  console.log('upload after : ', param)
  console.log('param.fileId : ', param.fileId)

  if (param.fileId) {
    popupParams.ONST_ACTV_FILE_ID = param.fileId
    checkFile(param.fileId, 'ONST_ACTV')
  } else {
    popupParams.ONST_ACTV_FILE_ID = ''
  }
}

// 파일 업로드 후 저장
const uploaded_Risk = (param) => {
  console.log('uploaded_Risk : ', param.fileId)

  if (param.fileId) {
    popupParams.RISK_ASSM_RCGN_FILE_ID = param.fileId
  } else {
    popupParams.RISK_ASSM_RCGN_FILE_ID = ''
  }
}

// 파일 업로드 후 저장
const uploaded_ISO = (param) => {
  console.log('uploaded_ISO : ', param.fileId)

  if (param.fileId) {
    popupParams.SFT_MNG_SYS_CRT_FILE_ID = param.fileId
  } else {
    popupParams.SFT_MNG_SYS_CRT_FILE_ID = ''
  }
}

// 파일 존재 확인
const checkFile = async (fileId, id) => {
  const fileParams = {
    CMPNY_DIV: popupParams.CMPNY_DIV,
    FILE_ID: fileId,
  }

  // 파일이 있는지 확인
  await commonSearchApi({
    queryId: 'SAFIB0030_SEARCH_03',
    param: fileParams,
  }).then((res) => {
    if (res.ORESULT_CUR[0].CNT_FILE > 0) {
      if (id === 'SFTY_ACTVT') {
        fileSfty.value = true
      } else if (id === 'ONST_ACTV') {
        fileOnst.value = true
      }
    } else {
      if (id === 'SFTY_ACTVT') {
        fileSfty.value = false
      } else if (id === 'ONST_ACTV') {
        fileOnst.value = false
      }
    }
  })

  return false
}

// 메일 전송
const transMail = () => {
  let mailForm = {
    TO_EMP_NO: [],
    TO_EMP_NM: [],
  }

  if (isEmpty(popupParams.E_MAIL)) {
    return Message.warn('메일 주소가 없습니다. 협력사 확인 바랍니다.')
  }

  mailForm.TO_EMP_NO.push(popupParams.E_MAIL)
  mailForm.TO_EMP_NM.push(popupParams.COMP_NM)

  MailPopup.value.openPopup(mailForm)
}

// 체크 시 자동 평점 계산
const onCellClicked2 = async (grid, clickData) => {
  if (isEmpty(clickData.dataRow)) return
  if (clickData.fieldName !== 'EVAL_YN') return

  let row = grdSub2.value.getDataProvider().getJsonRow(clickData.dataRow)

  console.log('[onCellClicked2] row : ', row)

  if (row.NO === '1' && row.EVAL_YN === 'Y') {
    sub2Score1.value = 1.5
  } else if (row.NO === '1' && row.EVAL_YN === 'N') {
    sub2Score1.value = 0
  } else if (row.NO === '2' && row.EVAL_YN === 'Y') {
    sub2Score2.value = 0.5
  } else if (row.NO === '2' && row.EVAL_YN === 'N') {
    sub2Score2.value = 0
  }

  popupParams.CERTIFIED_EVAL = sub2Score1.value + sub2Score2.value
  popupParams.LGL_DOCS_CERTIFIED =
    popupParams.LGL_DOCS + popupParams.CERTIFIED_EVAL
}

//법적서류 그리드에 라디오 버튼 표시
const EVAL_GBNCallback = (grid, model, field) => {
  let checkedY = ''
  let checkedN = ''
  let checkedU = ''

  if (model._index.value === 'Y') {
    checkedY = 'checked'
  } else if (model._index.value === 'N') {
    checkedN = 'checked'
  } else {
    checkedU = 'checked'
  }

  return (
    "<input type='radio' " +
    "value='Y' disabled='true' " +
    'name=' +
    "'group" +
    model._index.dataRow +
    'Y' +
    "' " +
    checkedY +
    ' />' +
    "<span style='padding: 0 10px 0 10px !important;'>Yes</span>" +
    "<input type='radio' " +
    "value='N' disabled='true' " +
    'name=' +
    "'group" +
    model._index.dataRow +
    'Y' +
    "'" +
    checkedN +
    ' />' +
    "<span style='padding: 0 10px 0 10px !important;'>No</span>" +
    "<input type='radio' " +
    "value='U' disabled='true' " +
    'name=' +
    "'group" +
    model._index.dataRow +
    'Y' +
    "'" +
    checkedU +
    ' />' +
    "<span style='padding: 0 10px 0 10px !important;'>해당없음</span>"
  )
}

watch(
  () => popupParams.LGL_DOCS,
  (newValue, oldValue) => {
    if (newValue < -10) {
      popupParams.LGL_DOCS = -10
    }
  }
)
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1100"
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
      <span>업체자체평가</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnUpdate',
            'btnVendorCancelConfirm',
            'btnFinishReview',
            'btnCancelFinish',
            'btnReqModify',
            'btnManual',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="d-flex">
            <i-input
              v-model="popupParams.YEAR"
              :label="$t('년도')"
              top-label
              label-width="60px"
              width="120px"
              readonly
            />
            <i-input
              v-model="popupParams.QUARTER"
              :label="$t('분기')"
              top-label
              label-width="70px"
              width="120px"
              readonly
            />
            <i-input
              v-model="popupParams.COMP_NM"
              :label="$t('대상')"
              top-label
              label-width="60px"
              width="200px"
              readonly
            />
          </v-sheet>
          <v-sheet class="d-flex mt-3">
            <i-select
              v-model="popupParams.SFTY_ACTVT"
              :label="$t('➀ 협력사 대표 안전활동 건수')"
              :readonly="updateable"
              label-width="180px"
              append-inner-icon="mdi-magnify"
              :items="dtNumber"
              item-title="TXT"
              item-value="COD"
              width="200px"
              top-label
            />
            <v-btn
              v-model="popupParams.SFTY_ACTVT_FILE_ID"
              class="mt-5"
              @click="addFileSafetyClick"
            >
              첨부
            </v-btn>
            <div class="complete-file ml-2" v-if="fileSfty">
              첨부된 파일이 있습니다.
            </div>
          </v-sheet>
          <div class="formLabelText mt-3">➁ 법적 서류 및 인증</div>
          <i-input
            v-model="popupParams.LGL_DOCS_CERTIFIED"
            :label="$t('총점')"
            top-label
            label-width="60px"
            width="120px"
            class="mt-3"
            readonly
          />
          <v-sheet class="mt-3" height="250px">
            <!-- 서브그리드1 -->
            <IGridTitle :title="$t('법적서류')" />
            <i-input
              v-model="popupParams.LGL_DOCS"
              width="120px"
              class="mb-2"
              readonly
            />
            <RealGrid
              ref="grdSub1"
              :grid-view-option="grdSub1Props.gridViewOption"
              :keys="grdSub1Props.keys"
              :fields="grdSub1Props.fields"
              :columns="grdSub1Props.columns"
              :column-layout="grdSub1Props.columnLayout"
            />
          </v-sheet>
          <v-sheet class="mt-3" height="180px">
            <!-- 서브그리드2 -->
            <IGridTitle :title="$t('인증평가')" />
            <i-input
              v-model="popupParams.CERTIFIED_EVAL"
              width="120px"
              class="mb-2"
              readonly
            />
            <RealGrid
              ref="grdSub2"
              :grid-view-option="grdSub2Props.gridViewOption"
              :keys="grdSub2Props.keys"
              :fields="grdSub2Props.fields"
              :columns="grdSub2Props.columns"
              :column-layout="grdSub2Props.columnLayout"
              @on-cell-item-clicked="onCellItemClicked"
              @on-cell-clicked="onCellClicked2"
            />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <div class="d-flex">
              <i-select
                v-model="popupParams.ONST_ACTV"
                :label="$t('➂ 현장개선활동')"
                :readonly="updateable"
                label-width="180px"
                append-inner-icon="mdi-magnify"
                :items="dtNumber2"
                item-title="TXT"
                item-value="COD"
                width="280px"
              />
              <v-btn
                v-model="popupParams.ONST_ACTV_FILE_ID"
                class="mt-1"
                @click="addFileSiteClick"
              >
                첨부
              </v-btn>
              <div class="complete-file ml-2" v-if="fileOnst">
                첨부된 파일이 있습니다.
              </div>
            </div>
          </v-sheet>
          <div class="formLabelText mt-1">④ 사업부 안전 comment</div>
          <v-textarea
            v-model="popupParams.SITE_COMMENT"
            dense
            outlined
            hide-details
            :no-resize="false"
          />
        </div>
        <!-- 안전활동 파일첨부 -->
        <IUploadPopup
          ref="fileUploadPopup_Safety"
          @uploaded="uploaded_Safety($event)"
        />
        <!-- 현장개선활동 파일첨부 -->
        <IUploadPopup
          ref="fileUploadPopup_Site"
          @uploaded="uploaded_site($event)"
        />
        <!-- 위험성 평가 인정사업장 파일첨부 -->
        <IUploadPopup
          ref="fileUploadPopup_Risk"
          @uploaded="uploaded_Risk($event)"
        />
        <!-- 안전경영시스템 인증 파일첨부 -->
        <IUploadPopup
          ref="fileUploadPopup_ISO"
          @uploaded="uploaded_ISO($event)"
        />
        <SendMailPopup ref="MailPopup" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.complete-file {
  color: blue;
  display: flex;
  align-items: center;
}
</style>
