<!--
  화면명 : 안전페이 컨텐츠
  화면개요 : 안전페이 컨텐츠 조회 저장 하는 화면
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
import IButtonList from '@/components/IButtonList.vue'
import EDUDB0020Popup_01 from '@/pages/60_edu/EDU_D/EDUDB0020Popup_01.vue'

import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_D-EDUDB0020',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const logsStore = useLogsStore()
const menuTitle = ref(null)
const point = ref(null)
const grdTab01Main = ref(null)
const grdTab02Main = ref(null)
const grdTab03Main = ref(null)
const tab = ref('one')
const eEDUDB0020Popup_01 = ref(null)
const saveParams= ref([])

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  BSNS_CD : userStore.bsnsCd,              //사업부
  DEPT_CD : userStore.deptCd,              //부서코드
  ASGN_CD : userStore.asgnCd,             //협력사
  ORGN_DIV : userStore.userDiv,             //소속구분 (A : 직영, B : 협력사)
  ACCUMULATED_CONTENT_CD : '' , // 적립컨텐츠
  ACCUMULATED_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), // 지급일 기간 시작  
  ACCUMULATED_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급일 기간 끝
  EMP_NO : userStore.empNo, // 사번
  EMP_NAME : userStore.empNm, //성명
  TOTAL_POINT : '', // 내 포인트
  TOTAL_POINT_NM : '' // 내 포인트
})

const searchParams2 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  BSNS_CD : userStore.bsnsCd,              //사업부
  DEPT_CD : userStore.deptCd,              //부서코드
  ASGN_CD : userStore.asgnCd,             //협력사
  ORGN_DIV : userStore.userDiv,             //소속구분 (A : 직영, B : 협력사)
  ACCUMULATED_CONTENT_CD : '' , // 적립컨텐츠
  ACCUMULATED_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), // 지급일 기간 시작  
  ACCUMULATED_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급일 기간 끝
})

const searchParams3 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  BSNS_CD : '',              //사업부
  DEPT_CD : '',              //부서코드
  ASGN_CD : '',             //협력사
  ORGN_DIV : '',             //소속구분 (A : 직영, B : 협력사)
  ACCUMULATED_CONTENT_CD : '' , // 적립컨텐츠
  ACCUMULATED_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), // 지급일 기간 시작  
  ACCUMULATED_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급일 기간 끝
  EMP_NO : '', // 사번
  EMP_NAME : '', //성명
})

//개인
const grdTab01MainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_COMP_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false },
    { fieldName: 'ASGN_NAME', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false },
    { fieldName: 'EMP_NAME', dataType: 'text', header: { text: t('성명') },  editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'ACCUMULATED_CONTENT_NM', dataType: 'text', header: { text: t('적립 컨텐츠') },  editable: false },
    { fieldName: 'ACCUMULATED_CONTENT_DETAIL', dataType: 'text', header: { text: t('적립명') },  editable: false },
    { fieldName: 'ACCUMULATED_POINT', dataType: 'number', header: { text: t('적립포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###" },
    { fieldName: 'ACCUMULATED_DATE', dataType: 'text', header: { text: t('포인트 적립일') },  editable: false },


    { fieldName: 'CHANGE_POINT', dataType: 'number', header: { text: t('전환 포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###" },
    { fieldName: 'CHANGE_DATE', dataType: 'text', header: { text: t('포인트 전환일') },  editable: false },
    { fieldName: 'REMAINING_POINT', dataType: 'number', header: { text: t('잔여 포인트') },  styleName: 'right-column',numberFormat: "#,###",  editable: false },
  ],
  columns: [],
})

//부서/협력사
const grdTab02MainProps  = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_COMP_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'ASGN_NAME', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'ORGN_DIV_NM', dataType: 'text', header: { text: t('소속구분') },  editable: false, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'ACCUMULATED_CONTENT_NM', dataType: 'text', header: { text: t('적립 컨텐츠') },  editable: false, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'ACCUMULATED_POINT', dataType: 'number', header: { text: t('적립포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###" },
    { fieldName: 'CHANGE_POINT', dataType: 'number', header: { text: t('전환포인트') }, styleName: 'right-column', editable: false, numberFormat: "#,###", mergeRule: { "criteria": "values['ASGN_NAME'] + value" } },
  ],
  columns: [],
})

//관리자용
const grdTab03MainProps  = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 },footer: { visible:true },headerSummaries: { visible:true }},
  fields : [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column' 9
    { fieldName: 'BSNS_COMP_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'ASGN_NAME', dataType: 'text', width:'250', header: { text: t('소속') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'ORGN_DIV_NM', dataType: 'text', header: { text: t('소속구분') },  editable: false, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'EMP_NAME', dataType: 'text', width:'70', header: { text: t('성명') }, editable: false, },
    { fieldName: 'EMP_NO', dataType: 'text', width:'70', header: { text: t('사번') }, editable: false, headerSummary: {text: "전체 소계 : "}, footer: {text: "소계 : "}, groupFooter: {text: "소계 : "}, },
    // 그룹푸터 흰색으로 하고 싶으면 groupFooter에 styleName: 'group_footer' 추가
    //{ fieldName: 'COL1_A', dataType: 'number', width:'70', header: { text: t('모바일 안전\n작업 지시'), styleName: "multiline-editor" }, styleName: 'right-column', editable: false, numberFormat: "#,###", groupFooter: {numberFormat: "#,###",expression: "sum", styleName: 'group_footer'} },
    { fieldName: 'COL1_A', dataType: 'number', width:'90', header: { text: t('안전\n작업 지시'), styleName: "multiline-editor" }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'COL4_A', dataType: 'number', width:'70', header: { text: t('현장\n위험성평가'), styleName: "multiline-editor" }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'COL2_A', dataType: 'number', width:'70', header: { text: t('안전제보') }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'COL3_A', dataType: 'number', width:'70', header: { text: t('안전교육') }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'COL5_A', dataType: 'number', width:'70', header: { text: t('안전점검') }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'COL6_A', dataType: 'number', width:'70', header: { text: t('안전\n칭찬쿠폰'), styleName: "multiline-editor" }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" }, groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'COL7_A', dataType: 'number', header: { text: t('기타') }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'COL8_A', dataType: 'number', header: { text: t('회수') }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'TOTAL_POINT', dataType: 'number', header: { text: t('전체획득\n 포인트'), styleName: "multiline-editor" }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" }, groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'CHANGE_POINT', dataType: 'number', header: { text: t('전환\n 포인트'), styleName: "multiline-editor" }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'REMAINING_POINT', dataType: 'number', header: { text: t('잔여\n 포인트'), styleName: "multiline-editor" }, styleName: 'right-column', editable: false, numberFormat: "#,###", headerSummary: { numberFormat: "#,###",expression: "sum" }, footer: { numberFormat: "#,###",expression: "sum" },groupFooter: {numberFormat: "#,###",expression: "sum"} },
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
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
  accumulatedContentCd : [], //적립 컨텐츠 (HHIC30)
})

const codeList2 = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
  accumulatedContentCd : [], //적립 컨텐츠 (HHIC30)
})

const codeList3 = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
  accumulatedContentCd : [], //적립 컨텐츠 (HHIC30)
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'), // 회사구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'), //소속구분   
    getCodeList('HHIC30'), //적립 컨텍츠
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, DEPT_CD:userStore.deptCd, USE_DIV:'Y' } }), // 협력사
    getCodeList('HHIC40',userStore.cmpnyDiv,'N','0',null,'Y'), // 지급중단구분
    getCodeList('HHIC50',userStore.cmpnyDiv,'N','0',null,'Y'), // 지급중단상세
  ]).then(res => {
    //console.log("레스 확인",res)
    // 회사구분
    codeList.cmpnyDiv = res[0].ORESULT_CUR

    // 사업부 설정
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    
    let findIndex = res[1].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams.BSNS_CD = codeList.bsnsCd[findIndex].BSNS_CD

    // 부서 설정
    codeList.deptCd = res[2].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    findIndex = res[2].ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams.DEPT_CD = codeList.deptCd[findIndex].DEPT_CD

    // 소속구분
    codeList.orgnDiv = res[3].ORESULT_CUR
    codeList.orgnDiv.unshift({TXT : '전체', COD : ''})
    findIndex = res[3].ORESULT_CUR.findIndex(item => item.COD === userStore.userDiv)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams.ORGN_DIV = codeList.orgnDiv[findIndex].COD

    // 적립컨텐츠
    codeList.accumulatedContentCd = res[4].ORESULT_CUR
    codeList.accumulatedContentCd.unshift({TXT : '전체', COD : ''})

    // 협력사
    codeList.asgnCd = res[5].ORESULT_CUR
    codeList.asgnCd.unshift({ASGN_NM : '전체', ASGN_CD : ''})
    findIndex = res[5].ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams.ASGN_CD = codeList.asgnCd[findIndex].ASGN_CD

    // TAB02 부서/협력사
    // 회사구분
    codeList2.cmpnyDiv = res[0].ORESULT_CUR
    // 사업부
    codeList2.bsnsCd = res[1].ORESULT_CUR
    findIndex = res[1].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams2.BSNS_CD = codeList2.bsnsCd[findIndex].BSNS_CD

    // 부서
    codeList2.deptCd = res[2].ORESULT_CUR
    findIndex = res[2].ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams2.DEPT_CD = codeList2.deptCd[findIndex].DEPT_CD

    // 소속구분
    codeList2.orgnDiv = res[3].ORESULT_CUR
    findIndex = res[3].ORESULT_CUR.findIndex(item => item.COD === userStore.userDiv)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams2.ORGN_DIV = codeList2.orgnDiv[findIndex].COD

    // 적립컨텐츠
    codeList2.accumulatedContentCd = res[4].ORESULT_CUR
    

    // 협력사
    codeList2.asgnCd = res[5].ORESULT_CUR
    findIndex = res[5].ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd)
    if(findIndex < 0){
        findIndex = 0
    }
    searchParams2.ASGN_CD = codeList2.asgnCd[findIndex].ASGN_CD


    // TAB03 관리자용
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
    searchParams3.ORGN_DIV = codeList3.deptCd[0].COD

    //협력사

    // 적립컨텐츠
    codeList3.accumulatedContentCd = res[4].ORESULT_CUR
    
  }).finally(() => {

  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
// TAB01
watch(() => searchParams.BSNS_CD, (newValue) => {
  searchParams.DEPT_CD = ''
  searchParams.ASGN_CD = ''
  searchParams.ORGN_DIV = ''
  searchParams.ACCUMULATED_CONTENT_CD = ''

  // if(logsStore.isMenuAdmin === 'Y'){
  //   searchParams.EMP_NO = ''
  //   searchParams.EMP_NAME = ''
  // }
  
  if(isNullCheck(newValue)){
    codeList.deptCd = []
    codeList.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })

    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
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

// 부서가 바뀌면 소속구분 적립컨텐츠 사번 성명 초기화
watch(() => searchParams.DEPT_CD, (newValue) => {
  searchParams.ASGN_CD = ''
  searchParams.ORGN_DIV = ''
  searchParams.ACCUMULATED_CONTENT_CD = ''
  // if(logsStore.isMenuAdmin === 'Y'){
  //   searchParams.EMP_NO = ''
  //   searchParams.EMP_NAME = ''
  // }
  if(isNullCheck(newValue)){

    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
    return
  }
})
// 소속구분이 바뀌면 협력사 데이터 가져옴
// TAB01
watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
  searchParams.ASGN_CD = ''
  if(isNullCheck(newValue)){
    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  if(newValue === 'B' && searchParams.DEPT_CD != ''&& searchParams.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD } })
    .then(res => {
      codeList.asgnCd = []
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      searchParams.ASGN_CD = codeList.asgnCd[0].ASGN_CD
    })
  }
})



// 사업부가 바뀌면 부서 데이터 가져옴 오고 소속구분 협력사는 초기화
// TAB02
watch(() => searchParams2.BSNS_CD, (newValue, oldValue) => {
  searchParams2.DEPT_CD = ''
  searchParams2.ORGN_DIV = ''
  searchParams2.ACCUMULATED_CONTENT_CD = ''
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
  searchParams2.ACCUMULATED_CONTENT_CD = ''
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
  searchParams2.ACCUMULATED_CONTENT_CD = ''
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


// 사업부가 바뀌면 부서 데이터 가져옴 오고 소속구분 협력사는 초기화
// TAB03
watch(() => searchParams3.BSNS_CD, (newValue, oldValue) => {
  searchParams3.DEPT_CD = ''
  searchParams3.ASGN_CD = ''
  searchParams3.ORGN_DIV = ''
  searchParams3.ACCUMULATED_CONTENT_CD = ''
  searchParams3.EMP_NO = ''
  searchParams3.EMP_NAME = ''
  if(isNullCheck(newValue)){
    codeList3.deptCd = []
    codeList3.deptCd.unshift({ DEPT_NM:'전체', DEPT_CD:'' })

    // 협력사 리셋
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

// 부서가 바뀌면 소속구분 적립컨텐츠 사번 성명 초기화
// TAB03
watch(() => searchParams3.DEPT_CD, (newValue, oldValue) => {
  searchParams3.ASGN_CD = ''
  searchParams3.ORGN_DIV = ''
  searchParams3.ACCUMULATED_CONTENT_CD = ''
  searchParams3.EMP_NO = ''
  searchParams3.EMP_NAME = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
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

//사번 유효성 검사
const inputEMP_NO = () => {
  searchParams.EMP_NO = searchParams.EMP_NO.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/g, '')
  searchParams.EMP_NAME = ''
}
//사번 유효성 검사
const inputEMP_NAME = () => {
  searchParams.EMP_NO = ''
}

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  //console.log('tab.value : ',tab.value)
  if(tab.value === 'one'){
    if(btn.id === 'btnSearch'){ //조회
      new queryFlowHelper(vm, t)
          .setGridList([grdTab01Main])
          .setBefore(beforeSearch1)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
    }
    else if(btn.id === 'btnPointChange'){ //포인트 전환
      pointChange()
    }
  }
  else if(tab.value === 'two'){
     if(btn.id === 'btnSearch'){ //조회
        new queryFlowHelper(vm, t)
        .setGridList([grdTab02Main])
        .setBefore(beforeSearch2)
        .setQuery(searchDataSecond)
        .setAfter(afterSearchSecond)
        .run()
     }
  }else if(tab.value === 'three'){
    if(btn.id === 'btnSearch'){ //조회
      new queryFlowHelper(vm, t)
        .setGridList([grdTab03Main])
        .setBefore(beforeSearch3)
        .setQuery(searchDataThird)
        .setAfter(afterSearchThird)
        .run()
    }
  }
}

// 포인트 전환 팝업
const pointChange = e => {
  if(userStore.empNo===searchParams.EMP_NO && userStore.empNm===searchParams.EMP_NAME){
    if(searchParams.TOTAL_POINT <= 0){
      Message.warn(t('포인트가 1이상일 경우만 사용 가능 합니다.'))
      return
    }
    let popupParam = {
        EMP_NO : searchParams.EMP_NO, // 사번
        EMP_NAME : searchParams.EMP_NAME, // 성명
        TOTAL_POINT : searchParams.TOTAL_POINT, //포인트
        TOTAL_POINT_NM : searchParams.TOTAL_POINT_NM, //포인트
      }
      eEDUDB0020Popup_01.value.openPopup(popupParam)
  }else{
    Message.warn(t('로그인 한 본인만 사용 가능 합니다.'))
    return
  }
  
}

// 포인트 전환 팝업창이 닫혔을때 리로드.
const onPointChangeData = val => {
  //console.log('val : ', val)
  if(!val){
    return
  }
  onButtonsClick({ id : 'btnSearch' })
}


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
const beforeSearch1 = () => {
  if (searchParams.EMP_NAME === '' && searchParams.EMP_NO === '' && searchParams.BSNS_CD === '' &&  searchParams.ACCUMULATED_CONTENT_CD === ''  ){
    Message.warn('조회조건을 입력해주세요: 사번/이름/사업부/적립컨텐츠 中 1개 이상')
    return false
  }
  return true
}

const beforeSearch2 = () => {
  return true
}

//관리자 조회 전 유효성 검사
const beforeSearch3 = () => {


  if (searchParams3.EMP_NAME === '' && searchParams3.EMP_NO === '' && searchParams3.BSNS_CD === '' &&  searchParams3.ACCUMULATED_CONTENT_CD === ''  ){
    Message.warn('조회조건을 입력해주세요: 사번/이름/사업부/적립컨텐츠 中 1개 이상')
    return false
  }


  return true
}


//개인 조회
const searchData = () => {
  console.log("조회 파라미터 ::::::: ",searchParams)
  return commonSearchApi({ queryId : 'EDUDB0020_TAB01_SEARCH_01', param: searchParams })
}

//개인 조회 후
const afterSearch = res => {
  console.log("조회된 데이터 확인",res)
  gridRefresh('grdTab01Main')
  grdTab01Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR2!=null){
    //console.log("res.ORESULT_CUR2 : ", res.ORESULT_CUR2)
    searchParams.TOTAL_POINT = res.ORESULT_CUR2[0].TOTAL_POINT
    searchParams.TOTAL_POINT_NM = res.ORESULT_CUR2[0].TOTAL_POINT.toLocaleString("en-US")
    //searchParams.TOTAL_POINT = 0
    //searchParams.TOTAL_POINT_NM = '0'
    if(searchParams.TOTAL_POINT < 1){
      //console.log("0이상일때 여기 왔으면 한다")
      point.value.disableBtn('btnPointChange', true)
    }else{
      point.value.disableBtn('btnPointChange', false)  
    }
    
  }else{
    searchParams.TOTAL_POINT = 0
    searchParams.TOTAL_POINT_NM = '0'
    point.value.disableBtn('btnPointChange', true)
  }
}

//##################################################### Second #####################################################################
//조직 조회 전 유효성 검사
const beforeSearchSecond = () => {
  return true
}

//조직 조회
const searchDataSecond = () => {
  //console.log("조회 파라미터 ::::::: ",searchParams2)
  return commonSearchApi({ queryId : 'EDUDB0020_TAB02_SEARCH_01', param: searchParams2 })
}
//조직 조회 후
const afterSearchSecond = res => {
  //console.log("조회된 데이터 확인",res)
  gridRefresh('grdTab02Main')
  grdTab02Main.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//##################################################### Third #####################################################################
//운영자 조회 전 유효성 검사
const beforeSearchThird = () => {
  return true
}

//운영자 조회
const searchDataThird = () => {
  //console.log("조회결과 확인",searchParams3)
  return commonSearchApi({ queryId : 'EDUDB0020_TAB03_SEARCH_01', param: searchParams3 })
}
//운영자 조회 후
const afterSearchThird = res => {
  //console.log("조회된 데이터 확인",res)
  gridRefresh('grdTab03Main')
  grdTab03Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  //status()
}

//*****************************************조회 영역(종료)***********************************************************/

// 부서 탭 렌더링:  부서장(GRP00387),  운영과장(GRP00388), 직책과장(GRP00389), 포상모듈 담당자(GRP00378), admin (HIWAYGRP00001) 

const IsDeptShow =  userStore.authGrpCd.includes('GRP00378') 


onMounted( () => {

  console.log('IsDeptShow: ', IsDeptShow)
  console.log('userStore.authGrpCd: ', userStore.authGrpCd)
  

  initCodeList()
  // 행 병합 그룹핑(mergeMode)을 사용하면 groupPanel.visible 사용할 필요가 없으며, 대신 groupBy 세팅된 순서대로 컬럼이 이동됨
  //grdTab03Main.value.getGridView().groupPanel.visible = false //그룹패널 안보이게하기
  grdTab03Main.value.getGridView().groupBy(["BSNS_COMP_NM","ASGN_NAME"]) //BSNS_COMP_NM,ASGN_NAME 기준으로 그룹핑
  grdTab03Main.value.getGridView().setRowGroup
  ({ 
    expandedAdornments: "footer"  //그룹을 펼쳤을때 FOOTER만 보이기
    //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
    , mergeExpanderVisibility: "none" //그룹 접기 여부 화면에 안보이게하기
    , mergeMode: true // 행 병합 그룹핑 활성화
    //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
  })
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
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="mb-2">
        <v-tabs v-model="tab">
          <v-tab value="one">개인</v-tab>
          <v-tab value="two">부서/협력사</v-tab>
          <v-tab value="three" v-if = "IsDeptShow">관리자용</v-tab>
        </v-tabs>
      </v-sheet>
    </v-card-title>
    <v-card-text v-show="tab == 'one'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('년도')"
              labelWidth="26px"
              width="130px"
              v-model="searchParams.YEAR"
              type="YEAR"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('회사구분')"
              labelWidth="52px"
              width="250px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              labelWidth="39px"
              width="300px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              labelWidth="26px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('소속구분')"
              width="180px"
              labelWidth="52px"
              v-model="searchParams.ORGN_DIV"
              :items="codeList.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('협력사')"
              labelWidth="39px"
              width="250px"
              v-model="searchParams.ASGN_CD"
              :items="codeList.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('적립컨텐츠')"
              labelWidth="65px"
              width="250px"
              v-model="searchParams.ACCUMULATED_CONTENT_CD"
              :items="codeList.accumulatedContentCd"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input labelWidth="52px" width="200px" 
              :label="$t('적립기간')" type="date"
              v-model="searchParams.ACCUMULATED_DATE_FROM"
              margin="10px"
            />
            <i-input width="155px"
              :label="$t('-')" type="date"
              v-model="searchParams.ACCUMULATED_DATE_TO"
            />
            <i-input 
              :label="$t('사번')"
              labelWidth="26px"
              width="200px"
              v-model="searchParams.EMP_NO"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/, '');"
              maxlength="20"
              @input="inputEMP_NO"
              :readonly="logsStore.isMenuAdmin != 'Y'"
            />
            <i-input 
              :label="$t('성명')"
              labelWidth="26px"
              width="200px"
              v-model="searchParams.EMP_NAME"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              korean
              maxlength="500"
              @input="inputEMP_NAME"
              :readonly="logsStore.isMenuAdmin != 'Y'"
            />
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet height="78%" >
          <v-sheet class="d-flex justify-end mb-2" >
            <i-input
              :label="$t('내 포인트')"
              label-width="60px"
              width="200px"
              margin="0px"
              v-model="searchParams.TOTAL_POINT_NM"
              reverse
              readonly
            />
            <!-- <IButtonList
              :button-list="['btnPointChange']"
              @click-button="onButtonsClick"
              ref="point"
            /> -->
          </v-sheet>
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
            <i-select
              :label="$t('년도')"
              labelWidth="26px"
              width="130px"
              v-model="searchParams2.YEAR"
              type="YEAR"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('회사구분')"
              labelWidth="52px"
              width="250px"
              v-model="searchParams2.CMPNY_DIV"
              :items="codeList2.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              labelWidth="39px"
              v-model="searchParams2.BSNS_CD"
              :items="codeList2.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab02Main')"
              readonly
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              labelWidth="26px"
              v-model="searchParams2.DEPT_CD"
              :items="codeList2.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh('grdTab02Main')"
              readonly
            />
            <i-select
              :label="$t('소속구분')"
              labelWidth="52px"
              width="180px"
              v-model="searchParams2.ORGN_DIV"
              :items="codeList2.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab02Main')"
              readonly
            />
            <i-select
              :label="$t('협력사')"
              labelWidth="39px"
              width="250px"
              v-model="searchParams2.ASGN_CD"
              :items="codeList2.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              @update:model-value="gridRefresh('grdTab02Main')"
              readonly
            />
            <i-select
              :label="$t('적립컨텐츠')"
              labelWidth="65px"
              width="250px"
              v-model="searchParams2.ACCUMULATED_CONTENT_CD"
              :items="codeList2.accumulatedContentCd"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input labelWidth="52px" width="200px" 
              :label="$t('적립기간')" type="date"
              v-model="searchParams2.ACCUMULATED_DATE_FROM"
              margin="10px"
            />
            <i-input width="155px"
              :label="$t('-')" type="date"
              v-model="searchParams2.ACCUMULATED_DATE_TO"
            />
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet height="78%" class="mb-2">
          <!-- 메인그리드 -->
          <RealGrid
            ref="grdTab02Main"
            :grid-view-option="grdTab02MainProps.gridViewOption"
            :fields="grdTab02MainProps.fields"
            :columns="grdTab02MainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <v-card-text v-show="tab == 'three'" v-if = "IsDeptShow" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('년도')"
              labelWidth="26px"
              width="130px"
              v-model="searchParams3.YEAR"
              type="YEAR"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('회사구분')"
              labelWidth="52px"
              width="250px"
              v-model="searchParams3.CMPNY_DIV"
              :items="codeList3.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              labelWidth="39px"
              v-model="searchParams3.BSNS_CD"
              :items="codeList3.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              labelWidth="26px"
              v-model="searchParams3.DEPT_CD"
              :items="codeList3.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('소속구분')"
              labelWidth="52px"
              width="180px"
              v-model="searchParams3.ORGN_DIV"
              :items="codeList3.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('협력사')"
              labelWidth="39px"
              width="250px"
              v-model="searchParams3.ASGN_CD"
              :items="codeList3.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
            <i-select
              :label="$t('적립컨텐츠')"
              labelWidth="65px"
              width="250px"
              v-model="searchParams3.ACCUMULATED_CONTENT_CD"
              :items="codeList3.accumulatedContentCd"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input labelWidth="52px" width="200px" 
              :label="$t('적립기간')" type="date"
              v-model="searchParams3.ACCUMULATED_DATE_FROM"
              margin="10px"
            />
            <i-input width="155px"
              :label="$t('-')" type="date"
              v-model="searchParams3.ACCUMULATED_DATE_TO"
            />

            <i-input 
              :label="$t('사번')"
              labelWidth="26px"
              width="200px"
              v-model="searchParams3.EMP_NO"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/, '');"
              maxlength="20"
              @input="inputEMP_NO"
            />
            <i-input 
              :label="$t('성명')"
              labelWidth="26px"
              width="200px"
              v-model="searchParams3.EMP_NAME"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[0-9~!@#$%^&*()_+|<>?:{}]/, '' );"
              maxlength="500"
              @input="inputEMP_NAME"
            />
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet height="78%">
          <!-- 메인그리드 -->
          <RealGrid
            ref="grdTab03Main"
            :grid-view-option="grdTab03MainProps.gridViewOption"
            :fields="grdTab03MainProps.fields"
            :columns="grdTab03MainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 포인트 전환 팝업 -->
    <EDUDB0020Popup_01
      ref="eEDUDB0020Popup_01"
      @saved="onPointChangeData"
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

