<!--
  화면명 : 핵심가치 실천인상
  화면개요 : 핵심가치 실천인상 조회 저장 하는 화면
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
  name: '60_edu-EDU_D-EDUDA0010',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdTab01Main = ref(null)
const grdTab02Main = ref(null)
const tab = ref('tab1')
const searchAddParams= ref([])
const saveTab01Params2= ref([])
const saveTab02Params2= ref([])
const searchTab01Yn = ref(false) // 조회 여부
const searchTab02Yn = ref(false) // 조회 여부
const onButtonsTab01Sub = ref(null)
const onButtonsTab02Sub = ref(null)
const noFrdt = ref(false)
const noTodt = ref(false)
const noClssCd = ref(false)
let findIndex = 0
//현재 등록되어 있는 배점 기준 저장

const searchTab01Params = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : '', //사업부
  YEAR : dayjs(new Date).format('YYYY'), // 년도
  MNTH : dayjs(new Date).format('MM'), // 월
  MASTER_SEQ : '', // 핵심가치 실천인상 생산 마스터 SEQ
})

const searchTab02Params = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'), // 년도
  MNTH : dayjs(new Date).format('MM'), // 월
  MASTER_SEQ : '', // 핵심가치 실천인상 생산 마스터 SEQ
})

const saveTab01Params = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date()).format('YYYY'), // 년도
  MNTH : dayjs(new Date()).format('MM'), // 월
  BSNS_CD : '',  //사업부
  POINT_01 : '',  //관리기준 대비 증감
  POINT_02 : '',  //절대수칙/중점관리 증감
  POINT_03 : '',  //사고 증감
  POINT_04 : '',  //중대성 사고/구급차 미이용
  POINT_05 : '',  //협력사 수준평가
  POINT_06 : '',  //안전 칭찬 쿠폰
})

const saveTab02Params = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : '', //사업부
  YEAR : dayjs(new Date()).format('YYYY'), // 년도
  MNTH : dayjs(new Date()).format('MM'), // 월
  POINT_01 : '',  //안전설계 건수
  POINT_02 : ''   //안전개선 평가
})

//생산 리스트 그리드 세팅
const grdTab01MainProps = reactive({
  gridViewOption: { header: { height: 90 }, checkBar: { visible: false }, stateBar: { visible: false } },
  fields : [ 
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false, width: '150', mergeRule: { "criteria": "value" } },
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, styleName: 'left-column', editable: false, width: '150', mergeRule: { "criteria": "prevvalues + value" }, },
    { fieldName: 'PRNT_NM', dataType: 'text', header: { text: t('담당') }, styleName: 'left-column', editable: false, width: '150', mergeRule: { "criteria": "prevvalues + value" }, },
    { fieldName: 'ASGN_DESC', dataType: 'text', header: { text: t('부서') }, styleName: 'left-column', editable: false, width: '150', },
    { fieldName: 'SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'RANKING', dataType: 'number', numberFormat: "#,###", header: { text: t('순위') }, styleName: 'right-column', editable: false },
    { fieldName: 'YEAR_END_ACC_RATE_PLN', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('연말기준') }, styleName: 'right-column', editable: false },
    { fieldName: 'MANAGEMENT_ACC_RATE_PLN', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('현재기준') }, styleName: 'right-column', editable: false },
    { fieldName: 'ACC_RATE', dataType: 'number', numberFormat: "#,###", header: { text: t('현재기준누적재해율') }, styleName: 'right-column', editable: false },
    { fieldName: 'YEAR_END_DISASTER_RATE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('연말기준재해율증감율') }, styleName: 'right-column', editable: false },
    { fieldName: 'MANAGEMENT_DISASTER_RATE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('관리기준 대비재해율 증감율') }, styleName: 'right-column', editable: false },
    { fieldName: 'DISASTER_ACHIEVE_YN', dataType: 'text', header: { text: t('관리기준재해율 달성여부') }, editable: false },
    { fieldName: 'DISASTER_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'PRE_VIO_RULES_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('최근3년수칙위반') }, styleName: 'right-column', editable: false },
    { fieldName: 'PRE_HALF_RULES_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('하반기변환점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'PRE_PEOPLE_CNT', dataType: 'number', numberFormat: "#,###", header: { text: t('인원') }, styleName: 'right-column', editable: false },
    { fieldName: 'PRE_BEFORE_RULES_RATE', dataType: 'number', numberFormat: "#,###", header: { text: t('위반율변환전') }, styleName: 'right-column', editable: false },
    { fieldName: 'PRE_RULES_RATE', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('최근3년위반율') }, styleName: 'right-column', editable: false },
    { fieldName: 'VIO_RULES_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('수칙위반') }, styleName: 'right-column', editable: false },
    { fieldName: 'ABSOLUTE_RULES_1', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('절대수칙(1~3)') }, styleName: 'right-column', editable: false },
    { fieldName: 'ABSOLUTE_RULES_2', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('절대수칙') }, styleName: 'right-column', editable: false },
    { fieldName: 'FOCUS_MANAGEMENT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('중점관리') }, styleName: 'right-column', editable: false },
    { fieldName: 'HALF_PEOPLE_CNT', dataType: 'number', numberFormat: "#,###", header: { text: t('인원') }, styleName: 'right-column', editable: false },
    { fieldName: 'HALF_BEFORE_RULES_RATE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('위반율변환전') }, styleName: 'right-column', editable: false },
    { fieldName: 'HALF_RULES_RATE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('위반율') }, styleName: 'right-column', editable: false },
    { fieldName: 'RULES_RATE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('동기대비증감율') }, styleName: 'right-column', editable: false },
    { fieldName: 'RULES_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'PRE_ACCIDENT_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('작년 사고건수') }, styleName: 'right-column', editable: false },
    { fieldName: 'ACCIDENT_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('올해 사고건수') }, styleName: 'right-column', editable: false },
    { fieldName: 'ACCIDENT_INCREASE', dataType: 'number', numberFormat: "#,###", header: { text: t('증감') }, styleName: 'right-column', editable: false },
    { fieldName: 'ACCIDENT_INCREASE_RATE', dataType: 'number', numberFormat: "#,###", header: { text: t('증감률') }, styleName: 'right-column', editable: false },
    { fieldName: 'ACCIDENT_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'COME_SERIOUS_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('중대성') }, styleName: 'right-column', editable: false },
    { fieldName: 'GUGUP_USE_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('구급차') }, styleName: 'right-column', editable: false },
    { fieldName: 'SERIOUS_GUGUP_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'CCOMP_SCORE', dataType: 'number', numberFormat: "#,##0.##", header: { text: t('평가결과') }, styleName: 'right-column', editable: false },
    { fieldName: 'CCOMP_SCORE_CONVERSION', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('평가점수변환') }, styleName: 'right-column', editable: false },
    { fieldName: 'CCOMP_AVG', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('사업부평균') }, styleName: 'right-column', editable: false },
    { fieldName: 'CCOMP_STDDEV', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('표준편차') }, styleName: 'right-column', editable: false },
    { fieldName: 'Z_SCORE', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('Z값') }, styleName: 'right-column', editable: false },
    { fieldName: 'CCOMP_EVALUATION_SCORE', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'ACCUMULATED_CNT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('실적') }, styleName: 'right-column', editable: false },
    // { fieldName: '', dataType: 'number', numberFormat: "#,###", header: { text: t('인원') }, styleName: 'left-column', editable: false },
    // { fieldName: '', dataType: 'number', numberFormat: "#,###", header: { text: t('인원대비 실적건수') }, styleName: 'left-column', editable: false },
    { fieldName: 'ACCUMULATED_POINT_RATE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('실적률') }, styleName: 'right-column', editable: false },
    { fieldName: 'ACCUMULATED_POINT_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'JUNGDAE_CNT', dataType: 'number', numberFormat: "#,###", header: { text: t('중대재해') }, styleName: 'right-column', editable: false },
    { fieldName: 'SAGO_HIDE_CNT', dataType: 'number', numberFormat: "#,###", header: { text: t('산재은폐') }, styleName: 'right-column', editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'PRNT_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'MASTER_SEQ', dataType: 'text', visible: false },
    { fieldName: 'DETAIL_SEQ', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'INDEX_NO', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: 
  [
    'BSNS_NM', 'PART_NM', 'PRNT_NM', 'ASGN_DESC',
    {
      name: 'H01',
      fieldName : 'H01',
      direction: 'horizontal',
      items: [ 'SCORE', 'RANKING'],
      header: { 
        text: '평가 결과',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('평가 결과')}
      },
    },
    {
      name: 'H02',
      fieldName : 'H02',
      direction: 'horizontal',
      items: [ 'YEAR_END_ACC_RATE_PLN', 'MANAGEMENT_ACC_RATE_PLN'],
      header: { 
        text: '재해율 관리기준',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('재해율 관리기준')}
      },
    },
    {
      name: 'H03',
      fieldName : 'H03',
      direction: 'horizontal',
      items: [ 'ACC_RATE', 'YEAR_END_DISASTER_RATE', 'MANAGEMENT_DISASTER_RATE', 'DISASTER_ACHIEVE_YN', 'DISASTER_SCORE'],
      header: { 
        text: '관리기준 대비 증감 (20점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('관리기준 대비 증감 (20점)')}
      },
    },
    {
      name: 'H04',
      fieldName : 'H04',
      direction: 'horizontal',
      items: [ 'PRE_VIO_RULES_SCORE', 'PRE_HALF_RULES_SCORE', 'PRE_PEOPLE_CNT', 'PRE_BEFORE_RULES_RATE', 'PRE_RULES_RATE', 'VIO_RULES_SCORE', 'ABSOLUTE_RULES_1', 'ABSOLUTE_RULES_2', 'FOCUS_MANAGEMENT', 'HALF_PEOPLE_CNT', 'HALF_BEFORE_RULES_RATE', 'HALF_RULES_RATE', 'RULES_RATE', 'RULES_SCORE'],
      header: { 
        text: '절대수칙/중점관리 증감 (30점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('절대수칙/중점관리 증감 (30점)')}
      },
    },
    {
      name: 'H05',
      fieldName : 'H05',
      direction: 'horizontal',
      items: [ 'PRE_ACCIDENT_CNT', 'ACCIDENT_CNT', 'ACCIDENT_INCREASE', 'ACCIDENT_INCREASE_RATE', 'ACCIDENT_SCORE'],
      header: { 
        text: '사고 증감 (15점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('사고 증감 (15점)')}
      },
    },
    {
      name: 'H06',
      fieldName : 'H06',
      direction: 'horizontal',
      items: [ 'COME_SERIOUS_CNT', 'GUGUP_USE_CNT', 'SERIOUS_GUGUP_SCORE'],
      header: { 
        text: '중대성 사고/구급차 미이용 (20점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('중대성 사고/구급차 미이용 (20점)')}
      },
    },
    {
      name: 'H07',
      fieldName : 'H07',
      direction: 'horizontal',
      items: [ 'CCOMP_SCORE', 'CCOMP_SCORE_CONVERSION', 'CCOMP_AVG', 'CCOMP_STDDEV', 'Z_SCORE', 'CCOMP_EVALUATION_SCORE'],
      header: { 
        text: '협력사 수준평가 (10점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('협력사 수준평가 (10점)')}
      },
    },
    {
      name: 'H08',
      fieldName : 'H08',
      direction: 'horizontal',
      items: [ 'ACCUMULATED_CNT', 'ACCUMULATED_POINT_RATE', 'ACCUMULATED_POINT_SCORE'],
      header: { 
        text: '안전 칭찬 쿠폰 (5점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전 칭찬 쿠폰 (5점)')}
      },
    },
    {
      name: 'H09',
      fieldName : 'H09',
      direction: 'horizontal',
      items: [ 'JUNGDAE_CNT', 'SAGO_HIDE_CNT'],
      header: { 
        text: '비고(평가 제외)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('비고(평가 제외)')}
      },
    },
  ],
})

// 설계 그리드 세팅
const grdTab02MainProps = reactive({
  gridViewOption: { header: { height: 90 }, checkBar: { visible: false }, stateBar: { visible: false } },
  fields : [ 
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column', editable: false, width: '150', mergeRule: { "criteria": "value" } },
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, styleName: 'left-column', editable: false, width: '150', mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'PRNT_NM', dataType: 'text', header: { text: t('담당') }, styleName: 'left-column', editable: false, width: '150', mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'ASGN_DESC', dataType: 'text', header: { text: t('부서') }, styleName: 'left-column', editable: false, width: '150', groupFooter: {text: " "}, },
    { fieldName: 'SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'RANKING', dataType: 'number', numberFormat: "#,###", header: { text: t('순위') }, styleName: 'right-column', editable: false },
    { fieldName: 'SAFETY_DESIGN_CNT', dataType: 'number', numberFormat: "#,###", header: { text: t('안전설계건수') }, styleName: 'right-column editable_column', editable: true },
    { fieldName: 'ASGN_PEOPLE_CNT', dataType: 'number', numberFormat: "#,###", header: { text: t('부서인원') }, styleName: 'right-column editable_column', editable: true },
    { fieldName: 'PEOPLE_DESIGN_RATE', dataType: 'number', numberFormat: "#,##0.#########", header: { text: t('인당 설계 변환율') }, styleName: 'right-column', editable: false },
    { fieldName: 'BSNS_AVG', dataType: 'number', numberFormat: "#,##0.#########", header: { text: t('사업부 평균') }, styleName: 'right-column', editable: false },
    { fieldName: 'STDDEV', dataType: 'number', numberFormat: "#,##0.#########", header: { text: t('표준편차') }, styleName: 'right-column', editable: false },
    { fieldName: 'Z_SCORE', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('Z값') }, styleName: 'right-column', editable: false },
    { fieldName: 'SAFETY_DESIGN_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'IMPROVED_STRENGTH', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('개선전강도') }, styleName: 'right-column editable_column', editable: true },
    { fieldName: 'STRENGTH_IMPROVEMENT', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('개선후강도') }, styleName: 'right-column editable_column', editable: true },
    { fieldName: 'STRENGTH_IMPROVEMENT_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('강도개선점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'FREQUENCY_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('빈도점수') }, styleName: 'right-column editable_column', editable: true },
    { fieldName: 'STRENGTH_FREQUENCY_SCORE', dataType: 'number', numberFormat: "#,##0.##", header: { text: t('강도X빈도 개선점수') }, styleName: 'right-column', editable: false },
    { fieldName: 'STRENGTH_IMPROVEMENT_RATE', dataType: 'number', numberFormat: "#,##0.####", header: { text: t('변환율') }, styleName: 'right-column', editable: false },
    { fieldName: 'BSNS_STRENGTH_AVG', dataType: 'number', numberFormat: "#,##0.#####", header: { text: t('사업부평균') }, styleName: 'right-column', editable: false },
    { fieldName: 'STRENGTH_IMPROVEMENT_STDDEV', dataType: 'number', numberFormat: "#,##0.#########", header: { text: t('표준편차') }, styleName: 'right-column', editable: false },
    { fieldName: 'STRENGTH_Z_SCORE', dataType: 'number', numberFormat: "#,##0.###", header: { text: t('Z값') }, styleName: 'right-column', editable: false },
    { fieldName: 'STRENGTH_SCORE', dataType: 'number', numberFormat: "#,##0.#", header: { text: t('점수') }, styleName: 'right-column', editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'PRNT_CD', dataType: 'text', visible: false },
    { fieldName: 'PART_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'MASTER_SEQ', dataType: 'text', visible: false },
    { fieldName: 'DETAIL_SEQ', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'INDEX_NO', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: 
  [
    'BSNS_NM', 'PART_NM', 'PRNT_NM', 'ASGN_DESC',
    {
      name: 'H01',
      fieldName : 'H01',
      direction: 'horizontal',
      items: [ 'SCORE', 'RANKING'],
      header: { 
        text: '평가 결과',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('평가 결과')}
      },
    },
    {
      name: 'H02',
      fieldName : 'H02',
      direction: 'horizontal',
      items: [ 'SAFETY_DESIGN_CNT', 'ASGN_PEOPLE_CNT', 'PEOPLE_DESIGN_RATE', 'BSNS_AVG', 'STDDEV', 'Z_SCORE', 'SAFETY_DESIGN_SCORE'],
      header: { 
        text: '안전설계 건수(40점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전설계 건수(40점)')}
      },
    },
    {
      name: 'H03',
      fieldName : 'H03',
      direction: 'horizontal',
      items: [ 'IMPROVED_STRENGTH', 'STRENGTH_IMPROVEMENT', 'STRENGTH_IMPROVEMENT_SCORE', 'FREQUENCY_SCORE', 'STRENGTH_FREQUENCY_SCORE', 'STRENGTH_IMPROVEMENT_RATE', 'BSNS_STRENGTH_AVG', 'STRENGTH_IMPROVEMENT_STDDEV', 'STRENGTH_Z_SCORE', 'STRENGTH_SCORE'],
      header: { 
        text: '안전개선 평가 (60점)',
        // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전개선 평가 (60점)')}
      },
    },
  ],
})

// 그리드 세팅
grdTab01MainProps.columns = grdTab01MainProps.fields
grdTab02MainProps.columns = grdTab02MainProps.fields

const codeList = reactive({
  year : [], // 년도
  mnth : [], // 월
  masterSeq : [{ TXT: '선택', COD: '' }], // 버전
})

const codeList2 = reactive({
  year : [], // 년도
  mnth : [], // 월
  masterSeq : [{ TXT: '선택', COD: '' }], // 버전
})

const saveTab01CodeList = reactive({
  mnth : [{ TXT: '선택', COD: '' }, { TXT: '01', COD: '01' }, { TXT: '02', COD: '02' }, { TXT: '03', COD: '03' }, { TXT: '04', COD: '04' }, { TXT: '05', COD: '05' }, { TXT: '06', COD: '06' }, { TXT: '07', COD: '07' }, { TXT: '08', COD: '08' }, { TXT: '09', COD: '09' }, { TXT: '10', COD: '10' }, { TXT: '11', COD: '11' }, { TXT: '12', COD: '12' }], // 월
  bsnsCd : [] //사업부
})

const saveTab02CodeList = reactive({
  mnth : [{ TXT: '선택', COD: '' }, { TXT: '01', COD: '01' }, { TXT: '02', COD: '02' }, { TXT: '03', COD: '03' }, { TXT: '04', COD: '04' }, { TXT: '05', COD: '05' }, { TXT: '06', COD: '06' }, { TXT: '07', COD: '07' }, { TXT: '08', COD: '08' }, { TXT: '09', COD: '09' }, { TXT: '10', COD: '10' }, { TXT: '11', COD: '11' }, { TXT: '12', COD: '12' }], // 월
  bsnsCd : [] //사업부
})


//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv} }), // 년도
    commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY')} }), // 월
    commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY'), MNTH : dayjs(new Date).format('MM')} }), // 버전
    commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv} }), // 년도
    commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY')} }), // 월
    commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY'), MNTH : dayjs(new Date).format('MM')} }), // 버전    
    commonSearchApi({ queryId : 'EDUDA0040_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv,SCORING_CRITERIA_CD:'10', USE_YN: 'Y', DEL_YN: 'N' } }), //핵심가치 실천인상(생산)
    commonSearchApi({ queryId : 'EDUDA0040_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv,SCORING_CRITERIA_CD:'40', USE_YN: 'Y', DEL_YN: 'N' } }), //핵심가치 실천인상(설계)
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv } }),
  ]).then(res => {
    console.log("레스 확인",res)
    //saveParams.CLSS_CD = codeList.clssCd[0].COD

    // 생산-년도
    if(res[0].ORESULT_CUR.length!=0){
      codeList.year = res[0].ORESULT_CUR
      findIndex = res[0].ORESULT_CUR.findIndex(item => item.COD == searchTab01Params.YEAR)
      if(findIndex < 0){
          findIndex = 0
      }
      searchTab01Params.YEAR = codeList.year[findIndex].COD
    }

    // 생산-월
    if(res[1].ORESULT_CUR.length!=0){
      codeList.mnth = res[1].ORESULT_CUR
      findIndex = res[1].ORESULT_CUR.findIndex(item => item.COD == searchTab01Params.MNTH)
      if(findIndex < 0){
          findIndex = 0
      }
      searchTab01Params.MNTH = codeList.mnth[findIndex].COD
    }
   
    // 생산-버전
    if(res[2].ORESULT_CUR.length!=0){
      codeList.masterSeq = res[2].ORESULT_CUR
      searchTab01Params.MASTER_SEQ = codeList.masterSeq[0].COD
    }

    // 설계-년도
    if(res[3].ORESULT_CUR.length!=0){
      codeList2.year = res[3].ORESULT_CUR
      findIndex = res[3].ORESULT_CUR.findIndex(item => item.COD == searchTab02Params.YEAR)
      if(findIndex < 0){
          findIndex = 0
      }
      searchTab02Params.YEAR = codeList2.year[findIndex].COD
    }

    // 생산-월
    if(res[4].ORESULT_CUR.length!=0){
      codeList2.mnth = res[4].ORESULT_CUR
      findIndex = res[4].ORESULT_CUR.findIndex(item => item.COD == searchTab02Params.MNTH)
      if(findIndex < 0){
          findIndex = 0
      }
      searchTab02Params.MNTH = codeList2.mnth[findIndex].COD
    }
   
    // 생산-버전
    if(res[5].ORESULT_CUR.length!=0){
      codeList2.masterSeq = res[5].ORESULT_CUR
      searchTab02Params.MASTER_SEQ = codeList2.masterSeq[0].COD
    }

    //생산 관련 점수
    console.log("res[6]", res[6].ORESULT_CUR)
    if(res[6].ORESULT_CUR.length != 0){
      res[6].ORESULT_CUR.forEach(val => {
        if(val.SCORING_LIST_CD === '140'){
          saveTab01Params.POINT_01 = val.SCORING
        }else if(val.SCORING_LIST_CD === '150'){
          saveTab01Params.POINT_02 = val.SCORING
        }else if(val.SCORING_LIST_CD === '160'){
          saveTab01Params.POINT_03 = val.SCORING
        }else if(val.SCORING_LIST_CD === '170'){
          saveTab01Params.POINT_04 = val.SCORING
        }else if(val.SCORING_LIST_CD === '180'){
          saveTab01Params.POINT_05 = val.SCORING
        }else if(val.SCORING_LIST_CD === '190'){
          saveTab01Params.POINT_06 = val.SCORING
        }
      })
    }

    if(res[7].ORESULT_CUR.length != 0){
      res[7].ORESULT_CUR.forEach(val => {
        if(val.SCORING_LIST_CD === '200'){
          saveTab02Params.POINT_01 = val.SCORING
        }else if(val.SCORING_LIST_CD === '210'){
          saveTab02Params.POINT_02 = val.SCORING
        }
      })
    }
    
    //tab01 사업부
    if(res[8].ORESULT_CUR.length != 0){
      //탭01
      saveTab01CodeList.bsnsCd = res[8].ORESULT_CUR
      saveTab01CodeList.bsnsCd.unshift({BSNS_NM : '전체', BSNS_CD : ''})
      saveTab01Params.BSNS_CD = saveTab01CodeList.bsnsCd[0].BSNS_CD

      //탭02
      saveTab02CodeList.bsnsCd = res[8].ORESULT_CUR
      saveTab02Params.BSNS_CD = saveTab02CodeList.bsnsCd[0].BSNS_CD
      searchTab02Params.BSNS_CD = saveTab02CodeList.bsnsCd[0].BSNS_CD
    }

  }).finally(() => {

  })
}

// 생산(탭1)
// 년도 바뀌면 월 데이터 및 버전 데이터 변경
watch(() => searchTab01Params.YEAR, async (newValue, oldValue) => {
  //searchParams.MNTH = ''
  // console.log('searchParams.YEAR newValue : ', newValue)
  // console.log('searchParams.YEAR oldValue : ', oldValue)
  if(newValue !== oldValue){
    // 월 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : newValue } }) // 월
      .then(res => {
        //console.log('searchParams.MNTH : ', res)
        if(res.ORESULT_CUR.length!=0){
          codeList.mnth = res.ORESULT_CUR
          searchTab01Params.MNTH = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})

// 월 데이터 바뀌면 버전 데이터 변경
watch( () => searchTab01Params.MNTH, async (newValue,oldValue) => {
  // console.log('searchParams.MNTH newValue : ', newValue)
  // console.log('searchParams.MNTH oldValue : ', oldValue)
  if(newValue !== oldValue){
    searchTab01Params.MASTER_SEQ = ''
    // 버전 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchTab01Params.YEAR, MNTH : newValue } }) // 버전
      .then(res => {
        //console.log('searchParams.MNTH res  : ', res.ORESULT_CUR)
        if(res.ORESULT_CUR.length!=0){
          //console.log('버전  : ', res.ORESULT_CUR)
          codeList.masterSeq = res.ORESULT_CUR
          //console.log('codeList.masterSeq  : ', codeList.masterSeq)
          searchTab01Params.MASTER_SEQ = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})

// 설계(탭2)
// 년도 바뀌면 월 데이터 및 버전 데이터 변경
watch(() => searchTab02Params.YEAR, async (newValue, oldValue) => {
  //searchParams.MNTH = ''
  // console.log('searchParams.YEAR newValue : ', newValue)
  // console.log('searchParams.YEAR oldValue : ', oldValue)
  if(newValue !== oldValue){
    // 월 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : newValue } }) // 월
      .then(res => {
        //console.log('searchParams.MNTH : ', res)
        if(res.ORESULT_CUR.length!=0){
          codeList2.mnth = res.ORESULT_CUR
          searchTab02Params.MNTH = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})

// 월 데이터 바뀌면 버전 데이터 변경
watch( () => searchTab02Params.MNTH, async (newValue,oldValue) => {
  // console.log('searchParams.MNTH newValue : ', newValue)
  // console.log('searchParams.MNTH oldValue : ', oldValue)
  if(newValue !== oldValue){
    searchTab02Params.MASTER_SEQ = ''
    // 버전 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchTab02Params.YEAR, MNTH : newValue } }) // 버전
      .then(res => {
        //console.log('searchParams.MNTH res  : ', res.ORESULT_CUR)
        if(res.ORESULT_CUR.length!=0){
          //console.log('버전  : ', res.ORESULT_CUR)
          codeList2.masterSeq = res.ORESULT_CUR
          //console.log('codeList.masterSeq  : ', codeList.masterSeq)
          searchTab02Params.MASTER_SEQ = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})

const grdMainSetColumnLayout = (grid) => {
  if(grid === 'TAB01'){
    grdTab01Main.value.getGridView().setColumnLayout([
      'BSNS_NM', 'PART_NM', 'PRNT_NM', 'ASGN_DESC',
      {
        name: 'H01',
        fieldName : 'H01',
        direction: 'horizontal',
        items: [ 'SCORE', 'RANKING'],
        header: { 
          text: '평가 결과',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('평가 결과')}
        },
      },
      {
        name: 'H02',
        fieldName : 'H02',
        direction: 'horizontal',
        items: [ 'YEAR_END_ACC_RATE_PLN', 'MANAGEMENT_ACC_RATE_PLN'],
        header: { 
          text: '재해율 관리기준',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('재해율 관리기준')}
        },
      },
      {
        name: 'H03',
        fieldName : 'H03',
        direction: 'horizontal',
        items: [ 'ACC_RATE', 'YEAR_END_DISASTER_RATE', 'MANAGEMENT_DISASTER_RATE', 'DISASTER_ACHIEVE_YN', 'DISASTER_SCORE'],
        header: { 
          text: '관리기준 대비 증감 (' + saveTab01Params.POINT_01 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('관리기준 대비 증감 (77777점)')}
        },
      },
      {
        name: 'H04',
        fieldName : 'H04',
        direction: 'horizontal',
        items: [ 'PRE_VIO_RULES_SCORE', 'PRE_HALF_RULES_SCORE', 'PRE_PEOPLE_CNT', 'PRE_BEFORE_RULES_RATE', 'PRE_RULES_RATE', 'VIO_RULES_SCORE', 'ABSOLUTE_RULES_1', 'ABSOLUTE_RULES_2', 'FOCUS_MANAGEMENT', 'HALF_PEOPLE_CNT', 'HALF_BEFORE_RULES_RATE', 'HALF_RULES_RATE', 'RULES_RATE', 'RULES_SCORE'],
        header: { 
          text: '절대수칙/중점관리 증감 ('  + saveTab01Params.POINT_02 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('절대수칙/중점관리 증감 (30점)')}
        },
      },
      {
        name: 'H05',
        fieldName : 'H05',
        direction: 'horizontal',
        items: [ 'PRE_ACCIDENT_CNT', 'ACCIDENT_CNT', 'ACCIDENT_INCREASE', 'ACCIDENT_INCREASE_RATE', 'ACCIDENT_SCORE'],
        header: { 
          text: '사고 증감 (' + saveTab01Params.POINT_03 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('사고 증감 (15점)')}
        },
      },
      {
        name: 'H06',
        fieldName : 'H06',
        direction: 'horizontal',
        items: [ 'COME_SERIOUS_CNT', 'GUGUP_USE_CNT', 'SERIOUS_GUGUP_SCORE'],
        header: { 
          text: '중대성 사고/구급차 미이용 ('  + saveTab01Params.POINT_04 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('중대성 사고/구급차 미이용 (20점)')}
        },
      },
      {
        name: 'H07',
        fieldName : 'H07',
        direction: 'horizontal',
        items: [ 'CCOMP_SCORE', 'CCOMP_SCORE_CONVERSION', 'CCOMP_AVG', 'CCOMP_STDDEV', 'Z_SCORE', 'CCOMP_EVALUATION_SCORE'],
        header: { 
          text: '협력사 수준평가 ('  + saveTab01Params.POINT_05 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('협력사 수준평가 (10점)')}
        },
      },
      {
        name: 'H08',
        fieldName : 'H08',
        direction: 'horizontal',
        items: [ 'ACCUMULATED_CNT', 'ACCUMULATED_POINT_RATE', 'ACCUMULATED_POINT_SCORE'],
        header: { 
          text: '안전 칭찬 쿠폰 ('  + saveTab01Params.POINT_06 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('안전 칭찬 쿠폰 (5점)')}
        },
      },
      {
        name: 'H09',
        fieldName : 'H09',
        direction: 'horizontal',
        items: [ 'JUNGDAE_CNT', 'SAGO_HIDE_CNT'],
        header: { 
          text: '비고(평가 제외)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('비고(평가 제외)')}
        },
      },
    ])
  }else if(grid === 'TAB02'){
    grdTab02Main.value.getGridView().setColumnLayout([
      'BSNS_NM', 'PART_NM', 'PRNT_NM', 'ASGN_DESC',
      {
        name: 'H01',
        fieldName : 'H01',
        direction: 'horizontal',
        items: [ 'SCORE', 'RANKING'],
        header: { 
          text: '평가 결과',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('평가 결과')}
        },
      },
      {
        name: 'H02',
        fieldName : 'H02',
        direction: 'horizontal',
        items: [ 'SAFETY_DESIGN_CNT', 'ASGN_PEOPLE_CNT', 'PEOPLE_DESIGN_RATE', 'BSNS_AVG', 'STDDEV', 'Z_SCORE', 'SAFETY_DESIGN_SCORE'],
        header: { 
          text: '안전설계 건수(' + saveTab02Params.POINT_01 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('안전설계 건수(40점)')}
        },
      },
      {
        name: 'H03',
        fieldName : 'H03',
        direction: 'horizontal',
        items: [ 'IMPROVED_STRENGTH', 'STRENGTH_IMPROVEMENT', 'STRENGTH_IMPROVEMENT_SCORE', 'FREQUENCY_SCORE', 'STRENGTH_FREQUENCY_SCORE', 'STRENGTH_IMPROVEMENT_RATE', 'BSNS_STRENGTH_AVG', 'STRENGTH_IMPROVEMENT_STDDEV', 'STRENGTH_Z_SCORE', 'STRENGTH_SCORE'],
        header: { 
          text: '안전개선 평가 (' + saveTab02Params.POINT_02 + '점)',
          // template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('안전개선 평가 (60점)')}
        },
      },
    ])
  }
}

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){ //조회
    if(tab.value ==='tab1'){
      new queryFlowHelper(vm, t)
        .setGridList([grdTab01Main])
        .setBefore(beforeSearch)
        .setQuery(searchTab01Data)
        .setAfter(afterTab01Search)
        .run()
    }else if(tab.value ==='tab2'){
      new queryFlowHelper(vm, t)
        .setGridList([grdTab02Main])
        .setBefore(beforeSearch)
        .setQuery(searchTab02Data)
        .setAfter(afterTab02Search)
        .run()
    }
  }
}
const onButtonsSubClick = btn => {
  if(tab.value ==='tab1'){
    if(btn.id === 'btnTargetSearch'){ //대상 조회
      new queryFlowHelper(vm, t)
        .setGridList([grdTab01Main])
        .setBefore(beforeSearch2)
        .setQuery(searchTab01Data2)
        .setAfter(afterTab01Search2)
        .run()
    }else if(btn.id === 'btnUpdate'){ //저장
      new saveFlowHelper(vm, t)
      .setGridList([grdTab01Main])
      .setBefore(saveTab01Check)
      .setQuery(saveTab01Data2)
      .setAfter(afterSaveTab01Data2)
      .run()
    }
    else if(btn.id === 'btnReset'){ //초기화
      gridRefresh('grdTab01Main')
      searchTab01Yn.value = false
      //현재 등록되어 있는 배점기준 점수로 초기화
      commonSearchApi({ queryId : 'EDUDA0040_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv,SCORING_CRITERIA_CD:'10', USE_YN: 'Y', DEL_YN: 'N' } }).then(res => {
        console.log("레스 댄",res)
        if(res.ORESULT_CUR.length != 0){
          res.ORESULT_CUR.forEach(val => {
            if(val.SCORING_LIST_CD === '140'){
              saveTab01Params.POINT_01 = val.SCORING
            }else if(val.SCORING_LIST_CD === '150'){
              saveTab01Params.POINT_02 = val.SCORING
            }else if(val.SCORING_LIST_CD === '160'){
              saveTab01Params.POINT_03 = val.SCORING
            }else if(val.SCORING_LIST_CD === '170'){
              saveTab01Params.POINT_04 = val.SCORING
            }else if(val.SCORING_LIST_CD === '180'){
              saveTab01Params.POINT_05 = val.SCORING
            }else if(val.SCORING_LIST_CD === '190'){
              saveTab01Params.POINT_06 = val.SCORING
            }
          })
        }
      })
      controllerSetting()
    }
  }else if(tab.value ==='tab2'){
    if(btn.id === 'btnTargetSearch'){ //대상자 조회
      new queryFlowHelper(vm, t)
        .setGridList([grdTab02Main])
        .setBefore(beforeSearch2)
        .setQuery(searchTab02Data2)
        .setAfter(afterTab02Search2)
        .run()
    }else if(btn.id === 'btnNewSave'){ //신규저장
      new saveFlowHelper(vm, t)
      .setGridList([grdTab02Main])
      .setBefore(saveTab02Check)
      .setQuery(saveTab02Data)
      .setAfter(afterSaveTab02Data)
      .run()
    }else if(btn.id === 'btnUpdate'){ //저장
      new saveFlowHelper(vm, t)
      .setGridList([grdTab02Main])
      .setBefore(validationTab02Check)
      .setQuery(saveTab02Data2)
      .setAfter(afterSaveTab2Data2)
      .run()
    }
    else if(btn.id === 'btnReset'){ //초기화
      gridRefresh('grdTab02Main')
      searchTab02Yn.value = false
      //현재 등록되어 있는 배점기준 점수로 초기화
      commonSearchApi({ queryId : 'EDUDA0040_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv,SCORING_CRITERIA_CD:'40', USE_YN: 'Y', DEL_YN: 'N' } }).then(res => {
        console.log("레스 댄",res)
        if(res.ORESULT_CUR.length != 0){
          res.ORESULT_CUR.forEach(val => {
            if(val.SCORING_LIST_CD === '200'){
              saveTab02Params.POINT_01 = val.SCORING
            }else if(val.SCORING_LIST_CD === '210'){
              saveTab02Params.POINT_02 = val.SCORING
            }
          })
        }
      })

      controllerSetting()
    }
  }
}

// //그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdTab01Main'){
    grdTab01Main.value.getDataProvider().setRows([])
  }else if(val === 'grdTab02Main'){
    grdTab02Main.value.getDataProvider().setRows([])
  }else if(val === 'grdTab01Version'){
    grdTab01Main.value.getDataProvider().setRows([])
    let searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      MASTER_SEQ : searchTab01Params.MASTER_SEQ
    }
    commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_13', param: searchParams }).then(res => {
      console.log("버전으로 등록된 점수 검색 :::: >>>> ",res)
      if(res.ORESULT_CUR[0] !== null){
        for(let i = 0; i < 6; i++){
          if(i === 0){ saveTab01Params.POINT_01 = res.ORESULT_CUR[0].POINT_01 }
          else if ( i === 1){ saveTab01Params.POINT_02 = res.ORESULT_CUR[0].POINT_02 }
          else if ( i === 2){ saveTab01Params.POINT_03 = res.ORESULT_CUR[0].POINT_03 }
          else if ( i === 3){ saveTab01Params.POINT_04 = res.ORESULT_CUR[0].POINT_04 }
          else if ( i === 4){ saveTab01Params.POINT_05 = res.ORESULT_CUR[0].POINT_05 }
          else if ( i === 5){ saveTab01Params.POINT_06 = res.ORESULT_CUR[0].POINT_06 }
        }
      }

    })
  }else if(val === 'grdTab02Version'){
    grdTab02Main.value.getDataProvider().setRows([])
    let searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      MASTER_SEQ : searchTab02Params.MASTER_SEQ
    }
    commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_13', param: searchParams }).then(res => {
      console.log("버전으로 등록된 점수 검색 :::: >>>> ",res)
      for(let i = 0; i < 2; i++){
        if(i === 0){ saveTab02Params.POINT_01 = res.ORESULT_CUR[0].POINT_01 }
        else if ( i === 1){ saveTab02Params.POINT_02 = res.ORESULT_CUR[0].POINT_02 }
      }
    })
  }
}
//셀변경 이벤트 시작
const onCellEdited = (grid, itemIndex, row, field) => {
  let fieldName = grdTab02Main.value.getGridView().getColumn(field).name
  //console.log('fieldName : ', fieldName)
  // 해당하는 로우 데이터 가져 오기
  let data = grdTab02Main.value.getDataProvider().getJsonRow(row)
  let RANKING_DATE = new Map() // 순서출력을 위해 임시로 부서/점수 저장

  // 안전설계건수 
  // 안전설계건수 변경시 및 부서인원 변경시
  if(fieldName === "SAFETY_DESIGN_CNT" || fieldName === "ASGN_PEOPLE_CNT"){
    // 인당 설계변환율
    //let SAFETY_DESIGN_CNT = isNullCheck(data.SAFETY_DESIGN_CNT)
    let ASGN_PEOPLE_CNT = isNullCheck(data.ASGN_PEOPLE_CNT)
    let PEOPLE_DESIGN_RATE = isNullCheck(data.PEOPLE_DESIGN_RATE)
    // 부서 인원이 0이 아닐때 계산을 하도록
    if(ASGN_PEOPLE_CNT!==0){
      //PEOPLE_DESIGN_RATE = ((isNullCheck(data.SAFETY_DESIGN_CNT) / isNullCheck(data.ASGN_PEOPLE_CNT))/100).toFixed(3)
      PEOPLE_DESIGN_RATE = ((isNullCheck(data.SAFETY_DESIGN_CNT) / isNullCheck(data.ASGN_PEOPLE_CNT))/100)
    }

    // console.log('설계건수 가져 오기 : ', SAFETY_DESIGN_CNT)
    // console.log('부서인원 가져 오기 : ', ASGN_PEOPLE_CNT)
    // console.log('인당 설계변환율 가져 오기 : ', PEOPLE_DESIGN_RATE)

    // 그리드에 값 넣기
    // 인당 설계변환율 값 넣기
    grdTab02Main.value.getDataProvider().setValue(row, "PEOPLE_DESIGN_RATE", PEOPLE_DESIGN_RATE)
    grdTab02Main.value.getGridView().commit()

    // 사업부 평균
    let BSNS_SUM = 0
    let BSNS_AVG = 0
    let PART_PEOPLE_DESIGN_RATE= ref([])
    // 표준편차
    let STDDEV = 0
    // 사업부 평균인 경우 부문별로 데이터 가져와서 평균을 내야함
    
    //console.log('부문값 가져 오기 : ', data.PART_CD)
    // 그리드 데이터 가져오기
    // 부문별 인당 설꼐 변환율을 가져 오기
    let grdTab02MainData = ref([]) // 그리드 데이터
    grdTab02MainData = grdTab02Main.value.getDataProvider().getJsonRows()
    grdTab02MainData.forEach(val => {
      if(val.PART_CD === data.PART_CD ){
        PART_PEOPLE_DESIGN_RATE.value.push(isNullCheck(val.PEOPLE_DESIGN_RATE))
      }
    })

    //console.log('부문별 인당 설계 변환율 : ', PART_PEOPLE_DESIGN_RATE.value)

    // 부문별 합
    for (let i = 0; i < PART_PEOPLE_DESIGN_RATE.value.length; i++) {
      BSNS_SUM += PART_PEOPLE_DESIGN_RATE.value[i];
    }

    if(PART_PEOPLE_DESIGN_RATE.value.length!==0){
      // 부문별 평균
      BSNS_AVG = BSNS_SUM/PART_PEOPLE_DESIGN_RATE.value.length

      // 2. 부문별 인당 설계 변활율과 평균의 차이의 제곱 계산
      let PEOPLE_DESIGN_RATE_AVG_SQU = 0;
      for (let i = 0; i < PART_PEOPLE_DESIGN_RATE.value.length; i++) {
          PEOPLE_DESIGN_RATE_AVG_SQU += Math.pow(PART_PEOPLE_DESIGN_RATE.value[i] - BSNS_AVG, 2)
      }
      //console.log('PEOPLE_DESIGN_RATE_AVG_SQU : ', PEOPLE_DESIGN_RATE_AVG_SQU)

      // 3. 분산 계산
      let VARIANCE = PEOPLE_DESIGN_RATE_AVG_SQU / PART_PEOPLE_DESIGN_RATE.value.length;
      //console.log('VARIANCE : ', VARIANCE)

      // 4. 표준편차 계산
      STDDEV = Math.sqrt(VARIANCE)
    }

    // 그리드에 값 넣기
    // 그리드 데이터 가져오기
    //let INDEX = 0
    grdTab02MainData = ref([]) // 그리드 데이터
    grdTab02MainData = grdTab02Main.value.getDataProvider().getJsonRows()
    grdTab02MainData.forEach(val => {
      if(val.PART_CD === data.PART_CD ){
        // console.log("INDEX : ", INDEX)
        // console.log("val.INDEX_NO : ", val.INDEX_NO)
        // 부문별 사업부 평균
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "BSNS_AVG", BSNS_AVG)
        // 부문별 표준편차
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "STDDEV", STDDEV)
        // Z값((인당 설계 변환율-사업부평균)/표준편차)
        let Z_SCORE = (isNullCheck(val.PEOPLE_DESIGN_RATE) - BSNS_AVG)/STDDEV
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "Z_SCORE", Z_SCORE)

        // 점수
        let SAFETY_DESIGN_SCORE = 0
        // 2024.07.12 박용훈 안전설계 최대 점수에서 가져 오도록 수정
        // if (Z_SCORE * 4 + 35 > 40) {
        //   SAFETY_DESIGN_SCORE = 40
        // } else {
        //   SAFETY_DESIGN_SCORE = Math.min(40, Z_SCORE * 4 + 35)
        // }
        if (Z_SCORE * 4 + 35 > isNullCheck(saveTab02Params.POINT_01)) {
          SAFETY_DESIGN_SCORE = isNullCheck(saveTab02Params.POINT_01)
        } else {
          SAFETY_DESIGN_SCORE = Math.min(isNullCheck(saveTab02Params.POINT_01), Z_SCORE * 4 + 35)
        }
        //console.log('점수 : ', SAFETY_DESIGN_SCORE)
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "SAFETY_DESIGN_SCORE", SAFETY_DESIGN_SCORE)

        // 전체 점수
        let SCORE = SAFETY_DESIGN_SCORE + isNullCheck(val.STRENGTH_SCORE)
        //console.log('전체점수 : ', SCORE)
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "SCORE", SCORE)

        // 순위용 데이터 생성
        let currentScore = RANKING_DATE.get(val.ASGN_CD) || { SCORE: 0, ASGN_CD: [] }
        currentScore.SCORE += SCORE
        currentScore.ASGN_CD.push({ ASGN_CD: val.ASGN_CD, SCORE: SCORE })
        RANKING_DATE.set(val.ASGN_CD, currentScore)
        grdTab02Main.value.getGridView().commit()
      }
      //INDEX++
    })
  }else if(fieldName === "IMPROVED_STRENGTH" || fieldName === "STRENGTH_IMPROVEMENT"|| fieldName === "FREQUENCY_SCORE"){
    // 개선전 강도/개선후 강도/빈도 점수가 변경될때 데이터 수정
    // 강도개선 점수(개선전강도-개선후강도)
    let STRENGTH_IMPROVEMENT_SCORE = isNullCheck(data.IMPROVED_STRENGTH) - isNullCheck(data.STRENGTH_IMPROVEMENT)
    //console.log('강도개선 점수 : ', STRENGTH_IMPROVEMENT_SCORE)

    // 강도X빈도 개선점수(강도개선점수*빈도점수)
    let STRENGTH_FREQUENCY_SCORE = STRENGTH_IMPROVEMENT_SCORE * isNullCheck(data.FREQUENCY_SCORE)
    //console.log('강도X빈도 개선점수 : ', STRENGTH_FREQUENCY_SCORE)

    // 변환율(강도X빈도 개선점수/100)
    let STRENGTH_IMPROVEMENT_RATE = 0
    if(STRENGTH_FREQUENCY_SCORE!==0){
      STRENGTH_IMPROVEMENT_RATE = STRENGTH_FREQUENCY_SCORE/100
    }
    //console.log('변환율 : ', STRENGTH_IMPROVEMENT_RATE)

    // 그리드에 값 넣기
    // 강도개선, 강도/빈도개선점수, 변환율
    grdTab02Main.value.getDataProvider().setValue(row, "STRENGTH_IMPROVEMENT_SCORE", STRENGTH_IMPROVEMENT_SCORE)
    grdTab02Main.value.getDataProvider().setValue(row, "STRENGTH_FREQUENCY_SCORE", STRENGTH_FREQUENCY_SCORE)
    grdTab02Main.value.getDataProvider().setValue(row, "STRENGTH_IMPROVEMENT_RATE", STRENGTH_IMPROVEMENT_RATE)
    grdTab02Main.value.getGridView().commit()

    // BSNS_STRENGTH_AVG 사업부평균(변환률 평균)
    let BSNS_STRENGTH_IMPROVEMENT_RATE = ref([]) // 부문별 변환률
    let BSNS_STRENGTH_IMPROVEMENT_SUM = 0 // 부문별 합
    let BSNS_STRENGTH_AVG = 0 // 부문별 평균
    let STRENGTH_IMPROVEMENT_STDDEV = 0 // 부문별 표준편차
    // 그리드 데이터 가져오기
    // 부문별 변환율을 가져 오기
    let grdTab02MainData = ref([]) // 그리드 데이터
    grdTab02MainData = grdTab02Main.value.getDataProvider().getJsonRows()
    grdTab02MainData.forEach(val => {
      if(val.PART_CD === data.PART_CD ){
        BSNS_STRENGTH_IMPROVEMENT_RATE.value.push(isNullCheck(val.STRENGTH_IMPROVEMENT_RATE))
      }
    })
    //console.log('부문별 변환율 : ', BSNS_STRENGTH_IMPROVEMENT_RATE.value)
    // 부문별 변환율 합
    for (let i = 0; i < BSNS_STRENGTH_IMPROVEMENT_RATE.value.length; i++) {
      BSNS_STRENGTH_IMPROVEMENT_SUM += BSNS_STRENGTH_IMPROVEMENT_RATE.value[i];
    }
    //console.log('부문별 변환율 합 : ', BSNS_STRENGTH_IMPROVEMENT_SUM)

    // 평균 및 표준편차 가져오기
    if(BSNS_STRENGTH_IMPROVEMENT_RATE.value.length!==0){
      // 부문별 변환율 평균
      BSNS_STRENGTH_AVG = BSNS_STRENGTH_IMPROVEMENT_SUM/BSNS_STRENGTH_IMPROVEMENT_RATE.value.length

      // 2. 부문별 변활율과 평균의 차이의 제곱 계산
      let BSNS_STRENGTH_IMPROVEMENT_AVG_SQU = 0;
      for (let i = 0; i < BSNS_STRENGTH_IMPROVEMENT_RATE.value.length; i++) {
          BSNS_STRENGTH_IMPROVEMENT_AVG_SQU += Math.pow(BSNS_STRENGTH_IMPROVEMENT_RATE.value[i] - BSNS_STRENGTH_AVG, 2)
      }
      //console.log('부문별 변활율과 평균의 차이의 제곱 : ', BSNS_STRENGTH_IMPROVEMENT_AVG_SQU)

      // 3. 분산 계산
      let VARIANCE = BSNS_STRENGTH_IMPROVEMENT_AVG_SQU / BSNS_STRENGTH_IMPROVEMENT_RATE.value.length;
      //console.log('VARIANCE : ', VARIANCE)

      // STRENGTH_IMPROVEMENT_STDDEV 표준편차(변환률 표준편차)
      // 4. 표준편차 계산
      STRENGTH_IMPROVEMENT_STDDEV = Math.sqrt(VARIANCE)
    }

    // 그리드에 값 넣기
    //let INDEX = 0
    grdTab02MainData = ref([]) // 그리드 데이터
    grdTab02MainData = grdTab02Main.value.getDataProvider().getJsonRows()
    grdTab02MainData.forEach(val => {
      if(val.PART_CD === data.PART_CD ){
        // console.log("INDEX : ", INDEX)
        // console.log("val.INDEX_NO : ", val.INDEX_NO)
        // 부문별 사업부 평균
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "BSNS_STRENGTH_AVG", BSNS_STRENGTH_AVG)

        // 부문별 표준편차
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "STRENGTH_IMPROVEMENT_STDDEV", STRENGTH_IMPROVEMENT_STDDEV)

        // STRENGTH_Z_SCORE Z값((사업부평균-변환률)/표준편차)
        let STRENGTH_Z_SCORE = (BSNS_STRENGTH_AVG - isNullCheck(val.STRENGTH_IMPROVEMENT_RATE))/STRENGTH_IMPROVEMENT_STDDEV
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "STRENGTH_Z_SCORE", STRENGTH_Z_SCORE)

        // STRENGTH_SCORE 점수
        let STRENGTH_SCORE = 0
        // 2024.07.12 박용훈 안전개선 평가 최대 점수에서 가져 오도록 수정

        // if (55 - STRENGTH_Z_SCORE * 3 > 60) {
        //     STRENGTH_SCORE = 60;
        // } else {
        //     STRENGTH_SCORE = Math.max(55 - STRENGTH_Z_SCORE * 3, 0);
        // }
        if (55 - STRENGTH_Z_SCORE * 3 > isNullCheck(saveTab02Params.POINT_02)) {
            STRENGTH_SCORE = isNullCheck(saveTab02Params.POINT_02);
        } else {
            STRENGTH_SCORE = Math.max(55 - STRENGTH_Z_SCORE * 3, 0);
        }

        //console.log('점수 : ', SAFETY_DESIGN_SCORE)
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "STRENGTH_SCORE", STRENGTH_SCORE)

        // 전체 점수
        let SCORE = isNullCheck(val.SAFETY_DESIGN_SCORE) + STRENGTH_SCORE
        //console.log('전체점수 : ', SCORE)
        grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "SCORE", SCORE)

        // 순위용 데이터 생성
        let currentScore = RANKING_DATE.get(val.ASGN_CD) || { SCORE: 0, ASGN_CD: [] }
        currentScore.SCORE += SCORE
        currentScore.ASGN_CD.push({ ASGN_CD: val.ASGN_CD, SCORE: SCORE })
        RANKING_DATE.set(val.ASGN_CD, currentScore)
        grdTab02Main.value.getGridView().commit()
      }
      //INDEX++
    })
  }

  // 순위 출력 후 그리드에 업데이트
  let RANK_DATE = Array.from(RANKING_DATE.entries()).sort((a, b) => b[1].SCORE - a[1].SCORE)
  let PRE_SCORE = 0
  let NEW_INDEX = 0
  let grdTab02MainData = ref([]) // 그리드 데이터
  grdTab02MainData = grdTab02Main.value.getDataProvider().getJsonRows()
  grdTab02MainData.forEach(val => {
    if(val.PART_CD === data.PART_CD ){
      RANK_DATE.forEach((entry, index) => {
        if(val.ASGN_CD===entry[0]){
          // console.log("INDEX : ", INDEX)
          // console.log("val.INDEX_NO : ", val.INDEX_NO)
          // console.log("entry : ", entry)
          // console.log("index : ", index)
          if(PRE_SCORE !== entry[1].SCORE){
            PRE_SCORE = entry[1].SCORE
            NEW_INDEX = index + 1
            //grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "RANKING", NEW_INDEX)
          }
          //console.log("NEW_INDEX : ", NEW_INDEX)
          grdTab02Main.value.getDataProvider().setValue(val.INDEX_NO, "RANKING", NEW_INDEX)
          grdTab02Main.value.getGridView().commit()
        }
      })
      //INDEX++
    }
  })
}

//널값체크후 숫자 리턴
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? 0 : Number(val)
}

// 검색여부에 따라서 버튼 활성화 및 비활성화
// 조회를 했으면 기간/과팀/대상자검색/신규저장 비활성화
// onButtonsSub
// menuTitle
/* ******************* true: 비활성화 , false: 활성화 ******************** */
const controllerSetting = () => {
  // 생산(탭1)
  if(searchTab01Yn.value){
    //console.log('조회버튼 클릭')
    // 조회버튼을 클릭했을때
    //menuTitle.value.disableBtn('btnUpdate', false)
    onButtonsTab01Sub.value.disableBtn('btnTargetSearch', true)
    onButtonsTab01Sub.value.disableBtn('btnUpdate', true)
    onButtonsTab01Sub.value.disableBtn('btnReset', false)
  }else{
    //console.log('조회버튼 안클릭')
    // 조회버튼을 클릭 안했을때
    onButtonsTab01Sub.value.disableBtn('btnTargetSearch', false)
    onButtonsTab01Sub.value.disableBtn('btnUpdate', false)
    onButtonsTab01Sub.value.disableBtn('btnReset', true)
    //menuTitle.value.disableBtn('btnUpdate', true)
  }
  // 설계(탭2)
  if(searchTab02Yn.value){
    //console.log('조회버튼 클릭')
    // 조회버튼을 클릭했을때
    //menuTitle.value.disableBtn('btnUpdate', false)
    onButtonsTab02Sub.value.disableBtn('btnTargetSearch', true)
    onButtonsTab02Sub.value.disableBtn('btnNewSave', true)
    onButtonsTab02Sub.value.disableBtn('btnUpdate', false)
    onButtonsTab02Sub.value.disableBtn('btnReset', false)
  }else{
    //console.log('조회버튼 안클릭')
    // 조회버튼을 클릭 안했을때
    onButtonsTab02Sub.value.disableBtn('btnTargetSearch', false)
    onButtonsTab02Sub.value.disableBtn('btnNewSave', false)
    onButtonsTab02Sub.value.disableBtn('btnUpdate', true)
    onButtonsTab02Sub.value.disableBtn('btnReset', true)
    //menuTitle.value.disableBtn('btnUpdate', true)
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  // 2024.08.22 박용훈 버전을 선택 해야만 조회가 되도록 수정함
  if(searchTab01Params.MASTER_SEQ === ''){
    Message.warn(t('버전을 선택 하셔야 합니다.'))
    return false
  }
  return true
}

//대상조회, 인원수조회 전 유효성 검사
const beforeSearch2 = () => {
  // 2024.08.22 박용훈 버전을 선택 해야만 조회가 되도록 수정함
  if(searchTab02Params.MASTER_SEQ === ''){
    Message.warn(t('버전을 선택 하셔야 합니다.'))
    return false
  }

  return true
}

// 안전수칙 조회 전 유효성 검사
const beforeSearch3 = () => {
  //console.log('grdTab01Main.value.getGridView().getItemCount() : ', grdTab01Main.value.getGridView().getItemCount())
  // 대상자가 검색이 안되었을때는 동작하면 안됨
  if(grdTab01Main.value.getGridView().getItemCount() <= 0){
    Message.warn(t('대상 검색부터 하셔야 합니다.'))
    return false  
  }
  return true
}

// 핵심가치 실천인상 생산 저장 전 유효성 검사
const saveTab01Check = () => {
  // 대상자가 검색이 안되었을때는 동작하면 안됨
  if(grdTab01Main.value.getGridView().getItemCount() <= 0){
    Message.warn(t('대상 검색부터 하셔야 합니다.'))
    return false  
  }
  return true
}

// 핵심가치 실천인상 설계 신규저장 전 유효성 검사
const saveTab02Check = () => {
  // 대상자가 검색이 안되었을때는 동작하면 안됨
  if(grdTab02Main.value.getGridView().getItemCount() <= 0){
    Message.warn(t('대상 검색부터 하셔야 합니다.'))
    return false  
  }
  return true
}

// 핵심가치 실천인상 생산 조회
const searchTab01Data = idx => {
  if (!searchTab01Params.MASTER_SEQ){
    Message.warn(t('데이터가 없습니다.'))
    return
  }

  gridRefresh('grdTab01Main')
  //console.log('searchTab01Params : ',searchTab01Params)

  console.log("핵심가치 실천인상 생산 조회 :ㅣ::: ",searchTab01Params)
  return commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_01', param: searchTab01Params })
}

// 핵심가치 실천인상 설계 조회
const searchTab02Data = idx => {
  if (!searchTab02Params.MASTER_SEQ){
    Message.warn(t('데이터가 없습니다.'))
    return
  }
  gridRefresh('grdTab02Main')
  //console.log('searchTab02Params : ',searchTab02Params)
  return commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_01', param: searchTab02Params })
}

//핵심가치 실천인상 생산 대상부서 조회
const searchTab01Data2 = idx => {
  gridRefresh('grdTab01Main')
  //console.log('saveParams : ',saveTab01Params)
  console.log("조회하는 데이터 확인",saveTab01Params)
  return commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_02', param: saveTab01Params })
}

//핵심가치 실천인상 설계 대상부서 조회
const searchTab02Data2 = idx => {
  gridRefresh('grdTab02Main')
  //console.log('saveParams : ',saveTab02Params)
  return commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_02', param: saveTab02Params })
}

// 핵심가치 실천인상 생산 검색후
const afterTab01Search = res => {
  console.log("조회된 핵심가치 실천인상 생산 검색 후 ",res)
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  // console.log('res.ORESULT_CUR2 : ',res.ORESULT_CUR2)
  if(res.ORESULT_CUR.length!=0){
    searchTab01Yn.value = true
    grdTab01Main.value.getDataProvider().setRows(res.ORESULT_CUR)
    controllerSetting()
    saveTab01Params.POINT_01 = res.ORESULT_CUR[0].POINT_01
    saveTab01Params.POINT_02 = res.ORESULT_CUR[0].POINT_02
    saveTab01Params.POINT_03 = res.ORESULT_CUR[0].POINT_03
    saveTab01Params.POINT_04 = res.ORESULT_CUR[0].POINT_04
    saveTab01Params.POINT_05 = res.ORESULT_CUR[0].POINT_05
    saveTab01Params.POINT_06 = res.ORESULT_CUR[0].POINT_06
    // 조회조건으로 기준년도 세팅
    saveTab01Params.YEAR = searchTab01Params.YEAR
    saveTab01Params.MNTH = searchTab01Params.MNTH
  }
  grdMainSetColumnLayout('TAB01')
}

// 핵심가치 실천인상 설계 검색후
const afterTab02Search = res => {
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  // console.log('res.ORESULT_CUR2 : ',res.ORESULT_CUR2)
  if(res.ORESULT_CUR.length!=0){
    searchTab02Yn.value = true
    grdTab02Main.value.getDataProvider().setRows(res.ORESULT_CUR)
    controllerSetting()
    // 조회조건으로 기준년도 세팅
    saveTab02Params.YEAR = searchTab02Params.YEAR
    saveTab02Params.MNTH = searchTab02Params.MNTH

    saveTab02Params.POINT_01 = res.ORESULT_CUR[0].POINT_01
    saveTab02Params.POINT_02 = res.ORESULT_CUR[0].POINT_02
  }
  grdMainSetColumnLayout('TAB02')
}

// 핵심가치 실천인상 생산 대상검색후
const afterTab01Search2 = res => {
  console.log("생산 대상 검색 후 ",res)
  grdTab01Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMainSetColumnLayout('TAB01')
}

// 핵심가치 실천인상 설계 대상검색후
const afterTab02Search2 = res => {
  console.log("설계 대상 조회" ,res)
  grdTab02Main.value.getDataProvider().setRows(res.ORESULT_CUR)

  grdMainSetColumnLayout('TAB02')
}


//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/

const saveData = ()=> {
  console.log("여기 오냐??? 저장 파라메트", saveParams2.value)
  return
  return commonExecuteApi({ queryId : 'EDUDA0010_TAB01_SAVE_01', list: saveParams2.value })
}

// 저장 사용자 정의 validation
const validationTab02Check = value => {
  saveTab02Params2.value = []
  saveTab02Params2.value = grdTab02Main.value.getDataProvider().getJsonRows()
  //console.log("저장 파라메트", saveParams2.value)
  return true
}

const saveTab01Data2 = ()=> {
  saveTab01Params2.value = []
  saveTab01Params2.value = saveTab01Params
  saveTab01Params2.value.MASTER_SEQ = 0
  saveTab01Params2.value.INSERT_USER_ID = userStore.userId //등록자
  console.log("생산쪽 저장 테스트 1", saveTab01Params2.value)
  return commonExecuteApi({ queryId : 'EDUDA0010_TAB01_SAVE_01', list: [saveTab01Params2.value] })
}

const afterSaveData = res => {
  commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchTab01Params.YEAR, MNTH : searchTab01Params.MNTH } }) // 버전
    .then(res => {
      if(res.ORESULT_CUR.length!=0){
        codeList.masterSeq = res.ORESULT_CUR
        searchTab01Params.MASTER_SEQ = res.ORESULT_CUR[0].COD
      }
    }).finally(() => {
      onButtonsClick({ id:'btnSearch' })
    })
}


const afterSaveTab01Data2 = res => {
  saveTab01Params2.value = []
  if(res.list[0].length!=0){
    let grdMainData = ref([]) // 그리드 데이터
    grdMainData = grdTab01Main.value.getDataProvider().getJsonRows()
    grdMainData.forEach(val => {
      val.MASTER_SEQ = res.list[0].OUT_MASTER_SEQ
      val.DETAIL_SEQ = 0
      val.INSERT_USER_ID = userStore.userId //등록자
      saveTab01Params2.value.push(val)
    })
    saveTab01Params2.value.push({BSNS_CD : saveTab01Params.BSNS_CD})
    console.log("생산쪽 저장 테스트 222", saveTab01Params2.value)
    commonExecuteApi({ queryId : 'EDUDA0010_TAB01_SAVE_02', list: saveTab01Params2.value }).then(async res => {
      // 년도가 다를때 새로 년도 세팅
      // console.log('searchTab01Params.YEAR : ' ,searchTab01Params.YEAR)
      // console.log('saveTab01Params.YEAR : ' ,saveTab01Params.YEAR)
      if(searchTab01Params.YEAR !== saveTab01Params.YEAR){
        // 년도 바인딩
        await commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv } })
          .then(res => {
            if(res.ORESULT_CUR.length!=0){
              //console.log('저장후 년도 검색' ,res.ORESULT_CUR)
              codeList.year = res.ORESULT_CUR
              findIndex = res.ORESULT_CUR.findIndex(item => item.COD == saveTab01Params.YEAR)
              //console.log('findIndex : ' ,findIndex)
              if(findIndex < 0){
                  findIndex = 0
              }
              searchTab01Params.YEAR = codeList.year[findIndex].COD
            }
          })
      }else{
        searchTab01Params.YEAR = saveTab01Params.YEAR
      }
      
      searchTab01Params.MNTH = saveTab01Params.MNTH

      // 버전
      await commonSearchApi({ queryId : 'EDUDA0010_TAB01_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchTab01Params.YEAR, MNTH : searchTab01Params.MNTH } }) // 버전
        .then(res => {
      //    console.log('저장이후  : ', res.ORESULT_CUR)
          if(res.ORESULT_CUR.length!=0){
            codeList.masterSeq = res.ORESULT_CUR
            searchTab01Params.MASTER_SEQ = res.ORESULT_CUR[0].COD
          }
          onButtonsClick({ id:'btnSearch' })
        })
    }).catch( res =>{
      // 에러 발생시 기존 마스터 테이블 데이터 삭제
      commonExecuteApi({ queryId : 'EDUDA0010_TAB01_DELETE_01', list: [saveTab01Params2.value[0]]})
    })
  }
}


const saveTab02Data = ()=> {
  saveTab02Params2.value = []
  saveTab02Params2.value = saveTab02Params
  saveTab02Params2.value.MASTER_SEQ = 0
  saveTab02Params2.value.INSERT_USER_ID = userStore.userId //등록자
  //console.log("여기 오냐??? 저장 파라메트", saveTab02Params2.value)
  //return 
  //대상검색 신규저장
  console.log("신규 저장될 데이터 확인",saveTab02Params2.value)
  return commonExecuteApi({ queryId : 'EDUDA0010_TAB02_SAVE_01', list: [saveTab02Params2.value] })
}

const saveTab02Data2 = ()=> {
  //console.log("여기 오냐??? 저장 파라메트", saveParams2.value)
  //return
  return commonExecuteApi({ queryId : 'EDUDA0010_TAB02_SAVE_02', list: saveTab02Params2.value })
}

const afterSaveTab02Data = res => {
  saveTab02Params2.value = []
  if(res.list[0].length!=0){
    let grdMainData = ref([]) // 그리드 데이터
    grdMainData = grdTab02Main.value.getDataProvider().getJsonRows()
    grdMainData.forEach(val => {
      val.MASTER_SEQ = res.list[0].OUT_MASTER_SEQ
      val.DETAIL_SEQ = 0
      val.INSERT_USER_ID = userStore.userId //등록자
      saveTab02Params2.value.push(val)
    })
    console.log("신규 저장 22222222 :::: >>>> ",saveTab02Params2.value)
    commonExecuteApi({ queryId : 'EDUDA0010_TAB02_SAVE_02', list: saveTab02Params2.value }).then(async res => {
      // 년도가 다를때 새로 년도 세팅
      // console.log('searchTab02Params.YEAR : ' ,searchTab02Params.YEAR)
      // console.log('saveTab02Params.YEAR : ' ,saveTab02Params.YEAR)
      if(searchTab02Params.YEAR !== saveTab02Params.YEAR){
        // 년도 바인딩
        await commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv } })
          .then(res => {
            if(res.ORESULT_CUR.length!=0){
              //console.log('저장후 년도 검색' ,res.ORESULT_CUR)
              codeList2.year = res.ORESULT_CUR
              findIndex = res.ORESULT_CUR.findIndex(item => item.COD == saveTab02Params.YEAR)
              //console.log('findIndex : ' ,findIndex)
              if(findIndex < 0){
                  findIndex = 0
              }
              searchTab02Params.YEAR = codeList2.year[findIndex].COD
            }
          })
      }else{
        searchTab02Params.YEAR = saveTab02Params.YEAR
      }
      
      searchTab02Params.MNTH = saveTab02Params.MNTH
      
      // 버전
      await commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchTab02Params.YEAR, MNTH : searchTab02Params.MNTH } }) // 버전
        .then(res => {
      //    console.log('저장이후  : ', res.ORESULT_CUR)
          if(res.ORESULT_CUR.length!=0){
            codeList2.masterSeq = res.ORESULT_CUR
            searchTab02Params.MASTER_SEQ = res.ORESULT_CUR[0].COD
          }
          onButtonsClick({ id:'btnSearch' })
        })
    }).catch( res =>{
      // 에러 발생시 기존 마스터 테이블 데이터 삭제
      commonExecuteApi({ queryId : 'EDUDA0010_TAB02_DELETE_01', list: [saveTab02Params2.value[0]]})
    })
  }
}

const afterSaveTab2Data2 = res => {
  commonSearchApi({ queryId : 'EDUDA0010_TAB02_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchTab02Params.YEAR, MNTH : searchTab02Params.MNTH } }) // 버전
    .then(res => {
      if(res.ORESULT_CUR.length!=0){
        codeList2.masterSeq = res.ORESULT_CUR
        searchTab02Params.MASTER_SEQ = res.ORESULT_CUR[0].COD
      }
    }).finally(() => {
      onButtonsClick({ id:'btnSearch' })
    })
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

  // 행 병합 그룹핑(mergeMode)을 사용하면 groupPanel.visible 사용할 필요가 없으며, 대신 groupBy 세팅된 순서대로 컬럼이 이동됨
  //grdTab03Main.value.getGridView().groupPanel.visible = false //그룹패널 안보이게하기
  grdTab01Main.value.getGridView().groupBy(["BSNS_NM","PART_NM","PRNT_NM"]) //BSNS_COMP_NM 기준으로 그룹핑
  grdTab01Main.value.getGridView().setRowGroup
  ({ 
    expandedAdornments: "footer"  //그룹을 펼쳤을때 FOOTER만 보이기
    //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
    , mergeExpanderVisibility: "none" //그룹 접기 여부 화면에 안보이게하기
    , mergeMode: true // 행 병합 그룹핑 활성화
    //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
  })
  grdTab02Main.value.getGridView().groupBy(["BSNS_NM","PART_NM"]) //BSNS_COMP_NM 기준으로 그룹핑
  grdTab02Main.value.getGridView().setRowGroup
  ({ 
    expandedAdornments: "footer"  //그룹을 펼쳤을때 FOOTER만 보이기
    //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
    , mergeExpanderVisibility: "none" //그룹 접기 여부 화면에 안보이게하기
    , mergeMode: true // 행 병합 그룹핑 활성화
    //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
    , sorting: false
  })
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
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        
        <v-sheet class="mb-2">
          <v-tabs v-model="tab">
            <v-tab value="tab1">생산</v-tab>
            <v-tab value="tab2">설계</v-tab>
          </v-tabs>
        </v-sheet>
        <v-sheet v-show="tab == 'tab1'" class="h-auto" >
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('년도')"
              width="130px"
              v-model="searchTab01Params.YEAR"
              :items="codeList.year"
              item-value="COD"
              item-title="TXT"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('월')"
              width="100px"
              v-model="searchTab01Params.MNTH"
              :items="codeList.mnth"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab01Main')"
            />
            <i-select
              :label="$t('버전')"
              labelWidth="26px"
              width="350px"
              v-model="searchTab01Params.MASTER_SEQ"
              :items="codeList.masterSeq"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab01Version')"
            />
          </v-sheet>
          <!-- 메인그리드 -->
          <v-sheet class="h-auto">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('관리기준 대비 증감')"
                labelWidth="106px"
                width="160px"
                v-model="saveTab01Params.POINT_01"
                reverse
                readonly
              />
              <i-input
                :label="$t('절대수칙/중점관리 증감')"
                labelWidth="133px"
                width="187px"
                v-model="saveTab01Params.POINT_02"
                reverse
                readonly
              />
              <i-input
                :label="$t('사고 증감')"
                labelWidth="53px"
                width="107px"
                v-model="saveTab01Params.POINT_03"
                reverse
                readonly
              />
              <i-input
                :label="$t('중대성 사고/구급차 미이용')"
                labelWidth="148px"
                width="203px"
                v-model="saveTab01Params.POINT_04"
                reverse
                readonly
              />
              <i-input
                :label="$t('협력사 수준평가')"
                labelWidth="92px"
                width="146px"
                v-model="saveTab01Params.POINT_05"
                reverse
                readonly
              />
              <i-input
                :label="$t('안전 칭찬 쿠폰')"
                labelWidth="82px"
                width="136px"
                v-model="saveTab01Params.POINT_06"
                reverse
                readonly
              />
            </div>
            <v-sheet class="d-flex justify-end mB-5">
              <i-select
                :label="$t('기준년도')"
                width="160px"
                v-model="saveTab01Params.YEAR"
                type="YEAR"
                @update:model-value="gridRefresh('grdTab01Main')"
              />
              <i-select
                :label="$t('월')"
                width="120px"
                v-model="saveTab01Params.MNTH"
                :items="saveTab01CodeList.mnth"
                item-title="TXT"
                item-value="COD"
                @update:model-value="gridRefresh('grdTab01Main')"
              />
              <i-select
                :label="$t('사업부')"
                labelWidth="39px"
                width="200px"
                v-model="saveTab01Params.BSNS_CD"
                :items="saveTab01CodeList.bsnsCd"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                @update:model-value="gridRefresh('grdTab01Main')"
              />
              <IButtonList
                :button-list="['btnTargetSearch', 'btnUpdate', 'btnReset']"
                @click-button="onButtonsSubClick"
                ref="onButtonsTab01Sub"
              />
            </v-sheet>

              <RealGrid
                ref="grdTab01Main"
                :grid-view-option="grdTab01MainProps.gridViewOption"
                :fields="grdTab01MainProps.fields"
                :columns="grdTab01MainProps.columns"
                :column-layout="grdTab01MainProps.columnLayout"
                @onCellClicked="onCellClicked"
              />
            <!-- </div> -->
          </v-sheet>
        </v-sheet>
        <v-sheet v-show="tab == 'tab2'" class="h-auto" >
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('년도')"
              width="130px"
              v-model="searchTab02Params.YEAR"
              :items="codeList2.year"
              item-value="COD"
              item-title="TXT"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('월')"
              width="100px"
              v-model="searchTab02Params.MNTH"
              :items="codeList2.mnth"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab02Main')"
            />
            <i-select
              :label="$t('버전')"
              labelWidth="26px"
              width="350px"
              v-model="searchTab02Params.MASTER_SEQ"
              :items="codeList2.masterSeq"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab02Version')"
            />
          </v-sheet>
          <!-- 메인그리드 -->
          <v-sheet class="h-auto">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('안전설계 건수')"
                labelWidth="78px"
                width="132px"
                v-model="saveTab02Params.POINT_01"
                reverse
                readonly
              />
              <i-input
                :label="$t('안전개선 평가')"
                labelWidth="78px"
                width="132px"
                v-model="saveTab02Params.POINT_02"
                reverse
                readonly
              />
            </div> 
            <v-sheet class="d-flex justify-end mB-5"> 
              <i-select
                :label="$t('기준년도')"
                width="160px"
                v-model="saveTab02Params.YEAR"
                type="YEAR"
                @update:model-value="gridRefresh('grdTab02Main')"
              />
              <i-select
                :label="$t('월')"
                width="120px"
                v-model="saveTab02Params.MNTH"
                :items="saveTab02CodeList.mnth"
                item-title="TXT"
                item-value="COD"
                @update:model-value="gridRefresh('grdTab02Main')"
              />
              <i-select
                :label="$t('사업부')"
                labelWidth="39px"
                width="200px"
                v-model="saveTab02Params.BSNS_CD"
                :items="saveTab02CodeList.bsnsCd"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                @update:model-value="gridRefresh('grdTab02Main')"
              />
              <IButtonList
                :button-list="['btnTargetSearch', 'btnNewSave', 'btnUpdate', 'btnReset']"
                @click-button="onButtonsSubClick"
                ref="onButtonsTab02Sub"
              />
            </v-sheet>
            <RealGrid
              ref="grdTab02Main"
              :grid-view-option="grdTab02MainProps.gridViewOption"
              :fields="grdTab02MainProps.fields"
              :columns="grdTab02MainProps.columns"
              :column-layout="grdTab02MainProps.columnLayout"
              @onCellEdited="onCellEdited"
            />
            <!-- </div> -->
          </v-sheet>
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
    min-height: 300px;
  }
}
</style>
