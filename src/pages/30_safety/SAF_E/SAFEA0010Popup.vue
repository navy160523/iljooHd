<script setup>
import { ref, reactive, onMounted, getCurrentInstance, readonly } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
  selectFunction,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IUpload from '@/components/IUpload.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'

/*
화면명 : SAFEA0010Popup
화면개요 : 안전작업요구권을 등록,조치완료를수행하고 담당자에게 메일,SMS발신을 보낸다.
*/
//변수선언부 시작
const dialog = ref(null)
const fileUpload = ref(null)
const fileUpload2 = ref(null)
const menuTitle = ref(null)
const requestEmpPopup = ref(null) //요청자 인원팝업
const actionEmpPopup = ref(null) //조치자 인원파업
const workLocationPopup = ref(null) //장소검색 팝업
const deptPopup = ref(null) //부서검색 팝업
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const emit = defineEmits(['closed'])
const fileUploadBtn = reactive(['btnFileUpload'])
const readOnlyValue = reactive({
  //상황별 readonly v-bind 변수
  REQ_DATE: false, //요구일시
  REQ_TIME: false, //요구시간
  PLACE_NM: false, //장소
  PLACE_DETAIL: false, //장소상세
  EMP_NM: false, //요청자 이름
  EMP_NO: true, //요청자 사번
  ASGN_NM: true, //요청자 소속
  INSERT_EMP_NM: true, //작성자이름
  INSERT_USER_ID: true, //작성자사번
  SLI_ASGN_NM: false, //SLI소속
  REQ_TYPE: false, //요청대상
  REQ_DESC: false, //위험내용
  ACT_EMP_NM: false, //조치자 이름
  ACT_EMP_NO: true, //조치자 사번
  ACT_ASGN_NM: true, //조치자 소속
  ACTION_DATE: false, //조치일시
  ACTION_TIME: false, //조치시간
  ACTION_DESC: false, //조치내용
  ACTION_ETC: false, //미조치(조치 불필요 또는 불가)
  ACTION_ETC_DESC: false, //미조치 사유
})
//초기 코드값 세팅로직 시작
const initCodeList = () => {
  initRequestTime()
  defaultDate()
  Promise.all([getCodeList('HHIZF30B')]).then((res) => {
    codeList.requesttarget = res[0].ORESULT_CUR
  })

  // setTimeout(() => {
  //   menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장
  //   menuTitle.value.disableBtn('btnRegist', true) //저장
  //   menuTitle.value.disableBtn('btnDelete', true) //삭제
  //   fileUpload.value.diableFileUploadButton(fileUploadBtn)
  //   fileUpload2.value.diableFileUploadButton(fileUploadBtn)
  // }, 500)
}
//초기 코드값 세팅로직 끝

//코드리스트 선언부 시작
const codeList = reactive({
  date: [], //요구일시,조치자 시간
  requesttarget: [], //요청대상
})
//코드리스트 선언부 끝

const defaultDate = () => {
  //디폴트 날짜 설정
  // 오늘날짜
  let date = dayjs()
  let now =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
  workRequestParam.REQ_DATE = now //요청일시
}

const initRequestTime = () => {
  //요구일시,조치일시 시간 생성
  for (let i = 0; i < 24; i++) {
    let num = i.toString().padStart(2, '0')
    codeList.date.push({ COD: num, TXT: num })
  }
}

const workRequestParam = reactive({
  //안전작업 요청 파라미터
  REQ_DATE: '', //요청일시
  REQ_TIME: '', //요청시간
  JOB_PLC_NM: '', //장소
  JOB_PLC_DETAIL: '', //장소상세
  EMP_NM: '', //요청자
  EMP_NO: '', //요청자 사번
  ASGN_NM: '', //소속
  SLI_COMPANY: '',
  SLI_ASGN_NM: '', //SLI소속
  SLI_ASGN_CD: '', //SLI소속코드
  SLI_BSNS_CD: '',
  SLI_DEPT_CD: '',
  INSERT_EMP_NM: '', //작성자
  INSERT_USER_ID: '', //작성자 아이디
  ATTACH_ID2: '', //문제점 파일첨부 파일아이디
  REQ_TYPE: '', //요청대상
  REQ_DESC: '', //위험내용
})

const workActionParam = reactive({
  //안전작업 조치 파라미터
  ACT_EMP_NM: '', //조치자
  ACT_EMP_NO: '', //조치자사번
  ACT_ASGN_NM: '', //조치자소속
  ACTION_DATE: '', //조치일시
  ATTACH_ID: '', //조치결과 첨부 파일아이디
  ACTION_TIME: '', //조치시간
  ACTION_DESC: '', //조치내용
  ACTION_ETC: 'N', //미조치(조치 불필요 또는 불가)
  ACTION_ETC_DESC: '', //미조치 사유
})

const addParam = reactive({
  //추가버튼 눌렀을때 필요한 값들을 저장하는 객체
  APPLY_DATE: '', //조치일시
  CMPNY_DIV: '', //회사구분
  COMPANY: '', //회사코드
  BSNS_CD: '', //사업부코드
  DEPT_CD: '', //부서코드
  ASGN_CD: '', //소속코드
  SEQ: '', //시퀀스
  SLI_COMPANY: '', //SLI 회사코드
  SLI_BSNS_CD: '', //SLI 사업부코드
  SLI_DEPT_CD: '', //SLI 부서코드
  SLI_ASGN_CD: '', //SLI 소속코드
  SLI_ASGN_NM: '', //SLI 소속이름
  ACT_COMPANY: '', //조치자회사코드
  EMP_NO: '', //사번
  EMP_NM: '', //이름
  ASGN_NM: '', //소속이름
  INSERT_ASGN_NM: '', // 등록자 소속 이름
  INSERT_USER_ID: '', // 등록자 아이디
  INSERT_EMP_NM: '', //등록자 이름
  INSERT_EMP_NO: '', //등록자 사번
  INSERT_DT: '', //등록일자
  REGIST_DATE: '', //
  CHANNEL: 'SSA',
  SAVE_YN: 'N',
})
//변수선언부 끝

//추가버튼 눌렀을때 실행되는 함수
const addPopup = () => {
  initCodeList()
  setTimeout(() => {
    setReadOnly()
    checkFileId()
    checkFileId2()
  }, 500)
  let day = dayjs()
  addParam.CMPNY_DIV = userStore.cmpnyDiv
  workRequestParam.REQ_TIME = day.$H.toString().padStart(2, '0') //요청시간
  workRequestParam.REQ_DATE =
    day.$y +
    '-' +
    (day.$M + 1).toString().padStart(2, '0') +
    '-' +
    day.$D.toString().padStart(2, '0') //현재날짜
  addParam.COMPANY = userStore.cmpnyDiv
  addParam.BSNS_CD = userStore.bsnsCd
  addParam.DEPT_CD = userStore.deptCd
  addParam.ASGN_CD = userStore.asgnCd
  addParam.SLI_COMPANY = userStore.cmpnyDiv
  addParam.SLI_BSNS_CD = userStore.bsnsCd
  addParam.SLI_DEPT_CD = userStore.deptCd
  addParam.SLI_ASGN_CD = userStore.asgnCd
  addParam.SLI_ASGN_NM = userStore.asgnNm
  addParam.ACT_COMPANY = userStore.cmpnyDiv
  addParam.INSERT_ASGN_NM = userStore.asgnFullNm
  addParam.CHANNEL = 'SSA'
  workRequestParam.INSERT_EMP_NM = userStore.empNm //작성자 이름
  workRequestParam.INSERT_USER_ID = userStore.userId // 작성자 사번
  dialog.value = true
}

//로우더블클릭시 실행되는 함수
const openPopup = (rowData) => {
  console.log('rowData', rowData)
  initCodeList()
  setTimeout(() => {
    // menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장
    // menuTitle.value.disableBtn('btnRegist', true) //저장
    // menuTitle.value.disableBtn('btnDelete', true) //삭제
    // menuTitle.value.disableBtn('btnActionComplete', true) //조치완료
    // fileUpload.value.diableFileUploadButton(fileUploadBtn) //요청자 파일업로드 버튼 비활성화
    // fileUpload2.value.diableFileUploadButton(fileUploadBtn) //조치자 파일업로드 버튼 비활성화
    setReadOnly()
  }, 500)
  addParam.APPLY_DATE = rowData.APPLY_DATE
  addParam.CMPNY_DIV = rowData.CMPNY_DIV
  addParam.COMPANY = userStore.cmpnyDiv
  addParam.ACT_COMPANY = userStore.cmpnyDiv
  addParam.BSNS_CD = rowData.BSNS_CD
  addParam.DEPT_CD = rowData.DEPT_CD
  addParam.ASGN_CD = rowData.ASGN_CD
  addParam.SEQ = rowData.SEQ
  addParam.INSERT_EMP_NO = rowData.INSERT_USER_ID
  addParam.JOB_LPLC = rowData.JOB_LPLC
  addParam.JOB_MPLC = rowData.JOB_MPLC
  addParam.JOB_SPLC = rowData.JOB_SPLC
  addParam.INSERT_DT = rowData.INSERT_DT
  addParam.REGIST_DATE = rowData.REGIST_DATE
  addParam.INSERT_USER_ID = rowData.INSERT_USER_ID
  //안전작업 요청쪽 넣어주는부분
  if (rowData.REQ_DATE === null) {
    //요구일시가 null이면 null값 넣어줌
    workRequestParam.REQ_DATE = null
  } else {
    workRequestParam.REQ_DATE = rowData.REQ_DATE.toString().substr(0, 10) //요구일시
  }
  workRequestParam.REQ_TIME = rowData.REQ_TIME //요구시간
  workRequestParam.ASGN_NM = rowData.ASGN_NM //소속
  workRequestParam.JOB_PLC_NM = rowData.JOB_PLC_NM //장소
  workRequestParam.JOB_PLC_DETAIL = rowData.JOB_PLC_DETAIL //장소상세
  workRequestParam.EMP_NM = rowData.EMP_NM
  workRequestParam.EMP_NO = rowData.EMP_NO
  workRequestParam.INSERT_EMP_NM = rowData.INSERT_EMP_NM
  workRequestParam.INSERT_USER_ID = rowData.INSERT_USER_ID
  workRequestParam.SLI_ASGN_NM = rowData.SLI_ASGN_NM
  workRequestParam.SLI_ASGN_CD = rowData.SLI_ASGN_CD
  workRequestParam.REQ_TYPE = rowData.REQ_TYPE
  workRequestParam.REQ_DESC = rowData.REQ_DESC

  setTimeout(() => {
    checkFileId(rowData.ATTACH_ID2) //파일아이디 체크
  }, 50)

  //안전작업 조치 넣어주는 부분
  if (rowData.ACTION_DATE === null) {
    //조치일시가 null이면 null값 넣어줌
    workActionParam.ACTION_DATE = null
  } else {
    workActionParam.ACTION_DATE = rowData.ACTION_DATE.toString().substr(0, 10)
  }
  workActionParam.ACT_EMP_NM = rowData.ACT_EMP_NM
  workActionParam.ACT_EMP_NO = rowData.ACT_EMP_NO
  workActionParam.ACT_EMP_NO = rowData.ACT_EMP_NO
  workActionParam.ACT_ASGN_NM = rowData.ACT_ASGN_NM
  workActionParam.ACTION_ETC = rowData.ACTION_ETC
  workActionParam.ACTION_ETC_DESC = rowData.ACTION_ETC_DESC
  workActionParam.ACTION_TIME = rowData.ACTION_TIME
  workActionParam.ACTION_DESC = rowData.ACTION_DESC
  setTimeout(() => {
    checkFileId2(rowData.ATTACH_ID)
  }, 50)
  console.log('애드파람', addParam)
  dialog.value = true
}

//팝업닫을때 팝업내부 변수 초기화
const closePopup = () => {
  codeList.date = []
  for (let i in workRequestParam) {
    workRequestParam[i] = ''
  }
  for (let i in workActionParam) {
    workActionParam[i] = ''
  }
  for (let i in addParam) {
    if (i === 'CHANNEL' || i === 'SAVE_YN') {
      continue
    }
    addParam[i] = ''
  }
  for (let i in readOnlyValue) {
    if (
      i === 'EMP_NO' ||
      i === 'ASGN_NM' ||
      i === 'INSERT_USER_ID' ||
      i === 'ACT_EMP_NO' ||
      i === 'ACT_ASGN_NM' ||
      i === 'INSERT_EMP_NM'
    ) {
      continue
    }
    readOnlyValue[i] = false
  }
  fileUpload.value.enableFileUploadButton(fileUploadBtn)
  fileUpload2.value.enableFileUploadButton(fileUploadBtn)
  emit('closed')
  dialog.value = false
}

const onButtonsClick = (btn) => {
  //임시저장
  if (btn.id === 'btnTemporaryStorage') {
    new saveFlowHelper(vm, t)
      .setBefore(temporaryBeforeSave)
      .setQuery(temporarySaveData)
      .setAfter(temporaryAfterSave)
      .run()
  } else if (btn.id === 'btnRegist') {
    //저장
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnActionComplete') {
    //조치완료
    new saveFlowHelper(vm, t)
      .setBefore(beforeActionComplete)
      .setQuery(actionComplete)
      .setAfter(afterActionComplete)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setQuery(deleteData).setAfter(afterDelete).run()
  } else {
    closePopup()
  }
}

//삭제관련 로직 시작
const deleteData = () => {
  let deleteParam = []
  let deleteData = {
    CMPNY_DIV: addParam.CMPNY_DIV,
    INSERT_DT: addParam.INSERT_DT,
    SEQ: addParam.SEQ,
  }
  deleteParam.push(deleteData)
  return commonExecuteApi({
    queryId: 'SAFEA0010_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//요청자 인원조회 팝업
const openRequestEmpPopup = () => {
  requestEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: workRequestParam.EMP_NM,
  })
}

//요청자 인원선택 이벤트
const reqEmpSelected = (val) => {  
  workRequestParam.ASGN_NM = val.ASGN_NM
  workRequestParam.SLI_COMPANY = val.CMPNY_DIV
  workRequestParam.SLI_ASGN_NM = val.ASGN_NM
  workRequestParam.SLI_ASGN_CD = val.ASGN_CD
  workRequestParam.SLI_BSNS_CD = val.BSNS_CD
  workRequestParam.SLI_DEPT_CD = val.DEPT_CD
  workRequestParam.EMP_NM = val.EMP_NM
  workRequestParam.EMP_NO = val.EMP_NO

  //console.log('reqEmpSelected workRequestParam :: ', workRequestParam)
}

//조치자 인원조회 팝업
const openActionEmpPoup = () => {
  actionEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: workActionParam.ACT_EMP_NM,
  })
}

//조치자 인원선택 이벤트
const actEmpSelected = (val) => {
  workActionParam.ACT_EMP_NM = val.EMP_NM
  workActionParam.ACT_EMP_NO = val.EMP_NO
  workActionParam.ACT_ASGN_NM = val.ASGN_NM
}

//SLI소속팝업오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup()
}

//SLI소속 선택 이벤트
const deptSelected = (val) => {
  //console.log('deptSelected :: ', val)
  workRequestParam.SLI_COMPANY = val.CMPNY_DIV
  workRequestParam.SLI_ASGN_NM = val.ASGN_FULL_NM
  workRequestParam.SLI_ASGN_CD = val.ASGN_CD
  workRequestParam.SLI_BSNS_CD = val.BSNS_CD
  workRequestParam.SLI_DEPT_CD = val.DEPT_CD
}

//장소검색 팝업
const openLocationPopup = () => {
  workLocationPopup.value.openPopup()
}

//장소팝업 선택 이벤트
const selectedLcation = (val) => {
  addParam.JOB_LPLC = val[0].COD
  addParam.JOB_MPLC = val[1].COD
  addParam.JOB_SPLC = val[2].COD
  workRequestParam.JOB_PLC_NM = val[2].TXT
}

//문제점첨부 파일아이디 체크 함수
const checkFileId = (fileId) => {
  if (!fileId) {
    fileUpload.value.setGuid()
    //workRequestParam.ATTACH_ID2 = fileUpload.value.guid
    //fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    fileUpload.value.setGuid(fileId)
    workRequestParam.ATTACH_ID2 = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}

//조치결과 파일아이디 체크 함수
const checkFileId2 = (fileId) => {
  if (!fileId) {
    fileUpload2.value.setGuid()
  } else {
    fileUpload2.value.setGuid(fileId)
    workActionParam.ATTACH_ID = fileUpload2.value.guid
    fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
  }
}

//문제점 첨부 업로드 이벤트
const workFileUploaded = (param) => {
  workRequestParam.ATTACH_ID2 = param.fileId
}

//조치결과 첨부 업로드 이벤트
const actionFileuploaded = (param) => {
  workActionParam.ATTACH_ID = param.fileId
}

//임시저장 관련 로직 시작
const temporaryBeforeSave = () => {
  //필수값 요구일시,장소,요청자,SLI소속,요청대상,요청자위험내용
  if (!workRequestParam.REQ_DATE) {
    Message.err(t('요구일시를 입력하세요.'))
    return false
  }
  if (!workRequestParam.JOB_PLC_NM) {
    Message.err(t('장소를 입력하세요.'))
    return false
  }
  if (!workRequestParam.EMP_NM) {
    Message.err(t('요청자를 입력하세요.'))
    return false
  }
  if (!workRequestParam.SLI_ASGN_NM) {
    Message.err(t('SLI소속을 입력하세요.'))
    return false
  }
  if (!workRequestParam.REQ_TYPE) {
    Message.err(t('요청대상을 선택하세요.'))
    return false
  }
  if (!workRequestParam.REQ_DESC) {
    Message.err(t('요청자 위험내용을 입력하세요.'))
    return false
  }
  return true
}

const temporarySaveData = () => {
  let now = dayjs()
  let temporarySaveParam = []
  let temporarySaveData = {
    CMPNY_DIV:
      addParam.CMPNY_DIV == null ? userStore.cmpnyDiv : addParam.CMPNY_DIV,
    INSERT_DT: addParam.INSERT_DT,
    SEQ: addParam.SEQ,
    REQ_DATE: workRequestParam.REQ_DATE,
    REQ_TIME: workRequestParam.REQ_TIME,
    COMPANY: addParam.COMPANY,
    BSNS_CD: addParam.BSNS_CD,
    DEPT_CD: addParam.DEPT_CD,
    ASGN_CD: addParam.ASGN_CD,
    EMP_NO: workRequestParam.EMP_NO,
    JOB_LPLC: addParam.JOB_LPLC,
    JOB_MPLC: addParam.JOB_MPLC,
    JOB_SPLC: addParam.JOB_SPLC,
    JOB_PLC_DETAIL: workRequestParam.JOB_PLC_DETAIL,
    ACTION_DIV: '',
    REL_RULE_L: '',
    REL_RULE_S: '',
    REQ_DESC: workRequestParam.REQ_DESC,
    ACTION_DESC: workActionParam.ACTION_DESC,
    ATTACH_ID2: workRequestParam.ATTACH_ID2,
    ATTACH_ID: workActionParam.ATTACH_ID,
    SLI_COMPANY: workRequestParam.SLI_COMPANY,
    SLI_BSNS_CD: workRequestParam.SLI_BSNS_CD,
    SLI_DEPT_CD: workRequestParam.SLI_DEPT_CD,
    SLI_ASGN_CD: workRequestParam.SLI_ASGN_CD,
    ACT_COMPANY: addParam.ACT_COMPANY,
    ACT_EMP_NO: workActionParam.ACT_EMP_NO,
    CHANNEL: addParam.CHANNEL,
    REQ_TYPE: workRequestParam.REQ_TYPE,
    ACTION_ETC: workActionParam.ACTION_ETC,
    ACTION_ETC_DESC: workActionParam.ACTION_ETC_DESC,
    ACTION_DATE: workActionParam.ACTION_DATE,
    ACTION_TIME: workActionParam.ACTION_TIME,
    USER_ID: userStore.userId,
  }
  temporarySaveParam.push(temporarySaveData)
  return commonExecuteApi({
    queryId: 'SAFEA0010_SAVE01',
    list: temporarySaveParam,
  })
}

const temporaryAfterSave = () => {
  closePopup()
}
//임시저장 관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  //필수값 요구일시,장소,요청자,요청대상,SLI소속,조치자,위험내용
  if (!workRequestParam.REQ_DATE) {
    Message.err(t('요구일시를 입력하세요.'))
    return false
  }
  if (!workRequestParam.JOB_PLC_NM) {
    Message.err(t('장소를 입력하세요.'))
    return false
  }
  if (!workRequestParam.EMP_NM) {
    Message.err(t('요청자를 입력하세요.'))
    return false
  }
  if (!workRequestParam.REQ_TYPE) {
    Message.err(t('요청대상을 선택하세요.'))
    return false
  }
  if (!workRequestParam.SLI_ASGN_NM) {
    Message.err(t('SLI소속을 입력하세요.'))
    return false
  }

  if (!workActionParam.ACT_EMP_NM) {
    Message.err(t('조치자를 입력하세요.'))
    return false
  }
  if (!workRequestParam.REQ_DESC) {
    Message.err(t('위험내용을 입력하세요.'))
    return false
  }
  return true
}

const saveData = () => {
  let now = dayjs()
  let saveParam = []
  let saveData = {
    CMPNY_DIV: addParam.CMPNY_DIV,
    INSERT_DT: addParam.INSERT_DT,
    SEQ: addParam.SEQ,
    REQ_DATE: workRequestParam.REQ_DATE,
    REQ_TIME: workRequestParam.REQ_TIME,
    COMPANY: addParam.COMPANY,
    BSNS_CD: addParam.BSNS_CD,
    DEPT_CD: addParam.DEPT_CD,
    ASGN_CD: addParam.ASGN_CD,
    EMP_NO: workRequestParam.EMP_NO,
    JOB_LPLC: addParam.JOB_LPLC,
    JOB_MPLC: addParam.JOB_MPLC,
    JOB_SPLC: addParam.JOB_SPLC,
    JOB_PLC_DETAIL: workRequestParam.JOB_PLC_DETAIL,
    ACTION_DIV: '',
    REL_RULE_L: '',
    REL_RULE_S: '',
    REQ_DESC: workRequestParam.REQ_DESC,
    ACTION_DESC: workActionParam.ACTION_DESC,
    ATTACH_ID2: workRequestParam.ATTACH_ID2,
    ATTACH_ID: workActionParam.ATTACH_ID,
    SLI_COMPANY: workRequestParam.SLI_COMPANY,
    SLI_BSNS_CD: workRequestParam.SLI_BSNS_CD,
    SLI_DEPT_CD: workRequestParam.SLI_DEPT_CD,
    SLI_ASGN_CD: workRequestParam.SLI_ASGN_CD,
    ACT_COMPANY: addParam.ACT_COMPANY,
    ACT_EMP_NO: workActionParam.ACT_EMP_NO,
    CHANNEL: addParam.CHANNEL,
    REGIST_DATE: '',
    REGIST_EMP: userStore.userId,
    REQ_TYPE: workRequestParam.REQ_TYPE,
    ACTION_ETC: workActionParam.ACTION_ETC,
    ACTION_ETC_DESC: workActionParam.ACTION_ETC_DESC,
    ACTION_DATE: workActionParam.ACTION_DATE,
    ACTION_TIME: workActionParam.ACTION_TIME,
    USER_ID: userStore.userId,
  }

  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFEA0010_SAVE03',
    list: saveParam,
  })
}

const afterSave = (res) => {
  let param = {
    RES_INSERT_DT: res.list[0].OUT_RES_INSERT_DT,
    RES_SEQ: res.list[0].OUT_RES_SEQ,
  }
  //저장후 SMS,MAIL발송
  afterSaveSendMailAndSms(param)
}

//저장관련 로직 끝

//저장 후 메일,SMS발송 관련 로직 시작
const afterSaveSendMailAndSms = (param) => {
  //알림대상 조회후 SMS,MAIL발송
  let notifyParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    INSERT_DT: param.RES_INSERT_DT,
    SEQ: param.RES_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFEA0010_SEARCHW04',
    param: notifyParam,
  }).then((res) => {
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      if(res.ORESULT_CUR[i].SND_EMP_NO != res.ORESULT_CUR[i].ACT_EMP_NO){
        if(res.ORESULT_CUR[i].RCV_EMAIL != "" && res.ORESULT_CUR[i].RCV_EMAIL != null){
          console.log('RCV_EMAIL', res.ORESULT_CUR[i].RCV_EMAIL)
          let mailParam = {
            EMAIL: [res.ORESULT_CUR[i].RCV_EMAIL], //받는사람 이메일주소
            SUBJECT: res.ORESULT_CUR[i].TITLE, //메일제목
            CONTENT: res.ORESULT_CUR[i].MAIL_MSG, //메일내용
          }

          console.log('메일 발송', res.ORESULT_CUR[i].RCV_EMAIL)
          commonSendApi(mailParam).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          }) //메일전송
        }
        if((res.ORESULT_CUR[i].SND_EMP_NO != "" && res.ORESULT_CUR[i].SND_EMP_NO != null) 
            && (res.ORESULT_CUR[i].RCV_PHN != "" && res.ORESULT_CUR[i].RCV_PHN != null)){
          console.log('SND_EMP_NO', res.ORESULT_CUR[i].SND_EMP_NO)
          console.log('RCV_PHN', res.ORESULT_CUR[i].RCV_PHN)
          let smsParam = {
            EMPNO_FROM: res.ORESULT_CUR[i].SND_EMP_NO, //보내는사람 사번
            EMPNO_TO: res.ORESULT_CUR[i].RCV_EMP_NO, //받는사람 사번
            SYSCODE: '156', //이부분은 000으로 고정
            FROM_P_NO: res.ORESULT_CUR[i].SND_PHN, //보내는사람 폰번호
            TO_P_NO: res.ORESULT_CUR[i].RCV_PHN, //받는사람 폰번호
            TITLE: res.ORESULT_CUR[i].SMS_MSG, //제목,내용
          }

          console.log('문자전송', res.ORESULT_CUR[i].RCV_PHN)
          commonSendSMS(smsParam) //문자전송
        }      
      }
    }
  
    closePopup()
  })
}
//저장 후 메일,SMS발송 관련 로직 끝

//조치완료 관련 로직 시작
const beforeActionComplete = () => {
  //필수값 요구일시,장소,요청자,SLI소속,요청대상,위험내용,조치일시,조치자,조치내용
  if (!workRequestParam.REQ_DATE) {
    Message.err(t('요구일시를 입력하세요.'))
    return false
  }
  if (!workRequestParam.JOB_PLC_NM) {
    Message.err(t('장소를 입력하세요.'))
    return false
  }
  if (!workRequestParam.EMP_NM) {
    Message.err(t('요청자를 입력하세요.'))
    return false
  }
  if (!workRequestParam.SLI_ASGN_NM) {
    Message.err(t('SLI소속을 입력하세요.'))
    return false
  }
  if (!workRequestParam.REQ_TYPE) {
    Message.err(t('요청대상을 선택하세요.'))
    return false
  }
  if (!workRequestParam.REQ_DESC) {
    Message.err(t('위험내용을 입력하세요.'))
    return false
  }

  if (!workActionParam.ACT_EMP_NM) {
    Message.err(t('조치자를 입력하세요.'))
    return false
  }

  if(workActionParam.ACTION_ETC === 'N'){
    if (!workActionParam.ACTION_DATE || !workActionParam.ACTION_TIME) {
      Message.err(t('조치일시를 입력하세요.'))
      return false
    }    
    if (!workActionParam.ACTION_DESC) {
      Message.err(t('조치내용을 입력하세요.'))
      return false
    }
  }

  return true
}

const actionComplete = () => {
  let now = dayjs()
  let actionCompleteParam = []
  let actionCompleteData = {
    CMPNY_DIV: addParam.CMPNY_DIV,
    INSERT_DT: addParam.INSERT_DT,
    SEQ: addParam.SEQ,
    REQ_DATE: workRequestParam.REQ_DATE,
    REQ_TIME: workRequestParam.REQ_TIME,
    COMPANY: addParam.COMPANY,
    BSNS_CD: addParam.BSNS_CD,
    DEPT_CD: addParam.DEPT_CD,
    ASGN_CD: addParam.ASGN_CD,
    EMP_NO: workRequestParam.EMP_NO,
    JOB_LPLC: addParam.JOB_LPLC,
    JOB_MPLC: addParam.JOB_MPLC,
    JOB_SPLC: addParam.JOB_SPLC,
    JOB_PLC_DETAIL: workRequestParam.JOB_PLC_DETAIL,
    ACTION_DIV: '',
    REL_RULE_L: '',
    REL_RULE_S: '',
    REQ_DESC: workRequestParam.REQ_DESC,
    ACTION_DESC: workActionParam.ACTION_DESC,
    ATTACH_ID2: workRequestParam.ATTACH_ID2,
    ATTACH_ID: workActionParam.ATTACH_ID,
    SLI_COMPANY: workRequestParam.SLI_COMPANY,
    SLI_BSNS_CD: workRequestParam.SLI_BSNS_CD,
    SLI_DEPT_CD: workRequestParam.SLI_DEPT_CD,
    SLI_ASGN_CD: workRequestParam.SLI_ASGN_CD,
    ACT_COMPANY: addParam.ACT_COMPANY,
    ACT_EMP_NO: workActionParam.ACT_EMP_NO,
    CHANNEL: addParam.CHANNEL,
    REGIST_DATE: '',
    REGIST_EMP: userStore.userId,
    APPLY_EMP: userStore.userId,
    APPLY_DATE: '',
    REQ_TYPE: workRequestParam.REQ_TYPE,
    ACTION_ETC: workActionParam.ACTION_ETC,
    ACTION_ETC_DESC: workActionParam.ACTION_ETC_DESC,
    ACTION_DATE: workActionParam.ACTION_DATE,
    ACTION_TIME: workActionParam.ACTION_TIME,
    USER_ID: userStore.userId,
  }
  actionCompleteParam.push(actionCompleteData)
  return commonExecuteApi({
    queryId: 'SAFEA0010_SAVE04',
    list: actionCompleteParam,
  })
}

const afterActionComplete = () => {
  //조치완료후 안전페이 포인트 지급
  setHDPAY()
}
//조치완료 관련 로직 끝

//조치완료 후 메일,SMS발송 관련 로직 시작
const afterCompleteSendMailandSms = (param) => {
  //알림대상 조회
  let notifyParam = {
    CMPNY_DIV: addParam.CMPNY_DIV,
    INSERT_DT: addParam.INSERT_DT,
    SEQ: addParam.SEQ,
  }
  commonSearchApi({
    queryId: 'SAFEA0010_SEARCH02',
    param: notifyParam,
  }).then((res) => {
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      let smsParam = {
        EMPNO_FROM: res.ORESULT_CUR[i].SMS_EMP_NO, //보내는사람 사번
        EMPNO_TO: res.ORESULT_CUR[i].RCV_EMP_NO, //받는사람 사번
        SYSCODE: '156', //이부분은 000으로 고정
        FROM_P_NO: res.ORESULT_CUR[i].SND_PHN, //보내는사람 폰번호(조치자)
        TO_P_NO: res.ORESULT_CUR[i].RCV_PHN, //받는사람 폰번호(요청자)
        TITLE: res.ORESULT_CUR[i].SMS_MSG, //제목,내용
      }
      commonSendSMS(smsParam)
    }
    closePopup()
  })
}
//조치완료 후 메일,SMS발송 관련 로직 끝

//상태별 버튼 활성화 설정 로직 시작
const setReadOnly = () => {
  //userLogStore.isMenuAdmin = "Y"
  let INSERT_DT = addParam.INSERT_DT ? addParam.INSERT_DT : '' //등록일자
  let SEQ = addParam.SEQ ? addParam.SEQ : '' //순번
  let REGIST_DATE = '' //등록완료 일자
  let APPLY_DATE = '' //조치일자
  let REGIST_YN = '' //등록일자
  let APPLY_YN = ''
  if (!addParam.REGIST_DATE) {
    REGIST_DATE = ''
  } else {
    REGIST_DATE = addParam.REGIST_DATE
  }
  if (!addParam.APPLY_DATE) {
    APPLY_DATE = ''
  } else {
    APPLY_DATE = addParam.APPLY_DATE
  }
  let INSERT_USER_ID = addParam.INSERT_USER_ID //등록자
  let INSERT_EMP_NO = addParam.INSERT_EMP_NO //등록자 사번
  //등록일자에 따른 등록 여부
  if (!REGIST_DATE) {
    REGIST_YN = ''
  } else {
    REGIST_YN = 'Y'
  }
  //조치일자에 따른 조치 여부
  if (!APPLY_DATE) {
    APPLY_YN = ''
  } else {
    APPLY_YN = 'Y'
  }

  console.group('디버깅용파라미터확인')
  console.log(addParam)
  console.log('관리자권한 ADMIN', userLogStore.isMenuAdmin)
  console.log('등록일자 INSERT_DT', INSERT_DT)
  console.log('순번 SEQ', SEQ)
  console.log('REGIST_DATE 등록완료 일자', REGIST_DATE)
  console.log('APPLY_DATE 조치완료 일자', APPLY_DATE)
  console.log('저장여부 REGIST_YN', REGIST_YN)
  console.log('조치완료 여부 APPLY_YN', APPLY_YN)
  console.log('등록자 INSERT_USER_ID', INSERT_USER_ID)
  console.log('등록자사번 INSERT_EMP_NO', INSERT_EMP_NO)
  console.log('내아이디', userStore.userId)
  console.log('내사번', userStore.empNo)
  console.log('조치자', workActionParam.ACT_EMP_NM)
  console.log('조치자 사번', workActionParam.ACT_EMP_NO)
  console.groupEnd()
  //debugger;


  // 조치관련 비활성화
  // 조치 부분은 등록상태이면서 조치자가 접속 시만 활성화
  readOnlyValue.ACTION_DATE = true
  readOnlyValue.ACTION_TIME = true
  readOnlyValue.ACTION_DESC = true
  readOnlyValue.ACTION_ETC = true
  readOnlyValue.ACTION_ETC_DESC = true
  menuTitle.value.disableBtn('btnActionComplete', true) //조치완료 버튼 비활성화

  //신규 작성일 경우 (유저권한 체크 x)
  if (!INSERT_DT || !SEQ) {
    console.log('신규작성일때')
    menuTitle.value.disableBtn('btnActionComplete', true) //조치완료 버튼 비활성화
    menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
    setTimeout(() => {
      menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장
      menuTitle.value.disableBtn('btnRegist', false) //저장
      fileUpload.value.enableFileUploadButton(fileUploadBtn)
      fileUpload2.value.enableFileUploadButton(fileUploadBtn)
    }, 500)

  } else {
    //임시저장 일 때
    if (REGIST_YN !== 'Y' && APPLY_YN !== 'Y') {
      //등록 후 조치완료 권한
      console.log('임시저장일때')
      menuTitle.value.disableBtn('btnActionComplete', true)
      setTimeout(() => {
        fileUpload2.value.enableFileUploadButton(fileUploadBtn) //조치자 파일 첨부
      }, 500)

      //관리자일때
      if (userLogStore.isMenuAdmin === 'Y') {
        console.log('임시저장이면서 관리자일때')
        menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장
        menuTitle.value.disableBtn('btnRegist', false) //저장
        menuTitle.value.disableBtn('btnDelete', false) //삭제
        setTimeout(() => {
          fileUpload.value.enableFileUploadButton(fileUploadBtn) //요청자 파일첨부
        }, 500)
        readOnlyValue.REQ_DATE = false
        readOnlyValue.REQ_TIME = false
        readOnlyValue.PLACE_NM = false
        readOnlyValue.PLACE_DETAIL = false
        readOnlyValue.EMP_NM = false
        readOnlyValue.ACT_EMP_NM = false
        readOnlyValue.SLI_ASGN_NM = false
        readOnlyValue.REQ_DESC = false
      } else {
        console.log('임시저장이면서 관리자 아닐때')
        //등록자,요청자 일 때
        if (
          INSERT_USER_ID === userStore.userId ||
          INSERT_EMP_NO === userStore.empNo
        ) {
          console.log('임시저장이면서 등록자 또는 요청자일때')
          menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장
          menuTitle.value.disableBtn('btnRegist', false) //저장
          menuTitle.value.disableBtn('btnDelete', false) //삭제
          setTimeout(() => {
            fileUpload.value.enableFileUploadButton(fileUploadBtn) //요청자 파일첨부
          }, 500)
          readOnlyValue.REQ_DATE = false
          readOnlyValue.REQ_TIME = false
          readOnlyValue.PLACE_NM = false
          readOnlyValue.PLACE_DETAIL = false
          readOnlyValue.EMP_NM = false
          readOnlyValue.ACT_EMP_NM = false
          readOnlyValue.SLI_ASGN_NM = false
          readOnlyValue.REQ_DESC = false
        } else if (workActionParam.ACT_EMP_NO === userStore.empNo) {
          //조치자일때
          console.log('임시저장이면서 조치자일때')
          menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장
          menuTitle.value.disableBtn('btnRegist', true) //저장
          menuTitle.value.disableBtn('btnDelete', true) //삭제
          setTimeout(() => {
            fileUpload.value.enableFileUploadButton(fileUploadBtn) //요청자 파일첨부
          }, 500)

          readOnlyValue.REQ_DATE = true
          readOnlyValue.REQ_TIME = true
          readOnlyValue.PLACE_NM = true
          readOnlyValue.PLACE_DETAIL = true
          readOnlyValue.EMP_NM = true
          readOnlyValue.ACT_EMP_NM = true
          readOnlyValue.SLI_ASGN_NM = true
          readOnlyValue.REQ_DESC = true
        }
      }

    } else if (REGIST_YN === 'Y' && !APPLY_YN) {
      //상태가 등록 일 때
      menuTitle.value.disableBtn('btnRegist', true) //저장
      menuTitle.value.disableBtn('btnDelete', true) //삭제
      console.log('등록일때')

      // 등록인 경우 요청자, 작성자, 안전직원(GRP00381)은 삭제 가능하도록 수정 - 02024.09.09
      if(workRequestParam.EMP_NO === userStore.userId || userStore.authGrpCd.includes('GRP00381') ||
         INSERT_USER_ID === userStore.userId || INSERT_EMP_NO === userStore.empNo
      ){
        menuTitle.value.disableBtn('btnDelete', false) //삭제
      }

      //관리자,조치자 일 때
      if (
        //userLogStore.isMenuAdmin === 'Y' ||
        workActionParam.ACT_EMP_NO === userStore.userId
      ) {
        menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장
        menuTitle.value.disableBtn('btnActionComplete', false) //조치완료
        setTimeout(() => {
          fileUpload.value.enableFileUploadButton(fileUploadBtn)
          fileUpload2.value.enableFileUploadButton(fileUploadBtn)
        })
        readOnlyValue.REQ_DATE = false
        readOnlyValue.REQ_TIME = false
        readOnlyValue.PLACE_NM = false
        readOnlyValue.PLACE_DETAIL = false
        readOnlyValue.EMP_NM = false
        readOnlyValue.ACT_EMP_NM = false
        readOnlyValue.SLI_ASGN_NM = false
        readOnlyValue.REQ_DESC = false               
        readOnlyValue.ACTION_ETC = false        
        if(workActionParam.ACTION_ETC === 'Y'){
          readOnlyValue.ACTION_DATE = true
          readOnlyValue.ACTION_TIME = true      
          readOnlyValue.ACTION_DESC = true      
          readOnlyValue.ACTION_ETC_DESC = false      
        } else {
          readOnlyValue.ACTION_DATE = false
          readOnlyValue.ACTION_TIME = false
          readOnlyValue.ACTION_DESC = false
          readOnlyValue.ACTION_ETC_DESC = true
        }
        console.log('등록이면서 관리자 또는 조치자일때')
      }
      //작성자,등록자 일 때
      else if (
        INSERT_USER_ID === userStore.userId ||
        INSERT_EMP_NO === userStore.empNo
      ) {
        readOnlyValue.REQ_DATE = true
        readOnlyValue.REQ_TIME = true
        readOnlyValue.PLACE_NM = true
        readOnlyValue.PLACE_DETAIL = true
        readOnlyValue.EMP_NM = true
        readOnlyValue.ACT_EMP_NM = true
        readOnlyValue.SLI_ASGN_NM = true
        readOnlyValue.REQ_DESC = true
        menuTitle.value.disableBtn('btnDelete', false) //삭제

        //등록 후 조치 완료 권한
        //menuTitle.value.disableBtn('btnActionComplete', true) //조치완료
        setTimeout(() => {
          fileUpload.value.diableFileUploadButton(['btnDelete']) //요청자 삭제 비활성화
          fileUpload2.value.diableFileUploadButton(['btnDelete']) //조치자 삭제 비활성화

          // fileUpload2.value.diableFileUploadButton(fileUploadBtn) //조치자 파일첨부 비활성화
        })
        //readOnlyValue.ACTION_DESC = true 2025.01.21 윤찬양책임요청으로 작성자도 수정가능하게 처리
        console.log('등록이면서 작성자 또는 등록자일때')
      } else {
        //조건에 포함 되지 않을 때
        console.log(
          '등록이면서 조건에 포함되지 않을때(관리자,조치자,작성자)가 아닐때'
        )
        setTimeout(() => {
          fileUpload.value.diableFileUploadButton(fileUploadBtn) //요청자 파일첨부 비활성화
        }, 500)
        menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장
        readOnlyValue.REQ_DATE = true
        readOnlyValue.REQ_TIME = true
        readOnlyValue.PLACE_NM = true
        readOnlyValue.PLACE_DETAIL = true
        readOnlyValue.EMP_NM = true
        readOnlyValue.ACT_EMP_NM = true
        readOnlyValue.SLI_ASGN_NM = true
        readOnlyValue.REQ_DESC = true

        //등록 후 조치 완료 권한
        //menuTitle.value.disableBtn('btnActionComplete', true) //조치완료
        setTimeout(() => {
          fileUpload.value.diableFileUploadButton(['btnDelete']) //조치자 삭제 비활성화
          fileUpload2.value.diableFileUploadButton(['btnDelete']) //조치자 삭제 비활성화
        }, 500)

        readOnlyValue.ACTION_DESC = true
      }
    } else if (REGIST_YN === 'Y' && APPLY_YN === 'Y') {
      //상태가 조치완료 일 때
      console.log('조치완료 상태일때')
      menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장
      menuTitle.value.disableBtn('btnRegist', true) //저장
      menuTitle.value.disableBtn('btnDelete', true) //조치완료
      menuTitle.value.disableBtn('btnActionComplete', true) //조치완료

      readOnlyValue.REQ_DATE = true
      readOnlyValue.REQ_TIME = true
      readOnlyValue.PLACE_NM = true
      readOnlyValue.PLACE_DETAIL = true
      readOnlyValue.EMP_NM = true
      readOnlyValue.ACT_EMP_NM = true
      readOnlyValue.SLI_ASGN_NM = true
      readOnlyValue.REQ_DESC = true
      //등록 후 조치 완료 권한
      //menuTitle.value.disableBtn('btnActionComplete', true) //조치완료
      setTimeout(() => {
        fileUpload.value.diableFileUploadButton(['btnDelete'])
        fileUpload2.value.diableFileUploadButton(['btnDelete'])
      }, 500)

      readOnlyValue.ACTION_DESC = true
    }
  }
}

//상태별 버튼 활성화 설정 로직 끝

//조치완료후 요청자에게 안전페이 지급 관련 로직 시작
const setHDPAY = () => {
  let param = {
    CMPNY_DIV: addParam.CMPNY_DIV, //요청자 회사구분
    EMP_NO: workRequestParam.EMP_NO, //요청자 사번
    ACCUMULATED_CONTENT_CD: '20', //적립컨텐츠 (HHIC30)
    POINT: '500', //적립포인트(건당 500포인트)
  }
  //이 프로시저를 호출하면 파라미터로 넘긴 EMP_NO에 대한 적립가능여부와 잔여 포인트가 조회된다.
  //ex)최대 적립포인트가 1000P일때
  //첫번째로 호출시 -> 최대 적립포인트 - 적립포인트(param.POINT = 500) = 500P가 나옴
  //두번째로 호출시 -> 500P - 적립포인트(param.POINT = 500) = 0P가 나옴
  commonSearchApi({
    queryId: 'EDUDC0020_GET_PAYMENT_INFO_PC',
    param: param,
  }).then((res) => {
    //지급이 가능할때 N이면 지급대상 Y면 지급불가능
    if (
      res.ORESULT_CUR[0].STOP_YN === 'N' &&
      res.ORESULT_CUR[0].EARNABLE_POINT > 0
    ) {
      //요청자의 직영,협력사구분 코드 조회
      selectFunction({
        queryId: 'EMP_INFO',
        CMPNY_DIV: addParam.CMPNY_DIV,
        EMP_NO: workRequestParam.EMP_NO,
        COL_NM: 'USER_DIV',
      }).then((res2) => {
        selectFunction({
          queryId: 'GET_ASGN_FULL_NM',
          CMPNY_DIV: addParam.CMPNY_DIV,
          ASGN_CD: addParam.ASGN_CD,
        })
          .then((res3) => {
            let saveData = {
              CMPNY_DIV: addParam.CMPNY_DIV, //포인트지급대상자 사업장구분
              YEAR: dayjs().$y, //포인트 지급 년도
              MNTH: (dayjs().$M + 1).toString().padStart(2, '0'), //포인트 지급 월
              EMP_NO: workRequestParam.EMP_NO, //포인트 지급 대상자 사번(요청자 사번)
              POINT_SEQ: '', //포인트 지급테이블 SEQ
              BSNS_CD: addParam.BSNS_CD, //포인트 지급 대상자 사업부코드
              DEPT_CD: addParam.DEPT_CD, //포인트 지급 대상자 부서코드
              ASGN_CD: addParam.ASGN_CD, //포인트 지급 대상자 조직코드
              ASGN_NAME: res3.ORESULT_CUR, //포인트 지급 대상자 조직이름
              EMP_NAME: workRequestParam.EMP_NM, //포인트 지급 대상자 성명
              ORGN_DIV: res2.ORESULT_CUR, //포인트 지급 대상자 직영,협력사구분
              ACCUMULATED_CONTENT_KEY: '', //적립컨텐츠 키값
              ACCUMULATED_CONTENT_CD: '20', //적립 컨텐츠(HHIC30)
              ACCUMULATED_CONTENT_DETAIL: '', //적립 컨텐츠 상세
              ACCUMULATED_DATE: '', //적립일시
              ACCUMULATED_POINT: res.ORESULT_CUR[0].EARNABLE_POINT, //적립가능포인트
              CHANGE_POINT: '', //전환포인트
              CHANGE_DATE: '', //전환일시
              CHANGE_USER_IP: '', //전환 IP
              REMAINING_POINT: '', //잔여포인트
              CLOSE_DATE: '', //마감일
              REMARK: '', //비고
              INSERT_USER_ID: userStore.userId, //등록자
              INSERT_DATE: '', //등록일시
            }
            //EDUDC0020_ADD_HDPAY 프로시저를 호출하여 안전페이를 지급한다.
            commonSearchApi({
              queryId: 'EDUDC0020_ADD_HDPAY',
              param: saveData,
            })
          })
          .then((res) => {
            //조치완료후 메일,SMS발송
            afterCompleteSendMailandSms()
          })
      })
    }
    //지급이 불가능할때
    else {
      Message.warn(t(`${workRequestParam.EMP_NM}님은 지급 중단대상입니다.`))
      //조치완료후 메일,SMS발송
      afterCompleteSendMailandSms()
    }
  })
}
//조치완료후 요청자에게 안전페이 지급 관련 로직 끝

const actionEtcChanged = () => {
  //console.log('workActionParam.ACTION_ETC ::: ', workActionParam.ACTION_ETC)

  if(workActionParam.ACTION_ETC === 'Y'){
    readOnlyValue.ACTION_DATE = true
    readOnlyValue.ACTION_TIME = true
    readOnlyValue.ACTION_DESC = true
    readOnlyValue.ACTION_ETC_DESC = false
    workActionParam.ACTION_DATE = ''
    workActionParam.ACTION_TIME = ''
    workActionParam.ACTION_DESC = ''
  } else {
    readOnlyValue.ACTION_DATE = false
    readOnlyValue.ACTION_TIME = false
    readOnlyValue.ACTION_DESC = false
    readOnlyValue.ACTION_ETC_DESC = true
  }
  
}

defineExpose({
  openPopup,
  addPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">
      <span>상세정보</span>
    </div>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="[
            'btnTemporaryStorage',
            'btnRegist',
            'btnDelete',
            'btnActionComplete',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <IGridTitle title="안전작업 요청" />
            <div class="mt-2 d-flex justify-space-between">
              <div class="d-flex">
                <i-input
                  label-width="80px"
                  class="mr-0"
                  :label="$t('요구일시')"
                  :readonly="readOnlyValue.REQ_DATE"
                  type="date"
                  width="230px"
                  v-model="workRequestParam.REQ_DATE"
                  required
                  top-label
                />
                <i-select
                  width="100px"
                  :label="$t('시')"
                  v-model="workRequestParam.REQ_TIME"
                  :readonly="readOnlyValue.REQ_TIME"
                  :items="codeList.date"
                  item-title="TXT"
                  item-value="COD"
                  top-label
                />
              </div>
              <div class="d-flex">
                <i-input
                  label-width="50px"
                  :label="$t('장소')"
                  class="mr-0"
                  width="250px"
                  v-model="workRequestParam.JOB_PLC_NM"
                  :disabled="readOnlyValue.PLACE_NM"
                  top-label
                  required
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openLocationPopup"
                      icon="mdi-magnify"
                      @keydown.enter="
                        (e) => {
                          openLocationPopup()
                        }
                      "
                    />
                  </template>
                </i-input>
                <i-input
                  label-width="50px"
                  :label="$t('')"
                  width="200px"
                  v-model="workRequestParam.JOB_PLC_DETAIL"
                  :readonly="readOnlyValue.PLACE_DETAIL"
                  top-label
                />
              </div>
              <div class="d-flex">
                <i-input
                  label-width="50px"
                  :label="$t('요청자')"
                  class="mr-0"
                  width="100px"
                  :disabled="readOnlyValue.EMP_NM"
                  v-model="workRequestParam.EMP_NM"
                  top-label
                  readonly
                  required
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openRequestEmpPopup"
                      icon="mdi-magnify"
                      @keydown.enter="
                        (e) => {
                          openRequestEmpPopup()
                        }
                      "
                    />
                  </template>
                </i-input>
                <i-input
                  label-width="50px"
                  :label="$t('')"
                  width="200px"
                  v-model="workRequestParam.EMP_NO"
                  :disabled="readOnlyValue.EMP_NO"
                  top-label
                />
              </div>
            </div>
            <div class="mt-2 d-flex justify-space-between">
              <i-input
                label-width="50px"
                :label="$t('소속')"
                width="330px"
                v-model="workRequestParam.ASGN_NM"
                :disabled="readOnlyValue.ASGN_NM"
                top-label
              />
              <div class="d-flex">
                <i-input
                  label-width="50px"
                  :label="$t('작성자')"
                  class="mr-0"
                  width="150px"
                  v-model="workRequestParam.INSERT_EMP_NM"
                  :disabled="readOnlyValue.INSERT_EMP_NM"
                  top-label
                />
                <i-input
                  label-width="50px"
                  :label="$t('')"
                  width="100px"
                  v-model="workRequestParam.INSERT_USER_ID"
                  :disabled="readOnlyValue.INSERT_USER_ID"
                  top-label
                />
              </div>
              <i-input
                label-width="50px"
                :label="$t('SLI소속')"
                class="ml-2"
                width="330px"
                :disabled="readOnlyValue.SLI_ASGN_NM"
                v-model="workRequestParam.SLI_ASGN_NM"
                top-label
                readonly
                required
              >
                <template v-slot:append-inner>
                  <v-icon
                    @click="openDeptPopup"
                    icon="mdi-magnify"
                    @keydown.enter="
                      (e) => {
                        openDeptPopup()
                      }
                    "
                  />
                </template>
              </i-input>
              <i-select
                width="150px"
                :label="$t('요청대상')"
                v-model="workRequestParam.REQ_TYPE"
                :readonly="readOnlyValue.REQ_TYPE"
                :items="codeList.requesttarget"
                item-title="TXT"
                item-value="COD"
                top-label
                required
              />
            </div>
            <div class="d-flex mb-3 mt-2">
              <i-textarea
                label-width="150px"
                top-label
                :label="$t('위험내용(요청자입력)')"
                :readonly="readOnlyValue.REQ_DESC"
                v-model="workRequestParam.REQ_DESC"
                width="100%"
                required
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <IUpload
              ref="fileUpload"
              @uploaded="workFileUploaded"
              grid-title="문제점첨부"
              class="mt-2"
              style="height: 300px"
            />
          </v-sheet>
          <v-sheet class="searchArea flex-column mt-2">
            <IGridTitle title="안전작업 조치" />
            <span
              style="
                margin-left: 5px;
                font-size: 15px;
                font-weight: 300;
                color: red;
              "
            >
              ※ 실제 안전작업 조치를 실시한 인원의 이름을 기입해 주시기
              바랍니다.
            </span>
            <div class="d-flex mt-2 justify-space-between">
              <div class="d-flex">
                <i-input
                  label-width="50px"
                  :label="$t('조치자')"
                  class="mr-0"
                  width="180px"
                  :disabled="readOnlyValue.ACT_EMP_NM"
                  v-model="workActionParam.ACT_EMP_NM"
                  top-label
                  readonly
                  required
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openActionEmpPoup"
                      icon="mdi-magnify"
                      @keydown.enter="
                        (e) => {
                          openActionEmpPoup()
                        }
                      "
                    />
                  </template>
                </i-input>
                <i-input
                  label-width="50px"
                  :label="$t('')"
                  width="100px"
                  v-model="workActionParam.ACT_EMP_NO"
                  :disabled="readOnlyValue.ACT_EMP_NO"
                  top-label
                />
                <i-input
                  label-width="50px"                  
                  :label="$t('소속')"                  
                  width="400px"
                  v-model="workActionParam.ACT_ASGN_NM"
                  :disabled="readOnlyValue.ACT_ASGN_NM"
                  top-label
                />                
                <i-input
                  label-width="80px"
                  :label="$t('조치일시')"
                  class="ml-4 mr-0"
                  :readonly="readOnlyValue.ACTION_DATE"
                  type="date"
                  width="150px"
                  v-model="workActionParam.ACTION_DATE"
                  top-label
                />
                <i-select
                  width="80px"
                  :label="$t('시')"
                  v-model="workActionParam.ACTION_TIME"
                  :readonly="readOnlyValue.ACTION_TIME"
                  :items="codeList.date"
                  item-title="TXT"
                  item-value="COD"
                  top-label
                />
              </div>              
            </div>
            <div class="d-flex mb-3 mt-2">
              <i-textarea
                label-width="150px"
                top-label
                :label="$t('조치내용(조치자입력)')"
                :readonly="readOnlyValue.ACTION_DESC"
                v-model="workActionParam.ACTION_DESC"
                width="100%"
                :required="!readOnlyValue.ACTION_DESC"
              />
            </div>
            <div class="d-flex mb-3 mt-1">
              <v-checkbox
                :label="$t('미조치 (조치 불필요 또는 불가)')"
                v-model="workActionParam.ACTION_ETC"
                class="mt-2"
                true-value="Y"
                false-value="N"
                :disabled="readOnlyValue.ACTION_ETC"
                @change="actionEtcChanged"
              ></v-checkbox>
            </div>
            <div class="d-flex mb-3 mt-1">
              <i-textarea
                label-width="150px"
                top-label
                :label="$t('미조치 사유')"
                :readonly="readOnlyValue.ACTION_ETC_DESC"
                v-model="workActionParam.ACTION_ETC_DESC"
                width="100%"                
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <IUpload
              ref="fileUpload2"
              @uploaded="actionFileuploaded"
              grid-title="조치결과첨부"
              class="mt-2"
              style="height: 300px"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="requestEmpPopup" @selected="reqEmpSelected"></EmpPopup>
    <EmpPopup ref="actionEmpPopup" @selected="actEmpSelected"></EmpPopup>
    <DeptPopup ref="deptPopup" @selected="deptSelected"></DeptPopup>
    <LocationPopup
      ref="workLocationPopup"
      @selectedArr="selectedLcation"
    ></LocationPopup>
  </VDialog>
</template>
