<!--
  화면명 : 관리감독자 안전평가
  화면개요 : 관리감독자 안전평가 조회 저장 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSearchApi3 } from '@hiway/api/commonApi'
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

defineOptions({
  name: '60_edu-EDU_D-EDUDA0030',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const searchAddParams= ref([])
const saveParams2= ref([])
const searchYn = ref(false) // 조회 여부
const onButtonsSub = ref(null)
const noFrdt = ref(false)
const noTodt = ref(false)
const noClssCd = ref(false)
let findIndex = 0

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'), // 년도
  MNTH : dayjs(new Date).format('MM'), // 월
  //YEAR : dayjs(new Date().setDate(new Date().getDate() - 365)).format('YYYY'),
  //MNTH : dayjs(new Date().setDate(new Date().getDate() - 31)).format('MM'),
  MNG_SUPERVISOR_SAFETY_SEQ : '', // 관리감독자 안전평가 마스터 SEQ
})

const saveParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  FRDT : dayjs(new Date()).subtract(7,'M').format('YYYY-MM-DD'), // 기간 시작
  TODT : dayjs(new Date()).subtract(1,'M').format('YYYY-MM-DD'), // 기간 끝
  CLSS_CD : '', //과/팀
})

// 배점기준
const searchParams2 = reactive({
  RULE_01 : '', // 절대수칙
  RULE_02 : '', // 일반수칙
  RULE_03 : '', // 교통수칙
  RULE_04 : '', // 작업중지
  RULE_05 : '', // 시정통보
  ACCIDENT_01 : '', // 일반사고
  ACCIDENT_02 : '', // 휴업사고
  ACCIDENT_03 : '', // 산재사고
  ACCIDENT_04 : '', // 중대성사고
  ACCIDENT_05 : '', // 중대재해
  REWARD : '', // 칭찬쿠폰상수
  REWARD03 : '', // 안전점검상수
  REWARD02 : '', // 위험제보
  SAFETY_RULES : 40, // 안전수칙 총합
  SAFETY_ACCIDENT : 30, // 안전사고 총합
  SAFETY_EDU : 10, // 안전교육 총합
  DANGER : 10, // 위험성평가 총합
  SAFETY_REWARD : 10, // 안전활동 총합
  SAFETY_REWARD_01 : 5, // 안전칭찬쿠폰
  SAFETY_REWARD_03 : 5, // 안전점검
})

const totalPointParams = reactive({
  RULE_POINT : 0, // 안전수칙
  ACCIDENT_POINT : 0, // 안전사고
  EDU_POINT : 0, // 안전교육(관리감독자)
  REWARD_01_POINT : 0, // 안전칭찬쿠폰
  REWARD_03 : 0, // 안전점검
  REWARD_POINT : 0, // 안전활동(안전칭찬쿠폰+안전점검)
})


//배점기준 리스트 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { header: { height: 90 }, checkBar: { visible: false }, stateBar: { visible: false } },
  fields : [ 
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false, sortable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, styleName: 'left-column', editable: false, sortable: false, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName: 'left-column', editable: false, sortable: false, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('과/팀') }, styleName: 'left-column', editable: false, sortable: false },
    { fieldName: 'USER_CNT', dataType: 'text', header: { text: t('인원') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('직책과장/\n생산팀장'), styleName: 'header_column' }, editable: false, sortable: false },
    { fieldName: 'RULE_01', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('절대수칙') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'RULE_02', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('일반수칙') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'RULE_03', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('교통수칙') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'RULE_04', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('작업중지') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'RULE_05', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('시정통보') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'RULE_SUM_01', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('감점합') }, styleName: 'right-column sum-column', editable: false, sortable: false },
    { fieldName: 'RULE_POINT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('수칙점수') }, styleName: 'right-column editable_column', editable: false, sortable: false },
    { fieldName: 'ACCIDENT_01', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('일반사고') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'ACCIDENT_02', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('휴업사고') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'ACCIDENT_03', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('산재사고') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'ACCIDENT_04', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('중대성사고') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'ACCIDENT_05', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('중대재해') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'ACCIDENT_SUM_01', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('감점합') }, styleName: 'right-column sum-column', editable: false, sortable: false },
    { fieldName: 'ACCIDENT_POINT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('사고점수') }, styleName: 'right-column editable_column', editable: false, sortable: false },
    { fieldName: 'MNG_ALL_CNT', dataType: 'number', numberFormat: "#,###", header: { text: t('총원(명)') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'MNG_EDU_DIV_Y', dataType: 'number', numberFormat: "#,###", header: { text: t('이수인원(명)') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'MNG_EDU_RATIO', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('이수율(%)') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'MNG_EDU_YN', dataType: 'text', header: { text: t('적합여부') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'EDU_SUM_01', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수(10점)') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'EDU_POINT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('가점합') }, styleName: 'right-column editable_column', editable: false, sortable: false },
    { fieldName: 'DANGER_BASIC_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('부서작업표준 건수') }, styleName: 'right-column', editable: false },
    { fieldName: 'DNAGER_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('위험성평가 이행건수') }, styleName: 'right-column', editable: false },
    { fieldName: 'DANGER_RATIO', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('이행률(%)') }, styleName: 'right-column', editable: false },
    { fieldName: 'DANGER_YN', dataType: 'text', header: { text: t('적합여부') }, editable: false },
    { fieldName: 'DANGER_POINT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column editable_column', editable: false },
    { fieldName: 'DANGER_TOTAL', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('가점합') }, styleName: 'right-column editable_column', editable: false },
    { fieldName: 'REWARD_01', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('건수') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'REWARD_01_POINT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수(5점)') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'WORK_DAYS', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('기준일수') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'REG_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('건수') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'REG_RATIO', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('등록율') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'REWARD_03', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수(5점)') }, styleName: 'right-column', editable: false, sortable: false },
    { fieldName: 'REWARD_POINT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('가점합') }, styleName: 'right-column editable_column', editable: false, sortable: false },
    { fieldName: 'TOTAL_POINT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('합계점수') }, styleName: 'right-column editable_column', editable: false, sortable: false },
    { fieldName: 'SAGO_HIDE_CNT', dataType: 'number', numberFormat: "#,##0.#"
      ,header: { 
            text: '사고은폐',
            template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
            values: { 'headerText': t('사고은폐')}
          }
    , styleName: 'right-column', editable: false, sortable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_CD2', dataType: 'text', visible: false },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_NO', dataType: 'text', visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false },
    { fieldName: 'MNG_SUPERVISOR_SAFETY_SEQ', dataType: 'text', visible: false },
    { fieldName: 'MNG_SUPERVISOR_DETAIL_SEQ', dataType: 'text', visible: false },
    { fieldName: 'WK_REL_CD', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: 
  ['BSNS_NM','PART_NM','DEPT_NM','ASGN_NM','USER_CNT','KOR_NM',
    {
      name: 'SAFETY_RULES',
      fieldName : 'SAFETY_RULES',
      direction: 'horizontal',
      items: [ 'RULE_01', 'RULE_02', 'RULE_03', 'RULE_04', 'RULE_05', 'RULE_SUM_01', 'RULE_POINT' ],
      header: { 
        text: '안전수칙(40점)',
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전수칙(40점)')}
      },
    },
    {
      name: 'SAFETY_ACCIDENT',
      direction: 'horizontal',
      items: [ 'ACCIDENT_01', 'ACCIDENT_02', 'ACCIDENT_03', 'ACCIDENT_04', 'ACCIDENT_05', 'ACCIDENT_SUM_01', 'ACCIDENT_POINT' ],
      header: { 
        text: '안전사고(30점)',
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { 'headerText': t('안전사고(30점)')}
      },
    },
    {
      name: '안전활동 (10점)',
      direction: 'horizontal',
      items: 
      [
        {
          name: 'REWARD',
          direction: 'horizontal',
          items: [ 'REWARD_01', 'REWARD_01_POINT'],
          header: { 
            text: '안전칭찬쿠폰',
            template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
            values: { 'headerText': t('안전칭찬쿠폰')}
          },
        },
        {
            name: 'REWARD2',
            direction: 'horizontal',
            items: [ 'WORK_DAYS', 'REG_CNT', 'REG_RATIO', 'REWARD_03' ],
            header: { 
            text: '안전점검',
            template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
            values: { 'headerText': t('안전점검')}
          },
        },
        {
            column: "REWARD_POINT"
        },
      ],
      header: { text: t('안전활동 (10점)') },
    },
    {
      name: 'DANGER',
      direction: 'horizontal',
      items: ['DANGER_BASIC_CNT', 'DNAGER_CNT', 'DANGER_RATIO', 'DANGER_YN', 'DANGER_POINT', 'DANGER_TOTAL'],
      header: { 
        text: '위험성평가(10점)',
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { 'headerText': t('위험성평가(10점)')}
      },
    },
    {
      name: '안전교육(10점)',
      direction: 'horizontal',
      items: 
      [
        {
          name: 'EDU_MNG_SUPERVISOR',
          direction: 'horizontal',
          items: [ 'MNG_ALL_CNT', 'MNG_EDU_DIV_Y', 'MNG_EDU_RATIO', 'MNG_EDU_YN', 'EDU_SUM_01' ],
          header: { 
            text: '관리감독자',
            template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
            values: { 'headerText': t('관리감독자')}
          },
        },
        {
            column: "EDU_POINT"
        },
      ],
      header: { text: t('안전교육(10점)') },
    },
    'TOTAL_POINT',
    {
      name: '포상제외',
      direction: 'vertical',
      items: 
      [
        {
          column: "SAGO_HIDE_CNT"
        },
      ],
      header: { text: t('포상제외') },
    },
  ],
})
// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
const codeList = reactive({
  year : [], // 년도
  mnth : [], // 월
  mngSupervisorSafetySeq : [{ TXT: '선택', COD: '' }], // 버전
  clssCd: [{ TXT: '과', COD: '60' }, { TXT: '팀', COD: '70' }], //과/팀
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'EDUDA0040_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv,SCORING_CRITERIA_CD:'30', USE_YN: 'Y', DEL_YN: 'N' } }), // 배점기준
    commonSearchApi({ queryId : 'EDUDA0030_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv} }), // 년도
    commonSearchApi({ queryId : 'EDUDA0030_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY')} }), // 월
    commonSearchApi({ queryId : 'EDUDA0030_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY'), MNTH : dayjs(new Date).format('MM')} }), // 버전
  ]).then(res => {
    //console.log("레스 확인",res)
    console.log("인잇리스트 확인",res)
    // 배점기준
    res[0].ORESULT_CUR.forEach( value => {
       //console.log("value : ",value)
      // console.log("SCORING_CRITERIA_CD : ",value.SCORING_LIST_CD)
      if(value.SCORING_LIST_CD ==='10'){
        searchParams2.RULE_01 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='20'){
        searchParams2.RULE_02 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='30'){
        searchParams2.RULE_03 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='40'){
        searchParams2.RULE_04 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='50'){
        searchParams2.RULE_05 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='60'){
        searchParams2.ACCIDENT_01 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='70'){
        searchParams2.ACCIDENT_02 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='80'){
        searchParams2.ACCIDENT_03 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='90'){
        searchParams2.ACCIDENT_04 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='100'){
        searchParams2.ACCIDENT_05 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='110'){
        searchParams2.REWARD = value.SCORING
      }else if(value.SCORING_LIST_CD ==='120'){
        searchParams2.REWARD03 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='130'){
        searchParams2.REWARD02 = value.SCORING
      }else if(value.SCORING_LIST_CD ==='220'){
        searchParams2.DANGER = value.SCORING
      }
    })

    saveParams.CLSS_CD = codeList.clssCd[0].COD

    if(res[1].ORESULT_CUR.length!=0){
      codeList.year = res[1].ORESULT_CUR
      findIndex = res[1].ORESULT_CUR.findIndex(item => item.COD == searchParams.YEAR)
      if(findIndex < 0){
          findIndex = 0
      }
      searchParams.YEAR = codeList.year[findIndex].COD
    }

    if(res[2].ORESULT_CUR.length!=0){
      codeList.mnth = res[2].ORESULT_CUR
      findIndex = res[2].ORESULT_CUR.findIndex(item => item.COD == searchParams.MNTH)
      if(findIndex < 0){
          findIndex = 0
      }
      searchParams.MNTH = codeList.mnth[findIndex].COD
    }
   
    if(res[3].ORESULT_CUR.length!=0){
      codeList.mngSupervisorSafetySeq = res[3].ORESULT_CUR
      searchParams.MNG_SUPERVISOR_SAFETY_SEQ = codeList.mngSupervisorSafetySeq[0].COD
    }

  }).finally(() => {

  })
}

// 년도 바뀌면 월 데이터 및 버전 데이터 변경
watch(() => searchParams.YEAR, async (newValue, oldValue) => {
  //searchParams.MNTH = ''
  // console.log('searchParams.YEAR newValue : ', newValue)
  // console.log('searchParams.YEAR oldValue : ', oldValue)
  if(newValue !== oldValue){
    // 월 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0030_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : newValue } }) // 월
      .then(res => {
        console.log('searchParams.MNTH : ', res)
        if(res.ORESULT_CUR.length!=0){
          codeList.mnth = res.ORESULT_CUR
          searchParams.MNTH = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})

// 월 데이터 바뀌면 버전 데이터 변경
watch( () => searchParams.MNTH, async (newValue,oldValue) => {
  // console.log('searchParams.MNTH newValue : ', newValue)
  // console.log('searchParams.MNTH oldValue : ', oldValue)
  if(newValue !== oldValue){
    searchParams.MNG_SUPERVISOR_SAFETY_SEQ = ''
    // 버전 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0030_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchParams.YEAR, MNTH : newValue } }) // 버전
      .then(res => {
        //console.log('searchParams.MNTH res  : ', res.ORESULT_CUR)
        if(res.ORESULT_CUR.length!=0){
          codeList.mngSupervisorSafetySeq = res.ORESULT_CUR
          searchParams.MNG_SUPERVISOR_SAFETY_SEQ = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})



//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){ //조회
    new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
  else if(btn.id === 'btnUpdate'){ //저장
    new saveFlowHelper(vm, t)
    //.setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(validationCheck)
    .setQuery(saveData)
    .setAfter(afterSaveData)
    .run()
  }
}
const onButtonsSubClick = btn => {
  if(btn.id === 'btnTargetSearch'){ //대상자 조회
    new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setBefore(beforeSearch2)
        .setQuery(searchData2)
        .setAfter(afterSearch2)
        .run()
  }else if(btn.id === 'btnNewSave'){ //저장
    new saveFlowHelper(vm, t)
    .setGridList([grdMain])
    .setBefore(beforeSearch3)
    .setQuery(saveData2)
    .setAfter(afterSaveData2)
    .run()
  }
  else if(btn.id === 'btnReset'){ //초기화
    gridRefresh('grdMain')
    searchYn.value = false
    controllerSetting()
  }
}

// 안전수칙 조회
const safetyRules = () =>{
  new queryFlowHelper(vm, t)
    //.setGridList([grdMain])
    .setBefore(beforeSearch3)
    .setQuery(searchData3)
    .setAfter(afterSearch3)
    .run()
}

// 안전사고 조회
const safetyAccident = () =>{
  new queryFlowHelper(vm, t)
    //.setGridList([grdMain])
    .setBefore(beforeSearch3)
    .setQuery(searchData4)
    .setAfter(afterSearch4)
    .run()
}

// 관리감독자 조회
const eduMngSupervisor = () =>{
  new queryFlowHelper(vm, t)
    //.setGridList([grdMain])
    .setBefore(beforeSearch3)
    .setQuery(searchData5)
    .setAfter(afterSearch5)
    .run()
}

// 안전칭찬쿠폰 조회
const reWard = () =>{
  new queryFlowHelper(vm, t)
    //.setGridList([grdMain])
    .setBefore(beforeSearch3)
    .setQuery(searchData6)
    .setAfter(afterSearch6)
    .run()
}

// 안전점검 조회
const reWard2 = () =>{
  // new queryFlowHelper(vm, t)
  //   //.setGridList([grdMain])
  //   .setBefore(beforeSearch3)
  //   .setQuery(searchData7)
  //   .setAfter(afterSearch7)
  //   .run()

  search_07()

}
// 사고은폐 조회
const sagoHideCnt = () =>{
  new queryFlowHelper(vm, t)
    //.setGridList([grdMain])
    .setBefore(beforeSearch3)
    .setQuery(searchData8)
    .setAfter(afterSearch8)
    .run()
}
//위험성평가 조회
const dangerCnt = () => {
  new queryFlowHelper(vm, t)
    //.setGridList([grdMain])
    .setBefore(beforeSearch3)
    .setQuery(searchData9)
    .setAfter(afterSearch9)
    .run()
}


const onCellClicked = (grid, clickData) => {
  if(clickData.column === 'SAFETY_RULES' && clickData.cellType === 'header' ){
    //console.log('안전수칙 관련 검색')
    safetyRules()
  }else if(clickData.column === 'SAFETY_ACCIDENT' && clickData.cellType === 'header' ){
    //console.log('안전사고 관련 검색')
    safetyAccident()
  }else if(clickData.column === 'EDU_MNG_SUPERVISOR' && clickData.cellType === 'header' ){
    //console.log('관리감독자')
    eduMngSupervisor()
  }else if(clickData.column === 'REWARD' && clickData.cellType === 'header' ){
    //console.log('안전칭찬쿠폰')
    reWard()
  }else if(clickData.column === 'REWARD2' && clickData.cellType === 'header' ){
    //console.log('안전점검')
    reWard2()
  }
  else if(clickData.column === 'SAGO_HIDE_CNT' && clickData.cellType === 'header' ){
    //console.log('사고은폐')
    sagoHideCnt()
  }else if(clickData.column === 'DANGER' && clickData.cellType === 'header' ){
    //console.log('위험성평가')
    dangerCnt()
  }
}

// 저장 사용자 정의 validation
const validationCheck = value => {
  //console.log("저장 여기 오냐?")
  //saveParams2.value = []
  saveParams2.value = grdMain.value.getDataProvider().getJsonRows()
  //console.log("저장 파라메트", saveParams2.value)
  return true
}

//그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdMain'){
    grdMain.value.getDataProvider().setRows([])
  }
}

//널값체크후 숫자 리턴
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? 0 : Number(val)
}

//기간 시작(FR)이 TO보다 높을 경우 경고
const dateFrChanged = data => {
  if(data.target.value > saveParams.TODT){
    Message.warn(t('시작기간이 끝 기간보다 높으면 안됩니다.'))
    saveParams.FRDT = dayjs(new Date()).subtract(7,'M').format('YYYY-MM-DD') // 기간 시작
  }
}

//기간 끝(TO)이 FR보다 낮을 경우 경고
const dateToChanged = data => {
  if(data.target.value < saveParams.FRDT){
    Message.warn(t('끝기간이 시작기간보다 낮으면 안됩니다.'))
    saveParams.TODT = dayjs(new Date()).subtract(1,'M').format('YYYY-MM-DD') // 기간 끝
  }
}
// 검색여부에 따라서 버튼 활성화 및 비활성화
// 조회를 했으면 기간/과팀/대상자검색/신규저장 비활성화
// onButtonsSub
// menuTitle
/* ******************* true: 비활성화 , false: 활성화 ******************** */
const controllerSetting = () => {
  if(searchYn.value){
    //console.log('조회버튼 클릭')
    // 조회버튼을 클릭했을때
    menuTitle.value.disableBtn('btnUpdate', false)
    onButtonsSub.value.disableBtn('btnTargetSearch', true)
    onButtonsSub.value.disableBtn('btnNewSave', true)
    onButtonsSub.value.disableBtn('btnReset', false)
    noFrdt.value = true
    noTodt.value = true
    noClssCd.value = true
  }else{
    //console.log('조회버튼 안클릭')
    // 조회버튼을 클릭 안했을때
    onButtonsSub.value.disableBtn('btnTargetSearch', false)
    onButtonsSub.value.disableBtn('btnNewSave', false)
    onButtonsSub.value.disableBtn('btnReset', true)
    menuTitle.value.disableBtn('btnUpdate', true)
    noFrdt.value = false
    noTodt.value = false
    noClssCd.value = false
  }
}



// const totalPointParams = reactive({
//   RULE_POINT : 0, // 안전수칙
//   ACCIDENT_POINT : 0, // 안전사고
//   EDU_POINT : 0, // 안전교육(관리감독자)
//   REWARD_01_POINT : 0, // 안전칭찬쿠폰
//   REWARD_03 : 0, // 안전점검
//   REWARD_POINT : 0, // 안전활동(안전칭찬쿠폰+안전점검)
// })
// 토탈 점수 계산
// const totalPoint = (val) => {

// }



//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  // 2024.08.22 박용훈 버전을 선택 해야만 조회가 되도록 수정함
  if(searchParams.MNG_SUPERVISOR_SAFETY_SEQ === ''){
    Message.warn(t('버전을 선택 하셔야 합니다.'))
    return false
  }
  return true
}

//대상조회, 인원수조회 전 유효성 검사
const beforeSearch2 = () => {
  return true
}

// 안전수칙 조회 전 유효성 검사
const beforeSearch3 = () => {
  //console.log('grdMain.value.getGridView().getItemCount() : ', grdMain.value.getGridView().getItemCount())
  // 대상자가 검색이 안되었을때는 동작하면 안됨
  if(grdMain.value.getGridView().getItemCount() <= 0){
    Message.warn(t('대상자 검색부터 하셔야 합니다.'))
    return false  
  }
  return true
}

//배점기준 리스트 조회
const searchData = idx => {
  gridRefresh('grdMain')
  //console.log('searchParams : ',searchParams)
  return commonSearchApi({ queryId : 'EDUDA0030_SEARCH_01', param: searchParams })
}

//대상조회, 인원수 조회
const searchData2 = idx => {
  gridRefresh('grdMain')
  //console.log('saveParams : ',saveParams)
  return commonSearchApi({ queryId : 'EDUDA0030_SEARCH_02', param: saveParams })
}

//안전수칙 조회
const searchData3 = idx => {
  //console.log('saveParams : ',saveParams)
  return commonSearchApi({ queryId : 'EDUDA0030_SEARCH_03', param: saveParams })
}

//안전사고 조회
const searchData4 = idx => {
  //console.log('saveParams : ',saveParams)
  return commonSearchApi({ queryId : 'EDUDA0030_SEARCH_04', param: saveParams })
}

//관리감독자 조회
const searchData5 = idx => {
  searchAddParams.value = []
  let data = ref([])
  let grdMainData = ref([]) // 그리드 데이터 
  for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
    grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
    data = {
      CMPNY_DIV : grdMainData.CMPNY_DIV
      , BSNS_CD : grdMainData.BSNS_CD
      , DEPT_CD : grdMainData.DEPT_CD
      , ASGN_CD : grdMainData.ASGN_CD
      , FRDT : saveParams.FRDT
      , TODT : saveParams.TODT
      , CLSS_CD : saveParams.CLSS_CD
    }
    searchAddParams.value.push(data)
  }
  //console.log('searchAddParams.value : ',searchAddParams.value)
  return commonSearchApi3({ queryId : 'EDUDA0030_SEARCH_05', list: searchAddParams.value })
}

//관리감독자 조회
const searchData6 = idx => {
  //console.log('saveParams : ',saveParams)
  //return false
  return commonSearchApi({ queryId : 'EDUDA0030_SEARCH_06', param: saveParams })
}

//안전점검 조회
const searchData7 = idx => {
  searchAddParams.value = []
  let data = ref([])
  let grdMainData = ref([]) // 그리드 데이터 
  for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
    grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
    data = {
      CMPNY_DIV : grdMainData.CMPNY_DIV
      , FRDT : saveParams.FRDT
      , TODT : saveParams.TODT
      , EMP_NO : grdMainData.EMP_NO
    }
    searchAddParams.value.push(data)
  }

  // data = {
  //     CMPNY_DIV : 'HHI'
  //     , FRDT : '2022-08-26'
  //     , TODT : '2023-02-26'
  //     , EMP_NO : 'A368490'
  //   }
  //   searchAddParams.value.push(data)
  //   data = {
  //     CMPNY_DIV : 'HHI'
  //     , FRDT : '2022-08-26'
  //     , TODT : '2023-02-26'
  //     , EMP_NO : 'A413461'
  //   }
  //   searchAddParams.value.push(data)
  //   data = {
  //     CMPNY_DIV : 'HHI'
  //     , FRDT : '2022-08-26'
  //     , TODT : '2023-02-26'
  //     , EMP_NO : 'A448184'
  //   }
  //   searchAddParams.value.push(data)

  //console.log('searchAddParams.value : ',searchAddParams.value)
  console.log("안점점검 조회 ", searchAddParams.value)
  return commonSearchApi3({ queryId : 'EDUDA0030_SEARCH_07', list: searchAddParams.value })
}
//사고은폐 조회
const searchData8 = idx => {
  console.log('사고은폐 조회 : ',saveParams)
  return commonSearchApi({ queryId : 'EDUDA0030_SEARCH_08', param: saveParams })
}

//위험성평가 조회
const searchData9 = idx => {
  console.log('saveParams : ',saveParams)
  return commonSearchApi({ queryId : 'EDUDA0030_SEARCH_09', param: saveParams })
}


//배점기준 리스트 조회 후
const afterSearch = res => {
  console.log("메인 리스트 조회 조건",res)
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  // console.log('res.ORESULT_CUR2 : ',res.ORESULT_CUR2)
  if(res.ORESULT_CUR.length!=0){
    searchYn.value = true
    saveParams.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
    saveParams.FRDT = dayjs(res.ORESULT_CUR[0].FRDT).format('YYYY-MM-DD')
    saveParams.TODT = dayjs(res.ORESULT_CUR[0].TODT).format('YYYY-MM-DD')
    saveParams.CLSS_CD = res.ORESULT_CUR[0].CLSS_CD
    searchParams2.RULE_01 = res.ORESULT_CUR[0].RULE_01 // 절대수칙
    searchParams2.RULE_02 = res.ORESULT_CUR[0].RULE_02 // 일반수칙
    searchParams2.RULE_03 = res.ORESULT_CUR[0].RULE_03 // 교통수칙
    searchParams2.RULE_04 = res.ORESULT_CUR[0].RULE_04 // 작업중지
    searchParams2.RULE_05 = res.ORESULT_CUR[0].RULE_05 // 시정통보
    searchParams2.ACCIDENT_01 = res.ORESULT_CUR[0].ACCIDENT_01 // 일반사고
    searchParams2.ACCIDENT_02 = res.ORESULT_CUR[0].ACCIDENT_02 // 휴업사고
    searchParams2.ACCIDENT_03 = res.ORESULT_CUR[0].ACCIDENT_03 // 산재사고
    searchParams2.ACCIDENT_04 = res.ORESULT_CUR[0].ACCIDENT_04 // 중대성사고
    searchParams2.ACCIDENT_05 = res.ORESULT_CUR[0].ACCIDENT_05 // 중대재해
    searchParams2.REWARD = res.ORESULT_CUR[0].REWARD // 칭찬쿠폰상수
    searchParams2.REWARD03 = res.ORESULT_CUR[0].REWARD03 // 안전점검상수
    searchParams2.REWARD02 = res.ORESULT_CUR[0].REWARD02 // 위험제보
    searchParams2.SAFETY_RULES = res.ORESULT_CUR[0].SAFETY_RULES // 안전수칙 총합
    searchParams2.SAFETY_ACCIDENT = res.ORESULT_CUR[0].SAFETY_ACCIDENT // 안전사고 총합
    searchParams2.SAFETY_EDU = res.ORESULT_CUR[0].SAFETY_EDU // 안전교육 총합
    searchParams2.DANGER = res.ORESULT_CUR[0].DANGER // 위험성평가 총합
    searchParams2.SAFETY_REWARD = res.ORESULT_CUR[0].SAFETY_REWARD // 안전활동 총합
    searchParams2.SAFETY_REWARD_01 = res.ORESULT_CUR[0].SAFETY_REWARD_01 // 안전칭찬쿠폰
    searchParams2.SAFETY_REWARD_03 = res.ORESULT_CUR[0].SAFETY_REWARD_03 // 안전점검
  }

  if(res.ORESULT_CUR2.length!=0){
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR2)
    controllerSetting()
  }
}

//
const afterSearch2 = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 안전수칙 조회후 
const afterSearch3 = res => {
  if(res.ORESULT_CUR.length!=0){
    let grdMainData = ref([]) // 그리드 데이터 
    let resData = ref([]) // 조회 데이터
    let bBreak = false // 
    for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
      //console.log('그리드 포문')
      grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
      bBreak = false
      //console.log('grdMainData : ',grdMainData)
      //console.log('grdMainData : ',grdMainData.CMPNY_DIV +' ' + grdMainData.ASGN_CD +' ' + grdMainData.BSNS_CD +' ' + grdMainData.DEPT_CD )
      for(let j=0; j <res.ORESULT_CUR.length;j++){
        resData = res.ORESULT_CUR[j]
        //console.log('resData : ',resData.CMPNY_DIV +' ' + resData.ASGN_CD +' ' + resData.BSNS_CD +' ' + resData.DEPT_CD )
        //console.log('resData : ',resData)
        if(grdMainData.CMPNY_DIV===resData.CMPNY_DIV && grdMainData.ASGN_CD===resData.ASGN_CD && grdMainData.BSNS_CD===resData.BSNS_CD && grdMainData.DEPT_CD===resData.DEPT_CD ){
        //if(grdMainData.ASGN_CD === resData.ASGN_CD){
          //console.log('값이 있음 : ', grdMainData.ASGN_CD + '   ' + resData.ASGN_CD)
          grdMain.value.getDataProvider().setValue(i, 'RULE_01', resData.RULE_01 )
          grdMain.value.getDataProvider().setValue(i, 'RULE_02', resData.RULE_02 )
          grdMain.value.getDataProvider().setValue(i, 'RULE_03', resData.RULE_03 )
          grdMain.value.getDataProvider().setValue(i, 'RULE_04', resData.RULE_04 )
          grdMain.value.getDataProvider().setValue(i, 'RULE_05', resData.RULE_05 )

          let RULE_SUM_01 = 0
          
          RULE_SUM_01 = ((resData.RULE_01 * Number(isNullCheck(searchParams2.RULE_01))) + (resData.RULE_02 * Number(isNullCheck(searchParams2.RULE_02))) + (resData.RULE_03 * Number(isNullCheck(searchParams2.RULE_03))) + (resData.RULE_04 * Number(isNullCheck(searchParams2.RULE_04))) + (resData.RULE_05 * Number(isNullCheck(searchParams2.RULE_05))))*-1
          grdMain.value.getDataProvider().setValue(i, 'RULE_SUM_01', RULE_SUM_01 )
          //console.log('RULE_SUM_01 : ',RULE_SUM_01)

          // 안전수칙 점수
          let RULE_POINT = 0 
          RULE_POINT = Number(isNullCheck(searchParams2.SAFETY_RULES)) + RULE_SUM_01
          //console.log('RULE_POINT : ',RULE_POINT)

          // 점수가 - 이면 0점 처리
          if(RULE_POINT<0){
            RULE_POINT = 0
          }
          grdMain.value.getDataProvider().setValue(i, 'RULE_POINT', RULE_POINT )

          // 전체점수 계산
          // totalPointParams.RULE_POINT = RULE_POINT
          // totalPointParams.ACCIDENT_POINT = grdMainData.ACCIDENT_POINT
          // totalPointParams.EDU_POINT = grdMainData.EDU_POINT
          // totalPointParams.REWARD_POINT = grdMainData.REWARD_POINT
          // totalPointParams.REWARD_01_POINT = grdMainData.REWARD_01_POINT
          // totalPointParams.REWARD_03 = grdMainData.REWARD_03


          let TOTAL_POINT = 0

          TOTAL_POINT = RULE_POINT 
          + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
          + Number(isNullCheck(grdMainData.EDU_POINT))  
          + Number(isNullCheck(grdMainData.REWARD_POINT))
          + Number(isNullCheck(grdMainData.DANGER_TOTAL))

          grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )

          bBreak = true
          break
        }
      }
      if(!bBreak){
        //console.log('중단된 값 : ', i)
        grdMain.value.getDataProvider().setValue(i, 'RULE_01', 0 )
        grdMain.value.getDataProvider().setValue(i, 'RULE_02', 0 )
        grdMain.value.getDataProvider().setValue(i, 'RULE_03', 0 )
        grdMain.value.getDataProvider().setValue(i, 'RULE_04', 0 )
        grdMain.value.getDataProvider().setValue(i, 'RULE_05', 0 )
        grdMain.value.getDataProvider().setValue(i, 'RULE_SUM_01', 0 )
        grdMain.value.getDataProvider().setValue(i, 'RULE_POINT', Number(isNullCheck(searchParams2.SAFETY_RULES)) )

        // 전체점수 계산
        let TOTAL_POINT = 0
        TOTAL_POINT = Number(isNullCheck(searchParams2.SAFETY_RULES)) 
        + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
        + Number(isNullCheck(grdMainData.EDU_POINT)) 
        + Number(isNullCheck(grdMainData.REWARD_POINT))
        + Number(isNullCheck(grdMainData.DANGER_TOTAL))
        
        //console.log('TOTAL_POINT : ',TOTAL_POINT)
        grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )
      }
    }
    grdMain.value.getGridView().commit()
  }
}

// 안전사고 조회후 
const afterSearch4 = res => {

  if(grdMain.value.getGridView().getItemCount() > 0){
    let grdMainData = ref([]) // 그리드 데이터 
    let resData = ref([]) // 조회 데이터
    let bBreak = false // 
    for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
      //console.log('안전사고 그리드 포문')
      grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
      bBreak = false
      //console.log('grdMainData : ',grdMainData)
      //console.log('grdMainData : ',grdMainData.CMPNY_DIV +' ' + grdMainData.ASGN_CD +' ' + grdMainData.BSNS_CD +' ' + grdMainData.DEPT_CD )
      for(let j=0; j <res.ORESULT_CUR.length;j++){
        resData = res.ORESULT_CUR[j]
        //console.log('resData : ',resData.CMPNY_DIV +' ' + resData.ASGN_CD +' ' + resData.BSNS_CD +' ' + resData.DEPT_CD )
        //console.log('resData : ',resData)
        if(grdMainData.CMPNY_DIV===resData.CMPNY_DIV && grdMainData.ASGN_CD===resData.ASGN_CD && grdMainData.BSNS_CD===resData.BSNS_CD && grdMainData.DEPT_CD===resData.DEPT_CD ){
        //if(grdMainData.ASGN_CD === resData.ASGN_CD){
          //console.log('값이 있음 : ', grdMainData.ASGN_CD + '   ' + resData.ASGN_CD)
          grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_01', resData.ACCIDENT_01 )
          grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_02', resData.ACCIDENT_02 )
          grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_03', resData.ACCIDENT_03 )
          grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_04', resData.ACCIDENT_04 )
          grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_05', resData.ACCIDENT_05 )

          let ACCIDENT_SUM_01 = 0 
          ACCIDENT_SUM_01 = ((resData.ACCIDENT_01 * Number(isNullCheck(searchParams2.ACCIDENT_01))) + (resData.ACCIDENT_02 * Number(isNullCheck(searchParams2.ACCIDENT_02))) + (resData.ACCIDENT_03 * Number(isNullCheck(searchParams2.ACCIDENT_03))) + (resData.ACCIDENT_04 * Number(isNullCheck(searchParams2.ACCIDENT_04)) + (resData.ACCIDENT_05 * Number(isNullCheck(searchParams2.ACCIDENT_05)))))*-1
          grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_SUM_01', ACCIDENT_SUM_01 )
          //console.log('ACCIDENT_SUM_01 : ',ACCIDENT_SUM_01)

          // 안전사고 점수
          let ACCIDENT_POINT = Number(isNullCheck(searchParams2.SAFETY_ACCIDENT)) + ACCIDENT_SUM_01
          //console.log('ACCIDENT_POINT : ',ACCIDENT_POINT)

          // 점수가 - 이면 0점 처리
          if(ACCIDENT_POINT<0){
            ACCIDENT_POINT = 0
          }
          //console.log('ACCIDENT_POINT2 : ',ACCIDENT_POINT)
          grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_POINT', ACCIDENT_POINT )

          // 전체점수 계산
          let TOTAL_POINT = 0
          TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
          + ACCIDENT_POINT 
          + Number(isNullCheck(grdMainData.EDU_POINT)) 
          + Number(isNullCheck(grdMainData.REWARD_POINT))
          + Number(isNullCheck(grdMainData.DANGER_TOTAL))
          
          //console.log('TOTAL_POINT : ',TOTAL_POINT)
          grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )

          bBreak = true
          break
        }
      }
      if(!bBreak){
        //console.log('중단된 값 : ', i)
        grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_01', 0 )
        grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_02', 0 )
        grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_03', 0 )
        grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_04', 0 )
        grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_05', 0 )
        grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_SUM_01', 0 )
        grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_POINT', Number(isNullCheck(searchParams2.SAFETY_ACCIDENT)) )

        // 전체점수 계산
        let TOTAL_POINT = 0
        TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
         + Number(isNullCheck(searchParams2.SAFETY_ACCIDENT))
         + Number(isNullCheck(grdMainData.EDU_POINT)) 
         + Number(isNullCheck(grdMainData.REWARD_POINT))
         + Number(isNullCheck(grdMainData.DANGER_TOTAL))
        
        //console.log('TOTAL_POINT : ',TOTAL_POINT)
        grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )
      }
    }
    grdMain.value.getGridView().commit()
  }
}
// 관리감독자 조회후 
const afterSearch5 = res => {
  if(grdMain.value.getGridView().getItemCount() > 0){
    let grdMainData = ref([]) // 그리드 데이터 
    let resData = ref([]) // 조회 데이터
    let bBreak = false // 
    for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
      //console.log('관리감독자 그리드 포문')
      grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
      bBreak = false
      //console.log('grdMainData : ',grdMainData)
      //console.log('grdMainData : ',grdMainData.CMPNY_DIV +' ' + grdMainData.ASGN_CD +' ' + grdMainData.BSNS_CD +' ' + grdMainData.DEPT_CD )
      for(let j=0; j <res.ORESULT_CUR.length;j++){
        resData = res.ORESULT_CUR[j]
        //console.log('resData : ',resData.CMPNY_DIV +' ' + resData.ASGN_CD +' ' + resData.BSNS_CD +' ' + resData.DEPT_CD )
        //console.log('resData : ',resData)
        if(grdMainData.CMPNY_DIV===resData.CMPNY_DIV && grdMainData.ASGN_CD===resData.ASGN_CD && grdMainData.BSNS_CD===resData.BSNS_CD && grdMainData.DEPT_CD===resData.DEPT_CD ){
        //if(grdMainData.ASGN_CD === resData.ASGN_CD){
          //console.log('값이 있음 : ', grdMainData.ASGN_CD + '   ' + resData.ASGN_CD)
          grdMain.value.getDataProvider().setValue(i, 'MNG_ALL_CNT', resData.MNG_ALL_CNT )
          grdMain.value.getDataProvider().setValue(i, 'MNG_EDU_DIV_Y', resData.MNG_EDU_DIV_Y )
          grdMain.value.getDataProvider().setValue(i, 'MNG_EDU_RATIO', resData.MNG_EDU_RATIO )
          grdMain.value.getDataProvider().setValue(i, 'MNG_EDU_YN', resData.MNG_EDU_YN )
          grdMain.value.getDataProvider().setValue(i, 'EDU_SUM_01', resData.EDU_SUM_01 )

          // let ACCIDENT_SUM_01 = 0 
          // ACCIDENT_SUM_01 = ((resData.ACCIDENT_01 * searchParams2.ACCIDENT_01) + (resData.ACCIDENT_02 * searchParams2.ACCIDENT_02) + (resData.ACCIDENT_03 * searchParams2.ACCIDENT_03) + (resData.ACCIDENT_04 * searchParams2.ACCIDENT_04) + (resData.ACCIDENT_05 * searchParams2.ACCIDENT_05))*-1
          // grdMain.value.getDataProvider().setValue(i, 'ACCIDENT_SUM_01', ACCIDENT_SUM_01 )
          // console.log('ACCIDENT_SUM_01 : ',ACCIDENT_SUM_01)

          // 안전사고 점수
          let EDU_POINT = resData.EDU_SUM_01
          //console.log('EDU_POINT : ',EDU_POINT)

          // // 점수가 - 이면 0점 처리
          // if(ACCIDENT_POINT<0){
          //   ACCIDENT_POINT = 0
          // }
          // console.log('ACCIDENT_POINT2 : ',ACCIDENT_POINT)
          grdMain.value.getDataProvider().setValue(i, 'EDU_POINT', EDU_POINT )

          // 전체점수 계산
          let TOTAL_POINT = 0
          TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
          + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
          + EDU_POINT 
          + Number(isNullCheck(grdMainData.REWARD_POINT))
          + Number(isNullCheck(grdMainData.DANGER_TOTAL))
          
          //console.log('TOTAL_POINT : ',TOTAL_POINT)
          grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )

          bBreak = true
          break
        }
      }
      if(!bBreak){
        //console.log('중단된 값 : ', i)
        grdMain.value.getDataProvider().setValue(i, 'MNG_ALL_CNT', 0 )
        grdMain.value.getDataProvider().setValue(i, 'MNG_EDU_DIV_Y', 0 )
        grdMain.value.getDataProvider().setValue(i, 'MNG_EDU_RATIO', 0 )
        grdMain.value.getDataProvider().setValue(i, 'MNG_EDU_YN', "부적합" )
        grdMain.value.getDataProvider().setValue(i, 'EDU_SUM_01', 0 )
        grdMain.value.getDataProvider().setValue(i, 'EDU_POINT', 0 )
        

        // 전체점수 계산
        let TOTAL_POINT = 0
        TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
        + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
        + 0 
        + Number(isNullCheck(grdMainData.REWARD_POINT))
        + Number(isNullCheck(grdMainData.DANGER_TOTAL))
        
        //console.log('TOTAL_POINT : ',TOTAL_POINT)
        grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )
      }
    }
    grdMain.value.getGridView().commit()
  }
}

// 칭찬쿠폰 조회후   조회후 
const afterSearch6 = res => {
  console.log("관리감독자 조회 후!",res)
  if(res.ORESULT_CUR.length!=0){
    let grdMainData = ref([]) // 그리드 데이터 
    let resData = ref([]) // 조회 데이터
    let bBreak = false // 
    for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
      //console.log('칭찬쿠폰 그리드 포문')
      grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
      bBreak = false
      for(let j=0; j <res.ORESULT_CUR.length;j++){
        resData = res.ORESULT_CUR[j]
        if(grdMainData.CMPNY_DIV===resData.CMPNY_DIV && grdMainData.ASGN_CD===resData.ASGN_CD && grdMainData.BSNS_CD===resData.BSNS_CD && grdMainData.DEPT_CD===resData.DEPT_CD ){
          // console.log('값이 있음 : ', grdMainData.ASGN_CD + '   ' + resData.ASGN_CD)
          grdMain.value.getDataProvider().setValue(i, 'REWARD_01', resData.REWARD_01 )

          // 칭찬쿠폰 점수 점수
          let REWARD_01_POINT = 0
          
          if(Number(isNullCheck(grdMainData.USER_CNT))===0){
            REWARD_01_POINT = 0
          }else{
            REWARD_01_POINT = resData.REWARD_01/grdMainData.USER_CNT
          }
          
          //console.log('처음 REWARD_01_POINT : ',REWARD_01_POINT)
          
          if(REWARD_01_POINT > 1){
              REWARD_01_POINT = 1
          }
          //console.log('두번째 REWARD_01_POINT : ',REWARD_01_POINT)

          // 최종 점수
          //Number((reward_01_point * 100 / point).toFixed(1))
          REWARD_01_POINT = Number((REWARD_01_POINT * 100/searchParams2.REWARD).toFixed(1))
          //console.log('최종 REWARD_01_POINT : ',REWARD_01_POINT)
          
          // 안전칭찬쿠폰 최대치보다 크면 최대치로 고정
          if(REWARD_01_POINT > Number(isNullCheck(searchParams2.SAFETY_REWARD_01))){
            REWARD_01_POINT = searchParams2.SAFETY_REWARD_01
          }
          grdMain.value.getDataProvider().setValue(i, 'REWARD_01_POINT', REWARD_01_POINT)

          // 안전점수 총합
          let REWARD_03 = Number(isNullCheck(grdMainData.REWARD_03))
          //console.log('REWARD_03 : ',REWARD_03)
          grdMain.value.getDataProvider().setValue(i, 'REWARD_POINT', REWARD_01_POINT + REWARD_03)

          // 전체점수 계산
          let TOTAL_POINT = 0
          TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
          + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
          + Number(isNullCheck(grdMainData.EDU_POINT)) 
          + REWARD_01_POINT 
          + REWARD_03
          + Number(isNullCheck(grdMainData.DANGER_TOTAL))
          
          grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )

          bBreak = true
          break
        }
      }
      if(!bBreak){
        //console.log('중단된 값 : ', i)
        grdMain.value.getDataProvider().setValue(i, 'REWARD_01', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REWARD_01_POINT', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REWARD_POINT', 0 + Number(isNullCheck(grdMainData.REWARD_03)))

        // 전체점수 계산
        let TOTAL_POINT = 0
        TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
        + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
        + Number(isNullCheck(grdMainData.EDU_POINT)) 
        + 0 
        + Number(isNullCheck(grdMainData.REWARD_03))
        + Number(isNullCheck(grdMainData.DANGER_TOTAL))

        //console.log('TOTAL_POINT : ',TOTAL_POINT)
        grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )
      }
    }
    grdMain.value.getGridView().commit()
  }
}

// 안전점검 조회후 
const afterSearch7 = res => {
  // console.log('res.ORESULT_CUR! : ',res.ORESULT_CUR)
  // return false
  if(res.ORESULT_CUR.length!=0){
    let grdMainData = ref([]) // 그리드 데이터 
    let resData = ref([]) // 조회 데이터
    let bBreak = false // 
    for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
      //console.log('칭찬쿠폰 그리드 포문')
      grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
      bBreak = false
      for(let j=0; j <res.ORESULT_CUR.length;j++){
        resData = res.ORESULT_CUR[j]
        if(grdMainData.CMPNY_DIV===resData.CMPNY_DIV && grdMainData.EMP_NO===resData.EMP_NO){
          //console.log('값이 있음 : ', grdMainData.EMP_NO + '   ' + resData.EMP_NO)

          grdMain.value.getDataProvider().setValue(i, 'WORK_DAYS', resData.WORK_DAYS )
          grdMain.value.getDataProvider().setValue(i, 'REG_CNT', resData.REG_CNT )
          grdMain.value.getDataProvider().setValue(i, 'REG_RATIO', resData.REG_RATIO )
          grdMain.value.getDataProvider().setValue(i, 'REWARD_03', resData.REWARD_03 )

          // 안전점수 총합
          let REWARD_01_POINT = Number(isNullCheck(grdMainData.REWARD_01_POINT))
          let REWARD_03 = resData.REWARD_03
          // 안전점검 최대 배점 보다 크면 최대 배점으로 세팅
          if(REWARD_03 > Number(isNullCheck(searchParams2.SAFETY_REWARD_03))){
            REWARD_03 = Number(isNullCheck(searchParams2.SAFETY_REWARD_03))
          }
          //console.log('REWARD_03 : ',REWARD_03)
          grdMain.value.getDataProvider().setValue(i, 'REWARD_POINT', REWARD_01_POINT + REWARD_03)

          // 전체점수 계산
          let TOTAL_POINT = 0
          TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
          + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
          + Number(isNullCheck(grdMainData.EDU_POINT)) 
          + REWARD_01_POINT 
          + REWARD_03
          + Number(isNullCheck(grdMainData.DANGER_TOTAL))
          
          grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )

          bBreak = true
          break
        }
      }
      if(!bBreak){
        //console.log('중단된 값 : ', i)
        grdMain.value.getDataProvider().setValue(i, 'WORK_DAYS', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REG_CNT', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REG_RATIO', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REWARD_03', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REWARD_POINT', 0 + Number(isNullCheck(grdMainData.REWARD_01_POINT)))

        // 전체점수 계산
        let TOTAL_POINT = 0
        TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
        + Number(isNullCheck(grdMainData.SAFETY_ACCIDENT)) 
        + Number(isNullCheck(grdMainData.EDU_POINT)) 
        + 0 
        + Number(isNullCheck(grdMainData.REWARD_01_POINT))
        + Number(isNullCheck(grdMainData.DANGER_TOTAL))

        //console.log('TOTAL_POINT : ',TOTAL_POINT)
        grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )
      }
    }
    grdMain.value.getGridView().commit()
  }
}

// 사고은폐 조회후 
const afterSearch8 = res => {
  //console.log('res.ORESULT_CUR! : ',res.ORESULT_CUR)
  if(res.ORESULT_CUR.length!=0){
    let grdMainData = ref([]) // 그리드 데이터 
    let resData = ref([]) // 조회 데이터
    let bBreak = false // 
    for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
      //console.log('칭찬쿠폰 그리드 포문')
      grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
      bBreak = false
      for(let j=0; j <res.ORESULT_CUR.length;j++){
        resData = res.ORESULT_CUR[j]
        if(grdMainData.CMPNY_DIV===resData.CMPNY_DIV && grdMainData.ASGN_CD===resData.ASGN_CD && grdMainData.BSNS_CD===resData.BSNS_CD && grdMainData.DEPT_CD===resData.DEPT_CD ){
          //console.log('값이 있음 : ', grdMainData.ASGN_CD + '   ' + resData.ASGN_CD)
          grdMain.value.getDataProvider().setValue(i, 'SAGO_HIDE_CNT', resData.SAGO_HIDE_CNT )
          bBreak = true
          break
        }
      }
      if(!bBreak){
        //console.log('중단된 값 : ', i)
        grdMain.value.getDataProvider().setValue(i, 'SAGO_HIDE_CNT', 0 )
      }
    }
    grdMain.value.getGridView().commit()
  }
}

//위험성평가 조회 후
const afterSearch9 = res => {
  console.log("레스 확인",res)
  if(res.ORESULT_CUR.length > 0){
    let grdMainData = ref([])
    let resData = ref([])
    let bBreak = false
    for(let i = 0; i < grdMain.value.getGridView().getItemCount();i++){
      grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
      bBreak = false
      for(let j = 0; j < res.ORESULT_CUR.length; j++){
        resData = res.ORESULT_CUR[j]
        if(resData.DANGER_RATIO === null){
          resData.DANGER_RATIO = 0
        }
        if(grdMainData.DEPT_CD === resData.DEPT_CD){
          grdMain.value.getDataProvider().setValue(i, 'DANGER_BASIC_CNT', resData.DANGER_BASIC_CNT )
          grdMain.value.getDataProvider().setValue(i, 'DNAGER_CNT', resData.DNAGER_CNT )
          grdMain.value.getDataProvider().setValue(i, 'DANGER_RATIO', resData.DANGER_RATIO)
          bBreak = true

          //적합여부 계산
          if(resData.DANGER_RATIO == 100){
            grdMain.value.getDataProvider().setValue(i, 'DANGER_YN', 'Y')
          }else{
            grdMain.value.getDataProvider().setValue(i, 'DANGER_YN', 'N')
          }

          //점수, 가점합 계산
          let D_POINT = Number(searchParams2.DANGER * (resData.DANGER_RATIO/100))
          grdMain.value.getDataProvider().setValue(i, 'DANGER_POINT', D_POINT)
          grdMain.value.getDataProvider().setValue(i, 'DANGER_TOTAL', D_POINT)
        }
        if(!bBreak){
          grdMain.value.getDataProvider().setValue(i, 'DANGER_BASIC_CNT', 0 )
          grdMain.value.getDataProvider().setValue(i, 'DNAGER_CNT', 0 )
        }
      }
    }
    grdMain.value.getGridView().commit()
  }
}

const search_07 = async () => {

  if(grdMain.value.getGridView().getItemCount() <= 0){
    Message.warn(t('대상자 검색부터 하셔야 합니다.'))
    return false  
  }

  for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
    let grdMainData = grdMain.value.getDataProvider().getJsonRow(i)
    const param_sago = reactive({
        CMPNY_DIV : grdMainData.CMPNY_DIV
      , FRDT      : saveParams.FRDT
      , TODT      : saveParams.TODT
      , EMP_NO    : grdMainData.EMP_NO
    })
    //searchAddParams.value.push(data)

    await commonSearchApi({ queryId : 'EDUDA0030_SEARCH_07', param: param_sago }).then(res => {
      
      if(res.ORESULT_CUR.length!=0){
          let resData = res.ORESULT_CUR[0]
          
          if(grdMainData.CMPNY_DIV===resData.CMPNY_DIV && grdMainData.EMP_NO===resData.EMP_NO){
            //console.log('값이 있음 : ', grdMainData.EMP_NO + '   ' + resData.EMP_NO)

            grdMain.value.getDataProvider().setValue(i, 'WORK_DAYS', resData.WORK_DAYS )
            grdMain.value.getDataProvider().setValue(i, 'REG_CNT', resData.REG_CNT )
            grdMain.value.getDataProvider().setValue(i, 'REG_RATIO', resData.REG_RATIO )
            grdMain.value.getDataProvider().setValue(i, 'REWARD_03', resData.REWARD_03 )

            // 안전점수 총합
            let REWARD_01_POINT = Number(isNullCheck(grdMainData.REWARD_01_POINT))
            let REWARD_03 = resData.REWARD_03
            // 안전점검 최대 배점 보다 크면 최대 배점으로 세팅
            if(REWARD_03 > Number(isNullCheck(searchParams2.SAFETY_REWARD_03))){
              REWARD_03 = Number(isNullCheck(searchParams2.SAFETY_REWARD_03))
            }
            //console.log('REWARD_03 : ',REWARD_03)
            grdMain.value.getDataProvider().setValue(i, 'REWARD_POINT', REWARD_01_POINT + REWARD_03)

            // 전체점수 계산
            let TOTAL_POINT = 0
            TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
            + Number(isNullCheck(grdMainData.ACCIDENT_POINT)) 
            + Number(isNullCheck(grdMainData.EDU_POINT)) 
            + REWARD_01_POINT 
            + REWARD_03
            + Number(isNullCheck(grdMainData.DANGER_TOTAL))
            
            grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )

            grdMain.value.getGridView().commit()
          }
      }else{
        //console.log('중단된 값 : ', i)
        grdMain.value.getDataProvider().setValue(i, 'WORK_DAYS', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REG_CNT', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REG_RATIO', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REWARD_03', 0 )
        grdMain.value.getDataProvider().setValue(i, 'REWARD_POINT', 0 + Number(isNullCheck(grdMainData.REWARD_01_POINT)))

        // 전체점수 계산
        let TOTAL_POINT = 0
        TOTAL_POINT = Number(isNullCheck(grdMainData.RULE_POINT)) 
        + Number(isNullCheck(grdMainData.SAFETY_ACCIDENT)) 
        + Number(isNullCheck(grdMainData.EDU_POINT)) 
        + 0 
        + Number(isNullCheck(grdMainData.REWARD_01_POINT))
        + Number(isNullCheck(grdMainData.DANGER_TOTAL))

        //console.log('TOTAL_POINT : ',TOTAL_POINT)
        grdMain.value.getDataProvider().setValue(i, 'TOTAL_POINT', TOTAL_POINT )

        grdMain.value.getGridView().commit()
      }
    }).catch( res =>{
      console.log('오류     ▶',  param_sago)
      console.log('오류 res ▶',  res)
    })
  }
}

//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/

const saveData = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams2.value)
  //return
  return commonExecuteApi({ queryId : 'EDUDA0030_SAVE_01', list: saveParams2.value })
}

const saveData2 = ()=> {
  saveParams2.value = []
  saveParams2.value = searchParams2
  saveParams2.value.CMPNY_DIV = saveParams.CMPNY_DIV
  saveParams2.value.FRDT = saveParams.FRDT
  saveParams2.value.TODT = saveParams.TODT
  saveParams2.value.CLSS_CD = saveParams.CLSS_CD
  saveParams2.value.MNG_SUPERVISOR_SAFETY_SEQ = 0
  saveParams2.value.YEAR = dayjs(new Date).format('YYYY') // 년도
  saveParams2.value.MNTH = dayjs(new Date).format('MM') // 월
  saveParams2.value.INSERT_USER_ID = userStore.userId //등록자
  //console.log("여기 오냐??? 저장 파라메트", saveParams2.value)
  //return 
  return commonExecuteApi({ queryId : 'EDUDA0030_SAVE_02', list: [saveParams2.value] })
}

const afterSaveData = res => {
  commonSearchApi({ queryId : 'EDUDA0030_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchParams.YEAR, MNTH : searchParams.MNTH } }) // 버전
    .then(res => {
      if(res.ORESULT_CUR.length!=0){
        codeList.mngSupervisorSafetySeq = res.ORESULT_CUR
        searchParams.MNG_SUPERVISOR_SAFETY_SEQ = res.ORESULT_CUR[0].COD
      }
    }).finally(() => {
      onButtonsClick({ id:'btnSearch' })
    })
}


const afterSaveData2 = res => {
  saveParams2.value = []
  if(res.list[0].length!=0){
    let grdMainData = ref([]) // 그리드 데이터
    grdMainData = grdMain.value.getDataProvider().getJsonRows()
    grdMainData.forEach(val => {
      //console.log('val : ',val)
      val.MNG_SUPERVISOR_SAFETY_SEQ = res.list[0].OUT_MNG_SUPERVISOR_SAFETY_SEQ
      val.MNG_SUPERVISOR_DETAIL_SEQ = 0
      saveParams2.value.push(val)
    })
    commonExecuteApi({ queryId : 'EDUDA0030_SAVE_01', list: saveParams2.value }).then(async res => {
      // 년도가 다를때 새로 년도 세팅
      if(searchParams.YEAR !== dayjs(new Date).format('YYYY')){
        // 년도 바인딩
        await commonSearchApi({ queryId : 'EDUDA0030_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv } })
          .then(res => {
            if(res.ORESULT_CUR.length!=0){
              codeList.year = res.ORESULT_CUR
              findIndex = res.ORESULT_CUR.findIndex(item => item.COD == dayjs(new Date).format('YYYY'))
              if(findIndex < 0){
                  findIndex = 0
              }
              searchParams.YEAR = codeList.year[findIndex].COD
            }
          })
      }else{
        searchParams.YEAR = dayjs(new Date).format('YYYY')
      }
      
      searchParams.MNTH = dayjs(new Date).format('MM')
      
      // 버전
      await commonSearchApi({ queryId : 'EDUDA0030_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY'), MNTH : dayjs(new Date).format('MM') } }) // 버전
        .then(res => {
      //    console.log('저장이후  : ', res.ORESULT_CUR)
          if(res.ORESULT_CUR.length!=0){
            codeList.mngSupervisorSafetySeq = res.ORESULT_CUR
            searchParams.MNG_SUPERVISOR_SAFETY_SEQ = res.ORESULT_CUR[0].COD
          }
          onButtonsClick({ id:'btnSearch' })
        })
    }).catch( res =>{
      // 에러 발생시 기존 마스터 테이블 데이터 삭제
      commonExecuteApi({ queryId : 'EDUDA0030_DELETE_01', list: [saveParams2.value[0]]})
    })
  }
}

//*****************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역*************************************************************//

//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  initCodeList()
  controllerSetting()
  //onButtonsClick({ id:'btnSearch' })
  // grdMainSearch()
  // onButtonsClick()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('년도')"
            width="130px"
            v-model="searchParams.YEAR"
            :items="codeList.year"
            item-value="COD"
            item-title="TXT"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-select
            :label="$t('월')"
            width="100px"
            v-model="searchParams.MNTH"
            :items="codeList.mnth"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-select
            :label="$t('버전')"
            width="350px"
            v-model="searchParams.MNG_SUPERVISOR_SAFETY_SEQ"
            :items="codeList.mngSupervisorSafetySeq"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdMain')"
          />
        </v-sheet>
        <!-- 메인그리드 -->
        <v-sheet class="h-auto">
          <div class="d-flex mb-2">
            <i-input
              :label="$t('절대수칙')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.RULE_01"
              reverse
              readonly
            />
            <i-input
              :label="$t('일반수칙')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.RULE_02"
              reverse
              readonly
            />
            <i-input
              :label="$t('교통수칙')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.RULE_03"
              reverse
              readonly
            />
            <i-input
              :label="$t('작업중지')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.RULE_04"
              reverse
              readonly
            />
            <i-input
              :label="$t('시정통보')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.RULE_05"
              reverse
              readonly
            />
            <i-input
              :label="$t('일반사고')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.ACCIDENT_01"
              reverse
              readonly
            />
            <i-input
              :label="$t('휴업사고')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.ACCIDENT_02"
              reverse
              readonly
            />
            <i-input
              :label="$t('산재사고')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.ACCIDENT_03"
              reverse
              readonly
            />
            <i-input
              :label="$t('중대성사고')"
              labelWidth="70px"
              width="125px"
              v-model="searchParams2.ACCIDENT_04"
              reverse
              readonly
            />
            <i-input
              :label="$t('중대재해')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.ACCIDENT_05"
              reverse
              readonly
            />
            <i-input
              :label="$t('칭찬쿠폰상수')"
              labelWidth="80px"
              width="135px"
              v-model="searchParams2.REWARD"
              reverse
              readonly
            />
            <i-input
              :label="$t('안전점검상수')"
              labelWidth="80px"
              width="135px"
              v-model="searchParams2.REWARD03"
              reverse
              readonly
            />
            <i-input
              :label="$t('위험제보')"
              labelWidth="50px"
              width="105px"
              v-model="searchParams2.REWARD02"
              reverse
              readonly
            />
            <i-input
              :label="$t('위험성평가')"
              labelWidth="70px"
              width="125px"
              v-model="searchParams2.DANGER"
              reverse
              readonly
            />
          </div>
          <!-- <div class="d-flex justify-space-between mB-5"> -->
            <!-- <IGridTitle
              ref="gridTitle"
              :title="$t('배점기준 리스트')"
              :button-list="['btnTargetSearch', 'btnUpdate']"
            >
              <template #editors />
            </IGridTitle> -->
            <v-sheet class="d-flex justify-end mB-5">
              <i-input labelWidth="35px" width="190px" 
                :label="$t('기간')" type="date"
                v-model="saveParams.FRDT"
                @change="dateFrChanged"
                margin="10px"
                :disabled="noFrdt"
              />
              <i-input width="160px"
                :label="$t('-')" type="date"
                v-model="saveParams.TODT"
                @change="dateToChanged"
                :disabled="noTodt"
              />
              <i-select
                :label="$t('과/팀')"
                width="120px"
                v-model="saveParams.CLSS_CD"
                :items="codeList.clssCd"
                item-title="TXT"
                item-value="COD"
                :disabled="noClssCd"
                @update:model-value="gridRefresh('grdMain')"
              />
              <IButtonList
                :button-list="['btnTargetSearch', 'btnNewSave', 'btnReset']"
                @click-button="onButtonsSubClick"
                ref="onButtonsSub"
              />
            </v-sheet>

            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
            />
          <!-- </div> -->
        </v-sheet>
      </div>
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
    min-height: 250px;
  }
}
</style>
