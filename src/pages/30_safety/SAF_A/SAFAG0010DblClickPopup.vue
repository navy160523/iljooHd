<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황  더블클릭팝업-->
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { useLogsStore } from '@hiway/stores/logs'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import SAFAG0010DblClickPopupYoYang from '@/pages/30_safety/SAF_A/SAFAG0010DblClickPopupYoYang.vue'
import SAFAG0010SaupjangPopup from '@/pages/30_safety/SAF_A/SAFAG0010SaupjangPopup.vue'
import Message from '@hiway/utils/notify'
import AcdtPopup from '@/components/popup/AcdtPopup.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import { useRoute, useRouter } from 'vue-router'
import OZReport from '@/components/OZReport.vue'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow', 'closed', 'deleted'])
const router = useRouter()
const fileCmpny = ref(false)
// OzReport 팝업 여부
const showOz = ref(false)
const watchflag = ref(false)

const reportName = ref('')
const params = ref([])
const dialog = ref(false)
const menuTitle = ref(null)
const grdPopUp = ref(null)
const grdPop1 = ref(null)
const popEmp = ref()
const fileUpload = ref(null)
const DblClickPopupYoYang = ref(null)
const SaupjangPopup = ref(null)
const sendMail1 = ref(null)
const sendMail2 = ref(null)
const acdtPopupRef = ref(null)

// 데이터 바인딩
const SaveData = reactive({})
const fiterData = reactive({})
const fileUpload2 = ref(null)
// 이메일 Y:N
//const readOnlyValue = ref(false)
// 종결발송 Y:N
const ISENDEMAILDTE = ref(false)
let saved = false

// 메일전송
const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  // HIDDEN_REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})

const readOnlyValue = reactive({
  ISEMAILDTESEND: false,
  ISENDEMAILDTE: false,
})

//종결예정일 좌측 체크박스값
const endDteFlag = reactive({
  FLAG: 'N',
})

const sanJeField = reactive({
  KOR_NM: '', //재해자성명
  EMPLNO: '', //재해자사번
  REG_NO: '', //주민번호
  TELNO1: '', //연락처
  ADDR: '', //주소
  DEPT_NM: '', //부서명
  JOB_TIT_NM: '', //직위
  HLD_OFFI_GBN: '', //재직구분
  RETI_TMP_DATE: '', //퇴직일자
  COM_ENT_DATE: '', //입사일자
  UNT_DUTY_NM: '', //직무
  SANGBN: '', //산재구분
  YOGBN: '', //요양구분
  SJE_TYPE_CD: '', //요양내용
  REQGBN: '', //신청구분
  SAGONO: '', //사고번호
  OCCURDATE: '', //재해일시
  OCCURTIME: '', //재해시간
  SAGOTYPE_NM1: '', //사고형태(대)
  SAGOTYPE_NM2: '', //사고형태(중)
  SAGOTYPE_NM3: '', //사고형태(소)
  SAGOTYPE: '', //
  SANG_CD: '', //상병코드
  INJURYTYPE: '', //상해종류
  INJURYPART: '', //상해부위
  SAGOLOC: '', //사고위치
  CMPNY_DIV: '', //회사구분
  SAGO_CMPNY_DIV: '', //사고회사구분
  UNION_YN: '', //노조가입여부
  SAGOGAEYO: '', //사고개요
  SANGBYUNG: '', //상병명
  BIGO: '', //비고
  STATUS: '', //진행상태
  SANOK: '', //승인여부
  OKDTE: '', //승인일자
  FILENUM: '', //파일번호
  REQDTE: '', //신청일자
  GAINUM: '', //가입번호
  EMAILDTE: '', //승인발송일
  YOSTART: '', //요양시작일
  FROMDTE1: '', //입원기간 FROM
  TODTE1: '', //입원기간 TO
  FROMDTE2: '', //통원기간 FROM
  TODTE2: '', //통원기간 TO
  HOSPITAL: '', //요양기관
  YODAY_CNT: '', //요양일수
  TARGETDTE: '', //종결(예정)일
  ENDDTE: '', //종결일
  WORK_HEAL_GBN: '', //취업치료 구분
  WORK_HEAL_DT: '', //취업치료 시작일
  ENDEMAILDTE: '', //종결발송일
  HUDTE: '', //휴직일자
  HUDAY: '', //휴직일수
  SALARYDTE: '', //산정기준일
  SALARY: '', //평균임금
  YOBIGO: '', //휴직일자 밑 비고
  ADD_DESC: '', //추가내용
  HAP_STATUS: '', //합의상태
  HAPDTE: '', //합의일
  GRADE: '', //장해등급
  HAPAMT: '', //합의금
  BANK: '', //은행
  GRADEDTE: '', //등급판정일
  HAPBIGO: '', //위로금현황 비고
  BE_BIGO: '', //비급여현황비고
  RESULT_FILE_ID: '', //결과 통보서 첨부파일 아이디
  FILE_ID: '', //산재유첨 파일아이디
  SANNO: '', //산재번호
  BSNS_CD: '', //사업부
  BSNS_NM: '', //사업부이름
  DEPT_CD: '', //부서
  DEPT_NM: '', //부서이름
  HAP_YN: '', //합의여부 Y,N
  AUTO_SALARYDTE: '',
})

const codeList = reactive({
  REQGBN: [], //신청구분
  SANGBN: [], //산재구분
  YOGBN: [], //요양구분
  SJE_TYPE_CD: [], //산재구분(업무상사고,업무상질병,출퇴근재해)
  GAINUM: [], //가입코드
  INJURYTYPE: [], //상해종류
  INJURYPART: [], //사고형태
  CMPNY_DIV: [], //회사구분
  SAGO_CMPNY_DIV: [], //사고회사구분
  STATUS: [], //진행상태
  HAP_STATUS: [], //합의금 진행상태
  WORK_HEAL_GBN: [], //취업치료구분
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴직' },
    { COD: '4', TXT: '입대' },
  ], //재직구분
  CodeOfSang: [
    { TXT: '사고', COD: 'S' },
    { TXT: '근골', COD: 'M' },
    { TXT: '화상', COD: 'T' },
    { TXT: '진폐', COD: 'C' },
  ],
})

const initCodeList = (rowData) => {
  let acdtParms = reactive({
    CMPNY_DIV: 'HHI',
    ALL_UP_CD: 'HHIB010',
    USE_FLAG: 'Y',
  })

  Promise.all([
    //신청구분 조회
    getCodeList('HHIB250010'),
    //산재구분 조회
    getCodeList('HHIB250030'),
    //요양구분 조회
    getCodeList('HHIB250020'),
    //산재구분 조회(업무상 사고,업무상 질병,출퇴근 재해)
    getCodeList('HHIB080'),
    //가입코드 조회
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_04',
      param: {
        CMPNY_DIV: rowData.CMPNY_DIV == '100' ? 'HHI' : rowData.CMPNY_DIV,
      },
    }),
    //상해종류 조회
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_05',
      param: {
        CMPNY_DIV: rowData.CMPNY_DIV == '100' ? 'HHI' : rowData.CMPNY_DIV,
        CODE: 'B030',
      },
    }),
    //사고형태 조회
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_01',
      param: {
        CMPNY_DIV: rowData.CMPNY_DIV == '100' ? 'HHI' : rowData.CMPNY_DIV,
      },
    }),
    //재해부위 조회
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_02',
      param: {
        CMPNY_DIV: rowData.CMPNY_DIV == '100' ? 'HHI' : rowData.CMPNY_DIV,
      },
    }),
    //회사구분 조회
    getCodeList('HHIZ000'), //8
    //상해종류 조회
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH08',
      param: { EMP_NO: rowData.EMPLNO },
    }),
    //진행상태조회
    getCodeList('HHIB250060'),
    //합의금 진행상태 조회
    getCodeList('HHIB250080'),
    //비급여현황 조회
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH11',
      param: {
        CMPNY_DIV: rowData.CMPNY_DIV,
        EMP_NO: rowData.EMPLNO,
        USER_ID: userStore.userId,
      },
    }),
    //취업치료구분조회 ???????
    getCodeList('HHIB310'),
    commonSearchApi({ queryId: 'searchCommonCodeF', param: acdtParms }), //14
  ]).then((res) => {
    codeList.REQGBN = res[0].ORESULT_CUR
    codeList.SANGBN = res[1].ORESULT_CUR
    codeList.YOGBN = res[2].ORESULT_CUR
    codeList.SJE_TYPE_CD = res[3].ORESULT_CUR
    codeList.GAINUM = res[4].ORESULT_CUR
    codeList.INJURYTYPE = res[5].ORESULT_CUR
    codeList.INJURYPART = res[7].ORESULT_CUR
    codeList.CMPNY_DIV = res[8].ORESULT_CUR
    codeList.SAGO_CMPNY_DIV = res[8].ORESULT_CUR.filter(
      (x) => x.COD === '100' || x.COD === 'HHI' || x.COD === '230'
    )
    codeList.STATUS = res[10].ORESULT_CUR
    grdPop1.value.getDataProvider().setRows(res[9].ORESULT_CUR)
    codeList.HAP_STATUS = res[11].ORESULT_CUR
    grdPopUp.value.getDataProvider().setRows(res[12].ORESULT_CUR)
    codeList.WORK_HEAL_GBN = res[13].ORESULT_CUR
    grdPopUp.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
    fiterData.value = res[14].ORESULT_CUR
  })
}

//팝업 오픈
const openPopEmp = () => {
  popEmp.value.openPopup('openPop from parent')
}

//팝업오픈 이벤트
const openPopup = async (rowData) => {
  console.log('받은데이터', rowData)
  
  initCodeList(rowData)

  if (rowData.OCCURDATE) {
    rowData.OCCURDATE = rowData.OCCURDATE.substr(0, 10) //재해일자
  }

  if (rowData.COM_ENT_DATE) {
    rowData.COM_ENT_DATE = rowData.COM_ENT_DATE.substr(0, 10) //입사일자
  }

  for (const [key, value] of Object.entries(rowData)) {
    if (sanJeField.hasOwnProperty(key)) {
      if (key === 'TARGETDTE'){
        console.log('tttt 1', value)
      }
      sanJeField[key] = value
      if (key === 'TARGETDTE'){
        console.log('tttt 2', sanJeField[key])
      }
    }
  }
  console.log('sanJeField  TARGETDTE  ', sanJeField['TARGETDTE'])



  rowData.EMAIL_YN === 'Y'
    ? (readOnlyValue.ISEMAILDTESEND = true)
    : (readOnlyValue.ISEMAILDTESEND = false)
  rowData.END_SEND_YN === 'Y'
    ? (readOnlyValue.ISENDEMAILDTE = true)
    : (readOnlyValue.ISENDEMAILDTE = false)

  sanJeField.COM_ENT_DATE = rowData.COM_ENT_DATE
  sanJeField.RETI_TMP_DATE = rowData.RETI_TMP_DATE
  dialog.value = true
 // watchflag.value = true

  // console.log('sanJeField', sanJeField)
}

//  시간 유효성검사
const formatTimeFromInput = (inputTime) => {
  const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/
  if (!timePattern.test(inputTime)) {
    return ''
  }

  const hours = inputTime.substring(0, 2)
  const minutes = inputTime.substring(2)
  return `${hours}:${minutes}`
}

const formatAndDisplayTime = () => {
  sanJeField.OCCURTIME = formatTimeFromInput(sanJeField.OCCURTIME)
}

//그리드 셋팅
const grdPopUpProps = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: [],
  fields: [
    {
      fieldName: 'STATUS',
      dataType: 'text',
      header: { text: t('진행상태') },
      lookupDisplay: true,
    },
    {
      fieldName: 'INPUTDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('접수일'), editor: { datetimeFormat: 'yyyy-MM-dd' } },
    },
    {
      fieldName: 'FINISHDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('완료일'), editor: { datetimeFormat: 'yyyy-MM-dd' } },
    },
    { fieldName: 'ADESC', dataType: 'text', header: { text: t('진료비내용') } },
    { fieldName: 'AMT', dataType: 'text', header: { text: t('금액') } },
    { fieldName: 'HOSPITAL', dataType: 'text', header: { text: t('병원') } },
    { fieldName: 'BANK', dataType: 'text', header: { text: t('은행') } },
  ],
  columns: [],
})

grdPopUpProps.columns = grdPopUpProps.fields

const grdPop1prop = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: ['COMPANY_NM'],
  fields: [
    {
      fieldName: 'COMPANY_NM',
      dataType: 'text',
      header: { text: t('회사구분') },
    },
    {
      fieldName: 'HLD_OFFI_NM',
      dataType: 'text',
      header: { text: t('재직상태') },
    },
    {
      fieldName: 'RETI_TMP_DATE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('퇴직일'), editor: { datetimeFormat: 'yyyy-MM-dd' } },
    },
  ],
  columns: [],
})

grdPop1prop.columns = grdPop1prop.fields

//  저장관련

const mainCheck = () => {
  return true
} 

const isWithinThreeMonths = (dt) => {
  // 입력된 날짜를 Date 객체로 변환
  const inputDate = new Date(dt)
    
  // 현재 날짜를 가져옴
  const today = new Date()
  
  // 오늘 날짜 기준으로 3개월 후의 날짜를 계산
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(today.getMonth() + 3)

  // 오늘 날짜 기준으로 3개월 전의 날짜를 계산
  const threeMonthsEarlier = new Date()
  threeMonthsEarlier.setMonth(today.getMonth() - 3)

  // 주어진 날짜가 오늘부터 3개월 전과 3개월 후 사이에 있는지 확인
  return inputDate >= threeMonthsEarlier && inputDate <= threeMonthsLater
}

const mainSaveData = () => {
  let saveParam = []
  if (sanJeField.HUDAY) {
    if (sanJeField.HUDAY.toString().includes('일')) {
      sanJeField.HUDAY = sanJeField.replace('일', '')
    }
  }

  let saveData = {
    CMPNY_DIV: sanJeField.CMPNY_DIV,
    SANNO: sanJeField.SANNO,
    REQGBN: sanJeField.REQGBN,
    YOGBN: sanJeField.YOGBN,
    SANGBN: sanJeField.SANGBN,
    SAGONO: sanJeField.SAGONO,
    EMPLNO: sanJeField.EMPLNO,
    FILENUM: sanJeField.FILENUM,
    GAINUM: sanJeField.GAINUM,
    OCCURDATE: sanJeField.OCCURDATE,
    OCCURTIME: !sanJeField.OCCURTIME
      ? sanJeField.OCCURTIME
      : sanJeField.OCCURTIME.replace(':', ''),
    SAGOTYPE: sanJeField.SAGOTYPE,
    INJURYTYPE: sanJeField.INJURYTYPE,
    INJURYPART: sanJeField.INJURYPART,
    REQDTE: sanJeField.REQDTE,
    REQEMP: sanJeField.REQEMP,
    SANOK: sanJeField.SANOK,
    OKDTE: sanJeField.OKDTE,
    HUDTE: sanJeField.HUDTE,
    BOKDTE: sanJeField.BOKDTE,
    ENDDTE: sanJeField.ENDDTE,
    GRADE: sanJeField.GRADE,
    GRADEDTE: sanJeField.GRADEDTE,
    HAPDTE: sanJeField.HAPDTE,
    HUDAY: sanJeField.HUDAY,
    HAPAMT: sanJeField.HAPAMT,
    SALARY: sanJeField.SALARY,
    SALARYDTE: sanJeField.SALARYDTE,
    TARGETDTE: sanJeField.TARGETDTE,
    TELNO1: sanJeField.TELNO1,
    TELNO2: sanJeField.TELNO2,
    TELGBN: sanJeField.TELGBN,
    ORGBELNR: sanJeField.ORGBELNR,
    ORGBELNRDTE: sanJeField.ORGBELNRDTE,
    BANK: sanJeField.BANK,
    APPROVEDTE: sanJeField.APPROVEDTE,
    INGAMDTE: sanJeField.INGAMDTE,
    RECEIPTDTE: sanJeField.RECEIPTDTE,
    HAP_STATUS: sanJeField.HAP_STATUS,
    HAPBIGO: sanJeField.HAPBIGO,
    FILE_ID: sanJeField.FILE_ID,
    RESULT_FILE_ID: sanJeField.RESULT_FILE_ID,
    STATUS: sanJeField.STATUS,
    SANGBYUNG: sanJeField.SANGBYUNG,
    SAGOLOC: sanJeField.SAGOLOC,
    SAGOGAEYO: sanJeField.SAGOGAEYO,
    BIGO: sanJeField.BIGO,
    ADD_DESC: sanJeField.ADD_DESC,
    SJE_TYPE_CD: sanJeField.SJE_TYPE_CD,
    SEND_YN: sanJeField.SEND_YN,
    SAVE_YN: sanJeField.SAVE_YN,
    USER_ID: userStore.userId,
    IP_ADDRESS: sanJeField.IP_ADDRESS,
    P_SANNO: sanJeField.P_SANNO,
    SAGO_CMPNY_DIV: sanJeField.SAGO_CMPNY_DIV,
    SALARY_CORRECT_YN: sanJeField.SALARY_CORRECT_YN,
    WORK_HEAL_GBN: sanJeField.WORK_HEAL_GBN,
    WORK_HEAL_DT: sanJeField.WORK_HEAL_DT,
    YOBIGO: sanJeField.YOBIGO,
    YOSTART: sanJeField.YOSTART, //요양시작일
    BE_BIGO: sanJeField.BE_BIGO,
    SANG_CD: sanJeField.SANG_CD,
    AUTO_SALARYDTE: sanJeField.AUTO_SALARYDTE,
  }

  // console.log('null dayjs', dayjs(null))
  // console.log('undefined dayjs', dayjs(undefined))

  if(saveData.AUTO_SALARYDTE === 'Y') {
    // 진행상태가 승인일시
    if(saveData.STATUS == 'C') {
      if(sanJeField.HLD_OFFI_GBN == '3') {
        if(saveData.YOGBN == '0') {
          if(dayjs(saveData.OCCURDATE) <= dayjs(sanJeField.RETI_TMP_DATE)) {
            saveData.SALARYDTE = saveData.OCCURDATE
          } else {
            saveData.SALARYDTE = dayjs(sanJeField.RETI_TMP_DATE).add(1, 'day').format('YYYY-MM-DD')
          }
        } else {
          if(dayjs(saveData.YOSTART) <= dayjs(sanJeField.RETI_TMP_DATE).add(3, 'month')) {
            saveData.SALARYDTE = dayjs(sanJeField.RETI_TMP_DATE).add(1, 'day').format('YYYY-MM-DD')
          } else {
            saveData.SALARYDTE = '0001-01-01'
          }
        }
      } else {
        if(saveData.YOGBN == '0') {
          saveData.SALARYDTE = saveData.OCCURDATE
        } else {
          saveData.SALARYDTE = saveData.YOSTART
        }
      }

      sanJeField.SALARYDTE = saveData.SALARYDTE
      
      // if(sanJeField.HLD_OFFI_GBN == '3') { // 퇴직자
      //   if(isWithinThreeMonths(sanJeField.RETI_TMP_DATE) ) { // 퇴직일 3개월 이내이고
      //     if(saveData.YOGBN == '0') { // 최초 요양
      //       saveData.SALARYDTE = saveData.OCCURDATE // 산정기준일에 재해일시를 넣는다.
      //     } else {
      //       saveData.SALARYDTE = sanJeField.RETI_TMP_DATE // 산정기준일에 퇴직일을 넣는다.
      //     }
      //   } else { // 퇴직일 3개월 이후이고
      //     if(saveData.YOGBN == '0') { // 최초 요양
      //       saveData.SALARYDTE = saveData.YOSTART // 산정기준일에 재해일시를 넣는다.
      //     } else {
      //       saveData.SALARYDTE = sanJeField.RETI_TMP_DATE // 산정기준일에 퇴직일을 넣는다.
      //     }
      //   }
      // } else { // 재직자
      //   if(saveData.YOGBN == '0') { // 최초 요양
      //     saveData.SALARYDTE = saveData.OCCURDATE // 산정기준일에 재해일시를 넣는다.
      //   } else { // 재요양
      //     saveData.SALARYDTE = saveData.YOSTART // 산정기준일에 요양시작일 넣는다.
      //   }
      // }
    }
  }

  saveParam.push(saveData)
  let params = {
    userStore: userStore,
    params: sanJeField,
    mgs: '산재정보등록현황 상세 수정했습니다.',
    crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
  return commonExecuteApi({ queryId: 'SAFAG0010_SAVE_01', list: saveParam })
}

const mainCompleteData = () => {
  let param = [
    {
      CMPNY_DIV: sanJeField.CMPNY_DIV,
      SANNO: sanJeField.SANNO,
      ENDDTE: sanJeField.ENDDTE,
    },
  ]
  return commonExecuteApi({ queryId: 'SAFAG0010_SAVE_09', list: param })
}

const mainDelData = () => {
  let param = [
    {
      CMPNY_DIV: sanJeField.CMPNY_DIV,
      SANNO: sanJeField.SANNO,
      USER_ID: userStore.userId,
      IP_ADDRESS: sanJeField.IP_ADDRESS,
    },
  ]
  let params = {
    userStore: userStore,
    params: param[0],
    mgs: '산재정보등록현황 상세 삭제했습니다.',
    crudGbn: 'D', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
  return commonExecuteApi({ queryId: 'SAFAG0010_DELETE_01', list: param })
}

//산재유첨 파일 업로드 이벤트
const uploaded = (item) => {
  let param = [
    {
      CMPNY_DIV: sanJeField.CMPNY_DIV,
      SANNO: sanJeField.SANNO,
      FILE_ID: item.fileId,
      USER_ID: userStore.userId,
    },
  ]

  commonExecuteApi({ queryId: 'SAFAG0010_SAVE_02', list: param })
}

//결과통보서 파일 업로드 이벤트
const uploaded2 = (item) => {
  let saveParam = []
  let data = {
    CMPNY_DIV: sanJeField.CMPNY_DIV,
    SANNO: sanJeField.SANNO,
    RESULT_FILE_ID: item.fileId,
    USER_ID: userStore.userId,
  }
  saveParam.push(data)

  commonExecuteApi({ queryId: 'SAFAG0010_SAVE_11', list: saveParam })
}

//버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(mainCheck).setQuery(mainSaveData).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(mainDelData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnComplete') {
    new saveFlowHelper(vm, t)
      .setQuery(mainCompleteData)
      .setAfter(() => {
        sanJeField.STATUS = 'F'
        saveSTATUS()
      })
      .run()
  }
  //닫기버튼 클릭 이벤트
  else if (btn.id === 'btnClose') {
    endDteFlag.FLAG = 'N'
    dialog.value = false
    //합의여부가 합의이면 HAP_YN를 Y로 변경해서 그리드에 넣어줌
    if (sanJeField.HAP_STATUS === 'H') {
      sanJeField.HAP_YN = 'Y'
    } else {
      sanJeField.HAP_YN = 'N'
    }

    emit('closed', sanJeField)
  }
  //요양관리 클릭 이벤트
  else if (btn.id === 'btnMedicalCareManagement') {
    DblClickPopupYoYang.value.openPopup(sanJeField)
  }
  //유첨 버튼클릭 이벤트
  else if (btn.id === 'btnSanJeFileAdd') {
    checkFileId()
  } else if (btn.id === 'btnSanJeResultFileAdd') {
    checkFileId2()
  }

  //요양신청서 출력 버튼 클릭 이벤트
  else if (btn.id === 'btnApplicationForMedicalCareOutput') {
    //요양신청서 출력시 요양구분이 선택되어있지 않으면
    if (!sanJeField.YOGBN) {
      sanJeField.SANGBN = 'A' //산재구분 - 일반사고
      sanJeField.YOGBN = '0' //요양구분 - 최초요양
      sanJeField.SJE_TYPE_CD = '01' //요양내용 - 업무상사고
      sanJeField.REQGBN = '1' //신청구분 - 사고성
    }
    setprint(sanJeField, sanJeField.YOGBN)
    let params = {
      userStore: userStore,
      params: sanJeField,
      mgs: '산재정보등록현황(요양신청서) 조회했습니다.',
      crudGbn: 'P', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
    //요양신청서 출력을 클릭하면 진행상태가 신청으로 변경
    //신청일자는 오늘일자로 변경
    //sanJeField.STATUS = 'A' //진행상태 신청으로 변경 -> 2025.06.27 최수진 사원 확인으로 주석처리
    sanJeField.REQDTE = dayjs().format('YYYY-MM-DD') //신청일자 오늘일자로 변경
  } else if (btn.id === 'btnIndustrialAccidentCompensationCardOutput') {
    //산재자카드 출력
    if (!sanJeField.SAGOGAEYO) {
      return Message.warn(t('사고개요를 입력해주십시오. '))
    }
    reportName.value = '/manage/hse/SAFAG0010_05.ozr'
    showOz.value = true

    const year = (day) => {
      if (day) {
        let Result = new Date(day).getFullYear()
        return Result
      }
      return ''
    }
    const month = (day) => {
      if (day) {
        let Result = String(new Date(day).getMonth() + 1).padStart(2, '0')
        return Result
      }
      return ''
    }
    const day = (day) => {
      if (day) {
        let Result = String(new Date(day).getDate()).padStart(2, '0')
        return Result
      }
      return ''
    }
    params.value = [
      'IN_CMPNY_DIV=' + sanJeField.CMPNY_DIV,
      'IN_EMP_NO=' + sanJeField.EMPLNO,
      'IN_NAME=' + sanJeField.KOR_NM,
      'IN_EMPLNO=' + sanJeField.EMPLNO,
      'IN_FILENUM=' + sanJeField.FILENUM,
      'IN_COM_ENT_DATE=' +
        `${year(sanJeField.COM_ENT_DATE)}년 ${month(
          sanJeField.COM_ENT_DATE
        )}월 ${day(sanJeField.COM_ENT_DATE)}일`,
      'IN_RETI_TMP_DATE=' +
        `${year(sanJeField.RETI_TMP_DATE)}년 ${month(
          sanJeField.RETI_TMP_DATE
        )}월 ${day(sanJeField.RETI_TMP_DATE)}일`,
      'IN_KOR_NM=' + sanJeField.KOR_NM,
      'IN_EMPLNO=' + sanJeField.EMPLNO,
      'IN_BSNS_NM=' + sanJeField.BSNS_NM,
      'IN_DEPT_NM=' + sanJeField.DEPT_NM,
      'IN_REG_NO=' + sanJeField.REG_NO,
      'IN_OKDTE=' +
        `${year(sanJeField.OKDTE)}년 ${month(sanJeField.OKDTE)}월 ${day(
          sanJeField.OKDTE
        )}일`,
      'IN_YOGBN=' +
        `${
          sanJeField.YOGBN == 0
            ? '최초요양'
            : sanJeField.YOGBN == 1
            ? '재요양'
            : ''
        }`,
      'IN_OCCURDATE=' +
        `${year(sanJeField.OCCURDATE)}년 ${month(sanJeField.OCCURDATE)}월 ${day(
          sanJeField.OCCURDATE
        )}일`,
      'IN_TELNO1=' + sanJeField.TELNO1,
      'IN_TARGETDTE=' +
        `${year(sanJeField.TARGETDTE)}년 ${month(sanJeField.TARGETDTE)}월 ${day(
          sanJeField.TARGETDTE
        )}일`,
      'IN_SAGOGAEYO=' + sanJeField.SAGOGAEYO,
      'IN_SANGBYUNG=' +
        `${sanJeField.SANGBYUNG === null ? '' : sanJeField.SANGBYUNG}`,
      'IN_BIGO=' + `${sanJeField.BIGO != null ? sanJeField.BIGO : ''}`,
      'IN_ADDR=' + sanJeField.ADDR,
      'IN_DATE_YN=',
      'IN_FROM=',
      'IN_TO=',
      'IN_USER_ID=',
      'IN_IP_ADDRESS=',
    ]
    let Dparams = {
      userStore: userStore,
      params: sanJeField,
      mgs: '산재정보등록현황 (산재자카드) 조회/출력 했습니다.',
      crudGbn: 'P', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(Dparams)
  } else if (btn.id === 'btnOfficialPaperOutput') {
    params.value = []
    if (!sanJeField.SAGOGAEYO) {
      return Message.warn(t('사고개요를 입력해주십시오. '))
    }
    if (!sanJeField.SANGBYUNG) {
      return Message.warn(t('상병명을 입력해주십시오.'))
    }
    reportName.value = '/manage/hse/SAFAG0010_04.ozr'
    showOz.value = true
    //  코드정리
    let substringBSNS = sanJeField.BSNS_NM.substring(0, 1)
    let STATUScode = ''
    let HLD_OFFI_GBNCode = ''
    switch (sanJeField.STATUS) {
      case 'A':
        STATUScode = '신청'
        break
      case 'B':
        STATUScode = '미결'
        break
      case 'C':
        STATUScode = '승인'
        break
      case 'D':
        STATUScode = '불승인'
        break
      case 'F':
        STATUScode = '종결'
        break
    }

    switch (sanJeField.HLD_OFFI_GBN) {
      case '1':
        HLD_OFFI_GBNCode = '재직'
        break
      case '2':
        HLD_OFFI_GBNCode = '휴직'
        break
      case '3':
        HLD_OFFI_GBNCode = '퇴직'
        break
      case '4':
        HLD_OFFI_GBNCode = '입대'
        break
    }
    //산재구분이
    if (sanJeField.SANGBN == 'A') {
      params.value = [
        'IN_BONMOON=' +
          `2.${substringBSNS})${sanJeField.DEPT_NM}${HLD_OFFI_GBNCode}자『${
            sanJeField.KOR_NM
          }(사번 :${sanJeField.EMPLNO})』 ${sanJeField.SAGOGAEYO}로 인해 ${
            sanJeField.SANGBYUNG === null ? '' : sanJeField.SANGBYUNG
          },에 통증을 느낀 내용으로 근로복지공단 울산지사에 산재를 신청한 결과,${STATUScode}으로 확인되어안내하오니 참고하여 주시기 바랍니다.`,
      ]
    } else if (sanJeField.SANGBN == 'N' || sanJeField.SANGBN == 'Z') {
      params.value = [
        'IN_BONMOON=' +
          `2.${substringBSNS})${sanJeField.DEPT_NM}${HLD_OFFI_GBNCode}자『${
            sanJeField.KOR_NM
          }(사번 :${sanJeField.EMPLNO})』 은으로  ${
            sanJeField.SANGBYUNG === null ? '' : sanJeField.SANGBYUNG
          }인해 통증을 느낀 내용으로 근로복지공단 울산지사에 산재를 신청한 결과,${STATUScode}으로 확인되어안내하오니 참고하여 주시기 바랍니다.`,
      ]
    } else if (sanJeField.SANGBN == 'G') {
      params.value = [
        'IN_BONMOON=' +
          `2.${substringBSNS})${sanJeField.DEPT_NM}${HLD_OFFI_GBNCode}자『${
            sanJeField.KOR_NM
          }(사번 :${sanJeField.EMPLNO})』 는 오랜기간 반복적인 작업으로 인해  ${
            sanJeField.SANGBYUNG === null ? '' : sanJeField.SANGBYUNG
          }에 통증을 느낀 내용으로 근로복지공단 울산지사에 산재를 신청한 결과,${STATUScode}으로 확인되어안내하오니 참고하여 주시기 바랍니다.`,
      ]
    }
    let Dparams = {
      userStore: userStore,
      params: sanJeField,
      mgs: '개인정보관련 조회했습니다.',
      crudGbn: 'P', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(Dparams)
  } else {
    return Message.warn(t('개발중입니다.'))
    //  btnApplicationForMedicalCareOutput 요양신청서 출력 , btnIndustrialAccidentCompensationCardOutput 산재자카드 출력,btnOfficialPaperOutput 보고서출력
  }
}

const onSelect = () => {
  emit('selected', 'selected')
}

const afterDelete = () => {
  dialog.value = false
  emit('deleted')
}

const searchData01 = (idx) => {
  let param = {
    CMPNY_DIV: sanJeField.CMPNY_DIV,
    SANGBN: sanJeField.SANGBN,
  }

  return commonSearchApi({ queryId: 'SAF_AG0010_search13', param: param })
}

const afterSearch01 = (res) => {
  sanJeField.FILENUM = res.ORESULT_CUR[0].FILENUM
  sanJeField.OKDTE = dayjs().subtract(1, 'day').format('YYYY-MM-DD') //진행상태가 승인으로 변경시승인일자 오늘 -1일
  sanJeField.SANOK = 'Y'
}

//승인발송일 옆 메일발송 버튼 클릭 이벤트
const OKMAIL = () => {
  console.log('승인발송일 메일')
  if (!sanJeField.YOGBN) {
    Message.warn(t('요양구분 을 선택후 메일발송을 해주십시오.'))
    return false
  }
  sendMail1.value.openPopup(sanJeField, 'SAFAG0010', 'EMAILDTE')
}

const ENDMAIL = () => {
  console.log('종결예정일 메일')
  sendMail2.value.openPopup(sanJeField, 'SAFAG0010', 'ENDEMAILDTE')
}

const compleat = (bolean) => {
  console.log('이거탐?', bolean)
  if (bolean == 'EMAILDTE') {
    let param = [
      {
        CMPNY_DIV: sanJeField.CMPNY_DIV,
        SANNO: sanJeField.SANNO,
        USER_ID: userStore.userId,
        GUBUN: 'emailTime',
      },
    ]
    commonExecuteApi({ queryId: 'SAFAG0010_SAVE_07', list: param }).then(
      (res) => {
        sanJeField.EMAILDTE = dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    )
  } else if (bolean == 'ENDEMAILDTE') {
    let param = [
      {
        CMPNY_DIV: sanJeField.CMPNY_DIV,
        SANNO: sanJeField.SANNO,
        USER_ID: userStore.userId,
        GUBUN: 'ENDEMAILDTE',
      },
    ]
    if (!sanJeField.ENDEMAILDTE) {
      commonExecuteApi({ queryId: 'SAFAG0010_SAVE_07', list: param }).then(
        (res) => {
          sanJeField.ENDEMAILDTE = dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
      )
    }
  }
}

//  산재유첨파일관련 메소드
const checkFileId = () => {
  if (!sanJeField.FILE_ID) {
    fileUpload.value.setGuid()
    sanJeField.FILE_ID = fileUpload.value.guid
    fileUpload.value.openPopup(sanJeField.FILE_ID)
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(sanJeField.FILE_ID)
    sanJeField.FILE_ID = fileUpload.value.guid
    fileUpload.value.openPopup(sanJeField.FILE_ID)
  }
}

//  결과통지서 파일관련 메소드
const checkFileId2 = () => {
  if (!sanJeField.RESULT_FILE_ID) {
    fileUpload2.value.setGuid()
    sanJeField.RESULT_FILE_ID = fileUpload2.value.guid
    fileUpload2.value.openPopup(sanJeField.RESULT_FILE_ID)
  } else {
    //파일아이디 있을때
    fileUpload2.value.setGuid(sanJeField.RESULT_FILE_ID)
    sanJeField.RESULT_FILE_ID = fileUpload2.value.guid
    fileUpload2.value.openPopup(sanJeField.RESULT_FILE_ID)
  }
}

//사고형태 팝업 오픈 이벤트
const acdtOpen = () => {
  acdtPopupRef.value.openPopup('사고분류')
}

//사고분류 선택 이벤트
const selectedArr = (row) => {
  sanJeField.SAGOTYPE_NM1 = row[0].TXT
  sanJeField.SAGOTYPE_NM2 = row[1].TXT
  sanJeField.SAGOTYPE_NM3 = row[2].TXT

  sanJeField.SAGOTYPE = row[2].ALL_SYS_CD
}

//  출력
const btnPrint = (GuBun) => {
  if (GuBun === '즉보') {
    reportName.value = '/manage/hse/SAFAB0020_1.ozr'
    showOz.value = true

    params.value = [
      'IN_CMPNY_DIV=' + sanJeField.CMPNY_DIV,
      'IN_SAGO_SN=' + sanJeField.SAGONO,
    ]
  }

  if (GuBun === '보고서') {
    reportName.value = '/manage/hse/SAFAB0020_2_1.ozr'

    showOz.value = true

    params.value = [
      'IN_CMPNY_DIV=' + sanJeField.CMPNY_DIV,
      'IN_SAGO_SN=' + sanJeField.SAGONO,
      'IN_YEAR=' + dayjs().year(),
    ]
  }
}

// 유효성검사 숫자
const numberRequed = (gubun) => {
  if (gubun === '합의금') {
    sanJeField.HAPAMT = sanJeField.HAPAMT.replace(/[^0-9-]/g, '')
  }

  if (gubun === '평균임금') {
    sanJeField.SALARY = sanJeField.SALARY.replace(/[^0-9-]/g, '')
  }
}

const setprint = (data, gubun) => {
  //산재구분이 최초요양이면
  if (gubun == 0) {
    reportName.value = '/manage/hse/SAFAG0010_01.ozr'
    showOz.value = true
    let YOGBN = ''
    switch (data.YOGBN) {
      case '0':
        if (data.SJE_TYPE_CD == '01') {
          //요양구분이 최초 요양이고, 요양내용이 업무상 사고일때
          YOGBN =
            '최초요양      [V] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해'
        } else if (data.SJE_TYPE_CD == '02') {
          //요양구분이 최초 요양이고, 요양내용이 업무상 질병일때
          YOGBN =
            '최초요양      [ ] 업무상 사고      [V] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해'
        } else if (data.SJE_TYPE_CD == '03') {
          //요양구분이 최초 요양이고, 요양내용이 출퇴근 재해일때
          YOGBN =
            '최초요양      [ ] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [V] 출퇴근 재해'
        }
        break
      case '1':
        YOGBN =
          '재요양 [ ] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해'
        break
      default:
        //요양구분이 재요양일때
        YOGBN =
          '재요양 [ ] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해'
        break
    }
    console.log('출력데이터', data)
    if (!data.ADDR) {
      data.ADDR = '' //주소가 없을때는 빈값
    }
    //주민번호가 없으면 빈값
    if (!data.REG_NO) {
      data.REG_NO = ''
    }

    //채용일자가 존재하지 않으면 빈값으로
    if (!data.COM_ENT_DATE) {
      data.COM_ENT_DATE = ''
    }
    params.value = [
      'IN_KOR_NM=' + data.KOR_NM,
      'IN_REG_NO=' + data.REG_NO,
      'IN_ADDR=' + data.ADDR,
      'IN_TELNO1=' + data.TELNO1,
      'IN_OCCURDATE_DESC=' +
        `${data.OCCURDATE.substr(0, 4)}년 ${data.OCCURDATE.substr(
          5,
          2
        )}월 ${data.OCCURDATE.substr(8, 2)}일 ${
          data.OCCURTIME
            ? data.OCCURTIME.substring(0, 2) +
              '시' +
              data.OCCURTIME.substring(2, 4) +
              '분'
            : ''
        }`,
      'IN_COM_ENT_DATE_DESC=' +
        `${data.COM_ENT_DATE.substr(0, 4)}년 ${data.COM_ENT_DATE.substr(
          5,
          2
        )}월 ${data.COM_ENT_DATE.substr(8, 2)}일`,
      'IN_UNT_DUTY_NM=' + data.UNT_DUTY_NM,
      'IN_YOGBN=' + YOGBN,
      'IN_nowDate=' + `${dayjs().$y}년 ${dayjs().$M + 1}월 ${dayjs().$D}일`,
      'IN_SAGOGAEYO=' + data.SAGOGAEYO,
      'IN_SAUPJANG=' + 'HD현대중공업',
      'IN_SAUPJU=' + '이상균,노진율',
      'IN_SAUPJANGTELNO=' + '052-202-2206',
      'IN_SAUPJANGNUMBER=' + '907-00-78050-1',
      'IN_SAUPJANGJUSO=' + '울산광역시 동구 방어진순환도로 1000  현대중공업',
    ]
    console.log('파람벨류', params.value)
  } else {
    reportName.value = '/manage/hse/SAFAG0010_02.ozr'
    showOz.value = true

    const year = (day) => {
      let Result = new Date(day).getFullYear()
      return Result
    }
    const month = (day) => {
      let Result = String(new Date(day).getMonth() + 1).padStart(2, '0')
      return Result
    }
    const day = (day) => {
      let Result = String(new Date(day).getDate()).padStart(2, '0')
      return Result
    }

    params.value = [
      'IN_KOR_NM=' + data.KOR_NM,
      'IN_REG_NO=' + data.REG_NO,
      'IN_ADDR=' + data.ADDR,
      'IN_TELNO1=' + data.TELNO1,
      'IN_OCCURDATE_DESC=' +
        `${year(data.OCCURDATE)}년 ${month(data.OCCURDATE)}월 ${day(
          data.OCCURDATE
        )}일`,
      'IN_YESORNO=' +
        `${data.HAP_YN === 'Y' ? '[V]예 2. [ ]아니오' : ' [ ]예 2. [V]아니오'}`,
      'IN_HAPAMT_DESC=' + `${data.HAP_YN === 'Y' ? data.HAPAMT : ''}`,
      'IN_HAPDTE_DESC=' + `${data.HAP_YN === 'Y' ? data.HAPDTE : ''}`,
      'IN_NOWDATE=' + `${dayjs().$y}년 ${dayjs().$M + 1}월 ${dayjs().$D}일`,
      'IN_SAGOGAEYO=' + data.SAGOGAEYO,
      'IN_SAUPJANG=' + 'HD현대중공업',
      'IN_SAUPJU=' + '이상균,노진율',
      'IN_SAUPJANGTELNO=' + '052-202-2206',
      'IN_SAUPJANGNUMBER=' + '907-00-78050-1',
      'IN_SAUPJANGJUSO=' + '울산광역시 동구 방어진순환도로 1000  현대중공업',
    ]
  }
  commonExecuteApi({
    queryId: 'SAFAG0010_SAVE_03',
    list: [
      {
        CMPNY_DIV: data.CMPNY_DIV,
        SANNO: data.SANNO,
        USER_ID: userStore.userId,
      },
    ],
  })
}

//요양관리 팝업에서 데이터가 저장되었을때 실행되는 함수
//요양관리 팝업에서 저장한 마지막 로우에 대한 데이터를 받아서 입원,통원기간을 입력하고 요양시작일을 계산한다.
//요양일수 = 요양시작일 - 종결일
const yoYangSaved = (val, val2) => {
  //재직:1 휴직:2 퇴직:3 입대:4
  console.log('요양관리 받은 데이터 마지막행(요양)', val)
  console.log('요양관리 받은데이터 첫번째행(요양시작일)', val2)
  //요양시작일이 없거나 요양시작일이 변경되면실행
  if (!sanJeField.YOSTART || sanJeField.YOSTART !== val2.YOSTART) {
    console.log('첫번째행일때')
    //첫번째행을 입력할때 입원,통원 기간을 입력하고 저장한 경우
    if (val2.FROMDTE1 && val2.TODTE1 && val2.FROMDTE2 && val2.TODTE2) {
      let FROMDTE1 = new Date(val2.FROMDTE1) //입원시작일
      let FROMDTE2 = new Date(val2.FROMDTE2) //통원시작일

      //입원시작일이 통원시작일보다 빠를경우 요양시작일은 입원시작일
      if (FROMDTE1 < FROMDTE2) {
        sanJeField.YOSTART = val2.FROMDTE1.substr(0, 10)
        //종결일과 요양시작일이 있으면 요양일수 계산
        if (sanJeField.ENDDTE && sanJeField.YOSTART) {
          let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
          sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
          console.log('요양일수계산', sanJeField.YODAY_CNT)
        }
        //재요양이고 퇴직자면 산정기준일에 요양시작일 넣음
        if (sanJeField.YOGBN === '1' && sanJeField.HLD_OFFI_GBN === '3') {
          sanJeField.SALARYDTE = val2.FROMDTE1.substr(0, 10)
        }
      } else {
        //통원시작일이 입원시작일보다 빠를경우 요양시작일은 통원시작일
        sanJeField.YOSTART = val2.FROMDTE2.substr(0, 10)
        //종결일과 요양시작일이 있으면 요양일수 계산
        if (sanJeField.ENDDTE && sanJeField.YOSTART) {
          let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
          sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
          console.log('요양일수계산', sanJeField.YODAY_CNT)
        }
        //재요양이고 퇴직자면 산정기준일에 요양시작일 넣음
        if (sanJeField.YOGBN === '1' && sanJeField.HLD_OFFI_GBN === '3') {
          sanJeField.SALARYDTE = val2.FROMDTE2.substr(0, 10)
        }
      }
    }
    //입원기간만 입력한 경우 요양시작일은 입원시작일
    else if (val2.FROMDTE1 && val2.TODTE1) {
      sanJeField.YOSTART = val2.FROMDTE1.substr(0, 10)
      //종결일과 요양시작일이 있으면 요양일수 계산
      if (sanJeField.ENDDTE && sanJeField.YOSTART) {
        let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
        sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
        console.log('요양일수계산', sanJeField.YODAY_CNT)
      }
      //재요양이고 퇴직자면 산정기준일에 요양시작일 넣음
      if (sanJeField.YOGBN === '1' && sanJeField.HLD_OFFI_GBN === '3') {
        sanJeField.SALARYDTE = val2.FROMDTE1.substr(0, 10)
      }
    }
    //통원기간만 입력한 경우 요양시작일은 통원시작일
    else if (val2.FROMDTE2 && val2.TODTE2) {
      sanJeField.YOSTART = val2.FROMDTE2.substr(0, 10)
      //종결일과 요양시작일이 있으면 요양일수 계산
      if (sanJeField.ENDDTE && sanJeField.YOSTART) {
        let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
        sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
        console.log('요양일수계산', sanJeField.YODAY_CNT)
      }
      //재요양이고 퇴직자면 산정기준일에 요양시작일 넣음
      if (sanJeField.YOGBN === '1' && sanJeField.HLD_OFFI_GBN === '3') {
        sanJeField.YOSTART = val2.FROMDTE2.substr(0, 10)
      }
    }
  }

  //마지막행을 입력할때입원,통원 기간을 모두 입력하고 저장한경우
  if (val.FROMDTE1 && val.TODTE1 && val.FROMDTE2 && val.TODTE2) {
    //입원일 FROM
    sanJeField.FROMDTE1 = val.FROMDTE1.substr(0, 10)
    //입원일 TO
    sanJeField.TODTE1 = val.TODTE1.substr(0, 10)
    //통원일 FROM
    sanJeField.FROMDTE2 = val.FROMDTE2.substr(0, 10)
    //통원일 TO
    sanJeField.TODTE2 = val.TODTE2.substr(0, 10)

    //요양기관
    sanJeField.HOSPITAL = val.HOSPITAL
    let FROMDTE1 = new Date(val.FROMDTE1) //입원시작일
    let TODTE1 = new Date(val.TODTE1) //입원종료일
    let FROMDTE2 = new Date(val.FROMDTE2) //통원시작일
    let TODTE2 = new Date(val.TODTE2) //통원종료일
    //입원종료일이 통원종료일보다 클경우
    if (TODTE1 > TODTE2) {
      sanJeField.TARGETDTE = val.TODTE1.substr(0, 10) //종결예정일은 입원종료일
    }
    //통원종료일이 입원종료일보다 클경우
    else if (TODTE1 < TODTE2) {
      sanJeField.TARGETDTE = val.TODTE2.substr(0, 10) //종결예정일은 통원종료일
    }
    //입원종료일 = 통원종료일이 같을경우(이런 경우가 있을지 모르겠지만...)
    //같을경우에는 입원종료일,통원종료일중에 종결예정일이 뭐가 되어도 상관 없다. 일단 입원종료일을 종결예정일로 넣는다. 추후에 변경하게 된다면 이 주석을 참고할것
    else {
      sanJeField.TARGETDTE = val.TODTE1.substr(0, 10) //종결예정일은 입원종료일
    }

    if (FROMDTE1 < FROMDTE2) {
      //종결일과 요양시작일이 있으면 요양일수 계산
      if (sanJeField.ENDDTE && sanJeField.YOSTART) {
        let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
        sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
        console.log('요양일수계산', sanJeField.YODAY_CNT)
      }
    } else if (FROMDTE1 > FROMDTE2) {
      if (sanJeField.ENDDTE && sanJeField.YOSTART) {
        let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
        sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
        console.log('요양일수계산', sanJeField.YODAY_CNT)
      }
    } else {
      //입원시작일과 통원시작일이 같으면 입원시작일을 넣음 어짜피 통원시작일도 같아서 뭘 넣으나 상관없다.
      if (sanJeField.ENDDTE && sanJeField.YOSTART) {
        let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
        sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
        console.log('요양일수계산', sanJeField.YODAY_CNT)
      }
    }
  }
  //입원기간만 입력한 경우
  else if (val.FROMDTE1 && val.TODTE1) {
    console.log('입원기간만 입력')
    //요양시작일이 없으면
    if (!sanJeField.YOSTART) {
      sanJeField.YOSTART = val.FROMDTE1.substr(0, 10)
    }

    sanJeField.FROMDTE1 = val.FROMDTE1.substr(0, 10)
    sanJeField.TODTE1 = val.TODTE1.substr(0, 10)

    sanJeField.TARGETDTE = val.TODTE1.substr(0, 10) //종결예정일
    sanJeField.HOSPITAL = val.HOSPITAL
    //통원기간 초기화
    sanJeField.FROMDTE2 = ''
    sanJeField.TODTE2 = ''
    if (sanJeField.ENDDTE && sanJeField.YOSTART) {
      let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
      sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
      console.log('요양일수계산', sanJeField.YODAY_CNT)
    }
  }
  //통원기간만 입력한 경우
  else if (val.FROMDTE2 && val.TODTE2) {
    console.log('통원기간만 입력')
    //요양시작일이 없으면
    if (!sanJeField.YOSTART) {
      sanJeField.YOSTART = val.FROMDTE2.substr(0, 10)
    }
    sanJeField.FROMDTE2 = val.FROMDTE2.substr(0, 10)
    sanJeField.TODTE2 = val.TODTE2.substr(0, 10)

    sanJeField.TARGETDTE = val.TODTE2.substr(0, 10) //종결예정일
    sanJeField.HOSPITAL = val.HOSPITAL
    //입원기간 초기화
    sanJeField.FROMDTE1 = ''
    sanJeField.TODTE1 = ''
    if (sanJeField.ENDDTE && sanJeField.YOSTART) {
      let YOCNT = dayjs(sanJeField.YOSTART).diff(sanJeField.ENDDTE, 'day')
      sanJeField.YODAY_CNT = Math.abs(YOCNT) //요양일수 계산
      console.log('요양일수계산', sanJeField.YODAY_CNT)
    }
  }
  setSalaryDate()
}

//산정기준일 세팅하는 함수
const setSalaryDate = () => {
  console.log('여기탐?', sanJeField)
  //재직자일때
  if (sanJeField.HLD_OFFI_GBN === '1') {
    //재직자가 최초요양일때 산정기준일은 재해일자
    if (sanJeField.OCCURDATE && sanJeField.YOGBN === '0') {
      if (!sanJeField.SALARYDTE) {
        sanJeField.SALARYDTE = sanJeField.OCCURDATE
      }
    }
    //재직자가 재요양일때 산정기준일은 요양시작일(요양기간의 첫날)
    else if (sanJeField.YOSTART && sanJeField.YOGBN === '1') {
      if (!sanJeField.SALARYDTE) {
        sanJeField.SALARYDTE = sanJeField.YOSTART
      }
    }
  }
}


const clearable = (clnm) => {
  sanJeField[clnm] = ''
}

// 진행상태 저장
const saveSTATUS = () =>{
  console.log('watchflag.value', watchflag.value)
  if (sanJeField.STATUS && watchflag.value ) {
      //A:신청 B:미결 C:승인 D:불승인 E:종결예정 F:종결
      //console.log('newValue', newValue)
      if (sanJeField.STATUS == 'A' || sanJeField.STATUS === 'D') {
        let saveData = []
        let saveParam = {
          CMPNY_DIV: sanJeField.CMPNY_DIV,
          SANNO: sanJeField.SANNO,
          STATUS: sanJeField.STATUS,
          USER_ID: userStore.userId,
        }
        saveData.push(saveParam)
        commonExecuteApi({
          queryId: 'SAFAG0010_SAVE_04',
          list: saveData,
        }).then((res) => {
          sanJeField.FILENUM = res.list[0].OUT_RES_FILENUM
          sanJeField.OKDTE = res.list[0].OUT_RES_OKDTE
          sanJeField.SANOK = res.list[0].OUT_RES_SANOK
          sanJeField.STATUS = res.list[0].OUT_RES_STATUS

          Message.info(t('반영 되었습니다.'))
        })
      } else if (sanJeField.STATUS == 'C') {
        let saveData = []
        let saveParam = {
          CMPNY_DIV: sanJeField.CMPNY_DIV,
          SANNO: sanJeField.SANNO,
          STATUS: sanJeField.STATUS,
          USER_ID: userStore.userId,
        }
        saveData.push(saveParam)
        commonExecuteApi({
          queryId: 'SAFAG0010_SAVE_04',
          list: saveData,
        }).then((res) => {
          sanJeField.FILENUM = res.list[0].OUT_RES_FILENUM
          sanJeField.OKDTE = res.list[0].OUT_RES_OKDTE
          sanJeField.SANOK = res.list[0].OUT_RES_SANOK
          sanJeField.STATUS = res.list[0].OUT_RES_STATUS

          Message.info(t('반영 되었습니다.'))
        })
      }
      else{
        Message.warn(t('신청, 승인, 불승인 상태만 적용됩니다.'))
      }
      //진행상태가 종결로 변경되면 (종결일 좌측 체크박스 체크안했을때만)
      //else if (sanJeField.STATUS === 'F' && endDteFlag.FLAG === 'N') {
        //sanJeField.TARGETDTE = dayjs().format('YYYY-MM-DD') //종결예정일
        //sanJeField.ENDDTE = dayjs().format('YYYY-MM-DD')   //종결일
      //}
    }

}





//평균임금 산정내역서 화면으로 이동하는 함수
const redirectPage = () => {
  router.push({ path: '/30_safety/SAF_A/SAFAG0040' })
  dialog.value = false
}

watch(
  () => endDteFlag.FLAG,
  (newValue) => {
    if (newValue === 'Y') {
      console.log('???', newValue)
      //종결예정일이 있고, 종결일이 없는경우 종결일에 종결예정일을 넣는다.
      if (sanJeField.TARGETDTE && !sanJeField.ENDDTE) {
        sanJeField.ENDDTE = sanJeField.TARGETDTE
        onButtonsClick({ id: 'btnComplete' })
      }
    }
  }
)

//진행상태 변경 감지
watch(
  () => sanJeField.STATUS,
  (newValue) => {
    console.log('watch: '  , watchflag.value)

    if (!watchflag.value){
      watchflag.value = true
      return;
    }


    
  }
)

//휴직일자 변경 감지해서 휴직일수를 계산한다.
watch(
  () => sanJeField.HUDTE,
  (newValue, oldValue) => {
    //요양중일때 -> 진행상태가 승인일때는 휴직일자 - 종결예정일 = 휴직일수
    if (sanJeField.STATUS === 'C') {
      console.log('요양중')
      if (sanJeField.TARGETDTE && sanJeField.HUDTE) {
        let HUDTE = dayjs(newValue)
        let TARGETDTE = dayjs(sanJeField.TARGETDTE)
        console.log('요양중 휴직일수', HUDTE.diff(TARGETDTE, 'day'))
        sanJeField.HUDAY = Math.abs(HUDTE.diff(TARGETDTE, 'day'))
      }
    }
    //종결후일때 -> 진행상태가 종결일때 휴직일자 - 종결일자 = 휴직일수
    if (sanJeField.STATUS === 'F') {
      console.log('종결후')
      if (sanJeField.ENDDTE && sanJeField.HUDTE) {
        let HUDTE = dayjs(newValue)
        let ENDDTE = dayjs(sanJeField.ENDDTE)
        console.log('종결후 휴직일수', Math.abs(HUDTE.diff(ENDDTE, 'day')))
        sanJeField.HUDAY = Math.abs(HUDTE.diff(ENDDTE, 'day'))
      }
    }
  }
)

//사고형태 변경 감지
watch(
  () => sanJeField.SAGOTYPE,
  (newValue) => {
    if (newValue.includes('HHIB010BA') === true) {
      sanJeField.SANG_CD = 'M'
    } else if (newValue.includes('HHIB010BF') === true) {
      sanJeField.SANG_CD = 'C'
    } else {
      sanJeField.SANG_CD = 'S'
    }
  }
)

//종결일 변경 감지
//종결일이 변경되었을때 요양시작일이 있다면 요양일수를 계산한다.
watch(
  () => sanJeField.ENDDTE,
  (newValue) => {
    //가끔 요양일수에 Nan값이 나오는 경우가 있어서 0.5초 딜레이 준후에 실행
    setTimeout(() => {
      if (sanJeField.YOSTART) {
        let YOCNT = Math.abs(dayjs(newValue).diff(sanJeField.YOSTART, 'day'))
        sanJeField.YODAY_CNT = YOCNT
      }
    }, 500)
  }
)

//요양시작일 변경 감지
//요양시작일이 변경되었을때 종결일이 있다면 요양일수를 계산한다
watch(
  () => sanJeField.YOSTART,
  (newValue) => {
    if (sanJeField.ENDDTE) {
      let YOCNT = Math.abs(dayjs(sanJeField.ENDDTE).diff(newValue, 'day'))
      sanJeField.YODAY_CNT = YOCNT
    }
  }
)

//합의상태 변경 감지
watch(
  () => sanJeField.HAP_STATUS,
  (newValue, oldValue) => {
    console.log('합의상태 newValue', newValue)
    console.log('합의상태 oldValue', oldValue)
  }
)

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1440"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>산재정보 등록/현황 상세</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnUpdate', //저장
            'btnDelete', //삭제
            'btnSanJeResultFileAdd', //결과통지서
            'btnSanJeFileAdd', //산재유첨
            'btnMedicalCareManagement', //요양관리
            'btnApplicationForMedicalCareOutput', //요양신청서출력
            'btnIndustrialAccidentCompensationCardOutput', //산재자 카드출력
            'btnOfficialPaperOutput', //보고서 출력
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
        <!-- 'btnComplete', -->
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <span class="gridTitle">기본사항</span>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('재해자')"
                v-model="sanJeField.KOR_NM"
                readonly
                setBgColor="bgColorWhite"
                placeholder="이름"
                width="200px"
                top-label
              >
              </i-input>
              <i-input
                :label="$t('사번')"
                v-model="sanJeField.EMPLNO"
                readonly
                setBgColor="bgColorWhite"
                placeholder="사번"
                width="200px"
                top-label
              >
              </i-input>
              <i-input
                :label="$t('주민번호')"
                v-model="sanJeField.REG_NO"
                readonly
                setBgColor="bgColorWhite"
                width="200px"
                top-label
              ></i-input>
              <i-input
                :label="$t('연락처')"
                v-model="sanJeField.TELNO1"
                readonly
                setBgColor="bgColorWhite"
                top-label
                width="200px"
              >
              </i-input>
              <i-input
                :label="$t('주소')"
                top-label
                v-model="sanJeField.ADDR"
                :items="codeList.ADDR"
                item-value="COD"
                item-title="TXT"
                readonly
                setBgColor="bgColorWhite"
                width="500px"
              >
              </i-input>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('사업부')"
                top-label
                width="200px"
                v-model="sanJeField.BSNS_NM"
                readonly
                setBgColor="bgColorWhite"
              >
              </i-input>
              <i-input
                :label="$t('부서')"
                top-label
                width="200px"
                v-model="sanJeField.DEPT_NM"
                readonly
                setBgColor="bgColorWhite"
              ></i-input>
              <i-input
                :label="$t('직위')"
                top-label
                v-model="sanJeField.JOB_TIT_NM"
                readonly
                setBgColor="bgColorWhite"
                width="100px"
              >
              </i-input>
              <i-select
                :label="$t('재직구분')"
                top-label
                bg-color="#EEEEEE"
                v-model="sanJeField.HLD_OFFI_GBN"
                :items="codeList.HLD_OFFI_GBN"
                item-value="COD"
                readonly
                setBgColor="bgColorWhite"
                item-title="TXT"
                width="100px"
              >
              </i-select>
              <i-input
                :label="$t('퇴직일자')"
                top-label
                v-model="sanJeField.RETI_TMP_DATE"
                readonly
                setBgColor="bgColorWhite"
                type="date"
                width="150px"
              >
              </i-input>

              <i-input
                :label="$t('입사일자')"
                top-label
                readonly
                setBgColor="bgColorWhite"
                v-model="sanJeField.COM_ENT_DATE"
                type="date"
                width="150px"
              >
              </i-input>
              <i-input
                :label="$t('직무')"
                top-label
                readonly
                setBgColor="bgColorWhite"
                v-model="sanJeField.UNT_DUTY_NM"
                width="200px"
              >
              </i-input>
            </div>
            <div class="d-flex">
              <i-select
                :label="$t('산재구분')"
                top-label
                v-model="sanJeField.SANGBN"
                :items="codeList.SANGBN"
                item-value="COD"
                item-title="TXT"
                width="200px"
              >
              </i-select>
              <i-select
                :label="$t('요양구분')"
                top-label
                v-model="sanJeField.YOGBN"
                :items="codeList.YOGBN"
                item-value="COD"
                item-title="TXT"
                width="200px"
              >
              </i-select>
              <i-select
                :label="$t('요양내용')"
                top-label
                v-model="sanJeField.SJE_TYPE_CD"
                :items="codeList.SJE_TYPE_CD"
                item-value="COD"
                item-title="TXT"
                width="200px"
              >
              </i-select>
              <i-select
                :label="$t('신청구분')"
                top-label
                width="200px"
                v-model="sanJeField.REQGBN"
                :items="codeList.REQGBN"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
              <v-btn
                :disabled="!sanJeField.SAGONO"
                @click="btnPrint('즉보')"
                class="mr-2 mt-5"
                >즉보출력</v-btn
              >
              <v-btn
                :disabled="!sanJeField.SAGONO"
                @click="btnPrint('보고서')"
                class="mt-5"
                style="margin-right: 40px"
                >보고서 출력</v-btn
              >
              <i-input
                :label="$t('사고번호')"
                top-label
                width="200px"
                readonly
                setBgColor="bgColorWhite"
                v-model="sanJeField.SAGONO"
              >
              </i-input>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('재해일시')"
                top-label
                v-model="sanJeField.OCCURDATE"
                type="date"
                width="200px"
                clearable
                @click:clearable="clearable('OCCURDATE')"
              >
              </i-input>
              <i-input
                class="mt-5"
                type="time"
                v-model="sanJeField.OCCURTIME"
                width="200px"
                clearable
                @click:clearable="clearable('OCCURTIME')"
                
              >
              </i-input>
              <i-input
                :label="$t('사고형태')"
                top-label
                width="200px"
                v-model="sanJeField.SAGOTYPE_NM1"
                readonly
                setBgColor="bgColorWhite"
                @click:appendInner="acdtOpen"
                append-inner-icon="mdi-magnify"
              >
              </i-input>
              <i-input
                width="200px"
                v-model="sanJeField.SAGOTYPE_NM2"
                readonly
                setBgColor="bgColorWhite"
                class="mt-4"
              >
              </i-input>
              <i-input
                width="200px"
                v-model="sanJeField.SAGOTYPE_NM3"
                readonly
                setBgColor="bgColorWhite"
                class="mt-4"
              ></i-input>
              <i-select
                :label="$t('상병코드')"
                top-label
                width="200px"
                v-model="sanJeField.SANG_CD"
                :items="codeList.CodeOfSang"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
            </div>
            <div class="d-flex">
              <i-select
                :label="$t('상해종류')"
                top-label
                width="200px"
                v-model="sanJeField.INJURYTYPE"
                :items="codeList.INJURYTYPE"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
              <i-select
                :label="$t('상해부위')"
                top-label
                v-model="sanJeField.INJURYPART"
                :items="codeList.INJURYPART"
                item-value="COD"
                item-title="TXT"
                width="200px"
              >
              </i-select>
              <i-input
                :label="$t('사고위치')"
                top-label
                width="200px"
                v-model="sanJeField.SAGOLOC"
              >
              </i-input>
              <i-select
                :label="$t('회사구분')"
                top-label
                width="200px"
                bg-color="#EEEEEE"
                readonly
                setBgColor="bgColorWhite"
                v-model="sanJeField.CMPNY_DIV"
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
              <i-select
                :label="$t('사고회사구분')"
                top-label
                width="200px"
                v-model="sanJeField.SAGO_CMPNY_DIV"
                :items="codeList.SAGO_CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
              <i-input
                :label="$t('노조가입여부')"
                top-label
                width="200px"
                v-model="sanJeField.UNION_YN"
                :value="sanJeField.UNION_YN === 'Y' ? '가입' : '미가입'"
                readonly
                setBgColor="bgColorWhite"
              >
              </i-input>
            </div>
            <div class="d-flex">
              <i-textarea
                :label="$t('사고개요')"
                top-label
                width="650px"
                v-model="sanJeField.SAGOGAEYO"
              ></i-textarea>
              <i-textarea
                :label="$t('상병명')"
                width="650px"
                top-label
                v-model="sanJeField.SANGBYUNG"
              ></i-textarea>
            </div>
            <div class="d-flex align-center">
              <i-textarea
                :label="$t('비고')"
                top-label
                v-model="sanJeField.BIGO"
                width="650px"
                row="3"
              ></i-textarea>
              <div style="width: 650px">
                <span class="gridTitle">그룹사 재직이력</span>
                <div class="d-flex">
                  <RealGrid
                    ref="grdPop1"
                    style="height: 110px"
                    :grid-view-option="grdPop1prop.gridViewOption"
                    :keys="grdPop1prop.keys"
                    :fields="grdPop1prop.fields"
                    :columns="grdPop1prop.columns"
                  />
                </div>
              </div>
            </div>

            <span class="gridTitle">신청/요양정보</span>
            <div class="d-flex">
              <i-select
                :label="$t('진행상태')"
                top-label
                width="200px"
                v-model="sanJeField.STATUS"
                :items="codeList.STATUS"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
              <v-btn class="mt-5 mr-2" @click="saveSTATUS">상태반영</v-btn>
              <span class="mt-6">※ 신청, 승인, 불승인 시 상태반영버튼을 클릭해주세요</span>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('승인일자')"
                top-label
                width="200px"
                v-model="sanJeField.OKDTE"
                type="date"
                clearable
                @click:clearable="clearable('OKDTE')"
              ></i-input>
              <i-input
                :label="$t('파일번호')"
                top-label
                width="200px"
                v-model="sanJeField.FILENUM"
              >
              </i-input>
              <i-input
                :label="$t('신청일자')"
                top-label
                width="200px"
                v-model="sanJeField.REQDTE"
                type="date"
                clearable
                @click:clearable="clearable('REQDTE')"
              ></i-input>
              <i-select
                :label="$t('가입번호')"
                top-label
                v-model="sanJeField.GAINUM"
                :items="codeList.GAINUM"
                item-value="COD"
                item-title="TXT"
                width="200px"
              >
              </i-select>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('승인발송일')"
                top-label
                width="200px"
                v-model="sanJeField.EMAILDTE"
                readonly
                setBgColor="bgColorWhite"
                type="text"
                clearable
                @click:clearable="clearable('EMAILDTE')"
              >
              </i-input>
              <v-btn class="mt-5" @click="OKMAIL">메일발송</v-btn>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('요양시작일')"
                top-label
                width="200px"
                v-model="sanJeField.YOSTART"
                type="date"
                clearable
                @click:clearable="clearable('YOSTART')"
              >
              </i-input>
              <i-input
                :label="$t('입원기간')"
                top-label
                width="150px"
                readonly
                class="mr-1"
                setBgColor="bgColorWhite"
                v-model="sanJeField.FROMDTE1"
              >
              </i-input>
              <span class="mt-5">~</span>
              <i-input
                top-label
                width="150px"
                readonly
                class="ml-1"
                setBgColor="bgColorWhite"
                v-model="sanJeField.TODTE1"
              >
              </i-input>
              <i-input
                :label="$t('통원기간')"
                top-label
                width="150px"
                readonly
                class="mr-1"
                setBgColor="bgColorWhite"
                v-model="sanJeField.FROMDTE2"
              >
              </i-input>
              <span class="mt-5">~</span>
              <i-input
                top-label
                width="150px"
                readonly
                class="ml-1"
                setBgColor="bgColorWhite"
                v-model="sanJeField.TODTE2"
              >
              </i-input>
              <i-input
                :label="$t('요양기관')"
                top-label
                width="200px"
                readonly
                setBgColor="bgColorWhite"
                v-model="sanJeField.HOSPITAL"
              >
              </i-input>
              <i-input
                :label="$t('요양일수')"
                top-label
                width="150px"
                readonly
                setBgColor="bgColorWhite"
                v-model="sanJeField.YODAY_CNT"
              >
              </i-input>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('종결(예정)일')"
                top-label
                width="192px"
                v-model="sanJeField.TARGETDTE"
                type="date"
                margin="4px"
                clearable
                @click:clearable="clearable('TARGETDTE')"
              >
              </i-input>
              <v-checkbox v-model="endDteFlag.FLAG" class="mt-5" />
              <i-input
                :label="$t('종결일')"
                top-label
                width="200px"
                v-model="sanJeField.ENDDTE"
                type="date"
                clearable
                @click:clearable="clearable('ENDDTE')"
              />
              <i-select
                :label="$t('취업치료 구분')"
                top-label
                width="200px"
                v-model="sanJeField.WORK_HEAL_GBN"
                :items="codeList.WORK_HEAL_GBN"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
              <i-input
                :label="$t('취업치료 시작일')"
                top-label
                width="200px"
                v-model="sanJeField.WORK_HEAL_DT"
                type="date"
                clearable
                @click:clearable="clearable('WORK_HEAL_DT')"
              >
              </i-input>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('종결발송일')"
                top-label
                width="200px"
                readonly
                setBgColor="bgColorWhite"
                v-model="sanJeField.ENDEMAILDTE"
                type="text"
              >
              </i-input>
              <v-btn class="mt-5" @click="ENDMAIL">메일발송</v-btn>
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('휴직일자')"
                top-label
                width="200px"
                v-model="sanJeField.HUDTE"
                type="date"
                clearable
                @click:clearable="clearable('HUDTE')"
              >
              </i-input>
              <i-input
                :label="$t('휴직일수')"
                top-label
                width="200px"
                v-model="sanJeField.HUDAY"
                number
                maxlength="4"
              >
              </i-input>
              <i-input
                :label="$t('산정기준일')"
                top-label
                width="200px"
                v-model="sanJeField.SALARYDTE"
                type="date"
                clearable
                margin="5px"
                @click:clearable="clearable('SALARYDTE')"
              >
              </i-input>
              <v-checkbox v-model="sanJeField.AUTO_SALARYDTE" label="자동계산" true-value="Y" false-value="N" class="mt-5 mr-5" />
              <i-input
                :label="$t('평균임금')"
                top-label
                width="200px"
                @keyup="numberRequed('평균임금')"
                v-model="sanJeField.SALARY"
              >
              </i-input>
              <v-btn @click="redirectPage" class="mt-5"
                >평균임금 페이지 이동</v-btn
              >
            </div>
            <div class="d-flex">
              <i-textarea
                :label="$t('비고')"
                top-label
                width="80%"
                row="3"
                v-model="sanJeField.YOBIGO"
              ></i-textarea>
            </div>
            <div class="d-flex">
              <i-textarea
                :label="$t('추가내용')"
                top-label
                width="80%"
                row="3"
                v-model="sanJeField.ADD_DESC"
              ></i-textarea>
            </div>
            <span class="gridTitle">위로금 현황</span>
            <div class="d-flex">
              <i-select
                :label="$t('합의상태')"
                top-label
                width="200px"
                v-model="sanJeField.HAP_STATUS"
                :items="codeList.HAP_STATUS"
                item-value="COD"
                item-title="TXT"
              >
              </i-select>
              <i-input
                :label="$t('합의일')"
                top-label
                width="200px"
                v-model="sanJeField.HAPDTE"
                type="date"
                clearable
                @click:clearable="clearable('HAPDTE')"
              >
              </i-input>
              <i-input
                :label="$t('장해등급')"
                top-label
                width="100px"
                v-model="sanJeField.GRADE"
                readonly
              >
              </i-input>
              <i-input
                :label="$t('합의금')"
                top-label
                width="200px"
                @keyup="numberRequed('합의금')"
                v-model="sanJeField.HAPAMT"
              >
              </i-input>
              <i-input
                :label="$t('은행')"
                top-label
                width="100px"
                v-model="sanJeField.BANK"
              >
              </i-input>
              <i-input
                :label="$t('등급판정일')"
                top-label
                width="200px"
                v-model="sanJeField.GRADEDTE"
                type="date"
                clearable
                @click:clearable="clearable('GRADEDTE')"
              >
              </i-input>
            </div>
            <div class="d-flex">
              <i-textarea
                width="1100px"
                :label="$t('비고')"
                top-label
                row="3"
                v-model="sanJeField.HAPBIGO"
              >
              </i-textarea>
            </div>
            <span class="gridTitle">비급여 현황</span>
            <div class="d-flex">
              <RealGrid
                ref="grdPopUp"
                class="mt-2"
                style="height: 200px"
                :grid-view-option="grdPopUpProps.gridViewOption"
                :keys="grdPopUpProps.keys"
                :fields="grdPopUpProps.fields"
                :columns="grdPopUpProps.columns"
              />
            </div>
            <i-textarea
              :label="$t('비고')"
              top-label
              v-model="sanJeField.BE_BIGO"
              width="80%"
              row="3"
            ></i-textarea>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <AcdtPopup @selectedArr="selectedArr" />
    <CommonCodePopUpSAF
      ref="acdtPopupRef"
      @selected="selectedArr"
    ></CommonCodePopUpSAF>
    <SAFAG0010DblClickPopupYoYang
      ref="DblClickPopupYoYang"
      @saved="yoYangSaved"
    />
    <SAFAG0010SaupjangPopup ref="SaupjangPopup" />
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />
    <IUploadPopup
      ref="fileUpload"
      :cmpny-use-yn="fileCmpny"
      @uploaded="uploaded($event)"
    ></IUploadPopup>
    <IUploadPopup
      ref="fileUpload2"
      :cmpny-use-yn="fileCmpny"
      @uploaded="uploaded2($event)"
    ></IUploadPopup>
    <SendMailPopup ref="sendMail1" @compleat="compleat"></SendMailPopup>
    <SendMailPopup ref="sendMail2" @compleat="compleat"></SendMailPopup>
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.content-area {
  position: relative;
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
}
</style>
