<!--
  화면명 : 교육강좌 관리
  화면개요 : 교육강좌 관리 조회 추가 저장 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EDUAA0020Pop01 from '@/pages/60_edu/EDU_A/EDUAA0020Pop01.vue'
import EDUAA0020Pop02 from '@/pages/60_edu/EDU_A/EDUAA0020Pop02.vue'
import CurriculumPopup from '@/components/popup/CurriculumPopup.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import { isNull } from 'lodash-es'

defineOptions({
  name:'60_edu-EDU_A-EDUAA0020',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)
const userStore = useUserStore()
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const grdSub3 = ref(null)
const eDUAA0020Pop01 = ref(null)
const eDUAA0020Pop02 = ref(null)
const curriculumPopup = ref(null)
const tab = ref('tab')
const EDU_HOUR_TEXT = ref('총 이수 시간(H)')
//const searchArea = ref(null)
const saveList= ref([])

//코드리스트 세팅 
const codeList = reactive({
  DIVISION_MAIN: [],
  DIVISION_DET: [],
  LINK_CODE: [],
  MNG_ORGN_MAIN: [],
  MNG_ORGN_DET: [],
  CERT_DIV: [],
  EDU_CYCLE: [],
  EDU_TIME: [],
})

//상세내역 리스트
const detailList = reactive({
  CLEAR_YN: 'Y',
  CURR_ID: '',
  DIVISION: '', //상세내역 분류임
  UNIT_CODE: '',
  CURR_NM: '',
  TARGET: '',
  MT_CYCLE: '',
  LINK_CODE: '',
  CERT_DIV: [],
  SLI_YN: 'N',
  REQ_YN: 'N',
  EXAM_YN: 'N',
  MEDIA_YN: 'N',
  VEND_COST_YN: 'N',
  EDU_HOUR: '',
  LUNCH_CNT: '',
  PROD_SUM_YN: 'N',
  MONITOR_YN: 'N',
  STICKER_YN: 'N',
  DELETE_YN: 'N',
  AGE: '0',
})

//교육 강좌 리스트 그리드 셋팅
const grdMainProps1 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, lookupDisplay: true, width: '30'  },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, width: '130', styleName: 'left-column'  },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('대상') }, width: '100', styleName: 'left-column'  },
    { fieldName: 'DELETE_YN', dataType: 'text', header: { text: t('삭제여부') }, width: '40'  },
    { fieldName: 'SLI_YN', dataType: 'text', header: { text: t('SLI 반영여부') }, width: '60'  },
    { fieldName: 'MONITOR_YN', dataType: 'text', header: { text: t('모니터링 대상여부') }, width: '70'  },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, width: '30', visible: false  },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('과정 순번') }, width: '140', visible: false  },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, width: '140', visible: false  },
    { fieldName: 'CERT_DIV', dataType: 'text', header: { text: t('자격증') }, width: '40', visible: false  },
    { fieldName: 'SL_CODE_1', dataType: 'text', header: { text: t('SL 시스템1') }, width: '40', visible: false  },
    { fieldName: 'SL_CODE_2', dataType: 'text', header: { text: t('SL 시스템2') }, width: '140', visible: false  },
    { fieldName: 'SL_CODE_3', dataType: 'text', header: { text: t('SL 시스템3') }, width: '80', visible: false  },
    { fieldName: 'LINK_CODE', dataType: 'text', header: { text: t('연계업무') }, width: '20', visible: false  },
    { fieldName: 'SL_MORGN_ID', dataType: 'text', header: { text: t('SL_MORGN_ID') }, width: '140', visible: false  },
    { fieldName: 'SL_MORGN_EMP_NO', dataType: 'text', header: { text: t('SL_MORGN_EMP_NO') }, width: '80', visible: false  },
    { fieldName: 'SL_MORGN', dataType: 'text', header: { text: t('SL 담당자') }, width: '20', visible: false  },
    { fieldName: 'EXAM_YN', dataType: 'text', header: { text: t('평가여부') }, width: '40', visible: false  },
    { fieldName: 'MT_YN', dataType: 'text', header: { text: t('보수교육여부') }, width: '140', visible: false  },
    { fieldName: 'MT_CYCLE', dataType: 'text', header: { text: t('보수교육주기') }, width: '80', visible: false  },
    { fieldName: 'UNIT_CODE', dataType: 'text', header: { text: t('UNIT_CODE') }, width: '20', visible: false  },
    { fieldName: 'VEND_COST_YN', dataType: 'text', header: { text: t('협력사 예산지원여부') }, width: '40', visible: false  },
    { fieldName: 'EDU_HOUR', dataType: 'text', header: { text: t('EDU_HOUR') }, width: '140', visible: false  },
    { fieldName: 'LUNCH_CNT', dataType: 'text', header: { text: t('LUNCH_CNT') }, width: '80', visible: false  },
    { fieldName: 'MEDIA_YN', dataType: 'text', header: { text: t('MEDIA_YN') }, width: '20', visible: false  },
    { fieldName: 'PROD_SUM_YN', dataType: 'text', header: { text: t('PROD_SUM_YN') }, width: '40', visible: false  },
    { fieldName: 'STICKER_YN', dataType: 'text', header: { text: t('STICKER_YN') }, width: '40', visible: false  },
    { fieldName: 'REQ_YN', dataType: 'text', header: { text: t('REQ_YN') }, width: '40', visible: false  },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('AGE') }, width: '40', visible: false  },
  ],
  columns : [],
})

// 선행교육과정 그리드 셋팅
const grdSubProps1 = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : [],
  fields : [     
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, width: '30', visible: false  },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, width: '150', visible: false  },
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, editable: false, width: '30', lookupDisplay: true  },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, editable: false, width: '150', styleName: 'left-column'  },
    { fieldName: 'PRE_MNG_ORGN', dataType: 'text', header: { text: t('주관부서') }, editable: false, width: '60', lookupDisplay: true  },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('교육내용') }, editable: false, width: '60'  },
    { fieldName: 'HOLDING_PERIOD', dataType: 'text', header: { text: t('보유기간(월)') }, editor: {type: 'number' }, width: '50'  },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('시간') }, editable: false, width: '30'  },
    { fieldName: 'REQ_YN', dataType: 'text', header: { text: t('신청교육') }, width: '150', visible: false  },
    { fieldName: 'EDU_SATIS', dataType: 'text', header: { text: t('강사만족도') }, width: '150', visible: false  },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, width: '150', visible: false  },
    { fieldName: 'MNG_ORGN', dataType: 'text', header: { text: t('MNG_ORGN') }, width: '150', visible: false  },
    { fieldName: 'PRE_CURR_ID', dataType: 'text', header: { text: t('PRE_CURR_ID') }, width: '150', visible: false  },
    { fieldName: 'ODRNUM', dataType: 'text', header: { text: t('ODRNUM') }, width: '150', visible: false  },
  ],
  columns : [],
})

// 선행보유 자격증 그리드 셋팅
const grdSubProps2 = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, width: '120', visible: false  },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, width: '120', visible: false  },
    { fieldName: 'CERT_DIV_NM', dataType: 'text', header: { text: t('자격증') }, editable: false, width: '100' },
    { fieldName: 'HOLDING_PERIOD', dataType: 'text', header: { text: t('보유기간(월)') }, editor: {type: 'number' }, width: '50'  },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, width: '60', visible: false },
    { fieldName: 'MNG_ORGN', dataType: 'text', header: { text: t('MNG_ORGN') }, width: '60', visible: false  },
    { fieldName: 'CERT_DIV', dataType: 'text', header: { text: t('CERT_DIV') }, width: '50', visible: false  },
  ],
  columns : [],
})

// 주관부서 리스트 그리드 셋팅
const grdSubProps3 = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'MNG_ORGN', dataType: 'text', header: { text: t('주관부서') }, editable: false, width: '40', lookupDisplay: true, lookupData: codeList.MNG_ORGN_DET  },
    { fieldName: 'EDU_CYCLE', dataType: 'text', header: { text: t('주기') }, width: '30', editable: false, lookupDisplay: true  },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('시간') }, width: '30', editable: false, lookupDisplay: true  },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('상세교육명칭') }, width: '30', visible: false  },
    { fieldName: 'REQ_YN', dataType: 'text', header: { text: t('신청 교육') }, width: '30', visible: false, editable: false  },
    { fieldName: 'EDU_CAPA', dataType: 'text', header: { text: t('교육 정원') }, width: '30', editable: false  },
    { fieldName: 'EVAL_STD', dataType: 'text', header: { text: t('평가기준') }, width: '60', styleName: 'left-column', editable: false  },
    { fieldName: 'EDU_SATIS', dataType: 'text', header: { text: t('강사만족도') }, width: '60', visible: false  },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, width: '60', styleName: 'left-column', editable: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, width: '60', visible: false  },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, width: '60', visible: false  },
    { fieldName: 'EDU_INTRO', dataType: 'text', header: { text: t('과정소개') }, width: '60', visible: false  },
    { fieldName: 'EDU_DESC', dataType: 'text', header: { text: t('교육내용상세') }, width: '60', visible: false  },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, width: '60', visible: false  },
  ],
  columns : [],
})

// 교육 강좌 현황 리스트 그리드 셋팅
const grdMainProps2 = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('분류') }, width: '30', editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('과정 순번') }, width: '30', editable: false, visible: false },
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, width: '30', editable: false, mergeRule: { "criteria": "value" }, lookupDisplay: true, lookupData: codeList.DIVISION_MAIN },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, width: '120', styleName: 'left-column', editable: false  },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('대상') }, width: '60', styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'MNG_ORGN', dataType: 'text', header: { text: t('주관부서') }, width: '60', editable: false, lookupDisplay: true, lookupData: codeList.MNG_ORGN_DET  },
    { fieldName: 'EDU_CYCLE', dataType: 'text', header: { text: t('주기') }, width: '50', editable: false  },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('시간') }, width: '50', editable: false  },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('교육내용') }, width: '200', styleName: 'left-column', editable: false  },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, width: '30', visible: false, editable: false },
  ],
  columns : [],
})

grdMainProps1.columns = grdMainProps1.fields
grdSubProps1.columns = grdSubProps1.fields
grdSubProps2.columns = grdSubProps2.fields
grdSubProps3.columns = grdSubProps3.fields
grdMainProps2.columns = grdMainProps2.fields


//상세내역 초기화
const clearDetail = () =>{
  detailList.CURR_ID = ''
  detailList.DIVISION = ''
  detailList.UNIT_CODE = ''
  detailList.CURR_NM = ''
  detailList.TARGET = ''
  detailList.MT_CYCLE = ''
  detailList.LINK_CODE = ''
  detailList.CERT_DIV = []
  detailList.SLI_YN = 'N'
  detailList.REQ_YN = 'N'
  detailList.EXAM_YN = 'N'
  detailList.MEDIA_YN = 'N'
  detailList.VEND_COST_YN = 'N'
  detailList.EDU_HOUR = ''
  detailList.LUNCH_CNT = ''
  detailList.PROD_SUM_YN = 'N'
  detailList.MONITOR_YN = 'N'
  detailList.STICKER_YN = 'N'
  detailList.DELETE_YN = 'N'
  detailList.AGE = '0'

  if(grdSub1.value.getDataProvider().rowCount > 0){ grdSub1.value.getDataProvider().clearRows() }    
  if(grdSub2.value.getDataProvider().rowCount > 0){ grdSub2.value.getDataProvider().clearRows() } 
  if(grdSub3.value.getDataProvider().rowCount > 0){ grdSub3.value.getDataProvider().clearRows() }  
}

// formatrules
const numberRuleEduH = () =>{
  let regex = /[^.0-9]/g
  
  detailList.EDU_HOUR = detailList.EDU_HOUR.replaceAll(regex, "")
}

const numberRuleLunch = () => {
  let regex = /[^.0-9]/g
  
  detailList.LUNCH_CNT = detailList.LUNCH_CNT.replaceAll(regex, "")
}

const numberRuleMtCy = () => {
  let regex = /[^.0-9]/g
  
  detailList.MT_CYCLE = detailList.MT_CYCLE.replaceAll(regex, "")
}

const noHangleUnit = () => {
  let regex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g
  
  detailList.UNIT_CODE = detailList.UNIT_CODE.replaceAll(regex, "")
}

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION_MAIN: '',
  MNG_ORGN: '',
  CURR_NM: '',
  DELETE_YN: 'N',
  CURR_ID: '',
  USER_ID: userStore.userId,
})

//콤보박스 셋팅
const initCombo = () => {
  //담당 가능 과목, 강의 이력 데이터 바인딩
  Promise.all([
    getCodeList('HHID010'),
    getCodeList('HHID200'),
    getCodeList('HHID080'),
    getCodeList('HHID180'),
    getCodeList('HHID190'),
  ]).then(res => {
    codeList.DIVISION_MAIN = res[0].ORESULT_CUR
    res[0].ORESULT_CUR.forEach(item => {    
      codeList.DIVISION_DET.push(item)
    })
    grdMain1.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT") 
    grdSub1.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT") 
    codeList.MNG_ORGN_MAIN = res[1].ORESULT_CUR
    codeList.MNG_ORGN_DET = res[1].ORESULT_CUR
    grdSub1.value.setBindingColumn("PRE_MNG_ORGN", res[1].ORESULT_CUR, "COD", "TXT") 
    grdSub3.value.setBindingColumn("MNG_ORGN", res[1].ORESULT_CUR, "COD", "TXT") 
    codeList.LINK_CODE = res[2].ORESULT_CUR

    grdSub3.value.setBindingColumn("EDU_CYCLE", res[3].ORESULT_CUR, "COD", "TXT") 
    grdSub3.value.setBindingColumn("EDU_TIME", res[4].ORESULT_CUR, "COD", "TXT") 

    codeList.DIVISION_MAIN.unshift({ TXT: '전체', COD: '' })
    codeList.MNG_ORGN_MAIN.unshift({ TXT: '전체', COD: '' })

    //신규버튼 텍스트 변경
    //tab1 버튼 설정
    let btnItems = menuTitle.value.getButtonItems()
    btnItems[1].text = '신규'   
  })

  commonSearchApi({ queryId : 'EDUAA0020_TAB01_SEARCH01', param: searchParams }).then(res => {
    codeList.CERT_DIV = res.ORESULT_CUR
  })
}

//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//조회 실행
const searchMainData1 = id => {  
  if(detailList.CLEAR_YN === 'Y'){
    clearDetail()
  }

  return commonSearchApi({ queryId : 'EDUAA0020_TAB01_SEARCH02', param: searchParams })
}

const searchMainData2 = id => {  
  return commonSearchApi({ queryId : 'EDUAA0020_TAB02_SEARCH01', param: searchParams })
}

//조회 후
const afterMainSearch1 = res => {
  console.log("교육강좌등록 확인", res)
  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)
  detailList.CLEAR_YN = 'Y'
}

const afterMainSearch2 = res => {
  grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
}

onMounted(() => {  
  vm.$nextTick(() => {
    initCombo()  
    onButtonsClickMenu({ id :'btnSearch' })
  })  
})

const validationChk = async () => {
  return true
}

const delMainData = () => {

  let delParams = [{ CMPNY_DIV : userStore.cmpnyDiv, CURR_ID : detailList.CURR_ID, USER_ID : userStore.userId }]
  clearDetail()

  return commonExecuteApi({ queryId : 'EDUAA0020_TAB01_DELETE01', list: delParams })  
}

const delSubData1 = () => {
  return commonExecuteApi({ queryId : 'EDUAA0020_TAB01_DELETE03', list: deleteFunction(grdSub1) }) 
}

const delSubData2 = () => {
  return commonExecuteApi({ queryId : 'EDUAA0020_TAB01_DELETE04', list: deleteFunction(grdSub2) }) 
}

const delSubData3 = () => {
  return commonExecuteApi({ queryId : 'EDUAA0020_TAB01_DELETE02', list: deleteFunction(grdSub3) }) 
}

//로우 더블 클릭시 발생하는 이벤트
const cellDbClick = (grid, data) => {
  let row =  grdSub3.value.getDataProvider().getJsonRow(data.dataRow)

  eDUAA0020Pop01.value.openPopup({
    CREATE_YN : 'N',
    CURR_NM : detailList.CURR_NM,  //교육명
    TARGET : detailList.TARGET,     //대상
    MNG_ORGN : row.MNG_ORGN,         //주관부서
    EDU_CYCLE : row.EDU_CYCLE,       //주기
    EDU_TIME : row.EDU_TIME,   //시간
    REQ_YN : row.REQ_YN,     //신청교육
    EDU_CAPA  : row.EDU_CAPA,     //교육정원
    EDU_CONTENT : row.EDU_CONTENT,    //교육내용
    EVAL_STD : row.EVAL_STD,    //평가기준
    EDU_INTRO : row.EDU_INTRO,     //과정소개
    EDU_DESC : row.EDU_DESC,       //교육내용상세
    REMARK : row.REMARK,        //비고
  })

}

const deleteFunction = grd => {
  let delParams = []
  let checkedRows = grd.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grd.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN === 'N') continue
    delParams.push(data)
  }
  for(let i = 0; i < delParams.length; i++){
    delParams[i].CMPNY_DIV = userStore.cmpnyDiv
    delParams[i].USER_ID = userStore.userId
    delParams[i].CURR_ID = detailList.CURR_ID
  }
  for (let i = checkedRows.length - 1  ; i >= 0 ; i--) {
    grd.value.getDataProvider().removeRow(checkedRows[i])
  }

  return delParams
}

const saveMainData = () => {
  let certDiv = detailList.CERT_DIV
  let saveData = {
    CMPNY_DIV       : userStore.cmpnyDiv,
    CURR_ID         : detailList.CURR_ID,
    DIVISION_DET    : detailList.DIVISION,
    TARGET          : detailList.TARGET,
    CURR_NM         : detailList.CURR_NM,
    REMARK          : '',
    SL_CODE_1       : '',
    SL_CODE_2       : '',
    SL_CODE_3       : '',
    SL_MORGN_ID     : '',
    SL_MORGN_EMP_NO : '',
    SLI_YN          : detailList.SLI_YN,
    LINK_CODE       : detailList.LINK_CODE,
    CERT_DIV        : certDiv.join(','),
    EXAM_YN         : detailList.EXAM_YN,
    MT_YN           : '',
    MT_CYCLE        : detailList.MT_CYCLE,
    UNIT_CODE       : detailList.UNIT_CODE,
    VEND_COST_YN    : detailList.VEND_COST_YN,
    EDU_HOUR        : detailList.EDU_HOUR,
    LUNCH_CNT       : detailList.LUNCH_CNT,
    MEDIA_YN        : detailList.MEDIA_YN,
    PROD_SUM_YN     : detailList.PROD_SUM_YN,
    SAVE_YN         : '',
    USER_ID         : userStore.userId,
    MONITOR_YN      : detailList.MONITOR_YN,
    STICKER_YN      : detailList.STICKER_YN,
    REQ_YN          : detailList.REQ_YN,
    AGE_RESTRICTION : detailList.AGE,
    OUT_RES_CURR_ID : '',
    OUT_RES_COD     : '',
    OUT_RES_MSG     : '',
    OUT_RES_COL     : '',
    
  }
  let saveList = []
  saveList.push(saveData)

  return commonExecuteApi2({ queryId : 'EDUAA0020_TAB01_SAVE01', list: saveList })
}

const saveSubData1 = () => {
  let saveRows = grdSub1.value.getDataProvider().getJsonRows(0, -1)
  
  if(saveRows.length === 0) return

  let saveList = []
  for(let i = 0; i < saveRows.length; i++){
    saveRows[i].CMPNY_DIV = userStore.cmpnyDiv
    saveRows[i].USER_ID = userStore.userId
    saveRows[i].PRE_CURR_ID = saveRows[i].CURR_ID
    saveRows[i].PRE_CURR_NM = saveRows[i].CURR_ID
    saveRows[i].PRE_MNG_ORGN = saveRows[i].MNG_ORGN
    saveRows[i].CURR_ID = detailList.CURR_ID
    saveRows[i].CURR_NM = detailList.CURR_NM
    saveRows[i].MNG_ORGN = ''
    saveRows[i].ODRNUM = i
    saveList.push(saveRows[i])

  }  
  commonExecuteApi({ queryId : 'EDUAA0020_TAB01_SAVE03', list: saveList })
}

const saveSubData2 = () => {
  let saveRows = grdSub2.value.getDataProvider().getJsonRows(0, -1)
  if(saveRows.length === 0) return
  
  let saveList = []
  for(let i = 0; i < saveRows.length; i++){
    saveRows[i].CMPNY_DIV = userStore.cmpnyDiv
    saveRows[i].USER_ID = userStore.userId
    saveRows[i].CURR_ID = detailList.CURR_ID
    saveList.push(saveRows[i])
  }
  commonExecuteApi({ queryId : 'EDUAA0020_TAB01_SAVE04', list: saveList })
}

const saveSubData3 = () => {
  let saveRows = grdSub3.value.getDataProvider().getJsonRows(0, -1)
  if(saveRows.length === 0) return
  let saveList = []
  for(let i = 0; i < saveRows.length; i++){
    saveRows[i].CMPNY_DIV = userStore.cmpnyDiv
    saveRows[i].USER_ID = userStore.userId
    saveRows[i].CURR_ID = detailList.CURR_ID
    saveList.push(saveRows[i])
  }
  commonExecuteApi({ queryId : 'EDUAA0020_TAB01_SAVE02', list: saveList })
}

const currIdSet = res => {
  detailList.CURR_ID = res.OUT_RES_CURR_ID
  saveSubData1()
  saveSubData2()
  saveSubData3()
  detailList.CLEAR_YN = 'N'
  onButtonsClickMenu({ id :'btnSearch' })
}

const onButtonsClickMenu = async btn => {
  if(btn.id === 'btnSearch' ){
    if(tab.value === 'tab1'){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain1])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchMainData1)
        .setAfter(afterMainSearch1)
        .run()    
    }  
    else{
      new queryFlowHelper(vm, t)
        .setGridList([grdMain2])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchMainData2)
        .setAfter(afterMainSearch2)
        .run()   
    }
  }
  else if(btn.id === 'btnCreate' ){
    clearDetail()
  }
  else if(btn.id === 'btnUpdate'){    
    //상세정보 먼저 업데이트
    new saveFlowHelper(vm, t)
      .setBefore(validationChk)
      .setQuery(saveMainData)
      .setAfter(currIdSet)
      .run()          
  }
  else{
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain1, row: null }])
      .setGridList([grdMain1])
      .setQuery(delMainData)
      .setAfter(() => { onButtonsClickMenu({ id :'btnSearch' }) })
      .run()
  }
}

const onButtonsClickPreEdu = async btn => {
  if(btn.id === 'btnCreate' ){
    curriculumPopup.value.openPopup({
      ROW_DATA : grdSub1.value.getDataProvider().getRows(),
    })
  }
  else{
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub1, row: null }])
      .setGridList([grdSub1])
      .setQuery(delSubData1)
      .setAfter(() => { })
      .run()
  }
}

const onButtonsClickPreCert = async btn => {
  if(btn.id === 'btnCreate' ){
    eDUAA0020Pop02.value.openPopup({
      CREATE_YN : 'Y',
      ROW_DATA : grdSub2.value.getDataProvider().getRows(),
      LICE_TYPE : '',
    }) 
  }
  else{
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setQuery(delSubData2)
      .setAfter(() => { })
      .run()
  }
}

const onButtonsClickDept = async btn => {
  if(detailList.CURR_ID === '') { 
    Message.err(t('먼저 상세정보를 저장해 주세요.'))
    
    return 
  }
  if(btn.id === 'btnCreate' ){
    eDUAA0020Pop01.value.openPopup({
      CREATE_YN : 'Y',
      TARGET : detailList.TARGET,
      CURR_NM : detailList.CURR_NM,
    })    
  }
  else{
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub3, row: null }])
      .setGridList([grdSub3])
      .setQuery(delSubData3)
      .setAfter(() => { })
      .run()
  }
}

const onCurriculumSelected = row =>{
  row.forEach(item => {    
    item.SAVE_YN = 'N'
    grdSub1.value.addRow(item)
  })
  let prov = grdSub1.value.getDataProvider()
  for(let i = 0 ; i < prov.rowCount ; i++){
    prov.setValue(i, 'PRE_MNG_ORGN', prov.getValue(i, 'MNG_ORGN'))
  }  
}

const onEDUAA0020Pop01Selected = row =>{    
  row.SAVE_YN = 'N'
  grdSub3.value.addRow(row)
}

const onEDUAA0020Pop01Modified = row =>{
  let selectedRowIndex = grdSub3.value.getGridView().getSelectedRows(true)
  if(selectedRowIndex.length === 0) return
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'MNG_ORGN', row.MNG_ORGN)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'EDU_CYCLE', row.EDU_CYCLE)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'EDU_TIME', row.EDU_TIME)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'REQ_YN', row.REQ_YN)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'EDU_CAPA', row.EDU_CAPA)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'EDU_CONTENT', row.EDU_CONTENT)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'EVAL_STD', row.EVAL_STD)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'EDU_INTRO', row.EDU_INTRO)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'EDU_DESC', row.EDU_DESC)
  grdSub3.value.getDataProvider().setValue(selectedRowIndex[0],'REMARK', row.REMARK)
}

const onEDUAA0020Pop02Selected = row =>{
  row.forEach(item => {    
    item.SAVE_YN = 'N'
  })
  row.forEach(item => {    
    grdSub2.value.addRow(item)
  })
}

const onDetailSelect = (grid, cellData) => {
  let selectedRowIndex = grdMain1.value.getGridView().getSelectedRows(true)
  if(selectedRowIndex.length < 1 || cellData.cellType === 'gridEmpty') return
  clearDetail()
  var selectedRow = []
  selectedRow.push(grdMain1.value.getDataProvider().getJsonRow(selectedRowIndex))
  if(selectedRow[0].DIVISION === 'A'){//법정
    EDU_HOUR_TEXT.value = '법적 요구 시간(H)'
  }else{
    EDU_HOUR_TEXT.value = '총 이수 시간(H)'
  }
  detailList.CURR_ID = selectedRow[0].CURR_ID
  detailList.DIVISION = selectedRow[0].DIVISION
  detailList.UNIT_CODE = selectedRow[0].UNIT_CODE
  detailList.CURR_NM = selectedRow[0].CURR_NM
  detailList.TARGET = selectedRow[0].TARGET
  detailList.MT_CYCLE = selectedRow[0].MT_CYCLE
  detailList.LINK_CODE = selectedRow[0].LINK_CODE
  if(!isNull(selectedRow[0].CERT_DIV)){
    detailList.CERT_DIV = selectedRow[0].CERT_DIV.replaceAll(' ', '').split(',')
  }  
  detailList.SLI_YN = selectedRow[0].SLI_YN
  detailList.REQ_YN = selectedRow[0].REQ_YN
  detailList.EXAM_YN = selectedRow[0].EXAM_YN
  detailList.MEDIA_YN = selectedRow[0].MEDIA_YN
  detailList.VEND_COST_YN = selectedRow[0].VEND_COST_YN
  detailList.EDU_HOUR = selectedRow[0].EDU_HOUR
  detailList.LUNCH_CNT = selectedRow[0].LUNCH_CNT
  detailList.PROD_SUM_YN = selectedRow[0].PROD_SUM_YN
  detailList.MONITOR_YN = selectedRow[0].MONITOR_YN
  detailList.STICKER_YN = selectedRow[0].STICKER_YN
  detailList.DELETE_YN = selectedRow[0].DELETE_YN
  detailList.AGE = selectedRow[0].AGE

  searchParams.CURR_ID = selectedRow[0].CURR_ID
  commonSearchApi({ queryId : 'EDUAA0020_TAB01_SEARCH04', param: searchParams }).then(res => {
    grdSub3.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
  commonSearchApi({ queryId : 'EDUAA0020_TAB01_SEARCH05', param: searchParams }).then(res => {
    grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
  commonSearchApi({ queryId : 'EDUAA0020_TAB01_SEARCH06', param: searchParams }).then(res => {
    grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const keyUpCurr = event => {
  if(event.key === 'Enter'){
    onButtonsClickMenu({ id :'btnSearch' })
  }
}

const selectedChanged = tab => {
  let btnItems = menuTitle.value.getButtonItems()
  let usable = false
  if(tab === 'tab1'){
    usable = true
  }  
  else{
    usable = false    
    grdMain2.value.setBindingColumn("DIVISION", codeList.DIVISION_DET, "COD", "TXT")     
    grdMain2.value.setBindingColumn("MNG_ORGN", codeList.MNG_ORGN_DET, "COD", "TXT")
    onButtonsClickMenu({ id :'btnSearch' })
  }

  for(let i = 1 ; i < btnItems.length ; i++){
    btnItems[i].visible = usable
  }
}

const gridRefresh = () => {
  if(tab.value === 'tab1'){
    grdMain1.value.getDataProvider().setRows([])
  }else{
    grdMain2.value.getDataProvider().setRows([])
  }
}

</script>

<template>
    <v-card class="pa-0 fill-height">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
          @click-button="onButtonsClickMenu"
        />
      </v-card-title>
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <!-- 조회조건 -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('분류')"
              v-model="searchParams.DIVISION_MAIN"
              :items="codeList.DIVISION_MAIN"
              item-title="TXT"
              item-value="COD"
              labelWidth="26px"
              width="200px"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('주관부서')"
              v-model="searchParams.MNG_ORGN"
              :items="codeList.MNG_ORGN_MAIN"
              item-title="TXT"
              item-value="COD"
              labelWidth="52px"
              width="250px"
              @update:model-value="gridRefresh"
            />
            <i-input 
              :label="$t('교육명')"
              v-model="searchParams.CURR_NM"
              @keyup="keyUpCurr"
              labelWidth="39px"
              width="300px"
              @update:model-value="gridRefresh"
            />
            <v-checkbox 
              v-model="searchParams.DELETE_YN"                              
              :label="$t('삭제분 포함')"
              true-value="Y" 
              false-value="N"
              @update:model-value="gridRefresh"
            />
          </v-sheet>
          <v-sheet class="mb-2">
            <v-tabs v-model="tab">
              <v-tab value="tab1">교육강좌등록</v-tab>
              <v-tab value="tab2">교육강좌현황</v-tab>
            </v-tabs>
          </v-sheet>
          <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
          <!-- v-show : v-if 대신 v-show를 사용해야하는 이유
                RealGrid는 ref로 데이터를 핸들링 하기때문에 탭에서 v-if를 했을 경우 
                RealGrid의 dom 자체가 사라지기때문에 데이터가 초기화가 됩니다.
                그렇기 때문에 v-show (= css/ display: none 과 동일)를 사용해야 RealGrid가 초기화가 되지 않습니다. -->
            
          <v-sheet v-show="tab == 'tab1'" >
          <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
              바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
          -->
            <div class="h-grow">
              <v-sheet width="50%" class="pa-0 content-area-tab mr-3">
                <IGridTitle :title="$t('교육 강좌 리스트')"></IGridTitle>
                <RealGrid
                  ref="grdMain1"
                  :grid-view-option="grdMainProps1.gridViewOption"
                  :keys="grdMainProps1.keys" 
                  :fields="grdMainProps1.fields"
                  :columns="grdMainProps1.columns"
                  @onCellClicked="onDetailSelect"
                />
              </v-sheet>
              <v-sheet width="50%" class="pa-0 pr-1 content-area-tab">
                <div class="d-flex flex-column fill-height">
                  <IGridTitle :title="$t('상세정보')"></IGridTitle>
                  <div class="d-flex mb-2">
                    <i-input
                      :label="$t('일련번호')"
                      topLabel
                      v-model="detailList.CURR_ID"
                      width="275px"
                      readonly
                    />
                    <i-select
                      :label="$t('분류')"
                      topLabel
                      v-model="detailList.DIVISION"
                      :items="codeList.DIVISION_DET"
                      item-title="TXT"
                      item-value="COD"
                      width="275px"
                    />
                    <i-select
                      :label="$t('장비코드')"
                      topLabel
                      v-model="detailList.UNIT_CODE"
                      @keyup="noHangleUnit"
                      width="275px"
                    />
                  </div>
                  <div class="d-flex mb-2">
                    <i-input
                      :label="$t('교육명')"
                      topLabel
                      v-model="detailList.CURR_NM"
                      width="275px"
                    />
                    <i-input
                      :label="$t('대상자')"
                      topLabel
                      v-model="detailList.TARGET"
                      width="275px"
                    />
                    <i-input
                      :label="$t('주기(월)')"
                      topLabel
                      v-model="detailList.MT_CYCLE"
                      @keyup="numberRuleMtCy"
                      width="275px"
                    />
                  </div>
                  <div class="d-flex mb-2">
                    <i-select
                      :label="$t('연계업무')"
                      topLabel
                      v-model="detailList.LINK_CODE"
                      :items="codeList.LINK_CODE"
                      item-title="TXT"
                      item-value="COD"
                      width="275px"
                    />
                    <i-select
                      :label="$t('삭제여부')"
                      topLabel
                      v-model="detailList.DELETE_YN"
                      :items="['N', 'Y']"
                      readonly="true"
                      width="275px"
                    />
                    <i-select
                      :label="$t('SLI 반영여부')"
                      topLabel
                      v-model="detailList.SLI_YN"
                      :items="['N', 'Y']"
                      width="275px"
                    />
                  </div>
                  <div class="d-flex mb-2">
                    <i-select
                      :label="$t('신청교육')"
                      topLabel
                      v-model="detailList.REQ_YN"
                      :items="['N', 'Y']"
                      width="275px"
                    />
                    <i-select
                      :label="$t('평가여부')"
                      topLabel
                      v-model="detailList.EXAM_YN"
                      :items="['N', 'Y']"
                      width="275px"
                    />
                    <i-select
                      :label="$t('미디어 교육여부')"
                      topLabel
                      v-model="detailList.MEDIA_YN"
                      :items="['N', 'Y']"
                      width="275px"
                    />
                  </div>              
                  <div class="d-flex mb-2">
                    <i-select
                      :label="$t('협력사 예산지원여부')"
                      topLabel
                      v-model="detailList.VEND_COST_YN"
                      :items="['N', 'Y']"
                      width="275px"
                    />
                    <i-input
                      :label=EDU_HOUR_TEXT
                      topLabel 
                      v-model="detailList.EDU_HOUR"
                      @keyup="numberRuleEduH"
                      width="275px"
                    />
                    <i-input
                      :label="$t('중식제공 횟수')"
                      topLabel
                      v-model="detailList.LUNCH_CNT"
                      @keyup="numberRuleLunch"
                      width="275px"
                    />
                  </div>           
                  <div class="d-flex mb-2">
                    <i-select
                      :label="$t('생산직 법정 교육 집계대상')"
                      topLabel
                      v-model="detailList.PROD_SUM_YN"
                      :items="['N', 'Y']"
                      width="275px"
                    />
                    <i-select
                      :label="$t('모니터링 대상여부')"
                      topLabel
                      v-model="detailList.MONITOR_YN"
                      :items="['N', 'Y']" 
                      width="275px"
                    />
                    <i-select
                      :label="$t('스티커 발행 대상 여부')"
                      topLabel
                      v-model="detailList.STICKER_YN"
                      :items="['N', 'Y']"
                      width="275px"
                    />
                  </div>        
                  <div class="d-flex mb-2">
                    <i-select
                      :label="$t('자격증')"
                      topLabel 
                      multiple
                      v-model="detailList.CERT_DIV"
                      :items="codeList.CERT_DIV"
                      item-title="TXT"
                      item-value="COD"
                      width="570px"
                    />
                     <i-input
                      :label="$t('연령제한 (연령제한을 하지 않을경우 0 입력)')"
                      topLabel
                      v-model="detailList.AGE"
                      @keyup="numberRuleMtCy"
                      width="275px"
                    />
                  </div>
                  <div class="d-flex mb-2">
                    <v-sheet height="30%" class="mt-2 h-auto">
                      <IGridTitle 
                        :title="$t('선행 교육 과정')"
                        :button-list="['btnCreate', 'btnDelete']"
                        @click-button="onButtonsClickPreEdu"
                      >
                        <template #editors />
                      </IGridTitle>
                      <RealGrid
                        ref="grdSub1"
                        style="height: 180px;"
                        :grid-view-option="grdSubProps1.gridViewOption"
                        :keys="grdSubProps1.keys" 
                        :fields="grdSubProps1.fields"
                        :columns="grdSubProps1.columns"
                      />
                    </v-sheet>
                  </div>
                  <div class="d-flex mb-2">
                    <v-sheet height="30%" class="mt-2 h-auto">
                      <IGridTitle 
                        :title="$t('선행보유자격증')"                    
                        :button-list="['btnCreate', 'btnDelete']"
                        @click-button="onButtonsClickPreCert"
                      >
                        <template #editors />
                      </IGridTitle>
                      <RealGrid
                        ref="grdSub2"
                        style="height: 180px;"
                        :grid-view-option="grdSubProps2.gridViewOption"
                        :keys="grdSubProps2.keys" 
                        :fields="grdSubProps2.fields"
                        :columns="grdSubProps2.columns"
                      />
                    </v-sheet>
                  </div>
                  <div class="d-flex mb-2">
                    <v-sheet height="30%" class="mt-2 h-auto">
                      <IGridTitle 
                        ref="gridTitle"
                        :title="$t('주관 부서 리스트')"                    
                        :button-list="['btnCreate', 'btnDelete']"
                        @click-button="onButtonsClickDept"
                      >
                        <template #editors />
                      </IGridTitle>
                      <RealGrid
                        ref="grdSub3"
                        style="height: 180px;"
                        :grid-view-option="grdSubProps3.gridViewOption"
                        :keys="grdSubProps3.keys" 
                        :fields="grdSubProps3.fields"
                        :columns="grdSubProps3.columns"
                        @onCellDblClicked ="cellDbClick"
                      />
                    </v-sheet>
                  </div>
                </div>
              </v-sheet>
            </div>
          </v-sheet>
          <v-sheet v-show="tab == 'tab2'" class="h-auto">
            <div class="d-flex flex-column fill-height">
              <v-sheet class="h-auto">
                  <IGridTitle 
                    :title="$t('교육 강좌 리스트')"
                  >
                    <template #editors />
                  </IGridTitle>
                  <RealGrid
                    ref="grdMain2"
                    class="mt-2"
                    :grid-view-option="grdMainProps2.gridViewOption"
                    :keys="grdMainProps2.keys" 
                    :fields="grdMainProps2.fields"
                    :columns="grdMainProps2.columns"
                  />
              </v-sheet>
            </div>
          </v-sheet>
          

        <!-- tab -->
        <!-- <VTabs 
          v-model="tab" 
          @click="selectedChanged(tab)"
        >
          <VTab 
            value="tab1"
          >
            교육강좌등록
          </VTab>
          <VTab value="tab2">
            교육강좌현황
          </VTab>
        </VTabs> -->
        
        </div>
      </v-card-text>
      <EDUAA0020Pop01 ref="eDUAA0020Pop01" @selected="onEDUAA0020Pop01Selected" @modified="onEDUAA0020Pop01Modified" />
      <EDUAA0020Pop02 ref="eDUAA0020Pop02" @selected="onEDUAA0020Pop02Selected" />
      <CurriculumPopup ref="curriculumPopup" @selected="onCurriculumSelected" />
    </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  // overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.content-area-tab {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 131px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>