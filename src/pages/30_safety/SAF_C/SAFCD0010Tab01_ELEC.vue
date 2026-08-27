<script setup>
import { ref, reactive, onMounted, getCurrentInstance, provide } from 'vue'
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
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCD0010Tab01Popup01 from './SAFCD0010Tab01Popup01_ELEC.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF_ELEC.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import SAFCD0010Tab01Image from './SAFCD0010Tab01Image.vue'
import Message from '@hiway/utils/notify'
import causePopup from '@/components/popup/causePopup.vue'
import OZReport from '@/components/OZReport.vue'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010Tab01',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const sAFCD0010Tab01Popup01 = ref(null)
const deptcdPopup = ref(null)
const deptPopup = ref(null) //부서팝업
const empPopup = ref(null) //인원팝업
const sAFCD0010Tab01Image = ref(null) //점검사진,조치사진 image 뷰어
const commonCodePopUpSAF = ref(null)
const userStore = useUserStore()
const checkTargetPopup = ref(null) //점검대상물 팝업
let reportName = []
const reportParam = ref([])
const isMulti = ref(true)
// OzReport 팝업 여부
const showOz = ref(false)
const { sliSAFCD0010Tab01 } = history.state

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  FROM_DATE: '', //점검일자 FROM
  TO_DATE: '', //점검일자 TO
  DEPT_NM: userStore.deptNm, // 점검부서이름
  DEPT_CD: userStore.deptCd, // 점검부서
  RECEIVER_DEPT_NM: '', //대상부서이름
  RECEIVER_DEPT_CD: '', //대상부서코드
  CHECK_GUBUN: '', //점검구분
  CHECK_JOCHI: '', //조치구분
  SAGO_DIV_L: '', //잠재사고유형(대)
  SAGO_DIV_M: '', //잠재사고유형(중)
  SAGO_DIV_S: '', //잠재사고유형(소)
  SAGO_DIV_L_NM: '', //잠재사고유형(대) 이름
  SAGO_DIV_M_NM: '', //잠재사고유형(중) 이름
  SAGO_DIV_S_NM: '', //잠재사고유형(소) 이름
  CHECK_TARGET_OBJ1: '', //대상점검물 LV1
  CHECK_TARGET_OBJ2: '', //대상점검물 LV2
  CHECK_TARGET_OBJ3: '', //대상점검물 LV3
  CHECK_EMP_NO: userStore.empNo, //점검자사번
  CHECK_EMP_NM: userStore.empNm, //점검자이름
  SAFE_YN: 'N', // 안전요원 조회
})

//사용자에게 보여지기만하고 실제로 DB단으로 넘어가지는 않는값들
//점검대상물 선택시 이름만 보여지고 코드는 넘어가지 않는다.
const showValue = reactive({
  CHECK_TARGET_OBJ1_NM: '', //대상점검물 LV1
  CHECK_TARGET_OBJ2_NM: '', //대상점검물 LV2
  CHECK_TARGET_OBJ3_NM: '', //대상점검물 LV3
})

const codeList = reactive({
  CHECK_GUBUN: [], //점검구분
  CHECK_JOCHI: [], //조치구분
  SAGO_DIV_M: [], //조치구분
  SAGO_DIV_S: [], //조치구분
})

//코드값 세팅
const initCodeList = () => {
  Promise.all([
    //조치구분 조회
    getCodeList('HHIP020'),
    //점검구분조회
    getCodeList('HHIP030'),
    //잠재사고유형 중분류
    getCodeList("HHIB010A"),
  ]).then((res) => {
    codeList.CHECK_JOCHI = res[0].ORESULT_CUR
    codeList.CHECK_GUBUN = res[1].ORESULT_CUR
    codeList.SAGO_DIV_M = res[2].ORESULT_CUR
    codeList.CHECK_JOCHI.unshift({ TXT: '전체', COD: '' })
    codeList.SAGO_DIV_M.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn(
      'CHECK_GUBUN',
      codeList.CHECK_GUBUN,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn(
      'CHECK_JOCHI',
      codeList.CHECK_JOCHI,
      'COD',
      'TXT'
    )    
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CHECK_DATE',
      dataType: 'text',
      width: '70',
      editable: false,
      styleName: 'left-column',
      header: { text: t('점검일자') },
    },
    {
      fieldName: 'CHECK_TIME',
      width: '50',
      dataType: 'text',
      editable: false,
      header: { text: t('점검시간') },
    },
    {
      fieldName: 'RECEIVER_DEPT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('대상부서') },
    },
    {
      fieldName: 'RECEIVER_ASGN_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('대상조직') },
    },
    {
      fieldName: 'CHECK_PLC_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검장소') },
    },
    {
      fieldName: 'CHECK_GUBUN',
      dataType: 'text',
      width: '70',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('점검구분') },
    },
    {
      fieldName: 'CHECK_DESC',
      dataType: 'text',
      styleName: 'left-column',
      width: '200',
      editable: false,
      header: { text: t('점검내용') },
    },
    {
      fieldName: 'JOCHI_PIC_BEFORE',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('점검사진') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        const iconSize = 16
        if (dataCell.value) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function (grid, cell) {
              return new URL(
                '/src/assets/images/icons/file-plus-outline.png',
                import.meta.url
              ).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        return ret
      },
    },
    {
      fieldName: 'JOCHI_PIC_AFTER',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('조치사진') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        const iconSize = 16
        if (dataCell.value) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function (grid, cell) {
              return new URL(
                '/src/assets/images/icons/file-plus-outline.png',
                import.meta.url
              ).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        return ret
      },
    },
    {
      fieldName: 'CHECK_JOCHI',
      dataType: 'text',
      editable: false,
      width: '80',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('조치구분') },
    },
    {
      fieldName: 'CHECK_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검자') },
      styles: {
        textAlignment: 'left',
      },
    },
    {
      fieldName: 'CHECK_EMP_ASGN_NM',
      width: '230',
      styleName: 'left-column',
      dataType: 'text',
      editable: false,
      header: { text: t('점검자상세소속') },
    },
    {
      fieldName: 'SAF_ACT_GUBUN',
      width: '80',
      dataType: 'text',
      editable: false,
      header: { text: t('안전활동') },
    },
    {
      fieldName: 'SAF_ACT_GUBUN_NM',
      width: '80',
      dataType: 'text',
      editable: false,
      header: { text: t('안전활동구분') },
    },
    {
      fieldName: 'VIO_DIV',
      width: '50',
      dataType: 'text',
      editable: false,
      header: { text: t('수칙위반') },
    },

    {
      fieldName: 'SENDER_DEPT_NM',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('점검부서') },
    },
    {
      fieldName: 'CHECK_PLAN_TARGET',
      width: '70',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('계획점검대상') },
    },
    {
      fieldName: 'SEND_MAIL_YN',
      width: '70',
      dataType: 'text',
      visible: false,
      editable: false,
      header: { text: t('메일발송여부') },
    },
    {
      fieldName: 'RECEIVER_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('대상부서코드') },
    },
    {
      fieldName: 'SAGO_DIV_L',
      dataType: 'text',
      visible: false,
      header: { text: t('잠재사고유형(대)') },
    },
    {
      fieldName: 'SAGO_DIV_M',
      dataType: 'text',
      visible: false,
      header: { text: t('잠재사고유형(중)') },
    },
    {
      fieldName: 'SAGO_DIV_S',
      dataType: 'text',
      visible: false,
      header: { text: t('잠재사고유형(소)') },
    },
    {
      fieldName: 'SAGO_DIV_L_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('잠재사고유형(대)이름') },
    },
    {
      fieldName: 'SAGO_DIV_M_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('잠재사고유형(중)이름') },
    },
    {
      fieldName: 'SAGO_DIV_S_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('잠재사고유형(소)이름') },
    },

    {
      fieldName: 'CHECK_LPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('점검장소(대)') },
    },
    {
      fieldName: 'CHECK_MPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('점검장소(중)') },
    },
    {
      fieldName: 'CHECK_SPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('점검장소(소)') },
    },

    {
      fieldName: 'CHECK_TARGET_OBJ1',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상물 LV1') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ1_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상물 LV1이름') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ2',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상물 LV2') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ2_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상물 LV2이름') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ3',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상물 LV3') },
    },
    {
      fieldName: 'CHECK_TARGET_OBJ3_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상물 LV3이름') },
    },
    {
      fieldName: 'JOCHI_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('조치내용') },
    },
    {
      fieldName: 'CHECK_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('점검자사번') },
    },

    {
      fieldName: 'SENDER_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('점검부서코드') },
    },
    {
      fieldName: 'DAILY_CHECK_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('일상점검No') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('점검계획No') },
    },
    {
      fieldName: 'CHECK_CYCLE_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('점검주기No') },
    },
    {
      fieldName: 'VIO_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('수칙위반NO') },
    },
    {
      fieldName: 'MNG_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('시정통보NO') },
    },
    {
      fieldName: 'JSTOP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('작업중지NO') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('작성자') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('회사구분') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'RECEIVER_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('대상조직 코드') },
    },
    {
      fieldName: 'RECEIVER_CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('대상조직 코드') },
    },
    {
      fieldName: 'RECEIVER_DEPT_CD_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('대상조직수기입력') },
    },
    {
      fieldName: 'CHECK_PLC_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('점검장소상세') },
    },
    {
      fieldName: 'JOCHI_PIC_BEFORE_REF_IMAGE',
      dataType: 'text',
      visible: false,
      header: { text: t('점검사진 대표이미지 파일 번호') },
    },
    {
      fieldName: 'JOCHI_PIC_AFTER_REF_IMAGE',
      dataType: 'text',
      visible: false,
      header: { text: t('조치사진 대표이미지 파일 번호') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//디폴트 날짜 설정 -7일~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -2일 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(2, 'day')
  searchParam.FROM_DATE =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.TO_DATE =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

const setSliParams = () => {
  if(sliSAFCD0010Tab01 !== undefined) {
    searchParam.FROM_DATE = sliSAFCD0010Tab01.FROM_DT
    searchParam.TO_DATE = sliSAFCD0010Tab01.TO_DT
    searchParam.DEPT_NM = ''
    searchParam.DEPT_CD = ''
    searchParam.RECEIVER_DEPT_CD = sliSAFCD0010Tab01.DEPT_CD
    searchParam.RECEIVER_DEPT_NM = sliSAFCD0010Tab01.DEPT_NM
    searchParam.CHECK_EMP_NO = ''
    searchParam.CHECK_EMP_NM = ''
    searchParam.SAFE_YN = sliSAFCD0010Tab01.SAFE_YN
  }
}

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().setFocus(0) //행 0으로

  checkSafety()
  initCodeList()
  defaultDate()
  setSliParams()
  onButtonsClick({ id: 'btnSearch' })
})

//로그인유저가 안전조직소속또는 IT관리자 인지 확인하는 함수
//안전조직소속 또는 IT관리자가 아니면 메일송부버튼을 보이지 않도록 한다.
//안전조직소속 또는 IT관리자가 아니면 메일발송여부 컬럼을 보이지 않도록 한다.
const checkSafety = () => {
  if (
    userStore.authGrpCd.includes('GRP00381') ||
    userStore.authGrpCd.includes('GRP00369')
  ) {
    menuTitle.value.setBtnProperty('btnSendMail', 'visible', true) //송부버튼 보이기
    //메일발송여부 컬럼 보이기
    grdMainProps.fields[14].visible = true
    grdMainProps.columns = grdMainProps.fields
    grdMain.value.getGridView().setColumns(grdMainProps.columns)
  } else {
    menuTitle.value.setBtnProperty('btnSendMail', 'visible', false) //송부버튼 감추기
  }
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnSendMail') {
    sendMail()
    //setMailYn()
  } else if (btn.id === 'btnRegist') {
    sAFCD0010Tab01Popup01.value.openPopup()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else {
    ozPrint()
  }
}

//출력관련 로직 시작
const ozPrint = () => {
  reportName = []
  reportParam.value = []
  let param = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('출력할 데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    console.log('CHECK_GUBUN', data.CHECK_GUBUN)
    //불안전사례
    if (data.CHECK_GUBUN == 0) {
      param = [
        'IN_KEY=' +
          `${
            data.CMPNY_DIV + data.BSNS_CD + data.DEPT_CD + data.DAILY_CHECK_SEQ
          }`,
      ]
      reportName = ['/manage/hse/SAFCD0010_1.ozr']
    } else {
      //우수사례
      param = [
        'IN_KEY=' +
          `${
            data.CMPNY_DIV + data.BSNS_CD + data.DEPT_CD + data.DAILY_CHECK_SEQ
          }`,
      ]
      reportName = ['/manage/hse/SAFCD0010_2.ozr']
    }
    reportParam.value.push({ reportName: reportName, args: param })
    isMulti.value = true
    showOz.value = true
  }
  console.log('레포트 파람', reportParam.value)

  // reportParam[0] = 'IN_KEY='
  // for (let i = 0; i < chkNum.length; i++) {
  //   let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
  //   reportParam[0] +=
  //     data.CMPNY_DIV + data.BSNS_CD + data.DEPT_CD + data.DAILY_CHECK_SEQ + ','
  // }
  // //마지막 , 제거
  // reportParam[0] = reportParam[0].substring(0, reportParam[0].length - 1) + ''
  // showOz.value = true
}

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV, //회사구분
      BSNS_CD: data.BSNS_CD, //사업부
      DEPT_CD: data.DEPT_CD, //부서
      DAILY_CHECK_SEQ: data.DAILY_CHECK_SEQ, //일상점검 SEQ
      VIO_NO: data.VIO_NO, //수칙위반번호
      MNG_NO: data.MNG_NO, //시정통보번호
      JSTOP_NO: data.JSTOP_NO, //작업중지번호
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFCD0010_ELEC_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//조회관련 로직 시작
const beforeSearch = () => {
  return true
}

const searchData = () => {
  // 필터 패널 제거 주석 처리함.
  // grdMain.value.getGridView().filterPanel.clearInput()
  return commonSearchApi({
    queryId: 'SAFCD0010_ELEC_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setCellStyle()
}
//조회관련 로직 끝

//잠재사고 팝업 오픈이벤트
const openSagoPopup = () => {
  commonCodePopUpSAF.value.openPopup('잠재사고')
}

//잠재사고 선택 이벤트
const selectedSago = (val) => {
  searchParam.SAGO_DIV_L = val[0].COD
  searchParam.SAGO_DIV_M = val[1].COD
  searchParam.SAGO_DIV_S = val[2].COD
  searchParam.SAGO_DIV_L_NM = val[0].TXT
  searchParam.SAGO_DIV_M_NM = val[1].TXT
  searchParam.SAGO_DIV_S_NM = val[2].TXT
}

//잠재사고유형 x아이콘 클릭 이벤트
//잠재사고유형 컴포넌트에 있는 텍스트와 코드를 초기화 한다.
const clearSago = () => {
  searchParam.SAGO_DIV_L = ''
  searchParam.SAGO_DIV_M = ''
  searchParam.SAGO_DIV_S = ''
  searchParam.SAGO_DIV_L_NM = ''
  searchParam.SAGO_DIV_M_NM = ''
  searchParam.SAGO_DIV_S_NM = ''
}

const SAGO_DIV_M_update = val => {
  Promise.all([    
    //잠재사고유형 소분류
    getCodeList("HHIB010A"+val),
  ]).then((res) => {    
    codeList.SAGO_DIV_S = res[0].ORESULT_CUR    
    codeList.SAGO_DIV_S.unshift({ TXT: '전체', COD: '' })
  })
}

// 점검부서 검색 이벤트
const openDeptcdPopup = () => {
  if (!searchParam.DEPT_NM) {
    deptcdPopup.value.openPopup()
  } else {
    deptcdPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: searchParam.DEPT_NM,
    })
  }
}

//대상부서 검색 이벤트
const openDeptPopup = () => {
  if (!searchParam.RECEIVER_DEPT_NM) {
    deptPopup.value.openPopup()
  } else {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: searchParam.RECEIVER_DEPT_NM,
    })
  }
}

//점검부서 선택 이벤트
const selectedDeptcd = (val) => {
  searchParam.DEPT_NM = val.ASGN_SHRT_NM
  searchParam.DEPT_CD = val.DEPT_CD
}

//대상부서 선택 이벤트
const selectedDept = (val) => {
  searchParam.RECEIVER_DEPT_NM = val.ASGN_SHRT_NM
  searchParam.RECEIVER_DEPT_CD = val.DEPT_CD
}

//점검부서 x아이콘 선택, 점검부서 초기화
const clearDeptcd = () => {
  searchParam.DEPT_NM = ''
  searchParam.DEPT_CD = ''
}

//대상부서 X아이콘 선택 이벤트
//부서코드와 이름을 초기화 한다.
const clearDept = () => {
  searchParam.RECEIVER_DEPT_NM = ''
  searchParam.RECEIVER_DEPT_CD = ''
}

//점검자 검색 이벤트
const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NM: searchParam.CHECK_EMP_NM,
  })
}

//점검자 선택 이벤트
const selectedEmp = (val) => {
  searchParam.CHECK_EMP_NM = val.EMP_NM
  searchParam.CHECK_EMP_NO = val.EMP_NO
}

//점검자 x아이콘 선택 이벤트
const clearEmp = () => {
  searchParam.CHECK_EMP_NM = ''
  searchParam.CHECK_EMP_NO = ''
}

//메일전송 관련 로직 시작
const sendMail = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.CHECK_JOCHI === '1') {
      Message.warn(
        t('조치 완료 건 선택을 해제하고 메일 발송을 눌러주시기 바랍니다.')
      )
      return false
    }
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (
      !data.RECEIVER_CMPNY_DIV ||
      !data.RECEIVER_ASGN_CD ||
      !data.RECEIVER_DEPT_CD
    ) {
      Message.warn(t('대상부서를 저장해주세요.'))
      return false
    }
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.CHECK_GUBUN !== '0') {
      Message.warn(t('불안전사례만 메일발송이 가능합니다.'))
      return false
    }
  }

  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    //점검자 정보 조회
    let param = {
      RECEIVER_CMPNY_DIV: data.RECEIVER_CMPNY_DIV,
      RECEIVER_ASGN_CD: data.RECEIVER_ASGN_CD,
      RECEIVER_DEPT_CD: data.RECEIVER_DEPT_CD,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH85',
      param: param,
    }).then((res) => {
      for (let i = 0; i < res.ORESULT_CUR.length; i++) {
        let mailParam = {
          EMAIL: [res.ORESULT_CUR[i].EMAIL], //받는사람 이메일주소
          SUBJECT: '[HiSEs] 일상점검 불안전사례 조치필요 건 안내', //메일제목
          CONTENT: `일상점검(불안전사례)가 등록되었습니다. 아래 경로로 접속하시어 조치 결과를 입력해 주시기 바랍니다.<br>
                  <br>
                  *해당 건 더블클릭 후 조치내용, 조치사진 기입 후 조치구분을 '조치 완료'로 변경 <br>
                  <br>
                  점검일자 : ${data.CHECK_DATE} ${data.CHECK_TIME} <br>

                  대상부서 : ${data.RECEIVER_DEPT_NM} <br>

                  점검장소 : ${data.CHECK_PLC_NM} <br>

                  점검내용 : ${data.CHECK_DESC} <br>

                  점검자 소속 : ${data.SENDER_DEPT_NM} <br>

                  점검자 : ${data.CHECK_EMP_NM} <br>

                  (HiSEs 접속 - 안전 - 안전점검 등록/현황 - 일상점검)`, //메일내용
        }
        try {
          commonSendApi(mailParam)
        } catch (e) {
          Message.err(e)
        }
      }
    })
  }
  Message.success('메일이 전송되었습니다.')
  setMailYn()
}
//메일발송여부에 Y 체크후 DB에 메일발송여부 컬럼에 Y 업데이트한다.
const setMailYn = () => {
  let updateSendMailFlagParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let updateData = {
      CMPNY_DIV: data.CMPNY_DIV,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      DAILY_CHECK_SEQ: data.DAILY_CHECK_SEQ,
    }
    updateSendMailFlagParam.push(updateData)
    grdMain.value
      .getDataProvider()
      .setValue(checkedData[i], 'SEND_MAIL_YN', 'Y')
  }
  commonExecuteApi({
    queryId: 'SAFCD0010_ELEC_SAVE09',
    list: updateSendMailFlagParam,
  })
}
//메일전송 관련 로직 끝

//그리드 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  if (col.fieldName === 'JOCHI_PIC_BEFORE') {
    sAFCD0010Tab01Image.value.openPopup(col.value, '점검사진')
  }
  if (col.fieldName === 'JOCHI_PIC_AFTER') {
    sAFCD0010Tab01Image.value.openPopup(col.value, '조치사진')
  }
}

//그리드 셀더블클릭 이벤트(수정)
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFCD0010Tab01Popup01.value.openPopup2(data)
}

//행변경 이벤트
const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  let data = grdMain.value.getDataProvider().getJsonRow(newIdx).VIO_DIV
  //수칙위반 연계된 점검이면 메일발송 버튼 비활성화
  if (data) {
    menuTitle.value.disableBtn('btnSendMail', true) //메일버튼 비활성화
  } else {
    menuTitle.value.disableBtn('btnSendMail', false) //메일버튼 활성화
  }
}

//조치구분이 조치필요일때 셀색상 빨간색으로 변경
const setCellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if (dataCell.dataColumn.fieldName === 'CHECK_JOCHI') {
      if (dataCell.value == '0') {
        ret.style = { background: '#D1180B' }
      } else {
        ret.style = { background: '#FFFFFF' }
      }
      return ret
    }
  })
}

//점검대상물 팝업 오픈 이벤트
const openCheckTargetPopup = () => {
  checkTargetPopup.value.openPopup('점검대상물')
}

//점검대상물 선택 이벤트
const selectedTarget = (val) => {
  searchParam.CHECK_TARGET_OBJ1 = val[0].COD
  showValue.CHECK_TARGET_OBJ1_NM = val[0].TXT
  searchParam.CHECK_TARGET_OBJ2 = val[1].COD
  showValue.CHECK_TARGET_OBJ2_NM = val[1].TXT
  searchParam.CHECK_TARGET_OBJ3 = val[2].COD
  showValue.CHECK_TARGET_OBJ3_NM = val[2].TXT
}

//점검대상물 x아이콘 클릭 이벤트
const clearTarget = () => {
  searchParam.CHECK_TARGET_OBJ1 = ''
  showValue.CHECK_TARGET_OBJ1_NM = ''
  searchParam.CHECK_TARGET_OBJ2 = ''
  showValue.CHECK_TARGET_OBJ2_NM = ''
  searchParam.CHECK_TARGET_OBJ3 = ''
  showValue.CHECK_TARGET_OBJ3_NM = ''
}

const closePopup = () => {
   onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="[
          'btnSearch',
          'btnRegist',
          'btnDelete',
          'btnPrint',
          'btnSendMail',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              label-width="60px"
              :label="$t('점검일자')"
              type="date"
              width="210px"
              v-model="searchParam.FROM_DATE"
              required
              class="mr-0"
            />
            <span class="mx-2 mt-2">~</span>
            <i-input
              width="142px"
              class="ml-0"
              type="date"
              v-model="searchParam.TO_DATE"
            />
            <i-input
              label-width="50px"
              :label="$t('점검부서')"
              width="210px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptcdPopup"
              @keydown.enter="openDeptcdPopup"
              v-model="searchParam.DEPT_NM"
            >
              <template v-slot:append-inner>
                <v-icon icon="mdi-window-close" @click="clearDeptcd"></v-icon>
              </template>
            </i-input>
            <i-input width="100px" readonly v-model="searchParam.DEPT_CD" />
            <i-input
              label-width="50px"
              :label="$t('점검자')"
              width="230px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
              v-model="searchParam.CHECK_EMP_NM"
            >
              <template v-slot:append-inner>
                <v-icon icon="mdi-window-close" @click="clearEmp"></v-icon>
              </template>
            </i-input>
            <i-input width="100px" v-model="searchParam.CHECK_EMP_NO" readonly>
            </i-input>
            <i-input
              label-width="50px"
              :label="$t('대상부서')"
              width="230px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup"
              @keydown.enter="openDeptPopup"
              v-model="searchParam.RECEIVER_DEPT_NM"
            >
              <template v-slot:append-inner>
                <v-icon icon="mdi-window-close" @click="clearDept"></v-icon>
              </template>
            </i-input>
            <i-input
              width="100px"
              readonly
              v-model="searchParam.RECEIVER_DEPT_CD"
            />
            <i-select
              label-width="50px"
              :label="$t('조치구분')"
              width="200px"
              :items="codeList.CHECK_JOCHI"
              v-model="searchParam.CHECK_JOCHI"
              item-title="TXT"
              item-value="COD"
            />
          </div>
          <div class="d-flex mt-1"></div>
          <div class="d-flex mt-1">
            <i-input
              label-width="80px"
              :label="$t('잠재사고유형')"
              width="230px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openSagoPopup"
              v-model="searchParam.SAGO_DIV_L_NM"
              readonly
            >
              <template v-slot:append-inner>
                <v-icon icon="mdi-window-close" @click="clearSago"></v-icon>
              </template>
            </i-input>
            <i-input
              width="200px"
              v-model="searchParam.SAGO_DIV_M_NM"
              readonly
            />
            <i-input
              width="200px"
              v-model="searchParam.SAGO_DIV_S_NM"
              readonly
            />
            <!--<i-select
              label-width="80px"
              :label="$t('잠재사고유형')"
              width="230px"
              :items="codeList.SAGO_DIV_M"
              v-model="searchParam.SAGO_DIV_M"
              item-title="TXT"
              item-value="COD"
              @update:modelValue="SAGO_DIV_M_update(searchParam.SAGO_DIV_M)"
            />
            <i-select              
              width="300px"
              :items="codeList.SAGO_DIV_S"
              v-model="searchParam.SAGO_DIV_S"
              item-title="TXT"
              item-value="COD"
            />-->
            <!--<i-input
              label-width="65px"
              :label="$t('점검대상물')"
              width="230px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openCheckTargetPopup"
              readonly
              v-model="showValue.CHECK_TARGET_OBJ1_NM"
            >
              <template v-slot:append-inner>
                <v-icon icon="mdi-window-close" @click="clearTarget"></v-icon>
              </template>
            </i-input>
            <i-input
              width="200px"
              readonly
              v-model="showValue.CHECK_TARGET_OBJ2_NM"
            >
            </i-input>
            <i-input
              width="200px"
              readonly
              v-model="showValue.CHECK_TARGET_OBJ3_NM"
            >
            </i-input>-->
            <v-checkbox
              :label="$t('안전요원')"
              v-model="searchParam.SAFE_YN"
              true-value="Y"
              false-value="N"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <IGridTitle :title="$t('점검 현황')"> </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellItemClicked"
            @onCellDblClicked="onCellDblClicked"
            @onCurrentRowChanged="onCurrentRowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptcdPopup" @selected="selectedDeptcd"></DeptPopup>
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <EmpPopup ref="empPopup" @selected="selectedEmp"></EmpPopup>
  <CommonCodePopUpSAF
    ref="checkTargetPopup"
    @selected="selectedTarget"
  ></CommonCodePopUpSAF>
  <SAFCD0010Tab01Popup01
    ref="sAFCD0010Tab01Popup01"
    @closePopup="closePopup"
  ></SAFCD0010Tab01Popup01>
  <CommonCodePopUpSAF
    ref="commonCodePopUpSAF"
    @selected="selectedSago"
  ></CommonCodePopUpSAF>
  <SAFCD0010Tab01Image ref="sAFCD0010Tab01Image"></SAFCD0010Tab01Image>
  <OZReport
    :showPop="showOz"
    :MultiArr="reportParam"
    :is-multi="isMulti"
    @close="showOz = $event"
  />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
