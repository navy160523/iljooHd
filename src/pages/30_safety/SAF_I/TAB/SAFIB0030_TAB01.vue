<!-- 
  * Vue 내 용 : 협력사 안전관리 수준 자체평가
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/09
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/09 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"
import { isEmpty } from "@/@core/utils"
import dayjs from 'dayjs'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'

defineOptions({
  name:'30_safety-SAF_I-TAB-SAFIB0030_TAB01',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const fileUploadPopup_Site = ref(null) //파일 업로드 팝업
const fileUploadPopup_Safety = ref(null) //파일 업로드 팝업
const fileUploadPopup_Risk = ref(null) //파일 업로드 팝업
const fileUploadPopup_ISO= ref(null) //파일 업로드 팝업
const deptPopUp = ref(null)
const MailPopup = ref(null)
const fileSfty = ref(false)
const fileOnst = ref(false)
const sub1Score1 = ref(0)
const sub2Score1 = ref(0)
const sub2Score2 = ref(0)
const rowIdx = ref(0)

const isVisibleComment = ref(false)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  COMP_CD: '',
  COMP_NM: '',
  YEAR: dayjs().get("year"),
  QUARTER: '',
  USER_DIV: userStore.asgnCd,
  USER_ID: userStore.userId,
})

/* 조회 구분 */
const dtQuater = reactive([
  { COD: "1", TXT: "1분기" },
  { COD: "2", TXT: "2분기" },
  { COD: "3", TXT: "3분기" },
  { COD: "4", TXT: "4분기" },
])

//입력조건
const inputParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  ASGN_CD: '',
  REG_DATE: '',
  CERTIFIED_EVAL: 0,
  ONST_ACTV: '',
  SLF_EVAL_STUS: '',
  LGL_DOCS_CERTIFIED: '',
  LGL_DOCS_01: '',
  LGL_DOCS_02: '',
  LGL_DOCS_03: '',
  LGL_DOCS_04: '',
  LGL_DOCS_05: '',
  LGL_DOCS_06: '',
  LGL_DOCS_07: '',
  LGL_DOCS_08: '',
  LGL_DOCS_09: '',
  LGL_DOCS_10: '',
  LGL_DOCS_11: '',
  LGL_DOCS_12: '',
  LGL_DOCS_13: '',
  LGL_DOCS_14: '',
  LGL_DOCS_15: '',
  LGL_DOCS_16: '',
  LGL_DOCS_17: '',
  LGL_DOCS_18: '',
  LGL_DOCS_19: '',
  LGL_DOCS_20: '',
  LGL_DOCS_21: '',
  LGL_DOCS_22: '',
  LGL_DOCS_23: '',
  LGL_DOCS_24: '',
  LGL_DOCS_25: '',
  LGL_DOCS_26: '',
  LGL_DOCS_27: '',
  LGL_DOCS_28: '',
  LGL_DOCS_29: '',
  LGL_DOCS_30: '',
  LGL_DOCS_31: '',
  LGL_DOCS_32: '',
  LGL_DOCS_33: '',
  LGL_DOCS_34: '',
  LGL_DOCS: '',
  SFTY_ACTVT: '',
  COMP_NM: '',
  RISK_ASSM_RCGN_YN: '',
  SFT_MNG_SYS_CRT_YN: '',
  SFTY_ACTVT_FILE_ID: '',
  ONST_ACTV_FILE_ID: '',
  RISK_ASSM_RCGN_FILE_ID: '',
  SFT_MNG_SYS_CRT_FILE_ID: '',
  SITE_COMMENT: '',
  USER_ID: userStore.userId,
})

const dtNumber = reactive([
  { COD: "0",  TXT: "0점"   },
  { COD: "1",  TXT: "0.5점" },
  { COD: "2",  TXT: "1점"   },
  { COD: "3",  TXT: "1.5점" },
  { COD: "4",  TXT: "2점"   },
  { COD: "5",  TXT: "2.5점" },
  { COD: "6",  TXT: "3점"   },
  { COD: "7",  TXT: "3.5점" },
  { COD: "8",  TXT: "4점"   },
  { COD: "9",  TXT: "4.5점" },
  { COD: "10", TXT: "5점"   },
])

const dtNumber2 = reactive([
  { COD: "0",  TXT: "0점"   },
  { COD: "1",  TXT: "1점"   },
  { COD: "2",  TXT: "2점"   },
  { COD: "3",  TXT: "3점"   },
  { COD: "4",  TXT: "4점"   },
  { COD: "5",  TXT: "5점"   },
])

//그리드 속성셋팅
const grdSub1Props = reactive({
  gridViewOption : { 
    stateBar: { visible: false }, 
    edit: { editable: true },
  },
  keys : ['CMPNY_DIV','DOC_SEQ'],
  fields : [ 
    { 
      fieldName: 'DOC_DIV',
      dataType: 'text', 
      width: '120',
      editable: false,
      header: { text: t('구분') },
      styleName: "left-column",
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'DOC_DESC', 
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'DOC_PER', 
      dataType: 'text', 
      width: '120',
      editable: false,
      styleName: "left-column",
      mergeRule: { "criteria": "value" },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'EVAL_YN', 
      dataType: 'text',
      width: '150', 
      header: { text: t('평가여부') }, 
      renderer: { 
        type: 'html', 
        callback: (grid, model, field) =>{ 
          return EVAL_GBNCallback(grid, model, field) 
        },
      }, 
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'DOC_SEQ', dataType: 'text' , visible: false },
    { fieldName: 'LGL_DOCS', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'DOC_DIV',
    {
      name: '세부내용',
      direction: 'horizontal',
      hideChildHeaders:true,
      items: [
        'DOC_DESC',
        'DOC_PER',
      ],
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
  gridViewOption : { 
    stateBar: { visible: false }, 
    edit: { editable: true },
  },
  keys : ['COL1'],
  fields : [ 
    { 
      fieldName: 'DOC_DESC',
      dataType: 'text',
      editable: false,
      styleName: "left-column",
      header: { text: t('항목') },
    },
    { 
      fieldName: 'EVAL_YN', 
      dataType: 'text',
      width: '50',
      header: { text: t('해당유무') },
      renderer: { 
        type: "check", 
        startEditOnClick: true, 
        trueValues: "Y", 
        falseValues: "N", 
        editable: true, 
        readonly : false,
      },
    },
    { 
      fieldName: 'ADD_FILE', 
      dataType: 'text',
      width: '50', 
      header: { text: t('첨부') },
      editable: false, 
      renderer:{
        type:"button",
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
    { fieldName: 'NO', dataType: 'text' , visible: false },
    { fieldName: 'FILE_ID', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'DOC_DESC',
    'EVAL_YN',
    'ADD_FILE',
    'FILE_YN',
  ],
})

grdSub2Props.columns = grdSub2Props.fields

//그리드2 인증평가 데이터 입력
const data1 = [
  { NO: '1', DOC_DESC: '위험성 평가 인정사업장',	EVAL_YN: 'N',	ADD_FILE: '첨부', FILE_YN: '', FILE_ID: '' },
  { NO: '2', DOC_DESC: 'ISO 45001, KOSHA 등 안전경영시스템 인증',	EVAL_YN: 'N',	ADD_FILE: '첨부', FILE_YN: '', FILE_ID: '' },
]

onMounted(() => {
  vm.$nextTick(() => {
    searchParams.QUARTER = getQuarter(new Date())
    chkStatus()
  })  
})

const chkStatus = () => {

  console.log('chkStatus : ', inputParams.SLF_EVAL_STUS)

  if(inputParams.CONFIRM_YN === 'Y') {
    menuTitle.value.disableBtn('btnUpdate', true)  // 저장
    menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정
  }
  else {
    if(inputParams.SLF_EVAL_STUS === 'Y') {
      menuTitle.value.disableBtn('btnUpdate', false)  // 저장
      menuTitle.value.disableBtn('btnVendorConfirm', false)  // 확정
    }
    else if(isEmpty(inputParams.SLF_EVAL_STUS) || inputParams.SLF_EVAL_STUS === 'N') {
      menuTitle.value.disableBtn('btnUpdate', false)  // 저장
      menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정
    }   
    else {
      menuTitle.value.disableBtn('btnUpdate', true)  // 저장
      menuTitle.value.disableBtn('btnVendorConfirm', true)  // 확정
    }
  }
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    grdSub1.value.getDataProvider().setRows([])
    new queryFlowHelper(vm, t)
      .setGridList([grdSub1, grdSub2])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } 
  else if (btn.id === 'btnVendorConfirm') {
    new saveFlowHelper(vm, t)
      .setQuery(confirmData)
      .setConfirmMessage('확정을 하게 되면 수정이 불가합니다. 확정 하시겠습니까?\r\n(향후 확정을 취소하고자 할 경우, 담당자에게 문의 바랍니다.)')
      .setResultMessage('확정되었습니다.')
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } 
  // else if (btn.id === 'btnCancelConfirm') {
  //   // requestCancelConfirmData()
  //   new saveFlowHelper(vm, t)
  //     .setQuery(cancelConfirmData)
  //     .setConfirmMessage('확정 취소 하시겠습니까?')
  //     .setResultMessage('확정 취소되었습니다.')
  //     .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
  //     .run()
  // }
  else if (btn.id === 'btnManual') {
    let params = {
      FILE_PATH: 'SAFI',
      FILE_NAME: '★ 협력사 안전관리 수준평가 변경 기준_최종_개선 完_최종.xlsx',
    }
    commonSampleDownFilesApi(params)
  }
}

// 조회
const beforeSearch = async () => {
  if (isEmpty(searchParams.YEAR)) {
    return Message.err("년도를 입력해주세요.")
  }

  if (isEmpty(searchParams.QUARTER)) {
    return Message.err("분기를 입력해주세요.")
  }

  if (isEmpty(searchParams.COMP_CD)) {
    return Message.err("협력사를 입력해주세요.")
  }

  return true
}

// 조회
const searchData = () =>{
  console.log('[searchData] searchParams: ', searchParams)

  return commonSearchApi({ queryId : 'SAFIB0030_SEARCH_01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log('[afterSearch] res : ', res)
  clearData()

  if(res.ORESULT_CUR.length > 0) {
    inputParams.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
    inputParams.COMP_NM = res.ORESULT_CUR[0].COMP_NM
    inputParams.COMP_CD = res.ORESULT_CUR[0].COMP_CD
    inputParams.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
    inputParams.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
    inputParams.REG_DATE = res.ORESULT_CUR[0].REG_DATE
    inputParams.SLF_EVAL_STUS = res.ORESULT_CUR[0].SLF_EVAL_STUS
    inputParams.SFTY_ACTVT = res.ORESULT_CUR[0].SFTY_ACTVT
    inputParams.ONST_ACTV = res.ORESULT_CUR[0].ONST_ACTV
    inputParams.LGL_DOCS_CERTIFIED = res.ORESULT_CUR[0].LGL_DOCS_CERTIFIED
    inputParams.LGL_DOCS_01 = res.ORESULT_CUR[0].LGL_DOCS_01
    inputParams.LGL_DOCS_02 = res.ORESULT_CUR[0].LGL_DOCS_02
    inputParams.LGL_DOCS_03 = res.ORESULT_CUR[0].LGL_DOCS_03
    inputParams.LGL_DOCS_04 = res.ORESULT_CUR[0].LGL_DOCS_04
    inputParams.LGL_DOCS_05 = res.ORESULT_CUR[0].LGL_DOCS_05
    inputParams.LGL_DOCS_06 = res.ORESULT_CUR[0].LGL_DOCS_06
    inputParams.LGL_DOCS_07 = res.ORESULT_CUR[0].LGL_DOCS_07
    inputParams.LGL_DOCS_08 = res.ORESULT_CUR[0].LGL_DOCS_08
    inputParams.LGL_DOCS_09 = res.ORESULT_CUR[0].LGL_DOCS_09
    inputParams.LGL_DOCS_10 = res.ORESULT_CUR[0].LGL_DOCS_10
    inputParams.LGL_DOCS_11 = res.ORESULT_CUR[0].LGL_DOCS_11
    inputParams.LGL_DOCS_12 = res.ORESULT_CUR[0].LGL_DOCS_12
    inputParams.LGL_DOCS_13 = res.ORESULT_CUR[0].LGL_DOCS_13
    inputParams.LGL_DOCS_14 = res.ORESULT_CUR[0].LGL_DOCS_14
    inputParams.LGL_DOCS_15 = res.ORESULT_CUR[0].LGL_DOCS_15
    inputParams.LGL_DOCS_16 = res.ORESULT_CUR[0].LGL_DOCS_16
    inputParams.LGL_DOCS_17 = res.ORESULT_CUR[0].LGL_DOCS_17
    inputParams.LGL_DOCS_18 = res.ORESULT_CUR[0].LGL_DOCS_18
    inputParams.LGL_DOCS_19 = res.ORESULT_CUR[0].LGL_DOCS_19
    inputParams.LGL_DOCS_20 = res.ORESULT_CUR[0].LGL_DOCS_20
    inputParams.LGL_DOCS_21 = res.ORESULT_CUR[0].LGL_DOCS_21
    inputParams.LGL_DOCS_22 = res.ORESULT_CUR[0].LGL_DOCS_22
    inputParams.LGL_DOCS_23 = res.ORESULT_CUR[0].LGL_DOCS_23
    inputParams.LGL_DOCS_24 = res.ORESULT_CUR[0].LGL_DOCS_24
    inputParams.LGL_DOCS_25 = res.ORESULT_CUR[0].LGL_DOCS_25
    inputParams.LGL_DOCS_26 = res.ORESULT_CUR[0].LGL_DOCS_26
    inputParams.LGL_DOCS_27 = res.ORESULT_CUR[0].LGL_DOCS_27
    inputParams.LGL_DOCS_28 = res.ORESULT_CUR[0].LGL_DOCS_28
    inputParams.LGL_DOCS_29 = res.ORESULT_CUR[0].LGL_DOCS_29
    inputParams.LGL_DOCS_30 = res.ORESULT_CUR[0].LGL_DOCS_30
    inputParams.LGL_DOCS_31 = res.ORESULT_CUR[0].LGL_DOCS_31
    inputParams.LGL_DOCS_32 = res.ORESULT_CUR[0].LGL_DOCS_32
    inputParams.LGL_DOCS_33 = res.ORESULT_CUR[0].LGL_DOCS_33
    inputParams.LGL_DOCS_34 = res.ORESULT_CUR[0].LGL_DOCS_34
    inputParams.RISK_ASSM_RCGN_YN = res.ORESULT_CUR[0].RISK_ASSM_RCGN_YN
    inputParams.SFT_MNG_SYS_CRT_YN = res.ORESULT_CUR[0].SFT_MNG_SYS_CRT_YN
    inputParams.SITE_COMMENT = res.ORESULT_CUR[0].SITE_COMMENT
    inputParams.SFTY_ACTVT_FILE_ID = res.ORESULT_CUR[0].SFTY_ACTVT_FILE_ID
    inputParams.ONST_ACTV_FILE_ID = res.ORESULT_CUR[0].ONST_ACTV_FILE_ID
    inputParams.RISK_ASSM_RCGN_FILE_ID = res.ORESULT_CUR[0].RISK_ASSM_RCGN_FILE_ID
    inputParams.SFT_MNG_SYS_CRT_FILE_ID = res.ORESULT_CUR[0].SFT_MNG_SYS_CRT_FILE_ID
    inputParams.CONFIRM_YN = res.ORESULT_CUR[0].CONFIRM_YN

    data1[0].EVAL_YN = inputParams.RISK_ASSM_RCGN_YN
    data1[0].FILE_ID = inputParams.RISK_ASSM_RCGN_FILE_ID

    if(!isEmpty(inputParams.RISK_ASSM_RCGN_FILE_ID)) {
      data1[0].FILE_YN = '유'
    }
    else {
      data1[0].FILE_YN = '무'
    }

    data1[1].EVAL_YN = inputParams.SFT_MNG_SYS_CRT_YN
    data1[1].FILE_ID = inputParams.SFT_MNG_SYS_CRT_FILE_ID

    if(!isEmpty(inputParams.SFT_MNG_SYS_CRT_FILE_ID)) {
      data1[1].FILE_YN = '유'
    }
    else {
      data1[1].FILE_YN = '무'
    }
  }
  else {
    return Message.warn(t(searchParams.COMP_NM + '는 평가 선정된 업체가 아닙니다. 소속 확인바랍니다.'))
  }

  console.log('[afterSearch] data1 = ', data1)

  grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR2)
  grdSub2.value.getDataProvider().setRows(data1) // 인증평가

  evalLegalDocCalc()
  evalCertifiedClick()
  chkStatus()

  checkFile(inputParams.SFTY_ACTVT_FILE_ID, 'SFTY_ACTVT')
  checkFile(inputParams.ONST_ACTV_FILE_ID, 'ONST_ACTV')

}

const beforeSave = () => {
  
  if(isEmpty(inputParams.SFTY_ACTVT)) {
    return Message.warn(t('협력사 대표 안전활동 건수 데이터가 없습니다.'))
  }

  if(isEmpty(inputParams.LGL_DOCS_CERTIFIED)) {
    return Message.warn(t('법적 서류 및 인증 데이터가 없습니다.'))
  }

  if(isEmpty(inputParams.ONST_ACTV)) {
    return Message.warn(t('현장개선활동 데이터가 없습니다.'))
  }

  saveDocYN()

  return true
}

//저장
const saveData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: inputParams.CMPNY_DIV, // 회사 코드
    COMP_CD: inputParams.COMP_CD, // 협력사코드
    BSNS_CD: inputParams.BSNS_CD, // 사업부코드
    ASGN_CD: inputParams.ASGN_CD, // 조직코드
    REG_DATE: inputParams.REG_DATE, // 등록일자
    SFTY_ACTVT: inputParams.SFTY_ACTVT, // 안전활동
    ONST_ACTV: inputParams.ONST_ACTV, // 현장개선활동
    LGL_DOCS_CERTIFIED: inputParams.LGL_DOCS_CERTIFIED, // 법적 서류 및 인증
    LGL_DOCS_01: inputParams.LGL_DOCS_01,
    LGL_DOCS_02: inputParams.LGL_DOCS_02,
    LGL_DOCS_03: inputParams.LGL_DOCS_03,
    LGL_DOCS_04: inputParams.LGL_DOCS_04,
    LGL_DOCS_05: inputParams.LGL_DOCS_05,
    LGL_DOCS_06: inputParams.LGL_DOCS_06,
    LGL_DOCS_07: inputParams.LGL_DOCS_07,
    LGL_DOCS_08: inputParams.LGL_DOCS_08,
    LGL_DOCS_09: inputParams.LGL_DOCS_09,
    LGL_DOCS_10: inputParams.LGL_DOCS_10,
    LGL_DOCS_11: inputParams.LGL_DOCS_11,
    LGL_DOCS_12: inputParams.LGL_DOCS_12,
    LGL_DOCS_13: inputParams.LGL_DOCS_13,
    LGL_DOCS_14: inputParams.LGL_DOCS_14,
    LGL_DOCS_15: inputParams.LGL_DOCS_15,
    LGL_DOCS_16: inputParams.LGL_DOCS_16,
    LGL_DOCS_17: inputParams.LGL_DOCS_17,
    LGL_DOCS_18: inputParams.LGL_DOCS_18,
    LGL_DOCS_19: inputParams.LGL_DOCS_19,
    LGL_DOCS_20: inputParams.LGL_DOCS_20,
    LGL_DOCS_21: inputParams.LGL_DOCS_21,
    LGL_DOCS_22: inputParams.LGL_DOCS_22,
    LGL_DOCS_23: inputParams.LGL_DOCS_23,
    LGL_DOCS_24: inputParams.LGL_DOCS_24,
    LGL_DOCS_25: inputParams.LGL_DOCS_25,
    LGL_DOCS_26: inputParams.LGL_DOCS_26,
    LGL_DOCS_27: inputParams.LGL_DOCS_27,
    LGL_DOCS_28: inputParams.LGL_DOCS_28,
    LGL_DOCS_29: inputParams.LGL_DOCS_29,
    LGL_DOCS_30: inputParams.LGL_DOCS_30,
    LGL_DOCS_31: inputParams.LGL_DOCS_31,
    LGL_DOCS_32: inputParams.LGL_DOCS_32,
    LGL_DOCS_33: inputParams.LGL_DOCS_33,
    LGL_DOCS_34: inputParams.LGL_DOCS_34,
    RISK_ASSM_RCGN_YN: inputParams.RISK_ASSM_RCGN_YN,
    SFT_MNG_SYS_CRT_YN: inputParams.SFT_MNG_SYS_CRT_YN,
    SFTY_ACTVT_FILE_ID: inputParams.SFTY_ACTVT_FILE_ID,  // 안전활동 파일첨부
    ONST_ACTV_FILE_ID: inputParams.ONST_ACTV_FILE_ID,   // 현장개선활동 파일첨부
    RISK_ASSM_RCGN_FILE_ID: inputParams.RISK_ASSM_RCGN_FILE_ID, // 위험성평가 인정사업장
    SFT_MNG_SYS_CRT_FILE_ID: inputParams.SFT_MNG_SYS_CRT_FILE_ID, // 안전경영시스템 인증 
    SITE_COMMENT: inputParams.SITE_COMMENT, // 코멘트
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIB0030_SAVE_01', list: saveParams })
}

//확정
const confirmData = () => {
  let saveParams = []
  
  // if(isEmpty(inputParams.SITE_COMMENT)) {
  //   return Message.warn(t('사업부 안전 comment를 진행하지 않았습니다. 의견 작성 바랍니다.'))
  // }

  saveParams.push({
    CMPNY_DIV: inputParams.CMPNY_DIV, // 회사 코드
    COMP_CD: inputParams.COMP_CD, // 협력사코드
    BSNS_CD: inputParams.BSNS_CD, // 사업부코드
    ASGN_CD: inputParams.ASGN_CD, // 조직코드
    REG_DATE: inputParams.REG_DATE, // 등록일자
    SLF_EVAL_STUS: 'C', // 확정
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  return commonExecuteApi({ queryId : 'SAFIB0030_SAVE_02', list: saveParams })
}

//확정취소
const cancelConfirmData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: inputParams.CMPNY_DIV, // 회사 코드
    COMP_CD: inputParams.COMP_CD, // 협력사코드
    BSNS_CD: inputParams.BSNS_CD, // 사업부코드
    ASGN_CD: inputParams.ASGN_CD, // 조직코드
    REG_DATE: inputParams.REG_DATE, // 등록일자
    SLF_EVAL_STUS: 'N', // 확정취소
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  return commonExecuteApi({ queryId : 'SAFIB0030_SAVE_02', list: saveParams })
}

//확정취소요청
const requestCancelConfirmData = () => {
  let mailForm = {
    TO_EMP_NO: [],
    TO_EMP_NM: [],
  }

  MailPopup.value.openPopup(mailForm)
}

const clearData = () => {
  inputParams.CMPNY_DIV = ''
  inputParams.COMP_NM = ''
  inputParams.COMP_CD = ''
  inputParams.BSNS_CD = ''
  inputParams.ASGN_CD = ''
  inputParams.REG_DATE = ''
  inputParams.SLF_EVAL_STUS = ''
  inputParams.SFTY_ACTVT = ''
  inputParams.ONST_ACTV = ''
  inputParams.LGL_DOCS_CERTIFIED = ''
  inputParams.LGL_DOCS_01 = ''
  inputParams.LGL_DOCS_02 = ''
  inputParams.LGL_DOCS_03 = ''
  inputParams.LGL_DOCS_04 = ''
  inputParams.LGL_DOCS_05 = ''
  inputParams.LGL_DOCS_06 = ''
  inputParams.LGL_DOCS_07 = ''
  inputParams.LGL_DOCS_08 = ''
  inputParams.LGL_DOCS_09 = ''
  inputParams.LGL_DOCS_10 = ''
  inputParams.LGL_DOCS_11 = ''
  inputParams.LGL_DOCS_12 = ''
  inputParams.LGL_DOCS_13 = ''
  inputParams.LGL_DOCS_14 = ''
  inputParams.LGL_DOCS_15 = ''
  inputParams.LGL_DOCS_16 = ''
  inputParams.LGL_DOCS_17 = ''
  inputParams.LGL_DOCS_18 = ''
  inputParams.LGL_DOCS_19 = ''
  inputParams.LGL_DOCS_20 = ''
  inputParams.LGL_DOCS_21 = ''
  inputParams.LGL_DOCS_22 = ''
  inputParams.LGL_DOCS_23 = ''
  inputParams.LGL_DOCS_24 = ''
  inputParams.LGL_DOCS_25 = ''
  inputParams.LGL_DOCS_26 = ''
  inputParams.LGL_DOCS_27 = ''
  inputParams.LGL_DOCS_28 = ''
  inputParams.LGL_DOCS_29 = ''
  inputParams.LGL_DOCS_30 = ''
  inputParams.LGL_DOCS_31 = ''
  inputParams.LGL_DOCS_32 = ''
  inputParams.LGL_DOCS_33 = ''
  inputParams.LGL_DOCS_34 = ''
  inputParams.RISK_ASSM_RCGN_YN = ''
  inputParams.SFT_MNG_SYS_CRT_YN = ''
  inputParams.SITE_COMMENT = ''
  inputParams.SFTY_ACTVT_FILE_ID = ''
  inputParams.ONST_ACTV_FILE_ID = ''
  inputParams.RISK_ASSM_RCGN_FILE_ID = ''
  inputParams.SFT_MNG_SYS_CRT_FILE_ID = ''

  inputParams.LGL_DOCS = ''
  inputParams.CERTIFIED_EVAL = ''

  grdSub1.value.getDataProvider().setRows(null)
  grdSub2.value.getDataProvider().setRows(null)

  sub1Score1.value = 0
  sub2Score1.value = 0
  sub2Score2.value = 0
}

/* 법적서류 평가 여부 저장 */
const saveDocYN  = () => {
  grdSub1.value.getGridView().getJsonRows().forEach(row => {
    if(row.DOC_SEQ === '01') {
      inputParams.LGL_DOCS_01 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '02') {
      inputParams.LGL_DOCS_02 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '03') {
      inputParams.LGL_DOCS_03 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '04') {
      inputParams.LGL_DOCS_04 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '05') {
      inputParams.LGL_DOCS_05 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '06') {
      inputParams.LGL_DOCS_06 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '07') {
      inputParams.LGL_DOCS_07 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '08') {
      inputParams.LGL_DOCS_08 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '09') {
      inputParams.LGL_DOCS_09 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '10') {
      inputParams.LGL_DOCS_10 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '11') {
      inputParams.LGL_DOCS_11 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '12') {
      inputParams.LGL_DOCS_12 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '13') {
      inputParams.LGL_DOCS_13 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '14') {
      inputParams.LGL_DOCS_14 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '15') {
      inputParams.LGL_DOCS_15 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '16') {
      inputParams.LGL_DOCS_16 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '17') {
      inputParams.LGL_DOCS_17 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '18') {
      inputParams.LGL_DOCS_18 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '19') {
      inputParams.LGL_DOCS_19 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '20') {
      inputParams.LGL_DOCS_20 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '21') {
      inputParams.LGL_DOCS_21 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '22') {
      inputParams.LGL_DOCS_22= row.EVAL_YN
    }
    else if(row.DOC_SEQ === '23') {
      inputParams.LGL_DOCS_23 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '24') {
      inputParams.LGL_DOCS_24 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '25') {
      inputParams.LGL_DOCS_25 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '26') {
      inputParams.LGL_DOCS_26 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '27') {
      inputParams.LGL_DOCS_27 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '28') {
      inputParams.LGL_DOCS_28 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '29') {
      inputParams.LGL_DOCS_29 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '30') {
      inputParams.LGL_DOCS_30 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '31') {
      inputParams.LGL_DOCS_31 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '32') {
      inputParams.LGL_DOCS_32 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '33') {
      inputParams.LGL_DOCS_33 = row.EVAL_YN
    }
    else if(row.DOC_SEQ === '34') {
      inputParams.LGL_DOCS_34 = row.EVAL_YN
    }	
  })

  grdSub2.value.getGridView().getJsonRows().forEach(row => {
    if(row.NO === '1') {
      inputParams.RISK_ASSM_RCGN_YN = row.EVAL_YN
    }
    else if(row.NO === '2') {
      inputParams.SFT_MNG_SYS_CRT_YN = row.EVAL_YN
    }
  })
}

/* 법적서류 평가반영 */
const evalLegalDocCalc  = () => {
  let sub1Score = 0

  grdSub1.value.getGridView().getJsonRows().forEach(row => {
    if(row.EVAL_YN === 'Y') {
      sub1Score = sub1Score + 0
    }else if(row.EVAL_YN === 'N'){
      sub1Score = sub1Score - 2
    }
  })
  
  if(sub1Score < -10) {
    sub1Score = -10
  }
  
  inputParams.LGL_DOCS = sub1Score
  inputParams.LGL_DOCS_CERTIFIED = inputParams.LGL_DOCS +  inputParams.CERTIFIED_EVAL
}

/* 인증평가 평가반영 */
const evalCertifiedClick  = () => {
  grdSub2.value.getGridView().getJsonRows().forEach(row => {
    if(row.NO === '1' && row.EVAL_YN === 'Y') {
      sub2Score1.value = 1.5
    }
    else if(row.NO === '1' && row.EVAL_YN === 'N') {
      sub2Score1.value = 0
    }
    else if(row.NO === '2' && row.EVAL_YN === 'Y') {
      sub2Score2.value = 0.5
    }
    else if(row.NO === '2' && row.EVAL_YN === 'N') {
      sub2Score2.value = 0
    }
  })

  inputParams.CERTIFIED_EVAL = sub2Score1.value + sub2Score2.value
  inputParams.LGL_DOCS_CERTIFIED = inputParams.LGL_DOCS +  inputParams.CERTIFIED_EVAL
}

/* 안전활동 파일 첨부 */
const addFileSafetyClick  = () => {
  fileUploadPopup_Safety.value.openPopup(inputParams.SFTY_ACTVT_FILE_ID)
}

/* 현장개선활동 파일 첨부 */
const addFileSiteClick  = () => {
  fileUploadPopup_Site.value.openPopup(inputParams.ONST_ACTV_FILE_ID)
}

// 자동 평점 계산
const onCellItemClicked1 = (grid, index, clickData) => {
  grid.commit()

  if(clickData.fieldName === 'EVAL_YN') {
    if(clickData.target.value === 'Y'){
      grdSub1.value.getDataProvider().setValue(clickData.dataRow, 'EVAL_YN', 'Y')
    }
    else if(clickData.target.value === 'N') {
      grdSub1.value.getDataProvider().setValue(clickData.dataRow, 'EVAL_YN', 'N')
    }
    else {
      grdSub1.value.getDataProvider().setValue(clickData.dataRow, 'EVAL_YN', 'U')
    }
    evalLegalDocCalc()
  }
}

const onCellItemClicked2 = (grid, index, col) => {
  grid.commit()

  let data = grdSub2.value.getDataProvider().getJsonRow(col.dataRow)

  console.log('[onCellItemClicked2] data : ',data)
  
  if(col.field === 2) {
    if(data.NO === '1') {
      fileUploadPopup_Risk.value.openPopup(data.FILE_ID)
    } 
    else if(data.NO === '2') {
      fileUploadPopup_ISO.value.openPopup(data.FILE_ID)
    }
  }
}

// 체크 시 자동 평점 계산
const onCellClicked2 = async (grid, clickData) => {

  if(isEmpty(clickData.dataRow)) return
  if(clickData.fieldName !== 'EVAL_YN') return

  let row = grdSub2.value.getDataProvider().getJsonRow(clickData.dataRow)

  console.log('[onCellClicked2] row : ', row)

  if(row.NO === '1' && row.EVAL_YN === 'Y') {
    sub2Score1.value = 1.5
  }
  else if(row.NO === '1' && row.EVAL_YN === 'N') {
    sub2Score1.value = 0
  }
  else if(row.NO === '2' && row.EVAL_YN === 'Y') {
    sub2Score2.value = 0.5
  }
  else if(row.NO === '2' && row.EVAL_YN === 'N') {
    sub2Score2.value = 0
  }

  inputParams.CERTIFIED_EVAL = sub2Score1.value + sub2Score2.value
  inputParams.LGL_DOCS_CERTIFIED = inputParams.LGL_DOCS +  inputParams.CERTIFIED_EVAL
}

// 파일 존재 확인
const checkFile = async (fileId, id) => {
  const fileParams = {
    CMPNY_DIV: inputParams.CMPNY_DIV,
    FILE_ID: fileId,
  }

  // 파일이 있는지 확인
  await commonSearchApi({ queryId : 'SAFIB0030_SEARCH_03', param: fileParams }).then( res => {
    if(res.ORESULT_CUR[0].CNT_FILE > 0) {
      if(id === 'SFTY_ACTVT') {
        fileSfty.value = true
      }
      else if(id === 'ONST_ACTV') {
        fileOnst.value = true
      }
    }
    else {
      if(id === 'SFTY_ACTVT') {
        fileSfty.value = false
      }
      else if(id === 'ONST_ACTV') {
        fileOnst.value = false
      }
    }
  })
}

// 파일 업로드 후 저장 
const uploaded_Safety = param => {
  console.log('upload after : ',param)
  console.log('param.fileId : ',param.fileId)

  if (param.fileId) {
    inputParams.SFTY_ACTVT_FILE_ID = param.fileId
    checkFile(param.fileId, 'SFTY_ACTVT')
  } else {
    inputParams.SFTY_ACTVT_FILE_ID = ''
  }
}

// 파일 업로드 후 저장 
const uploaded_site = param => {
  console.log('upload after : ',param)
  console.log('param.fileId : ',param.fileId)

  if (param.fileId) {
    inputParams.ONST_ACTV_FILE_ID = param.fileId
    checkFile(param.fileId, 'ONST_ACTV')
  } else {
    inputParams.ONST_ACTV_FILE_ID = ''
  }
}

// 파일 업로드 후 저장 
const uploaded_Risk = param => {

  // 파일 갯수 확인
  Promise.all([
    commonSearchApi({ queryId : 'DATCA0070_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv, FILE_ID: param.fileId } }), // 부서
  ]).then(res => {
    if (res[0].ORESULT_CUR[0].CNT_FILE > 0) {
      inputParams.RISK_ASSM_RCGN_FILE_ID = param.fileId
      inputParams.RISK_ASSM_RCGN_YN = 'Y'
      grdSub2.value.getDataProvider().setValue(0,'FILE_YN', '유')
      grdSub2.value.getDataProvider().setValue(0,'FILE_ID', param.fileId)
    } else {
      inputParams.RISK_ASSM_RCGN_FILE_ID = ''
      inputParams.RISK_ASSM_RCGN_YN = 'N'
      grdSub2.value.getDataProvider().setValue(0,'FILE_YN', '무')
      grdSub2.value.getDataProvider().setValue(0,'FILE_ID', '')
    }
  })
}

// 파일 업로드 후 저장 
const uploaded_ISO = param => {
  // 파일 갯수 확인
  Promise.all([
    commonSearchApi({ queryId : 'DATCA0070_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv, FILE_ID: param.fileId } }), // 부서
  ]).then(res => {
    if (res[0].ORESULT_CUR[0].CNT_FILE > 0) {
      inputParams.SFT_MNG_SYS_CRT_FILE_ID = param.fileId
      inputParams.RISK_ASSM_RCGN_YN = 'Y'
      grdSub2.value.getDataProvider().setValue(1,'FILE_YN', '유')
      grdSub2.value.getDataProvider().setValue(1,'FILE_ID', param.fileId)
    } else {
      inputParams.SFT_MNG_SYS_CRT_FILE_ID = ''
      inputParams.RISK_ASSM_RCGN_YN = 'N'
      grdSub2.value.getDataProvider().setValue(1,'FILE_YN', '무')
      grdSub2.value.getDataProvider().setValue(1,'FILE_ID', '')
    }
  })
}

const openDeptPopup = ()=>{
  let popupParam = {
    DISABLE:true,
    ASGN_NM: searchParams.COMP_NM,
  }

  deptPopUp.value.openPopup(popupParam)
}

const onDeptSelected = row =>{
  console.log('onDeptSelected : ', row)
  searchParams.BSNS_CD = row.BSNS_CD
  searchParams.ASGN_CD = row.DEPT_CD
  searchParams.COMP_CD = row.ASGN_CD
  searchParams.COMP_NM = row.ASGN_SHRT_NM

  onButtonsClick({ id :'btnSearch' })
}

const getQuarter  = date => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}

//법적서류 그리드에 라디오 버튼 표시
const EVAL_GBNCallback = (grid, model, field) => {
  let checkedY = ''
  let checkedN = ''
  let checkedU = ''

  if(model._index.value === 'Y'){
    checkedY = 'checked'
  } else if(model._index.value === 'N'){
    checkedN = 'checked'
  } else {
    checkedU = 'checked'
  }

  return "<input type='radio' " + "value='Y'" + "name=" + "'group" + model._index.dataRow + 'Y' + "' " + checkedY + " />" + 
    "<span style='padding: 0 10px 0 10px !important;'>Yes</span>" +
    "<input type='radio' " + "value='N'" + "name=" + "'group" + model._index.dataRow + 'Y' + "'" + checkedN + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>No</span>" +
    "<input type='radio' " + "value='U'" + "name=" + "'group" + model._index.dataRow + 'Y' + "'" + checkedU + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>해당없음</span>"
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IGridTitle
        ref="menuTitle" 
        :use-permission="false"
        :button-list="['btnSearch', 'btnUpdate', 'btnVendorConfirm', 'btnManual']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-sheet class="searchArea d-flex">
      <div class="d-flex justify-space-between align-center mb-3" style="width: 100%;">
        <div class="d-flex">
          <i-input
            v-model="searchParams.YEAR"
            :label="$t('년도')"
            label-width="50px"
            type="Number"
            width="150px"
            required
          />
          <i-select
            v-model="searchParams.QUARTER"
            :label="$t('분기')"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            :items="dtQuater"
            item-title="TXT"
            item-value="COD"
            width="200px"
            required
          />
          <i-input
            v-model="searchParams.COMP_NM" 
            :label="t('협력사')"
            width="280px"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            required
            @click:append-inner="openDeptPopup"
            @keydown.enter="openDeptPopup"
          />
        </div>
        <div style="color: red;">
          파일첨부 및 점수입력 후, 저장버튼만 누를 시 자체평가 미완료 상태로 유지되니 반드시 '협력사 확정' 버튼을 눌러 자체평가 완료해주시길 바랍니다.
        </div>
      </div>
      
    </v-sheet>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="d-flex mt-3">
          <i-select
            v-model="inputParams.SFTY_ACTVT"
            :label="$t('➀ 협력사 대표 안전활동 건수')"
            label-width="180px"
            append-inner-icon="mdi-magnify"
            :items="dtNumber"
            item-title="TXT"
            item-value="COD"
            width="280px"
          />
          <v-btn
            v-model="inputParams.SFTY_ACTVT_FILE_ID"
            class="mt-1"
            @click="addFileSafetyClick" 
          >
            첨부
          </v-btn>
          <div class="complete-file ml-2" v-if="fileSfty">
            첨부된 파일이 있습니다.
          </div>
        </v-sheet>
        <div class="formLabelText mt-3">
          ➁ 법적 서류 및 인증
        </div>
        <i-input
          v-model="inputParams.LGL_DOCS_CERTIFIED"
          :label="$t('총점')"
          label-width="60px"
          width="150px"
          class="mt-3"
          readonly
        />
        <div class="h-grow">
          <v-sheet 
            width="60%"
            class="pe-3"
          >
            <IGridTitle
              :title="$t('법적서류')"
            />
            <div class="d-flex mb-2">
              <i-input
                v-model="inputParams.LGL_DOCS"
                width="100px"
                readonly
              />
            </div>
            <RealGrid
              ref="grdSub1"
              :grid-view-option="grdSub1Props.gridViewOption"
              :keys="grdSub1Props.keys" 
              :fields="grdSub1Props.fields"
              :columns="grdSub1Props.columns"
              :column-layout="grdSub1Props.columnLayout"
              @on-cell-item-clicked="onCellItemClicked1"
            />
          </v-sheet>
          <v-sheet 
            width="40%"
            class="pa-0"
          >
            <IGridTitle 
              :title="$t('인증평가')"
            />
            <div class="d-flex mb-2">
              <i-input
                v-model="inputParams.CERTIFIED_EVAL"
                width="100px"
                readonly
              />
            </div>
            <RealGrid
              ref="grdSub2"
              :grid-view-option="grdSub2Props.gridViewOption"
              :keys="grdSub2Props.keys" 
              :fields="grdSub2Props.fields"
              :columns="grdSub2Props.columns"
              :column-layout="grdSub2Props.columnLayout"
              @on-cell-item-clicked="onCellItemClicked2"
              @on-cell-clicked="onCellClicked2"
            />
          </v-sheet> 
        </div>
        <v-sheet class="h-auto mt-3">
          <div class="d-flex">
            <i-select
              v-model="inputParams.ONST_ACTV"
              :label="$t('➂ 현장개선활동')"
              label-width="180px"
              append-inner-icon="mdi-magnify"
              :items="dtNumber2"
              item-title="TXT"
              item-value="COD"
              width="280px"
            />
            <v-btn
              v-model="inputParams.ONST_ACTV_FILE_ID"
              class="mt-1"
              @click="addFileSiteClick" 
            >
              첨부
            </v-btn>
            <div class="complete-file ml-2" v-if="fileOnst">
              첨부된 파일이 있습니다.
            </div>
          </div>
          <div
            v-if="isVisibleComment"
            class="formLabelText mt-1"
          >
            ④ 사업부 안전 comment
          </div>
          <div
            v-if="isVisibleComment"
            class="mt-2"
          >
            <v-textarea
              v-model="inputParams.SITE_COMMENT"
              dense
              outlined
            />
          </div>
        </v-sheet>
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
      <DeptPopup 
        ref="deptPopUp" 
        @selected="onDeptSelected"
      />
      <SendMailPopup ref="MailPopup" />
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
.complete-file {
  color: blue;
  display: flex;
  align-items: center;
}
</style>