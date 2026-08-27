<script setup>
import { reactive, ref, provide } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import DutyPopup from '@/components/popup/DutyPopup.vue'
import HLTIB0010Tab01_Popup01 from './HLTIB0010Tab01_Popup01.vue'
import { useUserStore } from '@hiway/stores/user'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

const menuTitle = ref(null)
const emit = defineEmits(['btnCloseClick', 'tab01Saved', 'nextChangeStep', 'impResistY', 'setImpResistY'])
const empPopup = ref(null)
const empPopup2 = ref(null)
const dutyPopup = ref(null)
const unitWork1Popup = ref(null)
const unitWork2Popup = ref(null)
const unitWork3Popup = ref(null)
const userStore = useUserStore()
const dialog = ref(false)
const isAlreadySaved = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
let previousValue = '' //수정시 최초객체를 저장하고 있는 변수
const props = defineProps({
  rowData: {
    type: Object,
  },
})

//각 컴포넌트별 readonly 플래그값
const readOnlyValue = reactive({
  SAGO_BODY_NM: true,
  SAGO_EMP_NM: true, //업무상질병 발생자명
  SAGO_BODY_CD: true, //업무상질병 발생자 신체부위 코드(HHII820D)
  SAGO_BODY_NM: true, //업무상질병 발생자 신체부위 직접입력 했을때 들어가는 값
  WRK_STUS_EQP_DESC: true, //설비 변화내용
  WRK_STUS_VOL_DESC: true, //작업량 변화내용
  WRK_STUS_SPD_DESC: true, //작업속도 변화내용
  WRK_STUS_INC_DESC: true, //작업내용 변화내용
  UNIT_NM_1: true, //단위작업1
  ACT_NM_1: true, //작업설명1
  UNIT_NM_2: true, //단위작업2
  ACT_NM_2: true, //작업설명2
  UNIT_NM_3: true, //단위작업3
  ACT_NM_3: true, //작업설명3
})

//각 컴포넌트별 disable 플래그값
const disabledValue = reactive({
  UNIT_NM_1: false, //단위작업1
  UNIT_NM_2: false, //단위작업2
  UNIT_NM_3: false, //단위작업3
})

const hazardInvestigationField01 = reactive({
  CMPNY_DIV: '', //사업장구분
  ES_SEQ: '', //순번
  ES_DEPT_NM: '', //소속 부서
  ES_DEPT_CD: '', //조사자 부서코드
  ES_ASGN_FULL_NM: '', //소속명칭
  ES_ASGN_CD: '', //조사자 소속코드
  WORK_STANDARD_NM: '', //작업표준명
  WORK_STANDARD_NO: '', //작업표준번호
  WORK_STANDARD_ID: '', //작업표준ID
  WORK_STANDARD_REVISION: '', //작업표준리비전번호
  ES_DATE: '', //조사일자
  ES_DIV: '', //조사구분
  ES_EMP_NM: '', //조사자
  ES_EMP_NO: '', //조사자 사번
  ES_TEL_NO: '', //조사자 전화번호
  CORP_ASGN_CD: '', //주관부서코드
  SAGO_EMP_CMPNY_DIV: '', //업무상질병 발생자 회사 코드
  SAGO_EMP_NO: '', //업무상질병 발생자 사번
  SAGO_EMP_NM: '', //업무상질병 발생자명
  SAGO_DUTY_CD: '', //업무상질병 발생자 직종코드
  SAGO_DUTY_NM: '', //업무상질병 발생자 직종명
  SAGO_BODY_CD: '', //업무상질병 발생자 신체부위 코드(HHII820D)
  SAGO_BODY_NM: '', //업무상질병 발생자 신체부위 직접입력 했을때 들어가는 값
  WRK_STUS_EQP: '', //작업장상황_설비(HHII622A)
  WRK_STUS_EQP_DESC: '', //작업장상황_설비_변화내용:변화코드<>'1'필수입력
  WRK_STUS_VOL: '', //작업장상황_작업량(HHII622B)
  WRK_STUS_VOL_DESC: '', //작업장상황_작업량_변화내용:변화코드<>'1'필수입력
  WRK_STUS_SPD: '', //작업장상황_작업속도(HHII622C)
  WRK_STUS_SPD_DESC: '', //작업장상황_작업속도_변화내용:변화코드<>'1'필수입력
  WRK_STUS_INC: '', //작업장상황_작업내용(HHII622D)
  WRK_STUS_INC_DESC: '', //작업장상황_업무변화_작업내용:변화코드<>'1'필수입력
  UNIT_NM_1: '', //단위작업1 NM
  UNIT_NM_2: '', //단위작업2 NM
  UNIT_NM_3: '', //단위작업3 NM
  UNIT_ID_1: '', //단위작업1 ID
  UNIT_ID_2: '', //단위작업2 ID
  UNIT_ID_3: '', //단위작업3 ID
  UNIT_SEQ_1: '', //단위작업1 SEQ
  UNIT_SEQ_2: '', //단위작업2 SEQ
  UNIT_SEQ_3: '', //단위작업3 SEQ
  UNIT_GUBUN_1: '', //단위작업1 구분
  UNIT_GUBUN_2: '', //단위작업2 구분
  UNIT_GUBUN_3: '', //단위작업3 구분
  ACT_ID_1: '', //작업행동1 ID
  ACT_ID_2: '', //작업행동2 ID
  ACT_ID_3: '', //작업행동3 ID
  ACT_NM_1: '', //작업설명1
  ACT_NM_2: '', //작업설명2
  ACT_NM_3: '', //작업설명3
  ACT_SORT_1: '', //작업설명 정렬순서1
  ACT_SORT_2: '', //작업설명 정렬순서2
  ACT_SORT_3: '', //작업설명 정렬순서3
  CLOSE_DATE: '', //조사완료일
  OMIT_YN: '', //생략여부
  ES_STUS: '', //진행단계
  SHORT_WORK_YN: 'N', //단기간작업
  INTERM_WORK_YN: 'N', //간헐적작업
  IMP_RESIST_YN: '', //개선등록여부
  BSNS_CD: '', //작업표준 사업부
  DEPT_CD: '', //작업표준 부서코드
})

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnNextStep') {
    //개선등록 완료되면 보여주기만한다.
    //일반사용자일때도 보여주기만 한다.
    if (props.rowData.IMP_RESIST_YN === 'Y' && props.rowData.ES_SEQ) {
      emit('setImpResistY')
      emit('impResistY')
    } else {
      saveTab01()
    }
  } else if (btn.id === 'btnTemporaryStorage') {
    tempSaveTab01()
  } else if (btn.id === 'btnClose') {
    emit('btnCloseClick', 'tab01')
  } else if (btn.id === 'btnInvDelete') {
    let result = await vm.$swal({
      title: `지금까지 등록된 모든 조사 내용이 삭제됩니다
              삭제하시겠습니까?`,
      showCancelButton: true,
    })
    if (result.isConfirmed) {
      let deleteData = []
      let deleteParam = {
        CMPNY_DIV: userStore.cmpnyDiv,
        WORK_STANDARD_ID: hazardInvestigationField01.WORK_STANDARD_ID,
        ES_SEQ: hazardInvestigationField01.ES_SEQ,
      }
      deleteData.push(deleteParam)
      commonExecuteApi({
        queryId: 'HLTIB0010_DELETE_04',
        list: deleteData,
      }).then((res) => {
        emit('btnCloseClick')
      })
    }
  }
}

const codeList = reactive({
  ES_DIV: [], //조사구분
  SAGO_BODY_CD: [], //신체부위
  WRK_STUS_EQP: [], //설비
  WRK_STUS_VOL: [], //작업량
  WRK_STUS_SPD: [], //작업속도
  WRK_STUS_INC: [], //작업내용
})

const initCodeList = () => {
  Promise.all([
    //조사구분
    getCodeList('HHII620'),
    //신체부위
    getCodeList('HHII820D'),
    //설비
    getCodeList('HHII622A'),
    //작업량
    getCodeList('HHII622B'),
    //작업속도
    getCodeList('HHII622C'),
    //업무변화
    getCodeList('HHII622D'),
  ]).then((res) => {
    codeList.ES_DIV = res[0].ORESULT_CUR
    codeList.SAGO_BODY_CD = res[1].ORESULT_CUR
    codeList.WRK_STUS_EQP = res[2].ORESULT_CUR
    codeList.WRK_STUS_VOL = res[3].ORESULT_CUR
    codeList.WRK_STUS_SPD = res[4].ORESULT_CUR
    codeList.WRK_STUS_INC = res[5].ORESULT_CUR
  })
}

//수정여부 확인
const checkModify = async () => {
  let result = await vm.$swal({
    title: `변경된 내용이 있습니다.
                저장하시겠습니까?`,
    showCancelButton: true,
  })
  return result.isConfirmed
}

//인원팝업 오픈 이벤트
const openEmpPopup = () => {
  if (props.rowData.isAdmin) {
    //관리자일때는 모든인원조회
    empPopup.value.openPopup({
      EMP_NM: hazardInvestigationField01.SAGO_EMP_NM,
    })
  } else {
    //관리자가 아니면 본인 소속 인원만 조회
    empPopup.value.openPopup({
      CMPNY_DIV_D: false, // 회사구분
      USER_DIV_D: false,
      BSNS_CD_D: false,
      DEPT_CD_D: false,
      USER_DIV: userStore.userDiv,
      BSNS_CD: userStore.bsnsCd,
      DEPT_CD: userStore.deptCd,
      EMP_NM: hazardInvestigationField01.SAGO_EMP_NM,
    })
  }
}

//인원팝업 선택 이벤트
const onEmpSelected = (val) => {
  hazardInvestigationField01.SAGO_EMP_NO = val.EMP_NO
  hazardInvestigationField01.SAGO_EMP_NM = val.EMP_NM
}

/*
2025.09.08 김현재 작성
임은희 책임 요청으로 조사자 수정가능하도록 수정
*/
//조사자 인원팝업 오픈 이벤트 여기
const openEmpPopup2 = () => {
  empPopup2.value.openPopup({ EMP_NM: hazardInvestigationField01.EMP_NM })
}

//조사자 인원팝업 선택 이벤트
const onEmpSelected2 = (val) => {
  hazardInvestigationField01.ES_EMP_NO = val.EMP_NO //조사자 사번
  hazardInvestigationField01.ES_EMP_NM = val.EMP_NM //조사자 성명
  hazardInvestigationField01.JOB_TIT_CD = val.JOB_TIT_CD //조사자 직위코드
  hazardInvestigationField01.JOB_TIT_NM = val.JOB_TIT_NM //조사자 직위명
  hazardInvestigationField01.UNT_DUTY_CD = val.UNT_DUTY_CD //조사자 단위직무 코드
  hazardInvestigationField01.ES_DEPT_CD = val.DEPT_CD //조사자 부서코드
  hazardInvestigationField01.ES_ASGN_CD = val.ASGN_CD //조사자 소속코드
  hazardInvestigationField01.ES_TEL_NO = val.TEL_NO //조사자 전화번호
  hazardInvestigationField01.ES_DEPT_NM = val.DEPT_NM //조사자 부서명
  hazardInvestigationField01.ES_ASGN_FULL_NM = val.ASGN_NM //조사자 소속
}

onMounted(() => {
  initCodeList()
  initField()
  //일반사용자면 다음단계 버튼 안보이기
  if (props.rowData.nomalUser) {
    menuTitle.value.visibleBtn('btnNextStep', false)
  }
  //조사내용 등록이 되어있지 않으면 조사내용삭제 버튼 안보이기
  if (!props.rowData.ES_SEQ) {
    menuTitle.value.visibleBtn('btnInvDelete', false)
  }

  //개선등록 완료 되었는데 종결 안되었을때는 임시저장 안보이기
  if (props.rowData.IMP_RESIST_YN === 'Y' && props.rowData.ES_STUS_COD != 7) {
    menuTitle.value.visibleBtn('btnTemporaryStorage', false)
  } else {
    menuTitle.value.visibleBtn('btnTemporaryStorage', true)
  }
})

//팝업 오픈시 초기값 세팅
const initField = () => {
  //최초등록일때
  hazardInvestigationField01.ES_DEPT_NM = props.rowData.DEPT_NM //소속부서
  hazardInvestigationField01.ES_DEPT_CD = userStore.deptCd
  hazardInvestigationField01.ES_ASGN_CD = userStore.asgnCd
  hazardInvestigationField01.ES_ASGN_FULL_NM = userStore.asgnFullNm
  hazardInvestigationField01.ES_DATE = dayjs().format('YYYY-MM-DD') //조사일자(오늘날짜)
  hazardInvestigationField01.ES_EMP_NM = userStore.empNm //조사자 성명
  hazardInvestigationField01.ES_EMP_NO = userStore.empNo //조사자 사번
  hazardInvestigationField01.ES_TEL_NO = userStore.telNo //조사자 전화번호
  hazardInvestigationField01.JOB_TIT_CD = userStore.jobTitCd
  hazardInvestigationField01.JOB_TIT_NM = userStore.jobTitNm
  hazardInvestigationField01.UNT_DUTY_CD = userStore.untDutyCd
  hazardInvestigationField01.DEPT_CD = props.rowData.DEPT_CD
  hazardInvestigationField01.BSNS_CD = props.rowData.BSNS_CD
  hazardInvestigationField01.WORK_STANDARD_NM = props.rowData.WORK_STANDARD_NM //작업표준명
  hazardInvestigationField01.WORK_STANDARD_NO = props.rowData.WORK_STANDARD_NO //작업표준번호
  hazardInvestigationField01.WORK_STANDARD_ID = props.rowData.WORK_STANDARD_ID //작업표준ID
  previousValue = _.cloneDeep(hazardInvestigationField01) // 최초 상태 저장
}

//단위작업1 팝업 오픈
//그룹화된 작업표준이면 모두 직접입력만 뜨도록
//2025.09.05 김현재 작성 임은희 책임 요청으로 그룹화된 작업표준이어도 단위작업 불러오도록 수정
const openUnitWork1Popup = () => {
  //if (!props.rowData.GROUP_YN) {
  unitWork1Popup.value.openPopup(props.rowData.WORK_STANDARD_ID)
  //} else {
  //  unitWork1Popup.value.openPopup()
  //}
}

//단위작업2 팝업 오픈
//그룹화된 작업표준이면 모두 직접입력만 뜨도록
//2025.09.05 김현재 작성 임은희 책임 요청으로 그룹화된 작업표준이어도 단위작업 불러오도록 수정
const openUnitWork2Popup = () => {
  //if (!props.rowData.GROUP_YN) {
  unitWork2Popup.value.openPopup(props.rowData.WORK_STANDARD_ID)
  //} else {
  //  unitWork2Popup.value.openPopup()
  //}
}

//단위작업3 팝업 오픈
//그룹화된 작업표준이면 모두 직접입력만 뜨도록
//2025.09.05 김현재 작성 임은희 책임 요청으로 그룹화된 작업표준이어도 단위작업 불러오도록 수정
const openUnitWork3Popup = () => {
  //if (!props.rowData.GROUP_YN) {
  unitWork3Popup.value.openPopup(props.rowData.WORK_STANDARD_ID)
  //} else {
  //  unitWork3Popup.value.openPopup()
  //}
}

//단위작업1 팝업 선택 이벤트
const selectedUnitWork1 = (val) => {
  if (val.UNIT_ID === hazardInvestigationField01.UNIT_ID_2 || val.UNIT_ID === hazardInvestigationField01.UNIT_ID_3) {
    Message.warn(t('같은 단위작업이 선택되어 있습니다. 다른 단위작업을 선택 해주세요.'))
    return false
  }
  //직접입력을 선택하지 않았을때
  if (val.UNIT_NM !== '직접입력') {
    hazardInvestigationField01.UNIT_SEQ_1 = val.UNIT_SORT
    hazardInvestigationField01.UNIT_ID_1 = val.UNIT_ID
    hazardInvestigationField01.UNIT_NM_1 = val.UNIT_NM
    readOnlyValue.UNIT_NM_1 = true //단위작업1 비활성화
    readOnlyValue.ACT_NM_1 = true //작업설명1 비활성화
    //단위작업 선택하면 단위작업에 해당하는 작업설명 조회
    let param = {
      WORK_STANDARD_ID: props.rowData.WORK_STANDARD_ID,
      UNIT_ID: hazardInvestigationField01.UNIT_ID_1,
    }
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_03',
      param: param,
    }).then((res) => {
      //readOnlyValue.ACT_NM_1 = false //2025.09.01 김현재 작성 임은희 책임 요청으로 직접입력 아닐때도 작업설명 수정가능하도록 수정
      hazardInvestigationField01.ACT_ID_1 = res.ORESULT_CUR[0].ACT_ID
      hazardInvestigationField01.ACT_NM_1 = res.ORESULT_CUR[0].ACT_NM
      hazardInvestigationField01.ACT_SORT_1 = res.ORESULT_CUR[0].ACT_SORT
    })
  } else {
    //직접입력 선택했을때
    hazardInvestigationField01.UNIT_SEQ_1 = val.UNIT_SORT
    hazardInvestigationField01.UNIT_ID_1 = val.UNIT_ID
    hazardInvestigationField01.UNIT_NM_1 = ''
    hazardInvestigationField01.ACT_ID_1 = ''
    hazardInvestigationField01.ACT_NM_1 = ''
    hazardInvestigationField01.ACT_SORT_1 = ''
    readOnlyValue.UNIT_NM_1 = false //단위작업1 비활성화 해제
    readOnlyValue.ACT_NM_1 = false //작업설명1 비활성화 해제
  }
}

//단위작업2 팝업 선택 이벤트
const selectedUnitWork2 = (val) => {
  if (val.UNIT_ID === hazardInvestigationField01.UNIT_ID_1 || val.UNIT_ID === hazardInvestigationField01.UNIT_ID_3) {
    Message.warn(t('같은 단위작업이 선택되어 있습니다. 다른 단위작업을 선택 해주세요.'))
    return false
  }
  //직접입력을 선택하지 않았을때
  if (val.UNIT_NM !== '직접입력') {
    hazardInvestigationField01.UNIT_SEQ_2 = val.UNIT_SORT
    hazardInvestigationField01.UNIT_ID_2 = val.UNIT_ID
    hazardInvestigationField01.UNIT_NM_2 = val.UNIT_NM
    readOnlyValue.UNIT_NM_2 = true //단위작업2 비활성화
    readOnlyValue.ACT_NM_2 = true //작업설명2 비활성화
    //단위작업 선택하면 단위작업에 해당하는 작업설명 조회
    let param = {
      WORK_STANDARD_ID: props.rowData.WORK_STANDARD_ID,
      UNIT_ID: hazardInvestigationField01.UNIT_ID_2,
    }
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_03',
      param: param,
    }).then((res) => {
      //readOnlyValue.ACT_NM_2 = false //2025.09.01 김현재 작성 임은희 책임 요청으로 직접입력 아닐때도 작업설명 수정가능하도록 수정
      hazardInvestigationField01.ACT_ID_2 = res.ORESULT_CUR[0].ACT_ID
      hazardInvestigationField01.ACT_NM_2 = res.ORESULT_CUR[0].ACT_NM
      hazardInvestigationField01.ACT_SORT_2 = res.ORESULT_CUR[0].ACT_SORT
    })
  } else {
    //직접입력 선택했을때
    hazardInvestigationField01.UNIT_SEQ_2 = val.UNIT_SORT
    hazardInvestigationField01.UNIT_ID_2 = val.UNIT_ID
    hazardInvestigationField01.UNIT_NM_2 = ''
    hazardInvestigationField01.ACT_ID_2 = ''
    hazardInvestigationField01.ACT_NM_2 = ''
    hazardInvestigationField01.ACT_SORT_2 = ''
    readOnlyValue.UNIT_NM_2 = false //단위작업2 비활성화 해제
    readOnlyValue.ACT_NM_2 = false //작업설명2 비활성화 해제
  }
}
//단위작업3 팝업 선택 이벤트
const selectedUnitWork3 = (val) => {
  if (val.UNIT_ID === hazardInvestigationField01.UNIT_ID_1 || val.UNIT_ID === hazardInvestigationField01.UNIT_ID_2) {
    Message.warn(t('같은 단위작업이 선택되어 있습니다. 다른 단위작업을 선택 해주세요.'))
    return false
  }
  //직접입력을 선택하지 않았을때
  if (val.UNIT_NM !== '직접입력') {
    hazardInvestigationField01.UNIT_SEQ_3 = val.UNIT_SORT
    hazardInvestigationField01.UNIT_ID_3 = val.UNIT_ID
    hazardInvestigationField01.UNIT_NM_3 = val.UNIT_NM
    readOnlyValue.UNIT_NM_3 = true //단위작업3 비활성화
    readOnlyValue.ACT_NM_3 = true //작업설명3 비활성화
    //단위작업 선택하면 단위작업에 해당하는 작업설명 조회
    let param = {
      WORK_STANDARD_ID: props.rowData.WORK_STANDARD_ID,
      UNIT_ID: hazardInvestigationField01.UNIT_ID_3,
    }
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_03',
      param: param,
    }).then((res) => {
      // readOnlyValue.ACT_NM_3 = false //2025.09.01 김현재 작성 임은희 책임 요청으로 직접입력 아닐때도 작업설명 수정가능하도록 수정
      hazardInvestigationField01.ACT_ID_3 = res.ORESULT_CUR[0].ACT_ID
      hazardInvestigationField01.ACT_NM_3 = res.ORESULT_CUR[0].ACT_NM
      hazardInvestigationField01.ACT_SORT_3 = res.ORESULT_CUR[0].ACT_SORT
    })
  } else {
    //직접입력 선택했을때
    hazardInvestigationField01.UNIT_SEQ_3 = val.UNIT_SORT
    hazardInvestigationField01.UNIT_ID_3 = val.UNIT_ID
    hazardInvestigationField01.UNIT_NM_3 = ''
    hazardInvestigationField01.ACT_ID_3 = ''
    hazardInvestigationField01.ACT_NM_3 = ''
    hazardInvestigationField01.ACT_SORT_3 = ''
    readOnlyValue.UNIT_NM_3 = false //단위작업3 비활성화 해제
    readOnlyValue.ACT_NM_3 = false //작업설명3 비활성화 해제
  }
}

//직종 팝업 오픈 이벤트
const openDutyPopup = () => {
  dutyPopup.value.openPopup({ BSNS_CD: userStore.bsnsCd, DEPT_CD: userStore.deptCd })
}

//직종 선택 이벤트
const selectedDutyPopup = (val) => {
  hazardInvestigationField01.SAGO_DUTY_CD = val.UNT_DUTY_CD
  hazardInvestigationField01.SAGO_DUTY_NM = val.UNT_DUTY_NM
}

//임시저장 관련 로직 시작 (임시저장일때는 필수값이 없다.)
const tempSaveTab01 = async () => {
  let isChanged = _.isEqual(hazardInvestigationField01, previousValue)
  //변경사항이 존재한다.
  if (!isChanged) {
    if (await checkModify()) {
      new saveFlowHelper(vm, t).setQuery(saveData02).showMessage(false).setAfter(afterSave02).run()
    }
  } else {
    //변경사항이 존재하지 않는다.
    new saveFlowHelper(vm, t)
      .setQuery(saveData02)
      .setConfirmMessage('임시저장 하시겠습니까?')
      .setAfter(afterSave02)
      .run()
  }
}

const saveData02 = async () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    ES_SEQ: hazardInvestigationField01.ES_SEQ,
    ES_DEPT_NM: hazardInvestigationField01.ES_DEPT_NM, //소속 부서
    ES_DEPT_CD: hazardInvestigationField01.ES_DEPT_CD, //조사자 부서코드
    ES_ASGN_FULL_NM: hazardInvestigationField01.ES_ASGN_FULL_NM, //소속명칭
    ES_ASGN_CD: hazardInvestigationField01.ES_ASGN_CD, //조사자 소속코드
    WORK_STANDARD_NM: props.rowData.WORK_STANDARD_NM
      ? props.rowData.WORK_STANDARD_NM
      : hazardInvestigationField01.WORK_STANDARD_NM, //작업표준명
    WORK_STANDARD_NO: props.rowData.WORK_STANDARD_NO
      ? props.rowData.WORK_STANDARD_NO
      : hazardInvestigationField01.WORK_STANDARD_NO, //작업표준번호
    WORK_STANDARD_ID: props.rowData.WORK_STANDARD_ID
      ? props.rowData.WORK_STANDARD_ID
      : hazardInvestigationField01.WORK_STANDARD_ID, //작업표준ID
    WORK_STANDARD_REVISION: props.rowData.WORK_STANDARD_REVISION
      ? props.rowData.WORK_STANDARD_REVISION
      : hazardInvestigationField01.WORK_STANDARD_REVISION, //작업표준리비전번호
    ES_DATE: hazardInvestigationField01.ES_DATE, //조사일자
    ES_DIV: hazardInvestigationField01.ES_DIV, //조사구분
    ES_EMP_NM: hazardInvestigationField01.ES_EMP_NM, //조사자
    ES_EMP_NO: hazardInvestigationField01.ES_EMP_NO, //조사자 사번
    ES_TEL_NO: hazardInvestigationField01.ES_TEL_NO, //조사자 전화번호
    USER_DIV: userStore.userDiv, //소속구분
    UNT_DUTY_CD: hazardInvestigationField01.UNT_DUTY_CD, //단위직무코드
    JOB_TIT_NM: hazardInvestigationField01.JOB_TIT_NM, //직군명
    JOB_TIT_CD: hazardInvestigationField01.JOB_TIT_CD, //직군코드
    SAGO_EMP_CMPNY_DIV: hazardInvestigationField01.SAGO_EMP_CMPNY_DIV, //업무상질병 발생자 회사 코드
    SAGO_EMP_NO: hazardInvestigationField01.SAGO_EMP_NO, //업무상질병 발생자 사번
    SAGO_EMP_NM: hazardInvestigationField01.SAGO_EMP_NM, //업무상질병 발생자명
    SAGO_DUTY_CD: hazardInvestigationField01.SAGO_DUTY_CD, //업무상질병 발생자 직종코드
    SAGO_DUTY_NM: hazardInvestigationField01.SAGO_DUTY_NM, //업무상질병 발생자 직종명
    SAGO_BODY_CD: hazardInvestigationField01.SAGO_BODY_CD,
    SAGO_BODY_NM: hazardInvestigationField01.SAGO_BODY_NM,
    SHORT_WORK_YN: hazardInvestigationField01.SHORT_WORK_YN, //단기간작업
    INTERM_WORK_YN: hazardInvestigationField01.INTERM_WORK_YN, //간헐적작업
    WRK_STUS_EQP: hazardInvestigationField01.WRK_STUS_EQP, //작업장상황_설비(HHII622A)
    WRK_STUS_EQP_DESC: hazardInvestigationField01.WRK_STUS_EQP_DESC, //작업장상황_설비_변화내용:변화코드<>'1'필수입력
    WRK_STUS_VOL: hazardInvestigationField01.WRK_STUS_VOL, //작업장상황_작업량(HHII622B)
    WRK_STUS_VOL_DESC: hazardInvestigationField01.WRK_STUS_VOL_DESC, //작업장상황_작업량_변화내용:변화코드<>'1'필수입력
    WRK_STUS_SPD: hazardInvestigationField01.WRK_STUS_SPD, //작업장상황_작업속도(HHII622C)
    WRK_STUS_SPD_DESC: hazardInvestigationField01.WRK_STUS_SPD_DESC, //작업장상황_작업속도_변화내용:변화코드<>'1'필수입력
    WRK_STUS_INC: hazardInvestigationField01.WRK_STUS_INC, //작업장상황_작업내용(HHII622D)
    WRK_STUS_INC_DESC: hazardInvestigationField01.WRK_STUS_INC_DESC, //작업장상황_업무변화_작업내용:변화코드<>'1'필수입력
    UNIT_NM_1: hazardInvestigationField01.UNIT_NM_1, //단위작업1 NM
    UNIT_NM_2: hazardInvestigationField01.UNIT_NM_2, //단위작업2 NM
    UNIT_NM_3: hazardInvestigationField01.UNIT_NM_3, //단위작업3 NM
    UNIT_ID_1: hazardInvestigationField01.UNIT_ID_1, //단위작업1 ID
    UNIT_ID_2: hazardInvestigationField01.UNIT_ID_2, //단위작업2 ID
    UNIT_ID_3: hazardInvestigationField01.UNIT_ID_3, //단위작업3 ID
    UNIT_SEQ_1: hazardInvestigationField01.UNIT_SEQ_1, //단위작업1 SORT
    UNIT_SEQ_2: hazardInvestigationField01.UNIT_SEQ_2, //단위작업2 SORT
    UNIT_SEQ_3: hazardInvestigationField01.UNIT_SEQ_3, //단위작업3 SORT
    ACT_ID_1: hazardInvestigationField01.ACT_ID_1, //작업행동1 ID
    ACT_ID_2: hazardInvestigationField01.ACT_ID_2, //작업행동2 ID
    ACT_ID_3: hazardInvestigationField01.ACT_ID_3, //작업행동3 ID
    ACT_NM_1: hazardInvestigationField01.ACT_NM_1, //작업설명1
    ACT_NM_2: hazardInvestigationField01.ACT_NM_2, //작업설명2
    ACT_NM_3: hazardInvestigationField01.ACT_NM_3, //작업설명3
    ACT_SORT_1: hazardInvestigationField01.ACT_SORT_1, //작업설명 정렬순서1
    ACT_SORT_2: hazardInvestigationField01.ACT_SORT_2, //작업설명 정렬순서2
    ACT_SORT_3: hazardInvestigationField01.ACT_SORT_3, //작업설명 정렬순서3
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_14',
    list: saveParam,
  })
}

const afterSave02 = (res) => {
  Message.success(t('저장되었습니다.'))
  //저장하고 바로 수정했을때는 OUT_RES_ES_SEQ가 NULL로 넘어와서 있을때만 넣어주는걸로
  hazardInvestigationField01.ES_SEQ = res.list[0].OUT_RES_ES_SEQ
  isAlreadySaved.value = true
  Object.assign(previousValue, hazardInvestigationField01) //저장하고나서 원본 데이터에 값 덮어쓰기 (만약 다음 화면에서 이전단계 눌렀을때 변경사항 체크하기 위해서)
  res.tempSaved = true
  emit('tab01Saved', res)
}

//임시저장관련 로직 끝

// const tempSaveTab01 = async () => {
//   let isChanged = _.isEqual(hazardInvestigationField01, previousValue)
//   //변경사항이 존재한다.
//   if (!isChanged) {
//     if (await checkModify()) {
//       new saveFlowHelper(vm, t).setQuery(saveData02).showMessage(false).setAfter(afterSave02).run()
//     }
//   } else {
//     //변경사항이 존재하지 않는다.
//     new saveFlowHelper(vm, t)
//       .setQuery(saveData02)
//       .setConfirmMessage('임시저장 하시겠습니까?')
//       .setAfter(afterSave02)
//       .run()
//   }
// }

//저장관련 로직 시작
const saveTab01 = async () => {
  let isChanged = _.isEqual(hazardInvestigationField01, previousValue)
  //변경된 데이터가 있을때
  if (!isChanged) {
    let result = await beforeSave01() //필수값을 모두 입력했다.
    //변경사항이 있다.
    if (result) {
      //필수값 모두 입력했다.
      if (await checkModify()) {
        //저장하시겠습니까?에서 예를 눌렀다.
        new saveFlowHelper(vm, t).setQuery(saveData01).showMessage(false).setAfter(afterSave01).run()
      }
    }
  }
  //변경된 데이터가 없을때
  else {
    if (props.rowData.MODIFY) {
      //수정일때
      let result = await beforeSave01() //필수값을 모두 입력했다.
      if (result) {
        emit('nextChangeStep')
      }
    } else {
      //처음팝업열고 아무 데이터입력 안하고 다음단계 클릭했을때
      new saveFlowHelper(vm, t).setBefore(beforeSave01).setQuery(saveData01).setAfter(afterSave01).run()
    }
  }
}

const beforeSave01 = async () => {
  // let isChanged = _.isEqual(hazardInvestigationField01, previousValue)
  //조사구분 필수값
  if (!hazardInvestigationField01.ES_DIV) {
    Message.warn(t('조사 구분은 필수값 입니다.'))
    return false
  }
  //조사구분이 수시일때는 업무상 질병대상자,신체부위 필수값
  if (hazardInvestigationField01.ES_DIV === 'A2') {
    if (!hazardInvestigationField01.SAGO_EMP_NO) {
      Message.warn(t('업무상질병 대상자는 필수값 입니다.'))
      return false
    } else if (!hazardInvestigationField01.SAGO_BODY_CD) {
      Message.warn(t('신체부위는 필수값 입니다.'))
      return false
    } else if (hazardInvestigationField01.SAGO_BODY_CD === '999' && !hazardInvestigationField01.SAGO_BODY_NM) {
      Message.warn(t('신체부위 코드값이 직접입력일때 우측 텍스트박스에 값을 입력해주세요.'))
      return false
    }
  }
  if (!hazardInvestigationField01.SAGO_DUTY_CD) {
    Message.warn(t('직종은 필수값입니다.'))
    return false
  }
  if (!hazardInvestigationField01.WRK_STUS_EQP) {
    Message.warn(t('작업 상황 변화 - 설비를 입력해주세요.'))
    return false
  }

  if (hazardInvestigationField01.WRK_STUS_EQP === '2' && !hazardInvestigationField01.WRK_STUS_EQP_DESC) {
    Message.warn(t('작업 상황 변화 - 설비 변화내용을 입력해주세요.'))
    return false
  }

  if (!hazardInvestigationField01.WRK_STUS_VOL) {
    Message.warn(t('작업 상황 변화 - 작업량을 입력해주세요.'))
    return false
  }

  if (hazardInvestigationField01.WRK_STUS_VOL === '4' && !hazardInvestigationField01.WRK_STUS_VOL_DESC) {
    Message.warn(t('작업 상황 변화 - 작업량 변화내용을 입력해주세요.'))
    return false
  }

  if (!hazardInvestigationField01.WRK_STUS_SPD) {
    Message.warn(t('작업 상황 변화 - 작업 속도를 입력해주세요.'))
    return false
  }
  if (hazardInvestigationField01.WRK_STUS_SPD === '4' && !hazardInvestigationField01.WRK_STUS_SPD_DESC) {
    Message.warn(t('작업 상황 변화 - 작업 속도 변화내용을 입력해주세요.'))
    return false
  }

  if (!hazardInvestigationField01.WRK_STUS_INC) {
    Message.warn(t('작업 상황 변화 - 작업 내용을 입력해주세요.'))
    return false
  }
  if (hazardInvestigationField01.WRK_STUS_INC === '5' && !hazardInvestigationField01.WRK_STUS_INC_DESC) {
    Message.warn(t('작업 상황 변화 - 작업 내용 변화내용을 입력해주세요.'))
    return false
  }

  if (!hazardInvestigationField01.UNIT_NM_1) {
    Message.warn(t('단위작업1을 입력해주세요.'))
    return false
  }
  if (!hazardInvestigationField01.ACT_NM_1) {
    Message.warn(t('작업설명1을 입력해주세요.'))
    return false
  }
  if (!hazardInvestigationField01.UNIT_NM_2) {
    Message.warn(t('단위작업2을 입력해주세요.'))
    return false
  }
  if (!hazardInvestigationField01.ACT_NM_2) {
    Message.warn(t('작업설명2을 입력해주세요.'))
    return false
  }
  if (!hazardInvestigationField01.UNIT_NM_3) {
    Message.warn(t('단위작업3을 입력해주세요.'))
    return false
  }
  if (!hazardInvestigationField01.ACT_NM_3) {
    Message.warn(t('단위작업3을 입력해주세요.'))
    return false
  }
  return true
}

const saveData01 = async () => {
  let saveParam = []

  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    ES_SEQ: hazardInvestigationField01.ES_SEQ,
    ES_DEPT_NM: hazardInvestigationField01.ES_DEPT_NM, //소속 부서
    ES_DEPT_CD: hazardInvestigationField01.ES_DEPT_CD, //조사자 부서코드
    ES_ASGN_FULL_NM: hazardInvestigationField01.ES_ASGN_FULL_NM, //소속명칭
    ES_ASGN_CD: hazardInvestigationField01.ES_ASGN_CD, //조사자 소속코드
    WORK_STANDARD_NM: props.rowData.WORK_STANDARD_NM
      ? props.rowData.WORK_STANDARD_NM
      : hazardInvestigationField01.WORK_STANDARD_NM, //작업표준명
    WORK_STANDARD_NO: props.rowData.WORK_STANDARD_NO
      ? props.rowData.WORK_STANDARD_NO
      : hazardInvestigationField01.WORK_STANDARD_NO, //작업표준번호
    WORK_STANDARD_ID: props.rowData.WORK_STANDARD_ID
      ? props.rowData.WORK_STANDARD_ID
      : hazardInvestigationField01.WORK_STANDARD_ID, //작업표준ID
    WORK_STANDARD_REVISION: props.rowData.WORK_STANDARD_REVISION
      ? props.rowData.WORK_STANDARD_REVISION
      : hazardInvestigationField01.WORK_STANDARD_REVISION, //작업표준리비전번호
    ES_DATE: hazardInvestigationField01.ES_DATE, //조사일자
    ES_DIV: hazardInvestigationField01.ES_DIV, //조사구분
    ES_EMP_NM: hazardInvestigationField01.ES_EMP_NM, //조사자
    ES_EMP_NO: hazardInvestigationField01.ES_EMP_NO, //조사자 사번
    ES_TEL_NO: hazardInvestigationField01.ES_TEL_NO, //조사자 전화번호
    USER_DIV: userStore.userDiv, //소속구분
    UNT_DUTY_CD: hazardInvestigationField01.UNT_DUTY_CD, //단위직무코드
    JOB_TIT_NM: hazardInvestigationField01.JOB_TIT_NM, //직군명
    JOB_TIT_CD: hazardInvestigationField01.JOB_TIT_CD, //직군코드
    ES_DIV: hazardInvestigationField01.ES_DIV, //조사구분
    SAGO_EMP_CMPNY_DIV: hazardInvestigationField01.SAGO_EMP_CMPNY_DIV, //업무상질병 발생자 회사 코드
    SAGO_EMP_NO: hazardInvestigationField01.SAGO_EMP_NO, //업무상질병 발생자 사번
    SAGO_EMP_NM: hazardInvestigationField01.SAGO_EMP_NM, //업무상질병 발생자명
    SAGO_DUTY_CD: hazardInvestigationField01.SAGO_DUTY_CD, //업무상질병 발생자 직종코드
    SAGO_DUTY_NM: hazardInvestigationField01.SAGO_DUTY_NM, //업무상질병 발생자 직종명
    SAGO_BODY_CD: hazardInvestigationField01.SAGO_BODY_CD,
    SAGO_BODY_NM: hazardInvestigationField01.SAGO_BODY_NM,
    SHORT_WORK_YN: hazardInvestigationField01.SHORT_WORK_YN, //단기간작업
    INTERM_WORK_YN: hazardInvestigationField01.INTERM_WORK_YN, //간헐적작업
    WRK_STUS_EQP: hazardInvestigationField01.WRK_STUS_EQP, //작업장상황_설비(HHII622A)
    WRK_STUS_EQP_DESC: hazardInvestigationField01.WRK_STUS_EQP_DESC, //작업장상황_설비_변화내용:변화코드<>'1'필수입력
    WRK_STUS_VOL: hazardInvestigationField01.WRK_STUS_VOL, //작업장상황_작업량(HHII622B)
    WRK_STUS_VOL_DESC: hazardInvestigationField01.WRK_STUS_VOL_DESC, //작업장상황_작업량_변화내용:변화코드<>'1'필수입력
    WRK_STUS_SPD: hazardInvestigationField01.WRK_STUS_SPD, //작업장상황_작업속도(HHII622C)
    WRK_STUS_SPD_DESC: hazardInvestigationField01.WRK_STUS_SPD_DESC, //작업장상황_작업속도_변화내용:변화코드<>'1'필수입력
    WRK_STUS_INC: hazardInvestigationField01.WRK_STUS_INC, //작업장상황_작업내용(HHII622D)
    WRK_STUS_INC_DESC: hazardInvestigationField01.WRK_STUS_INC_DESC, //작업장상황_업무변화_작업내용:변화코드<>'1'필수입력
    UNIT_NM_1: hazardInvestigationField01.UNIT_NM_1, //단위작업1 NM
    UNIT_NM_2: hazardInvestigationField01.UNIT_NM_2, //단위작업2 NM
    UNIT_NM_3: hazardInvestigationField01.UNIT_NM_3, //단위작업3 NM
    UNIT_ID_1: hazardInvestigationField01.UNIT_ID_1, //단위작업1 ID
    UNIT_ID_2: hazardInvestigationField01.UNIT_ID_2, //단위작업2 ID
    UNIT_ID_3: hazardInvestigationField01.UNIT_ID_3, //단위작업3 ID
    UNIT_SEQ_1: hazardInvestigationField01.UNIT_SEQ_1, //단위작업1 SORT
    UNIT_SEQ_2: hazardInvestigationField01.UNIT_SEQ_2, //단위작업2 SORT
    UNIT_SEQ_3: hazardInvestigationField01.UNIT_SEQ_3, //단위작업3 SORT
    ACT_ID_1: hazardInvestigationField01.ACT_ID_1, //작업행동1 ID
    ACT_ID_2: hazardInvestigationField01.ACT_ID_2, //작업행동2 ID
    ACT_ID_3: hazardInvestigationField01.ACT_ID_3, //작업행동3 ID
    ACT_NM_1: hazardInvestigationField01.ACT_NM_1, //작업설명1
    ACT_NM_2: hazardInvestigationField01.ACT_NM_2, //작업설명20
    ACT_NM_3: hazardInvestigationField01.ACT_NM_3, //작업설명3
    ACT_SORT_1: hazardInvestigationField01.ACT_SORT_1, //작업설명 정렬순서1
    ACT_SORT_2: hazardInvestigationField01.ACT_SORT_2, //작업설명 정렬순서2
    ACT_SORT_3: hazardInvestigationField01.ACT_SORT_3, //작업설명 정렬순서3
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave01 = (res) => {
  Message.success(t('저장되었습니다.'))
  //저장하고 바로 수정했을때는 OUT_RES_ES_SEQ가 NULL로 넘어와서 있을때만 넣어주는걸로
  hazardInvestigationField01.ES_SEQ = res.list[0].OUT_RES_ES_SEQ
  isAlreadySaved.value = true
  Object.assign(previousValue, hazardInvestigationField01) //저장하고나서 원본 데이터에 값 덮어쓰기 (만약 다음 화면에서 이전단계 눌렀을때 변경사항 체크하기 위해서)

  emit('tab01Saved', res)
}
//저장관련 로직 끝

//수정시 조사개요 데이터 넣어주는 부분
const setInvField = (data, data2) => {
  hazardInvestigationField01.ES_DIV = !data?.[0]?.ES_DIV ? '' : data[0].ES_DIV //조사구분
  hazardInvestigationField01.ES_ASGN_CD = !data?.[0]?.ES_ASGN_CD ? '' : data[0].ES_ASGN_CD //조사자 ASGN_CD
  hazardInvestigationField01.ES_DEPT_NM = !data?.[0]?.ES_DEPT_NM ? '' : data[0].ES_DEPT_NM //임은희 책임 요청으로 조사자의 부서가 아닌 작업표준의  귀속 부서가 들어가도록 수정
  hazardInvestigationField01.ES_DATE = !data?.[0]?.ES_DATE ? '' : data[0].ES_DATE //조사일자
  hazardInvestigationField01.ES_DEPT_CD = !data?.[0]?.ES_DEPT_CD ? '' : data[0].ES_DEPT_CD //조사자 부서코드
  hazardInvestigationField01.ES_EMP_NM = !data?.[0]?.ES_EMP_NM ? '' : data[0].ES_EMP_NM //조사사자명
  hazardInvestigationField01.ES_EMP_NO = !data?.[0]?.ES_EMP_NO ? '' : data[0].ES_EMP_NO //조사자사번
  hazardInvestigationField01.ES_SEQ = props.rowData.ES_SEQ //!data?.[0]?.ES_SEQ ? '' : data[0].ES_SEQ //순번
  hazardInvestigationField01.ES_TEL_NO = !data?.[0]?.ES_TEL_NO ? '' : data[0].ES_TEL_NO //조사자 연락처
  hazardInvestigationField01.JOB_TIT_CD = !data?.[0]?.JOB_TIT_CD ? '' : data[0].JOB_TIT_CD //조사자 직무코드
  hazardInvestigationField01.JOB_TIT_NM = !data?.[0]?.JOB_TIT_NM ? '' : data[0].JOB_TIT_NM //조사자 직무명
  hazardInvestigationField01.SAGO_BODY_CD = !data?.[0]?.SAGO_BODY_CD ? '' : data[0].SAGO_BODY_CD //신체부위코드
  hazardInvestigationField01.SAGO_BODY_NM = !data?.[0]?.SAGO_BODY_NM ? '' : data[0].SAGO_BODY_NM //신체부위코드
  hazardInvestigationField01.SAGO_DUTY_CD = !data?.[0]?.SAGO_DUTY_CD ? '' : data[0].SAGO_DUTY_CD //직무코드
  hazardInvestigationField01.SAGO_DUTY_NM = !data?.[0]?.SAGO_DUTY_NM ? '' : data[0].SAGO_DUTY_NM //직무명
  hazardInvestigationField01.SAGO_EMP_CMPNY_DIV = !data?.[0]?.SAGO_EMP_CMPNY_DIV ? '' : data[0].SAGO_EMP_CMPNY_DIV //질병발생자 사업장구분
  hazardInvestigationField01.SAGO_EMP_NM = !data?.[0]?.SAGO_EMP_NM ? '' : data[0].SAGO_EMP_NM //질병발생자 성명
  hazardInvestigationField01.SAGO_EMP_NO = !data?.[0]?.SAGO_EMP_NO ? '' : data[0].SAGO_EMP_NO //질병발생자 사번
  hazardInvestigationField01.WRK_STUS_EQP = !data?.[0]?.WRK_STUS_EQP ? '' : data[0].WRK_STUS_EQP //작업장상황
  hazardInvestigationField01.WRK_STUS_EQP_DESC = !data?.[0]?.WRK_STUS_EQP_DESC ? '' : data[0].WRK_STUS_EQP_DESC //작업장상황_설비_변화내용
  hazardInvestigationField01.WRK_STUS_INC = !data?.[0]?.WRK_STUS_INC ? '' : data[0].WRK_STUS_INC //작업장상황 업무변화
  hazardInvestigationField01.WRK_STUS_INC_DESC = !data?.[0]?.WRK_STUS_INC_DESC ? '' : data[0].WRK_STUS_INC_DESC //작업장상황 업무변화 변화내용
  hazardInvestigationField01.WRK_STUS_SPD = !data?.[0]?.WRK_STUS_SPD ? '' : data[0].WRK_STUS_SPD //작업장상황 작업속도
  hazardInvestigationField01.WRK_STUS_SPD_DESC = !data?.[0]?.WRK_STUS_SPD_DESC ? '' : data[0].WRK_STUS_SPD_DESC //작업장상황 작업속도 변화내용
  hazardInvestigationField01.WRK_STUS_VOL = !data?.[0]?.WRK_STUS_VOL ? '' : data[0].WRK_STUS_VOL //작업장상황 작업량
  hazardInvestigationField01.WRK_STUS_VOL_DESC = !data?.[0]?.WRK_STUS_VOL_DESC ? '' : data[0].WRK_STUS_VOL_DESC //작업장상황 작업량 변화내용
  hazardInvestigationField01.UNIT_ID_1 = !data?.[0]?.UNIT_ID ? '' : data[0].UNIT_ID //단위작업1 ID
  hazardInvestigationField01.UNIT_NM_1 = !data?.[0]?.UNIT_NM ? '' : data[0].UNIT_NM //단위작업1 이름
  hazardInvestigationField01.UNIT_SEQ_1 = !data?.[0]?.UNIT_SEQ ? '' : data[0].UNIT_SEQ //단위작업1 SEQ
  hazardInvestigationField01.UNIT_ID_2 = !data?.[1]?.UNIT_ID ? '' : data[1].UNIT_ID //단위작업2 ID
  hazardInvestigationField01.UNIT_NM_2 = !data?.[1]?.UNIT_NM ? '' : data[1].UNIT_NM //단위작업2 이름
  hazardInvestigationField01.UNIT_SEQ_2 = !data?.[1]?.UNIT_SEQ ? '' : data[1].UNIT_SEQ //단위작업2 SEQ
  hazardInvestigationField01.UNIT_ID_3 = !data?.[2]?.UNIT_ID ? '' : data[2].UNIT_ID //단위작업2 ID
  hazardInvestigationField01.UNIT_NM_3 = !data?.[2]?.UNIT_NM ? '' : data[2].UNIT_NM //단위작업2 이름
  hazardInvestigationField01.UNIT_SEQ_3 = !data?.[2]?.UNIT_SEQ ? '' : data[2].UNIT_SEQ //단위작업2 SEQ
  hazardInvestigationField01.UNIT_GUBUN_1 = !data?.[0]?.UNIT_GUBUN ? '' : data[0].UNIT_GUBUN //단위작업1 구분
  hazardInvestigationField01.UNIT_GUBUN_2 = !data?.[1]?.UNIT_GUBUN ? '' : data[1].UNIT_GUBUN //단위작업2 구분
  hazardInvestigationField01.UNIT_GUBUN_3 = !data?.[2]?.UNIT_GUBUN ? '' : data[2].UNIT_GUBUN //단위작업3 구분
  hazardInvestigationField01.UNT_DUTY_CD = !data?.[0]?.UNT_DUTY_CD ? '' : data[0].UNT_DUTY_CD //단위직무코드
  hazardInvestigationField01.WORK_STANDARD_ID = !data?.[0]?.WORK_STANDARD_ID ? '' : data[0].WORK_STANDARD_ID //작업표준ID
  hazardInvestigationField01.WORK_STANDARD_NM = !data?.[0]?.WORK_STANDARD_NM ? '' : data[0].WORK_STANDARD_NM //작업표준명
  hazardInvestigationField01.WORK_STANDARD_NO = !data?.[0]?.WORK_STANDARD_NO ? '' : data[0].WORK_STANDARD_NO //작업표준번호
  hazardInvestigationField01.WORK_STANDARD_REVISION = !data?.[0]?.WORK_STANDARD_REVISION
    ? ''
    : data[0].WORK_STANDARD_REVISION //작업표준리비전번호
  hazardInvestigationField01.CLOSE_DATE = !data?.[0]?.CLOSE_DATE ? '' : data[0].CLOSE_DATE //조사완료일
  hazardInvestigationField01.OMIT_YN = !data?.[0]?.OMIT_YN ? '' : data[0].OMIT_YN //조사생략여부
  hazardInvestigationField01.SHORT_WORK_YN = !data?.[0].SHORT_WORK_YN ? '' : data[0].SHORT_WORK_YN //단기간작업
  hazardInvestigationField01.INTERM_WORK_YN = !data?.[0].INTERM_WORK_YN ? '' : data[0].INTERM_WORK_YN //간헐적작업
  hazardInvestigationField01.IMP_RESIST_YN = !data?.[0].IMP_RESIST_YN ? '' : data[0].IMP_RESIST_YN //개선등록여부
  hazardInvestigationField01.CORP_ASGN_CD = !data?.[0].CORP_ASGN_CD ? '' : data[0].CORP_ASGN_CD //주관부서코드
  hazardInvestigationField01.BSNS_CD = !data?.[0].BSNS_CD ? '' : data[0].BSNS_CD //작업표준 사업부 코드
  hazardInvestigationField01.DEPT_CD = !data?.[0].DEPT_CD ? '' : data[0].DEPT_CD //작업표준 부서 코드

  setUnitField(data2)

  previousValue = _.cloneDeep(hazardInvestigationField01) // 최초 상태 저장
}

//수정시 단위작업 데이터 넣어주는 부분
const setUnitField = (data) => {
  hazardInvestigationField01.ACT_ID_1 = !data?.[0]?.ACT_ID ? '' : data[0].ACT_ID //작업설명1ID
  hazardInvestigationField01.ACT_NM_1 = !data?.[0]?.ACT_NM ? '' : data[0].ACT_NM //작업설명1이름
  hazardInvestigationField01.ACT_ID_2 = !data?.[1]?.ACT_ID ? '' : data[1].ACT_ID //작업설명2ID
  hazardInvestigationField01.ACT_NM_2 = !data?.[1]?.ACT_NM ? '' : data[1].ACT_NM //작업설명2이름
  hazardInvestigationField01.ACT_ID_3 = !data?.[2]?.ACT_ID ? '' : data[2].ACT_ID //작업설명3ID
  hazardInvestigationField01.ACT_NM_3 = !data?.[2]?.ACT_NM ? '' : data[2].ACT_NM //작업설명3이름
}

//데이터 넘겨줌
const getTab01Data = () => {
  return hazardInvestigationField01
}

//신체부위 변경 감지 -> 직접입력을 선택하면 텍스트박스가 활성화 된다.
watch(
  () => hazardInvestigationField01.SAGO_BODY_CD,
  (newValue, oldValue) => {
    //직접입력 코드값 999
    if (newValue === '999') {
      readOnlyValue.SAGO_BODY_NM = false
    } else {
      readOnlyValue.SAGO_BODY_NM = true
    }
  }
)

//조사 구분이 수시면 업무상질병대상자,신체부위,직종 활성화
watch(
  () => hazardInvestigationField01.ES_DIV,
  (newValue, oldValue) => {
    if (newValue === 'A2') {
      readOnlyValue.SAGO_EMP_NM = false //업무상질병 발생자명
      readOnlyValue.SAGO_DUTY_NM = false //업무상질병 발생자 직종명
      readOnlyValue.SAGO_BODY_CD = false //업무상질병 발생자 신체부위 코드(HHII820D)
      //readOnlyValue.SAGO_BODY_NM = false //업무상질병 발생자 신체부위 직접입력 했을때 들어가는 값
    } else {
      readOnlyValue.SAGO_EMP_NM = true //업무상질병 발생자명
      readOnlyValue.SAGO_DUTY_NM = true //업무상질병 발생자 직종명
      readOnlyValue.SAGO_BODY_CD = true //업무상질병 발생자 신체부위 코드(HHII820D)
      readOnlyValue.SAGO_BODY_NM = true //업무상질병 발생자 신체부위 직접입력 했을때 들어가는 값
      hazardInvestigationField01.SAGO_EMP_CMPNY_DIV = '' //업무상질병 발생자 회사 코드
      hazardInvestigationField01.SAGO_EMP_NO = '' //업무상질병 발생자 사번
      hazardInvestigationField01.SAGO_EMP_NM = ''
      hazardInvestigationField01.SAGO_BODY_CD = ''
      hazardInvestigationField01.SAGO_BODY_NM = ''
    }
  }
)

//설비 변경 감지
watch(
  () => hazardInvestigationField01.WRK_STUS_EQP,
  (newValue, oldValue) => {
    //변화있음으로 변경시 텍스트박스 활성화
    if (newValue === '2') {
      readOnlyValue.WRK_STUS_EQP_DESC = false
    } else {
      hazardInvestigationField01.WRK_STUS_EQP_DESC = ''
      readOnlyValue.WRK_STUS_EQP_DESC = true
    }
  }
)
//작업량 변경 감지
watch(
  () => hazardInvestigationField01.WRK_STUS_VOL,
  (newValue, oldValue) => {
    //기타로 변경시 텍스트박스 활성화
    if (newValue === '4') {
      readOnlyValue.WRK_STUS_VOL_DESC = false
    } else {
      hazardInvestigationField01.WRK_STUS_VOL_DESC = ''
      readOnlyValue.WRK_STUS_VOL_DESC = true
    }
  }
)

//작업속도 변경 감지
watch(
  () => hazardInvestigationField01.WRK_STUS_SPD,
  (newValue, oldValue) => {
    //기타로 변경시 텍스트박스 활성화
    if (newValue === '4') {
      readOnlyValue.WRK_STUS_SPD_DESC = false
    } else {
      hazardInvestigationField01.WRK_STUS_SPD_DESC = ''
      readOnlyValue.WRK_STUS_SPD_DESC = true
    }
  }
)

//작업내용 변경 감지
watch(
  () => hazardInvestigationField01.WRK_STUS_INC,
  (newValue, oldValue) => {
    //변화있음으로 변경시 텍스트박스 활성화
    if (newValue === '5') {
      readOnlyValue.WRK_STUS_INC_DESC = false
    } else {
      hazardInvestigationField01.WRK_STUS_INC_DESC = ''
      readOnlyValue.WRK_STUS_INC_DESC = true
    }
  }
)

//단기간작업 변경 감지
watch(
  () => hazardInvestigationField01.SHORT_WORK_YN,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationField01.INTERM_WORK_YN = ''
    }
  }
)

//간헐적작업 변경 감지
watch(
  () => hazardInvestigationField01.INTERM_WORK_YN,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationField01.SHORT_WORK_YN = ''
    }
  }
)

const openPopupTab01 = () => {
  dialog.value = true
}

defineExpose({
  saveTab01,
  getTab01Data,
  setInvField,
  setUnitField,
  openPopupTab01,
})
</script>

<template>
  <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move">
    <span>유해요인조사등록 1/4</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <IGridTitle
      :button-list="['btnInvDelete', 'btnTemporaryStorage', 'btnNextStep', 'btnClose']"
      @click-button="onButtonsClick"
      class="mt-2 mr-2"
      ref="menuTitle"
      :use-permission="false"
    ></IGridTitle>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <span class="gridTitle">조사개요</span>
          <div class="d-flex mt-2">
            <i-input :label="$t('소속 부서')" width="200px" top-label v-model="props.rowData.DEPT_NM" readonly />
            <i-input
              :label="$t('작업표준명')"
              width="200px"
              top-label
              v-model="hazardInvestigationField01.WORK_STANDARD_NM"
              readonly
            />
            <i-input
              :label="$t('작업표준번호')"
              width="200px"
              top-label
              v-model="hazardInvestigationField01.WORK_STANDARD_NO"
              readonly
            >
            </i-input>
          </div>
          <div class="d-flex mt-2">
            <i-input
              :label="$t('조사 일자')"
              width="200px"
              top-label
              v-model="hazardInvestigationField01.ES_DATE"
              readonly
            >
            </i-input>
            <i-select
              :label="$t('조사 구분')"
              width="200px"
              top-label
              v-model="hazardInvestigationField01.ES_DIV"
              :items="codeList.ES_DIV"
              item-title="TXT"
              item-value="COD"
              required
            >
            </i-select>
            <i-input
              :label="$t('조사자')"
              width="200px"
              top-label
              v-model="hazardInvestigationField01.ES_EMP_NM"
              @click:appendInner="openEmpPopup2('')"
              append-inner-icon="mdi-magnify"
              readonly
            >
            </i-input>

            <i-input
              :label="$t('직종')"
              width="200px"
              top-label
              v-model="hazardInvestigationField01.SAGO_DUTY_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDutyPopup"
              readonly
              required
              style="position: relative;"
            >
              <template v-slot:between-inner>
                <div style="position: absolute; top: 0; left: 36px; font-size: 14px; color: #ff5252; width: 175px;">
                  (해당 작업과 연관된 직종 선택)
                </div>
              </template>
            </i-input>
          </div>
          <div class="d-flex mt-2">
            <i-input
              :label="$t('업무상질병 대상자')"
              width="200px"
              top-label
              v-model="hazardInvestigationField01.SAGO_EMP_NM"
              @click:appendInner="openEmpPopup('')"
              @keydown.enter="
                (e) => {
                  openEmpPopup('')
                }
              "
              append-inner-icon="mdi-magnify"
              required
              :disabled="readOnlyValue.SAGO_EMP_NM"
            >
            </i-input>
            <div class="d-flex">
              <i-select
                :label="$t('신체부위')"
                width="200px"
                top-label
                v-model="hazardInvestigationField01.SAGO_BODY_CD"
                :items="codeList.SAGO_BODY_CD"
                item-title="TXT"
                item-value="COD"
                required
                :disabled="readOnlyValue.SAGO_BODY_CD"
              >
              </i-select>
              <i-input
                class="mt-5"
                width="300px"
                :disabled="readOnlyValue.SAGO_BODY_NM"
                v-model="hazardInvestigationField01.SAGO_BODY_NM"
              ></i-input>
            </div>
          </div>
          <div class="d-flex my-4">
            <v-checkbox
              label="단기간 작업"
              true-value="Y"
              false-value="N"
              class="mr-2"
              v-model="hazardInvestigationField01.SHORT_WORK_YN"
            ></v-checkbox>
            <v-tooltip>
              <template v-slot:activator="{ props }">
                <v-icon style="margin-top: 2px" class="mr-4" icon="mdi-eye-check" v-bind="props"></v-icon>
              </template>
              <div class="tooltip_div">2개월 이내에 종료되는 작업</div>
            </v-tooltip>

            <v-checkbox
              label="간헐적 작업"
              true-value="Y"
              false-value="N"
              class="mr-2"
              v-model="hazardInvestigationField01.INTERM_WORK_YN"
            ></v-checkbox>
            <v-tooltip class="mt-2">
              <template v-slot:activator="{ props }">
                <v-icon style="margin-top: 2px" icon="mdi-eye-check" v-bind="props"></v-icon>
              </template>
              <div class="tooltip_div">
                간헐적으로 이루어지는 작업으로, 연간 총 작업 시간이 60일을 초과하지 않는 작업
              </div>
            </v-tooltip>
          </div>

          <span class="gridTitle mt-2">작업 상황 변화</span>
          <div class="mt-2 d-flex">
            <i-select
              width="200px"
              v-model="hazardInvestigationField01.WRK_STUS_EQP"
              :label="$t('설비')"
              :items="codeList.WRK_STUS_EQP"
              item-title="TXT"
              item-value="COD"
              top-label
              required
            ></i-select>
            <i-select
              width="200px"
              :label="$t('작업량')"
              v-model="hazardInvestigationField01.WRK_STUS_VOL"
              item-title="TXT"
              item-value="COD"
              top-label
              :items="codeList.WRK_STUS_VOL"
              required
            ></i-select>

            <i-select
              width="200px"
              :label="$t('작업 속도')"
              top-label
              v-model="hazardInvestigationField01.WRK_STUS_SPD"
              :items="codeList.WRK_STUS_SPD"
              item-title="TXT"
              item-value="COD"
              required
            ></i-select>

            <i-select
              width="200px"
              :label="$t('작업 내용')"
              top-label
              v-model="hazardInvestigationField01.WRK_STUS_INC"
              :items="codeList.WRK_STUS_INC"
              item-title="TXT"
              item-value="COD"
              required
            ></i-select>
          </div>
          <div class="mt-2 d-flex">
            <i-input
              width="200px"
              v-model="hazardInvestigationField01.WRK_STUS_EQP_DESC"
              :disabled="readOnlyValue.WRK_STUS_EQP_DESC"
            ></i-input>

            <i-input
              width="200px"
              v-model="hazardInvestigationField01.WRK_STUS_VOL_DESC"
              :disabled="readOnlyValue.WRK_STUS_VOL_DESC"
            ></i-input>

            <i-input
              width="200px"
              v-model="hazardInvestigationField01.WRK_STUS_SPD_DESC"
              :disabled="readOnlyValue.WRK_STUS_SPD_DESC"
            ></i-input>

            <i-input
              width="200px"
              v-model="hazardInvestigationField01.WRK_STUS_INC_DESC"
              :disabled="readOnlyValue.WRK_STUS_INC_DESC"
            ></i-input>
          </div>

          <div class="mt-2">
            <span class="gridTitle">단위작업조사</span>
            <div class="mt-2">
              <i-input
                width="100%"
                :label="$t('단위작업1')"
                top-label
                append-inner-icon="mdi-magnify"
                @click:appendInner="openUnitWork1Popup"
                v-model="hazardInvestigationField01.UNIT_NM_1"
                :readonly="readOnlyValue.UNIT_NM_1"
                :disabled="disabledValue.UNIT_NM_1"
                required
              ></i-input>
              <i-textarea
                width="100%"
                :label="$t('작업설명1')"
                top-label
                v-model="hazardInvestigationField01.ACT_NM_1"
                :disabled="readOnlyValue.ACT_NM_1"
                required
                class="mt-2"
              ></i-textarea>
            </div>
            <div class="mt-2">
              <i-input
                width="100%"
                :label="$t('단위작업2')"
                top-label
                append-inner-icon="mdi-magnify"
                @click:appendInner="openUnitWork2Popup"
                v-model="hazardInvestigationField01.UNIT_NM_2"
                :readonly="readOnlyValue.UNIT_NM_2"
                :disabled="disabledValue.UNIT_NM_2"
                required
              ></i-input>
              <i-textarea
                width="100%"
                :label="$t('작업설명2')"
                top-label
                v-model="hazardInvestigationField01.ACT_NM_2"
                :disabled="readOnlyValue.ACT_NM_2"
                required
                class="mt-2"
              ></i-textarea>
            </div>
            <div class="mt-2">
              <i-input
                width="100%"
                :label="$t('단위작업3')"
                top-label
                append-inner-icon="mdi-magnify"
                @click:appendInner="openUnitWork3Popup"
                v-model="hazardInvestigationField01.UNIT_NM_3"
                :readonly="readOnlyValue.UNIT_NM_3"
                :disabled="disabledValue.UNIT_NM_3"
                required
              ></i-input>
              <i-textarea
                width="100%"
                :label="$t('작업설명')"
                top-label
                v-model="hazardInvestigationField01.ACT_NM_3"
                :disabled="readOnlyValue.ACT_NM_3"
                required
                class="mt-2"
              ></i-textarea>
            </div>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
    <EmpPopup ref="empPopup2" @selected="onEmpSelected2"></EmpPopup>
    <HLTIB0010Tab01_Popup01
      ref="unitWork1Popup"
      @selected="selectedUnitWork1"
      popup-number="1"
    ></HLTIB0010Tab01_Popup01>
    <HLTIB0010Tab01_Popup01
      ref="unitWork2Popup"
      @selected="selectedUnitWork2"
      popup-number="2"
    ></HLTIB0010Tab01_Popup01>
    <HLTIB0010Tab01_Popup01
      ref="unitWork3Popup"
      @selected="selectedUnitWork3"
      popup-number="3"
    ></HLTIB0010Tab01_Popup01>
    <DutyPopup
      ref="dutyPopup"
      @selected="selectedDutyPopup"
      :read-only-bsns="
        userStore.authGrpCd.includes('GRP00372') ||
        userStore.authGrpCd.includes('HLTI001') ||
        userStore.authGrpCd.includes('HIWAYGRP00001')
          ? false
          : true
      "
      :read-only-dept="
        userStore.authGrpCd.includes('GRP00372') ||
        userStore.authGrpCd.includes('HLTI001') ||
        userStore.authGrpCd.includes('HIWAYGRP00001')
          ? false
          : true
      "
      :read-only-div="
        userStore.authGrpCd.includes('GRP00372') ||
        userStore.authGrpCd.includes('HLTI001') ||
        userStore.authGrpCd.includes('HIWAYGRP00001')
          ? false
          : true
      "
    ></DutyPopup>
  </v-card>
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
    min-height: 400px;
  }
}

.tooltip_div {
  background-color: white;
  color: black;
  margin: -3px -7px;
  padding: 8px;
  font-size: 10pt;
  font-weight: bold;
  // border: 1px solid black;
  text-align: center;
}
</style>
