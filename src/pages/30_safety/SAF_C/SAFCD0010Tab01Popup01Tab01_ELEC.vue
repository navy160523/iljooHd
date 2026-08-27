<script setup>
import { ref, reactive, onMounted, getCurrentInstance, inject } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF_ELEC.vue'
import causePopup from '@/components/popup/causePopup.vue'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy     // 다이얼로그관련
const t = useI18n().t                     // 다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const deptPopup = ref(null)               // 부서팝업
const checkEmpPopup = ref(null)
const workStopEmpPopup = ref(null)        // 작업중지등록 작업담당자 인원팝업
const notiCorrEmpPopup = ref(null)        // 시정통보 승인자 팝업
const vioEmpPopup = ref(null)             // 수칙위반등록 위반자 인원팝업
const vioApprovalEmpPopup = ref(null)     // 수칙위반등록 승인자 인원 팝업
const locationPopup = ref(null)           // 장소팝업
const sagoDivPopup = ref(null)            // 잠재사고유형 팝업
const checkTargetPopup = ref(null)        // 점검 대상물 팝업
const fileUpload1 = ref(null)             // 점검사진
const fileUpload2 = ref(null)             // 조치사진
const refImage = ref(true)                // 대표이미지설정 여부

const checkImageButton = reactive([
  'btnUpdateRefImage',
  'btnFileUpload',
  'btnDownLoad',
  'btnDelete',
]) //점검사진 버튼
const jochiImageButton = reactive([
  'btnUpdateRefImage',
  'btnFileUpload',
  'btnDownLoad',
  'btnDelete',
]) //조치사진 버튼
const emit = defineEmits(['dailySaved', 'close'])

//작업중지,시정통보,수칙위반,계획점검결과등록,조치내용 readonly 플래그값
//작업중지,시정통보,수칙위반은 등록시에는 활성화 수정시에는 disable
//계획점검 결과등록탭은 계획점검 대상을 선택하고 저장하고 나면 활성화됨
//조치내용은 조치구분이 '조치완료'로 변경되면 비활성화가됨
const readOnlyValue = reactive({
  PLAN_CHECK_TAP: true, //계획점검 결과등록 탭 readonly 플래그값
  RADIO_BTN: false, //하단에 수칙위반,시정통보,작업중지 라디오버튼 visible 플래그값
  //라디오버튼 비활성화값 수칙위반,시정통보,작업중지중 1개를 선택하고 저장을하고 수정을하려고 로우를 더블클릭해서 팝업을 열면
  //저장을한 라디오버튼 이외에 버튼을 비활성화
  DISABLED_WORK_STOP: false, //작업중지 라디오버튼 비활성화 값
  DISABLED_NOTI_CORR: false, //시정통보 라디오버튼 비활성화 값
  DISABLED_DIV_VIO: false, //수칙위반 라디오버튼 비활성화 값
  JOCHI_DESC: false, //조치내용 비활성화값
  PLAN_CHECK_TARGET: true, //계획점검대상 비활성화값
  CHECK_DATE: false,
  CHECK_TIME: false,
})

const maxValue = reactive({
  CHECK_DATE_MAX: '', //점검일시 선택 최대값(오늘)
})

//코드값
const codeList = reactive({
  JOCHI_DIV: [], //조치구분
  DAILY_DIV: [], //점검구분
  VIO_GDIV: [], //수칙위반
  VIO_GDIV_NM: [], //수칙위반 항목
  PLAN_CHECK_TARGET: [], //계획점검 대상
  SAF_ACT_GUBUN: [
    { TXT: '일일점검', COD: 'D' },   
    { TXT: '안전개입', COD: 'S' },
    { TXT: '관리감독자', COD: 'M' },    
  ],
})

// const ELEC_CHECK_DIV: [
// { TXT: '안전개입', CODE: 'S'},
//   { TXT: '관리감독자', CODE: 'M'},
// ]

//체크박스 v-model
const radioBtnValue = reactive({
  CHECKED: '', //수칙위반라디오박스 체크값
  CHECKED_DAILY_PLAN: 'DAILY', //일상점검,계획점검 라디오박스 체크값 디폴트는 일상점검
  BEFORE_CHECKED: '', //이전에 선택한 라디오버튼값(같은버튼을 클릭했을때 버튼 해제를 하기위해서)
})

//작업중지등록 필드
const workStopField = reactive({
  WORK_EMP_NO: '', //작업 담당자사번
  WORK_EMP_NM: '', //작업 담당자 성명
  WORK_STOP_DESC: '', //작업 중지 사유
})

//시정통보 필드
const notiCorr = reactive({
  NOTI_CORR_TITLE: '', //시정통보 제목
  REQ_DATE: '', //회신요구일
  NOTI_CORR_DESC: '', //시정요구내용
  APP_EMP_NO: userStore.empNo, //승인자사번
  APP_EMP_NM: userStore.empNm, //승인자성명
})

//수칙위반필드
const divVio = reactive({
  VIO_DIV: '', //위반종류
  VIO_MDIV: '', //위반상세
  VIO_EMP_NM: '', //위반자사번
  VIO_EMP_NO: '', //위반자성명
  APP_EMP_NO: '', //승인자사번
  APP_EMP_NM: '', //승인자성명
})

//일상점검결과등록 필드
const dailyCheckField = reactive({
  DEPT_CD: '', //부서코드
  BSNS_CD: '', //사업부코드
  SENDER_DEPT_CD: '', //점검부서코드
  SENDER_DEPT_NM: '', //점검부서이름
  DAILY_CHECK_SEQ: '', //일상점검No
  CHECK_EMP_NM: '', //점검자이름
  CHECK_EMP_NO: '', //점검자사번
  CHECK_GUBUN: '0', //점검구분
  CHECK_DATE: '', //점검일시
  CHECK_TIME: '', //점검시간
  RECEIVER_DEPT_CD: '', //대상조직코드
  RECEIVER_DEPT_NM: '', //대상조직이름
  RECEIVER_DEPT_CD_NM: '', //대상조직 수기입력
  RECEIVER_ASGN_CD: '', //대상조직코드
  RECEIVER_BSNS_CD: '', //대상조직 사업부코드
  RECEIVER_CMPNY_DIV: '', //대상조직 사업장구분
  CHECK_LPLC: '', //점검장소(대)
  CHECK_MPLC: '', //점검장소(중)
  CHECK_SPLC: '', //점검장소(소)
  CHECK_PLC_DESC: '', //점검장소상세
  CHECK_PLC_NM: '', //점검장소이름
  CHECK_JOCHI: '0', //조치구분 (기본값 조치필요)
  SAGO_DIV_L: '', //잠재사고유형코드(대)
  SAGO_DIV_M: '', //잠재사고유형코드(중)
  SAGO_DIV_S: '', //잠재사고유형코드(소)
  SAGO_DIV_L_NM: '', //잠재사고유형이름(대)
  SAGO_DIV_M_NM: '', //잠재사고유형이름(중)
  SAGO_DIV_S_NM: '', //잠재사고유형이름(소)
  CHECK_TARGET_OBJ1_NM: '', //대상 점검물 LV1 이름
  CHECK_TARGET_OBJ1: '', //대상 점검물 LV1
  CHECK_TARGET_OBJ2_NM: '', //대상 점검물 LV2이름
  CHECK_TARGET_OBJ2: '', //대상 점검물 LV2
  CHECK_TARGET_OBJ3_NM: '', //대상 점검물 LV3
  CHECK_TARGET_OBJ3: '', //대상 점검물 LV3
  CHECK_DESC: '', //점검내용
  CMPNY_DIV: '', //회사구분
  JOCHI_DESC: '', //조치내용
  JOCHI_PIC_BEFORE: '', //점검사진 첨부파일 ID
  JOCHI_PIC_AFTER: '', //조치사진 첨부파일 ID
  JOCHI_PIC_BEFORE_REF_IMAGE: '', //점검사진 대표이미지 파일번호
  JOCHI_PIC_AFTER_REF_IMAGE: '', //조치사진 대표이미지 파일번호
  CHECK_PLAN_SEQ: '', //계획점검 No
  CHECK_CYCLE_SEQ: '', //점검기간 No
  PLAN_CHECK_TARGET: '', //계획점검대상
  JSTOP_NO: '', //작업중지NO
  MNG_NO: '', //시정통보NO
  VIO_NO: '', //수칙위반NO
  FROM_DATE: '', //점검주기 시작일
  TO_DATE: '', //점검주기 종료일
  MODIFY: 'N', //수정,등록여부
  INSERT_USER_ID: '', //작성자
  SAF_ACT_GUBUN: 'S', // 안전개입/관리감독자 (일렉용)
})

//코드세팅
const initCodeList = () => {
  Promise.all([
    //조치구분 조회
    getCodeList('HHIP020'),
    //일상점검 구분 조회
    getCodeList('HHIP030'),
    //수칙위반 조회
    getCodeList('HHIF110'),
  ]).then((res) => {
    codeList.JOCHI_DIV = res[0].ORESULT_CUR
    codeList.DAILY_DIV = res[1].ORESULT_CUR
    codeList.VIO_GDIV = res[2].ORESULT_CUR.filter((x) => x.COD !== 'C')
      .filter((x) => x.COD !== 'Z')
      .filter((x) => !x.COD.includes('S')) //일반수칙,중대성,절대수칙만 나오도록 걸러냄
  })
  maxValue.CHECK_DATE_MAX = dayjs().format('YYYY-MM-DD') //점검일시 최대값 오늘로
}

//로그인 유저 정보 세팅
const initUserInfo = () => {
  if (!dailyModify.MODIFY) {
    dailyCheckField.SENDER_DEPT_CD = userStore.deptCd //부서코드 세팅
    dailyCheckField.SENDER_DEPT_NM = userStore.deptNm //부서이름 세팅
    dailyCheckField.CHECK_EMP_NM = userStore.empNm //로그인유저 이름
    dailyCheckField.CHECK_EMP_NO = userStore.empNo //로그인유저 사번
    dailyCheckField.CHECK_GUBUN = '0' // 점검구분
    dailyCheckField.CHECK_DATE = getToday() // 점검일시
    notiCorr.APP_EMP_NO = userStore.empNo
    notiCorr.APP_EMP_NM = userStore.empNm

    //안전조직 외 기존 대상조직으로 변경
    dailyCheckField.RECEIVER_DEPT_CD = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd
    dailyCheckField.RECEIVER_DEPT_NM = userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm
  }
}

//일상점검 수정
const dailyModify = (rowData) => {
  setField() //코드값 세팅
  if (rowData.MODIFY) {
    vm.$nextTick(() => {
      // 점검일시 수정 때는 비활성화
      readOnlyValue.CHECK_DATE = true
      readOnlyValue.CHECK_TIME = true

      // 수정 구분 Y
      dailyCheckField.MODIFY = 'Y'

      for (const [key, value] of Object.entries(rowData)) {
        if (dailyCheckField.hasOwnProperty(key)) {
          dailyCheckField[key] = value
        }
      }

      //계획점검 대상을 저장했었다면 계획점검 연계 라디오버튼으로 설정
      if (dailyCheckField.CHECK_PLAN_SEQ) {
        radioBtnValue.CHECKED_DAILY_PLAN = 'PLAN'
      }

      //점검사진 조회
      if (dailyCheckField.JOCHI_PIC_BEFORE) {
        fileUpload1.value.setGuid(dailyCheckField.JOCHI_PIC_BEFORE)
        fileUpload1.value.onButtonsClick({ id: 'btnSearch' })
        setTimeout(() => {
          fileUpload1.value.setRefYn(dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE)
        }, 500)
      }
      //조치사진 조회
      if (dailyCheckField.JOCHI_PIC_AFTER) {
        fileUpload2.value.setGuid(dailyCheckField.JOCHI_PIC_AFTER)
        fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
        setTimeout(() => {
          fileUpload2.value.setRefYn(dailyCheckField.JOCHI_PIC_AFTER_REF_IMAGE)
        }, 500)
      }
      //작업중지 번호가 있으면 작업중지 데이터 조회
      if (dailyCheckField.JSTOP_NO) {
        let param = {
          CMPNY_DIV: dailyCheckField.CMPNY_DIV,
          JSTOP_NO: dailyCheckField.JSTOP_NO,
          NO_DIV: 'JSTOP', //쿼리단에서 작업중지,수칙위반,시정통보에 대한 IF문을 태우기위한 값
        }
        commonSearchApi({
          queryId: 'SAFCD0010_ELEC_SEARCH100',
          param: param,
        }).then((res) => {
          radioBtnValue.CHECKED = 'WORK_STOP' //라디오버튼값을 넣어줌 넣어줘야 작업중지 라디오버튼에 대한 컴포넌트가 보임
          readOnlyValue.DISABLED_NOTI_CORR = true //시정통보 라디오버튼 비활성화
          readOnlyValue.DISABLED_DIV_VIO = true //수칙위반 라디오버튼 비활성화
          workStopField.WORK_EMP_NM = res.ORESULT_CUR[0].CHG_EMP_NM //작업담당자 성명
          workStopField.WORK_EMP_NO = res.ORESULT_CUR[0].CHG_EMP_NO //작업담당자 사번
          workStopField.WORK_STOP_DESC = res.ORESULT_CUR[0].JSTOP_DESC //작업중지사유
        })
      }
      //수칙위반 번호가 있으면 수칙위반 데이터 조회
      else if (dailyCheckField.VIO_NO) {
        let param = {
          CMPNY_DIV: dailyCheckField.CMPNY_DIV,
          VIO_NO: dailyCheckField.VIO_NO,
          NO_DIV: 'VIO_NO', //쿼리단에서 작업중지,수칙위반,시정통보에 대한 IF문을 태우기위한 값
        }
        commonSearchApi({
          queryId: 'SAFCD0010_ELEC_SEARCH100',
          param: param,
        }).then((res) => {
          radioBtnValue.CHECKED = 'VIO_DIV' //라디오버튼값을 넣어줌 넣어줘야 수칙위반 라디오버튼에 대한 컴포넌트가 보임
          readOnlyValue.DISABLED_WORK_STOP = true //작업중지 라디오버튼 비활성화
          readOnlyValue.DISABLED_DIV_VIO = true //수칙위반 라디오버튼 비활성화
          divVio.VIO_DIV = res.ORESULT_CUR[0].VIO_GDIV //위반종류
          divVio.VIO_MDIV = res.ORESULT_CUR[0].VIO_MDIV //위반항목
          divVio.VIO_EMP_NM = res.ORESULT_CUR[0].VIO_EMP_NM //위반자성명
          divVio.VIO_EMP_NO = res.ORESULT_CUR[0].VIO_EMP_NO //위반자사번
          divVio.APP_EMP_NM = res.ORESULT_CUR[0].APP_EMP_NM //승인자성명
          divVio.APP_EMP_NO = res.ORESULT_CUR[0].APP_EMP_NO //승인자사번
        })
      }
      //시정통보 번호가 있으면 시정통보 데이터 조회
      else if (dailyCheckField.MNG_NO) {
        let param = {
          CMPNY_DIV: dailyCheckField.CMPNY_DIV,
          MNG_NO: dailyCheckField.MNG_NO,
          NO_DIV: 'MNG_NO', //쿼리단에서 작업중지,수칙위반,시정통보에 대한 IF문을 태우기위한 값
        }
        commonSearchApi({
          queryId: 'SAFCD0010_ELEC_SEARCH100',
          param: param,
        }).then((res) => {
          radioBtnValue.CHECKED = 'NOTI_CORR' //라디오버튼값을 넣어줌 넣어줘야 시정통보 라디오버튼에 대한 컴포넌트가 보임
          readOnlyValue.DISABLED_WORK_STOP = true //작업중지 라디오버튼 비활성화
          readOnlyValue.DISABLED_DIV_VIO = true //수칙위반 라디오버튼 비활성화
          notiCorr.NOTI_CORR_TITLE = res.ORESULT_CUR[0].NOTI_TITLE //시정통보 제목
          notiCorr.NOTI_CORR_DESC = res.ORESULT_CUR[0].REQUIRE_DESC //시정요구(안)
          notiCorr.REQ_DATE = res.ORESULT_CUR[0].REQ_REPLY_DT //회신요구일
          notiCorr.APP_EMP_NO = res.ORESULT_CUR[0].APP_EMP_NO //승인자 사번
          notiCorr.APP_EMP_NM = res.ORESULT_CUR[0].APP_EMP_NM //승인자 성명
        })
      } else {
        //아무것도 저장되어 있지 않으면 라디오버튼 빈값
        radioBtnValue.CHECKED = ''
      }
    })
  }
}

//버튼이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
}

// 현재 날짜 자동 입력
const getToday = () => {
  // 현재 날짜 객체 생성
  var today = new Date()
  // 년, 월, 일을 가져오기
  var year = today.getFullYear()
  // 월은 0부터 시작하기 때문에 1을 더해줌
  var month = (today.getMonth() + 1).toString().padStart(2, '0') // 1자리 숫자는 앞에 0을 붙여 두 자리로 만듦
  var day = today.getDate().toString().padStart(2, '0') // 위와 동일
  return year + '-' + month + '-' + day
}

//저장관련 로직 시작
const beforeSave = () => {

  let today = dayjs()
  // 문령훈 책임 요청
  if (today.diff(dayjs(dailyCheckField.CHECK_DATE), 'day') >  14 && dailyCheckField.MODIFY === 'N'){
      Message.warn(t('2주일 이전의 점검은 등록/수정이 불가능합니다.'))
      return false
    }

  if (!dailyCheckField.SENDER_DEPT_CD) {
    Message.warn(t('점검부서는 필수입력값 입니다.'))
    return false
  } else if (!dailyCheckField.CHECK_GUBUN) {
    Message.warn(t('점검구분은 필수입력값 입니다.'))
    return false
  } else if (!dailyCheckField.CHECK_DATE || !dailyCheckField.CHECK_TIME) {
    Message.warn(t('점검일시는 필수입력값 입니다.'))
    return false
  }
  //안전조직 권한그룹일때만 대상조직 필수입력
  // else if (userStore.authGrpCd.includes('GRP00381')) {
  else if (
    !dailyCheckField.RECEIVER_DEPT_CD &&
    !dailyCheckField.RECEIVER_DEPT_CD_NM
  ) {
    Message.warn(t('대상조직 또는 대상조직수기입력은 필수입력값 입니다.'))
    return false
  } else if (!dailyCheckField.CHECK_PLC_NM) {
    Message.warn(t('점검장소는 필수입력값 입니다.'))
    return false
  } else if (!dailyCheckField.CHECK_JOCHI) {
    Message.warn(t('조치구분은 필수입력값 입니다.'))
    return false
  } else if (
    !dailyCheckField.CHECK_TARGET_OBJ1 ||
    !dailyCheckField.CHECK_TARGET_OBJ2 ||
    !dailyCheckField.CHECK_TARGET_OBJ3
  ) {
    Message.warn(t('점검 대상물은 필수입력값 입니다.'))
    return false
  } else if (!dailyCheckField.SAGO_DIV_L) {
    Message.warn(t('잠새사고유형은 필수입력값 입니다.'))
    return false
  } else if (!dailyCheckField.CHECK_DESC) {
    Message.warn(t('점검 내용은 필수입력값 입니다.'))
    return false
  }
  //점검사진을 업로드 했을때는 점검사진의 대표이미지가 있어야함
  if (dailyCheckField.JOCHI_PIC_BEFORE) {
    if (!dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE) {
      Message.warn(t('점검사진의 대표이미지를 선택해주세요.'))
      return false
    }
  }
  //사진을 업로드 했을때는 조치사진의 대표이미지가 있어야함
  if (dailyCheckField.JOCHI_PIC_AFTER) {
    if (!dailyCheckField.JOCHI_PIC_AFTER_REF_IMAGE) {
      Message.warn(t('조치사진의 대표이미지를 선택해주세요.'))
      return false
    }
  }

  if (radioBtnValue.CHECKED === 'WORK_STOP') {
    //작업중지가 선택되었을때 필수값 체크
    if (!workStopField.WORK_EMP_NO) {
      Message.warn(t('작업 담당자는 필수입력값 입니다.'))
      return false
    } else if (!workStopField.WORK_STOP_DESC) {
      Message.warn(t('작업 중지 사유는 필수입력값 입니다.'))
      return false
    }
  }
  if (radioBtnValue.CHECKED === 'NOTI_CORR') {
    //시정통보가 선택되었을때 필수값 체크
    if (!notiCorr.NOTI_CORR_TITLE) {
      Message.warn(t('시정통보 제목은 필수입력값 입니다.'))
      return false
    } else if (!notiCorr.REQ_DATE) {
      Message.warn(t('시정통보 회신요구일은 필수입력값 입니다.'))
      return false
    } else if (!notiCorr.APP_EMP_NO) {
      Message.warn(t('시정통보 승인자는 필수입력값 입니다.'))
      return false
    }
  }
  if (radioBtnValue.CHECKED === 'VIO_DIV') {
    //수칙위반이 선택되었을때 필수값 체크
    if (!divVio.VIO_DIV) {
      Message.warn(t('위반종류는 필수입력값 입니다.'))
      return false
    } else if (!divVio.VIO_MDIV) {
      Message.warn(t('위반항목은 필수입력값 입니다.'))
      return false
    } else if (!divVio.VIO_EMP_NO) {
      Message.warn(t('위반자는 필수입력값 입니다.'))
      return false
    } else if (!divVio.APP_EMP_NO) {
      Message.warn(t('승인자는 필수입력값 입니다.'))
      return false
    }
  }
  return true
}

const saveData = () => {
  let saveParam = []

  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
    BSNS_CD: userStore.bsnsCd, //사업부
    DEPT_CD: userStore.deptCd, //부서
    ASGN_CD: userStore.asgnCd, //조직
    DAILY_CHECK_SEQ: dailyCheckField.DAILY_CHECK_SEQ, //일상점검No
    SENDER_DEPT_CD: dailyCheckField.SENDER_DEPT_CD, //점검부서
    SENDER_ASGN_CD: userStore.asgnCd,
    RECEIVER_DEPT_CD: dailyCheckField.RECEIVER_DEPT_CD, //대상조직 부서 코드
    RECEIVER_ASGN_CD: dailyCheckField.RECEIVER_ASGN_CD, //대상조직 코드
    RECEIVER_CMPNY_DIV: dailyCheckField.RECEIVER_CMPNY_DIV, //대상조직 사업장구분
    RECEIVER_DEPT_CD_NM: dailyCheckField.RECEIVER_DEPT_CD_NM, //대상조직 수기입력
    CHECK_EMP_NO: dailyCheckField.CHECK_EMP_NO, //점검자 사번
    CHECK_TEL_NO: userStore.hndPhn, //점검자 번호
    CHECK_DATE: dailyCheckField.CHECK_DATE, //점검일시
    CHECK_TIME: dailyCheckField.CHECK_TIME, //점검시간
    CHECK_GUBUN: dailyCheckField.CHECK_GUBUN, //점검구분
    CHECK_LPLC: dailyCheckField.CHECK_LPLC, //점검장소(대)
    CHECK_MPLC: dailyCheckField.CHECK_MPLC, //점검장소(중)
    CHECK_SPLC: dailyCheckField.CHECK_SPLC, //점검장소(소)
    CHECK_PLC_DESC: dailyCheckField.CHECK_PLC_DESC, //점검장소상세
    CHECK_JOCHI: dailyCheckField.CHECK_JOCHI, //조치구분
    SAGO_DIV_L: dailyCheckField.SAGO_DIV_L, //잠재사고유형(대)
    SAGO_DIV_M: dailyCheckField.SAGO_DIV_M, //잠재사고유형(중)
    SAGO_DIV_S: dailyCheckField.SAGO_DIV_M, //잠재사고유형(소)
    CHECK_TARGET_OBJ1: dailyCheckField.CHECK_TARGET_OBJ1, //대상 점검물 LV1
    CHECK_TARGET_OBJ2: dailyCheckField.CHECK_TARGET_OBJ2, //대상 점검물 LV2
    CHECK_TARGET_OBJ3: dailyCheckField.CHECK_TARGET_OBJ3, //대상 점검물 LV3
    CHECK_DESC: dailyCheckField.CHECK_DESC, //점검 내용
    JOCHI_DESC: dailyCheckField.JOCHI_DESC, //조치내용
    JOCHI_PIC_BEFORE: dailyCheckField.JOCHI_PIC_BEFORE, //점검사진 파일아이디
    JOCHI_PIC_AFTER: dailyCheckField.JOCHI_PIC_AFTER, //조치사진 파일아이디
    JOCHI_PIC_BEFORE_REF_IMAGE: dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE, //점검사진 대표이미지 파일번호
    JOCHI_PIC_AFTER_REF_IMAGE: dailyCheckField.JOCHI_PIC_AFTER_REF_IMAGE, //조치사진 대표이미지 파일번호
    CHECK_PLAN_SEQ:
      radioBtnValue.CHECKED_DAILY_PLAN === 'PLAN'
        ? dailyCheckField.CHECK_PLAN_SEQ
        : '', //계획점검대상 (일상점검 라디오박스클릭하고 저장시 빈값이 들어가고, 계획점검대상 라디오박스 클릭하고 저장시 계획점검대상 값이 들어감)
    CHECK_CYCLE_SEQ: dailyCheckField.CHECK_CYCLE_SEQ, //점검주기 No
    CHECKED: radioBtnValue.CHECKED, //라디오버튼 체크값
    CHG_EMP_NO: workStopField.WORK_EMP_NO, //작업담당자 사번
    CHG_EMP_NM: workStopField.WORK_EMP_NM, //작업담당자 성명
    WORK_STOP_DESC: workStopField.WORK_STOP_DESC, //작업중지 사유
    NOTI_TITLE: notiCorr.NOTI_CORR_TITLE, //시정통보 제목
    REQ_REPLY_DT: notiCorr.REQ_DATE, //시정통보 회신요구일
    NOTI_CORR_DESC: notiCorr.NOTI_CORR_DESC, //시정통보 시정요구내용
    ACT_EMP_NO: userStore.userId, //조치자사번
    ACT_TEL_NO: userStore.hndPhn, //조치자전화
    NOTI_APP_EMP_NO: notiCorr.APP_EMP_NO, //시정통보 승인자
    VIO_GDIV: divVio.VIO_DIV, //위반종류
    VIO_MDIV: divVio.VIO_MDIV, //위반상세구분
    APP_EMP_NO: divVio.APP_EMP_NO, //승인자 사번
    VIO_EMP_NO: divVio.VIO_EMP_NO, //위반자사번
    VIOLATOR: divVio.VIO_EMP_NM, //위반자성명
    USER_ID: userStore.userId, //로그인유저 아이디
    SAF_ACT_GUBUN: dailyCheckField.SAF_ACT_GUBUN, // 안전개입/관리감독자 구분(일렉용)
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFCD0010_ELEC_SAVE01',
    list: saveParam,
  })
}

const afterSave = (res) => {
  //계획점검대상을 선택하고 저장하지 않으면 팝업 닫음
  if (!dailyCheckField.CHECK_PLAN_SEQ) {
    emit('close')
    //신규저장시에만 안전페이 지급하도록
    if (!dailyCheckField.DAILY_CHECK_SEQ) {
      setHDPAY(res)
    }
  }

  //계획점검 대상을 선택하고 저장시 계획점검 결과등록 탭 활성화
  if (dailyCheckField.CHECK_PLAN_SEQ) {
    dailyCheckField.DAILY_CHECK_SEQ = res.list[0].OUT_DAILY_SEQ
    emit('dailySaved', dailyCheckField)
    //신규저장시에만 안전페이 지급하도록
    if (!dailyCheckField.DAILY_CHECK_SEQ) {
      setHDPAY(res)
    }
  }
}
//저장관련 로직 끝

//대상조직 선택 팝업 오픈 이벤트
const openDeptPopup = () => {
  if (!dailyCheckField.RECEIVER_DEPT_NM) {
    deptPopup.value.openPopup()
  } else {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: dailyCheckField.RECEIVER_DEPT_NM,
    })
  }
}
//대상조직 선택 이벤트
const selectedDept = (val) => {
  dailyCheckField.RECEIVER_DEPT_CD = val.DEPT_CD
  dailyCheckField.RECEIVER_DEPT_NM = val.ASGN_SHRT_NM
  dailyCheckField.RECEIVER_ASGN_CD = val.ASGN_CD
  dailyCheckField.RECEIVER_BSNS_CD = val.BSNS_CD
  dailyCheckField.RECEIVER_CMPNY_DIV = val.CMPNY_DIV
}

//장소팝업 오픈 이벤트
const openLocationPopup = () => {
  locationPopup.value.openPopup('장소')
}

//장소선택 이벤트
const selectedLocation = (val) => {
  dailyCheckField.CHECK_LPLC = val[0].COD
  dailyCheckField.CHECK_MPLC = val[1].COD
  dailyCheckField.CHECK_SPLC = val[2].COD
  dailyCheckField.CHECK_PLC_NM = val[2].TXT
}
//잠재사고유형 오픈 이벤트
const openSagoDivPopup = () => {
  sagoDivPopup.value.openPopup('잠재사고')
}

//잠재사고유형 선택 이벤트
const selectedSagoDivPopup = (val) => {
  dailyCheckField.SAGO_DIV_L = val[0].COD
  dailyCheckField.SAGO_DIV_L_NM = val[0].TXT
  dailyCheckField.SAGO_DIV_M = val[1].COD
  dailyCheckField.SAGO_DIV_M_NM = val[1].TXT
  dailyCheckField.SAGO_DIV_S = val[2].COD
  dailyCheckField.SAGO_DIV_S_NM = val[2].TXT
}

//점검 대상물 오픈 이벤트
const openTargetPopup = () => {
  checkTargetPopup.value.openPopup('점검대상물')
}

//점검 대상물 선택 이벤트
const selectedTarget = (val) => {
  dailyCheckField.CHECK_TARGET_OBJ1 = val[0].COD
  dailyCheckField.CHECK_TARGET_OBJ1_NM = val[0].TXT
  dailyCheckField.CHECK_TARGET_OBJ2 = val[1].COD
  dailyCheckField.CHECK_TARGET_OBJ2_NM = val[1].TXT
  dailyCheckField.CHECK_TARGET_OBJ3 = val[2].COD
  dailyCheckField.CHECK_TARGET_OBJ3_NM = val[2].TXT
}

//점검사진 업로드 이벤트
const uploadCheckPicture = (val) => {
  dailyCheckField.JOCHI_PIC_BEFORE = val.FILE_ID
}

//조치사진 업로드 이벤트
const uploadJoChiPicture = (val) => {
  dailyCheckField.JOCHI_PIC_AFTER = val.FILE_ID
}

const checkEmpPopupOpen = () => {
  checkEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: dailyCheckField.CHECK_EMP_NM,
  })
}

//작업중지등록 작업담당자 인원팝업 오픈 이벤트
const openWorkStopApprovalEmp = () => {
  workStopEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: workStopField.WORK_EMP_NM,
    DEPT_CD: dailyCheckField.RECEIVER_DEPT_CD, //대상조직 부서코드
    BSNS_CD: dailyCheckField.RECEIVER_BSNS_CD, //대상조직 사업부코드
  })
}

//작업중지등록 작업담당자 선택 이벤트
const selectedWorkStopEmp = (val) => {
  workStopField.WORK_EMP_NO = val.EMP_NO
  workStopField.WORK_EMP_NM = val.EMP_NM
}

//시정통보 승인자 인원팝업 오픈 이벤트
const openNotiCorrEmpOpen = () => {
  notiCorrEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: notiCorr.APP_EMP_NM,
    DEPT_CD: dailyCheckField.RECEIVER_DEPT_CD, //대상조직 부서코드
    BSNS_CD: dailyCheckField.RECEIVER_BSNS_CD, //대상조직 사업부코드
  })
}

//시정통보 승인자 선택 이벤트
const selectedNotiCorrEmp = (val) => {
  notiCorr.APP_EMP_NO = val.EMP_NO
  notiCorr.APP_EMP_NM = val.EMP_NM
}

//수칙위반 등록 위반자 인원팝업 오픈 이벤트
const openVioEmp = () => {
  vioEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: divVio.VIO_EMP_NM,
    DEPT_CD: dailyCheckField.RECEIVER_DEPT_CD, //대상조직 부서코드
    BSNS_CD: dailyCheckField.RECEIVER_BSNS_CD, //대상조직 사업부코드
  })
}

//수칙위반 등록 위반자 선택 이벤트
const selectedVioEmp = (val) => {
  divVio.VIO_EMP_NM = val.EMP_NM
  divVio.VIO_EMP_NO = val.EMP_NO
}

//수칙위반 등록 승인자 인원팝업 오픈 이벤트
const openApprovalEmp = () => {
  vioApprovalEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: divVio.VIO_EMP_NM,
    DEPT_CD: dailyCheckField.RECEIVER_DEPT_CD, //대상조직 부서코드
    BSNS_CD: dailyCheckField.RECEIVER_BSNS_CD, //대상조직 사업부코드
  })
}

// 점검자 변경 시 이벤트
const selectedCheckEmp = (val) => {
  dailyCheckField.CHECK_EMP_NO = val.EMP_NO
  dailyCheckField.CHECK_EMP_NM = val.EMP_NM
}

//수칙위반 등록 승인자 선택 이벤트
const selectedApprovalEmp = (val) => {
  divVio.APP_EMP_NM = val.EMP_NM
  divVio.APP_EMP_NO = val.EMP_NO
}

//팝업 닫을때 필드값 초기화
const initField = () => {
  //일상점검 결과등록 필드 초기화
  for (let i in dailyCheckField) {
    dailyCheckField[i] = ''
  }

  dailyCheckField.CHECK_GUBUN = '0'
  dailyCheckField.CHECK_DATE = getToday()

  //점검사진,조치사진데이터 초기화
  fileUpload1.value.clearGrid()
  fileUpload2.value.clearGrid()

  //readonly값 초기화
  for (let i in readOnlyValue) {
    if (i === 'PLAN_CHECK_TAP') {
      readOnlyValue[i] = true
    }
    readOnlyValue[i] = false
  }
  //계획점검대상 disable true로
  readOnlyValue.PLAN_CHECK_TARGET = true

  //작업중지 필드 초기화
  for (let i in workStopField) {
    workStopField[i] = ''
  }
  //시정통보 필드 초기화
  for (let i in notiCorr) {
    notiCorr[i] = ''
  }
  //수칙위반 필드 초기화
  for (let i in divVio) {
    divVio[i] = ''
  }

  //라디오버튼값 초기화
  for (let i in radioBtnValue) {
    //일상점검을 디폴트로
    if (i === 'CHECKED_DAILY_PLAN') {
      radioBtnValue[i] = 'DAILY'
    } else {
      radioBtnValue[i] = ''
    }
  }
}

//로그인유저가 안전직원,IT관리자 권한을 가지고 있으면 작업중지,시정통보,수칙위반 라디오박스 보이기
const checkGroup = () => {
  //GRP00381 : 안전직원
  //GRP00369 : IT관리자
  if (
    userStore.authGrpCd.includes('GRP00381') ||
    userStore.authGrpCd.includes('GRP00369') ||
    userStore.authGrpCd.includes("HIWAYGRP00001")
  ) {
    readOnlyValue.RADIO_BTN = true
    //20240923 박주성(안전부문 및 관리자 일때 대상조직 공백처리)
    dailyCheckField.RECEIVER_DEPT_NM = '';
  }
  else {
    readOnlyValue.RADIO_BTN = false
  }
}

//팝업 오픈시 실행되는 함수
//마운트 될때 실행되도록 했으나, 닫기버튼을 누를때 필드를 초기화 하면서 재실행이 되지 않아서
const setField = () => {
  initCodeList()
  initUserInfo()
  checkGroup()
}

//라디오버튼을 클릭했을때, 같은 라디오 버튼을 클릭하면 클릭한 버튼 해제
const deSelectRadioBtn = (e) => {
  if (radioBtnValue.BEFORE_CHECKED === e) {
    //라디오버튼을 클릭하고, 같은 라디오 버튼을 클릭하면 클릭 해제
    radioBtnValue.CHECKED = ''
  } else {
    radioBtnValue.BEFORE_CHECKED = e
  }
}

//점검사진 대표이미지가 선택되었을때 실행되는 함수
const selectedCheckRefImage = (val) => {
  //저장되지 않은 상태면 파일번호를 넣어준다.
  if (!dailyCheckField.DAILY_CHECK_SEQ) {
    dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE = val.FILE_NO
  } else {
    dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE = val.FILE_NO
    //저장된 상태면 바로 업데이트를 실행한다.
    let saveParam = []
    let saveData = {
      CMPNY_DIV: dailyCheckField.CMPNY_DIV,
      BSNS_CD: dailyCheckField.BSNS_CD,
      DEPT_CD: dailyCheckField.DEPT_CD,
      DAILY_CHECK_SEQ: dailyCheckField.DAILY_CHECK_SEQ,
      JOCHI_PIC_BEFORE_REF_IMAGE: val.FILE_NO,
      JOCHI_PIC_AFTER_REF_IMAGE: '',
    }
    saveParam.push(saveData)
    commonExecuteApi({
      queryId: 'SAFCD0010_ELEC_SAVE08',
      list: saveParam,
    })
  }
}

//조치사진 대표이미지가 선택되었을때 실행되는 함수
const selectedJochiRefImage = (val) => {
  if (!dailyCheckField.DAILY_CHECK_SEQ) {
    dailyCheckField.JOCHI_PIC_AFTER_REF_IMAGE = val.FILE_NO
  } else {
    dailyCheckField.JOCHI_PIC_AFTER_REF_IMAGE = val.FILE_NO
    //저장된 상태면 바로 업데이트를 실행한다.
    let saveParam = []
    let saveData = {
      CMPNY_DIV: dailyCheckField.CMPNY_DIV,
      BSNS_CD: dailyCheckField.BSNS_CD,
      DEPT_CD: dailyCheckField.DEPT_CD,
      DAILY_CHECK_SEQ: dailyCheckField.DAILY_CHECK_SEQ,
      JOCHI_PIC_BEFORE_REF_IMAGE: '',
      JOCHI_PIC_AFTER_REF_IMAGE: val.FILE_NO,
    }
    saveParam.push(saveData)
    commonExecuteApi({
      queryId: 'SAFCD0010_ELEC_SAVE08',
      list: saveParam,
    })
  }
}

//점검사진이 삭제되었을때 실행되는 함수
const deletedCheckRefImage = (val) => {
  if (!dailyCheckField.DAILY_CHECK_SEQ) {
    for (let i = 0; i < val.length; i++) {
      if (dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE === val[i].FILE_NO) {
        Message.warn(
          t('대표이미지가 설정된 파일은 일상점검 저장후 삭제 해주세요.')
        )
        fileUpload1.value.checkDeleteRef(false)
        return false
      } else {
        fileUpload1.value.checkDeleteRef(true)
      }
    }
  } else {
    for (let i = 0; i < val.length; i++) {
      if (dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE === val[i].FILE_NO) {
        let paramData = []
        let param = {
          CMPNY_DIV: dailyCheckField.CMPNY_DIV,
          BSNS_CD: dailyCheckField.BSNS_CD,
          DEPT_CD: dailyCheckField.DEPT_CD,
          DAILY_CHECK_SEQ: dailyCheckField.DAILY_CHECK_SEQ,
          JOCHI_PIC_BEFORE_REF_IMAGE:
            dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE,
          JOCHI_PIC_AFTER_REF_IMAGE: '',
        }
        paramData.push(param)
        commonExecuteApi({
          queryId: 'SAFCD0010_ELEC_DELETE02',
          list: paramData,
        })
      }
    }
  }
}

//조치사진이 삭제되었을때 실행되는 함수
const deletedJochiRefImage = (val) => {
  if (!dailyCheckField.DAILY_CHECK_SEQ) {
    for (let i = 0; i < val.length; i++) {
      if (dailyCheckField.JOCHI_PIC_BEFORE_REF_IMAGE === val[i].FILE_NO) {
        Message.warn(
          t('대표이미지가 설정된 파일은 일상점검 저장후 삭제 해주세요.')
        )
        fileUpload2.value.checkDeleteRef(false)
        return false
      } else {
        fileUpload2.value.checkDeleteRef(true)
      }
    }
  } else {
    for (let i = 0; i < val.length; i++) {
      if (dailyCheckField.JOCHI_PIC_AFTER_REF_IMAGE === val[i].FILE_NO) {
        let paramData = []
        let param = {
          CMPNY_DIV: dailyCheckField.CMPNY_DIV,
          BSNS_CD: dailyCheckField.BSNS_CD,
          DEPT_CD: dailyCheckField.DEPT_CD,
          DAILY_CHECK_SEQ: dailyCheckField.DAILY_CHECK_SEQ,
          JOCHI_PIC_BEFORE_REF_IMAGE: '',
          JOCHI_PIC_AFTER_REF_IMAGE: dailyCheckField.JOCHI_PIC_AFTER_REF_IMAGE,
        }
        paramData.push(param)
        commonExecuteApi({
          queryId: 'SAFCD0010_ELEC_DELETE02',
          list: paramData,
        })
      }
    }
  }
}

//안전페이 적립하는 함수
//일상점검을 '10건'저장했을때 1000P가 지급된다.
//월 최대 1000P이고, 10건 이상을 저장해도 지급되지 않는다.
const setHDPAY = (res1) => {
  //점검자가 현재월에 일상점검을 몇건 점검 했는지 확인
  //점검건수가 10건이면 안전페이를 지급하고, 10건미만이거나 10건초과이면 지급하지 않는다.
  let inCurrentMonthHdPayCountParam = {
    CMPNY_DIV: res1.list[0].CMPNY_DIV, //점검자 사업장구분
    ACCUMULATED_CONTENT_CD: '50', //안전페이 안전점검 코드
    EMP_NO: res1.list[0].CHECK_EMP_NO, //점검자 사번
    MNTH: (dayjs().$M + 1).toString().padStart(2, '0'), //현재월
    YEAR: dayjs().$y, //현재년도
  }
  let dailyCheckCountParam = {
    CMPNY_DIV: res1.list[0].CMPNY_DIV,
    EMP_NO: res1.list[0].CHECK_EMP_NO,
    DATE: dayjs().format('YYYY-MM'),
  }
  Promise.all([
    commonSearchApi({
      queryId: 'SAFCD0010_ELEC_SEARCH82',
      param: inCurrentMonthHdPayCountParam,
    }),
    commonSearchApi({
      queryId: 'SAFCD0010_ELEC_SEARCH83',
      param: dailyCheckCountParam,
    }),
  ]).then((res2) => {
    //안전페이 지급건수가 5000건보다 작고 점검건수가 10건이되고 지급내역이 없으면 안전페이 지급
    if (
      res2[0].ORESULT_CUR[0].COUNT1 <= 5000 &&
      res2[0].ORESULT_CUR[1].COUNT1 === 0 &&
      res2[1].ORESULT_CUR[0].CNT === 10
    ) {
      //안전페이 지급가능여부 확인
      let hdPayAvailCheckParam = {
        CMPNY_DIV: res1.list[0].CMPNY_DIV,
        EMP_NO: res1.list[0].CHECK_EMP_NO,
        ACCUMULATED_CONTENT_CD: '50',
        POINT: '1000',
      }
      commonSearchApi({
        queryId: 'EDUDC0020_GET_PAYMENT_INFO_PC',
        param: hdPayAvailCheckParam,
      }).then((res3) => {
        //안전페이 지급가능 하면 안전페이 1000P 지급
        if (res3.ORESULT_CUR[0].STOP_YN === 'N') {
          let hdPayParam = {
            CMPNY_DIV: res1.list[0].CMPNY_DIV,
            YEAR: dayjs().$y,
            MNTH: (dayjs().$M + 1).toString().padStart(2, '0'),
            EMP_NO: res1.list[0].CHECK_EMP_NO,
            POINT_SEQ: '',
            BSNS_CD: res1.list[0].BSNS_CD,
            DEPT_CD: res1.list[0].DEPT_CD,
            ASGN_CD: res1.list[0].ASGN_CD,
            ASGN_NAME: userStore.asgnFullNm,
            EMP_NAME: userStore.empNm,
            ORGN_DIV: userStore.userDiv,
            ACCUMULATED_CONTENT_KEY: '',
            ACCUMULATED_CONTENT_CD: '50',
            ACCUMULATED_CONTENT_DETAIL: '',
            ACCUMULATED_DATE: '',
            ACCUMULATED_POINT: '1000',
            CHANGE_POINT: '', //전환포인트
            CHANGE_DATE: '', //전환일시
            CHANGE_USER_IP: '', //전환 IP
            REMAINING_POINT: '', //잔여포인트
            CLOSE_DATE: '', //마감일
            REMARK: '', //비고
            INSERT_USER_ID: userStore.userId, //등록자
            INSERT_DATE: '', //등록일시
          }
          commonSearchApi({
            queryId: 'EDUDC0020_ADD_HDPAY',
            param: hdPayParam,
          })
        }
      })
    }
  })
}

//점검시간 최대값은 현재시각
const checkMaxTime = () => {
  // 현재시각 이후로 입력 못하도록
  
    let today = dayjs().format('YYYY-MM-DD')
    let check = dayjs(dailyCheckField.CHECK_DATE).format('YYYY-MM-DD')
    
    //입력한 점검날짜가 오늘날짜 이전이 아니면 -> 오늘날짜랑 일치하면
    if (!dayjs(check).isBefore(today)) {
      let max = dayjs().$H + ':' + dayjs().$m
      if (dailyCheckField.CHECK_TIME > max) {
        dailyCheckField.CHECK_TIME = max
      }
    }

  
  // //수정시에 점검일시가 오늘날짜 이전이면 시간변경은 자유
  // //수정시에 점검일시가 오늘날짜면 점검시간은 현재시각이 최대값
  // else {
  //   let today = dayjs().format('YYYY-MM-DD')
  //   let check = dayjs(dailyCheckField.CHECK_DATE).format('YYYY-MM-DD')

  //   //입력한 점검날짜가 오늘날짜 이전이 아니면 -> 오늘날짜랑 일치하면
  //   if (!dayjs(check).isBefore(today)) {
  //     let max = dayjs().$H + ':' + dayjs().$m
  //     if (dailyCheckField.CHECK_TIME > max) {
  //       dailyCheckField.CHECK_TIME = max
  //     }
  //   }
  // }
}

watch(
  //점검일시 변경시 변경된 일시에 로그인유저가 점검해야할 계획점검대상 조회
  () => dailyCheckField.CHECK_DATE,
  (newValue, oldValue) => {
    let param = {
      CHECK_EMP_NO: userStore.userId,
      CHECK_DATE: newValue,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_ELEC_SEARCH99',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        codeList.PLAN_CHECK_TARGET = res.ORESULT_CUR
      } else {
        codeList.PLAN_CHECK_TARGET = []
        dailyCheckField.CHECK_PLAN_SEQ = ''
      }
    })
  }
)

watch(
  () => divVio.VIO_DIV,
  (newValue, oldValue) => {
    let param = 'HHIF110' + newValue
    getCodeList(param).then((res) => {
      codeList.VIO_GDIV_NM = res.ORESULT_CUR
    })
  }
)

watch(
  () => dailyCheckField.CHECK_PLAN_SEQ,
  (newValue, oldValue) => {
    if (!oldValue && newValue) {
      //계획점검을 저장한 일상점검에 대해서만
      //수정시 계획점검 조회타이밍이랑 안맞아서 1초 딜레이줌
      //계획점검대상을 선택하면 계획점검대상에 맞는 점검주기,시작일,종료일을 찾고, 계획점검대상을 선택후 저장시 계획점검 결과등록 탭 활성화
      setTimeout(() => {
        if (codeList.PLAN_CHECK_TARGET.length > 0) {
          let checkTargetValue = codeList.PLAN_CHECK_TARGET.filter(
            (x) => x.CHECK_PLAN_SEQ == newValue
          )
          dailyCheckField.CHECK_CYCLE_SEQ = checkTargetValue[0].CHECK_CYCLE_SEQ
          dailyCheckField.CHECK_PLAN_SEQ = checkTargetValue[0].CHECK_PLAN_SEQ
          dailyCheckField.PLAN_CHECK_TARGET = checkTargetValue[0].CHECK_TARGET
          dailyCheckField.FROM_DATE = checkTargetValue[0].FROM_DATE
          dailyCheckField.TO_DATE = checkTargetValue[0].TO_DATE
        }
      }, 1000)
    } else {
      let checkTargetValue = codeList.PLAN_CHECK_TARGET.filter(
        (x) => x.CHECK_PLAN_SEQ === newValue
      )
      if (!checkTargetValue[0]) {
        return false
      }
      dailyCheckField.CHECK_CYCLE_SEQ = checkTargetValue[0].CHECK_CYCLE_SEQ
      dailyCheckField.CHECK_PLAN_SEQ = checkTargetValue[0].CHECK_PLAN_SEQ
      dailyCheckField.PLAN_CHECK_TARGET = checkTargetValue[0].CHECK_TARGET
      dailyCheckField.FROM_DATE = checkTargetValue[0].FROM_DATE
      dailyCheckField.TO_DATE = checkTargetValue[0].TO_DATE
    }
  }
)

//점검구분 감지
watch(
  () => dailyCheckField.CHECK_GUBUN,
  (newValue, oldValue) => {
    //불안전사례 :0   조치필요 : 0
    //우수사례 1      조치완료 : 1
    if (newValue === '0') {
      //점검구분이 불안전사례면 조치구분을 조치필요로
      dailyCheckField.CHECK_JOCHI = '0'
    } else {
      //점검구분이 우수사례면 조치구분을 조치완료로
      dailyCheckField.CHECK_JOCHI = '1'
    }
  }
)

//조치구분 감지
//조치구분이 조치완료가 되면 '조치내용' 비활성화
//조치필요 :0
//조치완료 :1
watch(
  () => dailyCheckField.CHECK_JOCHI,
  (newValue, oldValue) => {
    if (newValue === '1') {
      //조치구분이 조치완료가되면 조치내용 컴포넌트 비활성화,조치사진버튼 비활성화(2024.07.22 윤찬양 책임 요청으로 비활성화 로직 주석처리 추후 필요시 주석 해제)
      // readOnlyValue.JOCHI_DESC = true
      // fileUpload2.value.disableButton('btnFileUpload')
      // fileUpload2.value.disableButton('btnDownLoad')
      // fileUpload2.value.disableButton('btnDelete')
      // fileUpload2.value.disableButton('btnUpdateRefImage')
    } else {
      //조치구분이 조치필요가되면 조치내용 컴포넌트 활성화,조치사진버튼 활성화
      readOnlyValue.JOCHI_DESC = false
      fileUpload2.value.enableButton('btnFileUpload')
      fileUpload2.value.enableButton('btnDownLoad')
      fileUpload2.value.enableButton('btnDelete')
      fileUpload2.value.enableButton('btnUpdateRefImage')
    }
  }
)

watch(
  () => radioBtnValue.CHECKED_DAILY_PLAN,
  (newValue, oldValue) => {
    //계획점검연계 라디오버튼을 클릭하면 계획점검대상 셀렉트박스 활성화
    if (newValue === 'PLAN') {
      readOnlyValue.PLAN_CHECK_TARGET = false
    } else {
      readOnlyValue.PLAN_CHECK_TARGET = true
    }
  },
  {
    immediate: true,
  }
)

defineExpose({
  dailyModify,
  initField,
  setField,
})
</script>

<template>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pb-0">
      <v-sheet class="searchArea">
        <div class="sheetTitle">점검정보</div>
        <div class="d-flex mt-2">
          <i-input
            :label="$t('점검부서')"
            top-label
            width="200px"
            v-model="dailyCheckField.SENDER_DEPT_NM"
            required
            readonly
          >
          </i-input>
          <i-input
            :label="$t('점검자')"
            top-label
            width="200px"
            v-model="dailyCheckField.CHECK_EMP_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="checkEmpPopupOpen"
            @keypress.enter="checkEmpPopupOpen"
            required
            readonly
          >
          </i-input>
          <i-select
            :label="$t('점검구분')"
            top-label
            width="200px"
            v-model="dailyCheckField.CHECK_GUBUN"
            required
            :items="codeList.DAILY_DIV"
            item-title="TXT"
            item-value="COD"
          >
          </i-select>
          <i-select
            width="200px"
            :label="$t('조치구분')"
            top-label
            v-model="dailyCheckField.CHECK_JOCHI"
            required
            :items="codeList.JOCHI_DIV"
            item-title="TXT"
            item-value="COD"
          ></i-select>
          <i-select
            width="200px"
            :label="$t('안전활동구분')"
            top-label
            v-model="dailyCheckField.SAF_ACT_GUBUN"
            required
            :items="codeList.SAF_ACT_GUBUN"
            item-title="TXT"
            item-value="COD"
          ></i-select>
        </div>
        <div class="d-flex mt-2">
          <i-input
            :label="$t('점검일시')"
            top-label
            width="150px"
            type="date"
            v-model="dailyCheckField.CHECK_DATE"
            required
            :readonly="readOnlyValue.CHECK_DATE"
            :max="maxValue.CHECK_DATE_MAX"
          >
          </i-input>
          <i-input
            width="150px"
            type="time"
            class="mt-5"
            v-model="dailyCheckField.CHECK_TIME"
            :readonly="readOnlyValue.CHECK_TIME"
            @input="checkMaxTime"
          >
          </i-input>
          <i-input
            width="200px"
            :label="$t('점검장소')"
            top-label
            v-model="dailyCheckField.CHECK_PLC_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openLocationPopup"
            required
            readonly
          ></i-input>
          <i-input
            width="250px"
            :label="$t('점검장소상세')"
            top-label
            v-model="dailyCheckField.CHECK_PLC_DESC"
          ></i-input>
          <div class="mt-5">
            <v-radio-group inline v-model="radioBtnValue.CHECKED_DAILY_PLAN">
              <v-radio label="일상점검" value="DAILY"></v-radio>
              <v-radio label="계획점검 연계" value="PLAN"></v-radio>
            </v-radio-group>
          </div>

          <i-select
            label-width="80px"
            :label="$t('계획점검 대상')"
            width="200px"
            top-label
            class="ml-5"
            :items="codeList.PLAN_CHECK_TARGET"
            item-title="CHECK_TARGET"
            item-value="CHECK_PLAN_SEQ"
            v-model="dailyCheckField.CHECK_PLAN_SEQ"
            :disabled="readOnlyValue.PLAN_CHECK_TARGET"
          ></i-select>
        </div>
        <div class="d-flex mt-2">
          <i-input
            :label="$t('점검 대상물')"
            width="200px"
            top-label
            v-model="dailyCheckField.CHECK_TARGET_OBJ1_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openTargetPopup"
            required
            readonly
          >
          </i-input>
          <i-input
            width="300px"
            class="mt-5"
            v-model="dailyCheckField.CHECK_TARGET_OBJ2_NM"
            readonly
          ></i-input>
          <i-input
            width="300px"
            class="mt-5"
            v-model="dailyCheckField.CHECK_TARGET_OBJ3_NM"
            readonly
          ></i-input>
          <i-input
            :label="$t('대상조직')"
            width="200px"
            top-label
            v-model="dailyCheckField.RECEIVER_DEPT_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openDeptPopup"
            @keydown.enter="openDeptPopup"
            required
            readonly
          >
          </i-input>
          <i-input
            width="200px"
            class="mt-5"
            v-model="dailyCheckField.RECEIVER_DEPT_CD_NM"
            placeholder="검색 불가 시 수기 입력"
          ></i-input>
        </div>
        <div class="d-flex mt-2">
          <i-input
            :label="$t('잠재사고유형')"
            width="200px"
            top-label
            v-model="dailyCheckField.SAGO_DIV_L_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openSagoDivPopup"
            required
            readonly
          >
          </i-input>
          <i-input
            width="300px"
            class="mt-5"
            v-model="dailyCheckField.SAGO_DIV_M_NM"
            readonly
          ></i-input>
          <i-input
            width="300px"
            class="mt-5"
            v-model="dailyCheckField.SAGO_DIV_S_NM"
            readonly
          ></i-input>
          <span style="margin-top: 32px; margin-left: 16px; color: blue"
            >※조치내용/사진 등록 후 상단 조치구분에서 '조치완료'로 변경하여
            저장해 주시기 바랍니다.</span
          >
        </div>
        <div class="d-flex mt-2 mr-5">
          <i-textarea
            class="mt-2"
            width="50%"
            :label="$t('점검내용')"
            top-label
            v-model="dailyCheckField.CHECK_DESC"
            required
          >
          </i-textarea>
          <i-textarea
            class="mt-2"
            width="50%"
            :label="$t('조치내용')"
            top-label
            v-model="dailyCheckField.JOCHI_DESC"
            :disabled="readOnlyValue.JOCHI_DESC"
          >
          </i-textarea>
        </div>
        <div class="d-flex mt-3">
          <IUploadImageMulit
            ref="fileUpload1"
            style="width: 50%"
            title="점검사진"
            cnt="4"
            class="mr-2"
            @uploaded="uploadCheckPicture"
            @selectedRefImage="selectedCheckRefImage"
            :button-list="checkImageButton"
            :ref-image="refImage"
            image-sheet-width="50%"
            file-grid-width="50%"
            @deleted="deletedCheckRefImage"
          ></IUploadImageMulit>
          <IUploadImageMulit
            ref="fileUpload2"
            style="width: 50%"
            title="조치사진"
            cnt="4"
            class="ml-2"
            @uploaded="uploadJoChiPicture"
            @selectedRefImage="selectedJochiRefImage"
            :button-list="jochiImageButton"
            :ref-image="refImage"
            image-sheet-width="50%"
            file-grid-width="50%"
            @deleted="deletedJochiRefImage"
          ></IUploadImageMulit>
        </div>
        <div class="mt-5">
          <div v-if="readOnlyValue.RADIO_BTN">
            <div class="sheetTitle">안전수칙위반</div>
            <v-radio-group v-model="radioBtnValue.CHECKED" inline class="mt-5">
              <v-radio
                label="작업중지"
                value="WORK_STOP"
                @click="deSelectRadioBtn('WORK_STOP')"
                :disabled="readOnlyValue.DISABLED_WORK_STOP"
              ></v-radio>
              <v-radio
                label="시정통보"
                value="NOTI_CORR"
                @click="deSelectRadioBtn('NOTI_CORR')"
                :disabled="readOnlyValue.DISABLED_NOTI_CORR"
              ></v-radio>
              <v-radio
                label="절대수칙/중대성수칙/일반수칙"
                value="VIO_DIV"
                @click="deSelectRadioBtn('VIO_DIV')"
                :disabled="readOnlyValue.DISABLED_DIV_VIO"
              ></v-radio>
            </v-radio-group>
          </div>
        </div>
        <div v-if="radioBtnValue.CHECKED === 'WORK_STOP'">
          <div class="d-flex mt-4">
            <i-input
              :label="$t('작업 담당자')"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openWorkStopApprovalEmp"
              @keydown.enter="openWorkStopApprovalEmp"
              top-label
              width="200px"
              required
              v-model="workStopField.WORK_EMP_NM"
            ></i-input>
            <i-input
              :label="$t('작업 중지 사유')"
              top-label
              required
              v-model="workStopField.WORK_STOP_DESC"
            ></i-input>
          </div>
        </div>
        <div v-if="radioBtnValue.CHECKED === 'NOTI_CORR'">
          <div class="d-flex mt-4">
            <i-input
              :label="$t('시정통보 제목')"
              width="400px"
              top-label
              required
              v-model="notiCorr.NOTI_CORR_TITLE"
            ></i-input>
            <i-input
              :label="$t('시정요구 내용')"
              required
              v-model="notiCorr.NOTI_CORR_DESC"
              top-label
            ></i-input>
            <i-input
              :label="$t('회신요구일')"
              width="150px"
              type="date"
              top-label
              required
              v-model="notiCorr.REQ_DATE"
            >
            </i-input>
            <i-input
              :label="$t('승인자(안전)')"
              width="200px"
              top-label
              append-inner-icon="mdi-magnify"
              @click:appendInner="openNotiCorrEmpOpen"
              @keydown.enter="openNotiCorrEmpOpen"
              required
              v-model="notiCorr.APP_EMP_NM"
            ></i-input>
          </div>
        </div>
        <div v-if="radioBtnValue.CHECKED === 'VIO_DIV'">
          <div class="d-flex mt-4">
            <i-select
              :label="$t('위반종류')"
              width="200px"
              top-label
              required
              v-model="divVio.VIO_DIV"
              :items="codeList.VIO_GDIV"
              item-title="TXT"
              item-value="COD"
            ></i-select>
            <i-select
              :label="$t('위반항목')"
              width="200px"
              top-label
              v-model="divVio.VIO_MDIV"
              :items="codeList.VIO_GDIV_NM"
              item-title="TXT"
              item-value="COD"
            ></i-select>
            <i-input
              label-width="50px"
              width="200px"
              :label="$t('위반자')"
              top-label
              required
              append-inner-icon="mdi-magnify"
              @click:appendInner="openVioEmp"
              @keydown.enter="openVioEmp"
              v-model="divVio.VIO_EMP_NM"
            ></i-input>
            <i-input
              label-width="50px"
              width="200px"
              :label="$t('승인자(안전)')"
              top-label
              required
              append-inner-icon="mdi-magnify"
              @click:appendInner="openApprovalEmp"
              @keydown.enter="openApprovalEmp"
              v-model="divVio.APP_EMP_NM"
            ></i-input>
          </div>
        </div>
      </v-sheet>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <CommonCodePopUpSAF
    ref="sagoDivPopup"
    @selected="selectedSagoDivPopup"
  ></CommonCodePopUpSAF>
  <CommonCodePopUpSAF
    ref="locationPopup"
    @selected="selectedLocation"
  ></CommonCodePopUpSAF>
  <CommonCodePopUpSAF
    ref="checkTargetPopup"
    @selected="selectedTarget"
  ></CommonCodePopUpSAF>

  <EmpPopup ref="checkEmpPopup" @selected="selectedCheckEmp"></EmpPopup>
  <EmpPopup ref="workStopEmpPopup" @selected="selectedWorkStopEmp"></EmpPopup>
  <EmpPopup ref="notiCorrEmpPopup" @selected="selectedNotiCorrEmp"></EmpPopup>
  <EmpPopup ref="vioEmpPopup" @selected="selectedVioEmp"></EmpPopup>
  <EmpPopup
    ref="vioApprovalEmpPopup"
    @selected="selectedApprovalEmp"
  ></EmpPopup>
</template>
<style scoped lang="scss">
.sheetTitle {
  font-size: 20px;
  font-weight: bold;
}
</style>
