<!--
  화면명 : 위험성평가 위원회 회의록 등록/현황 상세
  화면개요 : 회의록 등록 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, commonExecuteApi } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
// 참석 대상 선택
import SelectEmpPopup from "@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0020Popup01.vue"
// 정기위험성평가 목록
import WorkRiskList from "@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0010Popup03.vue"
// 부서 선택 팝업
import SelectDept from "@/components/popup/DeptPopup.vue"
// 리포트 팝업
import OZReport from "@/components/OZReport.vue"
// 결재 팝업
import ApprovalPopup from "@/components/popup/ApprovalPopup.vue"
//2024.2.15 차동운 화면ID
import { useLogsStore } from "@hiway/stores/logs"

// 다이얼로그 관련
const vm = getCurrentInstance().proxy
// 유저정보
const userStore = useUserStore()
// 다국어
const t = useI18n().t
const emit = defineEmits(["selected"])
const dialog = ref(false)
const selectEmpPopup = ref(null)
const workRiskList = ref(null)
const selectDept = ref(null)
const approvalPopup = ref(null)
const grdMain = ref(null)

// 리포트
const reportName = ref("/manage/hse/RSKDA0010_v2.ozr")
const params = ref([])
const showOz = ref(false)
//2024.2.15 차동운 화면ID
const logsStore = useLogsStore()

// 신규 구분
const isNew = ref(false)

const popupParams = reactive({
  CMPNY_DIV: "",
  BSNS_CD: "",
  DEPT_CD: "",
  APPR_STATUS: "",
  APPR_DATE: "",
  DEPT_NM: "",
  FILE_ID: "",
  MEETING_ID: "",
  MEETING_NM: "",
  MEETING_PLACE: "",
  MEETING_DATE: "",
  MEETING_STIME: "",
  MEETING_ETIME: "",
  METTING_CONTENT: "",
  USER_NM: "",
  DEPT_HEAD_NM: "",
  FILE_INFO: "",
  WORK_STANDARD: [],
  PARTICIPANT: [],
  isHover: false,
})

const timeModel = reactive({
  MEETING_STIME_HOUR: "", // 시작시간 시(h)
  MEETING_STIME_MIN: "", // 시작시간 분(m)
  MEETING_ETIME_HOUR: "", // 종료시간 시(h)
  MEETING_ETIME_MIN: "", // 종료시간 분(m)
})

const timeList = reactive({
  HOUR_LIST: [], // 시(h)
  MIN_LIST: [], // 분(m)
})

// 그리드 속성 셋팅
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    rowIndicator: { visible: false },
  },
  keys: ["MEETING_ID"],
  fields: [
    {
      fieldName: "WORK_STANDARD_ID",
      dataType: "text",
      editable: false,
      header: { text: t("작업표준ID") },
    },
    {
      fieldName: "WORK_STANDARD_NM",
      dataType: "text",
      editable: false,
      styleName: "left-column ",
      header: { text: t("작업 표준명") },
    },
    {
      fieldName: "UNIT_NM",
      dataType: "text",
      editable: false,
      styleName: "left-column ",
      header: { text: t("단위작업") },
    },
    {
      fieldName: "ACT_NM",
      dataType: "text",
      editable: false,
      styleName: "left-column ",
      header: { text: t("작업행동") },
    },
    {
      fieldName: "LOOK_OVER_RESULT",
      dataType: "text",
      editable: true,
      styleName: "multiline-editor left-column ",
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
      },
      header: { text: t("검토결과") },
    },

    // 숨기는 필드 visible:'false'
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "CASE_IDX", dataType: "text", visible: false },
    { fieldName: "UNIT_ID", dataType: "text", visible: false },
    { fieldName: "ACT_ID", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// popup open
const openPopup = async el => {
  for (let i in popupParams) {
    popupParams[i] = ''
  }

  for (let t in timeModel) {
    timeModel[t] = ''
  }

  dialog.value = true

  timeList.HOUR_LIST = []
  timeList.MIN_LIST = []

  // 시간(HOUR) 리스트 추가
  for (let h = 0; h < 24; h++) {
    h = String(h)
    h = h.length < 2 ? "0" + h : h
    timeList.HOUR_LIST.push(h)
  }

  // 분(MIN) 리스트 추가
  for (let m = 0; m < 60; m++) {
    if (m%10 == 0) {
      m = String(m)
      m = m.length < 2 ? "0" + m : m
      timeList.MIN_LIST.push(m)
    }
  }

  // 신규일 때
  if (el.isNew) {
    isNew.value = true
    popupParams.CMPNY_DIV = userStore.cmpnyDiv
    popupParams.BSNS_CD = userStore.bsnsCd
    popupParams.DEPT_CD = userStore.deptCd
    popupParams.USER_ID = userStore.userId
    popupParams.DEPT_NM = userStore.deptNm
    popupParams.USER_NM = userStore.userName
    popupParams.MEETING_DATE = dayjs().format('YYYY-MM-DD')
    popupParams.MEETING_NM = '위험성평가 위원회 검토'

    grdMain.value.getDataProvider().setRows(null)

  } else { // 상세조회일 때
    isNew.value = false
    // 데이터 바인딩
    for (let i in el) {
      popupParams[i] = el[i]

      // 시간 분리(MEETING_STIME)
      timeModel.MEETING_STIME_HOUR = el.MEETING_STIME
        ? el.MEETING_STIME.substring(0, 2)
        : ""
      timeModel.MEETING_STIME_MIN = el.MEETING_STIME
        ? el.MEETING_STIME.substring(2, 4)
        : ""

      // 시간 분리(MEETING_ETIME)
      timeModel.MEETING_ETIME_HOUR = el.MEETING_ETIME
        ? el.MEETING_ETIME.substring(0, 2)
        : ""
      timeModel.MEETING_ETIME_MIN = el.MEETING_ETIME
        ? el.MEETING_ETIME.substring(2, 4)
        : ""
    }

    // 팝업 오픈 시 API 호출
    await Promise.all([
      commonSearchApi({
        queryId: "RSKDA0010_POPUP_SEARCH_01",
        param: {
          MEETING_ID: el.MEETING_ID,
        },
      }),
      commonSearchApi({
        queryId: "RSKDA0010_POPUP_SEARCH_02",
        param: {
          MEETING_ID: el.MEETING_ID,
        },
      }),
    ]).then((res) => {
      popupParams.DEPT_HEAD_NM = res[0].ORESULT_CUR[0] !== null ? res[0].ORESULT_CUR[0].DEPT_HEAD_NM : ''
      popupParams.FILE_INFO = res[0].ORESULT_CUR[0] !== null ? res[0].ORESULT_CUR[0].FILE_INFO : ''
      popupParams.PARTICIPANT = res[1].ORESULT_CUR

      // 참석자 버튼 출력 설정
      for (let i of popupParams.PARTICIPANT) {
        i.isHover = false 
      }

      // 그리드 출력
      if (res[0].ORESULT_CUR[0] !== null) {
        grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      }
      
    })
  }
}

// 버튼 클릭 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === "btnClose") {
    closePopup()
  } else if (btn.id === "btnUpdate") {
    saveData()
  } else if (btn.id === "btnPrint") {
    showOz.value = true

    params.value = [
      // "DEPT_HEAD_NM=" +
      //   (!popupParams.DEPT_HEAD_NM ? "" : popupParams.DEPT_HEAD_NM),
      // "DEPT_NM=" + (!popupParams.DEPT_NM ? "" : popupParams.DEPT_NM),
      "IN_MEETING_ID=" +
        (!popupParams.MEETING_ID ? "" : popupParams.MEETING_ID),
      // "MEETING_DATE=" +
      //   (!popupParams.MEETING_DATE ? "" : popupParams.MEETING_DATE),
      // "MEETING_PLACE=" +
      //   (!popupParams.MEETING_PLACE ? "" : popupParams.MEETING_PLACE),
      // "APPR_DATE=" + (!popupParams.APPR_DATE ? "" : popupParams.APPR_DATE),
      // "USER_NM=" + (!popupParams.USER_NM ? "" : popupParams.USER_NM),
    ]
  } else if (btn.id === "btnReqApply") {
    const workStd = grdMain.value.getDataProvider().getJsonRows()

    let sJOB_TIT_NM01 = ''
    let sEMP_NM01 = ''
    let sJOB_TIT_NM02 = ''
    let sEMP_NM02 = ''
    let sJOB_TIT_NM03 = ''
    let sEMP_NM03 = ''
    let sJOB_TIT_NM04 = ''
    let sEMP_NM04 = ''
    let sJOB_TIT_NM05 = ''
    let sEMP_NM05 = ''
    let sJOB_TIT_NM06 = ''
    let sEMP_NM06 = ''
    let sJOB_TIT_NM07 = ''
    let sEMP_NM07 = ''
    let sJOB_TIT_NM08 = ''
    let sEMP_NM08 = ''
    let sJOB_TIT_NM09 = ''
    let sEMP_NM09 = ''
    let sJOB_TIT_NM10 = ''
    let sEMP_NM10 = ''

    for (let p = 0; p < popupParams.PARTICIPANT.length; p++) {
      if(p == 0){ 
        sJOB_TIT_NM01 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM01 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 1){ 
        sJOB_TIT_NM02 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM02 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 2){ 
        sJOB_TIT_NM03 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM03 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 3){ 
        sJOB_TIT_NM04 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM04 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 4){ 
        sJOB_TIT_NM05 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM05 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 5){ 
        sJOB_TIT_NM06 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM06 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 6){ 
        sJOB_TIT_NM07 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM07 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 7){ 
        sJOB_TIT_NM08 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM08 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 8){ 
        sJOB_TIT_NM09 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM09 = popupParams.PARTICIPANT[p].EMP_NM
      }
      if(p == 9){ 
        sJOB_TIT_NM10 = popupParams.PARTICIPANT[p].JOB_TIT_NM
        sEMP_NM10 = popupParams.PARTICIPANT[p].EMP_NM
      }
    }

    //2024.2.15 차동운 보고서 HTML 변환
    var sb = [];

    sb.push("<html>\n");
    sb.push("<head>\n");
    sb.push("<style>\n");
    sb.push(
      `.app_table {                        
          border: 1px solid #444444;
          border-collapse: collapse;
          font-family:HD현대체  Light;
          width:100%;
        }        
        .app_td {
          border: 1px solid #444444;
          padding: 5px;
          font-size: 14px;
          text-align: center;
		      height: 25px;
        }                      
        .title2{
          border: 1px solid #444444;
          background-color:lightsteelblue;
          font-weight: bold;
          text-align: center;
          padding: 5px;
          font-size: 14px; 
          height: 25px;                     
        }        
        .app_span {
          font-family: HD현대체 Bold;
        }
        .span_25 {
          font-size: 25px; 	
          font-family: HD현대체 Bold;
        }
        .span_15 {
          font-size: 15px;
          font-family: HD현대체 Bold; 						
        }`
    );
    sb.push("</style>\n");
    sb.push("</head>\n");
    sb.push("<body><br/>\n");
    sb.push(
      `<center><div><span class="span_25"><b>위험성평가 위원회 회의록</b></span></div></center>
		<br/>
		<table class="app_table">
			<tr>`);
    sb.push(`<th class="title2" style="width:15%">소속 조직</th>`);
    sb.push("<td class='app_td' style='width:35%'>" + (popupParams.DEPT_NM ?? '') + " </td>\n");
    sb.push(`<th class="title2" style="width:15%">작 성 자</th>`);
    sb.push("<td class='app_td' style='width:35%'>" + (popupParams.USER_NM ?? '') + " </td>\n");
		sb.push(`</tr><tr>`);
    sb.push(`<th class="title2" style="width:15%">회의 일시</th>`);
    sb.push("<td class='app_td' style='width:35%'>" + (popupParams.MEETING_DATE ?? '') + " </td>\n");
    sb.push(`<th class="title2" style="width:15%">회의 장소</th>`);
    sb.push("<td class='app_td' style='width:35%'>" + (popupParams.MEETING_PLACE ?? '') + " </td>\n");
		sb.push(`	                                           
			</tr>
		</table>
		<br/>
		<table class="app_table">
			<tr>
			  <th class="title2" style="width:20%" rowspan="6">참석자</th>
			  <th class="title2" style="width:20%">직 위</th>
			  <th class="title2" style="width:20%">성 명</th>
			  <th class="title2" style="width:20%">직 위</th>
			  <th class="title2" style="width:20%">성 명</th>				                                
			</tr>
			<tr>\n`);    

    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM01 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM01 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM02 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM02 + "</td>\n");					         
    sb.push(`</tr><tr>\n`);
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM03 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM03 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM04 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM04 + "</td>\n");					         
    sb.push(`</tr><tr>\n`);
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM05 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM05 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM06 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM06 + "</td>\n");
    sb.push(`</tr><tr>\n`);
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM07 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM07 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM08 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM08 + "</td>\n");
    sb.push(`</tr><tr>\n`);
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM09 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM09 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sJOB_TIT_NM10 + "</td>\n");
    sb.push("<td class='app_td' style='width:20%'>" + sEMP_NM10 + "</td>\n");			         
    sb.push(`</tr>
		</table>
		<br/>
		<table class="app_table">
			<tr>
			  <th class="title2" style="width:20%">회의내용</th>
			  <td class='app_td' style="width:80%;text-align: left;">${popupParams.METTING_CONTENT === null ? '' : popupParams.METTING_CONTENT.replaceAll('\n','<br/>')}</td>			                                           
			</tr>			
		</table>
		<br/>
		<table class="app_table">
			<tr>
			  <th class="title2" style="width:20%">작업 표준명</th>
			  <th class="title2" style="width:80%">검토 결과</th>			  
			</tr>
			<tr>`);
    for (let i = 0; i < workStd.length; i++) {
      sb.push(`<td class='app_td' style='width:30%;text-align: left;'>${workStd[i].WORK_STANDARD_NM === null ? '' : workStd[i].WORK_STANDARD_NM}</td>\n`);
      sb.push(`<td class='app_td' style='width:30%;text-align: left;'>${workStd[i].LOOK_OVER_RESULT === null ? '' : workStd[i].LOOK_OVER_RESULT.replaceAll('\n','<br/>')}</td>\n`);		
      sb.push(`</tr><tr>\n`);	
    }	                                           
		
    sb.push(`</tr>			
		</table> `
    );
    sb.push("<br/>\n");
    sb.push("<div style='text-align: left;'>\n");
    sb.push("<span class='span_15'>[첨부파일 바로가기]</span><br/>\n"); 
    sb.push(popupParams.FILE_INFO ?? '');
    sb.push("</div>\n");
    sb.push("</body>\n");
    sb.push("</html>\n"); 

    let xmlSrc = sb.join("");

    //console.log('xmlSrc',xmlSrc)

    approvalPopup.value.openPopup({
      RSK_RES_ID: 'M' + popupParams.MEETING_ID,
      CLSS_ID: logsStore.vueId,
      TITLE: "위험성평가 위원회 회의록",
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY:
        userStore.cmpnyDiv +
        ";" +
        popupParams.BSNS_CD +
        ";" +
        popupParams.BSNS_CD +
        ";" +
        new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT: xmlSrc, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: "3", //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: "421", //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE: "CLR_15", //결재라인
      // PARAM424 : '',  //사고보고서용 결재라인no,사번
    })
  }
}

// 결재 상신 후, 처리 결과 리턴
const approvalResult = val => {
  let apprType = val.appkey.substring(0, 1)
  let workId = val.appkey.substring(1)
  let draft = val.draft
  let approver = val.clrLine

  if (apprType == undefined || apprType == null) {
    return
  }

  let params = [{
    APPR_ID: val.appkey,
    APPR_TYPE: apprType,
    WORK_ID: workId,
    DRAFT_USR: draft,
  }]

  commonExecuteApi({ 
    queryId: "PKG_CSX02_COMMON_COMM_APPROVAL",
    list: params  
  })
}

// 저장
const saveData = async () => {
  let saveParams1 = {} // 위험성평가 위원회 회의관리 마스터
  let saveParams2 = [] // 위험성평가 위원회 회의관리 디테일 추가 및 수정
  let saveParams3 = [] // 위험성평가 위원회 회의관리 참석자 관리 추가 및 수정
  // saveParams1
  saveParams1.CMPNY_DIV = popupParams.CMPNY_DIV
  saveParams1.BSNS_CD = popupParams.BSNS_CD
  saveParams1.DEPT_CD = popupParams.DEPT_CD
  saveParams1.MEETING_ID = popupParams.MEETING_ID ? popupParams.MEETING_ID : ''
  saveParams1.MEETING_NM = popupParams.MEETING_NM
  saveParams1.MEETING_STIME =
    timeModel.MEETING_STIME_HOUR + timeModel.MEETING_STIME_MIN
  saveParams1.MEETING_ETIME =
    timeModel.MEETING_ETIME_HOUR + timeModel.MEETING_ETIME_MIN
  saveParams1.MEETING_DATE = popupParams.MEETING_DATE
  saveParams1.MEETING_PLACE = popupParams.MEETING_PLACE
  saveParams1.METTING_CONTENT = popupParams.METTING_CONTENT
  saveParams1.USER_ID = userStore.userId

  // 신규등록
  if (isNew.value) {
    if (!saveParams1.DEPT_CD) {
      return Message.warn(t('소속 조직을 선택해주세요.'))
    } else if (!saveParams1.MEETING_DATE) {
      return Message.warn(t('회의날짜를 선택해주세요'))
    } else if (!saveParams1.MEETING_PLACE) {
      return Message.warn(t('회의장소를 입력해주세요'))
    } else if (!saveParams1.METTING_CONTENT) {
      return Message.warn(t('회의내용을 입력해주세요'))
    } else if (!saveParams1.MEETING_NM) {
      return Message.warn(t('회의명을 입력해주세요'))
    } else if (!saveParams1.MEETING_STIME) {
      return Message.warn(t('회의 시작시간을 선택해주세요.'))
    } else if (!saveParams1.MEETING_ETIME) {
      return Message.warn(t('회의 종료시간을 선택해주세요.'))
    } else if (saveParams1.MEETING_STIME > saveParams1.MEETING_ETIME) {
      return Message.warn(t("시작시간이 종료시간보다 큽니다. 확인해주세요."))
    }

    saveParams1.MEETING_NM = popupParams.MEETING_NM

    vm.$swal({
      title: t("저장 하시겠습니까?"),
      showCancelButton: true,
    }).then(swal => {
      if (swal.isConfirmed === true) {
        commonExecuteApi({
          queryId : 'RSKDA0010_SAVE_01',
          list: [saveParams1] 
        }).then(res => {
          if (res.result.status === '200') {
            emit('selected', res.list[0])
            //console.log('OUT_RES_SEQ',res.list[0].OUT_RES_SEQ)
            popupParams.MEETING_ID = res.list[0].OUT_RES_SEQ
            isNew.value = false
          }
        }).catch(err => {
          return Message.err(err)
        }).finally(() => {
          Message.success(t('저장 되었습니다.'))
          //closePopup()
        })
      }
    })

  } else {  // 상세조회 및 수정
    // saveParams2
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      data.MEETING_ID = popupParams.MEETING_ID

      if (!data.LOOK_OVER_RESULT) {
        return Message.warn(t("검토결과를 입력해주세요."))
      }
      saveParams2.push(data)
    }

    // saveParams3
    for (let i of popupParams.PARTICIPANT) {
      if (i.DIVISION === "NEW") {
        i.MEETING_ID = popupParams.MEETING_ID
        i.USER_ID = userStore.userId
        saveParams3.push(i)
      }
    }

    // SAVE API 호출
    vm.$swal({
      title: t("저장 하시겠습니까?"),
      showCancelButton: true,
    }).then(swalRes => {
      if (swalRes.isConfirmed === true) {
        Promise.all([
          commonExecuteApi({
            queryId: "RSKDA0010_POPUP_SAVE_01",
            list: [saveParams1],
          }),
          commonExecuteApi({
            queryId: "RSKDA0010_POPUP_SAVE_02",
            list: saveParams2,
          }),
          commonExecuteApi({
            queryId: "RSKDA0010_POPUP_SAVE_03",
            list: saveParams3,
          }),
        ]).then(res => {
          if (res[0].result.status === "200") {
            // 그리드 체크 해제
            grdMain.value.getGridView().setAllCheck(false)

            Message.success(t("저장 되었습니다."))
          }
        }).catch((err) => {
          Message.err(err)
        }).finally(() => {
          // saveParams3에서 DIVISION이 'NEW'인 것만 저장하기때문에 저장 후 빈 값으로 변경
          for (let i of saveParams3) {
            i.DIVISION = ''
          }
        })
      }
    })
  }
}

// 삭제 버튼 이벤트
const handlerDelWork = () => {
  if(isNew.value){
    return Message.err("저장 후 클릭바랍니다.")
  }

  let deleteParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    data.MEETING_ID = popupParams.MEETING_ID

    deleteParams.push(data)
  }

  if (deleteParams.length < 1) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  vm.$swal({
    title: t("삭제 하시겠습니까?"),
    showCancelButton: true, 
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      // 그리드에서 제거
      for (let rowIdx of checkedRows) {
        grdMain.value.getDataProvider().removeRow(rowIdx)
      }
      // 실제 데이터 삭제
      commonExecuteApi({
        queryId: "RSKDA0010_POPUP_DELETE_01",
        list: deleteParams,
      }).then((res) => {
        if (res.result.status === "200") {
          Message.success(t("삭제 되었습니다."))
        }
      })
    }
  })
}

// '전체공통' 버튼 클릭 시 Row 추가
const handlerAddWork = () => {
  if(isNew.value){
    return Message.err("저장 후 클릭바랍니다.")
  }

  let newRow = {
    WORK_STANDARD_ID: "",
    WORK_STANDARD_NM: "전체 공통사항",
    LOOK_OVER_RESULT: "",
    CASE_IDX: "000",
  }

  // 그리드 데이터
  let allData = grdMain.value.getDataProvider().getJsonRows()

  for (let i of allData) {
    if (i.CASE_IDX === newRow.CASE_IDX) {
      return Message.err("이미 추가된 항목이 있습니다.")
    }
  }

  return grdMain.value.addRow(newRow)
}

// 참석자 선택 팝업
const searchEmpInfo = () => {
  if(isNew.value){
    return Message.err("저장 후 추가바랍니다.")
  }

  const title = "참석대상"
  selectEmpPopup.value.openPopup({
    title: title,
    BSNS_CD: popupParams.BSNS_CD,
    DEPT_CD: popupParams.DEPT_CD,
    checkBar: true,
  })
}

const onEmpSelected = val => {
  // popupParams.PARTICIPANT가 배열인지 확인하고, 배열이 아니면 배열로 초기화
  if (!Array.isArray(popupParams.PARTICIPANT)) {
    popupParams.PARTICIPANT = []
  }

  // 사번만 currentList에 넣기
  let currentList = []

  for (let curr of popupParams.PARTICIPANT) {
    currentList.push(curr.EMP_NO)
  }

  // currentList의 사번과 선택한 사번을 비교(동일 값은 배제)
  for (let i of val) {
    if (currentList.includes(i.EMP_NO) === true) {
      Message.err(t("이미 추가된 인원이 있습니다."))
    } else {
      popupParams.PARTICIPANT.push({
        EMP_NM: i.EMP_NM,
        EMP_NO: i.EMP_NO,
        JOB_TIT_CD: i.JOB_TIT_CD,
        JOB_TIT_NM: i.JOB_TIT_NM,
        DEPT: i.DEPT_NM,
        DIVISION: "NEW", // 신규인지 구분
        isHover: false,
      })
    }
  }
}

// 참석자 삭제 버튼
const handlerDelEmp = (item, index) => {
  item.MEETING_ID = popupParams.MEETING_ID // MEETING_ID 추가

  vm.$swal({
    title:
      item.EMP_NM +
      " " +
      item.JOB_TIT_NM +
      "(" +
      item.DEPT +
      ")" +
      "님을 참석자 명단에서 삭제 하시겠습니까?",
    showCancelButton: true,
  }).then(swalRes => {
    if (swalRes.isConfirmed === true) {
      popupParams.PARTICIPANT.splice(index, 1)
      return commonExecuteApi({
        queryId: "RSKDA0010_POPUP_DELETE_02",
        list: [item],
      }).then((res) => {
        if (res.result.status === "200") {
          Message.success(t("삭제 되었습니다."))
        }
      })
    }
  })
}

// 정기위험성평가 목록
const openWorkRiskList = () => {
  if(isNew.value){
    return Message.err("저장 후 클릭바랍니다.")
  }

  workRiskList.value.openPopup({
    CMPNY_DIV: popupParams.CMPNY_DIV,
    BSNS_CD: popupParams.BSNS_CD,
    DEPT_CD: popupParams.DEPT_CD
  })
}

const onWorkRiskList = (val) => {
  let allData = grdMain.value.getDataProvider().getJsonRows()

  for (let i of val) {
    for (let all of allData) {
      if (all.UNIT_ID === i.UNIT_ID || all.ACT_ID === i.ACT_ID) {
        return Message.err(t("이미 추가된 항목이 있습니다."))
      }
    }
    grdMain.value.addRow({
      WORK_STANDARD_ID: i.WORK_STANDARD_ID,
      WORK_STANDARD_NM: i.WORK_STANDARD_NM,
      UNIT_NM: i.UNIT_NM,
      ACT_NM: i.ACT_NM,
      UNIT_ID: i.UNIT_ID,
      ACT_ID: i.ACT_ID
    })
  }
}

// 부서 선택 팝업
const onSearchDept = () => {
  selectDept.value.openPopup({})
}

const onDeptSelected = (val) => {
  popupParams.BSNS_CD = val.BSNS_CD
  popupParams.DEPT_CD = val.ORGN_DIV === 'A' ? val.DEPT_CD : val.ASGN_CD
  popupParams.DEPT_NM = val.ASGN_SHRT_NM
}

// 팝업 닫기
const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

onMounted(() => {})
</script>

<template>
  <VDialog
    v-model="dialog"
    scrollable
    eager
    persistent
    :width="isNew ? '1200' : '1200'"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>위험성평가 위원회 회의록 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0">
        <!-- (1)신규 -->
        <IGridTitle
          v-if="isNew"
          :title="''"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
        <!-- (2) 결재상태가 완료가 아닌 경우 -->
        <IGridTitle
          v-else-if="!isNew && (popupParams.APPR_STATUS === 'C' || !popupParams.APPR_STATUS)"
          :title="popupParams.MEETING_NM"
          :button-list="['btnReqApply', 'btnUpdate', 'btnPrint', 'btnClose']" 
          @click-button="onButtonsClick"
        />
        <!-- (3) 결재완료된 경우 --> 
        <IGridTitle
          v-else
          :title="popupParams.MEETING_NM"
          :button-list="['btnUpdate', 'btnPrint', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="flex-column">
            <VTable>
              <tbody style="overflow: hidden">
                <tr>
                  <!-- 소속조직 -->
                  <td class="border pa-0 thBg" width="5%">
                    <div class="d-flex justify-center">
                      <p>소속조직</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" style="width: 8%">
                    <VRow class="d-flex align-center">
                      <VCol cols="12" md="10" class="pl-5">
                        {{ popupParams.DEPT_NM }}
                      </VCol>
                      <VCol cols="12" md="2" class="d-flex align-center">
                        <!-- <VIcon 
                          icon="mdi-feature-search-outline"
                          color="primary"
                          @click="onSearchDept"
                        /> -->
                          <svg-icon name="detailSearch" @click="onSearchDept" style="cursor: pointer;"/>
                      </VCol>
                    </VRow>
                  </td>
                  <!-- 작성자 -->
                  <td
                    class="border pa-0 thBg"
                    style="width: 3%; text-align: center"
                  >
                    작성자
                  </td>
                  <td class="border pa-0" style="width: 4%; text-align: center">
                    {{ popupParams.USER_NM }}
                  </td>
                  <!-- 회의장소 -->
                  <td class="border pa-0 thBg">
                    <div class="d-flex justify-center">
                      <p>회의장소</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" style="width: 4%; text-align: center">
                    <VTextField
                      v-model="popupParams.MEETING_PLACE"
                      variant="solo"
                    />
                  </td>
                  <td
                    v-if="!isNew"
                    class="border pa-0 thBg"
                    style="width: 1%; text-align: center"
                    rowspan="3"
                  >
                    결재
                  </td>
                  <td v-if="!isNew" class="border pa-0" style="width: 3%; text-align: center">
                    최종결재자
                  </td>
                </tr>
                <tr>
                  <!-- 회의일자 -->
                  <td
                    class="border pa-0 thBg"
                    :rowspan="isNew ? 1 : 2"
                  >
                    <div class="d-flex justify-center">
                      <p>회의일자</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td
                    class="border pa-0"
                    style="width: 8%; text-align: center"
                    :rowspan="isNew ? 1 : 2"
                  >
                    <VTextField
                      v-model="popupParams.MEETING_DATE"
                      variant="solo"
                      type="date"
                    />
                  </td>
                  <!-- 회의시간 -->
                  <td
                    class="border pa-0 thBg"
                    :rowspan="isNew ? 1 : 2"
                  >
                    <div class="d-flex justify-center">
                      <p>회의시간</p>
                      <svg-icon class="dot" name="redDot" />
                      <!-- <v-tooltip
                        activator="parent"
                        location="bottom"
                      >
                        <v-sheet width="100%">
                          <p class="text-white">시작시간을 종료시간보다 작게 입력하세요.</p>
                        </v-sheet>
                      </v-tooltip> -->
                    </div>
                  </td>
                  <td
                    class="border pa-0"
                    style="width: 12%; text-align: center"
                    colspan="3"
                    :rowspan="isNew ? 1 : 2"
                  >
                    <VRow class="ma-2">
                      <VCol cols="12" md="3" class="d-flex align-center justify-center">
                        <!-- <VIcon icon="mdi-clock" color="primary" /> -->
                        <svg-icon name="time" class="mr-1"/>
                        시작시간
                      </VCol>
                      <VCol cols="12" md="3">
                        <VAutocomplete
                          v-model="timeModel.MEETING_STIME_HOUR"
                          :items="timeList.HOUR_LIST"
                        />
                      </VCol>
                      <VCol cols="12" md="3">
                        <VAutocomplete
                          v-model="timeModel.MEETING_STIME_MIN"
                          :items="timeList.MIN_LIST"
                        />
                      </VCol>
                    </VRow>
                    <VRow class="ma-2">
                      <VCol cols="12" md="3" class="d-flex align-center justify-center">
                        <!-- <VIcon icon="mdi-clock" color="primary" /> -->
                        <svg-icon name="time" class="mr-1"/>
                        종료시간
                      </VCol>
                      <VCol cols="12" md="3">
                        <VAutocomplete
                          v-model="timeModel.MEETING_ETIME_HOUR"
                          :items="timeList.HOUR_LIST"
                        />
                      </VCol>
                      <VCol cols="12" md="3">
                        <VAutocomplete
                          v-model="timeModel.MEETING_ETIME_MIN"
                          :items="timeList.MIN_LIST"
                        />
                      </VCol>
                    </VRow>
                  </td>
                  <td v-if="!isNew" class="border pa-0" style="width: 3%; text-align: center">
                    {{ popupParams.DEPT_HEAD_NM }} 
                  </td>
                </tr>
                <tr v-if="!isNew">
                  <td class="border pa-0" style="width: 3%; text-align: center">
                    {{ popupParams.APPR_DATE }}
                  </td>
                </tr>

                <tr v-if="isNew">
                  <td class="border pa-0 thBg">
                    <div class="d-flex justify-center">
                      <p>회의명</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" style="width: 3%" colspan="5">
                    <VTextField
                      v-model="popupParams.MEETING_NM"
                      variant="solo"
                    />
                  </td>
                </tr>
                
                <tr>
                  <td class="border pa-0 thBg">
                    <div class="d-flex justify-center">
                      <p>회의내용</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" style="width: 3%" :colspan="isNew ? 5 : 7">
                    <VTextarea
                      v-model="popupParams.METTING_CONTENT"
                      variant="solo"
                      hide-details
                      :no-resize="false"
                      rows="5"
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    class="border pa-0 thBg"
                    style="width: 3%; text-align: center"
                  >
                    참석자
                  </td>
                  <td class="border pa-0" style="width: 3%" colspan="7">
                    <VRow>
                      <VCol cols="12" md="11">
                        <VRow>
                          <VCol
                            cols="12"
                            md="2"
                            class="ma-2 pa-0"
                            v-for="(item, index) in popupParams.PARTICIPANT"
                            :key="index"
                            @mouseover="item.isHover = true"
                            @mouseleave="item.isHover = false"
                          >
                            <VCard
                              v-if="item.isHover === false"
                              class="btnParticipant btnH"
                            >
                              {{ item.EMP_NM }} {{ item.JOB_TIT_NM }}<br />{{
                                "(" + item.DEPT + ")"
                              }}
                            </VCard>
                            <VCard
                              v-else
                              class="btnDelParticipant btnH"
                              @click="handlerDelEmp(item, index)"
                            >
                              삭제
                            </VCard>
                          </VCol>
                        </VRow>
                      </VCol>
                      <VCol cols="12" md="1">
                        <svg-icon name="peoplePlus" @click="searchEmpInfo" style="cursor: pointer; height:24px"/>
                        <!-- <VIcon
                          icon="mdi-account-plus"
                          color="primary"
                          @click="searchEmpInfo"
                        /> -->
                      </VCol>
                    </VRow>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </v-sheet>
          <v-sheet            
            class="d-flex mt-2 align-self-end"
          >
            <VBtn class="mx-1" @click="handlerAddWork()">전체공통</VBtn>
            <VBtn class="mx-1" @click="openWorkRiskList()">작업표준 선택</VBtn>
            <VBtn class="mx-1" @click="handlerDelWork()">삭제</VBtn>
          </v-sheet>
          <v-sheet class="mt-2">
            <div><span>※ [검토결과] 입력 중 줄바꿈 필요 시 ctrl+enter키를 이용하여 줄바꿈 가능</span></div>
            <RealGrid
            ref="grdMain"
            class="mt-0"
            style="height: calc(100vh - 700px)"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
          </v-sheet>          
        </div>
      </v-card-text>
    </v-card>

    <!-- 참석대상 선택 -->
    <SelectEmpPopup ref="selectEmpPopup" @selected="onEmpSelected" />
    <!-- 정기위험성평가목록 -->
    <WorkRiskList ref="workRiskList" @selected="onWorkRiskList" />
    <!-- 부서 선택 -->
    <SelectDept ref="selectDept" @selected="onDeptSelected" />
    <!-- 리포트 -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />
    <!-- 결재 -->
    <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalResult" />
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.thBg {
  background-color: #e8eaf2;
  font-weight: bold;
}

/* 참석자 출력 */
.btnH {
  font-size: 12px;
  height: 40px;
}

.btnParticipant {
  background-color: #e8eaf2;
  border-radius: 5px;
  text-align: center;
}

.btnDelParticipant {
  background-color: #ff1d00;
  border-radius: 5px;
  text-align: center;
  height: 100%;
  font-size: 15px;
  color: white;
  line-height: 40px;
}
div.v-col-md-1.v-col-12 {
  align-self: center;
  text-align: center;
}

.v-table {
  overflow: hidden;
}
.dot {
  justify-content: normal !important;
  align-items: normal !important;
} 
</style>
