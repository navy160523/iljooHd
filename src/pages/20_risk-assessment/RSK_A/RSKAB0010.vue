<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import SafetyAccidents from '@/pages/20_risk-assessment/RSK_A/RSKAB0010Popup.vue'
import { useCommonStore } from '@hiway/stores/common' 

defineOptions({
  name:'20_risk-assessment-RSK_A-RSKAB0010',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const grdSub2 = ref(null)
const safetyAccidents = ref(null)
const router = useRouter()
const commonStore = useCommonStore() 
const fSTAT_RISK_RATE = 0.0

//조회조건
let searchParams = reactive({    
  CMPNY_DIV: 'HHI',                 // 회사
  BSNS_CD: '',                      // 사업부
  ASGN_CD: '',                      // 조직
  SECTOR_CD: '',                    // 부문
  PART_CD: '',                      // 담당
  DEPT_CD: '',                      // 부서
  DEPT_TYPE: '',                    // 직영, 협력사 구분
  PROD_DIV: '',                     // 생산/비생산
  YEAR: dayjs().year(),             // 기준년도
  HALF: (dayjs().get("month") + 1) <= 6 ? '1' : '2',
})

const codeList = reactive({
  companyList: [
    {COD: 'HHI' , TXT: 'HD현대중공업'},
    {COD: '230' , TXT: 'HD현대중공업MOS'},
  ],
  bsnsList: [],
  sectorList: [],
  partList: [],
  deptList: [],
  /* 직영/협력사 구분 */
  typeList: [
    {COD: '' , TXT: '전체'},
    {COD: '1' , TXT: '직영'},
    {COD: '0' , TXT: '협력사'},
  ],
  /* 생산/비생산 */
  PROD_DIVList: [
    {COD: '' , TXT: '전체'},
    {COD: 'P' , TXT: '생산'},
    {COD: 'N' , TXT: '비생산'},
    {COD: 'S' , TXT: '지원'},
  ],
  /* 반기 */
  harfList: [
    {COD: '1' , TXT: '상반기'},
    {COD: '2' , TXT: '하반기'},
  ]
})

/* ******************* 위험성평가모니터링 메인 그리드 ******************* */
const grdMainProps = reactive({
  gridViewOption : {stateBar: { visible: false }, header: { height: 80 }, edit: { editable:false },footer: { visible:true }},
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, width: '200', mergeRule: { criteria: "value" }}, 
    { fieldName: 'CORP_NM', dataType: 'text', header: { text: t('조직명') }, width: '200'},
    { fieldName: 'DEPT_TYPE', dataType: 'text', header: { text: t('구분') }, width: '70'},
    { fieldName: 'STAT_WORK_TOTAL_COUNT', dataType: 'number', header: { text: t('전체') }, numberFormat: "#,##0", width: '80'
      , footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column cursor_pointer'},
    { fieldName: 'STAT_WORK_CURRENT_COUNT', dataType: 'number', header: { text: t('기존') }, numberFormat: "#,##0", width: '80'
      , footer: {expression: 'sum', numberFormat: "#,##0"},  styleName: 'right-column'},
    { fieldName: 'STAT_WORK_C_COUNT', dataType: 'number', header: { text: t('신규제정') }, numberFormat: "#,##0", width: '80'
      , footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'STAT_RISK_PROGRESS_COUNT', dataType: 'number', header: { text: t('실시') }, numberFormat: "#,##0", width: '80'
      , footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column cursor_pointer'},
    { fieldName: 'STAT_RISK_PROGRESS_NOT_COUNT', dataType: 'number', header: { text: t('미실시') }, numberFormat: "#,##0", width: '80'
      , footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column cursor_pointer'},
    { fieldName: 'STAT_RISK_RATE', dataType: 'number', header: { text: t('실시율(%)') }, numberFormat: "#,##0.##", width: '80'
      , footer: {valueCallback: function(grid){                  
                  var iTOT =  Number(grid.getSummary("STAT_WORK_TOTAL_COUNT","sum"));                  
                  var iVAL = Number(grid.getSummary("STAT_RISK_PROGRESS_COUNT","sum"));
                  var sum = 0
                  if(iTOT > 0) {
                    sum = iVAL / iTOT * 100
                  }
                  return sum;
              }, numberFormat: "#,##0.0#", suffix: ' %'}
      , styleName: 'right-column' },
    { fieldName: 'STAT_OVER_TOTAL_COUNT', dataType: 'number', header: { text: t('전체') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'STAT_OVER_POSSIBLE_COUNT', dataType: 'number', header: { text: t('허용가능') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'STAT_OVER_IMPOSSIBLE_COUNT', dataType: 'number', header: { text: t('허용불가능') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'AVG_RISK_CNT', dataType: 'number', header: { text: t('평균위험성') }, numberFormat: "#,##0", width: '80'},
      // ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'STAT_SRSRM_TOTAL_COUNT', dataType: 'number', header: { text: t('전체') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column cursor_pointer'},
    { fieldName: 'STAT_SRSRM_PROGRESS_NOT_COUNT', dataType: 'number', header: { text: t('미등록') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'STAT_SRSRM_PROGRESS_COUNT', dataType: 'number', header: { text: t('진행중') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', styleName: 'center-column, numberFormat: "#,##0"'}, styleName: 'right-column'},
    { fieldName: 'STAT_SRSRM_COMPLETE_COUNT', dataType: 'number', header: { text: t('결재완료') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'STAT_SRSRM_RATE', dataType: 'number', header: { text: t('개선율(%)') }, numberFormat: "#,##0.##", width: '80'
      , footer: {valueCallback: function(grid){                  
                  var iTOT =  Number(grid.getSummary("STAT_SRSRM_TOTAL_COUNT","sum"));                  
                  var iVAL = Number(grid.getSummary("STAT_SRSRM_COMPLETE_COUNT","sum"));
                  var sum = 0
                  if(iTOT > 0) {
                    sum = iVAL / iTOT * 100
                  }
                  return sum;
              }, numberFormat: "#,##0.0#", suffix: ' %'}
      , styleName: 'right-column'},
    // { fieldName: 'FRE_RISK_ASSESSMENTS_CNT', dataType: 'text', header: { text: t('실시') }},
    { fieldName: 'WORK_ACC_CNT', dataType: 'number', header: { text: t('작업성 사고\n(전체)'), styleName: "multiline-editor" }, numberFormat: "#,##0", width: '100'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column cursor_pointer'},
    { fieldName: 'WORK_STANDARD_REVISION', dataType: 'number', header: { text: t('작업표준 개정') }, numberFormat: "#,##0", width: '100'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'NON_WORK_RISK_ACC', dataType: 'number', header: { text: t('작업표준 제정'), styleName: "multiline-editor" }, numberFormat: "#,##0", width: '120'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'RISK_ACC_NOT_IMPL', dataType: 'number', header: { text: t('미실시')}, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'},
    { fieldName: 'RISK_ACC_RATE', dataType: 'number', header: { text: t('실시율(%)')}, numberFormat: "#,##0.##", width: '80'
      , footer: {valueCallback: function(grid){                  
                  var iTOT =  Number(grid.getSummary("WORK_ACC_CNT","sum"));                  
                  var iVAL1 = Number(grid.getSummary("WORK_STANDARD_REVISION","sum"));
                  var iVAL2 = Number(grid.getSummary("NON_WORK_RISK_ACC","sum"));                  
                  var sum = 0
                  if(iTOT > 0) {
                    sum = (iVAL1+iVAL2) / iTOT * 100
                  }
                  return sum;
              }, numberFormat: "#,##0.0#", suffix: ' %'}
      , styleName: 'right-column'},
    { fieldName: 'RISK_ACC_NON_WORK', dataType: 'number', header: { text: t('수시 위험성평가\n(비일상작업)'), styleName: "multiline-editor"}, numberFormat: "#,##0.##", width: '120'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column'}, 


    { fieldName: 'SAFETY_ACC_CNT', dataType: 'number', header: { text: t('안전사고') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column', visible: false}, 
    { fieldName: 'WORK_STANDARD_CNT', dataType: 'number', header: { text: t('작업표준') }, numberFormat: "#,##0", width: '80'
      ,footer: {expression: 'sum', numberFormat: "#,##0"}, styleName: 'right-column', visible: false},

    { fieldName: 'COMP_CD', dataType: 'text', visible: false },
    { fieldName: 'COMPANY_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD_N', dataType: 'text', visible: false },
    { fieldName: 'PARTNER_CD', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'HALF', dataType: 'text', visible: false },
  
  ],
  columns : [],
  columnLayout: [
    'DEPT_NM', 'CORP_NM','DEPT_TYPE',
    {
      name: '작업표준 현황',
      direction: 'horizontal',
      items: [ 'STAT_WORK_TOTAL_COUNT', 'STAT_WORK_CURRENT_COUNT','STAT_WORK_C_COUNT' ],
      header: { text: t('작업표준 현황') },
    },
    {
      name: '정기 위험성평가',
      direction: 'horizontal',
      items: [
        {
          name: '평가실시 현황',
          direction: 'horizontal',
          items: [ 'STAT_RISK_PROGRESS_COUNT', 'STAT_RISK_PROGRESS_NOT_COUNT','STAT_RISK_RATE' ],
          header: { text: t('평가실시 현황') },
        },
        {
          name: '위험성정보',
          direction: 'horizontal',
          items: [ 'STAT_OVER_TOTAL_COUNT', 'STAT_OVER_POSSIBLE_COUNT','STAT_OVER_IMPOSSIBLE_COUNT' , 'AVG_RISK_CNT'],
          header: { text: t('위험성정보') },
        },
        {
          name: '중요위험 특별감소대책',
          direction: 'horizontal',
          items: [ 'STAT_SRSRM_TOTAL_COUNT', 'STAT_SRSRM_PROGRESS_NOT_COUNT','STAT_SRSRM_PROGRESS_COUNT' , 'STAT_SRSRM_COMPLETE_COUNT', 'STAT_SRSRM_RATE'],
          header: { text: t('중요위험 특별감소대책') },
        },
      ],
      header: { text: t('정기 위험성평가') },
    },
    {
      name: '수시 위험성평가(안전사고)',
      direction: 'horizontal',
      items: [
        'WORK_ACC_CNT', 
        'WORK_STANDARD_REVISION',
        'NON_WORK_RISK_ACC',
        'RISK_ACC_NOT_IMPL',
        'RISK_ACC_RATE'
      ],
      header: { text: t('수시 위험성평가') },
    },
    'RISK_ACC_NON_WORK'
    // {
    //   name: '수시(안전사고)',
    //   direction: 'horizontal',
    //   items: [ 'SAFETY_ACC_CNT', 'WORK_STANDARD_CNT'],
    //   header: { text: t('정기 위험성평가') },
    // },
    // {
    //   name: '정기 위험성평가 위험요인',
    //   direction: 'horizontal',
    //   items: [ 'STAT_OVER_TOTAL_COUNT', 'STAT_OVER_POSSIBLE_COUNT','STAT_OVER_IMPOSSIBLE_COUNT' , 'AVG_RISK_CNT'],
    //   header: { text: t('정기 위험성평가') },
    // },
    // {
    //   name: '중요위험 특별감소대책',
    //   direction: 'horizontal',
    //   items: [ 'STAT_SRSRM_TOTAL_COUNT', 'STAT_SRSRM_PROGRESS_NOT_COUNT','STAT_SRSRM_PROGRESS_COUNT' , 'STAT_SRSRM_COMPLETE_COUNT', 'STAT_SRSRM_RATE'],
    //   header: { text: t('정기 위험성평가') },
    // },
    // 'FRE_RISK_ASSESSMENTS_CNT'
  ]
})
grdMainProps.columns = grdMainProps.fields

/* ******************* 작업표준리스트 그리드(숨김) ******************* */
const grdSubProps = reactive({
  gridViewOption : {stateBar: { visible: false },edit: { editable:false }},
  keys : [],
  fields : [ 
    { fieldName: 'COMPANY_CD', dataType: 'text', header: { text: t('회사'), exportStyleName: 'export_header_style' }, 
      exportStyleName: 'export_style', width: '150', styleName: 'left-column', lookupDisplay: true, lookupData: { value: "COD", label: "TXT", list: codeList.companyList }}, 
    { fieldName: 'GUBUN_NM', dataType: 'text', header: { text: t('분류'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '200', styleName: 'left-column'},
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', header: { text: t('작업표준명'), exportStyleName: 'export_header_style' }, width: '300', exportStyleName: 'export_style', styleName: 'left-column'},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '180'},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '180'},
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('조직명'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'USER_NM', dataType: 'text', header: { text: t('작성자'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'MIN_DT', dataType: 'text', header: { text: t('재정일자'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'MAX_DT', dataType: 'text', header: { text: t('개정일자'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'RISK_TYPE_NM', dataType: 'text', header: { text: t('평가유형'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'WORK_STANDARD_ACT_COUNT', dataType: 'text', header: { text: t('작업행동개수'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'WORK_STANDARD_RISK_COUNT', dataType: 'text', header: { text: t('위험요인'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'WORK_STANDARD_RISK_OVER_COUNT', dataType: 'text', header: { text: t('허용불가능 위험요인'), exportStyleName: 'export_header_style' }, width: '150', exportStyleName: 'export_style'},
    { fieldName: 'WORK_STANDARD_AVG_RISK', dataType: 'text', header: { text: t('평균위험성 점수'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'WORK_STANDARD_IMG_COUNT', dataType: 'text', header: { text: t('사진등록'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('문서번호'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', styleName: 'left-column', width: '300'},
  
  ],
  columns : []
})

grdSubProps.columns = grdSubProps.fields

/* ******************* 특별감소대책(숨김) ******************* */
const grdSub2Props = reactive({
  gridViewOption : {stateBar: { visible: false },edit: { editable:false }},
  keys : [],
  fields : [ 
    { fieldName: 'COMPANY_CD', dataType: 'text', header: { text: t('회사'), exportStyleName: 'export_header_style' }, 
      exportStyleName: 'export_style', width: '150', styleName: 'left-column', lookupDisplay: true, lookupData: { value: "COD", label: "TXT", list: codeList.companyList }}, 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '200'},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '200'},
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('조직명'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '200'},
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('문서번호'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', styleName: 'left-column', width: '250'},
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', header: { text: t('작업표준명'), exportStyleName: 'export_header_style' }, width: '300', exportStyleName: 'export_style', styleName: 'left-column'},
    { fieldName: 'ACT_NM', dataType: 'text', header: { text: t('작업행동'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style multiline-editor', width: '350', styleName: 'left-column'},
    { fieldName: 'RISK_NM', dataType: 'text', header: { text: t('위험요인'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style multiline-editor', width: '300'},
    { fieldName: 'BEFOR_RISK', dataType: 'text', header: { text: t('개선전위험성'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'RM_NM', dataType: 'text', header: { text: t('위험감소대책'), exportStyleName: 'export_header_style' }, width: '300', exportStyleName: 'export_style multiline-editor'},
    { fieldName: 'IM_COMPLETE_DT', dataType: 'text', header: { text: t('개선완료일'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'AFTER_RISK', dataType: 'text', header: { text: t('개선후위험성'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'SRSRM_DESC', dataType: 'text', header: { text: t('조치결과'), exportStyleName: 'export_header_style' }, width: '350', exportStyleName: 'export_style multiline-editor'},
    { fieldName: 'USER_NM', dataType: 'text', header: { text: t('담당자'), exportStyleName: 'export_header_style' }, width: '150', exportStyleName: 'export_style'}
  
  ],
  columns : []
})
grdSub2Props.columns = grdSub2Props.fields

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()  
  }else if(btn.id === 'btnWorkStandard') {
    workStandard()
  }else if(btn.id === 'btnMeasures'){
    measures()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'RSKAB0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  res.ORESULT_CUR.forEach(e => {
    for(let i in e){
      if(i === 'RISK_ACC_RATE' || i === 'STAT_SRSRM_RATE' || i === 'STAT_RISK_RATE'){
        if(!e[i]){
          e[i] = 0
        }
      }
    }
  })
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  cellStyle()
}

/* *********************** 작업표준리스트 *********************** */
const workStandard = () => {
  commonSearchApi({ queryId : 'RSKAB0010_SEARCH_02', param: searchParams }).then( res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)

    grdSub.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '작업표준리스트_' + dayjs().format('YYYY-MM-DD') + '.xlsx', // 저장될 파일 name
      documentTitle: { 
        //제목
        message: "작업표준/ 위험성 평가 리스트 - 결재완료",
        visible: true,
        spaceTop: 1,
        spaceBottom: 0,
        height: 50,
        styleName: "excelTitle",
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  })
}

/* *********************** 특별감소대책 엑셀 다운로드 *********************** */
const measures = () => {
  commonSearchApi({ queryId : 'RSKAB0010_SEARCH_03', param: searchParams }).then( res => {
    grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)

    grdSub2.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '특별감소대책_' + dayjs().format('YYYY-MM-DD') + '.xlsx', // 저장될 파일 name
      documentTitle: { 
        //제목
        message: "중요위험 특별감소대책",
        visible: true,
        spaceTop: 1,
        spaceBottom: 0,
        height: 50,
        styleName: "excelTitle",
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  })
}

/* ******************* 평균위험성 색상 변경 ******************* */
const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if(dataCell.dataColumn.fieldName === 'AVG_RISK_CNT'){
      if(dataCell.value < 7){
        ret.style = { background: 'green', color: 'white'}
      }else if(dataCell.value < 15){
        ret.style = { background: '#FFA726', color: 'white' }
      }else {
        ret.style = { background: 'red', color: 'white' }
      }

      if(!dataCell.value){
        ret.style = { background: 'white' }
      }
    }
    return ret
  })
}

/* ******************* 안전사고 cell 클릭 ******************* */
const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data'){
    let fieldName = clickData.fieldName
    let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    rowData.YEAR = searchParams.YEAR
    rowData.HALF = searchParams.HALF
    if(fieldName === 'STAT_WORK_TOTAL_COUNT' || fieldName === 'STAT_RISK_PROGRESS_COUNT' || fieldName === 'STAT_RISK_PROGRESS_NOT_COUNT'){
      
      commonStore.loading = true
      router.push({path: '/20_risk-assessment/RSK_B/RSKBA0020', state: { data: rowData}})
    }else if(fieldName === 'STAT_SRSRM_TOTAL_COUNT'){
      commonStore.loading = true
      router.push({path: '/20_risk-assessment/RSK_B/RSKBA0030', state: { data: rowData}})
    }


    if(clickData.fieldName === 'WORK_ACC_CNT'){
      let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      rowData.HALF = searchParams.HALF
      rowData.YEAR = searchParams.YEAR
      
      /* ***** 안전사고 팝업 오픈 ***** */
      safetyAccidents.value.openPopup(rowData)
    }
  }
}


const comboChange = gbn => {
  let param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    SECTOR_CD: searchParams.SECTOR_CD,
    PART_CD: searchParams.PART_CD,
    USE_DIV: 'Y'
  }
  if(gbn === 'company'){
    /* 사업부,부문,담당,부서 초기화 */
    searchParams.BSNS_CD = null
    searchParams.SECTOR_CD = null
    searchParams.PART_CD = ''
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'searchBSNS', param:param })]).then(res => {
      codeList.bsnsList = res[0].ORESULT_CUR
      codeList.bsnsList.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      searchParams.BSNS_CD = ''
    })
  }else if(gbn === 'bsns'){
    /* 부문,담당,부서 초기화 */
    codeList.sectorList = []
    codeList.partList = [{ PART_NM: '전체', PART_CD: '' }]
    codeList.deptList = [{ DEPT_NM: '전체', DEPT_CD: '' }]
    searchParams.SECTOR_CD = ''
    searchParams.PART_CD = ''
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'SECTOR_COMBO', param:param })]).then(res => {
      codeList.sectorList = res[0].ORESULT_CUR
      codeList.sectorList.unshift({ SECTOR_NM: '전체', SECTOR_CD: '' })
      searchParams.SECTOR_CD = ''

      comboChange('sector')
      comboChange('part')
    })
  }else if(gbn === 'sector'){
    /* 담당,부서 초기화 */
    codeList.partList = []
    codeList.deptList = [{ DEPT_NM: '전체', DEPT_CD: '' }]
    searchParams.PART_CD = ''
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'PART_COMBO', param })]).then(res => {
      codeList.partList = res[0].ORESULT_CUR
      codeList.partList.unshift({ PART_NM: '전체', PART_CD: '' })
      searchParams.PART_CD = ''
      comboChange('part')
    })
  }else if(gbn === 'part'){
    /* 부서 초기화 */
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'DEPT_COMBO', param })]).then(res => {
      codeList.deptList = res[0].ORESULT_CUR
      codeList.deptList.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      searchParams.DEPT_CD = ''
    })
  }
}

const initCodeList = () => {
  // codeList.sectorList.unshift({ SECTOR_NM: '전체', SECTOR_CD: '' })
  // codeList.partList.unshift({ PART_NM: '전체', PART_CD: '' })
  // codeList.deptList.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
}

// 그리드 데이터 바인딩
onMounted(() => {
  comboChange('company')
  comboChange('bsns')
  comboChange('sector')
  comboChange('part')
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnWorkStandard' , 'btnMeasures']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-select 
              :label="$t('회사')"
              labelWidth="55px"
              width="250px"
              :items="codeList.companyList"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.CMPNY_DIV"
              @update:modelValue="comboChange('company')"
            />
            <i-select 
              :label="$t('사업부')"
              labelWidth="45px"
              width="250px"
              :items="codeList.bsnsList"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              v-model="searchParams.BSNS_CD"
              @update:modelValue="comboChange('bsns')"
            />
            <i-select 
              :label="$t('부문')"
              labelWidth="30px"
              width="250px"
              :items="codeList.sectorList"
              item-title="SECTOR_NM"
              item-value="SECTOR_CD"
              v-model="searchParams.SECTOR_CD"
              @update:modelValue="comboChange('sector')"
            />
            <i-select 
              :label="$t('담당')"
              labelWidth="30px"
              width="250px"
              :items="codeList.partList"
              item-title="PART_NM"
              item-value="PART_CD"
              v-model="searchParams.PART_CD"
              @update:modelValue="comboChange('part')"
            />
            <i-select 
              :label="$t('부서')"
              labelWidth="30px"
              width="250px"
              :items="codeList.deptList"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              v-model="searchParams.DEPT_CD"
            />
            <i-select 
              :label="$t('직영/협력사 구분')"
              labelWidth="100px"
              width="220px"
              :items="codeList.typeList"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.DEPT_TYPE"
            />
            <i-select 
              :label="$t('생산/비생산')"
              labelWidth="80px"
              width="200px"
              :items="codeList.PROD_DIVList"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.PROD_DIV"
            />
          </div>
          <div class="d-flex mt-1">
            <i-select 
              :label="$t('기준년도')"
              labelWidth="55px"
              width="250px"
              type="YEAR"
              v-model="searchParams.YEAR"
            />
            <i-select 
              :label="$t('반기')"
              labelWidth="45px"
              width="250px"
              :items="codeList.harfList"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.HALF"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
        <v-sheet class="pa-0 h-auto" v-show="false">
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
          />
        </v-sheet>
        <v-sheet class="pa-0 h-auto" v-show="false">
          <RealGrid
            ref="grdSub2"
            :grid-view-option="grdSub2Props.gridViewOption"
            :keys="grdSub2Props.keys" 
            :fields="grdSub2Props.fields"
            :columns="grdSub2Props.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SafetyAccidents ref="safetyAccidents" />
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
