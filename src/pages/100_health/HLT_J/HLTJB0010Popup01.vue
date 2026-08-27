<!--
  화면명 : 업무상질병 신청 추가 팝업
  화면개요 : 업무상질병 신청 추가 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IUpload from "@/components/IUpload.vue"
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import _ from 'lodash'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const diagnosisTitle = ref(null)
const empPopup = ref(null)
const grdMain = ref(null)
const fileUpload = ref(null)
const fileUploadButton = reactive(["btnDownLoad", "btnDelete"])
const stdType = ref('') // 직종 타입(A: 용접, B: 취부, C: 배관, D: 도장)
const scrollBox = ref(null)
const scrollUp = ref(true)
const txtAppliGubun = ref(null)
const txtHospital = ref(null)
const txtIncident = ref(null)
const txtBody1 = ref(null)
const txtBody2 = ref(null)
const txtDisease = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  ASGN_NM: '', // 과 (안씀)
  GWA_NM: '', // 과
  STD_DUTY_NM: '', // 직종(상세분류중 중간)
  UNT_DUTY_NM: '', // 직종(상세분류중 마지막)
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  NOTIFY_DATE: '', // 사실통지일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  BODY1_CODE: '', // 신체부위1
  BODY1_NM: '', //신체부위1 명
  BODY2_CODE: '', // 신체부위2
  BODY2_NM: '', //신체부위2 명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_CODE: '', // 상병코드 (PK)
  DISEASE_NM: '', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  CMPNY_RCPT_DATE: '', // 회사접수일
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_YEAR: '',
  WORK_DATE_YEARS: '',  // 근무연수 년도
  WORK_DATE_MONTHS: '', // 근무연수 월
  WORK_EVAL: '', // 자체 작업력 평가
  EXPIRATION_DATE: '', // 유효기간
  IND_MANAGE: '',
  IDX: '',
  CHK_DISEASE: '',
  CHK_STD1: '',
  CHK_STD2: '',
  CHK_STD3: '',
  CHK_STD4: '',
  SAVE_YN: '',
  INSERT_DATE: '', // 등록일
  ONLY_VIEW: false // 읽기 전용 구분
})

// 진단정보
const diagnosisInfo = reactive({
  DISEASE1: { // 회전근개파열
    CODE: 'A37',
    YN: false,
    EXPIRATION_MONTH: 12,
    EXPIRATION_DATE: '',
    STD: [false, false, false, false],
    EVAL: false
  },
  DISEASE2: { // 외상과염
    CODE: 'A24',
    YN: false,
    EXPIRATION_MONTH: 2,
    EXPIRATION_DATE: '',
    STD: [false, false, false, false],
    EVAL: false
  },
  DISEASE3: { // 반월상연골파열
    CODE: 'A15',
    YN: false,
    EXPIRATION_MONTH: 12,
    EXPIRATION_DATE: '',
    STD: [false, false, false, false],
    EVAL: false
  },
  DISEASE4: { // 추간판탈출증
    CODE: 'A31',
    WAIST: { // 요추
      CODE: '006',
      YN: false,
      EXPIRATION_MONTH: 12,
      EXPIRATION_DATE: '',
      STD: [false, false, false, false],
      EVAL: false
    },
    NECK: { // 경추
      CODE: '002',
      YN: false,
      EXPIRATION_MONTH: 12,
      EXPIRATION_DATE: '',
      STD: [false, false, false, false],
      EVAL: false
    }
  },
  DISEASE5: { // 수근관증후군
    CODE: 'A18',
    YN: false,
    EXPIRATION_MONTH: 6,
    EXPIRATION_DATE: '',
    STD: [false, false, false, false],
    EVAL: false
  }, 
  DISEASE_NO: true // 해당없음
})

const codeList = reactive({
  APPLI_GUBUN: [],
  INCIDENT: [],
  HOSPITAL: [],
  BODY1: [],
  BODY2: [],
  DISEASE: [],
  IND_MANAGE: [], // 조직별담당자 화면에서 공단 담당자 목록들을 불러온다.
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ],
})

//그리드 속성셋팅 
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }, },
  keys : [], 
  fields : [ 
    { fieldName: 'APPLI_GUBUN_NM', width: '60', dataType: 'text', header: { text: t('신청구분') }, mergeRule: { criteria: 'value' }},
    { fieldName: 'BODY1_NM', width: '60', dataType: 'text', header: { text: t('부위 1') }},
    { fieldName: 'BODY2_NM', width: '60', dataType: 'text', header: { text: t('부위 2') }},
    { fieldName: 'DISEASE_NM', width: '240', dataType: 'text', header: { text: t('상병명') }},
    
    // 안보이는거
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') },visible: false },
    { fieldName: 'BODY1_CODE', dataType: 'text', header: { text: t('신체부위1') },visible: false },
    { fieldName: 'BODY2_CODE', dataType: 'text', header: { text: t('신체부위2') },visible: false },
    { fieldName: 'DISEASE_CODE', dataType: 'text', header: { text: t('상병코드') },visible: false },
    { fieldName: 'DIAGNOSIS_DATE', dataType: 'text', header: { text: t('진단일') },visible: false },
    { fieldName: 'DIAGNOSIS_NM', dataType: 'text', header: { text: t('진단일') },visible: false },
    { fieldName: 'HOSPITAL_CODE', dataType: 'text', header: { text: t('진단기관코드') },visible: false },
    { fieldName: 'HOSPITAL_NM', dataType: 'text', header: { text: t('진단기관명') },visible: false },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('인덱스') },visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const getCode = (param) => {
  Promise.all([
    // 신청구분
    getCodeList('HHII820A'),
    // 발생경위
    getCodeList('HHII820B'),
    // 진단기관
    getCodeList('HHII820C'),
    // 신체부위1
    getCodeList('HHII820D'),
    // 신체부위2
    getCodeList('HHII820E'),
    // 상병
    commonSearchApi({ queryId : 'HLTJB0010_SEARCH_DISEASE', param: searchParams}),
    // 공단담당자(지금은 안씀)
    commonSearchApi({ queryId : 'HLTJB0010_SEARCH_02', param: searchParams}),
  ]).then((res) => {
    codeList.APPLI_GUBUN = res[0].ORESULT_CUR
    codeList.INCIDENT = res[1].ORESULT_CUR
    codeList.HOSPITAL = res[2].ORESULT_CUR
    codeList.BODY1 = res[3].ORESULT_CUR
    codeList.BODY2 = res[4].ORESULT_CUR
    codeList.DISEASE = res[5].ORESULT_CUR
    codeList.IND_MANAGE = res[6].ORESULT_CUR 

    insertName()
    if(!isEmpty(param)) {
      for (let key in param) {
        if (searchParams.hasOwnProperty(key)) {
          if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
            searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
          } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
            searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYY-MM-DD')
          } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
            searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
          } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
            searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
          } else if (key === 'CMPNY_RCPT_DATE' && !isEmpty(param.CMPNY_RCPT_DATE)) {
            searchParams.CMPNY_RCPT_DATE = dayjs(param.CMPNY_RCPT_DATE).format('YYYY-MM-DD')
          } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
            searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
          } else if (key === 'HLD_OFFI_GBN') {
            let hldOffiGbn = codeList.HLD_OFFI_GBN.filter(item => item.COD === param.HLD_OFFI_GBN)
            searchParams.HLD_OFFI_GBN = !isEmpty(hldOffiGbn) ? hldOffiGbn[0].TXT : ''
          } else {
            searchParams[key] = param[key]
          }
        }
      }
      searchParams.EMP_NM = param.KOR_NM
      searchParams.SAVE_YN = 'Y'
      
      getDisease()
    } else {
      searchParams.SAVE_YN = 'N'
      searchParams.CMPNY_DIV = userStore.cmpnyDiv
      // menuTitle.value.disableBtn('btnDelete', true)
    }

    searchParams.BODY1_NM = ''
    searchParams.BODY1_CODE = ''
    searchParams.BODY2_NM = ''
    searchParams.BODY2_CODE = ''
    searchParams.DISEASE_CODE = ''
    searchParams.DISEASE_NM = ''
    checkFileId()

    if(!isEmpty(scrollBox.value)) {
      scrollBox.value.scrollTop = 0
    }
  })
}

// 팝업 OPEN
const openPopup = (param) => {
  searchParams.ONLY_VIEW = false
  grdMain.value.getDataProvider().setRows()
  if(!isEmpty(scrollBox.value)) {
    scrollBox.value.scrollTop = 0
  }
  getCode(param)
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') { 
    // 저장
    new saveFlowHelper(vm, t)
      .showToast(false)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    // 삭제
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnCreate') {
    // 추가
    if(isEmpty(searchParams.EMP_NO)) {
      return Message.warn(t('사번은 필수 입력입니다.'))
    } else if (isEmpty(searchParams.CMPNY_DIV)) {
      return Message.warn(t('회사구분은 필수 입력입니다.'))
    } else if (isEmpty(searchParams.APPLI_GUBUN) || isEmpty(searchParams.APPLI_GUBUN_NM)) {
      return Message.warn(t('신청구분을 입력해주십시오.'))
    } else if (isEmpty(searchParams.HOSPITAL_CODE) || isEmpty(searchParams.HOSPITAL_NM)) {
      return Message.warn(t('진단기관을 입력해주십시오.'))
    } else if (isEmpty(searchParams.DIAGNOSIS_DATE)) {
      return Message.warn(t('진단일을 입력해주십시오.'))
    } else if (isEmpty(searchParams.DISEASE_CODE)) {
      return Message.warn(t('상병명은 필수 입력입니다.'))
    } else if (isEmpty(searchParams.BODY1_CODE) || isEmpty(searchParams.BODY1_NM)) {
      return Message.warn(t('신체부위1은 필수 입력입니다.'))
    } else if (isEmpty(searchParams.BODY2_CODE) || isEmpty(searchParams.BODY2_NM)) {
      return Message.warn(t('신체부위2은 필수 입력입니다.'))
    }

    let idx = 1
    if(!isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1))) {
      idx = Number(grdMain.value.getDataProvider().getJsonRows(0,-1).reduce((max,obj) => (obj.IDX > max.IDX ? obj : max), grdMain.value.getDataProvider().getJsonRows(0,-1)[0]).IDX) + 1
    } else {
      searchParams.IDX = ''
    }
    grdMain.value.addRow({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      EMP_NO: searchParams.EMP_NO,
      BODY1_CODE: searchParams.BODY1_CODE,
      BODY1_NM: searchParams.BODY1_NM,
      BODY2_CODE: searchParams.BODY2_CODE,
      BODY2_NM: searchParams.BODY2_NM,
      DISEASE_CODE: searchParams.DISEASE_CODE,
      DISEASE_NM: searchParams.DISEASE_NM,
      APPLI_GUBUN_NM: searchParams.APPLI_GUBUN_NM,
      DIAGNOSIS_DATE: searchParams.DIAGNOSIS_DATE,
      HOSPITAL_CODE: searchParams.HOSPITAL_CODE,
      HOSPITAL_NM: searchParams.HOSPITAL_NM,
      IDX: idx,
      SAVE_YN: 'N'
    }, false)

    searchParams.BODY1_NM = ''
    searchParams.BODY1_CODE = ''
    searchParams.BODY2_NM = ''
    searchParams.BODY2_CODE = ''
    searchParams.DISEASE_CODE = ''
    searchParams.DISEASE_NM = ''
    setDiagnosis()
    scrollUp.value = false
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

// 저장 전
const beforeSave = () => {
  // validation 체크
  if (isEmpty(searchParams.EMP_NO)) {
    return Message.warn(t('신청인 정보가 없습니다.'))
  } else if (isEmpty(searchParams.CMPNY_DIV)) {
    return Message.warn(t('회사구분은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.APPLI_GUBUN)) {
    return Message.warn(t('신청구분은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.HOSPITAL_CODE)) {
    return Message.warn(t('진단기관은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.DIAGNOSIS_DATE)) {
    return Message.warn(t('진단일은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.APPLI_DATE)) {
    return Message.warn(t('진정일은 필수 입력입니다.'))
  } else if (isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1))) {
    return Message.warn(t('상병내역을 추가해주십시오.'))
  } else if (searchParams.SAVE_YN !== 'Y' && isEmpty(grdMain.value.getGridView().getCheckedRows(true))) {
    return Message.warn(t('저장할 상병을 선택해주십시오.'))
  }

  // 체크박스 상병명 저장
  searchParams.CHK_DISEASE = checkDisease()
  searchParams.CHK_STD1 = checkStd('A')
  searchParams.CHK_STD2 = checkStd('B')
  searchParams.CHK_STD3 = checkStd('C')
  searchParams.CHK_STD4 = checkStd('D')

  return true
}

// 저장
const saveData = async () => {
  let saveParam = _.cloneDeep(searchParams)
  let saveParams = []
  let gridData = grdMain.value.getGridView().getJsonRows()
  saveParam.APPLI_DATE = searchParams.APPLI_DATE.replaceAll('-', '')
  saveParam.DIAGNOSIS_DATE = searchParams.DIAGNOSIS_DATE.replaceAll('-', '')
  if(!isEmpty(saveParam.BIRTH_DAY)) {
    saveParam.BIRTH_DAY = searchParams.BIRTH_DAY.replaceAll('-', '')
  }
  if(!isEmpty(saveParam.RETI_DATE)) {
    saveParam.RETI_DATE = searchParams.RETI_DATE.replaceAll('-', '')
  }
  if(!isEmpty(saveParam.COM_ENT_DATE)) {
    saveParam.COM_ENT_DATE = searchParams.COM_ENT_DATE.replaceAll('-', '')
  }
  if(!isEmpty(saveParam.CMPNY_RCPT_DATE)) {
    saveParam.CMPNY_RCPT_DATE = searchParams.CMPNY_RCPT_DATE.replaceAll('-', '')
  }

  // 상병내역 목록 모두 탐색
  for (let data of gridData) {
    data.DIAGNOSIS_DATE = dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD')
    saveParams.push(data) 
  }

  // 중복 체크 
  let cnt = await commonSearchApi({ queryId : 'HLTJB0010_SEARCH_09', param: {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    EMP_NO: searchParams.EMP_NO,
    DIAGNOSIS_DATE: dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD'),
    HOSPITAL_CODE: searchParams.HOSPITAL_CODE,
    HOSPITAL_NM: searchParams.HOSPITAL_NM
  }})
  if(!isEmpty(cnt) && searchParams.SAVE_YN !== 'Y') {
    if(cnt.ORESULT_CUR[0].CNT > 0) {
      return Message.warn(t('이미 동일한 사건이 등록되어 있습니다.'))
    }
  }

  // 상병내역에 있는 상병이 진단정보에 있는 상병에 없을 경우, 자동으로 해당없음 체크
  let isDisease = saveParams.filter(item => 
    // A15(반월상연골파열), A18(수근관증후군), A24(외측상과염), A31(추간판탈출증), A37(회전근개파열)
    ['A15', 'A18', 'A24', 'A31', 'A37']
    .some(text => item.DISEASE_CODE.replaceAll(' ', '') === text)
  )

  // 상병내역 없음 || 근속연수 10년 미만이면 해당없음으로 자동체크
  if(isEmpty(isDisease) || searchParams.WORK_DATE_YEARS < 10 || diagnosisInfo.DISEASE_NO) {
    initDiagnosis()
    saveParam.CHK_DISEASE = ''
    saveParam.CHK_STD1 = ''
    saveParam.CHK_STD2 = ''
    saveParam.CHK_STD3 = ''
    saveParam.CHK_STD4 = ''
    saveParam.WORK_EVAL = ''
    saveParam.EXPIRATION_DATE = ''

    searchParams.CHK_DISEASE = ''
    searchParams.CHK_STD1 = ''
    searchParams.CHK_STD2 = ''
    searchParams.CHK_STD3 = ''
    searchParams.CHK_STD4 = ''
    searchParams.WORK_EVAL = ''
  }else {
    // 유효기간 계산후 데이터 삽입
    // 진단일
    let diagnosis = dayjs(searchParams.DIAGNOSIS_DATE)
    // 뺄 날짜 (재직 - 오늘날짜(등록날짜) | 휴/퇴직 - 휴/퇴직일)
    let diffDate = dayjs().format('YYYY-MM-DD')

    // 신규가 아닐때 등록일자 가져오기
    if(!isEmpty(searchParams.INSERT_DATE)) {
      diffDate = dayjs(searchParams.INSERT_DATE)
    }

    if(searchParams.HLD_OFFI_GBN !== '재직') {
      diffDate = dayjs(searchParams.RETI_DATE)
    } 

    const diffMonths = diagnosis.diff(diffDate, 'month')
    const years = Math.trunc(diffMonths / 12)
    const months = diffMonths % 12

    // 결과 입력
    saveParam.EXPIRATION_DATE = `${years}년 ${months}개월`
  }

  return Promise.all([
      commonExecuteApi({ queryId : 'HLTJB0010_SAVE_01', list: [saveParam] }),
      commonExecuteApi({ queryId : 'HLTJB0010_SAVE_02', list: saveParams })
    ])
}

const afterSaveData = (res) => {
  if(!isEmpty(res)) {
    searchParams.SAVE_YN = 'Y'
    Message.success(t('성공적으로 저장되었습니다'))
    getDisease()
  }
}

const deleteData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    data.DIAGNOSIS_DATE = dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD')
    saveParams.push(data) 
  }

  return commonExecuteApi({ queryId : 'HLTJB0010_DELETE_02', list: saveParams })
} 

const afterDelete = () => {
  Message.success(t('성공적으로 삭제되었습니다'))
  getDisease()
}

// 상병명에 체크된 항목들을 저장(수정이 가능하기때문에 따로 저장해줘야한다.)
const checkDisease = () => {
  let chkDisease = ''
  if(diagnosisInfo.DISEASE1.YN) {
    chkDisease += '1,'
  } 
  if (diagnosisInfo.DISEASE2.YN) {
    chkDisease += '2,'
  } 
  if (diagnosisInfo.DISEASE3.YN) {
    chkDisease += '3,'
  } 
  if (diagnosisInfo.DISEASE4.WAIST.YN) {
    chkDisease += '4,'
  } 
  if (diagnosisInfo.DISEASE4.NECK.YN) {
    chkDisease += '5,'
  } 
  if (diagnosisInfo.DISEASE5.YN) {
    chkDisease += '6,'
  }

  return chkDisease
}

// 직종에 체크된 항목들을 저장. 2차원 배열을 생각하라. db에는 직종별, vue에선 상병별로 저장
const checkStd = (type) => {
  let chkList = ''
  let arrIndex = 0
  if(type == 'A') {
    arrIndex = 0
  } else if (type == 'B') {
    arrIndex = 1
  } else if (type == 'C') {
    arrIndex = 2
  } else if (type == 'D') {
    arrIndex = 3
  }
  if(diagnosisInfo.DISEASE1.STD[arrIndex]) {
    chkList += '1,'
  } 
  if (diagnosisInfo.DISEASE2.STD[arrIndex]) {
    chkList += '2,'
  }
  if (diagnosisInfo.DISEASE3.STD[arrIndex]) {
    chkList += '3,'
  } 
  if (diagnosisInfo.DISEASE4.WAIST.STD[arrIndex]) {
    chkList += '4,'
  } 
  if (diagnosisInfo.DISEASE4.NECK.STD[arrIndex]) {
    chkList += '5,'
  } 
  if (diagnosisInfo.DISEASE5.STD[arrIndex]) {
    chkList += '6,'
  }
  return chkList
}

const clearParam = () => {
  for (let key in searchParams) {

    if (searchParams.hasOwnProperty(key)) {
      if(typeof(searchParams[key]) == 'boolean') {
        searchParams[key] = false
      }else {
        searchParams[key] = ''
      }
    } 
  }
  checkFileId()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false
  scrollUp.value = true
  clearParam()
  initDiagnosis()
}

// 인원 선택 이벤트
const onEmpSelected = val => {
  clearParam()
  initDiagnosis()
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.EMP_NO = val.EMP_NO
  searchParams.EMP_NM = val.EMP_NM
  searchParams.BIRTH_DAY = val.BIRTH_DAY ? val.BIRTH_DAY : val.SANJE_BIRTH_DAY
  searchParams.HLD_OFFI_GBN = val.HLD_OFFI_GBN
  searchParams.BSNS_NM = val.BSNS_NM
  searchParams.DEPT_NM = val.DEPT_NM
  searchParams.ASGN_NM = val.ASGN_NM
  searchParams.GWA_NM = val.GWA_NM
  searchParams.STD_DUTY_NM = val.STD_DUTY_NM
  searchParams.UNT_DUTY_NM = val.UNT_DUTY_NM ? val.UNT_DUTY_NM : val.STD_DUTY_NM
  searchParams.COM_ENT_DATE = val.GRP_ENT_DATE
  // searchParams.RETI_DATE = val.RETI_DATE
  if (searchParams.HLD_OFFI_GBN == '퇴사') {
    searchParams.RETI_DATE = dayjs(val.RETI_TMP_DATE).format('YYYY-MM-DD')
  } else {
    if(dayjs(val.TMP_RST_DATE).isValid()) {
      searchParams.RETI_DATE = dayjs(val.TMP_RST_DATE).format('YYYY-MM-DD')
    } else {
      searchParams.RETI_DATE = ''
    }
  }

  // 근속연수 계산
  calcWorkYear()
}

// 해당 신청인의 상병내역 조회
const getDisease = () => {
  Promise.all([
    // 신청구분
    commonSearchApi({ queryId: 'HLTJB0010_SEARCH_02', param: { 
      CMPNY_DIV: searchParams.CMPNY_DIV, 
      EMP_NO: searchParams.EMP_NO, 
      DIAGNOSIS_DATE: dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD'),
      HOSPITAL_CODE: searchParams.HOSPITAL_CODE,
      HOSPITAL_NM: searchParams.HOSPITAL_NM,
      APPLI_GUBUN_NM: searchParams.APPLI_GUBUN_NM
    } }),
  ]).then((res) => {
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)

    initDiagnosis()
    // 상병명 세팅
    if(isEmpty(searchParams.CHK_DISEASE)) {
      diagnosisInfo.DISEASE_NO = true
    } else {
      const chkDisease = searchParams.CHK_DISEASE.split(',')
      diagnosisInfo.DISEASE_NO = false
      if(chkDisease.includes('1')) {
        diagnosisInfo.DISEASE1.YN = true
      } 
      if(chkDisease.includes('2')) {
        diagnosisInfo.DISEASE2.YN = true
      } 
      if(chkDisease.includes('3')) {
        diagnosisInfo.DISEASE3.YN = true
      } 
      if(chkDisease.includes('4')) {
        diagnosisInfo.DISEASE4.WAIST.YN = true
      } 
      if(chkDisease.includes('5')) {
        diagnosisInfo.DISEASE4.NECK.YN = true
      } 
      if(chkDisease.includes('6')) {
        diagnosisInfo.DISEASE5.YN = true
      } 
    }

    // 직종 체크박스 세팅
    for(let i = 0; i < 4; i++) {
      if(isEmpty(searchParams['CHK_STD' + (i+1)])) {
        continue
      } 
      const checkList = searchParams['CHK_STD' + (i+1)].split(',')
      if(checkList.includes('1')) {
        diagnosisInfo.DISEASE1.STD[i] = true
      } 
      if(checkList.includes('2')) {
        diagnosisInfo.DISEASE2.STD[i] = true
      } 
      if(checkList.includes('3')) {
        diagnosisInfo.DISEASE3.STD[i] = true
      } 
      if(checkList.includes('4')) {
        diagnosisInfo.DISEASE4.WAIST.STD[i] = true
      } 
      if(checkList.includes('5')) {
        diagnosisInfo.DISEASE4.NECK.STD[i] = true
      } 
      if(checkList.includes('6')) {
        diagnosisInfo.DISEASE5.STD[i] = true
      } 
    }
    changeCheck()
  })
}

// 사실통지 파일 세팅
const checkFileId = () => {
  if (isEmpty(searchParams.NOTIFY_FILE_ID)) {
    fileUpload.value.setGuid()
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(searchParams.NOTIFY_FILE_ID)
  }
  searchParams.NOTIFY_FILE_ID = fileUpload.value.guid
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
  
}

// 인원 검색
const openEmpPopup = () => {
  if(searchParams.SAVE_YN === 'Y') {
    return
  }
  empPopup.value.openPopup({MENU_ID: 'HLTJB0010', BSNS_CD: '', USER_DIV: 'A', FLAG: 'Y', readonly: true})
}

// 신청인 clear
const clearEmp = () => {
  if(searchParams.SAVE_YN === 'Y') {
    return
  }
  clearParam()
}

const findName = (array, target, name) => {
  let result = array.filter(item => item.COD === target)
  if(isEmpty(result)) return '' 

  if(result[0].TXT.replaceAll(' ', '') == '직접입력') {
    if(!isEmpty(array.filter(item => item.TXT === name))) {
      return ''
    } else {
      return name
    }
  } else {
    return result[0].TXT
  }
}

// 진단정보 초기화(해당없음으로 돌릴때)
const initDiagnosis = () => {
  diagnosisInfo.DISEASE1.YN = false
  diagnosisInfo.DISEASE2.YN = false
  diagnosisInfo.DISEASE3.YN = false
  diagnosisInfo.DISEASE4.WAIST.YN = false
  diagnosisInfo.DISEASE4.NECK.YN = false
  diagnosisInfo.DISEASE5.YN = false
  diagnosisInfo.DISEASE_NO = true

  diagnosisInfo.DISEASE1.STD = [false, false, false, false]
  diagnosisInfo.DISEASE2.STD = [false, false, false, false]
  diagnosisInfo.DISEASE3.STD = [false, false, false, false]
  diagnosisInfo.DISEASE4.WAIST.STD = [false, false, false, false]
  diagnosisInfo.DISEASE4.NECK.STD = [false, false, false, false]
  diagnosisInfo.DISEASE5.STD = [false, false, false, false]

  // 업무관련성도 미해당으로 초기화
  diagnosisInfo.DISEASE1.EVAL = false
  diagnosisInfo.DISEASE2.EVAL = false
  diagnosisInfo.DISEASE3.EVAL = false
  diagnosisInfo.DISEASE4.WAIST.EVAL = false
  diagnosisInfo.DISEASE4.NECK.EVAL = false
  diagnosisInfo.DISEASE5.EVAL = false

}

// 진단정보 세팅
const setDiagnosis = () => {
  if(isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1))) {
    return initDiagnosis()
  }
  // 상병코드 배열
  let grdDisease = grdMain.value.getDataProvider().getJsonRows(0,-1).map(item => item.DISEASE_CODE)
  // A37 회전근개파열, A24 외측상과염, A15 반월상연골파열, A31 추간판탈출증, A18 수근관증후군
  let diseaseList = ['A37', 'A24', 'A15', 'A31', 'A18']
  // 추간판탈출증은 신체부위도 봐야함.
  let d4 = grdMain.value.getDataProvider().getJsonRows(0,-1).filter(item => item.DISEASE_CODE == 'A31')

  // 특수질병 이외에 다른 질병이 하나라도 속하면 작업력평가 해당되지 않음
  if(!isEmpty(grdDisease.filter(item => !diseaseList.includes(item)))) {
    return initDiagnosis()
  }

  // 추간판탈출증에서 요츄,경추 이외의 부위가 있다면 작업력 평가 해당되지 않음.
  if(!isEmpty(d4)) {
    if(!isEmpty(d4.filter(item => !['002','006'].includes(item.BODY1_CODE)))) {
      return initDiagnosis() 
    }
  }
  // 상병명 진단정보 체크박스 자동 세팅
  diagnosisInfo.DISEASE1.YN = grdDisease.includes('A37') // 회전근개파열
  diagnosisInfo.DISEASE2.YN = grdDisease.includes('A24') // 외상과염
  diagnosisInfo.DISEASE3.YN = grdDisease.includes('A15') // 반월상연골파열
  diagnosisInfo.DISEASE4.NECK.YN = !isEmpty(d4) && !isEmpty(d4.filter(item => item.BODY1_CODE == '002')) // 추간판탈출증(경추)
  diagnosisInfo.DISEASE4.WAIST.YN = !isEmpty(d4) && !isEmpty(d4.filter(item => item.BODY1_CODE == '006')) // 추간판탈출증(요추)
  diagnosisInfo.DISEASE5.YN = grdDisease.includes('A18') // 수근관증후군
  diagnosisInfo.DISEASE_NO = !(diagnosisInfo.DISEASE1.YN || diagnosisInfo.DISEASE2.YN || diagnosisInfo.DISEASE3.YN || diagnosisInfo.DISEASE4.WAIST.YN || diagnosisInfo.DISEASE4.NECK.YN || diagnosisInfo.DISEASE5.YN) // 해당없음

  // 직종별 진단정보 체크박스 자동 세팅
  const stdCode = {0:'A', 1:'B', 2:'C', 3:'D'}
  for(let i = 0; i < 4; i++) {
    diagnosisInfo.DISEASE1.STD[i] = diagnosisInfo.DISEASE1.YN && stdType.value == stdCode[i]
    diagnosisInfo.DISEASE2.STD[i] = diagnosisInfo.DISEASE2.YN && stdType.value == stdCode[i]
    diagnosisInfo.DISEASE3.STD[i] = diagnosisInfo.DISEASE3.YN && stdType.value == stdCode[i]
    diagnosisInfo.DISEASE4.WAIST.STD[i] = diagnosisInfo.DISEASE4.WAIST.YN && stdType.value == stdCode[i]
    diagnosisInfo.DISEASE4.NECK.STD[i] = diagnosisInfo.DISEASE4.NECK.YN && stdType.value == stdCode[i]
    diagnosisInfo.DISEASE5.STD[i] = diagnosisInfo.DISEASE5.YN && stdType.value == stdCode[i]
  }

  // 업무관련성 체크
  changeCheck()
}

// 각 이름에 값을 넣어준다
const insertName = () => {
  // 기타항목은 제외 - 입력한 텍스트 그대로 저장

  // 신청구분 (기타코드 - 999)
  if(searchParams.APPLI_GUBUN != '999') {
    searchParams.APPLI_GUBUN_NM = findName(codeList.APPLI_GUBUN, searchParams.APPLI_GUBUN, searchParams.APPLI_GUBUN_NM)
  }
  // 진단기관 (기타코드 - 999)
  if(searchParams.HOSPITAL_CODE != '999') {
    searchParams.HOSPITAL_NM = findName(codeList.HOSPITAL, searchParams.HOSPITAL_CODE, searchParams.HOSPITAL_NM)
  }
  // 상병명 (기타코드 - J99)
  if(searchParams.DISEASE_CODE != 'J99') {
    searchParams.DISEASE_NM = findName(codeList.DISEASE, searchParams.DISEASE_CODE, searchParams.DISEASE_NM)
  }
  // 신체부위1 (기타코드 - 999)
  if(searchParams.BODY1_CODE != '999') {
   searchParams.BODY1_NM = findName(codeList.BODY1, searchParams.BODY1_CODE, searchParams.BODY1_NM)
  }
  // 신체부위2 (기타코드 - 999)
  if(searchParams.BODY2_CODE != '999') {
   searchParams.BODY2_NM = findName(codeList.BODY2, searchParams.BODY2_CODE, searchParams.BODY2_NM)
  }
  // 발생경위 (기타코드 - 999)
  if(searchParams.INCIDENT_CODE != '999') {
    searchParams.INCIDENT_NM = findName(codeList.INCIDENT, searchParams.INCIDENT_CODE, searchParams.INCIDENT_NM)
  }
}

// 체크박스 클릭시 스크롤 업 금지
const clickCheck = () => {
  scrollUp.value = false
}

// 하단의 진단정보 체크박스 수정 시
const changeCheck = () => {
  const diseas = 'DISEASE'
  const stdMap = { A: 0, B: 1, C: 2, D: 3 }
  let workEval = false

  if(isEmpty(searchParams.EMP_NO)) {
    initDiagnosis()
    return Message.warn(t('신청자 정보를 선택해주세요.'))
  }

  if(isEmpty(searchParams.DIAGNOSIS_DATE)) {
    initDiagnosis()
    return Message.warn(t('진단일을 입력해주십시오.'))
  }
  
  for(let i = 1; i<= 5; i++) {

    if(i != 4) {
      diagnosisInfo[diseas + i].EVAL = false
      if(diagnosisInfo[diseas + i].YN) { // 상병명체크 확인
        diagnosisInfo[diseas + i].STD[stdMap[stdType.value]] = true
        for(let c of diagnosisInfo[diseas + i].STD) { // 직종 체크 확인
          if(c && isLessThanMonths(diagnosisInfo[diseas + i].EXPIRATION_MONTH)) {
            diagnosisInfo[diseas + i].EVAL = true
            workEval = true
            break
          }
        }
      } else {
        diagnosisInfo[diseas + i].STD.fill(false)
      }
    } else {
      // 추간판 탈출증
      // 요추
      diagnosisInfo.DISEASE4.WAIST.EVAL = false
      if(diagnosisInfo.DISEASE4.WAIST.YN) { // 상병명체크 확인
        diagnosisInfo.DISEASE4.WAIST.STD[stdMap[stdType.value]] = true
        for(let c of diagnosisInfo.DISEASE4.WAIST.STD) { // 직종 체크 확인
          if(c && isLessThanMonths(diagnosisInfo.DISEASE4.WAIST.EXPIRATION_MONTH)) {
            diagnosisInfo.DISEASE4.WAIST.EVAL = true
            workEval = true
            break
          }
        }
      } else {
        diagnosisInfo.DISEASE4.WAIST.STD.fill(false)
      }

      // 경추
      diagnosisInfo.DISEASE4.NECK.EVAL = false
      if(diagnosisInfo.DISEASE4.NECK.YN) { // 상병명체크 확인
        diagnosisInfo.DISEASE4.NECK.STD[stdMap[stdType.value]] = true
        for(let c of diagnosisInfo.DISEASE4.NECK.STD) { // 직종 체크 확인
          if(c && isLessThanMonths(diagnosisInfo.DISEASE4.NECK.EXPIRATION_MONTH)) {
            diagnosisInfo.DISEASE4.NECK.EVAL = true
            workEval = true
            break
          }
        }
      } else {
        diagnosisInfo.DISEASE4.NECK.STD.fill(false)
      }
    }
  }
  if(workEval) {
    searchParams.WORK_EVAL = 'Y'
  } else {
    searchParams.WORK_EVAL = 'N'
  }

  // 하나의 상병명에 체크가 되있을 시 해당없음 체크 해제
  diagnosisInfo.DISEASE_NO = !(diagnosisInfo.DISEASE1.YN || diagnosisInfo.DISEASE2.YN ||
    diagnosisInfo.DISEASE3.YN || diagnosisInfo.DISEASE4.WAIST.YN || diagnosisInfo.DISEASE4.NECK.YN ||
    diagnosisInfo.DISEASE5.YN)
}

const changeStdCheck = (e, chk) => {
  let workEval = false
  let checkData = chk.split('.')
  let stdYn = false

  if(isEmpty(searchParams.EMP_NO)) {
    initDiagnosis()
    return Message.warn(t('신청자 정보를 선택해주세요.'))
  }

  if(isEmpty(searchParams.DIAGNOSIS_DATE)) {
    initDiagnosis()
    return Message.warn(t('진단일을 입력해주십시오.'))
  }
  if(!checkData[0].includes('4')) {
    for(let c of diagnosisInfo[checkData[0]].STD) {
      if(c) {
        diagnosisInfo[checkData[0]].YN = true
        break
      } 
    }
    stdYn = checkEval(diagnosisInfo[checkData[0]])
    diagnosisInfo[checkData[0]].EVAL = stdYn
  } else { // 추간판탈출증
    if(checkData[0].includes('NECK')) {
      for(let c of diagnosisInfo.DISEASE4.NECK.STD) {
        if(c) {
          diagnosisInfo.DISEASE4.NECK.YN = true
          break
        } 
      }
      stdYn = checkEval(diagnosisInfo.DISEASE4.NECK)
      diagnosisInfo.DISEASE4.NECK.EVAL = stdYn
    } else {
      for(let c of diagnosisInfo.DISEASE4.WAIST.STD) {
        if(c) {
          diagnosisInfo.DISEASE4.WAIST.YN = true
          break
        } 
      }
      stdYn = checkEval(diagnosisInfo.DISEASE4.WAIST)
      diagnosisInfo.DISEASE4.WAIST.EVAL = stdYn
    }
  }

  workEval = (diagnosisInfo.DISEASE1.YN || diagnosisInfo.DISEASE2.YN ||
    diagnosisInfo.DISEASE3.YN || diagnosisInfo.DISEASE4.WAIST.YN || diagnosisInfo.DISEASE4.NECK.YN ||
    diagnosisInfo.DISEASE5.YN) && stdYn
 
  if(workEval) {
    searchParams.WORK_EVAL = 'Y'
  } else {
    searchParams.WORK_EVAL = 'N'
  }

  // 하나의 상병명에 체크가 되있을 시 해당없음 체크 해제
  diagnosisInfo.DISEASE_NO = !(diagnosisInfo.DISEASE1.YN || diagnosisInfo.DISEASE2.YN ||
    diagnosisInfo.DISEASE3.YN || diagnosisInfo.DISEASE4.WAIST.YN || diagnosisInfo.DISEASE4.NECK.YN ||
    diagnosisInfo.DISEASE5.YN)
}

// 해당 상병명이 유효한지 아닌지 확인
const checkEval = (diag) => {
  if(diag.YN) { // 상병명체크 확인
    for(let c of diag.STD) { // 직종 체크 확인
      if(c && isLessThanMonths(diag.EXPIRATION_MONTH)) {
        return true
      }
    }
  }
  return false 
}

// 셀 클릭 시 해당 데이터 조회
const onCellClicked = (grid, clickData) => {
  // 헤더나 체크박스 클릭 시 return
  if(clickData.cellType == 'check' || clickData.cellType == 'header') {
    return 
  }
  const rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  
  if(rowData.IDX === searchParams.IDX)  {
    return
  }

  searchParams.IDX = rowData.IDX
  searchParams.DISEASE_CODE = rowData.DISEASE_CODE
  searchParams.DISEASE_NM = rowData.DISEASE_NM
  searchParams.BODY1_CODE = rowData.BODY1_CODE
  searchParams.BODY1_NM = rowData.BODY1_NM
  searchParams.BODY2_CODE = rowData.BODY2_CODE
  searchParams.BODY2_NM = rowData.BODY2_NM

  searchParams.SAVE_YN = 'Y'
}

// 유효기간 계산
const calcExpiration = () => {
  if(isEmpty(searchParams.DIAGNOSIS_DATE)) {
    return ''
  }
  // 진단일
  let diagnosis = dayjs(searchParams.DIAGNOSIS_DATE)
  // 뺄 날짜 (재직 - 오늘날짜(등록날짜) | 휴/퇴직 - 휴/퇴직일)
  let diffDate = dayjs().format('YYYY-MM-DD')

  if(!isEmpty(searchParams.INSERT_DATE)) {
    diffDate = dayjs(searchParams.INSERT_DATE)
  }

  if(searchParams.HLD_OFFI_GBN !== '재직') {
    diffDate = dayjs(searchParams.RETI_DATE)
  } 
  const diffMonths = diagnosis.diff(diffDate, 'month')
  const years = Math.trunc(diffMonths / 12)
  const months = diffMonths % 12

  // 업무관련성 변경 함수
  changeCheck()

  // 결과 출력
  return `${years}년 ${months}개월`
}

// (재직자 : 진단일 - 오늘날짜 | 휴/퇴직자 : 진단일 - 휴/퇴직일 )이 정해진 유효기간보다 작은지 큰지
const isLessThanMonths = (limit) => {

  if(isEmpty(searchParams.DIAGNOSIS_DATE)) {
    return ''
  }

  // 진단일
  let diagnosis = dayjs(searchParams.DIAGNOSIS_DATE)
  // 뺄 날짜
  let diffDate = dayjs().format('YYYY-MM-DD')
  
  if(searchParams.HLD_OFFI_GBN !== '재직') {
    diffDate = dayjs(searchParams.RETI_DATE)
  } 

  return dayjs(diagnosis).diff(dayjs(diffDate), 'month') <= limit
}

// 콤보박스 변경시 직접입력이면 focus이동
const moveFocus = (selectName) => {
  if(selectName == 'APPLI_GUBUN') {
    if(searchParams.APPLI_GUBUN == '999') {
      txtAppliGubun.value.focus()
    } 
  } else if (selectName == 'HOSPITAL_CODE') {
    if(searchParams.HOSPITAL_CODE == '999') {
      txtHospital.value.focus()
    } 
  } else if (selectName == 'INCIDENT_CODE') {
    if(searchParams.INCIDENT_CODE == '999') {
      txtIncident.value.focus()
    } 
  } else if (selectName == 'BODY1_CODE') {
    if(searchParams.BODY1_CODE == '999') {
      txtBody1.value.focus()
    } 
  } else if (selectName == 'BODY2_CODE') {
    if(searchParams.BODY2_CODE == '999') {
      txtBody2.value.focus()
    }
  } else if (selectName == 'DISEASE_CODE') {
    if(searchParams.DISEASE_CODE == '999') {
      txtDisease.value.focus()
    }
  }
}

// 근속연수 계산
const calcWorkYear = () => {
  if(!isEmpty(searchParams.COM_ENT_DATE)) {
    let diffDate = dayjs().format('YYYY-MM-DD')
    if(searchParams.RETI_DATE) {
      diffDate = searchParams.RETI_DATE
    }
    let diffMonths = dayjs(diffDate).diff(searchParams.COM_ENT_DATE, 'month')
    let years = Math.trunc(diffMonths / 12) 
    let months = diffMonths % 12

    searchParams.WORK_DATE_YEARS = years
    searchParams.WORK_DATE_MONTHS = months
    searchParams.WORK_YEAR = `${years}년 ${months}개월`
  
  }
}

watch(() => [searchParams.APPLI_GUBUN
  , searchParams.HOSPITAL_CODE
  , searchParams.DISEASE_CODE
  , searchParams.BODY1_CODE
  , searchParams.BODY2_CODE
  , searchParams.INCIDENT_CODE
  , searchParams.DIAGNOSIS_DATE], (newValue, oldValue) => {
  insertName()
  // setDiagnosis()
})

watch(() => searchParams.STD_DUTY_NM, (newValue, oldValue) => {
  if(newValue) {
    if(newValue.includes('용접')) {
      stdType.value = 'A'
    } else if (newValue.includes('취부')) {
      stdType.value = 'B'
    } else if (newValue.includes('배관')) {
      stdType.value = 'C'
    } else if (newValue.includes('도장')) {
      stdType.value = 'D' 
    } else {
      stdType.value = ''
    }
  }
})

watch(() => searchParams.WORK_EVAL, (newValue, oldValue) => {
  if(newValue == 'Y' && newValue != oldValue) {
    vm.$swal({ title: t('신청인은 당사 자체 근골격계질환 작업력 평가 기준에 의거\n 신청상병과 해당 업무 사이에 상당인과관계가 있음이 확인되어\n 보험가입자의견서에 재해사실 "인정"으로 제출 예정이오니,\n 이견이 있을 경우, "불인정"선택 후 사유 기술 바랍니다. \n\n -안전보건지원부-') }).then(res=> {
      if(!isEmpty(scrollBox.value) &&  scrollUp.value) {
        scrollBox.value.scrollTop = 0
      }
    })
  }
})

// 휴/퇴직일 변경 watch
watch(() => searchParams.RETI_DATE, (newValue) => {
  // 근속연수 계산
  calcWorkYear()
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="950"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>업무상질병 신청 등록</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="t('신청자 정보')"
          :use-permission="false"
          :button-list="searchParams.ONLY_VIEW ? ['btnClose'] : ['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <div class="d-flex">
            <i-input
              v-model="searchParams.EMP_NO"
              :label="$t('사번/성명')"
              label-width="70px"
              type="text"
              maxlength="20"
              width="180px"
              readonly
              required
            />
            <i-input
              v-model="searchParams.EMP_NM"
              type="text"
              append-inner-icon="mdi-magnify"
              width="130px"
              :readonly="searchParams.SAVE_YN === 'Y'"
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
            >
              <template #append-inner>
                <v-icon 
                  icon="mdi-window-close"
                  @click="clearEmp"
                />
              </template>
            </i-input>
            <i-input
              v-model="searchParams.BIRTH_DAY"
              :label="$t('생년월일')"
              label-width="70px"
              type="date"
              width="220px"           
              :readonly="searchParams.ONLY_VIEW"
            />
            <i-input
              v-model="searchParams.HLD_OFFI_GBN"
              :label="$t('재직구분')"
              label-width="70px"
              type="text"
              width="220px"
              :readonly="true"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.BSNS_NM"
              :label="$t('사업부')"
              label-width="70px"
              type="text"
              width="250px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.DEPT_NM"
              :label="$t('부서')"
              label-width="70px"
              class="mt-2"
              type="text"
              width="220px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.GWA_NM"
              :label="$t('과')"
              label-width="70px"
              class="mt-2"
              type="text"
              width="220px"
              :readonly="searchParams.ONLY_VIEW"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.UNT_DUTY_NM"
              :label="$t('직종')"
              label-width="70px"
              type="text"
              width="250px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.COM_ENT_DATE"
              :label="$t('입사일')"
              label-width="70px"
              type="date"
              width="220px"
              :readonly="searchParams.ONLY_VIEW"
            />
            <i-input
              v-model="searchParams.RETI_DATE"
              :label="$t('휴/퇴직일')"
              label-width="70px"
              type="date"
              width="220px"
              :readonly="searchParams.ONLY_VIEW"
            />
          </div>
        </v-sheet>
      </div>
      <div ref="scrollBox" style="max-height:800px; overflow-y: auto;">
        <div class="pa-4 pt-0">
          <IGridTitle
            ref="diagnosisTitle"
            :title="t('진단 정보')"
            
          />
          <v-sheet class="searchArea flex-column mb-2">
            <div class="d-flex">
              <i-select
                v-model="searchParams.APPLI_GUBUN"
                :label="$t('신청구분')"
                label-width="70px"
                :items="codeList.APPLI_GUBUN"
                item-value="COD"
                item-title="TXT"
                width="220px"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                @update:modelValue="moveFocus('APPLI_GUBUN')"
                required
              />
              <i-input
                ref="txtAppliGubun"
                v-model="searchParams.APPLI_GUBUN_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="220px"
                maxlength="50"
                :readonly="searchParams.APPLI_GUBUN != '999' || searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
              />
              <i-select
                v-model="searchParams.HOSPITAL_CODE"
                :label="$t('진단기관')"
                label-width="70px"
                :items="codeList.HOSPITAL"
                item-value="COD"
                item-title="TXT"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                @update:modelValue="moveFocus('HOSPITAL_CODE')"
                width="220px"
                required
              />
              <i-input
                ref="txtHospital"
                v-model="searchParams.HOSPITAL_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="220px"
                maxlength="25"
                :readonly="searchParams.HOSPITAL_CODE != '999' || searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.DIAGNOSIS_DATE"
                :label="$t('진단일')"
                label-width="70px"
                type="date"
                width="220px"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                required
              />
              <i-input
                v-model="searchParams.APPLI_DATE"
                :label="$t('진정일')"
                label-width="70px"
                type="date"
                width="220px"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                required
              />
              <i-input
                v-model="searchParams.CMPNY_RCPT_DATE"
                :label="$t('회사접수일')"
                label-width="70px"
                type="date"
                width="220px"
                :readonly="searchParams.ONLY_VIEW"
              />
              <i-input
                v-model="searchParams.IND_MANAGE"
                :label="$t('공단담당자')"
                label-width="70px"
                type="text"
                width="220px"
                maxlength="20"
              />
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="searchParams.INCIDENT_CODE"
                :label="$t('발생경위')"
                label-width="70px"
                :items="codeList.INCIDENT"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="moveFocus('INCIDENT_CODE')"
                width="220px"
                :readonly="searchParams.ONLY_VIEW"
              />
              <i-input
                ref="txtIncident"
                v-model="searchParams.INCIDENT_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="700px"
                maxlength="500"
                :readonly="searchParams.INCIDENT_CODE != '999' || searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
              />
            </div>
          </v-sheet>
        </div>
        <v-sheet class="pa-4 pt-0 h-auto">
          <IUpload
            ref="fileUpload"
            :max-file-size="300"
            :button-list="searchParams.ONLY_VIEW ? [] : fileUploadButton"
            auto-upload
            :gridTitle="t('사실 통지서')"
            :is-visibled="!isEmpty(searchParams.EMP_NO)"
            style="height: 200px"
            :isCmpnyDiv="false"
          />
        </v-sheet>
        <div> 
          <IGridTitle
            ref="menuTitle"
            :title="t('상병 내역')"
            class="pa-4 pt-0 pb-0"
            :button-list="searchParams.ONLY_VIEW ? [] : ['btnCreate','btnDelete']"
            @click-button="onButtonsClick"
          /> 
          <v-sheet class="searchArea flex-column pa-2 ml-4 mr-4">
            <div class="d-flex">
              <i-select
                v-model="searchParams.BODY1_CODE"
                :label="$t('신체부위1')"
                label-width="70px"
                :items="codeList.BODY1"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="moveFocus('BODY1_CODE')" 
                width="220px"
                required
                :readonly="searchParams.ONLY_VIEW"
              />
              <i-input
                ref="txtBody1"
                v-model="searchParams.BODY1_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="220px"
                maxlength="20"
                :readonly="searchParams.BODY1_CODE != '999' || searchParams.ONLY_VIEW"
              />
              <i-select
                v-model="searchParams.BODY2_CODE"
                :label="$t('신체부위2')"
                label-width="70px"
                :items="codeList.BODY2"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="moveFocus('BODY2_CODE')"
                width="220px"
                required
                :readonly="searchParams.ONLY_VIEW"
              />
              <i-input
                ref="txtBody2"
                v-model="searchParams.BODY2_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="220px"
                maxlength="20"
                :readonly="searchParams.BODY2_CODE != '999' || searchParams.ONLY_VIEW"
              />
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="searchParams.DISEASE_CODE"
                :label="$t('상병명')"
                label-width="70px"
                :items="codeList.DISEASE"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="moveFocus('DISEASE_CODE')"
                width="220px"
                required
                :readonly="searchParams.ONLY_VIEW"
              />
              <i-input
                ref="txtDisease"
                v-model="searchParams.DISEASE_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="700px"
                maxlength="20"
                :readonly="searchParams.DISEASE_CODE != 'J99' || searchParams.ONLY_VIEW"
              />
            </div>
          </v-sheet>
          <v-card-text class="content-area pt-0 pb-0 pl-4 pr-4" style="height:250px;">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 200px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellClicked="onCellClicked"
              />
            </v-sheet>
          </v-card-text>
        </div>
        <v-sheet class="pa-4 pt-0 h-auto">
          <IGridTitle
            ref="menuTitle"
            :title="t('작업력 평가')"
          /> 
          <div class="h-auto table_area">
            <table class="w-100">
              <tbody>
                <tr>
                  <th rowspan=3 >상병명</th>
                  <th rowspan=2>회전근개 파열</th>
                  <th rowspan=2>외상과염</th>
                  <th rowspan=2>반월상연골파열</th>
                  <th colspan=2>추간판탈출증</th>  
                  <th rowspan=2>수근관증후군</th>
                  <th rowspan=2>해당없음</th>
                </tr>
                <tr>
                  <th>요추</th>
                  <th>경추</th>
                </tr>
                <tr>
                  <td><v-checkbox class="d-flex justify-center align-center" @click="clickCheck()" @change="changeCheck()" v-model="diagnosisInfo.DISEASE1.YN" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></td>
                  <td><v-checkbox class="d-flex justify-center align-center" @click="clickCheck()" @change="changeCheck()" v-model="diagnosisInfo.DISEASE2.YN" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></td>
                  <td><v-checkbox class="d-flex justify-center align-center" @click="clickCheck()" @change="changeCheck()" v-model="diagnosisInfo.DISEASE3.YN" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></td>
                  <td><v-checkbox class="d-flex justify-center align-center" @click="clickCheck()" @change="changeCheck()" v-model="diagnosisInfo.DISEASE4.WAIST.YN" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></td>
                  <td><v-checkbox class="d-flex justify-center align-center" @click="clickCheck()" @change="changeCheck()" v-model="diagnosisInfo.DISEASE4.NECK.YN" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></td>
                  <td><v-checkbox class="d-flex justify-center align-center" @click="clickCheck()" @change="changeCheck()" v-model="diagnosisInfo.DISEASE5.YN" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></td>
                  <td><v-checkbox class="d-flex justify-center align-center" @click="clickCheck()" @change="initDiagnosis()" v-model="diagnosisInfo.DISEASE_NO" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></td>
                </tr>
                <tr>
                  <th>진단일</th>
                  <td colspan=7>{{ searchParams.DIAGNOSIS_DATE }}</td>
                </tr>
                <tr>
                  <th rowspan=4>직종</th>
                  <td><div class="d-flex justify-center align-center ">용접<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE1.STD.0')" v-model="diagnosisInfo.DISEASE1.STD[0]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">용접<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE2.STD.0')" v-model="diagnosisInfo.DISEASE2.STD[0]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">용접<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE3.STD.0')" v-model="diagnosisInfo.DISEASE3.STD[0]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">용접<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE4_WAIST.STD.0')" v-model="diagnosisInfo.DISEASE4.WAIST.STD[0]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">용접<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE4_NECK.STD.0')" v-model="diagnosisInfo.DISEASE4.NECK.STD[0]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">용접<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE5.STD.0')" v-model="diagnosisInfo.DISEASE5.STD[0]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td>-</td>
                </tr>
                <tr>
                  <td><div class="d-flex justify-center align-center ">취부<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE1.STD.1')" v-model="diagnosisInfo.DISEASE1.STD[1]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">취부<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE2.STD.1')" v-model="diagnosisInfo.DISEASE2.STD[1]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td>-</td>
                  <td>-</td>
                  <td><div class="d-flex justify-center align-center ">취부<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE4_NECK.STD.1')" v-model="diagnosisInfo.DISEASE4.NECK.STD[1]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td><div class="d-flex justify-center align-center ">배관<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE1.STD.2')" v-model="diagnosisInfo.DISEASE1.STD[2]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">배관<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE2.STD.2')" v-model="diagnosisInfo.DISEASE2.STD[2]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td>-</td>
                  <td><div class="d-flex justify-center align-center ">배관<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE4_WAIST.STD.2')" v-model="diagnosisInfo.DISEASE4.WAIST.STD[2]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">배관<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE4_NECK.STD.2')" v-model="diagnosisInfo.DISEASE4.NECK.STD[2]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td><div class="d-flex justify-center align-center ">도장<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE1.STD.3')" v-model="diagnosisInfo.DISEASE1.STD[3]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td><div class="d-flex justify-center align-center ">도장<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE2.STD.3')" v-model="diagnosisInfo.DISEASE2.STD[3]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td><div class="d-flex justify-center align-center ">도장<v-checkbox class="ml-4" @click="clickCheck()" @change="changeStdCheck($event, 'DISEASE5.STD.3')" v-model="diagnosisInfo.DISEASE5.STD[3]" :true-value="true" :false-value="false" :disabled="searchParams.ONLY_VIEW"/></div></td>
                  <td>-</td>
                </tr>
                <tr>
                  <th>근속연수</th>
                  <td colspan=6>{{ searchParams.WORK_YEAR }}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <th rowspan=3>유효기간</th>
                  <th colspan=6>개별상병명 당 유효기간 기준</th>
                  <td>-</td>
                </tr>
                <tr>
                  <td>12개월</td>
                  <td>2개월</td>
                  <td>12개월</td>
                  <td>12개월</td> 
                  <td>12개월</td>
                  <td>6개월</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td> {{ (!isEmpty(searchParams.DIAGNOSIS_DATE) && diagnosisInfo.DISEASE1.YN) ? calcExpiration() : '' }}</td>
                  <td> {{ (!isEmpty(searchParams.DIAGNOSIS_DATE) && diagnosisInfo.DISEASE2.YN) ? calcExpiration() : '' }}</td>
                  <td> {{ (!isEmpty(searchParams.DIAGNOSIS_DATE) && diagnosisInfo.DISEASE3.YN) ? calcExpiration() : '' }}</td>
                  <td> {{ (!isEmpty(searchParams.DIAGNOSIS_DATE) && diagnosisInfo.DISEASE4.WAIST.YN) ? calcExpiration() : '' }}</td>
                  <td> {{ (!isEmpty(searchParams.DIAGNOSIS_DATE) && diagnosisInfo.DISEASE4.NECK.YN) ? calcExpiration() : '' }}</td>
                  <td> {{ (!isEmpty(searchParams.DIAGNOSIS_DATE) && diagnosisInfo.DISEASE5.YN) ? calcExpiration() : '' }}</td>
                  <td>-</td> 
                </tr>
                <tr>
                  <th >업무관련성</th>
                  <td> {{ diagnosisInfo.DISEASE1.EVAL ? '해당': '미해당' }} </td>
                  <td> {{ diagnosisInfo.DISEASE2.EVAL ? '해당': '미해당' }}</td>
                  <td> {{ diagnosisInfo.DISEASE3.EVAL ? '해당': '미해당' }}</td>
                  <td> {{ diagnosisInfo.DISEASE4.WAIST.EVAL ? '해당': '미해당' }}</td>
                  <td> {{ diagnosisInfo.DISEASE4.NECK.EVAL ? '해당': '미해당' }}</td>
                  <td> {{ diagnosisInfo.DISEASE5.EVAL ? '해당': '미해당' }}</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-sheet>
      </div>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
  </v-dialog>
</template>

<style scoped lang="scss">
th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
}

.no-click {
  pointer-events: none;
}
</style>
