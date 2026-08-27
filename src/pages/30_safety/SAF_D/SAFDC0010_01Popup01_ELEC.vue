<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import {
  commonExecuteApi,
  commonSearchApi,
  getCodeList,
  commonSendApi,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import { isEmpty } from 'lodash-es'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SafeRuleGbnPopup from '@/components/popup/SafeRuleGbnPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import SAFDC0010BikeNoPopup from './SAFDC0010BikeNoPopup.vue'
import SAFDC0010CarNoPopup from './SAFDC0010CarNoPopup.vue'
import SAFDC0010VioCntPopup from './SAFDC0010VioCntPopup.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF_ELEC.vue'

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const userLogStore = useLogsStore()
const dialog = ref(false)
const grdMain = ref(null)
const t = useI18n().t
const menuTitle = ref(null)
const approvalReadOnly = ref(true) //승인신청 disabled
const approvalCancleReadOnly = ref(true) //승인취소 disabled
const emit = defineEmits(['closed'])

//수칙위반 관련 로직 시작

const safetyEmpPopup = ref(null) //성명
const safetyLocation = ref(null) //장소
const safetyFileUpload = ref(null) //위반사항 파일첨부
const safetyActionFileUpload = ref(null) //조치사항 파일첨부
const safetyDansokEmpPopup = ref(null) //단속자성명
const checkTargetPopup = ref(null) //점검대상물 팝업
const sagoDivPopup = ref(null) //잠재사고유형 팝업
const safetyVioDeptPopup = ref(null) //위반조직 팝업
const appEmail = ref('')
const fileBtnVisible = ref('')

const safetyField = reactive({
  VIO_GDIV_NM: '',                          // 종류
  VIO_GDIV: '',                             // 위반구분 코드
  VIO_MDIV: '',                             // 위반상세구분
  VIO_MDIV_NM: '',                          // 종류옆
  VIO_DT1: '',                              // 위반일시
  VIO_TIME: '',
  VIO_TIME2: '',                            // 위반일시 옆 시간
  VIOLATOR: '',                             // 위반자성명
  BSNS_CD: '',                              // 위반자 사업본부
  DEPT_CD: '',                              // 위반자 부서
  ASGN_CD: '',                              // 위반자 조직
  VIO_EMP_NO: '',                           // 위반자사번
  JOB_TIT_NM: '',                           // 위반자직위
  VIO_EMP_ASGN: '',                         // 위반자소속조직
  ASGN_NM: '',                              // 위반조직
  IO_DIV: '',                               // 위반대상구분
  VEND_CD: '',                              // 사외협력사 코드
  VEND_NAME: '',                            // 사외협력사
  VIO_DESC: '',                             // 내용
  VIO_SPLC_NM: '',                          // 장소
  VIO_LPLC: '',                             // 위반장소(대)
  VIO_MPLC: '',                             // 위반장소(중)
  VIO_SPLC: '',                             // 위반장소(소)
  VIO_PLC_DESC: '',                         // 장소상세
  SHIP_NO: '',                              // 호선No.
  DANSOK_EMP_NM: userStore.empNm,           // 단속자성명
  DANSOK_ASGN_CD: userStore.asgnCd,         // 단속자 조직코드
  DANSOK_ASGN_NM: userStore.asgnFullNm,     // 단속자조직이름
  DANSOK_DEPT_CD: userStore.deptCd,         // 단속자 부서코드
  DANSOK_EMP_NO: userStore.empNo,           // 단속자사번
  APP_EMP_NO: '',                           // 승인자
  FILE_ID1: '',                             // 위반사항 FILE_ID
  FILE_ID2: '',                             // 조치사항FILE_ID
  COMPANY: '',                              // 위반자 회사
  VIO_NO: '',                               // 위반번호
  INSERT_USER_ID: '',                       // 등록자
  STATUS: '',                               // 결재상태
  SAGO_DIV_L: '',                           // 잠재사고유형(대) 코드
  SAGO_DIV_L_NM: '',                        // 잠재사고유형(대) 이름
  SAGO_DIV_M: '',                           // 잠재사고유형(중)코드
  SAGO_DIV_M_NM: '',                        // 잠재사고유형(중) 이름
  SAGO_DIV_S: '',                           // 잠재사고유형(소) 코드
  SAGO_DIV_S_NM: '',                        // 잠재사고유형(소) 이름
  CHECK_TARGET_OBJ1_NM: '',                 // 대상 점검물 LV1 이름
  CHECK_TARGET_OBJ1: '',                    // 대상 점검물 LV1 코드
  CHECK_TARGET_OBJ2_NM: '',                 // 대상 점검물 LV2이름
  CHECK_TARGET_OBJ2: '',                    // 대상 점검물 LV2 코드
  CHECK_TARGET_OBJ3_NM: '',                 // 대상 점검물 LV3
  CHECK_TARGET_OBJ3: '',                    // 대상 점검물 LV3 코드
  DIV: 'A',                                 //  위반 구분 (A: 수칙위반, B: 교통위반)
})

//안전수칙위반등록 코드리스트
const codeList = reactive({
  GUBUN: [], //대상구분
  APP_EMP_NO: [], //승인자
  VIO_GDIV: [], //위반종류
  VIO_MDIV: [], //위반종류상세
  SHIP_NO: [], //호선
})

//안전수칙위반 코드 초기화
const initcodeList = () => {
  console.log("userStore.deptCd", userStore.deptCd)
  console.log("userStore.deptCd", safetyField.DANSOK_DEPT_CD)
  Promise.all([
    getCodeList('HHIZ020'),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_04',
      param: {
        
        // CMPNY_DIV: 'HHI', 
        // 일렉일 경우 승인자가 나오지 않아서, 사용자의 회사구분 코드를 넘김.
        CMPNY_DIV: userStore.cmpnyDiv, 
        DANSOK_EMP_NO: safetyField.DANSOK_EMP_NO,
      },
    }),
    getCodeList('HHIF110'),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_17',
      param: {},
    }),
  ]).then((res) => {
    codeList.GUBUN = res[0].ORESULT_CUR
    codeList.APP_EMP_NO = res[1].ORESULT_CUR
//    console.log(codeList.APP_EMP_NO)
    //codeList.VIO_GDIV = res[2].ORESULT_CUR.filter((x) => !x.COD.includes('S') && !x.COD.includes('C'))
    codeList.SHIP_NO = res[3].ORESULT_CUR
  })
  safetyField.VIO_TIME2 = '00:00' //위반일시 옆 시간에 자정
}

const openPopup = () => {
  if(isEmpty(safetyField.VIO_NO)){
    safetyField.VIO_DT1 = dayjs().format('YYYY-MM-DD')
    safetyField.VIO_TIME2 = dayjs().format('HH:mm')
    safetyField.DANSOK_EMP_NO = userStore.empNo
    safetyField.DANSOK_EMP_NM = userStore.empNm
  }
  dialog.value = true
}

//로우 더블클릭시 안전수칙위반 데이터 바인딩
const openPopup2 = (rowData) => {
  console.log('받은데이터', rowData)
  dialog.value = true

  for (const [key, value] of Object.entries(rowData)) {
    if (safetyField.hasOwnProperty(key)) {
      if (key === 'VIO_TIME') {
        safetyField.VIO_DT1 = value.substr(0, 10) //위반일시
        safetyField.VIO_TIME2 = value.substr(11, 5) //위반시각
      } else {
        if (key === 'VIO_TIME2') {
          continue
        }
        safetyField[key] = value
      }
    }
  }
  //대상구분,승인자 조회
  Promise.all([
    getCodeList('HHIZ020'),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_04',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        DANSOK_EMP_NO: safetyField.DANSOK_EMP_NO, //단속자 사번
      },
    }),
    getCodeList('HHIF110'),
  ]).then((res) => {
    codeList.GUBUN = res[0].ORESULT_CUR
    codeList.APP_EMP_NO = res[1].ORESULT_CUR
    //safetyField.APP_EMP_NO = rowData.APP_EMP_NO
    codeList.VIO_GDIV = res[2].ORESULT_CUR.filter((x) => !x.COD.includes('S') && !x.COD.includes('C'))
  })
  console.log('Safety Field:', safetyField)

  setSafetyButtonStatus() //상태에 따른 버튼 활성화,비활성화 처리
}

onMounted(() => {
  initcodeList()
})

const setSafetyButtonStatus = () => {
  //데이터를 저장한 사람이 로그인 유저와 일치하면 삭제,승인신청 활성화 일치하지 않으면 비활성화
  if (userStore.userId === safetyField.INSERT_USER_ID && safetyField.STATUS) {
    console.log('로그인유저와 일치함')
    menuTitle.value.disableBtn('btnDelete', false) //삭제버튼활성화
    approvalReadOnly.value = false //승인신청 활성화
    //승인대기상태 일때는 승인신청,삭제 비활성화
    if (safetyField.STATUS === '20') {
      console.log('2')
      approvalReadOnly.value = true //승인신청 비활성화
      approvalCancleReadOnly.value = false //승인취소 활성화
      menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
    }
    //승인상태일때는 승인신청,승인취소,삭제 비활성화
    else if (safetyField.STATUS === '30') {
      console.log('3')
      approvalReadOnly.value = true
      approvalCancleReadOnly.value = true
      menuTitle.value.disableBtn('btnDelete', true)
    }else if(safetyField.STATUS === '11'){
      console.log('반려')
      approvalReadOnly.value = true
      approvalCancleReadOnly.value = true
      menuTitle.value.disableBtn('btnUpdate', true) //저장버튼 비활성화
      menuTitle.value.disableBtn('btnDelete', false) //삭제버튼 활성화
    }
  } else {
    console.log('로그인유저와 일치하지 않음')
    menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
    menuTitle.value.disableBtn('btnUpdate', true) //저장버튼 비활성화
    approvalReadOnly.value = true //승인신청 비활성화
    approvalCancleReadOnly.value = true //승인신청취소 비활성화
  }

  if (safetyField.STATUS === '30'){
    fileBtnVisible.value = true
  } else {
    fileBtnVisible.value = false
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSafetySave)
      .setQuery(saveSafetyData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else {
    closePopup()
    //팝업 닫을때 초기화
  }
}

const closePopup = () => {
  for (let i in safetyField) {
    safetyField[i] = ''
  }
  menuTitle.value.disableBtn('btnDelete', false) //삭제버튼활성화
  menuTitle.value.disableBtn('btnUpdate', false) //저장버튼활성화
  emit('closed')
  dialog.value = false
}

//안전수칙위반 삭제관련 로직 시작
const beforeDelete = () => {
  if (userStore.userId != safetyField.INSERT_USER_ID) {
    Message.warn(t('수칙위반 삭제는 등록자 본인만 가능합니다.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let deleteData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    VIO_NO: safetyField.VIO_NO,
    REASON: '',
    USER_ID: userStore.userId,
  }
  deleteParam.push(deleteData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE02',
    list: deleteParam,
  })
}

const afterDelete = () => {
  closePopup()
}
//안전수칙위반 삭제관련 로직 끝

//안전수칙위반 저장 관련 로직 시작
const beforeSafetySave = () => {
  //필수값 체크
  if (!safetyField.VIO_GDIV) {
    Message.warn(t('위반종류는 필수값입니다.'))
    return false
  } 
  else if (!safetyField.VIO_MDIV){
    Message.warn(t('위반종류 상세는 필수값입니다.'))
    return false
  }
  else if (!safetyField.VIO_DT1 || !safetyField.VIO_TIME2) {
    Message.warn(t('위반일시,시각은 필수값입니다.'))
    return false
  } else if (!safetyField.VIOLATOR) {
    Message.warn(t('위반자성명은 필수값입니다.'))
    return false
  } else if (!safetyField.ASGN_NM) {
    Message.warn(t('위반조직은 필수값입니다.'))
    return false
  } else if (!safetyField.VIO_SPLC_NM) {
    Message.warn(t('장소는 필수값입니다.'))
    return false
  } else if (!safetyField.SAGO_DIV_L) {
    Message.warn(t('잠재사고유형은 필수값입니다.'))
    return false
  } else if (!safetyField.DANSOK_EMP_NM) {
    Message.warn(t('단속자는 필수값입니다.'))
    return false
  } else if (!safetyField.APP_EMP_NO) {
    Message.warn(t('승인자는 필수값입니다.'))
    return false
  }
  return true
}

// 저장
const saveSafetyData = () => {

  if (safetyField.DANSOK_DEPT_CD == null || safetyField.DANSOK_DEPT_CD == "") {
    safetyField.DANSOK_DEPT_CD = userStore.deptCd
  }

  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
    VIO_NO: safetyField.VIO_NO, //위반No
    VIO_DT1: safetyField.VIO_DT1, //위반일시
    VIO_TIME2: safetyField.VIO_TIME2, //위반일시 옆 시간
    BSNS_CD: safetyField.BSNS_CD, //위반자 사업부
    DEPT_CD: safetyField.DEPT_CD, //위반자 부서
    ASGN_CD: safetyField.ASGN_CD, //위반자 조직
    VIO_EMP_NO: safetyField.VIO_EMP_NO, //위반자 사번
    VIOLATOR: safetyField.VIOLATOR, //위반자 성명
    IO_DIV: safetyField.IO_DIV, //위반자 대상구분(직영,협력사)
    VIO_GDIV: safetyField.VIO_GDIV, //위반구분
    VIO_MDIV: safetyField.VIO_MDIV, //위반구분 상세
    CHECK_TARGET_OBJ1: safetyField.CHECK_TARGET_OBJ1, //점검대상물(대)
    CHECK_TARGET_OBJ2: safetyField.CHECK_TARGET_OBJ2, //점검대상물(중)
    CHECK_TARGET_OBJ3: safetyField.CHECK_TARGET_OBJ3, //점검대상물(소)
    SAGO_DIV_L: safetyField.SAGO_DIV_L, //잠재사고유형LV1
    SAGO_DIV_M: safetyField.SAGO_DIV_M, //잠재사고유형LV2
    SAGO_DIV_S: safetyField.SAGO_DIV_S, //잠재사고유형LV3
    VIO_DESC: safetyField.VIO_DESC, //내용
    VIO_LPLC: safetyField.VIO_LPLC, //위반장소(대)
    VIO_MPLC: safetyField.VIO_MPLC, //위반장소(중)
    VIO_SPLC: safetyField.VIO_SPLC, //위반장소(소)
    VIO_PLC_DESC: safetyField.VIO_PLC_DESC, //위반장소상세
    DANSOK_ASGN_CD: safetyField.DANSOK_ASGN_CD, //단속자 조직
    DANSOK_EMP_NO: safetyField.DANSOK_EMP_NO, //단속자 사번
    APP_EMP_NO: safetyField.APP_EMP_NO, //승인자 사번
    DANSOK_DEPT_CD: safetyField.DANSOK_DEPT_CD, //단속자 부서
    VEND_NAME: safetyField.VEND_NAME, //사외협력사옆
    SHIP_NO: safetyField.SHIP_NO, //호선No.
    FILE_ID1: safetyField.FILE_ID1, //위반사항 파일아이디
    FILE_ID2: safetyField.FILE_ID2, //조치사항 파일아이디
    USER_ID: userStore.userId, //유저아이디
    SAVE_YN: safetyField.VIO_NO === '' ? 'N' : 'Y', //저장여부
    COMPANY: safetyField.COMPANY, //위반자 회사
  }
  saveParam.push(saveData)

  console.log("saveData", saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE01',
    list: saveParam,
  })
}

const afterSave = (res) => {
  //신규저장시에만 지급중단 로직 실행
  if (!safetyField.VIO_NO) {
    setHdPayStop(res) //안전수칙위반 저장후 위반자에 대해 안전페이 지급중단함
  }
  // closePopup()
}
//안전수칙위반 저장 관련 로직 끝

//안전페이 지급중단 로직 시작
const setHdPayStop = async (res) => {
  //일반수칙 --> VIO_GDIV : B
  //절대수칙 --> VIO_GDIV : A
  //중대성수칙 --> VIO_GDIV : D가 포함되어있는 코드
  console.log('지급중단 데이터', res.list[0])
  let day = dayjs()
  let setHdPayStopParam = {
    CMPNY_DIV: safetyField.COMPANY, //사업장구분
    YEAR: dayjs().$y, //현재년도
    MNTH: (dayjs().$M + 1).toString().padStart(2, '0'), //현재월
    EMP_NO: res.list[0].VIO_EMP_NO, //지급중단 대상자 사번
    PAYMENT_STOP_SEQ: 0, //지급중단 SEQ
    BSNS_CD: res.list[0].BSNS_CD, //지급중단 대상자 사업부
    DEPT_CD: res.list[0].DEPT_CD, //지급중단 대상자 부서코드
    ASGN_CD: res.list[0].ASGN_CD, //지급중단 대상자 소속코드
    ASGN_NAME: safetyField.ASGN_NM, //지급중단 대상자 소속명
    EMP_NAME: res.list[0].VIOLATOR, //지급중단 대상자 성명
    ORGN_DIV: safetyField.IO_DIV, //지급중단 대상자 조직구분(A=직업,B=사내협력사)
    PAYMENT_STOP_TYPE: 'A', //지급중단타입(A:개인,B:조직)
    PAYMENT_STOP_CD: '', //지급중단구분(HHIC40)
    PAYMENT_STOP_DETAIL_CD: '', //지급중단상세(HHIC50)
    PAYMENT_STOP_INSERT_DATE: '', //지급중단 등록일
    PAYMENT_STOP_FROM: '', //지급중단 시작일
    PAYMENT_STOP_TO: '', //지급중단 종료일
    PAYMENT_YN: 'Y', //지급중단 여부
    REMARK: '', //비고
    INSERT_USER_ID: userStore.userId, //등록자
    INSERT_USER_IP: userStore.clientIp, //등록자 IP
    UPDATE_USER_ID: '', //수정자
    UPDATE_USER_IP: '', //수정자IP
  }
  //일반수칙일때
  if (res.list[0].VIO_GDIV === 'B') {
    setHdPayStopParam.PAYMENT_STOP_CD = '30' //수칙위반 코드
    setHdPayStopParam.PAYMENT_STOP_DETAIL_CD = '70' //일반수칙코드
    setHdPayStopParam.PAYMENT_STOP_FROM = day.format('YYYY-MM-DD') //지급중단시작일은 수칙위반 등록되었을때 시작
    setHdPayStopParam.PAYMENT_STOP_TO = day.add(1, 'day').format('YYYY-MM-DD') //지급중단중단일은 수칙위반 등록일자 + 1일까지
    let saveParam = []
    saveParam.push(setHdPayStopParam)
    console.log('일반수칙 안전페이 지급 중단 파람', saveParam)
    await commonExecuteApi({
      queryId: 'EDUDB0040_TAB01_SAVE_01',
      list: saveParam,
    })
  }
  //절대수칙이나 중점관리항목일때
  else if (res.list[0].VIO_GDIV === 'A' || res.list[0].VIO_GDIV.includes('D')) {
    setHdPayStopParam.PAYMENT_STOP_CD = '30' //수칙위반 코드
    setHdPayStopParam.PAYMENT_STOP_FROM = day.format('YYYY-MM-DD') //지급중단시작일은 수칙위반 등록되었을때 시작
    setHdPayStopParam.PAYMENT_STOP_TO = day.add(5, 'day').format('YYYY-MM-DD') //지급중단중단일은 수칙위반 등록일자 + 5일까지
    //절대수칙일때
    if (res.list[0].VIO_GDIV === 'A') {
      console.log('절대수칙')
      setHdPayStopParam.PAYMENT_STOP_DETAIL_CD = '50'
    }
    //중점관리항목일때
    else {
      console.log('중점관리')
      setHdPayStopParam.PAYMENT_STOP_DETAIL_CD = '60'
    }
    let saveParam = []
    saveParam.push(setHdPayStopParam)
    console.log('절대수칙 또는 중점관리항목 안전페이 지급 중단 파람', saveParam)
    await commonExecuteApi({
      queryId: 'EDUDB0040_TAB01_SAVE_01',
      list: saveParam,
    })
  }
}
//안전페이 지급중단 로직 끝

//성명(위반자) 클릭 이벤트
const openSafetyEmpPopup = async (gbn) => {
  if (gbn === '인원조회') {
    safetyEmpPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
      EMP_NM: safetyField.VIOLATOR,
      readonly: true,
    })
  }
}

//성명(위반자) 선택 이벤트
const selectedSafetyEmp = (val) => {
  safetyField.VIOLATOR = val.EMP_NM //성명에 이름
  safetyField.VIO_EMP_NO = val.EMP_NO //사번에 사번
  safetyField.JOB_TIT_NM = val.JOB_TIT_NM //직위에 직위
  safetyField.VIO_EMP_ASGN = val.ASGN_NM //소속조직에 조직
  //단기공사일대 위반조직 매핑 null 처리(직접선택하게 반영)
  if(val.USER_DIV === 'D'){
    safetyField.ASGN_NM = null //위반조직
  }else{
    safetyField.ASGN_NM = val.ASGN_NM //위반조직
  }
  safetyField.IO_DIV = val.USER_DIV //대상구분(직영,협력사)
  safetyField.DEPT_CD = val.DEPT_CD //위반자 부서
  safetyField.BSNS_CD = val.BSNS_CD //위반자 사업부
  safetyField.ASGN_CD = val.ASGN_CD //위반자 조직
  safetyField.COMPANY = val.CMPNY_DIV //위반자 회사

  Promise.all([
    getCodeList('HHIF110'),
  ]).then((res) => {
    codeList.VIO_GDIV = res[0].ORESULT_CUR.filter((x) => !x.COD.includes('S') && !x.COD.includes('C'))
  })
}

const openSafetyLocationPopup = () => {
  safetyLocation.value.openPopup('장소')
}

const selectedSafetyLocation = (val) => {
  safetyField.VIO_LPLC = val[0].COD //장소구분(대)
  safetyField.VIO_MPLC = val[1].COD //장소구분(중)
  safetyField.VIO_SPLC = val[2].COD //장소구분(소)
  safetyField.VIO_SPLC_NM = val[2].TXT
}

//단속자 인원팝업 오픈 이벤트
const openDansokEmpPopup = async (gbn) => {
  if (gbn === '단속자인원조회') {
    safetyDansokEmpPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
      EMP_NM: safetyField.DANSOK_EMP_NM,
      readonly: true,
    })
  }
}

//단속자 인원팝업 선택 이벤트
const selectedDansokEmp = (val) => {
  safetyField.DANSOK_EMP_NM = val.EMP_NM
  safetyField.DANSOK_EMP_NO = val.EMP_NO
  safetyField.DANSOK_ASGN_NM = val.ASGN_NM
  safetyField.DANSOK_ASGN_CD = val.ASGN_CD
  safetyField.DANSOK_DEPT_CD = val.DEPT_CD
}
//파일첨부 관련 로직 시작

//위반사항 파일첨부 버튼 클릭 이벤트
const violoationFileUpload = () => {
  if (safetyField.FILE_ID1) {
    safetyFileUpload.value.setGuid(safetyField.FILE_ID1)
    safetyField.FILE_ID1 = safetyFileUpload.value.guid
    safetyFileUpload.value.openPopup(safetyField.FILE_ID1)
  } else {
    safetyFileUpload.value.setGuid()
    safetyField.FILE_ID1 = safetyFileUpload.value.guid
    safetyFileUpload.value.openPopup(safetyField.FILE_ID1)
    //처음 등록할때 파일업로드 하지않고 저장했다가 나중에 파일업로드 할때(승인상태에 따라서 수정이 안되는 경우가 있는데 값은 수정못해도 파일은 업로드 할수있게 하기 위해)
    if (safetyField.VIO_NO) {
      let paramData = []
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        VIO_NO: safetyField.VIO_NO,
        COMPANY: safetyField.COMPANY,
        FILE_ID1: safetyField.FILE_ID1,
      }
      paramData.push(param)
      commonExecuteApi({
        queryId: 'SAFDC0010_SAVE15',
        list: paramData,
      })
    }
  }
}

//조치사항 파일첨부 클릭 이벤트
const violoationActionFileUpload = () => {
  if (safetyField.FILE_ID2) {
    safetyActionFileUpload.value.setGuid(safetyField.FILE_ID2)
    safetyField.FILE_ID2 = safetyActionFileUpload.value.guid
    safetyActionFileUpload.value.openPopup(safetyField.FILE_ID2)
  } else {
    safetyActionFileUpload.value.setGuid()
    safetyField.FILE_ID2 = safetyActionFileUpload.value.guid
    safetyActionFileUpload.value.openPopup(safetyField.FILE_ID2)
    //처음 등록할때 파일업로드 하지않고 저장했다가 나중에 파일업로드 할때(승인상태에 따라서 수정이 안되는 경우가 있는데 값은 수정못해도 파일은 업로드 할수있게 하기 위해)
    if (safetyField.VIO_NO) {
      let paramData = []
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        VIO_NO: safetyField.VIO_NO,
        COMPANY: safetyField.COMPANY,
        FILE_ID2: safetyField.FILE_ID2,
        DIV: safetyField.DIV,
        USER_ID: userStore.userId 
      }
      paramData.push(param)
      commonExecuteApi({
        queryId: 'SAFDC0010_SAVE16',
        list: paramData,
      })
    }
  }
}

const actionUploaded = (fileId) => {
  if (!safetyField.FILE_ID2) {
    safetyField.FILE_ID2 = fileId.fileId //조치사항 파일아이디
  }
}

//파일첨부 관련 로직 끝

//수칙위반 위반조직 오픈 이벤트
const openSafetyVioDeptPopup = () => {
  safetyVioDeptPopup.value.openPopup()
}

//위반조직 선택 이벤트
const selectedVioDept = (val) => {
  safetyField.ASGN_NM = val.ASGN_FULL_NM
  safetyField.ASGN_CD = val.ASGN_CD
  safetyField.DEPT_CD = val.DEPT_CD
  safetyField.BSNS_CD = val.BSNS_CD
  console.log('위반조직 선택 이벤트', val)

  Promise.all([
    getCodeList('HHIF110'),
  ]).then((res) => {
    codeList.VIO_GDIV = res[0].ORESULT_CUR.filter((x) => !x.COD.includes('S') && !x.COD.includes('C'))
  })
}

//점검 대상물 오픈 이벤트
const openCheckTargetPopup = () => {
  checkTargetPopup.value.openPopup('점검대상물')
}

//점검 대상물 선택 이벤트
const selectedTarget = (val) => {
  safetyField.CHECK_TARGET_OBJ1 = val[0].COD
  safetyField.CHECK_TARGET_OBJ1_NM = val[0].TXT
  safetyField.CHECK_TARGET_OBJ2 = val[1].COD
  safetyField.CHECK_TARGET_OBJ2_NM = val[1].TXT
  safetyField.CHECK_TARGET_OBJ3 = val[2].COD
  safetyField.CHECK_TARGET_OBJ3_NM = val[2].TXT
  console.log('점검대상물 선택', val)
}

//잠재사고유형 오픈 이벤트
const openSagoDivPopup = () => {
  sagoDivPopup.value.openPopup('잠재사고')
}

//잠재사고유형 선택 이벤트
const selectedSagoDivPopup = (val) => {
  safetyField.SAGO_DIV_L = val[0].COD //잠재사고유형(대) 코드
  safetyField.SAGO_DIV_L_NM = val[0].TXT //잠재사고유형(대) 이름
  safetyField.SAGO_DIV_M = val[1].COD //잠재사고유형(중)코드
  safetyField.SAGO_DIV_M_NM = val[1].TXT //잠재사고유형(중) 이름
  safetyField.SAGO_DIV_S = val[2].COD //잠재사고유형(소) 코드
  safetyField.SAGO_DIV_S_NM = val[2].TXT //잠재사고유형(소) 이름
  console.log('잠재사고 선택', val)
}

//승인신청 관련 로직 시작
const approval = () => {
  new saveFlowHelper(vm, t)
    .setBefore(saveSafetyData)
    .setQuery(saveApprovalData)
    .setAfter(afterApproval)
    .setConfirmMessage('승인신청 하시겠습니까?')
    .run()
}

const saveApprovalData = () => {
  let approvalParam = []
  let approvalData = {
    CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
    VIO_NO: safetyField.VIO_NO, //위반No
    APP_EMP_NO: safetyField.APP_EMP_NO, //단속자 사번
    USER_ID: userStore.userId, //로그인유저 아이디
  }

  approvalParam.push(approvalData)

  mailSet()
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE03',
    list: approvalParam,
  })  
}

const mailSet = async () => {
  dialog.value = false
  /* ******************** 메일 SET ******************* */
  const mailParams = reactive({
    EMAIL: [],
    SUBJECT: '[HiSEs]안전수칙위반등록 승인 요청 메일',
    CONTENT: '',
  })


  mailParams.CONTENT =
    `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>` +

          `위반일시: ${safetyField.VIO_DT1} ${safetyField.VIO_TIME2} <br />` +
          `위반자: ${safetyField.VIOLATOR} <br />` +
          `소속조직: ${safetyField.VIO_EMP_ASGN} <br />` +
          `단속자성명: ${safetyField.DANSOK_EMP_NM} <br />` +
          `내용: ${safetyField.VIO_DESC} <br />` +
          `
        </body>
      </html>`
      
  mailParams.EMAIL = [appEmail.value]
  commonSendApi(mailParams).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  })
}

const afterApproval = () => {
  closePopup()
}
//승인신청 관련 로직 끝

//승인신청 취소 관련 로직 시작
const cancelApproval = () => {
  new saveFlowHelper(vm, t)
    .setQuery(cancelApprovalSaveData)
    .setAfter(afterCancelApproval)
    .setConfirmMessage(
      `승인 신청을 취소합니다.
  수정후 재 신청할 수 있습니다!!`
    )
    .run()
}

const cancelApprovalSaveData = () => {
  let cencelApprovalParam = []
  let cencelApprovalData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    VIO_NO: safetyField.VIO_NO,
    USER_ID: userStore.userId,
  }
  cencelApprovalParam.push(cencelApprovalData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_CANCEL01',
    list: cencelApprovalParam,
  })
}

const afterCancelApproval = () => {
  closePopup()
}

const changeback = () => {
  
}

//승인신청 취소 관련 로직 끝

//권한에 따른 버튼 활성화 여부 설정 함수
const setButtonStatus = () => {
  //여기
  if (!safetyField.VIO_NO) {
    menuTitle.value.disableBtn('btnDelete', true)
  }
}
//수칙위반 관련 로직 끝

//위반종류 변경감지
watch(
  () => safetyField.VIO_GDIV,
  (newValue, oldValue) => {

    // let systemCode = 'HHIF110' + newValue
    // getCodeList(systemCode).then((res) => {
    //   if (oldValue) {
    //     safetyField.VIO_MDIV = ''
    //   }
    //   codeList.VIO_MDIV = res.ORESULT_CUR
    // })
    //safetyField.VIO_MDIV = ''
    codeList.VIO_MDIV = []
    const bsnscd = ''
    
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_03',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: safetyField.BSNS_CD,
      },
    }).then((res) => {
      codeList.VIO_MDIV = res.ORESULT_CUR.filter((x) => x.UP_COD.includes(newValue))
    })
  }
)

// 단속자 변경시
watch(() => safetyField.DANSOK_EMP_NO, (newValue, oldValue) => {
  commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_04',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      DANSOK_EMP_NO: newValue,
    },
  }).then((res) => {
    safetyField.APP_EMP_NO = ''
    codeList.APP_EMP_NO = res.ORESULT_CUR
  })
})

// 단속자 변경시
watch(() => safetyField.APP_EMP_NO, (newValue, oldValue) => {
  for(var appEmp of codeList.APP_EMP_NO) {
    if(appEmp.APP_EMP_NO == newValue) {
      appEmail.value = appEmp.EMAIL
      break
    }
  }
})

 watch(dialog, (newValue) => {
      if (newValue) {
        console.log('Dialog is opened!');
        codeList.VIO_GDIV= []
      }
    });

defineExpose({
  openPopup,
  openPopup2,
  initcodeList,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1600"
    eager
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
      안전수칙위반등록
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            
            <div class="d-flex mt-2">
              <i-input
                v-model="safetyField.VIO_DT1"
                :label="$t('위반일시')"
                width="150px"
                top-label
                type="date"
                required
              >
              </i-input>
              <i-input
                v-model="safetyField.VIO_TIME2"
                width="130px"
                class="mt-5"
                type="time"
              ></i-input>
              <i-input
                v-model="safetyField.VIOLATOR"
                :label="$t('위반자 성명')"
                width="200px"
                top-label
                required
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSafetyEmpPopup('인원조회')"
                @keydown.enter="
                  (e) => {
                    openSafetyEmpPopup('인원조회')
                  }
                "
              ></i-input>
              <i-input
                v-model="safetyField.VIO_EMP_NO"
                :label="$t('사번')"
                width="200px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="safetyField.JOB_TIT_NM"
                :label="$t('직위')"
                width="150px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="safetyField.VIO_EMP_ASGN"
                :label="$t('소속조직')"
                width="200px"
                top-label
                readonly
              ></i-input>
              <v-btn class="mt-5" @click="violoationFileUpload"
                >위반사항 파일첨부</v-btn
              >
              <v-btn v-if = "fileBtnVisible"
                 class="mt-5" 
                 @click="violoationActionFileUpload"
                >조치사항 파일첨부</v-btn
              >
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="safetyField.ASGN_NM"
                :label="$t('위반조직')"
                width="350px"
                top-label
                required
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSafetyVioDeptPopup"
              ></i-input>
              <i-select
                v-model="safetyField.IO_DIV"
                :label="$t('대상구분')"
                width="200px"
                top-label
                readonly
                :items="codeList.GUBUN"
                item-title="TXT"
                item-value="COD"
                required
              ></i-select>
              <i-input
                v-model="safetyField.VEND_NAME"
                class="mt-5"
                width="250px"
              ></i-input>
              <span class="mt-6"
                >소속조직으로 검색되지 않는 경우에 수기입력하세요.</span
              >
            </div>

            <div class="d-flex mt-2">
              <i-select
                v-model="safetyField.VIO_GDIV"
                :label="$t('위반 종류')"
                width="350px"
                top-label
                required
                :items="codeList.VIO_GDIV"
                item-title="TXT"
                item-value="COD"
                placeholder="위반조직 먼저 선택"
              >
              </i-select>
              <i-select
                v-model="safetyField.VIO_MDIV"
                :label="$t('위반 종류 상세')"
                top-label
                width="300px"
                required
                :items="codeList.VIO_MDIV"
                item-title="TXT"
                item-value="COD"
              ></i-select>
              <span
                class="sheetTitle"
                style="margin-left: 580px; margin-top: 20px"
                v-if="!isEmpty(safetyField.VIO_NO)"
              >
                위반정보 {{ safetyField.VIO_NO }}
              </span>
            </div>

            <div class="d-flex mt-2">
              <i-input
                :label="$t('잠재사고유형')"
                top-label
                width="200px"
                required
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSagoDivPopup"
                v-model="safetyField.SAGO_DIV_L_NM"
              >
              </i-input>
              <i-input
                width="200px"
                readonly
                class="mt-5"
                v-model="safetyField.SAGO_DIV_M_NM"
              >
              </i-input>
              <i-input
                width="200px"
                readonly
                class="mt-5"
                v-model="safetyField.SAGO_DIV_S_NM"
              >
              </i-input>
              <i-input
                :label="$t('점검 대상물')"
                top-label
                width="200px"
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="openCheckTargetPopup"
                v-model="safetyField.CHECK_TARGET_OBJ1_NM"
              >
              </i-input>
              <i-input
                width="200px"
                readonly
                class="mt-5"
                v-model="safetyField.CHECK_TARGET_OBJ2_NM"
              >
              </i-input>
              <i-input
                width="200px"
                readonly
                class="mt-5"
                v-model="safetyField.CHECK_TARGET_OBJ3_NM"
              >
              </i-input>
            </div>
            <div>
              <i-textarea
                v-model="safetyField.VIO_DESC"
                :label="$t('내용')"
                width="100%"
                class="mt-2"
              ></i-textarea>
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="safetyField.VIO_SPLC_NM"
                :label="$t('장소')"
                width="200px"
                top-label
                append-inner-icon="mdi-magnify"
                readonly
                @click:append-inner="openSafetyLocationPopup"
                required
              ></i-input>
              <i-input
                v-model="safetyField.VIO_PLC_DESC"
                :label="$t('장소상세')"
                width="400px"
                top-label
              ></i-input>
              <i-select 
                v-model="safetyField.SHIP_NO"
                :label="$t('호선No.')"
                top-label
                label-width="50px"
                width="200px"
                :items="codeList.SHIP_NO"
                item-value="WORK_NO"
                item-title="WORK_NO"
              />
            </div>
            <div class="sheetTitle my-5">단속자정보</div>
            <div class="d-flex">
              <i-input
                v-model="safetyField.DANSOK_EMP_NM"
                :label="$t('단속자성명')" 
                width="200px"
                top-label
                append-inner-icon="mdi-magnify"
                @click:appendInner="openDansokEmpPopup('단속자인원조회')"
                @keydown.enter="
                  (e) => {
                    openDansokEmpPopup('단속자인원조회')
                  }
                "
                required
              ></i-input>
              <i-input
                v-model="safetyField.DANSOK_EMP_NO"
                :label="$t('단속자사번')"
                width="200px"
                top-label
                readonly
              ></i-input>
              <i-input
                v-model="safetyField.DANSOK_ASGN_NM"
                :label="$t('단속자소속')"
                width="200px"
                top-label
                readonly
                required
              ></i-input>
              <i-select
                v-model="safetyField.APP_EMP_NO"
                :label="$t('승인자')"
                width="200px"
                top-label
                :items="codeList.APP_EMP_NO"
                item-title="APP_EMP_NM"
                item-value="APP_EMP_NO"
                required
              ></i-select>
              <v-btn class="mt-5" @click="approval" :disabled="approvalReadOnly"
                >승인신청</v-btn
              >
              <v-btn
                class="mt-5"
                @click="cancelApproval"
                :disabled="approvalCancleReadOnly"
                >승인신청취소</v-btn
              >
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <EmpPopup ref="safetyEmpPopup" @selected="selectedSafetyEmp"></EmpPopup>
  <EmpPopup ref="safetyDansokEmpPopup" @selected="selectedDansokEmp"></EmpPopup>
  <IUploadPopup ref="safetyFileUpload" @uploaded="uploaded"></IUploadPopup>
  <IUploadPopup ref="safetyActionFileUpload"></IUploadPopup>
  <CommonCodePopUpSAF
    ref="safetyLocation"
    @selected="selectedSafetyLocation"
  ></CommonCodePopUpSAF>
  <DeptPopup ref="safetyVioDeptPopup" @selected="selectedVioDept"></DeptPopup>
  <CommonCodePopUpSAF ref="sagoDivPopup" @selected="selectedSagoDivPopup">
  </CommonCodePopUpSAF>
  <CommonCodePopUpSAF
    ref="checkTargetPopup"
    @selected="selectedTarget"
  ></CommonCodePopUpSAF>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
.sheetTitle {
  font-size: 16px;
  font-weight: bold;
}
</style>
