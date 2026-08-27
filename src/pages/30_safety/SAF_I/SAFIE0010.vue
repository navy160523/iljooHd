<!--
  화면명 : 협력사 안전관리자 지원금 관리
  화면개요 : 협력사 안전관리자 지원금 관리 조회 저장 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IButtonList from '@/components/IButtonList.vue'
import SAFIE0010Tab02Pop01 from '@/pages/30_safety/SAF_I/SAFIE0010Tab02Pop01.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import SendMailPopup from '@/pages/30_safety/SAF_I/SAFIE0010Tab01Pop01.vue'
import { isEmpty } from '@/@core/utils'

defineOptions({
  name: '30_safety-SAF_I-SAFIE0010',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const tab01Title = ref(null)
const tab02Title = ref(null)
const tab03Title = ref(null)
const grdTab01Main = ref(null)
const grdTab02Main = ref(null)
const grdTab03Main = ref(null)
const grdTab03Sub = ref(null)
const tab = ref('tab1')
const searchAddParams = ref([])
const saveTab01Params2 = ref([])
const saveTab02Params2 = ref([])
const eSAFIE0010Tab02Pop01 = ref(null)
const approvalPopup = ref(null)
const saveParams = ref([])
const tab02Search = ref(false)
const MailPopup = ref(null)

let findIndex = 0
let deadline = ref(null)

const searchTab01Params = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YYYY: dayjs(new Date()).format('YYYY'), // 년도
})

const searchTab02Params = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_YYMM: dayjs(new Date()).format('YYYY-MM'), // 접수년월
  BSNS_CD: userStore.bsnsCd, // 사업부
  YYYY: dayjs(new Date()).format('YYYY'), // 년도
  MM: dayjs(new Date()).format('MM'), // 월
  STATUS: '01', // 진행상태
})

const searchTab03Params = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_YYMM: dayjs(new Date()).format('YYYY-MM'), // 마감기준일
  BSNS_CD: userStore.bsnsCd, // 사업부
  YYYY: dayjs(new Date()).format('YYYY'), // 년도
  MM: dayjs(new Date()).format('MM'), // 월
  CLOSE_WORKER_CNT: 0, // 지급인원
  CLOSE_COST: 0, // 총지금금액
  STATUS: '', // 진행상태
  CLOSE_YYYYMM: '', // 마감년월
})

const searchTab03SubParams = reactive({
  CMPNY_DIV: '',
  YYYY: '', // 년도
  MM: '', // 월
  BSNS_CD: '', // 사업부
  ASGN_CD: '', // 소속
})

const mailParams = reactive({
  EMAIL: [],
  SUBJECT: '',
  CONTENT: '',
})

const approvalSaveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YYYY: '',
  MM: '',
  BSNS_CD: '',
  STATUS: '02',
  APPROVE_ID: '',
})

//월별 신청기간 그리드
const grdTab01MainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  fields: [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    {
      fieldName: 'MM',
      dataType: 'text',
      header: { text: t('월') },
      editable: false,
    },
    {
      fieldName: 'FROM_DATE',
      dataType: 'text',
      header: { text: t('시작기간') },
      styleName: 'editable_column',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'TO_DATE',
      dataType: 'text',
      header: { text: t('종료기간') },
      styleName: 'editable_column',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      header: { text: t('비고') },
      styleName: 'left-column editable_column',
      editable: true,
    },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YYYY', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [],
})

// 지원금 접수 그리드 세팅
const grdTab02MainProps = reactive({
  gridViewOption: {
    header: { height: 60 },
    checkBar: { visible: true },
    stateBar: { visible: false },
  },
  fields: [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      header: { text: t('사업부') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'COMP_CD',
      dataType: 'text',
      header: { text: t('업체코드') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'REG_NO',
      dataType: 'text',
      header: { text: t('사업자등록번호') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'COMP_NM',
      dataType: 'text',
      header: { text: t('업체명') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'WORKER_CNT',
      dataType: 'text',
      header: { text: t('인원수') },
      styleName: 'right-column',
      editable: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('코드') },
      editable: false,
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('부서명') },
      styleName: 'left-column',
      editable: false,
    },
    { fieldName: 'EMP_NO', 
      dataType: 'text', 
      width: '80',
      header: { text: t('사번') },
      editable: false }, // 안전관리자 사번
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      header: { text: t('안전관리자') },
      editable: false,
    },
    {
      fieldName: 'CAREER',
      dataType: 'text',
      header: { text: t('경력범위') },
      editable: false,
    },
    {
      fieldName: 'PRIORITY',
      dataType: 'text',
      header: { text: t('지원금 우선순위') },
      width: '150',
      styleName: 'right-column editable_column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        textReadOnly: true,
        dropDownCount: 2,
        partialMatch: true,
        domainOnly: true,
        dropDownWhenClick: true,
      },
    },
    {
      fieldName: 'PAY_RATIO',
      dataType: 'text',
      header: { text: t('지급비중') },
      styleName: 'right-column',
      editable: false,
    },
    {
      fieldName: 'WORK_FROM_DT',
      dataType: 'text',
      header: { text: t('시작일') },
      styleName: 'editable_column',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'WORK_TO_DT',
      dataType: 'text',
      header: { text: t('종료일') },
      styleName: 'editable_column',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'REAL_WORK_DAYS',
      dataType: 'number',
      header: { text: t('실근무일수') },
      styleName: 'right-column editable_column',
      editable: true,
      numberFormat: '#,###',
      editor: { type: 'line', inputCharacters: '0-9', maxLength: 2 },
    },
    {
      fieldName: 'SUPPORT_FUND',
      dataType: 'number',
      header: { text: t('지원금(원)') },
      styleName: 'right-column editable_column',
      editable: true,
      numberFormat: '#,###',
      editor: { type: 'line', inputCharacters: '0-9', maxLength: 10 },
    },
    {
      fieldName: 'START_DATE',
      dataType: 'text',
      header: { text: t('선임일자') },
      editable: false,
    },
    {
      fieldName: 'RETI_TMP_DATE',
      dataType: 'text',
      header: { text: t('퇴사일자') },
      editable: false,
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      header: { text: t('비고') },
      styleName: 'left-column editable_column',
      editable: true,
    },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'GRADE', dataType: 'text', visible: false },
    { fieldName: 'CAREER_SUM', dataType: 'text', visible: false },
    { fieldName: 'CAREER_GBN', dataType: 'text', visible: false },
    { fieldName: 'CAREER_GBN_NM', dataType: 'text', visible: false },
    { fieldName: 'PAY_STANDARD', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
    { fieldName: 'MONEY', dataType: 'text', visible: false },
    { fieldName: 'GRADE_NM', dataType: 'text', visible: false }, //자격요건
    { fieldName: 'YYYY', dataType: 'text', visible: false },
    { fieldName: 'MM', dataType: 'text', visible: false },
    // { fieldName: 'AGE_OLD', dataType: 'text', visible: false },
    // { fieldName: 'AGE', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM',
    {
      name: 'H01',
      fieldName: 'H01',
      direction: 'horizontal',
      items: ['COMP_CD', 'REG_NO', 'COMP_NM'],
      header: {
        text: '사내협력사',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('사내협력사') },
      },
    },
    'WORKER_CNT',
    {
      name: 'H02',
      fieldName: 'H02',
      direction: 'horizontal',
      items: ['DEPT_CD', 'DEPT_NM'],
      header: {
        text: '부서',
        values: { headerText: t('부서') },
      },
    },
    'EMP_NO',
    'KOR_NM',
    {
      name: 'H03',
      fieldName: 'H03',
      direction: 'horizontal',
      items: ['GRADE', 'CAREER'],
      header: {
        text: '인센티브',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('인센티브') },
      },
    },
    'PRIORITY',
    'PAY_RATIO',
    {
      name: 'H04',
      fieldName: 'H04',
      direction: 'horizontal',
      items: ['WORK_FROM_DT', 'WORK_TO_DT'],
      header: {
        text: '근무기간',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('근무기간') },
      },
    },
    'MONEY',
    'REAL_WORK_DAYS',
    'SUPPORT_FUND',
    'START_DATE',
    'RETI_TMP_DATE',
    'REMARK',
  ],
})

//기성마감 그리드
const grdTab03MainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
    footer: { visible: true },
  },
  fields: [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      header: { text: t('사업부') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('부서') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('부서코드') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'COMP_NM',
      dataType: 'text',
      header: { text: t('협력사명') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'REG_NO',
      dataType: 'text',
      header: { text: t('사업자번호') },
      editable: false,
    },
    {
      fieldName: 'OWNER_NM',
      dataType: 'text',
      header: { text: t('대표자') },
      editable: false,
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      header: { text: t('계약종료') },
      editable: false,
      footer: { styleName: 'right-column', text: '합계 : ' },
    },
    {
      fieldName: 'CNT',
      dataType: 'number',
      header: { text: t('지급인원') },
      styleName: 'right-column',
      editable: false,
      numberFormat: '#,###',
      footer: { numberFormat: '#,###', expression: 'sum' },
    },
    {
      fieldName: 'SUPPORT_FUND',
      dataType: 'number',
      header: { text: t('금액') },
      styleName: 'right-column',
      editable: false,
      numberFormat: '#,###',
      footer: { numberFormat: '#,###', expression: 'sum' },
    },

    //비활성화
    { fieldName: 'CHK', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YYYY', dataType: 'text', visible: false },
    { fieldName: 'MM', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'CLOSE_WORKER_CNT', dataType: 'text', visible: false },
    { fieldName: 'CLOSE_COST', dataType: 'text', visible: false },
    { fieldName: 'USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [],
})

//기성마감 서브
const grdTab03SubProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
  },
  fields: [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      header: { text: t('사번') },
      editable: false,
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      header: { text: t('성명') },
      editable: false,
    },
    {
      fieldName: 'GRADE_NM',
      dataType: 'text',
      header: { text: t('자격요건') },
      editable: false,
    },
    {
      fieldName: 'CAREER_GBN',
      dataType: 'text',
      header: { text: t('경력범위') },
      editable: false,
    },
    {
      fieldName: 'PRIORITY',
      dataType: 'text',
      header: { text: t('지원금 우선순위') },
      styleName: 'right-column',
      editable: false,
    },
    {
      fieldName: 'PAY_RATIO',
      dataType: 'text',
      header: { text: t('지급비중') },
      styleName: 'right-column',
      editable: false,
    },
    {
      fieldName: 'WORK_FROM_DT',
      dataType: 'text',
      header: { text: t('시작일') },
      editable: false,
    },
    {
      fieldName: 'WORK_TO_DT',
      dataType: 'text',
      header: { text: t('종료일') },
      editable: false,
    },
    {
      fieldName: 'REAL_WORK_DAYS',
      dataType: 'text',
      header: { text: t('실근무일수') },
      styleName: 'right-column',
      editable: false,
    },
    {
      fieldName: 'SUPPORT_FUND',
      dataType: 'number',
      numberFormat: '#,###',
      header: { text: t('지원금(원)') },
      styleName: 'right-column',
      editable: false,
    },
    {
      fieldName: 'START_DATE',
      dataType: 'text',
      header: { text: t('선임일자') },
      editable: false,
    },
    {
      fieldName: 'END_DATE',
      dataType: 'text',
      header: { text: t('퇴사일자') },
      editable: false,
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      header: { text: t('비고') },
      styleName: 'left-column',
      editable: false,
    },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'YYYY', dataType: 'text', visible: false },
    { fieldName: 'MM', dataType: 'text', visible: false },
    { fieldName: 'GRADE', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    {
      name: 'H01',
      fieldName: 'H01',
      direction: 'horizontal',
      items: ['EMP_NO', 'KOR_NM'],
      header: {
        text: '안전관리자',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전관리자') },
      },
    },
    {
      name: 'H01',
      fieldName: 'H01',
      direction: 'horizontal',
      items: ['GRADE_NM', 'CAREER_GBN'],
      header: {
        text: '인센티브',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('인센티브') },
      },
    },
    'PRIORITY',
    'PAY_RATIO',
    {
      name: 'H01',
      fieldName: 'H01',
      direction: 'horizontal',
      items: ['WORK_FROM_DT', 'WORK_TO_DT'],
      header: {
        text: '근무기간',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('근무기간') },
      },
    },
    'REAL_WORK_DAYS',
    'SUPPORT_FUND',
    'START_DATE',
    'END_DATE',
    'REMARK',
  ],
})

// 그리드 세팅
grdTab01MainProps.columns = grdTab01MainProps.fields
grdTab02MainProps.columns = grdTab02MainProps.fields
grdTab03MainProps.columns = grdTab03MainProps.fields
grdTab03SubProps.columns = grdTab03SubProps.fields

const codeList = reactive({
  year: [], // 년도
  mnth: [], // 월
})

const codeList2 = reactive({
  year: [], // 년도
  mnth: [], // 월
  priority: [
    { TXT: '1', COD: '1' },
    { TXT: '2', COD: '2' },
  ], // 지원금 우선순위
  status: [], // 진행상태
})

const codeList3 = reactive({
  year: [], // 년도
  mnth: [], // 월
  priority: [
    { TXT: '1', COD: '1' },
    { TXT: '2', COD: '2' },
  ], // 지원금 우선순위
  status: [], // 지원금 접수 진행상태
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }), // 사업부
    // 지원금 접수 진행상태
    getCodeList(userStore.cmpnyDiv + 'ZH70020'), // 지원금 접수 진행상태
    // 현재시점 지원금 접수 진행상태
    commonSearchApi({
      queryId: 'SAFIE0010_TAB02_SEARCH_00',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: userStore.bsnsCd,
        YYYY: dayjs(new Date()).format('YYYY'),
        MM: dayjs(new Date()).format('MM'),
      },
    }),
    // 현재시점 지원금 기성마감 진행상태
    commonSearchApi({
      queryId: 'SAFIE0010_TAB03_SEARCH_00',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: userStore.bsnsCd,
        YYYY: dayjs(new Date()).format('YYYY'),
        MM: dayjs(new Date()).format('MM'),
      },
    }),
  ])
    .then((res) => {
      //console.log("레스 확인",res)

      // 사업부
      if (res[0].ORESULT_CUR.length != 0) {
        //console.log("userStore.bsnsCd : ",userStore.bsnsCd)
        // 지원금 접수
        codeList.bsnsCd = res[0].ORESULT_CUR
        codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
        findIndex = res[0].ORESULT_CUR.findIndex(
          (item) => item.BSNS_CD == userStore.bsnsCd
        )
        //console.log("findIndex : ",findIndex)
        if (findIndex < 0) {
          findIndex = 0
        }
        searchTab02Params.BSNS_CD = codeList.bsnsCd[findIndex].BSNS_CD

        // 기성마감
        codeList3.bsnsCd = res[0].ORESULT_CUR
        findIndex = res[0].ORESULT_CUR.findIndex(
          (item) => item.BSNS_CD == userStore.bsnsCd
        )
        if (findIndex < 0) {
          findIndex = 0
        }
        searchTab03Params.BSNS_CD = codeList3.bsnsCd[findIndex].BSNS_CD
      }

      // 지원금 접수 진행상태
      if (res[1].ORESULT_CUR.length != 0) {
        codeList2.status = res[1].ORESULT_CUR

        //현재시점 지원금 접수 진행상태
        let status = '01'
        if (res[2].ORESULT_CUR.length != 0) {
          status = res[2].ORESULT_CUR[0].STATUS
        }

        findIndex = res[1].ORESULT_CUR.findIndex((item) => item.COD == status)
        if (findIndex < 0) {
          findIndex = 0
        }
        searchTab02Params.STATUS = codeList2.status[findIndex].COD
      }

      // 기성마감 진행상태 값 저장
      if (res[3].ORESULT_CUR.length != 0) {
        searchTab03Params.STATUS = res[3].ORESULT_CUR[0].STATUS
        searchTab03Params.CLOSE_YYYYMM = res[3].ORESULT_CUR[0].CLOSE_YYYYMM
        searchTab03Params.CLOSE_WORKER_CNT = res[3].ORESULT_CUR1[0].WORKER_CNT
        searchTab03Params.CLOSE_COST = res[3].ORESULT_CUR1[0].SUPPORT_FUND
      }

      // 그리드 세팅
      // 지원금 우선순위 lookup set
      grdTab02Main.value.setBindingColumn(
        'PRIORITY',
        codeList2.priority,
        'COD',
        'TXT'
      )
    })
    .finally(() => {})
}

// 지원금 접수(탭2)
// 접수년월 바뀌면 진행상태 변경 및 버튼 세팅
watch(
  () => searchTab02Params.FROM_YYMM,
  async (newValue, oldValue) => {
    //  console.log('searchTab02Params.FROM_YYMM newValue : ', newValue)
    //  console.log('searchTab02Params.FROM_YYMM oldValue : ', oldValue)
    if (newValue !== oldValue) {
      // 년도 월 바인딩
      ;(searchTab02Params.YYYY = dayjs(searchTab02Params.FROM_YYMM).format(
        'YYYY'
      )), // 년도
        (searchTab02Params.MM = dayjs(searchTab02Params.FROM_YYMM).format(
          'MM'
        )), // 월
        // 그리드 초기화
        gridRefresh('grdTab02Main')

      // 월 데이터 바인딩
      await commonSearchApi({
        queryId: 'SAFIE0010_TAB02_SEARCH_00',
        param: {
          CMPNY_DIV: searchTab02Params.CMPNY_DIV,
          BSNS_CD: searchTab02Params.BSNS_CD,
          YYYY: searchTab02Params.YYYY,
          MM: searchTab02Params.MM,
        },
      }) // 월
        .then((res) => {
          //console.log('searchParams.MNTH : ', res)
          if (res.ORESULT_CUR.length != 0) {
            findIndex = codeList2.status.findIndex(
              (item) => item.COD == res.ORESULT_CUR[0].STATUS
            )
            if (findIndex < 0) {
              findIndex = 0
            }
            searchTab02Params.STATUS = res.ORESULT_CUR[findIndex].STATUS
          } else {
            // findIndex = codeList2.status.findIndex(item => item.COD == "01")
            // if(findIndex < 0){
            //     findIndex = 0
            // }
            searchTab02Params.STATUS = '01'
          }
        })
        .finally(() => {
          controllerSetting()
        })
    }
  }
)
// 지원금 접수(탭2)
// 사업부가 바뀌면 진행상태 변경 및 버튼 세팅
watch(
  () => searchTab02Params.BSNS_CD,
  async (newValue, oldValue) => {
    //  console.log('searchTab02Params.BSNS_CD newValue : ', newValue)
    //  console.log('searchTab02Params.BSNS_CD oldValue : ', oldValue)
    // console.log('searchTab02Params.BSNS_CD newValue : ', newValue)
    if (newValue !== oldValue) {
      // 년도 월 바인딩
      ;(searchTab02Params.YYYY = dayjs(searchTab02Params.FROM_YYMM).format(
        'YYYY'
      )), // 년도
        (searchTab02Params.MM = dayjs(searchTab02Params.FROM_YYMM).format(
          'MM'
        )), // 월
        // 그리드 초기화
        gridRefresh('grdTab02Main')

      // 사업부가 전체 일때는 조회 버튼만 활성화
      if (isNullCheck2(newValue)) {
        searchTab02Params.STATUS = '01'
        controllerSetting()
      } else {
        // 월 데이터 바인딩
        await commonSearchApi({
          queryId: 'SAFIE0010_TAB02_SEARCH_00',
          param: {
            CMPNY_DIV: searchTab02Params.CMPNY_DIV,
            BSNS_CD: searchTab02Params.BSNS_CD,
            YYYY: searchTab02Params.YYYY,
            MM: searchTab02Params.MM,
          },
        }) // 월
          .then((res) => {
            //console.log('searchParams.MNTH : ', res)
            if (res.ORESULT_CUR.length != 0) {
              findIndex = codeList2.status.findIndex(
                (item) => item.COD == res.ORESULT_CUR[0].STATUS
              )
              if (findIndex < 0) {
                findIndex = 0
              }
              //console.log("findIndex : ",findIndex)
              searchTab02Params.STATUS = res.ORESULT_CUR[findIndex].STATUS
            } else {
              // findIndex = codeList2.status.findIndex(item => item.COD == "01")
              // if(findIndex < 0){
              //     findIndex = 0
              // }
              //console.log("findIndex : ",findIndex)
              searchTab02Params.STATUS = '01'
            }
          })
          .finally(() => {
            controllerSetting()
          })
      }
    }
  }
)

// 지원금 기성마감(탭3)
// 마감년월 바뀌면 진행상태 변경 및 버튼 세팅
watch(
  () => searchTab03Params.FROM_YYMM,
  async (newValue, oldValue) => {
    //  console.log('searchTab03Params.FROM_YYMM newValue : ', newValue)
    //  console.log('searchTab03Params.FROM_YYMM oldValue : ', oldValue)
    if (newValue !== oldValue) {
      // 그리드 초기화
      gridRefresh('grdTab03Main')
      gridRefresh('grdTab03Sub')
      // 년도 월 바인딩
      ;(searchTab03Params.YYYY = dayjs(searchTab03Params.FROM_YYMM).format(
        'YYYY'
      )), // 년도
        (searchTab03Params.MM = dayjs(searchTab03Params.FROM_YYMM).format(
          'MM'
        )), // 월
        // 월 데이터 바인딩
        await commonSearchApi({
          queryId: 'SAFIE0010_TAB03_SEARCH_00',
          param: {
            CMPNY_DIV: searchTab03Params.CMPNY_DIV,
            BSNS_CD: searchTab03Params.BSNS_CD,
            YYYY: searchTab03Params.YYYY,
            MM: searchTab03Params.MM,
          },
        }) // 월
          .then((res) => {
            //console.log('searchParams.MNTH : ', res)
            if (res.ORESULT_CUR.length != 0) {
              searchTab03Params.STATUS = res.ORESULT_CUR[0].STATUS
              searchTab03Params.CLOSE_YYYYMM = res.ORESULT_CUR[0].CLOSE_YYYYMM
              searchTab03Params.CLOSE_WORKER_CNT =
                res.ORESULT_CUR1[0].WORKER_CNT
              searchTab03Params.CLOSE_COST = res.ORESULT_CUR1[0].SUPPORT_FUND
            } else {
              searchTab03Params.STATUS = ''
              searchTab03Params.CLOSE_YYYYMM = ''
              searchTab03Params.CLOSE_WORKER_CNT = ''
              searchTab03Params.CLOSE_COST = ''
            }
            //console.log('searchTab03Params : ', searchTab03Params)
          })
          .finally(() => {
            controllerSetting()
          })
    }
  }
)
// 지원금 접수(탭3)
// 사업부가 바뀌면 진행상태 변경 및 버튼 세팅
watch(
  () => searchTab03Params.BSNS_CD,
  async (newValue, oldValue) => {
    //  console.log('searchTab03Params.FROM_YYMM newValue : ', newValue)
    //  console.log('searchTab03Params.FROM_YYMM oldValue : ', oldValue)
    if (newValue !== oldValue) {
      // 그리드 초기화
      gridRefresh('grdTab03Main')
      gridRefresh('grdTab03Sub')
      // 년도 월 바인딩
      ;(searchTab03Params.YYYY = dayjs(searchTab03Params.FROM_YYMM).format(
        'YYYY'
      )), // 년도
        (searchTab03Params.MM = dayjs(searchTab03Params.FROM_YYMM).format(
          'MM'
        )), // 월
        // 월 데이터 바인딩
        await commonSearchApi({
          queryId: 'SAFIE0010_TAB03_SEARCH_00',
          param: {
            CMPNY_DIV: searchTab03Params.CMPNY_DIV,
            BSNS_CD: searchTab03Params.BSNS_CD,
            YYYY: searchTab03Params.YYYY,
            MM: searchTab03Params.MM,
          },
        }) // 월
          .then((res) => {
            //console.log('searchParams.MNTH : ', res)
            if (res.ORESULT_CUR.length != 0) {
              searchTab03Params.STATUS = res.ORESULT_CUR[0].STATUS
              searchTab03Params.CLOSE_YYYYMM = res.ORESULT_CUR[0].CLOSE_YYYYMM
              searchTab03Params.CLOSE_WORKER_CNT =
                res.ORESULT_CUR1[0].WORKER_CNT
              searchTab03Params.CLOSE_COST = res.ORESULT_CUR1[0].SUPPORT_FUND
            } else {
              searchTab03Params.STATUS = ''
              searchTab03Params.CLOSE_YYYYMM = ''
              searchTab03Params.CLOSE_WORKER_CNT = ''
              searchTab03Params.CLOSE_COST = ''
            }
            //console.log('searchTab03Params : ', searchTab03Params)
          })
          .finally(() => {
            controllerSetting()
          })
    }
  }
)

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    //조회
    if (tab.value === 'tab1') {
      // 월별 신청기간 관리
      new queryFlowHelper(vm, t)
        .setGridList([grdTab01Main])
        .setBefore(beforeSearch)
        .setQuery(searchTab01Data)
        .setAfter(afterTab01Search)
        .run()
    } else if (tab.value === 'tab2') {
      // 지원금 접수
      new queryFlowHelper(vm, t)
        .setGridList([grdTab02Main])
        .setBefore(beforeSearch)
        .setQuery(searchTab02Data)
        .setAfter(afterTab02Search)
        .run()
    } else if (tab.value === 'tab3') {
      // 지원금 기성마감
      new queryFlowHelper(vm, t)
        .setGridList([grdTab03Main])
        .setBefore(beforeSearch)
        .setQuery(searchTab03Data)
        .setAfter(afterTab03Search)
        .run()
    }
  } else if (btn.id === 'btnUpdate') {
    //저장
    if (tab.value === 'tab1') {
      // 월별 신청기간 관리
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTab01Main, row: null }])
        .setGridList([grdTab01Main])
        .setBefore(saveTab01Check)
        .setQuery(saveTab01Data)
        .setAfter(() => {
          onButtonsClick({ id: 'btnSearch' })
        })
        .run()
    } else if (tab.value === 'tab2') {
      // 지원금 접수 저장
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTab02Main, row: null }])
        .setGridList([grdTab02Main])
        .setBefore(saveTab02Check)
        .setQuery(saveTab02Data)
        .setAfter(() => {
          onButtonsClick({ id: 'btnSearch' })
        })
        .run()
    }
  } else if (btn.id === 'btnSendMail') {
    //메일발송
    if (tab.value === 'tab1') {
      let chekedRow = grdTab01Main.value.getGridView().getCheckedRows()
      
      if (grdTab01Main.value.getGridView().getItemCount() <= 0) {
        Message.warn(t('월별 신청기간관리 검색부터 하셔야 합니다.'))
        return false
      }
      if(chekedRow.length === 0) {
        return Message.warn(t('선택된 행이 없습니다.'))
      } else if(chekedRow.length >= 2) {
        return Message.warn(t('메일발송은 하나의 월만 선택하셔야 합니다.'))
      }
      const data = grdTab01Main.value.getDataProvider().getJsonRow(chekedRow[0])
      if(isEmpty(data.FROM_DATE)) {
        return Message.warn(t('시작기간이 빈값이 될 수 없습니다.'))
      } else if(isEmpty(data.TO_DATE)) {
        return Message.warn(t('종료기간이 빈값이 될 수 없습니다.'))
      }
    
      let mailForm = {  
        TO_EMP_NO: [],
        TO_EMP_NM: [],
        BSNS_CD: [],
        ASGN_CD: [],
        REG_DATE: [],
        START_DATE: data.FROM_DATE.replaceAll('-', ''),
        END_DATE: data.TO_DATE.replaceAll('-', '')
      }
      MailPopup.value.openPopup(mailForm)
      // new saveFlowHelper(vm, t)
      //   .setGridList([grdTab01Main])
      //   .setBefore(beforeSearchTab01Mail)
      //   .setQuery(searchTab01Data2)
      //   .setAfter(afterSearchTab01Mail)
      //   .setConfirmMessage('메일을 발송 하시겠습니까?')
      //   .run()
    }
  } else if (btn.id === 'btnDelete') {
    if (tab.value === 'tab1') {
      // 월별 신청기간 관리 삭제
      new deleteFlowHelper(vm, t)
        .setBefore(beforeTab01Delete)
        .setQuery(deleteTab01Data)
        .setAfter(() => {
          onButtonsClick({ id: 'btnSearch' })
        })
        .run()
    } else if (tab.value === 'tab2') {
      // 지원금 접수 삭제
      new deleteFlowHelper(vm, t)
        .setBefore(beforeTab02Delete)
        .setQuery(deleteTab02Data)
        .setAfter(() => {
          onButtonsClick({ id: 'btnSearch' })
        })
        .run()
    }
  } else if (btn.id === 'btnPersonCreate') {
    // 인원추가
    if (tab.value === 'tab2') {
      personPopup()
    }
  } else if (btn.id === 'btnSaveClose') {
    // 기성마감
    if (tab.value === 'tab3') {
      // 지원금 기성마감
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTab03Main, row: null }])
        .setGridList([grdTab03Main])
        .setBefore(saveTab03Check)
        .setQuery(saveTab03Data)
        .setAfter(afterTab03Data)
        .run()
    }
  } else if (btn.id === 'btnCancelClose') {
    // 기성취소
    if (tab.value === 'tab3') {
      // 지원금 기성마감 취소
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTab03Main, row: null }])
        .setGridList([grdTab03Main])
        .setBefore(saveTab03Check2)
        .setQuery(saveTab03Data2)
        .setAfter(afterTab03Data2)
        .setConfirmMessage(
          '마감취소 시 ' +
            searchTab03Params.FROM_YYMM +
            ' 마감 건 전체 취소됩니다. 진행하시겠습니까?'
        )
        .run()
    }
  } else if (btn.id === 'btnCloseHistory') {
    // 기성이력
    if (tab.value === 'tab3') {
      // 지원금 기성마감
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTab03Main, row: null }])
        .setGridList([grdTab03Main])
        .setBefore(saveTab03Check)
        .setQuery(saveTab03Data)
        .setAfter(() => {
          onButtonsClick({ id: 'btnSearch' })
        })
        .run()
    }
  } else if (btn.id === 'btnApply') {
    // 지원금 접수 결재
    if (tab.value === 'tab2') {
      // 지원금 접수 결재
      new saveFlowHelper(vm, t)
        .setBefore(beforeSaveTab02Apply)
        .setQuery(saveTab02ApplyData)
        .setAfter(afterSaveTab02Apply)
        .setConfirmMessage('결재를 진행 하시겠습니까?')
        .run()
    }
  }
}

// //그리드 초기화 이벤트
const gridRefresh = (val) => {
  if (val === 'grdTab01Main') {
    grdTab01Main.value.getDataProvider().setRows([])
  } else if (val === 'grdTab02Main') {
    grdTab02Main.value.getDataProvider().setRows([])
  } else if (val === 'grdTab03Main') {
    grdTab03Main.value.getDataProvider().setRows([])
  } else if (val === 'grdTab03Sub') {
    grdTab03Sub.value.getDataProvider().setRows([])
  }
}

//셀변경 이벤트 시작
const onCellEdited = (grid, itemIndex, row, field) => {
  let fieldName = grdTab02Main.value.getGridView().getColumn(field).name
  // 해당하는 로우 데이터 가져 오기
  let data = grdTab02Main.value.getDataProvider().getJsonRow(row)

  // 지원금 : 기본지원금 / 해당월일수 * 실근무일수 * 지급비중
  let MONEY = isNullCheck(data.MONEY) * 10000
  // 해당월을 마지낙 날
  let MONTH_DAY = dayjs(data.YYYY + '-' + data.MM + '-01').daysInMonth()
  // 실근무일수
  let REAL_WORK_DAYS = isNullCheck(data.REAL_WORK_DAYS)
  // 지원금 우선순위
  let PAY_STANDARD = data.PAY_STANDARD

  // console.log("MONEY :", MONEY)
  // console.log("MONTH_DAY :", MONTH_DAY)
  // console.log("REAL_WORK_DAYS :", REAL_WORK_DAYS)
  // console.log("PAY_STANDARD :", PAY_STANDARD)

  // 근무기간 시작일 / 종료일
  if (fieldName === 'WORK_FROM_DT' || fieldName === 'WORK_TO_DT') {
    // 실근무일수
    REAL_WORK_DAYS =
      dayjs(data.WORK_TO_DT).diff(dayjs(data.WORK_FROM_DT), 'day') + 1
    // 그리드에 추가
    grdTab02Main.value
      .getDataProvider()
      .setValue(row, 'REAL_WORK_DAYS', REAL_WORK_DAYS)

    if (!isNullCheck2(data.PAY_RATIO)) {
      // 근무일수 변경시 우선순위가 입력되어 있으면 지급금 계산
      if (data.PAY_RATIO === '100%') {
        grdTab02Main.value
          .getDataProvider()
          .setValue(row, 'SUPPORT_FUND', (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      } else if (data.PAY_RATIO === '50%') {
        grdTab02Main.value
          .getDataProvider()
          .setValue(
            row,
            'SUPPORT_FUND',
            (MONEY * REAL_WORK_DAYS) / (MONTH_DAY * 2)
          )
      }
    }
    // 그리드 내용 커밋
    grdTab02Main.value.getGridView().commit()
  } else if (fieldName === 'REAL_WORK_DAYS') {
    // 실근무 일수 변경시
    if (!isNullCheck2(data.PAY_RATIO)) {
      // 근무일수 변경시 우선순위가 입력되어 있으면 지급금 계산
      if (data.PAY_RATIO === '100%') {
        grdTab02Main.value
          .getDataProvider()
          .setValue(row, 'SUPPORT_FUND', (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      } else if (data.PAY_RATIO === '50%') {
        grdTab02Main.value
          .getDataProvider()
          .setValue(
            row,
            'SUPPORT_FUND',
            (MONEY * REAL_WORK_DAYS) / (MONTH_DAY * 2)
          )
      }
      // 그리드 내용 커밋
      grdTab02Main.value.getGridView().commit()
    }
  } else if (fieldName === 'PRIORITY') {
    // 지원금 우선순위 변경시
    // 지원금 우선순위
    let PRIORITY = data.PRIORITY

    // 1 ~ 49명 : 1명( 100% : 1명)
    if (PAY_STANDARD === 'A') {
      grdTab02Main.value.getDataProvider().setValue(row, 'PAY_RATIO', '100%')
      // 실근무일수가 0보다 클 때 지급금 계산
      if (REAL_WORK_DAYS > 0) {
        grdTab02Main.value
          .getDataProvider()
          .setValue(row, 'SUPPORT_FUND', (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      }
    } else if (PAY_STANDARD === 'B') {
      // 50 ~ 99명 : 2명(100% : 1명, 50% : 1명)
      // 협력사 재직인원수에 따라 지원금 우선순위로 비중 세팅
      if (PRIORITY === '1') {
        grdTab02Main.value.getDataProvider().setValue(row, 'PAY_RATIO', '100%')
      } else if (PRIORITY === '2') {
        grdTab02Main.value.getDataProvider().setValue(row, 'PAY_RATIO', '50%')
      }

      // 실근무일수가 0보다 클 때 지급금 계산
      if (REAL_WORK_DAYS > 0) {
        if (PRIORITY === '1') {
          grdTab02Main.value
            .getDataProvider()
            .setValue(row, 'SUPPORT_FUND', (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
        } else if (PRIORITY === '2') {
          grdTab02Main.value
            .getDataProvider()
            .setValue(
              row,
              'SUPPORT_FUND',
              (MONEY * REAL_WORK_DAYS) / (MONTH_DAY * 2)
            )
        }
      }
    } else if (PAY_STANDARD === 'C') {
      // 100 ~ : 2명 (100% : 2명)
      // 협력사 재직인원수에 따라 지원금 우선순위로 비중 세팅
      if (PRIORITY === '1') {
        grdTab02Main.value.getDataProvider().setValue(row, 'PAY_RATIO', '100%')
      } else if (PRIORITY === '2') {
        grdTab02Main.value.getDataProvider().setValue(row, 'PAY_RATIO', '100%')
      }

      // 실근무일수가 0보다 클 때 지급금 계산
      if (REAL_WORK_DAYS > 0) {
        grdTab02Main.value
          .getDataProvider()
          .setValue(row, 'SUPPORT_FUND', (MONEY * REAL_WORK_DAYS) / MONTH_DAY)
      }
    }
    // 그리드 내용 커밋
    grdTab02Main.value.getGridView().commit()
  }
}

//경력에 따른 행스타일 적용
const gridCellColorSetting = () => {
  grdTab02Main.value
    .getGridView()
    .setCellStyleCallback(function (grid, dataCell) {
      let ret = {
        style: {
          'background-color': undefined,
        },
      }
      //let AGE_OLD = grid.getValue(dataCell.index.itemIndex, "AGE_OLD")
      let CAREER_GBN = grid.getValue(dataCell.index.itemIndex, 'CAREER_GBN')
      //console.log("CAREER_GBN : ", CAREER_GBN)

      if (dataCell.dataColumn.fieldName === 'CAREER') {
        if (CAREER_GBN === 'A') {
          ret.style['background-color'] = '#90EE90'
        } else if (CAREER_GBN === 'B') {
          ret.style['background-color'] = '#FFA500'
        } else if (CAREER_GBN === 'C') {
          ret.style['background-color'] = '#FF0000'
        }
      }
      return ret
    })
}

// 협력사 안전관리자 인원검색 팝업 호출
const personPopup = (e) => {
  let popupParam = {
    CMPNY_DIV: searchTab02Params.CMPNY_DIV, // 구분
    YYYY: searchTab02Params.YYYY, // 년도
    MM: searchTab02Params.MM, //월
    BSNS_CD: searchTab02Params.BSNS_CD, //사업부
  }
  eSAFIE0010Tab02Pop01.value.openPopup(popupParam)
}
//협력사 안전관리자 팝업 데이터 선택 후
const personSelect = (val) => {
  if (!val) {
    return
  }
  if (tab.value === 'tab2') {
    grdTab02Main.value.getGridView().filterPanel.clearInput()
    for (let i = 0; i < val.length; i++) {
      let addRowData = null
      addRowData = {
        BSNS_NM: val[i].BSNS_NM, // 사업부
        COMP_CD: val[i].ASGN_CD, // 업체코드
        REG_NO: val[i].REG_NO, // 사업자등록번호
        COMP_NM: val[i].ASGN_NM, // 업체명
        WORKER_CNT: val[i].CNT, // 인원수
        DEPT_CD: val[i].DEPT_CD, // 코드
        DEPT_NM: val[i].DEPT_NM, // 부서명
        KOR_NM: val[i].KOR_NM, // 안전관리자
        GRADE_NM: val[i].GRADE_NM, // 자격요건명
        CAREER: val[i].CAREER, // 경력범위
        PRIORITY: '', // 지원금 우선순위
        PAY_RATIO: '', // 지급비중
        WORK_FROM_DT: val[i].WORK_FROM_DT, // 시작일
        WORK_TO_DT: val[i].WORK_TO_DT, // 종료일
        REAL_WORK_DAYS: val[i].REAL_WORK_DAYS, // 실근무일수
        MONEY: val[i].MONEY, // 지원금(원)
        START_DATE: val[i].START_DATE, // 선임일자
        RETI_TMP_DATE: val[i].RETI_TMP_DATE, // 퇴사일자
        REMARK: '', // 비고
        CMPNY_DIV: val[i].CMPNY_DIV,
        BSNS_CD: val[i].BSNS_CD,
        ASGN_CD: val[i].ASGN_CD,
        EMP_NO: val[i].EMP_NO, // 안전관리자 사번
        GRADE: val[i].GRADE,
        CAREER_SUM: val[i].CAREER_SUM,
        CAREER_GBN: val[i].CAREER_GBN,
        CAREER_GBN_NM: '',
        PAY_STANDARD: val[i].PAYMENT_CODE,
        STATUS: val[i].STATUS,
        SUPPORT_FUND: '',
        YYYY: val[i].YYYY,
        MM: val[i].MM,
      }
      //console.log("addRowData : ", addRowData)
      grdTab02Main.value.addRow(addRowData)
    }
    gridCellColorSetting()
  }
}

// 기성마감 목록 변경 이벤트
const rowChanged = async (grid, oldIdx, newIdx) => {
  if (newIdx === -1) {
    return
  }
  let rowData = await grdTab03Main.value.getDataProvider().getJsonRow(newIdx)
  searchTab03SubParams.CMPNY_DIV = rowData.CMPNY_DIV
  searchTab03SubParams.YYYY = rowData.YYYY
  searchTab03SubParams.MM = rowData.MM
  searchTab03SubParams.BSNS_CD = rowData.BSNS_CD
  searchTab03SubParams.ASGN_CD = rowData.ASGN_CD
  grdTab03SubSearch()
}

//기성마감 상세 목록
const grdTab03SubSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdTab03Sub])
    .setQuery(searchTab03Data2)
    .setAfter(afterTab03Search2)
    .run()
}

//널값체크후 숫자 리턴
const isNullCheck = (val) => {
  return val === undefined || val === null || val === '' ? 0 : Number(val)
}

//널값체크후 참 거짓 리턴
const isNullCheck2 = (val) => {
  return val === undefined || val === null || val === '' ? true : false
}

//콤마 추가
const isNullCheck3 = (val) => {
  return val === undefined || val === null || val === ''
    ? 0
    : val.toLocaleString('en-US')
}

// 지원금 접수의 진행 상태에 따라 버튼 활성화 및 비활성화
/* ******************* true: 비활성화 , false: 활성화 ******************** */
const controllerSetting = () => {
  // 지원금 접수(탭2)
  if (tab.value === 'tab2') {
    // 검토중일때
    if (searchTab02Params.STATUS === '01') {
      if (isNullCheck2(searchTab02Params.BSNS_CD)) {
        // 인원추가
        tab02Title.value.disableBtn('btnPersonCreate', true)
        // 저장
        tab02Title.value.disableBtn('btnUpdate', true)
        // 삭제
        tab02Title.value.disableBtn('btnDelete', true)
        // 결제
        tab02Title.value.disableBtn('btnApply', true)
      } else {
        // 인원추가
        tab02Title.value.disableBtn('btnPersonCreate', false)
        // 저장
        tab02Title.value.disableBtn('btnUpdate', false)
        // 삭제
        tab02Title.value.disableBtn('btnDelete', false)
        // 결제
        tab02Title.value.disableBtn('btnApply', false)
      }
    } else {
      // 결재중/승인완료/마감완료
      // 인원추가
      tab02Title.value.disableBtn('btnPersonCreate', true)
      // 저장
      tab02Title.value.disableBtn('btnUpdate', true)
      // 삭제
      tab02Title.value.disableBtn('btnDelete', true)
      // 결제
      tab02Title.value.disableBtn('btnApply', true)
    }
  } else if (tab.value === 'tab3') {
    if (isNullCheck2(searchTab03Params.CLOSE_YYYYMM)) {
      // 기성마감 처리 안했을때
      // 마감
      tab03Title.value.disableBtn('btnSaveClose', false)
      // 마감취소
      tab03Title.value.disableBtn('btnCancelClose', true)
      deadline.value = ''
    } else {
      // 기성마감 처리 한 경우
      // 마감
      tab03Title.value.disableBtn('btnSaveClose', true)
      // 마감취소
      tab03Title.value.disableBtn('btnCancelClose', false)
      deadline.value =
        '※' + searchTab03Params.CLOSE_YYYYMM + '은 이미 마감처리 된 월입니다.'
    }
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

// 메일발송전 유효성 검사
const beforeSearchTab01Mail = () => {
  // 월별 신청기간관리 조회후 동작.
  if (grdTab01Main.value.getGridView().getItemCount() <= 0) {
    Message.warn(t('월별 신청기간관리 검색부터 하셔야 합니다.'))
    return false
  }
  return true
}

// 결재전 유효성 검사
const beforeSaveTab02Apply = () => {
  let result = true
  // 지원금 접수 조회 이후.
  if (grdTab02Main.value.getGridView().getItemCount() <= 0) {
    Message.warn(t('조회 후 진행하십시오.'))
    result = false
  }
  for (let i = 0; i < grdTab02Main.value.getGridView().getItemCount(); i++) {
    if ('created' === grdTab02Main.value.getDataProvider().getRowState(i)) {
      result = false
      Message.warn(t('새로 추가한 인원이 있습니다. 저장후 결재 가능 합니다'))
      break
    }
  }
  // 단순히 인원추가만 한 경

  if (searchTab02Params.BSNS_CD === '') {
    Message.warn(t('사업부를 선택 후 결재 해주세요.'))
    result = false
  }

  return result
}

// 메일발송전 유효성 검사
const beforeSearch2 = () => {
  // 월별 신청기간관리 조회후 동작.
  if (grdTab01Main.value.getGridView().getItemCount() <= 0) {
    Message.warn(t('대상 검색부터 하셔야 합니다.'))
    return false
  }
  return true
}

// 월별 신청기간 관리 조회
const searchTab01Data = (idx) => {
  gridRefresh('grdTab01Main')
  //console.log('searchTab01Params : ',searchTab01Params)
  return commonSearchApi({
    queryId: 'SAFIE0010_TAB01_SEARCH_01',
    param: searchTab01Params,
  })
}

// 월별 신청기간 관리 협력사 안전관리자 조회
const searchTab01Data2 = (idx) => {
  //afterSearchTab01Mail()
  console.log('searchTab01Params : ',searchTab01Params)
  return commonSearchApi({
    queryId: 'SAFIE0010_TAB01_SEARCH_02',
    param: searchTab01Params,
  })
}

// 지원금 접수 조회
const searchTab02Data = (idx) => {
  gridRefresh('grdTab02Main')
  searchTab02Params.YYYY = dayjs(searchTab02Params.FROM_YYMM).format('YYYY')
  searchTab02Params.MM = dayjs(searchTab02Params.FROM_YYMM).format('MM')
  //console.log('searchTab02Params : ',searchTab02Params)
  return commonSearchApi({
    queryId: 'SAFIE0010_TAB02_SEARCH_01',
    param: searchTab02Params,
  })
}

// 지원금 접수 결재 조회
const saveTab02ApplyData = (idx) => {
  searchTab02Params.YYYY = dayjs(searchTab02Params.FROM_YYMM).format('YYYY')
  searchTab02Params.MM = dayjs(searchTab02Params.FROM_YYMM).format('MM')
  //console.log('saveTab02ApplyData searchTab02Params : ',searchTab02Params)
  return commonSearchApi({
    queryId: 'SAFIE0010_TAB02_SEARCH_02',
    param: searchTab02Params,
  })
}

// 지원금 기성마감 조회
const searchTab03Data = (idx) => {
  gridRefresh('grdTab03Main')
  searchTab03Params.YYYY = dayjs(searchTab03Params.FROM_YYMM).format('YYYY')
  searchTab03Params.MM = dayjs(searchTab03Params.FROM_YYMM).format('MM')
  //console.log('searchTab03Params : ',searchTab03Params)
  return commonSearchApi({
    queryId: 'SAFIE0010_TAB03_SEARCH_01',
    param: searchTab03Params,
  })
}

// 지원금 기성마감 상세 조회
const searchTab03Data2 = (idx) => {
  gridRefresh('grdTab03Sub')
  return commonSearchApi({
    queryId: 'SAFIE0010_TAB03_SEARCH_02',
    param: searchTab03SubParams,
  })
}

// 월별 신청기간 관리 검색
const afterTab01Search = (res) => {
  console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  if (res.ORESULT_CUR.length != 0) {
    grdTab01Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  }
}

// 월별 신청기간 관리 메일 발송을 위해 대상사 검색 후 메일 발송할 내용을 만들어서 메일 발송
const afterSearchTab01Mail = (res) => {
  if (res.ORESULT_CUR.length !== 0) {
    // 메일전송
    let mailToList = ref([]) // 받는사람
    let mgs = ref('') // 내용
    let mgs2 = ref('') // 그리드 내용

    // 받는 사람 세팅
    res.ORESULT_CUR.forEach((val) => {
      //console.log("val.EMAIL : ", val.EMAIL)
      mailToList.value.push(val.EMAIL)
    })

    // 그리드 전체 내용을 가져와서 표로 만듬
    let grdData = ref([]) // 그리드 데이터
    grdData = grdTab01Main.value.getDataProvider().getJsonRows()
    grdData.forEach((val) => {
      mgs2.value += '<tr>'
      mgs2.value += '  <td>' + val.MM + '</td>'
      mgs2.value += '  <td>' + val.FROM_DATE + '</td>'
      mgs2.value += '  <td>' + val.TO_DATE + '</td>'
      mgs2.value += '  <td>' + val.REMARK + '</td>'
      mgs2.value += '</tr>'
    })
    //console.log("여기 오냐333")

    // 메일 내용
    mgs.value += '<!doctype html>'
    mgs.value += ' <html>'
    mgs.value += '  <body>'
    mgs.value += "  <meta charset='utf-8'>"
    mgs.value += '<table>'
    mgs.value += '  <tr>'
    mgs.value += "    <th scope='col'>월</td>"
    mgs.value += "    <th scope='col'>시작기간</td>"
    mgs.value += "    <th scope='col'>종료기간</td>"
    mgs.value += "    <th scope='col'>비고</td>"
    mgs.value += '  </tr>'
    mgs.value += mgs2.value
    mgs.value += '</table>'
    mgs.value += '  </body>'
    mgs.value += '</html>'
    //console.log("여기 오냐44444")

    //console.log("msg : ", mgs.value)
    //console.log("mailToList : ", mailToList.value)

    mailParams.EMAIL = mailToList.value // 받는사람
    mailParams.SUBJECT = searchTab01Params.YYYY + '년 월별 신청기간' // 제목
    mailParams.CONTENT = mgs.value // 내용
    //console.log("여기 오냐?55555")
    //console.log("mailParams : ",mailParams)
    // 메일 전송
    commonSendApi(mailParams).then((res) => {
      Message.success(t('메일이 전송되었습니다.'))
    })
  }
}

// 지원금 접수 검색후
const afterTab02Search = (res) => {
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  grdTab02Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  gridCellColorSetting()
}

// 지원금 접수 결재 검색후
const afterSaveTab02Apply = (res) => {
  //console.log("여기 오니?????")
  //console.log('afterSaveTab02Apply  : ',res.ORESULT_CUR)
  if (res.ORESULT_CUR[0].length !== 0) {
    commonSearchApi({
      queryId: 'SAFIE0010_TAB02_SEARCH_01',
      param: searchTab02Params,
    }).then((res2) => {
      //console.log('afterSaveTab02Apply2 : ',res2.ORESULT_CUR)
      let sum = 0 // 합계
      let html =
        `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- saved from url=(0016)http://localhost -->
<html>
<head>
	<title>SAFIE0010</title>
	<meta HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=utf-8"/>
	<style type="text/css">
		.cs1AF9FBF2 {color:#000000;background-color:#DBEEF2;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs7C54C684 {color:#000000;background-color:#DBEEF2;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom-style: none;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.csF566004C {color:#000000;background-color:#DBEEF2;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right-style: none;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.csC3284BE4 {color:#000000;background-color:#DBEEF2;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right-style: none;border-bottom-style: none;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs97E81A6D {color:#000000;background-color:#FFFFFF;border-left-style: none;border-top-style: none;border-right-style: none;border-bottom-style: none;font-family:'맑은 고딕'; font-size:24px; font-weight:bold; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs87801710 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom-style: none;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;}
		.cs9C1CDFA0 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom-style: none;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs9654C92 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom-style: none;font-family:'맑은 고딕'; font-size:20px; font-weight:bold; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs1F334637 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right-style: none;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs52B6081D {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right-style: none;border-bottom-style: none;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs175130F1 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:11px; font-weight:normal; font-style:normal; padding-left:2px;}
		.csD2CA00FD {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;}
		.csA38F17BA {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:13px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs36AB1BD2 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right-style: none;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:11px; font-weight:normal; font-style:normal; padding-left:2px;}
		.cs3E3AF545 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right-style: none;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:11px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs79C0BB45 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right-style: none;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:13px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs66F3361B {color:#000000;background-color:transparent;border-left-style: none;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs761BF809 {color:#000000;background-color:transparent;border-left-style: none;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom-style: none;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.cs3646AC98 {color:#000000;background-color:transparent;border-left-style: none;border-top-style: none;border-right-style: none;border-bottom-style: none;font-family:'맑은 고딕'; font-size:12px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}
		.csF7D3565D {height:0px;width:0px;overflow:hidden;font-size:0px;line-height:0px;}
	</style>
</head>
<body leftMargin=10 topMargin=10 rightMargin=10 bottomMargin=10 style="background-color:#FFFFFF">
<table cellpadding="0" cellspacing="0" border="0" style="border-width:0px;empty-cells:show;width:769px;height:100%;position:relative;">
	<tr>
		<td style="width:0px;height:0px;"></td>
		<td style="height:0px;width:58px;"></td>
		<td style="height:0px;width:38px;"></td>
		<td style="height:0px;width:77px;"></td>
		<td style="height:0px;width:19px;"></td>
		<td style="height:0px;width:38px;"></td>
		<td style="height:0px;width:58px;"></td>
		<td style="height:0px;width:77px;"></td>
		<td style="height:0px;width:19px;"></td>
		<td style="height:0px;width:58px;"></td>
		<td style="height:0px;width:38px;"></td>
		<td style="height:0px;width:19px;"></td>
		<td style="height:0px;width:58px;"></td>
		<td style="height:0px;width:19px;"></td>
		<td style="height:0px;width:48px;"></td>
		<td style="height:0px;width:29px;"></td>
		<td style="height:0px;width:1px;"></td>
		<td style="height:0px;width:48px;"></td>
		<td style="height:0px;width:9px;"></td>
		<td style="height:0px;width:58px;"></td>
	</tr>
  <tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="cs97E81A6D" colspan="14" rowspan="3" style="width:620px;height:46px;line-height:33px;text-align:center;vertical-align:middle;"><nobr>○&nbsp;` +
        res.ORESULT_CUR[0].YYYY +
        `년&nbsp;` +
        res.ORESULT_CUR[0].MM +
        `월&nbsp;사내협력사&nbsp;안전관리자&nbsp;지원금&nbsp;현황</nobr></td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
  <tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td></td>
		<td></td>
    <td></td>
		<td></td>
		
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:2px;"></td>
		<td></td>
		<td></td>
    <td></td>
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="csC3284BE4" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>경력</nobr></td>
		<td class="csC3284BE4" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>1순위</nobr></td>
		<td class="csC3284BE4" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>2순위</nobr></td>
		<td class="csC3284BE4" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>3순위</nobr></td>
		<td class="csC3284BE4" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>총합계</nobr></td>
		<td class="cs7C54C684" colspan="3" style="width:90px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>Remark</nobr></td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>1년&nbsp;&nbsp;이하</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_1_1 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_1_2 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_1_3 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_1_T +
        `</nobr></td>
		<td class="cs87801710" colspan="3" rowspan="2" style="width:92px;height:43px;line-height:16px;text-align:left;vertical-align:middle;"><nobr>신규선임&nbsp;:&nbsp;` +
        res.ORESULT_CUR[0].LABEL_RE_N +
        `명</nobr></td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>1년&nbsp;~&nbsp;3년</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_2_1 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_2_2 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_2_3 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_2_T +
        `</nobr></td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>3년&nbsp;&nbsp;이상</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_3_1 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_3_2 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_3_3 +
        `</nobr></td>
		<td class="cs52B6081D" colspan="2" style="width:91px;height:21px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_3_T +
        `</nobr></td>
		<td class="csD2CA00FD" colspan="3" rowspan="2" style="width:92px;height:43px;line-height:16px;text-align:left;vertical-align:middle;"><nobr>해임&nbsp;:&nbsp;` +
        res.ORESULT_CUR[0].LABEL_RE_F +
        `명</nobr></td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="csF566004C" colspan="2" style="width:91px;height:20px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>총합계</nobr></td>
		<td class="csF566004C" colspan="2" style="width:91px;height:20px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_T_1 +
        `</nobr></td>
		<td class="csF566004C" colspan="2" style="width:91px;height:20px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_T_2 +
        `</nobr></td>
		<td class="csF566004C" colspan="2" style="width:91px;height:20px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_T_3 +
        `</nobr></td>
		<td class="csF566004C" colspan="2" style="width:91px;height:20px;line-height:16px;text-align:right;vertical-align:middle;"><nobr>` +
        res.ORESULT_CUR[0].LABEL_T_T +
        `</nobr></td>
		<td></td>
		<td></td>
		<td></td>
    <td></td>
		<td></td>
		
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:14px;"></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
  <tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td class="cs3646AC98" colspan="3" style="width:111px;height:22px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>` +
        res2.ORESULT_CUR[0].BSNS_NM +
        `</nobr></td> 
	</tr>
  <tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="csC3284BE4" colspan="3" style="width:168px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>사내&nbsp;협력사</nobr></td>
		<td class="csC3284BE4" colspan="4" style="width:187px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>부서</nobr></td>
		<td class="csF566004C" colspan="2" rowspan="2" style="width:72px;height:42px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>안전관리자</nobr></td>
		<td class="csC3284BE4" colspan="3" style="width:110px;height:21px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>인센티브</nobr></td>
		<td class="csF566004C" colspan="3" rowspan="2" style="width:91px;height:42px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>지원금(원)</nobr></td>
		<td class="cs1AF9FBF2" colspan="4" rowspan="2" style="width:110px;height:42px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>비고</nobr></td>
	</tr>
	<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="csF566004C" style="width:53px;height:20px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>업체코드</nobr></td>
		<td class="csF566004C" colspan="2" style="width:110px;height:20px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>업체명</nobr></td>
		<td class="csF566004C" colspan="2" style="width:52px;height:20px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>부서코드</nobr></td>
		<td class="csF566004C" colspan="2" style="width:130px;height:20px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>부서명</nobr></td>
		<td class="csF566004C" colspan="2" style="width:52px;height:20px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>자격요건</nobr></td>
		<td class="csF566004C" style="width:53px;height:20px;line-height:16px;text-align:center;vertical-align:middle;"><nobr>경력범위</nobr></td>
	</tr>
  `
      // 반독되어야할 내용
      for (let i = 0; i < res2.ORESULT_CUR.length; i++) {
        sum += isNullCheck(res2.ORESULT_CUR[i].SUPPORT_FUND)
        html +=
          `<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="cs3E3AF545" style="width:53px;height:21px;line-height:15px;text-align:center;vertical-align:middle;"><nobr>` +
          res2.ORESULT_CUR[i].ASGN_CD +
          `</nobr></td>
		<td class="cs36AB1BD2" colspan="2" style="width:112px;height:21px;line-height:15px;text-align:left;vertical-align:middle;"><nobr>` +
          res2.ORESULT_CUR[i].COMP_NM +
          `</nobr></td>
		<td class="cs3E3AF545" colspan="2" style="width:52px;height:21px;line-height:15px;text-align:center;vertical-align:middle;"><nobr>` +
          res2.ORESULT_CUR[i].DEPT_CD +
          `</nobr></td>
		<td class="cs36AB1BD2" colspan="2" style="width:132px;height:21px;line-height:15px;text-align:left;vertical-align:middle;"><nobr>` +
          res2.ORESULT_CUR[i].DEPT_NM +
          `</nobr></td>
		<td class="cs3E3AF545" colspan="2" style="width:72px;height:21px;line-height:15px;text-align:center;vertical-align:middle;"><nobr>` +
          res2.ORESULT_CUR[i].KOR_NM +
          `</nobr></td>
		<td class="cs3E3AF545" colspan="2" style="width:52px;height:21px;line-height:15px;text-align:center;vertical-align:middle;"><nobr>` +
          res2.ORESULT_CUR[i].GRADE_NM +
          `</nobr></td>
		<td class="cs3E3AF545" style="width:53px;height:21px;line-height:15px;text-align:center;vertical-align:middle;"><nobr>` +
          res2.ORESULT_CUR[i].CAREER_GBN_NM +
          `</nobr></td>
		<td class="cs3E3AF545" colspan="3" style="width:91px;height:21px;line-height:15px;text-align:right;vertical-align:middle;"><nobr>` +
          isNullCheck3(res2.ORESULT_CUR[i].SUPPORT_FUND) +
          `</nobr></td>
		<td class="cs175130F1" colspan="4" style="width:112px;height:21px;"><!--[if lte IE 7]><div class="csF7D3565D"></div><![endif]--></td>
	</tr>
    `
      }
      html +=
        `<tr style="vertical-align:top;">
		<td style="width:0px;height:22px;"></td>
		<td class="cs79C0BB45" colspan="12" style="width:552px;height:21px;line-height:17px;text-align:right;vertical-align:middle;"><nobr>계&nbsp;:</nobr></td>
		<td class="cs79C0BB45" colspan="3" style="width:91px;height:21px;line-height:17px;text-align:right;vertical-align:middle;"><nobr>` +
        isNullCheck3(sum) +
        `</nobr></td>
		<td class="csA38F17BA" colspan="4" style="width:110px;height:21px;"><!--[if lte IE 7]><div class="csF7D3565D"></div><![endif]--></td>
	</tr>
</table>
</body>
</html>`

      //console.log("html : ", html)
      // 결재 팝업창 호출
      approvalPopup.value.openPopup({
        CLSS_ID: 'SAFIE0010',
        TITLE: '협력사 안전관리자 지원금 관리 - 지원금 접수',
        CMPNY_DIV: userStore.cmpnyDiv,
        DATA_KEY:
          userStore.cmpnyDiv +
          ';' +
          searchTab03Params.BSNS_CD +
          ';' +
          searchTab03Params.YYYY +
          ';' +
          searchTab03Params.MM,
        REPORT: html, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
        MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
        FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
        CLRLINE: userStore.deptCd === 'N1H0'? 'CLR_16' : 'CLR_15', //결재라인 2025.04.03 특수선안전과는 직책과장 승인
        // PARAM424 : '',  //사고보고서용 결재라인no,사번
      })
    })
  }
}

/* ------------ 결재 후 결재ID 저장 ------------ */
const approvalAppkey = (appKey) => {
  //console.log('appKey : ', appKey)
  approvalSaveParams.YYYY = searchTab02Params.YYYY
  approvalSaveParams.MM = searchTab02Params.MM
  approvalSaveParams.BSNS_CD = searchTab02Params.BSNS_CD
  approvalSaveParams.APPROVE_ID = appKey

  //console.log("결재 후 결재ID 저장", approvalSaveParams)
  //return
  commonExecuteApi({
    queryId: 'SAFIE0010_TAB02_SAVE_02',
    list: [approvalSaveParams],
  }).then((res) => {
    //console.log('결재 후 결재ID res : ', res)
    if (res.result.status === '200') {
      commonSearchApi({
        queryId: 'SAFIE0010_TAB02_SEARCH_00',
        param: {
          CMPNY_DIV: searchTab02Params.CMPNY_DIV,
          BSNS_CD: searchTab02Params.BSNS_CD,
          YYYY: searchTab02Params.YYYY,
          MM: searchTab02Params.MM,
        },
      }) // 월
        .then((res) => {
          //console.log('searchParams.MNTH : ', res)
          if (res.ORESULT_CUR.length != 0) {
            findIndex = codeList2.status.findIndex(
              (item) => item.COD == res.ORESULT_CUR[0].STATUS
            )
            if (findIndex < 0) {
              findIndex = 0
            }
            searchTab02Params.STATUS = res.ORESULT_CUR[0].STATUS
          } else {
            findIndex = codeList2.status.findIndex((item) => item.COD == '01')
            if (findIndex < 0) {
              findIndex = 0
            }
            //console.log("findIndex : ",findIndex)
            searchTab02Params.STATUS = '01'
          }
        })
        .finally(() => {
          controllerSetting()
          onButtonsClick({ id: 'btnSearch' })
        })
    }
  })
}

// 지원금 기성마감 검색후
const afterTab03Search = (res) => {
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  grdTab03Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  gridCellColorSetting()
}

// 지원금 기성마감 상세 검색후
const afterTab03Search2 = (res) => {
  //console.log('지원금 기성마감 상세 : ',res.ORESULT_CUR)
  grdTab03Sub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/
// 월별 신청기간 관리 저장 전 유효성 검사
const saveTab01Check = () => {
  let result = true
  saveParams.value = []

  // 상태바가 체크된 항목
  let chekedRow = grdTab01Main.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    result = false
  } else {
    chekedRow.forEach((val) => {
      let data = grdTab01Main.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchTab01Params.CMPNY_DIV
      data.YYYY = searchTab01Params.YYYY
      data.FROM_DATE = data.FROM_DATE
        ? dayjs(data.FROM_DATE).format('YYYYMMDD')
        : null
      data.TO_DATE = data.TO_DATE
        ? dayjs(data.TO_DATE).format('YYYYMMDD')
        : null
      data.USER_ID = userStore.userId
      //console.log('data:',data)
      saveParams.value.push(data)
    })
  }
  // console.log('saveTab01Check saveParams.value:',saveParams.value)
  return result
}

// 지원금 접수 저장 전 유효성 검사
const saveTab02Check = () => {
  let result = true
  saveParams.value = []

  // 상태바가 체크된 항목
  let chekedRow = grdTab02Main.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    result = false
  } else {
    chekedRow.forEach((val) => {
      let data = grdTab02Main.value.getDataProvider().getJsonRow(val)
      data.USER_ID = userStore.userId
      saveParams.value.push(data)
    })
  }
  //console.log('saveTab02Check saveParams.value:',saveParams.value)
  return result
}

// 지원금 기성마감 전 유효성 검사
const saveTab03Check = () => {
  let result = true
  saveParams.value = []

  if (searchTab03Params.BSNS_CD === '') {
    Message.warn(t('사업부를 선택 후 마감해주세요.'))
    result = false
  }

  if (grdTab03Main.value.getGridView().getItemCount() <= 0) {
    Message.warn(t('마감대상이 없습니다.'))
    result = false
  }

  // 이미 마감된 월입니다
  if (!isNullCheck2) {
    Message.warn(t('이미 마감된 월입니다.'))
    result = false
  }

  // 저장할 항목
  let grdMainData = ref([]) // 그리드 데이터
  for (let i = 0; i < grdTab03Main.value.getGridView().getItemCount(); i++) {
    grdMainData = grdTab03Main.value.getDataProvider().getJsonRow(i)
    grdMainData.CLOSE_WORKER_CNT = searchTab03Params.CLOSE_WORKER_CNT
    grdMainData.CLOSE_COST = searchTab03Params.CLOSE_COST
    grdMainData.USER_ID = userStore.userId

    saveParams.value.push(grdMainData)
  }
  //console.log('saveTab03Check saveParams.value:',saveParams.value)
  return result
}

// 지원금 기성마감 취소 전 유효성 검사
const saveTab03Check2 = () => {
  let result = true
  saveParams.value = []

  if (searchTab03Params.BSNS_CD === '') {
    Message.warn(t('사업부를 선택 후 마감취소 해주세요.'))
    result = false
  }

  if (grdTab03Main.value.getGridView().getItemCount() <= 0) {
    Message.warn(t('마감취소 대상이 없습니다.'))
    result = false
  }

  // 저장할 항목
  let grdMainData = ref([]) // 그리드 데이터
  for (let i = 0; i < grdTab03Main.value.getGridView().getItemCount(); i++) {
    grdMainData = grdTab03Main.value.getDataProvider().getJsonRow(i)
    grdMainData.USER_ID = userStore.userId
    saveParams.value.push(grdMainData)
  }
  //console.log('saveTab03Check2 saveParams.value:',saveParams.value)
  return result
}

// 월별 신청기간 관리 저장
const saveTab01Data = () => {
  //console.log("여기 오냐??? 월별 신청기간 관리 저장", saveParams.value)
  //return
  return commonExecuteApi({
    queryId: 'SAFIE0010_TAB01_SAVE_01',
    list: saveParams.value,
  })
}

// 지원금 접수 저장
const saveTab02Data = () => {
  console.log('지원금 접수 저장', saveParams.value)
  //return
  return commonExecuteApi({
    queryId: 'SAFIE0010_TAB02_SAVE_01',
    list: saveParams.value,
  })
}

// 지원금 기성마감 저장
const saveTab03Data = () => {
  //console.log("지원금 기성마감 저장", saveParams.value)
  //return
  return commonExecuteApi({
    queryId: 'SAFIE0010_TAB03_SAVE_01',
    list: saveParams.value,
  })
}

// 지원금 기성마감취소 저장
const saveTab03Data2 = () => {
  //console.log("지원금 기성마감 취소 저장", saveParams.value)
  //return
  return commonExecuteApi({
    queryId: 'SAFIE0010_TAB03_DELETE_01',
    list: saveParams.value,
  })
}

// 지원금 기성마감 이후 // 진행상태 다시 검색 이후 메인 그리드/서브 그리드 초기화 후 검색
const afterTab03Data = async (res) => {
  //console.log("res : ", res)
  await commonSearchApi({
    queryId: 'SAFIE0010_TAB03_SEARCH_00',
    param: {
      CMPNY_DIV: searchTab03Params.CMPNY_DIV,
      BSNS_CD: searchTab03Params.BSNS_CD,
      YYYY: searchTab03Params.YYYY,
      MM: searchTab03Params.MM,
    },
  })
    .then((res) => {
      //console.log('searchParams.MNTH : ', res)
      if (res.ORESULT_CUR.length != 0) {
        searchTab03Params.STATUS = res.ORESULT_CUR[0].STATUS
        searchTab03Params.CLOSE_YYYYMM = res.ORESULT_CUR[0].CLOSE_YYYYMM
        searchTab03Params.CLOSE_WORKER_CNT = res.ORESULT_CUR1[0].WORKER_CNT
        searchTab03Params.CLOSE_COST = res.ORESULT_CUR1[0].SUPPORT_FUND
      }
      //console.log('afterTab03Data searchTab03Params : ', searchTab03Params)
    })
    .finally(() => {
      gridRefresh('grdTab03Sub')
      controllerSetting()
      onButtonsClick({ id: 'btnSearch' })
    })
}

// 지원금 기성마감 이후 // 진행상태 다시 검색 이후 메인 그리드/서브 그리드 초기화 후 검색
const afterTab03Data2 = async (res) => {
  //console.log("res : ", res)
  await commonSearchApi({
    queryId: 'SAFIE0010_TAB03_SEARCH_00',
    param: {
      CMPNY_DIV: searchTab03Params.CMPNY_DIV,
      BSNS_CD: searchTab03Params.BSNS_CD,
      YYYY: searchTab03Params.YYYY,
      MM: searchTab03Params.MM,
    },
  })
    .then((res) => {
      //console.log('searchParams.MNTH : ', res)
      if (res.ORESULT_CUR.length != 0) {
        searchTab03Params.STATUS = res.ORESULT_CUR[0].STATUS
        searchTab03Params.CLOSE_YYYYMM = res.ORESULT_CUR[0].CLOSE_YYYYMM
        searchTab03Params.CLOSE_WORKER_CNT = res.ORESULT_CUR1[0].WORKER_CNT
        searchTab03Params.CLOSE_COST = res.ORESULT_CUR1[0].SUPPORT_FUND
      }
      //console.log('afterTab03Data2 searchTab03Params : ', searchTab03Params)
    })
    .finally(() => {
      gridRefresh('grdTab03Sub')
      controllerSetting()
      onButtonsClick({ id: 'btnSearch' })
    })
}

//*****************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역*************************************************************//

// 삭제 하기 유효성 검사
const beforeTab01Delete = () => {
  let result = true
  let chekedRow = grdTab01Main.value.getGridView().getCheckedRows()
  saveParams.value = []

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    result = false
  } else {
    chekedRow.forEach((val) => {
      let data = grdTab01Main.value.getDataProvider().getJsonRow(val)
      data.USER_ID = userStore.userId
      //console.log('data:',data)
      saveParams.value.push(data)
    })
  }
  // console.log('beforeTab01Delete saveParams.value:',saveParams.value)
  return result
}

// 지원금 접수 삭제 하기 유효성 검사
const beforeTab02Delete = () => {
  let result = true
  let chekedRow = grdTab02Main.value.getGridView().getCheckedRows()
  saveParams.value = []

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    result = false
  } else {
    chekedRow.forEach((val) => {
      let data = grdTab02Main.value.getDataProvider().getJsonRow(val)
      saveParams.value.push(data)
    })
  }
  // console.log('beforeTab01Delete saveParams.value:',saveParams.value)
  return result
}

// 월별 신청기간 관리 삭제
const deleteTab01Data = () => {
  //return
  return commonExecuteApi({
    queryId: 'SAFIE0010_TAB01_DELETE_01',
    list: saveParams.value,
  })
}

// 지원금 지원 관리 삭제
const deleteTab02Data = () => {
  //console.log("지원금 지원 관리 삭제", saveParams.value)
  //return
  return commonExecuteApi({
    queryId: 'SAFIE0010_TAB02_DELETE_01',
    list: saveParams.value,
  })
}

// 삭제 이후

//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  initCodeList()
  controllerSetting()
  //onButtonsClick({ id:'btnSearch' })
  // grdMainSearch()
  // onButtonsClick()

  grdTab01Main.value.getGridView().filterPanel.visible = true
  grdTab02Main.value.getGridView().filterPanel.visible = true
  grdTab03Main.value.getGridView().filterPanel.visible = true
  grdTab03Sub.value.getGridView().filterPanel.visible = true
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle ref="menuTitle" :title="$t(useLogsStore().menuId)" />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <v-tabs v-model="tab">
            <v-tab value="tab1">월별 신청기간 관리</v-tab>
            <v-tab value="tab2">지원금 접수</v-tab>
            <v-tab value="tab3">기성마감</v-tab>
          </v-tabs>
        </v-sheet>
        <v-sheet v-show="tab == 'tab1'" class="h-auto">
          <v-card-title class="pa-3 pb-0">
            <!-- 타이틀 영역 
              타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
            <IGridTitle
              ref="tab01Title"
              :button-list="[
                'btnSendMail',
                'btnSearch',
                'btnUpdate',
                'btnDelete',
              ]"
              @click-button="onButtonsClick"
            />
          </v-card-title>
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('년도')"
              width="130px"
              v-model="searchTab01Params.YYYY"
              type="YEAR"
              item-value="COD"
              item-title="TXT"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
          </v-sheet>
          <!-- 메인그리드 -->
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdTab01Main"
              :grid-view-option="grdTab01MainProps.gridViewOption"
              :fields="grdTab01MainProps.fields"
              :columns="grdTab01MainProps.columns"
              :column-layout="grdTab01MainProps.columnLayout"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </v-sheet>
        <v-sheet v-show="tab == 'tab2'" class="h-auto">
          <v-card-title class="pa-3 pb-0">
            <!-- 타이틀 영역 
              타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
            <IGridTitle
              ref="tab02Title"
              :button-list="[
                'btnSearch',
                'btnPersonCreate',
                'btnUpdate',
                'btnDelete',
                'btnApply',
              ]"
              :use-permission="false"
              @click-button="onButtonsClick"
            />
          </v-card-title>
          <v-sheet class="searchArea d-flex">
            <i-input
              v-model="searchTab02Params.FROM_YYMM"
              :label="$t('접수년월')"
              type="month"
              width="200px"
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              v-model="searchTab02Params.BSNS_CD"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('진행상태')"
              width="200px"
              v-model="searchTab02Params.STATUS"
              :items="codeList2.status"
              item-value="COD"
              item-title="TXT"
              readonly
            />
          </v-sheet>
          <!-- 메인그리드 -->
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdTab02Main"
              :grid-view-option="grdTab02MainProps.gridViewOption"
              :fields="grdTab02MainProps.fields"
              :columns="grdTab02MainProps.columns"
              :column-layout="grdTab02MainProps.columnLayout"
              @onCellEdited="onCellEdited"
            />
          </v-sheet>
        </v-sheet>
        <v-sheet v-show="tab == 'tab3'" class="h-auto">
          <v-card-title class="pa-3 pb-0">
            <!-- 타이틀 영역 
              타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
            <IGridTitle
              ref="tab03Title"
              :button-list="['btnSearch', 'btnSaveClose', 'btnCancelClose']"
              @click-button="onButtonsClick"
            />
          </v-card-title>
          <v-sheet class="searchArea d-flex">
            <i-input
              v-model="searchTab03Params.FROM_YYMM"
              :label="$t('마감년월')"
              type="month"
              width="200px"
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              v-model="searchTab03Params.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <v-sheet class="d-flex justify-end align-center slotText">
              {{ deadline }}
            </v-sheet>
          </v-sheet>
          <!-- 메인그리드 -->
          <v-sheet height="50%" class="mb-2">
            <RealGrid
              ref="grdTab03Main"
              :grid-view-option="grdTab03MainProps.gridViewOption"
              :fields="grdTab03MainProps.fields"
              :columns="grdTab03MainProps.columns"
              :column-layout="grdTab03MainProps.columnLayout"
              @onCurrentRowChanged="rowChanged"
            />
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdTab03Sub"
              :grid-view-option="grdTab03SubProps.gridViewOption"
              :fields="grdTab03SubProps.fields"
              :columns="grdTab03SubProps.columns"
              :column-layout="grdTab03SubProps.columnLayout"
            />
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- 협력사 안전관리자 인원검색 팝업 -->
  <SAFIE0010Tab02Pop01 ref="eSAFIE0010Tab02Pop01" @onSelect="personSelect" />
  <!-- 결재 -->
  <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
  <SendMailPopup ref="MailPopup" />
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
    min-height: 300px;
  }
}
</style>
