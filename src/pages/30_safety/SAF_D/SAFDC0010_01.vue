<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
} from '@hiway/api/commonApi'
import {
  commonDownloadFilesApi,
  commonBigUploadFilesApi,
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import SAFDC0010_01Popup01 from './SAFDC0010_01Popup01.vue'
import SAFDC0010_01Popup02 from './SAFDC0010_01Popup02.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUpload from '@/components/IUpload.vue'
import _ from 'lodash'

defineOptions({
  name: '30_safety-SAF_D-SAFDC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const gridTitle = ref(null)
const tab = ref('안전수칙위반현황')
const grdMain = ref(null)
const userStore = useUserStore()
const sAFDC0010Popup01 = ref(null) //수칙위반 등록 팝업
const sAFDC0010Popup02 = ref(null) //교통수칙위반 등록 팝업
const empPopup = ref(null)
const fileUpload = ref(null)
const chkImage = reactive(['jpg', 'gif', 'bmp', 'png', 'jpeg'])
const { sliSAFDC0010_01 } = history.state

const detailField = reactive({
  sendTeam: '', //발신
  chkEmp: '', //점검자
  receiveTeam: '', //수신
  chkDate: '', //점검일자
  detailContentTitle: '', //항목
  detailContent: '', //상세항목
  fileId: '', //위반내용 파일아이디
  images: [],
})
const codeList = reactive({
  company: [],        // 위반조직 회사
  bsnsCd: [],         // 위반조직 사업부
  deptCd: [],         // 위반조직 부서
  dansokCompany: [],  // 단속조직 회사
  dansokBsnsCd: [],   // 단속조직 사업부
  dansokDeptCd: [],   // 단속조직 부서
  gubun: [],          // 구분
  status: [],         // 결제진행상태
  searchStatus: [],   // 조회조건에있는 진행상태 -> 결제진행상태에서 '전체'만 추가됨
})

const initCodeList = async () => {
  await Promise.all([
    commonSearchApi({
      //회사조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: searchParam.COMPANY//userStore.cmpnyDiv
      },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    }),
    getCodeList('HHIF110'),
    getCodeList('HHIF180'),
    //단속사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV//userStore.cmpnyDiv
      },
    }),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR.slice()
    codeList.dansokCompany = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR.slice()
    codeList.dansokBsnsCd = res[5].ORESULT_CUR
    //codeList.dansokDeptCd = res[2].ORESULT_CUR
    codeList.gubun = res[3].ORESULT_CUR.filter((x) => !x.COD.includes('S'))
    codeList.status = res[4].ORESULT_CUR
    codeList.searchStatus = res[4].ORESULT_CUR
    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.dansokCompany.unshift({ TXT: '전체', COD: '' })
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.dansokBsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.gubun.unshift({ TXT: '전체', COD: '' })
    codeList.searchStatus.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('STATUS', codeList.status, 'COD', 'TXT')
    console.log(codeList.status)
    setButton(searchParam.VIO_GDIV)
  })
}

//조회조건이랑 같이 있지만 실제로 조회할때 필요하지 않는 값들
const searchField = reactive({
  PAST_ORG: 'N', //과거조직포함 체크박스
  CHK_DAY: 'Y', //일자 체크박스
})
//조회조건
const searchParam = reactive({
  VIO_DATE_FR: '', //위반일자 FROM
  VIO_DATE_TO: '', //위반일자 TO
  COMPANY: sliSAFDC0010_01 === undefined ? userStore.cmpnyDiv : sliSAFDC0010_01.CMPNY_DIV, //위반조직 회사
  BSNS_CD: sliSAFDC0010_01 === undefined ? userStore.bsnsCd : sliSAFDC0010_01.BSNS_CD, //위반조직 사업부
  DEPT_CD: sliSAFDC0010_01 === undefined ? userStore.deptCd : sliSAFDC0010_01.DEPT_CD, //위반조직 부서
  ASGN_CD: '', //빈값
  VIO_GDIV: sliSAFDC0010_01 === undefined ? '' : sliSAFDC0010_01.GUBUN, //위반구분(A:절대수칙, B:일반수칙,C:교통위반,Z:기타)
  CMPNY_DIV: sliSAFDC0010_01 === undefined ? userStore.cmpnyDiv : '', //단속조직 회사
  DANSOK_BSNS_CD: '', // 단속조직 사업부
  DANSOK_ASGN_CD: '', // 단속조직 부서
  DANSOK_EMP_NM: '', // 단속자 이름
  DANSOK_EMP_NO: '', // 단속자 사번
  STATUS: sliSAFDC0010_01 === undefined ? '' : '30', //결재진행상태
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'VIO_TIME_DS',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('위반일시(조회용)') },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      width: '100',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('진행상태') },
    },
    {
      fieldName: 'IO_DIV_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('소속구분') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '100',
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '150',
      header: { text: t('부서') },
    },
    {
      fieldName: 'DTL_ASGN_NM',
      dataType: 'text',
      styleName: 'left-column',
      width: '150',
      editable: false,
      header: { text: t('상세소속') },
    },
    {
      fieldName: 'VEND_NAME',
      dataType: 'text',
      editable: false,
      header: { text: t('사외협력사') },
    },
    {
      fieldName: 'VIO_EMP_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('위반자사번') },
      visible: false,
    },
    {
      fieldName: 'VIOLATOR',
      dataType: 'text',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'VIO_GDIV_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('위반구분(대)') },
    },
    {
      fieldName: 'VIO_MDIV_NM',
      dataType: 'text',
      styleName: 'left-column',
      width: '250',
      editable: false,
      header: { text: t('위반구분(소)') },
    },
    {
      fieldName: 'VIO_SPLC_NM',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('위반장소') },
    },
    {
      fieldName: 'VIO_PLC_DESC',
      dataType: 'text',
      width: '250',
      editable: false,
      styleName: 'left-column',
      header: { text: t('위반장소상세') },
    },
    {
      fieldName: 'SHIP_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('호선No.') },
    },
    {
      fieldName: 'VIO_DESC',
      dataType: 'text',
      styleName: 'left-column',
      width: '180',
      editable: false,
      header: { text: t('위반내용') },
    },
    {
      fieldName: 'DANSOK_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('단속자') },
    },
    {
      fieldName: 'DANSOK_ASGN_NM',
      dataType: 'text',
      styleName: 'left-column',
      width: '250',
      editable: false,
      header: { text: t('단속자 조직') },
    },

    {
      fieldName: 'FILE_ID1',
      dataType: 'text',
      editable: false,
      visible: false,
      isFile: { value: true, showAlways: true },
      header: { text: t('위반첨부') },
    },
    {
      fieldName: 'FILE_ID2',
      dataType: 'text',
      editable: false,
      visible: false,
      isFile: { value: true, showAlways: true },
      header: { text: t('조치첨부') },
    },
    {
      fieldName: 'VIO_CNT_A',
      dataType: 'text',
      editable: false,
      styleName: 'right-column',
      header: { text: t('1년 건수') },
    },
    {
      fieldName: 'EDU_YN_A',
      dataType: 'text',
      editable: false,
      header: { text: t('교육이수') },
    },
    {
      fieldName: 'VIO_CNT_B',
      dataType: 'text',
      editable: false,
      styleName: 'right-column',
      header: { text: t('1년 건수') },
    },
    {
      fieldName: 'EDU_YN_B',
      dataType: 'text',
      editable: false,
      header: { text: t('교육이수') },
    },
    {
      fieldName: 'VIO_CNT_C',
      dataType: 'text',
      editable: false,
      styleName: 'right-column',
      header: { text: t('교통위반 - 1년건수') },
    },
    {
      fieldName: 'RG_DATE',
      dataType: 'text',
      editable: false,
      header: { text: t('등록날짜') },
    },
    {
      fieldName: 'APP_EMP_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'APP_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'VIO_EMP_ASGN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'VEND_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_TIT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('직급코드') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('소속조직코드') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('소속조직명Full') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'DANSOK_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('단속자조직코드') },
    },
    {
      fieldName: 'DANSOK_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('단속자사번') },
    },
    {
      fieldName: 'DANSOK_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('단속자부서코드') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('소속부서코드') },
    },
    {
      fieldName: 'IO_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('직영/협력구분') },
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('직급') },
    },
    {
      fieldName: 'TEAM_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('소속조직명') },
    },
    {
      fieldName: 'VIO_DT1',
      dataType: 'text',
      visible: false,
      header: { text: t('위반일자') },
    },
    {
      fieldName: 'VIO_GDIV',
      dataType: 'text',
      visible: false,
      header: { text: t('위반구분(대)') },
    },
    {
      fieldName: 'VIO_LPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('위반장소(대)') },
    },
    {
      fieldName: 'VIO_MDIV',
      dataType: 'text',
      visible: false,
      header: { text: t('위반구분(소)') },
    },
    {
      fieldName: 'VIO_MPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('위반장소(중)') },
    },
    {
      fieldName: 'VIO_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('위반번호') },
    },
    {
      fieldName: 'VIO_SPLC',
      dataType: 'text',
      visible: false,
      visible: false,
      header: { text: t('위반장소(소)') },
    },
    {
      fieldName: 'VIO_TIME',
      dataType: 'text',
      visible: false,
      header: { text: t('위반일시') },
    },
    {
      fieldName: 'VIO_TIME2',
      dataType: 'text',
      visible: false,
      header: { text: t('위반시간') },
    },
    {
      fieldName: 'COMPANY',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'GUBUN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ1',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ2',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ3',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ1_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ2_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ3_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_L',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_L_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
  ],
  columns: [],
  columnLayout: [
    'VIO_TIME_DS',
    'STATUS',
    'IO_DIV_NM',
    'BSNS_NM',
    'DEPT_NM',
    'DTL_ASGN_NM',
    'VEND_NAME',
    'VIO_EMP_NO',
    'VIOLATOR',
    'VIO_GDIV_NM',
    'VIO_MDIV_NM',
    'VIO_SPLC_NM',
    'VIO_PLC_DESC',
    'SHIP_NO',
    'VIO_DESC',
    'DANSOK_EMP_NM',
    'DANSOK_ASGN_NM',
    'FILE_ID1',
    'FILE_ID2',
    {
      name: '절대수칙',
      direction: 'horizontal',
      items: ['VIO_CNT_A', 'EDU_YN_A'],
    },
    {
      name: '일반수칙',
      direction: 'horizontal',
      items: ['VIO_CNT_B', 'EDU_YN_B'],
    },
    'VIO_CNT_C',
    'RG_DATE',
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    setButton(searchParam.VIO_GDIV)
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnRegistViolation') {
    sAFDC0010Popup01.value.openPopup()
  } else if (btn.id === 'btnRegistTrafficViolation') {
    sAFDC0010Popup02.value.openPopup()
  } else if (btn.id === 'btnTurnBack') {
    //반려
    new saveFlowHelper(vm, t)
      .setBefore(beforeReturnApprove)
      .setQuery(returnApprove)
      .setAfter(afterReturnApprove)
      .setConfirmMessage('반려하시겠습니까?')
      .run()
  } else if (btn.id === 'btnApproveAndSend') {
    //승인/발송
    new saveFlowHelper(vm, t)
      .setBefore(beforeApprove)
      .setQuery(saveApprove)
      .setAfter(afterApprove)
      .setConfirmMessage('승인하시겠습니까?')
      .run()
  } else if (btn.id === 'btnReqApprove') {
    //승인요청
    new saveFlowHelper(vm, t)
      .setBefore(beforeReqApprove)
      .setQuery(saveReqApprove)
      .setAfter(afterApprove)
      .setConfirmMessage('승인요청하시겠습니까?')
      .run()
  } else if (btn.id === 'btnReqApproveCancel') {
    //승인요청취소
    new saveFlowHelper(vm, t)
      .setBefore(beforeReqApproveCancel)
      .setQuery(saveReqApproveCancel)
      .setAfter(afterApprove)
      .setConfirmMessage('승인요청취소하시겠습니까?')
      .run()
  } else {
    // //승인취소
    // new saveFlowHelper(vm, t)
    //   .setBefore(beforeCancleApprove)
    //   .setQuery(cancleApprove)
    //   .setAfter(afterCancleApprove)
    //   .setConfirmMessage('승인취소하시겠습니까?')
    //   .run()
  }
}
//반려 관련 로직 시작
const beforeReturnApprove = () => {
  //체크된 데이터 확인
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  if (chkData.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }
  //교통위반은 반려가 안됨
  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    if (data.VIO_GDIV_NM === '교통위반') {
      Message.warn(t('교통위반건은 반려 할 수 없습니다.'))
      return false
    }
  }
  //결재승인 상태,반려상태는 반려가 되지않음
  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    if (data.STATUS === '30') {
      Message.warn(t('승인 완료된 정보가 있습니다.'))
      return false
    } else if (data.STATUS === '11') {
      Message.warn(t('반려상태인 데이터가 있습니다.'))
      return false
    }
  }

  return true
}

const returnApprove = () => {
  let saveParam = []
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      VIO_NO: data.VIO_NO,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE11',
    list: saveParam,
  })
}

const afterReturnApprove = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//반려 관련 로직 끝

//승인취소 관련 로직 시작
const beforeCancleApprove = () => {
  //선택된 데이터 체크
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  if (chkData.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }
  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    //교통위반일때는 STATUS가 문자열 '승인'을 비교
    if (data.VIO_GDIV_NM === '교통위반') {
      if (data.STATUS !== '승인') {
        Message.warn(t('승인취소는 승인 상태에서만 가능합니다.'))
        return false
      }
    }
    //일반수칙,절대수칙일때는 STATUS '30'을 비교
    if (data.VIO_GDIV_NM === '일반수칙' || data.VIO_GDIV_NM === '절대수칙') {
      if (data.STATUS === '30' || data.STATUS === '승인') {
        if (checkRow(chkData)) {
          return true
        }
      } else {
        Message.warn(t('승인취소는 승인 상태에서만 가능합니다.'))
        return false
      }
    }
  }
  // if (checkRow(chkData)) {
  //   return true
  // }
}

const cancleApprove = () => {
  let saveParam = []
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  let data = grdMain.value.getDataProvider().getJsonRow(chkData[0]) //교통위반은 교통위반만 있기때문에 0번째만 체크하고 일반수칙과 절대수칙은 같이 승인이 되기 때문에 둘중 하나만 비교
  if (data.VIO_GDIV_NM === '교통위반') {
    for (let i = 0; i < chkData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
      let saveData = {
        CMPNY_DIV: data.CMPNY_DIV,
        VIO_NO: data.VIO_NO,
        VIO_EMP_NO: data.VIO_EMP_NO,
        HVIO_YN: data.HVIO_YN, //중대수칙 위반 여부
        SAVE_YN: 'Y',
      }
      saveParam.push(saveData)
    }
    return commonExecuteApi({
      queryId: 'SAFDC0010_SAVE09',
      list: saveParam,
    })
  } else if (
    data.VIO_GDIV_NM === '일반수칙' ||
    data.VIO_GDIV_NM === '절대수칙'
  ) {
    if (data.STATUS === '승인') {
      //교통수칙위반은 STATUS가 30이 아니라 승인으로 들어옴 (교통수칙위반중에 절대수칙인 데이터)
      for (let i = 0; i < chkData.length; i++) {
        let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
        let saveData = {
          CMPNY_DIV: data.CMPNY_DIV,
          VIO_NO: data.VIO_NO,
          VIO_EMP_NO: data.VIO_EMP_NO,
          HVIO_YN: data.HVIO_YN,
          SAVE_YN: 'Y',
        }
        saveParam.push(saveData)
        return commonExecuteApi({
          queryId: 'SAFDC0010_SAVE09',
          list: saveParam,
        })
      }
    }
    for (let i = 0; i < chkData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
      let saveData = {
        CMPNY_DIV: data.CMPNY_DIV,
        VIO_NO: data.VIO_NO,
        USER_ID: userStore.userId,
      }
      saveParam.push(saveData)
    }
    return commonExecuteApi({
      queryId: 'SAFDC0010_SAVE08',
      list: saveParam,
    })
  }
}

const afterCancleApprove = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//승인취소 관련 로직 끝

// 승인요청 관련 로직 시작
const beforeReqApprove = () => {
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  if (chkData.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }

  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    if (data.VIO_GDIV_NM === '교통위반') {
      if (data.STATUS !== '작성중') {
        Message.warn(t('작성중 상태인 데이터만 승인요청 가능합니다.'))
        return false
      }
    }
    if (data.VIO_GDIV_NM === '일반수칙' || data.VIO_GDIV_NM === '절대수칙') {
      if (data.STATUS !== '10') {
        Message.warn(t('작성중 상태인 데이터만 승인요청 가능합니다.'))
        return false
      }
    }
  }
  if (checkRow(chkData)) {
    return true
  }
}

// 승인요청취소 관련 로직 시작
const beforeReqApproveCancel = () => {
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  if (chkData.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }

  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    if (data.VIO_GDIV_NM === '교통위반') {
      if (data.STATUS !== '승인대기') {
        Message.warn(t('승인대기 상태인 데이터만 승인 가능합니다.'))
        return false
      }
    }
    if (data.VIO_GDIV_NM === '일반수칙' || data.VIO_GDIV_NM === '절대수칙') {
      if (data.STATUS !== '20') {
        Message.warn(t('승인대기 상태인 데이터만 승인 가능합니다.'))
        return false
      }
    }
  }
  if (checkRow(chkData)) {
    return true
  }
}

// 승인발송 관련 로직 시작
const beforeApprove = () => {
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  if (chkData.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }

  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    if (data.VIO_GDIV_NM === '교통위반') {
      if (data.STATUS !== '승인대기') {
        Message.warn(t('승인대기 상태인 데이터만 승인 가능합니다.'))
        return false
      }
    }
    if (data.VIO_GDIV_NM === '일반수칙' || data.VIO_GDIV_NM === '절대수칙') {
      if (data.STATUS !== '20') {
        Message.warn(t('승인대기 상태인 데이터만 승인 가능합니다.'))
        return false
      }
    }
  }
  if (checkRow(chkData)) {
    return true
  }
}

// 승인요청
const saveReqApprove = async () => {
  let saveParam = []
  let scmsParam = []
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  let data = grdMain.value.getDataProvider().getJsonRow(chkData[0]) //교통위반은 교통위반만 있기때문에 0번째만 체크하고 일반수칙과 절대수칙은 같이 승인이 되기 때문에 둘중 하나만 비교

  //일반수칙,절대수칙일때
  if (
    data.VIO_GDIV_NM === '일반수칙' ||
    data.VIO_GDIV_NM === '절대수칙' ||
    data.VIO_GDIV_NM.includes('중대성')
  ) {
    for (let i = 0; i < chkData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
      let saveData = {
        CMPNY_DIV: data.CMPNY_DIV,
        VIO_NO: data.VIO_NO,
        USER_ID: userStore.userId,
        STATUS: '20',
      }
      saveParam.push(saveData)
    }
    sendMail(chkData) //메일전송
    //안전수칙위반 승인
    return commonExecuteApi({
      queryId: 'SAFDC0010_SAVE14',
      list: saveParam,
    })
  }
}

// 승인요청취소
const saveReqApproveCancel = async () => {
  let saveParam = []
  let scmsParam = []
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  let data = grdMain.value.getDataProvider().getJsonRow(chkData[0]) //교통위반은 교통위반만 있기때문에 0번째만 체크하고 일반수칙과 절대수칙은 같이 승인이 되기 때문에 둘중 하나만 비교

  //일반수칙,절대수칙일때
  if (
    data.VIO_GDIV_NM === '일반수칙' ||
    data.VIO_GDIV_NM === '절대수칙' ||
    data.VIO_GDIV_NM.includes('중대성')
  ) {
    for (let i = 0; i < chkData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
      let saveData = {
        CMPNY_DIV: data.CMPNY_DIV,
        VIO_NO: data.VIO_NO,
        USER_ID: userStore.userId,
        STATUS: '10',
      }
      saveParam.push(saveData)
    }
    sendMail(chkData) //메일전송

    //안전수칙위반 승인
    return commonExecuteApi({
      queryId: 'SAFDC0010_SAVE14',
      list: saveParam,
    })
  }
}

const saveApprove = async () => {
  let saveParam = []
  let scmsParam = []
  let chkData = grdMain.value.getGridView().getCheckedRows(true)
  let data = grdMain.value.getDataProvider().getJsonRow(chkData[0]) //교통위반은 교통위반만 있기때문에 0번째만 체크하고 일반수칙과 절대수칙은 같이 승인이 되기 때문에 둘중 하나만 비교
  //교통위반 승인/발송
  if (data.VIO_GDIV_NM === '교통위반') {
    for (let i = 0; i < chkData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
      //   //교통수칙위반에 대한 데이터가 모두 없기때문에 교통수칙위반번호에 해당하는 데이터를 조회함 -> 수칙위반,교통위반을 합치느라 이렇게해야함
      let param = {
        CMPNY_DIV: data.CMPNY_DIV,
        VIO_NO: data.VIO_NO,
      }
      await commonSearchApi({
        queryId: 'SAFDC0010_SEARCH_15',
        param: param,
      }).then((res) => {
        let saveData = {
          CMPNY_DIV: res.ORESULT_CUR[0].CMPNY_DIV,
          VIO_NO: res.ORESULT_CUR[0].VIO_NO,
          VIO_EMP_NO: res.ORESULT_CUR[0].VIO_EMP_NO,
          BIKE_REG_NO: res.ORESULT_CUR[0].BIKE_REG_NO,
          CAR_NO: res.ORESULT_CUR[0].CAR_NO,
          HVIO_YN: res.ORESULT_CUR[0].HVIO_YN,
          REG_YN: res.ORESULT_CUR[0].REG_YN,
          REG_NO_YN: res.ORESULT_CUR[0].REG_NO_YN,
          USER_ID: userStore.userId,
          SAVE_YN: 'Y',
        }
        //SCMS교통위반 확정건 연동
        let scmsData = {
          CMPNY_DIV: res.ORESULT_CUR[0].CMPNY_DIV,
          VIO_NO: res.ORESULT_CUR[0].VIO_NO,
          COMPANY: res.ORESULT_CUR[0].COMPANY,
          GUBUN: 'B',
          SAVEYN: 'N',
        }
        saveParam.push(saveData)
        scmsParam.push(scmsData)
      })
    }
    sendMail(chkData) //메일전송
    //SCMS교통위반 확정건 연동
    commonExecuteApi({
      queryId: 'SAFDC0010_SAVE10',
      list: scmsParam,
    })
    return commonExecuteApi({
      queryId: 'SAFDC0010_SAVE13',
      list: saveParam,
    })
  }
  //일반수칙,절대수칙일때
  else if (
    data.VIO_GDIV_NM === '일반수칙' ||
    data.VIO_GDIV_NM === '절대수칙' ||
    data.VIO_GDIV_NM.includes('중대성')
  ) {
    for (let i = 0; i < chkData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
      let saveData = {
        CMPNY_DIV: data.CMPNY_DIV,
        VIO_NO: data.VIO_NO,
        USER_ID: userStore.userId,
      }
      saveParam.push(saveData)
    }
    sendMail(chkData) //메일전송
    //안전수칙위반 승인
    return commonExecuteApi({
      queryId: 'SAFDC0010_SAVE12',
      list: saveParam,
    })
  }
}

const afterApprove = (res) => {
  onButtonsClick({ id: 'btnSearch' })
}
//승인발송 관련 로직 끝

//메일발송 관련 로직 시작
const sendMail = async (data) => {
  let sendMailData = grdMain.value.getDataProvider().getJsonRow(data[0]) //교통위반은 교통위반만 있기때문에 0번째만 체크하고 일반수칙과 절대수칙은 같이 승인이 되기 때문에 둘중 하나만 비교
  if (sendMailData.VIO_GDIV_NM === '교통위반') {
    //교통위반 단건승인시 메일발송
    if (data.length === 1) {
      let param = {
        CMPNY_DIV: sendMailData.CMPNY_DIV,
        VIO_NO: sendMailData.VIO_NO,
      }
      await commonSearchApi({
        queryId: 'SAFDC0010_SEARCH_15',
        param: param,
      }).then((res) => {
        let mailData = getMsgBody(res.ORESULT_CUR[0])
        let mailParam = {
          CMPNY_DIV: res.ORESULT_CUR[0].COMPANY, //위반자 회사
          BSNS_CD: res.ORESULT_CUR[0].BSNS_CD,
          DEPT_CD: res.ORESULT_CUR[0].DEPT_CD,
          ASGN_CD: res.ORESULT_CUR[0].ASGN_CD,
        }
        //메일발송대상 조회
        commonSearchApi({
          queryId: 'SAFDC0010_SEARCH_16',
          param: mailParam,
        }).then((res) => {
          for (let i = 0; i < res.ORESULT_CUR.length; i++) {
            let mail = {
              EMAIL: [res.ORESULT_CUR[i].EMAIL], //받는사람 이메일 주소
              SUBJECT: '교통수칙 위반통지', //메일제목
              CONTENT: mailData, //메일내용
            }

            commonSendApi(mail).then((res) => {
              Message.success(t('메일이 전송되었습니다.'))
            }) //메일전송
          }
        })
      })
    } else {
      let sortArr = [] //ASGN_CD별로 정렬하기 위한 배열
      //교통수칙위반 다건 승인시 메일 발송
      //선택된 데이터를 sortArr에 넣어서 ASGN_CD순으로 정렬하기위해 넣음
      //다건에 대해서 메일을 보낼때 조직별로 메일을 보냄
      //ex)조직 A(ASGN_CD)에 위반건수가 2건 조직B(ASGN_CD)에 위반건수가 4건 조직C(ASGN_CD)에 위반건수가 1건 이렇게 있으면
      //메일은 조직A에 메일이 1건 가되, 내용은 메일제목 + 위반건수2건에 대한 내용이 간다.
      //이런식으로 조직B에는 메일제목 + 위반건수4번에 대한 내용이 가야 하므로 다건 메일발송시 선택된 데이터를 ASGN_CD별로 정렬 시킨다음에 메일을 보냄
      for (let i = 0; i < data.length; i++) {
        let sendData = grdMain.value.getDataProvider().getJsonRow(data[i])
        sortArr.push(sendData)
      }
      let sortedArr = sortArr.sort((a, b) => (a.ASGN_CD < b.ASGN_CD ? -1 : 1)) //선택된 데이터의 ASGN_CD를 기준으로 오름차순으로 정렬
      let groupData = _.groupBy(sortedArr, 'ASGN_CD') //ASGN_CD를 기준으로 그룹핑
      let extractedData = Object.values(groupData) //그룹핑된 데이터의 value를 추출

      for (let i in extractedData) {
        if (extractedData[i].length === 1) {
          let param = {
            CMPNY_DIV: extractedData[i][0].CMPNY_DIV,
            VIO_NO: extractedData[i][0].VIO_NO,
          }
          await commonSearchApi({
            queryId: 'SAFDC0010_SEARCH_15',
            param: param,
          }).then((res) => {
            let mailParam = {
              CMPNY_DIV: res.ORESULT_CUR[0].COMPANY, //위반자 회사
              BSNS_CD: res.ORESULT_CUR[0].BSNS_CD,
              DEPT_CD: res.ORESULT_CUR[0].DEPT_CD,
              ASGN_CD: res.ORESULT_CUR[0].ASGN_CD,
            }
            commonSearchApi({
              queryId: 'SAFDC0010_SEARCH_16',
              param: mailParam,
            }).then((res) => {
              for (let j = 0; j < res.ORESULT_CUR.length; j++) {
                let mail = {
                  EMAIL: [res.ORESULT_CUR[j].EMAIL],
                  SUBJECT: '교통수칙 위반통지',
                  CONTENT: getMultiMsgBody(extractedData[i]),
                }

                //commonSendApi(mail) //메일전송
              }
            })
          })
        } else {
          //교통수칙위반 다건
          let param = {
            CMPNY_DIV: extractedData[i][0].CMPNY_DIV,
            VIO_NO: extractedData[i][0].VIO_NO,
          }
          await commonSearchApi({
            queryId: 'SAFDC0010_SEARCH_15',
            param: param,
          }).then((res) => {
            let mailParam = {
              CMPNY_DIV: res.ORESULT_CUR[0].COMPANY, //위반자 회사
              BSNS_CD: res.ORESULT_CUR[0].BSNS_CD,
              DEPT_CD: res.ORESULT_CUR[0].DEPT_CD,
              ASGN_CD: res.ORESULT_CUR[0].ASGN_CD,
            }
            //메일발송대상 조회
            commonSearchApi({
              queryId: 'SAFDC0010_SEARCH_16',
              param: mailParam,
            }).then((res) => {
              for (let j = 0; j < res.ORESULT_CUR.length; j++) {
                let mail = {
                  EMAIL: [res.ORESULT_CUR[j].EMAIL],
                  SUBJECT: '교통수칙 위반통지',
                  CONTENT: getMultiMsgBody(extractedData[i]),
                }
                commonSendApi(mail).then((res) => {
                  Message.success(t('메일이 전송되었습니다.'))
                }) //메일전송
              }
            })
          })
        }
      }
    }
  } else if (
    sendMailData.VIO_GDIV_NM === '일반수칙' ||
    sendMailData.VIO_GDIV_NM === '절대수칙'
  ) {
    if (data.length === 1) {
      //안전수칙위반 단건 승인시 메일발송

      let sendMailData = grdMain.value.getDataProvider().getJsonRow(data[0])
      let mailMsg = getMsgBody(sendMailData)
      //메일발송 대상자 조회
      let param = {
        CMPNY_DIV: sendMailData.CMPNY_DIV,
        BSNS_CD: sendMailData.BSNS_CD,
        DEPT_CD: sendMailData.DEPT_CD,
        ASGN_CD: sendMailData.ASGN_CD,
      }
      commonSearchApi({
        queryId: 'SAFDC0010_SEARCH_16',
        param: param,
      }).then((res) => {
        for (let i = 0; i < res.ORESULT_CUR.length; i++) {
          let mail = {
            EMAIL: [res.ORESULT_CUR[i].EMAIL], //받는사람 이메일 주소
            SUBJECT: '안전수칙 위반통지', //메일제목
            CONTENT: mailMsg, //메일내용
          }
          commonSendApi(mail).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          })
        }
      })
      if (
        data.IO_DIV === 'D' &&
        data.COMPANY === 'HHI' &&
        data.DEPT_CD === 'X2D0'
      ) {
        //단기공사이면서 현대중공업 설비기획팀일 경우 MOS보전부, U/T지원부에도 메일발송
        let param1 = {
          CMPNY_DIV: '230',
          BSNS_CD: 'AY00',
          DEPT_CD: 'Y1J0',
          ASGN_cD: 'Y1J0',
        }
        //보전부 메일 발송대상 조회
        commonSearchApi({
          queryId: 'SAFDC0010_SEARCH_16',
          param: param1,
        }).then((res) => {
          for (let i = 0; i < res.ORESULT_CUR.length; i++) {
            let mail = {
              EMAIL: [res.ORESULT_CUR[i].EMAIL],
              SUBJECT: '안전수칙 위반통지',
              CONTENT: mailMsg,
            }
            sendMail(mail)
          }
        })
        let param2 = {
          CMPNY_DIV: '230',
          BSNS_CD: 'AY00',
          DEPT_CD: 'YD20',
          ASGN_CD: 'YD20',
        }
        //U/T지원부 메일 발송대상 조회
        commonSearchApi({
          queryId: 'SAFDC0010_SEARCH_16',
          param: param2,
        }).then((res) => {
          for (let i = 0; i < res.ORESULT_CUR.length; i++) {
            let mail = {
              EMAIL: [res.ORESULT_CUR[I].EMAIL],
              SUBJECT: '안전수칙 위반통지',
              CONTENT: mailMsg,
            }
            sendMail(mail)
          }
        })
      }
    } else {
      let sortArr = [] //ASGN_CD별로 정렬하기 위한 배열
      //일반수칙위반 다건 승인시 메일 발송
      //선택된 데이터를 sortArr에 넣어서 ASGN_CD순으로 정렬하기위해 넣음
      //다건에 대해서 메일을 보낼때 조직별로 메일을 보냄
      //ex)조직 A(ASGN_CD)에 위반건수가 2건 조직B(ASGN_CD)에 위반건수가 4건 조직C(ASGN_CD)에 위반건수가 1건 이렇게 있으면
      //메일은 조직A에 메일이 1건 가되, 내용은 메일제목 + 위반건수2건에 대한 내용이 간다.
      //이런식으로 조직B에는 메일제목 + 위반건수4번에 대한 내용이 가야 하므로 다건 메일발송시 선택된 데이터를 ASGN_CD별로 정렬 시킨다음에 메일을 보냄
      for (let i = 0; i < data.length; i++) {
        let sendData = grdMain.value.getDataProvider().getJsonRow(data[i])
        sortArr.push(sendData)
      }
      let sortedArr = sortArr.sort((a, b) => (a.ASGN_CD < b.ASGN_CD ? -1 : 1)) //선택된 데이터의 ASGN_CD를 기준으로 오름차순으로 정렬
      let groupData = _.groupBy(sortedArr, 'ASGN_CD') //ASGN_CD를 기준으로 그룹핑
      let extractedData = Object.values(groupData) //그룹핑된 데이터의 value를 추출

      for (let i in extractedData) {
        if (extractedData[i].length === 1) {
          //선택한 데이터의 조직이 1개일 경우
          let mailParam = {
            CMPNY_DIV: extractedData[i][0].COMPANY,
            BSNS_CD: extractedData[i][0].BSNS_CD,
            DEPT_CD: extractedData[i][0].DEPT_CD,
            ASGN_CD: extractedData[i][0].ASGN_CD,
          }
          commonSearchApi({
            queryId: 'SAFDC0010_SEARCH_16',
            param: mailParam,
          }).then((res) => {
            for (let j = 0; j < res.ORESULT_CUR.length; j++) {
              let mail = {
                EMAIL: [res.ORESULT_CUR[j].EMAIL],
                SUBJECT: '안전수칙 위반통지',
                CONTENT: getMultiMsgBody(extractedData[i]),
              }

              commonSendApi(mail).then((res) => {
                Message.success(t('메일이 전송되었습니다.'))
              }) //메일전송
            }
          })
        } else {
          //안전수칙위반 다건 선택한 데이터의 조직이 여러개일 경우
          let mailParam = {
            CMPNY_DIV: extractedData[i][0].COMPANY,
            BSNS_CD: extractedData[i][0].BSNS_CD,
            DEPT_CD: extractedData[i][0].DEPT_CD,
            ASGN_CD: extractedData[i][0].ASGN_CD,
          }
          //메일발송대상 조회
          commonSearchApi({
            queryId: 'SAFDC0010_SEARCH_16',
            param: mailParam,
          }).then((res) => {
            for (let j = 0; j < res.ORESULT_CUR.length; j++) {
              let mail = {
                EMAIL: [res.ORESULT_CUR[j].EMAIL],
                SUBJECT: '안전수칙 위반통지',
                CONTENT: getMultiMsgBody(extractedData[i]),
              }

              commonSendApi(mail).then((res) => {
                Message.success(t('메일이 전송되었습니다.'))
              }) //메일전송
            }
          })
        }
      }
    }
  }
}
//메일발송 관련 로직 끝
const defaultDate = () => {
  if(sliSAFDC0010_01 === undefined) {
    //디폴트 날짜 설정
    //FROM: -1달 ~ TO : 오늘날짜
    let date = dayjs()
    let dateFrom = dayjs().subtract(3, 'month')
    searchParam.VIO_DATE_FR =
      dateFrom.$y +
      '-' +
      (dateFrom.$M + 1).toString().padStart(2, '0') +
      '-' +
      dateFrom.$D.toString().padStart(2, '0')

    searchParam.VIO_DATE_TO =
      date.get('year') +
      '-' +
      (date.get('month') + 1).toString().padStart(2, '0') +
      '-' +
      date.get('date').toString().padStart(2, '0')
  } else {
    searchParam.VIO_DATE_FR = sliSAFDC0010_01.FROM_DT
    searchParam.VIO_DATE_TO = sliSAFDC0010_01.TO_DT
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  console.log('main search res', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//셀 더블클릭 이벤트 관련 로직 시작
const onCellDblClicked = (grid, clickData) => {
  console.log('clickData'.clickData)
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if(data.GUBUN === 'A') {
    // 수칙위반 TFA1010C01
    sAFDC0010Popup01.value.openPopup2(data)
  } else {
    // 교통위반 TGB3011C01
    sAFDC0010Popup02.value.openPopup2(data)
  }

  /*
  if (data.VIO_GDIV_NM === '교통위반') {
    //교통위반을 더블클릭 했을때
    sAFDC0010Popup02.value.openPopup2(data)
  }
  //교통위반 저장할때 절대수칙 체크하면 절대수칙으로 조회되므로, 절대수칙이되 점검대상물,잠재사고유형을 입력안했으면 교통위반임
  else if (
    data.VIO_GDIV_NM === '절대수칙' &&
    !data.SAGO_DIV_L &&
    !data.CHECK_TARGET_OBJ1
  ) {
    sAFDC0010Popup02.value.openPopup2(data)
  } else {
    //교통위반이 아닐때
    sAFDC0010Popup01.value.openPopup2(data)
  }
  */
}
//셀 더블클릭 이벤트 관련 로직 끝

//팝업 닫혔을때 재조회
const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//단건 메일 양식 만드는 로직 시작
const getMsgBody = (data) => {
  if (data.VIO_GDIV_NM === '교통위반') {
    //교통수칙위반 메일양식
    //위반일시는 YYYYMMDDHHMM 형식으로 들어옴
    //그래서 YYYY.MM.DD HH:MM형식으로 data.VIO_TIME(위반일시)을 변형
    let mailMsg = '' //메일 본문
    let mailHeader = `<br/>업무에 노고가 많으십니다.`
    mailHeader += `<br/><br/>아래와 같이 안전수칙 위반관련 내용을 송부드리니 참조하시기 바랍니다.`
    mailHeader += `"<br/><br/>관련 문의사항은 "+${userStore.hndPhn}"로 연락바랍니다."`
    mailHeader += `<br/><br/>감사합니다.`
    mailHeader += `<br/><br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;== 아 래 ==`
    mailHeader += `<br/><br/>`
    mailMsg += mailHeader
    let year = data.VIO_TIME.substr(0, 4)
    let month = data.VIO_TIME.substr(5, 2)
    let day = data.VIO_TIME.substr(8, 2)
    let hour = data.VIO_TIME.substr(11, 2)
    let minute = data.VIO_TIME.substr(14, 2)
    let date = year + '-' + month + '-' + day
    let time = hour + ':' + minute
    let vioItemNmRe = ''
    if (data.SPEED) {
      for (let i = 0; i < 3; i++) {
        if (itemNm[i] !== undefined) {
          vioItemNmRe += itemNm[i] + ','
        }
        vioItemNmRe = vioItemNmRe.slice(0, -1)
      }
      vioItemNM += `(주행속도 : ${data[i].SPEED} + Km/h)`
    } else {
      for (let i = 0; i < 3; i++) {
        if (itemNm[i] !== undefined) {
          vioItemNmRe += itemNm[i] + ','
        }
        vioItemNmRe = vioItemNmRe.slice(0, -1)
      }
    }
    let mailBody = `-위반일시(${date + time})<br/>- 조직: ${
      data.ASGN_NM
    }<br/>- 성명 : ${
      data.VIOLATOR
    }<br/>- 위반항목 : ${vioItemNmRe}<br/>- 장소 : ${
      data.VIO_SPLC_NM + data.VIO_PLC_DESC
    }`
    mailMsg += mailBody
    if (data.VIO_DESC) {
      mailMsg += `<br/>- 위반상세 ${data.VIO_DESC}`
    }

    return mailMsg
  } else {
    //안전수칙위반 메일 양식
    //위반일시는 YYYYMMDDHHMM 형식으로 들어옴
    //그래서 YYYY.MM.DD HH:MM형식으로 data.VIO_TIME(위반일시)을 변형
    let year = data.VIO_TIME.substr(0, 4)
    let month = data.VIO_TIME.substr(5, 2)
    let day = data.VIO_TIME.substr(8, 2)
    let hour = data.VIO_TIME.substr(11, 2)
    let minute = data.VIO_TIME.substr(14, 2)
    let date = year + '-' + month + '-' + day
    let time = hour + ':' + minute

    let mailHeader = `<br/>업무에 노고가 많으십니다.`
    mailHeader += `<br/><br/>아래와 같이 안전수칙 위반관련 내용을 송부드리니 참조하시기 바랍니다.`
    mailHeader += `<br/><br/>관련 문의사항은${userStore.hndPhn}로 연락바랍니다.`
    mailHeader += `<br/><br/>감사합니다.`
    mailHeader += `<br/><br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;== 아 래 ==`
    mailHeader += `<br/><br/>`
    let mailBody = `-위반일시(${date + time})<br/>- 조직: ${
      data.ASGN_NM
    }<br/>- 성명 : ${data.VIOLATOR}<br/>- 위반항목 : ${
      data.VIO_MDIV_NM
    }<br/>- 장소 : ${data.VIO_SPLC_NM + data.VIO_PLC_DESC}`
    let mailMsg = mailHeader + mailBody
    if (data.VIO_DESC) {
      mailMsg += `<br/>- 위반상세 ${data.VIO_DESC}`
    }
    return mailMsg
  }
}

//단건 메일 양식 만드는 로직 끝

//다건 메일 양식 만드는 로직 시작
const getMultiMsgBody = (data) => {
  if (data[0].VIO_GDIV_NM === '교통위반') {
    //교통수칙위반 메일양식
    //위반일시는 YYYYMMDDHHMM 형식으로 들어옴
    //그래서 YYYY.MM.DD HH:MM형식으로 data.VIO_TIME(위반일시)을 변형
    let mailMsg = '' //메일 본문
    let mailHeader = `<br/>업무에 노고가 많으십니다.`
    mailHeader += `<br/><br/>아래와 같이 안전수칙 위반관련 내용을 송부드리니 참조하시기 바랍니다.`
    mailHeader += `"<br/><br/>관련 문의사항은 "${userStore.hndPhn}"로 연락바랍니다."`
    mailHeader += `<br/><br/>감사합니다.`
    mailHeader += `<br/><br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;== 아 래 ==`
    mailHeader += `<br/><br/>`
    mailMsg += mailHeader
    for (let i = 0; i < data.length; i++) {
      let year = data[i].VIO_TIME.substr(0, 4)
      let month = data[i].VIO_TIME.substr(5, 2)
      let day = data[i].VIO_TIME.substr(8, 2)
      let hour = data[i].VIO_TIME.substr(11, 2)
      let minute = data[i].VIO_TIME.substr(14, 2)
      let date = year + '-' + month + '-' + day
      let time = hour + ':' + minute
      let vioItemNmRe = ''
      if (data[i].SPEED) {
        let itemNm = []
        itemNm.push(data[i].VIO_ITEM1_NM)
        itemNm.push(data[i].VIO_ITEM2_NM)
        itemNm.push(data[i].VIO_ITEM3_NM)
        for (let i = 0; i < 3; i++) {
          if (itemNm[i] !== undefined) {
            vioItemNmRe += itemNm[i] + ','
          }
          vioItemNmRe = vioItemNmRe.slice(0, -1)
        }
        vioItemNM += `(주행속도 : ${data[i].SPEED} + Km/h)`
      } else {
        let itemNm = []
        itemNm.push(data[i].VIO_ITEM1_NM)
        itemNm.push(data[i].VIO_ITEM2_NM)
        itemNm.push(data[i].VIO_ITEM3_NM)
        for (let i = 0; i < 3; i++) {
          if (itemNm[i] !== undefined) {
            vioItemNmRe += itemNm[i] + ','
          }
          vioItemNmRe = vioItemNmRe.slice(0, -1)
        }
      }
      let mailBody = `-위반일시(${date + time})<br/>- 조직: ${
        data[i].ASGN_NM
      }<br/>- 성명 : ${
        data[i].VIOLATOR
      }<br/>- 위반항목 : ${vioItemNmRe}<br/>- 장소 : ${
        data[i].VIO_SPLC_NM + data[i].VIO_PLC_DESC
      }`
      mailMsg += mailBody
      if (data[i].VIO_DESC) {
        mailMsg += `<br/>- 위반상세 ${data[i].VIO_DESC}`
      }
    }

    return mailMsg
  } else {
    //안전수칙위반 메일 양식
    //위반일시는 YYYYMMDDHHMM 형식으로 들어옴
    //그래서 YYYY.MM.DD HH:MM형식으로 data.VIO_TIME(위반일시)을 변형
    let mailMsg = ''
    let mailHeader = `<br/>업무에 노고가 많으십니다.`
    mailHeader += `<br/><br/>아래와 같이 안전수칙 위반관련 내용을 송부드리니 참조하시기 바랍니다.`
    mailHeader += `<br/><br/>관련 문의사항은${userStore.hndPhn}로 연락바랍니다.`
    mailHeader += `<br/><br/>감사합니다.`
    mailHeader += `<br/><br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;== 아 래 ==`
    mailHeader += `<br/><br/>`
    mailMsg += mailHeader
    for (let i = 0; i < data.length; i++) {
      let year = data[i].VIO_TIME.substr(0, 4)
      let month = data[i].VIO_TIME.substr(5, 2)
      let day = data[i].VIO_TIME.substr(8, 2)
      let hour = data[i].VIO_TIME.substr(11, 2)
      let minute = data[i].VIO_TIME.substr(14, 2)
      let date = year + '-' + month + '-' + day
      let time = hour + ':' + minute
      let mailBody = `- 위반일시(${date + time})<br/>- 조직: ${
        data[i].ASGN_NM
      }<br/>- 성명 : ${data[i].VIOLATOR}<br/>- 위반항목 : ${
        data.VIO_MDIV_NM
      }<br/>- 장소 : ${data[i].VIO_SPLC_NM + data[i].VIO_PLC_DESC}`
      mailMsg += mailBody
      if (data[i].VIO_DESC) {
        mailMsg += `<br/>- 위반상세 ${data[i].VIO_DESC}`
      }
    }
    return mailMsg
  }
}
//다건 메일양식 만드는 로직 끝

//체크된 로우가 교통위반만 있는지 일반수칙,절대수칙만 있는지 확인하는 함수
const checkRow = (chkData) => {
  //교통위반,일반수칙이랑 같이 승인되지 않도록 체크
  //교통위반은 일반수칙,절대수칙과 같이 체크될수없도록해야함
  let chkArr = [] //교통수칙 위반이 포함되어 있는지 체크하는 배열
  for (let i = 0; i < chkData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkData[i])
    chkArr.push(data.VIO_GDIV_NM)
  }
  if (
    chkArr.includes('교통위반') &&
    (chkArr.includes('일반수칙') || chkArr.includes('절대수칙'))
  ) {
    Message.warn(t('일반수칙과 절대수칙은 교통위반과 함께 결제할 수 없습니다.'))
    return false
  }
  return true
}

// 단속자 인원팝업 오픈
const openDansokEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: searchParam.DANSOK_EMP_NM,
  })
}

// 단속자 선택 이벤트
const onDansokEmpSelected = (val) => {
  searchParam.DANSOK_EMP_NM = val.EMP_NM
  searchParam.DANSOK_EMP_NO = val.EMP_NO
}

// 단속자 내부 X아이콘 클릭시 단속자 사번,성명 초기화
const clearInsert = () => {
  searchParam.DANSOK_EMP_NM = ''
  searchParam.DANSOK_EMP_NO = ''
}

// 교통수칙 위반 버튼 세팅
const setButton = (gbn) => {
  // HSE 직책자 그룹 (HSEMGR001)
  let grpYN = userStore.authGrpCd.includes('HSEMGR001')
  // gridTitle.value.visibleBtn('btnReqApprove', false)
  // gridTitle.value.visibleBtn('btnReqApproveCancel', false)
  // gridTitle.value.visibleBtn('btnTurnBack', false)
  gridTitle.value.visibleBtn('btnApproveAndSend', false)

  // 교통수칙 위반인 경우
  if (gbn === 'C') {
    // 승인/발송
    if (grpYN) {
      // gridTitle.value.visibleBtn('btnTurnBack', true)
      // gridTitle.value.visibleBtn('btnApproveAndSend', true)
    } else {
      // 승인요청, 승인요청취소
      // gridTitle.value.visibleBtn('btnReqApprove', true)
      // gridTitle.value.visibleBtn('btnReqApproveCancel', true)
    }
  }
}

//회사변경시 사업부 조회
watch(
  () => searchParam.COMPANY,
  (newValue) => {
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      codeList.bsnsCd = res.ORESULT_CUR
      codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      searchParam.BSNS_CD = ''
      searchParam.DEPT_CD = ''
    })
  }
)

//사업부 변경시 부서 조회
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: searchParam.COMPANY,//userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV: searchField.PAST_ORG === 'Y' ? '' : 'Y',
      },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.DEPT_CD = ''
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      } else {
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  },
  {
    immediate: true,
  }
)

//과거조직포함 변경시 부서에 과거조직까지 조회
watch(
  () => searchField.PAST_ORG,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchBSNS3',
      param: {
        CMPNY_DIV: searchParam.COMPANY,//userStore.cmpnyDiv,
        USE_DIV: newValue === 'Y' ? '' : 'Y',
      },
    }).then((res) => {
      codeList.bsnsCd = res.ORESULT_CUR
      codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      searchParam.BSNS_CD = userStore.bsnsCd
    })
  }
)

//단속조직 회사 변경시
watch(
  () => searchParam.CMPNY_DIV,
  (newValue, oldValue) => {
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      searchParam.DANSOK_BSNS_CD = ''
      searchParam.DANSOK_ASGN_CD = ''
      codeList.dansokBsnsCd = res.ORESULT_CUR
      codeList.dansokBsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }
)

//단속조직 사업부 변경시
watch(
  () => searchParam.DANSOK_BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_00',
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        DANSOK_BSNS_CD: newValue,
      },
    }).then((res) => {
      searchParam.DANSOK_ASGN_CD = ''
      codeList.dansokDeptCd = res.ORESULT_CUR
      codeList.dansokDeptCd.unshift({
        DANSOK_ASGN_NM: '전체',
        DANSOK_ASGN_CD: '',
      })
    })
  }
)

// 구분 값 변경에 따라 버튼 세팅
// watch(
//   () => searchParam.VIO_GDIV,
//   (newValue, oldValue) => {
//     setButton(newValue)
//   }
// )

onMounted(async () => {
  console.log(sliSAFDC0010_01)
  defaultDate()
  await initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="fill-height">
    <v-card-title class="pa-3 py-0">
      <IGridTitle
        class="mt-0"
        ref="gridTitle"
        :button-list="[
          'btnSearch',
          'btnRegistViolation',
          'btnRegistTrafficViolation',
          //'btnReqApprove',
          //'btnReqApproveCancel',
          //'btnTurnBack',
          'btnApproveAndSend',
          // 'btnApproveCancel',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex mb-0">
          <v-checkbox
            v-model="searchField.CHK_DAY"
            class="mt-1"
            true-value="Y"
            false-value="N"
          ></v-checkbox>
          <i-input
            v-model="searchParam.VIO_DATE_FR"
            label-width="25px"
            :label="$t('일자')"
            width="170px"
            class="mr-1"
            type="date"
          ></i-input>
          <span class="mt-2">~</span>
          <i-input
            v-model="searchParam.VIO_DATE_TO"
            class="ml-1"
            type="date"
            width="150px"
          ></i-input>
          <i-select
            v-model="searchParam.COMPANY"
            :label="$t('위반조직')"
            label-width="50px"
            width="250px"
            :items="codeList.company"
            item-title="TXT"
            item-value="COD"
          ></i-select>
          <i-select
            v-model="searchParam.BSNS_CD"
            width="200px"
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
          ></i-select>
          <i-select
            v-model="searchParam.DEPT_CD"
            width="300px"
            :items="codeList.deptCd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
          ></i-select>
          <v-checkbox
            v-model="searchField.PAST_ORG"
            true-value="Y"
            false-value="N"
          ></v-checkbox>
          <span class="mt-1 mr-5">과거조직포함</span>
          <div class="d-flex align-center ml-5">
            <h3>※교통수칙 담당 : 안전보건지원부 김영남 기감(2-1601).</h3> 
          </div>
        </v-sheet>
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParam.CMPNY_DIV"
            :label="$t('단속조직')"
            label-width="50px"
            width="250px"
            :items="codeList.dansokCompany"
            item-title="TXT"
            item-value="COD"
          ></i-select>
          <i-select
            v-model="searchParam.DANSOK_BSNS_CD"
            width="200px"
            :items="codeList.dansokBsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
          ></i-select>
          <i-select
            width="270px"
            v-model="searchParam.DANSOK_ASGN_CD"
            :items="codeList.dansokDeptCd"
            item-title="DANSOK_ASGN_NM"
            item-value="DANSOK_ASGN_CD"
          >
          </i-select>
          <i-select
            v-model="searchParam.VIO_GDIV"
            :label="$t('구분')"
            width="200px"
            :items="codeList.gubun"
            item-title="TXT"
            item-value="COD"
          ></i-select>
          <i-select
            v-model="searchParam.STATUS"
            :label="$t('진행상태')"
            width="250px"
            :items="codeList.status"
            item-title="TXT"
            item-value="COD"
          >
          </i-select>
          <i-input
            :label="$t('단속자')"
            width="250px"
            v-model="searchParam.DANSOK_EMP_NM"
            readonly
          >
            <template v-slot:append-inner>
              <v-icon @click="openDansokEmpPopup" icon="mdi-magnify" />
              <v-icon
                color="error"
                @click="clearInsert"
                icon="mdi-window-close"
              />
            </template>
          </i-input>
          
        </v-sheet>
        <v-sheet style="height: -webkit-fill-available">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <SAFDC0010_01Popup01
      ref="sAFDC0010Popup01"
      @closed="closedPopup"
    ></SAFDC0010_01Popup01>
    <SAFDC0010_01Popup02
      ref="sAFDC0010Popup02"
      @closed="closedPopup"
    ></SAFDC0010_01Popup02>
    <EmpPopup ref="empPopup" @selected="onDansokEmpSelected"></EmpPopup>
  </v-card>
</template>
<style scoped lang="scss">
.tableBackGround {
  background-color: #f2fe8a;
}

table,
th,
td {
  border: 1px solid black;
  border-collapse: collapse;
  text-align: center;
  font-size: 17px;
}
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 293px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
