<!--  디지털혁신기획부 한민규   -->
<!--  프로그램명 : 일반공사 허가서 작성 팝업    -->

<script setup lang="ts" >
import { ref, reactive, onMounted, watch, getCurrentInstance } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue" 
import ILabel from "@/components/ILabel.vue" 
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { isEmpty, value } from "lodash-es"
import { getQDomain } from '@/utils/common'
import Message from "@hiway/utils/notify"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
// import _ from "lodash"
 import EmpPopup from "@/components/popup/EmpPopup.vue"
 import DeptPopup from "@/components/popup/DeptPopup.vue"
 import PtwPopup from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_Ptwlist.vue"
 import RcvPopup from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_Rcvlist.vue"
 import {PerfectScrollbar} from 'vue3-perfect-scrollbar'

import SAFBA0010WRK_STD from "@/pages/30_safety/SAF_B/SAFBA0010WRK_STD.vue"
import SAFBA0010WRK_STD2 from "@/pages/30_safety/SAF_B/SAFBA0010WRK_STD2.vue"
import SAFBA0010WorkPlanPopup from "@/pages/30_safety/SAF_B/SAFBA0010WorkPlanPopup.vue"
import SAFBA0010LikeWrkPlace from "@/pages/30_safety/SAF_B/SAFBA0010LikeWrkPlace.vue"
import WorkPlace from "@/pages/30_safety/SAF_B/SAFBA0010WorkPlace.vue"
import DatePopUp from "@/pages/30_safety/SAF_B/SAFBA0010DatePopUp.vue"
import SafeAppPopUp from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_SafeApp.vue"
import dangi from "@/pages/30_safety/SAF_B/SAFBA0010dangi.vue"
import CommonCodePopUpSAF from "@/components/popup/CommonCodePopUpSAF.vue"
import OZReport from "@/components/OZReport.vue"

const userStore = useUserStore() //유저정보

const internalInstance = getCurrentInstance();
const vm = internalInstance ? internalInstance.proxy : null; //다이얼로그관련

const t = useI18n().t //다국어
const dialog = ref<boolean>(false)
const disabledSTATUS = ref<boolean>(false)
const isMngr = ref<boolean>(false) // 관리감독자가 있는지
const empfocus = ref<string>("") // 인원팝업시 변경할 대상: 관리감독자 팝업('MNGR'),  작업책임자 팝업('RESP'),  공사담당자 팝업('REQ')
const isInitialLoading = ref<boolean>(false) // 초기 데이터 로딩 중인지 확인하는 플래그
const isH = ref<boolean>(false) // 협력사 admin인지 여부 -> PKG_SAFBA0010.SEARCH_18 로 찾음
const showOz = ref(false)
const isMulti = ref(false)
const reportName = ref<string>("")
const params = ref<any>([])
const deptPopup = ref(null)
const empPopup = ref(null)
const ptwPopup = ref(null)
const rcvPopup = ref(null)
const WrkPopup = ref(null)
const WrkPopup2 = ref(null)
const DatePop = ref(null)
const SafeAppPop = ref(null)

const emit = defineEmits(["upData"])
const menuTitle = ref(null)
const selectedIndex = ref<number>(0)

const grdSub1 = ref<any>(null)
const grdSub1_1 = ref<any>(null)
const grdSub1_2 = ref<any>(null)
const CCP = ref<any>(null)
const ApplyALLIng = ref<boolean>(false)
const ReadOnly = ref<boolean>(false)

interface CodeList {
  company: any;
  bsnsCd:any;
  WRK_PLC: { COD: string; TXT: string }[];
  DANG_DIV1: {COD: string, TXT: string }[];
  DANG_DIV2: {COD: string, TXT: string }[];
  MNGR_EMP_NO: any;
  WorkNo: {SHIP_KIND_NM: string, WORK_NO: string, SHIP_CAPA: string }[];
  deptCd: any;
}

interface Button {
  id: string; 
}

interface PTWdata {
  RCV_NO: string,         // 허가서번호
  CMPNY_DIV:string,       // 소속회사
  BSNS_CD: string,        // 소속 부서
  DEPT_CD: string,        // 소속 부서
  DEPT_NM: string,        // 소속 부서명
  DEPT_NM2: string,       // 소속부서명
  ASGN_CD: string,        // 소속 조직코드
  JOB_BSNS_CD: string,    // 작업사업부
  JOB_BSNS_NM: string,    // 작업사업부명
  RCV_TYPECheck: boolean, // 해양공사(t) or 호선(f) 

  MNGR_EMP_NM: string,    // 관리감독자(승인자) 이름 
  MNGR_EMP_NO: string,    // 관리감독자(승인자) 사번
  MNGR_HP_NO: string,     // 관리감독자(승인자) 휴대폰
  MNGR_TRS_NO: string,    // 관리감독자(승인자) TRS
  WRK_DIST : string,      // PTW 작업명
  CF_DIV: string,         // 허가구분
  CF_DIV_NM: string,      // 허가구분명
  THREECHECKYN: string,   // 3중점검대상
  WORK_DETAIL: string,    // 작업상세
  RESP_EMP_NM: string,    // 작업 책임자 이름 
  RESP_EMP_NO: string,    // 작업 책임자 사번
  RESP_HP_NO: string,     // 관리감독자(승인자) 휴대폰
  REQ_EMP_NM : string,    // 공사담당자 이름
  REQ_EMP_NO : string,    // 공사담당자 사번
  WRK_STD_NO : string,    // 작업표준번호
  WRK_STD_NM : string,    // 작업표준명
  CONFINED_YN: string,    // 밀폐구역 여부 'Y'/'N'
  ARGN_YN: string,        // 아르곤 여부
  ELEC_YN: string,        // 수전구역여부 여부 'Y'/'N'
  HEIGHT_YN: string,      // 고소작업 여부 'Y'/'N'
  HEIGHT: string,         // 높이값
  PRESSURE_YN: string,    // 압력테스트 여부 'Y'/'N'
  PRESSURE: string,       // 압력값
  PIPE_DIA_YN: string,    // 파이프직경 여부 'Y'/'N'
  PIPE_DIA: string,       // 파이프직경값
  URGENT_YN : string,     // 긴급작업 여부 'Y'/'N'
  WORK_NO_EXIST : string, // 호선없음 체크
  STATUS: string,         // 상태값
  STATUS_NM: string,      // 상태값 명칭


  RCV_TYPE: string,       // 조선 : C, 해양 : Q, 나머지 사업부 두번째 자리

  DN_DIV: string,         // 주야구분
  WORKER_CNT: number|null,     // 작업인원


  DANG_DIV: string,        // 위험작업분류
  DNGR_RSN: string,        // 유해위험요소
  REL_ASGN_CD: string,     // 안전과 조직코드
  REL_EMP_NO: string,      // 안전과인원
  REL_TEL_NO: string,      // 안전과번호
  REL_DEPT_CD: string,     // 안전과 부서코드
  APP_EMP_NO: string,      // 승인자
  PARA_CHK_YN: string,     // 병행작업여부
  COMPANY: string,         // 작업자회사코드
  WORK_DESC: string,       // 작업내용
 
  WRK_DIST_SEQ : string,    // 작업종류(대) SEQ
  FORM_TYPE: string,        // R2로 고정 
  P_WRK_ID: string,         // 위험작업번호
  CON_YN: string|null,           // RCV_TYPECheck 여부
  WRK_PLC: string,         // 공종/계열


  SHORT_WORK_NO: string,      // 단기공사번호: 일반공사는 ''
  VNDR_CD: string,            // 협력사코드 : 일반공사는 ''
  DAN_WORK_ID : string,       // 단기공사 작업표준
  WORK_COMPLEX_CD  : string,  // 단기공사 복합공정코드
  USER_ID : string,           // 작성자
  WRK_DIV : string,           // 단기공사: 

  // 장소
  WORK_NO: string,         // 호선
  JOB_PLC: string,         // 작업장소
  JOB_LPLC: string,        // 작업장소 대분류 
  JOB_MPLC: string,        // 작업장소 중분류 
  JOB_SPLC: string,        // 작업장소 소분류 
  JOB_PLC_DTL : string,    // 작업위치 상세
  JOB_PLC_DTL_YN: string,         //내업 상세위치 표시여부

  // 시간 문자열
  WORK_DT: string,                // 작업일
  WORK_START_TIME: string,        // 작업시작일시
  WORK_END_TIME: string,          //  작업종료일시
  ALL_START_TIME: string,         // 시작시간 문자열 합
  ALL_END_TIME  : string,         // 종료시간 문자열 합
  ALL_OVERTIME_YN : string,       // 연장 문자열 합
  ALL_CANCELED_YN: string,    // 작업 취소 문자열 합
  OVERTIME_YN: string,          // 연장여부  

  // 작업 일시 데이터
  PLANDATA: Plandata[],

  // 장소 장소 데이터
  LOCATIONTYPE: string  // 작업 장소 구분 (C/B/D/E 등)
  GRDSUB1: any[] | null
  GRDSUB1_1: any[] | null
  GRDSUB1_2: any[] | null





}

interface Plandata {
  ALL_END_TIME: string ,
  ALL_START_TIME: string ,
  CANCELED_YN:string
  DN_DIV: string ,
  OT: string ,
  dt: string,
  time:string, 


}





// 카드 리스트
const cards = ref<PTWdata[]>([])
const workPlacePopUp = ref<any>(null)

// 장소 즐겨찾기
const LikeWrkPlace = ref(null)


const codeList = reactive<CodeList>({
  company: [],
  bsnsCd: [],
  WRK_PLC: [],
  DANG_DIV1: [],
  DANG_DIV2: [],
  MNGR_EMP_NO: [],
  WorkNo: [],
  deptCd: [],
})



// const DateInt = ref<Plandata[]>(
//   Array.from({ length: 7 }, () => ({
//     date: "",
//     dt: "",
//     time: "",
//     DN_DIV: "",
//     CANCELED_YN: ""
//   }))
// )

const datainer =  ref<PTWdata>({
    RCV_NO: "",
    CMPNY_DIV:userStore.cmpnyDiv,       // 소속회사
    BSNS_CD: userStore.bsnsCd,        // 소속 사업부코드
    DEPT_CD: userStore.deptCd,        // 소속 부서코드
    DEPT_NM: userStore.asgnFullNm,        // 소속 부서명
    DEPT_NM2: userStore.deptNm,        // 소속 부서명
    ASGN_CD: userStore.asgnCd,        // 소속 조직코드
    JOB_BSNS_CD: userStore.bsnsCd,    // 작업사업부
    JOB_BSNS_NM: userStore.bsnsNm,    // 작업사업부명
    RCV_TYPECheck: false, // 해양공사(t) or 호선(f) 
    MNGR_EMP_NM: "",    // 관리감독자(승인자) 이름 
    MNGR_EMP_NO: "",    // 관리감독자(승인자) 사번
    MNGR_HP_NO: "",     // 관리감독자(승인자) 휴대폰
    MNGR_TRS_NO: "",    // 관리감독자(승인자) TRS
    WRK_DIST : "",      // PTW 작업명
    CF_DIV: "",         // 허가구분
    CF_DIV_NM: "",      // 허가구분명
    THREECHECKYN: "",   // 3중점검대상
    WORK_DETAIL: "",    // 작업상세
    RESP_EMP_NM: userStore.empNm,    // 작업 책임자 이름 
    RESP_EMP_NO: userStore.empNo,    // 작업 책임자 사번
    RESP_HP_NO: "",     // 관리감독자(승인자) 휴대폰
    REQ_EMP_NM : userStore.empNm,    // 공사담당자 이름
    REQ_EMP_NO : userStore.empNo,    // 공사담당자 사번
    WRK_STD_NO : "",    // 작업표준 번호
    WRK_STD_NM : "",    // 작업표준명
    CONFINED_YN: "N",    // 밀폐구역 여부 'Y'/'N'
    ARGN_YN: "N",        // 아르곤 여부
    ELEC_YN: "N",        // 수전구역여부 여부 'Y'/'N'
    HEIGHT_YN: "N",      // 고소작업 여부 'Y'/'N'
    HEIGHT: "",         // 높이값
    PRESSURE_YN: "N",    // 압력테스트 여부 'Y'/'N'
    PRESSURE: "",       // 압력값
    PIPE_DIA_YN: "N",    // 파이프직경 여부 'Y'/'N'
    PIPE_DIA: "",       // 파이프직경값
    URGENT_YN : "N",     // 긴급작업 여부 'Y'/'N'
    WORK_NO_EXIST : "N", // 호선없음 체크
    STATUS: "20",         // 상태값
    STATUS_NM: "작성중(사내)",      // 상태값 명칭
    RCV_TYPE: "",       // 조선 : C, 해양 : Q, 나머지 사업부 두번째 자리
    DN_DIV: "",         // 주야구분
    WORKER_CNT: null,     // 작업인원
    DANG_DIV: "",        // 위험작업분류
    DNGR_RSN: "",        // 유해위험요소
    REL_ASGN_CD: "",     // 안전과 조직코드
    REL_EMP_NO: "",      // 안전과인원
    REL_TEL_NO: "",      // 안전과번호
    REL_DEPT_CD: "",     // 안전과 부서코드
    APP_EMP_NO: "",      // 승인자
    PARA_CHK_YN: "N",     // 병행작업여부
    COMPANY: "",         // 작업자회사코드
    WORK_DESC: "",       // 작업내용
    WRK_DIST_SEQ : "",    // 작업종류(대) SEQ
    FORM_TYPE: "",        //
    P_WRK_ID: "",         // 위험작업번호
    CON_YN: "",           // RCV_TYPECheck 여부
    WRK_PLC: "",          // 공종/계열
    SHORT_WORK_NO: "",      // 단기공사번호: 일반공사는 ''
    VNDR_CD: "",            // 협력사코드 : 일반공사는 ''
    DAN_WORK_ID : "",       // 단기공사 작업표준
    WORK_COMPLEX_CD  : "",  // 단기공사 복합공정코드
    USER_ID : userStore.empNo,           // 작성자
    WRK_DIV : "",

    WORK_NO: "",         // 호선
    JOB_PLC: "",         // 작업장소
    JOB_LPLC: "",        // 작업장소 대분류 
    JOB_MPLC:  "",        // 작업장소 중분류 
    JOB_SPLC:  "",        // 작업장소 소분류 
    JOB_PLC_DTL :  "",    // 작업위치 상세
    JOB_PLC_DTL_YN:  "",         //내업 상세위치 표시여부
    WORK_DT: "",                // 작업일
    WORK_START_TIME: "",        // 작업시작일시
    WORK_END_TIME: "",          //  작업종료일시
    ALL_START_TIME: "",         // 시작시간 문자열 합
    ALL_END_TIME  : "",         // 종료시간 문자열 합
    ALL_OVERTIME_YN : "",       // 연장 문자열 합
    ALL_CANCELED_YN: "",    // 작업 취소 문자열 합
    OVERTIME_YN: "",          // 연장여부  

    PLANDATA:Array.from({ length: 7 }, () => ({ALL_END_TIME: "", ALL_START_TIME: "",  CANCELED_YN: "" , DN_DIV: "", 
                                                OT: "",  dt: "", time: "", })) as Plandata[],
    LOCATIONTYPE: "",
    GRDSUB1: [],
    GRDSUB1_1: [],
    GRDSUB1_2: [],
    
})

const datainer_init = ref<PTWdata|any>({}) // 초기화 또는 신규에 사용하는 코드



const setDataIner = async (cmpny_div: string, rcv_no: string | null)  =>{
  console.log("setDataIner started")
  if (rcv_no == null)  {return}

  isInitialLoading.value = true // 초기 로딩 시작

  ////////////////////////////////////////////////////////////////////////////////
  // 1.  기본정보조회   
  ////////////////////////////////////////////////////////////////////////////////
  

  let result = await commonSearchApi({
              queryId: 'SAFBA0010_SEARCH_03',
              param: {
                CMPNY_DIV: cmpny_div,
                RCV_NO: rcv_no,
              }})
  let res = result.ORESULT_CUR[0]

  datainer.value.RCV_NO = res.RCV_NO
  datainer.value.CMPNY_DIV=res.CMPNY_DIV       // 소속회사
  datainer.value.BSNS_CD= res.BSNS_CD        // 소속 부서
  datainer.value.DEPT_CD= res.DEPT_CD        // 소속 부서
  datainer.value.DEPT_NM= res.DEPT_NM        // 소속 부서명
  datainer.value.DEPT_NM2= res.DEPT_NM2        // 소속 부서명
  datainer.value.ASGN_CD= res.ASGN_CD        // 소속 부서
  datainer.value.JOB_BSNS_CD= res.JOB_BSNS_CD    // 작업사업부
  datainer.value.JOB_BSNS_NM= res.JOB_BSNS_NM    // 작업사업부명
  datainer.value.RCV_TYPECheck=  (res.JOB_BSNS_CD === 'AQ00') ?  true : false // 해양공사(t) or 호선(f) 
  datainer.value.MNGR_EMP_NM= res.MNGR_EMP_NM    // 관리감독자(승인자) 이름 
  datainer.value.MNGR_EMP_NO= res.MNGR_EMP_NO    // 관리감독자(승인자) 사번
  datainer.value.MNGR_HP_NO= res.MNGR_HP_NO     // 관리감독자(승인자) 휴대폰
  datainer.value.MNGR_TRS_NO= res.MNGR_TRS_NO    // 관리감독자(승인자) TRS
  datainer.value.WRK_DIST = res.WRK_DIST      // PTW 작업명
  datainer.value.CF_DIV= res.CF_DIV         // 허가구분
  datainer.value.CF_DIV_NM= res.CF_DIV_NM      // 허가구분명
  datainer.value.THREECHECKYN= res.THREECHECKYN   // 3중점검대상
  datainer.value.WORK_DETAIL= res.WORK_DETAIL    // 작업상세
  datainer.value.RESP_EMP_NM= res.RESP_EMP_NM    // 작업 책임자 이름 
  datainer.value.RESP_EMP_NO= res.RESP_EMP_NO    // 작업 책임자 사번
  datainer.value.RESP_HP_NO = res.RESP_HP_NO    // 작업 책임자 사번
  datainer.value.REQ_EMP_NM = res.REQ_EMP_NM    // 공사담당자 이름 
  datainer.value.REQ_EMP_NO = res.REQ_EMP_NO    // 공사담당자 사번
  datainer.value.WRK_STD_NO = res.WRK_STD_NO    // 작업표준
  datainer.value.WRK_STD_NM = res.WRK_STD_NM    // 작업표준
  datainer.value.CONFINED_YN= res.CONFINED_YN    // 밀폐구역 여부 'Y'/'N'
  datainer.value.ARGN_YN= res.ARGN_YN        // 아르곤 여부
  datainer.value.ELEC_YN= res.ELEC_YN        // 수전구역여부 여부 'Y'/'N'
  datainer.value.HEIGHT_YN= res.HEIGHT_YN      // 고소작업 여부 'Y'/'N'
  datainer.value.HEIGHT= res.HEIGHT         // 높이값
  datainer.value.PRESSURE_YN= res.PRESSURE_YN    // 압력테스트 여부 'Y'/'N'
  datainer.value.PRESSURE= res.PRESSURE       // 압력값
  datainer.value.PIPE_DIA_YN= res.PIPE_DIA_YN    // 파이프직경 여부 'Y'/'N'
  datainer.value.PIPE_DIA= res.PIPE_DIA       // 파이프직경값
  datainer.value.URGENT_YN = res.URGENT_YN     // 긴급작업 여부 'Y'/'N'
  datainer.value.WORK_NO_EXIST = 'N' // 호선없음 체크
  datainer.value.STATUS = res.STATUS            // 상태값
  datainer.value.STATUS_NM = res.STATUS_NM         // 상태값 명칭
  datainer.value.RCV_TYPE = res.RCV_TYPE       // 조선 : C, 해양 : Q, 나머지 사업부 두번째 자리
  datainer.value.DN_DIV = res.DN_DIV || ""         // 주야구분
  datainer.value.WORKER_CNT = res.WORKER_CNT ? Number(res.WORKER_CNT) : null     // 작업인원
  datainer.value.DANG_DIV = res.DANG_DIV || ""        // 위험작업분류
  datainer.value.DNGR_RSN = res.DNGR_RSN || ""        // 유해위험요소
  datainer.value.REL_ASGN_CD = res.REL_ASGN_CD || ""     // 안전과 조직코드
  datainer.value.REL_EMP_NO = res.REL_EMP_NO || ""      // 안전과인원
  datainer.value.REL_TEL_NO = res.REL_TEL_NO || ""      // 안전과번호
  datainer.value.REL_DEPT_CD = res.REL_DEPT_CD || ""     // 안전과 부서코드
  datainer.value.APP_EMP_NO = res.APP_EMP_NO || ""      // 승인자
  datainer.value.PARA_CHK_YN = res.PARA_CHK_YN || "N"     // 병행작업여부
  datainer.value.COMPANY = res.COMPANY || ""         // 작업자회사코드
  datainer.value.WORK_DESC = res.WORK_DESC || ""       // 작업내용
  datainer.value.WRK_DIST_SEQ = res.WRK_DIST_SEQ || ""    // 작업종류(대) SEQ
  datainer.value.FORM_TYPE = res.FORM_TYPE || ""        //
  datainer.value.P_WRK_ID = res.P_WRK_ID || ""         // 위험작업번호
  datainer.value.CON_YN = res.CON_YN || ""           // RCV_TYPECheck 여부
  datainer.value.WRK_PLC = res.WRK_PLC || ""          // 공종/계열
  datainer.value.SHORT_WORK_NO = res.SHORT_WORK_NO || ""      // 단기공사번호: 일반공사는 ''
  datainer.value.VNDR_CD = res.VNDR_CD || ""            // 협력사코드 : 일반공사는 ''
  datainer.value.DAN_WORK_ID = res.DAN_WORK_ID || ""       // 단기공사 작업표준
  datainer.value.WORK_COMPLEX_CD = res.WORK_COMPLEX_CD || ""  // 단기공사 복합공정코드
  datainer.value.USER_ID = res.USER_ID || userStore.empNo           // 작성자

  datainer.value.WORK_NO = res.WORK_NO || ""         // 호선
  datainer.value.JOB_PLC = res.JOB_PLC || ""         // 작업장소
  datainer.value.JOB_LPLC = res.JOB_LPLC || ""        // 작업장소 대분류 
  datainer.value.JOB_MPLC = res.JOB_MPLC || ""        // 작업장소 중분류 
  datainer.value.JOB_SPLC = res.JOB_SPLC || ""        // 작업장소 소분류 
  datainer.value.JOB_PLC_DTL = res.JOB_PLC_DTL || ""    // 작업위치 상세
  datainer.value.JOB_PLC_DTL_YN = res.JOB_PLC_DTL_YN || ""         //내업 상세위치 표시여부
  datainer.value.WORK_DT = dayjs(res.WORK_DT).format("YYYYMMDD") || ""                // 작업일
  datainer.value.WORK_START_TIME = res.WORK_START_TIME || ""        // 작업시작일시
  datainer.value.WORK_END_TIME = res.WORK_END_TIME || ""          //  작업종료일시
  datainer.value.ALL_START_TIME = res.ALL_START_TIME || ""         // 시작시간 문자열 합
  datainer.value.ALL_END_TIME = res.ALL_END_TIME || ""         // 종료시간 문자열 합
  datainer.value.ALL_OVERTIME_YN = res.ALL_OVERTIME_YN || ""       // 연장 문자열 합
  datainer.value.ALL_CANCELED_YN = res.ALL_CANCELED_YN || ""    // 작업 취소 문자열 합
  datainer.value.OVERTIME_YN = res.OVERTIME_YN || ""          // 연장여부  


  ////////////////////////////////////////////////////////////////////////////////
  // 2.  작업 일정 조회
  ////////////////////////////////////////////////////////////////////////////////

  // PLANDATA 파싱: 쉼표로 구분된 문자열을 배열로 변환
  const startTimes = res.ALL_START_TIME ? res.ALL_START_TIME.split(',') : []
  const endTimes = res.ALL_END_TIME ? res.ALL_END_TIME.split(',') : []
  const canceledList = res.ALL_CANCELED_YN ? res.ALL_CANCELED_YN.split(',') : []
  const overtimeList = res.ALL_OVERTIME_YN ? res.ALL_OVERTIME_YN.split(',') : []
  
  datainer.value.PLANDATA = startTimes.map((startTime:string, index:number) => {
    const endTime = endTimes[index] || ""
    const canceled = canceledList[index] || "N"
    const overtime = overtimeList[index] || "N"
    
    // 날짜 포맷: YYYYMMDDHHMM → MM/DD
    const dt = startTime ? `${startTime.substring(4, 6)}/${startTime.substring(6, 8)}` : ""
    
    // 시간 포맷: YYYYMMDDHHMM → HH:MM~HH:MM
    const startHHMM = startTime ? `${startTime.substring(8, 10)}:${startTime.substring(10, 12)}` : ""
    const endHHMM = endTime ? `${endTime.substring(8, 10)}:${endTime.substring(10, 12)}` : ""
    const time = (startHHMM && endHHMM) ? `${startHHMM}~${endHHMM}` : ""
    
    // DN_DIV 주야구분 계산 (시작시간이 08:00 이전이면 야간, 이후면 주간)
    const startHour = startTime ? parseInt(startTime.substring(8, 10)) : 0
    const DN_DIV = startHour < 8 ? "N" : "D"
    
    return {
      ALL_START_TIME: startTime,
      ALL_END_TIME: endTime,
      CANCELED_YN: canceled,
      DN_DIV: DN_DIV,
      OT: overtime,
      dt: dt,
      time: time
    }
  }) as Plandata[]


  ////////////////////////////////////////////////////////////////////////////////
  // 3.  작업 장소 조회
  ////////////////////////////////////////////////////////////////////////////////

  // 장소구분 조회
  await setLocation(datainer.value)

  // 장소 조회 D / E
  if (datainer.value.LOCATIONTYPE === "D" || datainer.value.LOCATIONTYPE === "E") {
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_13",
        param: datainer.value,
      }).then((res) => {
        if (datainer.value.LOCATIONTYPE === "D") {
          grdSub1_1.value.getDataProvider().setRows(res.ORESULT_CUR)
          datainer.value.GRDSUB1_1 =  grdSub1_1.value.getDataProvider().getJsonRows()

        }
        if (datainer.value.LOCATIONTYPE === "E") {
          grdSub1_2.value.getDataProvider().setRows(res.ORESULT_CUR)
          datainer.value.GRDSUB1_2 =  grdSub1_2.value.getDataProvider().getJsonRows()
        }
      })
    }

  if (datainer.value.LOCATIONTYPE === "B") {
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_14",
      param: datainer.value,
    }).then((res) => {
      console.log(res, "resb")
      grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
      datainer.value.GRDSUB1 =  grdSub1.value.getDataProvider().getJsonRows()
    })
  }


    console.log('setDataIner  ended: ', datainer)

    if (!ReadOnly.value && ['20','21'].includes(datainer.value.STATUS)) {
      disabledSTATUS.value = false 
    }
    else{
      disabledSTATUS.value = true 
    }

}


const setIsH = () => {
   
  commonSearchApi({
      queryId: "SAFBA0010_SEARCH_19",   // SAFBA0010_SEARCH_18 을 탐
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        DEPT_CD: userStore.deptCd,
        EMP_NO: userStore.empNo,
      }
    })
  .then((Hres)=>{
    if(Hres.ORESULT_CUR.length !== 0){
      if(datainer.value.ASGN_CD === Hres.ORESULT_CUR[0].ASGN_CD){
        isH.value = true
      }
      }
      })

  console.log(isH.value,'isH.value')




}



const openPopup = async (cmpny_div: string, rcv_no: string | null, read_only: boolean = false)  =>{
  ReadOnly.value = read_only
  // setDataIner 세팅전에 초기화용 datainer 만들어두기
  datainer_init.value =  JSON.parse(JSON.stringify(datainer.value)) 

  // 코드리스트 세팅 
  await intCode()

  // 내부 데이터 세팅
  if (cmpny_div && rcv_no) {
    await setDataIner(cmpny_div, rcv_no)
  }
  
  // 왼쪽 카드목록에 추가 
  cards.value.push(datainer.value)

  // 관리감독자 세팅
  await setMNGR( datainer.value.CMPNY_DIV,  datainer.value.BSNS_CD, datainer.value.DEPT_CD, datainer.value.ASGN_CD)

  await setIsH()
  
  dialog.value = true

}


const setMNGR = (cmpnyDiv:string, bsnsCd: string, deptCd: string, asgnCd: string):void => {
  
  commonSearchApi({
      queryId: "SAFBA0010_SEARCH_16", // 관리감독자 조회
      param: {CMPNY_DIV : cmpnyDiv, BSNS_CD : bsnsCd, DEPT_CD: deptCd, ASGN_CD: asgnCd},
    }).then((Gan:any) => {
      if (Gan.ORESULT_CUR.length != 0) {
        isMngr.value = true
        codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
      } else {
        isMngr.value = false
      }
    })
  }


const intCode = ():void => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv === '420' ? 'HHI' : userStore.cmpnyDiv, USE_DIV: "N" }, // 현대이엔티는 현중기준
    }), // 사업부
    getCodeList("HHIE160"), // 허가구분21
    getCodeList("HHIE100CODE000"), // 진행상태
    getCodeList("HHIE150"), // 작업구분
    getCodeList("HHIE120"), //위험구분
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: userStore.cmpnyDiv === '420' ? 'HHI' : userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd },
    }), // 부서


  ]).then((res) => {
    codeList.company = res[0].ORESULTCUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.WRK_PLC = res[4].ORESULT_CUR.filter((x) => x.CODE_DESC1 !== "Y")
    codeList.WRK_PLC.unshift({ COD: "", TXT: "전체" })
    codeList.DANG_DIV1 = res[5].ORESULT_CUR.filter((x) => x.COD !== "E03" )
    codeList.DANG_DIV1.unshift({ COD: "", TXT: "전체" })
    codeList.DANG_DIV2 = res[5].ORESULT_CUR
    codeList.DANG_DIV2.unshift({ COD: "", TXT: "전체" })
    codeList.deptCd = res[6].ORESULT_CUR

    })
  

}


const setLocation = (P_datainer:PTWdata) => {

  //P_datainer는 referance로 들어가기 때문에 P_datainer를 바꾸면 datainner.value가 바뀌는거임 

  if (P_datainer.JOB_LPLC === "B") {
        // JOB_MPLC가 "A", "B", "C" 중 하나이고 JOB_BSNS_CD가 "AC00" 또는 "AE00"인 경우
        if (
          ["A", "B", "C"].includes(P_datainer.JOB_MPLC) &&
          ["AC00", "AQ00", "AE00"].includes(P_datainer.JOB_BSNS_CD)
        ) {
          P_datainer.RCV_TYPE === "C" ||
          P_datainer.RCV_TYPE === "E"
            ? (P_datainer.LOCATIONTYPE = "D")
            : P_datainer.RCV_TYPE === "Q" &&
              P_datainer.RCV_TYPECheck === false
            ? (P_datainer.LOCATIONTYPE = "D")
            : (P_datainer.LOCATIONTYPE = "E")
  
        }

        // 그렇지 않은 경우 LocationType을 "C"로 설정
        else {
          P_datainer.LOCATIONTYPE = "C"
        }
      }
      // JOB_LPLC가 "B"가 아닌 경우
      else {
        // JOB_LPLC가 "A"이고 JOB_MPLC가 "C"이며 JOB_SPLC가 "140"인 경우 LocationType을 "D"로 설정
        if (
          P_datainer.JOB_LPLC === "A" &&
          P_datainer.JOB_MPLC === "C" &&
          P_datainer.JOB_SPLC === "140"
        ) {
          P_datainer.LOCATIONTYPE = "D"
        }
        // 그렇지 않은 경우
        else {
          // datainer.RCV_TYPECheck이 "Y"인 경우 LocationType을 "B"로 설정, 그렇지 않으면 "C"로 설정
          console.log("hmlhl")
          console.log(P_datainer.JOB_PLC_DTL_YN, "Location.JOB_PLC_DTL_YN")
          P_datainer.LOCATIONTYPE = P_datainer.JOB_PLC_DTL_YN === "Y" ? "B" : "C"
          console.log(P_datainer.LOCATIONTYPE, "P_datainer.LOCATIONTYPE")
          if (P_datainer.LOCATIONTYPE === "B") {
            let code =
              P_datainer.JOB_LPLC +
              P_datainer.JOB_MPLC +
              P_datainer.JOB_SPLC

            getCodeList(`HHIZ011${code}`).then((res) => {
              grdSub1.value.setBindingColumn(
                "DIV_M",
                res.ORESULT_CUR,
                "COD",
                "TXT"
              )
            })
          }
        }
      }

}


const openSelectPopup = (val:string): void => {
  if (disabledSTATUS.value){ // 수정 불가능한 상태일때
    return
  }

  console.log("datainer:", datainer)
  if (val === '소속'){
    deptPopup.value?.openPopup()
  }

  else if (val === 'PTW작업명'){
    // 소속조직의 PTW리스트에서 선택하는 팝업
    ptwPopup.value?.openPopup("N") // 단기공사여부 N
  }
  else if (val === '작업 상세'){
    
  }
  else if (val === '관리자'){
    empfocus.value = 'MNGR'
    empPopup.value?.openPopup({})
  }
  else if (val === '작업책임자'){
    empfocus.value = 'RESP'
    empPopup.value?.openPopup({})
  }
  else if (val === '공사담당자'){
    empfocus.value = 'REQ'
    empPopup.value?.openPopup({})
  }
  else if (val === '작업표준서'){
    if (userStore.cmpnyDiv === "HHI" || userStore.cmpnyDiv === "230") {
          WrkPopup.value?.openPopup(datainer.value)

        } else {
          WrkPopup2.value?.openPopup(datainer.value)
        }

    
  }
  else if (val ==="허가서 불러오기"){
    rcvPopup.value?.openPopup('N')
  }


}

const onDeptSelected = (row:any):void => {

    datainer.value.CMPNY_DIV = row.CMPNY_DIV
    datainer.value.BSNS_CD = row.BSNS_CD
    datainer.value.DEPT_CD = row.DEPT_CD
    datainer.value.ASGN_CD = row.ASGN_CD
    datainer.value.DEPT_NM = row.ASGN_FULL_NM
    datainer.value.MNGR_EMP_NO = ""
    datainer.value.MNGR_EMP_NM = ""
    datainer.value.MNGR_HP_NO = ""

    // 소속조직이 바뀌었으니 관리감독자 새로 세팅
    setMNGR(row.CMPNY_DIV, row.BSNS_CD, row.DEPT_CD, row.ASGN_CD)

}


const onEmpSelected = (row:any):void => {
  if (empfocus.value === 'MNGR' ){
    datainer.value.MNGR_EMP_NO = row.EMP_NO
    datainer.value.MNGR_EMP_NM = row.EMP_NM  
    datainer.value.MNGR_HP_NO = row.HND_PHN? row.HND_PHN.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3"): ""
  }
  else if (empfocus.value === 'RESP' ){
    datainer.value.RESP_EMP_NO = row.EMP_NO 
    datainer.value.RESP_EMP_NM = row.EMP_NM  
    datainer.value.RESP_HP_NO = row.HND_PHN? row.HND_PHN.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3"): ""
  }
  else if (empfocus.value === 'REQ' ){
    datainer.value.REQ_EMP_NO = row.EMP_NO
    datainer.value.REQ_EMP_NM = row.EMP_NM
  }
}

const onPtwSelected = (row:any):void => {
  console.log("row ", row)
  datainer.value.WRK_PLC = row.WRK_PLC
  datainer.value.WRK_DIST = row.WRK_DIST
  datainer.value.DANG_DIV = row.DANG_DIV // 작업구분 ex) 화기작업(H00), 전기작업(D01) 등
  datainer.value.P_WRK_ID = row.P_WRK_ID
  datainer.value.CF_DIV = row.CF_DIV
  datainer.value.CF_DIV_NM = row.CF_DIV_NM
  datainer.value.THREECHECKYN = (row.CF_DIV === "F" || row.CF_DIV === "S")? 'Y' : 'N' 

}

const onRcvSelected = async(row:any) => {
  console.log("row ", row)
  await setDataIner(row.CMPNY_DIV, row.RCV_NO)

  // KEY 정보  및 작업일시는 초기화
  datainer.value.RCV_NO = ''
  datainer.value.STATUS = '20'
  datainer.value.STATUS_NM = '작성중(사내)'
  datainer.value.PLANDATA = Array.from({ length: 7 }, () => ({ALL_END_TIME: "", ALL_START_TIME: "",  CANCELED_YN: "" , DN_DIV: "", 
                                                OT: "",  dt: "", time: "", })) as Plandata[],
  datainer.value.URGENT_YN = 'N'
 
  
  disabledSTATUS.value = false 
    



}

const WrkSelected1 = (row:any) => {
  let WSNM = ''
  let WSNO = ''
  if (!row){
    WSNM = ''
    WSNO = ''
  }
  else{
    WSNM = row.map((i:any) => i.WS_NM).join(",")
    WSNO = row.map((i:any) => i.WS_ID).join(",")
  }


  datainer.value.WRK_STD_NM= WSNM
  datainer.value.WRK_STD_NO= WSNO
  datainer.value.DAN_WORK_ID = ""
}
const WrkSelected2 = (row:any) => {
  let WSNM = ''
  let WSNO = ''
  if (!row){
    WSNM = ''
    WSNO = ''
  }
  else{
    WSNM = row.map((i:any) => i.WRK_TITLE).join(",")
    WSNO = row.map((i:any) => i.WRK_GUD_NO).join(",")
  }

  datainer.value.WRK_STD_NM= WSNM
  datainer.value.WRK_STD_NO= WSNO
  datainer.value.DAN_WORK_ID = ""
}


const WRKLIKE = (e:any) =>{

 if(!e){
   return ''
 }
 else{
   console.log(e,'e')
   let setRow = <any>[]
   setRow.push(e)
   if(e.LOCATIONTYPE === 'B' && e.BSNS_CD ==='AC00'){
     datainer.value.JOB_PLC_DTL_YN ='Y'
   }
   datainer.value.LOCATIONTYPE = e.LOCATIONTYPE
   datainer.value.WORK_NO = e.WORK_NO
   datainer.value.JOB_LPLC = e.JOB_LPLC
   datainer.value.JOB_MPLC = e.JOB_MPLC
   datainer.value.JOB_SPLC = e.JOB_SPLC
   datainer.value.JOB_PLC = e.JOB_PLC
   datainer.value.JOB_BSNS_CD = e.BSNS_CD
   datainer.value.WRK_PLC = e.CODE_DESC6
   
   if(e.BSNS_CD ==='AQ00'){
     if(e.LOCATIONTYPE ==='E'){
       datainer.value.RCV_TYPECheck = true
     }
     else{
       datainer.value.RCV_TYPECheck = false
     }
   }

   let place = `${e.JOB_PLC}  ${e.WORK_NO ? '-' + e.WORK_NO: ''}`
 

   vm.$nextTick(()=>{
   if(e.LOCATIONTYPE === 'B'){
    
     console.log(grdSub1.value,'B')
     grdSub1.value.getDataProvider().setRows(setRow)
     datainer.value.JOB_PLC_DTL = e.JOB_PLC_DTL
   }
   if(e.LOCATIONTYPE === 'D'){
     console.log(grdSub1_1.value,'D')

     grdSub1_1.value.getDataProvider().setRows(setRow)
   }
   if(e.LOCATIONTYPE === 'E'){
     console.log(grdSub1_2.value,'E')

     grdSub1_2.value.getDataProvider().setRows(setRow)
   }
   if(e.LOCATIONTYPE === 'C'){
     datainer.value.JOB_PLC_DTL = e.JOB_PLC_DTL
   }
   })
   
   // console.log(e,'e')
 }
} 

const itemProps = (item:any) => {
  return {
    title: item.WORK_NO,
    subtitle: `${item.SHIP_KIND_NM}　　　　　${
      !item.SHIP_CAPA ? "" : item.SHIP_CAPA
    }`,
  }
}

const selectCard = async(index:number, needsave: boolean) => {

  console.log("selectCard before: ", datainer.value)

   // 1. 작성중인 카드를 저장해야하는 경우에, 허가서 번호가 있다면 저장하기
    if (needsave && datainer.value.RCV_NO){
      if (datainer.value.STATUS == '20'){ 
        let sv =  await SaveProcess(datainer.value, true)
        if (!sv) { return } 
      }
    }

    // 2. 카드넘기기
    selectedIndex.value = index
    datainer.value = cards.value[index]!

    // 3. 정보 업데이트
    if (datainer.value.RCV_NO){ 
      setDataIner(datainer.value.CMPNY_DIV, datainer.value.RCV_NO) 
    }
    else{
      if (['20','21'].includes(datainer.value.STATUS)) {
        disabledSTATUS.value = false 
      }
      else{
        disabledSTATUS.value = true 
      }
    }
  
  isInitialLoading.value = true // selectCard 이후에 watched 1 실행되는 것 방지
  console.log("selectCard after: ", datainer.value)
}

const deleteCard = (index:number) => {
  vm.$swal({
    title: t('허가서 목록에서 삭제하시겠습니까?'),
    text: t('허가서가 실제로 사라지지는 않습니다.'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('삭제'),
    cancelButtonText: t('취소'),
  }).then((result:any) => {
    if (result.isConfirmed) {

      
  //     // 선택된 인덱스 조정
      if (cards.value.length === 1) {
        // 모든 카드가 삭제된 경우
        onButtonsClick({id: "btnClose"})
        return
      }


      // 카드 삭제
      cards.value.splice(index, 1)

  
      if (selectedIndex.value === index) {
        // 현재 선택된 카드가 삭제된 경우
        if (index >= cards.value.length) {
          // 마지막 카드를 삭제한 경우, 이전 카드 선택
          selectCard(cards.value.length - 1, false)
        } else{
          selectCard(index, false)
        }
     
      }
      else if (index < selectedIndex.value ) {
        // 선택된 index보다 이전거를 삭제했을때 : selectedIndex.value만 다시설정하면됨 
        selectedIndex.value = selectedIndex.value - 1
      }
      
      Message.success(t('카드가 삭제되었습니다.'))
     }
   })
}




//장소 그리드 B
const grdProps2 = reactive({
  gridViewOption: { edit: { editable: true }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_M",
      dataType: "text",
      header: { text: t("장소 中") },
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: "DIV_S",
      dataType: "text",
      header: { text: t("장소 小") },
    },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
  ],
  columns: [] as any[],
})

grdProps2.columns = grdProps2.fields

//장소 그리드 D
const grdProps2_1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_L_NM",
      dataType: "text",
      header: { text: t("대분류") },
    },
    {
      fieldName: "DIV_M_NM",
      dataType: "text",
      header: { text: t("중분류") },
    },
    {
      fieldName: "DIV_S",
      dataType: "text",
      header: { text: t("블록") },
    },
    {
      fieldName: "DIV_DESC",
      dataType: "text",
      header: { text: t("상세위치") },
    },
    {
      fieldName: "PCS_DIV",
      dataType: "text",
      header: { text: t("P/C/S") },
    },
    {
      fieldName: "FMA_DIV",
      dataType: "text",
      header: { text: t("F/M/A") },
    },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
    { fieldName: "DIV_M", visible: false },
    { fieldName: "DIV_S2", visible: false },
    { fieldName: "DIV_S3", visible: false },
  ],
  columns: [] as any[],
})

grdProps2_1.columns = grdProps2_1.fields

//장소 그리드 E
const grdProps2_2 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_L_NM",
      dataType: "text",
      header: { text: t("구조물") },
    },
    {
      fieldName: "DIV_M_NM",
      dataType: "text",
      header: { text: t("대분류") },
    },
    {
      fieldName: "DIV_S_NM",
      dataType: "text",
      header: { text: t("중분류") },
    },
    {
      fieldName: "DIV_S2_NM",
      dataType: "text",
      header: { text: t("소분류") },
    },
    {
      fieldName: "DIV_S3_NM",
      dataType: "text",
      header: { text: t("세분류") },
    },
    {
      fieldName: "DIV_DESC",
      dataType: "text",
      header: { text: t("상세위치") },
    },

    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
    { fieldName: "DIV_M", visible: false },
    { fieldName: "DIV_S2", visible: false },
    { fieldName: "DIV_S", visible: false },
    { fieldName: "DIV_S3", visible: false },
    { fieldName: "SEALED_CD", visible: false },
    { fieldName: "PSC", visible: false },
    { fieldName: "PCS_DIV", visible: false },
    { fieldName: "FMA_DIV", visible: false },
  ],
  columns: [] as any[],
})

grdProps2_2.columns = grdProps2_2.fields


const LWPClick = () => {
  
  let param = <any>[
    // USER_ID  :userStore.userId,
		// JOB_LPLC  :'', 
		// JOB_MPLC  :'', 
		// JOB_SPLC  :'', 
		// WRK_PLC  :'',
		// WORK_NO  :'', 
		// CMPNY_DIV  :userStore.cmpnyDiv, 
		// DIV_L  :'',
		// DIV_L_NM  :'', 
		// DIV_M  :'', 
		// DIV_M_NM  :'', 
		// DIV_S  :'', 
		// DIV_S_NM  :'', 
		// DIV_DESC  :'',
		// PCS_DIV  :'', 
		// FMA_DIV  :'', 
		// DIV_S2  :'',
		// DIV_S2_NM  :'', 
		// DIV_S3  :'', 
		// DIV_S3_NM  :'',
		// LOCATIONTYPE  :'', 
		// JOB_PLC_DTL     :'',    
  ]
  
  console.log(datainer.value.LOCATIONTYPE)

  if(!datainer.value.LOCATIONTYPE){
    return Message.warn(t("장소 입력후 이용해주시기바랍니다."))
  }

  if(datainer.value.LOCATIONTYPE === "D" || datainer.value.LOCATIONTYPE === "E"){
  let checkedRows =
          datainer.value.LOCATIONTYPE === "D"
            ? grdSub1_1.value?.getGridView().getCheckedRows(true)
            : grdSub1_2.value.getGridView().getCheckedRows(true)
  
  if(checkedRows.length === 0 ){
    return Message.warn(t("선택된 데이터가 없습니다."))
  }
    checkedRows.forEach((x) => {
          let row =
            datainer.value.LOCATIONTYPE === "D"
              ? grdSub1_1.value.getDataProvider().getJsonRow(x)
              : grdSub1_2.value.getDataProvider().getJsonRow(x)

          row.USER_ID = userStore.userId
          row.CMPNY_DIV = userStore.cmpnyDiv
          row.LOCATIONTYPE = datainer.value.LOCATIONTYPE
          row.JOB_LPLC = datainer.value.JOB_LPLC
          row.JOB_MPLC = datainer.value.JOB_MPLC
          row.JOB_SPLC = datainer.value.JOB_SPLC
          row.WORK_NO = datainer.value.WORK_NO
          row.BSNS_CD = datainer.value.JOB_BSNS_CD
          param.push(row)
        })
  }
  if (datainer.value.LOCATIONTYPE === "B") {
  let checkedRows = grdSub1.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0 ){
    return Message.warn(t("선택된 데이터가 없습니다."))
  }
  checkedRows.forEach((x) => {
          let row = grdSub1.value.getDataProvider().getJsonRow(x)
          row.USER_ID = userStore.userId
          row.CMPNY_DIV = userStore.cmpnyDiv
          row.JOB_PLC_DTL = datainer.value.JOB_PLC_DTL
          row.LOCATIONTYPE = datainer.value.LOCATIONTYPE
          row.JOB_LPLC = datainer.value.JOB_LPLC
          row.JOB_MPLC = datainer.value.JOB_MPLC
          row.JOB_SPLC = datainer.value.JOB_SPLC
          row.WORK_NO = datainer.value.WORK_NO
          row.BSNS_CD = datainer.value.JOB_BSNS_CD
          param.push(row)
        })
  }
  if(datainer.value.LOCATIONTYPE === "C"){
    if(!datainer.value.JOB_PLC_DTL){
      return Message.warn(t("입력된 데이터가 없습니다."))
    }

    let data = {
          JOB_LPLC : datainer.value.JOB_LPLC,
          JOB_MPLC : datainer.value.JOB_MPLC,
          JOB_SPLC : datainer.value.JOB_SPLC,
          JOB_PLC_DTL : datainer.value.JOB_PLC_DTL,
          CMPNY_DIV : userStore.cmpnyDiv,
          USER_ID : userStore.userId,
          WORK_NO : datainer.value.WORK_NO,
          LOCATIONTYPE : datainer.value.LOCATIONTYPE,
          BSNS_CD : datainer.value.JOB_BSNS_CD
    }
    
    param.push(data)
  }
  



  

  console.log(param,'param')
  // Message.warn(t("현재 개발중입니다. 추후에 이용 부탁드립니다."))
  vm.$swal({
        title: t(`즐겨찾기 등록을 하시겠습니까?`),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          commonExecuteApi({
            queryId: "SAFBA0010_SAVE_08",
            list: param,
          })
        }
      })

}
// 장소 즐겨찾기 로직

const LWPOpen =()=>{
  LikeWrkPlace.value?.openPopup(datainer.value,datainer.value.LOCATIONTYPE)
}


const openCCP = () => {

  if (
    datainer.value.STATUS == '20' ||
    datainer.value.STATUS == '21' ||
    !datainer.value.STATUS
  ) {
    CCP.value?.openPopup("장소")
  } else {
    return Message.warn(t("신청전 에만 변경이 가능합니다."))
  }
}


const openDate = () => {
  let cnt = ""
  
  if (!datainer.value.JOB_LPLC) {
    Message.warn(t("장소 부터 선택해주십시오."))
    return
  }

  if (!datainer.value.JOB_BSNS_CD) {
    Message.warn(t("작업 사업부/ 사업부를 선택후에 이용해주십시오."))
    return
  }

  //   // 해양 사업부 추가
  //   // 공통(99), 내업(01), 단기공사(10), 기타(09), 해양공사(13)
  console.log(datainer.value.JOB_BSNS_CD, datainer.value.WRK_PLC, "djmdnmdjk")
  if (
    datainer.value.JOB_BSNS_CD === "AC00" ||
    datainer.value.JOB_BSNS_CD === "AE00" ||
    datainer.value.JOB_BSNS_CD === "AQ00"
  ) {
    // 2025.04.08 단기공사도 외업은 3일로 적용필요 (출력양식 문제)
    //if(isDan.value) {
    //  cnt = "7"
    //} else {
      if (datainer.value.JOB_LPLC === "B"){
        cnt = "3"
      } else {
        cnt = "7"
      }
    //}
  } else {
    cnt = "7"
  }

  // PSM(공정안전관리)작업일 때 1일로 고정
  if(datainer.value.DANG_DIV === "Z00"){
    cnt = "1"
  }

  DatePop.value?.openPopup(cnt, false , datainer.value.URGENT_YN) // false 는 단기공사 여부

}

const setThreeDays = () => {
  if (disabledSTATUS.value) {
    return
  }

  if (!datainer.value.JOB_LPLC) {
    Message.warn(t("장소 부터 선택해주십시오."))
    return
  }

  if (!datainer.value.JOB_BSNS_CD) {
    Message.warn(t("작업 사업부/ 사업부를 선택후에 이용해주십시오."))
    return
  }

  // 오늘부터 3일간의 일정 자동 생성 (08:00 ~ 17:00)
  const today = dayjs()
  const planData: Plandata[] = []
  
  for (let i = 1; i < 4; i++) {
    const targetDate = today.add(i, 'day')
    const startTime = targetDate.hour(8).minute(0).second(0).format('YYYYMMDDHHmm')
    const endTime = targetDate.hour(17).minute(0).second(0).format('YYYYMMDDHHmm')
    
    planData.push({
      ALL_START_TIME: startTime,
      ALL_END_TIME: endTime,
      CANCELED_YN: 'N',
      DN_DIV: 'D', // 주간
      OT: 'N',
      dt: targetDate.format('MM/DD'),
      time: '08:00~17:00'
    })
  }
  
  datainer.value.PLANDATA = planData
  datainer.value.ALL_START_TIME = planData.slice(0, 3).map(item => item.ALL_START_TIME).join(',')
  datainer.value.ALL_END_TIME = planData.slice(0, 3).map(item => item.ALL_END_TIME).join(',')
  datainer.value.ALL_OVERTIME_YN = 'N,N,N'
  datainer.value.ALL_CANCELED_YN = 'N,N,N'
  datainer.value.WORK_DT = dayjs(datainer.value.PLANDATA[0]?.ALL_START_TIME).format("YYYYMMDD");
  datainer.value.DN_DIV = 'D'
  
}


const onPlcSelected = (row:any) => {
  console.log(row, "rowrowrowrowrowrow")
  datainer.value.JOB_LPLC = row[0].COD        // ex)  B
  datainer.value.JOB_MPLC = row[1].COD        // ex)  A
  datainer.value.JOB_SPLC = row[2].COD        // ex) 120
  datainer.value.JOB_PLC = row[2].TXT         // ex) 2도크
  datainer.value.WRK_PLC = row[2].CODE_DESC6  // ex) 02
  datainer.value.JOB_PLC_DTL_YN = row[2].CODE_DESC4  // 세부장소여부 EX) Y N


  console.log(datainer.value.JOB_PLC_DTL_YN, "JOB_PLC_DTL_YN")


}

const workPlaceSelected = (e:any) => {

  console.log("e: ", e, )

  if (datainer.value.LOCATIONTYPE === "D") {
    if(grdSub1_1.value){
      if (grdSub1_1.value.getDataProvider().getRowCount() >= 5){
        Message.warn('5개 이상은 추가가 불가능합니다.')
        return
      }
      e.SEQ_NO = grdSub1_1.value.getDataProvider().getRowCount() + 1
    }
    grdSub1_1.value.addRow(e)
    grdSub1_1.value.getGridView().checkAll()
    datainer.value.GRDSUB1_1 =  grdSub1_1.value.getDataProvider().getJsonRows()
  
  }
  if (datainer.value.LOCATIONTYPE === "E") {
    if(grdSub1_2.value){
      if (grdSub1_2.value.getDataProvider().getRowCount() >= 5){
        Message.warn('5개 이상은 추가가 불가능합니다.')
        return
      }
      e.SEQ_NO = grdSub1_2.value.getDataProvider().getRowCount() + 1
    }
    grdSub1_2.value.addRow(e)
    grdSub1_2.value.getGridView().checkAll()
    datainer.value.GRDSUB1_2 =  grdSub1_2.value.getDataProvider().getJsonRows()

  }
}


const onDateSelected = (e:any) => {
  console.log('e.obj: ', e.obj)

  datainer.value.URGENT_YN  = (e.urgent === 'Y')?  'Y' : 'N'
  datainer.value.PLANDATA = e.obj

  datainer.value.ALL_START_TIME = datainer.value.PLANDATA.map(item => item.ALL_START_TIME).join(',')
  datainer.value.ALL_END_TIME = datainer.value.PLANDATA.map(item => item.ALL_END_TIME).join(',')
  datainer.value.ALL_OVERTIME_YN = datainer.value.PLANDATA.map(item => item.OT).join(',')
  datainer.value.ALL_CANCELED_YN= datainer.value.PLANDATA.map(item => item.CANCELED_YN).join(',')
  datainer.value.WORK_DT = dayjs(datainer.value.PLANDATA[0]?.ALL_START_TIME).format("YYYYMMDD");
  datainer.value.DN_DIV  = datainer.value.PLANDATA[0] ? (datainer.value.PLANDATA[0].DN_DIV) : ""
  

  console.log('datainer.value: ', datainer.value)

}

const SafeAppComplished = (e) => {
  onButtonsClick({id: 'btnClose'})
}



///// 저장 프로세스 ////
const SaveProcess = async(Pdatainner: PTWdata, Confirmed_yn: boolean): Promise<boolean> => {
  if (Confirmed_yn){
    let ck = await vm.$swal({
      title: t('현재 허가서를 저장하시겠습니까?'),
      showCancelButton: true,
      focusConfirm: true, 
      })
    if (!ck.isConfirmed) { return false }
  }

  let bs =  await BeforeSave(Pdatainner)
  if (!bs) { return false }

  let sv =  await SaveData(Pdatainner)
  if (!sv) { return false }

 
  Message.success("저장되었습니다.")
  

  return true 


}

const BeforeSave = async(Pdatainner: PTWdata): Promise<boolean> => {
  // 1. 필수값체크
  let is_complete = await check_ess(Pdatainner)
  if (!is_complete){
    return false
  }

  // 2. 장소 입력 체크 
  if ( [ "B", "D", "E"].includes(Pdatainner.LOCATIONTYPE)) {
      let rowCnt = 0

      if (Pdatainner.LOCATIONTYPE == "B" ) {
        rowCnt = grdSub1.value.getDataProvider().getRowCount()
      }
      if (Pdatainner.LOCATIONTYPE == "D" ) {
        rowCnt = grdSub1_1.value.getDataProvider().getRowCount()
      }
      if (Pdatainner.LOCATIONTYPE == "E" ) {
        rowCnt = grdSub1_2.value.getDataProvider().getRowCount()
      } 

      console.log(rowCnt, "rowCnt")
      
      if(rowCnt == 0){
        if  (Pdatainner.WORK_NO_EXIST == 'N'){
          Message.warn(t("작업 장소의 위치 추가를 해주세요"))
          return false
        }
      }

      if (Pdatainner.LOCATIONTYPE == "D" || Pdatainner.LOCATIONTYPE == "E") {
        if ( Pdatainner.WORK_NO_EXIST === 'N' && !Pdatainner.WORK_NO ) {
          Message.warn(t("호선/공사를 선택해주세요."))
          return false
        }
      }
  }

  // 3.작업사업부가 조선,해양,특수선이고 장소가 외업인 경우 3일까지만 저장 가능하게 수정  (2025.05.13 윤찬양 책임)
  if ( (["AC00" ,"AE00" ,"AQ00"].includes(Pdatainner.JOB_BSNS_CD)) && Pdatainner.JOB_LPLC === "B" && Pdatainner.PLANDATA.length > 3)  {  
    Message.warn(t("외업 공사는 최대 3일까지만 설정 가능합니다.(조선,해양,특수선)")) 
    return false
  }



  return true

}

const SaveData = async(Pdatainner: PTWdata): Promise<boolean> => {

  // 조선/해양/특수선이 아닌경우 호선은 ""
  if (!["AC00","AQ00","AE00"].includes(Pdatainner.JOB_BSNS_CD)){
    Pdatainner.WORK_NO = ""
  }

  //화기, 도장작업은 병행체크대상
  Pdatainner.PARA_CHK_YN = ["H00", "P00"].includes(Pdatainner.DANG_DIV) ? "Y" : "N";
  
  // 기타 정보 세팅
  Pdatainner.CON_YN = Pdatainner.RCV_TYPECheck == null || Pdatainner.RCV_TYPECheck === false
  ? null
  : Pdatainner.RCV_TYPECheck
    ? "Y"
    : "N";

  // 신청자 정보
  Pdatainner.REQ_EMP_NO = Pdatainner.REQ_EMP_NO ? Pdatainner.REQ_EMP_NO: userStore.empNo
  Pdatainner.FORM_TYPE = "R2"


  /////////////////////////////////////////////////////////////////////////////
  // SAVE01 : 기본정보 및 날짜 저장
   /////////////////////////////////////////////////////////////////////////////

  let saveParam01 = JSON.parse(JSON.stringify(Pdatainner)) // deep copy
  let res01 = await commonExecuteApi({
      queryId: "SAFBA0010_SAVE_01",
      list: [saveParam01],
    })

  if (res01.list[0].RES_COD != "100" ){
    Message.err(res01.list[0].RES_COD)
    return false
  }
  Pdatainner.RCV_NO = res01.list[0].RES_RCV_NO
  


  /////////////////////////////////////////////////////////////////////////////
  // SAVE 02 또는 SAVE03 : 작업장소 저장
  /////////////////////////////////////////////////////////////////////////////


  if (Pdatainner.LOCATIONTYPE === "D" || Pdatainner.LOCATIONTYPE === "E") {
    // 데이터 프로바이더 가져오기
    // const dataProvider = Pdatainner.LOCATIONTYPE === "D"
    //   ? grdSub1_1.value.getDataProvider()
    //   : grdSub1_2.value.getDataProvider()
     
    // // 그리드의 전체 데이터 가져오기
    // const allRows = dataProvider.getJsonRows()
    
    const allRows = Pdatainner.LOCATIONTYPE === "D"
        ? Pdatainner.GRDSUB1_1
        : Pdatainner.GRDSUB1_2


    
    // 저장 데이터 준비 (SEQ_NO만 추가)
    const saveParam02 = allRows?.map((row:any, i: number) => ({
      ...row,
      RCV_NO: Pdatainner.RCV_NO,
      CMPNY_DIV: Pdatainner.CMPNY_DIV,
      SEQ_NO: i + 1
    }))

    console.log(saveParam02, "saveParam02")

    // 저장
    let res02  = await commonExecuteApi({
      queryId: "SAFBA0010_SAVE_02",
      list: saveParam02,
    })

    if (res02.list.some((r: { OUT_RES_COD: string } ) => r.OUT_RES_COD !== '100')){
      return false
    };

    console.log("장소저장 D / E 완료")

  } else if (Pdatainner.LOCATIONTYPE === "B") {
    // 데이터 프로바이더 가져오기
    // 그리드의 전체 데이터 가져오기

    // const allRows = grdSub1.value.getDataProvider().getJsonRows()
    const allRows = Pdatainner.GRDSUB1


    // 저장 데이터 준비 (SEQ_NO만 추가)
    const saveParam03 = allRows?.map((row:any, i: number) => ({
      ...row,
      RCV_NO: Pdatainner.RCV_NO,
      CMPNY_DIV: Pdatainner.CMPNY_DIV,
      SEQ_NO: i + 1
    }))

    console.log(saveParam03, "saveParam03")
    // 저장
    let res03 = await commonExecuteApi({
        queryId: "SAFBA0010_SAVE_03",
        list: saveParam03,
    })

    if (res03.list.some((r: { OUT_RES_COD: string } ) => r.OUT_RES_COD !== '100')){
      return false
    };
  }



  return true

}

const check_ess = (Pdatainner: PTWdata): boolean => {
  console.log("check_ess", Pdatainner)
    if (!Pdatainner.DEPT_CD){
      Message.warn("[① 기본 정보] 소속조직은 필수값입니다.")
      return false
    }
    if (!Pdatainner.JOB_BSNS_CD){
      Message.warn("[① 기본 정보] 작업사업부는 필수값입니다.")
      return false
    }
    if (!Pdatainner.MNGR_EMP_NO){
      Message.warn("[① 기본 정보] 관리감독자(승인자)는 필수값입니다.")
      return false
    }
    if (!Pdatainner.DANG_DIV){
      Message.warn("[② 작업 정보] PTW 작업명은 필수값입니다.")
      return false
    }
    if (!Pdatainner.WORK_DETAIL){
      Message.warn("[② 작업 정보] 작업 상세는 필수값입니다.")
      return false
    }
    if (!Pdatainner.RESP_EMP_NO){
      Message.warn("[② 작업 정보] 작업책임자는 필수값입니다.")
      return false
    }
    if (!Pdatainner.DNGR_RSN){
      Message.warn("[② 작업 정보] 유해위험요소는 필수값입니다.")
      return false
    }
    // if (!Pdatainner.WRK_STD_NO){
    //   Message.warn("[② 작업 정보] 작업표준서는 필수값입니다.")
    //   return false
    // }
    if (!Pdatainner.WORKER_CNT){
      Message.warn("[② 작업 정보] 작업인원은 필수값입니다.")
      return false
    }
    if (
      !Pdatainner.CONFINED_YN ||
      !Pdatainner.ARGN_YN ||
      !Pdatainner.ELEC_YN ||
      !Pdatainner.HEIGHT_YN ||
      !Pdatainner.PRESSURE_YN ||
      !Pdatainner.PIPE_DIA_YN
    ) {
      Message.warn(t("[② 작업 정보] 추가정보는 필수값입니다."))
      return false
    }

    if (Pdatainner.HEIGHT_YN === "Y" && !Pdatainner.HEIGHT) {
      Message.warn(t("[② 작업 정보]  고소작업 높이를 입력해주세요"))
      return false
    }

    if (Pdatainner.PRESSURE_YN === "Y" && !Pdatainner.PRESSURE) {
      Message.warn(t("[② 작업 정보]  압력테스트 압력을 입력해주세요"))
      return false
    }

    if (Pdatainner.PIPE_DIA_YN === "Y" && !Pdatainner.PIPE_DIA) {
      Message.warn(t("[② 작업 정보]  압력테스트 PIPE직경을 입력해주세요"))
      return false
    }


    if (!Pdatainner.JOB_PLC){
      Message.warn("[③ 작업 장소]는 필수값입니다.")
      return false
    }
    
    if (!Pdatainner.PLANDATA[0]?.ALL_END_TIME){
      Message.warn("[④ 작업 일시]는 필수값입니다.")
      return false
    }

    
    return true
}


///// 신청 프로세스 ////
const ApplyProcess = async (Pdatainner: PTWdata, isConfirmed: boolean, isSetdatainner: boolean ): Promise<boolean> => {

  // 1. 신청 조건 확인 
  let ba = await BeforeApply(Pdatainner)
  if (!ba){ return false}

  // 1_1 확인창
  if (isConfirmed){
    let ck = await vm.$swal({
      title: t('허가서를 신청하시겠습니까? \r\n 관리감독자(승인자)의 승인 이후 작업이 가능합니다.'),
      showCancelButton: true,
      focusConfirm: true, 
      })
    if (!ck.isConfirmed) { return false }
  }

  // 2. 신청 전 저장 
  let sp = await SaveProcess(Pdatainner, false)
  if (!sp){ return false }
  console.log("sp:",  sp )

  // 3. 신청 프로세스 진행
  let ad  = await ApplyData(Pdatainner)
  if (!ad) { return false }
  Pdatainner.STATUS = '35'
  Pdatainner.STATUS_NM = '신청완료-승인대기'
  console.log("ad:",  ad )

  // 4. 내부결재 등록 또는 승인 , 메일발송
  if ((userStore.empNo === Pdatainner.MNGR_EMP_NO) || isH.value) {
    if (!ApplyALLIng.value){
      AcceptProcess(Pdatainner,true)
    }
  } else {
    let approvalParams = {
      CMPNY_DIV: Pdatainner.CMPNY_DIV,
      APPROVE_ID: Pdatainner.RCV_NO,
      APPROVE_GBN: "I",
      FORM_ID: "SAFBA0010",
      APP_EMP_NO: Pdatainner.MNGR_EMP_NO,
      // APP_REQ_DATE: dayjs(new Date()).format("YYYY-MM-DD"),
      PATH: "/30_safety/SAF_B/SAFBA0010",
      USER_ID: userStore.userId,
      APP_REQ_EMP_NO: userStore.userId,
    }
    console.log("내부 결재 상신 전 내부결재 데이터 확인", approvalParams)
    commonExecuteApi({
      queryId: "OPRAB0010_SAVE_01",
      list: [approvalParams],
    }).then((APres) => {
      EmailSend('APP', Pdatainner)
      //onButtonsClick({id: 'btnClose'})
    })
  }


  // 5.데이터 조회
  if (isSetdatainner){
    setDataIner(Pdatainner.CMPNY_DIV, Pdatainner.RCV_NO)
  }



  return true 
}

const BeforeApply = (Pdatainner: PTWdata): boolean => {

  // 허가서 번호가 있는지 확인
  if (!Pdatainner.RCV_NO) {
    Message.warn("저장버튼을 눌러 허가서 번호를 생성하여주십시오") 
    return false
  }

  // 신청가능한 상태값인지 확인
  if (Pdatainner.STATUS !== "20" && Pdatainner.STATUS !== "21") {
    Message.warn("작성중 / 부서 반려일때만 신청할수있습니다") 
    return false
  }



  let nowDt = dayjs()
  let workDt = dayjs(Pdatainner.WORK_DT)
  let deadline = workDt.subtract(1, "day").hour(15).minute(0).second(0)
  console.log("deadline:", deadline)

  // 신청 기간을 지켰는지 확인.
  if (nowDt.isAfter(workDt, "day")) {
            Message.warn("과거일자는 신청할 수 없습니다.")
            return false
          }

  if(Pdatainner.URGENT_YN === 'N' ){
    if (nowDt.isAfter(deadline)) {
      Message.warn("허가서 신청 마감시간은 작업 전일 15:00까지 입니다. 긴급작업으로 신청 바랍니다.")
      return false
    }
  }else{ // 긴급신청체크
    if (nowDt.isBefore(deadline))
        {      
          Message.warn(
            t("긴급작업 신청 대상이 아닙니다.")
          )
          return false      
        }
  }

  return true
}

const ApplyData = async (Pdatainner: PTWdata): Promise<boolean> => {
  console.log("ApplyData: ", Pdatainner)

  // 신청
  let applyParams = [{CMPNY_DIV: Pdatainner.CMPNY_DIV, RCV_NO: Pdatainner.RCV_NO, USER_ID: Pdatainner.USER_ID}]
  let res = await commonExecuteApi({queryId: "SAFBA0010_SAVE_05", list: applyParams})

  return (res.list[0].OUT_RES_COD == '100')

}

const EmailSend = async (gubun:string, Pdatainner: PTWdata) => {
  if(gubun === 'APP') {
    //console.log('datainer.value :: ', datainer.value)

    let my_rcv = await commonSearchApi({
      queryId: "SAFBB0010_SEARCH_02",
      param:{
        CMPNY_DIV: Pdatainner.CMPNY_DIV, 
        RCV_NO: Pdatainner.RCV_NO,
      },
    })

    //console.log('my_rcv :: ', my_rcv)    

    await commonSearchApi({
      queryId: "searchUserInfo",
      param: {
        CMPNY_DIV: Pdatainner.CMPNY_DIV,
        EMP_NO: Pdatainner.MNGR_EMP_NO,        
      },
    }).then(async res => { 
      console.log('REQ ', res)

      let mailParams = {}

      if (res.ORESULT_CUR.length > 0) {

        if(res.ORESULT_CUR[0].EMAIL && res.ORESULT_CUR[0].EMAIL.trim().length > 3) {
          mailParams.EMAIL = [res.ORESULT_CUR[0].EMAIL];
          mailParams.SUBJECT = "[HiSEs] PTW 승인 필요 알림 건"
          mailParams.CONTENT = ` 
          </br>
          위험작업허가(PTW)가 신청되었습니다. 
          </br>
          검토 후 승인(위험작업허가 작성/승인 화면에서 ‘승인 필요대상 건’ 체크 후 조회 시 승인 버튼 활성화)을 해 주시기 바라며, 안전에 각별히 신경 써 주시기 바랍니다.
          </br>
              <table class="" style="border-collapse: collapse;">
                <tbody>
                  <tr>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:220px; text-align: center;">작업일시 </td>                                      
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:250px; text-align: center;"> 부서 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:250px; text-align: center;"> 조직 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px; text-align: center;"> 장소(기본) </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:300px; text-align: center;"> 장소(상세) </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:100px; text-align: center;"> 호선 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:250px; text-align: center;"> 작업명 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:250px; text-align: center;"> 작업상세 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:150px; text-align: center;"> 관리감독자(승인자) </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px; text-align: center;"> 허가구분 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:150px; text-align: center;"> 허가번호 </td>
                  </tr>
                  <tr>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;text-align: center;">${my_rcv.ORESULT_CUR[0].WORK_DT ? my_rcv.ORESULT_CUR[0].WORK_DT : ''}</td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${my_rcv.ORESULT_CUR[0].DEPT_NM ? my_rcv.ORESULT_CUR[0].DEPT_NM : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${my_rcv.ORESULT_CUR[0].ASGN_NM ? my_rcv.ORESULT_CUR[0].ASGN_NM : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${my_rcv.ORESULT_CUR[0].JOB_SPLC ? my_rcv.ORESULT_CUR[0].JOB_SPLC : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${my_rcv.ORESULT_CUR[0].DIV_M ? my_rcv.ORESULT_CUR[0].DIV_M : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;text-align: center;"> ${my_rcv.ORESULT_CUR[0].WORK_NO ? my_rcv.ORESULT_CUR[0].WORK_NO : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${my_rcv.ORESULT_CUR[0].WRK_DIST ? my_rcv.ORESULT_CUR[0].WRK_DIST : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${my_rcv.ORESULT_CUR[0].WORK_DETAIL ? my_rcv.ORESULT_CUR[0].WORK_DETAIL : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;text-align: center;"> ${my_rcv.ORESULT_CUR[0].MNGR_EMP_NM ? my_rcv.ORESULT_CUR[0].MNGR_EMP_NM : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;text-align: center;"> ${my_rcv.ORESULT_CUR[0].CF_DIV_NM ? my_rcv.ORESULT_CUR[0].CF_DIV_NM : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;text-align: center;"> ${my_rcv.ORESULT_CUR[0].RCV_NO ? my_rcv.ORESULT_CUR[0].RCV_NO : ''} </td>                    
                  </tr>
                </tbody>
              </table>                        
              `
              //console.log('mailParams ', mailParams)

          commonSendApi(mailParams).then(() => {
            Message.success('메일이 전송 되었습니다.')
          })
        }

        
      }
    })
  }  
} 

const CancleApply = (Pdatainner: PTWdata) => {


  vm?.$swal({
        title: t("허가서 신청을 취소하시겠습니까?"),
        showCancelButton: true,
      }).then((swalRes:any) => {
        if (swalRes.isConfirmed === true) {
          commonExecuteApi({
            queryId: "SAFBA0010_DELETE04",
            list: [Pdatainner],
          })
            .then((res) => {
              setDataIner(Pdatainner.CMPNY_DIV, Pdatainner.RCV_NO)
            })
            .catch((err) => {
              setDataIner(Pdatainner.CMPNY_DIV, Pdatainner.RCV_NO)
              console.log(err)
            })
        }
      })



}

const ApplyALL = async (): Promise<boolean> => {

  console.log("ApplyALL", cards.value)
  ApplyALLIng.value = true // 긴급/병행작업이 껴있을 때는 신청자==승인자이더라도 일괄 승인 안됨

  // 1. 신청할 수 있는 건 찾기
  let applycards = cards.value.filter((card:PTWdata) => card.STATUS === '20' && card.RCV_NO)
  let applyrcvs = applycards.map((card: PTWdata) => card.RCV_NO).join(",")
  console.log("applycards", applycards)
  if (applycards.length == 0)
  { 
    Message.warn("신청할 수 있는 허가서가 없습니다.  <br>  (허가서번호가 있는 \'작성중\' 상태의 허가서만 신청됩니다.)  ") 
    return false
  }

  // 1_1 확인창

  let ck = await vm.$swal({
    title: t( applycards.length + '개의 허가서를 신청하시겠습니까? \r\n    (허가서번호가 있는 \'작성중\' 상태의 허가서만 신청됩니다.) \r\n   ' + applyrcvs  ),
    showCancelButton: true,
    })
  if (!ck.isConfirmed) { return false }



  // 2. 신청 프로세스 
  for (let card of applycards){
    await ApplyProcess(card, false, false)

  }

  ApplyALLIng.value = false
  return true 
}



///// 승인 프로세스 ////
const AcceptProcess = async(Pdatainner: PTWdata, isConfirmed: boolean): Promise<boolean> => {

  // 1. 신청 조건 확인 
  let ba = await BeforeAccept(Pdatainner)
  if (!ba){ return false}

  // 1_1 확인창
  if (isConfirmed){
    let ck = await vm.$swal({
      title: t('허가서를 승인하시겠습니까?'),
      showCancelButton: true,
      focusConfirm: true, 
      })
    if (!ck.isConfirmed) { return false }
  }

  // 2. 승인 프로세스

  let ac =  await AcceptData(Pdatainner)
  if (!ac) { return false }


  return true

}

const BeforeAccept =  (Pdatainner: PTWdata): boolean => {

  // 본인 == 승인자 또는 협력사 계정(isH)만 권한을 가짐
  if (!(userStore.empNo === Pdatainner.MNGR_EMP_NO) && !isH.value){
    Message.warn(`해당 허가서 승인 권한자는 ${Pdatainner.MNGR_EMP_NM}(${Pdatainner.MNGR_EMP_NO}) 입니다. `);
    return false
  }

  // 승인 기간 지켰는지 확인 
  let nowDt = dayjs()
  let workDt = dayjs(Pdatainner.WORK_DT)
  let deadline = workDt.subtract(1, "day").hour(15).minute(0).second(0)

  if (nowDt.isAfter(workDt, "day")) {
            Message.warn("과거일자는 승인할 수 없습니다.")
            return false
          }

  if(Pdatainner.URGENT_YN === 'N' ){
    if (nowDt.isAfter(deadline)) {
      Message.warn("허가서 승인 마감시간은 작업 전일 15:00까지 입니다. 신청취소 후 긴급작업으로 재신청 바랍니다.")
      return false
    }
  }




  return true

}

const AcceptData =  async(Pdatainner: PTWdata): Promise<boolean> => {
   let isCrossed = 'N'  // 병행 여부

    // 2. 병행 여부 체크 
    let res = await commonSearchApi({queryId: "SAFBA0010_SEARCH_15", param: Pdatainner})
    if (res.ORESULT_CUR.length === 0) {
      isCrossed = 'N' // 병행 여부
    }
    else {
      isCrossed = 'Y' // 병행 여부
    }

    console.log('oresult2', res)
    console.log('병행작업 여부', isCrossed)
    console.log('긴급작업 여부', Pdatainner.URGENT_YN)


    // 병행작업 또는 긴급작업의 경우 안전승인 절차
    if ( isCrossed === 'Y' || Pdatainner.URGENT_YN === 'Y'){
      SafeAppPop.value?.openPopup(isCrossed, datainer.value.URGENT_YN, datainer.value.CMPNY_DIV, datainer.value.RCV_NO)
    }

    else {
      commonExecuteApi({
        queryId: "SAFBA0010_SAVE_06", // 허가서 승인
        list: [Pdatainner],
      }).then((res) => {
        if (res.list[0].RES_COD == '-200'){
          Message.warn(res.list[0].RES_MSG)
          return false
        }
        else{
          Pdatainner.STATUS = '50'
          onButtonsClick({id: 'btnClose'})
        }})
        .catch((err) => {
          console.log(err)
        })

  return true
  
    }

    return true
  }



const CancleAccept = (Pdatainner: PTWdata) => {

  // 본인 == 승인자 또는 협력사 계정(isH)만 권한을 가짐
    if (!(userStore.empNo === Pdatainner.MNGR_EMP_NO) && !isH.value){
    Message.warn(`해당 허가서 승인취소 권한자는 ${Pdatainner.MNGR_EMP_NM}(${Pdatainner.MNGR_EMP_NO}) 입니다. `);
    return false
  }


  vm?.$swal({
        title: t("허가서 승인을 취소하시겠습니까?"),
        showCancelButton: true,
      }).then((swalRes:any) => {
        if (swalRes.isConfirmed === true) {

          let deleteparam = {CMPNY_DIV:Pdatainner.CMPNY_DIV, RCV_NO: Pdatainner.RCV_NO,
             REJECT_REASON: "",GBN :"3", USER_ID: userStore.empNo  }

          commonExecuteApi({
            queryId: "SAFBA0010_DELETE05",
            list: [deleteparam],
          })
            .then((res) => {
              if (res.list[0].RES_COD === '-100'){
                Message.warn("작업 시작일이 금일 또는 금일 이전인 허가서는 승인 취소가 불가능합니다. ")
                return
              }
              SmsCancle(Pdatainner)
              setDataIner(Pdatainner.CMPNY_DIV, Pdatainner.RCV_NO)
              onButtonsClick({id: 'btnClose'})
            })
            .catch((err) => {
              setDataIner(Pdatainner.CMPNY_DIV, Pdatainner.RCV_NO)
              console.log(err)
            })
        }
      })



}


// SMS
const SmsCancle = (Pdatainner: PTWdata) => {
  let msg = `신청하신 위험작업허가서가 승인 취소 되었습니다.`
  let smsParam = {
    EMPNO_FROM: Pdatainner.MNGR_EMP_NO, //보내는사람 사번
    EMPNO_TO: Pdatainner.RESP_EMP_NO, //받는사람 사번()
    SYSCODE: "000", //000고정
    FROM_P_NO: Pdatainner.MNGR_HP_NO, //보내는사람 폰번호(조치자)
    TO_P_NO: Pdatainner.RESP_HP_NO, //받는사람 폰번호(점검자)
    TITLE: msg, //제목,내용
  }
  commonSendSMS(smsParam)
}



const PrintOut = (Pdatainner: PTWdata) => {
  console.log('PrintOut : ', Pdatainner)
  params.value = []
  reportName.value = ""
  let dataRort = <string[]>[]
  let sCF_DIV_NM = Pdatainner.CF_DIV === "F" ? `[안전대면허가]` : (Pdatainner.CF_DIV === "S" ? `[안전현장허가]`: `[전산허가]`)
  let urlArr =getQDomain() + `/#/ptw_qr?RCV_NO=${Pdatainner.RCV_NO}&SHORT_WORK_NO=`
  console.log('urlArr', urlArr)


  // PSM(공정안전관리작업)
  if(Pdatainner.DANG_DIV === "Z00"){ 
    // PSM 출력
    let sP_WRK_ID = Pdatainner.P_WRK_ID

    dataRort = [
      "CF_DIV_NM=" + sCF_DIV_NM,
      "WRKCHK=" + "",
      "IN_CMPNY_DIV=" + Pdatainner.CMPNY_DIV,
      "IN_RCV_NO=" + Pdatainner.RCV_NO,          
      "QR=" + urlArr,
      "visible=" + Pdatainner.CF_DIV === "F" ? 'Y' : 'N',
    ]

    reportName.value = "/manage/hse/" + sP_WRK_ID + ".ozr"
    
    params.value.push({ reportName: reportName.value, args: dataRort })
    isMulti.value = true
    showOz.value = true
    console.log('print1',params.value )
    return
  } 


  // 조선해양특수선
  else if (["AC00","AQ00","AE00"].includes( Pdatainner.JOB_BSNS_CD)) {
    // 조선해양특수선: 건설공사
    if (Pdatainner.WRK_DIV === "B"){
        dataRort = [
          "CF_DIV_NM=" + sCF_DIV_NM,
          "WRKCHK=" + "",
          "IN_CMPNY_DIV=" + Pdatainner.CMPNY_DIV,
          "IN_RCV_NO=" + Pdatainner.RCV_NO,
          "IN_THREECHECKYN" + Pdatainner.THREECHECKYN,
          "QR=" + urlArr,
          "visible=" + Pdatainner.CF_DIV === "F" ? 'Y' : 'N',
        ]
        reportName.value = Pdatainner.CF_DIV === "F" ? "/manage/hse/RETA3017C.ozr" 
                          : (Pdatainner.CF_DIV === "S" ? "/manage/hse/RETA3014C.ozr" 
                          :"/manage/hse/RETA3015C.ozr") 
        params.value.push({ reportName: reportName.value, args: dataRort })
        isMulti.value = true
        showOz.value = true
        console.log('print2', params.value )
        return
    }

    // 조선해양특수선: 외업작업장
    else if (Pdatainner.JOB_LPLC === "B") {
      //외업작업장
      reportName.value = Pdatainner.CF_DIV === "F" ? "/manage/hse/RETA3011_04C_v2.ozr" 
                        : (Pdatainner.CF_DIV === "S" ? "/manage/hse/RETA3011_06C_v2.ozr" 
                        :"/manage/hse/RETA3011_05C_v2.ozr") 
      dataRort = [
        "CF_DIV_NM=" + sCF_DIV_NM,
        "WRKCHK=" +  "",
        "IN_CMPNY_DIV=" + Pdatainner.CMPNY_DIV,
        "IN_RCV_NO=" + Pdatainner.RCV_NO,
        "QR=" + urlArr,
      ]

      isMulti.value = true
      showOz.value = true
      params.value.push({ reportName: reportName.value, args: dataRort })
      console.log('print3',params.value )
      return
    }
 
    // 조선해양특수선: 그 외 장소
    else {
      //F 대면 C 전산 S 현장
      reportName.value = Pdatainner.CF_DIV === "F" ? "/manage/hse/RETA3011C.ozr" 
                            : (Pdatainner.CF_DIV === "S" ? "/manage/hse/RETA3013C.ozr" 
                            :"/manage/hse/RETA3012C.ozr") 
      dataRort = [
          "CF_DIV_NM=" + sCF_DIV_NM,
          "WRKCHK=" + "",
          "IN_CMPNY_DIV=" + Pdatainner.CMPNY_DIV,
          "IN_RCV_NO=" + Pdatainner.RCV_NO,
          "QR=" + urlArr,
        ]

      isMulti.value = true
      showOz.value = true
      params.value.push({ reportName: reportName.value, args: dataRort })
      console.log('print4',params.value )
      return
    }

  } 


  // 기타사업부(엔진/경영/기타)
  else {

    // 기타사업부: 기타/비일상복합작업(E03)
    if(Pdatainner.DANG_DIV == "E03"){
      // 무조건 안전현장허가임
      reportName.value = "/manage/hse/RETA3016C.ozr"
      dataRort = [
          "CF_DIV_NM=" + `[안전대면허가]`,
          "WRKCHK=" + "",
          "IN_CMPNY_DIV=" + Pdatainner.CMPNY_DIV,
          "IN_RCV_NO=" + Pdatainner.RCV_NO,
          "QR=" + urlArr,
        ]

      params.value.push({ reportName: reportName.value, args: dataRort })
      isMulti.value = true
      showOz.value = true
      params.value.push({ reportName: reportName.value, args: dataRort })
      console.log('print5',params.value )
      return
    }   

    // 기타사업부: 건설공사
    if (Pdatainner.WRK_DIV === "B"){
      dataRort = [
        "CF_DIV_NM=" + sCF_DIV_NM,
        "WRKCHK=" + "",
        "IN_CMPNY_DIV=" + Pdatainner.CMPNY_DIV,
        "IN_RCV_NO=" + Pdatainner.RCV_NO,
        "QR=" + urlArr,
        "visible=" + Pdatainner.CF_DIV === "F" ? "Y" : "N",
      ]
      reportName.value = Pdatainner.CF_DIV === "F" ? "/manage/hse/RETA3017C_B.ozr" 
                  : (Pdatainner.CF_DIV === "S" ? "/manage/hse/RETA3014C_B.ozr" 
                  :"/manage/hse/RETA3015C_B.ozr") 
      params.value.push({ reportName: reportName.value, args: dataRort })
      isMulti.value = true
      showOz.value = true
      params.value.push({ reportName: reportName.value, args: dataRort })
      console.log('print6',params.value )
      return
    }

    // 기타사업부: 그 외
    else {
      reportName.value = Pdatainner.CF_DIV === "F" ? "/manage/hse/RETA3011C_B.ozr" 
                          : (Pdatainner.CF_DIV === "S" ? "/manage/hse/RETA3013C_B.ozr" 
                          :"/manage/hse/RETA3012C_B.ozr") 
      dataRort = [
        "CF_DIV_NM=" + sCF_DIV_NM,
        "WRKCHK=" + Pdatainner.WRKCHK === "Y1" || Pdatainner.WRKCHK === "Y2"
          ? "병행"
          : "",
        "IN_CMPNY_DIV=" + Pdatainner.CMPNY_DIV,
        "IN_RCV_NO=" + Pdatainner.RCV_NO,
        "QR=" + urlArr,
      ]
      params.value.push({ reportName: reportName.value, args: dataRort })
      isMulti.value = true
      showOz.value = true
      params.value.push({ reportName: reportName.value, args: dataRort })
      console.log('print7',params.value )
      return
    }

  }


}





const onButtonsClick = async(btn: Button) => {


 if(btn.id === 'btnClose'){
   cards.value = []
   selectedIndex.value = 0
   datainer.value = JSON.parse(JSON.stringify(datainer_init.value)) 
   disabledSTATUS.value = false
   isInitialLoading.value = false
   dialog.value = false
   emit("upData")
  }
  else if (btn.id === 'btncopy'){

    // 허가서 번호: 신규로 변경됨. + 작업 일시는 초기화
    vm.$swal({
    title: t('해당 허가서를 복사하시겠습니까?'),
    showCancelButton: true,
    focusConfirm: false, 
    focusCancel: false,
    }).then(
      (ck:any) => {
      if (ck.isConfirmed === true) {
        // swal 닫힌 후 이벤트 처리를 위한 짧은 딜레이
        setTimeout(() => {
          let datainer_copied:PTWdata =  JSON.parse(JSON.stringify(datainer.value)) // deep copy
          datainer_copied.PLANDATA = Array.from({ length: 7 }, () => ({ALL_END_TIME: "", ALL_START_TIME: "",  CANCELED_YN: "" , DN_DIV: "", 
                                                  OT: "",  dt: "", time: "", })) as Plandata[] // 복사시 일정은 초기화
          datainer_copied.URGENT_YN = 'N'
          cards.value.push(datainer_copied) // cards에 동일한 것 추가
          datainer.value = datainer_copied  // 현재 보이는 화면은 추가된 것을 바라보도록 수정
          datainer.value.RCV_NO = "" // 복사된 허가서는 번호가 없음
          datainer.value.STATUS = "20" // 복사된 허가서는 번호가 없음
          datainer.value.STATUS_NM = "작성중" // 복사된 허가서는 번호가 없음
          selectCard(selectedIndex.value + 1, false)  // 인덱스 추가
        }, 100)
      }}
    )

  }
  else if(btn.id === 'btnnew'){

    // 저장 시도
    let sv =  await SaveProcess(datainer.value, true)
    if (!sv) { return } 
    
    // 저장된 이후
    let datainer_new:PTWdata = JSON.parse(JSON.stringify(datainer_init.value)) 
    cards.value.push(datainer_new) // cards에 동일한 것 추가


    // 이미 저장했기때문에 needsave는 false
    selectCard(selectedIndex.value + 1, false)  // 인덱스 추가
  }
  else if (btn.id === 'btnADD_LOCATION'){
  
    if (datainer.value.LOCATIONTYPE == "B") {
        let code =
          datainer.value.JOB_LPLC +
          datainer.value.JOB_MPLC +
          datainer.value.JOB_SPLC

        grdSub1.value.addRow({
          DIV_M: "",
          DIV_S: "",
          DIV_L: code,
        })

      }
    if (datainer.value.LOCATIONTYPE == "D") {
      if (!datainer.value.WORK_NO || !datainer.value.JOB_PLC) {
        return Message.warn(t("호선/공사 와 장소를 선택해주세요."))
      }
      workPlacePopUp.value.openPopup(datainer.value, "D")
    }
    if (datainer.value.LOCATIONTYPE == "E") {
      if (!datainer.value.WORK_NO || !datainer.value.JOB_PLC) {
        return Message.warn(t("호선/공사 와 장소를 선택해주세요."))
      }
      workPlacePopUp.value.openPopup(datainer.value, "E")
    }

  }
  else if (btn.id === "btnDELETE_LOCATION"){
    if (datainer.value.LOCATIONTYPE == "B") {
        grdSub1.value.getDataProvider().setOptions({softDeleting:false})
        
        let checkedRows = grdSub1.value.getGridView().getCheckedRows(true)


        

        if (checkedRows.length == 0) {
          return Message.warn(t("선택된 행이없습니다."))
        }
        if(datainer.value.RCV_NO){
          new deleteFlowHelper(vm, t)
          .setQuery(deleteDataB)
          .setAfter(() => {
            grdSub1.value.getDataProvider().removeRows(checkedRows )
          })
          .run()
        }
        else{

          grdSub1.value.getDataProvider().removeRows(checkedRows)
        }
        
      }
    if (datainer.value.LOCATIONTYPE == "D") {
      grdSub1_1.value.getDataProvider().setOptions({softDeleting:false})
      let checkedRows = grdSub1_1.value.getGridView().getCheckedRows(true)
      if (checkedRows.length == 0) {
        return Message.warn(t("선택된 행이없습니다."))
      }
      if(datainer.value.RCV_NO){
        new deleteFlowHelper(vm, t)
        .setQuery(deleteData)
        .setAfter(() => {
          grdSub1_1.value.getDataProvider().removeRows(checkedRows)
        })
        .run()
      }
      else{

        grdSub1_1.value.getDataProvider().removeRows(checkedRows)
      }

      
    }
    if (datainer.value.LOCATIONTYPE == "E") {
      grdSub1_2.value.getDataProvider().setOptions({softDeleting:false})
      let checkedRows = grdSub1_2.value.getGridView().getCheckedRows(true)
      let Rows = grdSub1_2.value.getDataProvider().getJsonRows()
      if (checkedRows.length == 0) {
        return Message.warn(t("선택된 행이없습니다."))
      }
      if(datainer.value.RCV_NO){
        new deleteFlowHelper(vm, t)
        .setQuery(deleteData)
        .setAfter(() => {
          grdSub1_2.value.getDataProvider().removeRows(checkedRows)
        })
        .run()
      }
      else{
      
        grdSub1_2.value.getDataProvider().removeRows(checkedRows)
      }
      
    }

    if (grdSub1.value) datainer.value.GRDSUB1   =  grdSub1.value.getDataProvider().getJsonRows()
    if (grdSub1_1.value) datainer.value.GRDSUB1_1 =  grdSub1_1.value.getDataProvider().getJsonRows()
    if (grdSub1_2.value) datainer.value.GRDSUB1_2 =  grdSub1_2.value.getDataProvider().getJsonRows()
  }

  else if (btn.id === "btnUpdate"){


    if (grdSub1.value) datainer.value.GRDSUB1   =  grdSub1.value.getDataProvider().getJsonRows()
    if (grdSub1_1.value) datainer.value.GRDSUB1_1 =  grdSub1_1.value.getDataProvider().getJsonRows()
    if (grdSub1_2.value) datainer.value.GRDSUB1_2 =  grdSub1_2.value.getDataProvider().getJsonRows()

    SaveProcess(datainer.value, true)

  }


}


// 위치 삭제
const deleteDataB = () => {
  let chekedRow = grdSub1.value.getGridView().getCheckedRows(true)

  let delParams = <any>[]
  chekedRow.forEach((val:any) => {
    let data = grdSub1.value.getDataProvider().getJsonRow(val)
    delParams.push(data)
  })

  return commonExecuteApi({
    queryId: "SAFBA0010_DELETE03",
    list: delParams,
  })
}

const deleteData = () => {
  let chekedRow =
    datainer.value.LOCATIONTYPE === "D"
      ? grdSub1_1.value.getGridView().getCheckedRows(true)
      : grdSub1_2.value.getGridView().getCheckedRows(true)

  let delParams = <any>[]
  chekedRow.forEach((val:any) => {
    let data =
    datainer.value.LOCATIONTYPE === "D"
        ? grdSub1_1.value.getDataProvider().getJsonRow(val)
        : grdSub1_2.value.getDataProvider().getJsonRow(val)
    delParams.push(data)
  })

  return commonExecuteApi({
    queryId: "SAFBA0010_DELETE02",
    list: delParams,
  })
}


// 소속조직이 바뀌거나, 작업사업부가 변경되면 PTW 초기화 필요
watch( () => [datainer.value.DEPT_CD, datainer.value.JOB_BSNS_CD],
 ( [DEPT_CD, JOB_BSNS_CD] ) => {

  console.log("watched 1 ", [DEPT_CD, JOB_BSNS_CD, isInitialLoading.value]  )

    // 초기 로딩 중이면 watch 실행하지 않음
    if (isInitialLoading.value) {
      isInitialLoading.value = false
      return
    }
    
   //소속부서 변경시 초기화 
    if(DEPT_CD) {
      datainer.value.WRK_PLC = ""
      datainer.value.WRK_DIST = ""
      datainer.value.DANG_DIV = "" // 작업구분 ex) 화기작업(H00), 전기작업(D01) 등
      datainer.value.P_WRK_ID = ""
      datainer.value.CF_DIV = ""
      datainer.value.CF_DIV_NM = ""
      datainer.value.THREECHECKYN = ""
    }
    // 공통공정이면 작업사업부가 변경되었을때 초기화 
    else if (JOB_BSNS_CD && datainer.value.WRK_PLC ==='99' ){
      datainer.value.WRK_PLC = ""
      datainer.value.WRK_DIST = ""
      datainer.value.DANG_DIV = "" // 작업구분 ex) 화기작업(H00), 전기작업(D01) 등
      datainer.value.P_WRK_ID = ""
      datainer.value.CF_DIV = ""
      datainer.value.CF_DIV_NM = ""
      datainer.value.THREECHECKYN = ""

    }

 }



)


// 사업부정보변경시 호선 정보 변경
watch(
  () => [
    datainer.value.BSNS_CD,
    datainer.value.JOB_BSNS_CD,
    datainer.value.RCV_TYPECheck,
    datainer.value.JOB_PLC,
  ],
  ([BSNS_CD, JOB_BSNS_CD, RCV_TYPE, PLC]) => {
    console.log("watched 2", [BSNS_CD, JOB_BSNS_CD, RCV_TYPE, PLC, isInitialLoading.value])

    if (BSNS_CD) {
      commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: userStore.cmpnyDiv === '420' ? 'HHI' : userStore.cmpnyDiv, BSNS_CD: BSNS_CD },
      }).then( (res) => {
        codeList.deptCd = res.ORESULT_CUR
        console.log("codeList.deptCd", codeList.deptCd)
      })
    }

    if (JOB_BSNS_CD) {
      // 장소
      const Location = {
        CMPNY_DIV: datainer.value.CMPNY_DIV,
        JOB_LMPLC: "",
        DOCK: "",
      }

      if (JOB_BSNS_CD === "AE00") {
        datainer.value.RCV_TYPE = "E"
        commonSearchApi({
          queryId: "SAFBA0010_SEARCH_06",
          param: Location,
        }).then((res) => {
          let filter = res.ORESULT_CUR.filter((x) => x.LOCOD === "E")
          codeList.WorkNo = filter
          codeList.WorkNo.unshift({
            SHIP_KIND_NM: "",
            WORK_NO: "",
            SHIP_CAPA: "",
          })
        })
      }
      if (JOB_BSNS_CD === "AC00") {
        RCV_TYPE = datainer.value.RCV_TYPE = "C"

        commonSearchApi({
          queryId: "SAFBA0010_SEARCH_06",
          param: Location,
        }).then((res) => {
          let filter = res.ORESULT_CUR.filter(
            (x) => x.LOCOD === datainer.value.RCV_TYPE
          )
          codeList.WorkNo = filter
          codeList.WorkNo.unshift({
            SHIP_KIND_NM: "",
            WORK_NO: "",
            SHIP_CAPA: "",
          })
        })
      }
      if (JOB_BSNS_CD === "AQ00") {
        RCV_TYPE = datainer.value.RCV_TYPE = "Q"
        if (datainer.value.RCV_TYPECheck) {
          commonSearchApi({
            queryId: "SAFBA0010_SEARCH_06",
            param: Location,
          }).then((res) => {
            let filter = res.ORESULT_CUR.filter(
              (x) => x.LOCOD === datainer.value.RCV_TYPE
            )
            codeList.WorkNo = filter
            codeList.WorkNo.unshift({
              SHIP_KIND_NM: "",
              WORK_NO: "",
              SHIP_CAPA: "",
            })
          })
        } else {
          commonSearchApi({
            queryId: "SAFBA0010_SEARCH_06",
            param: Location,
          }).then((res) => {
            let filter = res.ORESULT_CUR.filter((x) => x.LOCOD === "C")
            codeList.WorkNo = filter
            codeList.WorkNo.unshift({
              SHIP_KIND_NM: "",
              WORK_NO: "",
              SHIP_CAPA: "",
            })
          })
        }
      } else {
        datainer.value.RCV_TYPE = JOB_BSNS_CD.substring(1, 2)
      }

    }

    if (PLC) {
      // JOB_LPLC가 "B"인 경우
      setLocation(datainer.value)

    }
  }
)

// 관리감독자 변경시 휴대폰번호 및 TRS 변경 
watch(
  () => datainer.value.MNGR_EMP_NO,
  (newValue) => {
    if (isMngr.value) {
      if (codeList.MNGR_EMP_NO) {
        let filter = codeList.MNGR_EMP_NO.filter(
          (x:any) => x.APP_EMP_NO === newValue
        )
        if (filter.length !== 0) {
          datainer.value.MNGR_HP_NO = filter[0].APP_TEL_NO
          datainer.value.MNGR_TRS_NO = filter[0].APPRO60
        }
      }
    }
  }
)



defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    transition="dialog-bottom-transition"
    fullscreen
  >
  
  <div class="title-bar"> 일반공사 위험작업허가서(PTW)작성</div>



  <v-card class="pa-0 fill-height rounded-b-5 d-flex flex-row">
    <v-col class = "scroll-container" cols="2"> 
      <div class = "d-flex justify-end">      
        <v-btn v-if = "!ReadOnly"  @click.stop = "ApplyALL()" @keydown.enter.stop.prevent> 
         모두신청 
        </v-btn>
      </div>
      <PerfectScrollbar class = "scroll-box">
        <div 
        v-for="(card, index) in cards"
        class = "ptwcard d-flex flex-column justify-space-between"
        :class="{ selected: selectedIndex === index }"
        @click="card.RCV_NO? selectCard(index, false):  selectCard(index, true) "
        >   
          <v-btn
            icon
            size="x-small"
            class="delete-card-btn"
            color="error"
            @click.stop="deleteCard(index)"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
          <div class = "rcvno"> 
            허가번호: {{ card.RCV_NO ? card.RCV_NO : '신규' }} 
            <br> 
            진행상태: {{ card.STATUS_NM }} 
          </div>
          <div class = "d-flex justify-center ptwnm"> {{ card.WRK_DIST }}  </div>
          <div class = "d-flex flex-row justify-center"> 
            <v-btn   v-if = "!ReadOnly" @click.stop = "onButtonsClick({id: 'btncopy'})"> 복사 </v-btn>

          </div>
       
        </div>
        <div v-if = "!ReadOnly " class = "ptwcard d-flex flex-column justify-space-between "  @click="onButtonsClick({id: 'btnnew'})">         
           <div class = "d-flex justify-center plus1"> + </div>
           <div class = "d-flex justify-center plus2"> 추가 작성 </div>
        </div>

      </PerfectScrollbar>
   </v-col>
    <v-col  cols="10">
      <v-card-title class="pa-4 pb-2 d-flex align-center justify-space-between">
        <div style="font-weight: bold">
          허가서 번호: {{  datainer.RCV_NO ? datainer.RCV_NO  : '신규'   }}
        </div>
        <div>       
          <v-btn  v-if = "datainer.STATUS == '25' && !ReadOnly"  
                  @click = "AcceptProcess(datainer, true)" 
                  :disabled="!(datainer.STATUS == '25')"> 
                  승인 </v-btn>
          <v-btn  v-if = "datainer.STATUS == '50' && !ReadOnly" 
                  @click = "CancleAccept(datainer)"> 
                  승인 취소 </v-btn>
          <v-btn  v-if = "datainer.STATUS == '50' || datainer.STATUS == '35'" 
                  @click = "PrintOut(datainer)"> 
                  출력 </v-btn>

          <v-btn  v-if = "(datainer.STATUS == '20' || datainer.STATUS == '21') && !ReadOnly " 
                  @click = "ApplyProcess(datainer, true, true)" 
                  :disabled="datainer.STATUS != '20' && datainer.STATUS != '21' "> 
                  신청 </v-btn>
          <v-btn  v-if = "datainer.STATUS == '25'&& !ReadOnly"
                  @click = "CancleApply(datainer)" > 
                  신청 취소 </v-btn>
          <v-btn  @click = "onButtonsClick({id: 'btnUpdate'})" 
                 :disabled="(datainer.STATUS != '20' && datainer.STATUS != '21') || ReadOnly   " >
                  저장 </v-btn>
          <v-btn  @click = "onButtonsClick({id: 'btnClose'})">
                   닫기 </v-btn>


        </div>

      </v-card-title>
      <v-card class="content-area">
        <!-- 기본 정보 --> 
        <v-card class="mb-3 mx-3 popUp-input-Form">
          <v-card-title class="pa-0">
            <v-sheet class="d-flex flex-row mt-3">
              <h4 style="width: 388px;"> ① 기본 정보</h4>
              <span style="color: #ef5350; font-size: 13px;">
                ※ 다른 사업부의 장소에서 작업이 이루어지는 경우 '작업 사업부' 변경바랍니다.
              </span>
            </v-sheet>
          </v-card-title>
          
          <v-card-text class="pa-0">
            <v-sheet class="d-flex flex-row mt-3">
              <v-row>
                <v-col cols="12" xl="5" class="d-flex flex-row ">
                  <i-input
                    width="388px"
                    top-label
                    :label="'소속조직'"
                    append-inner-icon="mdi-magnify"
                    v-model="datainer.DEPT_NM"
                    @keydown.enter="
                      (e:string) => {
                        openSelectPopup('소속')
                      }
                    "
                    @click="openSelectPopup('소속')"
                    required     
                    readonly
                    :disabled="disabledSTATUS"
                    margin="4px"
                  />
                  <i-select
                    width="200px"
                    top-label
                    :label="t(`작업 사업부`)"
                    v-model="datainer.JOB_BSNS_CD"
                    :items="codeList.bsnsCd"
                    item-title="BSNS_NM"
                    item-value="BSNS_CD"
                    margin="20px"
                    required
                    :disabled="disabledSTATUS"
                    :readonly="disabledSTATUS"
                  />
                  <div v-if="datainer.JOB_BSNS_CD === 'AQ00'" style="width: 175px">
                    <v-radio-group
                      v-model="datainer.RCV_TYPECheck"
                      :readonly="disabledSTATUS"
                      inline
                      style="margin-top: 20px; width: "
                    >
                      <v-radio
                        label="해양공사"
                        :value="true"
                        style="margin-right: 20px !important"
                      />
                      <v-radio label="호선" :value="false" />
                    </v-radio-group>
                  </div>
                </v-col>
                <v-col cols="12" xl="7" class="d-flex flex-row">
                  <i-input
                    v-if="!isMngr"
                    v-model="datainer.MNGR_EMP_NM"
                    width="140px"
                    top-label
                    :label="
                      datainer.WRK_DIV === 'B' // 건설공사
                        ? t('공사감독자(승인자)')
                        : t('관리감독자(승인자)')
                    "
                    append-inner-icon="mdi-magnify"
                    @keydown.enter="
                      (e) => {
                        openSelectPopup('관리자')
                      }
                    "
                    @click="openSelectPopup('관리자')"
                    margin="4px"
                    required
                    :disabled="disabledSTATUS"
                    readonly
                  />
                  <!--   관리감독자가 있을경우 -->
                  <i-select
                    v-if="isMngr"
                    required
                    v-model="datainer.MNGR_EMP_NO"
                    width="140px"
                    top-label
                    :label="
                      datainer.WRK_DIV === 'B'
                        ? t('공사감독자(승인자)')
                        : t('관리감독자(승인자)')
                    "
                    :items="codeList.MNGR_EMP_NO"
                    item-title="APP_EMP_NM"
                    item-value="APP_EMP_NO"
                    margin="4px"
                    :disabled="disabledSTATUS"
                  />
                  <i-input
                    v-model="datainer.MNGR_HP_NO"
                    width="130px"
                    top-label
                    :label="t('휴대폰기입')"
                    phone
                    margin="4px"
                    required
                    :readonly="disabledSTATUS || isMngr"
                  />
                  <i-input
                    v-model="datainer.MNGR_TRS_NO"
                    width="130px"
                    top-label
                    :label="t('TRS기입')"
                    :readonly="disabledSTATUS"
                  />
                </v-col>
              </v-row>
            </v-sheet>
        
          </v-card-text>
        </v-card>


        <!-- 허가서 정보 -->
        <v-row class="mx-3 mb-3 layout-responsive" dense>
          <!-- 왼쪽: 작업 정보 -->
          <v-col cols="12" lg="6" >
            <v-card class="popUp-input-Form">
              <v-card-title class="pa-0">
                <div class="d-flex flex-row justify-space-between align-center mb-3">
                  <h4>② 작업 정보</h4>
                  <span 
                      @click="openSelectPopup('허가서 불러오기')"
                      :class="{'quick-set-link': !disabledSTATUS, 'quick-set-link-disabled': disabledSTATUS}"
                      style="font-size: 13px; cursor: pointer; text-decoration: underline; margin-right: 10px;"
                    >
                      허가서 불러오기
                  </span>
                </div>
                <v-row class="py-2 ptwinfocol">
                  <v-col cols="12" class="d-flex align-center pa-0 " >
                    <div class="ptwinfolabel">
                      PTW 작업명
                      <v-icon
                        class="required-icon"
                        size="23"
                        color="red"
                        icon="mdi-circle-small"
                      />
                    </div>
        
                    <i-input
                      width=""
                      style="flex: 1"
                      append-inner-icon="mdi-magnify"
                      v-model="datainer.WRK_DIST"
                      @click="openSelectPopup('PTW작업명')"
                      required
                      readonly
                      :disabled="disabledSTATUS"
                      margin="0"
                    />
                  </v-col>
                </v-row>

                <v-row class="py-2 ptwinfocol">
                  <v-col cols="12" md="6" class="d-flex align-center pa-0 pr-md-2">
                    <div class="ptwinfolabel">
                      허가구분
                    </div>
                    <i-input
                      width=""
                      style="flex: 1; max-width: 100%;"
                      v-model="datainer.CF_DIV_NM"
                      readonly
                      disabled
                      margin="0"
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center pa-0 pl-md-2">
                    <div class="ptwinfolabel">
                      3중점검대상
                    </div>
                    <i-input
                      width=""
                      style="flex: 1; max-width: 100%;"
                      v-model="datainer.THREECHECKYN"
                      readonly
                      disabled
                      margin="0"
                    />
                  </v-col>
                </v-row>


                <v-row class="py-2 ptwinfocol">
                  <v-col cols="12" class="d-flex align-center pa-0">
                    <div class="ptwinfolabel">
                      작업 상세
                      <v-icon
                        class="required-icon"
                        size="23"
                        color="red"
                        icon="mdi-circle-small"
                    />
                    </div>
      
                    <i-input
                      width=""
                      style="flex: 1"
                      v-model="datainer.WORK_DETAIL"
                      :readonly="disabledSTATUS"
                      margin="0"
                    />
                  </v-col>
                </v-row>

                <v-row class="py-2 ptwinfocol">
                  <v-col cols="12" md="6" class="d-flex align-center pa-0 pr-md-2">
                    <div class="ptwinfolabel">
                      작업책임자
                      <v-icon
                        class="required-icon"
                        size="23"
                        color="red"
                        icon="mdi-circle-small"
                      />
                    </div>
                    <i-input
                      width=""
                      style="flex: 1; max-width: 100%;"
                      append-inner-icon="mdi-magnify"
                      v-model="datainer.RESP_EMP_NM"
                      :readonly="disabledSTATUS"
                      @click="openSelectPopup('작업책임자')"
                      margin="0"
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center pa-0 pl-md-2">
                    <div class="ptwinfolabel">
                      공사담당자
                    </div>
                    <i-input
                      width=""
                      style="flex: 1; max-width: 100%;"
                      append-inner-icon="mdi-magnify"
                      v-model="datainer.REQ_EMP_NM"
                      :readonly="disabledSTATUS"
                      @click="openSelectPopup('공사담당자')"
                      margin="0"
                    />
                  </v-col>
                </v-row>


                <v-row class="py-2 ptwinfocol">
                  <v-col cols="12" class="d-flex align-center pa-0">
                    <div class="ptwinfolabel">
                      유해위험요소                <v-icon
                        class="required-icon"
                        size="23"
                        color="red"
                        icon="mdi-circle-small"
                    />
                    <br>(전달사항)
      
                    </div>
      
                    <i-input
                      width=""
                      style="flex: 1"
                      v-model="datainer.DNGR_RSN"
                      :readonly="disabledSTATUS"
                      margin="0"
                    />
                  </v-col>
                </v-row>
                

                <v-row class="py-2 ptwinfocol">
                  <v-col cols="12" md="6" class="d-flex align-center pa-0 ">
                    <div class="ptwinfolabel">
                      작업인원
                      <v-icon
                        class="required-icon"
                        size="23"
                        color="red"
                        icon="mdi-circle-small"
                      />
                    </div>
                    <i-input
                      width=""
                      style="flex: 1; max-width: 100%;"
                      v-model="datainer.WORKER_CNT"
                      :readonly="disabledSTATUS"
                      number
                      margin="0"
                      placeholder="인원수(숫자만)"
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center pa-0 pl-md-2 ">
                    <div class="ptwinfolabel">
                      작업표준서
   
                    </div>
                    <i-input
                      width=""
                      style="flex: 1; max-width: 100%;"
                      append-inner-icon="mdi-magnify"
                      v-model="datainer.WRK_STD_NM"
                      readonly
                      :disabled="disabledSTATUS"
                      @click="openSelectPopup('작업표준서')"
                      margin="0"
                    />
                  </v-col>

                </v-row>

                <v-row  class="d-flex flex-row py-2 ptwinfocol">
                  <div class="ptwinfolabel d-flex align-start justify-start" >
                    추가 정보
                  </div>
                  <div class="ml-2">
                    <v-row class="mt-1 d-flex flex-row">
                      <div class="addInfo">
                        <span style="font-size: 13px; font-weight: bold"
                          >밀폐구역여부</span
                        >
                        <v-radio-group
                          inline
                          style="margin-top: 4px"
                          v-model="datainer.CONFINED_YN"
                          :disabled="disabledSTATUS"
                        >
                          <v-radio label="해당" value="Y"></v-radio>
                          <v-radio label="미해당" value="N"></v-radio>
                        </v-radio-group>
                      </div>

                      <div class="addInfo">
                        <span style="font-size: 13px; font-weight: bold"
                          >아르곤이용작업</span
                        >
                        <v-radio-group
                          style="margin-top: 4px; font-size:10px"
                          inline
                          v-model="datainer.ARGN_YN"
                          :disabled="disabledSTATUS"
                        >
                          <v-radio label="해당" value="Y"></v-radio>
                          <v-radio label="미해당" value="N"></v-radio>
                        </v-radio-group>
                      </div>

                      <div class="addInfo">
                        <span style="font-size: 13px; font-weight: bold"
                          >수전구역여부</span
                        >
                        <v-radio-group
                          inline
                          style="margin-top: 4px"
                          v-model="datainer.ELEC_YN"
                          :disabled="disabledSTATUS"
                        >
                          <v-radio label="해당" value="Y"></v-radio>
                          <v-radio label="미해당" value="N"></v-radio>
                        </v-radio-group>
                      </div>
                    </v-row>

                    <v-row class="mt-1 d-flex flex-row"
                          style="margin-bottom:50px">
                      <div class="addInfo">
                        <span style="font-size: 13px; font-weight: bold"
                          >고소작업</span
                        >
                        <div class="d-flex align-center">
                          <div style="width: 134px" class="mr-5">
                            <v-radio-group
                              inline
                              style="margin-top: 4px; font-size:9px"
                              v-model="datainer.HEIGHT_YN"
                              :disabled="disabledSTATUS"
                            >
                              <v-radio label="해당" value="Y"></v-radio>
                              <v-radio label="미해당" value="N"></v-radio>
                            </v-radio-group>
                          </div>
                        </div>
                        <v-row class="align-center">
                        <i-input
                            width="60px"
                            v-model="datainer.HEIGHT"
                            number
                            :disabled="datainer.HEIGHT_YN !='Y' || disabledSTATUS"
                            margin="4px"
                          /><span style="font-size: 12px;">미터</span>
                        </v-row>
                      </div>
                      <div class="addInfo">
                        <span style="font-size: 13px; font-weight: bold"
                          >압력테스트</span
                        >
                        <div class="d-flex align-center">
                          <div style="width: 134px" class="mr-5">
                            <v-radio-group
                              inline
                              style="margin-top: 4px; font-size:9px"
                              v-model="datainer.PRESSURE_YN"
                              :disabled="disabledSTATUS"
                            >
                              <v-radio label="해당" value="Y"></v-radio>
                              <v-radio label="미해당" value="N"></v-radio>
                            </v-radio-group>
                          </div>
                        </div>
                        <v-row class="align-center">
                        <i-input
                            width="60px"
                            v-model="datainer.PRESSURE"
                            number
                            :disabled="datainer.PRESSURE_YN !='Y' || disabledSTATUS"
                            margin="4px"
                          /><span style="font-size: 12px;">Bar/kg</span>
                        </v-row>
                      </div>

                      <div class="addInfo">
                        <span style="font-size: 13px; font-weight: bold"
                          >압력테스트(PIPE)</span
                        >
                        <div class="d-flex align-center">
                          <div style="width: 134px" class="mr-5">
                            <v-radio-group
                              inline
                              style="margin-top: 4px; font-size:9px"
                              v-model="datainer.PIPE_DIA_YN"
                              :disabled="disabledSTATUS"
                            >
                              <v-radio label="해당" value="Y"></v-radio>
                              <v-radio label="미해당" value="N"></v-radio>
                            </v-radio-group>
                          </div>
                        </div>
                        <v-row class="align-center">
                        <i-input
                            width="60px"
                            v-model="datainer.PIPE_DIA"
                            number
                            :disabled="datainer.PIPE_DIA_YN !='Y' || disabledSTATUS"
                            margin="4px"
                          /><span style="font-size: 12px;">인치</span>
                        </v-row>
                      </div>



                    </v-row>
                  </div>
                </v-row>

              </v-card-title>
            </v-card>
          </v-col>

          <!-- 오른쪽: 작업 일시 + 작업 장소 -->
          <v-col cols="12" lg="6" class="d-flex flex-column">

            <v-card class="popUp-input-Form flex-grow-1 mb-3 plccard">
              <v-card-title class="pa-0">
                <div class="d-flex align-center justify-space-between">
                  <h4>③ 작업 장소</h4>
                  <div>
                    <span 
                      v-if="!disabledSTATUS"
                      @click="LWPClick"
                      :class="{'quick-set-link': !disabledSTATUS, 'quick-set-link-disabled': disabledSTATUS}"
                      style="font-size: 13px; cursor: pointer; text-decoration: underline; margin-right: 10px;"
                    >
                    즐겨찾기 장소등록
                  </span>
                  <span 
                      v-if="!disabledSTATUS"
                      @click="LWPOpen"
                      :class="{'quick-set-link': !disabledSTATUS, 'quick-set-link-disabled': disabledSTATUS}"
                      style="font-size: 13px; cursor: pointer; text-decoration: underline; margin-right: 10px;"
                    >
                    즐겨찾기 불러오기
                  </span>


                  </div>
                </div>
              </v-card-title>
              <div class="d-flex flex-column mt-3 mb-1 align-start ">
                 <i-input
                  v-model="datainer.JOB_PLC"
                  :label="t('장소')"
                  labelWidth = "70px"
                  width="250px"
                  append-inner-icon="mdi-magnify"
                  @keydown.enter="
                    (e) => {
                      openCCP()
                    }
                  "
                  @click="openCCP()"
                  required
                  readonly
                  :disabled="disabledSTATUS"
                />

                <div class="d-flex align-center justify-space-between" style="width: 100%;">
              
                  <p class="mr-2" style=" width:70px; font-size: 14px; color: #222">
                    {{ $t("호선/공사") }}
                  </p>
                  <v-select
                    style="width: 170px; max-width: 170px; min-width: 170px; flex-shrink: 0; flex-grow: 0;"
                    v-model="datainer.WORK_NO"
                    :items="codeList.WorkNo"
                    item-value="WORK_NO"
                    :item-props="itemProps"
                    :disabled="
                      (datainer.JOB_BSNS_CD === 'AE00' ||
                      datainer.JOB_BSNS_CD === 'AC00' ||
                      datainer.JOB_BSNS_CD === 'AQ00'
                        ? false
                        : true) 
                      || disabledSTATUS
                      || datainer.WORK_NO_EXIST === 'Y'
                    "
                  />
                  <v-checkbox
                    :label="$t('호선/프로젝트 미관련 작업')"
                    true-value="Y"
                    false-value="N"
                    v-model="datainer.WORK_NO_EXIST"
                    class="ml-5"
                    :disabled="
                      (datainer.JOB_BSNS_CD === 'AE00' ||
                      datainer.JOB_BSNS_CD === 'AC00' ||
                      datainer.JOB_BSNS_CD === 'AQ00'
                        ? false
                        : true) || disabledSTATUS
                    "
                  />
                  <div class="d-flex" style="margin-left: auto">
                    <v-btn
                      variant="outlined"
                      @click="onButtonsClick({id: 'btnADD_LOCATION'})"
                      :disabled="disabledSTATUS"
                      >위치 추가</v-btn
                    >
                    <v-btn
                      variant="outlined"
                      @click="onButtonsClick({id: 'btnDELETE_LOCATION'} )"
                      :disabled="disabledSTATUS"
                      >위치 삭제</v-btn
                    >
                  </div>

                </div> 
              </div>

              <v-card-text class="pa-0">
                <!-- TYPE B  -->
                <RealGrid
                  v-if="datainer.LOCATIONTYPE == 'B' || datainer.LOCATIONTYPE == ''"
                  class="mt-1"
                  ref="grdSub1"
                  style="height: 160px"
                  :grid-view-option="grdProps2.gridViewOption"
                  :keys="grdProps2.keys"
                  :fields="grdProps2.fields"
                  :columns="grdProps2.columns"
                />
                <!-- TYPE D -->
                <RealGrid
                  v-if="datainer.LOCATIONTYPE == 'D'"
                  class="mt-1"
                  ref="grdSub1_1"
                  style="height: 160px"
                  :grid-view-option="grdProps2_1.gridViewOption"
                  :keys="grdProps2_1.keys"
                  :fields="grdProps2_1.fields"
                  :columns="grdProps2_1.columns"
                />
                <!-- TYPE E -->
                <RealGrid
                  v-if="datainer.LOCATIONTYPE == 'E'"
                  class="mt-1"
                  ref="grdSub1_2"
                  style="height: 160px"
                  :grid-view-option="grdProps2_2.gridViewOption"
                  :keys="grdProps2_2.keys"
                  :fields="grdProps2_2.fields"
                  :columns="grdProps2_2.columns"
                />
                <i-textarea
                  v-if="datainer.LOCATIONTYPE == 'B' || datainer.LOCATIONTYPE == 'C'"
                  :label="$t('위치 상세내용')"
                  width="100%"
                  topLabel
                  v-model="datainer.JOB_PLC_DTL"
                  class="mt-2"
                  :disabled="disabledSTATUS"
                />
              </v-card-text>
            </v-card>


            <v-card class=" popUp-input-Form flex-grow-1 plancard">
              <v-card-title class="pa-0">
                <div class="d-flex flex-row justify-space-between align-center mb-3">
                  <h4>④ 작업 일시</h4>
                  <div class="d-flex align-center gap-2">
                    <span 
                      @click="setThreeDays"
                      :class="{'quick-set-link': !disabledSTATUS, 'quick-set-link-disabled': disabledSTATUS}"
                      style="font-size: 13px; cursor: pointer; text-decoration: underline; margin-right: 10px;"
                    >
                      내일부터 3일
                    </span>

                    <v-btn
                      @click="openDate"
                      class="mr-5"
                      variant="outlined"
                      style="font-size: 14px"
                      :disabled="disabledSTATUS">설정
                    </v-btn>
                  </div>
                </div>
         
                <!-- <div
                    v-if = "datainer.URGENT_YN === 'Y'"
                    style = "font-size: 14px ;color: red;  margin-bottom: 5px; "> 
                    ※ 긴급작업 여부: {{ datainer.URGENT_YN  }}
                </div> -->

                <v-checkbox
                    label= "긴급작업 여부"
                    true-value="Y"
                    false-value="N"
                    v-model="datainer.URGENT_YN"
                    class="ml-1 mb-1"
                    :disabled="disabledSTATUS"
                   />

                <v-card-text class="pa-0 d-flex align-center">

                  <div class="input-wrapper">
                    <div
                      v-for="(item, index) in datainer.PLANDATA"
                      :key="index"
                      class="input-set"
                    >
                      <div
                        class="text-center"
                        :class="item.CANCELED_YN === 'Y' ? 'custom-input1' : 'custom-input2'"

                      >
                        {{item.dt.replace(" ","") }}
                      </div>
                      <div
                        class="text-center"
                        :class="item.CANCELED_YN === 'Y' ? 'custom-input1' :  'custom-input2'"
                      >
                        {{item.time.replace(" ","") }}
                      </div>
                      
                    </div>
                  </div>
              </v-card-text>




              </v-card-title>
            </v-card>




          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-card>





    <SAFBA0010WRK_STD ref="WrkPopup" @selected="WrkSelected1($event)" />
    <SAFBA0010WRK_STD2 ref="WrkPopup2" @selected="WrkSelected2($event)" />
    <SAFBA0010LikeWrkPlace ref="LikeWrkPlace" @seleted="WRKLIKE($event)"  />
    <CommonCodePopUpSAF ref="CCP" @selected="onPlcSelected" /> 
    <WorkPlace ref="workPlacePopUp" @selected="workPlaceSelected($event)" />
    <SafeAppPopUp ref="SafeAppPop" @upData="SafeAppComplished($event)" />
    <DatePopUp ref="DatePop" @upData="onDateSelected($event)" />
     <!-- <SAFBA0010WorkPlanPopup ref="WorkPlanPopup" @selected="RtnWorkPaln($event)" /> -->
    <!-- 작업계획서 -->
    <!-- <SAFBA0010WorkPlanPopup ref="WorkPlanPopup" @selected="RtnWorkPaln($event)" /> -->

    <!-- <WorkPlace ref="workPlacePopUp" @selected="workPlaceSelected($event)" />
    <SAFBA0010LikeWrkPlace ref="LikeWrkPlace" @seleted="WRKLIKE($event)"  />
    <DatePopUp ref="DatePop" @upData="onDateSelected($event)" />
    <SafeAppPopUp ref="SafeAppPop" @upData="SafeAppComplished($event)" />
    <dangi ref="dangiPopUp" @selected="dangiSelect($event)" />
    <CommonCodePopUpSAF ref="CCP" @selected="selected" /> -->
    <!-- 부서/ 협력사 팝업 -->
     <DeptPopup ref="deptPopup" @selected="onDeptSelected" /> 
    <!--담당자 팝업-->
     <EmpPopup ref="empPopup" @selected="onEmpSelected" /> 
    
     <PtwPopup
      ref="ptwPopup"
      @selected="onPtwSelected" 
      :datainer="datainer"
      :codeList="codeList"
     /> 

     <RcvPopup
      ref="rcvPopup"
      @selected="onRcvSelected" 
      :datainer="datainer"
      :codeList="codeList"
     /> 

    <OZReport
      :showPop="showOz"
      :MultiArr="params"
      :isMulti="(isMulti = true)"
      @close="showOz = $event"
      @falseMulti="isMulti = $event"
    />
    
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 139px);
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
h4 {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}

.ptwinfolabel{
  font-size: 15px;
  width: 95px;
  min-width: 95px;
  flex-shrink: 0;
  margin-left: 10px;
  align-content: center;
 
  border-right: 2px solid #a8a8a8a8;
  margin-right: 30px;
}

.ptwinfocol{
  margin-right: 0px !important;
}

.required-asterisk{
  color: #ef5350;
  margin-left: 4px;
  font-size: 12px;
}

.required-icon{
  margin-left: -8px;
  margin-bottom: 8px;
}


.addInfo {
  margin-right: 30px;
  width: 160px;
  height: 71px;
}

.custom-input1 ::v-deep div {
  background-color: rgba(200, 200, 200, 0.1);

}

.custom-input2  {
  background-color: rgb(255, 255, 255);

}
.ptwcard{
 height: 150px;
 background-color: rgb(255, 255, 255);
 border: 2px solid #a8a8a8a8;
 border-radius: 20px;
 margin-top: 7px;
 margin-bottom: 7px;
 transition: box-shadow 0.3s ease, transform 0.2s ease;
 padding: 10px;
 position: relative;

}
.ptwcard:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); /* 살짝 음영 */
  transform: translateY(-3px); /* 살짝 위로 떠오르게 */
  cursor: pointer;
}

/* 클릭 시 (선택된 상태) */
.ptwcard.selected {
  background-color: #6aa1d56f; /* 흐린 하늘색 */
  box-shadow: none;
  transform: none;
}

/* 카드 삭제 버튼 */
.delete-card-btn {
  position: absolute !important;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-card-btn:hover {
  opacity: 1;
}

.rcvno{
  font-size: 13px;
  font-weight: bold;
}

.ptwnm{

}
.plus1{
  font-size: 90px;
  margin-top: -20px;
  margin-bottom: -20px;
  color: #464646a0;
}

.plus2{
  font-size: 20px;
}

.scroll-container {
  height: 700px;
  border-right: 2px solid #a8a8a8a8;
  // margin: 10px;
  // border: 2px solid #a8a8a8a8;
  //background-color: #062f8731;
}

.plcbtn{
  color: blue
}

.scroll-box {
  margin-top: 20px;
  height: 95%; /* PerfectScrollbar가 부모 높이를 모두 차지하게 */
}

/* 크롬/사파리용 커스텀 스크롤바 */
.scroll-box::-webkit-scrollbar {
  width: 8px;
}

.scroll-box::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 4px;
}

.scroll-box::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}


.plancard{
  height: 190px;
}
.input-wrapper {
  display: flex;
  flex-wrap: wrap;  /* 세트 단위로 줄바꿈 */
  gap:7px;        /* 세트 간 간격 */
  width: fit-content;
}

.input-set {
  display: flex;
  flex-direction: column; /* 위: dt, 아래: time */
  gap: 4px;               /* 위아래 간격 */
  align-items: center;    /* 가운데 정렬 */
}

.text-center {
  width: 89px;
  height: 30px;
  text-align: center;
  line-height: 30px; /* height와 동일하게 설정 */
  color: #888;
  border-radius: 10px;
}

.quick-set-link {
  color: #1976d2;
  transition: color 0.2s ease;
}

.quick-set-link:hover {
  color: #1565c0;
  text-decoration: underline !important;
}

.quick-set-link-disabled {
  color: #9e9e9e;
  cursor: not-allowed !important;
  text-decoration: none !important;
}
</style>
