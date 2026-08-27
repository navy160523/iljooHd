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
import ILabel from "@/components/ILabel.vue"
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SafeRuleGbnPopup from '@/components/popup/SafeRuleGbnPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import SAFDC0010BikeNoPopup from './SAFDC0010BikeNoPopup.vue'
import SAFDC0010CarNoPopup from './SAFDC0010CarNoPopup.vue'
import SAFDC0010VioCntPopup from './SAFDC0010VioCntPopup.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import SAFDC0010_01PopupTab02Popup01 from './SAFDC0010_01PopupTab02Popup01.vue'

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const userLogStore = useLogsStore()
const dialog = ref(false)
const grdMain = ref(null)
const t = useI18n().t
const bikeNoPopup = ref(null)
const carNoPopup = ref(null)
const menuTitle = ref(null)
const trafficEmpPopup = ref(null)         // 교통수칙위반 위반자 성명
const vioSearch = ref(null)               // 교통수칙위반 위반항목 조회 팝업
const asgnPopup = ref(null)               // 교통수칙위반 소속조직
const yearVioPopup = ref(null)            // 교통수칙위반 년누적위반
const trafficeCrandEmpNm = ref(null)      // 교통수칙위반 단속자
const trafficFileUpload = ref(null)
const approvalReadOnly = ref(true)        // 승인신청 disabled
const approvalCancleReadOnly = ref(true)  // 승인취소 disabled
const appEmail = ref('')
const safetyActionFileUpload = ref(null)  // 조치사항 파일첨부
const fileBtnVisible = ref('')

const emit = defineEmits(['closed'])
//교통수칙위반등록 관련 로직 시작
//교통위반등록 버튼 이벤트
const onButtonsClick2 = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeTrafficSave)
      .setQuery(saveTrafficData)
      .setAfter(afterTrafficSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setQuery(deleteTrafficData)
      .setAfter(afterDelete)
      .run()
  }
}

const deleteTrafficData = () => {
  let deleteParam = []
  let deleteData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    VIO_NO: trafficField.VIO_NO,
    USER_ID: userStore.userId,
  }
  deleteParam.push(deleteData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE04',
    list: deleteParam,
  })
}

const afterDelete = () => {
  closePopup()
}

//안전수칙위반 삭제관련 로직 끝
//교통수칙위반 변수선언
const trafficField = reactive({
  VIO_DIV: 'A',         // 차량구분
  CAR_NO: '',           // 차량번호
  VIO_NO: '',           // 위반번호
  BIKE_REG_NO: '',      // 등록번호
  VIO_CMPNY_DIV: '',    // 위반자 회사코드
  VIOLATOR: '',         // 위반자성명
  VIO_EMP_NO: '',       // 위반자사번
  ASGN_NM: '',          // 소속소직
  ASGN_CD: '',          // 위반자 소속조직코드
  DEPT_CD: '',          // 위반자 부서코드
  BSNS_CD: '',          // 위반자 사업부코드
  VEND_CD: '',          // 업체코드
  VEND_NAME: '',        // 업체상세
  TEL_NO: '',           // 사내전화
  HP_NO: '',            // 핸드폰번호
  IO_DIV: 'Z',          // 소속구분 ->A:직영,B:협력사,C:상주협력사,D:단기공사,Z:기타
  VIOCNT: '',           // 년 누적위반
  REG_NO_YN: 'N',       // 등록번호 불일치
  REG_YN: 'N',          // 등록증 미부착
  VIO_TIME: '',         // 위반일시
  VIO_TIME1: '',        // 위반시각
  HVIO_YN: 'N',         // 절대수칙위반
  VIO_LPLC: 'C',        // 위반장소(대)
  VIO_MPLC: 'A',        // 위반장소(중)
  VIO_SPLC: '',         // 위반장소(소)
  VIO_PLC_DESC: '',     // 위반장소상세
  VIO_ITEM_NM: '',      // 위반항목
  VIO_ITEM1: '',        // 위반항목1
  VIO_ITEM2: '',        // 위반항목2
  VIO_ITEM3: '',        // 위반항목3
  SPEED: '',            // 주행속도
  VIO_DESC: '',         // 위반내용상세추가
  CRADN_EMP_NM: userStore.empNm, // 단속자
  CRADN_EMP_NO: userStore.empNo, // 단속자사번
  FILE_ID1: '',         // 위반사항 파일첨부아이디
  FILE_ID2: '',         // 조치사항 파일첨부아이디
  COMPANY: '',          // 위반자사업부코드
  APP_EMP_NO: '',       // 승인자사번
  DIV: 'B',             // 위반 구분 (A: 수칙위반, B: 교통위반)
  CFM_DT: '',           // 확정일
  CFM_ID: '',           // 확정자
})

//readonly값들
const readOnlyValue = reactive({
  CAR_NO: false, //차량번호
  RESIST_NO: false, //등록번호
  ICON: true, //등록번호 아이콘readonly
  CAR_NO_ICON: 'mdi-magnify', //v-bind로 아이콘 변경시킴 - 차량번호 아이콘
  RESIST_NO_ICON: 'mdi-check', //v-bind로 아이콘 변경시킴 - 등록번호 아이콘
})

const traffiCodeList = reactive({
  IO_DIV: [], //소속구분
  VIO_SPLC: [], //위반장소
  APP_EMP_NO: [], //승인자목록
})

//교통수칙위반등록 변수선언 끝

const initTrafficCodeList = () => {
  let locationParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    VIO_LPLC: trafficField.VIO_LPLC,
    VIO_MPLC: trafficField.VIO_MPLC,
  }
  Promise.all([
    getCodeList('HHIZ020'),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_12',
      param: locationParam,
    }),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_04',
      param: {
        // CMPNY_DIV: 'HHI', 
        // 일렉일 경우 승인자가 나오지 않아서, 사용자의 회사구분 코드를 넘김.
        CMPNY_DIV: userStore.cmpnyDiv,         
        DANSOK_EMP_NO: trafficField.CRADN_EMP_NO,
      },
    }),
  ]).then((res) => {
    traffiCodeList.IO_DIV = res[0].ORESULT_CUR
    traffiCodeList.VIO_SPLC = res[1].ORESULT_CUR
    traffiCodeList.APP_EMP_NO = res[2].ORESULT_CUR
  })
  let date = dayjs()

  trafficField.VIO_TIME = dayjs().format('YYYY-MM-DD')//위반일시에 오늘날짜
  trafficField.VIO_TIME1 =  dayjs().format('HH:mm') //위반일시 옆 시간에 자정
}

//교통위반항목 저장관련 로직 시작
const beforeTrafficSave = () => {
  // A:오토바이, C:차량, B:자전거, D:보행자, Z:기타
  //오토바이또는 차량을 선택하고 차량번호를 입력하지 않았을경우
  if (trafficField.VIO_DIV === 'A' || trafficField.VIO_DIV === 'C') {
    if (!trafficField.CAR_NO) {
      Message.warn(t('차량번호를 입력하세요!'))
      return false
    }
  }
  //오토바이를 선택하고 등록번호를 입력하지 않았을경우
  if (trafficField.VIO_DIV === 'A') {
    if (!trafficField.BIKE_REG_NO) {
      Message.warn(t('등록번호를 입력하세요!'))
      return false
    }
  }

  if (!trafficField.VIOLATOR) {
    Message.warn(t('위반자성명을 입력하세요!'))
    return false
  }
  if (!trafficField.ASGN_NM) {
    Message.warn(t('소속조직을 입력하세요!'))
    return false
  }
  if (!trafficField.VIO_TIME || !trafficField.VIO_TIME1) {
    Message.warn(t('위반일시를 입력하세요!'))
    return false
  }
  if (!trafficField.VIO_SPLC) {
    Message.warn(t('위반장소를 입력하세요!'))
    return false
  }
  if (!trafficField.VIO_ITEM_NM) {
    Message.warn(t('위반항목을 입력하세요!'))
    return false
  }
  if (!trafficField.CRADN_EMP_NM) {
    Message.warn(t('단속자를 입력하세요!'))
    return false
  }
  if (!trafficField.APP_EMP_NO) {
    Message.warn(t('승인자를 입력하세요!'))
    return false
  }

  return true
}

const saveTrafficData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv, //단속자 회사코드
    VIO_NO: trafficField.VIO_NO, //위반번호
    VIO_DIV: trafficField.VIO_DIV, //위반구분
    BSNS_CD: trafficField.BSNS_CD, //위반자 사업본부
    DEPT_CD: trafficField.DEPT_CD, //위반자 부서코드
    ASGN_CD: trafficField.ASGN_CD, //위반자 조직코드
    VIO_EMP_NO: trafficField.VIO_EMP_NO, //위반자 사번
    VIOLATOR: trafficField.VIOLATOR, //위반자
    TEL_NO: trafficField.TEL_NO, //위반자 사내연락처
    HP_NO: trafficField.HP_NO, //위반자 휴대폰번호
    IO_DIV: trafficField.IO_DIV, //직영,협력사 구분
    VIO_TIME: trafficField.VIO_TIME, //위반일
    VIO_TIME1: trafficField.VIO_TIME1, //위반시각
    VIO_LPLC: trafficField.VIO_LPLC, //위반장소(대)`
    VIO_MPLC: trafficField.VIO_MPLC, //위반장소(중)
    VIO_SPLC: trafficField.VIO_SPLC, //위반장소(소)
    VIO_PLC_DESC: trafficField.VIO_PLC_DESC, //위반장소상세
    VIO_ITEM1: trafficField.VIO_ITEM1, //위반항목1
    VIO_ITEM2: trafficField.VIO_ITEM2, //위반항목2
    VIO_ITEM3: trafficField.VIO_ITEM3, //위반항목3
    SPEED: trafficField.SPEED, //주행속도
    VIO_DESC: trafficField.VIO_DESC, //위반상세
    BIKE_REG_NO: trafficField.BIKE_REG_NO, //오토바이 등록번호
    CAR_NO: trafficField.CAR_NO, //차량번호
    VEND_CD: trafficField.VEND_CD, //업체코드
    VEND_NAME: trafficField.VEND_NAME, //업체명
    CRADN_EMP_NO: trafficField.CRADN_EMP_NO, //단속자 사번
    HVIO_YN: trafficField.HVIO_YN, //중대위반유무
    REG_YN: trafficField.REG_YN, //등록증 미부착
    REG_NO_YN: trafficField.REG_NO_YN, //등록번호불일치
    FILE_ID1: trafficField.FILE_ID1, //위반사항 파일아이디
    USER_ID: userStore.userId, //로그인유저아이디
    SAVE_YN: !trafficField.VIO_NO ? 'N' : 'Y',
    COMPANY: !trafficField.COMPANY ? 'HHI' : trafficField.COMPANY,
    APP_EMP_NO: trafficField.APP_EMP_NO,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE05',
    list: saveParam,
  }).then((res) => {
    console.log('교통 저장 :: ', res)
  })
}

const afterTrafficSave = () => {
  mailSet()
  closePopup()
}
//교통위반항목 저장관련 로직 끝


const mailSet = async () => {
  dialog.value = false
  /* ******************** 메일 SET ******************* */
  const mailParams = reactive({
    EMAIL: [],
    SUBJECT: '[HiSEs]교통수칙위반등록 승인 요청 메일',
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

          `위반일시: ${trafficField.VIO_TIME} ${trafficField.VIO_TIME1} <br />` +
          `위반자: ${trafficField.VIOLATOR} <br />` +
          `단속자성명: ${trafficField.CRADN_EMP_NM} <br />` +
          `내용: ${trafficField.VIO_DESC} <br />` +
          `
        </body>
      </html>`
      
  mailParams.EMAIL = [appEmail.value]
  commonSendApi(mailParams).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  })
}

const openPopup = () => {
  initTrafficCodeList()
  trafficField.CRADN_EMP_NM = userStore.empNm
  trafficField.CRADN_EMP_NO = userStore.empNo
  
  dialog.value = true
  setTimeout(() => {
    menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
    menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화
  }, 500)

  approvalReadOnly.value = true //승인신청 비활성화
  approvalCancleReadOnly.value = true //승인신청취소 비활성화
  fileBtnVisible.value = false  // 조치사항 파일 첨부 버튼 비활성화
}

const openPopup2 = (rowData) => {
  console.log(rowData)
  initTrafficCodeList()
  commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_15',
    param: { CMPNY_DIV: rowData.CMPNY_DIV, VIO_NO: rowData.VIO_NO },
  }).then((res) => {
    console.log('교통수칙위반 데이터', res)
    for (const [key, value] of Object.entries(res.ORESULT_CUR[0])) {
      if (key === 'VIO_ITEM1_NM' && value) {
        trafficField.VIO_ITEM_NM += value + ','
      }
      if (key === 'VIO_ITEM2_NM' && value) {
        trafficField.VIO_ITEM_NM += value + ','
      }
      if (key === 'VIO_ITEM3_NM' && value) {
        trafficField.VIO_ITEM_NM += value + ','
      }
      if (trafficField.hasOwnProperty(key)) {
        trafficField[key] = value
      }
    }

    //단속자와 로그인 유저가 일치하면 삭제버튼 활성화
    if (userStore.empNo === trafficField.CRADN_EMP_NO) {
      setTimeout(() => {
        menuTitle.value.disableBtn('btnDelete', false) //삭제버튼 활성화
        menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 비활성화
        approvalReadOnly.value = false //승인신청 활성화
        if(rowData.STATUS == '승인대기') {
          approvalReadOnly.value = true //승인신청 비활성화
          approvalCancleReadOnly.value = false //승인취소 활성화
          //menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화 ( 2024.10.10 엄정준책임 요청 : 승인대기 상태 데이터 삭제 요청)
          
          menuTitle.value.disableBtn('btnUpdate', true) //저장버튼 비활성화
        } else if(rowData.STATUS == '승인') {
          approvalReadOnly.value = true //승인신청 비활성화
          approvalCancleReadOnly.value = false //승인취소 활성화
          menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
          menuTitle.value.disableBtn('btnUpdate', true) //저장버튼 비활성화
        }
      }, 500)
    } else {
      setTimeout(() => {
        if(userStore.empNo === rowData.INSERT_USER_ID){
          approvalReadOnly.value = true //승인신청 비활성화
          approvalCancleReadOnly.value = false //승인취소 활성화
          //menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화 ( 2024.10.10 엄정준책임 요청 : 승인대기 상태 데이터 삭제 요청)
          
          menuTitle.value.disableBtn('btnUpdate', true) //저장버튼 비활성화
        }else{
          menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
          menuTitle.value.disableBtn('btnUpdate', true) //저장버튼 비활성화
          approvalReadOnly.value = true //승인신청 비활성화
          approvalCancleReadOnly.value = true //승인신청취소 비활성화
        }
      }, 500)
    }

    if (trafficField.CFM_DT){
      fileBtnVisible.value = true
    }else{
      fileBtnVisible.value = false
    }
  })
  
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
  //팝업 닫을때 팝업데이터 초기화
  for (let i in trafficField) {
    trafficField[i] = ''
  }
  menuTitle.value.disableBtn('btnDelete', false) //삭제버튼 활성화
  emit('closed')
}

//차량번호 조회 팝업
const openCarPopup = async () => {
  if (!trafficField.CAR_NO) {
    let result = await vm.$swal({
      title: t(
        '차량번호를 입력하지 않고 조회시 조회시간이 오래 소요될수 있습니다.\n' +
          '계속 진행하시겠습니까?'
      ),
      showCancelButton: true,
    })
    if (!result.isConfirmed) {
      return false
    }

    //오토바이일때
    if (trafficField.VIO_DIV === 'A') {
      bikeNoPopup.value.openPopup()
    }
    //차량일때
    else if (trafficField.VIO_DIV === 'C') {
      carNoPopup.value.openPopup()
    }
  } else {
    //오토바이일때
    if (trafficField.VIO_DIV === 'A') {
      bikeNoPopup.value.openPopup(trafficField.CAR_NO)
    }
    //차량일때
    else if (trafficField.VIO_DIV === 'C') {
      carNoPopup.value.openPopup()
    }
  }
}

//오토바이 선택팝업 이벤트
const bikeNoSelected = (val) => {
  trafficField.CAR_NO = val.BIKE_NO
  trafficField.BIKE_REG_NO = val.BIKE_REG_NO
  trafficField.VIOLATOR = val.EMP_NM
  trafficField.VIO_EMP_NO = val.EMP_NO
  trafficField.ASGN_NM = val.ASGN_NM
  trafficField.TEL_NO = val.TEL_NO
  trafficField.HP_NO = val.HP_NO
  trafficField.COMPANY = val.CMPNY_DIV
  trafficField.BSNS_CD = val.BSNS_CD
  trafficField.DEPT_CD = val.DEPT_CD
  trafficField.ASGN_CD = val.ASGN_CD
}
//차량번호 선택팝업 이벤트
const carNoSelected = (val) => {
  trafficField.CAR_NO = val.CAR_NO //차량번호
  trafficField.VIOLATOR = val.EMP_NM //위반자 성명
  trafficField.HP_NO = val.HP_NO //위반자 휴대폰 번호
  //차량번호팝업 데이터가 정상적인 데이터가 없어서 CMPNY_DIV가 null이 나오는게 많음 만약 null이면 'HHI'를 넣고 나중에 정상적인 데이터가 추가되면 3항연산자는 제거해도 될듯 2024.05.10 김현재 작성
  trafficField.COMPANY = val.CMPNY_DIV === null ? 'HHI' : val.CMPNY_DIV //위반자회사
}

//등록번호 아이콘 선택 이벤트
const checkResistCarNo = () => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BIKE_REG_NO: trafficField.BIKE_REG_NO,
  }
  commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_09',
    param: param,
  }).then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      trafficField.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD //위반자 소속코드
      trafficField.ASGN_NM = res.ORESULT_CUR[0].ASGN_NM //위반자 소속명
      trafficField.BIKE_NO = res.ORESULT_CUR[0].BIKE_NO //위반자 차량번호
      trafficField.BIKE_REG_NO = res.ORESULT_CUR[0].BIKE_REG_NO //위반자 등록번호
      trafficField.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD //위반자 사업부코드
      trafficField.VIO_CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV //위반자 회사코드
      trafficField.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD //위반자 부서코드
      trafficField.VIOLATOR = res.ORESULT_CUR[0].EMP_NM //위반자 성명
      trafficField.VIO_EMP_NO = res.ORESULT_CUR[0].EMP_NO //위반자 사번
      trafficField.HP_NO = res.ORESULT_CUR[0].HP_NO //위반자 전화번호
      trafficField.IO_DIV = res.ORESULT_CUR[0].IO_DIV //위반자 소속구분
      trafficField.TEL_NO = res.ORESULT_CUR[0].TEL_NO //위반자 사내전화
      Message.success(t('등록번호 조회 완료'))
    } else {
      Message.warn(t('등록되지 않은 번호입니다!'))
      return false
    }
  })
}

//위반자성명 클릭 이벤트
const openVioEmpPopup = () => {
  trafficEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    EMP_NM: trafficField.VIOLATOR,
    readonly: true,
  })
}

//위반자성명 선택이벤트
const selectedVioEmpPopup = (val) => {
  trafficField.VIOLATOR = val.EMP_NM
  trafficField.VIO_EMP_NO = val.EMP_NO
  trafficField.ASGN_NM = val.ASGN_NM
  trafficField.VEND_CD = val.COMP_CD
  trafficField.TEL_NO = val.TEL_NO
  trafficField.HP_NO = val.HND_PHN
  trafficField.BSNS_CD = val.BSNS_CD
  trafficField.DEPT_CD = val.DEPT_CD
  trafficField.ASGN_CD = val.ASGN_CD
  if (val.USER_DIV === '0' || val.USER_DIV === 'P') {
    //USER_DIV가 0또는 P일 경우 'Z로 저장한다. (기타)
    trafficField.IO_DIV = 'Z'
  } else {
    trafficField.IO_DIV = val.USER_DIV
  }
  //최근1년간 위반횟수 조회
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NO: trafficField.VIO_EMP_NO,
  }
  commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_10',
    param: param,
  }).then((res) => {
    trafficField.VIOCNT = res.ORESULT_CUR[0].VIOCNT
  })
}

//위반자 소속조직 클릭 이벤트
const openVioDeptPopup = () => {
  //위반자 소속 회사구분 변경가능하게 요청 엄정준책임
  asgnPopup.value.openPopup({
    CMP_DISABLE: false,
  }
  )
  

}

//위반자 소속조직 선택 이벤트
const selectedVioDeptPopup = (val) => {
  trafficField.ASGN_NM = val.ASGN_FULL_NM
  trafficField.ASGN_CD = val.ASGN_CD
  trafficField.BSNS_CD = val.BSNS_CD
  trafficField.DEPT_CD = val.DEPT_CD
}

//년 누적위반 클릭 이벤트
const openVioCntPopup = () => {
  if (trafficField.VIO_CNT === 0) {
    return false
  }
  yearVioPopup.value.openPopup(trafficField.VIO_EMP_NO)
}

//교통수칙위반등록 단속자 클릭 이벤트
const openTrafficVioEmpPopup = () => {
  trafficeCrandEmpNm.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    EMP_NM: trafficField.CRADN_EMP_NM,
  })
}

//교통수칙위반등록 단속자 선택 이벤트
const selectedTrafficVioEmp = (val) => {
  trafficField.CRADN_EMP_NM = val.EMP_NM
  trafficField.CRADN_EMP_NO = val.EMP_NO
  trafficField.CMPNY_DIV = val.CMPNY_DIV
}

//교통수칙위반등록 위반사항 파일첨부 버튼 클릭 이벤트
const trafficOpenFileUpload = () => {
  if (trafficField.FILE_ID1) {
    trafficFileUpload.value.openPopup(trafficField.FILE_ID1)
  } else {
    trafficFileUpload.value.openPopup()
  }
}

const trafficFileUploded = (fileId) => {
  if (!trafficField.FILE_ID1) {
    trafficField.FILE_ID1 = fileId.fileId
  }
}

//조치사항 파일첨부 클릭 이벤트
const violoationActionFileUpload = () => {
  if (trafficField.FILE_ID2) {
    safetyActionFileUpload.value.setGuid(trafficField.FILE_ID2)
    trafficField.FILE_ID2 = safetyActionFileUpload.value.guid
    safetyActionFileUpload.value.openPopup(trafficField.FILE_ID2)
  } else {
    safetyActionFileUpload.value.setGuid()
    trafficField.FILE_ID2 = safetyActionFileUpload.value.guid
    safetyActionFileUpload.value.openPopup(trafficField.FILE_ID2)
    //처음 등록할때 파일업로드 하지않고 저장했다가 나중에 파일업로드 할때(승인상태에 따라서 수정이 안되는 경우가 있는데 값은 수정못해도 파일은 업로드 할수있게 하기 위해)
    if (trafficField.VIO_NO) {
      let paramData = []
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        VIO_NO: trafficField.VIO_NO,
        COMPANY: trafficField.COMPANY,
        FILE_ID2: trafficField.FILE_ID2,
        DIV:  trafficField.DIV,
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


//위반항목조회 버튼 클릭 이벤트
const vioListSearch = () => {
  vioSearch.value.openPopup()
}

//위반항목 선택 이벤트
const selectedTrafficVio = (val) => {
  //항목관련 변수 초기화
  trafficField.VIO_ITEM_NM = ''
  trafficField.VIO_ITEM1 = ''
  trafficField.VIO_ITEM2 = ''
  trafficField.VIO_ITEM3 = ''
  let flag = false
  for (let i = 0; i < val.length; i++) {
    //마지막일때는 ,안붙임
    if (i === val.length - 1) {
      trafficField.VIO_ITEM_NM += val[i].CODE_SHORTNM
    } else {
      trafficField.VIO_ITEM_NM += val[i].CODE_SHORTNM + ','
    }

    if (val[i].CODE_DESC2 === 'Y')
      flag = true
  }

  if (flag){
    trafficField.HVIO_YN = 'Y'
  } else {
    trafficField.HVIO_YN = 'N'
  }
    
  //1개를 체크했을경우
  if (val.length === 1) {
    trafficField.VIO_ITEM1 = val[0].SYS_CD
  }
  //2개를 체크했을경우
  else if (val.length === 2) {
    trafficField.VIO_ITEM1 = val[0].SYS_CD
    trafficField.VIO_ITEM2 = val[1].SYS_CD
  }
  //3개를 체크했을경우
  else {
    trafficField.VIO_ITEM1 = val[0].SYS_CD
    trafficField.VIO_ITEM2 = val[1].SYS_CD
    trafficField.VIO_ITEM3 = val[2].SYS_CD
  }
}

//교통수칙위반등록 관련 로직 끝

//잠재사고유형 팝업 오픈 이벤트
const openSagoDivPopup = () => {
  sagoDivPopup.value.openPopup('잠재사고')
}

//점검 대상물 팝업 오픈 이벤트
const openCheckTargetPopup = () => {
  checkTargetPopup.value.openPopup('점검대상물')
}

// 라디오그룹 변경 시 차량번호, 등록번호 초기화
const changeVioDiv = () => {
  trafficField.CAR_NO = ''
  trafficField.BIKE_REG_NO = ''
}

const afterCancelApproval = () => {
  closePopup()
}

//교통수칙위반등록 - 오토바이 ~ 기타 라디오그룹 감지 자전거,보행자,기타 입력시 차량번호,등록번호 비활성화
watch(
  () => trafficField.VIO_DIV,
  (newValue, oldValue) => {
    //오토바이일때
    if (newValue === 'A') {
      readOnlyValue.CAR_NO = false
      readOnlyValue.RESIST_NO = false
      readOnlyValue.ICON = true
      readOnlyValue.CAR_NO_ICON = 'mdi-magnify'
      readOnlyValue.RESIST_NO_ICON = 'mdi-check'
    }
    //차량일때
    else if (newValue === 'C') {
      readOnlyValue.CAR_NO = false
      readOnlyValue.RESIST_NO = true
      readOnlyValue.ICON = false
      readOnlyValue.CAR_NO_ICON = 'mdi-magnify'
      readOnlyValue.RESIST_NO_ICON = ''
    }
    //자전거,보행자일때
    else if (newValue === 'B' || newValue === 'D') {
      readOnlyValue.CAR_NO = true
      readOnlyValue.RESIST_NO = true
      readOnlyValue.ICON = false
      readOnlyValue.CAR_NO_ICON = ''
      readOnlyValue.RESIST_NO_ICON = ''
    }
    //기타일때
    else {
      readOnlyValue.CAR_NO = false
      readOnlyValue.RESIST_NO = true
      readOnlyValue.ICON = false
      readOnlyValue.CAR_NO_ICON = ''
      readOnlyValue.RESIST_NO_ICON = ''
    }
  }
)

//교통수칙위반등록 위치(본공장, 해양 등)
watch(
  () => trafficField.VIO_LPLC,
  async (newValue, oldValue) => {
    let locationParam = {
      CMPNY_DIV: userStore.cmpnyDiv,
      VIO_LPLC: newValue,
      VIO_MPLC: trafficField.VIO_MPLC,
    }
    await commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_12',
      param: locationParam,
    }).then((res) => {
      traffiCodeList.VIO_SPLC = res.ORESULT_CUR
    })
  }
)
//교통수칙위반등록 위치(본공장, 해양 등)
watch(
  () => trafficField.VIO_LPLC,
  async (newValue, oldValue) => {
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      VIO_LPLC: newValue,
      VIO_MPLC: trafficField.VIO_MPLC,
    }
    await commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_12',
      param: param,
    }).then((res) => {
      traffiCodeList.VIO_SPLC = res.ORESULT_CUR
    })
  }
)
//교통수칙위반등록 위치(본공장, 해양 등)
watch(
  () => trafficField.VIO_MPLC,
  async (newValue, oldValue) => {
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      VIO_LPLC: trafficField.VIO_LPLC,
      VIO_MPLC: newValue,
    }
    await commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_12',
      param: param,
    }).then((res) => {
      traffiCodeList.VIO_SPLC = res.ORESULT_CUR
    })
  }
)

// 단속자 변경시
watch(() => trafficField.CRADN_EMP_NO, (newValue, oldValue) => {
  commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_04',
    param: {
      CMPNY_DIV: 'HHI',
      DANSOK_EMP_NO: newValue,
    },
  }).then((res) => {
    let search = false
    for(var result of res.ORESULT_CUR) {
      if(trafficField.APP_EMP_NO == result.APP_EMP_NO) {
        search = true
        break
      }
    }
    if(!search) trafficField.APP_EMP_NO = ''

    traffiCodeList.APP_EMP_NO = res.ORESULT_CUR
  })
})

// 단속자 변경시
watch(() => trafficField.APP_EMP_NO, (newValue, oldValue) => {
  for(var appEmp of traffiCodeList.APP_EMP_NO) {
    if(appEmp.APP_EMP_NO == newValue) {
      appEmail.value = appEmp.EMAIL
      break
    }
  }
})

defineExpose({
  openPopup,
  openPopup2,
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
      교통수칙위반등록
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick2"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="sheetTitle mt-2">{{ `차량정보` }}</div>
            <div class="d-flex">
              <div class="mt-4">
                <v-radio-group inline v-model="trafficField.VIO_DIV" @update:model-value="changeVioDiv">
                  <v-radio label="오토바이" value="A"></v-radio>
                  <v-radio label="차량" value="C"></v-radio>
                  <v-radio label="자전거" value="B"></v-radio>
                  <v-radio label="보행자" value="D"></v-radio>
                  <v-radio label="기타" value="Z"></v-radio>
                </v-radio-group>
              </div>
              <div class="d-flex ml-4" style="position: relative; bottom: 6px">
                <i-input
                  :label="$t('차량번호')"
                  width="200px"
                  top-label
                  required
                  v-model="trafficField.CAR_NO"
                  :append-inner-icon="readOnlyValue.CAR_NO_ICON"
                  @click:append-inner="openCarPopup"
                  :disabled="readOnlyValue.CAR_NO"
                ></i-input>
                <i-input
                  :label="$t('등록번호')"
                  width="200px"
                  top-label
                  required
                  v-model="trafficField.BIKE_REG_NO"
                  :readonly="readOnlyValue.RESIST_NO"
                >
                  <template
                    v-slot:append-inner
                    v-if="readOnlyValue.ICON === true"
                  >
                    <v-icon
                      :icon="readOnlyValue.RESIST_NO_ICON"
                      @click="checkResistCarNo"
                    ></v-icon>
                  </template>
                </i-input>
              </div>
            </div>
            <div class="sheetTitle mt-5 mb-2">{{ `위반자정보` }}</div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('위반자성명')"
                width="200px"
                top-label
                append-inner-icon="mdi-magnify"
                v-model="trafficField.VIOLATOR"
                @click:appendInner="openVioEmpPopup('위반자성명')"
                required
              ></i-input>
              <i-input
                :label="$t('위반자사번')"
                width="200px"
                top-label
                v-model="trafficField.VIO_EMP_NO"
                readonly
              ></i-input>
              <i-input
                :label="$t('소속조직')"
                width="350px"
                top-label
                v-model="trafficField.ASGN_NM"
                append-inner-icon="mdi-magnify"
                required
                @click:appendInner="openVioDeptPopup"
                readonly
              ></i-input>
              <i-input
                :label="$t('업체코드')"
                width="200px"
                top-label
                v-model="trafficField.VEND_CD"
                readonly
              ></i-input>
              <i-input
                width="300px"
                class="mt-5"
                v-model="trafficField.VEND_NAME"
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('사내전화')"
                width="200px"
                top-label
                v-model="trafficField.TEL_NO"
              ></i-input>
              <i-input
                :label="$t('핸드폰번호')"
                width="200px"
                top-label
                v-model="trafficField.HP_NO"
              ></i-input>
              <i-select
                :label="$t('소속구분')"
                width="200px"
                top-label
                readonly
                v-model="trafficField.IO_DIV"
                :items="traffiCodeList.IO_DIV"
                item-title="TXT"
                item-value="COD"
              ></i-select>
              <i-input
                :label="$t('년 누적위반')"
                width="200px"
                top-label
                v-model="trafficField.VIOCNT"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openVioCntPopup"
                readonly
              ></i-input>
              <v-checkbox
                :label="$t('등록번호 불일치')"
                v-model="trafficField.REG_NO_YN"
                true-value="Y"
                false-value="N"
                class="mt-5"
              ></v-checkbox>
              <v-checkbox
                :label="$t('등록증 미부착')"
                v-model="trafficField.REG_YN"
                true-value="Y"
                false-value="N"
                class="mt-5 ml-3"
              ></v-checkbox>
              <v-btn class="mt-5" style="margin: 10px;" @click="trafficOpenFileUpload">위반사항 파일첨부</v-btn>
              <v-btn v-if = "fileBtnVisible"
                  class="mt-5" 
                  @click="violoationActionFileUpload"
              >조치사항 파일첨부</v-btn>
            </div>
            <div class="sheetTitle mt-5">{{ `위반내역` }}</div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('위반일시')"
                width="180px"
                top-label
                required
                v-model="trafficField.VIO_TIME"
                type="date"
              ></i-input>
              <i-input
                width="150px"
                class="mt-4"
                v-model="trafficField.VIO_TIME1"
                type="time"
              ></i-input>

              <ILabel :label="$t('장소구분1')" labelLoc="top">
                <template #editor="editorProps">
                  <v-radio-group inline v-model="trafficField.VIO_LPLC">
                    <v-radio label="본공장" value="C"></v-radio>
                    <v-radio label="해양" value="Q"></v-radio>
                  </v-radio-group>
                </template>
              </ILabel>

              <ILabel :label="$t('장소구분2')" labelLoc="top">
                <template #editor="editorProps">
                  <v-radio-group inline v-model="trafficField.VIO_MPLC">
                    <v-radio label="출입문" value="A"></v-radio>
                    <v-radio label="교차로" value="B"></v-radio>
                    <v-radio label="도로" value="C"></v-radio>
                    <v-radio label="기타" value="Z"></v-radio>
                  </v-radio-group>
                </template>
              </ILabel>
              
              <i-select
                width="150px"
                v-model="trafficField.VIO_SPLC"
                item-title="VIO_SPLC_NM"
                item-value="VIO_SPLC"
                :items="traffiCodeList.VIO_SPLC"
                class="ml-3 mt-4"
              ></i-select>
              
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('위반장소상세')"
                width="300px"
                top-label
                v-model="trafficField.VIO_PLC_DESC"
              ></i-input>
              <i-input
                :label="$t('위반항목')"
                width="500px"
                top-label
                required
                v-model="trafficField.VIO_ITEM_NM"
                readonly
              ></i-input>
              <v-btn class="mt-5" @click="vioListSearch">위반항목 조회</v-btn>
              <i-input
                :label="$t('주행속도')"
                width="100px"
                top-label
                number
                v-model="trafficField.SPEED"
                class="ml-5"
              ></i-input>
              <span style="margin-top: 24px">Km/h</span>
              <v-checkbox
                class="mt-5"
                :label="$t('절대수칙위반')"
                v-model="trafficField.HVIO_YN"
                true-value="Y"
                false-value="N"
                style="margin: 10px;"
                disabled
              ></v-checkbox>
            </div>
            <div class="mt-2">
              <i-textarea
                :label="$t('위반내용 상세 입력')"
                width="100%"
                top-label
                v-model="trafficField.VIO_DESC"
              >
              </i-textarea>
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('단속자')"
                width="200px"
                top-label
                required
                v-model="trafficField.CRADN_EMP_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openTrafficVioEmpPopup"
              ></i-input>
              <i-select
                v-model="trafficField.APP_EMP_NO"
                :label="$t('승인자')"
                width="200px"
                top-label
                :items="traffiCodeList.APP_EMP_NO"
                item-title="APP_EMP_NM"
                item-value="APP_EMP_NO"
                required
              ></i-select>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
      <SAFDC0010BikeNoPopup
        ref="bikeNoPopup"
        @selected="bikeNoSelected"
      ></SAFDC0010BikeNoPopup>
      <SAFDC0010CarNoPopup
        ref="carNoPopup"
        @selected="carNoSelected"
      ></SAFDC0010CarNoPopup>
      <EmpPopup
        ref="trafficEmpPopup"
        @selected="selectedVioEmpPopup"
      ></EmpPopup>
      <EmpPopup ref="trafficeCrandEmpNm" @selected="selectedTrafficVioEmp">
      </EmpPopup>
      <DeptPopup ref="asgnPopup" @selected="selectedVioDeptPopup"></DeptPopup>
      <SAFDC0010VioCntPopup ref="yearVioPopup"></SAFDC0010VioCntPopup>
      <IUploadPopup
        ref="trafficFileUpload"
        @uploaded="trafficFileUploded"
      ></IUploadPopup>
      <SAFDC0010_01PopupTab02Popup01
        @selected="selectedTrafficVio"
        ref="vioSearch"
      >
      </SAFDC0010_01PopupTab02Popup01>
      <IUploadPopup ref="safetyActionFileUpload"></IUploadPopup>
    </v-card>
  </v-dialog>
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
