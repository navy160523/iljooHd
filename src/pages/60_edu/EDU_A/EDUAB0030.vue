<!--
  화면명 : 교육계획/실적관리
  화면개요 : 등록, 신청된 교육을 조회하거나 교육을 등록, 신청할 수 있는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
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
import DeptPopup from '@/components/popup/DeptPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'

import EDUAB0030Tab01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01.vue'
import EDUAB0030Tab01Pop02 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02.vue'
import EDUAB0030Tab01Pop02Pop02 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop02.vue'
import _ from 'lodash'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/vue3'

defineOptions({
  name: '60_edu-EDU_A-EDUAB0030',
})



//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle1 = ref(null)
const menuTitle1_1 = ref(null)
const menuTitle2 = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const eDUAB0030Tab01Pop01 = ref(null)
const eDUAB0030Tab01Pop02 = ref(null)//일별 교육계획 일자별 상세 팝업
const eDUAB0030Tab01Pop02Pop02 = ref(null)
const tab = ref("tab01")
const events = ref([])
const calClickCnt = ref(0)
const calendar = ref()
const buttonParams = reactive({
  EDU_SELECT : ''
})



const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv, //회사 구분
  BSNS_CD : userStore.bsnsCd, //사업부 구분
  DATE_FROM : dayjs().add(-2, 'month').format('YYYY-MM-DD'), //기간(시작)
  DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'),          //기간(종료)
  DIVISION : null,                //분류
  CURR_ID : '',                   //교육명
  DEPT_NM : userStore.deptNm,     //소속(명)
  DEPT_CD : userStore.deptCd,     //소속(코드)
  ASGN_CD : userStore.asgnCd,     //소속(코드)
  FINISH_DSCR : '',               //진행상태
  REQ_YN : '',                    //교육구분
})

const searchParams2 = reactive({
  YYYYMM : dayjs(new Date()).format('YYYY-MM'),  //해당년월
  CMPNY_DIV : userStore.cmpnyDiv, //회사 구분
  BSNS_CD : userStore.bsnsCd, //사업부 구분
  DEPT_NM : userStore.deptNm, //소속명
  DEPT_CD : userStore.deptCd, //소속코드
  ASGN_CD : userStore.asgnCd,     //소속(코드)
})

const codeList = reactive({
  eduSelect : [],   //교육분류
  division : [],    //분류
  currId : [],      //교육
  finishDscr : [],  //진행상태
  reqYn : [],       //교육구분
})

//툴팁기능 옵션
const isTooltipVisible = ref(false);
const tooltipContent = ref('');
const tooltipStyle = ref({});
const tooltipRef = ref(null);

//캘린더 옵션 설정
const calendarOptions = reactive({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth', //초기 로드될 때 보이는 캘린더 화면(기본 설정 : 달)
  /* 헤더 툴 바 : 헤더에 버튼을 추가하는 기능. left, center, right로 위치 설정 가능함
  prevYear : 작년
  prev : 저번달
  nextYear : 다음 해
  next : 다음 달,
  today : 오늘,
  title : 년월 ex) 2024년4월
  dayGridMonth, //달력과 같은 형태로 보여줌
  dayGridWeek, //오늘날에 해당하는 주를 보여줌
  dayGridDay, //오늘날짜만 보여줌
  여러개 사용하려면 'dayGridWeek,dayGridDay' 이런식으로 사용하면 됨
  */
  headerToolbar: {  
    left: 'title',
    center : '',
    right : ''
  },
  events: [
    //이부분에 데이터를 아래와 같이 추가한다 (시간이 들어가면 색상 안먹힘).
    //{ title: '테스트', start: '2024-04-28', color : '#FF033E', textColor : '#FFFFFF'},
    //URL도 추가 가능함
    //{ title: '테스트', start: '2024-04-11' url: 'http://google.com/'},
  ],
  eventClick: info => { // 요소 클릭 시 이벤트
    calendarClick(info)
  },
  locale: 'ko', //언어 설정
  height:'100%', //캘린더 높이 설정
  //expandRows: true, //화면에 맞게 높이 재설정
  dayMaxEvents : 3, //하나의 날짜에 보여줄 이벤트 갯수를 설정할 수 있다.
  fixedWeekCount: false, // 이전 달, 다음 달의 날짜도 한 주로 쳐서 보여줄 것인지 여부

  // eventAdd: info => { // 이벤트가 추가되면 발생하는 이벤트          
  //   console.log('이벤트 수정?', obj);        
  // },
  // eventChange: info => { // 이벤트가 수정되면 발생하는 이벤트          
  //   console.log('이벤트 수정?', obj);        
  // },
  // eventRemove: info => { // 이벤트가 삭제되면 발생하는 이벤트          
  //   console.log('이벤트 수정?', obj);        
  // },

  //캘린더 툴팁 기능 추가
  eventMouseEnter: info => {

    //console.log('테스트')
    //툴팁 내용 설정
    tooltipContent.value = info.event.extendedProps.description;

    // 툴팁 위치 설정
    const rect = info.el.getBoundingClientRect();
    tooltipStyle.value = {
      top: `${rect.top + window.scrollY - rect.height - 290}px`,
      left: `${rect.left + window.scrollX}px`,
    };

    isTooltipVisible.value = true; // 툴팁 보이기
  },

  eventMouseLeave: info => {
    isTooltipVisible.value = false; // 툴팁 숨기기
  },
  
})


//근로자 정기안전보건교육
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', width:'50', header: { text: t('분류') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'CURR_NM', dataType: 'text', width:'130', header: { text: t('교육명') }, styleName:'left-column', editable: false },
    { fieldName: 'EDU_DATE', dataType: 'text', width:'110', header: { text: t('교육기간') }, editable: false },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('교육시간') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'text', width:'50', header: { text: t('학습 시간(분)') }, styleName:'right-column', editable: false},
    { fieldName: 'LECTURE', dataType: 'text', width:'100', header: { text: t('강사명') }, styleName:'left-column', editable: false},
    { fieldName: 'EPLACE_NM', dataType: 'text', width:'110', header: { text: t('교육장소') }, styleName:'left-column', editable: false },
    { fieldName: 'PLAN_CNT', dataType: 'text', width:'50', header: { text: t('계획인원') }, styleName:'right-column', editable: false },
    { fieldName: 'TARGET_CNT', dataType: 'text', width:'50', header: { text: t('신청인원') }, styleName:'right-column', editable: false },
    { fieldName: 'PASS_CNT', dataType: 'text', width:'50', header: { text: t('승인인원') }, styleName:'right-column', editable: false },
    { fieldName: 'EXAM_PASS_CNT', dataType: 'text', width:'50', header: { text: t('이수인원') }, styleName:'right-column', editable: false },
    { fieldName: 'EXAM_FAIL_CNT', dataType: 'text', width:'50', header: { text: t('미이수인원') }, styleName:'right-column', editable: false },
    { fieldName: 'FINISH_DSCR', dataType: 'text', width:'80', header: { text: t('진행상태') }, editable : false },
    { fieldName: 'MORGN_ID', dataType: 'text', width:'110', header: { text: t('주관부서') }, styleName:'left-column', editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'REQ_YN', dataType: 'text', width:'60', header: { text: t('교육구분') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('EDUTIME_SERIAL') }, editable: false, visible: false },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('상세교육명칭') }, editable: false, visible: false },
    { fieldName: 'REQ_ALL_CNT', dataType: 'text', header: { text: t('개설요청 건수') }, editable: false, visible: false },
    { fieldName: 'CRITERIA', dataType: 'text', header: { text: t('CRITERIA') }, editable: false, visible: false },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('TARGET') }, editable: false, visible: false },
    { fieldName: 'INTRODUCTION', dataType: 'text', header: { text: t('INTRODUCTION') }, editable: false, visible: false },
    { fieldName: 'CONTENTS', dataType: 'text', header: { text: t('CONTENTS') }, editable: false, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, editable: false, visible: false },
    { fieldName: 'REQUEST_YN', dataType: 'text', header: { text: t('REQUEST_YN') }, editable: false, visible: false },
  ],
  columns: [],
})

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
    commonSearchApi({ queryId : 'EDUAB0060_SEARCH_01', param : {CMPNY_DIV : userStore.cmpnyDiv} }),//교육명
    commonSearchApi({ queryId: 'EDUAB0030_TAB01_SEARCH_02', param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'Y', USE_FLAG: 'Y', } })//주관부서
  ]).then(res => {
    console.log("레스 확인",res)

    codeList.eduSelect.push({TXT : '일반교육', COD : 'A'}, {TXT : '신청교육', COD : 'B'})
    buttonParams.EDU_SELECT = codeList.eduSelect[0].COD

    //분류 데이터 바인딩
    codeList.division = res[0].ORESULT_CUR
    codeList.division.unshift({ COD : '', TXT : '전체'})
    searchParams.DIVISION = res[0].ORESULT_CUR[0].COD

    //진행상태 데이터 바인딩
    codeList.finishDscr.push({COD : '', TXT : '전체'},{COD : '계획', TXT : '계획'}, {COD : '신청', TXT : '신청'}, {COD : '완료100%미만', TXT : '완료 100% 미만'},{COD : '완료100%', TXT : '완료 100%'}, {COD : '임시저장', TXT : '임시저장'}, {COD : '개설', TXT : '개설'},{COD : '확정', TXT : '확정'},{COD : '완료', TXT : '완료'})
    searchParams.FINISH_DSCR = codeList.finishDscr[0].COD

    //주관부서 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("MORGN_ID", res[2].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT")

    codeList.reqYn.push({COD : '', TXT : '전체'}, {TXT : '일반교육', COD : 'N'}, {TXT : '신청교육', COD : 'Y'})
    searchParams.REQ_YN = codeList.reqYn[0].COD

    // 2024.07.25 박용훈 협력사 일경우 소속을 ASGN_CD로 세팅
    // 2024.07.30 박용훈 ASGN을 그대로 사용해도 문제 없어서 주석함. 
    // searchData 할때 ASGN_CD : searchParams.DEPT_CD 를 잘못 매핑 시켜줘서 문제가 발생함거
    // console.log('userStore.userDiv : ', userStore.userDiv)
    // if(userStore.userDiv!='A'){
    //   searchParams.DEPT_NM = userStore.asgnNm //소속(명)
    //   searchParams.DEPT_CD = userStore.asgnCd //소속(코드)
    //   searchParams2.DEPT_NM = userStore.asgnNm //소속(명)
    //   searchParams2.DEPT_CD = userStore.asgnCd //소속(코드)
    // }

    grdMain.value.setBindingColumn("REQ_YN", codeList.reqYn, "COD", "TXT")
  })
}

// 분류가 바뀌면 분류에 따른 교육명 데이터 가져옴
watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  console.log("분류 바뀜")
  if(newValue === ''){
    codeList.currId = []
    codeList.currId.unshift({ TXT:"전체", COD:"" })
    searchParams.CURR_ID =codeList.currId[0].COD
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList.currId = res.ORESULT_CUR
      codeList.currId.unshift({ TXT:"전체", COD:"" })
      searchParams.CURR_ID =codeList.currId[0].COD
    })
})

//교육구분 변경 시 이벤트
watch(() => searchParams.REQ_YN, (newValue) => {
  codeList.finishDscr = []
  if(newValue === 'N'){//일반교육
    codeList.finishDscr.push({COD : '', TXT : '전체'},{COD : '계획', TXT : '계획'},{COD : '완료100%미만', TXT : '완료 100% 미만'},{COD : '완료100%', TXT : '완료 100%'})
    searchParams.FINISH_DSCR = codeList.finishDscr[0].COD
  }
  else if(newValue === 'Y'){//신청교육
    codeList.finishDscr.push({COD : '', TXT : '전체'}, {COD : '임시저장', TXT : '임시저장'}, {COD : '개설', TXT : '개설'},{COD : '확정', TXT : '확정'},{COD : '완료', TXT : '완료'})
    searchParams.FINISH_DSCR = codeList.finishDscr[0].COD
  }
  else{//전체
    codeList.finishDscr.push({COD : '', TXT : '전체'},{COD : '계획', TXT : '계획'}, {COD : '신청', TXT : '신청'}, {COD : '완료100%미만', TXT : '완료 100% 미만'},{COD : '완료100%', TXT : '완료 100%'}, {COD : '임시저장', TXT : '임시저장'}, {COD : '개설', TXT : '개설'},{COD : '확정', TXT : '확정'},{COD : '완료', TXT : '완료'})
    searchParams.FINISH_DSCR = codeList.finishDscr[0].COD
  }
})

//***********************************세팅 영역(종료)**************************************************/

//********************************************************************************************************** */
//***********************************교육계획/실적관리 영역***************************************************/
//********************************************************************************************************** */
//버튼 이벤트
const onButtonsClick = btn => {//조회
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnEduAdd'){

    if(buttonParams.EDU_SELECT === 'A'){
      let newEduDt = {
        CMPNY_DIV : '', YEAR : '', SCHEDULE_ID : '', EDU_DIV : '', CURR_ID : '', MORGN_ID : '', MORGN_EMP_NO : '',
        MORGN_BSNSCD : '', MORGN_DEPTCD : '', MORGN_DEPTNM : '', WORK_STD_ID : '', WORK_STD_NM : '', EDU_TITLE : '',
        TARGET_DIV : '', TARGET_DETAIL : '', EDATE_FROM : '', EDATE_TO : '', LEAD_TIME : '', EPLACE_DIV : '', 
        EPLACE_ID : '', EPLACE_ETC : '',EDUPOSSIBLE_NUM : '', LECTURER_ID : '', EDU_CONTENT : '', ATTACH_KEY : '', 
        LECTURER_NM : '', CON_DIV : '',APP_STATUS : '', MEDIA_CD_1 : '', MEDIA_CD_2 : '', EPLACE_NM : '', 
        EPLACE_NUM : '', DIVISION : '',INSERT_USER_ID : '', SEND_YN : '', SAVE_YN : ''
      }
      newEduDt.CMPNY_DIV = userStore.cmpnyDiv
      newEduDt.YEAR = dayjs(new Date()).format('YYYY')
      newEduDt.EDU_DIV = 'A'
      newEduDt.SAVE_YN = 'N'
      console.log("뉴 에듀 데이터 테이블",newEduDt)
      eDUAB0030Tab01Pop01.value.openPopup(newEduDt)
    }
    else if(buttonParams.EDU_SELECT === 'B'){
      let newRow = {CMPNY_DIV : '', YEAR : '', SCHEDULE_ID : '', EDU_DIV : '', CURR_ID : '', 
                    MORGN_ID : '',  MORGN_EMP_NO : '', MORGN_BSNSCD : '', MORGN_DEPTCD : '', MORGN_DEPTNM : '',
                    EDU_TITLE : '', TARGET_DIV : '', TARGET_DETAIL : '', EDATE_FROM : '', EDATE_TO : '', 
                    EDU_DATE : '', EDU_DATE_END : '', REQ_DUR_FROM : '', REQ_DUR_TO : '', LEAD_TIME : '',
                    EDUPOSSIBLE_NUM : '', EDU_CONTENT : '', ATTACH_KEY : '', LECTURER_NM : '', CON_DIV : '',
                    DIVISION : '', EDU_INTRO : '', EDU_DESC : '', STATUS : '', INSERT_USER_ID : '', 
                    SEND_YN : '', OPEN_DATE : '', SAVE_YN : ''}

      newRow.CMPNY_DIV = userStore.cmpnyDiv
      newRow.YEAR = dayjs(new Date()).format('YYYY-MM-DD')
      newRow.EDU_DIV = 'A'
      newRow.SAVE_YN = 'N'
      eDUAB0030Tab01Pop02Pop02.value.openPopup(newRow, 'Page')          
    }
  }
}

//교육계획/실적관리 조회 전
const beforeSearch = () => {
  grdMain.value.getDataProvider().setRows([])
  return true
}

//교육계획/실적관리 조회
const searchData = () => {
  let params = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    DATE_FROM : searchParams.DATE_FROM,
    DIVISION : searchParams.DIVISION,
    CURR_ID : searchParams.CURR_ID,
    DATE_TO : searchParams.DATE_TO,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD,
    // 2024.07.30 박용훈 수정
    //ASGN_CD : searchParams.DEPT_CD,
    ASGN_CD : searchParams.ASGN_CD,
    FINISH_DSCR : searchParams.FINISH_DSCR,
    REQ_YN : searchParams.REQ_YN,
    USER_ID : userStore.userId
  }
  console.log("조회 파라미터",params)
  return commonSearchApi({ queryId : 'EDUAB0030_TAB01_SEARCH_01', param: params })
}

//교육계획/실적관리 조회 후
const afterSearch = res => {
  console.log("조회 결과 값",res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//그리드 초기화 이벤트
const gridRefresh = data => {
  if(data === 'DEPT_NM'){
    searchParams.DEPT_CD = ''
  }
  grdMain.value.getDataProvider().setRows([])
}

// 기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  console.log("데이트 프롬 타겟 밸류",data.target.value)
  if(data.target.value > searchParams.DATE_TO){
    searchParams.DATE_TO = searchParams.DATE_FROM
  }
}

// 기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  console.log("데이트 투 타겟 밸류",data.target.value)
  if(data.target.value < searchParams.DATE_FROM){
    searchParams.DATE_FROM = searchParams.DATE_TO
  }
}

//부서 조회 팝업 오픈
const openDeptPopup = () => {
  if(tab.value === 'tab01'){
    deptPopup.value.openPopup({       
      ASGN_NM : searchParams.DEPT_NM,
      HSE_SYS : 'N',
      CMP_DISABLE: false,
    })
  }
  else if(tab.value === 'tab02'){
    deptPopup.value.openPopup({      
      ASGN_NM : searchParams2.DEPT_NM,
      HES_SYS : 'N',
      CMP_DISABLE: false,
    })
  } 
}

//부서 조회 선택 데이터
const onDeptSelected = row => {
  console.log("선택한 데이터 확인",row)
  if(tab.value === 'tab01'){
    searchParams.CMPNY_DIV = row.CMPNY_DIV
    searchParams.BSNS_CD = row.BSNS_CD
    searchParams.DEPT_NM = row.ASGN_SHRT_NM
    //searchParams.DEPT_CD = row.ASGN_CD
    searchParams.DEPT_CD = row.DEPT_CD
    searchParams.ASGN_CD = row.ASGN_CD
  }
  else if(tab.value === 'tab02'){
    searchParams2.CMPNY_DIV = row.CMPNY_DIV
    searchParams2.BSNS_CD = row.BSNS_CD
    searchParams2.DEPT_NM = row.ASGN_SHRT_NM
    //searchParams2.DEPT_CD = row.ASGN_CD
    searchParams2.DEPT_CD = row.DEPT_CD
    searchParams2.ASGN_CD = row.ASGN_CD
  }

}

//그리드 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  //let dataRow = grdMain.value.getGridView().getValues(clickData.dataRow)
  let dataRow = grdMain.value.getRowData(clickData.dataRow)
  console.log('searchParams',searchParams)
  // console.log('searchParams2',searchParams2)
  console.log("데이터 로우 확인",dataRow)
  eDUAB0030Tab01Pop02.value.openPopup({
    CMPNY_DIV : searchParams.CMPNY_DIV,
    EDU_DATE : dayjs(dataRow.EDU_DATE.substr(0,10)).format('YYYYMMDD'),
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD,
    ASGN_CD : searchParams.ASGN_CD,
    blsAdimn : 'ADMIN',
    REQ_YN : searchParams.REQ_YN
  })
}

//교육등록 팝업 닫을 시 재조회 이벤트
const onClose = () => {
  if(tab.value === 'tab01'){
    onButtonsClick({id : 'btnSearch'})
  }
  else if(tab.value === 'tab02'){
    onButtonsClick2({id : 'btnSearch'})
  }

}

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}

const tabChanged = (data) => {
  if(tab.value === 'tab02'){
    onButtonsClick2({id : 'btnSearch'})
  }
}
//********************************************************************************************************** */
//**********************************교육계획/실적관리 영역(종료)***********************************************/
//********************************************************************************************************** */

//********************************************************************************************************** */
//*************************************캘린더 이벤트 영역 ****************************************************/
//********************************************************************************************************** */
const onButtonsClick2 = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch2)
      .setQuery(searchData2)
      .setAfter(afterSearch2)
      .run()
  }
}

const beforeSearch2 = () => {
  events.value = []
  return true
}

const searchData2 = () => {
  let params = {
    CMPNY_DIV : searchParams2.CMPNY_DIV,
    YYYYMM : dayjs(searchParams2.YYYYMM).format('YYYYMM'),
    BSNS_CD : searchParams2.BSNS_CD,
    DEPT_CD : searchParams2.DEPT_CD,
    ASGN_CD : searchParams2.ASGN_CD,
    USER_ID : userStore.userId
  }
  return commonSearchApi({queryId : 'EDUAB0030_TAB02_SEARCH_01', param : params})
}

const afterSearch2 = res => {
  calendarOptions.events = []
  console.log("레스 확인;;",res)
  calendar.value.getApi().gotoDate(res.YYYYMM)
  for(let i = 0; i < res.ORESULT_CUR.length; i++){
    calendarOptions.events.push({
      title : res.ORESULT_CUR[i].TXT,
      start : dayjs(res.ORESULT_CUR[i].START_DATE.substring(0,10)).format('YYYY-MM-DD'),
      color : res.ORESULT_CUR[i].FINISH_DSCR === '삭제대상' ? '#FF033E' :  //빨강
              res.ORESULT_CUR[i].FINISH_DSCR === '신청' ? '#8BC34A' :      //초록
              res.ORESULT_CUR[i].FINISH_DSCR === '계획' ? '#FFFFB5' :      //노랑
              res.ORESULT_CUR[i].FINISH_DSCR === '완료100%미만' ? '#F7CAC9' : '#87CEFA', //분홍 : 하늘색
      textColor : res.ORESULT_CUR[i].FINISH_DSCR !== '삭제대상' ? '#4C4C4C' : '#FFFFFF',
      description : res.ORESULT_CUR[i].ASGN_FULL_NM
    })
  }
  console.log('calendarOptions.events',calendarOptions.events)
}

//캘린더 클릭 이벤트
const calendarClick = data => {
  calClickCnt.value++

  //0.5초안에 더블 클릭하지 않으면 초기화
  setTimeout(() => {
    calClickCnt.value = 0
  }, 500)
  if(calClickCnt.value === 2){
    console.log("클릭한 캘린더 데이터",data)
    let clickDate = dayjs(data.el.fcSeg.eventRange.range.start).format('YYYYMMDD')
    eDUAB0030Tab01Pop02.value.openPopup({
      CMPNY_DIV : searchParams2.CMPNY_DIV,
      EDU_DATE : clickDate,
      BSNS_CD : searchParams2.BSNS_CD,
      DEPT_CD : searchParams2.DEPT_CD,
      ASGN_CD : searchParams2.ASGN_CD,
      blsAdimn : 'ADMIN',
      REQ_YN : ''
    })
  }

}

onMounted( () => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-tabs v-model="tab" @click="tabChanged">
      <v-tab value="tab01">교육계획/실적관리</v-tab>
      <v-tab value="tab02">캘린더</v-tab>
    </v-tabs>
    <v-window v-model="tab" class="h-window">
      <v-window-item value="tab01">
        <v-card-title class="d-flex pa-3 pb-0" style="justify-content: space-between;">
          <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
          <div>
            <IMenuTitle
              :title="$t(useLogsStore().menuId)"
            />
          </div>
          <div class=d-flex>
            <!-- <IGridTitle
              ref="menuTitle1"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick"
            /> -->
            <i-select
              :label="$t('교육선택')"
              v-model="buttonParams.EDU_SELECT"
              :items="codeList.eduSelect"
              item-title="TXT"
              item-value="COD"
              width="200px"
              class="ma-0 ml-2 mr-2 mb-2"
            />
            <IGridTitle
              ref="menuTitle1_1"
              :button-list="['btnEduAdd','btnSearch']"
              @click-button="onButtonsClick"
            />
          </div>
        </v-card-title>
        <v-card-text class="pa-3 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <div class="d-flex">
                <i-input labelWidth="30px" width="213px" 
                  :label="$t('기간')" type="date"
                  v-model="searchParams.DATE_FROM"
                  @focusout="dateFrChanged"
                  @update:model-value="gridRefresh"
                  margin="10px"
                />
                <i-input width="190px"
                  :label="$t('-')" type="date"
                  v-model="searchParams.DATE_TO"
                  @focusout="dateToChanged"
                  @update:model-value="gridRefresh"
                />
                <i-select
                  :label="$t('분류')"
                  v-model="searchParams.DIVISION"
                  :items="codeList.division"
                  item-title="TXT"
                  item-value="COD"
                  @update:model-value="gridRefresh"
                  width="200px"
                />
                <i-select
                  :label="$t('교육명')"
                  v-model="searchParams.CURR_ID"
                  :items="codeList.currId"
                  item-title="TXT"
                  item-value="COD"
                  @update:model-value="gridRefresh"
                  width="420px"
                />
                <i-input 
                  :label="$t('소속')"
                  v-model="searchParams.DEPT_NM"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openDeptPopup"
                  @keydown.enter="e => {openDeptPopup('search')}"
                  @update:model-value="e => gridRefresh('DEPT_NM')"
                  width="250px"
                />
                <i-input
                  v-model="searchParams.DEPT_CD"
                  width="150px"
                  readonly
                />
              </div>
              <div class="d-flex mt-2">
                <i-select
                  :label="$t('교육구분')"
                  v-model="searchParams.REQ_YN"
                  :items="codeList.reqYn"
                  item-title="TXT"
                  item-value="COD"
                  @update:model-value="gridRefresh"
                  width="250px"
                />
                <i-select
                  :label="$t('진행상태')"
                  v-model="searchParams.FINISH_DSCR"
                  :items="codeList.finishDscr"
                  item-title="TXT"
                  item-value="COD"
                  @update:model-value="gridRefresh"
                  width="250px"
                />
              </div>
            </v-sheet>
            <!-- height : 직접 지정하고싶은 높이를 설정합니다.
            만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
            <v-sheet height="80%" class="mb-2">
              <!-- 메인그리드 -->
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </v-window-item>
      <v-window-item value="tab02">
        <v-card-title class="d-flex pa-3 pb-0" style="justify-content: space-between;">
          <div>
            <IMenuTitle
              :title="$t(useLogsStore().menuId)"
            />
          </div>
          <div class=d-flex>
            <IGridTitle
              ref="menuTitle2"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick2"
            />
          </div>
        </v-card-title>
        <v-card-text class="pa-3 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea d-flex">
              <i-input labelWidth="30px" width="213px" 
                :label="$t('기간')" type="month"
                v-model="searchParams2.YYYYMM"
                margin="10px"
              />
              <i-input 
                :label="$t('소속')"
                v-model="searchParams2.DEPT_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openDeptPopup('search')"
                @keydown.enter="e => {openDeptPopup('search')}"
                @update:model-value="e => {searchParams2.DEPT_CD = null}"
                width="250px"
              />
              <i-input
                v-model="searchParams2.DEPT_CD"
                readonly
                width="150px"
              />
            </v-sheet>
            <v-sheet height="95%" class="mb-2">
              <div style="height:3%; justify-content: flex-end;" class="d-flex">
                <div class="mr-1" style="background-color: #FF033E; font-size: large; border-radius: 5px;">　　</div>
                <div style="font-size: large;"> 삭제대상　</div>
                <div class="mr-1" style="background-color: #8BC34A; font-size: large; border-radius: 5px;">　　</div>
                <div style="font-size: large;"> 신청　</div>
                <div class="mr-1" style="background-color: #FFFFB5; font-size: large; border-radius: 5px;">　　</div>
                <div style="font-size: large;"> 계획　</div>
                <div class="mr-1" style="background-color: #F7CAC9; font-size: large; border-radius: 5px;">　　</div>
                <div style="font-size: large;"> 완료(100%미만 또는 증빙서류 미첨부 또는 미결재)　</div>
                <div class="mr-1" style="background-color: #87CEFA; font-size: large; border-radius: 5px;">　　</div>
                <div style="font-size: large;"> 완료(100%)</div>
              </div>
              <div class="mt-2" style="height:90%">
                <FullCalendar
                  ref="calendar"
                  :options="calendarOptions"
                />
                <div class="tooltip-wrapper" v-if="isTooltipVisible" :style="tooltipStyle">
                  <div class="tooltip" >{{ tooltipContent }}</div>
                  <div class="tooltip-arrow"></div> <!-- 화살표 -->
                </div>

              </div>
            </v-sheet>
          </div>
        </v-card-text>
      </v-window-item>
    </v-window>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" /> 
  <EDUAB0030Tab01Pop01 ref="eDUAB0030Tab01Pop01" @onClose="onClose"/>
  <EDUAB0030Tab01Pop02 ref="eDUAB0030Tab01Pop02" @onClose="onClose"/>
  <EDUAB0030Tab01Pop02Pop02 ref="eDUAB0030Tab01Pop02Pop02" @onClose="onClose"/>
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
.tooltip-wrapper {
  position: absolute; /* 화살표와 툴팁을 함께 위치시키기 위해 */
}

.tooltip {
  position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
  background-color: #424242;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
  pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
  white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
  border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
  border-top: 5px solid #424242; /* 화살표의 색상 */
  position: absolute;
  left: 50%; /* 가운데 정렬 */
  transform: translateX(-50%); /* 수평 중심으로 이동 */
  top: 100%; /* 툴팁 아래에 위치 */
}
</style> 
