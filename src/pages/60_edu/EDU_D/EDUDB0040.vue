<!--
  화면명 : 안전페이 지급중단
  화면개요 : 안전페이 지급중단 조회 추가 저장 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch, nextTick } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IButtonList from '@/components/IButtonList.vue'
import EDUDB0040Unknown from '@/pages/60_edu/EDU_D/EDUDB0040Unknown.vue'

import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_D-EDUDB0040',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdTab01Main = ref(null)
const grdTab02Main = ref(null)
const grdTab03Main = ref(null)
//const searchArea = ref(null)
//const dialog = ref(false)
//const MainGrd = ref(null)
const tab = ref('one')
//const periodDltVisibleYn = ref(true)
const empPopup = ref(null)
const saveParams= ref([])
// const bGrd1Columninit = ref(false)
// const bGrd2Columninit = ref(false)
// const bGrd3Columninit = ref(false)
const eDUDB0040Unknown = ref(null)


const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  BSNS_CD : '',              //사업부
  DEPT_CD : '',              //부서코드
  ASGN_CD : '',             //협력사
  ORGN_DIV : '',             //소속구분 (A : 직영, B : 협력사)
  PAYMENT_STOP_TYPE : 'A', // 지급중단타입 (A : 개인, B : 조직)
  PAYMENT_STOP_CD : '', // 지급중단구분
  PAYMENT_YN : '', // 지급중단여부
  PAYMENT_STOP_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), // 지급중단 등록 기간 시작  
  PAYMENT_STOP_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급중단 등록 기간 끝
  EMP_NO : '', // 사번
  EMP_NAME : '', //성명
})

const searchParams2 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  BSNS_CD : '',              //사업부
  DEPT_CD : '',              //부서코드
  ASGN_CD : '',             //협력사
  ORGN_DIV : '',             //소속구분 (A : 직영, B : 협력사)
  PAYMENT_YN : '', // 지급중단여부
  PAYMENT_STOP_TYPE : 'B', // 지급중단타입 (A : 개인, B : 조직)
  PAYMENT_STOP_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), // 지급중단 등록 기간 시작  
  PAYMENT_STOP_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급중단 등록 기간 끝
})

const searchParams3 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  BSNS_CD : '',              //사업부
  DEPT_CD : '',              //부서코드
  ASGN_CD : '',             //협력사
  ORGN_DIV : '',             //소속구분 (A : 직영, B : 협력사)
  PAYMENT_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), // 지급일 기간 시작  
  PAYMENT_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급일 기간 끝
  PAYMENT_CONFIRM_YN : '', // 지급확정여부
  RECOVERY_CONFIRM_YN : '', // 회수확정여부
  EMP_NO : '', // 사번
  EMP_NAME : '', //성명
})

const batchParams1 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'), // 년도
  MNTH : dayjs(new Date).format('MM'), // 월
  BSNS_CD : '',              //사업부
  DEPT_CD : '',              //부서코드
  ORGN_DIV : '',       //소속구분 ('' : 전체, A : 직영, B : 협력사)
  ASGN_CD : '',             //협력사
  PAYMENT_YN : 'Y', // 지급중단여부
  PAYMENT_STOP_TYPE : 'B', // 지급중단타입 (A : 개인, B : 조직)
  PAYMENT_STOP_CD : '', // 지급중단 구분 (HHIC40)
  PAYMENT_STOP_DETAIL_CD : '', // 지급중단 상세 (HHIC50)
  PAYMENT_STOP_FROM : dayjs(new Date()).format('YYYY-MM-DD'), // 지급중단 등록 기간 시작  
  PAYMENT_STOP_TO : dayjs(new Date().setDate(new Date().getDate() + 30)).format('YYYY-MM-DD'), // 지급중단 등록 기간 끝
  INSERT_USER_ID : userStore.userId, //등록자
  INSERT_USER_ID_IP : userStore.clientIp, //등록자 IP
})


//개인
const grdTab01MainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_COMP_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false },
    { fieldName: 'ASGN_NAME', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false },
    { fieldName: 'EMP_NAME', dataType: 'text', header: { text: t('성명') },  editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'PAYMENT_STOP_CD', dataType: 'text', header: { text: t('지급중단 구분'), styleName: 'header_validit'  }, styleName: 'editable_column', lookupDisplay: true, 
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'PAYMENT_STOP_DETAIL_CD', dataType: 'text', header: { text: t('지급중단 상세'), styleName: 'header_validit'  }, styleName: 'editable_column', lookupDisplay: true, 
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'PAYMENT_STOP_INSERT_DATE', dataType: 'text', header: { text: t('등록일시') }, editable: false },
    { fieldName: 'PAYMENT_STOP_FROM', dataType: 'text', header: { text: t('지급중단 시작일'), styleName: 'header_validit'  }, styleName: 'editable_column', datetimeFormat: "yyyy-MM-dd", editButtonVisibility: "always",
      editor: { type: "date", datetimeFormat: "yyyy-MM-dd"}, },
    { fieldName: 'PAYMENT_STOP_TO', dataType: 'text', header: { text: t('지급중단 종료일'), styleName: 'header_validit'  }, styleName: 'editable_column', datetimeFormat: "yyyy-MM-dd", editButtonVisibility: "always",
      editor: { type: "date", datetimeFormat: "yyyy-MM-dd"}, },
    { fieldName: 'PAYMENT_YN', dataType: 'text', header: { text: t('지급중단 여부'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true, 
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'MNTH', dataType: 'text', header: { text: t('MNTH') }, editable: false, visible: false },
    { fieldName: 'PAYMENT_STOP_SEQ', dataType: 'text', header: { text: t('PAYMENT_STOP_SEQ') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, editable: false, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, editable: false, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, editable: false, visible: false },
    { fieldName: 'ORGN_DIV', dataType: 'text', header: { text: t('ORGN_DIV') }, editable: false, visible: false },
    { fieldName: 'PAYMENT_STOP_TYPE', dataType: 'text', header: { text: t('PAYMENT_STOP_TYPE') }, editable: false, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, editable: false, visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('INSERT_USER_ID') }, editable: false, visible: false },
    { fieldName: 'INSERT_USER_IP', dataType: 'text', header: { text: t('INSERT_USER_ID_IP') }, editable: false, visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('UPDATE_USER_ID') }, editable: false, visible: false },
    { fieldName: 'UPDATE_USER_IP', dataType: 'text', header: { text: t('UPDATE_USER_IP') }, editable: false, visible: false },
    { fieldName: 'PAYMENT_YN_ORG', dataType: 'text', header: { text: t('PAYMENT_YN_ORG') }, editable: false, visible: false },
  ],
  columns: [],
})

//조직
const grdTab02MainProps  = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_COMP_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false },
    { fieldName: 'ASGN_NAME', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false },
    { fieldName: 'EMP_NAME', dataType: 'text', header: { text: t('성명') },  editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'PAYMENT_STOP_CD', dataType: 'text', header: { text: t('지급중단 구분'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true, 
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'PAYMENT_STOP_DETAIL_CD', dataType: 'text', header: { text: t('지급중단 상세'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true, 
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'PAYMENT_STOP_INSERT_DATE', dataType: 'text', header: { text: t('등록일시') }, editable: false },
    { fieldName: 'PAYMENT_STOP_FROM', dataType: 'text', header: { text: t('지급중단 시작일'), styleName: 'header_validit' }, styleName: 'editable_column', datetimeFormat: "yyyy-MM-dd", editButtonVisibility: "always",
      editor: { type: "date", datetimeFormat: "yyyy-MM-dd"}, },
    { fieldName: 'PAYMENT_STOP_TO', dataType: 'text', header: { text: t('지급중단 종료일'), styleName: 'header_validit' }, styleName: 'editable_column', datetimeFormat: "yyyy-MM-dd", editButtonVisibility: "always",
      editor: { type: "date", datetimeFormat: "yyyy-MM-dd"}, },
    { fieldName: 'PAYMENT_YN', dataType: 'text', header: { text: t('지급중단 여부'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true, 
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'MNTH', dataType: 'text', header: { text: t('MNTH') }, editable: false, visible: false },
    { fieldName: 'PAYMENT_STOP_SEQ', dataType: 'text', header: { text: t('PAYMENT_STOP_SEQ') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, editable: false, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, editable: false, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, editable: false, visible: false },
    { fieldName: 'ORGN_DIV', dataType: 'text', header: { text: t('ORGN_DIV') }, editable: false, visible: false },
    { fieldName: 'PAYMENT_STOP_TYPE', dataType: 'text', header: { text: t('PAYMENT_STOP_TYPE') }, editable: false, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, editable: false, visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('INSERT_USER_ID') }, editable: false, visible: false },
    { fieldName: 'INSERT_USER_IP', dataType: 'text', header: { text: t('INSERT_USER_ID_IP') }, editable: false, visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('UPDATE_USER_ID') }, editable: false, visible: false },
    { fieldName: 'UPDATE_USER_IP', dataType: 'text', header: { text: t('UPDATE_USER_IP') }, editable: false, visible: false },
    { fieldName: 'PAYMENT_YN_ORG', dataType: 'text', header: { text: t('PAYMENT_YN_ORG') }, editable: false, visible: false },
  ],
  columns: [],
})

//지급
const grdTab03MainProps  = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column' 9
    { fieldName: 'BSNS_COMP_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false },
    { fieldName: 'ASGN_NAME', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false },
    { fieldName: 'EMP_NAME', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'PAYMENT_POINT', dataType: 'number', header: { text: t('지급포인트'), styleName: 'header_validit' }, styleName: 'right-column editable_column'
    , editable: true, numberFormat: "#,###", editor: { type: "line", inputCharacters: "0-9", maxLength: 10, },},
    { fieldName: 'PAYMENT_REASON', dataType: 'text', header: { text: t('지급사유'), styleName: 'header_validit' }, styleName: 'left-column editable_column', editable: true },
    { fieldName: 'PAYMENT_DATE', dataType: 'text', header: { text: t('지급일') }, editable: false },
    { fieldName: 'PAYMENT_USER_NM', dataType: 'text', header: { text: t('지급자') }, editable: false },
    { fieldName: 'PAYMENT_CONFIRM_YN', dataType: 'text', header: { text: t('지급확정여부') }, editable: false },
    // { fieldName: 'PAYMENT_CONFIRM_YN', dataType: 'text', header: { text: t('지급확정여부') }, styleName: 'left-column', lookupDisplay: true
    //   , editor: { type: 'dropdown', dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'RECOVERY_YN', dataType: 'text', header: { text: t('회수여부') }, styleName: 'editable_column', lookupDisplay: true
    , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'RECOVERY_REASON', dataType: 'text', header: { text: t('회수사유') }, styleName: 'left-column editable_column', editable: true },
    // { fieldName: 'RECOVERY_CONFIRM_YN', dataType: 'text', header: { text: t('회수확정여부') }, styleName: 'left-column', lookupDisplay: true
    //   , editor: { type: 'dropdown', dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'RECOVERY_CONFIRM_YN', dataType: 'text', header: { text: t('회수확정여부') }, editable: false },

    //비활성화 18
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'MNTH', dataType: 'text', visible: false },
    { fieldName: 'PAYMENT_POINT_SEQ', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'ORGN_DIV', dataType: 'text', visible: false },
    { fieldName: 'PAYMENT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'PAYMENT_USER_IP', dataType: 'text', visible: false },
    { fieldName: 'RECOVERY_YN_ORG', dataType: 'text', visible: false },
    { fieldName: 'RECOVERY_DATE', dataType: 'text', visible: false },
    { fieldName: 'RECOVERY_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'RECOVERY_USER_IP', dataType: 'text', visible: false },
    { fieldName: 'REMARK', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [],
})

// 그리드 세팅

grdTab01MainProps.columns = grdTab01MainProps.fields
grdTab02MainProps.columns = grdTab02MainProps.fields
grdTab03MainProps.columns = grdTab03MainProps.fields

const codeList = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  paymentStopCd : [], //지급중단구분
  paymentStopDetailCd : [], //지급중단상세
  paymentYn: [{ TXT: 'Y', COD: 'Y' }, { TXT: 'N', COD: 'N' }], //지급중단여부
})

const codeList2 = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
  paymentStopCd : [], //지급중단구분
  paymentStopDetailCd : [], //지급중단상세
  paymentYn : [{ TXT: 'Y', COD: 'Y' }, { TXT: 'N', COD: 'N' }], //지급중단여부
})

const codeList2Batch = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [{ ORGN_NM: '직영+협력사', ORGN_DIV: '' }, { ORGN_NM: '직영', ORGN_DIV: 'A' }, { ORGN_NM: '협력사', ORGN_DIV: 'B' }], //소속구분 ('' : 직영+협력사, A : 직영, B : 협력사)
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
  paymentStopCd : [], //지급중단구분
  paymentStopDetailCd : [], //지급중단상세
})

const codeList3 = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
  paymentConfirmYn : [{ TXT: '전체', COD: '' }, { TXT: 'Y', COD: 'Y' }, { TXT: 'N', COD: 'N' }], //지급확정여부
  recoveryConfirmYn : [{ TXT: '전체', COD: '' }, { TXT: 'Y', COD: 'Y' }, { TXT: 'N', COD: 'N' }], //회수확정여부
  recoveryYn : [{ TXT: 'Y', COD: 'Y' }, { TXT: 'N', COD: 'N' }], //회수여부
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'), // 회사구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'), //소속구분
    getCodeList('HHIC40',userStore.cmpnyDiv,'N','0',null,'Y'), // 지급중단구분
    getCodeList('HHIC50',userStore.cmpnyDiv,'N','0',null,'Y'), // 지급중단상세
  ]).then(res => {
    //console.log("레스 확인",res)
    // 회사구분
    codeList.cmpnyDiv = res[0].ORESULT_CUR

    // 사업부 설정
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    searchParams.BSNS_CD = codeList.bsnsCd[0].BSNS_CD

    // 부서 설정
    codeList.deptCd = res[2].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams.DEPT_CD = codeList.deptCd[0].DEPT_CD

    // 소속구분
    codeList.orgnDiv = res[3].ORESULT_CUR
    codeList.orgnDiv.unshift({TXT : '전체', COD : ''})
    // 지급중단구분 (개인만)
    res[4].ORESULT_CUR.forEach(value => 
    {
      if(value.CODE_DESC1==='개인'){
        codeList.paymentStopCd.push({TXT : value.TXT, COD : value.COD})
      }
    })
    // 지급중단상세(개인만)
    res[5].ORESULT_CUR.forEach(value => 
    {
      if(value.CODE_DESC1==='개인'){
        codeList.paymentStopDetailCd.push({TXT : value.TXT, COD : value.COD})
      }
    })

    // TAB02 및 일괄처리
    // 회사구분
    codeList2.cmpnyDiv = res[0].ORESULT_CUR
    codeList2Batch.cmpnyDiv = res[0].ORESULT_CUR
    // 사업부
    codeList2.bsnsCd = res[1].ORESULT_CUR
    codeList2Batch.bsnsCd = res[1].ORESULT_CUR
    searchParams2.BSNS_CD = codeList2.bsnsCd[0].BSNS_CD
    batchParams1.BSNS_CD = codeList2Batch.bsnsCd[0].BSNS_CD
    
    // 부서
    codeList2.deptCd = res[2].ORESULT_CUR
    codeList2Batch.deptCd = res[2].ORESULT_CUR
    searchParams2.DEPT_CD = codeList2.deptCd[0].DEPT_CD
    batchParams1.DEPT_CD = codeList2Batch.deptCd[0].DEPT_CD

    // 소속구분
    codeList2.orgnDiv = res[3].ORESULT_CUR
    searchParams2.DEPT_CD = codeList2.orgnDiv[0].COD

    // 협력사
    // 지급중단여부
    // 지급중단구분 (조직만)
    res[4].ORESULT_CUR.forEach(value => 
    {
      if(value.CODE_DESC1==='조직'){
        codeList2.paymentStopCd.push({TXT : value.TXT, COD : value.COD})
        codeList2Batch.paymentStopCd.push({TXT : value.TXT, COD : value.COD})
        batchParams1.PAYMENT_STOP_CD = codeList2Batch.paymentStopCd[0].COD
      }
    })
    // 지급중단상세(조직만)
    res[5].ORESULT_CUR.forEach(value => 
    {
      if(value.CODE_DESC1==='조직'){
        codeList2.paymentStopDetailCd.push({TXT : value.TXT, COD : value.COD})
        codeList2Batch.paymentStopDetailCd.push({TXT : value.TXT, COD : value.COD})
        batchParams1.PAYMENT_STOP_DETAIL_CD = codeList2Batch.paymentStopDetailCd[0].COD
      }
    })

    // TAB03
    //회사구분
    codeList3.cmpnyDiv = res[0].ORESULT_CUR
    //사업부
    codeList3.bsnsCd = res[1].ORESULT_CUR
    searchParams3.BSNS_CD = codeList3.bsnsCd[0].BSNS_CD
    //부서
    codeList3.deptCd = res[2].ORESULT_CUR
    searchParams3.DEPT_CD = codeList3.deptCd[0].DEPT_CD
    //소속구분
    codeList3.orgnDiv = res[3].ORESULT_CUR
    //협력사
    
  }).finally(() => {

    // 그리드 세팅
    // TAB01
    grdTab01Main.value.setBindingColumn("PAYMENT_STOP_CD", codeList.paymentStopCd, "COD", "TXT")   // 구분 lookup set
    grdTab01Main.value.setBindingColumn("PAYMENT_STOP_DETAIL_CD", codeList.paymentStopDetailCd, "COD", "TXT")   // 구분 lookup set
    grdTab01Main.value.setBindingColumn("PAYMENT_YN", codeList.paymentYn, "COD", "TXT")   // 구분 lookup set
    
    codeList.paymentStopCd.unshift({TXT : '전체', COD : ''})
    codeList.paymentStopDetailCd.unshift({TXT : '전체', COD : ''})
    codeList.paymentYn.unshift({TXT : '전체', COD : ''})

    // TAB02
    grdTab02Main.value.setBindingColumn("PAYMENT_STOP_CD", codeList2.paymentStopCd, "COD", "TXT")   // 구분 lookup set
    grdTab02Main.value.setBindingColumn("PAYMENT_STOP_DETAIL_CD", codeList2.paymentStopDetailCd, "COD", "TXT")   // 구분 lookup set
    grdTab02Main.value.setBindingColumn("PAYMENT_YN", codeList2.paymentYn, "COD", "TXT")   // 구분 lookup set
    codeList2.paymentYn.unshift({TXT : '전체', COD : ''})

    // TAB03
    grdTab03Main.value.setBindingColumn("RECOVERY_YN", codeList3.recoveryYn, "COD", "TXT")   // 회수여부 lookup set
    
  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
// TAB01
watch(() => searchParams.BSNS_CD, (newValue) => {
  searchParams.DEPT_CD = ''
  if(isNullCheck(newValue)){
    codeList.deptCd = []
    codeList.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
      searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    }).finally(() => {
      //gridRefresh()
    })
})

// 사업부가 바뀌면 부서 데이터 가져옴 오고 소속구분 협력사는 초기화
// TAB02
watch(() => searchParams2.BSNS_CD, (newValue, oldValue) => {
  searchParams2.DEPT_CD = ''
  searchParams2.ORGN_DIV = ''
  if(isNullCheck(newValue)){
    codeList2.deptCd = []
    codeList2.deptCd.unshift({ DEPT_NM:'전체', DEPT_CD:'' })

    // 협력사 리셋
    searchParams2.ASGN_CD = ''
    codeList2.asgnCd = []
    codeList2.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList2.deptCd = res.ORESULT_CUR
      codeList2.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
      searchParams2.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    }).finally(() => {
    })
})

// 부서가 바뀌면 소속구분 협력사 리셋
// TAB02
watch(() => searchParams2.DEPT_CD, (newValue, oldValue) => {
  searchParams2.ORGN_DIV = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
    searchParams2.ASGN_CD = ''
    codeList2.asgnCd = []
    codeList2.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
})

// 소속구분이 바뀌면 협력사 데이터 가져옴
// TAB02
watch(() => searchParams2.ORGN_DIV, (newValue, oldValue) => {
  searchParams2.ASGN_CD = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
    searchParams2.ASGN_CD = ''
    codeList2.asgnCd = []
    codeList2.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  if(newValue === 'B' && searchParams2.DEPT_CD != ''&& searchParams2.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams2.BSNS_CD, DEPT_CD: searchParams2.DEPT_CD } })
    .then(res => {
      codeList2.asgnCd = []
      codeList2.asgnCd = res.ORESULT_CUR
      codeList2.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      searchParams2.ASGN_CD = codeList2.asgnCd[0].ASGN_CD
    })
  }
})

// 사업부가 바뀌면 부서 데이터 가져옴
// 적용범위/협력사 리셋
// TAB02에 중단 버늩
watch(() => batchParams1.BSNS_CD, (newValue, oldValue) => {
  batchParams1.DEPT_CD = ''
  //console.log('newValue : ', newValue)
  if(isNullCheck(newValue)){
    codeList2Batch.deptCd = []
    codeList2Batch.deptCd.unshift({ DEPT_NM:'전체', DEPT_CD:'' })

    // 적용범위 리셋
    batchParams1.ORGN_DIV = ''

    // 협력사 리셋
    batchParams1.ASGN_CD = ''
    codeList2Batch.asgnCd = []
    codeList2Batch.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList2Batch.deptCd = res.ORESULT_CUR
      codeList2Batch.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
      batchParams1.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    }).finally(() => {
      // 적용범위 리셋
      batchParams1.ORGN_DIV = ''
    })
})

// 부서가 바뀌면 적용범위 리셋
// TAB02에 중단 버늩
watch(() => batchParams1.DEPT_CD, (newValue, oldValue) => {
  batchParams1.ORGN_DIV = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
    batchParams1.ASGN_CD = ''
    codeList2Batch.asgnCd = []
    codeList2Batch.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
})

// 적용범위가 바뀌면 협력사 데이터 가져옴
// TAB02에 중단 버튼
watch(() => batchParams1.ORGN_DIV, (newValue, oldValue) => {
  batchParams1.ASGN_CD = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
    batchParams1.ASGN_CD = ''
    codeList2Batch.asgnCd = []
    codeList2Batch.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  if(newValue === 'B' && batchParams1.DEPT_CD != ''&& batchParams1.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: batchParams1.BSNS_CD, DEPT_CD: batchParams1.DEPT_CD } })
    .then(res => {
      codeList2Batch.asgnCd = []
      codeList2Batch.asgnCd = res.ORESULT_CUR
      codeList2Batch.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      batchParams1.ASGN_CD = codeList2Batch.asgnCd[0].ASGN_CD
    })
  }
})

// 사업부가 바뀌면 부서 데이터 가져옴 오고 소속구분 협력사는 초기화
// TAB03
watch(() => searchParams3.BSNS_CD, (newValue, oldValue) => {
  searchParams3.DEPT_CD = ''
  searchParams3.ORGN_DIV = ''
  if(isNullCheck(newValue)){
    codeList3.deptCd = []
    codeList3.deptCd.unshift({ DEPT_NM:'전체', DEPT_CD:'' })

    // 협력사 리셋
    searchParams3.ASGN_CD = ''
    codeList3.asgnCd = []
    codeList3.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList3.deptCd = res.ORESULT_CUR
      codeList3.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
      searchParams3.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    }).finally(() => {
    })
})

// 부서가 바뀌면 소속구분 협력사 리셋
// TAB03
watch(() => searchParams3.DEPT_CD, (newValue, oldValue) => {
  searchParams3.ORGN_DIV = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
    searchParams3.ASGN_CD = ''
    codeList3.asgnCd = []
    codeList3.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
})

// 소속구분이 바뀌면 협력사 데이터 가져옴
// TAB03
watch(() => searchParams3.ORGN_DIV, (newValue, oldValue) => {
  searchParams3.ASGN_CD = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
    searchParams3.ASGN_CD = ''
    codeList3.asgnCd = []
    codeList3.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  if(newValue === 'B' && searchParams3.DEPT_CD != ''&& searchParams3.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams3.BSNS_CD, DEPT_CD: searchParams3.DEPT_CD } })
    .then(res => {
      codeList3.asgnCd = []
      codeList3.asgnCd = res.ORESULT_CUR
      codeList3.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      searchParams3.ASGN_CD = codeList3.asgnCd[0].ASGN_CD
    })
  }
})


// tab ==='THREE' 일때만 미확인건 조회 버튼 보이게
// TAB03
watch(() => tab.value, (newValue, oldValue) => {
 if (newValue === 'three'){
  menuTitle.value.disableBtn('btnShowUnknown', false)   
 }
 else{
  menuTitle.value.disableBtn('btnShowUnknown', true)   
 }



})



// //사번 유효성 검사
// const inputEMP_NO = () => {
//   searchParams.EMP_NO = searchParams.EMP_NO.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/g, '')
// }

// //성명 유효성 검사
// const inputEMP_NM = () => {
//   searchParams.EMP_NM = searchParams.EMP_NM.replace(/[0-9a-zA-Z~!@#$%^&*()_+|<>?:{}]/g, '')
// }

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  //console.log('tab.value : ',tab.value)
  if(tab.value === 'one'){
    if(btn.id === 'btnSearch'){ //조회
      new queryFlowHelper(vm, t)
          .setGridList([grdTab01Main])
          //.setSearchArea(searchArea)
          .setBefore(beforeSearch)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
    }
    else if(btn.id === 'btnCreate'){ //추가
      addRow()
    }
    else if(btn.id === 'btnUpdate'){ //저장
      new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdTab01Main, row: 'check' }])
      .setGridList([grdTab01Main])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
  }
  else if(tab.value === 'two'){
     if(btn.id === 'btnSearch'){ //조회
        new queryFlowHelper(vm, t)
        .setGridList([grdTab02Main])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchDataSecond)
        .setAfter(afterSearchSecond)
        .run()
     }
     else if(btn.id === 'btnCreate'){ //추가
        addRow()
     }
     else if(btn.id === 'btnUpdate'){ //저장
        new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid:grdTab02Main, row: 'check' }])
        .setGridList([grdTab02Main])
        .setBefore(validationCheck)
        .setQuery(saveData)
        .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
        .run()
    }else if(btn.id === 'btnBatchStop'){
      // 지급중지
      new saveFlowHelper(vm, t)
      .setConfirmMessage('지급중지 하시겠습니까?')
      .setBefore(beforeBatchStop)
      .setQuery(saveBatchStopData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
  }else if(tab.value === 'three'){
    if(btn.id === 'btnSearch'){ //조회
      new queryFlowHelper(vm, t)
        .setGridList([grdTab03Main])
        .setBefore(beforeSearch)
        .setQuery(searchDataThird)
        .setAfter(afterSearchThird)
        .run()
    }
    else if(btn.id === 'btnCreate'){ //추가
        addRow()
    }else if(btn.id === 'btnUpdate'){ //저장
        new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid:grdTab03Main, row: 'check' }])
        .setGridList([grdTab03Main])
        .setBefore(validationCheck)
        .setQuery(saveData)
        .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
        .run()
    }else if(btn.id === 'btnPaymentConfirm'){
      //지급확정
      new saveFlowHelper(vm, t)
      .setConfirmMessage('지급확정 하시겠습니까?\r\n추가한 인원을 저장 후 지급확정이 가능 합니다.')
      .setTargetGridRow([{ grid:grdTab03Main, row: 'check' }])
      .setGridList([grdTab03Main])
      .setBefore(beforePaymentConfirm)
      .setQuery(savePaymentConfirmData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
    else if(btn.id === 'btnRecoveryConfirm'){
      //회수확정
      new saveFlowHelper(vm, t)
      .setConfirmMessage('회수확정 하시겠습니까?')
      .setTargetGridRow([{ grid:grdTab03Main, row: 'check' }])
      .setGridList([grdTab03Main])
      .setBefore(beforeRecoveryConfirm)
      .setQuery(savePaymentConfirmData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
    else if(btn.id === 'btnShowUnknown'){
      // 미확인 건 조회
      eDUDB0040Unknown.value.openPopup()
    }

  }
}

const addRow = e => {
  let popupParam = {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : '',
    DEPT_CD : '',
    EMP_NO : '',
    EMP_NM : '',
  }
  empPopup.value.openPopup(popupParam)
}

// 인원 조회 팝업 선택
const onEmpSelected = val => {
  if(!val){
    return
  }
  let addRowData = null
  //console.log(val)
  if(tab.value==='one' || tab.value==='two'){
    addRowData = {
      CMPNY_DIV : val.CMPNY_DIV,	//사업장구분	
      YEAR : dayjs(new Date).format('YYYY'), // 년도
      MNTH : dayjs(new Date).format('MM'), // 월
      EMP_NO : val.EMP_NO,	//사번	
      PAYMENT_STOP_SEQ : '0', //지급중단 SEQ(년월사번으로 SEQ 1식증가)
      BSNS_CD : val.BSNS_CD,	//사업부코드	
      BSNS_COMP_NM : val.BSNS_NM,	//사업부	
      DEPT_CD : val.DEPT_CD,	//부서코드(협력사:관리부서)	
      ASGN_CD : val.ASGN_CD,	//소속코드	
      ASGN_NAME : val.ASGN_NM,	//소속조직명(직영조직명,협력사명)	
      EMP_NAME : val.EMP_NM,	//성명	
      ORGN_DIV : val.USER_DIV,	//조직구분(A=직영, B=사내협력사)	
      //PAYMENT_STOP_TYPE : tab.value==='one' ? 'A' : 'B', //지급중단 구분(A=개인, B=조직)	
      PAYMENT_STOP_CD : '',	//지급중단 구분 (HHIC40)	
      PAYMENT_STOP_DETAIL_CD : '',	//지급중단 상세 (HHIC50)	
      PAYMENT_STOP_INSERT_DATE : dayjs(new Date).format('YYYY-MM-DD'),	//지급중단 등록일	
      PAYMENT_STOP_FROM : '',	//지급중단 시작일	
      PAYMENT_STOP_TO : '',	//지급중단 종료일	
      PAYMENT_YN : 'Y',	//지급중단 여부	
      REMARK : '',	//비고	
      INSERT_USER_ID : userStore.userId, //등록자
      INSERT_USER_ID_IP : userStore.clientIp, //등록자 IP

    }
  }else if(tab.value==='three'){
    addRowData = 
    {
      CMPNY_DIV : val.CMPNY_DIV,	// 사업장구분
      YEAR : dayjs(new Date).format('YYYY'),	// 포인트 년도
      MNTH : dayjs(new Date).format('MM'),	// 포인트 월
      EMP_NO : val.EMP_NO,	// 사번
      PAYMENT_POINT_SEQ : '0',	// 지급 포인트 SEQ(년월사번으로 SEQ 1식증가)
      BSNS_CD : val.BSNS_CD,	// 사업부코드
      BSNS_COMP_NM : val.BSNS_NM,	//사업부	
      DEPT_CD : val.DEPT_CD,	// 부서코드(협력사:관리부서)
      ASGN_CD : val.ASGN_CD,	// 소속코드
      ASGN_NAME : val.ASGN_NM,	// 소속조직명(직영조직명,협력사명)
      EMP_NAME : val.EMP_NM,	// 성명
      ORGN_DIV : val.USER_DIV,	// 조직구분(A=직영, B=사내협력사)
      PAYMENT_REASON : '',	// 지급사유
      PAYMENT_DATE : dayjs(new Date).format('YYYY-MM-DD'),	// 지급일시
      PAYMENT_POINT : '',	// 지급포인트
      PAYMENT_USER_NM : userStore.userName,	//-- 지급자명
      PAYMENT_USER_ID : userStore.userId,	//-- 지급자
      PAYMENT_USER_IP: userStore.clientIp,	//-- 지급자 IP
      PAYMENT_CONFIRM_YN : 'N',	// 지급확정여부
      RECOVERY_YN : 'N',	// 회수여부
      RECOVERY_REASON : '',	// 회수사유
      RECOVERY_DATE : '',	// 회수일
      RECOVERY_USER_ID : '',	// 회수자
      RECOVERY_USER_IP : '',	// 회수자 IP
      RECOVERY_CONFIRM_YN : '',	// 회수확정여부
      REMARK : '',	// 비고
      INSERT_USER_ID : userStore.userId,	// 등록자
      INSERT_DATE : '',	// 등록일시
      SAVE_YN : 'N',
      // UPDATE_USER_ID: '',	//-- 수정자
      // UPDATE_DATE : '',	// 수정일시
    }
  }

  //console.log('tab.value : ' ,tab.value)

  if(tab.value==='one'){
    addRowData.PAYMENT_STOP_TYPE = 'A'	//지급중단 구분(A=개인, B=조직)	
    grdTab01Main.value.addRow(addRowData)
  }
  else if(tab.value==='two'){
    addRowData.PAYMENT_STOP_TYPE = 'B'	//지급중단 구분(A=개인, B=조직)	
    grdTab02Main.value.addRow(addRowData)
  }
  else if(tab.value==='three'){
    grdTab03Main.value.addRow(addRowData)
  }

  //console.log('addRowData : ' ,addRowData)
}

// 저장 사용자 정의 validation
const validationCheck = () => {
  let chekedRow = ref([])
  let bCheck = true
  if(tab.value === 'one'){
    chekedRow = grdTab01Main.value.getGridView().getCheckedRows()
  }else if(tab.value === 'two'){
    chekedRow = grdTab02Main.value.getGridView().getCheckedRows()
  }else if(tab.value === 'three'){
    chekedRow = grdTab03Main.value.getGridView().getCheckedRows()
  }
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  saveParams.value = []
  let data = ref([])
  chekedRow.forEach(val => {
    if(tab.value === 'one'){
      data = grdTab01Main.value.getDataProvider().getJsonRow(val)
    }else if(tab.value === 'two'){
      data = grdTab02Main.value.getDataProvider().getJsonRow(val)
    }else if(tab.value === 'three'){
      data = grdTab03Main.value.getDataProvider().getJsonRow(val)
    }

    if(tab.value === 'one' || tab.value === 'two' ){
      if(data.PAYMENT_STOP_TO ==='' || data.PAYMENT_STOP_FROM ===''){
        Message.warn(t('지급중단 시작일 및 지급중단 종료일은 필수로 입력 하셔야 합니다.'))
        bCheck = false
        return false
      }
      else if(data.PAYMENT_STOP_TO < data.PAYMENT_STOP_FROM){
        Message.warn(t('지급중단 종료일이 지급중단 시작일 보다 이전입니다.'))
        bCheck = false
        return false
      }
      else if(data.PAYMENT_STOP_CD==='' || data.PAYMENT_STOP_DETAIL_CD===''){
        Message.warn(t('지급중단 구분 및 지급중단 상세는 필수로 입력 하셔야 합니다..'))
        bCheck = false
        return false
      }
      else{
        if(tab.value === 'two'){
          let PAYMENT_STOP_NM = ref(null)
          let PAYMENT_STOP_DETAIL_NM = ref(null)

          codeList2.paymentStopCd.forEach(item => {
            if(item.COD===data.PAYMENT_STOP_CD){
              PAYMENT_STOP_NM.value = item.TXT
            }
          })

          codeList2.paymentStopDetailCd.forEach(item => {
            if(item.COD===data.PAYMENT_STOP_DETAIL_CD){
              PAYMENT_STOP_DETAIL_NM.value = item.TXT
            }
          })
          
          if(PAYMENT_STOP_NM.value !== PAYMENT_STOP_DETAIL_NM.value){
            Message.warn(t('지급중단 구분과 지급중단 상세는 같아야 합니다.'))
            bCheck = false
            return false
          }
        }
        data.UPDATE_USER_ID = userStore.userId
        data.UPDATE_USER_IP = userStore.clientIp
      }
    }else if(tab.value === 'three'){
      // 지급확정 여부가 N 일때는 지급포인트/지급사유/회수여부/회수 사유가 업데이트 되어야 되며
      // 지급확정 여부가 Y 일때는 회수여부/회수 사유만 업데이트 되어야 하고
      // 지급확정 여부가 Y이고 회수확정여부가 Y일경우에는 수정이 되어서는 안됨
      if(data.RECOVERY_CONFIRM_YN === 'Y'){
        Message.warn(t('회수확정 여부가 Y인 경우 수정이 불가능 합니다.'))
        bCheck = false
        return false
      }else if(data.PAYMENT_POINT === undefined){
        Message.warn(t('지급 포인트를 입력 하셔야 합니다.'))
        bCheck = false
        return false
      }else if(data.PAYMENT_REASON ==='' || data.PAYMENT_REASON === null ){
        Message.warn(t('지급 사유를 입력 하셔야 합니다.'))
        bCheck = false
        return false
      }else if(data.RECOVERY_YN ==='Y' && (data.RECOVERY_REASON === null || data.RECOVERY_REASON === '')){
        Message.warn(t('회수 사유를 입력 하셔야 합니다.'))
        bCheck = false
        return false
      }
    }
    saveParams.value.push(data)
  })
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}
// 저장
const saveData = () => {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  let typeQueryId = ''
  if(tab.value === 'one' || tab.value === 'two'){
    typeQueryId = 'EDUDB0040_TAB01_SAVE_01'
  }else if(tab.value === 'three'){
    typeQueryId = 'EDUDB0040_TAB03_SAVE_01'
  }

  return commonExecuteApi({ queryId : typeQueryId, list: saveParams.value })
}

//중단 전
const beforeBatchStop = () => {
  let PAYMENT_STOP_NM = ref(null)
  let PAYMENT_STOP_DETAIL_NM = ref(null)

  codeList2Batch.paymentStopCd.forEach(item => {
    if(item.COD===batchParams1.PAYMENT_STOP_CD){
      PAYMENT_STOP_NM.value = item.TXT
    }
  })

  codeList2Batch.paymentStopDetailCd.forEach(item => {
    if(item.COD===batchParams1.PAYMENT_STOP_DETAIL_CD){
      PAYMENT_STOP_DETAIL_NM.value = item.TXT
    }
  })

  if(batchParams1.BSNS_CD === ''){
    Message.warn(t('사업부는 필수 입력 입니다.'))
    return false
  }else if(batchParams1.DEPT_CD ===''){
    Message.warn(t('부서는 필수 입력 입니다.'))
    return false
  }
  else if(PAYMENT_STOP_NM.value !== PAYMENT_STOP_DETAIL_NM.value){
    
    Message.warn(t('지급중단 구분과 지급중단 상세는 같아야 합니다.'))
    return false
  }
  return true
}

//일괄 지급 중단
const saveBatchStopData = () => {
  //console.log('batchParams1 : ' , batchParams1)
  return commonExecuteApi({ queryId : 'EDUDB0040_TAB02_SAVE_02', list: [batchParams1] })
}


//지급 확정 전 내용 확인
const beforePaymentConfirm = () => {
  let chekedRow = ref([])
  let bCheck = true

  chekedRow = grdTab03Main.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  saveParams.value = []
  let data = ref([])
  chekedRow.forEach(val => {
    data = grdTab03Main.value.getDataProvider().getJsonRow(val)

    if(data.SAVE_YN === 'N'){
      Message.warn(t('저장 후 지급확정 및 회수확정이 가능합니다.'))
      bCheck = false
      return false
    }


    if(data.RECOVERY_CONFIRM_YN === 'Y'){
      Message.warn(t('회수확정이 된 데이터는 지급확정을 할 수 없습니다.'))
      bCheck = false
      return false
    }else if(data.PAYMENT_CONFIRM_YN === 'Y'){
      Message.warn(t('지급확정이 된 데이터는 지급확정을 할 수 없습니다.'))
      bCheck = false
      return false
    }
    saveParams.value.push(data)
  })

  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return bCheck
}

//회수 확정 전 내용 확인
const beforeRecoveryConfirm = () => {
  let chekedRow = ref([])
  let bCheck = true

  chekedRow = grdTab03Main.value.getGridView().getCheckedRows()

  // 2024.07.08 박용훈 회수 확정시 단건으로 처리 되도록 기능 추가
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }else if(chekedRow.length !== 1){
    Message.warn(t('회수 확정은 한건씩만 처리 가능 합니다.한건만 선택 해주십시오.'))
    return false
  } 

  saveParams.value = []
  let data = ref([])
  chekedRow.forEach(val => {
    data = grdTab03Main.value.getDataProvider().getJsonRow(val)
    if(data.PAYMENT_CONFIRM_YN === 'N'){
      Message.warn(t('지급확정이 안된 데이터는 회수 확정을 할 수 없습니다.'))
      bCheck = false
      return false
    }else if(data.RECOVERY_CONFIRM_YN === 'Y'){
      Message.warn(t('회수확정이 된 데이터는 회수확정을 할 수 없습니다.'))
      bCheck = false
      return false
    }else if(data.RECOVERY_YN_ORG != 'Y'){
      Message.warn(t('회수가 여부가 Y인 데이터만 회수 확정을 할 수 있습니다.'))
      bCheck = false
      return false
    }
    saveParams.value.push(data)
  })

  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return bCheck
}


//지급 확정
const savePaymentConfirmData = () => {
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId : 'EDUDB0040_TAB03_SAVE_02', list: saveParams.value })
}

// watch(tab, (e) => {
//   console.log("탭체인지",e)
//   console.log('1', grdTab01Main.value)
//   console.log('2', grdTab02Main.value)
//   console.log('3', grdTab03Main.value)
  //tabClick(e)
  //nextTick(() => {
//    tabClick(e)
  //   console.log("탭체인지",e)
  //   console.log('1', grdTab01Main.value)
  //   console.log('2', grdTab02Main.value)
  //   console.log('3', grdTab03Main.value)
  //   if(e ==='one')
  //   {
  //     if(!bGrd2Columninit.value){
  //       bGrd2Columninit.value = true
  //       grdTab02Main.value.setBindingColumn("PAYMENT_STOP_CD", codeList2.paymentStopCd, "COD", "TXT")   // 구분 lookup set
  //       grdTab02Main.value.setBindingColumn("PAYMENT_STOP_DETAIL_CD", codeList2.paymentStopDetailCd, "COD", "TXT")   // 구분 lookup set
  //       grdTab02Main.value.setBindingColumn("PAYMENT_YN", codeList2.paymentYn, "COD", "TXT")   // 구분 lookup set
  //       codeList2.paymentYn.unshift({TXT : '전체', COD : ''})
  //     }
  //   }
  //   else if(e ==='two')
  //   {
  //     //if(!bGrd2Columninit.value){
  //       //bGrd2Columninit.value = true
  //       grdTab02Main.value.setBindingColumn("PAYMENT_STOP_CD", codeList2.paymentStopCd, "COD", "TXT")   // 구분 lookup set
  //       grdTab02Main.value.setBindingColumn("PAYMENT_STOP_DETAIL_CD", codeList2.paymentStopDetailCd, "COD", "TXT")   // 구분 lookup set
  //       grdTab02Main.value.setBindingColumn("PAYMENT_YN", codeList2.paymentYn, "COD", "TXT")   // 구분 lookup set
  //       codeList2.paymentYn.unshift({TXT : '전체', COD : ''})
  //     //}
  //   }
  //   else if(e ==='three'){
  //     //if(!bGrd3Columninit.value){
  //       //bGrd3Columninit.value = true
  //       grdTab03Main.value.setBindingColumn("RECOVERY_YN", codeList3.recoveryYn, "COD", "TXT")   // 회수여부 lookup set
  //       //grdTab03Main.value.setBindingColumn("RECOVERY_CONFIRM_YN", codeList3.recoveryConfirmYn, "COD", "TXT")   // 회수확정여부 lookup set
  //     //}
  //   }
   //})
//})


// //탭 변경시 발생하는 이벤트
// const tabClick = tab => {
//   console.log("탭체인지",tab)
//   console.log('1', grdTab01Main.value)
//   console.log('2', grdTab02Main.value)
//   console.log('3', grdTab03Main.value)
//   // if(tab==='two')
//   // {
//   //   if(!bGrd2Columninit.value){
//   //     bGrd2Columninit.value = true
//   //     grdTab02Main.value.setBindingColumn("PAYMENT_STOP_CD", codeList2.paymentStopCd, "COD", "TXT")   // 구분 lookup set
//   //     grdTab02Main.value.setBindingColumn("PAYMENT_STOP_DETAIL_CD", codeList2.paymentStopDetailCd, "COD", "TXT")   // 구분 lookup set
//   //     grdTab02Main.value.setBindingColumn("PAYMENT_YN", codeList2.paymentYn, "COD", "TXT")   // 구분 lookup set
//   //     codeList2.paymentYn.unshift({TXT : '전체', COD : ''})
//   //   }
//   // }
//   // else if(tab==='three'){
//   //   if(!bGrd3Columninit.value){
//   //     bGrd3Columninit.value = true
//   //     grdTab03Main.value.setBindingColumn("RECOVERY_YN", codeList3.recoveryYn, "COD", "TXT")   // 회수여부 lookup set
//   //     //grdTab03Main.value.setBindingColumn("RECOVERY_CONFIRM_YN", codeList3.recoveryConfirmYn, "COD", "TXT")   // 회수확정여부 lookup set
//   //   }
//   // }
// }

//그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdTab01Main'){
    grdTab01Main.value.getDataProvider().setRows([])
  }else if(val === 'grdTab02Main'){
    grdTab02Main.value.getDataProvider().setRows([])
  }else if(val === 'grdTab03Main'){
    grdTab03Main.value.getDataProvider().setRows([])
  }
}

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}
//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//개인 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//개인 조회
const searchData = () => {
  //console.log("조회 파라미터 ::::::: ",searchParams)
  return commonSearchApi({ queryId : 'EDUDB0040_TAB01_SEARCH_01', param: searchParams })
}

//개인 조회 후
const afterSearch = res => {
  //console.log("조회된 데이터 확인",res)
  gridRefresh('grdTab01Main')
  grdTab01Main.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//##################################################### Second #####################################################################
//조직 조회 전 유효성 검사
const beforeSearchSecond = () => {
  return true
}

//조직 조회
const searchDataSecond = () => {
  //console.log("조회 파라미터 ::::::: ",searchParams2)
  return commonSearchApi({ queryId : 'EDUDB0040_TAB01_SEARCH_01', param: searchParams2 })
}
//조직 조회 후
const afterSearchSecond = res => {
  //console.log("조회된 데이터 확인",res)
  gridRefresh('grdTab02Main')
  grdTab02Main.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//##################################################### Third #####################################################################
//조직 조회 전 유효성 검사
const beforeSearchThird = () => {
  return true
}

//조직 조회
const searchDataThird = () => {
  //console.log("조회결과 확인",searchParams3)
  return commonSearchApi({ queryId : 'EDUDB0040_TAB03_SEARCH_01', param: searchParams3 })
}
//조직 조회 후
const afterSearchThird = res => {
  //console.log("조회된 데이터 확인",res)
  gridRefresh('grdTab03Main')
  grdTab03Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  //status()
}
const grdTab01MainStatus = () => {
  //console.log("grdTab01MainStatus")
  grdTab01Main.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}
    let targetData = grid.getValue(item.index, "UPDATE_USER_ID")
    let targetData2 = grid.getValue(item.index, "PAYMENT_YN_ORG")
    if(targetData==='SCHEDULER' && targetData2==='N'){
      // 더이상 수정이 안되도록 해야함
      // 지급중단 구분
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 구분 상세
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_DETAIL_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 시작일
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_FROM').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 종료일
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_TO').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 여부
      grdTab01Main.value.getGridView().columnByName('PAYMENT_YN').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
    }else{
      //console.log('기본')
      // 지급중단 구분
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 구분 상세
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_DETAIL_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 시작일
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_FROM').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 종료일
      grdTab01Main.value.getGridView().columnByName('PAYMENT_STOP_TO').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 여부
      grdTab01Main.value.getGridView().columnByName('PAYMENT_YN').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
    }
  })
}

const grdTab02MainStatus = () => {
  //console.log("grdTab02MainStatus")
  grdTab02Main.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}
    let targetData = grid.getValue(item.index, "UPDATE_USER_ID")
    let targetData2 = grid.getValue(item.index, "PAYMENT_YN_ORG")
    if(targetData==='SCHEDULER' && targetData2==='N'){
      // 더이상 수정이 안되도록 해야함
      // 지급중단 구분
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 구분 상세
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_DETAIL_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 시작일
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_FROM').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 종료일
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_TO').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
      // 지급중단 여부
      grdTab02Main.value.getGridView().columnByName('PAYMENT_YN').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      }
    }else{
      //console.log('기본')
      // 지급중단 구분
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 구분 상세
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_DETAIL_CD').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 시작일
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_FROM').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 종료일
      grdTab02Main.value.getGridView().columnByName('PAYMENT_STOP_TO').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
      // 지급중단 여부
      grdTab02Main.value.getGridView().columnByName('PAYMENT_YN').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column editable_column', editable : true
        }
      }
    }
  })
}

const grdTab03MainStatus = () => {
  //console.log("grdTab03MainStatus")
  grdTab03Main.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}
    let targetData = grid.getValue(item.index, "PAYMENT_CONFIRM_YN")
    let targetData2 = grid.getValue(item.index, "RECOVERY_CONFIRM_YN")
    if(targetData==='Y' && targetData2==='Y'){
      // 지급확정여부 및 회수확정이 Y일경우
      // 포인트
      let column = grdTab03Main.value.getGridView().columnByName('PAYMENT_POINT');
      column.styleCallback = function (grid, cell) {
        return {
          styleName: 'right-column', editable : false
        }
      };
      // 지급사유
      column = grdTab03Main.value.getGridView().columnByName('PAYMENT_REASON');
      column.styleCallback = function (grid, cell) {
        return {
          styleName: 'left-column', editable : false
        }
      };
      //회수여부
      grdTab03Main.value.getGridView().columnByName('RECOVERY_YN').styleCallback = function (grid, cell) {
        return {
          styleName: 'center-column', editable : false
        }
      };
      //회수사유
      grdTab03Main.value.getGridView().columnByName('RECOVERY_REASON').styleCallback = function (grid, cell) {
        return {
          styleName: 'left-column', editable : false
        }
      };
    }else if(targetData==='Y' && targetData2!='Y'){
      // 지급확정여부 Y이고 회수확정이 Y가 아닐 경우
      // 포인트
      let column = grdTab03Main.value.getGridView().columnByName('PAYMENT_POINT');
      column.styleCallback = function (grid, cell) {
        return {
          styleName: 'right-column', editable : false
        }
      };
      // 지급사유
      column = grdTab03Main.value.getGridView().columnByName('PAYMENT_REASON');
      column.styleCallback = function (grid, cell) {
        return {
          styleName: 'left-column', editable : false
        }
      };
      //회수여부
      grdTab03Main.value.getGridView().columnByName('RECOVERY_YN').styleCallback = function (grid, cell) {
        return {
          styleName: 'editable_column', editable : true
        }
      };
      //회수사유
      grdTab03Main.value.getGridView().columnByName('RECOVERY_REASON').styleCallback = function (grid, cell) {
        return {
          styleName: 'left-column editable_column', editable : true
        }
      };
    }else if(targetData==='N'){
      // 포인트
      grdTab03Main.value.getGridView().columnByName('PAYMENT_POINT').styleCallback = function (grid, cell) {
        return {
          styleName: 'right-column editable_column', editable : true
        }
      };
      // 지급사유
      grdTab03Main.value.getGridView().columnByName('PAYMENT_REASON').styleCallback = function (grid, cell) {
        return {
          styleName: 'left-column editable_column', editable : true
        }
      };
      //회수여부
      grdTab03Main.value.getGridView().columnByName('RECOVERY_YN').styleCallback = function (grid, cell) {
        return {
          styleName: 'editable_column', editable : true
        }
      };
      //회수사유
      grdTab03Main.value.getGridView().columnByName('RECOVERY_REASON').styleCallback = function (grid, cell) {
        return {
          styleName: 'left-column editable_column', editable : true
        }
      };
    }

    return ret
  })
}
//*****************************************조회 영역(종료)***********************************************************/

onMounted( () => {
  initCodeList()
  grdTab01MainStatus()
  grdTab02MainStatus()
  grdTab03MainStatus()
  menuTitle.value.disableBtn('btnShowUnknown', true) 
  onButtonsClick({ id:'btnSearch' })
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnCreate', 'btnUpdate', 'btnShowUnknown']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="mb-2">
        <v-tabs v-model="tab">
          <v-tab value="one">개인</v-tab>
          <v-tab value="two">조직</v-tab>
          <v-tab value="three">운영자 지급</v-tab>
        </v-tabs>
      </v-sheet>
    </v-card-title>
    <v-card-text v-show="tab == 'one'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input
              :label="$t('년도')"
              labelWidth="25px"
              v-model="searchParams.YEAR"
              type="Number"
              width="120px"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('회사구분')"
              labelWidth="60px"
              width="240px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              labelWidth="45px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              labelWidth="30px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('소속구분')"
              labelWidth="60px"
              width="200px"
              v-model="searchParams.ORGN_DIV"
              :items="codeList.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('지급중단구분')"
              labelWidth="90px"
              width="250px"
              v-model="searchParams.PAYMENT_STOP_CD"
              :items="codeList.paymentStopCd"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('지급중단여부')"
              labelWidth="90px"
              width="200px"
              v-model="searchParams.PAYMENT_YN"
              :items="codeList.paymentYn"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input labelWidth="35px" width="185px" 
              :label="$t('기간')" type="date"
              v-model="searchParams.PAYMENT_STOP_FROM"
              margin="10px"
            />
            <i-input width="160px"
              :label="$t('-')" type="date"
              v-model="searchParams.PAYMENT_STOP_TO"
            />
            <i-input 
              :label="$t('사번')"
              width="200px"
              v-model="searchParams.EMP_NO"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/, '');"
              maxlength="20"
           
            />
            <i-input 
              :label="$t('성명')"
              width="200px"
              v-model="searchParams.EMP_NAME"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[0-9~!@#$%^&*()_+|<>?:{}]/, '' );"
              maxlength="500"
              
            />
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet height="78%">
          <RealGrid
            ref="grdTab01Main"
            :grid-view-option="grdTab01MainProps.gridViewOption"
            :fields="grdTab01MainProps.fields"
            :columns="grdTab01MainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <v-card-text v-show="tab == 'two'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input
              :label="$t('년도')"
              labelWidth="25px"
              v-model="searchParams2.YEAR"
              type="Number"
              width="120px"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('회사구분')"
              labelWidth="60px"
              width="240px"
              v-model="searchParams2.CMPNY_DIV"
              :items="codeList2.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              labelWidth="45px"
              v-model="searchParams2.BSNS_CD"
              :items="codeList2.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              labelWidth="30px"
              v-model="searchParams2.DEPT_CD"
              :items="codeList2.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('소속구분')"
              labelWidth="60px"
              width="200px"
              v-model="searchParams2.ORGN_DIV"
              :items="codeList2.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('협력사')"
              width="250px"
              labelWidth="60px"
              v-model="searchParams2.ASGN_CD"
              :items="codeList2.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('지급중단여부')"
              width="200px"
              labelWidth="90px"
              v-model="searchParams2.PAYMENT_YN"
              :items="codeList2.paymentYn"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input labelWidth="120px" width="270px" 
              :label="$t('지급중단 등록 기간')" type="date"
              v-model="searchParams2.PAYMENT_STOP_FROM"
              margin="10px"
            />
            <i-input width="165px"
              :label="$t('-')" type="date"
              v-model="searchParams2.PAYMENT_STOP_TO"
            />
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              labelWidth="60px"
              width="240px"
              v-model="batchParams1.CMPNY_DIV"
              :items="codeList2Batch.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              v-show = "true"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              labelWidth="45px"
              v-model="batchParams1.BSNS_CD"
              :items="codeList2Batch.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              required
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              labelWidth="30px"
              v-model="batchParams1.DEPT_CD"
              :items="codeList2Batch.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              required
            />
            <i-select
              :label="$t('적용범위')"
              width="200px"
              labelWidth="60px"
              v-model="batchParams1.ORGN_DIV"
              :items="codeList2Batch.orgnDiv"
              item-title="ORGN_NM"
              item-value="ORGN_DIV"
            />
            <i-select
              :label="$t('협력사')"
              width="200px"
              labelWidth="45px"
              v-model="batchParams1.ASGN_CD"
              :items="codeList2Batch.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
            />
          </div>
          <div class="d-flex mb-2">
            <i-select
              :label="$t('지급중단구분')"
              width="250px"
              labelWidth="90px"
              v-model="batchParams1.PAYMENT_STOP_CD"
              :items="codeList2Batch.paymentStopCd"
              item-title="TXT"
              item-value="COD"
              required
            />
            <i-select
              :label="$t('지급중단구분상세')"
              width="300px"
              labelWidth="120px"
              v-model="batchParams1.PAYMENT_STOP_DETAIL_CD"
              :items="codeList2Batch.paymentStopDetailCd"
              item-title="TXT"
              item-value="COD"
              required
            />
            <i-input labelWidth="120px" width="270px" 
              :label="$t('지급중단 등록 기간')" type="date"
              v-model="batchParams1.PAYMENT_STOP_FROM"
              margin="10px"
            />
            <i-input width="165px"
              :label="$t('-')" type="date"
              v-model="batchParams1.PAYMENT_STOP_TO"
            />
            <IButtonList
              :button-list="['btnBatchStop']"
              @click-button="onButtonsClick"
            />
          </div>
          <v-sheet height="79%">
            <RealGrid
              ref="grdTab02Main"
              :grid-view-option="grdTab02MainProps.gridViewOption"
              :fields="grdTab02MainProps.fields"
              :columns="grdTab02MainProps.columns"
            />
          </v-sheet>
          <!-- 메인그리드 -->

        </v-sheet>
      </div>
    </v-card-text>
    <v-card-text v-show="tab == 'three'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input
              :label="$t('년도')"
              labelWidth="25px"
              v-model="searchParams3.YEAR"
              type="Number"
              width="120px"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('회사구분')"
              labelWidth="60px"
              width="240px"
              v-model="searchParams3.CMPNY_DIV"
              :items="codeList3.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              labelWidth="45px"
              v-model="searchParams3.BSNS_CD"
              :items="codeList3.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('부서')"
              width="200px"
              labelWidth="30px"
              v-model="searchParams3.DEPT_CD"
              :items="codeList3.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('소속구분')"
              width="150px"
              v-model="searchParams3.ORGN_DIV"
              :items="codeList3.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('협력사')"
              width="200px"
              v-model="searchParams3.ASGN_CD"
              :items="codeList3.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('지급확정여부')"
              width="180px"
              v-model="searchParams3.PAYMENT_CONFIRM_YN"
              :items="codeList3.paymentConfirmYn"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('회수확정여부')"
              width="180px"
              v-model="searchParams3.RECOVERY_CONFIRM_YN"
              :items="codeList3.recoveryConfirmYn"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input labelWidth="100px" width="270px" 
              :label="$t('지급 등록 기간')" type="date"
              v-model="searchParams3.PAYMENT_DATE_FROM"
              margin="10px"
            />
            <i-input width="165px"
              :label="$t('-')" type="date"
              v-model="searchParams3.PAYMENT_DATE_TO"
            />
            <i-input 
              :label="$t('사번')"
              width="200px"
              v-model="searchParams3.EMP_NO"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/, '');"
              maxlength="20"
        
            />
            <i-input 
              :label="$t('성명')"
              width="200px"
              v-model="searchParams3.EMP_NAME"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[0-9~!@#$%^&*()_+|<>?:{}]/, '' );"
              maxlength="500"
      
            />
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <!-- 메인그리드 -->
          <IGridTitle :title="$t('')"
            :button-list="['btnPaymentConfirm','btnRecoveryConfirm']"
            @click-button="onButtonsClick"
          >
          <template #editors />
          </IGridTitle>
          <v-sheet height="88%">
            <RealGrid
              ref="grdTab03Main"
              :grid-view-option="grdTab03MainProps.gridViewOption"
              :fields="grdTab03MainProps.fields"
              :columns="grdTab03MainProps.columns"
            />
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 인원조회팝업 -->
    <EmpPopup 
      ref="empPopup" 
      @selected="onEmpSelected"
    />
    <EDUDB0040Unknown
      ref="eDUDB0040Unknown"
    />


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
</style>